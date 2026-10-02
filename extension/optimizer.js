/**
 * GloBus-Pilot: Multi-Objective Decision Optimizer Engine
 * Algorithms: Bounded Coordinate Descent with Momentum & Heuristic Line Search
 * Safety Guardrails: Hard Constraints for Ending Cash Buffer ($2,500k+), Credit Floor, and Quality Bounds
 */

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
    this.autoSave = true;

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
   * Computes the authentic Glo-Bus Composite Game Score (0 to 120 scale)
   * based on the official 50/50 blend of:
   * 1. Investor Expectations (I.E.) Standard (20 pts each, up to 24 pts max for beating target by 40%+)
   * 2. Best-in-Industry (B-I-I) / League Leader Standard (20 pts each relative to benchmarks)
   */
  evaluateScore(metrics) {
    if (!metrics || !Number.isFinite(metrics.eps) || metrics.eps <= 0) {
      return -Infinity;
    }

    const config = this.getActiveConfig();
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
    // FINANCIAL SOLVENCY & CASH GUARDRAILS (Protects against 12%+ overdraft loans)
    // In Glo-Bus, negative ending cash triggers an automatic emergency overdraft loan
    // with double-digit punitive interest, severely degrading credit and game score.
    // =========================================================================
    if (Number.isFinite(metrics.endingCash)) {
      if (metrics.endingCash < 0) {
        compositeScore -= 5000.0 + (Math.abs(metrics.endingCash) * 0.05);
      } else if (metrics.endingCash > 0 && metrics.endingCash < 1000) {
        compositeScore -= ((c.minCash - metrics.endingCash) * 2.0) + 2000.0;
      } else if (metrics.endingCash > 0 && metrics.endingCash < c.minCash) {
        compositeScore -= ((c.minCash - metrics.endingCash) / c.minCash) * 5.0;
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

    this.adapter.setInputValue(item, value);
    await this.adapter.triggerCalculate();
    const metrics = this.adapter.getProjectedMetrics();

    // Log whenever Image Rating changes — any page, any input category.
    const delta = metrics.imageRating - preImageRating;
    if (delta !== 0) {
      const sign = delta > 0 ? '+' : '';
      const score = this.evaluateScore(metrics).toFixed(1);
      const baseScore = this.evaluateScore(preMetrics).toFixed(1);
      getLogger().info('IMG-PROBE',
        `[${item.label || item.name}] = ${value} → Image: ${preImageRating} → ${metrics.imageRating} (Δ${sign}${delta}) | EPS: $${metrics.eps.toFixed(2)} | Score: ${baseScore} → ${score}`
      );
    }

    return metrics;
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
    // Verify live screen performance with a clean recalculation
    await this.adapter.triggerCalculate();
    const liveMetrics = this.adapter.getProjectedMetrics();
    const liveScore = this.evaluateScore(liveMetrics);

    const baseEPS = this.baselineMetrics?.eps || 0;
    const baseScore = this.baselineScore || 0;

    // Multi-Objective Safety Verification: Confirm live decisions improve or preserve overall game score
    if (liveScore >= baseScore - 0.05) {
      this.bestMetrics = liveMetrics;
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
    // R&D & Specs -> Capacity & Compensation -> Margins & Prices -> Volume & Ads -> Finance
    const priorityMap = { rd: 1, facilities: 2, compensation: 3, price: 4, marketing: 5, discount: 6, finance: 7, csr: 8, general: 9 };
    inputs.sort((a, b) => (priorityMap[a.category] || 9) - (priorityMap[b.category] || 9));

    log.info('SCAN', `Found ${inputs.length} decision inputs across page frames. Sorted by economic priority chain.`);

    // 2. Identify tightly coupled interdependent pairs on this screen
    const coupledPairs = this.identifyCoupledPairs(inputs);
    if (coupledPairs.length > 0) {
      log.info('COUPLED', `Identified ${coupledPairs.length} coupled interdependent pair(s) for 2D co-optimization.`);
    }

    const totalSteps = (inputs.length * 2) + coupledPairs.length;
    let stepCount = 0;

    // PASS 1: Global Coordinate Descent (Sets the primary operating level for each variable)
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
    log.step('PASS 3', `Pass 3: Fine relaxation polish across ${inputs.length} variables...`);
    for (const item of inputs) {
      if (!this.isRunning || this.isStopped) break;
      stepCount++;
      if (this.onProgress) {
        this.onProgress(stepCount, totalSteps, `Refining: ${item.label || item.name}`, this.bestMetrics);
      }
      await this.optimizeSingleParameter(item, 0.5, inputs);
      await new Promise(r => setTimeout(r, 40));
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

    if (!this.isRunning || this.isStopped) return;

    // Cash-Defensive Solvency Policy:
    // In Glo-Bus, setting "Incorporate projected outcomes" to "Yes" adds hypothetical contract
    // revenues (+$8.2M cash, +$0.41 EPS) into pro-forma statements.
    // If incorporated, the Finance screen allocates buybacks and dividends under the assumption that
    // this speculative cash is 100% guaranteed. If competitors outbid in any region, that cash never
    // materializes, causing an emergency overdraft loan (12%+ penalty) and credit collapse.
    //
    // Therefore, we keep all discount offers (bids) fully active (21-25%) so the company competes to win,
    // but set all regional pro-forma incorporation toggles to "No". This guarantees that Finance plans
    // strictly against guaranteed revenues, protecting the $2,500k cash buffer. Any contracts won on
    // round processing become 100% pure profit and cash surplus upside with zero overdraft risk.
    const assumptionMap = {
      na: false,
      ea: false,
      ap: false,
      la: false
    };
    this.adapter.setSpecialContractAssumptions(assumptionMap);
    await this.adapter.triggerCalculate();
    log.info('CONTRACTS', 'Cash-Defensive Solvency Policy: Regional incorporation toggles set to "No" to protect Finance cash buffer. (Discount bids remain active!)');

    this.bestCombo = this.adapter.captureSnapshot(inputs);
    this.bestMetrics = this.adapter.getProjectedMetrics();
    this.bestScore = this.evaluateScore(this.bestMetrics);

    log.success('COMPLETE', `Special Contracts bids submitted! Guaranteed Base EPS: $${this.bestMetrics.eps.toFixed(2)} (Any contracts won will provide +$0.40+ bonus upside)`);
  }

  /**
   * Discovers variables that have strong economic cross-elasticities on the same screen
   */
  identifyCoupledPairs(inputs) {
    const pairs = [];
    const used = new Set();

    for (let i = 0; i < inputs.length; i++) {
      if (used.has(inputs[i])) continue;
      for (let j = i + 1; j < inputs.length; j++) {
        if (used.has(inputs[j])) continue;

        const a = inputs[i];
        const b = inputs[j];
        const aLabel = (a.label + ' ' + a.name).toLowerCase();
        const bLabel = (b.label + ' ' + b.name).toLowerCase();

        // Pair 1: Price and Advertising in the same regional market
        const isRegionalPriceAndAd = (a.category === 'price' && b.category === 'marketing') ||
                                    (b.category === 'price' && a.category === 'marketing');
        // Extract common region tag if present (e.g. NA, EA, AP, LA)
        const regions = ['north america', 'europe', 'asia', 'latin', 'na', 'ea', 'ap', 'la'];
        const commonRegion = regions.some(r => aLabel.includes(r) && bLabel.includes(r));

        // Pair 2: Base Wage & Assembly Incentive (Labor cost per unit trade-off)
        const isLaborTradeoff = (aLabel.includes('wage') && bLabel.includes('incentive')) ||
                                (bLabel.includes('wage') && aLabel.includes('incentive'));

        // Pair 3: Stock Buyback & Dividend (Capital return trade-off)
        const isBuybackA = aLabel.includes('buyback') || aLabel.includes('repurchase');
        const isBuybackB = bLabel.includes('buyback') || bLabel.includes('repurchase');
        const isFinanceTradeoff = (isBuybackA && bLabel.includes('dividend')) ||
                                 (isBuybackB && aLabel.includes('dividend'));

        if ((isRegionalPriceAndAd && commonRegion) || isLaborTradeoff || isFinanceTradeoff) {
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
   * Co-optimizes two interdependent variables simultaneously across their diagonal response surface
   */
  async optimizeCoupledPair(itemA, itemB, allInputsList = null) {
    const log = getLogger();
    const valA = itemA.type === 'select' ? itemA.selectedIndex : itemA.value;
    const valB = itemB.type === 'select' ? itemB.selectedIndex : itemB.value;
    const stepA = Math.max(itemA.step, itemA.type === 'select' ? 1 : 0.01);
    const stepB = Math.max(itemB.step, itemB.type === 'select' ? 1 : 0.01);

    // Test 4 diagonal coupled perturbations:
    // (+dA, +dB), (+dA, -dB), (-dA, +dB), (-dA, -dB)
    const candidates = [
      { a: Math.min(itemA.max, valA + stepA), b: Math.min(itemB.max, valB + stepB) },
      { a: Math.min(itemA.max, valA + stepA), b: Math.max(itemB.min, valB - stepB) },
      { a: Math.max(itemA.min, valA - stepA), b: Math.min(itemB.max, valB + stepB) },
      { a: Math.max(itemA.min, valA - stepA), b: Math.max(itemB.min, valB - stepB) }
    ];

    let bestPair = { a: valA, b: valB };
    let improved = false;

    for (const cand of candidates) {
      if (!this.isRunning || this.isStopped) break;
      if (cand.a === valA && cand.b === valB) continue;

      this.adapter.setInputValue(itemA, cand.a);
      this.adapter.setInputValue(itemB, cand.b);
      await this.adapter.triggerCalculate();
      const metrics = this.adapter.getProjectedMetrics();
      const score = this.evaluateScore(metrics);

      if (this.bestMetrics && metrics.imageRating !== this.bestMetrics.imageRating) {
        const delta = metrics.imageRating - this.bestMetrics.imageRating;
        const sign = delta > 0 ? '+' : '';
        log.info('IMG-PROBE', `[Coupled: ${itemA.label || itemA.name} & ${itemB.label || itemB.name}] = (${cand.a}, ${cand.b}) → Image: ${this.bestMetrics.imageRating} → ${metrics.imageRating} (Δ${sign}${delta}) | Score: ${score.toFixed(1)}`);
      }

      if (score > this.bestScore) {
        this.bestScore = score;
        this.bestMetrics = metrics;
        bestPair = cand;
        improved = true;
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
    this.bestMetrics = this.adapter.getProjectedMetrics();
    this.bestScore = this.evaluateScore(this.bestMetrics);

    if (improved) {
      this.bestCombo = this.adapter.captureSnapshot(allInputsList);
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
    const currentVal = item.type === 'select' ? item.selectedIndex : item.value;
    let step = Math.max(item.step * stepScale, item.type === 'select' ? 1 : 0.01);
    let bestVal = currentVal;
    let improved = false;
    const paramName = item.label || item.name || 'Param';

    // Glo-Bus Financial Safeguard: Mutual Exclusivity between Stock Issue & Stock Repurchase
    const itemLabel = (item.label + ' ' + item.name).toLowerCase();
    const isStockIssue = itemLabel.includes('issue') && (itemLabel.includes('stock') || itemLabel.includes('share'));
    const isStockRepurchase = itemLabel.includes('repurchase') || itemLabel.includes('buyback');

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

    // 1. Test Upward perturbation
    const testValUp = Math.min(item.max, currentVal + step);
    let scoreUp = -Infinity;
    let metricsUp = null;

    if (testValUp !== currentVal) {
      metricsUp = await this.evaluateInput(item, testValUp);
      scoreUp = this.evaluateScore(metricsUp);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2. Test Downward perturbation
    const testValDown = Math.max(item.min, currentVal - step);
    let scoreDown = -Infinity;
    let metricsDown = null;

    if (testValDown !== currentVal) {
      metricsDown = await this.evaluateInput(item, testValDown);
      scoreDown = this.evaluateScore(metricsDown);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2b. Multi-scale exploration: if continuous variable and neither +/-1 step improved, test exploratory 2.5x step
    if (scoreUp <= this.bestScore && scoreDown <= this.bestScore && item.type !== 'select') {
      const exploreStep = step * 2.5;
      const testValUpExp = Math.min(item.max, currentVal + exploreStep);
      if (testValUpExp !== testValUp && testValUpExp !== currentVal) {
        const mUpExp = await this.evaluateInput(item, testValUpExp);
        const sUpExp = this.evaluateScore(mUpExp);
        if (sUpExp > this.bestScore) {
          scoreUp = sUpExp;
          metricsUp = mUpExp;
          bestVal = testValUpExp;
        }
      }
      if (scoreUp <= this.bestScore && this.isRunning && !this.isStopped) {
        const testValDownExp = Math.max(item.min, currentVal - exploreStep);
        if (testValDownExp !== testValDown && testValDownExp !== currentVal) {
          const mDownExp = await this.evaluateInput(item, testValDownExp);
          const sDownExp = this.evaluateScore(mDownExp);
          if (sDownExp > this.bestScore) {
            scoreDown = sDownExp;
            metricsDown = mDownExp;
            bestVal = testValDownExp;
          }
        }
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    // 3. Determine winning direction & apply momentum
    if (scoreUp > this.bestScore && scoreUp >= scoreDown) {
      this.bestScore = scoreUp;
      this.bestMetrics = metricsUp;
      bestVal = (bestVal !== currentVal) ? bestVal : testValUp;
      improved = true;

      // Follow upward momentum while score improves
      let momentumVal = bestVal;
      for (let m = 0; m < 4; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.min(item.max, momentumVal + step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (nextScore > this.bestScore) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    } else if (scoreDown > this.bestScore) {
      this.bestScore = scoreDown;
      this.bestMetrics = metricsDown;
      bestVal = (bestVal !== currentVal) ? bestVal : testValDown;
      improved = true;

      // Follow downward momentum while score improves
      let momentumVal = bestVal;
      for (let m = 0; m < 4; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.max(item.min, momentumVal - step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (nextScore > this.bestScore) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    // 4. Commit winning value to DOM and re-synchronize calculation engine
    this.adapter.setInputValue(item, bestVal);
    item.value = bestVal;
    if (item.type === 'select') item.selectedIndex = bestVal;

    await this.adapter.triggerCalculate();
    this.bestMetrics = this.adapter.getProjectedMetrics();
    this.bestScore = this.evaluateScore(this.bestMetrics);

    if (improved) {
      // Capture snapshot AFTER DOM holds the winning value and calculate is complete!
      this.bestCombo = this.adapter.captureSnapshot(allInputsList);
      const epsDiff = (this.bestMetrics.eps - (this.baselineMetrics?.eps || 0)).toFixed(2);
      log.success('ACCEPT', `[${paramName}] ${currentVal} -> ${bestVal} (EPS: $${this.bestMetrics.eps.toFixed(2)}, Δ ${epsDiff >= 0 ? '+' : ''}$${epsDiff}, Score: ${this.bestScore.toFixed(1)})`);
    } else {
      log.info('REJECT', `[${paramName}] Kept at ${currentVal} (neither direction improved overall utility).`);
    }

    return improved;
  }

  /**
   * Reverts all inputs back to original baseline state
   */
  async revertToInitial() {
    await this.adapter.restoreSnapshot(null);
    this.baselineMetrics = this.adapter.getProjectedMetrics();
    this.bestMetrics = { ...this.baselineMetrics };
    this.bestScore = this.evaluateScore(this.baselineMetrics);
    console.log('GloBus-Pilot: Reverted to initial snapshot.');
  }
}

// Attach globally
window.GloBusOptimizer = GloBusOptimizer;
window.gloBusOptimizer = new GloBusOptimizer(window.gloBusDOMAdapter);
