.PHONY: all server

all: dist/index.html

dist/index.html: $(shell find site -type f)
	rm -rf dist/ build/
	mkdir -p dist/blog
	mkdir -p build/shell/
	# Compile blog posts into html docs
	scripts/compile-markdown.sh
	# Build js
	cp -r site/shell/ build/
	poetry run build-filesystem > build/shell/filesystem.js
	esbuild build/shell/shell.js --bundle --minify --outfile=dist/shell/shell.js
	# Copy static assets
	cp -r site/filesystem/blog/assets dist/blog/
	cp -r site/*.css site/*.html site/ttf site/woff2 dist/
	# Generate alt index (with dynamic list of pages)
	poetry run build-alt-index > dist/home.html

server: dist/index.html
	cd dist/; python -m http.server 8000
# TODO: dev target that just symlinks
