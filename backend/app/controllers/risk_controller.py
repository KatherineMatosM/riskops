from sqlalchemy.orm import Session
from app.schemas.risk_schema import RiskCreateRequest, RiskUpdateRequest, RiskFilterParams
from app.services.risk_service import RiskService
from app.utils.response_helper import success_response
from app.models.user import User


def list_risks(filters: RiskFilterParams, db: Session):
    items, total = RiskService(db).list_risks(filters)
    total_pages = (total + filters.page_size - 1) // filters.page_size if filters.page_size else 0
    return success_response({
        "items": items, "total": total, "page": filters.page,
        "page_size": filters.page_size, "total_pages": total_pages,
    })


def get_risk(risk_id: int, db: Session):
    return success_response(RiskService(db).get_risk(risk_id))


def create_risk(data: RiskCreateRequest, current_user: User, db: Session):
    return success_response(RiskService(db).create_risk(data, current_user.id))


def update_risk(risk_id: int, data: RiskUpdateRequest, current_user: User, db: Session):
    return success_response(RiskService(db).update_risk(risk_id, data, current_user.id))


def delete_risk(risk_id: int, current_user: User, db: Session):
    RiskService(db).delete_risk(risk_id, current_user.id)
    return success_response({"message": "Riesgo eliminado correctamente."})