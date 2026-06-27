"""`git_connection` — provider-generic OAuth connection (one per provider)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, LargeBinary, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from specdeck_gateway.db import Base
from specdeck_gateway.models.enums import ConnectionStatus, GitProvider, pg_enum


class GitConnection(Base):
    __tablename__ = "git_connection"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider: Mapped[GitProvider] = mapped_column(
        pg_enum(GitProvider, "git_provider"), nullable=False, unique=True
    )
    account_login: Mapped[str] = mapped_column(Text, nullable=False)
    # Fernet-encrypted OAuth token — server-only, never serialised to the client.
    token_ciphertext: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    scope: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ConnectionStatus] = mapped_column(
        pg_enum(ConnectionStatus, "connection_status"),
        nullable=False,
        server_default=ConnectionStatus.active.value,
    )
    connected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
