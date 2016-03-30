BIN = ./node_modules/.bin
SCRIPTS = ./scripts
TESTS = $(shell find ./test -type f -name '*-test.js')

.PHONY: lint test

lint:
	@$(BIN)/standard

test: lint generate-fixtures
	@NODE_ENV=test $(BIN)/mocha $(TESTS)

test-watch: generate-fixtures
	@NODE_ENV=test DEBUG=gcs-browser-upload $(BIN)/mocha -w $(TESTS)

generate-fixtures:
	$(SCRIPTS)/generateFixtures.js