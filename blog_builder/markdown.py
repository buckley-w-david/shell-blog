import subprocess
from pathlib import Path

from blog_builder.utils import title

def build():
    dest = Path("dist")
    for file in (p for p in Path("site/").rglob("*.md") if p.is_file()):
        parts = file.parts[1:]
        if parts[0] == "filesystem":
            parts = parts[1:]

        local_path = Path(*parts)
        subprocess.run([
            "pandoc", "-s", 
            "-c", "/blog.css", 
            "--metadata", "title=%s" % title(file), 
            "-H", "site/header.html.part", 
            "-F", "mermaid-filter",
            str(file), 
            "-o", str(dest / local_path.with_suffix(".html"))
        ])
