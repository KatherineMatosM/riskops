from sqlalchemy.orm import Session
from app.services.dashboard_service import DashboardService
from app.utils.response_helper import success_response


def get_summary(db: Session):
    return success_response(DashboardService(db).get_summary())


def get_risks_by_level(db: Session):
    return success_response(DashboardService(db).get_risks_by_level())


def get_risks_by_category(db: Session):
    return success_response(DashboardService(db).get_risks_by_category())


def get_risks_by_status(db: Session):
    return success_response(DashboardService(db).get_risks_by_status())


def get_risk_trend(db: Session):
    return success_response(DashboardService(db).get_risk_trend())


def get_mitigations_by_status(db: Session):
    return success_response(DashboardService(db).get_mitigations_by_status())


def get_risk_matrix(db: Session):
    return success_response(DashboardService(db).get_risk_matrix())