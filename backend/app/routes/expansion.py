"""
LexOS — Global Expansion Simulator API
Database-backed jurisdiction analysis and market-entry requirements.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.db.models import ExpansionJurisdiction, ExpansionCostComparison
from google import genai

router = APIRouter(prefix="/expansion", tags=["Global Expansion"])


class ExpansionAnalysisRequest(BaseModel):
    jurisdiction: str
    business_description: str


@router.get("/")
async def get_expansion_data(db: AsyncSession = Depends(get_db)):
    """Get global expansion simulator with jurisdiction readiness data."""
    jur_r = await db.execute(select(ExpansionJurisdiction))
    jurisdictions = [
        {"code": j.code, "name": j.name, "flag": j.flag, "status": j.status,
         "readiness": j.readiness, "regulations": j.regulations, "risks": j.risks,
         "timeline": j.timeline, "cost": j.cost, "score": j.score,
         "tasks": j.tasks, "ai_insight": j.ai_insight}
        for j in jur_r.scalars().all()
    ]

    cost_r = await db.execute(select(ExpansionCostComparison).order_by(ExpansionCostComparison.id))
    cost_comparison = [{"name": c.name, "cost": c.cost, "time": c.time}
                       for c in cost_r.scalars().all()]

    return {"jurisdictions": jurisdictions, "cost_comparison": cost_comparison}


@router.post("/analyze")
async def analyze_jurisdiction(req: ExpansionAnalysisRequest):
    """AI-powered jurisdiction expansion analysis."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"You are a global legal expansion advisor. Analyze expansion into {req.jurisdiction} for: {req.business_description}\n\n"
            f"Provide: 1) Key legal requirements, 2) Major risks, 3) Recommended entity structure, 4) Timeline estimate.\n"
            f"Be concise and practical. 4-5 sentences max."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"jurisdiction": req.jurisdiction, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
