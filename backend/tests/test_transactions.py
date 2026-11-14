import pytest
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.unit_of_work import TransactionRollbackError, atomic, unit_of_work
from app.models.notification import Notification
from app.models.risk import Risk
from app.models.risk_category import RiskCategory
from app.models.risk_evaluation import RiskEvaluation
from app.models.risk_history import RiskHistory
from app.models.user import User
from app.models.user_role import UserRole
from app.repositories.notification_repository import NotificationRepository
from app.repositories.risk_evaluation_repository import RiskEvaluationRepository
from app.repositories.risk_history_repository import RiskHistoryRepository
from app.repositories.risk_repository import RiskRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth_schema import RegisterRequest
from app.schemas.risk_evaluation_schema import RiskEvaluationCreateRequest
from app.schemas.risk_schema import RiskCreateRequest
from app.schemas.user_schema import UserCreateRequest, UserUpdateRequest
from app.services.auth_service import AuthService
from app.services.notification_service import NotificationService
from app.services.risk_evaluation_service import RiskEvaluationService
from app.services.risk_service import RiskService
from app.services.user_service import UserService
from app.utils.exceptions import ValidationAppError


class InjectedFailure(RuntimeError):
    pass


def fail_after_write(monkeypatch, repository, method):
    original = getattr(repository, method)

    def fail(self, *args, **kwargs):
        original(self, *args, **kwargs)
        raise InjectedFailure(repository.__name__)

    monkeypatch.setattr(repository, method, fail)


def create_risk(db_session, user_id, probability=1, impact=1):
    category_id = db_session.scalar(select(RiskCategory.id).order_by(RiskCategory.id))
    return RiskService(db_session).create_risk(
        RiskCreateRequest(
            title="Riesgo de prueba transaccional",
            category_id=category_id,
            probability=probability,
            impact=impact,
        ),
        user_id,
    )


def count_rows(db, model):
    return db.scalar(select(func.count()).select_from(model))


def test_risk_and_nested_notification_commit_once_after_auth_read(db_session, user_factory, monkeypatch):
    user = user_factory("ADMIN")
    user_id = user.id
    assert db_session.get(User, user_id) is not None
    assert db_session.in_transaction()
    commits = []
    original_commit = db_session.commit

    def commit():
        commits.append(True)
        original_commit()

    monkeypatch.setattr(db_session, "commit", commit)
    created = create_risk(db_session, user_id, probability=5, impact=5)

    assert len(commits) == 1
    assert created.risk_score == 25
    assert created.risk_level == "CRITICAL"
    with Session(db_session.get_bind()) as stored:
        assert stored.get(Risk, created.id).risk_level == "CRITICAL"
        assert count_rows(stored, RiskHistory) == 1
        assert count_rows(stored, Notification) == 1


@pytest.mark.parametrize("repository,method", [
    (RiskEvaluationRepository, "create"),
    (RiskRepository, "update"),
    (RiskHistoryRepository, "create"),
    (NotificationRepository, "create"),
])
def test_evaluation_failure_rolls_back_every_staged_write(db_session, user_factory, monkeypatch, repository, method):
    user_id = user_factory("ADMIN").id
    risk_id = create_risk(db_session, user_id).id
    fail_after_write(monkeypatch, repository, method)

    with pytest.raises(InjectedFailure):
        RiskEvaluationService(db_session).evaluate_risk(
            risk_id,
            RiskEvaluationCreateRequest(probability=5, impact=5),
            user_id,
        )

    with Session(db_session.get_bind()) as stored:
        risk = stored.get(Risk, risk_id)
        assert (risk.probability, risk.impact, risk.risk_score, risk.risk_level) == (1, 1, 1, "LOW")
        assert count_rows(stored, RiskEvaluation) == 0
        assert count_rows(stored, RiskHistory) == 1
        assert count_rows(stored, Notification) == 0


@pytest.mark.parametrize("repository", [RiskHistoryRepository, NotificationRepository])
def test_create_risk_failure_leaves_no_partial_risk(db_session, user_factory, monkeypatch, repository):
    user_id = user_factory("ADMIN").id
    fail_after_write(monkeypatch, repository, "create")

    with pytest.raises(InjectedFailure):
        create_risk(db_session, user_id, probability=5, impact=5)

    with Session(db_session.get_bind()) as stored:
        assert count_rows(stored, Risk) == 0
        assert count_rows(stored, RiskHistory) == 0
        assert count_rows(stored, Notification) == 0


@pytest.mark.parametrize("operation", ["register", "create_user"])
def test_user_creation_role_failure_rolls_back_user_and_roles(db_session, monkeypatch, operation):
    fail_after_write(monkeypatch, UserRepository, "set_roles")
    values = {"full_name": "Usuario transaccional", "email": "transaction@example.com", "password": "Password123"}

    with pytest.raises(InjectedFailure):
        if operation == "register":
            AuthService(db_session).register(RegisterRequest(**values))
        else:
            UserService(db_session).create_user(UserCreateRequest(**values, roles=["VIEWER"]))

    with Session(db_session.get_bind()) as stored:
        assert count_rows(stored, User) == 0
        assert count_rows(stored, UserRole) == 0


def test_invalid_roles_roll_back_already_flushed_user_changes(db_session, user_factory):
    user_id = user_factory("VIEWER", full_name="Nombre original").id

    with pytest.raises(ValidationAppError):
        UserService(db_session).update_user(
            user_id,
            UserUpdateRequest(full_name="Nombre modificado", is_active=False, roles=["ROLE_DOES_NOT_EXIST"]),
        )

    with Session(db_session.get_bind()) as stored:
        user = stored.get(User, user_id)
        assert user.full_name == "Nombre original"
        assert user.is_active is True
        assert UserRepository(stored).get_role_names(user_id) == ["VIEWER"]


def test_caught_nested_failure_marks_outer_transaction_for_rollback(db_session, user_factory, monkeypatch):
    user_id = user_factory("ADMIN").id
    risk_id = create_risk(db_session, user_id).id
    commits = []
    rollbacks = []
    original_commit = db_session.commit
    original_rollback = db_session.rollback

    def commit():
        commits.append(True)
        original_commit()

    def rollback():
        rollbacks.append(True)
        original_rollback()

    monkeypatch.setattr(db_session, "commit", commit)
    monkeypatch.setattr(db_session, "rollback", rollback)

    class CompositeOperation:
        def __init__(self, db):
            self.db = db

        @atomic
        def perform(self):
            risk = self.db.get(Risk, risk_id)
            risk.title = "Cambio que debe revertirse"
            try:
                NotificationService(self.db).notify_risk_critical(risk)
            except InjectedFailure:
                pass
            self.db.add(Notification(title="Posterior al fallo", message="No debe persistirse", type="TEST"))
            self.db.flush()

    with monkeypatch.context() as patch:
        fail_after_write(patch, NotificationRepository, "create")
        with pytest.raises(TransactionRollbackError):
            CompositeOperation(db_session).perform()

    assert commits == []
    assert len(rollbacks) == 1
    with Session(db_session.get_bind()) as stored:
        assert stored.get(Risk, risk_id).title == "Riesgo de prueba transaccional"
        assert count_rows(stored, Notification) == 0

    # The failed scope must not poison the next operation using this session.
    NotificationService(db_session).notify_risk_critical(db_session.get(Risk, risk_id))
    assert len(commits) == 1
    with Session(db_session.get_bind()) as stored:
        assert count_rows(stored, Notification) == 1


def test_user_and_roles_persist_in_one_commit(db_session, monkeypatch):
    commits = []
    original_commit = db_session.commit

    def commit():
        commits.append(True)
        original_commit()

    monkeypatch.setattr(db_session, "commit", commit)
    created = UserService(db_session).create_user(UserCreateRequest(
        full_name="Usuario con roles",
        email="durable@example.com",
        password="Password123",
        roles=["VIEWER", "ANALYST"],
    ))

    assert len(commits) == 1
    assert set(created.roles) == {"VIEWER", "ANALYST"}
    with Session(db_session.get_bind()) as stored:
        assert stored.get(User, created.id).email == "durable@example.com"
        assert set(UserRepository(stored).get_role_names(created.id)) == {"VIEWER", "ANALYST"}


def test_commit_failure_rolls_back_flushed_rows(db_session, monkeypatch):
    def fail_commit():
        raise InjectedFailure("commit")

    monkeypatch.setattr(db_session, "commit", fail_commit)
    with pytest.raises(InjectedFailure):
        with unit_of_work(db_session):
            NotificationRepository(db_session).create(Notification(title="No confirmar", message="Prueba", type="TEST"))

    assert db_session.is_active
    with Session(db_session.get_bind()) as stored:
        assert count_rows(stored, Notification) == 0


def test_database_flush_failure_rolls_back_prior_writes_and_recovers_session(db_session, user_factory):
    user = user_factory("VIEWER", email="existing@example.com")
    user_id = user.id

    with pytest.raises(IntegrityError):
        with unit_of_work(db_session):
            NotificationRepository(db_session).create(Notification(title="Antes del fallo", message="Prueba", type="TEST"))
            UserRepository(db_session).create(User(
                full_name="Duplicado",
                email="existing@example.com",
                password_hash="unused",
                is_active=True,
            ))

    assert db_session.is_active
    with Session(db_session.get_bind()) as stored:
        assert count_rows(stored, Notification) == 0
        assert count_rows(stored, User) == 1
        assert stored.get(User, user_id).full_name == "Usuario de prueba"
