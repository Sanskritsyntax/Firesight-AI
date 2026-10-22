import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

interface WeatherTrendsChartProps {
  data: Array<{
    date: string;
    temperature_c: number;
    relative_humidity_pct: number;
    wind_speed_kmh: number;
    precipitation_mm: number;
  }>;
}

export const WeatherTrendsChart: React.FC<WeatherTrendsChartProps> = ({ data }) => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Meteorological Trends (7-Day Multi-Sensor Series)
        </h3>
        <span className="text-[11px] font-mono text-slate-400">Open-Meteo Verified</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
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
            <Line
              type="monotone"
              dataKey="temperature_c"
              name="Temperature (°C)"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="relative_humidity_pct"
              name="Relative Humidity (%)"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="wind_speed_kmh"
              name="Wind Speed (km/h)"
              stroke="#eab308"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
