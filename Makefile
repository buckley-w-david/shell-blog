.PHONY: build all

all: dist/index.html

dist/index.html: $(shell find site -type f)
	rm -rf dist/
	mkdir -p dist/blog
	scripts/compile-markdown.sh
	cp -r site/filesystem/blog/assets dist/blog/
	# ./scripts/template-filesystem.sh
	cp -r site/*.{css,html} site/shell site/ttf site/woff2 dist/

