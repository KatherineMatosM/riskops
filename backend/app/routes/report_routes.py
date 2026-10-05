from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.report_schema import ReportFilterParams
from app.controllers import report_controller

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/risks")
def risks_report(filters: ReportFilterParams = Depends(), db: Session = Depends(get_db)):
    return report_controller.risks_report(filters, db)


@router.get("/mitigations")
def mitigations_report(db: Session = Depends(get_db)):
    return report_controller.mitigations_report(db)


@router.get("/critical-risks")
def critical_risks_report(db: Session = Depends(get_db)):
    return report_controller.critical_risks_report(db)