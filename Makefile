.PHONY: install dev build lint format test clean

install:
	pnpm install
	make -C server install

dev:
	pnpm dev

build:
	pnpm build:web

lint:
	pnpm lint
	make -C server check-lint

format:
	pnpm exec prettier --write "web/src/**/*.{ts,tsx,css}"
	make -C server format

test:
	pnpm test

clean:
	pnpm clean
	rm -rf node_modules
