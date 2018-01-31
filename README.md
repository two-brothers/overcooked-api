# Seed Project: Express Mocha Mongoose Swagger

## Overview

This branch creates a basic express server featuring:
* gzip compression
* server-side sessions with:
   * A random 256-bit secret
   * An expiration of 30 mins since last use
* storage of the session in a mongoose database
* logging to the `log` directory (cleared with each build)
* a default `index.html`
* a Mongoose database table `Dummy`
* an initial route (`/dummy`) that exposes CRUD database operations through HTTP requests
* a `404` error handler for undefined routes
* a `500` error handler for unhandled errors in defined routes

It serves the Swagger documentation at `/api`
It also include mocha integration tests for the `/dummy` route

## Usage

1. Run the `initialise.sh` script
1. Use the npm script commands to
   * open a connection to the local database
   * build/serve the server
   * run the mocha tests

## Extend

1. Add new routes to `server.js` appropriate
1. Update the `api/api.yaml` file to match

