from pydantic import BaseModel
from typing import List, Literal

class Agent(BaseModel):
    id: int
    name: str
    description: str
    status: Literal['active', 'idle']
    tasksCompleted: int
    lastAction: str
    confidence: int

class RecentActivity(BaseModel):
    agent: str
    action: str
    timestamp: str
    type: Literal['alert', 'success', 'info']

class ApprovalQueueItem(BaseModel):
    id: int
    agent: str
    task: str
    reasoning: str
    confidence: int
    impact: str

class AgentsResponse(BaseModel):
    active_agents: int
    total_agents: int
    tasks_completed_month: int
    pending_approval: int
    agents: List[Agent]
    recent_activity: List[RecentActivity]
    approval_queue: List[ApprovalQueueItem]
