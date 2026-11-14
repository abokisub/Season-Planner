"""Fertilizer advice per crop, adjusted for the field's real soil.

Base rates: crops.CROPS[...]["fertilizer_kg_ha"] (northern Nigeria savanna).
Adjustments:
- Nitrogen is cut when SoilGrids shows medium/high soil nitrogen.
- A cereal grown after a legume gets a nitrogen credit (~30 kg N/ha), the
  commonly reported benefit of cowpea/groundnut in savanna rotations.
- Legumes get phosphorus (SSP) only; they make their own nitrogen.
Products are the ones sold in Nigeria: NPK 15-15-15, urea (46% N),
single super phosphate (SSP, 18% P2O5). One bag = 50 kg.
"""

from .crops import CROPS

LEGUME_N_CREDIT = 30
N_FACTOR = {"low": 1.0, "medium": 0.8, "high": 0.6}
BAG_KG = 50
HA_PER_ACRE = 0.405


def _bags(kg: float) -> float:
    return round(kg / BAG_KG * 2) / 2  # nearest half bag


def plan_for(crop_id: str, soil: dict, after_legume: bool) -> dict:
    crop = CROPS[crop_id]
    rec = crop["fertilizer_kg_ha"]
    notes = []
    products = []

    if crop["legume"]:
        p = rec["P2O5"]
        products.append({"name": "SSP (single super phosphate)", "bags_per_ha": _bags(p / 0.18),
                         "when": "At planting, in the row"})
        n = 0
        k = 0
        notes.append(f"{crop['name']} makes its own nitrogen, so no urea is needed. "
                     "Phosphorus helps it fix more nitrogen.")
    else:
        n = rec["N"] * N_FACTOR[soil["nitrogen_level"]]
        if after_legume:
            n = max(0, n - LEGUME_N_CREDIT)
            notes.append(f"Grown after a legume, so it needs about {LEGUME_N_CREDIT} kg/ha less nitrogen.")
        p, k = rec["P2O5"], rec["K2O"]
        npk_kg = max(p, k) / 0.15
        npk_n = npk_kg * 0.15
        if npk_n > n:  # don't over-apply N through NPK
            npk_kg = n / 0.15
        urea_kg = max(0, n - npk_kg * 0.15) / 0.46
        products.append({"name": "NPK 15-15-15", "bags_per_ha": _bags(npk_kg), "when": "At planting or 2 weeks after"})
        if urea_kg > 0:
            products.append({"name": "Urea (46% N)", "bags_per_ha": _bags(urea_kg), "when": "4 to 6 weeks after planting"})

    if soil["organic_matter_level"] == "low":
        notes.append("Soil organic matter is low. Add 2 to 5 tonnes of manure or compost per hectare "
                     "before planting if you can.")
    if soil["ph_level"] == "acidic":
        notes.append(f"Soil is acidic (pH {soil['ph']}). Liming may be needed; ask the extension officer.")

    total = sum(pr["bags_per_ha"] for pr in products)
    return {
        "crop": crop["name"],
        "nutrients_kg_ha": {"N": round(n), "P2O5": round(p), "K2O": round(k)},
        "products": products,
        "total_bags_per_ha": total,
        "total_bags_per_acre": round(total * HA_PER_ACRE * 2) / 2,
        "notes": notes,
    }
