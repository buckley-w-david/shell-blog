#!/usr/bin/python

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

import sys

def build():
    env = Environment(
        loader=FileSystemLoader("site"),
        autoescape=select_autoescape()
    )
    index = env.get_template("index.html.template")

    js_hash, css_hash = sys.argv[1:]

    print(index.render(js_hash=js_hash, css_hash=css_hash))
