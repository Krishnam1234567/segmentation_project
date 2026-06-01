from pydantic import BaseModel
from typing import List, Literal

class Contract(BaseModel):
    id: str
    name: str
    counterparty: str
    type: str
    value: str
    endDate: str
    status: Literal['active', 'pending', 'completed', 'expired', 'compliant', 'non-compliant']
    risk: Literal['low', 'medium', 'high', 'critical']

class ClauseAnalysis(BaseModel):
    totalClauses: int
    highRisk: int
    mediumRisk: int
    lowRisk: int

class AIInsight(BaseModel):
    title: str
    description: str
    contract_id: str
    severity: Literal['primary', 'warning', 'destructive']

class ContractsResponse(BaseModel):
    total_contracts: str
    total_contracts_change: str
    total_value: str
    expiring_soon: int
    ai_reviewed_percentage: str
    contracts: List[Contract]
    clause_analysis: ClauseAnalysis
    ai_insights: List[AIInsight]
