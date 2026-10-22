import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, Flame, ShieldAlert, Wind } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-panel rounded-xl border border-charcoal-700 p-3.5 shadow-xl text-xs">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2 text-slate-200 font-semibold tracking-wide">
          <Layers className="w-4 h-4 text-forest-400" />
          <span>GIS Map Layers & Risk Legend</span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-charcoal-700/60 space-y-3">
          {/* Risk Classification Overlay */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Forest Fire Risk Grid</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-1.5 bg-forest-950/40 border border-forest-600/40 px-2 py-1 rounded">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]"></span>
                <span className="text-slate-300">Low (&lt;0.35)</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-amber-950/40 border border-amber-600/40 px-2 py-1 rounded">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]"></span>
                <span className="text-slate-300">Medium (0.35–0.70)</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-red-950/40 border border-red-600/40 px-2 py-1 rounded">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]"></span>
                <span className="text-slate-300">High (&ge;0.70)</span>
              </div>
            </div>
          </div>

          {/* Observations & Simulation Features */}
          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <span>NASA VIIRS Hotspot (375m)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-3.5 rounded border border-dashed border-orange-400 bg-orange-500/30"></span>
              <span>Simulated Spread Front</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded-full border border-red-500 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              </div>
              <span>Ignition Starting Point</span>
            </div>
            <div className="flex items-center space-x-2">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open-Meteo Wind Vector</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 bg-charcoal-900/80 p-2 rounded border border-charcoal-800">
            * Risk scores derived via multi-criteria weighted scoring (Thermal Proximity, RH, Temp, Wind, Precipitation, Biome Fuel).
          </div>
        </div>
      )}
    </div>
  );
};
