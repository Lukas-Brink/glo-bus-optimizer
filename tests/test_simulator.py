"""
Unit tests for GloBus-Pilot simulator & optimizer suite
"""

import sys
import os
import unittest

# Add simulator folder to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'simulator')))

from globus_model import (
    GloBusCompanySimulation,
    CameraDesign,
    DroneDesign,
    WorkforceCompensation,
    FinancialDecisions,
    RegionalMarketing
)
from optimizer import OfflineOptimizer
from strategies import STRATEGY_PRESETS


class TestGloBusSimulation(unittest.TestCase):
    def setUp(self):
        self.sim = GloBusCompanySimulation()
        self.opt = OfflineOptimizer()

    def test_camera_pq_rating_bounds(self):
        # Baseline high quality
        design = CameraDesign(megapixels=16.0, lcd_display=2.5, lens_zoom=4.0, photo_modes=5, cumulative_rd=50000.0)
        pq = self.sim.calculate_camera_pq(design)
        self.assertGreaterEqual(pq, 1.0)
        self.assertLessEqual(pq, 10.0)
        self.assertGreater(pq, 5.0)

        # Low spec camera
        low_design = CameraDesign(megapixels=8.0, lcd_display=1.5, lens_zoom=2.0, photo_modes=2, cumulative_rd=0.0)
        low_pq = self.sim.calculate_camera_pq(low_design)
        self.assertLess(low_pq, pq)
        self.assertGreaterEqual(low_pq, 1.0)

    def test_drone_pq_rating_bounds(self):
        # Premium drone
        design = DroneDesign(camera_quality="4K", frame_material="Carbon", battery_flight_time=30, cumulative_rd=50000.0)
        pq = self.sim.calculate_drone_pq(design)
        self.assertGreaterEqual(pq, 1.0)
        self.assertLessEqual(pq, 10.0)
        self.assertGreater(pq, 6.0)

        # Economy drone
        econ_design = DroneDesign(camera_quality="Built-in", frame_material="Plastic", battery_flight_time=15, cumulative_rd=0.0)
        econ_pq = self.sim.calculate_drone_pq(econ_design)
        self.assertLess(econ_pq, pq)

    def test_workforce_productivity_and_robotics(self):
        # Workforce with robotics
        wf_robotics = WorkforceCompensation(base_wage=30000.0, assembly_incentive=4.0, robotics_upgrade=True)
        prod_rob, defect_rob = self.sim.calculate_workforce_productivity(wf_robotics)
        self.assertGreater(prod_rob, 2000.0)
        self.assertLess(defect_rob, 5.0)

        # Workforce without robotics
        wf_standard = WorkforceCompensation(base_wage=30000.0, assembly_incentive=4.0, robotics_upgrade=False)
        prod_std, defect_std = self.sim.calculate_workforce_productivity(wf_standard)
        self.assertGreater(prod_rob, prod_std, "Robotics upgrade must increase employee productivity")

    def test_demand_price_elasticity(self):
        cam = STRATEGY_PRESETS["grand_champion"]["camera_design"]
        drone = STRATEGY_PRESETS["grand_champion"]["drone_design"]
        wf = STRATEGY_PRESETS["grand_champion"]["workforce"]
        fin = STRATEGY_PRESETS["grand_champion"]["finance"]

        mktg_cheap = {r.name: RegionalMarketing(camera_price=260.0, drone_price=1050.0) for r in self.sim.regions}
        mktg_expensive = {r.name: RegionalMarketing(camera_price=450.0, drone_price=1750.0) for r in self.sim.regions}

        res_cheap = self.sim.simulate_pro_forma(cam, drone, mktg_cheap, wf, fin)
        res_exp = self.sim.simulate_pro_forma(cam, drone, mktg_expensive, wf, fin)

        self.assertGreater(res_cheap["total_camera_units"], res_exp["total_camera_units"], "Lower camera price must sell more units")
        self.assertGreater(res_cheap["total_drone_units"], res_exp["total_drone_units"], "Lower drone price must sell more units")

    def test_strategy_presets_integrity(self):
        required_keys = ["title", "summary", "camera_design", "drone_design", "workforce", "finance"]
        for preset_name, preset in STRATEGY_PRESETS.items():
            for key in required_keys:
                self.assertIn(key, preset, f"Preset '{preset_name}' missing key '{key}'")

            cam = preset["camera_design"]
            drone = preset["drone_design"]
            wf = preset["workforce"]
            fin = preset["finance"]

            self.assertIsInstance(cam, CameraDesign)
            self.assertIsInstance(drone, DroneDesign)
            self.assertIsInstance(wf, WorkforceCompensation)
            self.assertIsInstance(fin, FinancialDecisions)

            self.assertGreater(cam.megapixels, 0)
            self.assertGreater(drone.battery_flight_time, 0)
            self.assertGreater(wf.base_wage, 0)
            self.assertGreater(fin.beginning_cash, 0)

    def test_offline_optimizer_grand_champion(self):
        cam = STRATEGY_PRESETS["grand_champion"]["camera_design"]
        drone = STRATEGY_PRESETS["grand_champion"]["drone_design"]
        wf = STRATEGY_PRESETS["grand_champion"]["workforce"]

        marketing, finance, metrics = self.opt.optimize_marketing_and_finance(cam, drone, wf, preset="balanced")

        self.assertGreater(metrics["eps"], 0.0)
        self.assertGreater(metrics["roe"], 0.0)
        self.assertGreater(metrics["stock_price"], 0.0)
        self.assertGreaterEqual(metrics["ending_cash"], 2500.0, "Must satisfy $2,500k cash guardrail")
        self.assertIn(metrics["credit_rating"], ["A+", "A", "A-", "B+"])
        self.assertGreaterEqual(metrics["image_rating"], 70)

    def test_scoring_composite_utility(self):
        healthy_metrics = {
            "eps": 5.50,
            "roe": 35.0,
            "stock_price": 75.0,
            "credit_rating_score": 90.0,
            "credit_rating": "A-",
            "image_rating": 80.0,
            "ending_cash": 4500.0
        }
        score_healthy = self.opt.evaluate_composite_score(healthy_metrics, preset="balanced")
        self.assertGreater(score_healthy, 0.0)

        # Overdraft penalty test
        overdraft_metrics = {
            "eps": 5.50,
            "roe": 35.0,
            "stock_price": 75.0,
            "credit_rating_score": 90.0,
            "credit_rating": "A-",
            "image_rating": 80.0,
            "ending_cash": -1000.0
        }
        score_overdraft = self.opt.evaluate_composite_score(overdraft_metrics, preset="balanced")
        self.assertLess(score_overdraft, score_healthy, "Overdraft must trigger steep utility penalty")

    def test_cli_smoke_run(self):
        from run_cli import run_simulation
        res = run_simulation("grand_champion")
        self.assertIsNotNone(res)
        self.assertIn("metrics", res)
        self.assertGreater(res["metrics"]["eps"], 0.0)


if __name__ == "__main__":
    unittest.main()
