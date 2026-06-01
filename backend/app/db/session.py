"""
LexOS — Async Database Session Manager
SQLite + aiosqlite + SQLAlchemy async engine.
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.db.models import Base

# Database file location (same as old sqlite_db.py)
DB_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_FILE = os.path.join(DB_DIR, "lexos.db")
DATABASE_URL = f"sqlite+aiosqlite:///{DB_FILE}"

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    """FastAPI dependency — yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db():
    """Create all tables if they don't exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"[DB] SQLite database initialized at {DB_FILE}")


async def close_db():
    """Dispose the engine connection pool."""
    await engine.dispose()
    print("[DB] Database engine disposed")
