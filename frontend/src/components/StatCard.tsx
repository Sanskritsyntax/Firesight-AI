import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'forest' | 'amber' | 'red' | 'blue' | 'gray';
  trend?: string;
  statusBorder?: 'forest' | 'amber' | 'red' | 'none';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon: Icon,
  badge,
  badgeColor = 'gray',
  trend,
  statusBorder = 'none',
}) => {
  const borderClass =
    statusBorder === 'red'
      ? 'border-l-4 border-l-red-500'
      : statusBorder === 'amber'
      ? 'border-l-4 border-l-amber-500'
      : statusBorder === 'forest'
      ? 'border-l-4 border-l-forest-500'
      : '';

  const badgeColorClass =
    badgeColor === 'red'
      ? 'bg-red-950/60 text-red-300 border-red-700/50'
      : badgeColor === 'amber'
      ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
      : badgeColor === 'forest'
      ? 'bg-forest-950/60 text-forest-300 border-forest-700/50'
      : badgeColor === 'blue'
      ? 'bg-blue-950/60 text-blue-300 border-blue-700/50'
      : 'bg-charcoal-800 text-slate-400 border-charcoal-700';

  return (
    <div className={`glass-panel p-4 rounded-xl border border-charcoal-700/80 shadow-lg relative overflow-hidden transition-all hover:border-charcoal-600 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-charcoal-800/80 text-forest-400 border border-charcoal-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
        {subValue && <span className="text-xs text-slate-400 font-sans">{subValue}</span>}
      </div>

      {(badge || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-[11px]">
          {badge && (
            <span className={`px-2 py-0.5 rounded border font-mono ${badgeColorClass}`}>
              {badge}
            </span>
          )}
          {trend && <span className="text-slate-400 truncate">{trend}</span>}
        </div>
      )}
    </div>
  );
};
