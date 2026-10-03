/**
 * Glo-Bus Discrete S/Q Star-Rating Combinatorial Solver & Archetype Engine
 * Solves the Quantum Step Discontinuity on Screen 1 (Product Design) by evaluating
 * coordinated feature bundles across discrete 0.5-star quality tiers, strategic archetypes,
 * and downstream price-power decoupling.
 */

(function (global) {
  'use strict';

  const ParetoStarSolver = {
    /**
     * Standard Pareto-optimal feature bundles for Action Cameras mapped to target star ratings.
     * Each bundle contains coordinated specs that cross the 0.5-star threshold as a unit
     * and specifies its natural downstream wholesale target market price.
     */
    CAMERA_STAR_BUNDLES: {
      3.0: {
        resolution: 'Standard (1080p)',
        lensZoom: 2,
        sensorSize: 'Standard',
        lcdDisplay: 2.0,
        photoModes: 3,
        imageStabilization: 'None',
        editingSoftware: 1,
        targetWholesalePrice: 320
      },
      3.5: {
        resolution: 'Enhanced (2K)',
        lensZoom: 3,
        sensorSize: 'Standard',
        lcdDisplay: 2.5,
        photoModes: 4,
        imageStabilization: 'None',
        editingSoftware: 1,
        targetWholesalePrice: 340
      },
      4.0: {
        resolution: 'Enhanced (2K)',
        lensZoom: 3,
        sensorSize: 'Standard',
        lcdDisplay: 2.5,
        photoModes: 4,
        imageStabilization: 'Electronic',
        editingSoftware: 2,
        targetWholesalePrice: 360
      },
      4.5: {
        resolution: 'Ultra HD (4K)',
        lensZoom: 4,
        sensorSize: 'Medium',
        lcdDisplay: 3.0,
        photoModes: 5,
        imageStabilization: 'Electronic',
        editingSoftware: 2,
        targetWholesalePrice: 375
      },
      5.0: {
        resolution: 'Ultra HD (4K)',
        lensZoom: 4,
        sensorSize: 'Medium',
        lcdDisplay: 3.0,
        photoModes: 6,
        imageStabilization: 'Optical',
        editingSoftware: 3,
        targetWholesalePrice: 395
      },
      5.5: {
        resolution: 'Ultra HD (4K)',
        lensZoom: 5,
        sensorSize: 'Large',
        lcdDisplay: 3.5,
        photoModes: 6,
        imageStabilization: 'Optical',
        editingSoftware: 3,
        targetWholesalePrice: 420
      },
      6.0: {
        resolution: 'Cinematic (5K/6K)',
        lensZoom: 5,
        sensorSize: 'Large',
        lcdDisplay: 3.5,
        photoModes: 7,
        imageStabilization: 'Optical',
        editingSoftware: 4,
        targetWholesalePrice: 450
      },
      7.0: {
        resolution: 'Cinematic (5K/6K)',
        lensZoom: 6,
        sensorSize: 'Ultra/Pro',
        lcdDisplay: 4.0,
        photoModes: 8,
        imageStabilization: 'Advanced Optical',
        editingSoftware: 4,
        targetWholesalePrice: 500
      }
    },

    /**
     * Standard Pareto-optimal feature bundles for UAV Drones mapped to target star ratings.
     * Each bundle specifies coordinated airframe/sensor/battery hardware and its natural retail price.
     */
    DRONE_STAR_BUNDLES: {
      4.0: {
        bodyFrame: 2,
        battery: 2,
        obstacleSensors: 2,
        cameraSensor: 2,
        gimbal: 1,
        software: 2,
        targetRetailPrice: 1350
      },
      4.5: {
        bodyFrame: 2,
        battery: 3,
        obstacleSensors: 4,
        cameraSensor: 2,
        gimbal: 2,
        software: 2,
        targetRetailPrice: 1425
      },
      5.0: {
        bodyFrame: 3,
        battery: 4,
        obstacleSensors: 4,
        cameraSensor: 3,
        gimbal: 2,
        software: 3,
        targetRetailPrice: 1520
      },
      5.5: {
        bodyFrame: 3,
        battery: 4,
        obstacleSensors: 6,
        cameraSensor: 3,
        gimbal: 2,
        software: 3,
        targetRetailPrice: 1650
      },
      6.0: {
        bodyFrame: 4,
        battery: 5,
        obstacleSensors: 6,
        cameraSensor: 4,
        gimbal: 3,
        software: 4,
        targetRetailPrice: 1780
      },
      7.0: {
        bodyFrame: 4,
        battery: 5,
        obstacleSensors: 6,
        cameraSensor: 4,
        gimbal: 3,
        software: 4,
        targetRetailPrice: 2000
      }
    },

    /**
     * Canonical high-performance strategic archetypes for Zero-Pass tournament seeding.
     */
    STRATEGIC_ARCHETYPES: {
      current: {
        name: 'Current Page Baseline',
        description: 'Preserves the active user-configured decision state on screen.'
      },
      best_cost_champion: {
        name: 'Best-Cost Grand Champion',
        description: '5.0★ Camera / 5.0★ Drone balanced high-volume model with $395 wholesale / $1,520 retail pricing.',
        cameraStars: 5.0,
        droneStars: 5.0,
        cameraBundle: {
          resolution: 'Ultra HD (4K)',
          lensZoom: 4,
          sensorSize: 'Medium',
          lcdDisplay: 3.0,
          photoModes: 6,
          imageStabilization: 'Optical',
          editingSoftware: 3,
          targetWholesalePrice: 395
        },
        droneBundle: {
          bodyFrame: 3,
          battery: 4,
          obstacleSensors: 4,
          cameraSensor: 3,
          gimbal: 2,
          software: 3,
          targetRetailPrice: 1520
        },
        targetWholesalePrice: 395,
        targetRetailPrice: 1520,
        rdExpenditure: 50000,
        incentivePay: 3.75,
        overtimeAllowance: 0.18
      },
      premium_scale: {
        name: 'Premium Scale Dominance',
        description: '5.5★–6.0★ Camera / 5.5★ Drone premium brand leadership with $420 wholesale / $1,650 retail pricing.',
        cameraStars: 5.5,
        droneStars: 5.5,
        cameraBundle: {
          resolution: 'Ultra HD (4K)',
          lensZoom: 5,
          sensorSize: 'Large',
          lcdDisplay: 3.5,
          photoModes: 6,
          imageStabilization: 'Optical',
          editingSoftware: 3,
          targetWholesalePrice: 420
        },
        droneBundle: {
          bodyFrame: 3,
          battery: 4,
          obstacleSensors: 6,
          cameraSensor: 3,
          gimbal: 2,
          software: 3,
          targetRetailPrice: 1650
        },
        targetWholesalePrice: 420,
        targetRetailPrice: 1650,
        rdExpenditure: 50000,
        incentivePay: 4.00,
        overtimeAllowance: 0.20
      }
    },

    /**
     * Identifies available star levels adjacent to current estimated camera star rating.
     * @param {number} currentStars - Current estimated star rating (e.g. 4.0)
     * @returns {Array<number>} Adjacent target star tiers to test [e.g. 3.5, 4.5, 5.0]
     */
    getCandidateStarTiers(currentStars = 4.0) {
      const allTiers = Object.keys(this.CAMERA_STAR_BUNDLES).map(Number).sort((a, b) => a - b);
      const candidates = [];
      const downTier = allTiers.filter(t => t < currentStars).pop();
      const upTier = allTiers.filter(t => t > currentStars).shift();
      const upNextTier = allTiers.filter(t => t > (upTier || currentStars)).shift();

      if (downTier) candidates.push(downTier);
      if (upTier) candidates.push(upTier);
      if (upNextTier) candidates.push(upNextTier);
      return candidates;
    },

    /**
     * Identifies available star levels adjacent to current estimated drone star rating.
     * @param {number} currentStars - Current estimated drone star rating (e.g. 4.0)
     * @returns {Array<number>} Adjacent target star tiers to test
     */
    getCandidateDroneStarTiers(currentStars = 4.0) {
      const allTiers = Object.keys(this.DRONE_STAR_BUNDLES).map(Number).sort((a, b) => a - b);
      const candidates = [];
      const downTier = allTiers.filter(t => t < currentStars).pop();
      const upTier = allTiers.filter(t => t > currentStars).shift();
      const upNextTier = allTiers.filter(t => t > (upTier || currentStars)).shift();

      if (downTier) candidates.push(downTier);
      if (upTier) candidates.push(upTier);
      if (upNextTier) candidates.push(upNextTier);
      return candidates;
    },

    /**
     * Maps camera bundle feature keys to decision inputs on the page.
     * @param {Array<Object>} inputs - Array of DOM decision input objects
     * @param {Object} bundle - Specification bundle
     * @returns {Array<Object>} Array of { item, value } assignments
     */
    matchBundleToInputs(inputs, bundle) {
      if (!bundle || !inputs) return [];
      const plan = [];
      for (const item of inputs) {
        const text = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
        // Skip drone-specific inputs if inspecting mixed lists
        if (text.includes('drone') || text.includes('uav')) continue;

        if (text.includes('zoom') && bundle.lensZoom !== undefined) {
          plan.push({ item, value: bundle.lensZoom });
        } else if (text.includes('lcd') && bundle.lcdDisplay !== undefined) {
          plan.push({ item, value: bundle.lcdDisplay });
        } else if ((text.includes('mode') || text.includes('preset')) && bundle.photoModes !== undefined) {
          plan.push({ item, value: bundle.photoModes });
        } else if (text.includes('software') && bundle.editingSoftware !== undefined) {
          plan.push({ item, value: bundle.editingSoftware });
        } else if (text.includes('resolution') && bundle.resolution !== undefined && item.type === 'select') {
          plan.push({ item, value: bundle.resolution });
        } else if (text.includes('stabiliz') && bundle.imageStabilization !== undefined && item.type === 'select') {
          plan.push({ item, value: bundle.imageStabilization });
        }
      }
      return plan;
    },

    /**
     * Maps drone bundle feature keys to decision inputs on the page.
     * @param {Array<Object>} inputs - Array of DOM decision input objects
     * @param {Object} bundle - Drone specification bundle
     * @returns {Array<Object>} Array of { item, value } assignments
     */
    matchDroneBundleToInputs(inputs, bundle) {
      if (!bundle || !inputs) return [];
      const plan = [];
      for (const item of inputs) {
        const text = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
        const isDrone = text.includes('drone') || text.includes('uav') || (!text.includes('camera') && !text.includes('ac '));
        if (!isDrone && !text.includes('obstacle') && !text.includes('frame') && !text.includes('flight') && !text.includes('gimbal')) {
          continue;
        }

        if ((text.includes('body') || text.includes('frame') || text.includes('construction')) && bundle.bodyFrame !== undefined) {
          plan.push({ item, value: bundle.bodyFrame });
        } else if ((text.includes('battery') || text.includes('flight') || text.includes('cell')) && bundle.battery !== undefined) {
          plan.push({ item, value: bundle.battery });
        } else if (text.includes('obstacle') && bundle.obstacleSensors !== undefined) {
          plan.push({ item, value: bundle.obstacleSensors });
        } else if ((text.includes('camera') || text.includes('sensor')) && (text.includes('drone') || text.includes('uav') || text.includes('built-in')) && bundle.cameraSensor !== undefined) {
          plan.push({ item, value: bundle.cameraSensor });
        } else if (text.includes('gimbal') && bundle.gimbal !== undefined) {
          plan.push({ item, value: bundle.gimbal });
        } else if ((text.includes('software') || text.includes('feature')) && (text.includes('drone') || text.includes('uav')) && bundle.software !== undefined) {
          plan.push({ item, value: bundle.software });
        }
      }
      return plan;
    },

    /**
     * Runs a non-destructive Zero-Pass Strategic Archetype Tournament on Screen 1.
     * Tests canonical archetypes against baseline score; warm-starts the round from the winning seed.
     * @param {Object} adapter - GloBusDOMAdapter instance
     * @param {Object} optimizer - GloBusOptimizer instance
     * @returns {Promise<Object>} Winning archetype metadata and utility score
     */
    async evaluateArchetypeTournament(adapter, optimizer) {
      if (!adapter) return null;
      const getLog = () => (typeof window !== 'undefined' && window.gloBusLogger) || {
        log: () => {}, info: () => {}, success: () => {}, warn: () => {}, error: () => {}, step: () => {}
      };
      const log = getLog();
      const inputs = typeof adapter.getDecisionInputs === 'function' ? adapter.getDecisionInputs() : [];
      if (!inputs || inputs.length === 0) {
        return { key: 'current', name: 'Current Baseline', score: 0 };
      }

      // Non-destructive: capture initial snapshot to ensure perfect rollback if current wins
      const initialSnapshot = adapter.captureSnapshot ? adapter.captureSnapshot(inputs) : null;
      let initialMetrics = adapter.getProjectedMetrics ? adapter.getProjectedMetrics() : null;
      let initialScore = 0;
      if (optimizer && typeof optimizer.evaluateScore === 'function') {
        initialScore = optimizer.evaluateScore(initialMetrics);
      }

      let bestWinner = {
        key: 'current',
        name: this.STRATEGIC_ARCHETYPES.current?.name || 'Current Baseline',
        score: initialScore,
        metrics: initialMetrics,
        snapshot: initialSnapshot
      };

      try {
        const tournamentKeys = ['best_cost_champion', 'premium_scale'];
        for (const archKey of tournamentKeys) {
          const arch = this.STRATEGIC_ARCHETYPES[archKey];
          if (!arch) continue;

          // Apply camera bundle
          if (arch.cameraBundle) {
            const camPlan = this.matchBundleToInputs(inputs, arch.cameraBundle);
            camPlan.forEach(p => adapter.setInputValue(p.item, p.value));
          }
          // Apply drone bundle
          if (arch.droneBundle) {
            const dronePlan = this.matchDroneBundleToInputs(inputs, arch.droneBundle);
            dronePlan.forEach(p => adapter.setInputValue(p.item, p.value));
          }

          if (typeof adapter.triggerCalculate === 'function') {
            await adapter.triggerCalculate();
          }

          const candMetrics = adapter.getProjectedMetrics ? adapter.getProjectedMetrics() : null;
          let candScore = -Infinity;
          if (optimizer) {
            if (typeof optimizer.evaluateScoreWithProxy === 'function') {
              candScore = optimizer.evaluateScoreWithProxy(candMetrics, arch.targetWholesalePrice, arch.targetRetailPrice);
            } else if (typeof optimizer.evaluateScore === 'function') {
              candScore = optimizer.evaluateScore(candMetrics);
            }
          }

          log.info('TOURNAMENT', `[Archetype: ${arch.name}] Evaluated -> Score: ${candScore.toFixed(1)}, EPS: $${(candMetrics?.eps || 0).toFixed(2)}`);

          if (candScore > bestWinner.score) {
            bestWinner = {
              key: archKey,
              name: arch.name,
              score: candScore,
              metrics: candMetrics,
              snapshot: adapter.captureSnapshot ? adapter.captureSnapshot(inputs) : null
            };
          }
        }

        // Apply winning archetype or restore initial baseline
        if (bestWinner.key !== 'current' && bestWinner.snapshot) {
          if (typeof adapter.restoreSnapshot === 'function') {
            await adapter.restoreSnapshot(bestWinner.snapshot);
          }
          if (typeof adapter.triggerCalculate === 'function') {
            await adapter.triggerCalculate();
          }
          if (optimizer) {
            optimizer.bestScore = bestWinner.score;
            optimizer.bestMetrics = bestWinner.metrics;
            optimizer.bestCombo = bestWinner.snapshot;
          }
          log.success('TOURNAMENT', `Archetype [${bestWinner.name}] selected as winning warm-start seed! (Score: ${bestWinner.score.toFixed(1)})`);
        } else {
          if (initialSnapshot && typeof adapter.restoreSnapshot === 'function') {
            await adapter.restoreSnapshot(initialSnapshot);
          }
          if (typeof adapter.triggerCalculate === 'function') {
            await adapter.triggerCalculate();
          }
          log.info('TOURNAMENT', `Active screen baseline retained as champion (Score: ${bestWinner.score.toFixed(1)}).`);
        }
      } catch (err) {
        log.warn('TOURNAMENT', `Tournament exception, restoring initial state: ${err.message}`);
        if (initialSnapshot && typeof adapter.restoreSnapshot === 'function') {
          await adapter.restoreSnapshot(initialSnapshot);
        }
      }

      return bestWinner;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParetoStarSolver;
  }
  global.GloBusStarSolver = ParetoStarSolver;
})(typeof window !== 'undefined' ? window : global);
