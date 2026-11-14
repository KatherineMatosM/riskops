from typing import Any
from fastapi.encoders import jsonable_encoder
from app.utils.validation_errors import normalize_error_details


def success_response(data: Any = None) -> dict:
    return {"success": True, "data": jsonable_encoder(data)}


def error_response(message: str, error_code: str = "ERROR", *, errors: list[dict] | None = None) -> dict:
    response = {"success": False, "message": message, "error_code": error_code}
    if errors is not None:
        response["errors"] = normalize_error_details(errors)
    return response
