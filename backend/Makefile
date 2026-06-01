.PHONY: install format lint check-format check-lint test

install:
	uv sync

format:
	uv run ruff format .

check-format:
	uv run ruff format . --check

lint:
	uv run ruff check . --fix

check-lint:
	uv run ruff check .

test:
	uv run pytest tests/
