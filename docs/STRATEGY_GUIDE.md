# Glo-Bus Grand Champion Strategic Playbook

This strategy guide outlines the core mechanics and empirical winning strategies for the McGraw-Hill **GLO-BUS** business simulation (Action Cameras & UAV Drones).

---

## 1. The Five Scoring Pillars & Scoring Standards

In GLO-BUS, your company is evaluated across five pillars, each weighted equally at **20 points (20% of total score)** under two distinct standards (50% Investor Expectations + 50% Best-in-Industry):

1. **Earnings Per Share (EPS)** (20 points base, up to 24 points max with 1.20x bonus for exceeding target)
2. **Return on Equity (ROE)** (20 points base, up to 24 points max)
3. **Stock Price** (20 points base, up to 24 points max)
4. **Credit Rating** (20 points base; grade A- or higher required to avoid heavy point deductions)
5. **Image Rating** (20 points base; target 75 to 80 points)

Because the simulation uses a balanced scorecard, over-optimizing one metric at the expense of others (e.g., maximizing EPS while crashing Credit to C or Ending Cash to negative) results in a lower composite score and lost championships.

---

## 2. Core Strategic Rules of Winning Glo-Bus

### Rule #1: Max Out Cumulative R&D Expenditure Early
- On the **Product Design** screen, maximize your cumulative R&D budget (up to the $50,000 lifetime cap) as early in the game as cash flow permits (typically Years 6–8).
- **Economic Mechanism**: Higher cumulative R&D unlocks permanent, cumulative per-unit manufacturing cost reductions and elevates P/Q star ratings without increasing variable bill-of-materials costs.

### Rule #2: Repurchase the Maximum 5% of Stock Every Round
- Under **Finance & Cash Flow**, GLO-BUS permits companies to repurchase up to **5% of outstanding shares** per year.
- **Economic Mechanism**: EPS is $\frac{\text{Net Profit}}{\text{Shares Outstanding}}$. Reducing the share denominator by 5% compounded annually exponentially accelerates EPS and ROE growth over competitors who leave their share count static.

### Rule #3: Never Let Ending Cash Turn Negative (Overdraft Trap)
- If your projected **Ending Cash Balance** drops below $0, the simulation automatically issues an **emergency 1-year overdraft loan** at double-digit punitive interest rates (12% to 15%+).
- This triggers severe credit downgrades and deducts massive penalties from your game score.
- **Rule of Thumb**: Always maintain a buffer of **$2,500k to $4,000k** to absorb potential revenue fluctuations from competitor price cuts.

### Rule #4: Piece-Rate Incentive Pay Beats High Base Wages
- On **Workforce Compensation & Assembly**, shift compensation toward **assembly incentives per defect-free unit** ($3.50 to $4.50/unit) and fringe benefits rather than pure base salary.
- Incentive pay aligns worker motivations: defect rates drop significantly, labor productivity increases, and warranty liability diminishes.
- Activate **Robotics Upgrades** early—robotics reduces assembly labor hours per unit by 25%.

### Rule #5: Overtime Before Capital Expansion
- Before spending capital to purchase expensive new workstations, utilize up to **15% to 20% overtime**.
- Overtime is flexible and carries no long-term depreciation or facility carrying burden during market downturns.

### Rule #6: Compete for Special Contracts with Solvency Protection
- Special contract offers (corporate bulk buyers) provide lucrative incremental volume that absorbs fixed overhead.
- Target a **Value Index of 51 to 55** in each regional auction with discount bids between 20% and 24%.
- **Cash-Defensive Solvency Rule**: Set regional pro-forma incorporation toggles to "No" so Finance never plans against speculative revenues. Any contract wins become 100% risk-free surplus profit and cash upside on round processing.

### Rule #7: Cap CSR Spending at Investor Expectation Targets
- Corporate Social Responsibility initiatives boost Image Rating, but suffer sharp diminishing returns beyond the investor expectation target (75 Image Rating).
- Cap charitable donations and green investments once the 75 to 78 target is secured; reinvest surplus cash into share buybacks or debt retirement.

---

## 3. Decision Screen Breakdown

| Decision Page | Primary Levers | Strategic Guidelines |
| :--- | :--- | :--- |
| **Product Design** | Cumulative R&D, sensor size, LCD, battery | Max cumulative R&D early; design 2-3 models offering strong P/Q stars without niche cost bloat |
| **AC Camera Marketing** | Regional pricing, retailer discounts, advertising | Price competitively with generous retailer discounts (10-14%) and balanced advertising spend |
| **UAV Drone Marketing** | Direct online price, search engine ads, retailer support | Calibrate pricing against demand elasticity; invest in search ads up to diminishing returns |
| **Compensation & Facilities** | Assembly incentives, robotics upgrades, overtime | Shift compensation to piece-rate defect incentives; use overtime before building excess workstations |
| **Special Contract Offers** | Regional discounts, pro-forma incorporation toggles | Target 51-55 Value Index; keep incorporation toggles at "No" to protect cash buffers |
| **Corporate Citizenship (CSR)** | Green initiatives, charitable donations | Aim for 75 Image Rating target; avoid capital waste on flatlining score gains |
| **Finance & Cash Flow** | 5% stock buyback, debt retirement, dividends | Repurchase max 5% shares annually; retire bank debt; maintain ending cash &ge; $2,500k; protect Credit &ge; A- |

---

## 4. How the Algorithmic Engine Beats Manual Guesswork

1. **Coupled Cross-Elasticity Optimization**: Rather than adjusting variables in isolation, the optimizer uses diagonal coupled exploration to tune interdependent pairs simultaneously (e.g., regional price vs. advertising, base wages vs. incentives, stock buybacks vs. dividends).
2. **Multi-Cycle Simulated Annealing Convergence**: The engine employs a multi-cycle coordinator that sweeps all 7 screens sequentially up to 3 passes:
   - **Cycle 1 (Exploration)**: Coarse 2.0x step scaling and simulated annealing (T = 1.00) prevents entrapment in shallow local pockets. Early cycle termination is prohibited so the solver always transitions to fine descent.
   - **Cycle 2 (Descent)**: Standard 1.0x step scaling with pure greedy coordinate descent (T = 0.00).
   - **Cycle 3 (Polish)**: Fine 0.5x step scaling for micron-level parameter tuning around the converged basin.
3. **True-Peak Anchored Metropolis Acceptance**: Candidate downhill evaluations are anchored to global peak scores and EPS benchmarks rather than local valleys, rejecting zero-delta random-walk ratcheting.
4. **Intermediate Peak Restoration**: If simulated annealing moves drift away from peak territory, physical inputs and cached DOM representations are automatically restored to the recorded champion state before launching subsequent cycles.
5. **Hard Constraint Enforcement**: The engine strictly rejects any permutation that drops Ending Cash below $2,500k or causes Credit Rating to drop below A-, guaranteeing financial stability and preventing punitive emergency loans.

---

## 5. Performance Disclaimer & Competitive Dynamics

- **Performance Disclaimer**: Real-world strategic performance is kinda iffy because GLO-BUS is an interactive, simultaneous-decision oligopoly. The optimizer produces decisions that maximize pro-forma score assuming competitor decisions from the previous round remain unchanged.
- **Competitor Shifts**: If rival teams in your league significantly alter their prices, launch aggressive promotional campaigns, or expand assembly capacity, market elasticity and regional clearing prices will shift when the round processes.
- **Round-by-Round Adaptation**: Always consult the latest Competitive Intelligence Report (CIR) and Company Analysis reports after round processing. Treat optimizer output as an intelligent baseline, and adjust strategic positioning to counter rival moves.

