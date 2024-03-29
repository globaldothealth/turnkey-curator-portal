import io
import csv
import pytest
import json
from pathlib import Path
from contextlib import redirect_stdout
import transform as T

_DEEP_GET = [
    ({"x": {"y": {"z": 2}}}, "x.y.z", 2),
    ({"x": {"y": [1, 2]}}, "x.y", [1, 2]),
]

_ADDITIONAL_SOURCES = [
    ("[]", None),
    (
        '[{"sourceUrl": "http://foo.bar"}, {"sourceUrl": "http://bar.baz"}]',
        "http://foo.bar,http://bar.baz",
    ),
]

_EVENTS = {
    "dateEntry": {"$date": "2021-07-21T00:00:00.000Z"},
    "dateReported": {"$date": "2021-07-20T00:00:00.000Z"},
    "dateLastModified": {"$date": "2021-07-19T00:00:00.000Z"},
    "dateOnset": {"$date": "2021-07-18T00:00:00.000Z"},
    "dateConfirmation": {"$date": "2021-07-17T00:00:00.000Z"},
    "confirmationMethod": "last report",
    "dateOfFirstConsult": {"$date": "2021-07-16T00:00:00.000Z"},
    "hospitalized": "Y",
    "reasonForHospitalization": "monitoring",
    "dateHospitalization": {"$date": "2021-07-15T00:00:00.000Z"},
    "dateDischargeHospital": {"$date": "2021-07-14T00:00:00.000Z"},
    "intensiveCare": "Y",
    "dateAdmissionICU": {"$date": "2021-07-13T00:00:00.000Z"},
    "dateDischargeICU": {"$date": "2021-07-12T00:00:00.000Z"},
    "homeMonitoring": "Y",
    "isolated": "Y",
    "dateIsolation": {"$date": "2021-07-11T00:00:00.000Z"},
    "outcome": "death",
    "dateDeath": {"$date": "2021-07-10T00:00:00.000Z"},
    "dateRecovered": {"$date": "2021-07-09T00:00:00.000Z"},
}

_EVENTS_parsed = {
    "events.dateEntry": "2021-07-21",
    "events.dateReported": "2021-07-20",
    "events.dateLastModified": "2021-07-19",
    "events.dateOnset": "2021-07-18",
    "events.dateConfirmation": "2021-07-17",
    "events.confirmationMethod": "last report",
    "events.dateOfFirstConsult": "2021-07-16",
    "events.hospitalized": "Y",
    "events.reasonForHospitalization": "monitoring",
    "events.dateHospitalization": "2021-07-15",
    "events.dateDischargeHospital": "2021-07-14",
    "events.intensiveCare": "Y",
    "events.dateAdmissionICU": "2021-07-13",
    "events.dateDischargeICU": "2021-07-12",
    "events.homeMonitoring": "Y",
    "events.isolated": "Y",
    "events.dateIsolation": "2021-07-11",
    "events.outcome": "death",
    "events.dateDeath": "2021-07-10",
    "events.dateRecovered": "2021-07-09",
}


_TRAVEL = [
    {
        "dateRange": {"start": "2021-10-10T00:00:00Z", "end": "2021-10-12T00:00:00Z"},
        "location": {
            "geometry": {"latitude": 35, "longitude": -31},
            "administrativeAreaLevel1": "Port",
            "country": "Atlantis",
            "name": "Port of Atlantis",
        },
        "methods": "Ship",
    },
    {
        "dateRange": {"start": "2021-10-13T00:00:00Z", "end": "2021-10-15T00:00:00Z"},
        "location": {
            "geometry": {"latitude": 35, "longitude": -31},
            "administrativeAreaLevel1": "Coast",
            "country": "Atlantis",
            "name": "Coast",
        },
        "methods": "Raft",
    },
]

_TRAVEL_parsed = {
    "travelHistory.travel.dateRange.end": "2021-10-12,2021-10-15",
    "travelHistory.travel.dateRange.start": "2021-10-10,2021-10-13",
    "travelHistory.travel.location.administrativeAreaLevel1": "Port,Coast",
    "travelHistory.travel.location.country": "Atlantis,Atlantis",
    "travelHistory.travel.location.geometry.coordinates": "(35, -31),(35, -31)",
    "travelHistory.travel.location.name": "Port of Atlantis,Coast",
    "travelHistory.travel.methods": "Ship,Raft",
}

_BUCKETS = [
    {
        "_id": "001",
        "start": 20,
        "end": 24,
    },
    {
        "_id": "002",
        "start": 25,
        "end": 29,
    }
]


def _read_csv(fn):
    with open(fn) as f:
        c = csv.DictReader(f)
        return [row for row in c]


@pytest.mark.parametrize("dictionary,key,value", _DEEP_GET)
def test_deep_get(dictionary, key, value):
    assert T.deep_get(dictionary, key) == value


@pytest.mark.parametrize("sources,expected", _ADDITIONAL_SOURCES)
def test_convert_addl_sources(sources, expected):
    assert T.convert_addl_sources(sources) == expected


def test_convert_travel():
    assert T.convert_travel(json.dumps(_TRAVEL)) == _TRAVEL_parsed


@pytest.mark.parametrize("fmt", ["csv", "tsv", "json"])
def test_transform_output_match(fmt):
    expected = Path(f'test_transform_mongoexport_expected.{fmt}').read_text()
    with redirect_stdout(io.StringIO()) as f:
        T.transform('test_transform_mongoexport.csv', '-', [fmt], "test_age_buckets.json")
    # use str.splitlines to ignore line endings

    expected_lines = expected.splitlines()
    actual_lines = f.getvalue().splitlines()

    lines_to_compare = zip(expected_lines, actual_lines)
    for line_pair in lines_to_compare:
        # whitespaces in tsv file are causing issues with assert
        assert "".join(line_pair[0].split()) == "".join(line_pair[1].split())


def test_transform_empty(tmp_path):
    output = f"{tmp_path}/empty"
    T.transform('test_transform_mongoexport_header.csv', output, ['csv'], "test_age_buckets.json")
    assert not Path(f"{output}.csv.gz").exists()


def test_transform_creates_output(tmp_path):
    formats = ['csv', 'tsv', 'json']
    output = f"{tmp_path}/output"
    T.transform('test_transform_mongoexport.csv', output, formats, "test_age_buckets.json")
    for fmt in formats:
        assert Path(f"{output}.{fmt}.gz").exists()


def test_transform_buckets_age_ranges():
    expected = Path(f'test_transform_mongoexport_bucketed_ages_expected.csv').read_text()
    with redirect_stdout(io.StringIO()) as f:
        T.transform('test_transform_mongoexport_bucketed_ages.csv', '-', ['csv'], 'test_age_buckets.json')

    expected_lines = expected.splitlines()
    actual_lines = f.getvalue().splitlines()

    lines_to_compare = zip(expected_lines, actual_lines)
    for line_pair in lines_to_compare:
        assert line_pair[0] == line_pair[1]


def test_age_bucket_conversion():
    case_buckets_json = "[\"001\", \"002\"]"
    (start, end) = T.age_range(case_buckets_json, _BUCKETS)
    assert start == 20
    assert end == 29


def test_age_bucket_row_conversion():
    row = {
        "_id": "1",
        "travelHistory.traveledPrior30Days": "false",
        "demographics.ageBuckets": "[\"001\"]"
    }
    converted_row = T.convert_row(row, _BUCKETS)
    assert converted_row["demographics.ageRange.start"] == 20
    assert converted_row["demographics.ageRange.end"] == 24

@pytest.fixture
def age_buckets():
    with Path(__file__).with_name("test_age_buckets.json").open() as fp:
        return json.load(fp)


@pytest.mark.parametrize("source,expected", [((22, 22),(21, 25)), ((58, 62),(56, 65)), ((130, 150), None)])
def test_get_age_bucket_as_range(source, expected, age_buckets):
    assert T.get_age_bucket_as_range(age_buckets, *source) == expected


def convert_age_data():
    with Path(__file__).with_name("test_convert_age.csv").open() as fp:
        return list(csv.DictReader(fp))


@pytest.mark.parametrize(
    "row,expected_age",
    zip(convert_age_data(), [
        (20, 30), (21, 25), None, (21, 25),
        (20, 30), (0, 0), (0, 0), (26, 35), (1, 5),
    ])
)
def test_convert_age(row, expected_age, age_buckets):
    assert T.convert_age(row, age_buckets) == expected_age
