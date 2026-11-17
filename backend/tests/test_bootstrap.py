from pathlib import Path

import pytest

from app.database import bootstrap
from seeds import run_seeds


class FakeSession:
    def __init__(self, calls):
        self.calls = calls

    def rollback(self):
        self.calls.append("rollback")

    def close(self):
        self.calls.append("close")


def prepare_bootstrap(monkeypatch):
    calls = []
    session = FakeSession(calls)
    monkeypatch.setattr(bootstrap, "ensure_database_exists", lambda: calls.append("ensure"))
    monkeypatch.setattr(bootstrap, "wait_for_db", lambda: calls.append("wait"))
    monkeypatch.setattr(bootstrap, "SessionLocal", lambda: session)
    monkeypatch.setattr(bootstrap, "seed_roles", lambda db: calls.append("roles"))
    monkeypatch.setattr(bootstrap, "seed_categories", lambda db: calls.append("categories"))
    monkeypatch.setattr(bootstrap, "seed_admin_user", lambda db: calls.append("admin"))
    return calls


def test_bootstrap_migrates_before_seeding_without_create_all(monkeypatch, tmp_path):
    calls = prepare_bootstrap(monkeypatch)
    monkeypatch.chdir(tmp_path)

    def upgrade(config, revision):
        assert revision == "head"
        assert Path(config.config_file_name) == bootstrap.BACKEND_ROOT / "alembic.ini"
        assert Path(config.get_main_option("script_location")) == bootstrap.BACKEND_ROOT / "alembic"
        calls.append("migrate")

    monkeypatch.setattr(bootstrap.command, "upgrade", upgrade)

    bootstrap.bootstrap_database()

    assert calls == ["ensure", "wait", "migrate", "roles", "categories", "admin", "close"]


def test_bootstrap_does_not_seed_after_a_migration_failure(monkeypatch):
    calls = prepare_bootstrap(monkeypatch)

    def fail_migration(config, revision):
        calls.append("migrate")
        raise RuntimeError("Migration failed")

    monkeypatch.setattr(bootstrap.command, "upgrade", fail_migration)

    with pytest.raises(RuntimeError, match="Migration failed"):
        bootstrap.bootstrap_database()

    assert calls == ["ensure", "wait", "migrate"]


def test_bootstrap_rolls_back_and_closes_session_when_seeding_fails(monkeypatch):
    calls = prepare_bootstrap(monkeypatch)
    monkeypatch.setattr(bootstrap.command, "upgrade", lambda config, revision: calls.append("migrate"))

    def fail_categories(db):
        calls.append("categories")
        raise RuntimeError("Seed failed")

    monkeypatch.setattr(bootstrap, "seed_categories", fail_categories)

    with pytest.raises(RuntimeError, match="Seed failed"):
        bootstrap.bootstrap_database()

    assert calls == ["ensure", "wait", "migrate", "roles", "categories", "rollback", "close"]


def test_legacy_seed_runner_ensures_database_before_waiting(monkeypatch):
    calls = []
    session = FakeSession(calls)
    monkeypatch.setattr(run_seeds, "ensure_database_exists", lambda: calls.append("ensure"))
    monkeypatch.setattr(run_seeds, "wait_for_db", lambda: calls.append("wait"))
    monkeypatch.setattr(run_seeds, "create_all_tables", lambda: calls.append("create_all"))
    monkeypatch.setattr(run_seeds, "SessionLocal", lambda: session)
    monkeypatch.setattr(run_seeds, "seed_roles", lambda db: calls.append("roles"))
    monkeypatch.setattr(run_seeds, "seed_admin_user", lambda db: calls.append("admin"))
    monkeypatch.setattr(run_seeds, "seed_categories", lambda db: calls.append("categories"))

    run_seeds.run_all_seeds()

    assert calls == ["ensure", "wait", "create_all", "roles", "admin", "categories", "close"]
