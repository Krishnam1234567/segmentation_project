"""
LexOS — SQLAlchemy ORM Models
All database table definitions for the LexOS Legal Operating System.
"""

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, JSON,
)
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base for all LexOS models."""
    pass


# ══════════════════════════════════════════════════════════════════════════════
#  Settings
# ══════════════════════════════════════════════════════════════════════════════

class Setting(Base):
    __tablename__ = "settings"

    section = Column(String, primary_key=True)
    data = Column(Text, nullable=False)  # JSON-encoded dict


# ══════════════════════════════════════════════════════════════════════════════
#  Contracts
# ══════════════════════════════════════════════════════════════════════════════

class Contract(Base):
    __tablename__ = "contracts"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    counterparty = Column(String)
    type = Column(String)
    value = Column(String)
    endDate = Column(String)
    status = Column(String, default="active")
    risk = Column(String, default="medium")
    analysis = Column(Text, nullable=True)


# ══════════════════════════════════════════════════════════════════════════════
#  Compliance
# ══════════════════════════════════════════════════════════════════════════════

class ComplianceScore(Base):
    __tablename__ = "compliance_scores"

    category = Column(String, primary_key=True)
    score = Column(Integer, nullable=False)


class ComplianceTask(Base):
    __tablename__ = "compliance_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    due = Column(String)
    priority = Column(String)
    status = Column(String, default="pending")


class UpcomingFiling(Base):
    __tablename__ = "upcoming_filings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filing = Column(String, nullable=False)
    framework = Column(String)
    jurisdiction = Column(String)
    deadline = Column(String)


class RegulatoryUpdate(Base):
    __tablename__ = "regulatory_updates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    severity = Column(String)
    action_text = Column(String)


# ══════════════════════════════════════════════════════════════════════════════
#  Security / Audit
# ══════════════════════════════════════════════════════════════════════════════

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    user = Column(String)
    action = Column(Text)
    severity = Column(String)
    resource = Column(String)
    time = Column(String)
    ip = Column(String)


# ══════════════════════════════════════════════════════════════════════════════
#  AI Agents
# ══════════════════════════════════════════════════════════════════════════════

class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="active")
    tasksCompleted = Column(Integer, default=0)
    lastAction = Column(String)
    confidence = Column(Integer, default=0)


class ApprovalQueueItem(Base):
    __tablename__ = "approval_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent = Column(String)
    task = Column(Text)
    reasoning = Column(Text)
    confidence = Column(Integer)
    impact = Column(String)


class RecentActivity(Base):
    __tablename__ = "recent_activity"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent = Column(String)
    action = Column(Text)
    timestamp = Column(String)
    type = Column(String)


# ══════════════════════════════════════════════════════════════════════════════
#  Dashboard
# ══════════════════════════════════════════════════════════════════════════════

class DashboardKPI(Base):
    __tablename__ = "dashboard_kpis"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class RiskTrendData(Base):
    __tablename__ = "risk_trend_data"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    risk = Column(Integer)
    compliance = Column(Integer)


class LitigationCategory(Base):
    __tablename__ = "litigation_categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    value = Column(Integer)


class JurisdictionExposure(Base):
    __tablename__ = "jurisdiction_exposure"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    contracts = Column(Integer)
    risk = Column(Integer)


class UpcomingDeadline(Base):
    __tablename__ = "upcoming_deadlines"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    date = Column(String)
    type = Column(String)
    risk = Column(String)


class RecentAlert(Base):
    __tablename__ = "recent_alerts"

    id = Column(Integer, primary_key=True)
    message = Column(Text, nullable=False)
    time = Column(String)
    severity = Column(String)


# ══════════════════════════════════════════════════════════════════════════════
#  Litigation
# ══════════════════════════════════════════════════════════════════════════════

class LitigationSummary(Base):
    __tablename__ = "litigation_summary"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class LitigationRiskFactor(Base):
    __tablename__ = "litigation_risk_factors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subject = Column(String, nullable=False)
    score = Column(Integer)
    fullMark = Column(Integer, default=100)


class CaseOutcome(Base):
    __tablename__ = "case_outcomes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    won = Column(Integer, default=0)
    settled = Column(Integer, default=0)
    lost = Column(Integer, default=0)


class CostTrend(Base):
    __tablename__ = "cost_trends"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    projected = Column(Integer)
    actual = Column(Integer, nullable=True)


class LitigationCase(Base):
    __tablename__ = "litigation_cases"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    type = Column(String)
    risk = Column(Integer)
    status = Column(String)
    nextHearing = Column(String)
    exposure = Column(String)
    winProb = Column(Integer)
    counsel = Column(String)
    ai_recommendation = Column(Text)


# ══════════════════════════════════════════════════════════════════════════════
#  Global Expansion
# ══════════════════════════════════════════════════════════════════════════════

class ExpansionJurisdiction(Base):
    __tablename__ = "expansion_jurisdictions"

    code = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    flag = Column(String)
    status = Column(String)
    readiness = Column(Integer)
    regulations = Column(JSON)  # list of strings
    risks = Column(JSON)        # list of dicts
    timeline = Column(String)
    cost = Column(String)
    score = Column(JSON)        # list of dicts
    tasks = Column(JSON)        # list of dicts
    ai_insight = Column(Text)


class ExpansionCostComparison(Base):
    __tablename__ = "expansion_cost_comparison"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    cost = Column(Integer)
    time = Column(Float)


# ══════════════════════════════════════════════════════════════════════════════
#  Governance
# ══════════════════════════════════════════════════════════════════════════════

class GovernanceSummary(Base):
    __tablename__ = "governance_summary"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class BoardMember(Base):
    __tablename__ = "board_members"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    role = Column(String)
    committees = Column(JSON)   # list of strings
    tenure = Column(String)
    attendance = Column(Integer)
    independent = Column(Boolean)
    avatar = Column(String)


class BoardResolution(Base):
    __tablename__ = "board_resolutions"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    date = Column(String)
    status = Column(String)
    votes = Column(JSON)  # dict: {for, against, abstain}
    type = Column(String)


class ESOPData(Base):
    __tablename__ = "esop_data"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)  # JSON-encoded


class GovernanceCalendar(Base):
    __tablename__ = "governance_calendar"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String)
    urgent = Column(Boolean, default=False)


# ══════════════════════════════════════════════════════════════════════════════
#  Analytics
# ══════════════════════════════════════════════════════════════════════════════

class AnalyticsKPI(Base):
    __tablename__ = "analytics_kpis"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class LegalSpend(Base):
    __tablename__ = "legal_spend"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    internal = Column(Integer)
    external = Column(Integer)
    budget = Column(Integer)


class RiskTrendAnalytics(Base):
    __tablename__ = "risk_trends_analytics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    contractRisk = Column(Integer)
    complianceRisk = Column(Integer)
    litigationRisk = Column(Integer)


class EfficiencyMetric(Base):
    __tablename__ = "efficiency_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    aiTime = Column(Float)
    manualTime = Column(Float)


class MatterCategory(Base):
    __tablename__ = "matters_by_category"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    value = Column(Integer)
    color = Column(String)


class SpendForecast(Base):
    __tablename__ = "spend_forecast"

    id = Column(Integer, primary_key=True, autoincrement=True)
    month = Column(String, nullable=False)
    forecast = Column(Integer)
    lower = Column(Integer)
    upper = Column(Integer)


class ExecutiveSummary(Base):
    __tablename__ = "executive_summary"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)


# ══════════════════════════════════════════════════════════════════════════════
#  Digital Twin
# ══════════════════════════════════════════════════════════════════════════════

class LegalEntity(Base):
    __tablename__ = "legal_entities"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    type = Column(String)
    jurisdiction = Column(String)
    risk = Column(String)


class Director(Base):
    __tablename__ = "directors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    role = Column(String)
    entities = Column(Integer, default=0)
    conflicts = Column(Integer, default=0)


class DigitalTwinSummary(Base):
    __tablename__ = "digital_twin_summary"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


# ══════════════════════════════════════════════════════════════════════════════
#  Knowledge Graph
# ══════════════════════════════════════════════════════════════════════════════

class KGSummary(Base):
    __tablename__ = "kg_summary"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class KGNode(Base):
    __tablename__ = "kg_nodes"

    id = Column(String, primary_key=True)
    label = Column(String, nullable=False)
    sublabel = Column(String)
    type = Column(String)
    x = Column(Integer)
    y = Column(Integer)
    risk = Column(String)
    icon = Column(String)


class KGEdge(Base):
    __tablename__ = "kg_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String, nullable=False)   # from node id
    target = Column(String, nullable=False)   # to node id
    label = Column(String)


class KGRelationship(Base):
    __tablename__ = "kg_relationships"

    id = Column(String, primary_key=True)
    from_entity = Column(String, nullable=False)
    to_entity = Column(String, nullable=False)
    relation = Column(String)
    type = Column(String)
    risk = Column(String)


# ══════════════════════════════════════════════════════════════════════════════
#  Integrations
# ══════════════════════════════════════════════════════════════════════════════

class IntegrationSummary(Base):
    __tablename__ = "integration_summary"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String)
    logo = Column(String)
    status = Column(String)
    lastSync = Column(String)
    recordsSync = Column(String)
    description = Column(Text)
    features = Column(JSON)   # list of strings
    health = Column(Float, default=0)


class IntegrationActivity(Base):
    __tablename__ = "integration_activity"

    id = Column(Integer, primary_key=True, autoincrement=True)
    time = Column(String, nullable=False)
    event = Column(Text, nullable=False)
    status = Column(String)
