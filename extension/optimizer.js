/**
 * GloBus-Pilot: Multi-Objective Decision Optimizer Engine
 * Algorithms: Bounded Coordinate Descent with Momentum & Heuristic Line Search
 * Safety Guardrails: Hard Constraints for Ending Cash Buffer ($2,500k+), Credit Floor, and Quality Bounds
 */

const ScoringKernel = (typeof window !== 'undefined' && window.GloBusScoringKernel)
  ? window.GloBusScoringKernel
  : (typeof require !== 'undefined' ? (global.GloBusScoringKernel || require('./scoring-kernel.js')) : null);

const CapacityKernel = (typeof window !== 'undefined' && window.GloBusCapacityKernel)
  ? window.GloBusCapacityKernel
  : (typeof require !== 'undefined' ? (global.GloBusCapacityKernel || require('./capacity-kernel.js')) : null);

const StarSolver = (typeof window !== 'undefined' && window.GloBusStarSolver)
  ? window.GloBusStarSolver
  : (typeof require !== 'undefined' ? (global.GloBusStarSolver || require('./star-solver.js')) : null);

const getLogger = () => window.gloBusLogger || {
  log: () => {}, info: () => {}, success: () => {}, warn: () => {}, error: () => {}, step: () => {}
};

class GloBusOptimizer {
  constructor(domAdapter) {
    this.adapter = domAdapter;
    this.isRunning = false;
    this.isPaused = false;
    this.isStopped = false;
    this.iteration = 0;
    this.delayMs = 280;

    // Strategy Objective: Dedicated Peak Glo-Bus Composite Game Score Engine
    this.currentPreset = 'balanced';
    this.presets = {
      balanced: {
        name: 'Grand Champion (Balanced)',
        description: 'Optimal blend of EPS, ROE, Stock Price with strict Credit & Cash defense.',
        weights: { eps: 0.35, roe: 0.25, stockPrice: 0.20, credit: 0.10, image: 0.10 },
        constraints: { minCash: 2500, minCreditScore: 85 /* A- or higher */, minImage: 75 }
      }
    };

    // State Tracking
    this.baselineMetrics = null;
    this.bestScore = -Infinity;
    this.bestMetrics = null;
    this.bestCombo = null;
    this.peakScore = -Infinity;
    this.peakMetrics = null;
    this.peakCombo = null;
    this.autoSave = true;

    // Two-Phase Solvency & Capital Allocation Tracking:
    // Operational Screens (1-6) evaluate decisions with smooth debt shadow pricing to discover high-ROI upgrades.
    // Screen 7 (Finance & Cash Flow) enforces the strict $2,500k cash solvency & loan balance gate.
    this.isOperationalPhase = false;

    // Multi-Cycle Adaptive Simulated Annealing Context (Pillar 3)
    this.cycleIndex = 1;
    this.maxCycles = 3;
    this.temperature = 0.0;
    this.stepScaleMultiplier = 1.0;

    // Callbacks
    this.onStatusChange = null;
    this.onProgress = null;
    this.onComplete = null;
    this.onBaselineEstablished = null;
  }

  getActiveConfig() {
    return this.presets.balanced;
  }

  setPreset(presetKey = 'balanced') {
    this.currentPreset = 'balanced';
  }

  /**
   * Sets multi-cycle simulated annealing temperature and step scaling schedule (Pillar 3)
   * Cycle 1: Exploration (T=1.0, 2.0x step scale)
   * Cycle 2: Co-Optimization & Refinement (T=0.3, 1.0x step scale)
   * Cycle 3+: Polish & Strict Monotonic Greedy Descent (T=0.0, 0.5x step scale)
   */
  setCycleContext(cycleIndex = 1, maxCycles = 3) {
    this.cycleIndex = cycleIndex;
    this.maxCycles = maxCycles;
    if (cycleIndex <= 1) {
      this.temperature = 1.0;
      this.stepScaleMultiplier = 2.0;
    } else if (cycleIndex === 2) {
      this.temperature = 0.0; // Pure greedy coordinate descent for Deep Convergence (User Request #2)
      this.stepScaleMultiplier = 1.0;
    } else {
      this.temperature = 0.0;
      this.stepScaleMultiplier = 0.5;
    }
    const log = getLogger();
    log.info('ANNEAL', `Cycle context updated: Cycle ${this.cycleIndex}/${this.maxCycles} | Temperature T=${this.temperature.toFixed(2)} | Step Scale ${this.stepScaleMultiplier}x`);
  }

  /**
   * Evaluates score with Anticipated Downstream Margin Valuation Proxy (Pillar 2).
   * Decouples Screen 1 from stale Screen 3 pricing by anticipating downstream pricing power.
   */
  evaluateScoreWithProxy(metrics, targetWholesalePrice = null, targetRetailPrice = null, isOperationalContext = null) {
    if (!metrics || !Number.isFinite(metrics.eps) || metrics.eps <= 0) {
      return -Infinity;
    }
    const proxyMetrics = { ...metrics };
    let epsProxyBonus = 0;
    if (targetWholesalePrice && targetWholesalePrice > 350) {
      const deltaPrice = targetWholesalePrice - 350;
      epsProxyBonus += (deltaPrice / 10.0) * 0.25;
    }
    if (targetRetailPrice && targetRetailPrice > 1300) {
      const deltaPrice = targetRetailPrice - 1300;
      epsProxyBonus += (deltaPrice / 50.0) * 0.20;
    }
    proxyMetrics.eps = (proxyMetrics.eps || 0) + epsProxyBonus;
    return this.evaluateScore(proxyMetrics, isOperationalContext);
  }

  /**
   * Computes the authentic Glo-Bus Composite Game Score (0 to 120 scale)
   * based on the official 50/50 blend of:
   * 1. Investor Expectations (I.E.) Standard (20 pts each, up to 24 pts max for beating target by 40%+)
   * 2. Best-in-Industry (B-I-I) / League Leader Standard (20 pts each relative to benchmarks)
   */
  evaluateScore(metrics, isOperationalContext = null) {
    if (!metrics || metrics._siteRejected || !Number.isFinite(metrics.eps) || metrics.eps <= 0) {
      return -Infinity;
    }

    const config = this.getActiveConfig();
    const isOperational = isOperationalContext !== null
      ? isOperationalContext
      : (this.isOperationalPhase === true);

    if (ScoringKernel && ScoringKernel.ObjectiveKernel) {
      return ScoringKernel.ObjectiveKernel.evaluateScore(metrics, config, isOperational);
    }

    const c = config.constraints;

    // Official Glo-Bus Investor Expectation Targets (Scraped dynamically from scoreboard or Year 9 standard)
    const targetEPS = metrics.targetEPS || 4.25;
    const targetROE = metrics.targetROE || 30.0;
    const targetImage = metrics.targetImage || c.minImage || 75;
    const targetStock = metrics.targetStock || 45.0;

    // =========================================================================
    // STANDARD 1: INVESTOR EXPECTATIONS (I.E.) STANDARD (50% of Total Score)
    // Rule: Meeting target earns exactly 20.0 points.
    // Beating target earns +0.5% bonus per 1% exceeded, capped at +20% (max 24.0 pts).
    // Missing target earns (actual / target) * 20.0 points.
    // =========================================================================

    // 1. EPS Score (IE)
    let scoreEPS_IE = 0;
    if (metrics.eps >= targetEPS) {
      const pctOver = (metrics.eps - targetEPS) / targetEPS;
      const bonusPct = Math.min(0.20, pctOver * 0.5);
      scoreEPS_IE = 20.0 * (1 + bonusPct);
    } else {
      scoreEPS_IE = Math.max(0, 20.0 * (metrics.eps / targetEPS));
    }

    // 2. ROE Score (IE)
    let scoreROE_IE = 0;
    if (metrics.roe >= targetROE) {
      const pctOver = (metrics.roe - targetROE) / targetROE;
      const bonusPct = Math.min(0.20, pctOver * 0.5);
      scoreROE_IE = 20.0 * (1 + bonusPct);
    } else {
      scoreROE_IE = Math.max(0, 20.0 * (metrics.roe / targetROE));
    }

    // 3. Image Rating Score (IE)
    let scoreImage_IE = 0;
    if (metrics.imageRating >= targetImage) {
      const pctOver = (metrics.imageRating - targetImage) / targetImage;
      const bonusPct = Math.min(0.20, pctOver * 0.5);
      scoreImage_IE = 20.0 * (1 + bonusPct);
    } else {
      scoreImage_IE = Math.max(0, 20.0 * (metrics.imageRating / targetImage));
    }

    // 4. Credit Rating Score (IE)
    // Official Glo-Bus IE Credit Rating scale: Target (A- or B+) = 20 pts.
    // A+ achieves the maximum +20% bonus (24.0 pts).
    const ieCreditMap = {
      'A+': 24.0, 'A': 22.0, 'A-': 20.0,
      'B+': 17.0, 'B': 14.0, 'B-': 11.0,
      'C+': 8.0,  'C': 5.0,  'C-': 2.0,
      'D': 0.0,   'F': 0.0
    };
    const scoreCredit_IE = ieCreditMap[metrics.creditRating] !== undefined
      ? ieCreditMap[metrics.creditRating]
      : (metrics.creditRatingScore >= 90 ? 20.0 : Math.max(0, 20.0 * ((metrics.creditRatingScore || 50) / 90.0)));

    // 5. Stock Price Score (IE)
    let scoreStock_IE = 0;
    const hasLiveStockPrice = metrics.stockPrice && metrics.stockPrice > 0;
    if (hasLiveStockPrice) {
      if (metrics.stockPrice >= targetStock) {
        const pctOver = (metrics.stockPrice - targetStock) / targetStock;
        scoreStock_IE = 20.0 * (1 + Math.min(0.20, pctOver * 0.5));
      } else {
        scoreStock_IE = Math.max(0, 20.0 * (metrics.stockPrice / targetStock));
      }
    }

    // When Stock Price is unrendered on decision screens, each of the remaining 4 measures
    // maintains its authentic equal 25% balance (sum * 1.25 to normalize to 100 base points).
    const totalIE = hasLiveStockPrice
      ? (scoreEPS_IE + scoreROE_IE + scoreImage_IE + scoreCredit_IE + scoreStock_IE)
      : (scoreEPS_IE + scoreROE_IE + scoreImage_IE + scoreCredit_IE) * 1.25;

    // =========================================================================
    // STANDARD 2: BEST-IN-INDUSTRY (B-I-I) STANDARD (50% of Total Score)
    // Compares company performance against the industry leader.
    // In Glo-Bus, B-I-I is strictly capped at 20.0 points per measure (NO 1.20x bonus!).
    // =========================================================================
    const benchmarkEPS   = Math.max(metrics.eps, 7.50);
    const benchmarkROE   = Math.max(metrics.roe, 85.0);
    const benchmarkImage = Math.max(metrics.imageRating, targetImage);

    const scoreEPS_BII   = 20.0 * Math.min(1.0, metrics.eps / benchmarkEPS);
    const scoreROE_BII   = 20.0 * Math.min(1.0, metrics.roe / benchmarkROE);
    const scoreImage_BII = 20.0 * Math.min(1.0, metrics.imageRating / benchmarkImage);

    // Official Glo-Bus B-I-I Standardized Credit Rating Scale (out of 20 points):
    const biiCreditMap = {
      'A+': 20.0, 'A': 19.0, 'A-': 18.0,
      'B+': 16.0, 'B': 14.0, 'B-': 11.0,
      'C+': 8.0,  'C': 5.0,  'C-': 1.0,
      'D': 0.0,   'F': 0.0
    };
    const scoreCredit_BII = biiCreditMap[metrics.creditRating] !== undefined
      ? biiCreditMap[metrics.creditRating]
      : (20.0 * Math.min(1.0, (metrics.creditRatingScore || 50) / 100.0));

    let scoreStock_BII = 0;
    if (hasLiveStockPrice) {
      scoreStock_BII = 20.0 * Math.min(1.0, metrics.stockPrice / 75.0);
    }

    const totalBII = hasLiveStockPrice
      ? (scoreEPS_BII + scoreROE_BII + scoreImage_BII + scoreCredit_BII + scoreStock_BII)
      : (scoreEPS_BII + scoreROE_BII + scoreImage_BII + scoreCredit_BII) * 1.25;

    // Official Glo-Bus Composite Game Score (50% IE + 50% BII)
    let compositeScore = (0.50 * totalIE) + (0.50 * totalBII);

    // =========================================================================
    // FINANCIAL SOLVENCY & CASH GUARDRAILS
    // Glo-Bus operates on a 7-screen sequential round:
    // Screens 1-6 (Product Design, Marketing, Facilities, Contracts, CSR) are
    // operational/capital screens where high-ROI investments (R&D, Robotics, Ads)
    // generate profits that can and should be financed on Screen 7 (Finance).
    //
    // - On Operational Screens (1-6): Negative ending cash is penalized with a
    //   smooth shadow cost of capital (proportional to debt interest drag),
    //   allowing the engine to discover high-ROI upgrades without being blocked.
    //
    // - On Finance & Cash Flow (Screen 7): The HARD solvency constraint is enforced.
    //   Bank loans, share buybacks, and dividends MUST balance so ending cash
    //   is securely >= $2,500k to eliminate any risk of emergency overdraft loans.
    // =========================================================================
    if (Number.isFinite(metrics.endingCash)) {
      if (isOperational) {
        if (metrics.endingCash < 0) {
          const cashDeficit = Math.abs(metrics.endingCash);
          // Base financing drag: ~0.25 game score points per $1,000k borrowed (~5.5% loan interest after tax)
          let shadowCost = 1.5 + (cashDeficit / 1000.0) * 0.25;
          // Beyond standard commercial bank loan ceiling (~$15,000k), add quadratic capacity drag
          // to penalize excessive over-leverage and prevent unbounded deficit spending
          if (cashDeficit > 15000) {
            const excess = (cashDeficit - 15000) / 1000.0;
            shadowCost += (excess * excess) * 0.05;
          }
          compositeScore -= shadowCost;
        } else if (metrics.endingCash < c.minCash) {
          // Gentle gradient between $0 and minCash ($2,500k buffer)
          compositeScore -= ((c.minCash - metrics.endingCash) / c.minCash) * 1.5;
        }
      } else {
        if (metrics.endingCash < 0) {
          compositeScore -= 5000.0 + (Math.abs(metrics.endingCash) * 0.05);
        } else if (metrics.endingCash > 0 && metrics.endingCash < 1000) {
          compositeScore -= ((c.minCash - metrics.endingCash) * 2.0) + 2000.0;
        } else if (metrics.endingCash > 0 && metrics.endingCash < c.minCash) {
          compositeScore -= ((c.minCash - metrics.endingCash) / c.minCash) * 5.0;
        }
      }
    }

    return compositeScore;
  }

  /**
   * Evaluates a test value for a specific input and returns projected metrics.
   * Logs an [IMG-PROBE] line whenever Image Rating changes — on ANY page, for ANY
   * input. This gives full visibility into which inputs actually move Image Rating
   * so we can verify timing, scoring, and optimization decisions.
   */
  async evaluateInput(item, value) {
    const preMetrics = this.adapter.getProjectedMetrics();
    const preImageRating = preMetrics.imageRating;
    const previousVal = (typeof item.element?.value !== 'undefined' ? item.element.value : item.value);

    // Clear stale notifications before testing this candidate
    if (typeof this.adapter.consumeRecentErrors === 'function') {
      this.adapter.consumeRecentErrors(5000);
    }

    this.adapter.setInputValue(item, value);
    await this.adapter.triggerCalculate();
    const metrics = this.adapter.getProjectedMetrics();

    // Check if Glo-Bus emitted an error notification (Toastr / native alert)
    const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
      ? this.adapter.consumeRecentErrors(2000)
      : [];

    if (siteErrors && siteErrors.length > 0) {
      metrics._siteRejected = true;
      metrics._siteErrorMsg = siteErrors.map(e => e.message || e.title).filter(Boolean).join(' | ');
      getLogger().warn('INPUT-REJECTED',
        `[${item.label || item.name}] Value ${value} rejected by Glo-Bus: "${metrics._siteErrorMsg}". Reverting to safe value (${previousVal}).`
      );
      // Immediately revert to the previous valid value so DOM remains pristine
      this.adapter.setInputValue(item, previousVal);
      await this.adapter.triggerCalculate();
      return metrics;
    }

    // Log whenever Image Rating changes — any page, any input category.
    // Log whenever Image Rating changes — any page, any input category.
    // Always compare against the active champion baseline to avoid probe pollution in telemetry!
    const championMetrics = this.bestMetrics || preMetrics;
    const championImage = championMetrics?.imageRating ?? preImageRating;
    const delta = metrics.imageRating - championImage;
    if (delta !== 0) {
      const sign = delta > 0 ? '+' : '';
      const score = this.evaluateScore(metrics).toFixed(1);
      const baseScore = (this.bestScore !== undefined && this.bestScore !== -Infinity)
        ? this.bestScore.toFixed(1)
        : this.evaluateScore(championMetrics).toFixed(1);
      getLogger().info('IMG-PROBE',
        `[${item.label || item.name}] = ${value} → Image: ${championImage} → ${metrics.imageRating} (Δ${sign}${delta}) | EPS: $${metrics.eps.toFixed(2)} | Score: ${baseScore} → ${score}`
      );
    }

    return metrics;
  }

  /**
   * Evaluates if state A is strictly superior to state B using Multi-Objective criteria:
   * 1. Higher composite game score (sA > sB + 0.001)
   * 2. Plateau (|sA - sB| <= 0.05) with higher EPS (epsA > epsB + 0.005)
   * 3. Plateau with equal EPS (|epsA - epsB| <= 0.005) and higher ROE (roeA > roeB + 0.05)
   * 4. Plateau with equal EPS and equal ROE with higher Ending Cash (cashA > cashB + 100)
   */
  isSuperior(sA, mA, sB, mB) {
    if (sA === undefined || sA === null || sA === -Infinity) return false;
    if (sB === undefined || sB === null || sB === -Infinity) return true;
    if (sA > sB + 0.001) return true;
    if (Math.abs(sA - sB) <= 0.05) {
      const epsA = mA?.eps || 0;
      const epsB = mB?.eps || 0;
      if (epsA > epsB + 0.005) return true;
      if (epsA >= epsB - 0.005) {
        const roeA = mA?.roe || 0;
        const roeB = mB?.roe || 0;
        if (roeA > roeB + 0.05) return true;
        if (roeA >= roeB - 0.01) {
          const cashA = mA?.endingCash || 0;
          const cashB = mB?.endingCash || 0;
          if (cashA > cashB + 100) return true;
        }
      }
    }
    return false;
  }

  /**
   * Evaluates if a given candidate state (score, metrics) is strictly superior to the current recorded peak.
   * Glo-Bus Multi-Objective Tie-Breaking Criterion:
   * 1. Higher composite game score (score > peakScore + 0.001)
   * 2. Equal composite game score plateau (|score - peakScore| <= 0.05) with higher EPS (candidateEPS > peakEPS + 0.005)
   * 3. Equal composite score & EPS with higher ROE (candidateROE > peakROE + 0.05)
   */
  isNewPeak(score, metrics) {
    if (this.peakScore === undefined || this.peakScore === null || this.peakScore === -Infinity) return true;
    if (score > this.peakScore + 0.001) return true;
    if (Math.abs(score - this.peakScore) <= 0.05) {
      const peakEPS = this.peakMetrics?.eps || 0;
      const candidateEPS = metrics?.eps || 0;
      if (candidateEPS > peakEPS + 0.005) return true;
      if (candidateEPS >= peakEPS - 0.005) {
        const peakROE = this.peakMetrics?.roe || 0;
        const candidateROE = metrics?.roe || 0;
        if (candidateROE > peakROE + 0.05) return true;
      }
    }
    return false;
  }

  /**
   * Updates this.peakScore, this.peakMetrics, and this.peakCombo if candidate represents a new peak.
   */
  updatePeak(score, metrics, snapshot) {
    if (this.isNewPeak(score, metrics)) {
      this.peakScore = score;
      this.peakMetrics = metrics ? { ...metrics } : null;
      if (snapshot) {
        this.peakCombo = snapshot;
      }
      return true;
    }
    return false;
  }

  /**
   * Starts the optimization loop on current screen
   */
  async start(shouldSave = true) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isStopped = false;
    this.iteration = 0;

    const log = getLogger();
    log.info('START', `Initiating optimization run (${this.getActiveConfig().name})...`);

    // Set operational solvency phase based on active screen
    const detectedPage = this.adapter?.detectPageType ? this.adapter.detectPageType() : (this.adapter?.pageType || 'UNKNOWN');
    const isFinanceScreen = detectedPage === 'FINANCE';
    const isCsrScreen = detectedPage === 'CSR';
    this.isOperationalPhase = !isFinanceScreen && !isCsrScreen && detectedPage !== 'UNKNOWN';

    if (this.isOperationalPhase) {
      log.info('SOLVENCY', `Operational Screen [${detectedPage}]: Scoring with Debt Shadow Cost (Investments allowed to run deficits for Screen 7 financing).`);
    } else if (isCsrScreen) {
      log.info('SOLVENCY', `Corporate Citizenship Screen [${detectedPage}]: Authentic Multi-Objective Scoring ACTIVE (Image recovery and brand equity optimization).`);
    } else {
      log.info('SOLVENCY', `Finance Screen [${detectedPage}]: Strict Solvency Gate ACTIVE (Enforcing Ending Cash >= $${this.getActiveConfig().constraints.minCash}k and Credit >= A-).`);
    }

    if (this.onStatusChange) this.onStatusChange('running');

    // 1. Capture snapshot of initial state for rollback
    this.initialSnapshot = this.adapter.captureInitialSnapshot();

    // 2. Measure baseline
    await this.adapter.triggerCalculate();
    this.baselineMetrics = this.adapter.getProjectedMetrics();
    this.baselineScore = this.evaluateScore(this.baselineMetrics);
    this.bestMetrics = { ...this.baselineMetrics };
    this.bestScore = this.baselineScore;
    this.bestCombo = this.adapter.captureSnapshot();
    this.peakScore = this.baselineScore;
    this.peakMetrics = { ...this.baselineMetrics };
    this.peakCombo = this.adapter.captureSnapshot();

    if (this.onBaselineEstablished) {
      this.onBaselineEstablished(this.baselineMetrics);
    }

    if (!this.baselineMetrics || this.baselineMetrics.eps === 0) {
      log.warn('BASELINE', `Initial EPS read as $0.00. Scoreboard table may be in an unrendered frame or loading.`);
    } else {
      log.success('BASELINE', `Screen baseline established: EPS $${this.baselineMetrics.eps.toFixed(2)} | ROE ${this.baselineMetrics.roe.toFixed(1)}% | Cash $${Math.round(this.baselineMetrics.endingCash)}k | Utility Score ${this.bestScore.toFixed(1)}`);
    }

    // Diagnostic: Log what buttons exist on this page and what Image Rating is currently read.
    // This gives ground truth instead of guessing about page structure.
    try {
      const diagDocs = this.adapter.getAllDocuments();
      const allBtns = [];
      diagDocs.forEach(d => {
        d.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn').forEach(b => {
          const t = (b.textContent || b.value || '').trim();
          if (t && !allBtns.includes(t)) allBtns.push(t);
        });
      });
      const pageType = this.adapter.pageType || 'UNKNOWN';
      log.info('PAGE-SCAN',
        `[${pageType}] Buttons detected: [${allBtns.slice(0, 10).join(' | ')}]` +
        ` | Image Rating read: ${this.baselineMetrics?.imageRating ?? 'N/A'}` +
        ` | EPS read: $${this.baselineMetrics?.eps?.toFixed(2) ?? 'N/A'}`
      );
    } catch (_) {}

    // 3. Run search loop
    try {
      await this.runOptimizationLoop();
    } catch (err) {
      log.error('ENGINE', `Optimization loop exception: ${err.message}`, err);
    }

    // Cancellation check: If stopped during execution, disarm and do NOT auto-save
    if (this.isStopped || !this.isRunning) {
      this.isRunning = false;
      log.info('STOP', 'Optimization halted by user request. Auto-save suppressed.');
      if (this.onStatusChange) this.onStatusChange('stopped');
      return {
        bestMetrics: this.bestMetrics,
        bestCombo: this.bestCombo,
        saveResult: null,
        stopped: true
      };
    }

    this.isRunning = false;

    // 4. Finalize decisions on this screen
    // Multi-Objective Peak-State Restoration:
    // If the optimizer explored a valley or ended on an exploratory annealing move,
    // restore the highest recorded peak combo before final verification & auto-save!
    const targetPeakCombo = this.peakCombo || this.bestCombo || this.initialSnapshot;
    const targetPeakScore = (this.peakScore !== undefined && this.peakScore !== -Infinity) ? this.peakScore : this.bestScore;
    const peakEPS = this.peakMetrics?.eps || this.bestMetrics?.eps || 0;
    const baseEPS = this.baselineMetrics?.eps || 0;
    const baseScore = this.baselineScore || 0;

    // Read current live screen state in DOM
    await this.adapter.triggerCalculate();
    const preLiveMetrics = this.adapter.getProjectedMetrics();
    const preLiveScore = this.evaluateScore(preLiveMetrics);

    // Unconditional Peak Restoration: If the current DOM has drifted away from the best recorded state
    // (either an upgraded peak or authentic baseline), restore targetPeakCombo immediately!
    const isDrifted = (preLiveScore < targetPeakScore - 0.01 || preLiveMetrics.eps < peakEPS - 0.01);
    if (targetPeakCombo && isDrifted) {
      log.info('FINALIZE', `Restoring recorded peak decision combination (Peak Score: ${targetPeakScore.toFixed(1)}, EPS: $${peakEPS.toFixed(2)} vs Baseline Score: ${baseScore.toFixed(1)}, EPS: $${baseEPS.toFixed(2)})...`);
      await this.adapter.restoreSnapshot(targetPeakCombo);
    }

    // Verify live screen performance with a clean recalculation
    await this.adapter.triggerCalculate();
    const liveMetrics = this.adapter.getProjectedMetrics();
    const liveScore = this.evaluateScore(liveMetrics);

    // Multi-Objective Safety Verification: Confirm live decisions improve or preserve overall game score and EPS
    const preservesScore = liveScore >= baseScore - 0.05;
    const improvesOrPreservesEPS = liveMetrics.eps >= baseEPS - 0.005;

    if (preservesScore && (liveScore > baseScore + 0.001 || improvesOrPreservesEPS)) {
      this.bestMetrics = liveMetrics;
      this.bestScore = liveScore;
      this.bestCombo = targetPeakCombo || this.adapter.captureSnapshot();
      const scoreGain = (liveScore - baseScore).toFixed(1);
      const epsGain = (liveMetrics.eps - baseEPS).toFixed(2);
      log.success('FINALIZE', `Screen decisions applied! Screen Score Δ: ${scoreGain >= 0 ? '+' : ''}${scoreGain} | Screen EPS Δ: ${epsGain >= 0 ? '+' : ''}$${epsGain} | Image: ${liveMetrics.imageRating}`);
    } else {
      // Metric degradation detected - trigger safety rollback to baseline
      log.warn('SAFETY', `Score degradation detected (Score: ${liveScore.toFixed(1)} vs Baseline: ${baseScore.toFixed(1)}). Rolling back to baseline decisions.`);
      if (this.initialSnapshot) {
        await this.adapter.restoreSnapshot(this.initialSnapshot);
        await this.adapter.triggerCalculate();
        this.bestMetrics = this.adapter.getProjectedMetrics();
        this.bestScore = this.evaluateScore(this.bestMetrics);
      }
      if (this.bestMetrics && this.bestMetrics.eps < baseEPS - 0.005) {
        log.warn('SAFETY', `Rollback verification warning: Restored EPS ($${this.bestMetrics.eps.toFixed(2)}) is below initial baseline ($${baseEPS.toFixed(2)}).`);
      }
      log.info('FINALIZE', `Baseline decisions safely preserved. Final Score: ${this.bestScore.toFixed(1)} | EPS: $${this.bestMetrics.eps.toFixed(2)}`);
    }

    // 5. Automatically save decisions if enabled and requested
    let saveResult = null;
    if (this.autoSave && shouldSave) {
      log.info('SAVE', 'Auto-saving optimized decisions to Glo-Bus servers...');
      saveResult = await this.adapter.saveDecisions();
      if (saveResult && saveResult.ok) {
        log.success('SAVE', 'Saved successfully! Decisions confirmed on server.');
      } else {
        log.warn('SAVE', `Save result: ${saveResult?.error || 'Save button could not be confirmed.'}`);
      }
    } else if (!shouldSave) {
      log.info('SAVE', 'Decisions placed on screen. Saving deferred until the final page of the round.');
    }

    if (this.onStatusChange) this.onStatusChange('finished');
    if (this.onComplete) this.onComplete(this.bestMetrics, saveResult);

    return {
      bestMetrics: this.bestMetrics,
      bestCombo: this.bestCombo,
      saveResult
    };
  }

  /**
   * Stops the running optimization immediately
   */
  stop() {
    this.isRunning = false;
    this.isStopped = true;
    this.isOperationalPhase = false;
    if (this.onStatusChange) this.onStatusChange('stopped');
  }

  /**
   * Main multi-variable optimization with coupled pair search and multi-pass Gauss-Seidel relaxation
   */
  async runOptimizationLoop() {
    const log = getLogger();

    // Dedicated auction solver for Special Contract Offers
    if (this.adapter.detectPageType() === 'SPECIAL_CONTRACTS') {
      await this.runSpecialContractsOptimization();
      return;
    }

    const inputs = this.adapter.getDecisionInputs();
    if (inputs.length === 0) {
      log.error('INPUTS', 'No decision inputs detected on this page! Are you logged in on an editable decision page?');
      return;
    }

    // 1. Economic Priority Sorting (Causal Chain):
    // R&D & Specs -> Capacity & Compensation -> Margins & Prices -> Volume & Ads -> CSR -> Finance (Debt -> Early Payoff -> Issue -> Buyback -> Dividends)
    const getPriority = (item) => {
      const priorityMap = { rd: 1, facilities: 2, compensation: 3, price: 4, marketing: 5, discount: 6, csr: 7, finance: 8, general: 9 };
      let p = priorityMap[item.category] || 9;
      if (item.category === 'finance') {
        const lbl = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
        // 8.1: Debt & Liquidity Injection: Bank loans / borrowing (supply cash to balance sheet first)
        if ((lbl.includes('loan') || lbl.includes('borrow') || lbl.includes('bank') || lbl.includes('debt')) &&
            !lbl.includes('retire') && !lbl.includes('repay') && !lbl.includes('early')) {
          p = 8.1;
        }
        // 8.2: Early debt retirement / paydown (retire excess debt if cash allows)
        else if (lbl.includes('retire') || lbl.includes('repay') || lbl.includes('excess cash') || lbl.includes('early')) {
          p = 8.2;
        }
        // 8.3: Common Stock Issuance (dilutive, evaluated before buyback)
        else if (lbl.includes('issue')) {
          p = 8.3;
        }
        // 8.4: Share Repurchases (Buybacks) (shrinks share count to boost EPS & ROE)
        else if (lbl.includes('repurchase') || lbl.includes('buyback')) {
          p = 8.4;
        }
        // 8.5: Dividends (returns surplus cash to shareholders)
        else if (lbl.includes('dividend')) {
          p = 8.5;
        }
      }
      return p;
    };

    inputs.sort((a, b) => getPriority(a) - getPriority(b));

    log.info('SCAN', `Found ${inputs.length} decision inputs across page frames. Sorted by economic priority chain.`);

    // 2. Identify tightly coupled interdependent pairs on this screen
    const coupledPairs = this.identifyCoupledPairs(inputs);
    if (coupledPairs.length > 0) {
      log.info('COUPLED', `Identified ${coupledPairs.length} coupled interdependent pair(s) for 2D co-optimization.`);
    }

    // Dedicated Combinatorial Star-Rating Solver for Screen 1 (Product Design) (Pillars 1 & 2)
    const detectedPage = this.adapter?.detectPageType ? this.adapter.detectPageType() : (this.adapter?.pageType || 'UNKNOWN');
    if (detectedPage === 'PRODUCT_DESIGN' && StarSolver) {
      log.step('STAR-TIER', 'Evaluating discrete Pareto star rating bundles with Downstream Price Decoupling...');
      const preStarSnapshot = this.adapter.captureSnapshot(inputs);
      let bundleAccepted = false;
      const candidateTiers = StarSolver.getCandidateStarTiers(4.0);
      for (const tier of candidateTiers) {
        if (!this.isRunning || this.isStopped) break;
        const bundle = StarSolver.CAMERA_STAR_BUNDLES[tier];
        if (!bundle) continue;
        const assignments = StarSolver.matchBundleToInputs(inputs, bundle);
        if (assignments.length > 0) {
          assignments.forEach(a => this.adapter.setInputValue(a.item, a.value));
          await this.adapter.triggerCalculate();
          const metrics = this.adapter.getProjectedMetrics();
          const score = (bundle.targetWholesalePrice && typeof this.evaluateScoreWithProxy === 'function')
            ? this.evaluateScoreWithProxy(metrics, bundle.targetWholesalePrice, bundle.targetRetailPrice)
            : this.evaluateScore(metrics);
          if (score > this.bestScore) {
            this.bestScore = score;
            this.bestMetrics = metrics;
            this.bestCombo = this.adapter.captureSnapshot(inputs);
            this.updatePeak(score, metrics, this.bestCombo);
            bundleAccepted = true;
            log.success('ACCEPT', `[Star Bundle ${tier}★] Coordinated upgrade accepted with Price Proxy! Utility Score: ${this.bestScore.toFixed(1)}, EPS: $${metrics.eps.toFixed(2)}`);
          } else {
            this.updatePeak(score, metrics, this.adapter.captureSnapshot(inputs));
          }
        }
      }

      // Also evaluate Drone Star Bundles if drone inputs present
      if (typeof StarSolver.getCandidateDroneStarTiers === 'function') {
        const droneCandidateTiers = StarSolver.getCandidateDroneStarTiers(4.0);
        for (const tier of droneCandidateTiers) {
          if (!this.isRunning || this.isStopped) break;
          const bundle = StarSolver.DRONE_STAR_BUNDLES ? StarSolver.DRONE_STAR_BUNDLES[tier] : null;
          if (!bundle) continue;
          const droneAssignments = StarSolver.matchDroneBundleToInputs(inputs, bundle);
          if (droneAssignments.length > 0) {
            droneAssignments.forEach(a => this.adapter.setInputValue(a.item, a.value));
            await this.adapter.triggerCalculate();
            const metrics = this.adapter.getProjectedMetrics();
            const score = (bundle.targetRetailPrice && typeof this.evaluateScoreWithProxy === 'function')
              ? this.evaluateScoreWithProxy(metrics, null, bundle.targetRetailPrice)
              : this.evaluateScore(metrics);
            if (score > this.bestScore) {
              this.bestScore = score;
              this.bestMetrics = metrics;
              this.bestCombo = this.adapter.captureSnapshot(inputs);
              this.updatePeak(score, metrics, this.bestCombo);
              bundleAccepted = true;
              log.success('ACCEPT', `[Drone Bundle ${tier}★] Coordinated drone upgrade accepted! Utility Score: ${this.bestScore.toFixed(1)}, EPS: $${metrics.eps.toFixed(2)}`);
            } else {
              this.updatePeak(score, metrics, this.adapter.captureSnapshot(inputs));
            }
          }
        }
      }

      // Revert to initial state if no star bundle produced a net utility gain
      if (!bundleAccepted) {
        await this.adapter.restoreSnapshot(preStarSnapshot);
        await this.adapter.triggerCalculate();
      }
    }

    const totalSteps = (inputs.length * 2) + coupledPairs.length;
    let stepCount = 0;

    // PASS 1: Global Coordinate Descent (Sets the primary operating level for each variable)
    this.currentPass = 1;
    log.step('PASS 1', `Pass 1: Coordinate descent across ${inputs.length} variables...`);
    for (const item of inputs) {
      if (!this.isRunning || this.isStopped) break;
      stepCount++;
      if (this.onProgress) {
        this.onProgress(stepCount, totalSteps, `Pass 1: ${item.label || item.name}`, this.bestMetrics);
      }
      await this.optimizeSingleParameter(item, 1.0, inputs);
      await new Promise(r => setTimeout(r, 40));
    }

    // PASS 2: Coupled Interdependent Co-Optimization (Explores diagonal trade-offs for coupled levers)
    if (coupledPairs.length > 0) {
      this.currentPass = 2;
      log.step('PASS 2', `Pass 2: Diagonal co-optimization across ${coupledPairs.length} coupled pairs...`);
      for (const pair of coupledPairs) {
        if (!this.isRunning || this.isStopped) break;
        stepCount++;
        if (this.onProgress) {
          this.onProgress(stepCount, totalSteps, `Co-Tuning: ${pair.a.label} & ${pair.b.label}`, this.bestMetrics);
        }
        await this.optimizeCoupledPair(pair.a, pair.b, inputs);
        await new Promise(r => setTimeout(r, 40));
      }
    }

    // PASS 3: Feedback & Convergence Polish (Re-evaluates each lever in light of updated interdependent state)
    // Strictly Greedy: Polish passes must never accept exploratory downhill moves!
    this.currentPass = 3;
    log.step('PASS 3', `Pass 3: Fine relaxation polish across ${inputs.length} variables...`);

    // Pre-Pass 3 Peak Combo Restoration (Audit Fix #3 & Bug #1):
    // If Pass 1 or Pass 2 accepted exploratory annealing moves and drifted into a valley,
    // restore the recorded Peak Combo BEFORE running Pass 3 so fine relaxation polish
    // optimizes from the absolute best known state, rather than trying to climb out of a degraded valley.
    const peakToRestore = this.peakCombo || this.bestCombo;
    const isPeakSuperior = peakToRestore && (
      (this.peakScore > this.bestScore + 0.001) ||
      ((this.peakMetrics?.eps || 0) > (this.bestMetrics?.eps || 0) + 0.005) ||
      (Math.abs((this.peakScore || 0) - (this.bestScore || 0)) <= 0.05 && ((this.peakMetrics?.roe || 0) > (this.bestMetrics?.roe || 0) + 0.05))
    );

    if (isPeakSuperior) {
      log.info('PASS 3', `Restoring recorded peak combination before fine polish (Peak Score: ${this.peakScore.toFixed(1)}, EPS: $${this.peakMetrics?.eps?.toFixed(2)})...`);
      await this.adapter.restoreSnapshot(peakToRestore, inputs);
      await this.adapter.triggerCalculate();
      this.bestMetrics = this.adapter.getProjectedMetrics();
      this.bestScore = this.evaluateScore(this.bestMetrics);
    }

    // Re-synchronize BOTH in-memory input states AND DOM elements with peakToRestore
    // Guarantees Pass 3 never inherits stale annealed values (e.g. 2, 27, 2, 18...) and overwrites the DOM!
    if (peakToRestore) {
      for (const item of inputs) {
        const saved = peakToRestore[item.key] || peakToRestore[item.id] || peakToRestore[item.name];
        if (saved !== undefined) {
          if (item.type === 'select') {
            let idx = saved.selectedIndex;
            if (idx === undefined && saved.value !== undefined) {
              const optIdx = item.options ? item.options.findIndex(o => String(o.value) === String(saved.value)) : -1;
              idx = optIdx !== -1 ? optIdx : parseInt(saved.value, 10);
            }
            if (idx !== undefined && !isNaN(idx)) {
              item.selectedIndex = idx;
              item.value = saved.value;
              if (item.element) item.element.selectedIndex = idx;
            }
          } else {
            const numVal = typeof saved.value === 'number' ? saved.value : parseFloat(String(saved.value).replace(/,/g, ''));
            item.value = Number.isFinite(numVal) ? numVal : saved.value;
            if (item.element) item.element.value = saved.value;
          }
        } else if (item.element) {
          if (item.type === 'select') {
            item.selectedIndex = item.element.selectedIndex;
            item.value = item.element.value;
          } else {
            const raw = parseFloat(String(item.element.value || '').replace(/,/g, ''));
            if (Number.isFinite(raw)) item.value = raw;
          }
        }
      }
    }

    const savedTemp = this.temperature;
    this.temperature = 0.0;
    try {
      for (const item of inputs) {
        if (!this.isRunning || this.isStopped) break;
        stepCount++;
        if (this.onProgress) {
          this.onProgress(stepCount, totalSteps, `Refining: ${item.label || item.name}`, this.bestMetrics);
        }
        await this.optimizeSingleParameter(item, 0.5, inputs);
        await new Promise(r => setTimeout(r, 40));
      }
    } finally {
      this.temperature = savedTemp;
    }

    log.success('COMPLETE', `Optimization passes complete! Final utility score: ${this.bestScore.toFixed(1)}`);
  }

  /**
   * Dedicated sealed-bid auction optimizer for Special Contract Offers.
   * Glo-Bus awards contracts to the top 3 companies with the highest Value Index.
   * This solver:
   * 1. Filters out viewing assumptions so the optimizer is never deceived by artificial scoreboard jumps.
   * 2. Defends Contribution Margin ($/unit) against the $50 outsourced assembly penalty.
   * 3. Tunes discount offers (0% to 35%) to land in the sweet spot Value Index (51 to 55) for top-3 win probability.
   * 4. Synchronizes competitive assumption dropdowns based on win probability.
   */
  async runSpecialContractsOptimization() {
    const log = getLogger();
    log.info('CONTRACTS', 'Executing sealed-bid auction optimizer for Special Contracts (Target Value Index: 51–55)...');

    const inputs = this.adapter.getDecisionInputs();
    if (inputs.length === 0) {
      log.warn('CONTRACTS', 'No special discount inputs detected on this page.');
      return;
    }

    const getRegionKey = (item) => {
      const t = `${item.label} ${item.name} ${item.id}`.toLowerCase();
      if (t.includes('n.a') || t.includes('north america') || t.includes('na_')) return 'na';
      if (t.includes('e-a') || t.includes('europe') || t.includes('ea_')) return 'ea';
      if (t.includes('a-p') || t.includes('asia') || t.includes('ap_')) return 'ap';
      if (t.includes('l.a') || t.includes('latin') || t.includes('la_')) return 'la';
      return null;
    };

    const regionNames = {
      na: 'North America',
      ea: 'Europe-Africa',
      ap: 'Asia-Pacific',
      la: 'Latin America'
    };

    const TARGET_VI_MIN = 51;
    const TARGET_VI_MAX = 56;
    const SAFE_MIN_MARGIN = 25.0; // Minimum margin required ($/unit) to justify capacity risk / outsourcing

    let step = 0;
    const totalSteps = inputs.length;

    try {
      // Temporary Pro-Forma Calibration (Audit Fix #4):
      // Glo-Bus only renders live Value Index and Contribution Margin per unit when the regional incorporation
      // toggle is set to "Yes". We temporarily enable them to calibrate the exact discount % that lands in the
      // winning Value Index sweet spot (51-55) with safe margin.
      this.adapter.setSpecialContractAssumptions({ na: true, ea: true, ap: true, la: true });
      await this.adapter.triggerCalculate();

      for (const item of inputs) {
        if (!this.isRunning || this.isStopped) break;
        step++;
        const regionKey = getRegionKey(item) || `reg_${step}`;
        const regionName = regionNames[regionKey] || item.label;

        if (this.onProgress) {
          this.onProgress(step, totalSteps, `Auction: ${regionName}`, this.bestMetrics);
        }

        let contractData = this.adapter.getSpecialContractData();
        let rData = contractData[regionKey] || { valueIndex: 0, marginPerUnit: 100 };

        let currentDiscount = Math.round(Number(item.value) || 0);

        log.info('CONTRACTS', `Evaluating [${regionName}]: Initial Discount: ${currentDiscount}%, Value Index: ${rData.valueIndex || 'N/A'}, Margin: $${rData.marginPerUnit.toFixed(2)}/unit`);

        // If margin is dangerously low, opt out (0% discount) to prevent destroying profit
        if (rData.marginPerUnit > 0 && rData.marginPerUnit < SAFE_MIN_MARGIN) {
          log.warn('CONTRACTS', `[${regionName}] Margin ($${rData.marginPerUnit.toFixed(2)}/unit) below safe threshold ($${SAFE_MIN_MARGIN}). Opting out (0% discount).`);
          this.adapter.setInputValue(item, 0);
          item.value = 0;
          await this.adapter.triggerCalculate();
          continue;
        }

        // Two-Tiered Contract Capacity Reservation & Outsourcing Gate (Fix #4)
        if (CapacityKernel && CapacityKernel.ContractReservation) {
          const capacityCheck = CapacityKernel.ContractReservation.evaluateContractBid(
            { region: regionKey, discount: currentDiscount, bidPrice: 200, estimatedBOM: 95, estimatedLabor: 35 },
            { regularCapacity: 300000, maxOvertimeCapacity: 360000, retailDemand: 290000 }
          );
          if (!capacityCheck.isApproved) {
            log.warn('CONTRACTS', `[${regionName}] Capacity Gate: ${capacityCheck.reason}`);
            this.adapter.setInputValue(item, 0);
            item.value = 0;
            await this.adapter.triggerCalculate();
            continue;
          }
        }

        // If Value Index can be read from the table:
        if (rData.valueIndex > 0) {
          let attempts = 0;
          let lastVI = rData.valueIndex;
          // 1. If Value Index is too low (< 51): increase discount until we hit the sweet spot
          while (rData.valueIndex < TARGET_VI_MIN && currentDiscount < 35 && (!rData.marginPerUnit || rData.marginPerUnit >= SAFE_MIN_MARGIN) && attempts < 10) {
            if (!this.isRunning || this.isStopped) break;
            attempts++;
            currentDiscount++;
            this.adapter.setInputValue(item, currentDiscount);
            item.value = currentDiscount;
            await this.adapter.triggerCalculate();
            contractData = this.adapter.getSpecialContractData();
            rData = contractData[regionKey] || rData;
            if (rData.marginPerUnit < SAFE_MIN_MARGIN) {
              // Back off 1 step if margin dropped below threshold
              currentDiscount--;
              this.adapter.setInputValue(item, currentDiscount);
              item.value = currentDiscount;
              await this.adapter.triggerCalculate();
              break;
            }
            if (rData.valueIndex === lastVI && attempts > 1) {
              // Table is not updating dynamically (e.g. static mock)
              break;
            }
            lastVI = rData.valueIndex;
          }

          attempts = 0;
          lastVI = rData.valueIndex;
          // 2. If Value Index is too high (> 56): reduce discount to capture higher contribution margin
          while (rData.valueIndex > TARGET_VI_MAX && currentDiscount > 0 && attempts < 10) {
            if (!this.isRunning || this.isStopped) break;
            attempts++;
            currentDiscount--;
            this.adapter.setInputValue(item, currentDiscount);
            item.value = currentDiscount;
            await this.adapter.triggerCalculate();
            contractData = this.adapter.getSpecialContractData();
            rData = contractData[regionKey] || rData;
            if (rData.valueIndex < TARGET_VI_MIN) {
              // Back up 1 step if we dropped below target
              currentDiscount++;
              this.adapter.setInputValue(item, currentDiscount);
              item.value = currentDiscount;
              await this.adapter.triggerCalculate();
              break;
            }
            if (rData.valueIndex === lastVI && attempts > 1) {
              // Table is not updating dynamically (e.g. static mock)
              break;
            }
            lastVI = rData.valueIndex;
          }
        } else {
          // Fallback for mocked or unrendered table: establish standard competitive benchmark (20-22%)
          if (currentDiscount < 15 || currentDiscount > 28) {
            currentDiscount = 21;
            this.adapter.setInputValue(item, currentDiscount);
            item.value = currentDiscount;
            await this.adapter.triggerCalculate();
          }
        }

        contractData = this.adapter.getSpecialContractData();
        rData = contractData[regionKey] || rData;
        log.success('CONTRACTS', `Finalized [${regionName}]: Discount: ${currentDiscount}%, Value Index: ${rData.valueIndex || 'Est. 52-54'}, Margin: $${rData.marginPerUnit.toFixed(2)}/unit`);
        await new Promise(r => setTimeout(r, 60));
      }
    } finally {
      // Cash-Defensive Solvency Policy (Audit Fix #4):
      // In Glo-Bus, setting "Incorporate projected outcomes" to "Yes" adds hypothetical contract
      // revenues (+$8.2M cash, +$0.41 EPS) into pro-forma statements.
      // If incorporated, the Finance screen allocates buybacks and dividends under the assumption that
      // this speculative cash is 100% guaranteed. If competitors outbid in any region, that cash never
      // materializes, causing an emergency overdraft loan (12%+ penalty) and credit collapse.
      //
      // Therefore, we keep all discount offers (bids) fully active (21-25%) so the company competes to win,
      // but strictly force all regional pro-forma incorporation toggles back to "No" in this finally block.
      // This guarantees that Finance plans strictly against guaranteed revenues, protecting the $2,500k cash buffer.
      const assumptionMap = {
        na: false,
        ea: false,
        ap: false,
        la: false
      };
      this.adapter.setSpecialContractAssumptions(assumptionMap);
      await this.adapter.triggerCalculate();
      log.info('CONTRACTS', 'Cash-Defensive Solvency Policy: Regional incorporation toggles set to "No" to protect Finance cash buffer. (Discount bids remain active!)');
    }

    if (!this.isRunning || this.isStopped) return;

    this.bestCombo = this.adapter.captureSnapshot(inputs);
    this.bestMetrics = this.adapter.getProjectedMetrics();
    this.bestScore = this.evaluateScore(this.bestMetrics);
    this.updatePeak(this.bestScore, this.bestMetrics, this.bestCombo);

    log.success('COMPLETE', `Special Contracts bids submitted! Guaranteed Base EPS: $${this.bestMetrics.eps.toFixed(2)} (Any contracts won will provide +$0.40+ bonus upside)`);
  }

  /**
   * Discovers variables that have strong economic cross-elasticities on the same screen
   */
  identifyCoupledPairs(inputs) {
    const pairs = [];
    const used = new Set();

    const getRegion = (item) => {
      const t = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
      if (t.includes('north america') || t.includes('n.a') || t.includes('na_') || t.includes(' na ') || t.startsWith('na')) return 'na';
      if (t.includes('europe') || t.includes('e-a') || t.includes('ea_') || t.includes(' ea ') || t.startsWith('ea')) return 'ea';
      if (t.includes('asia') || t.includes('a-p') || t.includes('ap_') || t.includes(' ap ') || t.startsWith('ap')) return 'ap';
      if (t.includes('latin') || t.includes('l.a') || t.includes('la_') || t.includes(' la ') || t.startsWith('la')) return 'la';
      return null;
    };

    for (let i = 0; i < inputs.length; i++) {
      if (used.has(inputs[i])) continue;
      for (let j = i + 1; j < inputs.length; j++) {
        if (used.has(inputs[j])) continue;

        const a = inputs[i];
        const b = inputs[j];
        const aLabel = (a.label + ' ' + a.name).toLowerCase();
        const bLabel = (b.label + ' ' + b.name).toLowerCase();

        const aReg = getRegion(a);
        const bReg = getRegion(b);
        const commonRegion = aReg && bReg && (aReg === bReg);

        // Pair 1: Price and Advertising in the same regional market
        const isRegionalPriceAndAd = ((a.category === 'price' && b.category === 'marketing') ||
                                     (b.category === 'price' && a.category === 'marketing')) && commonRegion;

        // Pair 1b: Price and Retailer Discount in the same regional market
        const isRegionalPriceAndDiscount = ((a.category === 'price' && b.category === 'discount') ||
                                           (b.category === 'price' && a.category === 'discount')) && commonRegion;

        // Pair 2: Base Wage & Assembly Incentive (Labor cost per unit trade-off)
        const isLaborTradeoff = (aLabel.includes('wage') && bLabel.includes('incentive')) ||
                                (bLabel.includes('wage') && aLabel.includes('incentive'));

        // Pair 3: Stock Buyback & Dividend (Capital return trade-off)
        const isBuybackA = aLabel.includes('buyback') || aLabel.includes('repurchase');
        const isBuybackB = bLabel.includes('buyback') || bLabel.includes('repurchase');
        const isFinanceTradeoff = (isBuybackA && bLabel.includes('dividend')) ||
                                 (isBuybackB && aLabel.includes('dividend'));

        if (isRegionalPriceAndAd || isRegionalPriceAndDiscount || isLaborTradeoff || isFinanceTradeoff) {
          pairs.push({ a, b });
          used.add(a);
          used.add(b);
          break;
        }
      }
    }
    return pairs;
  }

  /**
   * Co-optimizes two interdependent variables simultaneously across their diagonal response surface with momentum acceleration
   */
  async optimizeCoupledPair(itemA, itemB, allInputsList = null) {
    const log = getLogger();
    const getVal = (item) => {
      if (item.type === 'select') {
        return (item.element && item.element.selectedIndex !== undefined) ? item.element.selectedIndex : (item.selectedIndex ?? 0);
      }
      if (item.element && item.element.value !== undefined && item.element.value !== '') {
        const parsed = parseFloat(String(item.element.value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : (typeof item.value === 'number' ? item.value : 0);
      }
      return typeof item.value === 'number' ? item.value : 0;
    };
    const valA = getVal(itemA);
    const valB = getVal(itemB);
    itemA.value = valA;
    itemB.value = valB;
    if (itemA.type === 'select') itemA.selectedIndex = valA;
    if (itemB.type === 'select') itemB.selectedIndex = valB;
    const cycleScale = this.stepScaleMultiplier !== undefined ? this.stepScaleMultiplier : 1.0;
    const isIntA = Boolean(itemA.isInteger || itemA.type === 'select' || (Number.isInteger(itemA.step) && itemA.step >= 1));
    const isIntB = Boolean(itemB.isInteger || itemB.type === 'select' || (Number.isInteger(itemB.step) && itemB.step >= 1));
    const stepA = isIntA ? Math.max(1, Math.round(itemA.step * cycleScale)) : Math.max(0.01, itemA.step * cycleScale);
    const stepB = isIntB ? Math.max(1, Math.round(itemB.step * cycleScale)) : Math.max(0.01, itemB.step * cycleScale);

    // Test 4 diagonal coupled perturbations:
    // (+dA, +dB), (+dA, -dB), (-dA, +dB), (-dA, -dB)
    const candidates = [
      { a: Math.min(itemA.max, isIntA ? Math.round(valA + stepA) : valA + stepA), b: Math.min(itemB.max, isIntB ? Math.round(valB + stepB) : valB + stepB) },
      { a: Math.min(itemA.max, isIntA ? Math.round(valA + stepA) : valA + stepA), b: Math.max(itemB.min, isIntB ? Math.round(valB - stepB) : valB - stepB) },
      { a: Math.max(itemA.min, isIntA ? Math.round(valA - stepA) : valA - stepA), b: Math.min(itemB.max, isIntB ? Math.round(valB + stepB) : valB + stepB) },
      { a: Math.max(itemA.min, isIntA ? Math.round(valA - stepA) : valA - stepA), b: Math.max(itemB.min, isIntB ? Math.round(valB - stepB) : valB - stepB) }
    ];

    let bestPair = { a: valA, b: valB };
    let improved = false;

    for (const cand of candidates) {
      if (!this.isRunning || this.isStopped) break;
      if (cand.a === valA && cand.b === valB) continue;

      if (typeof this.adapter.consumeRecentErrors === 'function') {
        this.adapter.consumeRecentErrors(5000);
      }

      this.adapter.setInputValue(itemA, cand.a);
      this.adapter.setInputValue(itemB, cand.b);
      await this.adapter.triggerCalculate();
      const metrics = this.adapter.getProjectedMetrics();

      const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
        ? this.adapter.consumeRecentErrors(2000)
        : [];
      if (siteErrors && siteErrors.length > 0) {
        metrics._siteRejected = true;
      }

      const score = this.evaluateScore(metrics);

      if (this.bestMetrics && metrics.imageRating !== this.bestMetrics.imageRating) {
        const delta = metrics.imageRating - this.bestMetrics.imageRating;
        const sign = delta > 0 ? '+' : '';
        log.info('IMG-PROBE', `[Coupled: ${itemA.label || itemA.name} & ${itemB.label || itemB.name}] = (${cand.a}, ${cand.b}) → Image: ${this.bestMetrics.imageRating} → ${metrics.imageRating} (Δ${sign}${delta}) | Score: ${score.toFixed(1)}`);
      }

      if (this.isSuperior(score, metrics, this.bestScore, this.bestMetrics)) {
        this.bestScore = score;
        this.bestMetrics = metrics;
        bestPair = cand;
        improved = true;
      }
    }

    // Diagonal Momentum Acceleration (Fix #9)
    if (improved && this.isRunning && !this.isStopped) {
      const deltaA = bestPair.a - valA;
      const deltaB = bestPair.b - valB;

      if (deltaA !== 0 || deltaB !== 0) {
        let currentA = bestPair.a;
        let currentB = bestPair.b;
        let momentumSteps = 0;

        while (momentumSteps < 4 && this.isRunning && !this.isStopped) {
          const nextA = deltaA > 0
            ? Math.min(itemA.max, isIntA ? Math.round(currentA + stepA) : currentA + stepA)
            : (deltaA < 0 ? Math.max(itemA.min, isIntA ? Math.round(currentA - stepA) : currentA - stepA) : currentA);
          const nextB = deltaB > 0
            ? Math.min(itemB.max, isIntB ? Math.round(currentB + stepB) : currentB + stepB)
            : (deltaB < 0 ? Math.max(itemB.min, isIntB ? Math.round(currentB - stepB) : currentB - stepB) : currentB);

          if (nextA === currentA && nextB === currentB) break;

          if (typeof this.adapter.consumeRecentErrors === 'function') {
            this.adapter.consumeRecentErrors(5000);
          }

          this.adapter.setInputValue(itemA, nextA);
          this.adapter.setInputValue(itemB, nextB);
          await this.adapter.triggerCalculate();
          const metrics = this.adapter.getProjectedMetrics();

          const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
            ? this.adapter.consumeRecentErrors(2000)
            : [];
          if (siteErrors && siteErrors.length > 0) {
            metrics._siteRejected = true;
          }

          const score = this.evaluateScore(metrics);

          if (this.isSuperior(score, metrics, this.bestScore, this.bestMetrics)) {
            this.bestScore = score;
            this.bestMetrics = metrics;
            bestPair = { a: nextA, b: nextB };
            currentA = nextA;
            currentB = nextB;
            momentumSteps++;
          } else {
            break;
          }
        }
      }
    }

    if (this.isStopped || !this.isRunning) return false;

    // Set best values
    this.adapter.setInputValue(itemA, bestPair.a);
    this.adapter.setInputValue(itemB, bestPair.b);
    itemA.value = bestPair.a;
    itemB.value = bestPair.b;
    if (itemA.type === 'select') itemA.selectedIndex = bestPair.a;
    if (itemB.type === 'select') itemB.selectedIndex = bestPair.b;

    await this.adapter.triggerCalculate();
    const currentMetrics = this.adapter.getProjectedMetrics();
    const currentScore = this.evaluateScore(currentMetrics);

    if (improved) {
      this.bestScore = currentScore;
      this.bestMetrics = currentMetrics;
      this.bestCombo = this.adapter.captureSnapshot(allInputsList);
      this.updatePeak(currentScore, currentMetrics, this.bestCombo);
      log.success('ACCEPT', `[Coupled] ${itemA.label || itemA.name} -> ${bestPair.a}, ${itemB.label || itemB.name} -> ${bestPair.b} (Score: ${this.bestScore.toFixed(1)}, EPS: $${this.bestMetrics.eps.toFixed(2)})`);
    }

    return improved;
  }

  /**
   * Optimizes a single decision parameter using perturbation, multi-scale exploration, and momentum line search
   */
  async optimizeSingleParameter(item, stepScale = 1.0, allInputsList = null) {
    if (!this.isRunning || this.isStopped) return false;
    const log = getLogger();
    // Always read currentVal directly from live element if present to avoid stale memory drift
    let currentVal;
    if (item.type === 'select') {
      currentVal = (item.element && item.element.selectedIndex !== undefined) ? item.element.selectedIndex : (item.selectedIndex ?? 0);
      item.selectedIndex = currentVal;
    } else {
      if (item.element && item.element.value !== undefined && item.element.value !== '') {
        const domStr = String(item.element.value).trim();
        const parsed = parseFloat(domStr.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
        currentVal = Number.isFinite(parsed) ? parsed : (typeof item.value === 'number' ? item.value : 0);
      } else {
        currentVal = typeof item.value === 'number' ? item.value : 0;
      }
      item.value = currentVal;
    }
    const cycleScale = this.stepScaleMultiplier !== undefined ? this.stepScaleMultiplier : 1.0;
    const isInteger = Boolean(item.isInteger || item.type === 'select' || (Number.isInteger(item.step) && item.step >= 1));
    let step = item.step * stepScale * cycleScale;
    if (isInteger) {
      step = Math.max(1, Math.round(step));
    } else {
      step = Math.max(0.01, step);
    }

    const itemLabel = (item.label + ' ' + item.name + ' ' + (item.id || '')).toLowerCase();
    const paramName = item.label || item.name || 'Param';

    // Audit Fix #5: Dynamic Excess Cash Deployment for Dividends on Screen 7
    // When ending cash exceeds generous solvency cushions ($20M - $50M), probe larger steps
    // so guaranteed idle cash is actively deployed into dividends, boosting ROE and Stock Price.
    const isDividend = itemLabel.includes('dividend');
    if (isDividend) {
      const currentCash = this.bestMetrics?.endingCash || this.baselineMetrics?.endingCash || 0;
      if (currentCash > 50000) {
        step = Math.max(step, 0.50);
      } else if (currentCash > 20000) {
        step = Math.max(step, 0.25);
      }
    }

    let bestVal = currentVal;
    let improved = false;

    // Glo-Bus Financial Safeguard: Mutual Exclusivity between Stock Issue & Stock Repurchase
    const isStockIssue = itemLabel.includes('issue') && (itemLabel.includes('stock') || itemLabel.includes('share'));
    const isStockRepurchase = itemLabel.includes('repurchase') || itemLabel.includes('buyback');

    // Glo-Bus Financial Safeguard: Debt Borrowing Control
    // Never borrow bank debt if ending cash is already >= minCash ($2,500k default).
    // Borrowing when cash is sufficient generates toxic interest expenses and damages Credit Rating.
    const isLoanBorrowing = (item.category === 'finance' || itemLabel.includes('loan') || itemLabel.includes('borrow')) &&
      (itemLabel.includes('loan') || itemLabel.includes('borrow') || itemLabel.includes('bank')) &&
      !itemLabel.includes('retire') && !itemLabel.includes('repay') && !itemLabel.includes('early') && !itemLabel.includes('excess');

    let allowBorrowUp = true;
    if (isLoanBorrowing) {
      const preMetrics = this.adapter.getProjectedMetrics();
      const currentCash = preMetrics ? (preMetrics.endingCash || 0) : 0;
      const minBuffer = this.getActiveConfig().constraints?.minCash || 2500;
      if (currentCash >= minBuffer) {
        if (currentVal === 0) {
          log.info('GUARD', `[${paramName}] Kept at 0 (Cash is already funded at $${Math.round(currentCash)}k; borrowing debt damages Credit Rating).`);
          return false;
        }
        // If loan is already > 0, block upward borrowing and only test downward repayment
        allowBorrowUp = false;
      }
    }

    if (isStockIssue) {
      // In Glo-Bus, you cannot issue stock if stock repurchases are entered in the same year
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activeBuyback = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name).toLowerCase();
        return (lbl.includes('repurchase') || lbl.includes('buyback')) && (parseFloat(i.value) > 0);
      });
      if (activeBuyback) {
        log.info('GUARD', `[Stock Issue] Kept at 0 (Stock Repurchase is active at ${activeBuyback.value}k shares: cannot issue and repurchase in the same year).`);
        return false;
      }
    }

    if (isStockRepurchase) {
      if (CapacityKernel && CapacityKernel.CapexSinkingFund) {
        const preMetrics = this.adapter.getProjectedMetrics();
        const fund = CapacityKernel.CapexSinkingFund.calculateLiquidityFloor({}, preMetrics.endingCash || 0);
        if (fund.isConstrained) {
          log.info('GUARD', `[Stock Repurchase] Constrained to protect strategic Capex Sinking Fund ($${fund.projectedCapexReserve}k growth reserve, cash floor $${fund.minimumLiquidityFloor}k).`);
          return false;
        }
      }

      // If stock issue is active, clear it to 0 first before testing stock repurchases
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activeIssue = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name).toLowerCase();
        return lbl.includes('issue') && (lbl.includes('stock') || lbl.includes('share')) && (parseFloat(i.value) > 0);
      });
      if (activeIssue) {
        log.info('GUARD', `Clearing [Stock Issue] (${activeIssue.value}k) to 0 to enable Stock Repurchase under Glo-Bus mutual exclusivity rule...`);
        this.adapter.setInputValue(activeIssue, 0);
        activeIssue.value = 0;
      }
    }

    // Glo-Bus CSR Safeguard: Mutual Exclusivity between Charitable Total ($000s) and Charitable Percent (%)
    const isCharitable = itemLabel.includes('charit') || itemLabel.includes('contribut');
    const isCharitablePercent = isCharitable && (itemLabel.includes('percent') || itemLabel.includes('%') || itemLabel.includes('profit'));
    const isCharitableTotal = isCharitable && !isCharitablePercent && (itemLabel.includes('total') || itemLabel.includes('$') || itemLabel.includes('amount') || (!itemLabel.includes('percent') && !itemLabel.includes('%')));

    if (isCharitablePercent) {
      // In Glo-Bus, Charitable Percentage cannot be set when Charitable Total ($000s) is also set
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activeTotal = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name + ' ' + (i.id || '')).toLowerCase();
        const isCh = lbl.includes('charit') || lbl.includes('contribut');
        const isPct = lbl.includes('percent') || lbl.includes('%') || lbl.includes('profit');
        return isCh && !isPct && (parseFloat(i.value) > 0);
      });
      if (activeTotal) {
        log.info('GUARD', `[Charitable Percent] Kept at 0 (Charitable Total is active at $${activeTotal.value}k: Glo-Bus mutual exclusivity rule).`);
        return false;
      }
    }

    if (isCharitableTotal) {
      // If Charitable Percent is active > 0, clear it to 0 before testing Charitable Total
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activePercent = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name + ' ' + (i.id || '')).toLowerCase();
        const isCh = lbl.includes('charit') || lbl.includes('contribut');
        const isPct = lbl.includes('percent') || lbl.includes('%') || lbl.includes('profit');
        return isCh && isPct && (parseFloat(i.value) > 0);
      });
      if (activePercent) {
        log.info('GUARD', `Clearing [Charitable Percent] (${activePercent.value}%) to 0 to enable Charitable Total under Glo-Bus mutual exclusivity rule...`);
        this.adapter.setInputValue(activePercent, 0);
        activePercent.value = 0;
      }
    }

    // 1. Test Upward perturbation
    const testValUp = allowBorrowUp ? Math.min(item.max, isInteger ? Math.round(currentVal + step) : currentVal + step) : currentVal;
    let scoreUp = -Infinity;
    let metricsUp = null;

    if (testValUp !== currentVal) {
      metricsUp = await this.evaluateInput(item, testValUp);
      scoreUp = this.evaluateScore(metricsUp);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2. Test Downward perturbation
    // Audit Fix #2: Clean DOM probe restoration before evaluating opposing direction
    const testValDown = Math.max(item.min, isInteger ? Math.round(currentVal - step) : currentVal - step);
    let scoreDown = -Infinity;
    let metricsDown = null;

    if (testValDown !== currentVal) {
      if (testValUp !== currentVal) {
        this.adapter.setInputValue(item, currentVal);
        await this.adapter.triggerCalculate();
      }
      metricsDown = await this.evaluateInput(item, testValDown);
      scoreDown = this.evaluateScore(metricsDown);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2b. Multi-scale exploration: if continuous variable and neither +/-1 step improved, test exploratory 2.5x step
    if (scoreUp <= this.bestScore && scoreDown <= this.bestScore && item.type !== 'select') {
      if (testValDown !== currentVal) {
        this.adapter.setInputValue(item, currentVal);
        await this.adapter.triggerCalculate();
      }
      const exploreStep = isInteger ? Math.max(1, Math.round(step * 2)) : step * 2.5;
      const testValUpExp = allowBorrowUp ? Math.min(item.max, isInteger ? Math.round(currentVal + exploreStep) : currentVal + exploreStep) : currentVal;
      if (testValUpExp !== testValUp && testValUpExp !== currentVal) {
        const mUpExp = await this.evaluateInput(item, testValUpExp);
        const sUpExp = this.evaluateScore(mUpExp);
        if (this.isSuperior(sUpExp, mUpExp, this.bestScore, this.bestMetrics)) {
          scoreUp = sUpExp;
          metricsUp = mUpExp;
          bestVal = testValUpExp;
        }
      }
      if (scoreUp <= this.bestScore && this.isRunning && !this.isStopped) {
        if (testValUpExp !== currentVal) {
          this.adapter.setInputValue(item, currentVal);
          await this.adapter.triggerCalculate();
        }
        const testValDownExp = Math.max(item.min, isInteger ? Math.round(currentVal - exploreStep) : currentVal - exploreStep);
        if (testValDownExp !== testValDown && testValDownExp !== currentVal) {
          const mDownExp = await this.evaluateInput(item, testValDownExp);
          const sDownExp = this.evaluateScore(mDownExp);
          if (this.isSuperior(sDownExp, mDownExp, this.bestScore, this.bestMetrics)) {
            scoreDown = sDownExp;
            metricsDown = mDownExp;
            bestVal = testValDownExp;
          }
        }
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    let acceptedViaAnneal = false;

    // 3. Determine winning direction & apply momentum with Multi-Objective Tie-Breaking
    if (this.isSuperior(scoreUp, metricsUp, this.bestScore, this.bestMetrics) && (scoreUp > scoreDown || (Math.abs(scoreUp - scoreDown) <= 0.05 && (metricsUp?.eps || 0) >= (metricsDown?.eps || 0)))) {
      this.bestScore = scoreUp;
      this.bestMetrics = metricsUp;
      bestVal = (bestVal !== currentVal) ? bestVal : testValUp;
      improved = true;

      // Follow upward momentum while state improves
      let momentumVal = bestVal;
      for (let m = 0; m < 6; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.min(item.max, isInteger ? Math.round(momentumVal + step) : momentumVal + step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (this.isSuperior(nextScore, nextMetrics, this.bestScore, this.bestMetrics)) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    } else if (this.isSuperior(scoreDown, metricsDown, this.bestScore, this.bestMetrics)) {
      this.bestScore = scoreDown;
      this.bestMetrics = metricsDown;
      bestVal = (bestVal !== currentVal) ? bestVal : testValDown;
      improved = true;

      // Follow downward momentum while state improves
      let momentumVal = bestVal;
      for (let m = 0; m < 6; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.max(item.min, isInteger ? Math.round(momentumVal - step) : momentumVal - step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (this.isSuperior(nextScore, nextMetrics, this.bestScore, this.bestMetrics)) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    } else if (this.temperature > 0) {
      // Pillar 3: Simulated Annealing Metropolis Acceptance for Ridge Climbing
      const candidateScore = Math.max(scoreUp, scoreDown);
      const candidateMetrics = (scoreUp >= scoreDown) ? metricsUp : metricsDown;
      const candidateVal = (scoreUp >= scoreDown) ? testValUp : testValDown;

      // Multi-Objective Degradation Safeguard (Audit Fix #3 & Bug #2):
      // Delta must be measured against the true screen peak / champion benchmark, NOT just a degraded valley!
      const peakScoreAnchor = Math.max(this.peakScore || -Infinity, this.baselineScore || -Infinity);
      const peakEpsAnchor = Math.max(this.peakMetrics?.eps || 0, this.baselineMetrics?.eps || 0);

      const deltaScoreFromCurrent = candidateScore - this.bestScore;
      const deltaScoreFromPeak = peakScoreAnchor > -Infinity ? candidateScore - peakScoreAnchor : deltaScoreFromCurrent;
      const deltaEpsFromPeak = peakEpsAnchor > 0 ? (candidateMetrics?.eps || 0) - peakEpsAnchor : (candidateMetrics?.eps || 0) - (this.bestMetrics?.eps || 0);
      const deltaEpsFromCurrent = (candidateMetrics?.eps || 0) - (this.bestMetrics?.eps || 0);

      // Controlled temperature tolerance: allow up to -0.15 delta (or -0.20 * T) relative to peak
      const minDeltaAllowed = Math.max(-0.15, -0.20 * this.temperature);

      // Valley Guard: Never drift more than 0.35 points below the recorded peak or baseline
      const isTooFarFromPeak = peakScoreAnchor > -Infinity && candidateScore < peakScoreAnchor - 0.35;

      // Effective delta combines score drop and EPS drop to prevent silent downward ratcheting
      const effectiveScoreDelta = Math.min(deltaScoreFromCurrent, deltaScoreFromPeak);
      const effectiveEpsDelta = Math.min(deltaEpsFromCurrent, deltaEpsFromPeak);

      // Calculate Boltzmann acceptance probability:
      // A move that degrades score or EPS has P < 1.0 (penalizing both score loss and EPS loss in exponent).
      // A move that is neutral (effectiveScoreDelta ~= 0 and effectiveEpsDelta ~= 0) is NEVER accepted with P = 1.000!
      // It is only accepted with P = 0.50 if ROE or Cash improved, otherwise P = 0.0.
      let pAccept = 0;
      if (!isTooFarFromPeak && candidateScore > -Infinity && effectiveScoreDelta >= minDeltaAllowed && candidateVal !== currentVal) {
        if (effectiveScoreDelta < -0.0001 || effectiveEpsDelta < -0.001) {
          const combinedLoss = effectiveScoreDelta + Math.min(0, effectiveEpsDelta * 2.0);
          pAccept = Math.min(0.95, Math.exp(combinedLoss / (0.25 * this.temperature)));
        } else if (Math.abs(effectiveScoreDelta) <= 0.0001 && Math.abs(effectiveEpsDelta) <= 0.001) {
          const roeImproved = (candidateMetrics?.roe || 0) > (this.bestMetrics?.roe || 0) + 0.05;
          const cashImproved = (candidateMetrics?.endingCash || 0) > (this.bestMetrics?.endingCash || 0) + 100;
          pAccept = (roeImproved || cashImproved) ? 0.50 : 0.0;
        }
      }

      if (pAccept > 0 && Math.random() < pAccept) {
        bestVal = candidateVal;
        this.bestScore = candidateScore;
        this.bestMetrics = candidateMetrics;
        improved = true;
        acceptedViaAnneal = true;
        log.info('ANNEAL', `[${paramName}] Exploratory move accepted under T=${this.temperature.toFixed(2)} (ΔScore: ${effectiveScoreDelta.toFixed(2)}, P=${pAccept.toFixed(3)}): ${currentVal} -> ${bestVal}`);
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    if (isInteger && typeof bestVal === 'number') {
      bestVal = Math.round(bestVal);
    }

    // 4. Commit winning value to DOM and re-synchronize calculation engine
    this.adapter.setInputValue(item, bestVal);
    item.value = bestVal;
    if (item.type === 'select') item.selectedIndex = bestVal;

    await this.adapter.triggerCalculate();
    const currentMetrics = this.adapter.getProjectedMetrics();
    const currentScore = this.evaluateScore(currentMetrics);

    if (improved) {
      this.bestScore = currentScore;
      this.bestMetrics = currentMetrics;

      const newPeakFound = !acceptedViaAnneal && this.updatePeak(currentScore, currentMetrics, this.adapter.captureSnapshot(allInputsList));
      this.bestCombo = this.peakCombo || this.adapter.captureSnapshot(allInputsList);

      if (acceptedViaAnneal) {
        log.info('ANNEAL', `[${paramName}] Operating point shifted to exploratory ridge (Score: ${currentScore.toFixed(1)} vs Peak: ${(this.peakScore || currentScore).toFixed(1)}). Peak combo safely preserved.`);
      } else {
        const epsDiff = (this.bestMetrics.eps - (this.baselineMetrics?.eps || 0)).toFixed(2);
        log.success('ACCEPT', `[${paramName}] ${currentVal} -> ${bestVal} (EPS: $${this.bestMetrics.eps.toFixed(2)}, Δ ${epsDiff >= 0 ? '+' : ''}$${epsDiff}, Score: ${this.bestScore.toFixed(1)})`);
      }
    } else {
      // Monotonicity Guarantee: Never overwrite this.bestScore with an inferior score upon rejection
      log.info('REJECT', `[${paramName}] Kept at ${currentVal} (neither direction improved overall utility).`);
    }

    return improved;
  }

  /**
   * Reverts all inputs back to original baseline state
   */
  async revertToInitial() {
    this.isOperationalPhase = false;
    await this.adapter.restoreSnapshot(null);
    this.baselineMetrics = this.adapter.getProjectedMetrics();
    this.bestMetrics = { ...this.baselineMetrics };
    this.bestScore = this.evaluateScore(this.baselineMetrics);
    this.peakMetrics = { ...this.baselineMetrics };
    this.peakScore = this.bestScore;
    this.peakCombo = null;
    console.log('GloBus-Pilot: Reverted to initial snapshot.');
  }
}

// Attach globally
if (typeof window !== 'undefined') {
  window.GloBusOptimizer = GloBusOptimizer;
  window.gloBusOptimizer = new GloBusOptimizer(window.gloBusDOMAdapter);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GloBusOptimizer;
}
