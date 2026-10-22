import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HotspotRecord, BoundingBox } from '../types';
import { Layers, Crosshair, ZoomIn, ZoomOut, Compass, Satellite, Map as MapIcon, Moon } from 'lucide-react';

type BasemapType = 'satellite' | 'dark' | 'osm';

interface GisMapProps {
  center: [number, number];
  zoom?: number;
  bbox?: BoundingBox;
  hotspots?: HotspotRecord[];
  riskGeoJson?: any;
  simulationGeoJson?: any;
  selectedIgnitionPoint?: [number, number] | null;
  onMapClick?: (coords: [number, number]) => void;
  onSelectHotspot?: (hotspot: HotspotRecord) => void;
  showHotspots?: boolean;
  showRiskZones?: boolean;
  showSimulation?: boolean;
  height?: string;
}

export const GisMap: React.FC<GisMapProps> = ({
  center,
  zoom = 10,
  bbox,
  hotspots = [],
  riskGeoJson,
  simulationGeoJson,
  selectedIgnitionPoint,
  onMapClick,
  onSelectHotspot,
  showHotspots = true,
  showRiskZones = true,
  showSimulation = true,
  height = '580px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layers refs
  const riskLayerRef = useRef<L.GeoJSON | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const simLayerRef = useRef<L.GeoJSON | null>(null);
  const ignitionMarkerRef = useRef<L.Marker | null>(null);

  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite'); // Esri Satellite is ultra-fast & high-res

  // Helper to switch basemap tile layer
  const setBasemapLayer = (type: BasemapType, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    let layer: L.TileLayer;
    if (type === 'satellite') {
      // Esri World Imagery: Ultra-fast (0.2s), high-resolution satellite imagery
      layer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
        }
      );
    } else if (type === 'osm') {
      // OpenStreetMap: High availability vector street/terrain tiles
      layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      });
    } else {
      // CartoDB Dark Matter
      layer = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; CartoDB &copy; OpenStreetMap',
        }
      );
    }

    layer.addTo(map);
    tileLayerRef.current = layer;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Default to lightning-fast Esri Satellite World Imagery
    setBasemapLayer(activeBasemap, map);

    // Attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: 'FireSight AI | Remote Sensing & GIS',
    }).addTo(map);

    // Layer Groups
    hotspotsLayerRef.current = L.layerGroup().addTo(map);

    // Event listeners
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4)) });
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick([Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5))]);
      }
    });

    mapInstanceRef.current = map;

    // Fix layout timing: Invalidate size multiple times to ensure full visibility once DOM layout completes
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 300);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    // ResizeObserver ensures that if sidebar toggles or grid expands, tiles resize automatically
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when activeBasemap state changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    setBasemapLayer(activeBasemap, mapInstanceRef.current);
  }, [activeBasemap]);

  // Update Center & View on Region Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(center, zoom, { animate: true, duration: 0.8 });
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  }, [center, zoom]);

  // Update Risk Zones GeoJSON Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (riskLayerRef.current) {
      map.removeLayer(riskLayerRef.current);
      riskLayerRef.current = null;
    }

    if (riskGeoJson && showRiskZones) {
      const geoLayer = L.geoJSON(riskGeoJson, {
        style: (feature) => {
          const props = feature?.properties || {};
          return {
            fillColor: props.fillColor || '#10b981',
            fillOpacity: props.fillOpacity || 0.45,
            weight: 1.5,
            color: props.fillColor || '#10b981',
            opacity: 0.7,
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const bd = p.breakdown || {};
          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px;">
              <div style="font-weight: 700; color: #f8fafc; margin-bottom: 4px; display: flex; justify-content: space-between;">
                <span>Cell ${p.cell_id}</span>
                <span style="color: ${p.fillColor}; font-weight: 800;">${p.category} Risk (${p.score})</span>
              </div>
              <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">
                Nearest Thermal Hotspot: ${p.nearest_hotspot_km ? p.nearest_hotspot_km + ' km' : 'None in range'}
              </div>
              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px; font-size: 11px;">
                <div style="color: #cbd5e1; font-weight: 600; margin-bottom: 3px;">Contributing Factor Breakdown:</div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>Thermal Proximity:</span> <b>${bd.thermal_proximity_pct || 0}%</b>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>Low Humidity (RH):</span> <b>${bd.relative_humidity_pct || 0}%</b>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>Temperature:</span> <b>${bd.temperature_pct || 0}%</b>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                  <span>Wind Velocity:</span> <b>${bd.wind_speed_pct || 0}%</b>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span>Vegetation Fuel:</span> <b>${bd.vegetation_fuel_pct || 0}%</b>
                </div>
              </div>
            </div>
          `;
          layer.bindPopup(popupHtml);
        },
      }).addTo(map);

      riskLayerRef.current = geoLayer;
    }
  }, [riskGeoJson, showRiskZones]);

  // Update Hotspots Markers Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const group = hotspotsLayerRef.current;
    if (!map || !group) return;

    group.clearLayers();

    if (showHotspots && hotspots && hotspots.length > 0) {
      hotspots.forEach((h) => {
        // Flame custom SVG icon
        const flameHtml = `
          <div class="flame-marker-pulse" style="cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.9));">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#f97316" stroke="#ef4444" stroke-width="1.8">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          html: flameHtml,
          className: 'custom-flame-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([h.latitude, h.longitude], { icon });

        const popupHtml = `
          <div style="font-family: inherit; font-size: 13px;">
            <div style="font-weight: 700; color: #f97316; margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
              <span>🔥 Active Hotspot: ${h.id}</span>
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">
              ${h.latitude.toFixed(4)}°N, ${h.longitude.toFixed(4)}°E
            </div>
            <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
              <tr><td style="color:#94a3b8; padding: 2px 0;">Observed Time:</td><td style="text-align:right; font-weight:600;">${h.acq_date} ${h.acq_time}</td></tr>
              <tr><td style="color:#94a3b8; padding: 2px 0;">Satellite:</td><td style="text-align:right; font-weight:600;">${h.satellite} (${h.instrument})</td></tr>
              <tr><td style="color:#94a3b8; padding: 2px 0;">Confidence:</td><td style="text-align:right; font-weight:700; color: #f59e0b;">${h.confidence.toUpperCase()} (${(h.confidence_score * 100).toFixed(0)}%)</td></tr>
              <tr><td style="color:#94a3b8; padding: 2px 0;">Brightness Temp:</td><td style="text-align:right; font-weight:600;">${h.brightness ? h.brightness + ' K' : 'N/A'}</td></tr>
              <tr><td style="color:#94a3b8; padding: 2px 0;">Fire Radiative Power:</td><td style="text-align:right; font-weight:600;">${h.frp ? h.frp + ' MW' : 'N/A'}</td></tr>
              <tr><td style="color:#94a3b8; padding: 2px 0;">Data Source:</td><td style="text-align:right; font-size:10px; color:#cbd5e1;">${h.source}</td></tr>
            </table>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          if (onSelectHotspot) onSelectHotspot(h);
        });

        group.addLayer(marker);
      });
    }
  }, [hotspots, showHotspots]);

  // Update Simulation Isochrones GeoJSON Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (simLayerRef.current) {
      map.removeLayer(simLayerRef.current);
      simLayerRef.current = null;
    }

    if (simulationGeoJson && showSimulation) {
      const simLayer = L.geoJSON(simulationGeoJson, {
        style: (feature) => {
          const props = feature?.properties || {};
          return {
            fillColor: props.fillColor || '#ea580c',
            fillOpacity: props.fillOpacity || 0.40,
            color: props.strokeColor || '#fb923c',
            weight: 2.5,
            dashArray: '5, 5',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties || {};
          const popup = `
            <div style="font-family: inherit; font-size: 13px;">
              <div style="font-weight: 700; color: #ea580c; margin-bottom: 2px;">
                ${p.label || 'Simulated Spread Front'}
              </div>
              <div style="font-size: 11px; color: #cbd5e1;">
                Elapsed Time: <b>${p.elapsed_minutes} minutes (${p.hour}h)</b><br/>
                Burned Area: <b>${p.area_sqkm} km²</b><br/>
                Perimeter: <b>${p.perimeter_km} km</b>
              </div>
              <div style="margin-top: 4px; font-size: 10px; color: #94a3b8; font-style: italic;">
                Illustrative simulation — not an operational forecast.
              </div>
            </div>
          `;
          layer.bindPopup(popup);
        },
      }).addTo(map);

      simLayerRef.current = simLayer;
    }
  }, [simulationGeoJson, showSimulation]);

  // Update Ignition Point Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (ignitionMarkerRef.current) {
      map.removeLayer(ignitionMarkerRef.current);
      ignitionMarkerRef.current = null;
    }

    if (selectedIgnitionPoint) {
      const ignitionHtml = `
        <div style="display:flex; align-items:center; justify-content:center; width:30px; height:30px; border:2.5px solid #ef4444; border-radius:50%; background:rgba(239,68,68,0.35); box-shadow: 0 0 12px rgba(239,68,68,0.8);">
          <div style="width:10px; height:10px; background:#ef4444; border-radius:50%;"></div>
        </div>
      `;
      const icon = L.divIcon({
        html: ignitionHtml,
        className: 'ignition-crosshair-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const marker = L.marker(selectedIgnitionPoint, { icon }).addTo(map);
      marker.bindTooltip('Selected Ignition Point', { permanent: true, direction: 'top', offset: [0, -15] });
      ignitionMarkerRef.current = marker;
    }
  }, [selectedIgnitionPoint]);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-charcoal-700 shadow-2xl bg-charcoal-950"
      style={{ height, minHeight: height, width: '100%' }}
    >
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', minHeight: height }}
        className="w-full h-full"
      />

      {/* Floating Coordinate Reader */}
      {mouseCoords && (
        <div className="absolute bottom-3 left-3 z-[1000] glass-panel px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 border border-slate-700/50 flex items-center space-x-2 pointer-events-none">
          <Compass className="w-3.5 h-3.5 text-forest-400" />
          <span>{mouseCoords.lat.toFixed(4)}°N, {mouseCoords.lng.toFixed(4)}°E</span>
        </div>
      )}

      {/* Top Right Controls: Basemap Switcher & Zoom */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col space-y-2">
        {/* Basemap Switcher */}
        <div className="glass-panel-elevated p-1 rounded-lg border border-charcoal-600 flex flex-col space-y-1 shadow-xl">
          <button
            onClick={() => setActiveBasemap('satellite')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1.5 transition-colors ${
              activeBasemap === 'satellite'
                ? 'bg-forest-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-charcoal-700'
            }`}
            title="Satellite World Imagery (Fast)"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Satellite</span>
          </button>
          <button
            onClick={() => setActiveBasemap('osm')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1.5 transition-colors ${
              activeBasemap === 'osm'
                ? 'bg-forest-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-charcoal-700'
            }`}
            title="OpenStreetMap Streets/Terrain"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Streets</span>
          </button>
          <button
            onClick={() => setActiveBasemap('dark')}
            className={`p-1.5 rounded text-xs flex items-center space-x-1.5 transition-colors ${
              activeBasemap === 'dark'
                ? 'bg-forest-600 text-white font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-charcoal-700'
            }`}
            title="CartoDB Dark Matter"
          >
            <Moon className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Dark</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="glass-panel-elevated p-1 rounded-lg border border-charcoal-600 flex flex-col space-y-1 shadow-xl">
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-charcoal-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-charcoal-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              mapInstanceRef.current?.setView(center, zoom);
              mapInstanceRef.current?.invalidateSize();
            }}
            className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-charcoal-700 transition-colors"
            title="Reset View"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map Interactive Hint */}
      <div className="absolute top-4 left-4 z-[1000] glass-panel px-3 py-1.5 rounded-lg text-xs text-slate-300 border border-slate-700/50 pointer-events-none flex items-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-forest-400 animate-ping"></span>
        <span>Click map to designate ignition point</span>
      </div>
    </div>
  );
};
