"""
LexOS — Analytics & Executive Intelligence API
Database-backed legal KPIs, spend forecasting, and executive reporting.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.db.models import (AnalyticsKPI, LegalSpend, RiskTrendAnalytics,
                           EfficiencyMetric, MatterCategory, SpendForecast, ExecutiveSummary)
from google import genai

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class ReportRequest(BaseModel):
    period: str
    focus_area: str


@router.get("/")
async def get_analytics_data(db: AsyncSession = Depends(get_db)):
    """Get analytics, KPIs, spend trends, and executive intelligence."""
    # KPIs
    kpi_r = await db.execute(select(AnalyticsKPI))
    kpis_raw = {k.key: k.value for k in kpi_r.scalars().all()}
    kpis = {
        "total_legal_spend": kpis_raw.get("total_legal_spend", ""),
        "spend_change": kpis_raw.get("spend_change", ""),
        "cost_per_matter": kpis_raw.get("cost_per_matter", ""),
        "cost_change": kpis_raw.get("cost_change", ""),
        "matter_cycle_time": kpis_raw.get("matter_cycle_time", ""),
        "cycle_change": kpis_raw.get("cycle_change", ""),
        "prevention_rate": kpis_raw.get("prevention_rate", ""),
        "prevention_change": kpis_raw.get("prevention_change", ""),
        "attorney_hours_saved": int(kpis_raw.get("attorney_hours_saved", 0)),
        "ai_savings_usd": int(kpis_raw.get("ai_savings_usd", 0)),
    }

    # Legal spend
    ls_r = await db.execute(select(LegalSpend).order_by(LegalSpend.id))
    legal_spend = [{"month": s.month, "internal": s.internal, "external": s.external, "budget": s.budget}
                   for s in ls_r.scalars().all()]

    # Risk trends
    rt_r = await db.execute(select(RiskTrendAnalytics).order_by(RiskTrendAnalytics.id))
    risk_trends = [{"month": r.month, "contractRisk": r.contractRisk,
                    "complianceRisk": r.complianceRisk, "litigationRisk": r.litigationRisk}
                   for r in rt_r.scalars().all()]

    # Efficiency
    eff_r = await db.execute(select(EfficiencyMetric).order_by(EfficiencyMetric.id))
    efficiency = [{"name": e.name, "aiTime": e.aiTime, "manualTime": e.manualTime}
                  for e in eff_r.scalars().all()]

    # Matters by category
    mc_r = await db.execute(select(MatterCategory).order_by(MatterCategory.id))
    matters = [{"name": m.name, "value": m.value, "color": m.color}
               for m in mc_r.scalars().all()]

    # Spend forecast
    sf_r = await db.execute(select(SpendForecast).order_by(SpendForecast.id))
    forecast = [{"month": f.month, "forecast": f.forecast, "lower": f.lower, "upper": f.upper}
                for f in sf_r.scalars().all()]

    # Executive summary
    es_r = await db.execute(select(ExecutiveSummary))
    exec_summary = {e.key: e.value for e in es_r.scalars().all()}

    return {
        "kpis": kpis,
        "legal_spend": legal_spend,
        "risk_trends": risk_trends,
        "efficiency": efficiency,
        "matters_by_category": matters,
        "spend_forecast": forecast,
        "executive_summary": exec_summary,
    }


@router.post("/report")
async def generate_executive_report(req: ReportRequest):
    """Generate AI executive intelligence report."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"Generate a concise executive legal intelligence summary for period: {req.period}.\n"
            f"Focus area: {req.focus_area}.\n"
            f"Include: key risks, cost insights, AI efficiency gains, and 2 strategic recommendations.\n"
            f"Format as a professional board-level memo. 150 words max."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"period": req.period, "report": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
