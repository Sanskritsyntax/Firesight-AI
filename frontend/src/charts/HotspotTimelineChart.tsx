import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface HotspotTimelineChartProps {
  data: Array<{
    date: string;
    count: number;
    high_confidence: number;
    nominal_confidence: number;
  }>;
}

export const HotspotTimelineChart: React.FC<HotspotTimelineChartProps> = ({ data }) => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          NASA FIRMS Thermal Anomaly Detections Over Time
        </h3>
        <span className="text-[11px] font-mono text-slate-400">VIIRS 375m & MODIS</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <Bar
              dataKey="high_confidence"
              name="High Confidence Detections"
              fill="#ef4444"
              stackId="a"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="nominal_confidence"
              name="Nominal Confidence Detections"
              fill="#f59e0b"
              stackId="a"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
