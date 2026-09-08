# ⚡ Glo-Bus Optimizer

### Autonomous Simulation Strategy Suite & Multi-Objective Decision Engine
*Designed for McGraw-Hill's **GLO-BUS** Business Simulation (Action Cameras & UAV Drones — Program 21)*

---

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Firefox%20%7C%20Edge%20%7C%20Chromium%20%7C%20Python-indigo.svg)]()
[![Simulation](https://img.shields.io/badge/GLO--BUS-Program%2021%20Compatible-brightgreen.svg)]()

> [!NOTE]
> **What is this?** This project is an intelligent decision optimization suite built specifically for students and participants in McGraw-Hill's **GLO-BUS** international business strategy simulation (*Action Cameras & UAV Drones*). It is not affiliated with the Globus research data management service.

---

## 📖 Overview

In the GLO-BUS simulation, executive teams manage a global company manufacturing and marketing wearable action cameras and commercial UAV drones across four geographic regions (North America, Europe-Africa, Asia-Pacific, and Latin America). 

Making winning decisions requires balancing **over 120 interdependent variables** each decision round:
- **Product Design & R&D**: Balancing sensor sizes, LCDs, battery ratings, and lens quality against unit bill-of-materials costs and P/Q star ratings.
- **Regional Marketing**: Tuning localized pricing, retailer discounts, promotional periods, search engine advertising, and warranty coverage against demand elasticity curves.
- **Workforce & Assembly**: Optimizing compensation mixes (base wage vs. piece-rate defect-free assembly incentives), workforce training, robotics automation upgrades, and overtime thresholds to minimize labor cost per assembled unit.
- **Corporate Social Responsibility (CSR)**: Strategic green initiatives, charitable donations, and workplace safety investments to elevate Image Rating.
- **Finance & Cash Flow**: Navigating capital structure, issuing dividends, retiring long-term debt, and repurchasing equity while steering clear of catastrophic bank overdraft loans.

**Glo-Bus Optimizer** automates the exploration of this high-dimensional decision space. Using multi-objective bounded coordinate descent and heuristic exploration, it tests decision permutations right inside the browser or offline, finding Pareto-optimal parameter sets that maximize composite score while enforcing strict financial safety guardrails.

---

## 🎯 Key Strategic Guardrails Enforced

1. **🛡️ Overdraft Loan Blocker**: 
   The optimizer strictly rejects any parameter permutation that causes projected Ending Cash to drop below **$2,500k**, preventing the disastrous 12%+ emergency overdraft loan penalty that wipes out investor confidence.
2. **🏆 5% Annual Share Repurchase Compounding**: 
   Automatically leverages the maximum allowable 5% equity buyback every round, reducing shares outstanding to supercharge long-term EPS and ROE.
3. **⭐ Cumulative R&D Cost Savings**: 
   Guides aggressive early R&D expenditure to unlock permanent per-unit manufacturing cost reductions that compound over all subsequent rounds.
4. **📊 Credit Rating Floor ($\ge \text{A-}$)**: 
   Maintains interest coverage and debt-to-equity ratios that defend top-tier credit grades.
5. **⚙️ Incentive Compensation Bias**: 
   Favors piece-rate assembly incentives over fixed base pay, cutting defect rates, warranty liability, and assembly hours per unit.

---

## 🚀 4 Ways to Use Glo-Bus Optimizer

### Option 1: The 1-Click In-Browser HUD (Recommended — Zero Installation)
*Runs universally inside **Google Chrome**, **Mozilla Firefox**, **Microsoft Edge**, **Brave**, or any modern browser with no extensions or downloads required.*

1. Open [`userscript/bookmarklet.txt`](userscript/bookmarklet.txt).
2. Open your browser bookmarks bar (`Ctrl + Shift + B`), right-click, and select **"Add Bookmark"**.
3. Name it: `⚡ Glo-Bus Optimizer`
4. Paste the single line of JavaScript into the **URL / Location** field and save.
5. Log into your Glo-Bus account and navigate to any decision page (e.g., *Product Design*, *Marketing*, *Workforce*, *Finance*).
6. Click your **⚡ Glo-Bus Optimizer** bookmark!
7. The dark-glass floating HUD instantly docks to your screen:
   - Select your strategy preset (**Grand Champion**, **Wall Street Bull**, etc.).
   - Click **⚡ Start Optimization**.
   - Watch the optimizer step through inputs, recalculate pro-forma metrics, and capture highest scoring combinations.
   - Click **✓ Apply Best** or **↺ Revert Original** at any time.

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
  Available presets: `grand_champion`, `max_eps`, `volume_leader`, `premium_quality`.

---

## 📁 Project Architecture

```
glo-bus-optimizer/
├── extension/                  # Chrome / Firefox / Edge / Chromium WebExtension (Manifest V3)
│   ├── manifest.json           # Cross-browser Gecko & Chromium manifest
│   ├── hud.js                  # In-page glassmorphic HUD controller & draggable UI
│   ├── hud.css                 # Modern dark-glass CSS design system
│   ├── optimizer.js            # Multi-objective Coordinate Descent & Annealing engine
│   ├── dom-adapter.js          # DOM scraper, form mutator & calculation event hooks
│   └── popup.html              # Extension toolbar popup
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
│   └── run_cli.py              # Command-line simulation runner
├── docs/                       # Guides & Documentation
│   ├── STRATEGY_GUIDE.md       # Comprehensive Glo-Bus Grand Champion strategic playbook
│   └── BROWSER_SETUP.md        # Setup guide for Firefox & Chromium browsers
├── setup.ps1                   # Automated PowerShell environment checker & installer
├── setup.bat                   # 1-click Windows batch launcher
├── .gitignore                  # Git ignore rules for clean repo maintenance
└── README.md                   # Project documentation
```

---

## 🧠 Under the Hood: The Optimization Algorithm

### 1. The Multi-Objective Composite Scoring Function
GLO-BUS evaluates teams across five key metrics. The optimizer weights these metrics according to your chosen strategy preset:

$$\text{Score} = w_{\text{eps}} \cdot \text{EPS} + w_{\text{roe}} \cdot \text{ROE} + w_{\text{sp}} \cdot \text{StockPrice} + w_{\text{credit}} \cdot \text{CreditScore} + w_{\text{img}} \cdot \text{ImageRating} - \text{Penalties}$$

#### Hard Constraints & Penalties:
- **Cash Cushion Deficit**: If $\text{Ending Cash} < \$2,500\text{k}$:
  $$\text{Penalty}_{\text{cash}} = 2 \cdot (2500 - \text{Ending Cash}) + 500$$
- **Credit Grade Floor**: If $\text{Credit Rating} < \text{A-}$ ($\text{Score} < 90$), an exponential penalty is applied to avoid downgrades.

### 2. Coordinate Descent with Adaptive Exploration
1. **DOM Scrape & State Capture**: On page load, `dom-adapter.js` indexes all numeric inputs, dropdown selectors, and current pro-forma metric displays. An initial snapshot is preserved for instantaneous revert capability.
2. **Coordinate Descent Cycle**: For each editable parameter $x_i$, the engine evaluates forward ($x_i + \Delta_i$) and backward ($x_i - \Delta_i$) perturbations.
3. **Simulated Recalculation**: The engine dispatches synthetic `input`, `change`, and `blur` events, invokes Glo-Bus's calculation pipeline, and reads updated scoreboard metrics.
4. **Greedy Update & Annealing**: If an improvement is found that satisfies all cash and credit constraints, the parameter is committed as the new baseline. Step sizes $\Delta_i$ dynamically shrink as the solution converges toward the local Pareto front.

---

## 📚 Strategy Playbook

Check out [`docs/STRATEGY_GUIDE.md`](docs/STRATEGY_GUIDE.md) for detailed tactical advice on:
- R&D investment curves and permanent cost reductions.
- Optimal retail pricing and search ad spend before diminishing returns.
- Balancing overtime vs. capital equipment investments.
- Crafting high-ROE equity buyback schedules.

---

## 🙏 Acknowledgements & Credits

This project draws architectural and conceptual inspiration from prior open-source work in the Glo-Bus optimization space:

- **[glo-bus-max-eps](https://github.com/sankeer28/glo-bus-max-eps)** by [@sankeer28](https://github.com/sankeer28) — Pioneered early automated in-browser iteration and DOM parameter probing for Glo-Bus EPS maximization. Glo-Bus Optimizer builds upon this foundational concept by expanding into a multi-objective balanced scorecard engine, hard financial guardrails (overdraft loan protection and credit grade defense), a draggable glassmorphic HUD, cross-browser Gecko and Chromium support, standalone 1-click bookmarklets, and an offline Python mathematical simulation suite.
- **[GloBusOptimizer](https://github.com/MHDante/GloBusOptimizer)** by [@MHDante](https://github.com/MHDante) — Early exploration of simulation and gradient descent applied to Glo-Bus product design.

Special thanks to the original authors for exploring algorithmic optimization in competitive business simulations!

---

## ⚖️ Disclaimer

This software is an independent open-source educational utility developed for learning economic modeling, mathematical optimization, and algorithmic business simulation. It is not affiliated with, endorsed by, or sponsored by McGraw-Hill Education or the creators of GLO-BUS. Use responsibly in accordance with your academic institution's guidelines.
