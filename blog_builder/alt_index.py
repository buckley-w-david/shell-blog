#!/usr/bin/python

from pathlib import Path
from blog_builder.utils import commit_order

def build():
    files = commit_order(p for p in Path("site/filesystem/blog/").rglob("**/*.md") if p.is_file())

    # This is a gross solution
    # TODO: Come up with a better way
    with open('site/home.html.part', 'r') as f:
        print(f.read())
    print("<ul>")
    for file in files:
        local_path = Path("/", *file.parts[2:])
        title = ' '.join(local_path.stem.split("-")).title()
        print("<li><a href=\"%s\">%s</a></li>" % (str(local_path.with_suffix(".html")), title))

    print("</ul>")
    print("<p>Also I have an <a href=\"/about.html\">about</a> page, just like everyone else on the internet.</p>")
    print("</body></html>")
