import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-amber-950/40 border-b border-amber-600/30 text-amber-200/90 text-xs px-4 py-2 transition-all duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="font-medium text-amber-100">
            <span className="font-bold tracking-wide">OPERATIONAL ADVISORY:</span> FireSight AI provides indicative risk estimates and illustrative simulations for situational awareness. It is not a validated fire forecast, a confirmed fire-detection service, or a replacement for emergency authorities. Always follow official alerts and instructions.
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[11px] underline text-amber-300 hover:text-white flex items-center space-x-1 shrink-0 font-medium ml-6 md:ml-0"
        >
          <span>{isExpanded ? 'Hide Safety Notice' : 'Read Full Safety Protocol'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-amber-800/40 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-amber-200/80">
          <div className="bg-black/30 p-2.5 rounded border border-amber-900/40">
            <span className="font-semibold text-amber-300 block mb-1">1. Thermal Anomaly Interpretation</span>
            Satellite thermal pixels represent radiometric temperature anomalies detected by VIIRS/MODIS sensors. Cloud cover, agricultural burns, or terrain reflections may influence readings.
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-amber-900/40">
            <span className="font-semibold text-amber-300 block mb-1">2. Simulation Assumptions</span>
            The 6–12 hour spread simulation executes a deterministic cellular Huygens elliptical model under uniform terrain assumptions. It is illustrative and does not replace operational fire modeling.
          </div>
          <div className="bg-black/30 p-2.5 rounded border border-amber-900/40">
            <span className="font-semibold text-amber-300 block mb-1">3. Emergency Coordination</span>
            Incident commanders and disaster management teams must coordinate directly with the Forest Survey of India (FSI), NDMA, and local state forest department authorities.
          </div>
        </div>
      )}
    </div>
  );
};
