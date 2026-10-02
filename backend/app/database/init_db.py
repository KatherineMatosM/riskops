import time
from sqlalchemy.exc import OperationalError
from app.database.base import Base
from app.database.session import engine
from app import models  # noqa: F401  (registra todos los modelos en Base.metadata)


def wait_for_db(max_retries: int = 30, delay_seconds: int = 2) -> None:
    for _ in range(max_retries):
        try:
            connection = engine.connect()
            connection.close()
            return
        except OperationalError:
            time.sleep(delay_seconds)
    raise RuntimeError("No se pudo conectar a la base de datos despues de varios intentos.")


def create_all_tables() -> None:
    Base.metadata.create_all(bind=engine)