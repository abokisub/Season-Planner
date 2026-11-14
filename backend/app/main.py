"""Season Planner API.

Run:  .venv/bin/uvicorn app.main:app --reload --port 8010
Docs: http://127.0.0.1:8010/docs
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from . import climate, power, rotation, soil, terrain
from .crops import CROPS

app = FastAPI(title="Season Planner API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

# Demo location: farmland north-west of Kano, northern Nigeria (Kano city itself is masked in soil maps)
DEMO = {"name": "Farm near Kano, Nigeria", "lat": 12.15, "lon": 8.35}


def _profile(lat: float, lon: float):
    try:
        history = power.get_history(lat, lon)
        return history, climate.build_profile(history)
    except power.PowerUnavailable as exc:
        raise HTTPException(503, f"NASA POWER is unavailable and nothing is cached: {exc}")
    except ValueError as exc:
        raise HTTPException(422, str(exc))


def _public(profile: dict) -> dict:
    return {k: v for k, v in profile.items() if not k.startswith("_")}


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/demo")
def demo():
    return DEMO


@app.get("/crops")
def crops():
    return CROPS


@app.get("/climate")
def climate_profile(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    history, profile = _profile(lat, lon)
    return {
        "location": {"lat": lat, "lon": lon, "elevation_m": history["elevation_m"]},
        "data": {"source": history["source"], "last_updated": history["fetched_at_iso"],
                 "stale": history["stale"]},
        "profile": _public(profile),
    }


@app.get("/plan")
def plan(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    current: str = Query("maize,maize", description="Current 2-year rotation, e.g. maize,maize"),
    priority: str = Query("auto", description="auto (app decides from soil and climate) | balanced | water | income | soil"),
):
    seq = tuple(c.strip().lower() for c in current.split(","))
    if len(seq) == 1:
        seq = (seq[0], seq[0])
    if len(seq) != 2:
        raise HTTPException(422, "current must be one or two crops, e.g. maize,maize")

    history, profile = _profile(lat, lon)
    try:
        field_soil = soil.get_soil(lat, lon)
    except soil.SoilUnavailable as exc:
        raise HTTPException(422, str(exc))
    try:
        field_terrain = terrain.get_terrain(lat, lon)
    except Exception:
        field_terrain = {"elevation_m": history["elevation_m"], "slope_pct": None,
                         "erosion_risk": "low", "source": "unavailable"}
    try:
        result = rotation.compare(profile, field_soil, field_terrain, seq, priority)
    except ValueError as exc:
        raise HTTPException(422, str(exc))

    try:
        this_year = power.get_this_year(lat, lon)
        status = climate.season_status(this_year, profile)
    except power.PowerUnavailable:
        status = {"status": "unknown", "reasons": ["Current-year data is unavailable right now."]}

    return {
        "location": {"lat": lat, "lon": lon, "elevation_m": history["elevation_m"]},
        "data": {
            "sources": ["NASA POWER daily point API (T2M_MAX, T2M_MIN, PRECTOTCORR, RH2M, "
                        "GWETROOT, GWETTOP, ALLSKY_SFC_SW_DWN)",
                        field_terrain["source"], field_soil["source"]],
            "history_years": profile["years"],
            "last_updated": history["fetched_at_iso"],
            "stale": history["stale"],
            "note": "NASA POWER is historical and near-real-time data, not a forecast.",
        },
        "climate": {k: v for k, v in _public(profile).items() if k != "seasons"},
        "season_status": status,
        "soil": field_soil,
        "terrain": field_terrain,
        **result,
        "disclaimer": "This tool supports, but does not replace, the farmer's judgment "
                      "and local agricultural experts.",
    }
