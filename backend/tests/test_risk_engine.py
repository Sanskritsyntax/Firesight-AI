"""Unit tests for Forest Fire Risk Estimation Engine."""

import pytest
import math
from app.risk_engine.baseline_model import baseline_risk_model
from app.schemas.models import HotspotRecord, BoundingBox, WeatherObservation
from app.risk_engine.grid_generator import grid_generator


def test_risk_score_range():
    """Verify risk scores always stay within [0.0, 1.0]."""
    res = baseline_risk_model.calculate_cell_risk(
        cell_lat=21.65,
        cell_lon=86.35,
        hotspots=[],
        temperature_c=35.0,
        relative_humidity_pct=25.0,
        wind_speed_kmh=20.0,
        precipitation_mm=0.0
    )
    score = res["score"]
    assert 0.0 <= score <= 1.0
    assert res["category"] in ["Low", "Medium", "High"]


def test_hotspot_proximity_increases_risk():
    """Verify that proximity to a thermal anomaly significantly elevates risk."""
    hotspots = [
        HotspotRecord(
            id="test-1",
            latitude=21.65,
            longitude=86.35,
            brightness=340.0,
            acq_date="2026-10-21",
            acq_time="08:00",
            confidence="high",
            confidence_score=0.9,
            is_synthetic=True,
            timestamp="2026-10-21T08:00:00Z"
        )
    ]
    # At hotspot location (0 km)
    risk_at_hotspot = baseline_risk_model.calculate_cell_risk(
        cell_lat=21.65,
        cell_lon=86.35,
        hotspots=hotspots,
        temperature_c=28.0,
        relative_humidity_pct=45.0,
        wind_speed_kmh=15.0,
        precipitation_mm=0.0
    )

    # Far away (50 km away)
    risk_far = baseline_risk_model.calculate_cell_risk(
        cell_lat=22.10,
        cell_lon=86.35,
        hotspots=hotspots,
        temperature_c=28.0,
        relative_humidity_pct=45.0,
        wind_speed_kmh=15.0,
        precipitation_mm=0.0
    )

    assert risk_at_hotspot["score"] > risk_far["score"]
    assert risk_at_hotspot["nearest_hotspot_dist_km"] < 1.0
    assert risk_far["nearest_hotspot_dist_km"] > 40.0


def test_missing_weather_inputs_handled():
    """Verify that missing weather inputs do not crash and are dynamically re-weighted."""
    res = baseline_risk_model.calculate_cell_risk(
        cell_lat=21.65,
        cell_lon=86.35,
        hotspots=[],
        temperature_c=None,
        relative_humidity_pct=None,
        wind_speed_kmh=18.0,
        precipitation_mm=None
    )
    assert res["score"] is not None
    assert 0.0 <= res["score"] <= 1.0
    # Breakdown percentages should still sum to approximately 100%
    b = res["factor_breakdown"]
    total_pct = (
        b.thermal_proximity_pct + b.relative_humidity_pct +
        b.temperature_pct + b.wind_speed_pct +
        b.precipitation_pct + b.vegetation_fuel_pct
    )
    assert 95.0 <= total_pct <= 105.0


def test_grid_generator_geojson():
    """Verify GeoJSON polygon generation and category counts."""
    bbox = BoundingBox(min_lat=21.4, min_lon=86.1, max_lat=21.6, max_lon=86.3)
    weather = WeatherObservation(
        temperature_c=32.0,
        relative_humidity_pct=30.0,
        wind_speed_kmh=20.0,
        wind_direction_deg=45.0,
        precipitation_mm=0.0,
        timestamp="2026-10-21T12:00:00Z"
    )
    grid = grid_generator.generate_risk_grid(
        bbox=bbox,
        weather=weather,
        hotspots=[],
        step_deg=0.05
    )
    assert grid["total_cells"] > 0
    assert grid["geojson"]["type"] == "FeatureCollection"
    assert len(grid["geojson"]["features"]) == grid["total_cells"]
    # Verify polygon coordinates
    feat = grid["geojson"]["features"][0]
    assert feat["geometry"]["type"] == "Polygon"
    assert len(feat["geometry"]["coordinates"][0]) == 5
