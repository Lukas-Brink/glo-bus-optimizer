/**
 * Glo-Bus Capacity & Solvency Reservation Kernel
 * Implements Cross-Regional Shadow Capacity Allocation, Two-Tiered Contract Capacity Reservation,
 * and Strategic Capex Sinking Fund for Share Buybacks.
 */

(function (global) {
  'use strict';

  /**
   * ShadowCapacityAllocator: Equalizes marginal return per unit of plant capacity across all 4 regions.
   * Prevents NA and EA from greedily consuming 80%+ of factory capacity and starving AP and LA.
   */
  const ShadowCapacityAllocator = {
    REGIONS: ['na', 'ea', 'ap', 'la'],

    // Default regional logistics cost parameters ($/unit)
    REGIONAL_LOGISTICS: {
      na: { shipping: 4.0, tariff: 0.0 },
      ea: { shipping: 9.0, tariff: 6.0 },
      ap: { shipping: 6.0, tariff: 4.0 },
      la: { shipping: 11.0, tariff: 8.0 }
    },

    /**
     * Computes net contribution margin per unit for a region.
     * @param {string} region - 'na', 'ea', 'ap', 'la'
     * @param {number} price - Wholesale price in region
     * @param {number} discount - Retailer discount percentage (e.g. 5 for 5%)
     * @param {number} unitCost - Estimated unit production cost (BOM + labor)
     * @returns {number} Net margin per unit
     */
    computeMarginalReturn(region, price, discount = 0, unitCost = 140) {
      const reg = (region || '').toLowerCase();
      const logistics = this.REGIONAL_LOGISTICS[reg] || { shipping: 7.0, tariff: 4.0 };
      const netWholesale = price * (1 - (discount / 100.0));
      return netWholesale - logistics.shipping - logistics.tariff - unitCost;
    },

    /**
     * Determines regional capacity allocation shares based on equalized marginal returns.
     * @param {Object} regionalDemands - { na: demand, ea: demand, ap: demand, la: demand }
     * @param {Object} regionalPrices - { na: price, ea: price, ap: price, la: price }
     * @param {number} maxCapacity - Total regular + overtime plant capacity (e.g. 360,000 units)
     * @returns {Object} { allocationShares, recommendedLimits, isConstrained }
     */
    allocateCapacity(regionalDemands, regionalPrices, maxCapacity = 360000) {
      const totalDemand = Object.values(regionalDemands).reduce((sum, d) => sum + (d || 0), 0);
      const isConstrained = totalDemand > maxCapacity;

      if (!isConstrained) {
        return {
          isConstrained: false,
          allocationShares: { na: 0.25, ea: 0.25, ap: 0.25, la: 0.25 },
          recommendedLimits: regionalDemands,
          capacityHeadroom: maxCapacity - totalDemand
        };
      }

      // Compute marginal contribution weights
      const weights = {};
      let totalWeight = 0;
      for (const r of this.REGIONS) {
        const p = regionalPrices[r] || 300;
        const margin = Math.max(10, this.computeMarginalReturn(r, p));
        weights[r] = margin;
        totalWeight += margin;
      }

      const allocationShares = {};
      const recommendedLimits = {};
      for (const r of this.REGIONS) {
        const share = weights[r] / totalWeight;
        allocationShares[r] = share;
        // Allocate capacity proportionally, but ensure no region gets less than 15% of capacity
        const boundedShare = Math.max(0.15, share);
        recommendedLimits[r] = Math.round(maxCapacity * boundedShare);
      }

      return {
        isConstrained: true,
        allocationShares,
        recommendedLimits,
        totalDemand,
        maxCapacity
      };
    }
  };

  /**
   * ContractReservation: Two-tiered Special Contracts reservation architecture.
   * Prevents speculative bidding that triggers catastrophic $50/unit outsourced assembly penalties.
   */
  const ContractReservation = {
    OUTSOURCING_SURCHARGE: 50.0,
    MIN_OUTSOURCED_SAFE_MARGIN: 15.0, // Minimum $/unit margin if units must be outsourced

    /**
     * Evaluates a potential contract bid against physical plant capacity and outsourcing costs.
     * @param {Object} bidParams - { region, discount, bidPrice, estimatedBOM, estimatedLabor }
     * @param {Object} capacityState - { regularCapacity, maxOvertimeCapacity, retailDemand }
     * @returns {Object} { isApproved, reason, safeMaxDiscount, requiredCapacity }
     */
    evaluateContractBid(bidParams, capacityState) {
      const { discount = 20, bidPrice = 200, estimatedBOM = 90, estimatedLabor = 35 } = bidParams;
      const { regularCapacity = 300000, maxOvertimeCapacity = 360000, retailDemand = 280000 } = capacityState;

      const totalInHouseCapacity = maxOvertimeCapacity;
      const availableCapacity = Math.max(0, totalInHouseCapacity - retailDemand);
      const expectedContractUnits = 50000; // Standard Glo-Bus contract offering per region

      const standardUnitCost = estimatedBOM + estimatedLabor;
      const standardMargin = bidPrice - standardUnitCost;

      // Case 1: Sufficient in-house capacity exists
      if (availableCapacity >= expectedContractUnits) {
        return {
          isApproved: standardMargin >= 20.0,
          reason: standardMargin >= 20.0 ? 'In-house capacity available with healthy margin.' : 'Standard margin too low.',
          marginPerUnit: standardMargin,
          outsourcingRequired: 0,
          inHouseUnits: expectedContractUnits
        };
      }

      // Case 2: Insufficient in-house capacity, requires outsourced assembly
      const outsourcedUnits = expectedContractUnits - availableCapacity;
      const outsourcedUnitCost = standardUnitCost + this.OUTSOURCING_SURCHARGE;
      const outsourcedMargin = bidPrice - outsourcedUnitCost;

      if (outsourcedMargin < this.MIN_OUTSOURCED_SAFE_MARGIN) {
        return {
          isApproved: false,
          reason: `Outsourcing penalty ($50/unit) drops margin to $${outsourcedMargin.toFixed(2)}/unit, below safety threshold ($${this.MIN_OUTSOURCED_SAFE_MARGIN.toFixed(2)}). Bid rejected to prevent factory deficit catastrophe.`,
          marginPerUnit: outsourcedMargin,
          outsourcingRequired: outsourcedUnits,
          inHouseUnits: availableCapacity
        };
      }

      return {
        isApproved: true,
        reason: `Contract profitable even with ${outsourcedUnits} outsourced units (Margin: $${outsourcedMargin.toFixed(2)}/unit).`,
        marginPerUnit: outsourcedMargin,
        outsourcingRequired: outsourcedUnits,
        inHouseUnits: availableCapacity
      };
    }
  };

  /**
   * CapexSinkingFund: Strategic multi-round forward capex reserve constraint for Screen 7.
   * Prevents myopic single-round share repurchases from stripping growth liquidity.
   */
  const CapexSinkingFund = {
    BASE_BUFFER: 2500, // $2,500k minimum operational cash buffer
    COST_PER_WORKSTATION: 175, // $175k capex per workstation addition
    DEFAULT_GROWTH_RATE: 0.12, // Expected round-over-round market demand expansion (12%)

    /**
     * Calculates the minimum liquid cash reserve required before allowing share buybacks.
     * @param {Object} facilityState - { currentWorkstations, expectedDemandGrowth }
     * @returns {Object} { minimumLiquidityFloor, projectedCapexReserve, maxAvailableForBuybacks }
     */
    calculateLiquidityFloor(facilityState = {}, currentCash = 15000) {
      const workstations = facilityState.currentWorkstations || 100;
      const growthRate = facilityState.expectedDemandGrowth || this.DEFAULT_GROWTH_RATE;

      // Project next year's workstation additions required to absorb market growth
      const neededStations = Math.ceil(workstations * growthRate);
      const projectedCapexReserve = neededStations * this.COST_PER_WORKSTATION; // e.g. 12 * 175 = $2,100k

      const minimumLiquidityFloor = this.BASE_BUFFER + projectedCapexReserve;
      const maxAvailableForBuybacks = Math.max(0, currentCash - minimumLiquidityFloor);

      return {
        minimumLiquidityFloor,
        projectedCapexReserve,
        maxAvailableForBuybacks,
        isConstrained: currentCash < minimumLiquidityFloor
      };
    }
  };

  const kernel = {
    ShadowCapacityAllocator,
    ContractReservation,
    CapexSinkingFund
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = kernel;
  }
  global.GloBusCapacityKernel = kernel;
})(typeof window !== 'undefined' ? window : global);
