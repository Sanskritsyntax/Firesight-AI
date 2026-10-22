"""Configuration settings for FireSight AI backend application."""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "FireSight AI"
    APP_VERSION: str = "1.0.0"
    TEAM_NAME: str = "The ByteForce"
    PROBLEM_STATEMENT: str = "PS 11: Automated Forest Fire Prediction & Spread Simulation"
    
    # NASA FIRMS API Credentials
    # Default URL and free MAP_KEY can be supplied via .env. If not set, system seamlessly activates labeled demo mode.
    NASA_FIRMS_MAP_KEY: str = os.getenv("NASA_FIRMS_MAP_KEY", "")
    NASA_FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov/api"
    
    # Open-Meteo API
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1/forecast"
    
    # ISRO VEDAS endpoints / config
    ISRO_VEDAS_ENABLED: bool = True
    ISRO_VEDAS_PORTAL_URL: str = "https://vedas.sac.gov.in/en/"
    
    # Default Operational Mode
    FORCE_DEMO_MODE: bool = False
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]
    
    # Baseline Risk Engine Weights (Documented transparent baseline)
    # Total sum of weights = 1.00
    WEIGHT_HOTSPOT_PROXIMITY: float = 0.35
    WEIGHT_RELATIVE_HUMIDITY: float = 0.20
    WEIGHT_TEMPERATURE: float = 0.15
    WEIGHT_WIND_SPEED: float = 0.15
    WEIGHT_PRECIPITATION_DAMPENER: float = 0.10
    WEIGHT_VEGETATION_FUEL: float = 0.05
    
    # Risk Thresholds
    RISK_THRESHOLD_LOW: float = 0.35
    RISK_THRESHOLD_MEDIUM: float = 0.70  # >= 0.70 is High risk
    
    # Grid Settings
    GRID_DEFAULT_STEP_DEG: float = 0.03  # ~3.3km resolution
    
    # Default Demonstration Regions in India
    DEFAULT_REGION_ID: str = "similipal_odisha"
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
