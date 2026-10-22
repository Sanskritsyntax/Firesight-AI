import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Clock,
  TableProperties,
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Radio,
  FileCheck2
} from 'lucide-react';

export type TabType = 'dashboard' | 'simulation' | 'timeline' | 'hotspots' | 'analytics' | 'documentation';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hotspotsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  hotspotsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'GIS Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'simulation' as TabType,
      label: 'Spread Simulator',
      icon: Flame,
      badge: '6–12h',
    },
    {
      id: 'timeline' as TabType,
      label: '24h Risk Timeline',
      icon: Clock,
      badge: '+24h',
    },
    {
      id: 'hotspots' as TabType,
      label: 'Hotspots Catalog',
      icon: TableProperties,
      badge: hotspotsCount > 0 ? hotspotsCount.toString() : null,
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics & Insights',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'documentation' as TabType,
      label: 'Methodology & ML',
      icon: BookOpen,
      badge: 'v1.2',
    },
  ];

  return (
    <aside
      className={`glass-panel border-r border-charcoal-700/80 transition-all duration-300 flex flex-col justify-between select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3">
        {/* Navigation Items */}
        <nav className="space-y-1.5 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-forest-600/20 text-forest-300 border border-forest-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-charcoal-800/60'
                }`}
                title={item.label}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-forest-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive
                        ? 'bg-forest-500/30 text-forest-200'
                        : 'bg-charcoal-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Telemetry & Collapse Control */}
      <div className="p-3 border-t border-charcoal-700/60">
        {!isCollapsed && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-charcoal-900/80 border border-charcoal-800 text-[11px] text-slate-400">
            <div className="flex items-center space-x-1.5 text-forest-400 font-semibold mb-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Sensors Online</span>
            </div>
            <div>NASA VIIRS 375m & Open-Meteo operational</div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
