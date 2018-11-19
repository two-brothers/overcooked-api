#!/usr/bin/env bash

# Run mocha over all the spec files
mocha './!(node_modules)/**/*.spec.js' --reporter mochawesome