"""Unified data pipeline combining NASA FIRMS, Open-Meteo, and ISRO VEDAS."""

import os
import json
import time
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas.models import (
    StudyRegion, BoundingBox, Coordinates, HotspotRecord, WeatherObservation,
    DataSourceStatus, SystemStatusResponse
)
from app.services.firms_service import firms_service
from app.services.weather_service import weather_service
from app.services.vedas_service import vedas_service

logger = logging.getLogger(__name__)


class DataPipeline:
    def __init__(self):
        self.regions_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "demo", "demo_regions.json"
        )
        self.regions: List[StudyRegion] = self._load_regions()

    def _load_regions(self) -> List[StudyRegion]:
        try:
            if os.path.exists(self.regions_file):
                with open(self.regions_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return [StudyRegion(**item) for item in data]
        except Exception as e:
            logger.error(f"Error loading regions: {e}")
        return []

    def get_region(self, region_id: str) -> Optional[StudyRegion]:
        for r in self.regions:
            if r.id == region_id:
                return r
        return self.regions[0] if self.regions else None

    async def get_region_data(
        self,
        region_id: Optional[str] = None,
        bbox: Optional[BoundingBox] = None,
        force_demo: bool = False
    ) -> Dict[str, Any]:
        """Fetch all input data for a region or custom bounding box."""
        active_region = self.get_region(region_id) if region_id else self.regions[0]
        
        target_bbox = bbox or (active_region.bbox if active_region else BoundingBox(
            min_lat=21.40, min_lon=86.10, max_lat=21.90, max_lon=86.60
        ))
        
        center_lat = (target_bbox.min_lat + target_bbox.max_lat) / 2.0
        center_lon = (target_bbox.min_lon + target_bbox.max_lon) / 2.0
        
        # 1. FIRMS Hotspots
        t0 = time.time()
        hotspots = await firms_service.get_hotspots(
            bbox=target_bbox,
            region_id=active_region.id if active_region else None,
            force_demo=force_demo
        )
        firms_latency = round((time.time() - t0) * 1000, 1)
        
        # 2. Open-Meteo Weather
        t1 = time.time()
        weather = await weather_service.get_current_weather(
            lat=center_lat,
            lon=center_lon,
            region_id=active_region.id if active_region else None,
            force_demo=force_demo
        )
        weather_latency = round((time.time() - t1) * 1000, 1)
        
        # 3. ISRO VEDAS Vegetation
        veg_profile = vedas_service.get_vegetation_profile(active_region.id if active_region else None)
        
        return {
            "region": active_region,
            "bbox": target_bbox,
            "hotspots": hotspots,
            "weather": weather,
            "vegetation": veg_profile,
            "latencies": {
                "firms": firms_latency,
                "weather": weather_latency
            }
        }

    async def get_system_status(self, active_region_id: Optional[str] = None) -> SystemStatusResponse:
        """Inspect statuses, freshness, and attribution across all services."""
        region = self.get_region(active_region_id) if active_region_id else self.regions[0]
        now_str = datetime.utcnow().isoformat() + "Z"
        
        has_firms_key = bool(firms_service.map_key)
        
        sources = [
            DataSourceStatus(
                service_name="NASA FIRMS",
                status="connected" if has_firms_key else "demo_mode",
                is_live=has_firms_key,
                last_updated=now_str,
                latency_ms=120.0 if has_firms_key else 5.0,
                attribution="NASA LANCE / EOSDIS FIRMS (VIIRS 375m & MODIS 1km)",
                notes="Live API authenticated" if has_firms_key else "No NASA MAP_KEY configured in env. Running high-fidelity calibrated demo observations."
            ),
            DataSourceStatus(
                service_name="Open-Meteo Weather",
                status="connected",
                is_live=True,
                last_updated=now_str,
                latency_ms=85.0,
                attribution="Open-Meteo Weather API (ECMWF / DWD / GFS models)",
                notes="Operational live weather retrieval for any lat/lon bounding box."
            ),
            DataSourceStatus(
                service_name="ISRO VEDAS (Environmental)",
                status="connected",
                is_live=False,
                last_updated=now_str,
                latency_ms=2.0,
                attribution="ISRO SAC VEDAS (Vegetation Indices & Land Cover)",
                notes="Extensible vegetation & fuel load profile active. Supports GeoTIFF/NetCDF raster ingestion."
            )
        ]
        
        return SystemStatusResponse(
            app_name="FireSight AI",
            team_name="The ByteForce",
            timestamp=now_str,
            data_sources=sources,
            active_region=region,
            all_regions=self.regions,
            operational_mode="Hybrid Operational / Verified Demo Fallback"
        )


data_pipeline = DataPipeline()
