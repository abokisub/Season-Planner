"""Where cached data lives.

Locally: backend/cache/.
On Vercel the code folder is read-only, so the cache lives in /tmp. The files
committed in backend/cache/ (the demo farm's soil and slope) are copied there
on start, so the demo still loads fast.
"""

import os
import shutil
from pathlib import Path

SEED_DIR = Path(__file__).resolve().parent.parent / "cache"


def _cache_dir() -> Path:
    if not os.environ.get("VERCEL"):
        return SEED_DIR
    tmp = Path("/tmp/season-planner-cache")
    tmp.mkdir(parents=True, exist_ok=True)
    if SEED_DIR.exists():
        for f in SEED_DIR.glob("*.json"):
            target = tmp / f.name
            if not target.exists():
                shutil.copy(f, target)
    return tmp


CACHE_DIR = _cache_dir()
