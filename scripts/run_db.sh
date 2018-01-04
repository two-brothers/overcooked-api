#!/usr/bin/env bash

# remove the database logs from the previous connection
rm -f log/db/mongoose.log*

mongod --dbpath ./data/db --logpath ./log/db/mongoose.log