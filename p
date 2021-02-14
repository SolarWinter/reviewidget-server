#!/bin/sh
case "$1" in
  dev)
    psql "postgres://postgres:postgres@localhost:5432/reviewidget_dev"
    ;;
  test)
    psql "postgres://postgres:postgres@localhost:5432/reviewidget_test"
    ;;
  *)
    echo "No database URL for $1"
    ;;
esac
