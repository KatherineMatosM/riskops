from pathlib import Path

from alembic import command
from alembic.config import Config

from app.database.init_db import ensure_database_exists, wait_for_db
from app.database.session import SessionLocal
from seeds.seed_roles import seed_roles
from seeds.seed_categories import seed_categories
from seeds.seed_admin_user import seed_admin_user


BACKEND_ROOT = Path(__file__).resolve().parents[2]


def bootstrap_database() -> None:
    """Create the database, migrate its schema and seed a fresh installation."""
    ensure_database_exists()
    wait_for_db()

    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))
    command.upgrade(config, "head")

    db = SessionLocal()
    try:
        seed_roles(db)
        seed_categories(db)
        seed_admin_user(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_database()
    print("Base de datos inicializada correctamente.")
