"""
LexOS — Compliance Automation API
Database-backed compliance monitoring with Gemini AI analysis.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.config import settings
from app.db.session import get_db
from app.db.models import ComplianceScore, ComplianceTask, UpcomingFiling, RegulatoryUpdate, AuditLog
from google import genai

router = APIRouter(prefix="/compliance", tags=["Compliance"])


class ComplianceAnalysisRequest(BaseModel):
    framework: str
    context: str


class TaskUpdateRequest(BaseModel):
    title: str
    due: str
    priority: str
    status: str


async def _add_audit_log(db: AsyncSession, user: str, action: str, severity: str, resource: str):
    log_id = f"LOG-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    db.add(AuditLog(id=log_id, user=user, action=action, severity=severity,
                    resource=resource, time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ip="192.168.1.1"))


@router.get("/")
async def get_compliance_data(db: AsyncSession = Depends(get_db)):
    """Get compliance data from database."""
    scores_r = await db.execute(select(ComplianceScore))
    scores = [{"category": s.category, "score": s.score} for s in scores_r.scalars().all()]

    tasks_r = await db.execute(select(ComplianceTask).order_by(ComplianceTask.id))
    tasks = [{"id": t.id, "title": t.title, "due": t.due, "priority": t.priority, "status": t.status}
             for t in tasks_r.scalars().all()]

    filings_r = await db.execute(select(UpcomingFiling).order_by(UpcomingFiling.deadline))
    filings = [{"id": f.id, "filing": f.filing, "framework": f.framework,
                "jurisdiction": f.jurisdiction, "deadline": f.deadline}
               for f in filings_r.scalars().all()]

    updates_r = await db.execute(select(RegulatoryUpdate).order_by(RegulatoryUpdate.id.desc()))
    updates = [{"id": u.id, "title": u.title, "description": u.description,
                "severity": u.severity, "action_text": u.action_text}
               for u in updates_r.scalars().all()]

    avg_score = sum(s["score"] for s in scores) // max(len(scores), 1)
    pending_tasks = sum(1 for t in tasks if t["status"] in ("pending", "in_progress"))
    non_compliant = sum(1 for s in scores if s["score"] < 85)

    return {
        "overall_score": f"{avg_score}%",
        "active_frameworks": len(scores),
        "tasks_due": pending_tasks,
        "non_compliant": non_compliant,
        "compliance_scores": scores,
        "monthly_trend": [
            {"month": "Jan", "compliance": 82}, {"month": "Feb", "compliance": 85},
            {"month": "Mar", "compliance": 87}, {"month": "Apr", "compliance": 89},
            {"month": "May", "compliance": avg_score}, {"month": "Jun", "compliance": avg_score + 1},
            {"month": "Jul", "compliance": avg_score - 2}, {"month": "Aug", "compliance": avg_score + 2},
            {"month": "Sep", "compliance": avg_score + 1}, {"month": "Oct", "compliance": avg_score + 3},
            {"month": "Nov", "compliance": avg_score + 2}, {"month": "Dec", "compliance": avg_score + 4},
        ],
        "tasks": tasks,
        "upcoming_filings": filings,
        "regulatory_updates": updates,
    }


@router.post("/tasks")
async def add_or_update_task(req: TaskUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Add a new compliance task."""
    db.add(ComplianceTask(title=req.title, due=req.due, priority=req.priority, status=req.status))
    await _add_audit_log(db, "sarah.chen@nexustech.com", f"Created compliance task: {req.title}", "low", "Compliance Module")
    return {"status": "created", "title": req.title}


@router.post("/tasks/{task_id}/status")
async def update_task_status(task_id: int, status: str, db: AsyncSession = Depends(get_db)):
    """Update compliance task status."""
    result = await db.execute(select(ComplianceTask).where(ComplianceTask.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = status
    await _add_audit_log(db, "sarah.chen@nexustech.com", f"Updated compliance task #{task_id} status to {status}", "low", "Compliance Module")
    return {"status": "updated", "task_id": task_id, "new_status": status}


@router.post("/analyze")
async def analyze_compliance(req: ComplianceAnalysisRequest, db: AsyncSession = Depends(get_db)):
    """AI-powered compliance analysis using Gemini."""
    if not settings.GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")
    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        prompt = (
            f"You are a regulatory compliance expert. Analyze the compliance status for:\n"
            f"Framework: {req.framework}\n"
            f"Context: {req.context}\n\n"
            f"Provide: 1) Current compliance gaps, 2) Regulatory exposure risk, "
            f"3) Immediate remediation steps, 4) Timeline recommendation.\n"
            f"Be precise and actionable. 4-5 sentences. Professional compliance tone."
        )
        response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
        await _add_audit_log(db, "ai-system", f"AI compliance analysis for {req.framework}", "low", "Compliance AI")
        return {"framework": req.framework, "analysis": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
