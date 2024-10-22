#!/bin/bash
set -e
psql -v --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE companywatchlist
    \c companywatchlist;
    DROP DATABASE IF EXISTS mydatabase;
    DROP DATABASE IF EXISTS postgres;
EOSQL
