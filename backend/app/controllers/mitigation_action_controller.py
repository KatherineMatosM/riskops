from sqlalchemy.orm import Session
from app.schemas.mitigation_action_schema import MitigationActionCreateRequest, MitigationActionUpdateRequest
from app.services.mitigation_action_service import MitigationActionService
from app.utils.response_helper import success_response


def list_actions_by_plan(plan_id: int, db: Session):
    return success_response(MitigationActionService(db).list_by_plan(plan_id))


def create_action(plan_id: int, data: MitigationActionCreateRequest, db: Session):
    return success_response(MitigationActionService(db).create_action(plan_id, data))


def update_action(action_id: int, data: MitigationActionUpdateRequest, db: Session):
    return success_response(MitigationActionService(db).update_action(action_id, data))


def delete_action(action_id: int, db: Session):
    MitigationActionService(db).delete_action(action_id)
    return success_response({"message": "Accion de mitigacion eliminada correctamente."})