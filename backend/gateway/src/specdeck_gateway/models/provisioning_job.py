"""`provisioning_job` — instance #1 of the shared streamed-run infra.

One Project -> many jobs over time, but <=1 'running' (partial unique index).
`id` doubles as the Redis channel id: ws:provision:<id>.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, SmallInteger, Text, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from specdeck_gateway.db import Base
from specdeck_gateway.models.enums import JobKind, JobStatus, pg_enum


class ProvisioningJob(Base):
    __tablename__ = "provisioning_job"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(
        Text, ForeignKey("project.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[JobKind] = mapped_column(pg_enum(JobKind, "job_kind"), nullable=False)
    status: Mapped[JobStatus] = mapped_column(
        pg_enum(JobStatus, "job_status"),
        nullable=False,
        server_default=JobStatus.running.value,
    )
    phase: Mapped[str | None] = mapped_column(Text, nullable=True)
    progress: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        # DB-level concurrency guard: at most one running job per project.
        Index(
            "one_active_job_per_project",
            "project_id",
            unique=True,
            postgresql_where=text("status = 'running'"),
            sqlite_where=text("status = 'running'"),
        ),
    )
