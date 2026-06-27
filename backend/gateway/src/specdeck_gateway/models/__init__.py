"""ORM models — 3 tables (data-model.md), one module each.

Importing this package registers every mapper on `Base.metadata` (needed by
Alembic autogenerate and `create_all` in tests).
"""

from __future__ import annotations

from specdeck_gateway.models.enums import (
    ConnectionStatus,
    GitProvider,
    JobKind,
    JobStatus,
    WorkspaceSource,
    WorkspaceStatus,
)
from specdeck_gateway.models.git_connection import GitConnection
from specdeck_gateway.models.project import Project
from specdeck_gateway.models.provisioning_job import ProvisioningJob

__all__ = [
    "ConnectionStatus",
    "GitConnection",
    "GitProvider",
    "JobKind",
    "JobStatus",
    "Project",
    "ProvisioningJob",
    "WorkspaceSource",
    "WorkspaceStatus",
]
