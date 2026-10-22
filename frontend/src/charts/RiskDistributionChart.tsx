import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RiskDistributionChartProps {
  counts: {
    Low: number;
    Medium: number;
    High: number;
  };
  percentages: {
    Low: number;
    Medium: number;
    High: number;
  };
  totalCells: number;
}

export const RiskDistributionChart: React.FC<RiskDistributionChartProps> = ({
  counts,
  percentages,
  totalCells,
}) => {
  const data = [
    { name: 'Low Risk', value: counts.Low || 0, color: '#10b981', pct: percentages.Low || 0 },
    { name: 'Medium Risk', value: counts.Medium || 0, color: '#f59e0b', pct: percentages.Medium || 0 },
    { name: 'High Risk', value: counts.High || 0, color: '#ef4444', pct: percentages.High || 0 },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Risk Grid Distribution
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          {totalCells} Grid Cells (3km²)
        </span>
      </div>

      <div className="h-44 w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="glass-panel-elevated p-2 rounded-lg text-xs border border-charcoal-600 shadow-xl">
                      <div className="font-semibold" style={{ color: d.color }}>
                        {d.name}
                      </div>
                      <div className="text-slate-200">
                        {d.value} cells ({d.pct}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with exact cell counts & proportions */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-charcoal-700/60 text-center text-xs">
        <div className="bg-charcoal-900/60 p-1.5 rounded border border-charcoal-800">
          <div className="text-[10px] text-forest-400 font-semibold">Low</div>
          <div className="font-mono text-slate-200 font-bold">{counts.Low}</div>
          <div className="text-[10px] text-slate-400">{percentages.Low}%</div>
        </div>
        <div className="bg-charcoal-900/60 p-1.5 rounded border border-charcoal-800">
          <div className="text-[10px] text-amber-400 font-semibold">Medium</div>
          <div className="font-mono text-slate-200 font-bold">{counts.Medium}</div>
          <div className="text-[10px] text-slate-400">{percentages.Medium}%</div>
        </div>
        <div className="bg-charcoal-900/60 p-1.5 rounded border border-charcoal-800">
          <div className="text-[10px] text-red-400 font-semibold">High</div>
          <div className="font-mono text-slate-200 font-bold">{counts.High}</div>
          <div className="text-[10px] text-slate-400">{percentages.High}%</div>
        </div>
      </div>
    </div>
  );
};
