"""
LexOS — Settings API
Persistent settings using SQLAlchemy ORM.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from app.db.session import get_db
from app.db.models import Setting

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsSaveRequest(BaseModel):
    section: str
    data: dict[str, Any]


@router.get("/")
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get all settings from database."""
    result = await db.execute(select(Setting))
    rows = result.scalars().all()
    return {row.section: json.loads(row.data) for row in rows}


@router.post("/")
async def save_settings(req: SettingsSaveRequest, db: AsyncSession = Depends(get_db)):
    """Save settings for a specific section."""
    result = await db.execute(select(Setting).where(Setting.section == req.section))
    existing = result.scalar_one_or_none()
    if existing:
        existing.data = json.dumps(req.data)
    else:
        db.add(Setting(section=req.section, data=json.dumps(req.data)))
    return {"status": "saved", "section": req.section, "data": req.data}
