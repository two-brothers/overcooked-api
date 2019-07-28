## Create database cluster
1. `mkdir /home/private/data`
1. `mkdir /home/private/logs`
1. `touch /home/private/logs/logfile.txt`
1. `initdb -D /home/private/data`
1. `pg_ctl -D /home/private/data -l /home/private/logs/logfile.txt start`
1. `whoami | createdb`  \[ `psql` attempts to connect to a database with the active user if no database is specified ]


## Set up Overcooked user and databases

I don't know how to do this automatically without including the password in the script so I will just describe the steps.

1. Choose a strong password for the `overcooked_admin` postgresql account
1. `psql -c` **"CREATE ROLE overcooked_admin WITH LOGIN PASSWORD '\<password>';"**
1. `psql -c` **"ALTER ROLE overcooked_admin CREATEDB;"**
1. `psql -U overcooked_admin -c` **"CREATE DATABASE overcooked;"**
1. `psql -U overcooked_admin -d overcooked -f create_tables.psql -f populate_records.psql`

## Stop the service
1. `pg_ctl -D /home/private/data stop`
