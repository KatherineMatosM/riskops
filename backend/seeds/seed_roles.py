from sqlalchemy.orm import Session
from app.models.role import Role
from app.config.security import ALL_ROLES

ROLE_DESCRIPTIONS = {
    "ADMIN": "Acceso completo al sistema.",
    "RISK_MANAGER": "Gestion completa de riesgos y mitigaciones.",
    "ANALYST": "Puede crear, evaluar y analizar riesgos.",
    "VIEWER": "Acceso de solo lectura.",
}


def seed_roles(db: Session) -> None:
    for role_name in ALL_ROLES:
        existing = db.query(Role).filter(Role.name == role_name).first()
        if not existing:
            db.add(Role(name=role_name, description=ROLE_DESCRIPTIONS.get(role_name, "")))
    db.commit()