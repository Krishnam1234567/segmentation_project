from pydantic import BaseModel
from typing import List, Literal

class RiskTrend(BaseModel):
    month: str
    risk: int
    compliance: int

class LitigationCategory(BaseModel):
    name: str
    value: int

class JurisdictionData(BaseModel):
    name: str
    contracts: int
    risk: int

class Deadline(BaseModel):
    id: int
    title: str
    date: str
    type: str
    risk: Literal['low', 'medium', 'high', 'critical']

class Alert(BaseModel):
    id: int
    message: str
    time: str
    severity: Literal['low', 'medium', 'high', 'critical']

class DashboardResponse(BaseModel):
    legal_risk_score: str
    legal_risk_change: str
    active_contracts: str
    active_contracts_change: str
    litigation_risk: str
    litigation_risk_change: str
    compliance_rate: str
    compliance_rate_change: str
    risk_trend_data: List[RiskTrend]
    litigation_data: List[LitigationCategory]
    jurisdiction_data: List[JurisdictionData]
    upcoming_deadlines: List[Deadline]
    recent_alerts: List[Alert]
