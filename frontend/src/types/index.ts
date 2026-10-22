export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  min_lat: number;
  min_lon: number;
  max_lat: number;
  max_lon: number;
}

export interface StudyRegion {
  id: string;
  name: string;
  state: string;
  country: string;
  description: string;
  center: Coordinates;
  bbox: BoundingBox;
  forest_type: string;
  area_sqkm: number;
  is_demo: boolean;
}

export interface HotspotRecord {
  id: string;
  latitude: number;
  longitude: number;
  brightness?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  instrument: string;
  confidence: 'low' | 'nominal' | 'high' | string;
  confidence_score: number;
  frp?: number;
  daynight: string;
  is_synthetic: boolean;
  source: string;
  timestamp: string;
}

export interface WeatherObservation {
  temperature_c: number;
  relative_humidity_pct: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_mm: number;
  cloud_cover_pct?: number;
  timestamp: string;
  is_forecast: boolean;
  is_synthetic: boolean;
  source: string;
  spatial_method: string;
}

export interface RiskFactorBreakdown {
  thermal_proximity_pct: number;
  relative_humidity_pct: number;
  temperature_pct: number;
  wind_speed_pct: number;
  precipitation_pct: number;
  vegetation_fuel_pct: number;
}

export interface TopRiskCell {
  cell_id: string;
  latitude: number;
  longitude: number;
  score: number;
  category: 'Low' | 'Medium' | 'High';
  nearest_hotspot_km?: number;
  dominant_factor: string;
}

export interface RiskAnalysisResponse {
  region_id: string;
  region_name: string;
  timestamp: string;
  bbox: BoundingBox;
  total_cells: number;
  counts_by_category: {
    Low: number;
    Medium: number;
    High: number;
  };
  percentages_by_category: {
    Low: number;
    Medium: number;
    High: number;
  };
  average_score: number;
  weather_summary: WeatherObservation;
  hotspots_detected: number;
  grid_geojson: any;
  highest_risk_cells: TopRiskCell[];
  data_sources: string[];
  method_version: string;
  is_synthetic: boolean;
  disclaimer: string;
}

export interface SimulationStep {
  elapsed_minutes: number;
  elapsed_hours: number;
  cumulative_cells_burned: number;
  burned_area_sqkm: number;
  perimeter_km: number;
  geojson: any;
}

export interface SimulationResponse {
  simulation_id: string;
  ignition_point: Coordinates;
  duration_hours: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  total_burned_area_sqkm: number;
  total_cells_burned: number;
  estimated_perimeter_km: number;
  steps: SimulationStep[];
  model_assumptions: Record<string, any>;
  disclaimer: string;
}

export interface TimelineStep {
  step_id: string;
  label: string;
  timestamp: string;
  is_forecast: boolean;
  weather: WeatherObservation;
  average_risk_score: number;
  counts_by_category: {
    Low: number;
    Medium: number;
    High: number;
  };
  grid_geojson: any;
  data_status: string;
}

export interface ForecastTimelineResponse {
  region_id: string;
  region_name: string;
  generated_at: string;
  steps: TimelineStep[];
  notes: string;
}

export interface AnalyticsInsight {
  type: 'trend' | 'risk_concentration' | 'correlation' | 'weather_impact';
  title: string;
  description: string;
  grounded_evidence: string;
}

export interface AnalyticsResponse {
  region_id: string;
  region_name: string;
  time_window_days: number;
  hotspot_trends: Array<{
    date: string;
    count: number;
    high_confidence: number;
    nominal_confidence: number;
  }>;
  weather_trends: Array<{
    date: string;
    temperature_c: number;
    relative_humidity_pct: number;
    wind_speed_kmh: number;
    precipitation_mm: number;
  }>;
  risk_distribution_history: Array<{
    date: string;
    low: number;
    medium: number;
    high: number;
  }>;
  insights: AnalyticsInsight[];
  total_hotspots_detected: number;
  highest_recorded_risk: number;
}

export interface DataSourceStatus {
  service_name: string;
  status: 'connected' | 'demo_mode' | 'rate_limited' | 'error';
  is_live: boolean;
  last_updated: string;
  latency_ms?: number;
  attribution: string;
  notes: string;
}

export interface SystemStatusResponse {
  app_name: string;
  team_name: string;
  timestamp: string;
  data_sources: DataSourceStatus[];
  active_region: StudyRegion;
  all_regions: StudyRegion[];
  operational_mode: string;
}
