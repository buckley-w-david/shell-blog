Date: 2022-08-23

This week I wrote two Python libraries, [goto](https://github.com/buckley-w-david/goto) and [bytecode](https://github.com/buckley-w-david/bytecode), to explore the idea of generating or modifying functions via bytecode generation.

In this post we're going to explore the first of those two (The second one will come later).

## goto

The idea of `goto` is pretty simple: Add a "new" control flow mechanism allowing a programmer to move execution around arbitrarily within a function.

```python
>>> import goto
>>> 
>>> @goto.goto
... def example():
...     '''
...     returns 1
...     '''
...     x = 1
...     example.goto("skip")
...     x = 2
...     example.label("skip")
...     return x
... 
>>> example()
1
```

### How?

It's actually fairly simple to manage it just using tools available in the standard library, the [`dis`](https://docs.python.org/3/library/dis.html) module being the key piece.

Lets take our function from before (without the decorator), and use `dis.dis` to take a look at the bytecode.

```python
>>> import dis
>>> 
>>> def example():
...     '''
...     returns 1
...     '''
...     x = 1
...     example.goto("skip")
...     x = 2
...     example.label("skip")
...     return x
... 
>>> dis.dis(example)
 [1]         [2]   [3]                  [4] [5]
  5           0 LOAD_CONST               1 (1)
              2 STORE_FAST               0 (x)

  6           4 LOAD_GLOBAL              0 (example)
              6 LOAD_METHOD              1 (goto)
              8 LOAD_CONST               2 ('skip')
             10 CALL_METHOD              1
             12 POP_TOP

  7          14 LOAD_CONST               3 (2)
             16 STORE_FAST               0 (x)

  8          18 LOAD_GLOBAL              0 (example)
             20 LOAD_METHOD              2 (label)
             22 LOAD_CONST               2 ('skip')
             24 CALL_METHOD              1
             26 POP_TOP

  9          28 LOAD_FAST                0 (x)
             30 RETURN_VALUE
```

 - \[1]: The *line number* - This is used for generatating stacktraces that actually link back to lines of python code.
 - \[2]: The _byte offset_ - All bytecode instructions have been strictly 2 bytes for a while now, so this increments by 2 every instruction.
 - \[3]: The _opcode_ - What instruction is actually going to run.
 - \[4]: The _argument_ - If the instruction takes an argument, this is it.
 - \[5]: The _argval_ - This is a nice "preview" that `dis` generates for us that lets us know what the given argument value will translate to.

What we're interested in is being able to contiguous regions of bytecode in our functions that look like lines 9 and 11, and replacing them with some kind of jump.

#### Scanning Bytecode

`dis` to the rescue again, this time in the form of `dis.Bytecode`. By passing our function of interest into `dis.Bytecode` we can get all the info we need to scan the instructions looking for these patterns.

In this case, I used `zip` to create a sliding window of 3 instructions:

```python
    code = dis.Bytecode(f)
    instr = [i for i in code]
    for i1, i2, i3 in zip(instr, instr[1:], instr[2:]):
        ...
```

Then checked to see if they followed the pattern:

```python
        if (
            (i1.opcode == _LOAD_GLOBAL or i1.opcode == _LOAD_DEREF)
            and i1.argval == f.__name__
            and i2.opcode == _LOAD_METHOD
            and i3.opcode == _LOAD_CONST
        ):
            if i2.argval == "label":
                targets[i3.argval] = (
                    i3.offset + 6 # Add 6 to skip past the label function call instructions
                ) // 2  # divide by 2 to get instruction offset from byte offset
            elif i2.argval == "goto":
                gotos[i1.offset] = i3.argval
```

This is part of an initial pass-through to collect all the `goto` and `label` statements. We want to know the location of all `label`s ahead of time to make our lives much easier when actually generating the new bytecode.

#### Writing New Bytecode

Now that we have the location of all `goto`s and `label`s, generating the new bytecode becomes pretty trivial. All you need to know is that the `JUMP_ABSOLUTE` instruction exists. It's what we use to do the `goto`ing.

```python
    writer = io.BytesIO()
    for i1 in instr:
        if i1.offset in gotos:
            target = targets[gotos[i1.offset]]
            writer.write(bytes([_JUMP_ABSOLUTE, target]))
        else:
            writer.write(bytes([i1.opcode, i1.arg or 0]))
```

When we encounter a `goto`, we replace the original line with a `JUMP_ABSOLUTE` to the associated label. Otherwise we use the original instruction.

Then all that's left is to use it to construct a new function. We do so by using most of the original properties of the function we're decorating (only replacing the `co_code` attribute), and then initializing a `types.FunctionType` object.

```python
    bytecode = writer.getvalue()
    new_code = code.codeobj.replace(co_code=bytecode)

    func = FunctionType(
        new_code, f.__globals__, f.__name__, f.__defaults__, f.__closure__
    )
```

[You can check out the full source here.](https://github.com/buckley-w-david/goto/blob/master/goto/__init__.py)

### Caveats

We fall prey to what seems to be an optimization that CPython makes where anything after a `return` statement doesn't have any bytecode generated for it.

```python
>>> import dis
>>> 
>>> def f():
...     f.goto("after")
...     return 5
...     f.label("after")
...     return 6
... 
>>> dis.dis(f)
  2           0 LOAD_GLOBAL              0 (f)
              2 LOAD_METHOD              1 (goto)
              4 LOAD_CONST               1 ('after')
              6 CALL_METHOD              1
              8 POP_TOP

  3          10 LOAD_CONST               2 (5)
             12 RETURN_VALUE
```

As you can see, the label and the second return are nowhere to be found, which breaks the scanning.

---

Additionally, there are no saftey nets here, it's very easy to cause things to go horribly wrong. This is the first time I can remember triggering segfaults while developing anything in Python.

```python
>>> import goto
>>> 
>>> @goto.goto
... def f():
...     f.goto("in-loop")
...     for i in range(5):
...         f.label("in-loop") # Jumping into a loop like this will case a segfault
... 
>>> f()
fish: Job 1, 'python' terminated by signal SIGSEGV (Address boundary error)
```

But if you're careful, you can do some silly stuff.

```python
>>> import goto
>>> 
>>> @goto.goto
... def f():
...     for i in range(4):
...         print("a", i)
...         f.goto("loop-b")
...         f.label("loop-a")
...     for i in range(4):
...         print("b", i)
...         f.goto("loop-a")
...         f.label("loop-b")
... 
>>> f()
a 0
b 1
a 2
b 3
b 0
a 1
b 2
a 3
```
