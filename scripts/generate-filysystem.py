#!/usr/bin/python

print("export const fileSystem = ", end="")

import json, sys
import re
from datetime import datetime
from collections import defaultdict
from pathlib import Path
from itertools import accumulate
IMAGE_FILE = {
  ".webp",
  ".png",
  ".jpg",
}

filesystem = {
  "dirs": defaultdict(list),
  "executables": [],
  "files": {},
}


# This is a little hacky, but I guess it works
DATE_LINE = re.compile(r"Date: (.*)")
def extract_date(path: str):
    try:
        with open(path, "r") as f:
            line = f.readlines()[0]
        match = DATE_LINE.match(line)
        if match:
            return datetime.strptime(match.group(1), "%Y-%m-%d")
        else:
            return datetime.min
    except Exception:
        return datetime.min


files = sorted(sys.stdin.read().strip().split("\n"), key=extract_date, reverse=True)

for file in files:
    tf = Path(file[15:])
    def acc(a, b):
        return "%s/%s" % (a, b)

    parts = [Path(p) for p in accumulate(tf.parts[1:-1], acc, initial="") if p]
    for part in parts:
        filesystem["dirs"][str(part.parent)].append(part.name + "/")
    filesystem["dirs"][str(tf.parent)].append(tf.name)

    if tf.suffix in IMAGE_FILE:
        filesystem["files"][str(tf)] = "<img src=\"%s\">" % str(tf)
    else:
        with open(file, "r") as f:
            content = f.read()
        filesystem["files"][str(tf)] = content

def unique(l):
    seen = set()
    for item in l:
        if item not in seen:
            seen.add(item)
            yield item
for key in filesystem["dirs"].keys():
    filesystem["dirs"][key] = list(unique(filesystem["dirs"][key]))
print(json.dumps(filesystem))
