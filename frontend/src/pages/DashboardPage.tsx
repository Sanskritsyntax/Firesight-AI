import React from 'react';
import {
  Flame, ShieldAlert, Thermometer, Droplets, Wind, CloudRain,
  Clock, MapPin, ArrowUpRight, Crosshair
} from 'lucide-react';
import { StudyRegion, RiskAnalysisResponse, HotspotRecord, WeatherObservation } from '../types';
import { StatCard } from '../components/StatCard';
import { GisMap } from '../map/GisMap';
import { MapLegend } from '../map/MapLegend';
import { RiskDistributionChart } from '../charts/RiskDistributionChart';

interface DashboardPageProps {
  region: StudyRegion;
  riskData: RiskAnalysisResponse | null;
  weather: WeatherObservation | null;
  hotspots: HotspotRecord[];
  isLoading: boolean;
  onIgnitionSelect: (coords: [number, number]) => void;
  onSelectHotspot: (hotspot: HotspotRecord) => void;
  onNavigateToSimulation: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  region,
  riskData,
  weather,
  hotspots,
  isLoading,
  onIgnitionSelect,
  onSelectHotspot,
  onNavigateToSimulation,
}) => {
  const [showHotspots, setShowHotspots] = React.useState(true);
  const [showRiskZones, setShowRiskZones] = React.useState(true);

  const highRiskCount = riskData?.counts_by_category?.High || 0;
  const medRiskCount = riskData?.counts_by_category?.Medium || 0;
  const lowRiskCount = riskData?.counts_by_category?.Low || 0;

  return (
    <div className="space-y-5">
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Active Hotspots"
          value={hotspots.length}
          subValue="thermal pixels"
          icon={Flame}
          badge={hotspots.length > 0 ? `${hotspots.length} VIIRS Anomalies` : '0 Active'}
          badgeColor={hotspots.length > 0 ? 'red' : 'forest'}
          statusBorder={hotspots.length > 0 ? 'red' : 'forest'}
        />

        <StatCard
          title="High Risk Zones"
          value={highRiskCount}
          subValue={`of ${riskData?.total_cells || 0} cells`}
          icon={ShieldAlert}
          badge={`${riskData?.percentages_by_category?.High || 0}% Area`}
          badgeColor="red"
          statusBorder={highRiskCount > 5 ? 'red' : 'amber'}
        />

        <StatCard
          title="Temperature"
          value={weather ? `${weather.temperature_c}°C` : '--'}
          subValue="ambient"
          icon={Thermometer}
          badge={weather?.temperature_c && weather.temperature_c > 35 ? 'Severe Heat' : 'Moderate'}
          badgeColor={weather?.temperature_c && weather.temperature_c > 35 ? 'amber' : 'gray'}
        />

        <StatCard
          title="Relative Humidity"
          value={weather ? `${weather.relative_humidity_pct}%` : '--'}
          subValue="atmospheric"
          icon={Droplets}
          badge={weather?.relative_humidity_pct && weather.relative_humidity_pct < 30 ? 'Dry Fuel Danger' : 'Normal'}
          badgeColor={weather?.relative_humidity_pct && weather.relative_humidity_pct < 30 ? 'red' : 'blue'}
        />

        <StatCard
          title="Wind Velocity"
          value={weather ? `${weather.wind_speed_kmh}` : '--'}
          subValue="km/h"
          icon={Wind}
          badge={weather ? `${weather.wind_direction_deg}° Heading` : '--'}
          badgeColor="gray"
        />

        <StatCard
          title="Precipitation"
          value={weather ? `${weather.precipitation_mm}` : '0'}
          subValue="mm recent"
          icon={CloudRain}
          badge={weather && weather.precipitation_mm > 0 ? 'Fuel Dampened' : 'No Recent Rain'}
          badgeColor={weather && weather.precipitation_mm > 0 ? 'forest' : 'amber'}
        />
      </div>

      {/* Main Grid: GIS Map (Left 8 cols) + Risk Intelligence Panel (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Column */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Map Layer Controls Bar */}
          <div className="glass-panel px-4 py-2.5 rounded-xl border border-charcoal-700/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <MapPin className="w-4 h-4 text-forest-400" />
              <span className="font-semibold text-white">{region.name}</span>
              <span className="text-slate-400 text-[11px] font-mono">
                ({region.bbox.min_lat.toFixed(2)}N, {region.bbox.min_lon.toFixed(2)}E to {region.bbox.max_lat.toFixed(2)}N, {region.bbox.max_lon.toFixed(2)}E)
              </span>
            </div>

            <div className="flex items-center space-x-3 text-slate-300">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRiskZones}
                  onChange={(e) => setShowRiskZones(e.target.checked)}
                  className="rounded bg-charcoal-800 border-charcoal-600 text-forest-500 focus:ring-0 cursor-pointer"
                />
                <span>Risk Grid</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={(e) => setShowHotspots(e.target.checked)}
                  className="rounded bg-charcoal-800 border-charcoal-600 text-orange-500 focus:ring-0 cursor-pointer"
                />
                <span>Thermal Hotspots</span>
              </label>
            </div>
          </div>

          {/* Interactive Leaflet Map */}
          <GisMap
            center={[region.center.latitude, region.center.longitude]}
            zoom={10}
            bbox={region.bbox}
            hotspots={hotspots}
            riskGeoJson={riskData?.grid_geojson}
            showHotspots={showHotspots}
            showRiskZones={showRiskZones}
            onMapClick={(coords) => onIgnitionSelect(coords)}
            onSelectHotspot={onSelectHotspot}
            height="580px"
          />

          {/* Legend */}
          <MapLegend />
        </div>

        {/* Right Intelligence Column */}
        <div className="lg:col-span-4 space-y-4">
          {/* Risk Distribution Chart */}
          <RiskDistributionChart
            counts={{ Low: lowRiskCount, Medium: medRiskCount, High: highRiskCount }}
            percentages={
              riskData?.percentages_by_category || { Low: 0, Medium: 0, High: 0 }
            }
            totalCells={riskData?.total_cells || 0}
          />

          {/* Top High-Risk Cells Card */}
          <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Priority Critical Sectors
              </h3>
              <span className="text-[10px] text-red-400 font-mono font-semibold">
                Highest Fire Potential
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {riskData?.highest_risk_cells && riskData.highest_risk_cells.length > 0 ? (
                riskData.highest_risk_cells.slice(0, 6).map((cell) => (
                  <div
                    key={cell.cell_id}
                    className="p-2.5 rounded-lg bg-charcoal-900/80 border border-charcoal-800 hover:border-charcoal-600 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-200">{cell.cell_id}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            cell.category === 'High'
                              ? 'bg-red-950/80 text-red-300 border border-red-800'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {cell.score.toFixed(3)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {cell.latitude.toFixed(3)}°N, {cell.longitude.toFixed(3)}°E
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Primary Driver: <b className="text-slate-300 capitalize">{cell.dominant_factor}</b>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onIgnitionSelect([cell.latitude, cell.longitude]);
                        onNavigateToSimulation();
                      }}
                      className="p-1.5 rounded-md bg-charcoal-800 hover:bg-forest-600/30 text-slate-300 hover:text-forest-300 border border-charcoal-700 transition-colors flex items-center space-x-1 text-[11px]"
                      title="Set as ignition point and run simulation"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-forest-400" />
                      <span className="hidden sm:inline">Simulate</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Calculating risk features...
                </div>
              )}
            </div>
          </div>

          {/* Data Freshness & Methodology Footer Card */}
          <div className="glass-panel p-3.5 rounded-xl border border-charcoal-700/80 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">Engine Version:</span>
              <span className="font-mono text-forest-400">Baseline Multi-Criteria v1.2</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">Weather Source:</span>
              <span className="font-mono text-slate-300">{weather?.source || 'Open-Meteo'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">FIRMS Ingestion:</span>
              <span className="font-mono text-slate-300">{hotspots.length > 0 ? hotspots[0].source : 'NASA VIIRS'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">ISRO VEDAS Biome:</span>
              <span className="font-mono text-slate-300">{region.forest_type}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
