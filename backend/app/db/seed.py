"""
LexOS — Database Seeder
Loads demo data from JSON files into the database on first run.
Idempotent: skips seeding if data already exists.
"""
import json
import os
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import (
    Setting, Contract, ComplianceScore, ComplianceTask, UpcomingFiling,
    RegulatoryUpdate, AuditLog, Agent, ApprovalQueueItem, RecentActivity,
    DashboardKPI, RiskTrendData, LitigationCategory, JurisdictionExposure,
    UpcomingDeadline, RecentAlert, LitigationSummary, LitigationRiskFactor,
    CaseOutcome, CostTrend, LitigationCase, ExpansionJurisdiction,
    ExpansionCostComparison, GovernanceSummary, BoardMember, BoardResolution,
    ESOPData, GovernanceCalendar, AnalyticsKPI, LegalSpend, RiskTrendAnalytics,
    EfficiencyMetric, MatterCategory, SpendForecast, ExecutiveSummary,
    LegalEntity, Director, DigitalTwinSummary, KGSummary, KGNode, KGEdge,
    KGRelationship, IntegrationSummary, Integration, IntegrationActivity,
)

DATA_DIR = os.path.dirname(os.path.abspath(__file__))


def _load_json(filename: str) -> dict:
    with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


def _bulk_add(session: AsyncSession, model_class, records: list, **extra):
    """Create ORM objects from a list of dicts and add to session."""
    for rec in records:
        obj = model_class(**rec)
        session.add(obj)


async def seed_database(session: AsyncSession):
    """Seed all tables with demo data. Idempotent — skips if agents table has data."""
    # Check if already seeded by looking at agents table
    result = await session.execute(select(func.count()).select_from(Agent))
    count = result.scalar()
    if count and count > 0:
        print("[SEED] Database already seeded — skipping")
        return

    print("[SEED] Seeding database with demo data...")

    # Load JSON data files
    data = _load_json("seed_data.json")
    extra = _load_json("seed_data_extra.json")

    # ── Core tables (from seed_data.json) ────────────────────────────
    for s in data["settings"]:
        session.add(Setting(section=s["section"], data=s["data"]))

    _bulk_add(session, Contract, data["contracts"])
    _bulk_add(session, ComplianceScore, data["compliance_scores"])
    _bulk_add(session, ComplianceTask, data["compliance_tasks"])
    _bulk_add(session, UpcomingFiling, data["upcoming_filings"])
    _bulk_add(session, RegulatoryUpdate, data["regulatory_updates"])
    _bulk_add(session, AuditLog, data["audit_logs"])
    _bulk_add(session, Agent, data["agents"])
    _bulk_add(session, ApprovalQueueItem, data["approval_queue"])
    _bulk_add(session, RecentActivity, data["recent_activity"])
    _bulk_add(session, DashboardKPI, data["dashboard_kpis"])
    _bulk_add(session, RiskTrendData, data["risk_trend_data"])
    _bulk_add(session, LitigationCategory, data["litigation_categories"])
    _bulk_add(session, JurisdictionExposure, data["jurisdiction_exposure"])

    for d in data["upcoming_deadlines_dashboard"]:
        session.add(UpcomingDeadline(**d))

    _bulk_add(session, RecentAlert, data["recent_alerts"])

    # ── Extra tables (from seed_data_extra.json) ─────────────────────
    for s in extra["litigation_summary"]:
        session.add(LitigationSummary(key=s["key"], value=s["value"]))

    _bulk_add(session, LitigationRiskFactor, [
        {"subject": r["subject"], "score": r["score"]} for r in extra["litigation_risk_factors"]
    ])
    _bulk_add(session, CaseOutcome, extra["case_outcomes"])
    _bulk_add(session, CostTrend, extra["cost_trends"])
    _bulk_add(session, LitigationCase, extra["litigation_cases"])
    _bulk_add(session, ExpansionJurisdiction, extra["expansion_jurisdictions"])
    _bulk_add(session, ExpansionCostComparison, extra["expansion_cost_comparison"])

    for s in extra["governance_summary"]:
        session.add(GovernanceSummary(key=s["key"], value=s["value"]))

    _bulk_add(session, BoardMember, extra["board_members"])
    _bulk_add(session, BoardResolution, extra["board_resolutions"])

    for e in extra["esop_data"]:
        session.add(ESOPData(key=e["key"], value=e["value"]))

    _bulk_add(session, GovernanceCalendar, extra["governance_calendar"])

    for k in extra["analytics_kpis"]:
        session.add(AnalyticsKPI(key=k["key"], value=k["value"]))

    _bulk_add(session, LegalSpend, extra["legal_spend"])
    _bulk_add(session, RiskTrendAnalytics, extra["risk_trends_analytics"])
    _bulk_add(session, EfficiencyMetric, extra["efficiency_metrics"])
    _bulk_add(session, MatterCategory, extra["matters_by_category"])
    _bulk_add(session, SpendForecast, extra["spend_forecast"])

    for e in extra["executive_summary"]:
        session.add(ExecutiveSummary(key=e["key"], value=e["value"]))

    for s in extra["digital_twin_summary"]:
        session.add(DigitalTwinSummary(key=s["key"], value=s["value"]))

    _bulk_add(session, LegalEntity, extra["legal_entities"])
    _bulk_add(session, Director, extra["directors"])

    for s in extra["kg_summary"]:
        session.add(KGSummary(key=s["key"], value=s["value"]))

    _bulk_add(session, KGNode, extra["kg_nodes"])
    _bulk_add(session, KGEdge, extra["kg_edges"])
    _bulk_add(session, KGRelationship, extra["kg_relationships"])

    for s in extra["integration_summary"]:
        session.add(IntegrationSummary(key=s["key"], value=s["value"]))

    _bulk_add(session, Integration, extra["integrations"])
    _bulk_add(session, IntegrationActivity, extra["integration_activity"])

    await session.commit()
    print("[SEED] Database seeded successfully!")
