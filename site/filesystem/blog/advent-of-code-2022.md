Date: 2022-12-28

This is the second year in a row that I participated in [Advent of Code](https://adventofcode.com), and unlike last year I think I actually learned some lessons that I'll take with me for future years.

## My Environment

Language: Python 3.10 (CPython)  
Editor: [neovim](https://neovim.io/)  
Solutions Repo: [https://github.com/buckley-w-david/advent-of-code](https://github.com/buckley-w-david/advent-of-code/tree/master/2022)  
Notable tools:  
 - [aoc-utils](https://github.com/buckley-w-david/advent-of-code/tree/master/aoc-utils): A library of miscellaneous utilities I maintain for Advent of Code.  
 - [advent-of-code-data](https://github.com/wimglenn/advent-of-code-data): A package to pull puzzle inputs programmatically (instead of having to copy and read from a text file).  
 - [entr](http://eradman.com/entrproject/): Instead of running my solution every time I make a change, I have [a script](https://github.com/buckley-w-david/advent-of-code/blob/master/bin/aoc) I run ahead of time that re-runs the solution every time it changes.  

## How did it compare to 2021

A lot less recursion, and a lot more graph traversal.

2021: 15 (DIJ), 23 (DIJ)  
2022: 12 (DIJ), 16 (BFS), ~18 (BFS), 19 (DIJ), 24 (BFS)

DIJ = Dijkstra  
BFS = Breadth First Search

Five days in 2022 vs two in 2021. Actually a smaller difference than it felt like, but by the end of this year I was definitely a bit tired of implementing graph traversal solutions.

On average (and ignoring 2021 Day 1 where I forgot the event was starting), my average placement improved.  
2021 average Part 2 Rank: 2086th  
2022 average Part 2 Rank: 1873th

## Personal Stats
<pre>
      -------Part 1--------   -------Part 2--------
Day       Time  Rank  Score       Time  Rank  Score
 25   00:36:37  1611      0   00:36:40  1354      0
 24   00:52:53   884      0   00:55:01   712      0
 23   00:53:01  1292      0   00:54:47  1103      0
 22   01:57:46  3149      0   04:10:51  1725      0
 21   00:07:16   380      0   00:27:44   459      0
 20   01:44:21  2717      0   01:45:39  2205      0
 19   02:11:24  1341      0   02:15:49   912      0
 18   00:13:05  1739      0   01:13:15  2358      0
 17   00:58:22  1306      0   10:59:14  5351      0
 16   11:40:52  8706      0   12:55:54  5202      0 - I decided to sleep instead of doing it at midnight
 15   00:56:41  3839      0   02:30:29  4120      0
 14   00:19:13   569      0   00:26:53   849      0
 13   00:25:09  1484      0   00:34:15  1466      0
 12   01:37:37  6298      0   01:47:46  6106      0
 11   00:22:32   775      0   01:14:59  3588      0
 10   00:10:20  1092      0   00:20:08   783      0
  9   00:13:51   809      0   00:17:01   208      0
  8   00:16:56  2345      0   00:25:13  1505      0
  7   00:16:51   437      0   00:37:15  1949      0
  6   00:04:20  1479      0   00:04:42   974      0
  5   00:10:07   482      0   00:13:07   594      0
  4   00:03:25   500      0   00:03:52   184      0
  3   00:05:33   733      0   00:09:17   665      0
  2   00:06:04   791      0   00:09:16   571      0
  1   00:01:47   303      0   00:03:04   363      0
</pre>


## Performance

CPython 3.10.8
<details>
<summary>
Slow days (~1+ seconds): 11, 14, 15, 16, 19, 20, 23, 24  
_Really_ slow days (~100+ seconds): 15, 16, 19  
Total: 811.31 seconds  
Overall pretty bad on execution time. I might go back and tweak the solution for some of the more egregious times.   
</summary>
<pre>
./day01/day1.py
209691

________________________________________________________
Executed in  161.58 millis    fish           external
   usr time  136.98 millis   44.00 micros  136.94 millis
   sys time   22.73 millis   26.00 micros   22.70 millis

./day02/day2.py
13693

________________________________________________________
Executed in  154.95 millis    fish           external
   usr time  144.72 millis  755.00 micros  143.97 millis
   sys time   10.11 millis   86.00 micros   10.02 millis

./day03/day3.py
2646

________________________________________________________
Executed in  156.13 millis    fish           external
   usr time  152.59 millis   42.00 micros  152.54 millis
   sys time    3.34 millis   26.00 micros    3.32 millis

./day04/day4.py
895

________________________________________________________
Executed in  162.24 millis    fish           external
   usr time  142.01 millis   86.00 micros  141.92 millis
   sys time   19.85 millis   51.00 micros   19.80 millis

./day05/day5.py
GCFGLDNJZ
________________________________________________________
Executed in  153.99 millis    fish           external
   usr time  140.32 millis   63.00 micros  140.26 millis
   sys time   13.41 millis   38.00 micros   13.37 millis

./day06/day6.py
2313

________________________________________________________
Executed in  152.90 millis    fish           external
   usr time  145.93 millis   60.00 micros  145.87 millis
   sys time    6.67 millis   35.00 micros    6.63 millis

./day07/day7.py
3636703

________________________________________________________
Executed in  154.90 millis    fish           external
   usr time  141.22 millis   67.00 micros  141.16 millis
   sys time   13.49 millis   40.00 micros   13.45 millis

./day08/day8.py
(422059, (17, 61))

________________________________________________________
Executed in  245.02 millis    fish           external
   usr time  231.21 millis    0.00 micros  231.21 millis
   sys time   13.50 millis   94.00 micros   13.41 millis

./day09/day9.py
2619

________________________________________________________
Executed in  186.27 millis    fish           external
   usr time  176.02 millis    0.00 micros  176.02 millis
   sys time   10.03 millis   73.00 micros    9.96 millis

./day10/day10.py
####.####.###..###..###..####.####.####.
#.......#.#..#.#..#.#..#.#.......#.#....
###....#..###..#..#.###..###....#..###..
#.....#...#..#.###..#..#.#.....#...#....
#....#....#..#.#....#..#.#....#....#....
#....####.###..#....###..#....####.#....
.
________________________________________________________
Executed in  152.07 millis    fish           external
   usr time  141.84 millis    0.00 micros  141.84 millis
   sys time   10.00 millis  104.00 micros    9.90 millis

./day11/day11.py
15333249714

________________________________________________________
Executed in    2.79 secs    fish           external
   usr time    2.78 secs    0.00 micros    2.78 secs
   sys time    0.00 secs   99.00 micros    0.00 secs

./day12/day12.py
443

________________________________________________________
Executed in  660.75 millis    fish           external
   usr time  643.00 millis    0.00 micros  643.00 millis
   sys time   16.75 millis   95.00 micros   16.66 millis

./day13/day13.py
20592

________________________________________________________
Executed in  174.85 millis    fish           external
   usr time  160.14 millis    0.00 micros  160.14 millis
   sys time   13.71 millis   82.00 micros   13.63 millis

./day14/day14.py
26831

________________________________________________________
Executed in    1.03 secs      fish           external
   usr time  825.14 millis    0.00 micros  825.14 millis
   sys time   16.63 millis   66.00 micros   16.56 millis

./day15/day15.py
11645454855041

________________________________________________________
Executed in  175.42 secs    fish           external
   usr time  174.97 secs    0.00 micros  174.97 secs
   sys time    0.02 secs   89.00 micros    0.02 secs

./day16/day16.py
2111

________________________________________________________
Executed in  445.96 secs    fish           external
   usr time  443.43 secs    0.00 micros  443.43 secs
   sys time    1.84 secs  108.00 micros    1.84 secs

./day17/day17.py
1577207977186

________________________________________________________
Executed in  235.04 millis    fish           external
   usr time  203.78 millis    0.00 micros  203.78 millis
   sys time   30.14 millis   91.00 micros   30.05 millis

./day18/day18.py
2510

________________________________________________________
Executed in  185.37 millis    fish           external
   usr time  158.41 millis    0.00 micros  158.41 millis
   sys time   23.70 millis   80.00 micros   23.62 millis

./day19/day19.py
19530

________________________________________________________
Executed in  164.48 secs    fish           external
   usr time  163.47 secs    0.00 micros  163.47 secs
   sys time    0.87 secs  121.00 micros    0.87 secs

./day20/day20.py
1338310513297

________________________________________________________
Executed in    1.08 secs    fish           external
   usr time    1.06 secs    0.00 micros    1.06 secs
   sys time    0.02 secs  108.00 micros    0.02 secs

./day21/day21.py
3342154812537

________________________________________________________
Executed in  317.92 millis    fish           external
   usr time  307.23 millis    0.00 micros  307.23 millis
   sys time   10.44 millis  419.00 micros   10.02 millis

./day22/day22.py
104385

________________________________________________________
Executed in  180.82 millis    fish           external
   usr time  169.56 millis    0.00 micros  169.56 millis
   sys time   10.04 millis   90.00 micros    9.95 millis

./day23/day23.py
1005

________________________________________________________
Executed in   14.62 secs    fish           external
   usr time   14.59 secs    0.00 micros   14.59 secs
   sys time    0.01 secs  112.00 micros    0.01 secs

./day24/day24.py
714

________________________________________________________
Executed in    2.34 secs    fish           external
   usr time    2.25 secs    0.00 micros    2.25 secs
   sys time    0.09 secs   84.00 micros    0.09 secs

./day25/day25.py
2-0=11=-0-2-1==1=-22

________________________________________________________
Executed in  157.34 millis    fish           external
   usr time  139.96 millis    0.00 micros  139.96 millis
   sys time   16.74 millis   85.00 micros   16.65 millis
</pre>
</details>
<br>
PyPy (7.3.10) 3.9.15
<details>
<summary>
Slow days (~1+ seconds): Technically all days  
_Really_ slow days (~100+ seconds): 16, 19  
Total: 599.28 seconds  
Interesting to see where the JIT helps and where it doesn't (or even hurts). All "fast" days with CPython get bumped up to around 1 second of execution time. Some slow days are worse as well, but all that extra time is made up for on day 15 where PyPy shaves off 168 seconds (175.42 to 7.28).  
It's pretty easy to see what the JIT helps with in these soltions: loops. Day 15 had some huge loops, which are just very slow in CPython, but less so in PyPy.
</summary>
<pre>
./day01/day1.py
209691

________________________________________________________
Executed in    1.02 secs      fish           external
   usr time  965.42 millis  132.00 micros  965.28 millis
   sys time   49.87 millis   44.00 micros   49.83 millis

./day02/day2.py
13693

________________________________________________________
Executed in  987.45 millis    fish           external
   usr time  944.90 millis   64.00 micros  944.84 millis
   sys time   39.94 millis   21.00 micros   39.91 millis

./day03/day3.py
2646

________________________________________________________
Executed in    1.00 secs      fish           external
   usr time  951.84 millis   81.00 micros  951.76 millis
   sys time   46.42 millis   27.00 micros   46.39 millis

./day04/day4.py
895

________________________________________________________
Executed in    1.02 secs      fish           external
   usr time  982.56 millis   92.00 micros  982.47 millis
   sys time   36.63 millis   31.00 micros   36.60 millis

./day05/day5.py
GCFGLDNJZ
________________________________________________________
Executed in  985.65 millis    fish           external
   usr time  930.99 millis   75.00 micros  930.92 millis
   sys time   53.23 millis   25.00 micros   53.20 millis

./day06/day6.py
2313

________________________________________________________
Executed in  978.01 millis    fish           external
   usr time  930.16 millis   85.00 micros  930.08 millis
   sys time   46.52 millis   28.00 micros   46.50 millis

./day07/day7.py
3636703

________________________________________________________
Executed in  992.20 millis    fish           external
   usr time  954.11 millis   87.00 micros  954.02 millis
   sys time   36.71 millis   29.00 micros   36.69 millis

./day08/day8.py
(422059, (17, 61))

________________________________________________________
Executed in    1.04 secs      fish           external
   usr time  997.25 millis   91.00 micros  997.16 millis
   sys time   39.90 millis   30.00 micros   39.87 millis

./day09/day9.py
2619

________________________________________________________
Executed in    1.07 secs    fish           external
   usr time    1.02 secs   91.00 micros    1.02 secs
   sys time    0.05 secs   30.00 micros    0.05 secs

./day10/day10.py
####.####.###..###..###..####.####.####.
#.......#.#..#.#..#.#..#.#.......#.#....
###....#..###..#..#.###..###....#..###..
#.....#...#..#.###..#..#.#.....#...#....
#....#....#..#.#....#..#.#....#....#....
#....####.###..#....###..#....####.#....
.
________________________________________________________
Executed in    1.04 secs      fish           external
   usr time  995.05 millis   86.00 micros  994.96 millis
   sys time   39.94 millis   29.00 micros   39.91 millis

./day11/day11.py
15333249714

________________________________________________________
Executed in    5.45 secs    fish           external
   usr time    5.40 secs   83.00 micros    5.40 secs
   sys time    0.04 secs   28.00 micros    0.04 secs

./day12/day12.py
443

________________________________________________________
Executed in    1.55 secs    fish           external
   usr time    1.51 secs   93.00 micros    1.51 secs
   sys time    0.04 secs   31.00 micros    0.04 secs

./day13/day13.py
20592

________________________________________________________
Executed in    1.07 secs    fish           external
   usr time    1.04 secs  101.00 micros    1.04 secs
   sys time    0.03 secs   34.00 micros    0.03 secs

./day14/day14.py
26831

________________________________________________________
Executed in    1.19 secs    fish           external
   usr time    1.16 secs  577.00 micros    1.16 secs
   sys time    0.03 secs   75.00 micros    0.03 secs

./day15/day15.py
11645454855041

________________________________________________________
Executed in    7.28 secs    fish           external
   usr time    7.22 secs   94.00 micros    7.22 secs
   sys time    0.05 secs   32.00 micros    0.05 secs

./day16/day16.py
2111

________________________________________________________
Executed in  408.70 secs    fish           external
   usr time  332.81 secs  494.00 micros  332.81 secs
   sys time   72.67 secs  165.00 micros   72.67 secs

./day17/day17.py
1577207977186

________________________________________________________
Executed in    1.22 secs    fish           external
   usr time    1.10 secs   70.00 micros    1.10 secs
   sys time    0.04 secs   23.00 micros    0.04 secs

./day18/day18.py
2510

________________________________________________________
Executed in    1.04 secs      fish           external
   usr time  995.91 millis   68.00 micros  995.84 millis
   sys time   43.32 millis   22.00 micros   43.30 millis

./day19/day19.py
19530

________________________________________________________
Executed in  150.84 secs    fish           external
   usr time  146.86 secs   82.00 micros  146.86 secs
   sys time    3.59 secs   27.00 micros    3.59 secs

./day20/day20.py
1338310513297

________________________________________________________
Executed in    1.12 secs    fish           external
   usr time    1.06 secs    0.00 micros    1.06 secs
   sys time    0.05 secs  110.00 micros    0.05 secs

./day21/day21.py
3342154812537

________________________________________________________
Executed in    1.50 secs    fish           external
   usr time    1.46 secs    0.00 micros    1.46 secs
   sys time    0.04 secs   96.00 micros    0.04 secs

./day22/day22.py
104385

________________________________________________________
Executed in    1.03 secs      fish           external
   usr time  978.44 millis    0.00 micros  978.44 millis
   sys time   46.67 millis   83.00 micros   46.59 millis

./day23/day23.py
1005

________________________________________________________
Executed in    4.25 secs    fish           external
   usr time    4.20 secs    0.00 micros    4.20 secs
   sys time    0.05 secs  112.00 micros    0.05 secs

./day24/day24.py
714

________________________________________________________
Executed in    1.91 secs    fish           external
   usr time    1.85 secs    0.00 micros    1.85 secs
   sys time    0.06 secs  109.00 micros    0.06 secs

./day25/day25.py
2-0=11=-0-2-1==1=-22

________________________________________________________
Executed in  995.77 millis    fish           external
   usr time  963.46 millis    0.00 micros  963.46 millis
   sys time   30.00 millis   91.00 micros   29.91 millis
</pre>
</details>

## Notable Days

[Day 4](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day04/day4.py): Finding overlapping regions between ranges of numbers.

Not actually a very interesting problem, but notable to me because it was the closest I came this year to the global leaderboard at 184th place.

[Day 8](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day08/day8.py): Given a grid of tree heights, where should the Elves build their secret tree house?  

Notable as one of the few days where my solution for part one (How many trees can be seen from outside the grid) was basically completely useless in part two.

[Day 10](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day10/day10.py): The puzzle input is actually a program that draws a sprite using beam chasing.

Nothing about this implementation was particularly special, but the idea behind the problem was pretty cool. I would have liked to see this idea expanded upon in later days, maybe having to write such a drawing program ourselves.

[Day 12](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day12/day12.py): The first of many shortest path questions. Find the shortest path up a mountain where you can only move up by one elevation per step (But can move down by any amount).

This day had maybe my biggest blunder (it was my worst rank, including the day where I didn't attempt the problem until the next day).

Despite the problem explicitly calling it out, I didn't realize that you could go _down_ by any amount in a single step 🤦‍♂️.

[Day 21](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day21/day21.py): Resolve a large series of arithmetic expressions, most of which depend on the result of other expressions (recursively until you get down to a scalar value).

Instead of solving part two by understanding the problem, I used a property I noticed by manually plugging in some values; The left hand side of the equality statement (Which contained the `humn` node) formed a monotonically decreasing function. I used this to do a binary search on the space (with an upper bound I manually found by plugging in some values).

If I already had a binary search implementation in my `aoc_utils` package I think I could have made it into the global leaderboard (since I initially just found it by doing the search manually).

[Day 22](https://github.com/buckley-w-david/advent-of-code/blob/master/2022/day22/day22.py): Trace a path along surface (first a oddly shaped "maze", then a cube formed by treating that initial surface as the net of a cube).

Whew, part two really kicked my ass.  
Like a lot of people, I put together a small paper cube to help model the problem.

<img src="/blog/assets/cube.jpg">

I ended up hardcoding the solution to my specific cube net.

## Conclusion

Like usual, Advent of Code is pretty fun.  

Lessons learned:  
 - A "brute force" solution is often actually plenty fast enough for these problems as long as you're a little careful to prune useless branches. For most of the graph problems the performance of my solutions was pretty bad, but crucially _it was good enough_. I would have placed much better on many days if I didn't keep throwing away solutions that didn't finish executing within a second of running it.  
 - I now have a better intuition in general for decomposing a problem into a graph traversal.  
 - Sleep is very important (and trying to program without it leads to many bugs).

Unlike last year I found it pretty exhausting to stay up until midnight to do the problems as soon as they released. I think going forward I'm going to attempt to quash my competitive nature and simply do each problem the next day.
