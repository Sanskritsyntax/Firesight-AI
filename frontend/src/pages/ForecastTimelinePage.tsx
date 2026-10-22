import React, { useState, useEffect } from 'react';
import { Clock, Thermometer, Droplets, Wind, ShieldAlert, AlertCircle, Info, Calendar } from 'lucide-react';
import { StudyRegion, ForecastTimelineResponse, TimelineStep } from '../types';
import { fetchForecastTimeline } from '../services/api';
import { GisMap } from '../map/GisMap';
import { MapLegend } from '../map/MapLegend';

interface ForecastTimelinePageProps {
  region: StudyRegion;
  isDemoMode: boolean;
}

export const ForecastTimelinePage: React.FC<ForecastTimelinePageProps> = ({
  region,
  isDemoMode,
}) => {
  const [timelineData, setTimelineData] = useState<ForecastTimelineResponse | null>(null);
  const [activeStepId, setActiveStepId] = useState<string>('now');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTimeline() {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const data = await fetchForecastTimeline(region.id, isDemoMode);
        if (isMounted) {
          setTimelineData(data);
          if (data.steps && data.steps.length > 0) {
            setActiveStepId(data.steps[0].step_id);
          }
        }
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load timeline forecast.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadTimeline();
    return () => {
      isMounted = false;
    };
  }, [region.id, isDemoMode]);

  const activeStep: TimelineStep | undefined = timelineData?.steps.find(
    (s) => s.step_id === activeStepId
  );

  return (
    <div className="space-y-4">
      {/* Informative Guidance Banner */}
      <div className="glass-panel p-3.5 rounded-xl border border-charcoal-700/80 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-forest-400 shrink-0 mt-0.5" />
        <div>
          <b className="text-white">24-Hour Forecast Meteorological Timeline:</b> Evaluates evolving wildfire hazard using Open-Meteo numerical weather forecasts. In accordance with operational scientific protocol, current thermal anomalies are not artificially projected into the future; future risk is governed by atmospheric fuel-drying and wind velocity.
        </div>
      </div>

      {/* Discrete Timeline Step Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {timelineData?.steps.map((step) => {
          const isSelected = step.step_id === activeStepId;
          return (
            <button
              key={step.step_id}
              onClick={() => setActiveStepId(step.step_id)}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-forest-950/40 border-forest-500 shadow-lg shadow-forest-950/50'
                  : 'glass-panel border-charcoal-700 hover:border-charcoal-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold ${isSelected ? 'text-forest-300' : 'text-slate-300'}`}>
                  {step.label}
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    step.is_forecast
                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {step.is_forecast ? 'FORECAST' : 'OBSERVED'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono mb-2">
                {step.timestamp.replace('T', ' ').substring(0, 16)}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-charcoal-700/60">
                <span className="text-slate-400 text-[11px]">Avg Risk:</span>
                <span
                  className={`font-mono font-bold ${
                    step.average_risk_score >= 0.7
                      ? 'text-red-400'
                      : step.average_risk_score >= 0.35
                      ? 'text-amber-400'
                      : 'text-forest-400'
                  }`}
                >
                  {step.average_risk_score.toFixed(3)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Details & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map Column (8 cols) */}
        <div className="lg:col-span-8 space-y-3.5">
          <GisMap
            center={[region.center.latitude, region.center.longitude]}
            zoom={10}
            bbox={region.bbox}
            hotspots={activeStep?.is_forecast ? [] : undefined} // Don't show current hotspots in forecast steps!
            riskGeoJson={activeStep?.grid_geojson}
            showHotspots={!activeStep?.is_forecast}
            showRiskZones={true}
            showSimulation={false}
            height="550px"
          />

          <MapLegend />
        </div>

        {/* Right Meteorological Driver Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {activeStep && (
            <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg space-y-4">
              <div className="border-b border-charcoal-700/80 pb-2">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>{activeStep.label} Conditions</span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {activeStep.is_forecast ? 'Forecast Model' : 'Live Telemetry'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Valid At: {activeStep.timestamp}
                </div>
              </div>

              {/* Weather Driver Cards */}
              <div className="space-y-2.5 text-xs">
                <div className="bg-charcoal-900/80 p-2.5 rounded-lg border border-charcoal-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-orange-400" />
                    <span className="text-slate-300">Temperature</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {activeStep.weather.temperature_c}°C
                  </span>
                </div>

                <div className="bg-charcoal-900/80 p-2.5 rounded-lg border border-charcoal-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <span className="text-slate-300">Relative Humidity</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {activeStep.weather.relative_humidity_pct}%
                  </span>
                </div>

                <div className="bg-charcoal-900/80 p-2.5 rounded-lg border border-charcoal-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wind className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300">Wind Velocity</span>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">
                    {activeStep.weather.wind_speed_kmh} km/h ({activeStep.weather.wind_direction_deg}°)
                  </span>
                </div>
              </div>

              {/* Category Breakdown at this hour */}
              <div className="pt-2 border-t border-charcoal-700/60">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Grid Categorization
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-forest-950/40 border border-forest-800/60 p-2 rounded">
                    <span className="text-[10px] text-forest-400 block font-semibold">Low</span>
                    <span className="font-mono font-bold text-slate-200">
                      {activeStep.counts_by_category.Low}
                    </span>
                  </div>
                  <div className="bg-amber-950/40 border border-amber-800/60 p-2 rounded">
                    <span className="text-[10px] text-amber-400 block font-semibold">Medium</span>
                    <span className="font-mono font-bold text-slate-200">
                      {activeStep.counts_by_category.Medium}
                    </span>
                  </div>
                  <div className="bg-red-950/40 border border-red-800/60 p-2 rounded">
                    <span className="text-[10px] text-red-400 block font-semibold">High</span>
                    <span className="font-mono font-bold text-slate-200">
                      {activeStep.counts_by_category.High}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="text-[11px] text-slate-400 bg-charcoal-900/60 p-2.5 rounded border border-charcoal-800">
                <b>Status:</b> {activeStep.data_status}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
