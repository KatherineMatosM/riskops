from sqlalchemy.orm import Session
from app.models.risk_category import RiskCategory

DEFAULT_CATEGORIES = [
    "Tecnologico", "Operacional", "Financiero", "Seguridad",
    "Legal", "Recursos Humanos", "Proveedores", "Continuidad del Negocio",
]


def seed_categories(db: Session) -> None:
    for name in DEFAULT_CATEGORIES:
        existing = db.query(RiskCategory).filter(RiskCategory.name == name).first()
        if not existing:
            db.add(RiskCategory(name=name, description=f"Categoria de riesgo: {name}", status="ACTIVE"))
    db.commit()