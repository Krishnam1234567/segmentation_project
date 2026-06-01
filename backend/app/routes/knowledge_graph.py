"""
LexOS — Knowledge Graph API
Database-backed legal entity relationships and graph data.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_db
from app.db.models import KGSummary, KGNode, KGEdge, KGRelationship
from google import genai

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])


class RelationshipQueryRequest(BaseModel):
    entity_name: str
    context: str


@router.get("/")
async def get_knowledge_graph_data(db: AsyncSession = Depends(get_db)):
    """Get legal knowledge graph nodes, edges, and relationship data."""
    # Summary (Dynamic)
    node_count_res = await db.execute(select(func.count()).select_from(KGNode))
    total_nodes = node_count_res.scalar() or 0

    rel_count_res = await db.execute(select(func.count()).select_from(KGRelationship))
    total_rels = rel_count_res.scalar() or 0

    high_risk_res = await db.execute(select(func.count()).select_from(KGRelationship).where(KGRelationship.risk == "high"))
    high_risk_links = high_risk_res.scalar() or 0

    docs_res = await db.execute(select(func.count()).select_from(KGNode).where(KGNode.type == "contract"))
    docs_indexed = docs_res.scalar() or 0

    # Nodes
    node_r = await db.execute(select(KGNode))
    nodes = [{"id": n.id, "label": n.label, "sublabel": n.sublabel, "type": n.type,
              "x": n.x, "y": n.y, "risk": n.risk, "icon": n.icon}
             for n in node_r.scalars().all()]

    # Edges
    edge_r = await db.execute(select(KGEdge).order_by(KGEdge.id))
    edges = [{"from": e.source, "to": e.target, "label": e.label}
             for e in edge_r.scalars().all()]

    # Relationships
    rel_r = await db.execute(select(KGRelationship))
    relationships = [
        {"id": r.id, "from": r.from_entity, "to": r.to_entity,
         "relation": r.relation, "type": r.type, "risk": r.risk}
        for r in rel_r.scalars().all()
    ]

    return {
        "summary": {
            "total_nodes": total_nodes,
            "total_relationships": total_rels,
            "high_risk_links": high_risk_links,
            "documents_indexed": docs_indexed,
        },
        "nodes": nodes,
        "edges": edges,
        "relationships": relationships,
    }


@router.post("/query")
async def query_relationships(req: RelationshipQueryRequest):
    """AI-powered legal relationship query."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"You are a legal knowledge graph expert. Analyze legal relationships for: {req.entity_name}\n"
            f"Context: {req.context}\n\n"
            f"Identify: key legal dependencies, risk propagation paths, and recommended actions. 3-4 sentences."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        return {"entity": req.entity_name, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
