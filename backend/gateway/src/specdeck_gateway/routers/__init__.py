"""Router aggregator — one place that mounts every gateway router.

`main.py` includes only `api_router`; new routers (workspace, …) register here.
"""

from __future__ import annotations

from fastapi import APIRouter

from specdeck_gateway.routers.github import router as github_router
from specdeck_gateway.routers.workspace import router as workspace_router

api_router = APIRouter()
api_router.include_router(github_router)
api_router.include_router(workspace_router)

__all__ = ["api_router"]
