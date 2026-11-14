# Season Planner

**NASA Space Apps Challenge 2026 · Field Shift: Adapting Farms with NASA Data**

A phone app that tells a farmer in northern Nigeria which crops to rotate on their field, when to plant and harvest, and how much fertilizer to use. Every result is read aloud for farmers who can't read.

For the chosen field, the app:

1. reads **20 years of NASA POWER** daily weather (rain, heat, soil wetness)
2. reads the **soil** (nitrogen, organic matter, pH, texture) from ISRIC SoilGrids
3. reads the **slope** from **NASA SRTM** elevation
4. scores every two-year crop rotation and recommends one, compared with what the farmer grows now
5. gives fertilizer advice in **bags per hectare**, adjusted for that soil

The app supports, but does not replace, the farmer's own judgment and their extension officer.

## Project layout

- [`backend/`](backend/README.md): Python FastAPI service with the data and recommendation logic
- [`frontend/`](frontend/README.md): React phone app (green and white design, 3D/AR field view)
- `api/index.py` + `vercel.json`: deploy of both to Vercel (website + Python API on one domain)

## Run locally

```bash
cd backend && uv venv --python 3.12 .venv && uv pip install --python .venv -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8010
```

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

## Deploy

On [Vercel](https://vercel.com): **Add New → Project**, import this repository, keep the settings from `vercel.json`, and click **Deploy**. The website is served from `frontend/dist`, and the Python API runs as a function at `/api/...`.

## Data sources

- NASA POWER daily point API: weather, 2006–2025
- NASA SRTM elevation, via AWS Terrain Tiles: slope
- NASA GIBS MODIS NDVI: vegetation map layer
- ISRIC SoilGrids 2.0 (not NASA): soil properties
- Wikimedia Commons: crop and farm photos (credits in `frontend/src/photos.js`)
