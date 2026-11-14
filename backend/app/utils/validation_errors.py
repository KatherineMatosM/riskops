from collections.abc import Iterable
from typing import Any


_REQUEST_LOCATIONS = {"body", "query", "path", "header", "cookie"}


def normalize_error_location(location: Any) -> list[str | int]:
    if not isinstance(location, (list, tuple)):
        return []
    return [part for part in location if type(part) in (str, int) and part != "__root__"]


def _field_from_location(location: list[str | int]) -> str | None:
    parts = location[1:] if location and location[0] in _REQUEST_LOCATIONS else location
    return ".".join(str(part) for part in parts) or None


def normalize_error_details(errors: Iterable[dict]) -> list[dict]:
    """Keep only the public error contract, including for trusted domain errors."""
    details = []
    for error in errors:
        location = normalize_error_location(error.get("location", ()))
        field = error.get("field", _field_from_location(location))
        details.append({
            "field": field if isinstance(field, str) else None,
            "location": location,
            "message": error.get("message") if isinstance(error.get("message"), str) else "Datos de entrada inválidos.",
            "type": error.get("type") if isinstance(error.get("type"), str) else "value_error",
        })
    return details


def _validation_message(error: dict, field: str | None) -> str:
    error_type = error.get("type", "")
    context = error.get("ctx")
    context = context if isinstance(context, dict) else {}
    bounds = {
        "string_too_short": ("min_length", "Usa al menos {} caracteres.", "El texto es demasiado corto."),
        "string_too_long": ("max_length", "Usa como máximo {} caracteres.", "El texto es demasiado largo."),
        "greater_than_equal": ("ge", "El valor mínimo es {}.", "El valor es menor que el mínimo permitido."),
        "greater_than": ("gt", "El valor debe ser mayor que {}.", "El valor es menor que el límite permitido."),
        "less_than_equal": ("le", "El valor máximo es {}.", "El valor supera el máximo permitido."),
        "less_than": ("lt", "El valor debe ser menor que {}.", "El valor supera el límite permitido."),
        "too_short": ("min_length", "Se requieren al menos {} elementos.", "La cantidad de elementos es insuficiente."),
        "too_long": ("max_length", "Se permiten como máximo {} elementos.", "Hay demasiados elementos."),
    }
    if error_type in bounds:
        key, template, fallback = bounds[error_type]
        bound = context.get(key)
        return template.format(bound) if type(bound) is int else fallback
    messages = {
        "missing": "Este campo es obligatorio.",
        "int_type": "Ingresa un número entero válido.",
        "int_parsing": "Ingresa un número entero válido.",
        "int_from_float": "Ingresa un número entero válido.",
        "float_type": "Ingresa un número válido.",
        "float_parsing": "Ingresa un número válido.",
        "finite_number": "Ingresa un número válido.",
        "bool_type": "Ingresa un valor verdadero o falso.",
        "bool_parsing": "Ingresa un valor verdadero o falso.",
        "string_type": "Ingresa un texto válido.",
        "list_type": "Ingresa una lista válida.",
        "dict_type": "Ingresa un objeto válido.",
        "model_type": "Ingresa un objeto válido.",
        "model_attributes_type": "Ingresa un objeto válido.",
        "literal_error": "Selecciona una opción válida.",
        "enum": "Selecciona una opción válida.",
        "extra_forbidden": "Este campo no está permitido.",
        "string_pattern_mismatch": "Revisa el formato de este campo.",
        "json_invalid": "El contenido JSON no es válido.",
    }
    if error_type.startswith("datetime_"):
        return "Ingresa una fecha y hora válidas."
    if error_type.startswith("date_"):
        return "Ingresa una fecha válida."
    return messages.get(error_type, "Revisa el valor de este campo." if field else "Datos de entrada inválidos.")


def map_request_validation_errors(errors: Iterable[dict]) -> list[dict]:
    details = []
    for error in errors:
        location = normalize_error_location(error.get("loc", ()))
        error_type = error.get("type", "validation_error")
        field = None if error_type == "json_invalid" else _field_from_location(location)
        details.append({
            "field": field,
            "location": location,
            "message": _validation_message(error, field),
            "type": error_type,
        })
    return details
