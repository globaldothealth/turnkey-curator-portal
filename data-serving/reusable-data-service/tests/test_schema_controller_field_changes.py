import datetime
import pytest

from data_service.controller.schema_controller import SchemaController
from data_service.model.case import (
    observe_case_class,
    remove_case_class_observer,
    reset_custom_case_fields,
)
from data_service.model.field import Field
from data_service.stores.memory_store import MemoryStore
from data_service.util.errors import (
    ConflictError,
    DependencyFailedError,
    PreconditionUnsatisfiedError,
)

Case = None


def case_observer(case_class: type) -> None:
    global Case
    Case = case_class


@pytest.fixture
def observing_case_changes():
    observe_case_class(case_observer)
    yield
    remove_case_class_observer(case_observer)


@pytest.fixture
def schema_controller(observing_case_changes):
    store = MemoryStore()
    yield SchemaController(store)
    reset_custom_case_fields()


def test_adding_string_field_to_case_schema(schema_controller):
    schema_controller.add_field("custom_field", Field.STRING, "Some custom data.")
    assert "custom_field" in Case.field_names()
    assert Case.field_type("custom_field") is str


def test_cannot_shadow_day_zero_field(schema_controller):
    with pytest.raises(ConflictError):
        schema_controller.add_field(
            "confirmationDate", Field.DATE, "The date on which a case was confirmed."
        )


def test_must_appease_dataclasses(schema_controller):
    with pytest.raises(DependencyFailedError):
        schema_controller.add_field(
            "yield",
            Field.STRING,
            "I named this field after my favourite Python keyword.",
        )


def test_cannot_use_arbitrary_type(schema_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        schema_controller.add_field("my_field", set, "An unordered collection.")


def test_added_field_gets_stored(schema_controller):
    schema_controller.add_field(
        "a_string", Field.STRING, "A string that describes some feature of a case."
    )
    custom_fields = schema_controller.store.get_case_fields()
    assert len(custom_fields) == 1
    field = custom_fields[0]
    assert field.key == "a_string"
    assert field.type == Field.STRING
    assert (
        field.data_dictionary_text == "A string that describes some feature of a case."
    )


def test_stored_field_gets_added(observing_case_changes):
    store_with_preexisting_field = MemoryStore()
    a_field = Field(
        "outcome_date", Field.DATE, "The date on which the case reached an outcome."
    )
    store_with_preexisting_field.add_field(a_field)
    controller = SchemaController(store_with_preexisting_field)
    assert "outcome_date" in Case.field_names()
    assert Case.field_type("outcome_date") is datetime.date


def test_required_field_must_have_default_value(schema_controller):
    with pytest.raises(PreconditionUnsatisfiedError):
        schema_controller.add_field(
            "countSomething", Field.INTEGER, "Some Number", required=True
        )
