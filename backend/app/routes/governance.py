"""
LexOS — Governance & Board Management API
Database-backed board resolutions, ESOP, directors, and corporate calendar.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.config import settings
from app.db.session import get_db
from app.db.models import (GovernanceSummary, BoardMember, BoardResolution,
                           ESOPData, GovernanceCalendar)
from google import genai

router = APIRouter(prefix="/governance", tags=["Governance"])


class ResolutionDraftRequest(BaseModel):
    resolution_type: str
    context: str


@router.get("/")
async def get_governance_data(db: AsyncSession = Depends(get_db)):
    """Get governance data from database."""
    # Summary
    sum_r = await db.execute(select(GovernanceSummary))
    summary_raw = {s.key: s.value for s in sum_r.scalars().all()}
    summary = {
        "board_members": int(summary_raw.get("board_members", 0)),
        "resolutions_ytd": int(summary_raw.get("resolutions_ytd", 0)),
        "esop_granted_pct": float(summary_raw.get("esop_granted_pct", 0)),
        "avg_attendance": int(summary_raw.get("avg_attendance", 0)),
    }

    # Board members
    bm_r = await db.execute(select(BoardMember).order_by(BoardMember.id))
    board_members = [
        {"id": b.id, "name": b.name, "role": b.role, "committees": b.committees,
         "tenure": b.tenure, "attendance": b.attendance, "independent": b.independent, "avatar": b.avatar}
        for b in bm_r.scalars().all()
    ]

    # Resolutions
    res_r = await db.execute(select(BoardResolution))
    resolutions = [
        {"id": r.id, "title": r.title, "date": r.date, "status": r.status,
         "votes": r.votes, "type": r.type}
        for r in res_r.scalars().all()
    ]

    # ESOP
    esop_r = await db.execute(select(ESOPData))
    esop_raw = {e.key: e.value for e in esop_r.scalars().all()}
    esop = {
        "total_pool_pct": float(esop_raw.get("total_pool_pct", 0)),
        "granted_pct": float(esop_raw.get("granted_pct", 0)),
        "available_pct": float(esop_raw.get("available_pct", 0)),
        "distribution": json.loads(esop_raw.get("distribution", "[]")),
        "vesting_data": json.loads(esop_raw.get("vesting_data", "[]")),
    }

    # Calendar
    cal_r = await db.execute(select(GovernanceCalendar).order_by(GovernanceCalendar.id))
    calendar = [{"date": c.date, "title": c.title, "type": c.type, "urgent": c.urgent}
                for c in cal_r.scalars().all()]

    return {
        "summary": summary,
        "board_members": board_members,
        "resolutions": resolutions,
        "esop": esop,
        "calendar": calendar,
    }


@router.post("/draft-resolution")
async def draft_resolution(req: ResolutionDraftRequest):
    """AI-drafted board resolution text."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"Draft a formal corporate board resolution for a Delaware-incorporated company.\n"
            f"Resolution type: {req.resolution_type}\nContext: {req.context}\n\n"
            f"Format: WHEREAS recitals + RESOLVED clauses. Professional legal language. Keep it concise."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"draft": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
