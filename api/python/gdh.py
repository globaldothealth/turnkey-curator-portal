# Depends: requests pandas
# You may already have these installed, otherwise install using pip:
#     pip install requests pandas

# Example invocations:
# >>> from gdh import get_cases
# >>> key = "API KEY HERE"
# >>> c1 = get_cases(key, country="New Zealand")
# >>> c2 = get_cases(key, country="New Zealand", admin1="Auckland")
#
# Use get_cached_cases() to cache the cases locally. This is useful for
# rerunning the script which will then use the cached version.

import os
import io
import json
import hashlib
import datetime

import requests
import pandas as pd

GDH_URL_DEFAULT = "https://data.covid-19.global.health"
GDH_URL = os.getenv("GDH_URL", GDH_URL_DEFAULT)
downloadAsync = "/api/cases/downloadAsync"

# sync with data-serving/data-service/src/util/search.ts
FILTERS = {
    "curator",
    "gender",
    "nationality",
    "occupation",
    "country",
    "outcome",
    "caseid",
    "uploadid",
    "sourceid",
    "sourceurl",
    "verificationstatus",
    "admin1",
    "admin2",
    "admin3",
    "variant",
    "dateconfirmedafter",
    "dateconfirmedbefore",
}


def stringify_filters(**kwargs):
    if not kwargs:
        raise ValueError("At least one filter has to be specified")
    if unknown_filters := set(kwargs) - FILTERS:
        raise ValueError(f"Unknown filters: {unknown_filters}")
    kwargs = {
        field: (f"'{value}'" if (isinstance(value, str) and " " in value) else value)
        for field, value in kwargs.items()
    }
    for date_field in ["dateconfirmedafter", "dateconfirmedbefore"]:
        # convert to yyyy-mm-dd if in datetime.date format
        if date_field in kwargs and isinstance(
            kwargs[date_field], datetime.date
        ):
            kwargs[date_field] = kwargs[date_field].isoformat()
    return " ".join(f"{field}:{value}" for field, value in kwargs.items())


def get_cases(apikey, server=GDH_URL, **kwargs):
    res = requests.post(
        f"{server}{downloadAsync}",
        data=json.dumps({"format": "csv", "query": stringify_filters(**kwargs)}),
        headers={"Content-Type": "application/json", "X-API-Key": apikey},
    )
    if res.status_code != 200:
        raise ConnectionError(res.text)
    if "signedUrl" in res.text:
        # country-export returns a gzip compressed file
        signedUrl = json.loads(res.text)["signedUrl"]
        return pd.read_csv(signedUrl, compression="gzip")
    else:
        with io.StringIO(res.text) as buf:
            return pd.read_csv(buf)


def cases_cachefile(server=GDH_URL, folder="cache", **kwargs):
    to_hash = f"{stringify_filters(**kwargs)}|{server}"
    sha256 = hashlib.sha256(to_hash.encode("utf-8")).hexdigest()
    return f"{folder}/{sha256}.csv"


# Returns a cached copy of cases if it exists, otherwise saves to cache
def get_cached_cases(apikey, server=GDH_URL, refresh=False, folder="cache", **kwargs):
    if not os.path.exists(folder):
        os.mkdir(folder)
    cachename = cases_cachefile(server, folder, **kwargs)
    if not refresh and os.path.exists(cachename):
        return pd.read_csv(cachename)
    else:
        df = get_cases(apikey, server, **kwargs)
    df.to_csv(cachename, index=False)
    return df