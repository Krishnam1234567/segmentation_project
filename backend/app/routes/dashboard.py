"""
LexOS — Dashboard API
Database-backed enterprise dashboard overview.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import (DashboardKPI, RiskTrendData, LitigationCategory,
                           JurisdictionExposure, UpcomingDeadline, RecentAlert, Contract)
from app.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
async def get_dashboard_data(db: AsyncSession = Depends(get_db)):
    """Get enterprise dashboard overview data from database."""
    # KPIs
    kpi_r = await db.execute(select(DashboardKPI))
    kpis = {k.key: k.value for k in kpi_r.scalars().all()}

    # Dynamic Active Contracts
    active_contracts_res = await db.execute(select(func.count()).select_from(Contract).where(Contract.status == "active"))
    active_contracts_count = active_contracts_res.scalar() or 0
    kpis["active_contracts"] = f"{active_contracts_count:,}"
    kpis["active_contracts_change"] = f"+{max(0, active_contracts_count - 1200)} this quarter"

    # Risk trend
    trend_r = await db.execute(select(RiskTrendData).order_by(RiskTrendData.id))
    risk_trend = [{"month": r.month, "risk": r.risk, "compliance": r.compliance}
                  for r in trend_r.scalars().all()]

    # Litigation categories
    lit_r = await db.execute(select(LitigationCategory).order_by(LitigationCategory.id))
    litigation = [{"name": l.name, "value": l.value} for l in lit_r.scalars().all()]

    # Jurisdiction exposure
    jur_r = await db.execute(select(JurisdictionExposure).order_by(JurisdictionExposure.id))
    jurisdictions = [{"name": j.name, "contracts": j.contracts, "risk": j.risk}
                     for j in jur_r.scalars().all()]

    # Deadlines
    dl_r = await db.execute(select(UpcomingDeadline).order_by(UpcomingDeadline.id))
    deadlines = [{"id": d.id, "title": d.title, "date": d.date, "type": d.type, "risk": d.risk}
                 for d in dl_r.scalars().all()]

    # Alerts
    alert_r = await db.execute(select(RecentAlert).order_by(RecentAlert.id))
    alerts = [{"id": a.id, "message": a.message, "time": a.time, "severity": a.severity}
              for a in alert_r.scalars().all()]

    return {
        "legal_risk_score": kpis.get("legal_risk_score", ""),
        "legal_risk_change": kpis.get("legal_risk_change", ""),
        "active_contracts": kpis.get("active_contracts", ""),
        "active_contracts_change": kpis.get("active_contracts_change", ""),
        "litigation_risk": kpis.get("litigation_risk", ""),
        "litigation_risk_change": kpis.get("litigation_risk_change", ""),
        "compliance_rate": kpis.get("compliance_rate", ""),
        "compliance_rate_change": kpis.get("compliance_rate_change", ""),
        "risk_trend_data": risk_trend,
        "litigation_data": litigation,
        "jurisdiction_data": jurisdictions,
        "upcoming_deadlines": deadlines,
        "recent_alerts": alerts,
    }
