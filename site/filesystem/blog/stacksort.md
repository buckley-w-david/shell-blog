Warning: Running arbitrary untrusted code is a bad idea, use your head.

You can find the source for stacksort [here](https://github.com/buckley-w-david/stacksort).

## Background

This project was inspired by the XKCD comic [Ineffective Sorts](https://xkcd.com/1185/) and the similar project by Gregory Koberger, [stacksort](https://gkoberger.github.io/stacksort/).

![Ineffective Sorts](https://imgs.xkcd.com/comics/ineffective_sorts.png)

{{< blockquote author="Randall Munroe" >}}StackSort connects to StackOverflow, searches for 'sort a list', and downloads and runs code snippets until the list is sorted.{{< /blockquote >}}

I wanted to be able to download and run code from StackOverflow the same way I would use any normal Python package.

```python
from stacksort import quicksort
.
.
.
```

Before getting into the details, might I suggest taking a peak at [Trying it Out](#trying-it-out)?

## Hooking the Import System

Code can by found [here](https://github.com/buckley-w-david/stacksort/blob/master/stacksort/_meta/injector.py) (`StackSortFinder` and `StackSortLoader`) and [here](https://github.com/buckley-w-david/stacksort/blob/master/stacksort/__init__.py).

Most of what I needed I figured out by reading [this blog post](https://dev.to/dangerontheranger/dependency-injection-with-import-hooks-in-python-3-5hap), and the rest of some trial and error. It's actually not that difficult to hook the import system, it came down to defining two very simple classes.

```python
class StackSortFinder(importlib.abc.MetaPathFinder):
    _COMMON_PREFIX = "stacksort."

    def __init__(self, loader):
        self._loader = loader

    def find_spec(self, fullname, path, target=None):
        if fullname.startswith(self._COMMON_PREFIX):
            name = fullname[len(self._COMMON_PREFIX):]
            return self._gen_spec(name)

    def _gen_spec(self, fullname):
        return importlib.machinery.ModuleSpec(fullname, self._loader)
```

`find_spec` needs to return a [`ModuleSpec`](https://docs.python.org/3/library/importlib.html#importlib.machinery.ModuleSpec) to intercept the import (Not returning anything means the import is not intercepted).

`from stacksort import quicksort` will generate a `fullname` of `stacksort.quicksort`, so we check for and strip off the prefix `stacksort.`, return the `ModuleSpec`.

```python
class StackSortLoader(importlib.abc.Loader):
    def create_module(self, spec):
        return StackOverflowStuff(spec.name)

    def exec_module(self, module):
        pass
```

The loader needs two methods, `create_module` and `exec_module`. We're not doing anything that requires the `exec_module` method so it's a noop.

`create_module` returns _something_ that will do the actual work of fetching and compiling StackOverflow code. This is the object that the user gets from importing. We can use `spec.name` to access the name of what the user was trying to import so we can use that to search for the right code.

The code is located in in `_meta/...`. This is to prevent name collisions when a user of the package is trying to import something, since if Python can locate an object with the right name, it will never use our custom `MetaPathFinder`. Unlikely to happen unless we call our modules something like `quicksort`, but I figured it was better to hide them behind something more obscure.

```python
from stacksort._meta import injector
import sys

loader = injector.StackSortLoader()
finder = injector.StackSortFinder(loader)
sys.meta_path.append(finder)
```

After those are defined it's a matter of instantiating both classes and adding our finder to `sys.meta_path`.

Viola! The import system has been hooked.

By putting the above code chunk in the package's `__init__.py` file, it runs on package import, before python tries to import anything else. This means that there's no explicit setup step that an importer needs to run, the import hooking Just Works™.

## Fetching Code

[Code can be found here](https://github.com/buckley-w-david/stacksort/blob/master/stacksort/_meta/stackoverflow/find.py)

This part was nothing novel, after a half-second of searching I found [stackapi](https://stackapi.readthedocs.io/en/latest/), which let me leverage the [StackExchange API](https://api.stackexchange.com/).

The main thrust is the following:

1. Search of questions tagged with 'python' and 'sorting', and use whatever the user was trying to import ("quicksort" for instance) as the mysterious "q" parameter.  
   The "q" paramter is "a free form text parameter, will match all question properties based on an undocumented algorithm".
2. Fetch the answers to the questions returned from that search.
3. loop through those answers, extracting and returning code blocks.

Aside from that is some further bookkeeping involved:

- Fetching more questions/answers if no appropriate ones were found.
- if a `safety_date` has been provided (The default is that the date I put it up on GitHub is used), don't accept any questions/answers that were posted (or edited) after that date. This is a cue I took from Gregory Koberger's implementation that improves safety a bit since it prevents anyone from specifically targetting this library with malicious code since nobody knew about it before now.
- The function `yield`s the code blocks as it extracts them. This pattern makes it easy to consume all the code blocks by iterating over the generator returned by calling the function.
- A friend of mine suggested having the ability to randomize the order of results in some way so that it's not as likely you'll hit the same answer every time. Support for this isn't really fleshed out by there is an option to shuffle the answers.
- The StackExchange API has a neat concept of filters to request only specific fields. I'm using that to significanly cut down on the amount of data that needs to be downloaded.

## Dynamic Compilation and Execution

The fun part!

Code can be found [here](https://github.com/buckley-w-david/stacksort/blob/master/stacksort/_meta/injector.py) (StackSortRunner) and [here](https://github.com/buckley-w-david/stacksort/blob/master/stacksort/_meta/compile.py)

From my previous project trying working on [automatic SQL query parameterization]({{< ref "/post/string-interpolation-and-sql" >}} "String Interpolation and SQL"), I had some experience with dynamic code generation, so I generally knew what I was doing and didn't need to go read blog posts to figure it out.

There are a bunch of small details and hueristics I needed to come up with, but at a high level this is what happens:

1. The loader from our import hooking returns a `StackSortRunner`.
2. `StackSortRunner` has a `__call__` method that iterates over code blocks return from the fetching section.
3. The code block is sent to the enigmatic `compile.compile_sorter` function, this returns a callable object.
4. The returned object is called, the unsorted list is passed to it as an argument.
5. If none of that caused an exception, a reference to that "working" object is stored, and the result of its execution is returned. Anytime the `StackSortRunner` is called in the future that "working" version will be used without performing another search.

All of the complexity here is in `compile.compile_sorter`.

### Code Generation and Manipulation

To start, the code is run through through [lib2to3](https://docs.python.org/3/library/2to3.html#module-lib2to3). Even though the question search excludes questions tagged as `python-2.x`, some still slip through. I got annoyed that simple things like the changes to print was preventing perfectly good submissions from parsing, so first thing the code is run through `lib2to3.refactor.RefactoringTool.refactor_string`.

The code is then parsed into an AST using `ast.parse`. Simple enough, nothing interesting there.

Then we get into the heuristics and manipulations.

---

`print` calls are removed, these are pretty common in StackOverflow answers since they're meant to be demonstrations, but who wants their sorting functions to print?

This is done using an `ast.NodeTransformer`. All expressions in the AST are visted, and any that are:

1. `_ast.Expr` instances
2. Which has an `_ast.Call` instance as its `value`
3. Which has an `_ast.Name` value as its `func`
4. Which has an `id == "print"`

Are removed from the tree.

---

The AST is then scanned, to see if it defines any functions at the top level.

```python
if not any(isinstance(node, _ast.FunctionDef) for node in new_tree.body):
    ...
```

If it does define at least one function, it is compiled and passed into an instance of `StackRunner` which takes things from there:

```python
    ...
        compiled_code = compile(ast.fix_missing_locations(new_tree), '<StackOverflow>', 'exec')
    except Exception as exc:
        raise

    return StackRunner(tree, compiled_code)
```

This handles the case where the answer is in the form of a function that performs the sort

```python
def quicksort(unsorted_list):
    ...
    return sorted_list
```

---

What is still left to handle is when the answer provides code to sort the list just in terms of top level operations, identified as when no top level functions are defined.

To handle this case, the code is wrapped in a function before compilation. To do this a few things are required.

#### Figure out what to call the parameter

Since each code block may name it's unsorted list differently, and whatever name it chooses we will need to use for the name of the list parameter of the wrapping function, we need to scan the code and try to figure out what it's called.

Originally the plan was:

- Scan for usages of variables that have not been declared
  - If there is 1, you have found the parameter name
  - If there are 0, look for a variable that was initialized to a list
  - If there are more than 1, abort

But once I actually got to that, I found that "Scan for usages of variables that have not been declared" is harder than it might first seem.

Ultimately I gave up on this approach and decided that any top level variable initialized to a non-empty list is our parameter, the idea is that most of these answers initialize a "seed" list to run through the algorithm, which this would find.

If no variable initialization matching this criteria can be found, the attempt to use this code block is aborted.

To prevent our unsorted list passed as an argument from being clobbered by that list initialization, we also remove all AST nodes that assign to this variable using a very similar methodology to removing the print calls.

#### Figure out what to return

Deciding what to return is not complicated, although the accuracy of the technique is not great. Any top level variable initialized to a empty list is the value that is returned. If nothing matching that criteria can be found, it is assumed that the input list is sorted in-place and the parameter from the above step is returned.

#### Wrap it Up

The existing AST is embedded within a manually initialized `ast.FunctionDef` that has the correct parameter and a return statement.

This new AST is then used in the place of the original and treated the same as when the code block does define its own function.

### The Home Stretch

The last remaining piece is the `StackRunner` class.

Now that we have compiled the code block into something that we may be able to use, it is time to actually execute it.

```python
exec(compiled_code, globals())
```

Because of the code generation/manipulation work, we know now that there is now at least one function defined (in the module's global scope).

The next thing to figure out is _which function_?

The code block many (and often does) define multiple functions, so we now scan the AST for _entrypoints_.

```python
def valid_signature(func_def: _ast.FunctionDef):
    # Only 1 function argument, or only 1 that isn't given a default value
    return len(func_def.args.args) == 1 or len(func_def.args.args) - len(func_def.args.defaults) == 1

def entrypoints(tree: _ast.Module):
    return [
        f.name
        for f in tree.body
        if isinstance(f, _ast.FunctionDef) and valid_signature(f)
    ]
```

This returns the names of all functions that the code block defined that either accept one argument (hopefully the unsorted list), or only one argument that isn't given a default value.

Finally these functions are retrieved from the global scope, and called with the unsorted list passed as a parameter. If it doesn't explode, the function is stored and used on any subsequent calls.
If none of the functions worked, a `NoValidCodeError` is thrown, and the loader moves on to the next code block.

## Trying it Out

### Setup

By default the package does all it's work silently, but by setting the `logLevel` to `DEBUG` you can see what code it's trying to run.

```python
>>> from stacksort import config
>>> import logging
>>> logging.basicConfig(level=logging.DEBUG)
>>> config.logger.setLevel(logging.DEBUG)
>>> from random import shuffle
>>> l = list(range(100))
>>> shuffle(l)
>>> print(l)
[36, 53, 19, 26, 24, 74, 65, 3, 77, 47, 5, 29, 18, 15, 12, 45, 8, 31, 92, 2, 42, 90, 52, 89, 97, 55, 41, 9, 63, 87, 71, 69, 39, 58, 17, 28, 16, 94, 49, 21, 6, 96, 81, 25, 75, 7, 85, 80, 61, 46, 73, 13, 33, 34, 23, 62, 44, 32, 68, 78, 54, 57, 67, 56, 1, 60, 79, 4, 11, 86, 51, 43, 76, 10, 20, 95, 88, 84, 38, 91, 72, 40, 37, 82, 99, 83, 35, 22, 98, 64, 59, 14, 30, 27, 0, 93, 50, 48, 70, 66]
```

<details>
  <summary>QuickSort</summary>

```python
>>> from stacksort import quicksort
>>> sorted_list = quicksort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=quicksort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 847
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/18262306;41893866;9865374;52148522;21986065;35118022;35877642;26634593;38685665;25690175;59229833;36972714;31399021;27572698;50084073;50896944;63890263;54723733;31419302;53225679;13900894;17773516;28442837;59581472;39657307;47128070;10039821;62124146;13384473;61382822;21223035;22621039;26705309;26071867;61259485;26753209;25105541;17659974;43689308/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 16913
DEBUG:stacksort._meta.injector:CODE BLOCK

def sort(array=[12,4,5,6,7,3,1,15]):
    """Sort the array by using quicksort."""

    less = []
    equal = []
    greater = []

    if len(array) > 1:
        pivot = array[0]
        for x in array:
            if x < pivot:
                less.append(x)
            elif x == pivot:
                equal.append(x)
            elif x > pivot:
                greater.append(x)
        # Don't forget to return something!
        return sort(less)+equal+sort(greater)  # Just use the + operator to join lists
    # Note that you want equal ^^^^^ not pivot
    else:  # You need to handle the part at the end of the recursion - when you only have one element in your array, just return the array.
        return array



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]
```

</details>

<details>
  <summary>MergeSort</summary>

```
>>> from stacksort import mergesort
>>> sorted_list = mergesort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=mergesort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 837
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/18761766;58480851;3752926;36683919;42294202;45961037;31237149;47624555;50972843;50246479;41118705;52755255;46901669;41234102;29113461;61204291;31237499;55752957;13688084;40451156;26456517;32891670;53753296;59372242;44787889;7063697;33976191;47145070;57117592;53999446;34889618;54004903;63965149;25626499;43104990;37368921/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 18977
DEBUG:stacksort._meta.injector:CODE BLOCK

def msort2(x):
    if len(x) < 2:
        return x
    result = []          # moved!
    mid = int(len(x) / 2)
    y = msort2(x[:mid])
    z = msort2(x[mid:])
    while (len(y) > 0) and (len(z) > 0):
        if y[0] > z[0]:
            result.append(z[0])
            z.pop(0)
        else:
            result.append(y[0])
            y.pop(0)
    result += y
    result += z
    return result



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]
```

</details>

<details>
  <summary>InsertionSort</summary>

```
>>> from stacksort import insertionsort
>>> sorted_list = insertionsort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=insertionsort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 845
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/26705235;63112915;60422619;23933317;44856376;13267316;42388868;22183315;52962256;61902504;37773862;42697889;47599527;47201984;61683727;42524585;39956663;36863697;36898404;62118839;48661803;45029843;55128804;15509639;26526090;43670480;48364221;15801027;39780946;41924837;30699059;52307347;6972454;56314051;60029505;18709280;8220333/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 15486
DEBUG:stacksort._meta.injector:CODE BLOCK

import operator
def insertionSort(L, reverse=False):
    lt = operator.gt if reverse else operator.lt
    for j in xrange(1,len(L)):
        valToInsert = L[j]
        i = j-1
        while 0 <= i and lt(valToInsert, L[i]):
            L[i+1] = L[i]
            i -= 1
        L[i+1] = valToInsert
    return L



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]
```

</details>

<details>
  <summary>SelectionSort</summary>

It's not always going to give you the kind of result you're expecting.

```
>>> from stacksort import selectionsort
>>> sorted_list = selectionsort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=selectionsort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 828
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/26705235;19142997;42045293;47721315;22121364;44125156;60168438;54134232;41199580;19935082;15163913;21771964;57382687;62051579;52695051;19199874;42034278;22120650;43898109;18709280;41081503;39933331;22122721;20514474;37517314;47843504;41923890;58382733;40699413;49826208;32854556/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 14071
DEBUG:stacksort._meta.injector:CODE BLOCK

global count



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

def selectionSort(data):
    count = 0
    for index in range(len(data)):
        min = index
        count += 1
        # Find the index'th smallest element
        for scan in range(index + 1, len(data)):
            if (data[scan] < data[min]):
                min = scan
        if min != index: # swap the elements
            data[index], data[min] = data[min], data[index]
    return count, data

count, data = selectionSort([3,4,5,2,6])
print(count, data)



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
(100, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99])
```

</details>

<details>
  <summary>BubbleSort</summary>

```
>>> from stacksort import bubblesort
>>> sorted_list = bubblesort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=bubblesort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 491
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/19634554;27164718;51146458;43236772;41580958;48195828;62091063;41432198;48337195;14794234;63650018;54561180;51454468;56857736;28755003;41860459;62213710;22515009;60327195;43955474;45651197;34408438;30658010;56364835;56027705;21771964;42676469;37288908;61003803;26131056;31435017;14746933;60580152;26692602;23661636;28050911;40115654;59100531;21409844;52997369/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 14796
DEBUG:stacksort._meta.injector:CODE BLOCK

list1, list2 = [1, 2, 3], [1, 4, 3]
print [index for index, (e1, e2) in enumerate(zip(list1, list2)) if e1 == e2]



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

[0, 2]



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

list1, list2 = ["a", "b", "c", "d", "e"], ["e", "d", "c", "b", "a"]
print [index for index, (e1, e2) in enumerate(zip(list1, list2)) if e1 == e2]



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

[2]



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

a, b = b, a



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

def gen_move(seq):
    from bisect import bisect_left
    out = seq[0:1]
    for elem in seq[1:]:
        index = bisect_left(out, elem)
        if seq[index] != elem:
            if index == 0:
                print "Move {} before {}".format(elem, out[index])
            else:
                print "Move {} after {}".format(elem, out[index - 1])
        out.insert(index, elem)
    print out



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:empty body on If
DEBUG:stacksort._meta.injector:CODE BLOCK

gen_move([1,3,2,7,6,0,4])
Move 2 after 1
Move 6 after 3
Move 0 before 1
Move 4 after 3
[0, 1, 2, 3, 4, 6, 7]

gen_move(range(10)[::-1])
Move 8 before 9
Move 7 before 8
Move 6 before 7
Move 5 before 6
Move 4 before 5
Move 3 before 4
Move 2 before 3
Move 1 before 2
Move 0 before 1
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

gen_move(range(10))
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 2)
DEBUG:stacksort._meta.injector:CODE BLOCK

In [5]: %timeit gen_move(range(10000, 0, -1))
10000 loops, best of 3: 84 us per loop



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

sum(1 ln 1 + 2 ln 2 + 3 ln 3 + ..... n ln n) < O(n ln n)



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

O(n)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

%%cython
import numpy as np
cimport numpy as np
cimport cython
@cython.boundscheck(False)
@cython.wraparound(False)
cpdef cython_bubblesort_numpy(long[:] np_ary):
    """
    The Cython implementation of bubble sort with NumPy memoryview.

    """
    cdef int count, i, j # static type declarations
    count = np_ary.shape[0]

    for i in range(count):
        for j in range(1, count):
            if np_ary[j] < np_ary[j-1]:
                np_ary[j-1], np_ary[j] = np_ary[j], np_ary[j-1]

    return np.asarray(np_ary)



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

with open(file, 'r') as f:
    data = [int(line.strip()) for line in f]



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

int(' 13')    # 13
int('13\t')   # 13
int('13 \n')  # 13



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

    swapped = True
    while swapped:
            swapped = False
            for i in range(0,len(lis)-1):
                    if lis[i] > lis[i + 1] or lis[i] == lis[i+1]:
                        swapped = True
                        switch = lis[i]
                        lis[i] = lis[i+1]
                        lis[i+1] = switch
    return lis



DEBUG:stacksort._meta.injector:unexpected indent (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

import random

def createRandom():
    return [random.randrange(1,100) for i in range(100)]

def bubblesort(test):
    is_sorted = False
    while not is_sorted:
        is_sorted= True
        for y in range(len(test) - 1):
            if test[y] > test[y+1]:
                test[y], test[y+1] = test[y+1], test[y]
                is_sorted= False

lst = createRandom()
bubblesort(lst)
print(lst)



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99]
```

</details>

<details>
  <summary>Radix Sort</summary>

```
>>> from stacksort import radix_sort # Underscores are replaced with spaces in the search!
>>> sorted_list = radix_sort(l)
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/search/advanced/?pagesize=50&page=1&filter=%21b93xdWqUwqOO7m&order=desc&sort=relevance&q=radix+sort&nottagged=python-2.x&tagged=python&tagged=sorting&todate=1601424000&site=stackoverflow HTTP/1.1" 200 834
DEBUG:urllib3.connectionpool:Starting new HTTPS connection (1): api.stackexchange.com:443
DEBUG:urllib3.connectionpool:https://api.stackexchange.com:443 "GET /2.2/questions/60968950;33901534;63276772;23049650;35419229;35395475;8279618;26418728;19781037;20207791;42145394;15539260;45647602;38979220;16396816;22841888;22844711;14444520;44477979;34023841;23050748;48039359;38011331;51667792;23046794;36398214;53956259;35317442;16029247;16046165;42697889;19736472;36548426;54341672/answers/?pagesize=50&page=1&filter=-XG6tqDiasfBQHS1&order=desc&sort=votes&todate=1601424000&site=stackoverflow HTTP/1.1" 200 22702
DEBUG:stacksort._meta.injector:CODE BLOCK

array(randint(0, high=1<<32, size=10**8), uint32)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

#include <cinttypes>
#include "boost/sort/spreadsort/spreadsort.hpp"
using namespace boost::sort::spreadsort;

extern "C" {
    void spreadsort(std::uint32_t* begin,  std::size_t len) {
        integer_sort(begin, begin + len);
    }
}



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 3)
DEBUG:stacksort._meta.injector:CODE BLOCK

g++ -O3 -std=c++11 -march=native -DNDEBUG -shared -fPIC -I/tmp/boost_1_60_0 spreadsort.cpp -o spreadsort.so



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

from ctypes import cdll, c_size_t, c_uint32
from numpy import uint32
from numpy.ctypeslib import ndpointer

__all__ = ['integer_sort']

# In spreadsort.cpp: void spreadsort(std::uint32_t* begin,  std::size_t len)
lib = cdll.LoadLibrary('./spreadsort.so')
sort = lib.spreadsort
sort.restype = None
sort.argtypes = [ndpointer(c_uint32, flags='C_CONTIGUOUS'), c_size_t]

def integer_sort(arr):
    assert arr.dtype == uint32, 'Expected uint32, got {}'.format(arr.dtype)
    sort(arr, arr.size)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:No module named 'numpy'
DEBUG:stacksort._meta.injector:CODE BLOCK

from cffi import FFI
from numpy import uint32

__all__ = ['integer_sort']

ffi = FFI()
ffi.cdef('void spreadsort(uint32_t* begin,  size_t len);')
C = ffi.dlopen('./spreadsort.so')

def integer_sort(arr):
    assert arr.dtype == uint32, 'Expected uint32, got {}'.format(arr.dtype)
    begin = ffi.cast('uint32_t*', arr.ctypes.data)
    C.spreadsort(begin, arr.size)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:No module named 'cffi'
DEBUG:stacksort._meta.injector:CODE BLOCK

lib = cdll.LoadLibrary('spreadsort.so')



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

C = ffi.dlopen('spreadsort.so')



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

cc -DBUILDING_u4_sort -I/usr/include -I./ -I../ -I../../ -I../../../ -I../../../../ -std=c99 -fgnu89-inline -O3 -g -fPIC -shared -march=native u4_sort.c -o u4_sort.so



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

from cffi import FFI
from numpy import uint32

__all__ = ['integer_sort']

ffi = FFI()
ffi.cdef('void u4_sort(unsigned* a, const long sz);')
C = ffi.dlopen('u4_sort.so')

def integer_sort(arr):
    assert arr.dtype == uint32, 'Expected uint32, got {}'.format(arr.dtype)
    begin = ffi.cast('unsigned*', arr.ctypes.data)
    C.u4_sort(begin, arr.size)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:No module named 'cffi'
DEBUG:stacksort._meta.injector:CODE BLOCK

for num in unsorted:
    byte_at_offset = (num & byte_check) >> offset*8
    buckets[byte_at_offset].append(num)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

for num in unsorted:
    bucketappender[(num & byte_check) >> ofs8](num)



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

(num >> offset*8) & 0xff



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

Counting-sort(A,B,k)
  let C[0..k] be a new array
  for i = 0 to k
      C[i] = o
  for j = 1 to A.length
      C[A[j]] = C[A[j]] + 1
  for i = 1 to k
      C[i] = C[i] + C[i-1]
  for j = A.length down to 1
      B[C[A[j]]] = A[j]
      C[A[j]] = C[A[j]] - 1



DEBUG:stacksort._meta.injector:unexpected indent (<unknown>, line 2)
DEBUG:stacksort._meta.injector:CODE BLOCK

www.google.com



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

python radix sort example



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

In []: 5/2
Out[]: 2

In []: 5.0/2
Out[]: 2.5

In []: 5.0//2
Out[]: 2.0



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

//  a is input array, b is working array
void RadixSort(uint32_t * a, uint32_t *b, size_t count)
{
size_t mIndex[4][256] = {0};            // count / index matrix
size_t i,j,m,n;
uint32_t u;
    for(i = 0; i < count; i++){         // generate histograms
        u = a[i];
        for(j = 0; j < 4; j++){
            mIndex[j][(size_t)(u & 0xff)]++;
            u >>= 8;
        }
    }
    for(j = 0; j < 4; j++){             // convert to indices
        m = 0;
        for(i = 0; i < 256; i++){
            n = mIndex[j][i];
            mIndex[j][i] = m;
            m += n;
        }
    }
    for(j = 0; j < 4; j++){             // radix sort
        for(i = 0; i < count; i++){     //  sort by current lsb
            u = a[i];
            m = (size_t)(u>>(j<<3))&0xff;
            b[mIndex[j][m]++] = u;
        }
        std::swap(a, b);                //  swap ptrs
    }
}



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

from random import randint
from math import log10
from time import clock
from itertools import chain

def splitmerge0 (ls, digit): ## python (pure!)

    seq = map (lambda n: ((n // 10 ** digit) % 10, n), ls)
    buf = {0:[], 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[]}

    return reduce (lambda acc, key: acc.extend(buf[key]) or acc,
        reduce (lambda _, (d,n): buf[d].append (n) or buf, seq, buf), [])

def splitmerge1 (ls, digit): ## python (readable!)
    buf = [[] for i in range(10)]
    divisor = 10 ** digit
    for n in ls:
        buf[(n//divisor)%10].append(n)
    return chain(*buf)

def radixsort (ls, fn = splitmerge1):
    return list(reduce (fn, xrange (int (log10 (max(abs(val) for val in ls)) + 1)), ls))

###############################################################################
# quick sort
###############################################################################

def partition (ls, start, end, pivot_index):

    lower = start
    upper = end - 1

    pivot = ls[pivot_index]
    ls[pivot_index] = ls[end]

    while True:

        while lower <= upper and ls[lower] <  pivot: lower += 1
        while lower <= upper and ls[upper] >= pivot: upper -= 1
        if lower > upper: break

        ls[lower], ls[upper] = ls[upper], ls[lower]

    ls[end] = ls[lower]
    ls[lower] = pivot

    return lower

def qsort_range (ls, start, end):

    if end - start + 1 < 32:
        insertion_sort(ls, start, end)
    else:
        pivot_index = partition (ls, start, end, randint (start, end))
        qsort_range (ls, start, pivot_index - 1)
        qsort_range (ls, pivot_index + 1, end)

    return ls

def insertion_sort (ls, start, end):

    for idx in xrange (start, end + 1):
        el = ls[idx]
        for jdx in reversed (xrange(0, idx)):
            if ls[jdx] <= el:
                ls[jdx + 1] = el
                break
            ls[jdx + 1] = ls[jdx]
        else:
            ls[0] = el

    return ls

def quicksort (ls):

    return qsort_range (ls, 0, len (ls) - 1)

if __name__=='__main__':
    for value in 1000, 10000, 100000, 1000000, 10000000:
        ls = [randint (1, value) for _ in range(value)]
        ls2 = list(ls)
        last = -1
        start = clock()
        ls = radixsort(ls)
        end = clock()
        for i in ls:
            assert last <= i
            last = i
        print("rs %d: %0.2fs" % (value, end-start))
        tdiff = end-start
        start = clock()
        ls2 = quicksort(ls2)
        end = clock()
        last = -1
        for i in ls2:
            assert last <= i
            last = i
        print("qs %d: %0.2fs %0.2f%%" % (value, end-start, ((end-start)/tdiff*100)))



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 13)
DEBUG:stacksort._meta.injector:CODE BLOCK

C:\temp>c:\python27\python radixsort.py
rs 1000: 0.00s
qs 1000: 0.00s 212.98%
rs 10000: 0.02s
qs 10000: 0.05s 291.28%
rs 100000: 0.19s
qs 100000: 0.58s 311.98%
rs 1000000: 2.47s
qs 1000000: 7.07s 286.33%
rs 10000000: 31.74s
qs 10000000: 86.04s 271.08%



DEBUG:stacksort._meta.injector:unexpected character after line continuation character (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

f.write('\n'.join(list_c)+'\n')



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

for s in list_c:
  f.write(s+'\n')



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

from numba import jit

@jit
def radix_loop(nbatches, batch_m_bits, bitsums, a, out):
    mask = (1 << batch_m_bits) - 1
    for shift in range(0, nbatches*batch_m_bits, batch_m_bits):
        # set bit sums to zero
        for i in range(bitsums.shape[0]):
            bitsums[i] = 0

        # determine bit sums
        for i in range(a.shape[0]):
            j = (a[i] & mask) >> shift
            bitsums[j] += 1

        # take the cumsum of the bit sums
        cumsum = 0
        for i in range(bitsums.shape[0]):
            temp = bitsums[i]
            bitsums[i] = cumsum
            cumsum += temp

        # sorting loop
        for i in range(a.shape[0]):
            j = (a[i] & mask) >> shift
            out[bitsums[j]] = a[i]
            bitsums[j] += 1

        # prepare next iteration
        mask <<= batch_m_bits
        # cant use `temp` here because of numba internal types
        temp2 = a
        a = out
        out = temp2

    return a



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:No module named 'numba'
DEBUG:stacksort._meta.injector:CODE BLOCK

from scipy.sparse.coo import coo_tocsr

def radix_step(radix, keys, bitsums, a, w):
    coo_tocsr(radix, 1, a.size, keys, a, a, bitsums, w, w)
    return w, a

def scipysparse_radix_perbyte(a):
    # coo_tocsr internally works with system int and upcasts
    # anything else. We need to copy anyway to not mess with
    # original array. Also take into account endianness...
    a = a.astype('<i', copy=True)
    bitlen = int(a.max()).bit_length()
    radix = 256
    work = np.empty_like(a)
    _ = np.empty(radix+1, int)
    for i in range((bitlen-1)//8 + 1):
        keys = a.view('u1')[i::a.itemsize].astype(int)
        a, work = radix_step(radix, keys, _, a, work)
    return a



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:No module named 'scipy'
DEBUG:stacksort._meta.injector:CODE BLOCK

def scipysparse_radix_hybrid(a, bbits=8, gbits=8):
    """
    Parameters
    ----------
    a : Array of non-negative integers to be sorted.
    bbits : Number of bits in radix for LSB sorting.
    gbits : Number of bits in radix for MSB grouping.
    """
    a = a.copy()
    bitlen = int(a.max()).bit_length()
    work = np.empty_like(a)

    # Group values by single iteration of MSB radix sort:
    # Casting to np.int_ to get rid of python BigInt
    ngroups = np.int_(2**gbits)
    group_offset = np.empty(ngroups + 1, int)
    shift = max(bitlen-gbits, 0)
    a, work = radix_step(ngroups, a>>shift, group_offset, a, work)
    bitlen = shift
    if not bitlen:
        return a

    # LSB radix sort each group:
    agroups = np.split(a, group_offset[1:-1])
    # Mask off high bits to not undo the grouping..
    gmask = (1 << shift) - 1
    nbatch = (bitlen-1) // bbits + 1
    radix = np.int_(2**bbits)
    _ = np.empty(radix + 1, int)
    for agi in agroups:
        if not agi.size:
            continue
        mask = (radix - 1) & gmask
        wgi = work[:agi.size]
        for shift in range(0, nbatch*bbits, bbits):
            keys = (agi & mask) >> shift
            agi, wgi = radix_step(radix, keys, _, agi, wgi)
            mask = (mask << bbits) & gmask
        if nbatch % 2:
            # Copy result back in to `a`
            wgi[...] = agi
    return a



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

def numba_radix(a, batch_m_bits=8):
    a = a.copy()
    bit_len = int(a.max()).bit_length()
    nbatches = (bit_len-1)//batch_m_bits +1
    work = np.zeros_like(a)
    bitsums = np.zeros(2**batch_m_bits + 1, int)
    srtd = radix_loop(nbatches, batch_m_bits, bitsums, a, work)
    return srtd

a = np.random.randint(0, 1e8, 1e6)
%timeit numba_radix(a, 9)
# 10 loops, best of 3: 76.1 ms per loop
%timeit np.sort(a)
#10 loops, best of 3: 115 ms per loop
%timeit scipysparse_radix_perbyte(a)
#10 loops, best of 3: 95.2 ms per loop
%timeit scipysparse_radix_hybrid(a, 11, 6)
#10 loops, best of 3: 75.4 ms per loop



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 11)
DEBUG:stacksort._meta.injector:CODE BLOCK

num = int(input())



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

self.num = int(input())



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

m = max(self.array) if self.array else 0



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

 >>> 'abc' is 'abc'
 True
 >>> x = 'ab'
 >>> (x + 'c') is 'abc'
 False



DEBUG:stacksort._meta.injector:unexpected indent (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

import datatable as dt
import pandas as pd
import random
from time import time
n = 10**8
src = ["%x" % random.getrandbits(10) for _ in range(n)]
f0 = dt.Frame(src)
p0 = pd.DataFrame(src)
f0.to_csv("test1e8.csv")

t0 = time(); f1 = f0.sort(0); print("datatable: %.3fs" % (time()-t0))
t0 = time(); src.sort(); print("list.sort: %.3fs" % (time()-t0))
t0 = time(); p1 = p0.sort_values(0); print("pandas:    %.3fs" % (time()-t0))



DEBUG:RefactoringTool:Refactoring StackOverflow
DEBUG:stacksort._meta.injector:¯\_(ツ)_/¯
DEBUG:stacksort._meta.injector:CODE BLOCK

datatable: 1.465s / 1.462s / 1.460s (multiple runs)
list.sort: 44.352s
pandas:    395.083s



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

> require(data.table)
> DT = fread("test1e8.csv")
> system.time(sort(DT$C1, method="radix"))
   user  system elapsed
  6.238   0.585   6.832
> system.time(DT[order(C1)])
   user  system elapsed
  4.275   0.457   4.738
> system.time(setkey(DT, C1))  # sort in-place
   user  system elapsed
  3.020   0.577   3.600



DEBUG:stacksort._meta.injector:invalid syntax (<unknown>, line 1)
DEBUG:stacksort._meta.injector:CODE BLOCK

a = [[0, 1, 1],[1, 0, 0],[0,0,1]]
a = list(zip(*a))
a.sort(reverse=True)
a = list(map(list,zip(*a)))



DEBUG:RefactoringTool:Refactoring StackOverflow
>>> print(sorted_list)
[99, 98, 97, 96, 95, 94, 93, 92, 91, 90, 89, 88, 87, 86, 85, 84, 83, 82, 81, 80, 79, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 57, 56, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
```

</details>
