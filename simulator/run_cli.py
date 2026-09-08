"""
GloBus-Pilot: CLI Simulation & Strategy Runner
Run this to calculate optimal decisions and view projected pro-formas.
"""

import sys
from globus_model import GloBusCompanySimulation
from optimizer import OfflineOptimizer
from strategies import STRATEGY_PRESETS

def print_separator(char="=", length=65):
    print(char * length)

def main():
    print_separator("=")
    print("  ⚡ GLOBUS-PILOT: STRATEGY SIMULATOR & DECISION OPTIMIZER")
    print_separator("=")

    preset_key = "grand_champion"
    if len(sys.argv) > 1 and sys.argv[1] in STRATEGY_PRESETS:
        preset_key = sys.argv[1]

    preset = STRATEGY_PRESETS[preset_key]
    print(f"\n[+] Active Strategy: {preset['title']}")
    print(f"[+] Objective: {preset['summary']}\n")

    sim = GloBusCompanySimulation()
    opt = OfflineOptimizer()

    cam = preset["camera_design"]
    drone = preset["drone_design"]
    wf = preset["workforce"]
    fin = preset["finance"]

    cam_pq = sim.calculate_camera_pq(cam)
    drone_pq = sim.calculate_drone_pq(drone)

    print(f"[*] Product Specifications:")
    print(f"    - Action Camera Quality:  {cam_pq} Stars (R&D: ${cam.cumulative_rd:,.0f})")
    print(f"    - UAV Drone Quality:      {drone_pq} Stars (R&D: ${drone.cumulative_rd:,.0f})")

    prod, defect = sim.calculate_workforce_productivity(wf)
    print(f"\n[*] Workforce & Assembly:")
    print(f"    - Annual Productivity:    {prod:,.0f} units/workstation")
    print(f"    - Defect Rate:            {defect:.2f}%")
    print(f"    - Overtime Allowed:       {wf.overtime_allowed_pct}%")

    print("\n[*] Optimizing Regional Marketing & Financing...")
    marketing, finance, metrics = opt.optimize_marketing_and_finance(cam, drone, wf, preset="balanced")

    print_separator("-")
    print("  📊 OPTIMIZED PRO-FORMA SCORECARD")
    print_separator("-")
    print(f"  • Earnings Per Share (EPS):   ${metrics['eps']:.2f}")
    print(f"  • Return on Equity (ROE):     {metrics['roe']:.1f}%")
    print(f"  • Projected Stock Price:      ${metrics['stock_price']:.2f}")
    print(f"  • Projected Credit Rating:    {metrics['credit_rating']} (Score: {metrics['credit_rating_score']}/100)")
    print(f"  • Projected Image Rating:     {metrics['image_rating']}/100")
    print(f"  • Ending Cash Balance:        ${metrics['ending_cash']:,.1f}k (Safe Buffer)")
    print(f"  • Net Profit:                 ${metrics['net_profit']:,.1f}k")
    print(f"  • Total Net Revenues:         ${metrics['net_revenue']:,.1f}k")
    print(f"  • Shares Repurchased:         {fin.stock_buyback_pct}% (Shares left: {metrics['shares_outstanding']:,.0f}k)")
    print_separator("-")

    print("\n[*] Recommended Regional Decisions:")
    for r_name, m in marketing.items():
        print(f"\n  Region: {r_name}")
        print(f"    Camera Price:             ${m.camera_price:.2f} (Discount: {m.camera_retailer_discount}%)")
        print(f"    Camera Advertising:       ${m.camera_advertising:,.0f}k")
        print(f"    Drone Price:              ${m.drone_price:.2f}")
        print(f"    Drone Search Ads:         ${m.drone_search_ads:,.0f}k")

    print_separator("=")
    print("  Tip: To apply these directly on glo-bus.com, use the In-Browser HUD!")
    print_separator("=")

if __name__ == "__main__":
    main()
