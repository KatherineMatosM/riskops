from io import StringIO
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.engine import make_url

from app.config.settings import Settings


def test_database_url_preserves_reserved_characters_in_credentials():
    configured = Settings(
        _env_file=None,
        DB_USER="test-user@example",
        DB_PASSWORD="test:p@ss/word%with#reserved?chars",
        DB_HOST="sqlserver",
        DB_PORT=1433,
        DB_NAME="test_database",
    )

    parsed = make_url(configured.DATABASE_URL)

    assert parsed.username == configured.DB_USER
    assert parsed.password == configured.DB_PASSWORD
    assert parsed.host == "sqlserver"
    assert parsed.database == "test_database"
    assert parsed.query["driver"] == "ODBC Driver 18 for SQL Server"
    assert parsed.query["TrustServerCertificate"] == "yes"


def test_offline_migrations_accept_encoded_database_credentials(monkeypatch):
    configured = Settings(
        _env_file=None,
        DB_USER="migration-user@example",
        DB_PASSWORD="migration:p@ss/word%with#reserved?chars",
        DB_HOST="sqlserver",
        DB_NAME="migration_database",
    )
    monkeypatch.setattr("app.config.settings.settings", configured)
    sql_output = StringIO()
    config = Config(output_buffer=sql_output)
    config.set_main_option("script_location", str(Path(__file__).resolve().parents[1] / "alembic"))

    command.upgrade(config, "head", sql=True)

    sql = sql_output.getvalue()
    assert "CREATE TABLE users" in sql
    assert "alembic_version" in sql
    assert configured.DB_PASSWORD not in sql
