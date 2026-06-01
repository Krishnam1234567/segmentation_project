"""
LexOS — API Gateway
Enterprise AI Legal Operating System

Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db, close_db, async_session_factory
from app.db.seed import seed_database
from app.routes.dashboard      import router as dashboard_router
from app.routes.digital_twin   import router as digital_twin_router
from app.routes.contracts      import router as contracts_router
from app.routes.compliance     import router as compliance_router
from app.routes.agents         import router as agents_router
from app.routes.litigation     import router as litigation_router
from app.routes.expansion      import router as expansion_router
from app.routes.governance     import router as governance_router
from app.routes.analytics      import router as analytics_router
from app.routes.knowledge_graph import router as knowledge_graph_router
from app.routes.integrations   import router as integrations_router
from app.routes.security       import router as security_router
from app.routes.settings_route import router as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup/shutdown lifecycle."""
    print(f"[START] {settings.APP_NAME} v{settings.APP_VERSION} starting...")
    print(f"   Gemini AI  -> {'configured' if settings.GEMINI_API_KEY else 'NOT SET'}")
    print(f"   API Docs   -> http://localhost:8080/docs")

    # Initialize database and seed demo data
    await init_db()
    async with async_session_factory() as session:
        await seed_database(session)

    yield

    await close_db()
    print(f"[STOP] {settings.APP_NAME} shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "AI-powered Legal Operating System — API Gateway.\n\n"
        "Creates a Legal Digital Twin for every enterprise by continuously "
        "simulating, governing, predicting, and automating legal reality."
    ),
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

import os

# ── CORS ──────────────────────────────────────
_allowed_origins = [
    "https://krishnam1234567.github.io",
    "http://localhost:5173",
    "http://localhost:3000",
    "https://lex-os1.vercel.app",
]
# Allow overriding via env var (e.g., custom domain)
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────
app.include_router(dashboard_router)
app.include_router(digital_twin_router)
app.include_router(contracts_router)
app.include_router(compliance_router)
app.include_router(agents_router)
app.include_router(litigation_router)
app.include_router(expansion_router)
app.include_router(governance_router)
app.include_router(analytics_router)
app.include_router(knowledge_graph_router)
app.include_router(integrations_router)
app.include_router(security_router)
app.include_router(settings_router)


@app.get("/", tags=["root"])
async def root():
    """Landing endpoint — confirms the API gateway is running."""
    return {
        "platform": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "message": "Legal Digital Twin Engine — Online",
        "docs": "/docs",
        "routes": [
            "/dashboard", "/digital-twin", "/contracts", "/compliance",
            "/agents", "/agents/chat", "/litigation", "/expansion",
            "/governance", "/analytics", "/knowledge-graph",
            "/integrations", "/security",
        ],
    }


@app.get("/health", tags=["root"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
