"""
LexOS — Legal Digital Twin API
Database-backed entity and director data.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import LegalEntity, Director, DigitalTwinSummary
from app.schemas.digital_twin import DigitalTwinResponse

router = APIRouter(prefix="/digital-twin", tags=["Legal Digital Twin"])


@router.get("/", response_model=DigitalTwinResponse)
async def get_digital_twin_data(db: AsyncSession = Depends(get_db)):
    """Get legal digital twin entity and director data from database."""
    # Summary
    sum_r = await db.execute(select(DigitalTwinSummary))
    summary = {s.key: s.value for s in sum_r.scalars().all()}

    # Entities
    ent_r = await db.execute(select(LegalEntity).order_by(LegalEntity.id))
    entities = [{"id": e.id, "name": e.name, "type": e.type,
                 "jurisdiction": e.jurisdiction, "risk": e.risk}
                for e in ent_r.scalars().all()]

    # Directors
    dir_r = await db.execute(select(Director).order_by(Director.id))
    directors = [{"name": d.name, "role": d.role, "entities": d.entities, "conflicts": d.conflicts}
                 for d in dir_r.scalars().all()]

    return {
        "total_entities": int(summary.get("total_entities", 0)),
        "total_jurisdictions": int(summary.get("total_jurisdictions", 0)),
        "active_directors": int(summary.get("active_directors", 0)),
        "legal_exposure": summary.get("legal_exposure", ""),
        "entities": entities,
        "directors": directors,
    }
