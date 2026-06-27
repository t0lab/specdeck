"""Gateway settings — env-driven (pydantic-settings).

Secrets (GitHub OAuth, token-encryption key) live here, backend-only. Never
serialised to the web client.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from cryptography.fernet import Fernet
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Shipped OAuth App client_id for GitHub **Device Flow**. A client_id is NOT a
# secret (it ships publicly in tools like `gh`), so baking a default lets
# self-hosters connect with zero config. Register one SpecDeck OAuth App, tick
# "Enable Device Flow", and paste its client_id here. Override per-deployment
# with the GITHUB_CLIENT_ID env var. Device Flow needs NO secret and NO callback.
DEFAULT_GITHUB_CLIENT_ID = ""  # TODO: paste the SpecDeck OAuth App client_id


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    # GitHub OAuth — Device Flow (client_id only; no secret, no callback)
    github_client_id: str = Field(default=DEFAULT_GITHUB_CLIENT_ID, alias="GITHUB_CLIENT_ID")

    # Managed git root + token-at-rest encryption
    workspace_root: Path = Field(default=Path("/workspaces"), alias="WORKSPACE_ROOT")
    # If unset, generate an ephemeral key so the gateway can boot in dev. WARNING:
    # an ephemeral key is regenerated on restart, so stored tokens become
    # undecryptable — set TOKEN_ENCRYPTION_KEY explicitly in any persistent deploy.
    token_encryption_key: str = Field(
        default_factory=lambda: Fernet.generate_key().decode(), alias="TOKEN_ENCRYPTION_KEY"
    )

    # Infra
    database_url: str = Field(
        default="postgresql://specdeck:specdeck@localhost:5432/specdeck", alias="DATABASE_URL"
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    agent_url: str = Field(default="http://localhost:2024", alias="AGENT_URL")
    web_origin: str = Field(default="http://localhost:3000", alias="WEB_ORIGIN")

    @property
    def async_database_url(self) -> str:
        """asyncpg-flavoured URL for the SQLAlchemy async engine."""
        url = self.database_url
        if url.startswith("postgresql+asyncpg://"):
            return url
        if url.startswith("postgresql://"):
            return "postgresql+asyncpg://" + url[len("postgresql://") :]
        if url.startswith("postgres://"):
            return "postgresql+asyncpg://" + url[len("postgres://") :]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
