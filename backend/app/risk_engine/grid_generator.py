"""Grid generator for spatial forest fire risk assessment."""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.schemas.models import BoundingBox, WeatherObservation, HotspotRecord
from app.risk_engine.baseline_model import baseline_risk_model

logger = logging.getLogger(__name__)


class GridGenerator:
    def __init__(self):
        pass

    def generate_risk_grid(
        self,
        bbox: BoundingBox,
        weather: WeatherObservation,
        hotspots: List[HotspotRecord],
        fuel_factor: float = 0.75,
        step_deg: float = 0.03
    ) -> Dict[str, Any]:
        """
        Generate spatial risk grid covering bbox with given step_deg.
        Returns GeoJSON FeatureCollection and category counts.
        """
        features = []
        counts = {"Low": 0, "Medium": 0, "High": 0}
        total_score = 0.0
        cells_detail = []

        lat_steps = int((bbox.max_lat - bbox.min_lat) / step_deg) + 1
        lon_steps = int((bbox.max_lon - bbox.min_lon) / step_deg) + 1

        # Prevent runaway grids if bbox is too large
        if lat_steps * lon_steps > 1600:
            step_deg = max((bbox.max_lat - bbox.min_lat), (bbox.max_lon - bbox.min_lon)) / 25.0

        lat = bbox.min_lat
        cell_index = 0

        while lat < bbox.max_lat:
            lon = bbox.min_lon
            next_lat = min(bbox.max_lat, lat + step_deg)
            center_lat = (lat + next_lat) / 2.0

            while lon < bbox.max_lon:
                next_lon = min(bbox.max_lon, lon + step_deg)
                center_lon = (lon + next_lon) / 2.0
                cell_index += 1

                # Calculate cell risk
                risk = baseline_risk_model.calculate_cell_risk(
                    cell_lat=center_lat,
                    cell_lon=center_lon,
                    hotspots=hotspots,
                    temperature_c=weather.temperature_c,
                    relative_humidity_pct=weather.relative_humidity_pct,
                    wind_speed_kmh=weather.wind_speed_kmh,
                    precipitation_mm=weather.precipitation_mm,
                    vegetation_fuel_factor=fuel_factor
                )

                score = risk["score"]
                category = risk["category"]
                breakdown = risk["factor_breakdown"]
                dist = risk["nearest_hotspot_dist_km"]

                counts[category] = counts.get(category, 0) + 1
                total_score += score

                cell_id = f"CELL-{cell_index:04d}"

                # Polygon coordinates in GeoJSON format: [[ [lon, lat], [lon, lat], ... ]]
                poly_coords = [
                    [
                        [round(lon, 4), round(lat, 4)],
                        [round(next_lon, 4), round(lat, 4)],
                        [round(next_lon, 4), round(next_lat, 4)],
                        [round(lon, 4), round(next_lat, 4)],
                        [round(lon, 4), round(lat, 4)]
                    ]
                ]

                # Color mapping: Green for low, amber/yellow for medium, red for high
                if category == "High":
                    fill_color = "#ef4444"
                elif category == "Medium":
                    fill_color = "#f59e0b"
                else:
                    fill_color = "#10b981"

                feature = {
                    "type": "Feature",
                    "id": cell_id,
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": poly_coords
                    },
                    "properties": {
                        "cell_id": cell_id,
                        "center": [round(center_lat, 4), round(center_lon, 4)],
                        "score": score,
                        "category": category,
                        "fillColor": fill_color,
                        "fillOpacity": 0.40 if category == "Low" else (0.55 if category == "Medium" else 0.70),
                        "nearest_hotspot_km": dist,
                        "breakdown": breakdown.dict()
                    }
                }
                features.append(feature)

                cells_detail.append({
                    "cell_id": cell_id,
                    "latitude": round(center_lat, 4),
                    "longitude": round(center_lon, 4),
                    "score": score,
                    "category": category,
                    "nearest_hotspot_km": dist,
                    "dominant_factor": max(breakdown.dict().items(), key=lambda x: x[1])[0].replace("_pct", "")
                })

                lon += step_deg
            lat += step_deg

        total_cells = len(features)
        avg_score = round(total_score / total_cells, 3) if total_cells > 0 else 0.0

        percentages = {
            k: round((counts[k] / total_cells) * 100, 1) if total_cells > 0 else 0.0
            for k in counts
        }

        # Sort highest risk cells
        cells_detail.sort(key=lambda x: x["score"], reverse=True)
        top_risk_cells = cells_detail[:10]

        geojson = {
            "type": "FeatureCollection",
            "features": features
        }

        return {
            "total_cells": total_cells,
            "counts": counts,
            "percentages": percentages,
            "average_score": avg_score,
            "geojson": geojson,
            "highest_risk_cells": top_risk_cells
        }


grid_generator = GridGenerator()
