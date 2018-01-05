#!/usr/bin/env bash

echo -n "Enter Project name: "
read projname

echo "Creating a customised package.json..."
echo -n '{
  "name": "'$projname'",
  "version": "0.0.1",
  "author": "Nikesh Nazareth",
  "license": "ISC",
  "scripts": {
    "db": "scripts/run_db.sh",
    "serve": "scripts/build_and_serve.sh",
    "test": "scripts/test.sh"
  }
}' > package.json

echo "Installing the latest version of the required packages..."
packages=(
  'express-session'
  'express'
  'compression'
  'http'
  'body-parser'
  'morgan'
  'file-stream-rotator'
  'path'
  'secure-random'
  'mongoose'
  'connect-mongo'
)
for p in ${packages[*]}; do
  npm install --save $p@latest
done;

dev_packages=(
  'chai'
  'chai-http'
  'mocha'
)
for p in ${dev_packages[*]}; do
  npm install --save-dev $p@latest
done;
npm install --save-dev mockgoose@6.0.8; # The latest version (7.3.3) throw errors

echo "Setting up the mongoose database..."
echo -n "
const name = 'mongodb://localhost/$projname';
module.exports = name;
" > db.name.js

mkdir -p data/db
mkdir -p log/db
