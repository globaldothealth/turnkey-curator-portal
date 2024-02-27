#!/usr/bin/env python3

import datetime
import json
import logging
import os
import sys
import urllib
from typing import Any, Callable, Optional

import boto3
import pandas as pd
import pymongo
import iso3166


def upload(S3, data: str, bucket: str, keys: list[str]):
    """Upload data to S3

    data -- Data to upload as a string
    bucket -- S3 bucket to upload to
    keys -- List of S3 paths to upload to
    """
    for key in keys:
        logging.info(f"Uploading data to {key} in {bucket}")
        try:
            S3.put_object(
                ACL="public-read",
                Body=data,
                Bucket=bucket,
                Key=key,
            )
        except Exception as e:
            logging.exception(f"Failed to upload data to s3://{bucket}/{key}")


def setup_logger():
    h = logging.StreamHandler(sys.stdout)
    rootLogger = logging.getLogger()
    rootLogger.addHandler(h)
    rootLogger.setLevel(logging.INFO)


def map_adm0(adm0_entry, adm0_map_data):
    id = adm0_entry.get('_id', '')
    caseCount = adm0_entry.get('caseCount', 0)
    countryCode = adm0_entry.get('countryCode', 0)
    lastUpdated = adm0_entry.get('lastUpdated', '')
    if lastUpdated != '':
        lastUpdated = lastUpdated.strftime("%Y-%m-%d")
    if id == '':
        return {"name": "", "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": ''}
    return {**adm0_map_data[id], "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": countryCode}


def aggregate_adm0(cases, adm0_map_data):
    adm0_counts = list(cases.aggregate(
        [{"$match": {"caseStatus": "confirmed"}}, {"$group": {"_id": "$location.countryISO3", "caseCount": {"$sum": 1}, "lastUpdated": {"$max": "$revisionMetadata.updateMetadata.date"}, "countryCode": {"$first": "$location.countryISO3"}}}]))
    return list(map(lambda e: map_adm0(e, adm0_map_data), adm0_counts))


def map_adm1(adm1_entry, adm1_map_data):
    id = adm1_entry.get('_id', '')
    caseCount = adm1_entry.get('caseCount', 0)
    countryCode = adm1_entry.get('countryCode', 0)
    lastUpdated = adm1_entry.get('lastUpdated', '')
    if lastUpdated != '':
        lastUpdated = lastUpdated.strftime("%Y-%m-%d")
    if id == '':
        return {"name": "", "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": ''}
    return {**adm1_map_data[id], "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": countryCode}


def aggregate_adm1(cases, adm1_map_data):
    adm1_counts = list(cases.aggregate(
        [{"$match": {"caseStatus": "confirmed"}}, {"$group": {"_id": "$location.admin1WikiId", "caseCount": {"$sum": 1}, "lastUpdated": {"$max": "$revisionMetadata.updateMetadata.date"}, "countryCode": {"$first": "$location.countryISO3"}}}]))
    return list(map(lambda e: map_adm1(e, adm1_map_data), adm1_counts))


def map_adm2(adm2_entry, adm2_map_data):
    id = adm2_entry.get('_id', '')
    caseCount = adm2_entry.get('caseCount', 0)
    countryCode = adm2_entry.get('countryCode', 0)
    lastUpdated = adm2_entry.get('lastUpdated', '')
    if lastUpdated != '':
        lastUpdated = lastUpdated.strftime("%Y-%m-%d")
    if id == '':
        return {"name": "", "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": ''}
    return {**adm2_map_data[id], "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": countryCode}


def aggregate_adm2(cases, adm2_map_data):
    adm2_counts = list(cases.aggregate(
        [{"$match": {"caseStatus": "confirmed"}}, {"$group": {"_id": "$location.admin2WikiId", "caseCount": {"$sum": 1}, "lastUpdated": {"$max": "$revisionMetadata.updateMetadata.date"}, "countryCode": {"$first": "$location.countryISO3"}}}]))
    return list(map(lambda e: map_adm2(e, adm2_map_data), adm2_counts))


def map_adm3(adm3_entry, adm3_map_data):
    id = adm3_entry.get('_id', '')
    caseCount = adm3_entry.get('caseCount', 0)
    countryCode = adm3_entry.get('countryCode', 0)
    lastUpdated = adm3_entry.get('lastUpdated', '')
    if lastUpdated != '':
        lastUpdated = lastUpdated.strftime("%Y-%m-%d")
    if id == '':
        return {"name": "", "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": ''}
    return {**adm3_map_data[id], "caseCount": caseCount, "lastUpdated": lastUpdated, "countryCode": countryCode}


def aggregate_adm3(cases, adm3_map_data):
    adm3_counts = list(cases.aggregate(
        [{"$match": {"caseStatus": "confirmed"}}, {"$group": {"_id": "$location.admin3WikiId", "caseCount": {"$sum": 1}, "lastUpdated": {"$max": "$revisionMetadata.updateMetadata.date"}, "countryCode": {"$first": "$location.countryISO3"}}}]))
    return list(map(lambda e: map_adm3(e, adm3_map_data), adm3_counts))


def main():
    # S3 endpoint is allowed to be None (i.e. connect to default S3 endpoint),
    # it's also allowed to be not-None (to use localstack or another test double).
    S3 = boto3.client("s3", endpoint_url=os.environ.get("S3_ENDPOINT"))
    today = datetime.datetime.now().date()

    setup_logger()
    logging.info("WORKING PYTHON")
    if envs := {"CONN", "S3_BUCKET", "S3_MAP_DATA_BUCKET", "DATABASE_NAME"} - set(os.environ):
        logging.info(f"Required {envs} not set in the environment, exiting")
        sys.exit(1)

    bucket = os.environ.get("S3_BUCKET")
    map_data_bucket = os.environ.get("S3_MAP_DATA_BUCKET")
    logging.info("Starting fetching map data from S3")
    try:
        adm0_obj = S3.get_object(Bucket=map_data_bucket, Key='adm0_map_data.json')
        adm0_map_data = json.loads(adm0_obj['Body'].read())
        adm1_obj = S3.get_object(Bucket=map_data_bucket, Key='adm1_map_data.json')
        adm1_map_data = json.loads(adm1_obj['Body'].read())
        adm2_obj = S3.get_object(Bucket=map_data_bucket, Key='adm2_map_data.json')
        adm2_map_data = json.loads(adm2_obj['Body'].read())
        adm3_obj = S3.get_object(Bucket=map_data_bucket, Key='adm3_map_data.json')
        adm3_map_data = json.loads(adm3_obj['Body'].read())
    except Exception as e:
        logging.error(f"Failed to fetch map data from S3: {e}")
        sys.exit(1)

    logging.info("Finished fetching map data from S3")

    logging.info("Getting day0cases from MongoDB")
    client = pymongo.MongoClient(os.environ.get("CONN"))
    db = client[os.environ.get("DATABASE_NAME")]
    cases = db.day0cases
    logging.info("Finished getting day0cases from MongoDB")

    logging.info("Starting aggregation")

    adm0_counts = aggregate_adm0(cases, adm0_map_data)
    logging.info(f"Finished admin 0 aggregation with {len(adm0_counts)} entries")

    adm1_counts = aggregate_adm1(cases, adm1_map_data)
    logging.info(f"Finished admin 1 aggregation with {len(adm1_counts)} entries")

    adm2_counts = aggregate_adm2(cases, adm2_map_data)
    logging.info(f"Finished admin 2 aggregation with {len(adm2_counts)} entries")

    adm3_counts = aggregate_adm3(cases, adm3_map_data)
    logging.info(f"Finished admin 3 aggregation with {len(adm3_counts)} entries")

    logging.info("Finished aggregation")

    upload(
        S3,
        json.dumps(adm0_counts),
        bucket,
        ["admin0/latest.json", f"admin0/{today.strftime('%m-%d-%Y')}.json"],
    )

    upload(
        S3,
        json.dumps(adm1_counts),
        bucket,
        ["admin1/latest.json", f"admin1/{today.strftime('%m-%d-%Y')}.json"],
    )

    upload(
        S3,
        json.dumps(adm2_counts),
        bucket,
        ["admin2/latest.json", f"admin2/{today.strftime('%m-%d-%Y')}.json"],
    )

    upload(
        S3,
        json.dumps(adm3_counts),
        bucket,
        ["admin3/latest.json", f"admin3/{today.strftime('%m-%d-%Y')}.json"],
    )


if __name__ == "__main__":
    main()
