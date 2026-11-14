"""Vercel entry point: serves the FastAPI backend at /api/...

Vercel sends /api/plan etc. to this function; the backend's own routes
(/plan, /health, ...) are mounted under /api.
"""

import sys
from pathlib import Path

from fastapi import FastAPI

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.main import app as backend  # noqa: E402

app = FastAPI()
app.mount("/api", backend)
