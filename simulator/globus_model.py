"""
GloBus-Pilot: Mathematical Simulation Model
Recreates GLO-BUS Program 21 internal economic, operational, and financial accounting rules.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple
import math

@dataclass
class RegionalMarket:
    name: str
    camera_demand_base: float
    drone_demand_base: float
    import_tariff: float = 0.0  # per unit tariff if applicable
    exchange_rate: float = 1.0  # currency adjustment factor

@dataclass
class CameraDesign:
    megapixels: float = 16.0         # 8, 12, 16, 20, 24 MP
    sensor_size: str = "Standard"    # Small, Standard, Large
    lcd_display: float = 2.5         # 2.0, 2.5, 3.0, 3.5 inches
    lens_zoom: float = 4.0           # 2x, 3x, 4x, 5x, 6x optical
    photo_modes: int = 5             # 1 to 10 modes
    extra_battery: bool = True       # Yes / No
    waterproofing: int = 1           # 0 (None), 1 (Splash), 2 (Underwater)
    internal_memory: int = 64        # 16, 32, 64, 128 GB
    software_level: int = 3          # 1 to 5
    models_offered: int = 3          # 1 to 5
    cumulative_rd: float = 25000.0   # $0 to $50,000

@dataclass
class DroneDesign:
    camera_quality: str = "4K"       # 1080p, 4K, 5K, 8K
    frame_material: str = "Carbon"   # Composite, Carbon Fiber, Titanium
    battery_flight_time: int = 30    # 20 to 45 minutes
    obstacle_avoidance: int = 2      # 0 (None), 1 (Basic), 2 (360-degree)
    gimbal_stabilization: int = 2    # 1 (2-axis), 2 (3-axis motorized)
    gps_controller: int = 2          # 1 (Basic), 2 (Waypoints & Follow)
    extra_battery: bool = True
    models_offered: int = 2          # 1 to 3
    cumulative_rd: float = 25000.0

@dataclass
class RegionalMarketing:
    # Camera
    camera_price: float = 300.0
    camera_retailer_discount: float = 10.0  # % discount to retail partners
    camera_advertising: float = 3000.0      # $000s
    camera_retailer_support: float = 1500.0 # $000s
    camera_warranty_months: int = 12        # 6, 12, 24, 36 months
    # Drone
    drone_price: float = 1200.0
    drone_search_ads: float = 3500.0        # $000s
    drone_retailer_support: float = 2000.0  # $000s
    drone_warranty_months: int = 12

@dataclass
class WorkforceCompensation:
    base_wage: float = 28000.0         # $ per worker per year
    assembly_incentive: float = 3.50   # $ per defect-free unit assembled
    fringe_benefits: float = 2500.0    # $ per worker per year
    year_end_bonus: float = 1200.0     # $ per worker
    training_expenditure: float = 1500 # $ per worker for best-practice training
    overtime_allowed_pct: float = 15.0 # Max 20%
    workstations: int = 120
    robotics_upgrade: bool = True

@dataclass
class FinancialDecisions:
    beginning_cash: float = 15000.0
    shares_outstanding: float = 10000.0 # Thousands of shares (10 million standard)
    stock_buyback_pct: float = 5.0      # 0% to 5% max legal repurchase per round
    dividend_per_share: float = 0.50    # $ per share
    bank_debt_balance: float = 40000.0  # Outstanding long term debt
    debt_paydown: float = 5000.0        # Early debt principal retirement
    new_debt_issued: float = 0.0

class GloBusCompanySimulation:
    def __init__(self):
        self.regions = [
            RegionalMarket("North America", 600.0, 200.0, 0.0, 1.00),
            RegionalMarket("Europe-Africa", 500.0, 180.0, 5.0, 0.95),
            RegionalMarket("Asia-Pacific", 700.0, 220.0, 10.0, 1.05),
            RegionalMarket("Latin America", 350.0, 120.0, 15.0, 0.90)
        ]

    def calculate_camera_pq(self, design: CameraDesign) -> float:
        """Estimates Action Camera P/Q Star Rating (1.0 to 10.0 stars)"""
        pts = 0.0
        pts += (design.megapixels - 8) * 1.8
        pts += (design.lcd_display - 2.0) * 12.0
        pts += (design.lens_zoom - 2.0) * 4.5
        pts += design.photo_modes * 2.2
        pts += 8.0 if design.extra_battery else 0.0
        pts += design.waterproofing * 7.0
        pts += math.log2(design.internal_memory / 16 + 1) * 6.0
        pts += design.software_level * 5.0
        # R&D cumulative bonus
        pts += min(design.cumulative_rd / 50000.0 * 15.0, 15.0)

        # Scale to 1.0 - 10.0 stars
        pq = 1.0 + (pts / 12.5)
        return min(10.0, max(1.0, round(pq, 1)))

    def calculate_drone_pq(self, design: DroneDesign) -> float:
        """Estimates UAV Drone P/Q Star Rating (1.0 to 10.0 stars)"""
        pts = 0.0
        cam_map = {"1080p": 5.0, "4K": 18.0, "5K": 26.0, "8K": 35.0}
        pts += cam_map.get(design.camera_quality, 15.0)
        frame_map = {"Composite": 5.0, "Carbon": 15.0, "Titanium": 25.0}
        pts += frame_map.get(design.frame_material, 15.0)
        pts += (design.battery_flight_time - 20) * 1.5
        pts += design.obstacle_avoidance * 10.0
        pts += design.gimbal_stabilization * 8.0
        pts += design.gps_controller * 7.0
        pts += 6.0 if design.extra_battery else 0.0
        pts += min(design.cumulative_rd / 50000.0 * 15.0, 15.0)

        pq = 1.0 + (pts / 13.0)
        return min(10.0, max(1.0, round(pq, 1)))

    def calculate_workforce_productivity(self, wf: WorkforceCompensation) -> Tuple[float, float]:
        """Returns (Units assembled per workstation, Defect rate %)"""
        # Productivity multiplier based on compensation competitiveness
        comp_index = (wf.base_wage / 25000.0) * 0.4 + \
                     (wf.assembly_incentive / 3.0) * 0.3 + \
                     (wf.fringe_benefits / 2000.0) * 0.15 + \
                     (wf.training_expenditure / 1000.0) * 0.15

        base_productivity = 2500.0  # units per year per workstation
        productivity = base_productivity * min(1.6, max(0.8, comp_index))

        if wf.robotics_upgrade:
            productivity *= 1.25  # Robotics boosts workstation capacity by 25%

        defect_rate = max(0.8, 4.5 - (wf.training_expenditure / 800.0) - (wf.assembly_incentive / 2.0))
        return (productivity, defect_rate)

    def simulate_pro_forma(
        self,
        cam_design: CameraDesign,
        drone_design: DroneDesign,
        marketing_plans: Dict[str, RegionalMarketing],
        workforce: WorkforceCompensation,
        finance: FinancialDecisions
    ) -> Dict[str, float]:
        """Calculates Pro-Forma Income Statement, Balance Sheet, Cash Flow, and Composite Scores"""
        cam_pq = self.calculate_camera_pq(cam_design)
        drone_pq = self.calculate_drone_pq(drone_design)
        productivity, defect_rate = self.calculate_workforce_productivity(workforce)

        # 1. Demand & Sales Volume Calculation
        total_cam_units = 0.0
        total_drone_units = 0.0
        total_revenue = 0.0
        total_marketing_exp = 0.0
        total_shipping_tariff = 0.0

        for region in self.regions:
            mkt = marketing_plans.get(region.name, RegionalMarketing())

            # Demand elasticity models
            # Camera demand
            cam_price_factor = (350.0 / max(100.0, mkt.camera_price)) ** 1.3
            cam_pq_factor = (cam_pq / 5.5) ** 0.8
            cam_ad_factor = 1.0 + math.log10(max(100.0, mkt.camera_advertising) / 100.0) * 0.25
            cam_volume = region.camera_demand_base * 0.25 * cam_price_factor * cam_pq_factor * cam_ad_factor

            # Drone demand
            drone_price_factor = (1300.0 / max(400.0, mkt.drone_price)) ** 1.4
            drone_pq_factor = (drone_pq / 5.5) ** 0.9
            drone_ad_factor = 1.0 + math.log10(max(100.0, mkt.drone_search_ads) / 100.0) * 0.28
            drone_volume = region.drone_demand_base * 0.25 * drone_price_factor * drone_pq_factor * drone_ad_factor

            total_cam_units += cam_volume
            total_drone_units += drone_volume

            # Net wholesale revenue
            cam_net_price = mkt.camera_price * (1.0 - mkt.camera_retailer_discount / 100.0)
            rev = (cam_volume * cam_net_price) + (drone_volume * mkt.drone_price)
            total_revenue += rev

            total_marketing_exp += mkt.camera_advertising + mkt.camera_retailer_support + \
                                   mkt.drone_search_ads + mkt.drone_retailer_support
            total_shipping_tariff += (cam_volume * region.import_tariff) + (drone_volume * region.import_tariff * 2.0)

        # 2. Manufacturing & COGS
        total_units = total_cam_units + (total_drone_units * 2.5) # Drones take 2.5x assembly labor
        capacity = workforce.workstations * productivity
        overtime_units = max(0.0, total_units - capacity)
        regular_units = min(total_units, capacity)

        # Unit materials costs based on P/Q
        unit_mat_cam = 55.0 + (cam_pq * 12.0) - (cam_design.cumulative_rd / 10000.0 * 2.0)
        unit_mat_drone = 220.0 + (drone_pq * 45.0) - (drone_design.cumulative_rd / 10000.0 * 6.0)
        cogs_materials = (total_cam_units * unit_mat_cam) + (total_drone_units * unit_mat_drone)

        # Direct labor costs
        labor_per_unit = (workforce.base_wage + workforce.fringe_benefits) / max(1.0, productivity)
        cogs_labor = (regular_units * labor_per_unit) + (overtime_units * labor_per_unit * 1.5)
        cogs_labor += (total_units * workforce.assembly_incentive)

        # Depreciation on workstations (10-year straight line)
        workstation_cost = 175.0 # $000 per station
        depreciation = (workforce.workstations * workstation_cost) / 10.0

        total_cogs = cogs_materials + cogs_labor + depreciation + total_shipping_tariff

        # 3. Operating Profit & Net Income
        admin_and_csr = 8000.0 # base admin & CSR
        ebit = total_revenue - total_cogs - total_marketing_exp - admin_and_csr

        interest_rate = 0.065 # 6.5% standard bank debt rate
        interest_expense = (finance.bank_debt_balance - finance.debt_paydown + finance.new_debt_issued) * interest_rate
        taxable_income = max(0.0, ebit - interest_expense)
        income_tax = taxable_income * 0.30 # 30% tax rate
        net_profit = taxable_income - income_tax

        # 4. Shares & Equity & EPS
        repurchase_shares = min(finance.shares_outstanding * (finance.stock_buyback_pct / 100.0), finance.shares_outstanding * 0.05)
        ending_shares = finance.shares_outstanding - repurchase_shares
        eps = net_profit / ending_shares

        # Share price estimation (P/E multiple driven by EPS growth, ROE, Credit Rating)
        pe_multiple = 14.5 + min(8.0, eps * 1.5)
        stock_price = max(5.0, eps * pe_multiple)

        # Return on Equity (ROE)
        beginning_equity = 140000.0 # $000s typical equity
        dividends_paid = ending_shares * finance.dividend_per_share
        ending_equity = beginning_equity + net_profit - dividends_paid
        roe = (net_profit / max(1000.0, ending_equity)) * 100.0

        # Cash Flow & Ending Cash
        operating_cash_flow = net_profit + depreciation
        share_repurchase_cost = repurchase_shares * stock_price
        cash_flow_financing = finance.new_debt_issued - finance.debt_paydown - dividends_paid - share_repurchase_cost
        ending_cash = finance.beginning_cash + operating_cash_flow + cash_flow_financing

        # Credit Rating approximation
        interest_coverage = ebit / max(1.0, interest_expense)
        debt_to_equity = (finance.bank_debt_balance - finance.debt_paydown) / max(1.0, ending_equity)
        if interest_coverage > 8.0 and debt_to_equity < 0.25 and ending_cash > 5000:
            credit_rating = "A+"
            credit_score = 100
        elif interest_coverage > 5.5 and debt_to_equity < 0.40 and ending_cash > 2500:
            credit_rating = "A"
            credit_score = 95
        elif interest_coverage > 4.0 and ending_cash > 1000:
            credit_rating = "A-"
            credit_score = 90
        elif interest_coverage > 2.5:
            credit_rating = "B+"
            credit_score = 82
        else:
            credit_rating = "B"
            credit_score = 75

        # Image Rating approximation
        image_rating = 50 + int((cam_pq - 4.0) * 3.5) + int((drone_pq - 4.0) * 3.5)
        image_rating = min(100, max(20, image_rating))

        return {
            "eps": round(eps, 2),
            "roe": round(roe, 1),
            "stock_price": round(stock_price, 2),
            "net_profit": round(net_profit, 1),
            "net_revenue": round(total_revenue, 1),
            "ending_cash": round(ending_cash, 1),
            "camera_pq": cam_pq,
            "drone_pq": drone_pq,
            "credit_rating": credit_rating,
            "credit_rating_score": credit_score,
            "image_rating": image_rating,
            "shares_outstanding": round(ending_shares, 1)
        }
