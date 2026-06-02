.PHONY: install dev build lint format test clean

install:
	pnpm install

dev:
	pnpm dev

build:
	pnpm build

lint:
	pnpm lint

format:
	pnpm exec prettier --write .

test:
	pnpm test

clean:
	rm -rf .next node_modules
