# Glo-Bus Optimizer

### Autonomous Simulation Strategy Suite and Multi-Objective Decision Engine
*Designed for McGraw-Hill's GLO-BUS Business Simulation (Action Cameras & UAV Drones — Program 21)*

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Chromium%20%7C%20Python-indigo.svg)]()
[![Simulation](https://img.shields.io/badge/GLO--BUS-Program%2021%20Compatible-brightgreen.svg)]()

> [!NOTE]
> **What is this?** This project is an intelligent decision optimization suite built specifically for students and participants in McGraw-Hill's **GLO-BUS** international business strategy simulation (*Action Cameras & UAV Drones*). It is not affiliated with the Globus research data management service.

---

## Overview

In the GLO-BUS simulation, executive teams manage a global company manufacturing and marketing wearable action cameras and commercial UAV drones across four geographic regions (North America, Europe-Africa, Asia-Pacific, and Latin America). 

Making winning decisions requires balancing **over 120 interdependent variables** each decision round:
- **Product Design and R&D**: Balancing sensor sizes, LCDs, battery ratings, and lens quality against unit bill-of-materials costs and P/Q star ratings.
- **Regional Marketing**: Tuning localized pricing, retailer discounts, promotional periods, search engine advertising, and warranty coverage against demand elasticity curves.
- **Workforce and Assembly**: Optimizing compensation mixes (base wage vs. piece-rate defect-free assembly incentives), workforce training, robotics automation upgrades, and overtime thresholds to minimize labor cost per assembled unit.
- **Corporate Social Responsibility (CSR)**: Strategic green initiatives, charitable donations, and workplace safety investments to elevate Image Rating.
- **Finance and Cash Flow**: Navigating capital structure, issuing dividends, retiring long-term debt, and repurchasing equity while steering clear of catastrophic bank overdraft loans.

**Glo-Bus Optimizer** automates the exploration of this high-dimensional decision space. Using multi-objective bounded coordinate descent and heuristic exploration, it tests decision permutations right inside the browser or offline, finding Pareto-optimal parameter sets that maximize composite score while enforcing strict financial safety guardrails.

---

## Strategic Guardrails Enforced

1. **Emergency Overdraft Loan Blocker ($2,500k Cash Buffer)**: 
   The optimizer strictly rejects any parameter permutation that causes projected Ending Cash to drop below **$2,500k**, preventing the disastrous 12%+ emergency overdraft loan penalty that wipes out credit ratings and game scores.
2. **Special Contracts Solvency Defense**: 
   In Special Contract Offers, the engine aggressively bids in regional auctions (targeting Value Index 51 to 55), but forces regional pro-forma incorporation toggles to "No". This guarantees that Finance never plans against speculative revenue, protecting the cash cushion from sudden overdrafts if outbid.
3. **5% Annual Share Repurchase Compounding**: 
   Automatically leverages the maximum allowable 5% equity buyback every round, reducing shares outstanding to supercharge long-term EPS and ROE.
4. **Finance Mutual Exclusivity Safeguard**: 
   Strictly enforces simulation rules preventing simultaneous stock issuance and share repurchase within the same decision round.
5. **CSR Image Rating Target Lock (75 Image Rating)**: 
   Restricts CSR spending to the optimal investor expectation threshold (75 Image Rating), eliminating diminishing-return expenditures that bleed cash without improving scoring.
6. **Cumulative R&D Cost Reductions**: 
   Guides aggressive early R&D expenditure to unlock permanent per-unit manufacturing cost reductions that compound over all subsequent rounds.
7. **Credit Rating Floor (>= A-)**: 
   Maintains interest coverage and debt-to-equity ratios that defend top-tier credit grades (A-, A, A+).
8. **Incentive Compensation Optimization**: 
   Favors piece-rate assembly incentives over fixed base pay, cutting defect rates, warranty liability, and assembly hours per unit.

---

## Ways to Use Glo-Bus Optimizer

### Option 1: The 1-Click In-Browser HUD (Recommended — Zero Installation)
*Runs universally inside **Google Chrome**, **Mozilla Firefox**, **Microsoft Edge**, **Brave**, or any modern browser with no extensions or downloads required.*

1. Open [`userscript/bookmarklet.txt`](userscript/bookmarklet.txt).
2. Open your browser bookmarks bar (`Ctrl + Shift + B`), right-click, and select **"Add Bookmark"**.
3. Name it: `Glo-Bus Optimizer`
4. Paste the single line of JavaScript into the **URL / Location** field and save.
5. Log into your Glo-Bus account and navigate to any decision page (e.g., *Product Design*, *Marketing*, *Workforce*, *Finance*).
6. Click your **Glo-Bus Optimizer** bookmark.
7. The dark-glass floating HUD instantly docks to your screen:
   - Click **OPTIMIZE FULL ROUND**.
   - The engine automatically navigates across all decision screens in canonical sequence (Product Design -> AC Marketing -> UAV Marketing -> Compensation & Facilities -> Special Contract Offers -> CSR -> Finance), evaluates coordinate descent against live scoreboard projections, finds the optimal decision set with cash and credit guardrails, and auto-saves the peak decisions.
   - Click **REVERT** at any time to roll back to the original screen baseline.

---

### Option 2: Browser Extension (Manifest V3)
*Ideal if you want persistent toolbar access and auto-injection on glo-bus.com pages.*

- **Mozilla Firefox (Gecko)**:
  1. Navigate to `about:debugging#/runtime/this-firefox`.
  2. Click **"Load Temporary Add-on..."** and select [`extension/manifest.json`](extension/manifest.json).
- **Chromium Browsers (Google Chrome / Microsoft Edge / Brave / Opera)**:
  1. Navigate to `chrome://extensions` or `edge://extensions`.
  2. Enable **Developer mode** (top-right toggle).
  3. Click **"Load unpacked"** and select the [`extension/`](extension/) directory.
- For detailed setup notes, see [`docs/BROWSER_SETUP.md`](docs/BROWSER_SETUP.md).

---

### Option 3: Violentmonkey / Tampermonkey Userscript
*Ideal for userscript enthusiasts in Firefox or Chromium.*

1. Install [Violentmonkey](https://violentmonkey.github.io/) or [Tampermonkey](https://www.tampermonkey.net/).
2. Create a new script and paste the contents of [`userscript/globus-pilot.user.js`](userscript/globus-pilot.user.js).
3. Save the script. Whenever you open any page on `glo-bus.com`, the optimizer HUD will automatically load.

---

### Option 4: Standalone Interactive What-If Sandbox & Python CLI
*Test strategies 100% offline without needing an active internet connection or Glo-Bus session.*

- **Interactive Web Dashboard**:
  - Double-click [`web_dashboard/index.html`](web_dashboard/index.html) to open the interactive sandbox in your browser.
  - Adjust sliders for price elasticity, R&D budgets, workforce wages, and share buybacks with live pro-forma financial updates.
- **Python Mathematical Engine**:
  ```powershell
  # Run the command-line simulation solver
  python simulator/run_cli.py grand_champion
  ```
  Primary strategy objective: `grand_champion` (Balanced Scorecard targeting peak Glo-Bus Composite Game Score).

---

## Project Architecture

```
glo-bus-optimizer/
├── extension/                  # Chrome / Firefox / Edge / Chromium WebExtension (Manifest V3)
│   ├── manifest.json           # Cross-browser Gecko & Chromium manifest
│   ├── hud.js                  # In-page glassmorphic HUD controller & draggable UI
│   ├── hud.css                 # Modern dark-glass CSS design system
│   ├── optimizer.js            # Multi-objective Coordinate Descent & Annealing engine
│   ├── page-coordinator.js     # Autonomous multi-page round coordinator & convergence engine
│   ├── dom-adapter.js          # DOM scraper, frame traverser & calculation event hooks
│   ├── popup.html              # Extension toolbar popup
│   └── icons/                  # High-resolution extension icons (16px, 32px, 48px, 128px)
├── userscript/                 # Browser Automation & Bookmarklet
│   ├── globus-pilot.user.js    # Standalone script for Violentmonkey / Tampermonkey
│   ├── bookmarklet.txt         # 1-Click bookmarklet instructions & standalone code
│   └── bookmarklet_inline.js   # Self-contained, minified offline bookmarklet script
├── web_dashboard/              # Offline Pro-Forma Sandbox
│   └── index.html              # Interactive What-If simulation playground
├── simulator/                  # Python Offline Mathematical Engine
│   ├── globus_model.py         # Cost curves, production capacity, demand elasticity, & financials
│   ├── optimizer.py            # Coordinate descent & parameter sensitivity solver
│   ├── strategies.py           # Pre-configured Grand Champion decision templates
│   └── run_cli.py              # Command-line simulation runner & programmatic solver
├── tests/                      # Comprehensive Unit & Integration Test Suites
│   ├── test_extension.js       # Node.js tests for DOM adapter, coordinator, & HUD
│   └── test_simulator.py       # Python unit tests for model, elasticity, & solver
├── scripts/                    # Build & Packaging Utilities
│   ├── bundle_userscript.js    # Compiles extension modules into userscript & bookmarklets
│   └── package_release.js      # Creates production distribution zip & release bundles
├── docs/                       # Guides & Documentation
│   ├── STRATEGY_GUIDE.md       # Comprehensive Glo-Bus Grand Champion strategic playbook
│   └── BROWSER_SETUP.md        # Setup guide for Firefox & Chromium browsers
├── package.json                # Project scripts, metadata, and npm commands
├── setup.ps1                   # Automated PowerShell environment checker & installer
├── setup.bat                   # 1-click Windows batch launcher
├── .gitignore                  # Git ignore rules for clean repo maintenance
└── README.md                   # Project documentation
```

---

## Testing & Release Packaging

The project includes automated test suites covering both the browser automation runtime and the offline Python mathematical engine.

```bash
# Run the complete test suite (both WebExtension and Python tests)
npm test

# Run tests individually
npm run test:extension
npm run test:simulator

# Re-bundle the userscript and bookmarklet from source extension components
npm run bundle

# Package a production-ready release zip for GitHub Releases or Chrome Web Store
npm run package
```
All release bundles (extension zip, userscript, bookmarklet, and release notes) are automatically generated in the `dist/` directory.

---

## Under the Hood: The Optimization Algorithm

### 1. The Authentic Glo-Bus Composite Game Score Model
GLO-BUS evaluates performance using a 50/50 blend of two independent evaluation standards:

$$\text{Composite Score} = 0.50 \cdot \text{Score}_{\text{IE}} + 0.50 \cdot \text{Score}_{\text{BII}} - \text{Penalties}$$

1. **Investor Expectations (I.E.) Standard (50%)**:
   - Evaluates performance against target thresholds for EPS, ROE, Stock Price, Credit Rating, and Image Rating.
   - Meeting target yields exactly 20.0 points per measure.
   - Exceeding target earns a +0.5% bonus per 1% exceeded, capped at +20% (up to 24.0 points per measure).
   - Missing target awards fractional score: $(\text{Actual} / \text{Target}) \times 20.0$.
2. **Best-in-Industry (B-I-I) Standard (50%)**:
   - Measures performance relative to the industry benchmark leader.
   - Strictly capped at 20.0 points per measure with no bonus.
3. **Solvency and Overdraft Penalties**:
   - If projected Ending Cash drops below zero, a punitive penalty is assessed:
     $$\text{Penalty}_{\text{overdraft}} = 5000 + 0.05 \cdot |\text{Ending Cash}|$$
   - If ending cash falls into the vulnerable zone below the $2,500k buffer:
     $$\text{Penalty}_{\text{buffer}} = \frac{2500 - \text{Ending Cash}}{2500} \times 5.0$$

### 2. Multi-Pass Coordinate Descent with Coupled Optimization
1. **DOM Scrape and State Capture**: On page load, `dom-adapter.js` indexes all numeric inputs, dropdown selectors, and current pro-forma metric displays across all document frames. An initial snapshot is preserved for instantaneous revert capability.
2. **Economic Priority Sorting**: Decision levers are sequenced along their causal chain (Product Specs & R&D -> Compensation & Facilities -> Pricing -> Advertising -> Financing).
3. **Coupled Diagonal Exploration**: Variables with high cross-elasticities (e.g., Regional Price vs. Advertising, Base Wage vs. Assembly Incentive, Stock Buyback vs. Dividends) are co-optimized across 2D diagonal permutations.
4. **Adaptive Line Search and Momentum**: Continuous inputs explore directional gradients with step scaling and momentum acceleration, committing parameter updates only when composite score strictly improves.

---

## Strategy Playbook

Check out [`docs/STRATEGY_GUIDE.md`](docs/STRATEGY_GUIDE.md) for detailed tactical advice on:
- R&D investment curves and permanent cost reductions.
- Optimal retail pricing and search ad spend before diminishing returns.
- Balancing overtime vs. capital equipment investments.
- Crafting high-ROE equity buyback schedules.

---

## Acknowledgements & Credits

This project draws architectural and conceptual inspiration from prior open-source work in the Glo-Bus optimization space:

- **[glo-bus-max-eps](https://github.com/sankeer28/glo-bus-max-eps)** by [@sankeer28](https://github.com/sankeer28) — Pioneered early automated in-browser iteration and DOM parameter probing for Glo-Bus EPS maximization. Glo-Bus Optimizer builds upon this foundational concept by expanding into a multi-objective balanced scorecard engine, hard financial guardrails (overdraft loan protection and credit grade defense), a draggable glassmorphic HUD, cross-browser Gecko and Chromium support, standalone 1-click bookmarklets, and an offline Python mathematical simulation suite.
- **[GloBusOptimizer](https://github.com/MHDante/GloBusOptimizer)** by [@MHDante](https://github.com/MHDante) — Early exploration of simulation and gradient descent applied to Glo-Bus product design.

Special thanks to the original authors for exploring algorithmic optimization in competitive business simulations.

---

## Disclaimer

This software is an independent open-source educational utility developed for learning economic modeling, mathematical optimization, and algorithmic business simulation. It is not affiliated with, endorsed by, or sponsored by McGraw-Hill Education or the creators of GLO-BUS. Use responsibly in accordance with your academic institution's guidelines.
