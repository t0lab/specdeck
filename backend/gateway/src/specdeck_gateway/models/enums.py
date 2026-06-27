"""Enums for the workspace/connection/job domain.

Member name == value so the stored string is identical on PostgreSQL (native
enum) and SQLite (VARCHAR). `pg_enum` builds a SQLAlchemy Enum that persists the
`.value`.
"""

from __future__ import annotations

import enum

from sqlalchemy import Enum as SAEnum


class WorkspaceStatus(str, enum.Enum):
    unlinked = "unlinked"
    provisioning = "provisioning"
    ready = "ready"
    broken = "broken"
    error = "error"


class WorkspaceSource(str, enum.Enum):
    clone = "clone"
    init = "init"
    linked = "linked"


class JobKind(str, enum.Enum):
    clone = "clone"
    init = "init"
    reconnect = "reconnect"


class JobStatus(str, enum.Enum):
    running = "running"
    success = "success"
    error = "error"
    cancelled = "cancelled"


class GitProvider(str, enum.Enum):
    github = "github"


class ConnectionStatus(str, enum.Enum):
    active = "active"
    expired = "expired"
    revoked = "revoked"


def pg_enum(py_enum: type[enum.Enum], name: str) -> SAEnum:
    """SQLAlchemy Enum that stores the member value and names the PG enum type."""
    return SAEnum(py_enum, name=name, values_callable=lambda e: [m.value for m in e])
