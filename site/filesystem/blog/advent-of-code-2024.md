It's that time of year once again where my competitive nature and desire for sleep must wage a pitched battle for the month of December. It's Advent of Code!

Last year I skipped writing about the event, but looking back on it I regret that, so this year I'm back at it. Instead of writing some big end of event summary, I'm going to jot down my thoughts every day and compile them here.

## Table of Contents

- [Day 1](#day-1)
- [Day 2](#day-2)
- [Day 3](#day-3)
- [Day 4](#day-4)
- [Day 5](#day-5)
- [Day 6](#day-6)
- [Day 7](#day-7)
- [Day 8](#day-8)
- [Day 9](#day-9)
- [Day 10](#day-10)
- [Day 11](#day-11)
- [Day 12](#day-12)
- [Day 13](#day-13)
- [Day 14](#day-14)
- [Day 15](#day-15)
- [Day 16](#day-16)
- [Day 17](#day-17)
- [Day 18](#day-18)
- [Day 19](#day-19)
- [Day 20](#day-20)
- [Day 21](#day-21)
- [Day 22](#day-22)
- [Day 23](#day-23)
- [Day 24](#day-24)
- [Day 25](#day-25)
- [Conclusion](#conclusion)

## Day 1

Like most years, there's not a whole lot to say about day 1. It was easier than last year, mostly in that weird edge cases were much less of an issue.

The problem seemed mostly like a test of your ability to parse the input. Once the two lists were parsed, part one was a fairly simple application of `sorted` and `zip`. Part two could theoretically be harder than part one, but at least in Python the `collections.Counter` class trivialized it.

I ended the day 898th on the global leaderboard at 5m 24s for part two completion.

[You can find my day 1 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day01/day1.py)

## Day 2

Stumbled a bit on day 2. At midnight there was a short period of downtime for `adventofcode.com`. It didn't take more than a couple minutes to resolve, but it was a little mentally disruptive and caused [aocd](https://github.com/wimglenn/advent-of-code-data) to stop working for a little while after, requiring me to figure out some other way on the fly to get the input into my solution. In my hurry I ended up just pasting it directly into my solution file as a large string.

We're starting early on brute force solutions this year. The challenge was to count the number of "safe" lines of inputs, as defined by a set of rules in the puzzle.

Part one is fairly simple, process the lines and calculate the result according to the rules.

Part two is more interesting; We're still counting the safe lines, but an exception has been added to the rules. If a line would be safe with the removal of a single number, it is still considered safe.

My first stab at the problem tried to be smart. Keep track of how many failures in the rules existed and where they occurred. If there are few enough exceptions, remove the elements around where they occur and re-process the line. I found the solution difficult to get right though, and noticed that the size of the input is actually very small, and so pivoted to a brute force approach. Instead of trying to figure out what elements to remove and when, check every option and see if _any_ of them work.

I ended the day 1576th on the global leaderboard at 14m 04s for part two completion.

[You can find my day 2 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day02/day2.py)

## Day 3

Fairly simple problem today, especially if you know regular expressions. I did the parsing for both parts using the `re` module.

```python
# part one
instructions = re.findall(r"mul\((\d+),(\d+)\)", data)
# part two
instructions = re.findall(r"mul\(\d+,\d+\)|do\(\)|don't\(\)", data)
```

Part one required taking the matches from that `findall` call, multiplying the numbers together, and taking the sum.

Part two required a very simple state machine where `do()` tokens flipped the state to `True`, `don't()` tokens to `False`, and `mul(...)` tokens were thrown away if the state is currently `False`.

I think the input today was crafted to catch some people off guard with handling (or not handling) newline characters. I burned some time in part one because I didn't realize the input was to be treated as one big blob of text instead of a series of lines.
There was nothing in the problem text saying that the input was newline delimited, it was just an assumption that I thoughtlessly made due to rushing.

When trying to optimize for speed you have to maintain a strange balancing act between carefully reading and considering the problem, and just starting to put code to editor. Too much time reading is a waste, but too little and you leave yourself open to a large penalty for small mistakes.

I ended the day 291st on the global leaderboard at 5m 28s for part two completion.

[You can find my day 3 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day03/day3.py)

## Day 4

Somewhat slow day today. I was well positioned to do well, my [existing library](https://github.com/buckley-w-david/advent-of-code/blob/master/aoc-utils/aoc_utils/grid.py#L23) of AoC utilities had a `Grid` class well suited for the job. Unfortunately I burned a lot of time debugging an issue that turned out to be caused by misremembering how my own class worked 🤦.

Today's problem was searching for patterns of characters in a big grid.

```
MMMSXXMASM
MSAMXMSMSA
AMXSXMAAMM
MSAMASMSMX
XMASAMXAMM
XXAMMXXAMA
SMSMSASXSS
SAXAMASAAA
MAMMMXMMMM
MXMXAXMASX
```

Part one was finding `XMAS` spelled either forward or backward; horizontally, vertically, or diagonally in any direction.

Part two was find combinations of `MAS` that made an `X` shape

```
M M
 A
S S
```

I implemented both parts via a `word_search` function that found all occurrences of a word in the grid. Part one was `len(word_search(grid, "XMAS"))`

Part two I re-used the logic and compared all combinations of `word_search(grid, "MAS")` to see if they formed an `X`. In retrospect this was a poor implementation with a _lot_ of wasted computation. Directly searching for the pattern of characters in the grid would be much better.

Today I think I learned a lesson about trying to "save time" by re-using code I already had. The `Grid` class really did seem like a good idea to use at the time, but in retrospect I think I would have arrived at a better solution sooner had I started fresh. I will try to keep this in mind as we move to later days.

I ended the day 3025th on the global leaderboard at 27m 49s for part two completion.

[You can find my original day 4 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day04/day4.py)

[You can find an alternate day 4 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day04/day4-alt.py). It the in-retrospect better implementation I discussed above.

## Day 5

I think we've reached the point where the disruption to my sleep schedule is starting to outweigh my competitive nature. I don't think I'm going to last too much longer doing these at midnight. Ah well, still fun to do them just for the joy of solving problems.

I'm not sure I have too much interesting to say about day 5. I solved it mainly via set intersection operations.

My sorting procedure for part two wasn't great (O(n²) performance), but it did feel fairly intuitive.

Loop through the numbers:

1. Find the set of numbers that must come after the one you're looking at (from the rules)
2. Find the intersection of those numbers with the set of all numbers in our list.
3. The number with an empty intersection set is the next number in (reverse) sorted order.
4. Pop that number off of the list (onto another list to hold the sorted values)
5. Repeat. You are done when the original list of numbers is empty.

I ended the day 2657th on the global leaderboard at 27m 21s for part two completion.

[You can find my day 5 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day05/day5.py)

## Day 6

I liked day 6, but mostly just for the story in the problem rather than the problem itself.

Today, much like most (all) days so far, my solution was good 'ol brute force. For part two I iterated over every point in the grid and ran the simulation (with basic loop detection). It was slow, but it worked.

My initial version took over 60 seconds to run. An optimization pass got it down to 11s.

The optimization was to replace the loop over every position in the grid with a loop over all the points along the path the guard walked. These are the only points that could change anything about how the guard moved, so they are the only ones you need to check.

Another interesting speed up was to simply run the solution using [pypy](https://pypy.org/), which brings the runtime down to under 2 seconds.

I ended the day 1134th on the global leaderboard at 25m 07s for part two completion.

[You can find my day 6 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day06/day6.py)

## Day 7

It seems like I am out of practice writing recursive algorithms, it took me much longer than it should have to get the implementation correct for this problem. I choose to write a function that returned all possible sequence of operators, then trying that sequence with the equation until either they equalled the target value, or we ran out of operations.

Once I had a working implementation, part two was very easy; Simply add a third option to my list of operators.

Unfortunately, as is becoming a theme, the performance was very poor. I wrote an alternative solution afterwards that was much simpler and applied the recursive logic to the validity check instead of operator sequences which was much faster. Theoretically I think these two implementations should have a similar runtime (though we can be smarter about exiting early with the second one), but in practice the difference was stark.

I ended the day 4127th on the global leaderboard at 33m 21s for part two completion.

[You can find my day 7 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day07/day7.py)

## Day 8

Most of my time today was spent trying to figure out why my (incorrect) coordinate math wasn't giving me the right answer.

I was a little disappointed with part two of the problem, it seemed to me like a very simple extension to part one.

I ended the day 2639th on the global leaderboard at 30m 17s for part two completion.

[You can find my day 8 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day08/day8.py)

## Day 9

Today marks the day that my need for sleep has won against my competitive nature. I did not stay awake until the problem released to do it immediately, instead I slept.

I feel my solution for day 9 is especially ugly; `if`s in `for`s in `for`s in `if`s. It's a real mess.

I decided to tackle part two by maintaining collections of tuples that held the start and end indices, one collection for files and another for holes.

I traversed the collection of file ranges from front to back, and the holes from front to back, searching for a hole that was to the left of the file and big enough to hold it.

If such a hole was found, the file was popped out of its existing spot, and placed into the hole. Maintaining consistency between these collections is what made the implementation such a mess.

I think it was a mistake to maintain two separate collections, it made the process of reconciling the collections even messier than it needed to be.

[You can find my day 9 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day09/day9.py)

## Day 10

Another day where sleep won over competition. I think I may just continue this pattern. Forcing myself to stay up has no real benefit, and worst case will just steal the joy from it.

I enjoyed day 10, we got to play with our old friend BFS (Breadth First Search) and I got a chance to use some of the utility classes I've built up over the years of AoC.

Part one I thought I would be clever and use an implementation of [Dijkstra's Algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) I had from previous years. The problem wasn't specifically about the shortest path, but since Dijkstra's algorithm calculates the shortest path to every other node in a graph I could use it to check if there was a path between a every `0` node and every `9` node very easily.

This implementation would come back to bite me in part two, since the only thing I could re-use was my graph generation code. I would have to do the graph traversal from scratch.

Even with that however, part two was fairly easy. I have written _many_ BFS graph traversals over the last few years for advent of code, and there was nothing about this one that made it difficult. Starting at every `0` node, I did a BFS for `9` nodes reachable from that starting point and simply kept track of how many I found.

[You can find my day 10 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day10/day10.py)

## Day 11

Day 11 reminded me of 2021 day 6, and it seems I've gotten better over the last 3 years because this time I knew exactly how I would solve it before the heat death of the universe where-as last time I remember that being a problem.

I get the feeling from reading conversation around this one that a lot people probably reached for some kind of recursive solution with a cache for repeated intermediate values. That is what my solution in 2021 ended up being. This time I reached for an iterative solution. Instead of tracking each stone individually, I tracked the _population_ of each stone. Each generation required that I loop over each population and apply the rules for them en masse.

This is the implementation that I came up with for part one, and it worked just as well for part two.

I was a little worried that this solution ignores the constraint in the problem that on each iteration the stones retain their ordering, but luckily for me it didn't end up being relevant.

[You can find my day 11 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day11/day11.py)

## Day 12

Reading day 12, I was worried that this would turn into something particularly messy in part two. While my part two implementation is not _particularly_ nice looking, it was not nearly so bad as I was expecting.

My general strategy was to first decompose the grid into regions via a simple flood fill. Once I had a collection of regions, part one was fairly simple. Area was as simple as `len(region)`, while perimeter required looping over all the points that surrounded the points in the region and counting how many of them were external (not within the region).

Part two was (as to be expected) more complex, though generally retained the same "shape" as my solution to part one. The regions were extracted from the grid in the same way (and area remained simple). To find the number of sides a shape had, I again iterated over all the points around the ones in the region. For each of those surrounding points, I attempted to match them with a "side" I was already tracking.

A point is defined as being part of a given side if it:

1. Was not in the region
2. Was reached via going the same "direction" from a point in the region (ex. go up from a point in the region)
3. Was exactly one point away from a point in the side; If the direction was up or down, that meant one away in the x axis, otherwise one away in y axis.

If an side was found that matched the criteria, the point was added to the list of points in the side. Otherwise a new side was defined with the point as its singular member, along with the direction.

This worked _as long as the points in a region were traversed in order_. If points were processed in a random order, the connecting points between the ones in a side that has already been defined and a point that _should_ go into it may not have been processed yet.

[You can find my day 12 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day12/day12.py)

## Day 13

The way the problem was phrased today had me reaching for a graph data structure and Dijkstra's algorithm to arrive at an answer. When part two was revealed increasing the target coordinates by `10000000000000`, I was forced to reassess.

After taking a step back (and breaking out some pen and paper), I realized that what we had here was calculating the intersection of lines. Once I had reminded myself how to actually do that, the solution was fairly easy to write.

[You can find my day 13 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day13/day13.py)

## Day 14

Today was fairly unique, in that the spec for part two left _a lot_ to be worked out by assumption or intuition.

My solution was to define a heuristic for a board that was "suspicious": Having an unusually high number of consecutive robot positions in a row. When one of these suspicious board states was hit the program would display the board and pause. I would then visually inspect the board and indicate if there was a Christmas tree or not.

[You can find my day 14 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day14/day14.py)

## Day 15

Part one was very nice, part two was very not.

My implementation is too messy to go through in detail, so instead I'll point out where I went wrong that left me with such a bad solution: Sticking to the character grid.

My implementation still operated on the character grid directly, which meant a lot of fiddly logic around making sure both halves of boxes were handled correctly. This was the "lazy" choice that didn't involve further processing the input. What I should have instead done is step past the character grid, and represent both halves of boxes in a single entity.

[You can find my day 15 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day15/day15.py)

## Day 16

Day 16 is where my commitment to writing these notes daily fell off. Everything from here on out was written post-hoc after all the problems have been released and solved.

I don't have very much interesting to say about day 16. For part one I used Dijkstra's algorithm again, the same implementation I've used in previous days. Nodes in the graph were composed of both a position and a facing direction, and edge weights were based on the rules of the problem.

I ended up having to spend time undoing an optimization I built into my graph for part one that was making things much harder in part two. Originally I compacted straight lines with no corners or alternate paths into a single edge with a weight equal to the length of the path. This is an optimization that I recalled from a problem in a previous year where _not_ doing that significantly slowed down the solution. This problem did not require it, and in fact made reconstructing the exact path(s) for part two annoying.

The only significant difference between my part one and two solutions was having to adjust my usual Dijkstra implementation to give me all best paths instead of one best path. This ended up being a fairly simple adjustment. My implementation maintains a map of node -> predecessor. All I changed was that mapping is now node -> [predecessors]. When a path is found that is better than the best currently known one that list is replaced. When a path that is as good as the best known one is found, it is added to the list.

[You can find my day 16 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day16/day16.py)

## Day 17

Day 17 was interesting, although I'm not totally satisfied with how I solved it.

Part one was simple, just implement the rules as described in the problem.

Part two required one to inspect their input and understand what it was actually doing in order to build a search algorithm.

I did exactly that, read my input, figured out what it was doing, and used that to inform a search algorithm. The part that leaves my unsatisfied is that how I ended up doing it was more intuition than anything else. Upon reading some discourse on the problem there are parts to it that I didn't realize, that make me feel like I mostly got lucky with my solution.

[You can find my day 17 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day17/day17.py)

## Day 18

I found day 18 weirdly easy. I used my normal set of tools for part one (Dijkstra made another appearance).

Part two I expected the "brute force" approach to not work, and so when my initial very inefficient implementation spat out an answer within a handful of seconds it was surprising.

My implementation was to re-run Dijkstra after placing each byte until it didn't find a path. "Placing a byte" in this context means taking a graph representing the grid (where each square was connected to all the neighbouring squares) and snipping edges for each byte that was placed in the grid.

While cleaning up the solution I did improve it quite a bit by only re-running pathfinding when a byte was placed on the path that was found last time I ran it.

[You can find my day 18 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day18/day18.py)

## Day 19

Another surprisingly easy day, although that might have more to do with familiarity of the problem type than it actually being easy. There isn't a lot to say about my solution, it is a pretty simple recursive solution with caching to prevent computing results more than once.

[You can find my day 19 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day19/day19.py)

## Day 20

Day 20 kicked my ass a little. My problem mostly came from approaching the problem with too general a lens. I wrote my solution to part one as if it were a maze, with arbitrarily many paths to take, and used Dijkstra (again).

My part one solution built a graph with the "cheating" rules built in, and ran Dijkstra on it twice. Once from the starting point, once from the ending point.

By iterating of the distances from the end we could check all cheats and see how much time they saved, tallying how many where above 100 tiles.

Part two required me to totally abandon my approach from part one, ultimately ending up with something much simpler.

My approach was to iterate over the path from the start to the end and check all positions that could be reached by cheating. This could be determined by looking at the [Manhattan distance](https://en.wikipedia.org/wiki/Taxicab_geometry). Anything that ended on a path and had a Manhattan distance less than or equal to 20 could be reached. After that it was as simple as checking how much distance that cheat had saved.

[You can find my day 20 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day20/day20.py)

## Day 21

Day 21 kicked my ass a lot.

Even part one took me a long time to get right, and it wasn't even usable for part two due to my approach not scaling well enough.

I took a few days break after hitting this one, and eventually came up with a workable solution that at the end of the day wasn't much more complicated than day 19.

[You can find my day 21 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day21/day21.py)

## Day 22

Mercifully day 22 was another easy day, surprisingly so actually. Part one was another "implement the rules as described by the problem" type solution.

Part two required some care to keep track of the information and keep everything lined up right, but wasn't really that hard either. I calculated the prices, turned that into differences, and then scanned the differences. For each sequence of four I summed the price for its first occurrence for that monkey, and then returned the value from those sums.

[You can find my day 22 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day22/day22.py)

## Day 23

Day 23 required me to do some algorithms research, eventually solving it with the [Bron-Kerbosch algorithm](https://en.wikipedia.org/wiki/Bron%E2%80%93Kerbosch_algorithm).

I eschewed my typical graph data structure today for something simpler and easier to operate on. I used a `dict[str, set[str]]` where keys were computers, and values was the set of computers the key was connected to.

This problem has made my think I need to make some improvements to the interface of my `Graph` class. It should be _easier_ to use it than doing it "manually", not harder. Otherwise why bother maintaining the class at all?

Day 23 is also when I came back from the break that day 21 pushed me to. I did 21, 22, and 23 all on the same day.

[You can find my day 23 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day23/day23.py)

## Day 24

I hadn't had enough doing the previous 3 problems all in one sitting because day 24 is when my competitive spirit came back, and I decided to end the month with a last hurrah and go for a good time.

While part two did take me quite a long time, I enjoyed it. I didn't actually write a problem to solve part two, and instead did it with a combination of visual inspection of the input, and ad-hoc processing of the wires. Luckily I remember how a full adder works so I was able to recognize the more obvious places that it was wrong.

I ended the day 470th on the global leaderboard at 11m 20s for part one completion.
I ended the day 928th on the global leaderboard at 2h 10m 59s (😲) for part two completion. I was pretty tired after this one.

[You can find my day 24 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day24/day24.py)

## Day 25

As usual, we end the month with a fairly easy problem. Most of the problem description and rules were just fluff, all you had to do was count the number of `#` characters in the columns and assign the "schematic" to the right collection (`keys` or `locks`). Once you had the two lists, you could check all combinations of them to see how many had columns that summed to something greater than 5 (resulting in an "overlap").

I ended the day 520th on the global leaderboard at 9m 23s for part two completion.

[You can find my day 25 solution here](https://github.com/buckley-w-david/advent-of-code/blob/master/2024/day25/day25.py)

## Conclusion

This year seemed a bit easier than the last, but I still enjoyed it. It being the 10th anniversary of the event and the story bringing us through a bunch of locations from past years was fun.

I like the idea of a journal-style blog post of these problems, but also I found myself without a whole lot to really say most days. I might approach this differently yet again next year. I suppose we shall see.
