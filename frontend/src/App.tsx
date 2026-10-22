import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchRegions, fetchHotspots, fetchWeather, analyzeRisk, fetchSystemStatus
} from './services/api';
import {
  StudyRegion, RiskAnalysisResponse, WeatherObservation, HotspotRecord, SimulationResponse
} from './types';
import { Navbar } from './components/Navbar';
import { Sidebar, TabType } from './components/Sidebar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { ExportModal } from './components/ExportModal';
import { PrintReport } from './components/PrintReport';
import { DashboardPage } from './pages/DashboardPage';
import { SimulationPage } from './pages/SimulationPage';
import { ForecastTimelinePage } from './pages/ForecastTimelinePage';
import { HotspotsTablePage } from './pages/HotspotsTablePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DocumentationPage } from './pages/DocumentationPage';

export function App() {
  const [regions, setRegions] = useState<StudyRegion[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<StudyRegion | null>(null);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true); // Default to verified safe demo fallback
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Core Data States
  const [riskData, setRiskData] = useState<RiskAnalysisResponse | null>(null);
  const [weather, setWeather] = useState<WeatherObservation | null>(null);
  const [hotspots, setHotspots] = useState<HotspotRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Selected Ignition Coordinate for Simulation
  const [selectedIgnition, setSelectedIgnition] = useState<[number, number] | null>(null);

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // 1. Initial Load of Regions
  useEffect(() => {
    async function initRegions() {
      try {
        const regs = await fetchRegions();
        setRegions(regs);
        if (regs.length > 0) {
          setSelectedRegion(regs[0]);
        }
      } catch (err: any) {
        console.error('Failed to load regions:', err);
        setErrorBanner('Unable to connect to backend service. Please ensure FastAPI server is running.');
      }
    }
    initRegions();
  }, []);

  // 2. Fetch Data & Calculate Risk for Active Region
  const loadRegionData = useCallback(async (region: StudyRegion, demo: boolean) => {
    try {
      setIsLoading(true);
      setErrorBanner(null);

      // Concurrent fetch of hotspots, weather, and risk grid
      const [hList, wData, rData] = await Promise.all([
        fetchHotspots(region.id, demo),
        fetchWeather(region.id, region.center.latitude, region.center.longitude, demo),
        analyzeRisk({ region_id: region.id, step_deg: 0.03, force_demo: demo }),
      ]);

      setHotspots(hList);
      setWeather(wData);
      setRiskData(rData);
      setLastUpdated(new Date().toLocaleTimeString());

      // If ignition not set, default to first hotspot or region center
      if (hList.length > 0) {
        setSelectedIgnition([hList[0].latitude, hList[0].longitude]);
      } else {
        setSelectedIgnition([region.center.latitude, region.center.longitude]);
      }
    } catch (err: any) {
      console.error('Data load error:', err);
      setErrorBanner(err.message || 'Failed to refresh regional intelligence.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger data load when selected region or demo mode changes
  useEffect(() => {
    if (selectedRegion) {
      loadRegionData(selectedRegion, isDemoMode);
    }
  }, [selectedRegion, isDemoMode, loadRegionData]);

  // Handle Region Change
  const handleSelectRegion = (region: StudyRegion) => {
    setSelectedRegion(region);
  };

  // Toggle Demo Mode
  const handleToggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  // Trigger Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-slate-100 flex flex-col">
      {/* Persistent Operational Disclaimer Banner */}
      <div className="no-print">
        <DisclaimerBanner />
      </div>

      {/* Top Navbar */}
      <div className="no-print">
        <Navbar
          regions={regions}
          selectedRegion={selectedRegion}
          onSelectRegion={handleSelectRegion}
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          lastUpdated={lastUpdated}
          onRefresh={() => selectedRegion && loadRegionData(selectedRegion, isDemoMode)}
          isLoading={isLoading}
          onOpenExport={() => setIsExportModalOpen(true)}
          onPrint={handlePrint}
        />
      </div>

      {/* Error Alert Banner if any */}
      {errorBanner && (
        <div className="no-print bg-red-950/80 border-b border-red-800 text-red-200 text-xs px-4 py-2 flex items-center justify-between">
          <span>⚠️ {errorBanner}</span>
          <button
            onClick={() => setErrorBanner(null)}
            className="text-red-400 hover:text-white font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden no-print">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          hotspotsCount={hotspots.length}
        />

        {/* Center / Right Content Panel */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {selectedRegion ? (
            <>
              {currentTab === 'dashboard' && (
                <DashboardPage
                  region={selectedRegion}
                  riskData={riskData}
                  weather={weather}
                  hotspots={hotspots}
                  isLoading={isLoading}
                  onIgnitionSelect={(coords) => setSelectedIgnition(coords)}
                  onSelectHotspot={(h) => setSelectedIgnition([h.latitude, h.longitude])}
                  onNavigateToSimulation={() => setCurrentTab('simulation')}
                />
              )}

              {currentTab === 'simulation' && (
                <SimulationPage
                  region={selectedRegion}
                  weather={weather}
                  hotspots={hotspots}
                  selectedIgnition={selectedIgnition}
                  onSelectIgnition={(coords) => setSelectedIgnition(coords)}
                />
              )}

              {currentTab === 'timeline' && (
                <ForecastTimelinePage
                  region={selectedRegion}
                  isDemoMode={isDemoMode}
                />
              )}

              {currentTab === 'hotspots' && (
                <HotspotsTablePage
                  hotspots={hotspots}
                  region={selectedRegion}
                  onSelectIgnitionForSimulation={(coords) => setSelectedIgnition(coords)}
                  onNavigateToSimulation={() => setCurrentTab('simulation')}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsPage
                  region={selectedRegion}
                  isDemoMode={isDemoMode}
                />
              )}

              {currentTab === 'documentation' && (
                <DocumentationPage />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500">
              Initializing FireSight AI operational telemetry...
            </div>
          )}
        </main>
      </div>

      {/* Export Modal */}
      <div className="no-print">
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          selectedRegion={selectedRegion}
          onPrint={handlePrint}
        />
      </div>

      {/* Print-Only Report View */}
      <PrintReport
        region={selectedRegion}
        riskData={riskData}
        weather={weather}
        hotspots={hotspots}
        simulationData={null}
      />
    </div>
  );
}

export default App;
