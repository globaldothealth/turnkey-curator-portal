#!/bin/bash
# Full data export
# Depends: aws-cli

set -xeuo pipefail
source ./common.sh
require_env "${FULL_EXPORT_BUCKET:-}" "Specify FULL_EXPORT_BUCKET"
require_env "${GDOTH_API_BASEURL:-}" "Specify GDOTH_API_BASEURL"
require_env "${GDOTH_API_KEY:-}" "Specify GDOTH_API_KEY"
require_env "${CONN:-}" "Specify MongoDB connection string in CONN"


SCRATCH="$(mktemp -d)"
BUCKETS="${SCRATCH}/buckets.json"
ALL_DATA="${SCRATCH}/all_data.json"
trap 'rm -rf "$SCRATCH"' EXIT  # Cleanup before exit

FORMAT="${FORMAT:-csv,tsv,json}"
QUERY="{}"

mongoexport --uri="$CONN" --collection=ageBuckets --type=json --jsonArray -o "${BUCKETS}"
mongoexport --query="$QUERY" --uri="$CONN" --collection=day0cases \
    --fieldFile=fields.txt --type=csv -o "${ALL_DATA}"
python3 transform.py -f "$FORMAT" -b "${BUCKETS}" -i "${ALL_DATA}" "full"

# ignore shellcheck warning on word splitting, as it's actually needed here
# shellcheck disable=SC2086
for fmt in ${FORMAT//,/ }
do
   test -f "full.${fmt}.gz" && aws s3 cp "full.${fmt}.gz" "s3://${FULL_EXPORT_BUCKET}/${fmt}/"
   rm "full.${fmt}.gz"
done
