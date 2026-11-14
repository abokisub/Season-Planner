"""Crop table for the northern Nigeria (Sudan savanna) demo.

Values are v1 approximations for early-maturing varieties commonly grown in
the region (FAO crop water needs, IITA / national variety notes). They must be
reviewed by a local agronomist before real use.

Scores are 0-1 (higher = more of that trait).

fertilizer_kg_ha: typical recommended rates (kg/ha of N, P2O5, K2O) for the
northern Nigerian savanna, after the Federal Ministry of Agriculture's
"Fertilizer Use and Management Practices for Crops in Nigeria". The app
adjusts N for the field's real soil nitrogen and any legume in the rotation.
texture_fit: how well the crop does on each soil texture (1 = ideal).
"""

CROPS = {
    "maize": {
        "name": "Maize",
        "family": "cereal",
        "days": 90,              # extra-early / early varieties
        "water_need_mm": 450,    # minimum seasonal rain for a fair crop
        "heat_tolerance": 0.4,   # sensitive to heat at flowering
        "drought_tolerance": 0.3,
        "legume": False,
        "ground_cover": 0.4,
        "deep_roots": False,
        "nitrogen_demand": "high",
        "market": 0.8,
        "forage": 0.6,
        "striga_host": True,
        "ph_range": (5.5, 7.5),
        "texture_fit": {"sand": 0.3, "loamy sand": 0.5, "sandy loam": 0.8, "loam": 1.0, "clay loam": 0.9, "clay": 0.6},
        "needs_fertile_soil": True,
        "fertilizer_kg_ha": {"N": 120, "P2O5": 60, "K2O": 60},
        "note": "High value but needs reliable rain and fertile soil.",
    },
    "sorghum": {
        "name": "Sorghum",
        "family": "cereal",
        "days": 105,
        "water_need_mm": 400,
        "heat_tolerance": 0.8,
        "drought_tolerance": 0.75,
        "legume": False,
        "ground_cover": 0.4,
        "deep_roots": True,
        "nitrogen_demand": "medium",
        "market": 0.7,
        "forage": 0.8,
        "striga_host": True,
        "ph_range": (5.5, 8.5),
        "texture_fit": {"sand": 0.5, "loamy sand": 0.7, "sandy loam": 0.9, "loam": 1.0, "clay loam": 1.0, "clay": 0.9},
        "needs_fertile_soil": False,
        "fertilizer_kg_ha": {"N": 60, "P2O5": 30, "K2O": 30},
        "note": "Tough under heat and dry spells; deep roots reach stored water.",
    },
    "millet": {
        "name": "Pearl millet",
        "family": "cereal",
        "days": 85,
        "water_need_mm": 300,
        "heat_tolerance": 0.9,
        "drought_tolerance": 0.9,
        "legume": False,
        "ground_cover": 0.35,
        "deep_roots": True,
        "nitrogen_demand": "low",
        "market": 0.5,
        "forage": 0.6,
        "striga_host": True,
        "ph_range": (5.0, 8.0),
        "texture_fit": {"sand": 0.9, "loamy sand": 1.0, "sandy loam": 1.0, "loam": 0.9, "clay loam": 0.7, "clay": 0.5},
        "needs_fertile_soil": False,
        "fertilizer_kg_ha": {"N": 40, "P2O5": 20, "K2O": 20},
        "note": "The safest cereal in short, dry seasons.",
    },
    "cowpea": {
        "name": "Cowpea",
        "family": "legume",
        "days": 75,
        "water_need_mm": 300,
        "heat_tolerance": 0.8,
        "drought_tolerance": 0.8,
        "legume": True,
        "ground_cover": 0.8,
        "deep_roots": False,
        "nitrogen_demand": "low",
        "market": 0.8,
        "forage": 0.9,
        "striga_host": False,
        "ph_range": (5.5, 7.5),
        "texture_fit": {"sand": 0.7, "loamy sand": 0.9, "sandy loam": 1.0, "loam": 1.0, "clay loam": 0.7, "clay": 0.5},
        "needs_fertile_soil": False,
        "fertilizer_kg_ha": {"N": 20, "P2O5": 40, "K2O": 0},
        "note": "Fixes nitrogen, covers the ground, and the hay feeds livestock.",
    },
    "groundnut": {
        "name": "Groundnut",
        "family": "legume",
        "days": 95,
        "water_need_mm": 400,
        "heat_tolerance": 0.7,
        "drought_tolerance": 0.6,
        "legume": True,
        "ground_cover": 0.7,
        "deep_roots": False,
        "nitrogen_demand": "low",
        "market": 0.9,
        "forage": 0.8,
        "striga_host": False,
        "ph_range": (5.5, 7.0),
        "texture_fit": {"sand": 0.8, "loamy sand": 1.0, "sandy loam": 1.0, "loam": 0.8, "clay loam": 0.5, "clay": 0.3},
        "needs_fertile_soil": False,
        "fertilizer_kg_ha": {"N": 20, "P2O5": 40, "K2O": 0},
        "note": "Fixes nitrogen and sells well; haulms are valuable fodder.",
    },
}
