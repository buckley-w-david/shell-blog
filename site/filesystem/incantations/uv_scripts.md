I have recently learned about [inline script dependencies in uv](https://docs.astral.sh/uv/guides/scripts/#declaring-script-dependencies).

The documentation speaks for itself, but I wanted to show a little bit more to highlight how useful this can be.

I like [toml](https://toml.io/en/) as a configuration language, but I had a problem (before `3.11` but pretend they didn't add a TOML module to the standard library) where I had little scripts that I wanted to read TOML config files, I didn't want to pollute my global python installation with packages, but having to create and use a virtual environment for something so trivial was annoying.

`uv` to the rescue!

```python
#!/usr/bin/env -S uv run --script

# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "toml",
# ]
# ///

import toml

config = toml.load("config.toml")
print(config)
```

Clever use the of the [shebang](<https://en.wikipedia.org/wiki/Shebang_(Unix)>) line combined with an inline metadata block defining a dependency on the `toml` package means the convenience of a script without any of the downsides (aside from maybe storage space).
