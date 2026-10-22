"""Baseline forest fire risk scoring model.

Transparent, multi-criteria weighted risk assessment engine.
Uses configurable weights and threshold mappings with explainable factor breakdowns.
"""

import math
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.models import RiskFactorBreakdown
from app.utils.geo_utils import haversine_distance_km


class BaselineRiskModel:
    def __init__(self):
        self.weights = {
            "hotspot": settings.WEIGHT_HOTSPOT_PROXIMITY,
            "rh": settings.WEIGHT_RELATIVE_HUMIDITY,
            "temp": settings.WEIGHT_TEMPERATURE,
            "wind": settings.WEIGHT_WIND_SPEED,
            "precip": settings.WEIGHT_PRECIPITATION_DAMPENER,
            "veg": settings.WEIGHT_VEGETATION_FUEL,
        }
        self.threshold_low = settings.RISK_THRESHOLD_LOW
        self.threshold_medium = settings.RISK_THRESHOLD_MEDIUM

    def calculate_cell_risk(
        self,
        cell_lat: float,
        cell_lon: float,
        hotspots: List[Any],
        temperature_c: Optional[float],
        relative_humidity_pct: Optional[float],
        wind_speed_kmh: Optional[float],
        precipitation_mm: Optional[float],
        vegetation_fuel_factor: Optional[float] = 0.75
    ) -> Dict[str, Any]:
        """
        Calculate composite risk score and factor breakdown for a single spatial cell.
        Handles missing inputs gracefully by dynamically re-weighting available factors.
        """
        available_weights = {}
        factor_values = {}

        # 1. Thermal Hotspot Proximity Factor
        min_dist_km = 999.0
        if hotspots:
            for h in hotspots:
                h_lat = h.latitude if hasattr(h, 'latitude') else h.get('latitude', 0)
                h_lon = h.longitude if hasattr(h, 'longitude') else h.get('longitude', 0)
                d = haversine_distance_km(cell_lat, cell_lon, h_lat, h_lon)
                if d < min_dist_km:
                    min_dist_km = d
            
            # Distance decay: <1km => 1.0, 5km => ~0.35, 12km => ~0.05
            if min_dist_km <= 1.0:
                f_hotspot = 1.0
            elif min_dist_km <= 15.0:
                f_hotspot = math.exp(-(min_dist_km - 1.0) / 4.0)
            else:
                f_hotspot = 0.02
        else:
            f_hotspot = 0.0
            min_dist_km = None

        factor_values["hotspot"] = f_hotspot
        available_weights["hotspot"] = self.weights["hotspot"]

        # 2. Relative Humidity Factor (Inverse: Lower RH => Higher Risk)
        if relative_humidity_pct is not None and not math.isnan(relative_humidity_pct):
            # 15% or lower => 1.0, 75% or higher => 0.05
            clamped_rh = max(10.0, min(80.0, relative_humidity_pct))
            f_rh = (80.0 - clamped_rh) / 70.0
            factor_values["rh"] = max(0.0, min(1.0, f_rh))
            available_weights["rh"] = self.weights["rh"]

        # 3. Temperature Factor (Higher Temp => Higher Risk)
        if temperature_c is not None and not math.isnan(temperature_c):
            # 15C => 0.05, 42C => 1.0
            clamped_temp = max(15.0, min(45.0, temperature_c))
            f_temp = (clamped_temp - 15.0) / 30.0
            factor_values["temp"] = max(0.0, min(1.0, f_temp))
            available_weights["temp"] = self.weights["temp"]

        # 4. Wind Speed Factor (Higher Wind => Higher Risk)
        if wind_speed_kmh is not None and not math.isnan(wind_speed_kmh):
            # 0 km/h => 0.0, 50 km/h => 1.0
            f_wind = min(50.0, max(0.0, wind_speed_kmh)) / 50.0
            factor_values["wind"] = f_wind
            available_weights["wind"] = self.weights["wind"]

        # 5. Precipitation Factor (Dampener: Rain reduces fire risk)
        if precipitation_mm is not None and not math.isnan(precipitation_mm):
            # 0mm => 1.0 (no dampening), >= 5mm => 0.0 (high dampening)
            f_precip = max(0.0, 1.0 - (min(5.0, precipitation_mm) / 5.0))
            factor_values["precip"] = f_precip
            available_weights["precip"] = self.weights["precip"]

        # 6. Vegetation / Fuel Load Factor
        if vegetation_fuel_factor is not None:
            factor_values["veg"] = max(0.0, min(1.0, vegetation_fuel_factor))
            available_weights["veg"] = self.weights["veg"]

        # Re-normalize weights if any factor is missing
        total_active_weight = sum(available_weights.values())
        if total_active_weight == 0:
            return {
                "score": 0.0,
                "category": "Low",
                "factor_breakdown": RiskFactorBreakdown(
                    thermal_proximity_pct=0, relative_humidity_pct=0,
                    temperature_pct=0, wind_speed_pct=0,
                    precipitation_pct=0, vegetation_fuel_pct=0
                ),
                "nearest_hotspot_dist_km": min_dist_km
            }

        # Calculate composite score
        composite_score = sum(
            factor_values[k] * (available_weights[k] / total_active_weight)
            for k in available_weights
        )
        composite_score = max(0.0, min(1.0, composite_score))

        # Categorization based on documented thresholds
        if composite_score >= self.threshold_medium:
            category = "High"
        elif composite_score >= self.threshold_low:
            category = "Medium"
        else:
            category = "Low"

        # Calculate percentage contribution for explainability
        contributions = {}
        for k in available_weights:
            contrib_val = factor_values[k] * (available_weights[k] / total_active_weight)
            contributions[k] = contrib_val

        sum_contrib = sum(contributions.values())
        if sum_contrib > 0:
            breakdown = RiskFactorBreakdown(
                thermal_proximity_pct=round((contributions.get("hotspot", 0) / sum_contrib) * 100, 1),
                relative_humidity_pct=round((contributions.get("rh", 0) / sum_contrib) * 100, 1),
                temperature_pct=round((contributions.get("temp", 0) / sum_contrib) * 100, 1),
                wind_speed_pct=round((contributions.get("wind", 0) / sum_contrib) * 100, 1),
                precipitation_pct=round((contributions.get("precip", 0) / sum_contrib) * 100, 1),
                vegetation_fuel_pct=round((contributions.get("veg", 0) / sum_contrib) * 100, 1),
            )
        else:
            breakdown = RiskFactorBreakdown(
                thermal_proximity_pct=16.6, relative_humidity_pct=16.6,
                temperature_pct=16.6, wind_speed_pct=16.6,
                precipitation_pct=16.6, vegetation_fuel_pct=17.0
            )

        return {
            "score": round(composite_score, 3),
            "category": category,
            "factor_breakdown": breakdown,
            "nearest_hotspot_dist_km": round(min_dist_km, 2) if min_dist_km is not None else None
        }


baseline_risk_model = BaselineRiskModel()
