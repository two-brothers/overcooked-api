# Seed Project: Express

## Overview

This branch creates a basic express server featuring:
* gzip compression
* server-side sessions with:
   * A random 256-bit secret
   * An expiration of 30 mins since last use
* logging to the `log` directory (cleared with each build)
* a default `index.html`
* an initial route (`/dummy`)
* a `404` error handler for undefined routes
* a `500` error handler for unhandled errors in defined routes

## Usage

1. Run the `initialise.sh` script
1. Use the npm script commands to build/serve the server