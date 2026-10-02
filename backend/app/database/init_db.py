import time
import pyodbc
from sqlalchemy.exc import OperationalError
from app.database.base import Base
from app.database.session import engine
from app.config.settings import settings
from app import models 


def ensure_database_exists(max_retries: int = 30, delay_seconds: int = 2) -> None:
    """SQL Server no crea la base de datos de la aplicacion automaticamente
    (solo trae master/model/msdb/tempdb). Esta funcion se conecta a 'master'
    y crea la base indicada en DB_NAME si todavia no existe, para que el
    resto del arranque (wait_for_db, Alembic, seeds) tenga donde conectarse."""
    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={settings.DB_HOST},{settings.DB_PORT};"
        "DATABASE=master;"
        f"UID={settings.DB_USER};PWD={settings.DB_PASSWORD};"
        "TrustServerCertificate=yes;"
    )
    last_error = None
    for _ in range(max_retries):
        try:
            connection = pyodbc.connect(conn_str, autocommit=True, timeout=5)
            cursor = connection.cursor()
            cursor.execute(
                "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = ?) "
                "EXEC('CREATE DATABASE [' + ? + ']')",
                settings.DB_NAME, settings.DB_NAME,
            )
            cursor.close()
            connection.close()
            return
        except pyodbc.Error as exc:
            last_error = exc
            time.sleep(delay_seconds)
    raise RuntimeError(f"No se pudo crear/verificar la base de datos '{settings.DB_NAME}': {last_error}")


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