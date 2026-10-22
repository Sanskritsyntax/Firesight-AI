import React, { useState, useMemo } from 'react';
import {
  Flame, Search, Filter, ArrowUpDown, Download, Crosshair,
  Satellite, AlertCircle, CheckCircle2, Calendar
} from 'lucide-react';
import { HotspotRecord, StudyRegion } from '../types';
import { getHotspotsExportUrl } from '../services/api';

interface HotspotsTablePageProps {
  hotspots: HotspotRecord[];
  region: StudyRegion;
  onSelectIgnitionForSimulation: (coords: [number, number]) => void;
  onNavigateToSimulation: () => void;
}

export const HotspotsTablePage: React.FC<HotspotsTablePageProps> = ({
  hotspots,
  region,
  onSelectIgnitionForSimulation,
  onNavigateToSimulation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'nominal' | 'low'>('all');
  const [sortField, setSortField] = useState<'time' | 'confidence' | 'frp' | 'brightness'>('confidence');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter & sort hotspots
  const filteredHotspots = useMemo(() => {
    return hotspots
      .filter((h) => {
        const matchesSearch =
          h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.satellite.toLowerCase().includes(searchTerm.toLowerCase()) ||
          h.instrument.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesConf = confidenceFilter === 'all' || h.confidence === confidenceFilter;
        return matchesSearch && matchesConf;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;
        if (sortField === 'confidence') {
          valA = a.confidence_score;
          valB = b.confidence_score;
        } else if (sortField === 'frp') {
          valA = a.frp || 0;
          valB = b.frp || 0;
        } else if (sortField === 'brightness') {
          valA = a.brightness || 0;
          valB = b.brightness || 0;
        } else {
          valA = a.timestamp;
          valB = b.timestamp;
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [hotspots, searchTerm, confidenceFilter, sortField, sortAsc]);

  const toggleSort = (field: 'time' | 'confidence' | 'frp' | 'brightness') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const csvUrl = getHotspotsExportUrl(region.id);

  return (
    <div className="space-y-4">
      {/* Header Bar with Search & Filters */}
      <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, Satellite, Instrument..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-charcoal-900 border border-charcoal-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 w-full focus:outline-none focus:ring-1 focus:ring-forest-500 text-xs"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filter by Confidence"
              value={confidenceFilter}
              onChange={(e: any) => setConfidenceFilter(e.target.value)}
              className="bg-charcoal-900 border border-charcoal-700 rounded-lg px-2.5 py-2 text-slate-300 focus:outline-none text-xs"
            >
              <option value="all">All Confidence</option>
              <option value="high">High Confidence</option>
              <option value="nominal">Nominal Confidence</option>
              <option value="low">Low Confidence</option>
            </select>
          </div>
        </div>

        {/* Download CSV Action */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
          <span className="text-slate-400 font-mono">
            Showing <b>{filteredHotspots.length}</b> of {hotspots.length} observations
          </span>
          <a
            href={csvUrl}
            download
            className="px-3 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white font-semibold transition-all flex items-center space-x-1.5 shadow-md shadow-forest-950/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </a>
        </div>
      </div>

      {/* Hotspots Data Table */}
      <div className="glass-panel rounded-xl border border-charcoal-700/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-charcoal-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-charcoal-700/80">
              <tr>
                <th className="py-3 px-4">Hotspot ID</th>
                <th className="py-3 px-4">Geographic Coordinates</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('confidence')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('frp')}
                >
                  <div className="flex items-center space-x-1">
                    <span>FRP (MW)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('brightness')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Brightness Temp</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('time')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Acquisition Time</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Satellite / Sensor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800 text-slate-300">
              {filteredHotspots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No active thermal anomalies match the selected filters in {region.name}.
                  </td>
                </tr>
              ) : (
                filteredHotspots.map((h) => {
                  const confBadgeClass =
                    h.confidence === 'high'
                      ? 'bg-red-950/80 text-red-300 border-red-700/60'
                      : h.confidence === 'nominal'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-charcoal-850/60 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center space-x-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        <span>{h.id}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        {h.latitude.toFixed(4)}°N, {h.longitude.toFixed(4)}°E
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded border text-[11px] font-bold uppercase ${confBadgeClass}`}>
                          {h.confidence} ({(h.confidence_score * 100).toFixed(0)}%)
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-orange-300">
                        {h.frp ? `${h.frp.toFixed(1)} MW` : 'N/A'}
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {h.brightness ? `${h.brightness.toFixed(1)} K` : 'N/A'}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {h.acq_date} {h.acq_time}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-slate-200">
                          <Satellite className="w-3.5 h-3.5 text-forest-400" />
                          <span>{h.satellite}</span>
                          <span className="text-slate-500 text-[10px]">({h.instrument})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            onSelectIgnitionForSimulation([h.latitude, h.longitude]);
                            onNavigateToSimulation();
                          }}
                          className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-orange-600/30 text-slate-300 hover:text-orange-300 border border-charcoal-700 hover:border-orange-500/50 transition-all text-[11px] font-medium inline-flex items-center space-x-1"
                          title="Simulate fire spread from this thermal anomaly"
                        >
                          <Crosshair className="w-3 h-3 text-orange-400" />
                          <span>Simulate</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
