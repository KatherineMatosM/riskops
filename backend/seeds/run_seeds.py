from app.database.session import SessionLocal
from app.database.init_db import wait_for_db, create_all_tables
from seeds.seed_roles import seed_roles
from seeds.seed_admin_user import seed_admin_user
from seeds.seed_categories import seed_categories


def run_all_seeds() -> None:
    wait_for_db()
    create_all_tables()
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_admin_user(db)
        seed_categories(db)
        print("Seeds ejecutados correctamente.")
    finally:
        db.close()


if __name__ == "__main__":
    run_all_seeds()