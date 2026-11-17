import time
import pyodbc
from sqlalchemy.engine import make_url
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
    # The dialect quotes ODBC values, including semicolons and closing braces.
    master_url = make_url(settings.DATABASE_URL).set(database="master")
    connect_args, connect_kwargs = engine.dialect.create_connect_args(master_url)
    connect_kwargs.update(autocommit=True, timeout=5)
    last_error = None
    for attempt in range(max_retries):
        connection = None
        cursor = None
        try:
            connection = pyodbc.connect(*connect_args, **connect_kwargs)
            cursor = connection.cursor()
            cursor.execute(
                "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = ?) "
                "BEGIN DECLARE @statement nvarchar(max) = N'CREATE DATABASE ' + QUOTENAME(?); "
                "EXEC sys.sp_executesql @statement; END",
                settings.DB_NAME, settings.DB_NAME,
            )
            return
        except pyodbc.Error as exc:
            last_error = exc
        finally:
            for resource in (cursor, connection):
                if resource is not None:
                    try:
                        resource.close()
                    except pyodbc.Error:
                        pass
        if attempt < max_retries - 1:
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
