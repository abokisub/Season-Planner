"""Real soil data for the field: ISRIC SoilGrids 2.0 (250 m, global).

SoilGrids is not a NASA product. It is the global soil map built from ~240,000
soil profiles plus satellite covariates (including MODIS and SRTM). We use it
for the "local soil information" the challenge asks for.

The API is slow (often 30-60 s), so results are cached permanently per point.
Cities and water are masked, so a point on a town returns no data.
"""

import json
from pathlib import Path

import httpx

URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"
PROPS = ["nitrogen", "soc", "phh2o", "clay", "sand", "silt", "cec"]
DEPTHS = ["0-5cm", "5-15cm", "15-30cm"]
WEIGHTS = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}  # thickness-weighted 0-30 cm mean


class SoilUnavailable(Exception):
    pass


def _fetch(lat: float, lon: float) -> dict:
    params = [("lat", f"{lat:.4f}"), ("lon", f"{lon:.4f}"), ("value", "mean")]
    params += [("property", p) for p in PROPS] + [("depth", d) for d in DEPTHS]
    resp = httpx.get(URL, params=params, timeout=120)
    resp.raise_for_status()
    layers = resp.json()["properties"]["layers"]

    out = {}
    for layer in layers:
        factor = layer["unit_measure"]["d_factor"]
        vals = {d["label"]: d["values"]["mean"] for d in layer["depths"]}
        if any(v is None for v in vals.values()):
            raise SoilUnavailable("No soil data here (towns and water are masked). Pick a spot on farmland.")
        out[layer["name"]] = sum(vals[k] * w for k, w in WEIGHTS.items()) / sum(WEIGHTS.values()) / factor
    return out


def texture_class(sand: float, clay: float) -> str:
    """Simplified USDA texture triangle (percent)."""
    if clay >= 40:
        return "clay"
    if sand >= 85:
        return "sand"
    if sand >= 70 and clay < 15:
        return "loamy sand"
    if clay >= 27:
        return "clay loam"
    if sand >= 52:
        return "sandy loam"
    return "loam"


def _level(value: float, low: float, high: float) -> str:
    return "low" if value < low else "high" if value > high else "medium"


def interpret(raw: dict) -> dict:
    """Turn lab-style numbers into farmer-level ratings.

    Thresholds follow common ratings used for Nigerian savanna soils:
    total N < 1.0 g/kg low, > 1.5 high; organic carbon < 10 g/kg low, > 15 high;
    CEC < 6 cmol/kg low, > 12 high.
    """
    tex = texture_class(raw["sand"], raw["clay"])
    ph = raw["phh2o"]
    return {
        "nitrogen_g_kg": round(raw["nitrogen"], 2),
        "organic_carbon_g_kg": round(raw["soc"], 1),
        "ph": round(ph, 1),
        "clay_pct": round(raw["clay"]),
        "sand_pct": round(raw["sand"]),
        "silt_pct": round(raw["silt"]),
        "cec_cmol_kg": round(raw["cec"], 1),
        "texture": tex,
        "nitrogen_level": _level(raw["nitrogen"], 1.0, 1.5),
        "organic_matter_level": _level(raw["soc"], 10, 15),
        "nutrient_holding_level": _level(raw["cec"], 6, 12),
        "ph_level": "acidic" if ph < 5.5 else "alkaline" if ph > 7.8 else "good",
        "water_holding": "low" if tex in ("sand", "loamy sand") else "high" if "clay" in tex else "medium",
        "depth": "0-30 cm average",
        "source": "ISRIC SoilGrids 2.0 (250 m)",
    }


def get_soil(lat: float, lon: float) -> dict:
    path = CACHE_DIR / f"soil_{lat:.3f}_{lon:.3f}.json"
    if path.exists():
        return json.loads(path.read_text())
    try:
        raw = _fetch(lat, lon)
    except httpx.HTTPError as exc:
        raise SoilUnavailable(f"SoilGrids did not respond: {exc}") from exc
    soil = interpret(raw)
    CACHE_DIR.mkdir(exist_ok=True)
    path.write_text(json.dumps(soil))
    return soil
