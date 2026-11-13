import os
from itertools import count
os.environ["APP_ENV"] = "test"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database.base import Base
from app.database.session import get_db
from app import models  # noqa: F401
from seeds.seed_roles import seed_roles
from seeds.seed_categories import seed_categories
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.utils.password_hasher import hash_password
from app.utils.jwt_handler import create_access_token

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_roles(db)
    seed_categories(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="session")
def test_password_hash():
    return hash_password("Password123")


@pytest.fixture
def user_factory(db_session, test_password_hash):
    sequence = count(1)

    def create_user(role="VIEWER", *, email=None, is_active=True, full_name="Usuario de prueba", roles=None):
        selected_roles = roles if roles is not None else ([role] if role else [])
        user = User(
            full_name=full_name,
            email=email or f"usuario{next(sequence)}@example.com",
            password_hash=test_password_hash,
            is_active=is_active,
        )
        db_session.add(user)
        db_session.flush()
        for name in selected_roles:
            stored_role = db_session.execute(select(Role).where(Role.name == name)).scalar_one()
            db_session.add(UserRole(user_id=user.id, role_id=stored_role.id))
        db_session.commit()
        db_session.refresh(user)
        return user

    return create_user


@pytest.fixture
def headers_for():
    def make_headers(user):
        return {"Authorization": f"Bearer {create_access_token(str(user.id))}"}

    return make_headers


@pytest.fixture
def admin_headers(user_factory, headers_for):
    return headers_for(user_factory("ADMIN"))


@pytest.fixture
def analyst_headers(user_factory, headers_for):
    return headers_for(user_factory("ANALYST"))


@pytest.fixture
def viewer_headers(user_factory, headers_for):
    return headers_for(user_factory("VIEWER"))
