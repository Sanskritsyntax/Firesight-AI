"""Main entry point for FireSight AI backend application."""

import os
import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router as api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("firesight-ai")

app = FastAPI(
    title="FireSight AI API",
    version=settings.APP_VERSION,
    description=(
        "Automated Forest Fire Prediction & Spread Simulation Backend. "
        "ORBITRON Spaceathon PS 11 by The ByteForce."
    ),
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints (mounted first to take absolute routing precedence)
app.include_router(api_router)


# Locate built frontend distribution directory if available
def find_frontend_dist() -> Path | None:
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "dist",
        Path("/app/frontend/dist"),
        Path("/app/dist"),
        Path(os.getcwd()) / "frontend" / "dist",
        Path(os.getcwd()) / "dist",
    ]
    for c in candidates:
        if c.exists() and (c / "index.html").is_file():
            return c
    return None


frontend_dist = find_frontend_dist()

if frontend_dist:
    logger.info(f"Serving built frontend from {frontend_dist}")
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Catch-all route to serve SPA index.html for non-API client routes
    @app.get("/{full_path:path}", tags=["Frontend"])
    async def serve_spa(request: Request, full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})

        target_file = frontend_dist / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)

        return FileResponse(frontend_dist / "index.html")
else:
    logger.info("Frontend dist directory not found. Serving default JSON API root.")

    @app.get("/", tags=["Root"])
    def root():
        return {
            "app": settings.APP_NAME,
            "team": settings.TEAM_NAME,
            "theme": "Remote Sensing & GIS",
            "category": "Software",
            "problem_statement": settings.PROBLEM_STATEMENT,
            "documentation": "/docs",
            "health": "/api/health",
            "status": "operational"
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

