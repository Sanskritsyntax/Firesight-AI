"""ISRO VEDAS environmental and vegetation data service.

Provides modular interface for vegetation indices (NDVI), forest canopy density,
and fuel dryness from ISRO VEDAS (Visualisation of Earth observation Data and Archival System).
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class VedasService:
    def __init__(self):
        self.portal_url = "https://vedas.sac.gov.in/en/"
        # Base vegetation fuel load estimations by region biome
        self.biome_profiles = {
            "similipal_odisha": {
                "biome": "Moist Deciduous Sal",
                "mean_ndvi": 0.68,
                "fuel_density_factor": 0.85,
                "canopy_cover_pct": 72.0,
                "source": "ISRO VEDAS AWiFS Derived Biome Profile (Demo Layer)"
            },
            "bandipur_karnataka": {
                "biome": "Dry Deciduous & Scrub",
                "mean_ndvi": 0.52,
                "fuel_density_factor": 0.70,
                "canopy_cover_pct": 54.0,
                "source": "ISRO VEDAS AWiFS Derived Biome Profile (Demo Layer)"
            },
            "corbett_uttarakhand": {
                "biome": "Sub-Himalayan Sal & Chir Pine",
                "mean_ndvi": 0.74,
                "fuel_density_factor": 0.90,
                "canopy_cover_pct": 78.0,
                "source": "ISRO VEDAS AWiFS Derived Biome Profile (Demo Layer)"
            },
            "gir_gujarat": {
                "biome": "Dry Deciduous Teak & Scrub",
                "mean_ndvi": 0.41,
                "fuel_density_factor": 0.60,
                "canopy_cover_pct": 38.0,
                "source": "ISRO VEDAS AWiFS Derived Biome Profile (Demo Layer)"
            }
        }

    def get_vegetation_profile(self, region_id: Optional[str] = None) -> Dict[str, Any]:
        """Get vegetation and fuel parameters for the study region."""
        if region_id and region_id in self.biome_profiles:
            return self.biome_profiles[region_id]
        
        return {
            "biome": "Mixed Deciduous Forest",
            "mean_ndvi": 0.60,
            "fuel_density_factor": 0.75,
            "canopy_cover_pct": 60.0,
            "source": "ISRO VEDAS Biome Baseline"
        }

    def get_import_spec(self) -> Dict[str, Any]:
        """Documentation for manual or automated ingestion of ISRO VEDAS geospatial rasters."""
        return {
            "portal": self.portal_url,
            "recommended_products": [
                "Forest Fire Risk and Alert System (ISRO SAC)",
                "AWiFS NDVI 10-day composite",
                "LISS-III Forest Canopy Density (FCD)",
                "Desertification & Land Degradation Atlas of India"
            ],
            "supported_formats": ["GeoTIFF (.tif)", "NetCDF (.nc)", "GeoJSON"],
            "coordinate_reference_system": "EPSG:4326 (WGS84)"
        }


vedas_service = VedasService()
