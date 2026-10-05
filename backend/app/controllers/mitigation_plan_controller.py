from sqlalchemy.orm import Session
from app.schemas.mitigation_plan_schema import MitigationPlanCreateRequest, MitigationPlanUpdateRequest
from app.services.mitigation_plan_service import MitigationPlanService
from app.utils.response_helper import success_response
from app.models.user import User


def list_plans_by_risk(risk_id: int, db: Session):
    return success_response(MitigationPlanService(db).list_by_risk(risk_id))


def get_plan(plan_id: int, db: Session):
    return success_response(MitigationPlanService(db).get_plan(plan_id))


def create_plan(risk_id: int, data: MitigationPlanCreateRequest, current_user: User, db: Session):
    return success_response(MitigationPlanService(db).create_plan(risk_id, data, current_user.id))


def update_plan(plan_id: int, data: MitigationPlanUpdateRequest, db: Session):
    return success_response(MitigationPlanService(db).update_plan(plan_id, data))


def delete_plan(plan_id: int, db: Session):
    MitigationPlanService(db).delete_plan(plan_id)
    return success_response({"message": "Plan de mitigacion eliminado correctamente."})