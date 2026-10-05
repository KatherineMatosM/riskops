from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routes.router import api_router
from app.middleware.error_handler import register_error_handlers
from app.database.init_db import ensure_database_exists, wait_for_db, create_all_tables

app = FastAPI(title="RiskOps API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)
app.include_router(api_router)


@app.on_event("startup")
def on_startup() -> None:
    if settings.APP_ENV != "test":
        ensure_database_exists()
        wait_for_db()
        if settings.AUTO_CREATE_TABLES:
            create_all_tables()


@app.get("/health")
def health_check():
    return {"status": "ok"}