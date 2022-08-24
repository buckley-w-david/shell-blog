import subprocess

def origin(file):
    result = subprocess.run(
      ["git", "log", "--follow", "--format=%ad", "--date", "unix", str(file)],
      capture_output=True,
    )
    output = result.stdout.decode().strip()
    if output:
        return int(output.strip().split("\n")[-1])
    else:
        return float('inf')

def commit_order(files):
    return sorted(files, key=origin, reverse=True)

def unique(l):
    seen = set()
    for item in l:
        if item not in seen:
            seen.add(item)
            yield item
