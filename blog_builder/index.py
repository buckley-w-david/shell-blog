#!/usr/bin/python

from jinja2 import Environment, FileSystemLoader, select_autoescape


def build(js_hash, css_hash):
    env = Environment(loader=FileSystemLoader("site"), autoescape=select_autoescape())
    index = env.get_template("index.html.template")

    return index.render(js_hash=js_hash, css_hash=css_hash)
