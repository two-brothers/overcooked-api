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
)
for p in ${packages[*]}; do
  npm install --save $p@latest
done;

dev_packages=(
  'mocha'
  'chai'
  'chai-http'
)
for p in ${dev_packages[*]}; do
  npm install --save-dev $p@latest
done;
