from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from blog_builder.utils import commit_order

def build():
    env = Environment(
        loader=FileSystemLoader("site"),
        autoescape=select_autoescape()
    )
    toy_template = env.get_template("toy.html.template")

    files = commit_order(p for p in Path("site/filesystem/toys/").rglob("*.js") if p.is_file())

    for file in files:
        toy = Path("/", *file.parts[2:])
        sprite = toy.with_suffix(".png")
        title = ' '.join(toy.stem.split("-")).title()
        with open(f"dist/toys/{toy.with_suffix('.html').name}", "w") as f:
            f.write(toy_template.render(
                title=title,
                toy=str(toy),
                sprites=str(sprite),
            ))
