#!/bin/bash
# Full data export

set -xeuo pipefail

require_env() {
  if [ -z "$1" ]; then
      echo "$2"
      exit 1
  fi
}

require_env "${FULL_EXPORT_BUCKET:-}" "Specify FULL_EXPORT_BUCKET"
require_env "${CONN:-}" "Specify MongoDB connection string in CONN"

mongoexport --uri="$CONN" --queryFile="query.json" --collection=day0cases --fieldFile=fields.txt --type=csv --out full.csv

gzip full.csv

aws s3 cp full.csv.gz "s3://${FULL_EXPORT_BUCKET}/csv/"
