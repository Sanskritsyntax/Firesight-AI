"""NASA FIRMS API integration service for active fire and thermal anomaly observations."""

import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings
from app.schemas.models import HotspotRecord, BoundingBox
from app.utils.geo_utils import is_valid_coordinate, is_point_in_bbox, normalize_iso_timestamp, deduplicate_hotspots

logger = logging.getLogger(__name__)


class FirmsService:
    def __init__(self):
        self.map_key = settings.NASA_FIRMS_MAP_KEY
        self.base_url = settings.NASA_FIRMS_BASE_URL
        self.demo_data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "demo", "demo_hotspots.json"
        )
        self._demo_cache = self._load_demo_data()

    def _load_demo_data(self) -> List[Dict[str, Any]]:
        """Load internal verified synthetic demo hotspots."""
        try:
            if os.path.exists(self.demo_data_path):
                with open(self.demo_data_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading demo hotspots file: {e}")
        return []

    async def get_hotspots(
        self,
        bbox: Optional[BoundingBox] = None,
        region_id: Optional[str] = None,
        days: int = 1,
        force_demo: bool = False
    ) -> List[HotspotRecord]:
        """
        Retrieve thermal anomalies.
        If NASA_FIRMS_MAP_KEY is present and force_demo is False, queries the NASA FIRMS REST API.
        Otherwise falls back cleanly to the clearly labelled synthetic demo dataset.
        """
        # If user forced demo or no API key configured, use demo pipeline
        if force_demo or not self.map_key or settings.FORCE_DEMO_MODE:
            logger.info("Using FIRMS synthetic demo observations (no API key configured or demo forced).")
            return self._filter_demo_hotspots(bbox=bbox, region_id=region_id)

        # Attempt to query live NASA FIRMS API
        try:
            # NASA FIRMS area endpoint: /area/csv/[MAP_KEY]/[SOURCE]/[W_S_E_N]/[DAYS]
            # e.g., W_S_E_N = min_lon,min_lat,max_lon,max_lat
            if bbox:
                coord_str = f"{bbox.min_lon},{bbox.min_lat},{bbox.max_lon},{bbox.max_lat}"
            else:
                # Default national bounding box for India: 68.0, 6.5, 97.5, 37.0
                coord_str = "68.0,6.5,97.5,37.0"

            url = f"{self.base_url}/area/csv/{self.map_key}/VIIRS_SNPP_NRT/{coord_str}/{days}"
            
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    lines = response.text.strip().split("\n")
                    if len(lines) > 1:
                        records = self._parse_firms_csv(lines)
                        if records:
                            return records
                    # If empty results returned by FIRMS for this window, return empty or demo if requested
                    logger.info("NASA FIRMS returned 0 active fires for this bounding box.")
                    return []
                elif response.status_code in (401, 403):
                    logger.warning("NASA FIRMS API key invalid or unauthorized. Falling back to labelled demo data.")
                else:
                    logger.warning(f"NASA FIRMS API responded with status {response.status_code}. Using demo fallback.")

        except Exception as e:
            logger.error(f"NASA FIRMS connection error: {e}. Falling back to demo data.")

        return self._filter_demo_hotspots(bbox=bbox, region_id=region_id)

    def _parse_firms_csv(self, lines: List[str]) -> List[HotspotRecord]:
        """Parse raw NASA FIRMS CSV response lines."""
        records = []
        headers = [h.strip().lower() for h in lines[0].split(",")]
        
        for idx, line in enumerate(lines[1:]):
            parts = [p.strip() for p in line.split(",")]
            if len(parts) != len(headers):
                continue
            row = dict(zip(headers, parts))
            
            try:
                lat = float(row.get("latitude", 0))
                lon = float(row.get("longitude", 0))
                if not is_valid_coordinate(lat, lon):
                    continue

                acq_date = row.get("acq_date", datetime.utcnow().strftime("%Y-%m-%d"))
                acq_time = row.get("acq_time", "0000")
                conf_raw = row.get("confidence", "nominal").lower()
                
                # Confidence score mapping
                if conf_raw == "h" or conf_raw == "high":
                    conf_score = 0.90
                    conf_str = "high"
                elif conf_raw == "l" or conf_raw == "low":
                    conf_score = 0.35
                    conf_str = "low"
                else:
                    conf_score = 0.75
                    conf_str = "nominal"

                frp = float(row.get("frp", 0.0)) if row.get("frp") else None
                brightness = float(row.get("bright_ti4", row.get("brightness", 320.0)))

                records.append(
                    HotspotRecord(
                        id=f"FIRMS-{idx+1}",
                        latitude=lat,
                        longitude=lon,
                        brightness=brightness,
                        scan=float(row.get("scan", 0.375)) if row.get("scan") else None,
                        track=float(row.get("track", 0.375)) if row.get("track") else None,
                        acq_date=acq_date,
                        acq_time=acq_time,
                        satellite=row.get("satellite", "VIIRS-SNPP"),
                        instrument=row.get("instrument", "VIIRS"),
                        confidence=conf_str,
                        confidence_score=conf_score,
                        frp=frp,
                        daynight=row.get("daynight", "D"),
                        is_synthetic=False,
                        source="NASA FIRMS Live API (VIIRS 375m)",
                        timestamp=normalize_iso_timestamp(acq_date, acq_time)
                    )
                )
            except Exception as parse_err:
                logger.debug(f"Failed parsing FIRMS row: {parse_err}")

        # Remove duplicates
        dicts = [r.dict() for r in records]
        unique_dicts = deduplicate_hotspots(dicts)
        return [HotspotRecord(**d) for d in unique_dicts]

    def _filter_demo_hotspots(
        self,
        bbox: Optional[BoundingBox] = None,
        region_id: Optional[str] = None
    ) -> List[HotspotRecord]:
        """Filter cached demo hotspots by region or bbox."""
        results = []
        for item in self._demo_cache:
            lat = item["latitude"]
            lon = item["longitude"]
            
            # Check bbox if given
            if bbox:
                if not is_point_in_bbox(lat, lon, bbox.min_lat, bbox.min_lon, bbox.max_lat, bbox.max_lon):
                    continue
            elif region_id:
                if item.get("region_id") != region_id:
                    continue

            results.append(
                HotspotRecord(
                    id=item["id"],
                    latitude=lat,
                    longitude=lon,
                    brightness=item.get("brightness", 335.0),
                    scan=item.get("scan", 0.38),
                    track=item.get("track", 0.36),
                    acq_date=item.get("acq_date", datetime.utcnow().strftime("%Y-%m-%d")),
                    acq_time=item.get("acq_time", "08:15"),
                    satellite=item.get("satellite", "Suomi NPP"),
                    instrument=item.get("instrument", "VIIRS"),
                    confidence=item.get("confidence", "nominal"),
                    confidence_score=item.get("confidence_score", 0.75),
                    frp=item.get("frp", 15.0),
                    daynight=item.get("daynight", "D"),
                    is_synthetic=True,
                    source=item.get("source", "Synthetic Demo (Calibrated to NASA VIIRS 375m)"),
                    timestamp=item.get("timestamp", datetime.utcnow().isoformat() + "Z")
                )
            )
        return results


firms_service = FirmsService()
