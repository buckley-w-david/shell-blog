from hashlib import sha256
import os
import shutil
from pathlib import Path
import glob

from blog_builder import markdown, toys, filesystem, index, alt_index


def build():
    shutil.rmtree("dist", ignore_errors=True)
    shutil.rmtree("build", ignore_errors=True)

    # Initialize the dist directory
    Path("dist/blog").mkdir(parents=True, exist_ok=True)
    Path("dist/incantations").mkdir(parents=True, exist_ok=True)
    Path("dist/toys").mkdir(parents=True, exist_ok=True)
    #
    # Initialize the build directory with the contents of the site
    shutil.copytree("site", "build")

    # Generate HTML files for markdown files
    markdown.build()

    # Copy static assets
    shutil.copytree(
        "site/filesystem/blog/assets", "dist/blog/assets", dirs_exist_ok=True
    )
    shutil.copytree("site/filesystem/assets", "dist/assets", dirs_exist_ok=True)
    shutil.copytree(
        "site/filesystem/toys",
        "dist/toys",
        ignore=shutil.ignore_patterns("*.md"),
        dirs_exist_ok=True,
    )
    shutil.copytree("site/ttf", "dist/ttf", dirs_exist_ok=True)
    shutil.copytree("site/woff2", "dist/woff2", dirs_exist_ok=True)
    the_rest = (
        glob.glob("site/*.css")
        + glob.glob("site/*.png")
        + glob.glob("site/*.xml")
        + glob.glob("site/*.ico")
        + glob.glob("site/*.svg")
        + glob.glob("site/*.webmanifest")
    )
    for item in the_rest:
        if Path(item).is_file():
            shutil.copy2(item, "dist")

    toys.build()

    # Build js and index html
    with open("build/javascript/shell/filesystem.js", "w") as f:
        f.write(filesystem.build())
    os.system(
        "esbuild build/javascript/application.js --bundle --minify --outfile=build/application.js"
    )

    with open("build/application.js", "rb") as f:
        jshash = sha256(f.read()).hexdigest()
    shutil.move("build/application.js", f"dist/application.{jshash}.js")

    with open("build/shell.css", "rb") as f:
        csshash = sha256(f.read()).hexdigest()
    shutil.move("build/shell.css", f"dist/shell.{csshash}.css")

    with open("dist/index.html", "w") as f:
        f.write(index.build(jshash, csshash))
    with open("dist/home.html", "w") as f:
        f.write(alt_index.build())
