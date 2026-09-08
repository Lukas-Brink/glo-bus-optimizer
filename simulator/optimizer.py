"""
GloBus-Pilot: Multi-Objective Offline Parameter Optimizer
Uses bounded line search & coordinate descent to find Pareto-optimal decisions.
"""

from typing import Dict, Any, Tuple
from globus_model import (
    GloBusCompanySimulation,
    CameraDesign,
    DroneDesign,
    RegionalMarketing,
    WorkforceCompensation,
    FinancialDecisions
)

class OfflineOptimizer:
    def __init__(self):
        self.sim = GloBusCompanySimulation()

    def evaluate_composite_score(self, metrics: Dict[str, float], preset: str = "balanced") -> float:
        if metrics["eps"] <= 0:
            return -1e9

        eps = metrics["eps"]
        roe = metrics["roe"]
        sp = metrics["stock_price"]
        cr = metrics["credit_rating_score"]
        img = metrics["image_rating"]
        cash = metrics["ending_cash"]

        if preset == "max_eps":
            score = (eps * 100) + (roe * 15) + (sp * 5)
            if cash < 1500:
                score -= ((1500 - cash) * 2) + 1000
        elif preset == "balanced":
            score = (eps * 50) + (roe * 25) + (sp * 20) + (cr * 5) + (img * 5)
            if cash < 3000:
                score -= ((3000 - cash) * 2) + 1500
            if cr < 90: # below A-
                score -= (90 - cr) * 20
        else:
            score = (eps * 40) + (roe * 20) + (sp * 20) + (cr * 10) + (img * 10)
            if cash < 2500:
                score -= ((2500 - cash) * 2) + 1000

        return score

    def optimize_marketing_and_finance(
        self,
        cam_design: CameraDesign,
        drone_design: DroneDesign,
        workforce: WorkforceCompensation,
        preset: str = "balanced"
    ) -> Tuple[Dict[str, RegionalMarketing], FinancialDecisions, Dict[str, Any]]:
        """Finds optimal marketing prices, advertising budgets, and share repurchase decisions"""

        # Baseline marketing
        marketing = {
            region.name: RegionalMarketing(
                camera_price=340.0,
                camera_retailer_discount=10.0,
                camera_advertising=3200.0,
                camera_retailer_support=1500.0,
                camera_warranty_months=12,
                drone_price=1250.0,
                drone_search_ads=3800.0,
                drone_retailer_support=2200.0,
                drone_warranty_months=12
            )
            for region in self.sim.regions
        }

        # Baseline finance (buy back 5% max allowed, pay down debt safely)
        finance = FinancialDecisions(
            beginning_cash=12000.0,
            shares_outstanding=10000.0,
            stock_buyback_pct=5.0, # Buy back 5% to reduce share count and supercharge EPS
            dividend_per_share=0.75,
            bank_debt_balance=35000.0,
            debt_paydown=5000.0
        )

        best_metrics = self.sim.simulate_pro_forma(cam_design, drone_design, marketing, workforce, finance)
        best_score = self.evaluate_composite_score(best_metrics, preset)

        # Coordinate descent over regional prices and advertising
        price_steps = [-30, -15, 15, 30]
        ad_steps = [-500, -250, 250, 500]

        for cycle in range(3):
            for region_name, mkt in marketing.items():
                # Test Camera Price
                for d_price in price_steps:
                    orig_p = mkt.camera_price
                    new_p = max(180.0, min(600.0, orig_p + d_price))
                    mkt.camera_price = new_p
                    test_m = self.sim.simulate_pro_forma(cam_design, drone_design, marketing, workforce, finance)
                    test_score = self.evaluate_composite_score(test_m, preset)
                    if test_score > best_score:
                        best_score = test_score
                        best_metrics = test_m
                    else:
                        mkt.camera_price = orig_p

                # Test Drone Price
                for d_price in [step * 2 for step in price_steps]:
                    orig_p = mkt.drone_price
                    new_p = max(600.0, min(2200.0, orig_p + d_price))
                    mkt.drone_price = new_p
                    test_m = self.sim.simulate_pro_forma(cam_design, drone_design, marketing, workforce, finance)
                    test_score = self.evaluate_composite_score(test_m, preset)
                    if test_score > best_score:
                        best_score = test_score
                        best_metrics = test_m
                    else:
                        mkt.drone_price = orig_p

                # Test Camera Advertising
                for d_ad in ad_steps:
                    orig_ad = mkt.camera_advertising
                    new_ad = max(500.0, min(8000.0, orig_ad + d_ad))
                    mkt.camera_advertising = new_ad
                    test_m = self.sim.simulate_pro_forma(cam_design, drone_design, marketing, workforce, finance)
                    test_score = self.evaluate_composite_score(test_m, preset)
                    if test_score > best_score:
                        best_score = test_score
                        best_metrics = test_m
                    else:
                        mkt.camera_advertising = orig_ad

        return marketing, finance, best_metrics
