import pyodbc
import pytest

from app.config.settings import Settings
from app.database import init_db


class FakeCursor:
    def __init__(self, calls, fail=False):
        self.calls = calls
        self.fail = fail

    def execute(self, sql, *parameters):
        self.calls.append(("execute", sql, parameters))
        if self.fail:
            raise pyodbc.Error("Injected database error")

    def close(self):
        self.calls.append("cursor-close")


class FakeConnection:
    def __init__(self, calls, fail=False):
        self.calls = calls
        self.fail = fail

    def cursor(self):
        self.calls.append("cursor")
        return FakeCursor(self.calls, self.fail)

    def close(self):
        self.calls.append("connection-close")


def test_ensure_database_quotes_odbc_values_and_sql_identifier(monkeypatch):
    configured = Settings(
        _env_file=None,
        DB_HOST="test-sqlserver",
        DB_USER="test;user",
        DB_PASSWORD="test;pass}word",
        DB_NAME="test]database",
    )
    calls = []
    monkeypatch.setattr(init_db, "settings", configured)

    def connect(connection_string, **kwargs):
        assert "Database=master" in connection_string
        assert "UID={test;user}" in connection_string
        assert "PWD={test;pass}}word}" in connection_string
        assert kwargs == {"autocommit": True, "timeout": 5}
        calls.append("connect")
        return FakeConnection(calls)

    monkeypatch.setattr(init_db.pyodbc, "connect", connect)

    init_db.ensure_database_exists(max_retries=1)

    operation, sql, parameters = calls[2]
    assert operation == "execute"
    assert configured.DB_NAME not in sql
    assert "QUOTENAME(?)" in sql
    assert parameters == (configured.DB_NAME, configured.DB_NAME)
    assert calls[-2:] == ["cursor-close", "connection-close"]


def test_ensure_database_closes_failed_attempts_before_retrying(monkeypatch):
    calls = []
    monkeypatch.setattr(init_db.pyodbc, "connect", lambda *args, **kwargs: FakeConnection(calls, fail=True))
    monkeypatch.setattr(init_db.time, "sleep", lambda delay: calls.append("sleep"))

    with pytest.raises(RuntimeError, match="No se pudo crear/verificar"):
        init_db.ensure_database_exists(max_retries=2, delay_seconds=0)

    assert calls[2:5] == ["cursor-close", "connection-close", "sleep"]
    assert calls.count("cursor-close") == 2
    assert calls.count("connection-close") == 2
    assert calls.count("sleep") == 1


def test_ensure_database_can_recover_when_the_initial_connection_fails(monkeypatch):
    calls = []
    attempts = []

    def connect(*args, **kwargs):
        attempts.append(True)
        if len(attempts) == 1:
            raise pyodbc.Error("Connection not ready")
        return FakeConnection(calls)

    monkeypatch.setattr(init_db.pyodbc, "connect", connect)
    monkeypatch.setattr(init_db.time, "sleep", lambda delay: calls.append("sleep"))

    init_db.ensure_database_exists(max_retries=2, delay_seconds=0)

    assert len(attempts) == 2
    assert calls[0] == "sleep"
    assert calls[-2:] == ["cursor-close", "connection-close"]
