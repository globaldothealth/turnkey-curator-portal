import freezegun
import pytest
import json

from datetime import date

from data_service import app
from data_service.controller.case_controller import CaseController
from data_service.model.case import Case
from data_service.model.case_exclusion_metadata import CaseExclusionMetadata
from data_service.model.document_update import DocumentUpdate
from data_service.stores.memory_store import MemoryStore
from data_service.util.errors import (
    NotFoundError,
    PreconditionUnsatisfiedError,
    UnsupportedTypeError,
    ValidationError,
)


@pytest.fixture
def case_controller():
    with app.app_context():
        store = MemoryStore()
        controller = CaseController(
            store, outbreak_date=date(2019, 11, 1), geocoder=None
        )
        yield controller


def test_one_present_item_should_return_the_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
    response = case_controller.get_case("foo")
    assert response is not None
    assert response.confirmationDate == date(2021, 12, 31)


def test_one_absent_item_should_raise_NotFoundError(case_controller):
    with pytest.raises(NotFoundError):
        case_controller.get_case("foo")


def test_list_cases__when_there_are_none_should_return_empty_list(case_controller):
    cases = case_controller.list_cases()
    cases.cases == []


def test_list_cases_should_list_the_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        case_controller.store.put_case("foo", case)
        case_controller.store.put_case("bar", case)
    cases = case_controller.list_cases()
    assert len(cases.cases) == 2


def test_list_cases_should_paginate(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=1, limit=10)
    assert len(cases.cases) == 10
    assert cases.nextPage == 2
    assert cases.total == 15


def test_list_cases_last_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=2, limit=10)
    assert len(cases.cases) == 5
    assert cases.total == 15
    assert cases.nextPage is None


def test_list_cases_nonexistent_page(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case = Case.from_json(minimal_file.read())
        for i in range(15):
            case_controller.store.put_case(f"case_{i}", case)
    cases = case_controller.list_cases(page=43, limit=10)
    assert len(cases.cases) == 0
    assert cases.total == 15
    assert cases.nextPage is None


def test_create_case_with_missing_properties_raises(case_controller):
    with pytest.raises(ValidationError):
        case_controller.create_case({})


def test_create_case_with_invalid_data_raises(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    del case_doc["caseStatus"]
    with pytest.raises(ValidationError):
        case_controller.create_case(case_doc)


def test_create_valid_case_adds_to_collection(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)
    assert case_controller.store.count_cases() == 1


def test_create_valid_case_with_negative_count_raises(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.create_case(
            case_doc,
            num_cases=-7,
        )


def test_create_valid_case_with_positive_count_adds_to_collection(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(
        case_doc,
        num_cases=7,
    )
    assert case_controller.store.count_cases() == 7


def test_validate_case_with_invalid_case_raises(case_controller):
    with pytest.raises(ValidationError):
        case_controller.validate_case_dictionary({})


def test_validate_case_with_valid_case_does_not_add_case(
    case_controller,
):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.validate_case_dictionary(case_doc)
    assert case_controller.store.count_cases() == 0


def test_batch_upsert_with_no_body_raises(case_controller):
    with pytest.raises(UnsupportedTypeError):
        case_controller.batch_upsert(None)


def test_batch_upsert_with_no_case_list_raises(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_upsert({})


def test_batch_upsert_with_empty_case_list_raises(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_upsert({"cases": []})


def test_batch_upsert_creates_valid_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        minimal_case_description = json.loads(minimal_file.read())
    response = case_controller.batch_upsert({"cases": [minimal_case_description]})
    assert case_controller.store.count_cases() == 1
    assert response.numCreated == 1
    assert response.numUpdated == 0
    assert response.errors == {}


def test_batch_upsert_reports_errors(case_controller):
    response = case_controller.batch_upsert({"cases": [{}]})
    assert response.numCreated == 0
    assert response.numUpdated == 0
    assert response.errors == {"0": "caseStatus must have a value"}


def test_download_with_no_query_is_ok(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)

    _ = case_controller.create_case(
        case_doc,
        num_cases=2,
    )
    generator = case_controller.download(format="csv")
    result = ""
    for chunk in generator():
        result += chunk
    assert result.startswith(Case.csv_header())
    lines = result.splitlines()
    assert len(lines) == 3


def test_download_with_malformed_query_throws(case_controller):
    with pytest.raises(ValidationError):
        case_controller.download("csv", "country:")


def test_download_with_unsupported_format_throws(case_controller):
    with pytest.raises(UnsupportedTypeError):
        case_controller.download(format="docx")


def test_download_with_query_and_case_ids_throws(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.download(format="csv", filter="country:IN", case_ids=["1"])


def test_download_cases_by_id(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    generator = case_controller.download("csv", case_ids=["1", "3"])
    result = ""
    for chunk in generator():
        result += chunk
    assert "2021-06-02" in result
    assert "2021-06-03" not in result
    assert "2021-06-04" in result


def test_filter_cases_by_query(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    generator = case_controller.download("csv", filter="dateconfirmedbefore:2021-06-03")
    result = ""
    for chunk in generator():
        result += chunk
    # test double version of the store doesn't actually filter by case ID so just check we get the CSV back
    assert result.startswith(Case.csv_header())


def test_download_supports_tsv(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    _ = case_controller.create_case(
        case_doc,
        num_cases=2,
    )
    generator = case_controller.download(format="tsv")
    result = ""
    for chunk in generator():
        result += chunk
    assert result.startswith(Case.tsv_header())
    lines = result.splitlines()
    assert len(lines) == 3


def test_download_supports_json(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    _ = case_controller.create_case(
        case_doc,
        num_cases=2,
    )
    generator = case_controller.download(format="json")
    output = ""
    for chunk in generator():
        output += chunk
    result = json.loads(output)
    assert len(result) == 2
    assert result[0]["confirmationDate"] == "2021-12-31"
    assert result[1]["caseReference"]["sourceId"] == "fedc09876543210987654321"


def test_batch_status_change_rejects_invalid_status(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_status_change("xxx", case_ids=[])


def test_batch_status_change_rejects_exclusion_with_no_note(case_controller):
    with pytest.raises(ValidationError):
        case_controller.batch_status_change("omit_error", case_ids=[])


def test_batch_status_change_excludes_cases_with_note(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    case_controller.batch_status_change(
        "omit_error", "I dislike this case", case_ids=["1", "2"]
    )
    an_excluded_case = case_controller.store.case_by_id("1")
    assert an_excluded_case.caseStatus == "omit_error"
    assert an_excluded_case.caseExclusion.note == "I dislike this case"
    another_case = case_controller.store.case_by_id("3")
    assert another_case.caseStatus == "probable"
    assert another_case.caseExclusion is None


@freezegun.freeze_time("Aug 13th, 2021")
def test_batch_status_change_records_date_of_exclusion(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)

    case_controller.batch_status_change(
        "omit_error", "Mistakes have been made", case_ids=["1"]
    )

    case = case_controller.store.case_by_id("1")
    assert case.caseStatus == "omit_error"
    assert case.caseExclusion.note == "Mistakes have been made"
    assert case.caseExclusion.date == date(2021, 8, 13)


def test_batch_status_change_removes_exclusion_data_on_unexcluding_case(
    case_controller,
):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)

    case_controller.batch_status_change(
        "omit_error", "Mistakes have been made", case_ids=["1"]
    )
    case_controller.batch_status_change("suspected", case_ids=["1"])

    case = case_controller.store.case_by_id("1")
    assert case.caseStatus == "suspected"
    assert case.caseExclusion is None


def test_batch_status_change_by_query(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)

    case_controller.batch_status_change(
        "omit_error", "Mistakes have been made", filter="dateconfirmedafter:2021-06-01"
    )

    case = case_controller.store.case_by_id("1")
    assert case.caseStatus == "omit_error"
    assert case.caseExclusion is not None


def test_excluded_case_ids_raises_if_no_source_id(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.excluded_case_ids(source_id=None)


def test_excluded_case_ids_returns_empty_if_no_matching_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)
    ids = case_controller.excluded_case_ids("fedc09876543210987654321")
    assert len(ids) == 0


def test_excluded_case_ids_returns_ids_of_matching_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_doc["caseStatus"] = "omit_error"
    case_doc["caseExclusion"] = {
        "date": date(2022, 5, 17),
        "note": "I told him we already have one",
    }
    case_controller.create_case(case_doc)
    ids = case_controller.excluded_case_ids("fedc09876543210987654321")
    assert len(ids) == 1
    assert ids[0] == "1"


def test_updating_missing_case_should_throw_NotFoundError(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_doc["caseStatus"] = "omit_error"
    case_doc["caseExclusion"] = {
        "date": date(2022, 5, 17),
        "note": "I told him we already have one",
    }
    case_controller.create_case(case_doc)
    with pytest.raises(NotFoundError):
        case_controller.update_case("2", {"caseExclusion": {"note": "Duplicate"}})


def test_updating_case_to_invalid_state_should_throw_ValidationError(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_doc["caseStatus"] = "omit_error"
    case_doc["caseExclusion"] = {
        "date": date(2022, 5, 17),
        "note": "I told him we already have one",
    }
    case_controller.create_case(case_doc)
    with pytest.raises(ValidationError):
        case_controller.update_case("1", {"confirmationDate": None})


def test_updating_case_to_valid_state_returns_updated_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_doc["caseStatus"] = "omit_error"
    case_doc["caseExclusion"] = {
        "date": date(2022, 5, 17),
        "note": "I told him we already have one",
    }
    case_controller.create_case(case_doc)
    new_case = case_controller.update_case("1", {"confirmationDate": date(2021, 6, 24)})
    assert new_case.confirmationDate == date(2021, 6, 24)


def test_batch_update_cases_returns_number_of_modified_cases(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    update_one = {
        "_id": "1",
        "caseStatus": "omit_error",
        "caseExclusion": {"date": date(2022, 2, 2), "note": "Bad case no likey"},
    }
    update_two = {"_id": "2", "caseStatus": "confirmed"}
    num_modified = case_controller.batch_update([update_one, update_two])
    assert num_modified == 2
    case_one = case_controller.get_case("1")
    assert case_one.caseStatus == "omit_error"
    case_two = case_controller.get_case("2")
    assert case_two.caseStatus == "confirmed"
    case_three = case_controller.get_case("3")
    assert case_three.caseStatus == "probable"


def test_batch_update_raises_if_id_not_supplied(case_controller):
    update = {"confirmationDate": date(2022, 5, 3)}
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_update([update])


def test_batch_update_raises_if_case_would_be_invalid(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    case_controller.create_case(case_doc)
    update = {"_id": "1", "confirmationDate": None}
    with pytest.raises(ValidationError):
        case_controller.batch_update([update])


def test_batch_update_raises_if_case_not_found(case_controller):
    update = {"_id": "1", "confirmationDate": date(2022, 5, 13)}
    with pytest.raises(NotFoundError):
        case_controller.batch_update([update])


def test_batch_update_query_returns_modified_count(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    update = {"confirmationDate": date(2022, 5, 13)}
    query = None  # didn't implement rich queries on the test store
    modified = case_controller.batch_update_query(query, update)
    assert modified == 4


def test_delete_present_case_deletes_case(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    case_controller.delete_case("1")
    assert case_controller.store.count_cases() == 3
    assert case_controller.store.case_by_id("1") is None


def test_delete_absent_case_raises_NotFoundError(case_controller):
    with pytest.raises(NotFoundError):
        case_controller.delete_case("1")


def test_cannot_batch_delete_both_query_and_case_ids(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(query="", case_ids=[])


def test_cannot_batch_delete_neither_query_nor_case_ids(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(None, None)


def test_cannot_batch_delete_everything(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete("", None)


def test_cannot_batch_delete_with_malformed_query(case_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        case_controller.batch_delete(" ", None)


def test_cannot_batch_delete_more_cases_than_threshold(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    with pytest.raises(ValidationError):
        case_controller.batch_delete("dateconfirmedafter:2021-05-02", None, 1)
    assert case_controller.store.count_cases() == 4


def test_batch_delete_with_case_ids(case_controller):
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    case_controller.batch_delete(None, ["1", "2"])
    assert case_controller.store.count_cases() == 2


def test_batch_delete_with_query(case_controller):
    """This test is deliberately set up to effectively delete all cases because
    anything more nuanced would require interpreting filter logic in the test store,
    which is a lot of complexity for little value. Look to the end-to-end tests for
    better tests of the filtering logic, because the filters should definitely work in
    production data stores!"""
    with open("./tests/data/case.minimal.json", "r") as minimal_file:
        case_doc = json.load(minimal_file)
    for i in range(4):
        this_case = dict(case_doc)
        this_case["confirmationDate"] = date(2021, 6, i + 1)
        _ = case_controller.create_case(this_case)
    case_controller.batch_delete("dateconfirmedafter:2021-05-02", None)
    assert case_controller.store.count_cases() == 0
