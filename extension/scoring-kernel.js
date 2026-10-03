/**
 * Glo-Bus Scoring & Solvency Kernel
 * Implements continuous interior-point solvency barriers, synthetic stock price valuation proxy,
 * unbounded competitive surplus scoring, and multi-objective vector-norm cycle convergence.
 */

(function (global) {
  'use strict';

  /**
   * SolvencyBarrier: Continuous C^1 interior-point penalty function for ending cash.
   * Eliminates the discontinuous Dirac-delta penalty cliff between $1,001k and $999k.
   */
  const SolvencyBarrier = {
    /**
     * Computes the cash penalty with C^1 continuity.
     * @param {number} cash - Projected ending cash in $000s
     * @param {number} minCash - Target cash buffer (e.g. 2500)
     * @param {boolean} isOperational - True on screens 1-6 (shadow cost), False on Screen 7 (strict gate)
     * @returns {number} Score penalty to subtract from composite score
     */
    calculatePenalty(cash, minCash = 2500, isOperational = false) {
      if (!Number.isFinite(cash)) return 0;

      if (isOperational) {
        // Operational screens (1-6): Smooth shadow cost of capital
        if (cash < 0) {
          const cashDeficit = Math.abs(cash);
          let shadowCost = 1.5 + (cashDeficit / 1000.0) * 0.25;
          if (cashDeficit > 15000) {
            const excess = (cashDeficit - 15000) / 1000.0;
            shadowCost += (excess * excess) * 0.05;
          }
          return shadowCost;
        } else if (cash < minCash) {
          return ((minCash - cash) / minCash) * 1.5;
        }
        return 0;
      }

      // Strict Finance Screen 7: Continuous Interior-Point Log-Barrier
      const cTarget = minCash; // e.g., 2500
      const cCritical = 1000;  // Critical danger boundary

      if (cash >= cTarget) {
        return 0;
      }

      // Zone 1: Buffer zone between cCritical and cTarget [1000k, 2500k)
      // Ramps quadratically from 0 to alpha points
      const alpha = 15.0;
      if (cash >= cCritical) {
        const u = (cTarget - cash) / (cTarget - cCritical);
        return alpha * (u * u);
      }

      // Zone 2: Danger zone between 0 and cCritical [0, 1000k)
      // Smooth continuation matching P(1000) = alpha and matching first derivative
      // P'(1000) = -2 * alpha / (cTarget - cCritical) = -30 / 1500 = -0.02 per unit
      const beta = 20.0;
      const gamma = 25.0;
      if (cash >= 0) {
        const v = (cCritical - cash) / cCritical;
        return alpha + (beta * v) + (gamma * v * v);
      }

      // Zone 3: Negative cash (Insolvency / Emergency Bank Overdraft on Screen 7)
      // Punitive emergency overdraft penalty (> 5000 pts) to force loan funding on Screen 7
      const pZero = alpha + beta + gamma;
      const deficit = Math.abs(cash);
      return 5000.0 + pZero + (deficit * 0.10);
    }
  };

  /**
   * ValuationModel: Synthetic stock price proxy for Screens 1-6.
   * Normalizes the score space across all screens to an invariant 5-pillar domain.
   */
  const ValuationModel = {
    creditRatingScoreMap: {
      'A+': 100, 'A': 95, 'A-': 90,
      'B+': 80,  'B': 70, 'B-': 60,
      'C+': 50,  'C': 40, 'C-': 30,
      'D': 10,   'F': 0
    },

    /**
     * Estimates stock price based on analytical valuation fundamentals when DOM lacks live stock price.
     * @param {Object} metrics - Projected metrics object
     * @returns {number} Estimated stock price ($/share)
     */
    estimateStockPrice(metrics) {
      if (metrics.stockPrice && metrics.stockPrice > 0) {
        return metrics.stockPrice;
      }

      const eps = Math.max(0, metrics.eps || 0);
      const creditScore = metrics.creditRatingScore !== undefined
        ? metrics.creditRatingScore
        : (this.creditRatingScoreMap[metrics.creditRating] || 50);

      // In Glo-Bus, stock price is strongly driven by EPS, with P/E expansion at higher EPS,
      // discounted or boosted by credit rating and ROE
      const basePE = 14.5;
      const peExpansion = Math.min(8.0, 1.5 * eps);
      const creditFactor = Math.sqrt(Math.max(0.2, creditScore / 90.0));
      const roeBonus = 1.0 + (Math.max(0, (metrics.roe || 20) - 20) / 100.0) * 0.25;

      const estimatedPrice = eps * (basePE + peExpansion) * creditFactor * roeBonus;
      return Math.max(1.0, estimatedPrice);
    }
  };

  /**
   * ObjectiveKernel: Unbounded competitive surplus evaluator.
   * Eliminates the zero marginal utility trap above $7.50 EPS and provides dynamic benchmark scaling.
   */
  const ObjectiveKernel = {
    /**
     * Evaluates the multi-objective utility score with epsilon-gradient surplus regularizer.
     * @param {Object} metrics - Projected metrics
     * @param {Object} config - Strategy configuration
     * @param {boolean} isOperationalContext - Explicit phase override
     * @returns {number} Continuous utility score
     */
    evaluateScore(metrics, config = {}, isOperationalContext = null) {
      if (!metrics || metrics._siteRejected || !Number.isFinite(metrics.eps) || metrics.eps === 0) {
        return -Infinity;
      }

      const c = config.constraints || { minCash: 2500, minImage: 75 };
      const isOperational = isOperationalContext !== null
        ? isOperationalContext
        : false;

      // Investor Expectation Targets
      const targetEPS = metrics.targetEPS || 4.25;
      const targetROE = metrics.targetROE || 30.0;
      const targetImage = metrics.targetImage || c.minImage || 75;
      const targetStock = metrics.targetStock || 45.0;

      // =========================================================================
      // STANDARD 1: INVESTOR EXPECTATIONS (I.E.) STANDARD (50% of Base Score)
      // =========================================================================
      let scoreEPS_IE = 0;
      if (metrics.eps >= targetEPS) {
        const pctOver = (metrics.eps - targetEPS) / targetEPS;
        const bonusPct = Math.min(0.20, pctOver * 0.5);
        scoreEPS_IE = 20.0 * (1 + bonusPct);
      } else {
        scoreEPS_IE = Math.max(0, 20.0 * (metrics.eps / targetEPS));
      }

      let scoreROE_IE = 0;
      if (metrics.roe >= targetROE) {
        const pctOver = (metrics.roe - targetROE) / targetROE;
        const bonusPct = Math.min(0.20, pctOver * 0.5);
        scoreROE_IE = 20.0 * (1 + bonusPct);
      } else {
        scoreROE_IE = Math.max(0, 20.0 * (metrics.roe / targetROE));
      }

      let scoreImage_IE = 0;
      if (metrics.imageRating >= targetImage) {
        const pctOver = (metrics.imageRating - targetImage) / targetImage;
        const bonusPct = Math.min(0.20, pctOver * 0.5);
        scoreImage_IE = 20.0 * (1 + bonusPct);
      } else {
        scoreImage_IE = Math.max(0, 20.0 * (metrics.imageRating / targetImage));
      }

      const ieCreditMap = {
        'A+': 24.0, 'A': 22.0, 'A-': 20.0,
        'B+': 17.0, 'B': 14.0, 'B-': 11.0,
        'C+': 8.0,  'C': 5.0,  'C-': 2.0,
        'D': 0.0,   'F': 0.0
      };
      const scoreCredit_IE = ieCreditMap[metrics.creditRating] !== undefined
        ? ieCreditMap[metrics.creditRating]
        : (metrics.creditRatingScore >= 90 ? 20.0 : Math.max(0, 20.0 * ((metrics.creditRatingScore || 50) / 90.0)));

      // Invariant 5-Pillar Domain using Synthetic Stock Price Proxy when unrendered
      const effectiveStockPrice = ValuationModel.estimateStockPrice(metrics);
      let scoreStock_IE = 0;
      if (effectiveStockPrice >= targetStock) {
        const pctOver = (effectiveStockPrice - targetStock) / targetStock;
        scoreStock_IE = 20.0 * (1 + Math.min(0.20, pctOver * 0.5));
      } else {
        scoreStock_IE = Math.max(0, 20.0 * (effectiveStockPrice / targetStock));
      }

      const totalIE = scoreEPS_IE + scoreROE_IE + scoreImage_IE + scoreCredit_IE + scoreStock_IE;

      // =========================================================================
      // STANDARD 2: BEST-IN-INDUSTRY (B-I-I) STANDARD (50% of Base Score)
      // =========================================================================
      // Dynamic Benchmark Sizing: prevents artificial saturation when EPS reaches $7.50
      const benchmarkEPS = Math.max(metrics.eps, targetEPS * 2.0, 8.50);
      const benchmarkROE = Math.max(metrics.roe, targetROE * 2.5, 85.0);
      const benchmarkImage = Math.max(metrics.imageRating, targetImage);
      const benchmarkStock = Math.max(effectiveStockPrice, targetStock * 1.8, 75.0);

      const scoreEPS_BII = 20.0 * Math.min(1.0, metrics.eps / benchmarkEPS);
      const scoreROE_BII = 20.0 * Math.min(1.0, metrics.roe / benchmarkROE);
      const scoreImage_BII = 20.0 * Math.min(1.0, metrics.imageRating / benchmarkImage);

      const biiCreditMap = {
        'A+': 20.0, 'A': 19.0, 'A-': 18.0,
        'B+': 16.0, 'B': 14.0, 'B-': 11.0,
        'C+': 8.0,  'C': 5.0,  'C-': 1.0,
        'D': 0.0,   'F': 0.0
      };
      const scoreCredit_BII = biiCreditMap[metrics.creditRating] !== undefined
        ? biiCreditMap[metrics.creditRating]
        : (20.0 * Math.min(1.0, (metrics.creditRatingScore || 50) / 100.0));

      const scoreStock_BII = 20.0 * Math.min(1.0, effectiveStockPrice / benchmarkStock);

      const totalBII = scoreEPS_BII + scoreROE_BII + scoreImage_BII + scoreCredit_BII + scoreStock_BII;

      // Official Base Glo-Bus Composite Game Score (50% IE + 50% BII)
      let compositeScore = (0.50 * totalIE) + (0.50 * totalBII);

      // =========================================================================
      // UNBOUNDED COMPETITIVE SURPLUS REGULARIZER (Fix #3)
      // Guarantees non-zero gradient (nabla f != 0) above arbitrary saturation ceilings
      // =========================================================================
      const epsRegularizer = 0.05 * metrics.eps;
      // Cash regularizer gives slight tie-breaking preference to cash solvency,
      // but is strictly capped at $10,000k to prevent toxic debt borrowing accumulation.
      const effectiveCash = Math.min(10000, Math.max(0, metrics.endingCash || 0));
      const cashRegularizer = 0.005 * Math.log(1.0 + effectiveCash);
      compositeScore += epsRegularizer + cashRegularizer;

      // =========================================================================
      // CONTINUOUS FINANCIAL SOLVENCY & CASH BARRIER (Fix #7)
      // =========================================================================
      const cashPenalty = SolvencyBarrier.calculatePenalty(metrics.endingCash, c.minCash, isOperational);
      compositeScore -= cashPenalty;

      return compositeScore;
    }
  };

  /**
   * ConvergenceMonitor: Multi-objective vector-norm convergence evaluator.
   * Prevents premature cycle termination when EPS plateaus but composite score improves.
   */
  const ConvergenceMonitor = {
    creditRatingRanks: {
      'A+': 10, 'A': 9, 'A-': 8,
      'B+': 7,  'B': 6, 'B-': 5,
      'C+': 4,  'C': 3, 'C-': 2,
      'D': 1,   'F': 0
    },

    /**
     * Determines whether significant multi-objective gains were achieved in the cycle.
     * @param {Object} currentMetrics - Metrics at the end of cycle
     * @param {Object} startMetrics - Metrics at the start of cycle
     * @param {number} currentScore - Utility score at end of cycle
     * @param {number} startScore - Utility score at start of cycle
     * @param {Object} options - Threshold configurations
     * @returns {Object} { canContinue, reason, deltas }
     */
    evaluateConvergence(currentMetrics, startMetrics, currentScore, startScore, options = {}) {
      const minEpsThreshold = options.minEpsGainThreshold !== undefined ? options.minEpsGainThreshold : 0.02;
      const minScoreThreshold = options.minScoreGainThreshold !== undefined ? options.minScoreGainThreshold : 0.50;

      const deltaEPS = (currentMetrics?.eps || 0) - (startMetrics?.eps || 0);
      const deltaScore = (currentScore || 0) - (startScore || 0);

      const currentCreditRank = this.creditRatingRanks[currentMetrics?.creditRating] || 5;
      const startCreditRank = this.creditRatingRanks[startMetrics?.creditRating] || 5;
      const deltaCredit = currentCreditRank - startCreditRank;

      const deltaImage = (currentMetrics?.imageRating || 0) - (startMetrics?.imageRating || 0);

      const epsSignificant = deltaEPS >= minEpsThreshold;
      const scoreSignificant = deltaScore >= minScoreThreshold;
      const creditSignificant = deltaCredit >= 1; // e.g. B+ to A-
      const imageSignificant = deltaImage >= 3;

      const hasSignificantGain = epsSignificant || scoreSignificant || creditSignificant || imageSignificant;

      let reason = '';
      if (hasSignificantGain) {
        const drivers = [];
        if (scoreSignificant) drivers.push(`Score Δ +${deltaScore.toFixed(2)} pts`);
        if (epsSignificant) drivers.push(`EPS Δ +$${deltaEPS.toFixed(2)}`);
        if (creditSignificant) drivers.push(`Credit Rank +${deltaCredit}`);
        if (imageSignificant) drivers.push(`Image Δ +${deltaImage}`);
        reason = `Significant progress achieved: [${drivers.join(', ')}]`;
      } else {
        const deltaScoreStr = `${deltaScore >= 0 ? '+' : ''}${deltaScore.toFixed(2)}`;
        const deltaEpsStr = deltaEPS >= 0 ? `+$${deltaEPS.toFixed(2)}` : `-$${Math.abs(deltaEPS).toFixed(2)}`;
        reason = `Mathematical plateau reached across all pillars (ΔScore: ${deltaScoreStr}, ΔEPS: ${deltaEpsStr})`;
      }

      return {
        hasSignificantGain,
        reason,
        deltas: {
          deltaEPS,
          deltaScore,
          deltaCredit,
          deltaImage
        }
      };
    }
  };

  const kernel = {
    SolvencyBarrier,
    ValuationModel,
    ObjectiveKernel,
    ConvergenceMonitor
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = kernel;
  }
  global.GloBusScoringKernel = kernel;
})(typeof window !== 'undefined' ? window : global);
