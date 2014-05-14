ROOT := $(shell pwd)
MOCHA_TESTS := $(shell find test/ -name '*.mocha.coffee')
MOCHA := ./node_modules/mocha/bin/mocha

g = "."

test-mocha:
	@NODE_ENV=test $(MOCHA) \
		--grep "$(g)" \
		$(MOCHA_TESTS)

test: test-mocha
