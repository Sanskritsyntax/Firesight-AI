"""FastAPI API router for FireSight AI backend endpoints."""

import io
import csv
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import JSONResponse, StreamingResponse

from app.schemas.models import (
    StudyRegion, BoundingBox, HotspotRecord, WeatherObservation,
    RiskAnalysisRequest, RiskAnalysisResponse,
    SimulationRequest, SimulationResponse,
    ForecastTimelineResponse, TimelineStep,
    AnalyticsResponse, SystemStatusResponse
)
from app.services.data_pipeline import data_pipeline
from app.services.firms_service import firms_service
from app.services.weather_service import weather_service
from app.services.vedas_service import vedas_service
from app.risk_engine.grid_generator import grid_generator
from app.risk_engine.ml_model import ml_classifier
from app.simulation.spread_model import fire_simulator
from app.analytics.insights_engine import analytics_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/health", tags=["System"])
async def get_health():
    """Backend health check and operational state."""
    return {
        "status": "healthy",
        "app": "FireSight AI",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "team": "The ByteForce",
        "spaceathon_problem": "PS 11: Automated Forest Fire Prediction & Spread Simulation"
    }


@router.get("/regions", response_model=List[StudyRegion], tags=["Geospatial"])
async def get_regions():
    """Retrieve supported demonstration study regions in India."""
    return data_pipeline.regions


@router.get("/hotspots", response_model=List[HotspotRecord], tags=["Thermal Observations"])
async def get_hotspots(
    region_id: Optional[str] = Query(None, description="Region ID to filter"),
    min_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    days: int = Query(1, ge=1, le=7),
    force_demo: bool = Query(False)
):
    """
    Retrieve active fire / thermal anomalies.
    Integrates NASA FIRMS VIIRS sensor observations with transparent demo fallback.
    """
    bbox = None
    if all(v is not None for v in [min_lat, min_lon, max_lat, max_lon]):
        bbox = BoundingBox(min_lat=min_lat, min_lon=min_lon, max_lat=max_lat, max_lon=max_lon)

    hotspots = await firms_service.get_hotspots(
        bbox=bbox,
        region_id=region_id,
        days=days,
        force_demo=force_demo
    )
    return hotspots


@router.get("/weather", response_model=WeatherObservation, tags=["Meteorology"])
async def get_weather(
    region_id: Optional[str] = Query(None),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    force_demo: bool = Query(False)
):
    """
    Retrieve weather parameters (temperature, humidity, wind, precipitation)
    from Open-Meteo API or verified demo data.
    """
    region = data_pipeline.get_region(region_id) if region_id else data_pipeline.regions[0]
    
    target_lat = lat if lat is not None else (region.center.latitude if region else 21.65)
    target_lon = lon if lon is not None else (region.center.longitude if region else 86.35)

    return await weather_service.get_current_weather(
        lat=target_lat,
        lon=target_lon,
        region_id=region.id if region else None,
        force_demo=force_demo
    )


@router.post("/risk/analyze", response_model=RiskAnalysisResponse, tags=["Risk Engine"])
async def analyze_risk(req: RiskAnalysisRequest):
    """
    Calculate georeferenced forest fire risk scores and produce a GeoJSON risk grid.
    Uses transparent multi-factor weighted scoring with full explainability.
    """
    region = data_pipeline.get_region(req.region_id) if req.region_id else data_pipeline.regions[0]
    target_bbox = req.bbox or (region.bbox if region else BoundingBox(
        min_lat=21.40, min_lon=86.10, max_lat=21.90, max_lon=86.60
    ))
    
    data = await data_pipeline.get_region_data(
        region_id=region.id if region else None,
        bbox=target_bbox,
        force_demo=req.force_demo
    )

    hotspots = data["hotspots"]
    weather = data["weather"]
    veg = data["vegetation"]

    step = req.step_deg or 0.03
    grid_result = grid_generator.generate_risk_grid(
        bbox=target_bbox,
        weather=weather,
        hotspots=hotspots,
        fuel_factor=veg.get("fuel_density_factor", 0.75),
        step_deg=step
    )

    data_sources = [
        hotspots[0].source if hotspots else "NASA FIRMS (0 detections in window)",
        weather.source,
        veg.get("source", "ISRO VEDAS Environmental Baseline")
    ]

    is_synthetic = any(h.is_synthetic for h in hotspots) or weather.is_synthetic

    return RiskAnalysisResponse(
        region_id=region.id if region else "custom_region",
        region_name=region.name if region else "Custom Geographic Bounding Box",
        timestamp=datetime.utcnow().isoformat() + "Z",
        bbox=target_bbox,
        total_cells=grid_result["total_cells"],
        counts_by_category=grid_result["counts"],
        percentages_by_category=grid_result["percentages"],
        average_score=grid_result["average_score"],
        weather_summary=weather,
        hotspots_detected=len(hotspots),
        grid_geojson=grid_result["geojson"],
        highest_risk_cells=grid_result["highest_risk_cells"],
        data_sources=data_sources,
        is_synthetic=is_synthetic
    )


@router.post("/simulation/run", response_model=SimulationResponse, tags=["Fire Simulation"])
async def run_simulation(req: SimulationRequest):
    """
    Run deterministic 6-hour or 12-hour spatial fire spread simulation.
    Applies Rothermel-Alexander elliptical propagation driven by wind vector and fuel load.
    """
    return fire_simulator.run_simulation(req)


@router.get("/forecast/timeline", response_model=ForecastTimelineResponse, tags=["Forecast Timeline"])
async def get_forecast_timeline(
    region_id: Optional[str] = Query(None),
    force_demo: bool = Query(False)
):
    """
    Generate 24-hour forecast timeline (Now, +6h, +12h, +24h).
    Pulls forecast meteorological inputs and estimates future risk without fabricating future hotspots.
    """
    region = data_pipeline.get_region(region_id) if region_id else data_pipeline.regions[0]
    
    # 1. Fetch current hotspots (used as baseline observations only for T+0)
    hotspots = await firms_service.get_hotspots(
        bbox=region.bbox,
        region_id=region.id,
        force_demo=force_demo
    )
    
    # 2. Fetch forecast weather steps from Open-Meteo
    weather_steps = await weather_service.get_forecast_steps(
        lat=region.center.latitude,
        lon=region.center.longitude,
        region_id=region.id
    )

    timeline_steps = []
    veg = vedas_service.get_vegetation_profile(region.id)

    for ws in weather_steps:
        w_obs = ws["weather"]
        is_fc = ws["is_forecast"]
        
        # In accordance with prompt guidelines:
        # "Use weather forecast values for future time steps when available.
        # Do not extend current hotspot observations into the future and present them as newly observed fires."
        # For future time steps, pass empty hotspots list so risk reflects meteorological fire danger!
        step_hotspots = hotspots if not is_fc else []

        step_grid = grid_generator.generate_risk_grid(
            bbox=region.bbox,
            weather=w_obs,
            hotspots=step_hotspots,
            fuel_factor=veg.get("fuel_density_factor", 0.75),
            step_deg=0.04  # slightly coarser for fast timeline switching
        )

        timeline_steps.append(
            TimelineStep(
                step_id=ws["step_id"],
                label=ws["label"],
                timestamp=w_obs.timestamp,
                is_forecast=is_fc,
                weather=w_obs,
                average_risk_score=step_grid["average_score"],
                counts_by_category=step_grid["counts"],
                grid_geojson=step_grid["geojson"],
                data_status="Observed Thermal + Weather" if not is_fc else "Open-Meteo Meteorological Forecast Grid"
            )
        )

    return ForecastTimelineResponse(
        region_id=region.id,
        region_name=region.name,
        generated_at=datetime.utcnow().isoformat() + "Z",
        steps=timeline_steps,
        notes="Forecast risk layers are projected from Open-Meteo numerical weather forecasts. Active hotspots are not projected forward."
    )


@router.get("/analytics", response_model=AnalyticsResponse, tags=["Analytics & Insights"])
async def get_analytics(
    region_id: Optional[str] = Query(None),
    time_window_days: int = Query(7, ge=3, le=30),
    force_demo: bool = Query(False)
):
    """
    Retrieve comprehensive analytics, multi-day weather/hotspot trends,
    and strictly data-grounded insights.
    """
    region = data_pipeline.get_region(region_id) if region_id else data_pipeline.regions[0]
    data = await data_pipeline.get_region_data(region_id=region.id, force_demo=force_demo)
    
    # Run fast grid summary
    grid_res = grid_generator.generate_risk_grid(
        bbox=region.bbox,
        weather=data["weather"],
        hotspots=data["hotspots"],
        step_deg=0.04
    )

    return analytics_engine.generate_analytics(
        region=region,
        weather=data["weather"],
        hotspots=data["hotspots"],
        risk_summary=grid_res,
        time_window_days=time_window_days
    )


@router.get("/data/status", response_model=SystemStatusResponse, tags=["System Telemetry"])
async def get_system_status(region_id: Optional[str] = Query(None)):
    """Inspect data source statuses, freshness, attribution, and latency."""
    return await data_pipeline.get_system_status(region_id)


@router.get("/ml/evaluation", tags=["Machine Learning"])
async def get_ml_evaluation():
    """Return Scikit-Learn baseline classifier evaluation metrics and feature importances."""
    if not ml_classifier.is_trained:
        ml_classifier.train_baseline_ml()
    return ml_classifier.evaluation_metrics


@router.get("/export/csv", tags=["Export"])
async def export_hotspots_csv(region_id: Optional[str] = Query(None)):
    """Download observed and filtered hotspots as CSV file."""
    region = data_pipeline.get_region(region_id) if region_id else data_pipeline.regions[0]
    hotspots = await firms_service.get_hotspots(bbox=region.bbox, region_id=region.id)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "latitude", "longitude", "brightness_k", "scan", "track",
        "acq_date", "acq_time", "satellite", "instrument", "confidence",
        "confidence_score", "frp_mw", "is_synthetic", "source", "timestamp"
    ])

    for h in hotspots:
        writer.writerow([
            h.id, h.latitude, h.longitude, h.brightness, h.scan, h.track,
            h.acq_date, h.acq_time, h.satellite, h.instrument, h.confidence,
            h.confidence_score, h.frp, h.is_synthetic, h.source, h.timestamp
        ])

    output.seek(0)
    filename = f"firesight_hotspots_{region.id if region else 'all'}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.csv"
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/geojson", tags=["Export"])
async def export_risk_geojson(region_id: Optional[str] = Query(None)):
    """Download calculated risk map polygons as GeoJSON."""
    region = data_pipeline.get_region(region_id) if region_id else data_pipeline.regions[0]
    data = await data_pipeline.get_region_data(region_id=region.id)
    grid_res = grid_generator.generate_risk_grid(
        bbox=region.bbox,
        weather=data["weather"],
        hotspots=data["hotspots"],
        step_deg=0.03
    )

    content = json.dumps(grid_res["geojson"], indent=2)
    filename = f"firesight_risk_{region.id}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.geojson"

    return Response(
        content=content,
        media_type="application/geo+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/simulation-json", tags=["Export"])
async def export_simulation_json(
    ignition_lat: float = Query(...),
    ignition_lon: float = Query(...),
    duration_hours: int = Query(6, ge=1, le=12),
    wind_speed_kmh: float = Query(20.0),
    wind_direction_deg: float = Query(45.0)
):
    """Download simulation run parameters and step perimeters as JSON."""
    req = SimulationRequest(
        ignition_lat=ignition_lat,
        ignition_lon=ignition_lon,
        duration_hours=duration_hours,
        wind_speed_kmh=wind_speed_kmh,
        wind_direction_deg=wind_direction_deg
    )
    sim_res = fire_simulator.run_simulation(req)
    content = json.dumps(sim_res.dict(), indent=2)
    filename = f"firesight_simulation_{sim_res.simulation_id}.json"

    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
