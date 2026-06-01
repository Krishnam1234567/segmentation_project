"""
LexOS — Centralized Configuration
Reads from environment variables with sensible local defaults.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application-wide settings loaded from env vars."""

    # ── App ───────────────────────────────────
    APP_NAME: str = "LexOS"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True



    # ── AI Models ─────────────────────────────
    GEMINI_API_KEY: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
