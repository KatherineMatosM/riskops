from typing import Any
from fastapi.encoders import jsonable_encoder


def success_response(data: Any = None) -> dict:
    return {"success": True, "data": jsonable_encoder(data)}


def error_response(message: str, error_code: str = "ERROR") -> dict:
    return {"success": False, "message": message, "error_code": error_code}