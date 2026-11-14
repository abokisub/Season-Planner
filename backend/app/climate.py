"""Turn daily NASA POWER data into a climate profile for one location.

Season definitions (common for the West African Sahel/Savanna):
- Onset: first day from 1 May when 3-day rain >= 20 mm and no dry spell
  longer than 10 days follows within 30 days.
  (Relaxed from the classic 7 days because POWER rainfall is a coarse
  ~50 km model estimate that under-reports scattered storms.)

Percentiles: p20 / median / p80 across years.
- Cessation: first day from 1 Sep after which the next 20 days bring < 10 mm.
"""

from datetime import date, timedelta
from statistics import mean, median

ONSET_FROM = (5, 1)
CESSATION_FROM = (9, 1)
DRY_DAY_MM = 1.0
HOT_DAY_C = 35.0
VERY_HOT_DAY_C = 38.0


def _series(days: dict, param: str) -> dict[date, float]:
    out = {}
    for d, values in days.items():
        v = values.get(param)
        if v is not None:
            out[date.fromisoformat(d)] = v
    return out


def _rain(rain: dict[date, float], d: date) -> float:
    return rain.get(d, 0.0)


def _longest_dry_run(rain: dict[date, float], start: date, end: date) -> int:
    best = run = 0
    d = start
    while d <= end:
        run = run + 1 if _rain(rain, d) < DRY_DAY_MM else 0
        best = max(best, run)
        d += timedelta(days=1)
    return best


def find_onset(rain: dict[date, float], year: int, last_day: date | None = None) -> date | None:
    d = date(year, *ONSET_FROM)
    stop = min(date(year, 9, 30), last_day or date(year, 12, 31))
    while d <= stop:
        if sum(_rain(rain, d + timedelta(i)) for i in range(3)) >= 20:
            window_end = d + timedelta(days=30)
            if last_day and window_end > last_day:
                window_end = last_day
            if _longest_dry_run(rain, d + timedelta(days=3), window_end) <= 10:
                return d
        d += timedelta(days=1)
    return None


def find_cessation(rain: dict[date, float], year: int) -> date | None:
    d = date(year, *CESSATION_FROM)
    while d <= date(year, 12, 10):
        if sum(_rain(rain, d + timedelta(i)) for i in range(1, 21)) < 10:
            return d
        d += timedelta(days=1)
    return None


def _pct(values: list[float], p: float) -> float:
    s = sorted(values)
    k = (len(s) - 1) * p
    lo, hi = int(k), min(int(k) + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def _doy_to_date(doy: float, year: int = 2001) -> str:
    """Format a day-of-year as '15 Jun'."""
    return (date(year, 1, 1) + timedelta(days=round(doy) - 1)).strftime("%-d %b")


def _season_stats(rain, tmax, year: int) -> dict | None:
    onset = find_onset(rain, year)
    cess = find_cessation(rain, year)
    if not onset or not cess or cess <= onset:
        return None
    days = [onset + timedelta(i) for i in range((cess - onset).days + 1)]
    return {
        "year": year,
        "onset_doy": onset.timetuple().tm_yday,
        "cessation_doy": cess.timetuple().tm_yday,
        "length_days": (cess - onset).days,
        "season_rain_mm": sum(_rain(rain, d) for d in days),
        "longest_dry_spell_days": _longest_dry_run(rain, onset, cess),
        "hot_days": sum(1 for d in days if tmax.get(d, 0) >= HOT_DAY_C),
    }


def build_profile(history: dict) -> dict:
    days = history["days"]
    rain = _series(days, "PRECTOTCORR")
    tmax = _series(days, "T2M_MAX")
    tmin = _series(days, "T2M_MIN")
    gwet = _series(days, "GWETROOT")
    years = sorted({d.year for d in rain})

    seasons = [s for y in years if (s := _season_stats(rain, tmax, y))]
    if len(seasons) < 5:
        raise ValueError("Could not detect a regular rainy season at this location.")

    def stat(key):
        vals = [s[key] for s in seasons]
        return {"p20": _pct(vals, 0.2), "median": median(vals), "p80": _pct(vals, 0.8)}

    # Monthly normals for the calendar chart
    monthly = []
    for m in range(1, 13):
        m_rain = [sum(v for d, v in rain.items() if d.year == y and d.month == m) for y in years]
        monthly.append({
            "month": m,
            "rain_mm": round(mean(m_rain), 1),
            "tmax_c": round(mean(v for d, v in tmax.items() if d.month == m), 1),
            "tmin_c": round(mean(v for d, v in tmin.items() if d.month == m), 1),
            "root_soil_wetness": round(mean(v for d, v in gwet.items() if d.month == m), 2),
        })

    # Mean daily rain for each day-of-year (used for wet-harvest checks)
    by_doy: dict[int, list[float]] = {}
    for d, v in rain.items():
        by_doy.setdefault(min(d.timetuple().tm_yday, 365), []).append(v)
    daily_rain_normal = {doy: mean(v) for doy, v in by_doy.items()}

    # Trend: first half of the record vs second half
    half = len(seasons) // 2
    early, late = seasons[:half], seasons[half:]

    def shift(key):
        return round(mean(s[key] for s in late) - mean(s[key] for s in early), 1)

    trend = {
        "periods": f"{early[0]['year']}-{early[-1]['year']} vs {late[0]['year']}-{late[-1]['year']}",
        "onset_shift_days": shift("onset_doy"),
        "length_change_days": shift("length_days"),
        "season_rain_change_mm": shift("season_rain_mm"),
        "dry_spell_change_days": shift("longest_dry_spell_days"),
        "hot_days_change": shift("hot_days"),
    }

    onset = stat("onset_doy")
    cess = stat("cessation_doy")
    return {
        "years": f"{years[0]}-{years[-1]}",
        "seasons_detected": len(seasons),
        "onset": {**{k: round(v) for k, v in onset.items()},
                  "median_date": _doy_to_date(onset["median"]),
                  "late_year_date": _doy_to_date(onset["p80"])},
        "cessation": {**{k: round(v) for k, v in cess.items()},
                      "median_date": _doy_to_date(cess["median"]),
                      "early_year_date": _doy_to_date(cess["p20"])},
        "season_length_days": {k: round(v) for k, v in stat("length_days").items()},
        "season_rain_mm": {k: round(v) for k, v in stat("season_rain_mm").items()},
        "longest_dry_spell_days": {k: round(v) for k, v in stat("longest_dry_spell_days").items()},
        "hot_days_in_season": {k: round(v) for k, v in stat("hot_days").items()},
        "annual_rain_mm": round(mean(sum(v for d, v in rain.items() if d.year == y) for y in years)),
        "trend": trend,
        "monthly": monthly,
        "seasons": seasons,
        "_daily_rain_normal": daily_rain_normal,
    }


def season_status(this_year: dict, profile: dict) -> dict:
    """Compare the current year so far with the historical normal."""
    rain = _series(this_year["days"], "PRECTOTCORR")
    gwet = _series(this_year["days"], "GWETROOT")
    if not rain:
        return {"status": "unknown", "reason": "No data yet for this year."}

    last = max(rain)
    year = last.year
    onset = find_onset(rain, year, last_day=last)
    to_date = sum(rain.values())
    normal_to_date = sum(v for doy, v in profile["_daily_rain_normal"].items()
                         if doy <= last.timetuple().tm_yday)
    rain_ratio = to_date / normal_to_date if normal_to_date else None

    recent = [v for d, v in gwet.items() if (last - d).days < 30]
    month_normal = profile["monthly"][last.month - 1]["root_soil_wetness"]
    soil_now = mean(recent) if recent else None

    late_onset = profile["onset"]["p80"]  # later than 4 in 5 years
    reasons = []
    status = "on_track"
    if onset is None and last.timetuple().tm_yday > late_onset:
        status = "at_risk"
        reasons.append("Rains have not properly started, later than 4 in 5 past years.")
    elif onset is not None:
        diff = onset.timetuple().tm_yday - profile["onset"]["median"]
        word = "late" if diff > 0 else "early"
        reasons.append(f"Rains started {onset:%-d %b}, {abs(diff)} days {word} vs normal.")
        if diff > 14:
            status = "behind"
    if rain_ratio is not None:
        reasons.append(f"Rain so far: {to_date:.0f} mm, {rain_ratio:.0%} of normal.")
        if rain_ratio < 0.7:
            status = "at_risk"
        elif rain_ratio < 0.85 and status == "on_track":
            status = "behind"

    return {
        "status": status,
        "as_of": last.isoformat(),
        "onset_this_year": onset.isoformat() if onset else None,
        "rain_to_date_mm": round(to_date),
        "normal_to_date_mm": round(normal_to_date),
        "rain_vs_normal": round(rain_ratio, 2) if rain_ratio else None,
        "root_soil_wetness_30d": round(soil_now, 2) if soil_now else None,
        "root_soil_wetness_normal": month_normal,
        "soil_note": ("Informational only: POWER's most recent weeks come from a "
                      "near-real-time model that is not directly comparable with "
                      "the historical record. SMAP is the planned check."),
        "reasons": reasons,
    }
