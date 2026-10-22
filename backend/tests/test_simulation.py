"""Unit tests for Fire-Spread Simulator."""

import pytest
from app.schemas.models import SimulationRequest
from app.simulation.spread_model import fire_simulator


def test_simulation_deterministic():
    """Verify that identical simulation inputs produce identical results."""
    req = SimulationRequest(
        ignition_lat=21.65,
        ignition_lon=86.35,
        duration_hours=6,
        wind_speed_kmh=25.0,
        wind_direction_deg=60.0,
        spread_rate_multiplier=1.0,
        fuel_density=0.75
    )
    res1 = fire_simulator.run_simulation(req)
    res2 = fire_simulator.run_simulation(req)

    assert res1.total_burned_area_sqkm == res2.total_burned_area_sqkm
    assert res1.estimated_perimeter_km == res2.estimated_perimeter_km
    assert len(res1.steps) == 6
    assert len(res2.steps) == 6


def test_simulation_duration_and_monotonicity():
    """Verify area and perimeter expand monotonically with each passing hour."""
    req = SimulationRequest(
        ignition_lat=21.65,
        ignition_lon=86.35,
        duration_hours=12,
        wind_speed_kmh=20.0,
        wind_direction_deg=45.0
    )
    res = fire_simulator.run_simulation(req)
    assert len(res.steps) == 12

    for i in range(1, len(res.steps)):
        assert res.steps[i].burned_area_sqkm > res.steps[i - 1].burned_area_sqkm
        assert res.steps[i].perimeter_km > res.steps[i - 1].perimeter_km


def test_wind_increases_spread_area():
    """Verify that higher wind speed creates a larger burned area."""
    req_calm = SimulationRequest(
        ignition_lat=21.65,
        ignition_lon=86.35,
        duration_hours=6,
        wind_speed_kmh=5.0,
        wind_direction_deg=0.0
    )
    req_windy = SimulationRequest(
        ignition_lat=21.65,
        ignition_lon=86.35,
        duration_hours=6,
        wind_speed_kmh=40.0,
        wind_direction_deg=0.0
    )
    res_calm = fire_simulator.run_simulation(req_calm)
    res_windy = fire_simulator.run_simulation(req_windy)

    assert res_windy.total_burned_area_sqkm > res_calm.total_burned_area_sqkm
