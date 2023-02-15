#!/usr/bin/env python3

from datetime import datetime
import json
import os
import requests
import sys
import time


def convert_dict_to_float(aDict):
    return float(aDict['$numberDouble'])


def convert_dict_to_date(aDict):
    date_to_use = None
    if isinstance(aDict, dict):
        if date_value := aDict.get('$date'):
            maybe_date = date_value
            if isinstance(maybe_date, dict):
                date_value = maybe_date.get('$numberLong')
                date_to_use = datetime.utcfromtimestamp(
                    int(date_value)/1000.0).strftime('%Y-%m-%dT%H:%M:%S.%f')
            else:
                date_to_use = maybe_date
    return date_to_use


def convert_case(case):
    """Some cases in the sample file are in some mongoexport format that defines types of numbers.
    Decomplect that information so they're compatible with the API's expectation."""
    converted = dict(case)
    if vaccination := case.get('vaccination'):
        date = vaccination['vaccineDate']
        converted['vaccination']['vaccineDate'] = convert_dict_to_date(date)
    if travelHistory := case.get('travelHistory'):
        date = travelHistory['travelHistoryEntry']
        converted['travelHistory']['travelHistoryEntry'] = convert_dict_to_date(
            date)
    events = case.get('events')
    if events.get('dateEntry'):
        dateEntry = events['dateEntry']
        converted['events']['dateEntry'] = convert_dict_to_date(dateEntry)
    if events.get('dateOnset'):
        dateOnset = events['dateOnset']
        converted['events']['dateOnset'] = convert_dict_to_date(dateOnset)
    if events.get('dateLastModified'):
        dateLastModified = events['dateLastModified']
        converted['events']['dateLastModified'] = convert_dict_to_date(
            dateLastModified)
    if events.get('dateConfirmation'):
        dateConfirmation = events['dateConfirmation']
        converted['events']['dateConfirmation'] = convert_dict_to_date(
            dateConfirmation)
    if events.get('dateOfFirstConsult'):
        dateOfFirstConsult = events['dateOfFirstConsult']
        converted['events']['dateOfFirstConsult'] = convert_dict_to_date(
            dateOfFirstConsult)
    if events.get('dateHospitalization'):
        dateHospitalization = events['dateHospitalization']
        converted['events']['dateHospitalization'] = convert_dict_to_date(
            dateHospitalization)
    if events.get('dateDischargeHospital'):
        dateDischargeHospital = events['dateDischargeHospital']
        converted['events']['dateDischargeHospital'] = convert_dict_to_date(
            dateDischargeHospital)
    if events.get('dateAdmissionICU'):
        dateAdmissionICU = events['dateAdmissionICU']
        converted['events']['dateAdmissionICU'] = convert_dict_to_date(
            dateAdmissionICU)
    if events.get('dateDischargeICU'):
        dateDischargeICU = events['dateDischargeICU']
        converted['events']['dateDischargeICU'] = convert_dict_to_date(
            dateDischargeICU)
    if events.get('dateIsolation'):
        dateIsolation = events['dateIsolation']
        converted['events']['dateIsolation'] = convert_dict_to_date(
            dateIsolation)
    if events.get('dateDeath'):
        dateDeath = events['dateDeath']
        converted['events']['dateDeath'] = convert_dict_to_date(dateDeath)
    if events.get('dateRecovered'):
        dateRecovered = events['dateRecovered']
        converted['events']['dateRecovered'] = convert_dict_to_date(
            dateRecovered)

    return converted


def api_key_for_generated_curator(base_url: str) -> str:
    """Create a user and retrieve their API key."""
    register_user_endpoint = f'{base_url}/auth/register'
    user = {
        'name': 'G.h test data importer',
        'email': f'robot_{time.time()}@global.health',
        'roles': ['curator'],
    }
    try:
        response = requests.post(register_user_endpoint, json=user)
        if response.ok:
            return response.json()['apiKey']
        else:
            print(f'Failure registering test user: {response.text}')
            sys.exit(1)
    except (requests.ConnectionError, requests.ConnectTimeout, requests.HTTPError, requests.ReadTimeout, requests.Timeout) as e:
        print(f'Error {e} registering a curator at {base_url}')
        sys.exit(1)


def main():
    """Import sample data from ../../samples/cases.json into a G.h instance at $GH_BASE_URL
    (by default, the local-testing instance on localhost) using the curator API.
    This is done through the curator-service rather than loading directly into the database
    via mongoimport because the links to other collections, particularly the age buckets, need
    setting up in the application.

    You can set an API key using the environment variable $GH_API_KEY. If you do not, then
    this script will register a new curator user and use their API key; this only works in
    local testing."""
    base_url = os.getenv('GH_BASE_URL', 'http://localhost:3001')
    if not (api_key := os.getenv('GH_API_KEY')):
        api_key = api_key_for_generated_curator(base_url)
    batch_upsert_endpoint = f"{base_url}/api/cases/batchUpsert"
    with open("../../samples/day0cases.json") as f:
        sample_cases = json.load(f)
        converted_cases = [convert_case(c) for c in sample_cases]
        request_body = {
            "cases": converted_cases
        }
        request_headers = {
            'X-Api-Key': api_key
        }
        try:
            response = requests.post(
                batch_upsert_endpoint, json=request_body, headers=request_headers)
            if response.ok:
                report = response.json()
                print(
                    f"Success response from API. {report['numCreated']} cases created, {report['numUpdated']} updated.")
                if errors := report.get('errors'):
                    print(f"Errors: {errors}")
                sys.exit(0)
            else:
                print("Unsuccessful in importing sample cases")
                print(response.text)
                sys.exit(1)
        except (requests.ConnectionError, requests.ConnectTimeout, requests.HTTPError, requests.ReadTimeout, requests.Timeout) as e:
            print(f'Error {e} upserting sample cases to {base_url}')
            sys.exit(1)


if __name__ == '__main__':
    main()
