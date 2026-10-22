import React from 'react';
import { X, FileSpreadsheet, MapPin, Cpu, Printer, Download, Check } from 'lucide-react';
import { getHotspotsExportUrl, getRiskGeoJsonExportUrl } from '../services/api';
import { StudyRegion } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRegion: StudyRegion | null;
  onPrint: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedRegion,
  onPrint,
}) => {
  if (!isOpen) return null;

  const regId = selectedRegion?.id || 'similipal_odisha';
  const csvUrl = getHotspotsExportUrl(regId);
  const geoJsonUrl = getRiskGeoJsonExportUrl(regId);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel-elevated w-full max-w-lg rounded-2xl border border-charcoal-600 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-forest-400 font-bold text-lg mb-1">
          <Download className="w-5 h-5" />
          <span>Export Geospatial & Intelligence Data</span>
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Download operational outputs for <b className="text-slate-200">{selectedRegion?.name || 'Current Region'}</b>. All exports strictly reflect computed observations.
        </p>

        <div className="space-y-3">
          {/* CSV Hotspots */}
          <a
            href={csvUrl}
            download
            className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-900/90 border border-charcoal-700 hover:border-forest-500 hover:bg-charcoal-800 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-forest-950/60 text-forest-400 border border-forest-800/50 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-forest-300">
                  Thermal Hotspots Catalog (.CSV)
                </div>
                <div className="text-[11px] text-slate-400">
                  NASA VIIRS active fire coordinates, acquisition timestamps, FRP, confidence.
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-forest-400" />
          </a>

          {/* GeoJSON Risk Zones */}
          <a
            href={geoJsonUrl}
            download
            className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-900/90 border border-charcoal-700 hover:border-amber-500 hover:bg-charcoal-800 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/50 group-hover:scale-105 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                  Risk Grid Polygons (.GeoJSON)
                </div>
                <div className="text-[11px] text-slate-400">
                  Georeferenced grid polygons with scores, categories, and factor breakdowns for GIS apps.
                </div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
          </a>

          {/* Printable Incident Report */}
          <button
            onClick={() => {
              onClose();
              onPrint();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-charcoal-900/90 border border-charcoal-700 hover:border-blue-500 hover:bg-charcoal-800 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/50 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">
                  Print Incident / Briefing Report
                </div>
                <div className="text-[11px] text-slate-400">
                  Clean, print-optimized situation report with telemetry, maps, and official disclaimers.
                </div>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-400 group-hover:text-blue-400" />
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-charcoal-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-charcoal-800 hover:bg-charcoal-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
