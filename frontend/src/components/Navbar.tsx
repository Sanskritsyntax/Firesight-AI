import React from 'react';
import { Flame, Satellite, Download, Printer, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StudyRegion } from '../types';

interface NavbarProps {
  regions: StudyRegion[];
  selectedRegion: StudyRegion | null;
  onSelectRegion: (region: StudyRegion) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  lastUpdated: string;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenExport: () => void;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  isDemoMode,
  onToggleDemoMode,
  lastUpdated,
  onRefresh,
  isLoading,
  onOpenExport,
  onPrint,
}) => {
  return (
    <header className="glass-panel-elevated border-b border-charcoal-700/80 sticky top-0 z-[1100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 border border-orange-400/40">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white font-sans">
                FireSight <span className="text-forest-400">AI</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-charcoal-800 border border-charcoal-600 text-slate-300">
                PS 11
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              ORBITRON Spaceathon • The ByteForce
            </div>
          </div>
        </div>

        {/* Center: Region Selector & Telemetry Status */}
        <div className="flex items-center space-x-3">
          {/* Region Selector */}
          <div className="relative">
            <select
              aria-label="Select Study Region"
              value={selectedRegion?.id || ''}
              onChange={(e) => {
                const found = regions.find((r) => r.id === e.target.value);
                if (found) onSelectRegion(found);
              }}
              className="bg-charcoal-900 border border-charcoal-600 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-forest-500 font-medium cursor-pointer"
            >
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  📍 {r.name} ({r.state})
                </option>
              ))}
            </select>
          </div>

          {/* Operational Data Mode Badge */}
          <button
            onClick={onToggleDemoMode}
            className={`text-xs px-2.5 py-1 rounded-md border font-mono flex items-center space-x-1.5 transition-all ${
              isDemoMode
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-forest-950/60 border-forest-600/50 text-forest-300 hover:bg-forest-900/60'
            }`}
            title="Click to toggle between Demo Mode and Live Sensors"
          >
            {isDemoMode ? (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>DEMO MODE</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-forest-400" />
                <span>LIVE SENSORS</span>
              </>
            )}
          </button>
        </div>

        {/* Right Actions: Refresh, Export, Print */}
        <div className="flex items-center space-x-2">
          {/* Freshness / Refresh */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors disabled:opacity-50"
            title="Refresh Data & Calculations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-forest-400' : ''}`} />
          </button>

          {/* Export Action */}
          <button
            onClick={onOpenExport}
            className="glass-panel px-3 py-1.5 rounded-lg text-xs text-slate-200 hover:text-white hover:border-forest-500 transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5 text-forest-400" />
            <span className="hidden md:inline">Export</span>
          </button>

          {/* Print Report */}
          <button
            onClick={onPrint}
            className="bg-forest-600 hover:bg-forest-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-forest-900/40 transition-all flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
