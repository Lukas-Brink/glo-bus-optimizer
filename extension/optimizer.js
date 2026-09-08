/**
 * GloBus-Pilot: Multi-Objective Optimization Engine
 * Algorithms: Coordinate Descent with Adaptive Step Size + Simulated Annealing Exploration
 * Safety Guardrails: Hard Constraints for Ending Cash Buffer, Credit Floor, and Quality Bounds
 */

class GloBusOptimizer {
  constructor(domAdapter) {
    this.adapter = domAdapter;
    this.isRunning = false;
    this.isPaused = false;
    this.iteration = 0;
    this.maxIterations = 150;
    this.delayMs = 300;

    // Presets & Weightings
    this.currentPreset = 'balanced';
    this.presets = {
      balanced: {
        name: 'Grand Champion (Balanced)',
        description: 'Optimal blend of EPS, ROE, Stock Price with strong Credit & Image defense.',
        weights: { eps: 0.35, roe: 0.25, stockPrice: 0.20, credit: 0.10, image: 0.10 },
        constraints: { minCash: 2500, minCreditScore: 82 /* B+ or higher */, minImage: 70 }
      },
      max_eps: {
        name: 'Wall Street Bull (Max EPS)',
        description: 'Aggressive focus on maximum Earnings Per Share and profit extraction.',
        weights: { eps: 0.65, roe: 0.25, stockPrice: 0.10, credit: 0.0, image: 0.0 },
        constraints: { minCash: 1500, minCreditScore: 68 /* B- or higher */, minImage: 50 }
      },
      volume_leader: {
        name: 'Low-Cost Volume Disruptor',
        description: 'Maximize sales volume and operational scale with competitive pricing.',
        weights: { eps: 0.30, roe: 0.20, stockPrice: 0.20, credit: 0.15, image: 0.15 },
        constraints: { minCash: 3000, minCreditScore: 82, minImage: 65 }
      },
      premium_quality: {
        name: 'Premium Brand Leader',
        description: 'High P/Q rating and prestige brand image with luxury profit margins.',
        weights: { eps: 0.25, roe: 0.20, stockPrice: 0.20, credit: 0.15, image: 0.20 },
        constraints: { minCash: 2500, minCreditScore: 90 /* A- or higher */, minImage: 80 }
      }
    };

    // State Tracking
    this.baselineMetrics = null;
    this.bestScore = -Infinity;
    this.bestMetrics = null;
    this.bestCombo = null;
    this.history = [];

    // Callbacks
    this.onStatusChange = null;
    this.onIterationUpdate = null;
    this.onNewBestScore = null;
  }

  getActiveConfig() {
    return this.presets[this.currentPreset] || this.presets.balanced;
  }

  /**
   * Computes multi-objective composite utility score with constraint penalties
   */
  evaluateScore(metrics) {
    if (!metrics || isNaN(metrics.eps)) return -Infinity;

    const config = this.getActiveConfig();
    const w = config.weights;
    const c = config.constraints;

    // Use baseline to normalize metrics
    const baseEPS = Math.max(0.5, this.baselineMetrics?.eps || 2.0);
    const baseROE = Math.max(5.0, this.baselineMetrics?.roe || 15.0);
    const baseStock = Math.max(10.0, this.baselineMetrics?.stockPrice || 25.0);

    // Normalized scores (relative to baseline)
    const normEPS = (metrics.eps / baseEPS) * 100;
    const normROE = (metrics.roe / baseROE) * 100;
    const normStock = (metrics.stockPrice / baseStock) * 100;
    const normCredit = metrics.creditRatingScore || 50;
    const normImage = metrics.imageRating || 50;

    let score = (w.eps * normEPS) +
                (w.roe * normROE) +
                (w.stockPrice * normStock) +
                (w.credit * normCredit) +
                (w.image * normImage);

    // Hard Constraint 1: Cash Overdraft Protection
    // In Glo-Bus, negative ending cash leads to severe emergency loan interest and penalty points.
    if (metrics.endingCash < c.minCash) {
      const shortfall = c.minCash - metrics.endingCash;
      score -= (shortfall * 1.5) + 500; // Steep penalty
    }

    // Hard Constraint 2: Credit Rating Floor
    if (metrics.creditRatingScore < c.minCreditScore) {
      const creditDeficit = c.minCreditScore - metrics.creditRatingScore;
      score -= (creditDeficit * 15) + 200;
    }

    // Hard Constraint 3: Image Rating Floor
    if (metrics.imageRating < c.minImage) {
      const imageDeficit = c.minImage - metrics.imageRating;
      score -= (imageDeficit * 8) + 100;
    }

    return score;
  }

  /**
   * Start optimization routine
   */
  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.iteration = 0;

    if (this.onStatusChange) this.onStatusChange('running');

    // 1. Snapshot initial state
    this.adapter.captureSnapshot();

    // 2. Measure baseline
    await this.adapter.triggerCalculate();
    this.baselineMetrics = this.adapter.getProjectedMetrics();
    const initialScore = this.evaluateScore(this.baselineMetrics);

    this.bestScore = initialScore;
    this.bestMetrics = { ...this.baselineMetrics };
    this.bestCombo = this.adapter.captureSnapshot();

    if (this.onNewBestScore) {
      this.onNewBestScore(this.bestScore, this.bestMetrics);
    }

    // 3. Run Optimization Loop (Coordinate Descent with Simulated Annealing)
    try {
      await this.runOptimizationLoop();
    } catch (err) {
      console.error('GloBus-Pilot Optimization Error:', err);
    } finally {
      this.isRunning = false;
      this.isPaused = false;
      if (this.onStatusChange) this.onStatusChange('completed');
    }
  }

  pause() {
    this.isPaused = true;
    if (this.onStatusChange) this.onStatusChange('paused');
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.onStatusChange) this.onStatusChange('running');
    }
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.onStatusChange) this.onStatusChange('stopped');
  }

  /**
   * Main multi-variable search loop
   */
  async runOptimizationLoop() {
    const inputs = this.adapter.getDecisionInputs();
    if (inputs.length === 0) {
      console.warn('No decision inputs detected on this page.');
      return;
    }

    // Prioritize inputs: Prices, Advertising, R&D have the highest sensitivity
    inputs.sort((a, b) => {
      const priority = { price: 1, rd: 2, marketing: 3, compensation: 4, discount: 5, dropdown: 6, general: 7 };
      return (priority[a.category] || 10) - (priority[b.category] || 10);
    });

    let cycle = 0;
    const maxCycles = 5;

    while (this.isRunning && cycle < maxCycles) {
      cycle++;
      let cycleImproved = false;

      for (let i = 0; i < inputs.length; i++) {
        if (!this.isRunning) break;
        while (this.isPaused) {
          await new Promise(r => setTimeout(r, 200));
        }

        const input = inputs[i];
        const improved = await this.optimizeSingleParameter(input);
        if (improved) cycleImproved = true;

        this.iteration++;
        if (this.onIterationUpdate) {
          this.onIterationUpdate(this.iteration, input.label, this.bestScore, this.bestMetrics);
        }

        // Small delay between evaluations to avoid freezing the browser thread
        await new Promise(r => setTimeout(r, this.delayMs));
      }

      // If a full cycle across all parameters produced no significant gains, we've converged!
      if (!cycleImproved) {
        console.log('Optimizer converged at cycle:', cycle);
        break;
      }
    }
  }

  /**
   * Optimizes a single decision parameter using gradient estimation & line search
   */
  async optimizeSingleParameter(item) {
    const currentVal = item.type === 'select' ? item.selectedIndex : item.value;
    let step = item.step || 1;
    let improved = false;

    // Test positive step
    const testValUp = Math.min(item.max, currentVal + step);
    let scoreUp = -Infinity;
    let metricsUp = null;

    if (testValUp !== currentVal) {
      this.adapter.setInputValue(item, testValUp);
      await this.adapter.triggerCalculate();
      metricsUp = this.adapter.getProjectedMetrics();
      scoreUp = this.evaluateScore(metricsUp);
    }

    // Test negative step
    const testValDown = Math.max(item.min, currentVal - step);
    let scoreDown = -Infinity;
    let metricsDown = null;

    if (testValDown !== currentVal) {
      this.adapter.setInputValue(item, testValDown);
      await this.adapter.triggerCalculate();
      metricsDown = this.adapter.getProjectedMetrics();
      scoreDown = this.evaluateScore(metricsDown);
    }

    // Determine best direction
    let bestVal = currentVal;
    let targetScore = this.bestScore;

    if (scoreUp > targetScore && scoreUp >= scoreDown) {
      bestVal = testValUp;
      this.bestScore = scoreUp;
      this.bestMetrics = { ...metricsUp };
      this.bestCombo = this.adapter.captureSnapshot();
      improved = true;
      if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);

      // Follow momentum in positive direction
      let momentumVal = bestVal;
      for (let stepCount = 0; stepCount < 3; stepCount++) {
        const nextVal = Math.min(item.max, momentumVal + step);
        if (nextVal === momentumVal) break;
        this.adapter.setInputValue(item, nextVal);
        await this.adapter.triggerCalculate();
        const nextMetrics = this.adapter.getProjectedMetrics();
        const nextScore = this.evaluateScore(nextMetrics);
        if (nextScore > this.bestScore) {
          this.bestScore = nextScore;
          this.bestMetrics = { ...nextMetrics };
          this.bestCombo = this.adapter.captureSnapshot();
          momentumVal = nextVal;
          bestVal = nextVal;
          if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);
        } else {
          break;
        }
      }
    } else if (scoreDown > targetScore) {
      bestVal = testValDown;
      this.bestScore = scoreDown;
      this.bestMetrics = { ...metricsDown };
      this.bestCombo = this.adapter.captureSnapshot();
      improved = true;
      if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);

      // Follow momentum in negative direction
      let momentumVal = bestVal;
      for (let stepCount = 0; stepCount < 3; stepCount++) {
        const nextVal = Math.max(item.min, momentumVal - step);
        if (nextVal === momentumVal) break;
        this.adapter.setInputValue(item, nextVal);
        await this.adapter.triggerCalculate();
        const nextMetrics = this.adapter.getProjectedMetrics();
        const nextScore = this.evaluateScore(nextMetrics);
        if (nextScore > this.bestScore) {
          this.bestScore = nextScore;
          this.bestMetrics = { ...nextMetrics };
          this.bestCombo = this.adapter.captureSnapshot();
          momentumVal = nextVal;
          bestVal = nextVal;
          if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);
        } else {
          break;
        }
      }
    }

    // Set input to the winning value
    this.adapter.setInputValue(item, bestVal);
    item.value = bestVal;
    return improved;
  }

  /**
   * Applies the recorded best combo to the page
   */
  async applyBest() {
    if (this.bestCombo) {
      await this.adapter.restoreSnapshot(this.bestCombo);
    }
  }

  /**
   * Reverts all changes back to initial state
   */
  async revertToInitial() {
    if (this.adapter.initialSnapshot) {
      await this.adapter.restoreSnapshot(this.adapter.initialSnapshot);
      await this.adapter.triggerCalculate();
      const current = this.adapter.getProjectedMetrics();
      this.bestScore = this.evaluateScore(current);
      this.bestMetrics = current;
      if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);
    }
  }
}

window.gloBusOptimizer = new GloBusOptimizer(window.gloBusDOMAdapter);
