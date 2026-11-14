# Season Planner: frontend

A phone-first app (React, Vite, Tailwind, Leaflet, three.js) in two colours, green `#1F3B2C` and white.

Flow: **Start → pick the farm on the map → tap what is planted now → plan**. The plan has four tabs:

- **Plan:** the recommended rotation, risk, fertilizer bags a year, soil effect, a comparison of the three options, and a "See it in 3D" viewer (with AR on phones).
- **Season:** NASA monthly rain and a timeline of when to plant and harvest.
- **Soil:** soil nitrogen, organic matter, pH and slope, plus the weather record.
- **Fertilizer:** bags per hectare for each year, and how many bags the rotation saves.

Every screen has a read-aloud button (browser text-to-speech, English for now).

## Run

Start the backend first (see `../backend/README.md`), then:

```bash
npm install
npm run dev
```

Open http://localhost:5173. In development, `/api` is proxied to the backend on port 8010. For a deployed build, set `VITE_API_URL` to the backend URL.

## Notes

- Photos are hotlinked from Wikimedia Commons (credits in `src/photos.js`) and shown through a green-and-white duotone filter. For an offline demo, save them into `public/` and update the paths.
- Map tiles and the NASA GIBS vegetation layer use the same duotone filter.
