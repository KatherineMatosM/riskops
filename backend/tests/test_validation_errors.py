import json

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.error_handler import register_error_handlers
from app.utils.exceptions import AppError, ValidationAppError
from app.utils.response_helper import error_response
from app.utils.validation_errors import map_request_validation_errors


PUBLIC_DETAIL_KEYS = {"field", "location", "message", "type"}


def assert_validation_response(response):
    assert response.status_code == 422
    body = response.json()
    assert body["success"] is False
    assert body["message"] == "Datos de entrada invalidos."
    assert body["error_code"] == "VALIDATION_ERROR"
    assert body["errors"]
    for detail in body["errors"]:
        assert set(detail) == PUBLIC_DETAIL_KEYS
        assert isinstance(detail["location"], list)
    return {detail["field"]: detail for detail in body["errors"]}


def test_invalid_risk_title_and_axes_have_safe_spanish_field_errors(client, analyst_headers):
    response = client.post(
        "/api/v1/risks",
        headers=analyst_headers,
        json={"title": "ab", "category_id": 1, "probability": 0, "impact": 6},
    )

    errors = assert_validation_response(response)
    assert errors["title"] == {
        "field": "title",
        "location": ["body", "title"],
        "message": "Usa al menos 3 caracteres.",
        "type": "string_too_short",
    }
    assert errors["probability"]["message"] == "El valor mínimo es 1."
    assert errors["impact"]["message"] == "El valor máximo es 5."


def test_missing_registration_fields_are_identified(client):
    response = client.post("/api/v1/auth/register", json={})

    errors = assert_validation_response(response)
    assert set(errors) == {"full_name", "email", "password"}
    assert all(detail["message"] == "Este campo es obligatorio." for detail in errors.values())
    assert all(detail["type"] == "missing" for detail in errors.values())


@pytest.mark.parametrize(
    "password, marker, expected_type",
    [
        ("pvt!xyz", "pvt!xyz", "string_too_short"),
        ({"password": "private-password", "token": "private-token"}, "private-password", "string_type"),
    ],
)
def test_password_validation_never_echoes_sensitive_input(client, password, marker, expected_type):
    response = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Ana Perez", "email": "ana@example.com", "password": password},
    )

    errors = assert_validation_response(response)
    assert errors["password"]["type"] == expected_type
    assert marker not in response.text
    assert "private-token" not in response.text
    assert "input" not in response.json()["errors"][0]
    assert "ctx" not in response.json()["errors"][0]


@pytest.mark.parametrize(
    "path, params, source, field",
    [
        ("/api/v1/risks", {"category_id": "private-query-value"}, "query", "category_id"),
        ("/api/v1/risks/private-path-value", None, "path", "risk_id"),
    ],
)
def test_query_and_path_locations_are_normalized(client, viewer_headers, path, params, source, field):
    response = client.get(path, params=params, headers=viewer_headers)

    errors = assert_validation_response(response)
    assert errors[field]["location"] == [source, field]
    assert errors[field]["message"] == "Ingresa un número entero válido."
    assert "private-query-value" not in response.text
    assert "private-path-value" not in response.text


def test_nested_locations_keep_field_paths_without_input_or_context():
    mapped = map_request_validation_errors([
        {
            "loc": ("body", "plans", 0, "title"),
            "type": "string_too_short",
            "ctx": {"min_length": 3, "error": ValueError("private-context")},
            "input": "private-input",
            "msg": "private-original-message",
        },
        {"loc": ("query", "page"), "type": "int_parsing", "input": "private-input"},
    ])

    assert mapped == [
        {
            "field": "plans.0.title",
            "location": ["body", "plans", 0, "title"],
            "message": "Usa al menos 3 caracteres.",
            "type": "string_too_short",
        },
        {
            "field": "page",
            "location": ["query", "page"],
            "message": "Ingresa un número entero válido.",
            "type": "int_parsing",
        },
    ]
    assert "private-" not in json.dumps(mapped)


@pytest.mark.parametrize("unsafe_bound", ["private-context", True, {"token": "private-context"}])
def test_validation_messages_use_only_integer_constraints(unsafe_bound):
    mapped = map_request_validation_errors([
        {"loc": ("body", "password"), "type": "string_too_short", "ctx": {"min_length": unsafe_bound}},
    ])

    assert mapped[0]["message"] == "El texto es demasiado corto."
    assert "private-context" not in json.dumps(mapped)


def test_cross_field_value_errors_do_not_guess_a_field_or_echo_validator_context():
    mapped = map_request_validation_errors([
        {
            "loc": ("body",),
            "type": "value_error",
            "ctx": {"error": ValueError("private-cross-field-context")},
            "input": {"password": "private-password"},
            "msg": "private-validator-message",
        },
    ])

    assert mapped == [{
        "field": None,
        "location": ["body"],
        "message": "Datos de entrada inválidos.",
        "type": "value_error",
    }]


def test_invalid_json_does_not_echo_the_request_body(client):
    response = client.post(
        "/api/v1/auth/register",
        content='{"password":"private-json-password',
        headers={"Content-Type": "application/json"},
    )

    errors = assert_validation_response(response)
    assert errors[None]["type"] == "json_invalid"
    assert errors[None]["message"] == "El contenido JSON no es válido."
    assert "private-json-password" not in response.text


def test_plain_app_errors_preserve_the_existing_response_contract():
    error_app = FastAPI()
    register_error_handlers(error_app)

    @error_app.get("/plain")
    def plain_error():
        raise AppError("Conflicto conocido.", "KNOWN_ERROR", 409)

    with TestClient(error_app) as isolated_client:
        response = isolated_client.get("/plain")

    assert response.status_code == 409
    assert response.json() == {"success": False, "message": "Conflicto conocido.", "error_code": "KNOWN_ERROR"}
    assert error_response("Mensaje.", "CUSTOM") == {
        "success": False, "message": "Mensaje.", "error_code": "CUSTOM",
    }


def test_domain_errors_include_only_the_optional_public_field_details():
    error_app = FastAPI()
    register_error_handlers(error_app)

    @error_app.get("/domain")
    def domain_error():
        raise ValidationAppError(
            "Fechas inválidas.",
            errors=[{
                "location": ("body", "due_date"),
                "message": "La fecha límite debe ser posterior al inicio.",
                "type": "value_error",
                "input": "private-input",
                "ctx": {"password": "private-context"},
            }],
        )

    with TestClient(error_app) as isolated_client:
        response = isolated_client.get("/domain")

    assert response.status_code == 422
    assert response.json() == {
        "success": False,
        "message": "Fechas inválidas.",
        "error_code": "VALIDATION_ERROR",
        "errors": [{
            "field": "due_date",
            "location": ["body", "due_date"],
            "message": "La fecha límite debe ser posterior al inicio.",
            "type": "value_error",
        }],
    }
    assert "private-" not in response.text


def test_authentication_errors_advertise_bearer_authentication(client):
    response = client.get("/api/v1/risks")

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert "errors" not in response.json()


def test_unhandled_server_errors_do_not_disclose_exception_details():
    error_app = FastAPI()
    register_error_handlers(error_app)

    @error_app.get("/unexpected")
    def unexpected_error():
        raise RuntimeError("private-password private-token SQL connection credentials")

    with TestClient(error_app, raise_server_exceptions=False) as isolated_client:
        response = isolated_client.get("/unexpected")

    assert response.status_code == 500
    assert response.json() == {
        "success": False,
        "message": "Error interno del servidor.",
        "error_code": "INTERNAL_SERVER_ERROR",
    }
    assert "private-password" not in response.text
    assert "private-token" not in response.text
