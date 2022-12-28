.PHONY: all server watch

all: dist/index.html

ready: pyproject.toml poetry.lock
	poetry install
	touch ready

dist/index.html: $(shell find site -type f) ready
	rm -rf dist/ build/
	mkdir -p dist/blog
	mkdir -p dist/toys
	mkdir -p build/shell/
	poetry run compile-markdown
	# Build js
	cp -r site/shell/ build/
	poetry run build-filesystem > build/shell/filesystem.js
	esbuild build/shell/shell.js --bundle --minify --outfile=dist/shell/shell.js
	# Copy static assets
	cp -r site/filesystem/blog/assets dist/blog/
	cp -r site/filesystem/toys/*.js site/filesystem/toys/*.png dist/toys/
	cp -r site/*.css site/*.html site/ttf site/woff2 dist/
	# Generate toy html pages
	poetry run build-toys
	# Generate alt index (with dynamic list of pages)
	poetry run build-alt-index > dist/home.html

watch:
	find . -type f | entr make

server: dist/index.html
	cd dist/; python -m http.server 8000
# TODO: dev target that just symlinks
