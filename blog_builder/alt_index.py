#!/usr/bin/python

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from blog_builder.utils import commit_order

def build():
    env = Environment(
        loader=FileSystemLoader("site"),
        autoescape=select_autoescape()
    )
    home = env.get_template("home.html.template")

    files = commit_order(p for p in Path("site/filesystem/blog/").rglob("**/*.md") if p.is_file())

    navigation = []
    for file in files:
        local_path = Path("/", *file.parts[2:])
        title = ' '.join(local_path.stem.split("-")).title()
        href = local_path.with_suffix(".html")
        navigation.append((href, title))

    print(home.render(navigation=navigation))
