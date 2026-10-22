import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, Sparkles, AlertCircle, ShieldAlert,
  Thermometer, Droplets, Wind, Info, CheckCircle2
} from 'lucide-react';
import { StudyRegion, AnalyticsResponse } from '../types';
import { fetchAnalytics } from '../services/api';
import { WeatherTrendsChart } from '../charts/WeatherTrendsChart';
import { HotspotTimelineChart } from '../charts/HotspotTimelineChart';

interface AnalyticsPageProps {
  region: StudyRegion;
  isDemoMode: boolean;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  region,
  isDemoMode,
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [timeWindow, setTimeWindow] = useState<number>(7);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMsg(null);
        const data = await fetchAnalytics(region.id, timeWindow, isDemoMode);
        if (isMounted) setAnalyticsData(data);
      } catch (err: any) {
        if (isMounted) setErrorMsg(err.message || 'Failed to load analytics.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [region.id, timeWindow, isDemoMode]);

  return (
    <div className="space-y-5">
      {/* Time Window Selector Bar */}
      <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-4 h-4 text-forest-400" />
          <span className="font-bold text-white text-sm">
            Geospatial Analytics & Multi-Sensor Intelligence: {region.name}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Analysis Window:</span>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setTimeWindow(d)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                timeWindow === d
                  ? 'bg-forest-600 text-white font-bold'
                  : 'bg-charcoal-800 text-slate-300 hover:bg-charcoal-700'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Generated Data-Grounded Insights Section */}
      <div className="glass-panel p-5 rounded-xl border border-charcoal-700/80 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-forest-400 font-bold text-sm">
          <Sparkles className="w-4 h-4 text-forest-400" />
          <span>Automated Data-Grounded Insights Engine</span>
          <span className="text-[10px] font-mono text-slate-400 bg-charcoal-800 px-2 py-0.5 rounded border border-charcoal-700">
            100% Backed by Calculated Telemetry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {analyticsData?.insights.map((insight, idx) => {
            const badgeBorder =
              insight.type === 'risk_concentration'
                ? 'border-l-4 border-l-red-500 bg-red-950/20'
                : insight.type === 'weather_impact'
                ? 'border-l-4 border-l-amber-500 bg-amber-950/20'
                : 'border-l-4 border-l-forest-500 bg-forest-950/20';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-lg border border-charcoal-700/80 ${badgeBorder} space-y-2`}
              >
                <div className="text-xs font-bold text-slate-200">{insight.title}</div>
                <p className="text-xs text-slate-300 leading-relaxed">{insight.description}</p>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-charcoal-700/60 font-mono">
                  <b>Ground Truth Evidence:</b> {insight.grounded_evidence}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-Sensor Trend Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weather Trends Chart */}
        {analyticsData && (
          <WeatherTrendsChart data={analyticsData.weather_trends} />
        )}

        {/* Hotspots Timeline Chart */}
        {analyticsData && (
          <HotspotTimelineChart data={analyticsData.hotspot_trends} />
        )}
      </div>

      {/* Risk Distribution Historical Progression Table */}
      {analyticsData && (
        <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg">
          <div className="flex items-center justify-between mb-3 text-xs">
            <h3 className="font-semibold text-slate-300 uppercase tracking-wider">
              Risk Category Proportion Evolution (% Grid Area)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Daily Computed Risk Profile
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-900/90 text-slate-400 border-b border-charcoal-800">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Low Risk (&lt;0.35)</th>
                  <th className="py-2 px-3">Medium Risk (0.35–0.70)</th>
                  <th className="py-2 px-3">High Risk (&ge;0.70)</th>
                  <th className="py-2 px-3">Visual Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-800 text-slate-300 font-mono">
                {analyticsData.risk_distribution_history.map((row, idx) => (
                  <tr key={idx} className="hover:bg-charcoal-900/60">
                    <td className="py-2 px-3 font-semibold text-white">{row.date}</td>
                    <td className="py-2 px-3 text-forest-400">{row.low}%</td>
                    <td className="py-2 px-3 text-amber-400">{row.medium}%</td>
                    <td className="py-2 px-3 text-red-400 font-bold">{row.high}%</td>
                    <td className="py-2 px-3">
                      <div className="w-36 h-2 rounded bg-charcoal-800 flex overflow-hidden">
                        <div style={{ width: `${row.low}%` }} className="bg-forest-500 h-full"></div>
                        <div style={{ width: `${row.medium}%` }} className="bg-amber-500 h-full"></div>
                        <div style={{ width: `${row.high}%` }} className="bg-red-500 h-full"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
