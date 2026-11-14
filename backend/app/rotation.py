"""Recommend 2-year crop rotations from real climate, soil and slope data.

Northern Nigeria has one rainy season, so a rotation here is the crop grown in
year 1 followed by the crop grown in year 2, then repeat.

Inputs (all real, all per field):
- climate profile from NASA POWER (20 years of daily data)
- soil from ISRIC SoilGrids (nitrogen, organic carbon, pH, texture, CEC)
- slope from NASA SRTM elevation
The farmer only says what they grow now; the app picks the goal and the crops.
"""

from datetime import date, timedelta
from itertools import product
from statistics import mean

from .crops import CROPS
from .fertilizer import plan_for

# Crops can keep growing on stored soil water for a while after the rains stop.
RESIDUAL_MOISTURE_DAYS = 14

PRIORITY_WEIGHTS = {
    # growing_fit, soil, pest_break, water_saving, income
    # Growing fit always carries weight so a risky crop never wins on priority alone.
    "balanced": (0.40, 0.25, 0.10, 0.10, 0.15),
    "water":    (0.30, 0.10, 0.05, 0.55, 0.00),
    "income":   (0.25, 0.10, 0.05, 0.00, 0.60),
    "soil":     (0.25, 0.50, 0.20, 0.05, 0.00),
}
PRIORITY_NAMES = {"balanced": "a bit of everything", "water": "saving water",
                  "income": "more income", "soil": "rebuilding the soil"}

MAX_WATER_NEED = max(c["water_need_mm"] for c in CROPS.values())
EROSION = {"low": 0.0, "medium": 0.5, "high": 1.0}


def _doy_date(doy: int) -> date:
    return date(2001, 1, 1) + timedelta(days=doy - 1)


def _fmt(d: date) -> str:
    return d.strftime("%-d %b")


# ---------------------------------------------------------------- goal ----

def choose_goal(profile: dict, soil: dict, terrain: dict) -> dict:
    """Pick what this field needs most, from the data."""
    t = profile["trend"]
    if soil["nitrogen_level"] == "low" or soil["organic_matter_level"] == "low":
        return {"priority": "soil",
                "reason": f"Your soil is low in nitrogen ({soil['nitrogen_g_kg']} g/kg) and organic matter "
                          f"({soil['organic_carbon_g_kg']} g/kg carbon). Rebuilding it comes first."}
    if terrain["erosion_risk"] == "high":
        return {"priority": "soil",
                "reason": f"Your field slopes about {terrain['slope_pct']}%, so heavy rain can wash soil away. "
                          "Protecting the soil comes first."}
    if t["season_rain_change_mm"] < -30 or t["dry_spell_change_days"] > 2:
        return {"priority": "water",
                "reason": "Rain has been getting less reliable here, so saving water comes first."}
    return {"priority": "balanced", "reason": "Your soil and rain are fair, so the plan balances yield, soil and income."}


# ----------------------------------------------------------- crop fit ----

def _soil_fit(c: dict, soil: dict) -> tuple[float, list[str]]:
    lo, hi = c["ph_range"]
    ph = soil["ph"]
    ph_fit = 1.0 if lo <= ph <= hi else max(0.0, 1 - 0.3 * min(abs(ph - lo), abs(ph - hi)))
    tex_fit = c["texture_fit"][soil["texture"]]
    fert_fit = 1.0
    if c["needs_fertile_soil"]:
        fert_fit = {"low": 0.5, "medium": 0.8, "high": 1.0}[soil["nitrogen_level"]]
        if soil["organic_matter_level"] == "low":
            fert_fit -= 0.1
    notes = []
    if ph_fit < 1:
        notes.append(f"{c['name']} prefers pH {lo}-{hi}; this soil is pH {ph}.")
    if tex_fit < 0.7:
        notes.append(f"{c['name']} does poorly on {soil['texture']} soil.")
    if fert_fit < 0.8:
        notes.append(f"{c['name']} needs fertile soil; this field is low in nitrogen.")
    return 0.35 * ph_fit + 0.4 * tex_fit + 0.25 * fert_fit, notes


def crop_fit(crop_id: str, profile: dict, soil: dict) -> dict:
    """How well one crop fits this field's recent climate and its soil."""
    c = CROPS[crop_id]
    seasons = profile["seasons"]
    n = len(seasons)

    matures = sum(1 for s in seasons if s["length_days"] + RESIDUAL_MOISTURE_DAYS >= c["days"])
    enough_rain = sum(1 for s in seasons if s["season_rain_mm"] >= c["water_need_mm"])
    hot = profile["hot_days_in_season"]["median"]
    dry_spell = profile["longest_dry_spell_days"]["p80"]

    heat_score = 1 - (1 - c["heat_tolerance"]) * min(1, hot / 30)
    dry_score = 1 - (1 - c["drought_tolerance"]) * min(1, dry_spell / 14)
    climate = 0.35 * matures / n + 0.35 * enough_rain / n + 0.15 * heat_score + 0.15 * dry_score
    soil_score, soil_notes = _soil_fit(c, soil)
    score = 0.7 * climate + 0.3 * soil_score

    # Calendar: plant once rains are established, then count forward.
    onset = _doy_date(profile["onset"]["median"])
    plant_from, plant_to = onset, onset + timedelta(days=14)
    maturity = plant_from + timedelta(days=c["days"])
    harvest_to = maturity + timedelta(days=14)

    normal = profile["_daily_rain_normal"]
    hdoys = [min((maturity + timedelta(i)).timetuple().tm_yday, 365) for i in range(15)]
    harvest_rain = mean(normal[d] for d in hdoys)
    wet_harvest = "high" if harvest_rain > 3 else "medium" if harvest_rain > 1.5 else "low"

    return {
        "crop": crop_id,
        "name": c["name"],
        "fit_score": round(score, 2),
        "climate_score": round(climate, 2),
        "soil_score": round(soil_score, 2),
        "soil_notes": soil_notes,
        "matures_in_years": f"{matures} of {n}",
        "enough_rain_in_years": f"{enough_rain} of {n}",
        "calendar": {
            "plant_from": _fmt(plant_from),
            "plant_to": _fmt(plant_to),
            "harvest_from": _fmt(maturity),
            "harvest_to": _fmt(harvest_to),
            "days_to_maturity": c["days"],
            "harvest_window_rain_mm_per_day": round(harvest_rain, 1),
            "wet_harvest_risk": wet_harvest,
        },
    }


# ----------------------------------------------------------- rotations ----

def _fertilizer(seq, soil):
    """Fertilizer plan for each year, with legume credit from the other year."""
    plans = []
    for i, cid in enumerate(seq):
        prev = seq[i - 1]  # rotation repeats, so year 1 follows year 2
        plans.append(plan_for(cid, soil, after_legume=CROPS[prev]["legume"]))
    return plans


def _soil_score(a, b, same, soil, terrain):
    legumes = a["legume"] + b["legume"]
    cereal_after_legume = a["legume"] != b["legume"]
    score = 0.35 * min(1, legumes) + 0.15 * (legumes == 2) + 0.2 * cereal_after_legume
    score += 0.2 * mean([a["ground_cover"], b["ground_cover"]])
    score += 0.1 * (a["deep_roots"] or b["deep_roots"])
    if same:
        score -= 0.3
    # Real field conditions make some benefits matter more
    if soil["nitrogen_level"] == "low" and legumes:
        score += 0.1
    score += 0.15 * EROSION[terrain["erosion_risk"]] * (mean([a["ground_cover"], b["ground_cover"]]) - 0.5)
    return max(0.0, min(1.0, score))


def _pest_break(a, b, same):
    if same:
        return 0.0
    return 0.3 if a["family"] == b["family"] else 1.0


def _risk_label(fit: float) -> str:
    return "low" if fit >= 0.75 else "medium" if fit >= 0.55 else "high"


def score_rotation(seq, fits, priority, soil, terrain):
    a, b = CROPS[seq[0]], CROPS[seq[1]]
    same = seq[0] == seq[1]
    fert = _fertilizer(seq, soil)
    bags = mean(p["total_bags_per_ha"] for p in fert)
    parts = {
        "growing_fit": mean([fits[seq[0]]["fit_score"], fits[seq[1]]["fit_score"]]),
        "soil": _soil_score(a, b, same, soil, terrain),
        "pest_break": _pest_break(a, b, same),
        "water_saving": 1 - mean([a["water_need_mm"], b["water_need_mm"]]) / MAX_WATER_NEED * 0.8,
        # Market value minus the cost of fertilizer bags (each bag ~3% of a good season's value)
        "income": max(0.0, mean([a["market"], b["market"]]) - 0.03 * bags),
    }
    total = sum(w * v for w, v in zip(PRIORITY_WEIGHTS[priority], parts.values()))
    return {"sequence": list(seq), "score": round(total, 3), "fertilizer": fert,
            "parts": {k: round(v, 2) for k, v in parts.items()}}


def _explain(rot, fits, profile, soil, terrain, label):
    seq = rot["sequence"]
    crops = [CROPS[c] for c in seq]
    same = seq[0] == seq[1]
    trend = profile["trend"]
    fert = rot["fertilizer"]

    why, benefits, risks = [], [], []
    for cid in dict.fromkeys(seq):
        f = fits[cid]
        why.append(f"{f['name']} matured in {f['matures_in_years']} past seasons and got "
                   f"enough rain in {f['enough_rain_in_years']}.")
    good_soil = [CROPS[c]["name"] for c in dict.fromkeys(seq) if not fits[c]["soil_notes"]]
    if good_soil:
        why.append(f"{' and '.join(good_soil)} suit{'s' if len(good_soil) == 1 else ''} your "
                   f"{soil['texture']} soil (pH {soil['ph']}).")

    if any(c["legume"] for c in crops):
        legume_names = " and ".join(dict.fromkeys(c["name"] for c in crops if c["legume"]))
        benefits.append(f"{legume_names} adds nitrogen to your low-nitrogen soil, so the next cereal "
                        "needs less urea." if soil["nitrogen_level"] == "low" else
                        f"{legume_names} adds nitrogen, so the next cereal needs less fertilizer.")
        benefits.append(f"{legume_names} does not host Striga weed and can reduce it, which helps the next cereal.")
    if not same and crops[0]["family"] != crops[1]["family"]:
        benefits.append("Switching between a cereal and a legume breaks pest and disease cycles.")
    if any(c["deep_roots"] for c in crops):
        benefits.append("Deep roots reach water lower down and help open up the soil.")
    if any(c["ground_cover"] >= 0.7 for c in crops):
        benefits.append("Spreading crops cover the ground and protect it from heavy rain"
                        + (f" on your {terrain['slope_pct']}% slope." if terrain["erosion_risk"] != "low" else "."))
    if any(c["forage"] >= 0.8 for c in crops):
        benefits.append("The crop residue makes good livestock feed.")

    if same:
        risks.append("Growing the same crop every year drains the same nutrients and lets pests and Striga build up.")
    for cid in dict.fromkeys(seq):
        f = fits[cid]
        risks.extend(f["soil_notes"])
        if f["calendar"]["wet_harvest_risk"] != "low":
            risks.append(f"{f['name']} is often harvested while it is still raining "
                         f"({f['calendar']['wet_harvest_risk']} wet-harvest risk). Plan drying and storage.")
        if f["climate_score"] < 0.6:
            risks.append(f"{f['name']} is a poor fit for the recent climate here. Expect losses in dry or short seasons.")
    heavy = {p["crop"]: p for p in fert if p["total_bags_per_ha"] >= 5}.values()
    for p in heavy:
        risks.append(f"{p['crop']} needs about {p['total_bags_per_ha']:g} bags of fertilizer per hectare "
                     "on this soil, which is costly.")

    evidence = [
        f"NASA POWER {profile['years']}: rains usually start around {profile['onset']['median_date']} "
        f"(as late as {profile['onset']['late_year_date']} in 1 year out of 5) and stop around {profile['cessation']['median_date']}.",
        f"NASA POWER: {profile['season_rain_mm']['median']} mm of season rain in a typical year and "
        f"{profile['season_rain_mm']['p20']} mm in a dry year; the season lasts "
        f"{profile['season_length_days']['median']} days ({profile['season_length_days']['p20']} in a short year).",
        f"NASA POWER trend ({trend['periods']}): rains start {abs(trend['onset_shift_days']):.0f} days "
        f"{'earlier' if trend['onset_shift_days'] < 0 else 'later'}, and there are "
        f"{trend['hot_days_change']:+.0f} days above 35°C each season.",
        f"SoilGrids: nitrogen {soil['nitrogen_g_kg']} g/kg ({soil['nitrogen_level']}), organic carbon "
        f"{soil['organic_carbon_g_kg']} g/kg ({soil['organic_matter_level']}), pH {soil['ph']}, "
        f"{soil['sand_pct']}% sand ({soil['texture']}).",
        f"NASA SRTM: field slope about {terrain['slope_pct']}% ({terrain['erosion_risk']} erosion risk).",
    ]

    return {
        "label": label,
        "title": " → ".join(c["name"] for c in crops),
        "sequence": seq,
        "risk": _risk_label(rot["parts"]["growing_fit"]),
        "score": rot["score"],
        "parts": rot["parts"],
        "why": why,
        "benefits": benefits,
        "risks": list(dict.fromkeys(risks)),
        "evidence": evidence,
        "fertilizer": [p | {"year": i + 1} for i, p in enumerate(fert)],
        "calendar": [fits[c]["calendar"] | {"crop": CROPS[c]["name"], "year": i + 1}
                     for i, c in enumerate(seq)],
        "info_gaps": [
            "Soil values come from a 250 m soil map, not a test of this exact field. A soil test would confirm them.",
            "Soil phosphorus and potassium are not in the map, so standard P and K rates are used.",
            "NASA POWER rainfall is a coarse (~50 km) estimate. GPM IMERG would be more accurate.",
            "Local seed availability, prices and pest pressure are not in the data.",
        ],
        "check_with_expert": [
            "Which varieties of these crops are available and suited to this area?",
            "Is rhizobium inoculant available for the legume?",
            "Do these fertilizer amounts match a soil test and current prices?",
        ],
    }


def compare(profile, soil, terrain, current, priority="auto"):
    for c in current:
        if c not in CROPS:
            raise ValueError(f"unknown crop '{c}', choose from {list(CROPS)}")
    goal = choose_goal(profile, soil, terrain)
    if priority == "auto":
        priority = goal["priority"]
        goal_source = "auto"
    elif priority in PRIORITY_WEIGHTS:
        goal = {"priority": priority, "reason": f"You chose {PRIORITY_NAMES[priority]}."}
        goal_source = "farmer"
    else:
        raise ValueError(f"priority must be auto or one of {list(PRIORITY_WEIGHTS)}")

    fits = {cid: crop_fit(cid, profile, soil) for cid in CROPS}
    ranked = sorted((score_rotation(seq, fits, priority, soil, terrain) for seq in product(CROPS, repeat=2)),
                    key=lambda r: r["score"], reverse=True)

    def same_rotation(r, seq):
        # A→B and B→A are the same rotation, just started in a different year.
        return sorted(r["sequence"]) == sorted(seq)

    current_rot = next(r for r in ranked if r["sequence"] == list(current))
    best = next(r for r in ranked if not same_rotation(r, current))
    soil_ranked = sorted(ranked, key=lambda r: (r["parts"]["soil"], r["score"]), reverse=True)
    builder = next(r for r in soil_ranked
                   if not same_rotation(r, current) and not same_rotation(r, best["sequence"]))

    days_bare = 365 - (profile["cessation"]["median"] - profile["onset"]["median"])
    return {
        "priority": priority,
        "goal": goal | {"source": goal_source, "name": PRIORITY_NAMES[priority]},
        "crop_fit": sorted(fits.values(), key=lambda f: f["fit_score"], reverse=True),
        "options": [
            _explain(current_rot, fits, profile, soil, terrain, "current"),
            _explain(best, fits, profile, soil, terrain, "recommended"),
            _explain(builder, fits, profile, soil, terrain, "soil_builder"),
        ],
        "bare_field": {
            "from": profile["cessation"]["median_date"],
            "to": profile["onset"]["median_date"],
            "months": round(days_bare / 30.4, 1),
            "note": "Fields are mostly bare in the dry season. Leaving crop residue as mulch "
                    "reduces wind erosion and keeps more moisture in the soil.",
        },
    }
