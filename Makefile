.PHONY: all server

all: dist/index.html

dist/index.html: $(shell find site -type f)
	rm -rf dist/
	mkdir -p dist/blog
	scripts/compile-markdown.sh
	cp -r site/filesystem/blog/assets dist/blog/
	# TODO: template  escape.md
	cp -r site/*.css site/*.html site/shell site/ttf site/woff2 dist/
	find site/filesystem/ -type f | ./scripts/generate-filysystem.py > dist/shell/filesystem.js

server: dist/index.html
	cd dist/; python -m http.server 8000
# TODO: dev target that just symlinks
