import React, { useState, useEffect } from 'react';
import {
  BookOpen, Cpu, Globe, Flame, ShieldAlert, Terminal,
  ExternalLink, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { fetchMlEvaluation } from '../services/api';

export const DocumentationPage: React.FC = () => {
  const [mlMetrics, setMlMetrics] = useState<any>(null);

  useEffect(() => {
    fetchMlEvaluation().then(setMlMetrics).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-200">
      {/* Title Header */}
      <div className="glass-panel p-6 rounded-2xl border border-charcoal-700/80 shadow-xl space-y-2">
        <div className="flex items-center space-x-2 text-forest-400 font-bold text-sm tracking-wide uppercase">
          <BookOpen className="w-4 h-4" />
          <span>System Architecture & Scientific Methodology</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white">
          FireSight AI | Documentation & Technical Specification
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          ORBITRON Spaceathon • Problem Statement PS 11: Automated Forest Fire Prediction & Spread Simulation • Team: <b>The ByteForce</b> • Theme: Remote Sensing & GIS • Category: Software.
        </p>
      </div>

      {/* Section 1: Data Integration & Sensor Architecture */}
      <div className="glass-panel p-6 rounded-2xl border border-charcoal-700/80 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-charcoal-700 pb-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <span>1. Remote Sensing & Atmospheric Ingestion Layer</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-charcoal-900/80 p-4 rounded-xl border border-charcoal-800 space-y-2">
            <div className="font-bold text-orange-400 text-sm flex items-center justify-between">
              <span>NASA FIRMS</span>
              <span className="text-[10px] font-mono bg-orange-950 px-1.5 py-0.5 rounded border border-orange-800">
                VIIRS 375m
              </span>
            </div>
            <p className="text-slate-300">
              Retrieves near-real-time active thermal anomalies from Suomi NPP and NOAA-20 VIIRS sensors (375m ground resolution) and MODIS (1km).
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Fields: Latitude, Longitude, Brightness (K), FRP (MW), Confidence rating.
            </div>
            <a
              href="https://firms.modaps.eosdis.nasa.gov/"
              target="_blank"
              rel="noreferrer"
              className="text-forest-400 hover:underline flex items-center space-x-1 text-[11px] pt-1"
            >
              <span>NASA FIRMS Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-charcoal-900/80 p-4 rounded-xl border border-charcoal-800 space-y-2">
            <div className="font-bold text-cyan-400 text-sm flex items-center justify-between">
              <span>Open-Meteo API</span>
              <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                Hourly NWP
              </span>
            </div>
            <p className="text-slate-300">
              High-resolution numerical weather prediction (ECMWF & GFS blends) for real-time and 24-hour future forecasts without authentication barriers.
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Variables: Temperature 2m, Relative Humidity 2m, Wind 10m (speed & heading), Precipitation.
            </div>
            <a
              href="https://open-meteo.com/en/docs"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline flex items-center space-x-1 text-[11px] pt-1"
            >
              <span>Open-Meteo Documentation</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="bg-charcoal-900/80 p-4 rounded-xl border border-charcoal-800 space-y-2">
            <div className="font-bold text-forest-400 text-sm flex items-center justify-between">
              <span>ISRO VEDAS</span>
              <span className="text-[10px] font-mono bg-forest-950 px-1.5 py-0.5 rounded border border-forest-800">
                SAC Environmental
              </span>
            </div>
            <p className="text-slate-300">
              Extensible land cover and fuel index architecture calibrated for Indian forest biomes (sal, teak, pine, scrub). Supports GeoTIFF and NetCDF raster ingestion.
            </p>
            <div className="text-[11px] text-slate-400 font-mono">
              Products: AWiFS NDVI 10-day composite, LISS-III Forest Canopy Density (FCD).
            </div>
            <a
              href="https://vedas.sac.gov.in/en/"
              target="_blank"
              rel="noreferrer"
              className="text-forest-400 hover:underline flex items-center space-x-1 text-[11px] pt-1"
            >
              <span>ISRO VEDAS Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Section 2: Baseline Multi-Criteria Risk Formula */}
      <div className="glass-panel p-6 rounded-2xl border border-charcoal-700/80 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-charcoal-700 pb-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>2. Transparent Baseline Risk Engine (v1.2)</span>
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          The baseline risk engine calculates an interpretable, normalized risk index in [0.0, 1.0] for every spatial cell. It accounts for missing parameters without silently assuming zero risk by re-normalizing weights across active features:
        </p>

        {/* Formula Box */}
        <div className="bg-charcoal-950 p-4 rounded-xl border border-charcoal-800 font-mono text-xs text-amber-300 overflow-x-auto">
          Risk = (w_hotspot × F_hotspot) + (w_rh × F_rh) + (w_temp × F_temp) + (w_wind × F_wind) + (w_precip × (1 - F_precip)) + (w_veg × F_veg)
        </div>

        {/* Weight Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-charcoal-800 rounded-lg overflow-hidden">
            <thead className="bg-charcoal-900 text-slate-300">
              <tr>
                <th className="p-2.5">Input Feature</th>
                <th className="p-2.5">Configured Weight</th>
                <th className="p-2.5">Normalization Transfer Function</th>
                <th className="p-2.5">Physical Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800 text-slate-400">
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Thermal Hotspot Proximity</td>
                <td className="p-2.5 font-mono text-orange-400 font-bold">0.35 (35%)</td>
                <td className="p-2.5 font-mono text-[11px]">exp(-(d - 1.0) / 4.0) for d &le; 15 km</td>
                <td className="p-2.5">Active thermal anomalies confirm intense local heat release.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Relative Humidity (RH)</td>
                <td className="p-2.5 font-mono text-cyan-400 font-bold">0.20 (20%)</td>
                <td className="p-2.5 font-mono text-[11px]">(80 - RH) / 70 for RH &isin; [10, 80]%</td>
                <td className="p-2.5">Fine dead fuel moisture equilibrium drops rapidly below 30% RH.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Ambient Temperature</td>
                <td className="p-2.5 font-mono text-amber-400 font-bold">0.15 (15%)</td>
                <td className="p-2.5 font-mono text-[11px]">(T - 15) / 30 for T &isin; [15, 45]&deg;C</td>
                <td className="p-2.5">High temperatures accelerate fuel pre-heating and drying.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Wind Velocity</td>
                <td className="p-2.5 font-mono text-yellow-400 font-bold">0.15 (15%)</td>
                <td className="p-2.5 font-mono text-[11px]">min(50, W) / 50 for W &le; 50 km/h</td>
                <td className="p-2.5">Winds tilt flame fronts, increasing radiative flux to unburned fuels.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Precipitation Dampener</td>
                <td className="p-2.5 font-mono text-blue-400 font-bold">0.10 (10%)</td>
                <td className="p-2.5 font-mono text-[11px]">1.0 - (min(5, P) / 5.0)</td>
                <td className="p-2.5">Rainfall saturates canopy litter, suppressing ignition potential.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold text-slate-200">Vegetation / Fuel Load</td>
                <td className="p-2.5 font-mono text-forest-400 font-bold">0.05 (5%)</td>
                <td className="p-2.5 font-mono text-[11px]">Fuel density factor &isin; [0.2, 1.0]</td>
                <td className="p-2.5">Biome-specific biomass density based on ISRO VEDAS forest classifications.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Scikit-Learn Machine Learning Evaluation Suite */}
      <div className="glass-panel p-6 rounded-2xl border border-charcoal-700/80 shadow-lg space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-charcoal-700 pb-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          <span>3. Scikit-Learn Machine Learning Model Interface & Benchmark</span>
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          The system provides a pluggable Scikit-Learn RandomForestClassifier trained on a reproducible historical fire observation benchmark:
        </p>

        {mlMetrics && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div className="bg-charcoal-900 p-3 rounded-lg border border-charcoal-800">
                <div className="text-[10px] text-slate-400 uppercase">Precision</div>
                <div className="text-xl font-bold font-mono text-purple-400">{mlMetrics.precision}</div>
              </div>
              <div className="bg-charcoal-900 p-3 rounded-lg border border-charcoal-800">
                <div className="text-[10px] text-slate-400 uppercase">Recall</div>
                <div className="text-xl font-bold font-mono text-purple-400">{mlMetrics.recall}</div>
              </div>
              <div className="bg-charcoal-900 p-3 rounded-lg border border-charcoal-800">
                <div className="text-[10px] text-slate-400 uppercase">F1-Score</div>
                <div className="text-xl font-bold font-mono text-purple-400">{mlMetrics.f1_score}</div>
              </div>
              <div className="bg-charcoal-900 p-3 rounded-lg border border-charcoal-800">
                <div className="text-[10px] text-slate-400 uppercase">ROC-AUC Score</div>
                <div className="text-xl font-bold font-mono text-emerald-400">{mlMetrics.roc_auc}</div>
              </div>
            </div>

            <div className="bg-charcoal-900 p-4 rounded-xl border border-charcoal-800 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">RandomForest Feature Importances:</span>
              <div className="space-y-1.5">
                {Object.entries(mlMetrics.feature_importances || {}).map(([key, val]: any) => (
                  <div key={key} className="flex items-center space-x-2 text-[11px]">
                    <span className="w-48 text-slate-400 truncate capitalize font-mono">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <div className="flex-1 bg-charcoal-800 h-2 rounded overflow-hidden">
                      <div
                        style={{ width: `${(val * 100).toFixed(1)}%` }}
                        className="bg-purple-500 h-full rounded"
                      ></div>
                    </div>
                    <span className="font-mono text-slate-200 w-12 text-right">
                      {(val * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 bg-charcoal-900/60 p-3 rounded border border-charcoal-800">
              <b>Validation Disclosure:</b> {mlMetrics.validation_note}
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Fire-Spread Simulation Physics */}
      <div className="glass-panel p-6 rounded-2xl border border-charcoal-700/80 shadow-lg space-y-3 text-xs leading-relaxed">
        <h2 className="text-base font-bold text-white flex items-center space-x-2 border-b border-charcoal-700 pb-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span>4. Huygens Wave Propagation Fire-Spread Simulator (6–12 Hours)</span>
        </h2>

        <p className="text-slate-300">
          The spread simulation executes a deterministic cellular Huygens elliptical propagation algorithm based on Rothermel’s surface fire equations and Alexander’s empirical length-to-width ratio model:
        </p>

        <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
          <li><b>Forward Spread Rate:</b> <code>R_f = R_0 &times; (1 + 0.04 &times; W^1.15) &times; Fuel &times; Multiplier</code></li>
          <li><b>Length-to-Width Ratio:</b> <code>L/W = 1.0 + 0.0012 &times; W^1.8</code>, creating wind-stretched directional ellipses.</li>
          <li><b>Flanking & Backing Spread:</b> Semi-minor axis <code>b = R_f / (L/W)</code> and backing rate <code>R_b</code> propagate against wind vector.</li>
          <li><b>Hourly Isochrones:</b> Returned as georeferenced GeoJSON polygons at discrete time steps (0h, 1h ... 6h / 12h).</li>
        </ul>

        <div className="p-3 bg-charcoal-950 rounded-lg border border-charcoal-800 text-amber-200/90 text-[11px]">
          <b>Operational Limitation:</b> Assumes continuous fuel beds and uniform terrain slope. Spotting (ember lofting) and active fire suppression interventions are not modeled.
        </div>
      </div>
    </div>
  );
};
