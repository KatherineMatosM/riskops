from types import SimpleNamespace

import pytest
from sqlalchemy import func, select

from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.repositories.user_repository import UserRepository
from seeds import seed_admin_user


class InjectedSeedFailure(RuntimeError):
    pass


@pytest.fixture
def admin_seed_settings(monkeypatch, test_password_hash):
    configured = SimpleNamespace(
        ADMIN_EMAIL="seed-admin@example.com",
        ADMIN_PASSWORD="Password123",
        ADMIN_FULL_NAME="Administrador de prueba",
    )
    monkeypatch.setattr(seed_admin_user, "settings", configured)
    monkeypatch.setattr(seed_admin_user, "hash_password", lambda password: test_password_hash)
    return configured


def test_new_admin_and_role_are_atomic_and_can_be_retried(db_session, monkeypatch, admin_seed_settings):
    original_flush = db_session.flush
    original_commit = db_session.commit
    commits = []

    def commit():
        commits.append(True)
        original_commit()

    def fail_after_role_flush(*args, **kwargs):
        pending_role = any(isinstance(value, UserRole) for value in db_session.new)
        original_flush(*args, **kwargs)
        if pending_role:
            raise InjectedSeedFailure("Role write failed")

    monkeypatch.setattr(db_session, "commit", commit)
    with monkeypatch.context() as failure:
        failure.setattr(db_session, "flush", fail_after_role_flush)
        with pytest.raises(InjectedSeedFailure):
            seed_admin_user.seed_admin_user(db_session)

    assert commits == []
    assert db_session.scalar(select(func.count()).select_from(User)) == 0
    assert db_session.scalar(select(func.count()).select_from(UserRole)) == 0

    seed_admin_user.seed_admin_user(db_session)

    admin = db_session.scalar(select(User).where(User.email == admin_seed_settings.ADMIN_EMAIL))
    assert admin is not None
    assert UserRepository(db_session).get_role_names(admin.id) == ["ADMIN"]
    assert len(commits) == 1


def test_existing_account_is_not_promoted_or_overwritten(db_session, user_factory, admin_seed_settings):
    existing = user_factory("VIEWER", email=admin_seed_settings.ADMIN_EMAIL, full_name="Cuenta existente")
    original_password_hash = existing.password_hash

    seed_admin_user.seed_admin_user(db_session)

    db_session.refresh(existing)
    assert existing.full_name == "Cuenta existente"
    assert existing.password_hash == original_password_hash
    assert UserRepository(db_session).get_role_names(existing.id) == ["VIEWER"]


def test_admin_role_is_required_before_creating_the_account(db_session, admin_seed_settings):
    admin_role = db_session.scalar(select(Role).where(Role.name == "ADMIN"))
    db_session.delete(admin_role)
    db_session.commit()

    with pytest.raises(RuntimeError, match="El rol ADMIN debe existir"):
        seed_admin_user.seed_admin_user(db_session)

    assert db_session.scalar(select(func.count()).select_from(User)) == 0
