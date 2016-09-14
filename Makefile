BIN = ./node_modules/.bin
SCRIPTS = ./scripts
TESTS = $(shell find ./test -type f -name '*-test.js')

.PHONY: lint test

bootstrap:
	@npm install

lint:
	@$(BIN)/standard

test: lint
	@NODE_ENV=test $(BIN)/mocha $(TESTS)

test-watch:
	@NODE_ENV=test $(BIN)/mocha -w $(TESTS)

compile:
	NODE_ENV=production $(BIN)/babel src --out-dir dist --copy-files