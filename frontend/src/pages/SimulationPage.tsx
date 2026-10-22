import React, { useState, useEffect } from 'react';
import {
  Flame, Play, Pause, RotateCcw, Wind, Compass, AlertTriangle,
  Clock, Shield, Layers, Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { StudyRegion, HotspotRecord, SimulationResponse, WeatherObservation } from '../types';
import { GisMap } from '../map/GisMap';
import { runSimulation } from '../services/api';

interface SimulationPageProps {
  region: StudyRegion;
  weather: WeatherObservation | null;
  hotspots: HotspotRecord[];
  selectedIgnition: [number, number] | null;
  onSelectIgnition: (coords: [number, number]) => void;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({
  region,
  weather,
  hotspots,
  selectedIgnition,
  onSelectIgnition,
}) => {
  // Simulation input controls
  const [durationHours, setDurationHours] = useState<6 | 12>(6);
  const [windSpeed, setWindSpeed] = useState<number>(weather?.wind_speed_kmh || 22.0);
  const [windDirection, setWindDirection] = useState<number>(weather?.wind_direction_deg || 45.0);
  const [fuelDensity, setFuelDensity] = useState<number>(0.75);
  const [spreadMultiplier, setSpreadMultiplier] = useState<number>(1.0);

  // Default ignition point
  const defaultIgnition: [number, number] = selectedIgnition || (
    hotspots.length > 0
      ? [hotspots[0].latitude, hotspots[0].longitude]
      : [region.center.latitude, region.center.longitude]
  );

  const [currentIgnition, setCurrentIgnition] = useState<[number, number]>(defaultIgnition);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update ignition if prop changes
  useEffect(() => {
    if (selectedIgnition) {
      setCurrentIgnition(selectedIgnition);
    }
  }, [selectedIgnition]);

  // Execute simulation
  const handleExecuteSimulation = async () => {
    try {
      setIsRunning(true);
      setErrorMsg(null);
      const res = await runSimulation({
        ignition_lat: currentIgnition[0],
        ignition_lon: currentIgnition[1],
        duration_hours: durationHours,
        wind_speed_kmh: windSpeed,
        wind_direction_deg: windDirection,
        spread_rate_multiplier: spreadMultiplier,
        fuel_density: fuelDensity,
      });
      setSimulationResult(res);
      setCurrentStepIndex(res.steps.length - 1); // jump to final hour
    } catch (err: any) {
      setErrorMsg(err.message || 'Simulation execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Reset simulation
  const handleReset = () => {
    setSimulationResult(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  // Auto-play animation timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && simulationResult) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= simulationResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, simulationResult]);

  // Current active step GeoJSON
  const activeStep = simulationResult?.steps[currentStepIndex];
  const activeGeoJson = activeStep ? activeStep.geojson : null;

  return (
    <div className="space-y-4">
      {/* Simulation Advisory Banner */}
      <div className="bg-orange-950/40 border border-orange-500/40 p-3 rounded-xl flex items-center justify-between text-xs text-orange-200">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
          <span>
            <b>SIMULATOR ADVISORY:</b> Illustrative fire-spread simulation — not a validated operational forecast.
            Utilizes cellular Huygens elliptical propagation based on wind vector and fuel load assumptions.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-orange-900/60 px-2 py-0.5 rounded border border-orange-700/60 shrink-0 hidden sm:inline">
          Deterministic Rothermel-Alexander Wavefront
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive GIS Map & Timeline Slider */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Map */}
          <GisMap
            center={[currentIgnition[0], currentIgnition[1]]}
            zoom={11}
            bbox={region.bbox}
            hotspots={hotspots}
            simulationGeoJson={activeGeoJson}
            selectedIgnitionPoint={currentIgnition}
            onMapClick={(coords) => {
              setCurrentIgnition(coords);
              onSelectIgnition(coords);
            }}
            showHotspots={true}
            showRiskZones={false}
            showSimulation={true}
            height="540px"
          />

          {/* Timeline Playback Slider Controls */}
          {simulationResult && (
            <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="font-bold text-white uppercase tracking-wider">
                    Spread Timeline Playback
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded bg-orange-950 border border-orange-700 text-orange-300 font-bold">
                    T + {activeStep?.elapsed_hours}h ({activeStep?.elapsed_minutes} min)
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium flex items-center space-x-1.5 transition-colors shadow-md shadow-orange-900/40"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play Spread'}</span>
                  </button>

                  <button
                    onClick={() => setCurrentStepIndex(0)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
                    title="Rewind to T+0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Slider Input */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={simulationResult.steps.length - 1}
                  step={1}
                  value={currentStepIndex}
                  onChange={(e) => {
                    setCurrentStepIndex(Number(e.target.value));
                    setIsPlaying(false);
                  }}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Ignition (T+0h)</span>
                  {durationHours === 12 && <span>T+6h Front</span>}
                  <span>Final Front (T+{durationHours}h)</span>
                </div>
              </div>

              {/* Step Metrics Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-charcoal-700/60 text-center">
                <div className="bg-charcoal-900/80 p-2 rounded-lg border border-charcoal-800">
                  <div className="text-[10px] text-slate-400 uppercase">Burned Area</div>
                  <div className="text-base font-mono font-bold text-orange-300">
                    {activeStep?.burned_area_sqkm} km²
                  </div>
                </div>
                <div className="bg-charcoal-900/80 p-2 rounded-lg border border-charcoal-800">
                  <div className="text-[10px] text-slate-400 uppercase">Perimeter</div>
                  <div className="text-base font-mono font-bold text-amber-300">
                    {activeStep?.perimeter_km} km
                  </div>
                </div>
                <div className="bg-charcoal-900/80 p-2 rounded-lg border border-charcoal-800">
                  <div className="text-[10px] text-slate-400 uppercase">Estimated Cells</div>
                  <div className="text-base font-mono font-bold text-slate-200">
                    {activeStep?.cumulative_cells_burned}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Simulation Parameters & Ignition Selection */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-700/80 pb-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Simulation Parameters</span>
              </h3>
              <span className="text-[10px] font-mono text-forest-400">Deterministic</span>
            </div>

            {/* Ignition Point Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">
                Ignition Coordinate (Lat, Lon):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.001"
                  value={currentIgnition[0]}
                  onChange={(e) => setCurrentIgnition([parseFloat(e.target.value) || 0, currentIgnition[1]])}
                  className="bg-charcoal-900 border border-charcoal-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <input
                  type="number"
                  step="0.001"
                  value={currentIgnition[1]}
                  onChange={(e) => setCurrentIgnition([currentIgnition[0], parseFloat(e.target.value) || 0])}
                  className="bg-charcoal-900 border border-charcoal-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Pre-fill from detected hotspots */}
              {hotspots.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">Select from detected anomalies:</span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {hotspots.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setCurrentIgnition([h.latitude, h.longitude])}
                        className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                          currentIgnition[0] === h.latitude && currentIgnition[1] === h.longitude
                            ? 'bg-orange-600 text-white border-orange-500'
                            : 'bg-charcoal-900 text-slate-300 border-charcoal-700 hover:border-charcoal-500'
                        }`}
                      >
                        🔥 {h.id} ({h.confidence})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Duration: 6h vs 12h */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-semibold block">Simulation Duration:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDurationHours(6)}
                  className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                    durationHours === 6
                      ? 'bg-orange-600/30 text-orange-300 border-orange-500'
                      : 'bg-charcoal-900 text-slate-400 border-charcoal-700 hover:text-white'
                  }`}
                >
                  6 Hours Scenario
                </button>
                <button
                  onClick={() => setDurationHours(12)}
                  className={`py-2 rounded-lg font-bold text-xs border transition-all ${
                    durationHours === 12
                      ? 'bg-orange-600/30 text-orange-300 border-orange-500'
                      : 'bg-charcoal-900 text-slate-400 border-charcoal-700 hover:text-white'
                  }`}
                >
                  12 Hours Extended
                </button>
              </div>
            </div>

            {/* Wind Speed Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Wind Speed:</span>
                <span className="font-mono text-orange-400 font-bold">{windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min={0}
                max={70}
                step={1}
                value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0 km/h (Radial)</span>
                <span>35 km/h (Brisk)</span>
                <span>70 km/h (Gale)</span>
              </div>
            </div>

            {/* Wind Direction Compass Slider */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Wind Direction:</span>
                <span className="font-mono text-cyan-400 font-bold">{windDirection}° ({Math.round(windDirection)}°)</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={windDirection}
                onChange={(e) => setWindDirection(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>N (0°)</span>
                <span>E (90°)</span>
                <span>S (180°)</span>
                <span>W (270°)</span>
                <span>N (360°)</span>
              </div>
            </div>

            {/* Fuel Density / Vegetation factor */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300 font-medium">Fuel Load Density:</span>
                <span className="font-mono text-forest-400 font-bold">{(fuelDensity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={1.0}
                step={0.05}
                value={fuelDensity}
                onChange={(e) => setFuelDensity(Number(e.target.value))}
                className="w-full accent-forest-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                onClick={handleExecuteSimulation}
                disabled={isRunning}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-950/50 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Running Huygens Propagation...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-white" />
                    <span>Run {durationHours}h Fire-Spread Simulation</span>
                  </>
                )}
              </button>

              {simulationResult && (
                <button
                  onClick={handleReset}
                  className="w-full py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Clear Simulation Layer
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-red-950/60 border border-red-700/60 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Model Assumptions Summary Card */}
          {simulationResult && (
            <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 text-xs space-y-2">
              <div className="font-bold text-slate-200 border-b border-charcoal-700/60 pb-1 flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-forest-400" />
                <span>Simulation Physics Assumptions</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Length-to-Width Ratio (L/W):</span>
                  <span className="font-mono">{simulationResult.model_assumptions.length_to_width_ratio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Forward Spread Rate:</span>
                  <span className="font-mono">{simulationResult.model_assumptions.forward_rate_kmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Flanking Rate:</span>
                  <span className="font-mono">{simulationResult.model_assumptions.flanking_rate_kmh} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Backing Rate:</span>
                  <span className="font-mono">{simulationResult.model_assumptions.backing_rate_kmh} km/h</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 pt-1 border-t border-charcoal-700/60 italic">
                {simulationResult.model_assumptions.limitations}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
