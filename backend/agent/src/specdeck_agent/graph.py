"""SpecDeck agent graphs — Planner / Builder / Checker.

Skeleton: each is a single-node passthrough so the LangGraph server boots and
the gateway can reach it. Real orchestration (Spec drafting, isolated-worktree
building, independent evidence-gated checking) lands per the agent-architecture
ADR — see docs/design-docs/agent-architecture.md.
"""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, START, StateGraph


class AgentState(TypedDict):
    input: str
    output: str


def _echo(role: str):
    def node(state: AgentState) -> dict:
        return {"output": f"[{role}] received: {state.get('input', '')}"}

    return node


def _build(role: str):
    g = StateGraph(AgentState)
    g.add_node("run", _echo(role))
    g.add_edge(START, "run")
    g.add_edge("run", END)
    return g.compile()


planner_graph = _build("planner")
builder_graph = _build("builder")
checker_graph = _build("checker")
