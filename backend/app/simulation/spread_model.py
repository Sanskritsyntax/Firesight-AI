"""Fire-Spread Simulation Engine (6 - 12 Hours).

Implements deterministic Huygens elliptical wave propagation / cellular automata.
Incorporates wind vector (speed & direction), fuel density, and Rothermel-Alexander
length-to-width ratio ellipse geometry.
"""

import math
import uuid
from typing import Dict, Any, List, Tuple
from app.schemas.models import (
    SimulationRequest, SimulationResponse, SimulationStep, Coordinates
)


class FireSpreadSimulator:
    def __init__(self):
        # Base spread rate in still air: ~0.15 km/h for dry deciduous fuel bed
        self.BASE_SPREAD_KMH = 0.15

    def run_simulation(self, req: SimulationRequest) -> SimulationResponse:
        """
        Execute deterministic spatial fire propagation scenario.
        Computes arrival times and hourly polygon perimeters for 6 or 12 hours.
        """
        sim_id = f"SIM-{uuid.uuid4().hex[:8].upper()}"
        duration = req.duration_hours
        ign_lat = req.ignition_lat
        ign_lon = req.ignition_lon
        wind_spd = req.wind_speed_kmh
        wind_dir = req.wind_direction_deg
        fuel = req.fuel_density
        mult = req.spread_rate_multiplier

        # 1. Alexander Elliptical Fire Spread Geometry
        # Length-to-width ratio (L/W) of fire ellipse based on wind speed (km/h)
        # For wind speed 0: circular (LW=1.0). For wind speed 30: elongated (LW ~ 2.1)
        lw_ratio = 1.0 + 0.0012 * (wind_spd ** 1.8)
        eccentricity = math.sqrt(max(0.0, 1.0 - (1.0 / (lw_ratio ** 2))))

        # Forward spread rate Rf (km/h)
        # Wind factor accelerates forward spread
        wind_accel = 1.0 + 0.04 * (wind_spd ** 1.15)
        rf = self.BASE_SPREAD_KMH * wind_accel * fuel * mult

        # Flanking spread rate (semi-minor axis b)
        b_rate = rf / lw_ratio

        # Backing spread rate (against the wind)
        rb = rf * (1.0 - eccentricity) / (1.0 + eccentricity) if eccentricity < 0.99 else (rf * 0.1)

        # Semi-major axis a = (Rf + Rb) / 2
        a_rate = (rf + rb) / 2.0
        # Offset of ignition point from ellipse center: c = a - Rb
        c_rate = a_rate - rb

        # Direction angle in radians:
        # Note: Wind direction is typically given as direction wind is COMING FROM (meteorological).
        # Fire blows towards (wind_dir + 180) degrees.
        fire_heading_deg = (wind_dir + 180.0) % 360.0
        heading_rad = math.radians(fire_heading_deg)

        # Conversion: 1 degree latitude ~ 111.0 km, 1 degree longitude ~ 111.0 * cos(lat) km
        deg_lat_km = 110.574
        deg_lon_km = 111.320 * math.cos(math.radians(ign_lat))

        steps: List[SimulationStep] = []
        total_burned_area = 0.0
        total_perimeter = 0.0
        total_cells_count = 0

        # Generate hourly progression steps (t = 0 to t = duration)
        # Colors progress from bright ignition core to expanding perimeter
        color_progression = [
            "#dc2626", # 0h: ignition scarlet
            "#ea580c", # 1h
            "#f97316", # 2h
            "#fb923c", # 3h
            "#f59e0b", # 4h
            "#eab308", # 5h
            "#d97706", # 6h
            "#b45309", # 7h
            "#92400e", # 8h
            "#78350f", # 9h
            "#7c2d12", # 10h
            "#6b21a8", # 11h
            "#581c87"  # 12h: purple boundary
        ]

        # Discrete points to generate smooth polygon perimeter around ellipse
        num_perimeter_points = 36

        for hour in range(1, duration + 1):
            elapsed_hours = float(hour)
            elapsed_mins = hour * 60

            # Scale ellipse dimensions for this time step
            a_t = a_rate * elapsed_hours  # semi-major axis in km
            b_t = b_rate * elapsed_hours  # semi-minor axis in km
            c_t = c_rate * elapsed_hours  # center displacement along wind heading in km

            # Area of ellipse: pi * a * b
            area_sqkm = round(math.pi * a_t * b_t, 2)
            # Ramanujan approximation for ellipse perimeter
            h_val = ((a_t - b_t) / (a_t + b_t)) ** 2 if (a_t + b_t) > 0 else 0
            perim_km = round(math.pi * (a_t + b_t) * (1.0 + (3.0 * h_val) / (10.0 + math.sqrt(4.0 - 3.0 * h_val))), 2)

            # Cells burned estimate based on ~200m spatial grid
            cells_in_step = int(area_sqkm / 0.04)

            # Calculate ellipse center coordinates displaced downwind from ignition point
            center_x_km = c_t * math.sin(heading_rad)
            center_y_km = c_t * math.cos(heading_rad)

            center_lat = ign_lat + (center_y_km / deg_lat_km)
            center_lon = ign_lon + (center_x_km / deg_lon_km)

            # Generate perimeter coordinates
            coords = []
            for i in range(num_perimeter_points + 1):
                angle = (2.0 * math.pi / num_perimeter_points) * i
                # Point on unrotated ellipse centered at (0, 0)
                px_local = b_t * math.sin(angle)
                py_local = a_t * math.cos(angle)

                # Rotate by heading angle
                # x' = x*cos + y*sin, y' = -x*sin + y*cos
                rot_x = px_local * math.cos(heading_rad) + py_local * math.sin(heading_rad)
                rot_y = -px_local * math.sin(heading_rad) + py_local * math.cos(heading_rad)

                # Convert to lat / lon
                p_lat = center_lat + (rot_y / deg_lat_km)
                p_lon = center_lon + (rot_x / deg_lon_km)
                coords.append([round(p_lon, 5), round(p_lat, 5)])

            # Feature for this hourly isochrone
            step_color = color_progression[min(hour, len(color_progression) - 1)]
            feature = {
                "type": "Feature",
                "id": f"isochrone-{hour}h",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coords]
                },
                "properties": {
                    "hour": hour,
                    "elapsed_minutes": elapsed_mins,
                    "area_sqkm": area_sqkm,
                    "perimeter_km": perim_km,
                    "strokeColor": step_color,
                    "fillColor": step_color,
                    "fillOpacity": 0.25,
                    "label": f"T+{hour}h Front"
                }
            }

            step_geojson = {
                "type": "FeatureCollection",
                "features": [feature]
            }

            steps.append(
                SimulationStep(
                    elapsed_minutes=elapsed_mins,
                    elapsed_hours=elapsed_hours,
                    cumulative_cells_burned=cells_in_step,
                    burned_area_sqkm=area_sqkm,
                    perimeter_km=perim_km,
                    geojson=step_geojson
                )
            )

            total_burned_area = area_sqkm
            total_perimeter = perim_km
            total_cells_count = cells_in_step

        assumptions = {
            "algorithm": "Modified Rothermel-Alexander Huygens Wave Propagation (Elliptical)",
            "length_to_width_ratio": round(lw_ratio, 2),
            "forward_rate_kmh": round(rf, 3),
            "flanking_rate_kmh": round(b_rate, 3),
            "backing_rate_kmh": round(rb, 3),
            "fuel_model": f"Dry Deciduous Forest (Density Factor {fuel})",
            "spread_multiplier": req.spread_rate_multiplier,
            "wind_heading_deg": round(fire_heading_deg, 1),
            "limitations": "Model assumes uniform flat terrain and continuous fuel. Does not model sudden wind shifts, spotting, or suppression intervention."
        }

        return SimulationResponse(
            simulation_id=sim_id,
            ignition_point=Coordinates(latitude=ign_lat, longitude=ign_lon),
            duration_hours=duration,
            wind_speed_kmh=wind_spd,
            wind_direction_deg=wind_dir,
            total_burned_area_sqkm=total_burned_area,
            total_cells_burned=total_cells_count,
            estimated_perimeter_km=total_perimeter,
            steps=steps,
            model_assumptions=assumptions
        )


fire_simulator = FireSpreadSimulator()
