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


S3_BUCKET = os.environ['S3_BUCKET']
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
        }
    }
]

mocked_adm0_map_data = {
    "DEU": {
        "featureId": 5574713,
        "lat": 51.3283,
        "long": 10.5807,
        "label": "Germany"
    }
}

mocked_adm1_map_data = {
    "Q1208": {
        'featureId': 791097,
        'lat': 52.4725,
        'long': 14.1414,
        'label': 'Brandenburg'
    },
    "Q985": {
        'featureId': 528953,
        'lat': 48.6746,
        'long': 9.0825,
        'label': 'Baden-Württemberg'
    }
}

mocked_adm2_map_data = {
    "Q6142": {
        'featureId': 22221881,
        'lat': 52.2692,
        'long': 12.7022,
        'label': 'LK Potsdam-Mittelmark'
    },
    "Q1711": {
        'featureId': 21566521,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'SK Potsdam'
    },
    "Q7166": {
        'featureId': 12194873,
        'lat': 49.2044,
        'long': 9.2936,
        'label': 'LK Heilbronn'
    }
}

mocked_adm3_map_data = {
    "Q622858": {
        'featureId': 700519993,
        'lat': 52.1979,
        'long': 12.7618,
        'label': 'Brück'
    },
    "Q623947": {
        'featureId': 459871801,
        'lat': 52.2617,
        'long': 12.8176,
        'label': 'Borkwalde'
    },
    "Q1711": {
        'featureId': 42473017,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'Potsdam'
    },
    "Q507455": {
        'featureId': 388503097,
        'lat': 49.1827,
        'long': 9.3354,
        'label': 'Eberstadt'
    }
}

expected_adm0_json = [
    {
        'featureId': 5574713,
        'lat': 51.3283,
        'long': 10.5807,
        'label': 'Germany',
        'count': 4
    }
]

expected_adm1_json = [
    {
        'featureId': 791097,
        'lat': 52.4725,
        'long': 14.1414,
        'label': 'Brandenburg',
        'count': 3
    },
    {
        'featureId': 528953,
        'lat': 48.6746,
        'long': 9.0825,
        'label': 'Baden-Württemberg',
        'count': 1
    }
]

expected_adm2_json = [
    {
        'featureId': 21566521,
        'lat': 52.4285,
        'long': 13.0244,
        'label': 'SK Potsdam', 'count': 1},
    {
        'featureId': 22221881,
        'lat': 52.2692,
        'long': 12.7022,
        'label': 'LK Potsdam-Mittelmark',
        'count': 2
    },
    {
        'featureId': 12194873,
        'lat': 49.2044,
        'long': 9.2936,
        'label': 'LK Heilbronn',
        'count': 1
    }
]

expected_adm3_json = [
    {
        "featureId": 42473017,
        "lat": 52.4285,
        "long": 13.0244,
        "label": "Potsdam",
        "count": 1
    },
    {
        "featureId": 388503097,
        "lat": 49.1827,
        "long": 9.3354,
        "label": "Eberstadt",
        "count": 1
    },
    {
        "featureId": 700519993,
        "lat": 52.1979,
        "long": 12.7618,
        "label": "Brück",
        "count": 1
    },
    {
        "featureId": 459871801,
        "lat": 52.2617,
        "long": 12.8176,
        "label": "Borkwalde",
        "count": 1
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
        s3.create_bucket(Bucket=S3_BUCKET)
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
        s3.get_object(Bucket=S3_BUCKET, Key='admin0/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin0/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin1/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin0/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin1/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin2/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin3/latest.json')
    assert e.typename == 'NoSuchKey'
    with pytest.raises(ClientError) as e:
        s3.get_object(Bucket=S3_BUCKET, Key='admin3/02-01-2024.json')
    assert e.typename == 'NoSuchKey'

    app.main()

    # We check if the newly created objects are in the bucket
    s3_adm0_latest_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin0/latest.json')
    s3_adm0_latest_json = json.loads(s3_adm0_latest_obj['Body'].read())
    assert s3_adm0_latest_json == expected_adm0_json
    s3_adm0_dated_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin0/02-01-2024.json')
    s3_adm0_dated_json = json.loads(s3_adm0_dated_obj['Body'].read())
    assert s3_adm0_dated_json == expected_adm0_json

    s3_adm1_latest_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin1/latest.json')
    s3_adm1_latest_json = json.loads(s3_adm1_latest_obj['Body'].read())
    assert s3_adm1_latest_json == expected_adm1_json
    s3_adm1_dated_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin1/02-01-2024.json')
    s3_adm1_dated_json = json.loads(s3_adm1_dated_obj['Body'].read())
    assert s3_adm1_dated_json == expected_adm1_json

    s3_adm2_latest_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin2/latest.json')
    s3_adm2_latest_json = json.loads(s3_adm2_latest_obj['Body'].read())
    assert s3_adm2_latest_json == expected_adm2_json
    s3_adm2_dated_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin2/02-01-2024.json')
    s3_adm2_dated_json = json.loads(s3_adm2_dated_obj['Body'].read())
    assert s3_adm2_dated_json == expected_adm2_json

    s3_adm3_latest_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin3/latest.json')
    s3_adm3_latest_json = json.loads(s3_adm3_latest_obj['Body'].read())
    assert s3_adm3_latest_json == expected_adm3_json
    s3_adm3_dated_obj = s3.get_object(Bucket=S3_BUCKET, Key='admin3/02-01-2024.json')
    s3_adm3_dated_json = json.loads(s3_adm3_dated_obj['Body'].read())
    assert s3_adm3_dated_json == expected_adm3_json
