#!/usr/bin/python

import subprocess
import sys
from pathlib import Path

def origin(file):
    result = subprocess.run(
      ["git", "log", "--follow", "--format=%ad", "--date", "unix", file],
      capture_output=True,
    )
    output = result.stdout.decode().strip()
    if output:
        return int(output.strip().split("\n")[-1])
    else:
        return float('inf')

files = sorted(sys.stdin.read().strip().split("\n"), key=origin, reverse=True)

# This is a gross solution
print("<ul>")
for file in files:
    p = Path(file[15:])
    title = ' '.join(p.stem.split("-")).title()
    print("<li><a href=\"%s\">%s</a></li>" % (str(p.with_suffix(".html")), title))

print("</ul>")
print("<p>Also I have an <a href=\"/about.html\">about</a> page, just like everyone else on the internet.</p>")
