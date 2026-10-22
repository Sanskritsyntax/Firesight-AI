# FireSight AI — Production Deployment Guide

FireSight AI is engineered as a unified full-stack application. The **FastAPI backend** serves both the **REST API (`/api/*`)** and the compiled **React Vite frontend SPA (`/`)** from a single port with zero CORS friction.

---

## Deployment Options at a Glance

| Method | Target Environment | Difficulty | Cost |
| :--- | :--- | :---: | :---: |
| **Option 1: Vercel** | Serverless Cloud (FastAPI + Vite) | Very Easy | **Free** |
| **Option 2: Render (Recommended)** | Cloud Web Service (Docker) | Very Easy | **Free** |
| **Option 3: Railway** | Cloud Container Platform | Very Easy | Free / Usage |
| **Option 4: Docker & Docker Compose** | Local Machine or VPS (AWS/GCP/Linode) | Easy | Cost of VPS |
| **Option 5: Direct Production Run** | Local Machine (Single Port 8000) | Immediate | **Free** |

---

## Option 1: Deploying to Vercel (Multi-Service Architecture)

FireSight AI is configured for **Vercel Services** via [`vercel.json`](./vercel.json). This allows the frontend (React Vite) and backend (FastAPI) to deploy as two independent services inside a single unified Vercel project sharing the same domain.

* **Frontend Service:** Runs from `frontend/` using the Vite framework preset.
* **Backend Service:** Runs from `backend/` using the Python runtime (`main:app`).
* **Rewrites:** Automatically routes `/api/*`, `/docs`, and `/openapi.json` to the backend service, and all client-side routes (`/*`) to the frontend service.

### Method A: Web Dashboard (1-Click)
1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Select your imported GitHub repository: **`Sanskritsyntax/Firesight-AI`**.
3. Vercel automatically detects the multi-service configuration via `vercel.json`.
4. Click **Deploy**. Vercel will build both services in parallel and deploy them under your live domain (e.g., `https://firesight-ai.vercel.app`).

### Method B: Deploy via Vercel CLI
```bash
# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod
```


---

## Option 1: Deploying to Render (Recommended — Free Tier)

Render can build and run FireSight AI directly from your GitHub repository using the included `Dockerfile` and `render.yaml`.

### Method A: Blueprint 1-Click Setup
1. Push your code to a GitHub repository (e.g., `github.com/your-username/firesight-ai`).
2. Log into [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository. Render will automatically detect [`render.yaml`](./render.yaml).
5. Click **Apply**. Render will automatically build the multi-stage Docker container and give you a live HTTPS URL (e.g., `https://firesight-ai.onrender.com`).

### Method B: Manual Web Service Setup
1. On [Render Dashboard](https://dashboard.render.com), click **New +** > **Web Service**.
2. Select your repository.
3. Configure the settings:
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Docker Context:** `.`
   - **Health Check Path:** `/api/health`
4. Under **Environment Variables**, add:
   - `NASA_FIRMS_MAP_KEY`: *(Optional: Your free NASA FIRMS MAP_KEY; if omitted, verified synthetic demo mode activates automatically)*
   - `FORCE_DEMO_MODE`: `false`
5. Click **Create Web Service**.

---

## Option 2: Deploying to Railway

Railway detects [`Dockerfile`](./Dockerfile) and [`railway.json`](./railway.json) automatically:
1. Log into [Railway](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Select your `firesight-ai` repository.
4. Railway will automatically initiate the multi-stage Docker build.
5. In your project settings, click **Generate Domain** to get a public URL (e.g., `https://firesight-ai.up.railway.app`).

---

## Option 3: Deploying with Docker & Docker Compose (Any VPS or Local)

To run the unified container anywhere with Docker installed:

### Build and Run with Docker Compose
```bash
docker compose up --build -d
```
- The application will be live at: `http://localhost:8000`
- API documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### Stop Container
```bash
docker compose down
```

### Standalone Docker Build & Run
```bash
# 1. Build image
docker build -t firesight-ai:latest .

# 2. Run container
docker run -d -p 8000:8000 --name firesight-app firesight-ai:latest
```

---

## Option 4: Direct Local Production Run (Single Port)

If you want to run the production build locally without Docker:

### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```
*This compiles the React application into `frontend/dist`.*

### Step 2: Run Unified Backend
```bash
cd backend
python run.py
```
*FastAPI automatically detects `frontend/dist` and serves both the frontend application and all API endpoints together on `http://localhost:8000`.*

---

## Verification & Health Check

Once deployed, verify the endpoints:
- **Web App (Frontend UI):** `https://your-domain.com/`
- **Interactive OpenAPI Docs:** `https://your-domain.com/docs`
- **System Health Status:** `https://your-domain.com/api/health`
- **Study Regions:** `https://your-domain.com/api/regions`
