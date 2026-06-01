"""
LexOS — Contract Intelligence API
Full CRUD with SQLAlchemy ORM and Gemini AI analysis.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.config import settings
from app.db.session import get_db
from app.db.models import Contract, AuditLog, KGNode, KGEdge, KGRelationship, RecentAlert, JurisdictionExposure, RiskTrendData
from google import genai

router = APIRouter(prefix="/contracts", tags=["Contracts"])


class ContractAnalysisRequest(BaseModel):
    contract_id: str
    contract_name: str
    contract_type: str
    key_concern: str | None = None


class ContractAddRequest(BaseModel):
    name: str
    counterparty: str
    type: str
    value: str
    endDate: str
    status: str = "active"
    risk: str = "medium"


async def _add_audit_log(db: AsyncSession, user: str, action: str, severity: str, resource: str):
    log_id = f"LOG-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db.add(AuditLog(id=log_id, user=user, action=action, severity=severity,
                    resource=resource, time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ip="192.168.1.1"))


@router.get("/")
async def get_contracts_data(db: AsyncSession = Depends(get_db)):
    """Get contract repository from database."""
    result = await db.execute(select(Contract).order_by(Contract.id))
    contracts = [
        {"id": c.id, "name": c.name, "counterparty": c.counterparty, "type": c.type,
         "value": c.value, "endDate": c.endDate, "status": c.status, "risk": c.risk, "analysis": c.analysis}
        for c in result.scalars().all()
    ]

    active = [c for c in contracts if c["status"] == "active"]
    high_risk = sum(1 for c in contracts if c["risk"] == "high")
    medium_risk = sum(1 for c in contracts if c["risk"] == "medium")
    total_clauses = len(contracts) * 47

    return {
        "total_contracts": len(contracts),
        "total_contracts_change": f"+{len(contracts) - 3} this quarter",
        "total_value": f"${sum(int(c['value'].replace('$','').replace(',','')) for c in contracts if c['value'] != '$0'):,}",
        "expiring_soon": sum(1 for c in contracts if c["endDate"] < "2027-01-01"),
        "ai_reviewed_percentage": f"{min(98, 85 + len(contracts))}%",
        "contracts": contracts,
        "clause_analysis": {
            "totalClauses": total_clauses,
            "highRisk": high_risk * 3,
            "mediumRisk": medium_risk * 8,
            "lowRisk": total_clauses - high_risk * 3 - medium_risk * 8,
        },
        "ai_insights": [
            {"title": "Indemnification Gap Detected", "description": "Contract CTR-2024-003 contains unlimited indemnity exposure without reciprocal cap.", "severity": "destructive", "contract_id": "CTR-2024-003"},
            {"title": "Auto-Renewal Clause Warning", "description": "3 contracts have 30-day auto-renewal windows approaching. Review recommended.", "severity": "warning", "contract_id": "CTR-2024-001"},
            {"title": "Favorable Terms Identified", "description": "AWS Enterprise License has 15% below-market pricing with guaranteed SLA.", "severity": "primary", "contract_id": "CTR-2024-006"},
        ],
    }


@router.post("/add")
async def add_contract(req: ContractAddRequest, db: AsyncSession = Depends(get_db)):
    """Add a new contract to the database."""
    result = await db.execute(select(func.count()).select_from(Contract))
    count = result.scalar()
    ctr_id = f"CTR-2024-{count + 1:03d}"

    db.add(Contract(id=ctr_id, name=req.name, counterparty=req.counterparty, type=req.type,
                    value=req.value, endDate=req.endDate, status=req.status, risk=req.risk))

    # Add Knowledge Graph Node for the contract
    contract_node_id = f"node_ctr_{ctr_id}"
    db.add(KGNode(
        id=contract_node_id, label=req.name, sublabel=req.type, type="contract",
        x=0, y=0, risk=req.risk, icon="📄"
    ))

    # Check or Add Knowledge Graph Node for the counterparty
    counterparty_id = f"node_ent_{req.counterparty.replace(' ', '_').lower()}"
    existing_ent = await db.execute(select(KGNode).where(KGNode.id == counterparty_id))
    if not existing_ent.scalar_one_or_none():
        db.add(KGNode(
            id=counterparty_id, label=req.counterparty, sublabel="Counterparty", type="entity",
            x=0, y=0, risk="low", icon="🏢"
        ))

    # Add Edge and Relationship
    rel_id = f"rel_{ctr_id}_{counterparty_id}"
    db.add(KGEdge(source=counterparty_id, target=contract_node_id, label="Signed"))
    db.add(KGRelationship(
        id=rel_id, from_entity=req.counterparty, to_entity=req.name,
        relation="Signed", type="contractual", risk=req.risk
    ))

    await _add_audit_log(db, "sarah.chen@nexustech.com", f"New contract added: {req.name} ({ctr_id})", "medium", f"Contract: {ctr_id}")
    
    # Update Dashboard Graphs dynamically
    jur_r = await db.execute(select(JurisdictionExposure).limit(1))
    jur = jur_r.scalar_one_or_none()
    if jur:
        jur.contracts += 1
        if req.risk in ["high", "critical"]:
            jur.risk += 1
            
    trend_r = await db.execute(select(RiskTrendData).order_by(RiskTrendData.id.desc()).limit(1))
    trend = trend_r.scalar_one_or_none()
    if trend and req.risk in ["high", "critical"]:
        trend.risk += 2
        trend.compliance -= 1
        
    alert_id = int(datetime.now().timestamp())
    db.add(RecentAlert(id=alert_id, message=f"New {req.risk} risk contract added: {req.name}", time="Just now", severity=req.risk))

    await db.commit()
    return {"status": "created", "id": ctr_id, "name": req.name}

@router.delete("/{contract_id}")
async def delete_contract(contract_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a contract and its associated Knowledge Graph data."""
    # Find contract
    result = await db.execute(select(Contract).where(Contract.id == contract_id))
    contract = result.scalar_one_or_none()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    # Delete contract
    await db.delete(contract)

    # Delete associated KGNode for contract
    contract_node_id = f"node_ctr_{contract_id}"
    node_res = await db.execute(select(KGNode).where(KGNode.id == contract_node_id))
    contract_node = node_res.scalar_one_or_none()
    if contract_node:
        await db.delete(contract_node)

    # Delete KGEdges involving this contract
    edges_res = await db.execute(select(KGEdge).where((KGEdge.source == contract_node_id) | (KGEdge.target == contract_node_id)))
    for edge in edges_res.scalars().all():
        await db.delete(edge)

    # Delete KGRelationships involving this contract
    # Since we don't have node IDs in KGRelationship (we have names), we can delete by the exact names
    rel_res = await db.execute(select(KGRelationship).where((KGRelationship.to_entity == contract.name) | (KGRelationship.from_entity == contract.name)))
    for rel in rel_res.scalars().all():
        await db.delete(rel)

    await _add_audit_log(db, "sarah.chen@nexustech.com", f"Contract deleted: {contract.name} ({contract_id})", "high", f"Contract: {contract_id}")
    
    # Update Dashboard Graphs dynamically
    jur_r = await db.execute(select(JurisdictionExposure).limit(1))
    jur = jur_r.scalar_one_or_none()
    if jur and jur.contracts > 0:
        jur.contracts -= 1
        if contract.risk in ["high", "critical"] and jur.risk > 0:
            jur.risk -= 1
            
    trend_r = await db.execute(select(RiskTrendData).order_by(RiskTrendData.id.desc()).limit(1))
    trend = trend_r.scalar_one_or_none()
    if trend and contract.risk in ["high", "critical"] and trend.risk > 0:
        trend.risk -= 2
        trend.compliance += 1
        
    alert_id = int(datetime.now().timestamp()) + 1
    db.add(RecentAlert(id=alert_id, message=f"Contract deleted: {contract.name}", time="Just now", severity="medium"))

    await db.commit()
    return {"status": "deleted", "id": contract_id}


@router.post("/analyze")
async def analyze_contract(req: ContractAnalysisRequest, db: AsyncSession = Depends(get_db)):
    """AI-powered contract analysis using Gemini. Saves result to DB."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"You are an expert contract lawyer. Analyze this enterprise contract:\n"
            f"Contract ID: {req.contract_id}\n"
            f"Name: {req.contract_name}\n"
            f"Type: {req.contract_type}\n"
            f"{f'Key concern: {req.key_concern}' if req.key_concern else ''}\n\n"
            f"Provide: 1) Key risk clauses to watch, 2) Compliance obligations, "
            f"3) Negotiation leverage points, 4) Recommended next action.\n"
            f"Be concise and actionable. 4-5 sentences max. Professional legal tone."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)

        # Persist analysis to DB
        result = await db.execute(select(Contract).where(Contract.id == req.contract_id))
        contract = result.scalar_one_or_none()
        if contract:
            contract.analysis = response.text

        await _add_audit_log(db, "ai-system", f"AI analysis completed for contract {req.contract_id}", "low", f"Contract: {req.contract_id}")
        
        alert_id = int(datetime.now().timestamp()) + 2
        db.add(RecentAlert(id=alert_id, message=f"AI Analysis complete for: {req.contract_name}", time="Just now", severity="low"))
        await db.commit()
        
        return {"contract_id": req.contract_id, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
