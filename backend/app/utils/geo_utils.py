"""Geospatial utilities for FireSight AI."""

import math
from typing import Tuple, List, Dict, Any, Optional
from datetime import datetime


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points on Earth in kilometers."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def is_valid_coordinate(lat: float, lon: float) -> bool:
    """Validate latitude and longitude ranges."""
    return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0


def is_point_in_bbox(lat: float, lon: float, min_lat: float, min_lon: float, max_lat: float, max_lon: float) -> bool:
    """Check if point falls within bounding box."""
    return min_lat <= lat <= max_lat and min_lon <= lon <= max_lon


def normalize_iso_timestamp(date_str: str, time_str: Optional[str] = None) -> str:
    """Normalize date and time strings into standard ISO 8601 UTC timestamp."""
    try:
        if "T" in date_str:
            return date_str
        if time_str:
            # Handle FIRMS format like '0815' or '08:15'
            clean_time = time_str.replace(":", "")
            if len(clean_time) == 4:
                hours = int(clean_time[:2])
                mins = int(clean_time[2:])
                dt = datetime.strptime(date_str, "%Y-%m-%d").replace(hour=hours, minute=mins)
                return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        return f"{date_str}T00:00:00Z"
    except Exception:
        return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


def deduplicate_hotspots(hotspots: List[Dict[str, Any]], distance_threshold_km: float = 0.4) -> List[Dict[str, Any]]:
    """Remove duplicate thermal observations within a small spatial radius."""
    unique = []
    for h in hotspots:
        is_dup = False
        lat = h.get("latitude")
        lon = h.get("longitude")
        for u in unique:
            dist = haversine_distance_km(lat, lon, u.get("latitude"), u.get("longitude"))
            if dist < distance_threshold_km and h.get("acq_date") == u.get("acq_date"):
                is_dup = True
                break
        if not is_dup:
            unique.append(h)
    return unique
