from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.utils.exceptions import AppError
from app.utils.response_helper import error_response
from app.utils.validation_errors import map_request_validation_errors


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.message, exc.error_code, errors=exc.errors),
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=error_response(
                "Datos de entrada invalidos.",
                "VALIDATION_ERROR",
                errors=map_request_validation_errors(exc.errors()),
            ),
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=500, content=error_response("Error interno del servidor.", "INTERNAL_SERVER_ERROR"))
