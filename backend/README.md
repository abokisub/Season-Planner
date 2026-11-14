# Season Planner: backend

The backend compares crop rotations for one farm using NASA POWER climate data. Demo location: farmland near Kano, northern Nigeria (12.15 N, 8.35 E). Kano city itself has no soil data because towns are masked in soil maps.

## Run

```bash
cd backend
uv venv --python 3.12 .venv && uv pip install --python .venv -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8010
```

Interactive docs: http://127.0.0.1:8010/docs

## Endpoints

| Endpoint | What it returns |
|---|---|
| `GET /plan?lat=12&lon=8.52&current=maize,maize&priority=balanced` | The full plan: climate summary, season status, crop fit, and 3 rotation options with reasons, evidence, benefits, risks, information gaps and a calendar |
| `GET /climate?lat=&lon=` | The 20-year climate profile only |
| `GET /crops` | The crop table |
| `GET /demo` | The demo location |

`priority` defaults to `auto`: the app picks the goal from the field's soil, slope and rain trend. A farmer can override it with `balanced`, `water`, `income` or `soil`.
`current` is one or two crops from `maize`, `sorghum`, `millet`, `cowpea` and `groundnut`.

## How it works

1. **`app/power.py`** fetches daily NASA POWER data: temperature, rainfall, humidity, soil wetness and solar radiation. It caches 20 years of history for 30 days and the current year for 1 hour. If NASA is down, it serves the last cached copy and marks it `stale`.
2. **`app/climate.py`** finds each year's rainy-season start and end, then works out season length, season rainfall, the longest dry spell and the number of hot days. It reports a typical year (median), a bad year (p20/p80) and the change between 2006–2015 and 2016–2025. It also checks this year's season against normal.
3. **`app/soil.py`** reads real soil for the field from ISRIC SoilGrids 2.0 (250 m): nitrogen, organic carbon, pH, sand, clay and CEC, averaged over 0–30 cm and rated low/medium/high. The first call for a new place can take up to a minute, so results are cached permanently.
4. **`app/terrain.py`** works out the field's slope and erosion risk from NASA SRTM elevation (AWS Terrain Tiles).
5. **`app/fertilizer.py`** gives fertilizer in bags per hectare (NPK 15-15-15, urea, SSP) for each crop. It cuts nitrogen when the soil already has some, and when the crop follows a legume.
6. **`app/crops.py`** holds the crop table: days to maturity, water need, heat and drought tolerance, legume, ground cover, market value. These are v1 values and need agronomist review.
7. **`app/rotation.py`** scores each crop on climate (70%) and soil (30%): pH, texture and fertility. It scores each crop by how often it would have matured and got enough rain over the last 20 seasons. It then scores every 2-year rotation on climate fit, soil health, pest break, water saving and income, weighted by the farmer's priority. It returns three options:
   - the **current** rotation
   - the **best for the farmer's priority**
   - a **soil builder**

## Known data limitations

- POWER rainfall is a coarse (~50 km) model estimate and reads lower than Kano station records. Adding GPM IMERG is the planned fix.
- POWER's most recent weeks come from a near-real-time model, so recent soil wetness isn't comparable with history. The season status uses rainfall only. SMAP is the planned check.
- Soil values come from a 250 m map, not a test of the exact field. Phosphorus and potassium aren't mapped, so standard P and K rates are used.
- Fertilizer rates follow typical northern Nigeria recommendations and should be checked by an extension officer.
