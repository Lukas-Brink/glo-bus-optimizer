"""
GloBus-Pilot: Winning Strategy Presets & Decision Templates
Based on empirical Grand Champion strategies from top percentile simulations.
"""

from globus_model import CameraDesign, DroneDesign, WorkforceCompensation, FinancialDecisions

STRATEGY_PRESETS = {
    "grand_champion": {
        "title": "Grand Champion (Balanced Scorecard)",
        "summary": "Achieves industry #1 rank across all 5 scoring criteria (EPS, ROE, Stock Price, Credit Rating, Image Rating).",
        "camera_design": CameraDesign(
            megapixels=16.0,
            sensor_size="Standard",
            lcd_display=2.5,
            lens_zoom=4.0,
            photo_modes=5,
            extra_battery=True,
            waterproofing=1,
            internal_memory=64,
            software_level=3,
            models_offered=3,
            cumulative_rd=50000.0  # Max out R&D early to gain permanent per-unit cost reductions
        ),
        "drone_design": DroneDesign(
            camera_quality="4K",
            frame_material="Carbon",
            battery_flight_time=30,
            obstacle_avoidance=2,
            gimbal_stabilization=2,
            gps_controller=2,
            extra_battery=True,
            models_offered=2,
            cumulative_rd=50000.0
        ),
        "workforce": WorkforceCompensation(
            base_wage=30000.0,
            assembly_incentive=4.00,  # High incentive pay drastically reduces defects & boosts labor output
            fringe_benefits=2500.0,
            year_end_bonus=1500.0,
            training_expenditure=2000.0,
            overtime_allowed_pct=15.0,
            workstations=130,
            robotics_upgrade=True     # Cuts assembly labor hours per unit by 25%
        ),
        "finance": FinancialDecisions(
            beginning_cash=15000.0,
            shares_outstanding=10000.0,
            stock_buyback_pct=5.0,    # Buy back max 5% every round!
            dividend_per_share=0.85,
            bank_debt_balance=30000.0,
            debt_paydown=6000.0
        )
    },

    "max_eps": {
        "title": "Wall Street Bull (EPS & Buyback Maximizer)",
        "summary": "Aggressive focus on maximizing Earnings Per Share, stock buybacks, and lean cost management.",
        "camera_design": CameraDesign(
            megapixels=12.0,
            sensor_size="Standard",
            lcd_display=2.0,
            lens_zoom=3.0,
            photo_modes=4,
            extra_battery=True,
            waterproofing=0,
            internal_memory=32,
            software_level=2,
            models_offered=2,
            cumulative_rd=50000.0
        ),
        "drone_design": DroneDesign(
            camera_quality="4K",
            frame_material="Composite",
            battery_flight_time=25,
            obstacle_avoidance=1,
            gimbal_stabilization=2,
            gps_controller=1,
            extra_battery=True,
            models_offered=1,
            cumulative_rd=50000.0
        ),
        "workforce": WorkforceCompensation(
            base_wage=27000.0,
            assembly_incentive=3.50,
            fringe_benefits=2000.0,
            year_end_bonus=1000.0,
            training_expenditure=1500.0,
            overtime_allowed_pct=20.0, # Maximize overtime before buying new workstations
            workstations=110,
            robotics_upgrade=True
        ),
        "finance": FinancialDecisions(
            beginning_cash=15000.0,
            shares_outstanding=10000.0,
            stock_buyback_pct=5.0,
            dividend_per_share=0.50,
            bank_debt_balance=25000.0,
            debt_paydown=5000.0
        )
    }
}
