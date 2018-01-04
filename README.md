# Seed Project: Express Mongoose

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

## Usage

1. Run the `initialise.sh` script
1. Use the npm script commands to
   * open a connection to the local database
   * build/serve the server