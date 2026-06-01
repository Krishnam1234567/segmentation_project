"""
LexOS — Litigation Prediction API
Database-backed case risk scoring, outcome prediction, and cost forecasting.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.db.models import (LitigationSummary, LitigationRiskFactor, CaseOutcome,
                           CostTrend, LitigationCase)
from google import genai

router = APIRouter(prefix="/litigation", tags=["Litigation"])


class LitigationAnalysisRequest(BaseModel):
    case_id: str
    description: str


@router.get("/")
async def get_litigation_data(db: AsyncSession = Depends(get_db)):
    """Get litigation portfolio, risk scores, and AI recommendations."""
    # Summary
    sum_r = await db.execute(select(LitigationSummary))
    summary = {s.key: s.value for s in sum_r.scalars().all()}

    # Risk factors
    rf_r = await db.execute(select(LitigationRiskFactor).order_by(LitigationRiskFactor.id))
    risk_factors = [{"subject": r.subject, "A": r.score, "fullMark": r.fullMark}
                    for r in rf_r.scalars().all()]

    # Case outcomes
    co_r = await db.execute(select(CaseOutcome).order_by(CaseOutcome.id))
    case_outcomes = [{"month": c.month, "won": c.won, "settled": c.settled, "lost": c.lost}
                     for c in co_r.scalars().all()]

    # Cost trend
    ct_r = await db.execute(select(CostTrend).order_by(CostTrend.id))
    cost_trend = [{"month": c.month, "projected": c.projected, "actual": c.actual}
                  for c in ct_r.scalars().all()]

    # Active cases
    cases_r = await db.execute(select(LitigationCase))
    active_cases = [
        {"id": c.id, "title": c.title, "type": c.type, "risk": c.risk,
         "status": c.status, "nextHearing": c.nextHearing, "exposure": c.exposure,
         "winProb": c.winProb, "counsel": c.counsel, "ai_recommendation": c.ai_recommendation}
        for c in cases_r.scalars().all()
    ]

    return {
        "summary": {
            "active_cases": int(summary.get("active_cases", 0)),
            "high_risk_cases": int(summary.get("high_risk_cases", 0)),
            "total_exposure": summary.get("total_exposure", ""),
            "avg_win_probability": int(summary.get("avg_win_probability", 0)),
            "cases_resolved_ytd": int(summary.get("cases_resolved_ytd", 0)),
            "favorable_outcomes": int(summary.get("favorable_outcomes", 0)),
        },
        "risk_factors": risk_factors,
        "case_outcomes": case_outcomes,
        "cost_trend": cost_trend,
        "active_cases": active_cases,
    }


@router.post("/analyze")
async def analyze_case(req: LitigationAnalysisRequest):
    """Get AI analysis for a specific case."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"You are a legal AI analyst. Analyze this litigation case and provide:\n"
            f"1. Risk assessment (0-100)\n2. Win probability\n3. Strategic recommendation\n"
            f"4. Estimated cost range\n\nCase ID: {req.case_id}\nDescription: {req.description}\n\n"
            f"Respond in 3-4 sentences, professional legal tone."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"case_id": req.case_id, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
