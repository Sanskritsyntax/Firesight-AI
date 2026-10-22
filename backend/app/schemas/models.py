"""Pydantic schemas and data validation models for FireSight AI."""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class Coordinates(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")


class BoundingBox(BaseModel):
    min_lat: float = Field(..., ge=-90.0, le=90.0)
    min_lon: float = Field(..., ge=-180.0, le=180.0)
    max_lat: float = Field(..., ge=-90.0, le=90.0)
    max_lon: float = Field(..., ge=-180.0, le=180.0)


class StudyRegion(BaseModel):
    id: str
    name: str
    state: str
    country: str = "India"
    description: str
    center: Coordinates
    bbox: BoundingBox
    forest_type: str
    area_sqkm: float
    is_demo: bool = True


class HotspotRecord(BaseModel):
    id: str
    latitude: float
    longitude: float
    brightness: Optional[float] = None
    scan: Optional[float] = None
    track: Optional[float] = None
    acq_date: str
    acq_time: str
    satellite: str = "VIIRS-SNPP"
    instrument: str = "VIIRS"
    confidence: str = "nominal"  # low, nominal, high, or percentage
    confidence_score: float = 0.75  # 0.0 - 1.0
    frp: Optional[float] = None  # Fire Radiative Power (MW)
    daynight: str = "D"
    is_synthetic: bool = False
    source: str = "NASA FIRMS (VIIRS)"
    timestamp: str


class WeatherObservation(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    wind_speed_kmh: float
    wind_direction_deg: float
    precipitation_mm: float
    cloud_cover_pct: Optional[float] = 0.0
    timestamp: str
    is_forecast: bool = False
    is_synthetic: bool = False
    source: str = "Open-Meteo"
    spatial_method: str = "Centroid / Area-Weighted Regional Point"


class RiskFactorBreakdown(BaseModel):
    thermal_proximity_pct: float
    relative_humidity_pct: float
    temperature_pct: float
    wind_speed_pct: float
    precipitation_pct: float
    vegetation_fuel_pct: float


class RiskGridCell(BaseModel):
    cell_id: str
    latitude: float
    longitude: float
    bounds: List[List[float]]  # [[min_lat, min_lon], [max_lat, max_lon]]
    score: float = Field(..., ge=0.0, le=1.0)
    category: str  # "Low", "Medium", "High"
    factor_breakdown: RiskFactorBreakdown
    nearest_hotspot_dist_km: Optional[float] = None
    vegetation_ndvi: Optional[float] = None


class RiskAnalysisRequest(BaseModel):
    region_id: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    step_deg: Optional[float] = 0.03
    force_demo: Optional[bool] = False
    use_ml_model: Optional[bool] = False


class RiskAnalysisResponse(BaseModel):
    region_id: str
    region_name: str
    timestamp: str
    bbox: BoundingBox
    total_cells: int
    counts_by_category: Dict[str, int]
    percentages_by_category: Dict[str, float]
    average_score: float
    weather_summary: WeatherObservation
    hotspots_detected: int
    grid_geojson: Dict[str, Any]
    highest_risk_cells: List[Dict[str, Any]]
    data_sources: List[str]
    method_version: str = "FireSight Baseline v1.2 (Multi-Criteria Weighted)"
    is_synthetic: bool = False
    disclaimer: str = (
        "FireSight AI provides indicative risk estimates and illustrative simulations for situational awareness. "
        "It is not a validated fire forecast, a confirmed fire-detection service, or a replacement for emergency authorities. "
        "Always follow official alerts and instructions."
    )


class SimulationRequest(BaseModel):
    ignition_lat: float
    ignition_lon: float
    duration_hours: int = Field(6, ge=1, le=12)
    wind_speed_kmh: float = Field(20.0, ge=0.0, le=120.0)
    wind_direction_deg: float = Field(45.0, ge=0.0, le=360.0)  # Direction wind is coming FROM or blowing towards
    spread_rate_multiplier: float = Field(1.0, ge=0.2, le=3.0)
    fuel_density: float = Field(0.7, ge=0.1, le=1.0)
    region_id: Optional[str] = None


class SimulationStep(BaseModel):
    elapsed_minutes: int
    elapsed_hours: float
    cumulative_cells_burned: int
    burned_area_sqkm: float
    perimeter_km: float
    geojson: Dict[str, Any]


class SimulationResponse(BaseModel):
    simulation_id: str
    ignition_point: Coordinates
    duration_hours: int
    wind_speed_kmh: float
    wind_direction_deg: float
    total_burned_area_sqkm: float
    total_cells_burned: int
    estimated_perimeter_km: float
    steps: List[SimulationStep]
    model_assumptions: Dict[str, Any]
    disclaimer: str = (
        "Illustrative fire-spread simulation — not a validated operational forecast. "
        "Cellular Huygens elliptical propagation based on simplified wind vector and fuel load assumptions."
    )


class TimelineStep(BaseModel):
    step_id: str  # "now", "plus_6h", "plus_12h", "plus_24h"
    label: str    # "Now (T+0)", "+6 Hours", "+12 Hours", "+24 Hours"
    timestamp: str
    is_forecast: bool
    weather: WeatherObservation
    average_risk_score: float
    counts_by_category: Dict[str, int]
    grid_geojson: Dict[str, Any]
    data_status: str


class ForecastTimelineResponse(BaseModel):
    region_id: str
    region_name: str
    generated_at: str
    steps: List[TimelineStep]
    notes: str


class AnalyticsInsight(BaseModel):
    type: str  # "trend", "risk_concentration", "correlation", "weather_impact"
    title: str
    description: str
    grounded_evidence: str


class AnalyticsResponse(BaseModel):
    region_id: str
    region_name: str
    time_window_days: int
    hotspot_trends: List[Dict[str, Any]]
    weather_trends: List[Dict[str, Any]]
    risk_distribution_history: List[Dict[str, Any]]
    insights: List[AnalyticsInsight]
    total_hotspots_detected: int
    highest_recorded_risk: float


class DataSourceStatus(BaseModel):
    service_name: str
    status: str  # "connected", "demo_mode", "rate_limited", "error"
    is_live: bool
    last_updated: str
    latency_ms: Optional[float] = None
    attribution: str
    notes: str


class SystemStatusResponse(BaseModel):
    app_name: str
    team_name: str
    timestamp: str
    data_sources: List[DataSourceStatus]
    active_region: StudyRegion
    all_regions: List[StudyRegion]
    operational_mode: str
