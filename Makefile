.PHONY: all server watch

all: dist/index.html

ready: pyproject.toml poetry.lock
	poetry install
	touch ready

dist/index.html: $(shell find site -type f) ready
	rm -rf dist/ build/
	mkdir -p dist/blog
	mkdir -p dist/toys

	# Generate HTML files for markdown files
	poetry run compile-markdown

	cp -r site/ build/

	# Copy static assets
	cp -r site/filesystem/blog/assets dist/blog/
	cp -r site/filesystem/assets dist/
	cp -r site/filesystem/toys/*.js site/filesystem/toys/*.png dist/toys/
	cp -r site/*.css site/*.png site/*.xml site/*ico site/*.svg site/*.webmanifest site/ttf site/woff2 dist/

	# Generate toy html pages
	poetry run build-toys

	# Build js and index html
	poetry run build-filesystem > build/javascript/shell/filesystem.js
	esbuild build/javascript/application.js --bundle --minify --outfile=build/application.js

	set -e ;\
	JSHASH=$$(sha256sum build/application.js | awk '{print $$1}') ;\
	CSSHASH=$$(sha256sum build/shell.css | awk '{print $$1}') ;\
	mv build/application.js dist/application.$$JSHASH.js ;\
	mv build/shell.css dist/shell.$$CSSHASH.css ;\
	poetry run build-index $$JSHASH $$CSSHASH > dist/index.html ;
	poetry run build-alt-index > dist/home.html

watch:
	find site/ Makefile blog_builder pyproject.toml poetry.lock -type f | entr make

server: dist/index.html
	cd dist/; python -m http.server 8000
# TODO: dev target that just symlinks
