"""Async persistence layer — SQLAlchemy 2.0 + asyncpg.

First persistence layer in the backend. The engine/sessionmaker are created
lazily so importing this module (e.g. for `Base` in Alembic or tests) does not
require a live database.
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from specdeck_gateway.config import get_settings


class Base(DeclarativeBase):
    """Declarative base for all gateway ORM models."""


_engine: AsyncEngine | None = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(get_settings().async_database_url, future=True)
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(get_engine(), expire_on_commit=False)
    return _sessionmaker


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency — one session per request."""
    async with get_sessionmaker()() as session:
        yield session
