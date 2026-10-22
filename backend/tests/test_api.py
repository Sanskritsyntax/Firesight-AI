"""Unit and integration tests for FastAPI backend endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns operational status and team metadata."""
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["team"] == "The ByteForce"
    assert "PS 11" in data["spaceathon_problem"]


def test_frontend_spa_serving():
    """Verify root / serves the frontend application."""
    res = client.get("/")
    assert res.status_code == 200
    # Should either return HTML (if dist exists) or json root
    if "text/html" in res.headers.get("content-type", ""):
        assert "<html" in res.text.lower() or "<!doctype html>" in res.text.lower()
    else:
        assert res.json()["status"] == "operational"



def test_regions_endpoint():
    """Verify regions endpoint returns list of demonstration regions in India."""
    res = client.get("/api/regions")
    assert res.status_code == 200
    regions = res.json()
    assert len(regions) >= 4
    ids = [r["id"] for r in regions]
    assert "similipal_odisha" in ids
    assert "bandipur_karnataka" in ids


def test_hotspots_endpoint_demo():
    """Verify hotspot observations endpoint handles demo mode gracefully."""
    res = client.get("/api/hotspots?region_id=similipal_odisha&force_demo=true")
    assert res.status_code == 200
    hotspots = res.json()
    assert isinstance(hotspots, list)
    assert len(hotspots) > 0
    assert hotspots[0]["is_synthetic"] is True
    assert "latitude" in hotspots[0]
    assert "longitude" in hotspots[0]


def test_weather_endpoint():
    """Verify weather endpoint returns valid meteorological parameters."""
    res = client.get("/api/weather?region_id=similipal_odisha&force_demo=true")
    assert res.status_code == 200
    data = res.json()
    assert "temperature_c" in data
    assert "relative_humidity_pct" in data
    assert "wind_speed_kmh" in data


def test_risk_analysis_endpoint():
    """Verify POST /api/risk/analyze computes grid and returns GeoJSON."""
    payload = {
        "region_id": "similipal_odisha",
        "step_deg": 0.05,
        "force_demo": True
    }
    res = client.post("/api/risk/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_cells"] > 0
    assert "grid_geojson" in data
    assert data["grid_geojson"]["type"] == "FeatureCollection"
    assert "Low" in data["counts_by_category"]
    assert "disclaimer" in data


def test_simulation_endpoint():
    """Verify POST /api/simulation/run executes 6-hour spread."""
    payload = {
        "ignition_lat": 21.65,
        "ignition_lon": 86.35,
        "duration_hours": 6,
        "wind_speed_kmh": 22.0,
        "wind_direction_deg": 50.0
    }
    res = client.post("/api/simulation/run", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_burned_area_sqkm"] > 0
    assert len(data["steps"]) == 6
    assert "disclaimer" in data


def test_forecast_timeline_endpoint():
    """Verify GET /api/forecast/timeline returns 4 discrete time steps."""
    res = client.get("/api/forecast/timeline?region_id=similipal_odisha&force_demo=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data["steps"]) == 4
    step_ids = [s["step_id"] for s in data["steps"]]
    assert step_ids == ["now", "plus_6h", "plus_12h", "plus_24h"]


def test_analytics_endpoint():
    """Verify GET /api/analytics returns trends and data-grounded insights."""
    res = client.get("/api/analytics?region_id=similipal_odisha&force_demo=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data["insights"]) >= 2
    assert len(data["weather_trends"]) >= 5


def test_export_csv_endpoint():
    """Verify CSV export returns valid CSV content type."""
    res = client.get("/api/export/csv?region_id=similipal_odisha")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "latitude" in res.text
