import React from 'react';
import { StudyRegion, RiskAnalysisResponse, SimulationResponse, HotspotRecord, WeatherObservation } from '../types';

interface PrintReportProps {
  region: StudyRegion | null;
  riskData: RiskAnalysisResponse | null;
  weather: WeatherObservation | null;
  hotspots: HotspotRecord[];
  simulationData: SimulationResponse | null;
}

export const PrintReport: React.FC<PrintReportProps> = ({
  region,
  riskData,
  weather,
  hotspots,
  simulationData,
}) => {
  const now = new Date().toUTCString();

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            FireSight AI | Operational Forest Fire Intelligence Report
          </h1>
          <div className="text-sm text-gray-600 mt-1">
            ORBITRON Spaceathon • Problem Statement PS 11 • Team: The ByteForce
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Report Generated: <b>{now}</b></div>
          <div>Target Region: <b>{region?.name || 'National Reserve'}</b></div>
          <div>Classification: <b>Official / Situational Awareness</b></div>
        </div>
      </div>

      {/* Safety Advisory Banner */}
      <div className="bg-amber-50 border border-amber-300 p-3 rounded mb-6 text-xs text-amber-900">
        <b>OPERATIONAL DISCLAIMER:</b> FireSight AI provides indicative risk estimates and illustrative simulations for situational awareness. It is not a validated fire forecast, a confirmed fire-detection service, or a replacement for emergency authorities. Always follow official alerts and instructions.
      </div>

      {/* Grid: Study Region & Weather */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-300 p-4 rounded">
          <h2 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
            Study Region Profile
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="text-gray-600 py-1">Reserve Name:</td><td className="font-semibold">{region?.name}</td></tr>
              <tr><td className="text-gray-600 py-1">State / Country:</td><td className="font-semibold">{region?.state}, {region?.country}</td></tr>
              <tr><td className="text-gray-600 py-1">Forest Biome:</td><td className="font-semibold">{region?.forest_type}</td></tr>
              <tr><td className="text-gray-600 py-1">Center Coordinates:</td><td className="font-semibold font-mono">{region?.center.latitude}°N, {region?.center.longitude}°E</td></tr>
              <tr><td className="text-gray-600 py-1">Surface Area:</td><td className="font-semibold">{region?.area_sqkm} km²</td></tr>
            </tbody>
          </table>
        </div>

        <div className="border border-gray-300 p-4 rounded">
          <h2 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
            Meteorological Telemetry (Open-Meteo)
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="text-gray-600 py-1">Ambient Temperature:</td><td className="font-semibold">{weather?.temperature_c}°C</td></tr>
              <tr><td className="text-gray-600 py-1">Relative Humidity:</td><td className="font-semibold">{weather?.relative_humidity_pct}%</td></tr>
              <tr><td className="text-gray-600 py-1">Wind Speed & Vector:</td><td className="font-semibold">{weather?.wind_speed_kmh} km/h (Heading {weather?.wind_direction_deg}°)</td></tr>
              <tr><td className="text-gray-600 py-1">Recent Precipitation:</td><td className="font-semibold">{weather?.precipitation_mm} mm</td></tr>
              <tr><td className="text-gray-600 py-1">Weather Source:</td><td className="font-semibold">{weather?.source}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Distribution Table */}
      {riskData && (
        <div className="border border-gray-300 p-4 rounded mb-6">
          <h2 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
            Calculated Risk Distribution (Multi-Criteria Weighted Engine v1.2)
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center my-3">
            <div className="bg-emerald-50 border border-emerald-300 p-2 rounded">
              <div className="text-xs text-emerald-800 font-bold">Low Risk (&lt;0.35)</div>
              <div className="text-lg font-bold text-emerald-900">{riskData.counts_by_category.Low} cells ({riskData.percentages_by_category.Low}%)</div>
            </div>
            <div className="bg-amber-50 border border-amber-300 p-2 rounded">
              <div className="text-xs text-amber-800 font-bold">Medium Risk (0.35–0.70)</div>
              <div className="text-lg font-bold text-amber-900">{riskData.counts_by_category.Medium} cells ({riskData.percentages_by_category.Medium}%)</div>
            </div>
            <div className="bg-red-50 border border-red-300 p-2 rounded">
              <div className="text-xs text-red-800 font-bold">High Risk (&ge;0.70)</div>
              <div className="text-lg font-bold text-red-900">{riskData.counts_by_category.High} cells ({riskData.percentages_by_category.High}%)</div>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Average Regional Risk Score: <b>{riskData.average_score}</b> | Total Assessed Grid Cells: <b>{riskData.total_cells}</b>
          </div>
        </div>
      )}

      {/* Hotspots Summary */}
      <div className="border border-gray-300 p-4 rounded mb-6">
        <h2 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
          Observed Satellite Thermal Anomalies ({hotspots.length} Detected)
        </h2>
        {hotspots.length === 0 ? (
          <p className="text-xs text-gray-500 py-2">No active thermal anomalies detected in the current query window.</p>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b bg-gray-100 text-left">
                <th className="p-1">Hotspot ID</th>
                <th className="p-1">Coordinates</th>
                <th className="p-1">Confidence</th>
                <th className="p-1">Brightness</th>
                <th className="p-1">FRP</th>
                <th className="p-1">Observed Time</th>
                <th className="p-1">Source</th>
              </tr>
            </thead>
            <tbody>
              {hotspots.map((h) => (
                <tr key={h.id} className="border-b">
                  <td className="p-1 font-mono font-semibold">{h.id}</td>
                  <td className="p-1 font-mono">{h.latitude.toFixed(4)}°N, {h.longitude.toFixed(4)}°E</td>
                  <td className="p-1 uppercase font-bold text-amber-700">{h.confidence}</td>
                  <td className="p-1">{h.brightness ? h.brightness + ' K' : 'N/A'}</td>
                  <td className="p-1">{h.frp ? h.frp + ' MW' : 'N/A'}</td>
                  <td className="p-1">{h.acq_date} {h.acq_time}</td>
                  <td className="p-1 text-[10px] text-gray-600">{h.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Spread Simulation Summary if exists */}
      {simulationData && (
        <div className="border border-gray-300 p-4 rounded mb-6">
          <h2 className="font-bold text-sm text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
            Simulated Fire-Spread Scenario ({simulationData.duration_hours}-Hour Run)
          </h2>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="text-gray-600 py-1">Ignition Coordinates:</td><td className="font-semibold font-mono">{simulationData.ignition_point.latitude}°N, {simulationData.ignition_point.longitude}°E</td></tr>
              <tr><td className="text-gray-600 py-1">Total Burned Area:</td><td className="font-semibold">{simulationData.total_burned_area_sqkm} km² ({simulationData.total_cells_burned} cells)</td></tr>
              <tr><td className="text-gray-600 py-1">Perimeter Length:</td><td className="font-semibold">{simulationData.estimated_perimeter_km} km</td></tr>
              <tr><td className="text-gray-600 py-1">Wind Inputs:</td><td className="font-semibold">{simulationData.wind_speed_kmh} km/h at {simulationData.wind_direction_deg}° heading</td></tr>
              <tr><td className="text-gray-600 py-1">Propagation Model:</td><td className="font-semibold">{simulationData.model_assumptions.algorithm}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
        FireSight AI • Developed by The ByteForce for ORBITRON Spaceathon (PS 11) • Grounded in NASA FIRMS, Open-Meteo & ISRO VEDAS methodologies.
      </div>
    </div>
  );
};
