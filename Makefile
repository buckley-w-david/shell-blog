.PHONY: all server

all: dist/index.html

dist/index.html: $(shell find site -type f)
	rm -rf dist/
	mkdir -p dist/blog
	# Compile blog posts into html docs
	scripts/compile-markdown.sh
	# Copy static assets
	cp -r site/filesystem/blog/assets dist/blog/
	cp -r site/*.css site/*.html site/shell site/ttf site/woff2 dist/
	# Generate alt index (with dynamic list of pages)
	find site/filesystem/blog/ -type f -name '*.md' | scripts/generate-alt-index.py | cat site/escape.html.part - >dist/escape.html
	# Generate filesystem used with shell.js
	find site/filesystem/ -type f | ./scripts/generate-filysystem.py > dist/shell/filesystem.js

server: dist/index.html
	cd dist/; python -m http.server 8000
# TODO: dev target that just symlinks
