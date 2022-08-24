import json
from collections import defaultdict
from pathlib import Path
from itertools import accumulate

from blog_builder.utils import unique, commit_order

IMAGE_FILE = {
  ".webp",
  ".png",
  ".jpg",
}

def build():
    files = commit_order(p for p in Path("site/filesystem").rglob("*") if p.is_file())

    filesystem = {
      "dirs": defaultdict(list),
      "executables": [],
      "files": {},
    }

    acc = lambda *args: Path("/", *args)
    for file in files:
        local_path = Path("/", *file.parts[2:])

        # Create directory listings
        parts = [Path(p) for p in accumulate(local_path.parts[1:-1], acc, initial="") if p]
        for part in parts:
            filesystem["dirs"][str(part.parent)].append(part.name + "/")
        filesystem["dirs"][str(local_path.parent)].append(local_path.name)

        # Extract file contents
        if local_path.suffix in IMAGE_FILE:
            filesystem["files"][str(local_path)] = "<img src=\"%s\">" % str(local_path)
        else:
            with open(file, "r") as f:
                content = f.read()
            filesystem["files"][str(local_path)] = content

    # This is a poor implementation
    # The order of elements in the `dirs` lists is important (the whole point of commit_order)
    # This means we can't use a set for simple uniqueness since they aren't ordered
    # I've gone with a workaround here to allow duplicates then remove them at the end
    for key in filesystem["dirs"].keys():
        filesystem["dirs"][key] = list(unique(filesystem["dirs"][key]))

    # Little weird for a python function to emit javascript code, but it works
    print("export const fileSystem = ", end="")
    print(json.dumps(filesystem))
