#!/usr/bin/env bash

# NOTE: open the database in a separate terminal (with run_db.sh) first

# remove the logs from the previous build
rm -f log/*.log

# launch the express server
node www