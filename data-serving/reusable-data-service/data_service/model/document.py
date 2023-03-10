import copy
import csv
import dataclasses
import datetime
import io
import operator
import json
import flask.json

from data_service.model.document_update import DocumentUpdate
from data_service.model.geojson import Feature
from data_service.util.errors import ValidationError
from data_service.util.json_encoder import JSONEncoder

from typing import Any, List


@dataclasses.dataclass
class Document:
    """The base class for anything that's going into the database."""

    custom_fields = []

    def to_dict(self):
        """Me, as a dictionary."""
        return dataclasses.asdict(self)

    def to_json(self):
        """Return myself as JSON"""
        return JSONEncoder().encode(self.to_dict())

    @classmethod
    def date_fields(cls) -> list[str]:
        """Record where dates are kept because they sometimes need special treatment."""
        return cls.fields_of_class(datetime.date)

    @classmethod
    def location_fields(cls) -> list[str]:
        return cls.fields_of_class(Feature)

    @classmethod
    def document_fields(cls) -> list[str]:
        return cls.fields_of_class(Document)

    @classmethod
    def fields_of_class(cls, a_class: type) -> list[str]:
        return [f.name for f in dataclasses.fields(cls) if issubclass(f.type, a_class)]

    @staticmethod
    def interpret_date(maybe_date) -> datetime.date:
        value = None
        if maybe_date is None:
            value = None
        if isinstance(maybe_date, datetime.datetime):
            value = maybe_date.date()
        elif isinstance(maybe_date, datetime.date):
            value = maybe_date
        elif isinstance(maybe_date, str):
            value = datetime.datetime.strptime(
                maybe_date, "%Y-%m-%dT%H:%M:%S.%fZ"
            ).date()
        elif isinstance(maybe_date, dict) and "$date" in maybe_date:
            value = datetime.datetime.strptime(
                maybe_date["$date"], "%Y-%m-%dT%H:%M:%SZ"
            ).date()
        else:
            raise ValueError(f"Cannot interpret date {maybe_date}")
        return value

    @classmethod
    def field_names(cls) -> List[str]:
        """The list of names of fields in this class and member dataclasses."""
        fields = []
        for f in dataclasses.fields(cls):
            if dataclasses.is_dataclass(f.type):
                if hasattr(f.type, "custom_field_names"):
                    fields += [f"{f.name}.{g}" for g in f.type.custom_field_names()]
                elif cls.include_dataclass_fields(f.type):
                    fields += [f"{f.name}.{g.name}" for g in dataclasses.fields(f.type)]
            else:
                fields.append(f.name)
        return fields

    @classmethod
    def delimiter_separated_header(cls, sep: str) -> str:
        """Create a line naming all of the fields in this class and member dataclasses."""
        return sep.join(cls.field_names()) + "\r\n"

    @classmethod
    def tsv_header(cls) -> str:
        """Generate the header row for a TSV file containing members of this class."""
        return cls.delimiter_separated_header("\t")

    @classmethod
    def csv_header(cls) -> str:
        """Generate the header row for a CSV file containing members of this class."""
        return cls.delimiter_separated_header(",")

    @classmethod
    def json_header(cls) -> str:
        """The start of a JSON array."""
        return "["

    @classmethod
    def json_footer(cls) -> str:
        """The end of a JSON array."""
        return "]"

    @classmethod
    def json_separator(cls) -> str:
        """The string between values in a JSON array."""
        return ","

    def field_values(self) -> List[str]:
        """The list of values of fields on this object and member dataclasses."""
        fields = []
        for f in dataclasses.fields(self):
            value = getattr(self, f.name)
            if issubclass(f.type, Document):
                if self.include_dataclass_fields(f.type):
                    if value is not None:
                        fields += value.field_values()
                    else:
                        fields += f.type.none_field_values()
            elif hasattr(f.type, "custom_field_names"):
                if value is not None:
                    fields += value.custom_field_values()
                else:
                    fields += f.type.custom_none_field_values()
            elif isinstance(value, list):
                fields.append(",".join(value))
            else:
                fields.append(str(value) if value is not None else "")
        return fields

    @staticmethod
    def include_dataclass_fields(aType: type):
        test_exclusion = getattr(aType, "exclude_from_download", None)
        return test_exclusion is None or test_exclusion() is False

    def delimiter_separated_values(self, sep: str) -> str:
        """Create a line listing all of the fields in me and my member dataclasses."""
        f = io.StringIO()
        csv_writer = csv.writer(f, delimiter=sep)
        csv_writer.writerow(self.field_values())
        return f.getvalue()

    def to_tsv(self) -> str:
        """Generate a row in a CSV file representing myself."""
        return self.delimiter_separated_values("\t")

    def to_csv(self) -> str:
        """Generate a row in a CSV file representing myself."""
        return self.delimiter_separated_values(",")

    def updated_document(self, update: DocumentUpdate):
        """A copy of myself with the updates applied."""
        other = copy.deepcopy(self)
        other.apply_update(update)
        return other

    def apply_update(self, update: DocumentUpdate):
        """Apply a document update to myself."""
        for key, value in update.updates_iter():
            self._internal_set_value(key, value)
        for key in update.unsets_iter():
            self._internal_set_value(key, None)

    @classmethod
    def from_json(cls, obj: str) -> type:
        """Create an instance of this class from a JSON representation."""
        source = json.loads(obj)
        return cls.from_dict(source)

    @classmethod
    def from_dict(cls, dictionary: dict[str, Any]) -> type:
        doc = cls()
        for key in dictionary:
            if key in cls.date_fields():
                value = cls.interpret_date(dictionary[key])
            elif key in cls.location_fields():
                value = Feature.from_dict(dictionary[key])
            elif key in cls.document_fields():
                field_type = cls.field_type_for_key_path(key)
                dict_description = dictionary[key]
                value = (
                    field_type.from_dict(dict_description)
                    if dict_description is not None
                    else None
                )
            else:
                value = dictionary[key]
            setattr(doc, key, value)
        doc.validate()
        return doc

    def validate(self):
        """Check whether I am consistent. Raise ValidationError if not."""
        for field in self.custom_fields:
            getter = operator.attrgetter(field.key)
            value = getter(self)
            if field.required is True and value is None:
                raise ValidationError(f"{field.key} must have a value")
            if field.key in self.document_fields() and value is not None:
                getter(self).validate()
            if field.is_list:
                for element in value:
                    if not isinstance(element, field.element_type()):
                        raise ValidationError(f"{field.key} member {element} is of the wrong type")
            if field.values is not None:
                test_collection = value if field.is_list is True else [value]
                for a_value in test_collection:
                    if a_value is not None and a_value not in field.values:
                        raise ValidationError(
                            f"{field.key} value {a_value} not in permissible values {field.values}"
                        )

    def _internal_set_value(self, key, value):
        self._internal_ensure_containers_exist(key)
        container, prop = self._internal_object_and_property_for_key_path(key)
        # patch up the type for updates created from a JSON API
        if container.field_type(prop) == datetime.date and type(value) == str:
            value = datetime.date.fromisoformat(value)
        setattr(container, prop, value)

    def _internal_ensure_containers_exist(self, key):
        if (dot_index := key.rfind(".")) == -1:
            return  # no nested containers
        container_keys = key[:dot_index].split(".")
        container = self
        for component in container_keys:
            next_container = getattr(container, component)
            if next_container is None:
                container_type = container.field_type(component)
                next_container = container_type()
                setattr(container, component, next_container)
            container = next_container

    def _internal_object_and_property_for_key_path(self, key):
        if (dot_index := key.rfind(".")) == -1:
            container = self
            prop = key
        else:
            container_key = key[:dot_index]
            prop = key[dot_index + 1 :]
            container = operator.attrgetter(container_key)(self)
        return container, prop

    @classmethod
    def field_type(cls, prop: str) -> type:
        fields = dataclasses.fields(cls)
        the_field = [f for f in fields if f.name == prop][0]
        return the_field.type

    @classmethod
    def field_type_for_key_path(cls, key_path: str):
        props = key_path.split(".")
        a_type = cls
        while props != []:
            name = props.pop(0)
            a_type = [f.type for f in dataclasses.fields(a_type) if f.name == name][0]
        return a_type
