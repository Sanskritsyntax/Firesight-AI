import {
  StudyRegion, HotspotRecord, WeatherObservation,
  RiskAnalysisResponse, SimulationResponse, ForecastTimelineResponse,
  AnalyticsResponse, SystemStatusResponse
} from '../types';

const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchRegions(): Promise<StudyRegion[]> {
  const res = await fetch(`${API_BASE}/regions`);
  if (!res.ok) throw new Error(`Failed to load regions: ${res.statusText}`);
  return res.json();
}

export async function fetchHotspots(
  regionId?: string,
  forceDemo: boolean = false
): Promise<HotspotRecord[]> {
  const params = new URLSearchParams();
  if (regionId) params.append('region_id', regionId);
  if (forceDemo) params.append('force_demo', 'true');

  const res = await fetch(`${API_BASE}/hotspots?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load hotspots: ${res.statusText}`);
  return res.json();
}

export async function fetchWeather(
  regionId?: string,
  lat?: number,
  lon?: number,
  forceDemo: boolean = false
): Promise<WeatherObservation> {
  const params = new URLSearchParams();
  if (regionId) params.append('region_id', regionId);
  if (lat !== undefined) params.append('lat', lat.toString());
  if (lon !== undefined) params.append('lon', lon.toString());
  if (forceDemo) params.append('force_demo', 'true');

  const res = await fetch(`${API_BASE}/weather?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load weather: ${res.statusText}`);
  return res.json();
}

export async function analyzeRisk(payload: {
  region_id?: string;
  step_deg?: number;
  force_demo?: boolean;
}): Promise<RiskAnalysisResponse> {
  const res = await fetch(`${API_BASE}/risk/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Risk analysis calculation failed: ${res.statusText}`);
  return res.json();
}

export async function runSimulation(payload: {
  ignition_lat: number;
  ignition_lon: number;
  duration_hours: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  spread_rate_multiplier?: number;
  fuel_density?: number;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulation/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Simulation failed: ${res.statusText}`);
  return res.json();
}

export async function fetchForecastTimeline(
  regionId?: string,
  forceDemo: boolean = false
): Promise<ForecastTimelineResponse> {
  const params = new URLSearchParams();
  if (regionId) params.append('region_id', regionId);
  if (forceDemo) params.append('force_demo', 'true');

  const res = await fetch(`${API_BASE}/forecast/timeline?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load forecast timeline: ${res.statusText}`);
  return res.json();
}

export async function fetchAnalytics(
  regionId?: string,
  days: number = 7,
  forceDemo: boolean = false
): Promise<AnalyticsResponse> {
  const params = new URLSearchParams();
  if (regionId) params.append('region_id', regionId);
  params.append('time_window_days', days.toString());
  if (forceDemo) params.append('force_demo', 'true');

  const res = await fetch(`${API_BASE}/analytics?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load analytics: ${res.statusText}`);
  return res.json();
}

export async function fetchSystemStatus(regionId?: string): Promise<SystemStatusResponse> {
  const params = new URLSearchParams();
  if (regionId) params.append('region_id', regionId);

  const res = await fetch(`${API_BASE}/data/status?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to load system status: ${res.statusText}`);
  return res.json();
}

export async function fetchMlEvaluation(): Promise<any> {
  const res = await fetch(`${API_BASE}/ml/evaluation`);
  if (!res.ok) throw new Error(`Failed to load ML evaluation: ${res.statusText}`);
  return res.json();
}

export function getHotspotsExportUrl(regionId?: string): string {
  return `${API_BASE}/export/csv?${regionId ? `region_id=${regionId}` : ''}`;
}

export function getRiskGeoJsonExportUrl(regionId?: string): string {
  return `${API_BASE}/export/geojson?${regionId ? `region_id=${regionId}` : ''}`;
}
