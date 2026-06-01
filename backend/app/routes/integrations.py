"""
LexOS — Integrations API
Database-backed enterprise integration status and sync activity.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import IntegrationSummary, Integration, IntegrationActivity

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/")
async def get_integrations_data(db: AsyncSession = Depends(get_db)):
    """Get enterprise integration status and sync activity."""
    # Summary
    sum_r = await db.execute(select(IntegrationSummary))
    summary_raw = {s.key: s.value for s in sum_r.scalars().all()}
    summary = {
        "connected": int(summary_raw.get("connected", 0)),
        "total": int(summary_raw.get("total", 0)),
        "records_synced_24h": summary_raw.get("records_synced_24h", ""),
        "avg_uptime_pct": float(summary_raw.get("avg_uptime_pct", 0)),
        "pending_setup": int(summary_raw.get("pending_setup", 0)),
    }

    # Integrations
    int_r = await db.execute(select(Integration))
    integrations = [
        {"id": i.id, "name": i.name, "category": i.category, "logo": i.logo,
         "status": i.status, "lastSync": i.lastSync, "recordsSync": i.recordsSync,
         "description": i.description, "features": i.features, "health": i.health}
        for i in int_r.scalars().all()
    ]

    # Activity
    act_r = await db.execute(select(IntegrationActivity).order_by(IntegrationActivity.id))
    activity = [{"time": a.time, "event": a.event, "status": a.status}
                for a in act_r.scalars().all()]

    return {
        "summary": summary,
        "integrations": integrations,
        "recent_activity": activity,
    }
