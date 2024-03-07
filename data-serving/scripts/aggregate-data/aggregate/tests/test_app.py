import json
import app
import moto
import boto3
import pytest
import os
import mongomock
import pymongo
from botocore.exceptions import ClientError
from freezegun import freeze_time
import datetime


S3_AGGREGATE_BUCKET = os.environ['S3_AGGREGATE_BUCKET']
S3_MAP_DATA_BUCKET = os.environ['S3_MAP_DATA_BUCKET']

CASES = [
    {
        "caseStatus": "confirmed",
        "location": {
            "country": "Germany",
            "countryISO3": "DEU",
            "geoResolution": "Admin3",
            "location": "",
            "admin1": "Brandenburg",
            "admin1WikiId": "Q1208",
            "admin2": "LK Potsdam-Mittelmark",
            "admin2WikiId": "Q6142",
            "admin3": "Brück",
            "admin3WikiId": "Q622858",
            "query": "Brück,LK Potsdam-Mittelmark,Brandenburg,Germany"
        },
        "revisionMetadata": {
            "updateMetadata": {
                "date": datetime.datetime(2024, 1, 21)
            }
        }
    },
    {
        "caseStatus": "confirmed",
        "location": {
            "country": "Germany",
            "countryISO3": "DEU",
            "geoResolution": "Admin3",
            "location": "",
            "admin1": "Brandenburg",
            "admin1WikiId": "Q1208",
            "admin2": "LK Potsdam-Mittelmark",
            "admin2WikiId": "Q6142",
            "admin3": "Borkwalde",
            "admin3WikiId": "Q623947",
            "query": "Borkwalde,LK Potsdam-Mittelmark,Brandenburg,Germany"
        },
        "revisionMetadata": {
            "updateMetadata": {
                "date": datetime.datetime(2024, 1, 22)
            }
        }

    },
    {
        "caseStatus": "confirmed",
        "location": {
            "country": "Germany",
            "countryISO3": "DEU",
            "geoResolution": "Admin3",
            "location": "",
            "admin1": "Brandenburg",
            "admin1WikiId": "Q1208",
            "admin2": "SK Potsdam",
            "admin2WikiId": "Q1711",
            "admin3": "Potsdam",
            "admin3WikiId": "Q1711",
            "query": "Potsdam,SK Potsdam,Brandenburg,Germany"
        },
        "revisionMetadata": {
            "updateMetadata": {
                "date": datetime.datetime(2024, 1, 23)
            }
        }
    },
    {
        "caseStatus": "confirmed",
        "location": {
            "country": "Germany",
            "countryISO3": "DEU",
            "geoResolution": "Admin3",
            "location": "",
            "admin1": "Baden-Württemberg",
            "admin1WikiId": "Q985",
            "admin2": "LK Heilbronn",
            "admin2WikiId": "Q7166",
            "admin3": "Eberstadt",
            "admin3WikiId": "Q507455",
            "query": "Eberstadt,LK Heilbronn,Baden-Württemberg,Germany"
        },
        "revisionMetadata": {
            "updateMetadata": {
                "date": datetime.datetime(2024, 1, 24)
            }
        }
    }
]

mocked_adm0_map_data = {
    "DEU": {
        "featureId": 5574713,
        "lat": 51.3283,
        "long": 10.5807,
        "label": "Germany",
        "bounds": [5.8663, 47.2702, 15.0418, 55.0568]
    }
}

mocked_adm1_map_data = {
    "Q1208": {
        'featureId': 791097,
        'lat': 52.4725,
        'long': 14.1414,
        'label': 'Brandenburg',
        "bounds": [11.2658,51.359,14.7657,53.5591]
    },
    "Q985": {
        'featureId': 528953,
        'lat': 48.6746,
        'long': 9.0825,
        'label': 'Baden-Württemberg',
        'bounds': [50.5021,26.124,50.6618,26.2586]
    }
}

mocked_adm2_map_data = {
    "Q6142": {
        'featureId': 22221881,
        'lat': 52.2692,
        'long': 12.7022,
        'label': 'LK Potsdam-Mittelmark',
        'bounds': [12.2158, 51.9794, 13.3123, 52.5572]
    },
    "Q1711": {
        'featureId': 21566521,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'SK Potsdam',
        'bounds': [12.8872, 52.3419, 13.168, 52.5146]
    },
    "Q7166": {
        'featureId': 12194873,
        'lat': 49.2044,
        'long': 9.2936,
        'label': 'LK Heilbronn',
        'bounds': [8.8161, 49.0203, 9.5276, 49.3876]
    }
}

mocked_adm3_map_data = {
    "Q622858": {
        'featureId': 700519993,
        'lat': 52.1979,
        'long': 12.7618,
        'label': 'Brück',
        'bounds': [12.6323, 52.1483, 12.8563, 52.2476]
    },
    "Q623947": {
        'featureId': 459871801,
        'lat': 52.2617,
        'long': 12.8176,
        'label': 'Borkwalde',
        'bounds': [12.8083, 52.2465, 12.8503, 52.2764]
    },
    "Q1711": {
        'featureId': 42473017,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'Potsdam',
        'bounds': [12.8872, 52.3419, 13.168, 52.5146]
    },
    "Q507455": {
        'featureId': 388503097,
        'lat': 49.1827,
        'long': 9.3354,
        'label': 'Eberstadt',
        'bounds': [9.2931, 49.1648, 9.3699, 49.1999]
    }
}

expected_adm0_json = [
    {
        'featureId': 5574713,
        'lat': 51.3283,
        'long': 10.5807,
        'label': 'Germany',
        'caseCount': 4,
        'lastUpdated': '2024-01-24',
        'countryCode': 'DEU',
        'bounds': [5.8663, 47.2702, 15.0418, 55.0568]
    }
]

expected_adm1_json = [
    {
        'featureId': 791097,
        'lat': 52.4725,
        'long': 14.1414,
        'label': 'Brandenburg',
        'caseCount': 3,
        'lastUpdated': '2024-01-23',
        'countryCode': 'DEU',
        'bounds': [11.2658, 51.359, 14.7657, 53.5591]
    },
    {
        'featureId': 528953,
        'lat': 48.6746,
        'long': 9.0825,
        'label': 'Baden-Württemberg',
        'caseCount': 1,
        'lastUpdated': '2024-01-24',
        'countryCode': 'DEU',
        'bounds': [50.5021, 26.124, 50.6618, 26.2586]
    }
]

expected_adm2_json = [
    {
        'featureId': 21566521,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'SK Potsdam',
        'caseCount': 1,
        'lastUpdated': '2024-01-23',
        'countryCode': 'DEU',
        'bounds': [12.8872, 52.3419, 13.168, 52.5146]
    },
    {
        'featureId': 22221881,
        'lat': 52.2692,
        'long': 12.7022,
        'label': 'LK Potsdam-Mittelmark',
        'caseCount': 2,
        'lastUpdated': '2024-01-22',
        'countryCode': 'DEU',
        'bounds': [12.2158, 51.9794, 13.3123, 52.5572]
    },
    {
        'featureId': 12194873,
        'lat': 49.2044,
        'long': 9.2936,
        'label': 'LK Heilbronn',
        'caseCount': 1,
        'lastUpdated': '2024-01-24',
        'countryCode': 'DEU',
        'bounds': [8.8161, 49.0203, 9.5276, 49.3876]
    }
]

expected_adm3_json = [
    {
        "featureId": 42473017,
        "lat": 52.4285,
        "long": 13.0244,
        "label": "Potsdam",
        "caseCount": 1,
        "lastUpdated": "2024-01-23",
        "countryCode": "DEU",
        "bounds": [12.8872, 52.3419, 13.168, 52.5146]
    },
    {
        "featureId": 388503097,
        "lat": 49.1827,
        "long": 9.3354,
        "label": "Eberstadt",
        "caseCount": 1,
        "lastUpdated": "2024-01-24",
        "countryCode": "DEU",
        "bounds": [9.2931, 49.1648, 9.3699, 49.1999]
    },
    {
        "featureId": 700519993,
        "lat": 52.1979,
        "long": 12.7618,
        "label": "Brück",
        "caseCount": 1,
        "lastUpdated": "2024-01-21",
        "countryCode": "DEU",
        "bounds": [12.6323, 52.1483, 12.8563, 52.2476]
    },
    {
        "featureId": 459871801,
        "lat": 52.2617,
        "long": 12.8176,
        "label": "Borkwalde",
        "caseCount": 1,
        "lastUpdated": "2024-01-22",
        "countryCode": "DEU",
        "bounds": [12.8083, 52.2465, 12.8503, 52.2764]
    }
]


@pytest.fixture(scope='module')
def s3():
    with moto.mock_aws():
        os.environ['AWS_ACCESS_KEY_ID'] = 'test'
        os.environ['AWS_SECRET_ACCESS_KEY'] = 'test'
        os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'
        s3 = boto3.client("s3", endpoint_url=os.environ.get("S3_ENDPOINT"))
        s3.create_bucket(Bucket=S3_MAP_DATA_BUCKET)
        s3.create_bucket(Bucket=S3_AGGREGATE_BUCKET)
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(mocked_adm0_map_data),
            Bucket=S3_MAP_DATA_BUCKET,
            Key='adm0_map_data.json',
        )
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(mocked_adm1_map_data),
            Bucket=S3_MAP_DATA_BUCKET,
            Key='adm1_map_data.json',
        )
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(mocked_adm2_map_data),
            Bucket=S3_MAP_DATA_BUCKET,
            Key='adm2_map_data.json',
        )
        s3.put_object(
            ACL="public-read",
            Body=json.dumps(mocked_adm3_map_data),
            Bucket=S3_MAP_DATA_BUCKET,
            Key='adm3_map_data.json',
        )
        yield s3


@freeze_time("2024-02-01")
@mongomock.patch(servers=((os.environ['CONN']),))
def test_count_dataframe(s3):
    objects = CASES
    client = pymongo.MongoClient(os.environ['CONN'])
    client[os.environ['DATABASE_NAME']].day0cases.insert_many(objects)

    # We check if there are no objects in the bucket
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin0/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin0/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin1/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin0/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin1/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin2/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin3/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin3/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    app.main()

    # We check if the newly created objects are in the bucket
    s3_adm0_latest_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin0/latest.json')
    s3_adm0_latest_json = json.loads(s3_adm0_latest_obj['Body'].read())
    assert s3_adm0_latest_json == expected_adm0_json
    s3_adm0_dated_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin0/02-01-2024.json')
    s3_adm0_dated_json = json.loads(s3_adm0_dated_obj['Body'].read())
    assert s3_adm0_dated_json == expected_adm0_json

    s3_adm1_latest_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin1/latest.json')
    s3_adm1_latest_json = json.loads(s3_adm1_latest_obj['Body'].read())
    assert s3_adm1_latest_json == expected_adm1_json
    s3_adm1_dated_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin1/02-01-2024.json')
    s3_adm1_dated_json = json.loads(s3_adm1_dated_obj['Body'].read())
    assert s3_adm1_dated_json == expected_adm1_json

    s3_adm2_latest_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin2/latest.json')
    s3_adm2_latest_json = json.loads(s3_adm2_latest_obj['Body'].read())
    assert s3_adm2_latest_json == expected_adm2_json
    s3_adm2_dated_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin2/02-01-2024.json')
    s3_adm2_dated_json = json.loads(s3_adm2_dated_obj['Body'].read())
    assert s3_adm2_dated_json == expected_adm2_json

    s3_adm3_latest_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin3/latest.json')
    s3_adm3_latest_json = json.loads(s3_adm3_latest_obj['Body'].read())
    assert s3_adm3_latest_json == expected_adm3_json
    s3_adm3_dated_obj = s3.get_object(Bucket=S3_AGGREGATE_BUCKET, Key='admin3/02-01-2024.json')
    s3_adm3_dated_json = json.loads(s3_adm3_dated_obj['Body'].read())
    assert s3_adm3_dated_json == expected_adm3_json
