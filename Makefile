BIN = ./node_modules/.bin

.PHONY: lint test

lint:
	@$(BIN)/standard

test: lint
	@NODE_ENV=test $(BIN)/mocha $(TESTS)