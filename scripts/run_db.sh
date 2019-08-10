#!/usr/bin/env bash

postgres -D data/postgres -r log/postgres.log.txt > log/rundb.stdout 2> log/rundb.stderr
