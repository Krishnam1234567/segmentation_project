from pydantic import BaseModel
from typing import List, Literal

class ComplianceScore(BaseModel):
    category: str
    score: int

class MonthlyTrend(BaseModel):
    month: str
    compliance: int

class ComplianceTask(BaseModel):
    id: int
    title: str
    due: str
    status: Literal['active', 'pending', 'completed', 'expired', 'compliant', 'non-compliant']
    priority: Literal['low', 'medium', 'high', 'critical']

class UpcomingFiling(BaseModel):
    framework: str
    filing: str
    deadline: str
    jurisdiction: str

class RegulatoryUpdate(BaseModel):
    title: str
    description: str
    action_text: str
    severity: Literal['primary', 'warning', 'destructive']

class ComplianceResponse(BaseModel):
    overall_score: str
    active_frameworks: int
    tasks_due: int
    non_compliant: int
    compliance_scores: List[ComplianceScore]
    monthly_trend: List[MonthlyTrend]
    tasks: List[ComplianceTask]
    upcoming_filings: List[UpcomingFiling]
    regulatory_updates: List[RegulatoryUpdate]
