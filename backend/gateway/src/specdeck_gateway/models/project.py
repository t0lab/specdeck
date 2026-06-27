"""`project` — identity + workspace merged (1 Project == 1 Workspace)."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from specdeck_gateway.db import Base
from specdeck_gateway.models.enums import WorkspaceSource, WorkspaceStatus, pg_enum


class Project(Base):
    __tablename__ = "project"

    id: Mapped[str] = mapped_column(Text, primary_key=True)  # slug [a-z0-9-]
    name: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Workspace (merged)
    rel_path: Mapped[str | None] = mapped_column(Text, unique=True, nullable=True)
    source: Mapped[WorkspaceSource | None] = mapped_column(
        pg_enum(WorkspaceSource, "workspace_source"), nullable=True
    )
    remote_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    base_branch: Mapped[str | None] = mapped_column(Text, nullable=True)
    workspace_status: Mapped[WorkspaceStatus] = mapped_column(
        pg_enum(WorkspaceStatus, "workspace_status"),
        nullable=False,
        server_default=WorkspaceStatus.unlinked.value,
    )
    active_job_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        # Circular FK with provisioning_job — created via ALTER after both tables.
        ForeignKey("provisioning_job.id", use_alter=True, name="fk_project_active_job"),
        nullable=True,
    )
