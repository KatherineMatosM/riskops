from sqlalchemy.orm import Session
from app.schemas.report_schema import ReportFilterParams
from app.services.report_service import ReportService
from app.utils.response_helper import success_response


def risks_report(filters: ReportFilterParams, db: Session):
    return success_response(ReportService(db).risks_report(filters))


def mitigations_report(db: Session):
    return success_response(ReportService(db).mitigations_report())


def critical_risks_report(db: Session):
    return success_response(ReportService(db).critical_risks_report())