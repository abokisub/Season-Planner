"""NASA POWER client with a simple file cache.

Historical data (closed years) is cached for 30 days, recent data for 1 hour.
If NASA is slow or down, the last cached copy is served and marked stale.
"""

import hashlib
import json
import time
from datetime import date, datetime, timezone
from pathlib import Path

import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
CACHE_DIR = Path(__file__).resolve().parent.parent / "cache"

PARAMETERS = [
    "T2M_MAX",      # daily max temperature, C
    "T2M_MIN",      # daily min temperature, C
    "PRECTOTCORR",  # rainfall, mm/day
    "RH2M",         # relative humidity, %
    "GWETROOT",     # root-zone soil wetness, 0-1
    "GWETTOP",      # surface soil wetness, 0-1
    "ALLSKY_SFC_SW_DWN",  # solar radiation, kWh/m2/day
]

HISTORY_TTL = 30 * 24 * 3600
RECENT_TTL = 3600


class PowerUnavailable(Exception):
    pass


def _cache_path(lat: float, lon: float, start: date, end: date) -> Path:
    key = f"{lat:.2f}_{lon:.2f}_{start:%Y%m%d}_{end:%Y%m%d}_{','.join(PARAMETERS)}"
    return CACHE_DIR / f"power_{hashlib.sha1(key.encode()).hexdigest()[:16]}.json"


def _fetch(lat: float, lon: float, start: date, end: date) -> dict:
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    resp = httpx.get(POWER_URL, params=params, timeout=120)
    resp.raise_for_status()
    body = resp.json()
    fill = body["header"].get("fill_value", -999.0)
    raw = body["properties"]["parameter"]

    # Reshape into {"YYYY-MM-DD": {param: value or None}}
    days: dict[str, dict] = {}
    for param, series in raw.items():
        for ymd, value in series.items():
            d = f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:]}"
            days.setdefault(d, {})[param] = None if value == fill else value
    return {
        "elevation_m": body["geometry"]["coordinates"][2],
        "days": dict(sorted(days.items())),
    }


def get_daily(lat: float, lon: float, start: date, end: date, ttl: int) -> dict:
    """Return daily POWER data plus metadata about freshness."""
    path = _cache_path(lat, lon, start, end)
    cached = None
    if path.exists():
        cached = json.loads(path.read_text())
        if time.time() - cached["fetched_at"] < ttl:
            return {**cached, "stale": False}

    try:
        data = _fetch(lat, lon, start, end)
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        if cached:
            return {**cached, "stale": True}
        raise PowerUnavailable(str(exc)) from exc

    record = {
        **data,
        "fetched_at": time.time(),
        "fetched_at_iso": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "NASA POWER daily point API (community=AG)",
    }
    CACHE_DIR.mkdir(exist_ok=True)
    path.write_text(json.dumps(record))
    return {**record, "stale": False}


def get_history(lat: float, lon: float, years: int = 20) -> dict:
    """Last `years` complete calendar years."""
    last = date.today().year - 1
    return get_daily(lat, lon, date(last - years + 1, 1, 1), date(last, 12, 31), HISTORY_TTL)


def get_this_year(lat: float, lon: float) -> dict:
    """Current year to date. POWER lags a few days, so trailing days may be empty."""
    today = date.today()
    return get_daily(lat, lon, date(today.year, 1, 1), today, RECENT_TTL)
