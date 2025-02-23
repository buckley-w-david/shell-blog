.PHONY: all server watch

all: dist/index.html

dist/index.html: $(shell find site -type f)
	uv run build

watch:
	find site/ blog_builder/ pyproject.toml -type f | entr make

server:
	cd dist/; python -m http.server 8000

# TODO: dev target that just symlinks
