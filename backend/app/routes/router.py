from fastapi import APIRouter, Depends
from app.middleware.auth_middleware import get_current_user
from app.routes import (
    auth_routes, user_routes, risk_category_routes, risk_routes,
    risk_evaluation_routes, mitigation_plan_routes, mitigation_action_routes,
    notification_routes, dashboard_routes, report_routes, analytics_routes,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_routes.router)

for protected_router in (
    user_routes.router,
    risk_category_routes.router,
    risk_routes.router,
    risk_evaluation_routes.router,
    mitigation_plan_routes.router,
    mitigation_action_routes.router,
    notification_routes.router,
    dashboard_routes.router,
    report_routes.router,
    analytics_routes.router,
):
    api_router.include_router(protected_router, dependencies=[Depends(get_current_user)])
