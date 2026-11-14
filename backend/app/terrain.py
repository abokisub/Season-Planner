"""Field slope from elevation tiles derived from NASA SRTM.

Uses the open AWS Terrain Tiles (Terrarium encoding). In Africa these are
built from NASA's Shuttle Radar Topography Mission (SRTM) 30 m data.
"""

import io
import json
import math
from pathlib import Path

import httpx
from PIL import Image

ZOOM = 13  # ~19 m pixels at 12°N
TILE_URL = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"


def _tile_xy(lat: float, lon: float, z: int) -> tuple[float, float]:
    n = 2 ** z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def _elevation_grid(lat: float, lon: float):
    x, y = _tile_xy(lat, lon, ZOOM)
    tx, ty = int(x), int(y)
    resp = httpx.get(TILE_URL.format(z=ZOOM, x=tx, y=ty), timeout=30)
    resp.raise_for_status()
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    px, py = int((x - tx) * 256), int((y - ty) * 256)
    px, py = min(max(px, 5), 250), min(max(py, 5), 250)

    def elev(i, j):
        r, g, b = img.getpixel((i, j))
        return r * 256 + g + b / 256 - 32768

    return elev, px, py


def get_terrain(lat: float, lon: float) -> dict:
    path = CACHE_DIR / f"terrain_{lat:.4f}_{lon:.4f}.json"
    if path.exists():
        return json.loads(path.read_text())

    elev, px, py = _elevation_grid(lat, lon)
    pixel_m = 156543.03 * math.cos(math.radians(lat)) / 2 ** ZOOM

    # Slope over a ~110 m baseline (SRTM is noisy pixel to pixel), averaged over a 3x3 window
    k = 3
    slopes = []
    for j in range(py - 1, py + 2):
        for i in range(px - 1, px + 2):
            dzdx = (elev(i + k, j) - elev(i - k, j)) / (2 * k * pixel_m)
            dzdy = (elev(i, j + k) - elev(i, j - k)) / (2 * k * pixel_m)
            slopes.append(math.hypot(dzdx, dzdy) * 100)
    slope = sum(slopes) / len(slopes)

    result = {
        "elevation_m": round(elev(px, py)),
        "slope_pct": round(slope, 1),
        "erosion_risk": "low" if slope < 3 else "medium" if slope < 8 else "high",  # SRTM noise ~2% on flat land
        "source": "NASA SRTM via AWS Terrain Tiles (~19 m pixels)",
    }
    CACHE_DIR.mkdir(exist_ok=True)
    path.write_text(json.dumps(result))
    return result
