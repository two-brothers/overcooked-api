#!/usr/bin/env bash

# Must be created manually with the line "module.exports = '< password >'"
PASSWORD_FILE='./postgres-password.js';

DATA_DIR='./data/postgres';
SCRIPTS_DIR='./scripts/postgres';
LOG_FILE='./log/postgres.log.txt';

USER_DB=$(whoami);
ADMIN='overcooked_admin'
DB='overcooked'
PASSWORD=$(cat $PASSWORD_FILE | sed 's/^.*= //g');

# clear previous database
if [ -d $DATA_DIR ]; then
  pg_ctl -D $DATA_DIR stop
  rm -r $DATA_DIR;
  mkdir $DATA_DIR;
  rm $LOG_FILE;
  touch $LOG_FILE;
fi

initdb -D $DATA_DIR;
echo "host $DB $ADMIN all md5" >> $DATA_DIR/pg_hba.conf;
pg_ctl -D $DATA_DIR -l $LOG_FILE start;

createdb $USER_DB; # psql attempts to connect to a database with the active user if no database is specified

psql -c "CREATE ROLE $ADMIN WITH LOGIN PASSWORD $PASSWORD;";
psql -c "ALTER ROLE $ADMIN CREATEDB;";
psql -U overcooked_admin -d $USER_DB -c "CREATE DATABASE $DB;";
psql -U overcooked_admin -d overcooked -f ${SCRIPTS_DIR}/create_tables.psql -f ${SCRIPTS_DIR}/populate_records.psql;

pg_ctl -D $DATA_DIR stop;

