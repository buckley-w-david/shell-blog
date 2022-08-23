#!/usr/bin/python

print("export const fileSystem = ", end="")

import json, sys
from collections import defaultdict
from pathlib import Path
from itertools import accumulate
IMAGE_FILE = {
  ".webp",
  ".png",
  ".jpg",
}

filesystem = {
  "dirs": defaultdict(set),
  "executables": [],
  "files": {},
}
files = sys.stdin.read().strip().split("\n")

for file in files:
    tf = Path(file[15:])
    def acc(a, b):
        return "%s/%s" % (a, b)

    parts = [Path(p) for p in accumulate(tf.parts[1:-1], acc, initial="") if p]
    for part in parts:
        filesystem["dirs"][str(part.parent)].add(part.name + "/")
    filesystem["dirs"][str(tf.parent)].add(tf.name)

    if tf.suffix in IMAGE_FILE:
        filesystem["files"][str(tf)] = "<img src=\"%s\">" % str(tf)
    else:
        with open(file, "r") as f:
            content = f.read()
        filesystem["files"][str(tf)] = content

for key in filesystem["dirs"].keys():
    filesystem["dirs"][key] = list(filesystem["dirs"][key])
print(json.dumps(filesystem))
