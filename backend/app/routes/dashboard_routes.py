from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.controllers import dashboard_controller

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    return dashboard_controller.get_summary(db)


@router.get("/risks-by-level")
def get_risks_by_level(db: Session = Depends(get_db)):
    return dashboard_controller.get_risks_by_level(db)


@router.get("/risks-by-category")
def get_risks_by_category(db: Session = Depends(get_db)):
    return dashboard_controller.get_risks_by_category(db)


@router.get("/risks-by-status")
def get_risks_by_status(db: Session = Depends(get_db)):
    return dashboard_controller.get_risks_by_status(db)


@router.get("/risk-trend")
def get_risk_trend(db: Session = Depends(get_db)):
    return dashboard_controller.get_risk_trend(db)


@router.get("/mitigations-by-status")
def get_mitigations_by_status(db: Session = Depends(get_db)):
    return dashboard_controller.get_mitigations_by_status(db)


@router.get("/risk-matrix")
def get_risk_matrix(db: Session = Depends(get_db)):
    return dashboard_controller.get_risk_matrix(db)