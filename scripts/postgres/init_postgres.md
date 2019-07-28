## Script

**You can run `npm init-db` to reproduce the following steps**

First, create a `postgres-password.js` file with the line:
> module.exports = '< password >'

## Create database cluster
1. `mkdir ./data/postgres`
1. `mkdir ./log`
1. `touch ./log/postgres.log.txt`
1. `initdb -D ./data/postgres`
1. `pg_ctl -D ./data/postgres -l ./log/postgres.log.txt start`
1. `whoami | createdb`  \[ `psql` attempts to connect to a database with the active user if no database is specified ]


## Set up Overcooked user and databases

1. Choose a strong password for the `overcooked_admin` postgresql account
1. `psql -c` **"CREATE ROLE overcooked_admin WITH LOGIN PASSWORD '\<password>';"**
1. `psql -c` **"ALTER ROLE overcooked_admin CREATEDB;"**
1. `psql -U overcooked_admin -c` **"CREATE DATABASE overcooked;"**
1. `psql -U overcooked_admin -d overcooked -f create_tables.psql -f populate_records.psql`

## Stop the service
1. `pg_ctl -D ./data/postgres stop`
