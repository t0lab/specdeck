"""Domain models shared across tiers.

Pure (no I/O). These shapes are the contract:
- Spec / Check / Evidence back "review at the intent level" — a human approves
  Checks + Evidence, not diffs.
- AgentEvent is the *structured event contract* the Builder sits behind, so the
  engine (wrap-CLI -> native SDK) can be swapped without touching the gateway
  or the Checker.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class Column(str, Enum):
    """Board columns — only states where a human is blocked become columns."""

    backlog = "backlog"
    plan = "plan"
    review = "review"
    done = "done"


class CheckStatus(str, Enum):
    pending = "pending"
    passed = "pass"
    failed = "fail"


class EvidenceKind(str, Enum):
    image = "image"
    video = "video"
    test = "test"
    log = "log"


class Evidence(BaseModel):
    """A Check ✅ is invalid without Evidence — this is what builds trust."""

    kind: EvidenceKind
    uri: str
    caption: str = ""


class Check(BaseModel):
    id: str
    description: str
    status: CheckStatus = CheckStatus.pending
    evidence: list[Evidence] = Field(default_factory=list)


class Spec(BaseModel):
    """Per-Task contract. Frozen when the Task reaches Done."""

    id: str
    task_id: str
    goal: str
    acceptance: list[str] = Field(default_factory=list)
    checks: list[Check] = Field(default_factory=list)
    frozen: bool = False


class Task(BaseModel):
    id: str
    title: str
    column: Column = Column.backlog
    # ⏳ badge — an agent is working. Running is a badge, not a column.
    running: bool = False
    spec: Spec | None = None


class AgentEventType(str, Enum):
    planner_started = "planner_started"
    spec_drafted = "spec_drafted"
    builder_started = "builder_started"
    builder_progress = "builder_progress"
    check_evaluated = "check_evaluated"
    evidence_added = "evidence_added"
    run_failed = "run_failed"
    escalation = "escalation"


class AgentEvent(BaseModel):
    """Builder/Checker publish these to Redis; the gateway fans them out to the
    board over SSE."""

    type: AgentEventType
    task_id: str
    payload: dict = Field(default_factory=dict)
