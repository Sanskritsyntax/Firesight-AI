"""Open-Meteo forecast API integration service for real-time and forecast fire weather."""

import os
import json
import logging
import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime
from app.config import settings
from app.schemas.models import WeatherObservation, BoundingBox

logger = logging.getLogger(__name__)


class WeatherService:
    def __init__(self):
        self.base_url = settings.OPEN_METEO_BASE_URL
        self.demo_data_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "data", "demo", "demo_weather.json"
        )
        self._demo_cache = self._load_demo_data()

    def _load_demo_data(self) -> Dict[str, Any]:
        """Load internal fallback demo weather."""
        try:
            if os.path.exists(self.demo_data_path):
                with open(self.demo_data_path, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading demo weather file: {e}")
        return {}

    async def get_current_weather(
        self,
        lat: float,
        lon: float,
        region_id: Optional[str] = None,
        force_demo: bool = False
    ) -> WeatherObservation:
        """Fetch current weather for a spatial point or region centroid."""
        if force_demo or settings.FORCE_DEMO_MODE:
            logger.info("Using demo weather data (forced demo mode).")
            return self._get_fallback_weather(region_id)

        try:
            params = {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover",
                "wind_speed_unit": "kmh",
                "timeformat": "iso8601"
            }
            
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    curr = data.get("current", {})
                    return WeatherObservation(
                        temperature_c=float(curr.get("temperature_2m", 30.0)),
                        relative_humidity_pct=float(curr.get("relative_humidity_2m", 35.0)),
                        wind_speed_kmh=float(curr.get("wind_speed_10m", 15.0)),
                        wind_direction_deg=float(curr.get("wind_direction_10m", 45.0)),
                        precipitation_mm=float(curr.get("precipitation", 0.0)),
                        cloud_cover_pct=float(curr.get("cloud_cover", 0.0)),
                        timestamp=curr.get("time", datetime.utcnow().isoformat() + "Z"),
                        is_forecast=False,
                        is_synthetic=False,
                        source="Open-Meteo Live API",
                        spatial_method="Region Centroid Point Association"
                    )
                else:
                    logger.warning(f"Open-Meteo returned status {res.status_code}. Using fallback demo weather.")
        except Exception as e:
            logger.error(f"Error querying Open-Meteo: {e}. Falling back to demo weather.")

        return self._get_fallback_weather(region_id)

    async def get_forecast_steps(
        self,
        lat: float,
        lon: float,
        region_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch forecast weather time steps (+6h, +12h, +24h).
        Returns a list of step weather observations.
        """
        try:
            params = {
                "latitude": round(lat, 4),
                "longitude": round(lon, 4),
                "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m",
                "wind_speed_unit": "kmh",
                "forecast_days": 2,
                "timeformat": "iso8601"
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    hourly = data.get("hourly", {})
                    times = hourly.get("time", [])
                    
                    # Current index is roughly index 0 (or find closest current hour)
                    indices = [0, 6, 12, 24]
                    steps = []
                    labels = ["Now (T+0)", "+6 Hours", "+12 Hours", "+24 Hours"]
                    step_ids = ["now", "plus_6h", "plus_12h", "plus_24h"]
                    
                    for s_id, label, idx in zip(step_ids, labels, indices):
                        if idx < len(times):
                            t_str = times[idx]
                            temp = float(hourly["temperature_2m"][idx])
                            rh = float(hourly["relative_humidity_2m"][idx])
                            precip = float(hourly["precipitation"][idx])
                            wind_spd = float(hourly["wind_speed_10m"][idx])
                            wind_dir = float(hourly["wind_direction_10m"][idx])
                            
                            obs = WeatherObservation(
                                temperature_c=temp,
                                relative_humidity_pct=rh,
                                wind_speed_kmh=wind_spd,
                                wind_direction_deg=wind_dir,
                                precipitation_mm=precip,
                                cloud_cover_pct=0.0,
                                timestamp=t_str,
                                is_forecast=(idx > 0),
                                is_synthetic=False,
                                source="Open-Meteo Hourly Forecast",
                                spatial_method="Centroid Forecast Point Association"
                            )
                            steps.append({
                                "step_id": s_id,
                                "label": label,
                                "weather": obs,
                                "is_forecast": (idx > 0)
                            })
                    if len(steps) == 4:
                        return steps
        except Exception as e:
            logger.error(f"Error fetching Open-Meteo forecast: {e}")

        # Fallback synthetic forecast steps
        base = self._get_fallback_weather(region_id)
        now_dt = datetime.utcnow()
        return [
            {
                "step_id": "now",
                "label": "Now (T+0)",
                "weather": base,
                "is_forecast": False
            },
            {
                "step_id": "plus_6h",
                "label": "+6 Hours",
                "weather": WeatherObservation(
                    temperature_c=round(base.temperature_c + 2.5, 1),
                    relative_humidity_pct=max(15.0, round(base.relative_humidity_pct - 8.0, 1)),
                    wind_speed_kmh=round(base.wind_speed_kmh + 4.0, 1),
                    wind_direction_deg=(base.wind_direction_deg + 15) % 360,
                    precipitation_mm=0.0,
                    timestamp=now_dt.isoformat() + "Z",
                    is_forecast=True,
                    is_synthetic=True,
                    source="Synthetic Demo Forecast Model"
                ),
                "is_forecast": True
            },
            {
                "step_id": "plus_12h",
                "label": "+12 Hours",
                "weather": WeatherObservation(
                    temperature_c=round(base.temperature_c - 5.0, 1),
                    relative_humidity_pct=min(75.0, round(base.relative_humidity_pct + 18.0, 1)),
                    wind_speed_kmh=max(5.0, round(base.wind_speed_kmh - 6.0, 1)),
                    wind_direction_deg=(base.wind_direction_deg + 30) % 360,
                    precipitation_mm=0.0,
                    timestamp=now_dt.isoformat() + "Z",
                    is_forecast=True,
                    is_synthetic=True,
                    source="Synthetic Demo Forecast Model"
                ),
                "is_forecast": True
            },
            {
                "step_id": "plus_24h",
                "label": "+24 Hours",
                "weather": WeatherObservation(
                    temperature_c=round(base.temperature_c + 1.2, 1),
                    relative_humidity_pct=max(20.0, round(base.relative_humidity_pct - 4.0, 1)),
                    wind_speed_kmh=round(base.wind_speed_kmh + 2.0, 1),
                    wind_direction_deg=base.wind_direction_deg,
                    precipitation_mm=0.0,
                    timestamp=now_dt.isoformat() + "Z",
                    is_forecast=True,
                    is_synthetic=True,
                    source="Synthetic Demo Forecast Model"
                ),
                "is_forecast": True
            }
        ]

    def _get_fallback_weather(self, region_id: Optional[str] = None) -> WeatherObservation:
        """Return cached baseline demo weather."""
        reg_key = region_id if (region_id and region_id in self._demo_cache) else "similipal_odisha"
        item = self._demo_cache.get(reg_key, {
            "temperature_c": 32.0,
            "relative_humidity_pct": 30.0,
            "wind_speed_kmh": 20.0,
            "wind_direction_deg": 45.0,
            "precipitation_mm": 0.0,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "is_synthetic": True,
            "source": "Fallback Demo Weather"
        })
        return WeatherObservation(
            temperature_c=item["temperature_c"],
            relative_humidity_pct=item["relative_humidity_pct"],
            wind_speed_kmh=item["wind_speed_kmh"],
            wind_direction_deg=item["wind_direction_deg"],
            precipitation_mm=item.get("precipitation_mm", 0.0),
            cloud_cover_pct=item.get("cloud_cover_pct", 0.0),
            timestamp=item.get("timestamp", datetime.utcnow().isoformat() + "Z"),
            is_forecast=False,
            is_synthetic=True,
            source=item.get("source", "Synthetic Demo Weather"),
            spatial_method="Area-Weighted Demonstration Fallback"
        )


weather_service = WeatherService()
