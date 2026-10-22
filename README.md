# FireSight AI | Automated Forest Fire Prediction & Spread Simulation

[![ORBITRON Spaceathon](https://img.shields.io/badge/ORBITRON-Spaceathon%20PS%2011-orange.svg)](https://orbitron.spaceathon)
[![Team](https://img.shields.io/badge/Team-The%20ByteForce-emerald.svg)](#)
[![Theme](https://img.shields.io/badge/Theme-Remote%20Sensing%20%26%20GIS-blue.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-gray.svg)](#)

FireSight AI is an operational full-stack geospatial intelligence platform built for the **ORBITRON Spaceathon**, addressing **Problem Statement PS 11: Automated Forest Fire Prediction & Spread Simulation**.

The application combines satellite thermal anomalies (**NASA FIRMS**), high-resolution numerical weather observations and forecasts (**Open-Meteo**), vegetation biome and fuel indicators (**ISRO VEDAS**), an explainable multi-criteria risk engine, a deterministic 6–12 hour Huygens cellular fire-spread simulator, and an interactive GIS visualization interface.

---

## 1. Key System Features

### A. Main GIS Command Dashboard
- **Interactive Multi-Layer Map:** Dark Matter Leaflet GIS with toggleable VIIRS 375m thermal hotspots, multi-tier risk grid polygons, and directional wind vectors.
- **Region Management:** Default demonstration reserves across India:
  - **Similipal Tiger Reserve & Biosphere, Odisha** (Dense moist-deciduous sal forest).
  - **Bandipur National Park, Karnataka** (Western Ghats Nilgiri dry deciduous corridor).
  - **Jim Corbett Tiger Reserve, Uttarakhand** (Sub-Himalayan sal & chir pine needle beds).
  - **Gir National Park & Sanctuary, Gujarat** (Dry teak & thorn scrub arid savanna).
  - *Custom bounding box and map-click coordinate selection supported.*
- **Overview Telemetry:** Real-time metrics for detected thermal pixels, low/medium/high risk cell counts, ambient temperature, relative humidity, wind velocity/heading, precipitation, and source latency.
- **Priority Critical Sectors:** Ranked high-risk spatial cells with coordinate readouts, composite scores, and dominant physical driving factors.

### B. 6–12 Hour Deterministic Fire-Spread Simulator
- **Wave Propagation Model:** Deterministic Rothermel-Alexander elliptical propagation (Huygens principle) driven by wind vector and fuel density factor.
- **Dynamic Controls:** Configurable ignition coordinates (select from detected hotspots or click map), 6h vs 12h scenario duration, wind speed (0–70 km/h), wind heading (0–360°), and fuel moisture parameters.
- **Interactive Timeline Playback:** Step slider with Auto-Play/Pause, scrubbing between hourly isochrone perimeters with real-time burned area (km²) and perimeter metrics.
- **Transparent Safety Labeling:** Persistent advisory disclosing illustrative assumptions versus operational forecasts.

### C. 24-Hour Meteorological Forecast Timeline
- **Four Discrete Epochs:** `Now (T+0)`, `+6 Hours`, `+12 Hours`, `+24 Hours`.
- **Atmospheric Driving Dynamics:** Recomputes risk grid based on Open-Meteo numerical weather forecasts.
- **Honest Uncertainty Protocol:** Active hotspots are not artificially projected into the future; future risk is governed strictly by forecast atmospheric drying, wind shifts, and ambient heat.

### D. Thermal Hotspots Catalog
- Tabular inspection of NASA VIIRS sensor detections with confidence rankings, Fire Radiative Power (MW), brightness temperatures (K), and acquisition timestamps.
- Search, filter by confidence level, multi-column sorting, and one-click **"Simulate Spread from this Hotspot"**.

### E. Analytics & Grounded Insights
- Multi-sensor 7-to-30 day trend charts (Temperature, RH, Wind speed, Precipitation, and Hotspots over time).
- **Automated Data-Grounded Insights:** Synthesizes observations into factual statements (e.g. spatial clustering quadrants, humidity deficits, wind acceleration threats) backed by calculated numerical evidence.

### F. Multi-Format Reporting & Export
- **CSV Export:** Download filtered thermal hotspot anomalies.
- **GeoJSON Export:** Download georeferenced risk polygons ready for QGIS / ArcGIS.
- **JSON Simulation Export:** Structured simulation parameters, wavefront coordinates, and perimeter steps.
- **Printable Incident Briefing:** Print-optimized executive report for field commanders.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Leaflet, Recharts, Lucide React |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, Uvicorn |
| **Data & ML** | Pandas, NumPy, Scikit-learn (RandomForest benchmark), HTTPX |
| **Remote Sensing** | NASA FIRMS (VIIRS 375m & MODIS), Open-Meteo API, ISRO VEDAS |

---

## 3. Project Directory Structure

```
firesight-ai/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application entry point
│   │   ├── config.py               # Pydantic settings & weights configuration
│   │   ├── api/
│   │   │   └── routes.py           # REST endpoints
│   │   ├── schemas/
│   │   │   └── models.py           # Pydantic schemas
│   │   ├── services/
│   │   │   ├── firms_service.py    # NASA FIRMS API integration & demo fallback
│   │   │   ├── weather_service.py  # Open-Meteo weather API integration
│   │   │   ├── vedas_service.py    # ISRO VEDAS environmental layer
│   │   │   └── data_pipeline.py    # Unified data orchestrator & freshness checks
│   │   ├── risk_engine/
│   │   │   ├── baseline_model.py   # Multi-criteria weighted scoring formula
│   │   │   ├── grid_generator.py   # Spatial GeoJSON polygon grid generator
│   │   │   └── ml_model.py         # Scikit-learn RandomForest classifier benchmark
│   │   ├── simulation/
│   │   │   └── spread_model.py     # Deterministic Huygens fire-spread engine
│   │   ├── analytics/
│   │   │   └── insights_engine.py  # Data-grounded automated insights
│   │   └── utils/
│   │       └── geo_utils.py        # Haversine distance, bounds, coordinate validation
│   ├── data/demo/                  # Verified demonstration datasets
│   │   ├── demo_regions.json
│   │   ├── demo_hotspots.json
│   │   └── demo_weather.json
│   ├── tests/                      # Pytest test suite (16 tests, 100% pass)
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, Sidebar, StatCard, ExportModal, PrintReport
│   │   ├── pages/                  # Dashboard, Simulation, Timeline, Hotspots, Analytics, Docs
│   │   ├── map/                    # GisMap (Leaflet), MapLegend
│   │   ├── charts/                 # RiskDistribution, WeatherTrends, HotspotTimeline
│   │   ├── services/api.ts         # REST client
│   │   └── types/index.ts          # TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── .env.example
└── README.md
```

---

## 4. Getting Started & Installation

### Prerequisites
- **Python:** 3.10 or higher (Python 3.12 recommended)
- **Node.js:** v18.0 or higher (v20+ recommended)
- **npm:** v9.0 or higher

### Step 1: Clone Repository
```bash
git clone https://github.com/the-byteforce/firesight-ai.git
cd firesight-ai
```

### Step 2: Configure Environment Variables
Copy the template configuration file:
```bash
cp .env.example backend/.env
```
*(Optional: If you possess a free NASA FIRMS MAP_KEY, insert it into `NASA_FIRMS_MAP_KEY`. If left empty, the system automatically uses the verified synthetic demo mode without errors).*

### Step 3: Setup & Launch Backend
```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
python run.py
```
*Backend server will start at `http://127.0.0.1:8000`. Interactive OpenAPI documentation available at `http://127.0.0.1:8000/docs`.*

### Step 4: Setup & Launch Frontend
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server will start at `http://localhost:5173` with automatic reverse proxy to the backend API.*

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and team metadata |
| `GET` | `/api/regions` | List supported Indian study regions |
| `GET` | `/api/hotspots` | Filtered active thermal anomalies (FIRMS) |
| `GET` | `/api/weather` | Current weather observations (Open-Meteo) |
| `POST` | `/api/risk/analyze` | Calculate spatial risk scores & GeoJSON grid |
| `POST` | `/api/simulation/run` | Execute 6h/12h fire spread simulation |
| `GET` | `/api/forecast/timeline` | 24h meteorological risk timeline (+6h, +12h, +24h) |
| `GET` | `/api/analytics` | Multi-day trends and grounded insights |
| `GET` | `/api/data/status` | Ingestion latency, freshness & attribution |
| `GET` | `/api/ml/evaluation` | Scikit-learn benchmark metrics & importances |
| `GET` | `/api/export/csv` | Download hotspot records as CSV |
| `GET` | `/api/export/geojson` | Download risk polygons as GeoJSON |

---

## 6. Testing & Quality Assurance

The backend features an automated test suite covering risk engine calculations, missing input re-weighting, simulation determinism, monotonicity, and API endpoints.

To run the test suite:
```bash
cd backend
python -m pytest tests/ -v
```
**Results:** `16 passed` (100% test passing rate).

To verify the frontend build:
```bash
cd frontend
npm run build
```

---

## 7. Model Methodology & Scientific Principles

### Baseline Risk Scoring Equation
$$\text{Risk Score} = \sum_{k} w_k \cdot F_k$$
- **Thermal Proximity ($w = 0.35$):** $F_{\text{hotspot}} = \exp(-(d - 1) / 4)$ for distance $d \le 15$ km.
- **Relative Humidity ($w = 0.20$):** Inverse scaling $(80 - \text{RH}) / 70$.
- **Ambient Temperature ($w = 0.15$):** Normalized $(T - 15) / 30$.
- **Wind Velocity ($w = 0.15$):** Forward convective scaling $\min(50, W) / 50$.
- **Precipitation Dampener ($w = 0.10$):** Dampening factor $1.0 - (\min(5, P) / 5)$.
- **Fuel Density ($w = 0.05$):** Biome classification multiplier from ISRO VEDAS data.

### Spread Simulation Physics
- Uses the **Alexander Length-to-Width (L/W)** ratio equation:
  $$L/W = 1.0 + 0.0012 \cdot W^{1.8}$$
- Forward spread rate $R_f$ accelerates with wind velocity:
  $$R_f = R_0 \cdot (1 + 0.04 \cdot W^{1.15}) \cdot \text{Fuel} \cdot \text{Multiplier}$$
- Hourly elliptical isochrones are generated deterministically and converted to spatial GeoJSON wavefronts.

---

## 8. Safety & Operational Disclaimer

> [!CAUTION]
> **FireSight AI provides indicative risk estimates and illustrative simulations for situational awareness. It is not a validated fire forecast, a confirmed fire-detection service, or a replacement for emergency authorities. Always follow official alerts and instructions from the National Disaster Management Authority (NDMA), Forest Survey of India (FSI), and local State Forest Departments.**
