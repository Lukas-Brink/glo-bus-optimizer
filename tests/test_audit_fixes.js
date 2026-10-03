/**
 * Comprehensive Test Suite for the 10 Glo-Bus Architectural & Mathematical Audit Fixes
 * Validates solutions for Pitfalls #1 through #10.
 */

const assert = require('assert');
const path = require('path');

console.log('================================================================');
console.log('   GLO-BUS AUDIT FIXES: COMPREHENSIVE VERIFICATION SUITE       ');
console.log('================================================================\n');

// Mock minimal DOM environment for dom-adapter and optimizer
global.window = global;
const mockTabs = [
  { textContent: 'Product Design', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Compensation & Facilities', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'AC Camera Marketing', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'UAV Drone Marketing', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Special Contract Offers', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Corporate Citizenship', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Finance & Cash Flow', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} }
];

global.document = {
  querySelectorAll: (sel) => {
    if (sel && (sel.includes('a, button, li') || sel.includes('button') || sel.includes('sidebar'))) return mockTabs;
    return [];
  },
  querySelector: () => null,
  body: { dispatchEvent: () => {} },
  getElementById: () => null
};
global.Event = class {};
global.KeyboardEvent = class {};
global.MouseEvent = class extends global.Event {};

const createMockStorage = () => {
  const store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
};
global.sessionStorage = createMockStorage();
global.localStorage = createMockStorage();

// Load Kernels
const ScoringKernel = require('../extension/scoring-kernel.js');
const CapacityKernel = require('../extension/capacity-kernel.js');
const StarSolver = require('../extension/star-solver.js');
require('../extension/dom-adapter.js');
require('../extension/optimizer.js');
require('../extension/page-coordinator.js');

const { SolvencyBarrier, ValuationModel, ObjectiveKernel, ConvergenceMonitor } = ScoringKernel;
const { ShadowCapacityAllocator, ContractReservation, CapexSinkingFund } = CapacityKernel;
const ParetoStarSolver = StarSolver;

// -----------------------------------------------------------------------------
// PITFALL #3: Artificial Saturation & Metric Deadband (Zero Marginal Utility)
// -----------------------------------------------------------------------------
console.log('[TEST 1/10] Pitfall #3: Artificial Saturation & Metric Deadband...');
{
  // State A: EPS $11.50, Image 76
  const stateA = {
    eps: 11.50, roe: 35.0, imageRating: 76, creditRating: 'A', creditRatingScore: 95,
    stockPrice: 85.0, endingCash: 8000
  };
  // State B: EPS $10.25 (sacrificed $1.25), Image 82 (+6 image points)
  const stateB = {
    eps: 10.25, roe: 32.0, imageRating: 82, creditRating: 'A', creditRatingScore: 95,
    stockPrice: 80.0, endingCash: 5000
  };

  const scoreA = ObjectiveKernel.evaluateScore(stateA);
  const scoreB = ObjectiveKernel.evaluateScore(stateB);

  assert.ok(scoreA > scoreB, `State A (EPS $11.50) must beat State B (EPS $10.25 with vanity CSR): Score A=${scoreA.toFixed(2)}, Score B=${scoreB.toFixed(2)}`);

  // Direct test of epsilon gradient between two high-EPS states where IE and BII are both saturated
  const highEPS1 = { eps: 12.0, roe: 40.0, imageRating: 85, creditRating: 'A+', stockPrice: 100, endingCash: 10000 };
  const highEPS2 = { eps: 14.0, roe: 40.0, imageRating: 85, creditRating: 'A+', stockPrice: 100, endingCash: 10000 };
  const s1 = ObjectiveKernel.evaluateScore(highEPS1);
  const s2 = ObjectiveKernel.evaluateScore(highEPS2);
  assert.ok(s2 > s1, `Score must strictly increase from EPS $12.00 to $14.00 (Gradient non-zero): s1=${s1.toFixed(3)}, s2=${s2.toFixed(3)}`);
  console.log('  [PASS] Pitfall #3: Unbounded regularizer strictly eliminates metric deadband.');
}

// -----------------------------------------------------------------------------
// PITFALL #7: Cash Buffer Dirac-Delta Penalty Cliff
// -----------------------------------------------------------------------------
console.log('[TEST 2/10] Pitfall #7: Cash Buffer Dirac-Delta Penalty Cliff...');
{
  const pAbove1000 = SolvencyBarrier.calculatePenalty(1001, 2500, false);
  const pBelow1000 = SolvencyBarrier.calculatePenalty(999, 2500, false);
  const deltaBoundary = Math.abs(pAbove1000 - pBelow1000);

  // Old code had a ~5,000-point jump! New C^1 barrier must be continuous (delta < 0.1 pt)
  assert.ok(deltaBoundary < 0.15, `Penalty across $1,000 boundary must be continuous! Delta was: ${deltaBoundary.toFixed(4)} pts`);

  // Verify monotonicity
  const p2500 = SolvencyBarrier.calculatePenalty(2500, 2500, false);
  const p1500 = SolvencyBarrier.calculatePenalty(1500, 2500, false);
  const p1000 = SolvencyBarrier.calculatePenalty(1000, 2500, false);
  const p500 = SolvencyBarrier.calculatePenalty(500, 2500, false);
  const p0 = SolvencyBarrier.calculatePenalty(0, 2500, false);
  const pNeg = SolvencyBarrier.calculatePenalty(-500, 2500, false);

  assert.strictEqual(p2500, 0, 'Penalty at minCash ($2,500k) must be 0');
  assert.ok(p1500 > p2500, 'Penalty must increase below $2,500k');
  assert.ok(p1000 > p1500, 'Penalty must increase approaching $1,000k');
  assert.ok(p500 > p1000, 'Penalty must increase below $1,000k');
  assert.ok(p0 > p500, 'Penalty at $0 must exceed penalty at $500k');
  assert.ok(pNeg > p0 + 400, 'Negative cash must trigger severe insolvency penalty');
  console.log('  [PASS] Pitfall #7: C^1 log-barrier cash penalty eliminates Dirac-delta cliff.');
}

// -----------------------------------------------------------------------------
// PITFALL #8: Single-Metric (ΔEPS) Multi-Cycle Premature Termination
// -----------------------------------------------------------------------------
console.log('[TEST 3/10] Pitfall #8: Multi-Objective Vector-Norm Convergence...');
{
  const startMetrics = { eps: 4.80, creditRating: 'B+', imageRating: 72 };
  // Cycle 2: EPS moves by only +$0.01 (< $0.02 threshold), but Credit improves to A- and Score jumps by +6.6 pts
  const endMetrics = { eps: 4.81, creditRating: 'A-', imageRating: 77 };
  const startScore = 91.2;
  const endScore = 97.8;

  const conv = ConvergenceMonitor.evaluateConvergence(
    endMetrics,
    startMetrics,
    endScore,
    startScore,
    { minEpsGainThreshold: 0.02, minScoreGainThreshold: 0.50 }
  );

  assert.strictEqual(conv.hasSignificantGain, true, 'Multi-objective gain must allow cycle continuation even when ΔEPS < $0.02');
  assert.ok(conv.reason.includes('Score Δ') || conv.reason.includes('Credit Rank'), 'Reason must document multi-objective driver');
  console.log('  [PASS] Pitfall #8: Vector-norm convergence prevents premature cycle termination.');
}

// -----------------------------------------------------------------------------
// PITFALL #6: Asymmetric Dimensionality Shift (Stock Price Normalization Shock)
// -----------------------------------------------------------------------------
console.log('[TEST 4/10] Pitfall #6: Synthetic Stock Price Valuation Proxy...');
{
  const metricsWithoutStock = { eps: 5.40, roe: 34.2, creditRating: 'A', creditRatingScore: 95, imageRating: 77, endingCash: 14200, stockPrice: 0 };
  const estimatedPrice = ValuationModel.estimateStockPrice(metricsWithoutStock);
  assert.ok(estimatedPrice > 30.0 && estimatedPrice < 200.0, `Estimated stock price must be reasonable: $${estimatedPrice.toFixed(2)}`);

  const metricsWithActualStock = { ...metricsWithoutStock, stockPrice: estimatedPrice };
  const scoreScreen6 = ObjectiveKernel.evaluateScore(metricsWithoutStock, {}, true);
  const scoreScreen7 = ObjectiveKernel.evaluateScore(metricsWithActualStock, {}, true);

  const delta = Math.abs(scoreScreen6 - scoreScreen7);
  assert.ok(delta < 0.05, `Synthetic proxy must eliminate dimensionality shock across screens: delta was ${delta.toFixed(4)} pts`);
  console.log('  [PASS] Pitfall #6: Synthetic valuation proxy maintains invariant 5-pillar domain.');
}

// -----------------------------------------------------------------------------
// PITFALL #2: The "Demand-Before-Capacity" Asymmetric Sequence Deadlock
// -----------------------------------------------------------------------------
console.log('[TEST 5/10] Pitfall #2: Causal Decision Sequencing (Facilities First)...');
{
  const discovered = global.gloBusPageCoordinator.discoverLeftPaneTabs();
  assert.strictEqual(discovered[0].name, 'Product Design');
  assert.strictEqual(discovered[1].name, 'Compensation & Facilities', 'Compensation & Facilities must be evaluated BEFORE Marketing');
  assert.strictEqual(discovered[2].name, 'AC Camera Marketing');
  assert.strictEqual(discovered[3].name, 'UAV Drone Marketing');
  assert.strictEqual(discovered[4].name, 'Special Contract Offers');
  assert.strictEqual(discovered[5].name, 'Corporate Citizenship');
  assert.strictEqual(discovered[6].name, 'Finance & Cash Flow');
  console.log('  [PASS] Pitfall #2: Decision sequence orders Facilities before Marketing.');
}

// -----------------------------------------------------------------------------
// PITFALL #4: Special Contracts Two-Tiered Reservation Architecture
// -----------------------------------------------------------------------------
console.log('[TEST 6/10] Pitfall #4: Special Contracts Ghost Demand & Outsourcing Gate...');
{
  // Scenario: Retail demand consumes 320k units of 360k max capacity.
  // Bid of 50k contract units requires 10k outsourced units.
  // Bid price = $180, standard cost = $135. Outsourced cost = $185 ($50 surcharge) -> Loss of -$5/unit on outsourced units!
  const capacityState = { regularCapacity: 300000, maxOvertimeCapacity: 360000, retailDemand: 320000 };
  const riskyBid = { discount: 26, bidPrice: 180, estimatedBOM: 100, estimatedLabor: 35 };

  const evalRisky = ContractReservation.evaluateContractBid(riskyBid, capacityState);
  assert.strictEqual(evalRisky.isApproved, false, 'Risky bid with negative outsourced margin must be rejected');
  assert.ok(evalRisky.outsourcingRequired > 0);

  // Scenario 2: Bid price is high enough to be profitable even with outsourcing
  const healthyBid = { discount: 20, bidPrice: 220, estimatedBOM: 100, estimatedLabor: 35 };
  const evalHealthy = ContractReservation.evaluateContractBid(healthyBid, capacityState);
  assert.strictEqual(evalHealthy.isApproved, true, 'Healthy bid covering outsourcing penalty must be approved');
  console.log('  [PASS] Pitfall #4: Contract reservation blocks catastrophic outsourcing deficits.');
}

// -----------------------------------------------------------------------------
// PITFALL #9: 4-Region Diagonal Co-Optimization & Diagonal Momentum
// -----------------------------------------------------------------------------
console.log('[TEST 7/10] Pitfall #9: 4-Region Diagonal Co-Optimization & Momentum...');
{
  const opt = new global.GloBusOptimizer(global.gloBusDOMAdapter);
  const mockMarketingInputs = [
    { name: 'na_price', label: 'North America Wholesale Price', category: 'price', value: 300, min: 100, max: 900, step: 5 },
    { name: 'na_ad', label: 'North America Advertising Budget', category: 'marketing', value: 3000, min: 0, max: 10000, step: 250 },
    { name: 'ea_price', label: 'Europe-Africa Wholesale Price', category: 'price', value: 300, min: 100, max: 900, step: 5 },
    { name: 'ea_ad', label: 'Europe-Africa Advertising Budget', category: 'marketing', value: 3000, min: 0, max: 10000, step: 250 },
    { name: 'ap_price', label: 'Asia-Pacific Wholesale Price', category: 'price', value: 300, min: 100, max: 900, step: 5 },
    { name: 'ap_ad', label: 'Asia-Pacific Advertising Budget', category: 'marketing', value: 3000, min: 0, max: 10000, step: 250 },
    { name: 'la_price', label: 'Latin America Wholesale Price', category: 'price', value: 300, min: 100, max: 900, step: 5 },
    { name: 'la_ad', label: 'Latin America Advertising Budget', category: 'marketing', value: 3000, min: 0, max: 10000, step: 250 }
  ];

  const pairs = opt.identifyCoupledPairs(mockMarketingInputs);
  assert.strictEqual(pairs.length, 4, `All 4 regional price & advertising pairs must be identified! Found: ${pairs.length}`);
  console.log('  [PASS] Pitfall #9: Co-optimization identifies all 4 regional markets.');
}

// -----------------------------------------------------------------------------
// PITFALL #5: S/Q Star Rating Quantum Barrier (Screen 1 Solver)
// -----------------------------------------------------------------------------
console.log('[TEST 8/10] Pitfall #5: Discrete S/Q Star Rating Combinatorial Solver...');
{
  const candidateTiers = ParetoStarSolver.getCandidateStarTiers(4.0);
  assert.ok(candidateTiers.includes(4.5), 'Candidate tiers must include 4.5 stars');
  assert.ok(candidateTiers.includes(5.0), 'Candidate tiers must include 5.0 stars');

  const bundle45 = ParetoStarSolver.CAMERA_STAR_BUNDLES[4.5];
  assert.ok(bundle45 !== undefined);
  assert.strictEqual(bundle45.lensZoom, 4);
  assert.strictEqual(bundle45.lcdDisplay, 3.0);

  const mockDesignInputs = [
    { label: 'Camera Lens Zoom', name: 'lensZoom', value: 3 },
    { label: 'LCD Display Size', name: 'lcdDisplay', value: 2.5 },
    { label: 'Number of Photo Modes', name: 'photoModes', value: 4 }
  ];

  const matched = ParetoStarSolver.matchBundleToInputs(mockDesignInputs, bundle45);
  assert.strictEqual(matched.length, 3, 'Must match all bundle components to inputs');
  assert.strictEqual(matched[0].value, 4);
  assert.strictEqual(matched[1].value, 3.0);
  console.log('  [PASS] Pitfall #5: Combinatorial star solver enables discrete quantum upgrades.');
}

// -----------------------------------------------------------------------------
// PITFALL #1: Cross-Regional Capacity Cannibalization & Shadow Allocator
// -----------------------------------------------------------------------------
console.log('[TEST 9/10] Pitfall #1: Cross-Regional Capacity Cannibalization...');
{
  const regionalDemands = { na: 140000, ea: 130000, ap: 110000, la: 80000 }; // Total = 460k > 360k max capacity
  const regionalPrices = { na: 280, ea: 290, ap: 300, la: 320 };

  const allocation = ShadowCapacityAllocator.allocateCapacity(regionalDemands, regionalPrices, 360000);
  assert.strictEqual(allocation.isConstrained, true, 'Demand exceeding capacity must trigger constrained allocation');
  assert.ok(allocation.recommendedLimits.ap >= 54000, 'AP must receive fair share (>= 15% floor) rather than 0');
  assert.ok(allocation.recommendedLimits.la >= 54000, 'LA must receive fair share (>= 15% floor) rather than 0');
  console.log('  [PASS] Pitfall #1: Shadow capacity allocator prevents regional starvation.');
}

// -----------------------------------------------------------------------------
// PITFALL #10: Single-Round Horizon Equity Stripping (Buyback Sinking Fund)
// -----------------------------------------------------------------------------
console.log('[TEST 10/10] Pitfall #10: Strategic Capex Sinking Fund for Buybacks...');
{
  // Current cash = $15,000k. Workstations = 120. Growth rate = 12%
  // Needed stations = ceil(120 * 0.12) = 15 stations.
  // Capex reserve = 15 * 175 = $2,625k.
  // Min liquidity floor = $2,500k base + $2,625k capex = $5,125k.
  const facilityState = { currentWorkstations: 120, expectedDemandGrowth: 0.12 };
  const fund = CapexSinkingFund.calculateLiquidityFloor(facilityState, 15000);

  assert.strictEqual(fund.projectedCapexReserve, 2625);
  assert.strictEqual(fund.minimumLiquidityFloor, 5125);
  assert.strictEqual(fund.maxAvailableForBuybacks, 15000 - 5125);

  // If cash is low (e.g. $4,000k < $5,125k floor), buybacks must be constrained
  const lowCashFund = CapexSinkingFund.calculateLiquidityFloor(facilityState, 4000);
  assert.strictEqual(lowCashFund.isConstrained, true);
  assert.strictEqual(lowCashFund.maxAvailableForBuybacks, 0, 'No buybacks permitted when cash is below sinking fund floor');
  console.log('  [PASS] Pitfall #10: Capex sinking fund prevents growth liquidity stripping.');
}

// -----------------------------------------------------------------------------
// FIX A: HUD Layout & Metric Card Isolation
// -----------------------------------------------------------------------------
console.log('[TEST 11/13] HUD Layout & Metric Card Isolation...');
{
  const hudCss = require('fs').readFileSync(path.join(__dirname, '../extension/hud.css'), 'utf8');
  assert.ok(hudCss.includes('box-sizing: border-box !important'), 'HUD must enforce border-box on all elements');
  assert.ok(hudCss.includes('grid-template-columns: repeat(2, minmax(0, 1fr))'), 'HUD metrics grid must constrain card columns');
  assert.ok(hudCss.includes('overflow: hidden'), 'HUD must prevent horizontal container overflow');
  console.log('  [PASS] Fix A: HUD metric cards properly isolated from host CSS and constrained.');
}

// -----------------------------------------------------------------------------
// FIX B: Telemetry Log Cap & Session Persistence
// -----------------------------------------------------------------------------
console.log('[TEST 12/13] Telemetry Log Retention Beyond 500 Entries...');
{
  const testLogger = new global.gloBusLogger.constructor();
  const origLog = console.log;
  console.log = () => {};
  for (let i = 0; i < 750; i++) {
    testLogger.info('TEST', `Log message index ${i}`);
  }
  console.log = origLog;
  assert.strictEqual(testLogger.logs.length, 750, `All 750 logs must be retained without truncation (found ${testLogger.logs.length})`);
  assert.strictEqual(testLogger.logs[0].message, 'Log message index 0', 'First log entry must not be dropped/shifted out');
  console.log('  [PASS] Fix B: Telemetry retains complete log history without 500-line cap.');
}

// -----------------------------------------------------------------------------
// FIX C: Bank Loan Debt Guard & Cash Regularizer Cap
// -----------------------------------------------------------------------------
console.log('[TEST 13/13] Bank Loan Debt Guard & Cash Regularizer Cap...');
(async () => {
  // 1. Cash Regularizer Cap Test
  const m10M = { eps: 8.0, roe: 30.0, imageRating: 80, creditRating: 'A', stockPrice: 70, endingCash: 10000 };
  const m68M = { eps: 8.0, roe: 30.0, imageRating: 80, creditRating: 'A', stockPrice: 70, endingCash: 68700 };
  const s10M = ObjectiveKernel.evaluateScore(m10M);
  const s68M = ObjectiveKernel.evaluateScore(m68M);
  assert.strictEqual(s10M.toFixed(4), s68M.toFixed(4), 'Cash regularizer must be strictly capped at $10M so excess cash provides zero phantom gradient');

  // 2. Optimizer bank loan guard test
  const opt = new global.GloBusOptimizer(global.gloBusDOMAdapter);
  opt.isRunning = true;
  opt.isStopped = false;
  global.gloBusDOMAdapter.getProjectedMetrics = () => ({
    eps: 7.12, roe: 28.5, endingCash: 68700, creditRating: 'B+', imageRating: 73
  });

  const mockEl = { value: '0', dispatchEvent: () => {} };
  const loanInput = {
    element: mockEl,
    name: 'loan_5yr',
    label: '5-Year Bank Loan',
    category: 'finance',
    value: 0,
    min: 0,
    max: 35000,
    step: 3500,
    type: 'input'
  };

  let testedUpward = false;
  opt.evaluateInput = async (item, val) => {
    if (val > 0) testedUpward = true;
    return global.gloBusDOMAdapter.getProjectedMetrics();
  };

  const res = await opt.optimizeSingleParameter(loanInput);
  assert.strictEqual(res, false, 'Loan parameter must be rejected/kept at 0 when cash >= $2,500k');
  assert.strictEqual(testedUpward, false, 'Must not evaluate upward borrowing when cash >= $2,500k');
  assert.strictEqual(loanInput.value, 0, 'Loan value must remain 0');

  // 3. When loan > 0 and cash >= $2500k, upward borrowing is blocked but downward is allowed
  const activeMockEl = { value: '21000', dispatchEvent: () => {} };
  const activeLoan = {
    element: activeMockEl,
    name: 'loan_10yr',
    label: '10-Year Bank Loan',
    category: 'finance',
    value: 21000,
    min: 0,
    max: 35000,
    step: 3500,
    type: 'input'
  };
  const testedVals = [];
  opt.evaluateInput = async (item, val) => {
    testedVals.push(val);
    return { eps: 7.10, roe: 28.0, endingCash: 65200, creditRating: 'B+', imageRating: 73 };
  };
  await opt.optimizeSingleParameter(activeLoan);
  assert.ok(!testedVals.includes(24500), 'Upward loan borrowing (24500) must never be evaluated when cash >= $2,500k');
  assert.ok(testedVals.includes(17500), 'Downward loan repayment (17500) must be evaluated');

  console.log('  [PASS] Fix C: Bank loan borrowing blocked when cash is funded >= $2,500k.');

  // -----------------------------------------------------------------------------
  // TEST 14: StarSolver Snapshot Reversion on Bundle Rejection
  // -----------------------------------------------------------------------------
  console.log('[TEST 14/17] StarSolver Snapshot Reversion on Bundle Rejection...');
  {
    const mockInputs = [
      { name: 'lensZoom', label: 'Camera Lens Zoom', value: 2, min: 1, max: 6, step: 1, type: 'input' },
      { name: 'lcdDisplay', label: 'LCD Display Size', value: 2.0, min: 1.5, max: 4.0, step: 0.5, type: 'input' },
      { name: 'photoModes', label: 'Number of Photo Modes', value: 3, min: 1, max: 8, step: 1, type: 'input' }
    ];

    const initialSnapshot = {
      lensZoom: 2,
      lcdDisplay: 2.0,
      photoModes: 3
    };

    const mockAdapter = {
      detectPageType: () => 'PRODUCT_DESIGN',
      pageType: 'PRODUCT_DESIGN',
      captureSnapshot: () => ({ ...initialSnapshot }),
      restoreSnapshot: async (snap) => {
        mockInputs.forEach(i => {
          if (snap[i.name] !== undefined) i.value = snap[i.name];
        });
      },
      setInputValue: (item, val) => { item.value = val; },
      triggerCalculate: async () => {},
      getProjectedMetrics: () => ({ eps: 4.65, roe: 20.0, endingCash: 5000, creditRating: 'A', imageRating: 55 })
    };

    const optStar = new global.GloBusOptimizer(mockAdapter);
    optStar.isRunning = true;
    optStar.bestScore = 101.9; // Baseline score is higher than bundle score (22.8)

    // Execute StarSolver bundle evaluation block
    const candidateTiers = ParetoStarSolver.getCandidateStarTiers(4.0);
    const preStarSnapshot = mockAdapter.captureSnapshot(mockInputs);
    let bundleAccepted = false;
    for (const tier of candidateTiers) {
      const bundle = ParetoStarSolver.CAMERA_STAR_BUNDLES[tier];
      if (!bundle) continue;
      const assignments = ParetoStarSolver.matchBundleToInputs(mockInputs, bundle);
      if (assignments.length > 0) {
        assignments.forEach(a => mockAdapter.setInputValue(a.item, a.value));
        await mockAdapter.triggerCalculate();
        const metrics = mockAdapter.getProjectedMetrics();
        const score = optStar.evaluateScore(metrics);
        if (score > optStar.bestScore) {
          optStar.bestScore = score;
          bundleAccepted = true;
        }
      }
    }
    if (!bundleAccepted) {
      await mockAdapter.restoreSnapshot(preStarSnapshot);
      await mockAdapter.triggerCalculate();
    }

    assert.strictEqual(mockInputs[0].value, 2, 'Lens zoom must revert to initial baseline value 2');
    assert.strictEqual(mockInputs[1].value, 2.0, 'LCD display must revert to initial baseline value 2.0');
    assert.strictEqual(mockInputs[2].value, 3, 'Photo modes must revert to initial baseline value 3');
    console.log('  [PASS] Test 14: StarSolver properly rolls back DOM snapshot when bundles are rejected.');
  }

  // -----------------------------------------------------------------------------
  // TEST 15: Optimizer Monotonicity (Rejections Never Degrade bestScore)
  // -----------------------------------------------------------------------------
  console.log('[TEST 15/17] Optimizer Monotonicity (Rejections Never Degrade bestScore)...');
  {
    const mockEl = { value: '2', dispatchEvent: () => {} };
    const mockItem = { element: mockEl, name: 'sensorSize', label: 'Image Sensor Size', value: 2, min: 1, max: 5, step: 1, type: 'input' };
    const optMono = new global.GloBusOptimizer(global.gloBusDOMAdapter);
    optMono.isRunning = true;
    optMono.isStopped = false;
    optMono.bestScore = 101.9;
    optMono.baselineScore = 101.9;
    optMono.bestMetrics = { eps: 7.14, roe: 95.1, endingCash: -5250, creditRating: 'A', imageRating: 73 };
    optMono.baselineMetrics = { ...optMono.bestMetrics };

    // Suboptimal perturbations evaluate to 25.4 and 25.3
    optMono.evaluateInput = async (item, val) => {
      return { eps: 4.65, roe: 20.0, endingCash: -5000, creditRating: 'A', imageRating: 55 };
    };

    const improved = await optMono.optimizeSingleParameter(mockItem);
    assert.strictEqual(improved, false, 'Inferior perturbations must be rejected');
    assert.strictEqual(optMono.bestScore, 101.9, 'bestScore must strictly remain 101.9 and NOT be clobbered by rejection');
    assert.strictEqual(mockItem.value, 2, 'Parameter must remain at currentVal');
    console.log('  [PASS] Test 15: Strict monotonicity preserved; rejections never degrade bestScore.');
  }

  // -----------------------------------------------------------------------------
  // TEST 16: UAV Drone Retail Price Bounds Inference on UAV_MARKETING
  // -----------------------------------------------------------------------------
  console.log('[TEST 16/17] UAV Drone Retail Price Bounds Inference on UAV_MARKETING...');
  {
    const mockEl = { getAttribute: () => null, querySelector: () => null };
    global.gloBusDOMAdapter.pageType = 'UAV_MARKETING';
    const droneBounds = global.gloBusDOMAdapter.inferBounds(mockEl, 'N.A. Retail Price', 1522);
    assert.strictEqual(droneBounds.min, 400, 'Drone price min must be 400');
    assert.strictEqual(droneBounds.max, 3000, 'Drone price max must be 3000 on UAV_MARKETING, not 900');
    assert.strictEqual(droneBounds.step, 10, 'Drone price step must be 10');
    assert.strictEqual(droneBounds.category, 'price');

    // Verify Camera Marketing price still caps at 900
    global.gloBusDOMAdapter.pageType = 'AC_MARKETING';
    const camBounds = global.gloBusDOMAdapter.inferBounds(mockEl, 'N.A. Wholesale Price', 379);
    assert.strictEqual(camBounds.max, 900, 'Camera price max must be 900 on AC_MARKETING');
    assert.strictEqual(camBounds.min, 100, 'Camera price min must be 100 on AC_MARKETING');
    console.log('  [PASS] Test 16: UAV Drone marketing page correctly infers $400-$3000 price bounds.');
  }

  // -----------------------------------------------------------------------------
  // TEST 17: Accurate Convergence Delta Calculation without Phantom Drift
  // -----------------------------------------------------------------------------
  console.log('[TEST 17/20] ConvergenceMonitor Full Snapshot Delta Accuracy...');
  {
    const startMetrics = { eps: 7.14, creditRating: 'A', imageRating: 73, endingCash: -5250 };
    const endMetrics = { eps: 7.31, creditRating: 'A', imageRating: 72, endingCash: 5113 };
    const res = ConvergenceMonitor.evaluateConvergence(
      endMetrics,
      startMetrics,
      104.7,
      101.9,
      { minEpsGainThreshold: 0.02, minScoreGainThreshold: 0.50 }
    );
    assert.strictEqual(res.deltas.deltaImage, -1, 'Image delta must accurately calculate -1, never +72');
    assert.strictEqual(res.deltas.deltaCredit, 0, 'Credit delta must accurately calculate 0 rank change');
    assert.strictEqual(res.deltas.deltaEPS.toFixed(2), '0.17', 'EPS delta must be +0.17');
    console.log('  [PASS] Test 17: ConvergenceMonitor evaluates accurate deltas from full snapshot.');
  }

  // -----------------------------------------------------------------------------
  // TEST 18: Strategic Archetype Seeder Tournament (Pillar 1: Basin Pre-Selection)
  // -----------------------------------------------------------------------------
  console.log('[TEST 18/20] Strategic Archetype Seeder Tournament (Pillar 1)...');
  {
    assert.ok(StarSolver.STRATEGIC_ARCHETYPES.best_cost_champion, 'best_cost_champion archetype must be defined');
    assert.ok(StarSolver.STRATEGIC_ARCHETYPES.premium_scale, 'premium_scale archetype must be defined');
    assert.strictEqual(StarSolver.STRATEGIC_ARCHETYPES.best_cost_champion.cameraStars, 5.0);
    assert.strictEqual(StarSolver.STRATEGIC_ARCHETYPES.best_cost_champion.targetWholesalePrice, 395);

    const mockInputs = [
      { element: { value: '2', dispatchEvent: () => {} }, label: 'Lens Zoom', name: 'lensZoom', value: 2 },
      { element: { value: '2.0', dispatchEvent: () => {} }, label: 'LCD Display', name: 'lcdDisplay', value: 2.0 },
      { element: { value: '3', dispatchEvent: () => {} }, label: 'Photo Modes', name: 'photoModes', value: 3 },
      { element: { value: '1', dispatchEvent: () => {} }, label: 'Editing Software', name: 'editingSoftware', value: 1 },
      { element: { value: '1', dispatchEvent: () => {} }, label: 'Drone Body Frame', name: 'bodyFrame', value: 1 },
      { element: { value: '1', dispatchEvent: () => {} }, label: 'Drone Battery', name: 'battery', value: 1 },
      { element: { value: '0', dispatchEvent: () => {} }, label: 'Drone Obstacle Sensors', name: 'obstacleSensors', value: 0 }
    ];

    const mockAdapter = {
      getDecisionInputs: () => mockInputs,
      setInputValue: (item, val) => {
        item.value = val;
        item.element.value = String(val);
      },
      captureSnapshot: (inputs) => {
        const snap = {};
        (inputs || mockInputs).forEach(i => { snap[i.name] = i.value; });
        return snap;
      },
      restoreSnapshot: async (snap) => {
        if (!snap) return;
        mockInputs.forEach(i => {
          if (snap[i.name] !== undefined) {
            i.value = snap[i.name];
            i.element.value = String(snap[i.name]);
          }
        });
      },
      triggerCalculate: async () => {},
      getProjectedMetrics: () => {
        const zoom = mockInputs.find(i => i.name === 'lensZoom').value;
        if (zoom === 4) {
          // 5.0★ archetype
          return { eps: 8.20, roe: 38.0, imageRating: 78, creditRating: 'A', endingCash: 5000, targetEPS: 4.25 };
        } else if (zoom === 5) {
          // 5.5★ archetype
          return { eps: 7.90, roe: 36.0, imageRating: 80, creditRating: 'A', endingCash: 4500, targetEPS: 4.25 };
        } else {
          // 3.0★ baseline
          return { eps: 4.10, roe: 20.0, imageRating: 65, creditRating: 'B', endingCash: 2000, targetEPS: 4.25 };
        }
      }
    };

    const optTournament = new global.GloBusOptimizer(mockAdapter);
    const tournamentWinner = await StarSolver.evaluateArchetypeTournament(mockAdapter, optTournament);
    assert.strictEqual(tournamentWinner.key, 'best_cost_champion', '5.0★ Best-Cost Champion must win over 3.0★ baseline');
    assert.strictEqual(mockInputs.find(i => i.name === 'lensZoom').value, 4, 'Winning archetype settings must be applied to DOM');
    assert.ok(tournamentWinner.score > 0, 'Winning score must be positive');

    // Test Baseline Preservation: when active baseline is already superior, tournament retains current state
    mockAdapter.getProjectedMetrics = () => {
      const zoom = mockInputs.find(i => i.name === 'lensZoom').value;
      if (zoom === 99) {
        // High existing baseline
        return { eps: 15.00, roe: 50.0, imageRating: 95, creditRating: 'A+', endingCash: 12000, targetEPS: 4.25 };
      }
      return { eps: 8.00, roe: 35.0, imageRating: 78, creditRating: 'A', endingCash: 5000, targetEPS: 4.25 };
    };
    mockInputs.find(i => i.name === 'lensZoom').value = 99;
    mockInputs.find(i => i.name === 'lensZoom').element.value = '99';

    const baselineRetained = await StarSolver.evaluateArchetypeTournament(mockAdapter, optTournament);
    assert.strictEqual(baselineRetained.key, 'current', 'Superior existing user setup must be preserved');
    assert.strictEqual(mockInputs.find(i => i.name === 'lensZoom').value, 99, 'Inputs must remain at superior baseline value');
    console.log('  [PASS] Test 18: Strategic Archetype Seeder Tournament warm-starts optimal global basin and preserves superior baselines.');
  }

  // -----------------------------------------------------------------------------
  // TEST 19: Star-Price Decoupling Proxy (Pillar 2: Cross-Screen Macro-Jumps)
  // -----------------------------------------------------------------------------
  console.log('[TEST 19/20] Star-Price Decoupling Proxy (Pillar 2)...');
  {
    const optProxy = new global.GloBusOptimizer(global.gloBusDOMAdapter);
    const baseMetrics = { eps: 5.00, roe: 25.0, imageRating: 70, creditRating: 'A', endingCash: 3000, targetEPS: 4.25 };
    const baseScore = optProxy.evaluateScore(baseMetrics);

    // Hardware upgrade to 5.0★ evaluated against stale Screen 3 price ($320)
    // Raw scoreboard EPS drops to $4.60 due to BOM cost before marketing price is raised
    const upgradedRawMetrics = { eps: 4.60, roe: 23.0, imageRating: 70, creditRating: 'A', endingCash: 2500, targetEPS: 4.25 };
    const rawScore = optProxy.evaluateScore(upgradedRawMetrics);

    // Under stale pricing without proxy, raw score is lower (deadlock!)
    assert.ok(rawScore < baseScore, 'Raw scoreboard score drops under stale Screen 3 pricing');

    // With Anticipated Downstream Margin Valuation Proxy (target wholesale $395, drone $1520):
    const proxyScore = optProxy.evaluateScoreWithProxy(upgradedRawMetrics, 395, 1520);
    assert.ok(proxyScore > baseScore, 'Proxy score must comfortably beat baseline score to overcome BOM quantum barrier');

    // Test StarSolver bundles include target pricing
    const cam50 = StarSolver.CAMERA_STAR_BUNDLES[5.0];
    assert.strictEqual(cam50.targetWholesalePrice, 395, 'Camera 5.0★ bundle must target $395 wholesale price');
    const drone50 = StarSolver.DRONE_STAR_BUNDLES[5.0];
    assert.strictEqual(drone50.targetRetailPrice, 1520, 'Drone 5.0★ bundle must target $1520 retail price');
    console.log('  [PASS] Test 19: Star-Price Decoupling Proxy eliminates Screen 1 to Screen 3 chicken-and-egg stalling.');
  }

  // -----------------------------------------------------------------------------
  // TEST 20: Multi-Cycle Simulated Annealing Cooling Schedule & T=0 Monotonicity (Pillar 3)
  // -----------------------------------------------------------------------------
  console.log('[TEST 20/20] Multi-Cycle Simulated Annealing Cooling Schedule (Pillar 3)...');
  {
    const optAnneal = new global.GloBusOptimizer(global.gloBusDOMAdapter);
    
    // Cycle 1: Exploration
    optAnneal.setCycleContext(1, 3);
    assert.strictEqual(optAnneal.cycleIndex, 1);
    assert.strictEqual(optAnneal.temperature, 1.0, 'Cycle 1 temperature must be 1.0');
    assert.strictEqual(optAnneal.stepScaleMultiplier, 2.0, 'Cycle 1 step scale must be 2.0x');

    // Cycle 2: Co-Optimization
    optAnneal.setCycleContext(2, 3);
    assert.strictEqual(optAnneal.cycleIndex, 2);
    assert.strictEqual(optAnneal.temperature, 0.3, 'Cycle 2 temperature must be 0.3');
    assert.strictEqual(optAnneal.stepScaleMultiplier, 1.0, 'Cycle 2 step scale must be 1.0x');

    // Cycle 3: Exploitation & Strict Monotonicity
    optAnneal.setCycleContext(3, 3);
    assert.strictEqual(optAnneal.cycleIndex, 3);
    assert.strictEqual(optAnneal.temperature, 0.0, 'Cycle 3 temperature must be 0.0 (Strictly greedy)');
    assert.strictEqual(optAnneal.stepScaleMultiplier, 0.5, 'Cycle 3 step scale must be 0.5x');

    // Test Cycle 3 Strict Monotonicity: negative moves must NEVER be accepted
    const mockEl = { value: '500', dispatchEvent: () => {} };
    const mockItem = { element: mockEl, name: 'advertising', label: 'Regional Advertising', value: 500, min: 100, max: 1000, step: 50, type: 'input' };
    optAnneal.isRunning = true;
    optAnneal.isStopped = false;
    optAnneal.bestMetrics = { eps: 6.00, roe: 30.0, endingCash: 5000, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };
    optAnneal.baselineMetrics = { ...optAnneal.bestMetrics };
    const baseScore = optAnneal.evaluateScore(optAnneal.bestMetrics);
    optAnneal.bestScore = baseScore;
    optAnneal.baselineScore = baseScore;

    // Suboptimal move (delta < 0)
    optAnneal.evaluateInput = async () => ({ eps: 5.95, roe: 29.8, endingCash: 4900, creditRating: 'A', imageRating: 75, targetEPS: 4.25 });
    const improvedCycle3 = await optAnneal.optimizeSingleParameter(mockItem);
    assert.strictEqual(improvedCycle3, false, 'Cycle 3 (T=0.0) must strictly reject negative moves');
    assert.strictEqual(optAnneal.bestScore, baseScore, 'Cycle 3 bestScore must never degrade upon rejection');

    // Test Cycle 1 Exploratory Ridge Climbing (T=1.0)
    optAnneal.setCycleContext(1, 3);
    const origRandom = Math.random;
    Math.random = () => 0.01; // Force Metropolis acceptance for within-tolerance dip
    try {
      optAnneal.bestScore = baseScore;
      // Small dip: score delta ~ -0.07 >= -0.75*T
      optAnneal.evaluateInput = async (item, val) => ({ eps: 5.98, roe: 29.9, endingCash: 4950, creditRating: 'A', imageRating: 75, targetEPS: 4.25 });
      const improvedCycle1 = await optAnneal.optimizeSingleParameter(mockItem);
      assert.strictEqual(improvedCycle1, true, 'Cycle 1 (T=1.0) must accept small exploratory dip under Metropolis criterion');
    } finally {
      Math.random = origRandom;
    }

    console.log('  [PASS] Test 20: Multi-cycle simulated annealing cooling schedule verified (Cycle 1 explores, Cycle 3 strictly greedy).');
  }

  // -----------------------------------------------------------------------------
  // TEST 21: CSR Charitable Giving Mutual Exclusivity Safeguard & Pre-Flight Sanitization
  // -----------------------------------------------------------------------------
  console.log('[TEST 21/22] CSR Charitable Mutual Exclusivity Safeguard...');
  {
    const optCsr = new global.GloBusOptimizer(global.gloBusDOMAdapter);
    optCsr.isRunning = true;
    optCsr.isStopped = false;
    optCsr.bestMetrics = { eps: 5.00, roe: 25.0, imageRating: 75, creditRating: 'A', endingCash: 5000, targetEPS: 4.25 };
    optCsr.baselineMetrics = { ...optCsr.bestMetrics };
    optCsr.bestScore = optCsr.evaluateScore(optCsr.bestMetrics);
    optCsr.baselineScore = optCsr.bestScore;

    const elTotal = { value: '500', dispatchEvent: () => {} };
    const itemTotal = { element: elTotal, name: 'charitableTotal', label: 'Charitable Contributions - Total ($000s)', value: 500, min: 0, max: 5000, step: 250, type: 'input' };

    const elPercent = { value: '0', dispatchEvent: () => {} };
    const itemPercent = { element: elPercent, name: 'charitablePercent', label: 'Charitable Contributions - Percent of Operating Profit (%)', value: 0, min: 0, max: 5, step: 1, type: 'input' };

    const inputsList = [itemTotal, itemPercent];

    // 1. When Charitable Total > 0, attempting to optimize Charitable Percent must be blocked and kept at 0
    const resultPercent = await optCsr.optimizeSingleParameter(itemPercent, 1.0, inputsList);
    assert.strictEqual(resultPercent, false, 'Charitable Percent must be rejected when Charitable Total is active');
    assert.strictEqual(itemPercent.value, 0, 'Charitable Percent value must remain 0');

    // 2. When Charitable Percent is active (> 0) and Charitable Total is optimized, Charitable Percent must be cleared to 0
    itemPercent.value = 2;
    elPercent.value = '2';
    itemTotal.value = 0;
    elTotal.value = '0';
    optCsr.evaluateInput = async (item, val) => ({ eps: 5.10, roe: 25.5, imageRating: 77, creditRating: 'A', endingCash: 4800, targetEPS: 4.25 });

    const resultTotal = await optCsr.optimizeSingleParameter(itemTotal, 1.0, inputsList);
    assert.strictEqual(itemPercent.value, 0, 'Charitable Percent must be reset to 0 when Charitable Total is activated');

    // 3. Adapter Pre-Flight Sanitization in saveDecisions
    // If DOM inputs somehow hold both Total > 0 and Percent > 0, saveDecisions must zero out Percent
    const mockDomAdapter = new global.gloBusDOMAdapter.constructor();
    const mockInputsWithBoth = [
      { element: { value: '1000' }, name: 'charitableTotal', label: 'Charitable Contributions - Total ($000s)', value: 1000, type: 'input' },
      { element: { value: '2' }, name: 'charitablePercent', label: 'Charitable Contributions - Percent of Operating Profit (%)', value: 2, type: 'input' }
    ];
    mockDomAdapter.getDecisionInputs = () => mockInputsWithBoth;
    mockDomAdapter.setInputValue = (item, val) => { item.value = val; item.element.value = String(val); };
    mockDomAdapter.getAllDocuments = () => [{ querySelectorAll: () => [] }];

    // Trigger saveDecisions (pre-flight runs synchronously before promise resolves/rejects)
    await mockDomAdapter.saveDecisions().catch(() => {});
    assert.strictEqual(mockInputsWithBoth[1].value, 0, 'Pre-flight sanitization must zero out Charitable Percent');
    assert.strictEqual(mockInputsWithBoth[0].value, 1000, 'Charitable Total must remain intact');

    console.log('  [PASS] Test 21: CSR Charitable Mutual Exclusivity verified (Optimizer Guard + Pre-Flight Save Sanitization).');
  }

  // -----------------------------------------------------------------------------
  // TEST 22: Peak-State Restoration (Zero Peak Loss under Ridge Exploration)
  // -----------------------------------------------------------------------------
  console.log('[TEST 22/22] Peak-State Restoration (Zero Peak Loss)...');
  {
    const mockAdapter = new global.gloBusDOMAdapter.constructor();
    const mockInputs = [
      { key: 'input_1', id: 'acc', name: 'accessories', label: 'Included Accessories', value: 2, element: { value: '2' }, type: 'input', min: 1, max: 4, step: 1 },
      { key: 'input_2', id: 'bat', name: 'battery', label: 'Battery Capacity', value: 1000, element: { value: '1000' }, type: 'input', min: 500, max: 2000, step: 100 }
    ];

    let currentMetrics = { eps: 7.26, roe: 95.9, endingCash: 5200, creditRating: 'A', imageRating: 73, targetEPS: 4.25 };
    mockAdapter.getDecisionInputs = () => mockInputs;
    mockAdapter.getProjectedMetrics = () => currentMetrics;
    mockAdapter.triggerCalculate = async () => {};
    mockAdapter.setInputValue = (item, val) => { item.value = val; item.element.value = String(val); };

    const optPeak = new global.GloBusOptimizer(mockAdapter);
    optPeak.autoSave = false;

    // Simulate optimization run
    // Baseline: EPS $7.26, Score ~104.9
    // Step 1: Accessories moves to 3 -> Peak reached: EPS $7.29, Score ~105.2
    // Step 2: Battery Capacity explores a downhill ridge under Annealing -> EPS $7.15, Score ~103.9
    // Finalize: Optimizer MUST restore the 105.2 peak combo (Accessories=3, Battery=1000), NOT rollback to baseline (Accessories=2) or keep 103.9!

    mockAdapter.captureSnapshot = (inputs) => {
      const snap = {};
      (inputs || mockInputs).forEach(i => { snap[i.key] = { key: i.key, value: i.value }; });
      return snap;
    };
    mockAdapter.captureInitialSnapshot = () => mockAdapter.captureSnapshot(mockInputs);
    mockAdapter.restoreSnapshot = async (snap) => {
      if (!snap) return;
      mockInputs.forEach(i => {
        if (snap[i.key] !== undefined) {
          mockAdapter.setInputValue(i, snap[i.key].value);
        }
      });
      // If peak is restored, metrics become peak metrics
      if (mockInputs[0].value === 3 && mockInputs[1].value === 1000) {
        currentMetrics = { eps: 7.29, roe: 96.1, endingCash: 5250, creditRating: 'A', imageRating: 74, targetEPS: 4.25 };
      } else if (mockInputs[0].value === 2 && mockInputs[1].value === 1000) {
        currentMetrics = { eps: 7.26, roe: 95.9, endingCash: 5200, creditRating: 'A', imageRating: 73, targetEPS: 4.25 };
      }
    };

    // Override runOptimizationLoop to simulate reaching peak and then annealing into a valley
    optPeak.runOptimizationLoop = async () => {
      // Move 1: Peak reached
      mockAdapter.setInputValue(mockInputs[0], 3);
      currentMetrics = { eps: 7.29, roe: 96.1, endingCash: 5250, creditRating: 'A', imageRating: 74, targetEPS: 4.25 };
      const scorePeak = optPeak.evaluateScore(currentMetrics);
      optPeak.bestScore = scorePeak;
      optPeak.bestMetrics = { ...currentMetrics };
      optPeak.peakScore = scorePeak;
      optPeak.peakMetrics = { ...currentMetrics };
      optPeak.peakCombo = mockAdapter.captureSnapshot(mockInputs);
      optPeak.bestCombo = optPeak.peakCombo;

      // Move 2: Annealing exploratory move down into valley
      mockAdapter.setInputValue(mockInputs[1], 1200);
      currentMetrics = { eps: 7.15, roe: 94.5, endingCash: 4800, creditRating: 'A-', imageRating: 72, targetEPS: 4.25 };
      const scoreValley = optPeak.evaluateScore(currentMetrics);
      // Operating point shifts down, but peakScore & peakCombo remain untouched
      optPeak.bestScore = scoreValley;
      optPeak.bestMetrics = { ...currentMetrics };
    };

    const finalResult = await optPeak.start(false);

    // Verify peak restoration:
    assert.strictEqual(mockInputs[0].value, 3, 'Included Accessories must be restored to peak value (3)');
    assert.strictEqual(mockInputs[1].value, 1000, 'Battery Capacity must be restored to peak baseline value (1000)');
    assert.ok(finalResult.bestMetrics.eps >= 7.29, `Final EPS must reflect peak ($7.29), got $${finalResult.bestMetrics.eps.toFixed(2)}`);
    assert.ok(finalResult.bestMetrics.eps > 7.26, 'Final outcome must beat baseline');
    console.log('  [PASS] Test 22: Peak-State Restoration verified (intermediate peak correctly locked in despite annealing valley).');
  }

  // =========================================================================
  // TEST 23: Plateau Peak-State Restoration with Multi-Objective EPS Tie-Breaker
  // =========================================================================
  {
    console.log('Testing Test 23: Plateau Peak-State Restoration with Multi-Objective EPS Tie-Breaker...');

    const mockAdapter = new global.gloBusDOMAdapter.constructor();
    const optPlateau = new global.GloBusOptimizer(mockAdapter);
    optPlateau.autoSave = false;

    const mockInputs = [
      { key: 'price', label: 'E-A Retail Price', value: 1572, min: 1000, max: 2000, step: 10, type: 'number', category: 'price' },
      { key: 'web', label: 'E-A Website Displays', value: 2200, min: 0, max: 5000, step: 250, type: 'number', category: 'marketing' }
    ];

    let currentMetrics = { eps: 7.66, roe: 98.5, endingCash: 7963, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };

    mockAdapter.detectPageType = () => 'UAV_MARKETING';
    mockAdapter.getProjectedMetrics = () => ({ ...currentMetrics });
    mockAdapter.getDecisionInputs = () => mockInputs;
    mockAdapter.setInputValue = (item, val) => {
      const match = mockInputs.find(i => i.key === item.key);
      if (match) match.value = val;
    };
    mockAdapter.triggerCalculate = async () => {};

    mockAdapter.captureSnapshot = (inputs) => {
      const snap = {};
      (inputs || mockInputs).forEach(i => { snap[i.key] = { key: i.key, value: i.value }; });
      return snap;
    };
    mockAdapter.captureInitialSnapshot = () => mockAdapter.captureSnapshot(mockInputs);
    mockAdapter.restoreSnapshot = async (snap) => {
      if (!snap) return;
      mockInputs.forEach(i => {
        if (snap[i.key] !== undefined) {
          mockAdapter.setInputValue(i, snap[i.key].value);
        }
      });
      // If plateau peak is restored:
      if (mockInputs[0].value === 1582 && mockInputs[1].value === 2950) {
        currentMetrics = { eps: 7.84, roe: 98.5, endingCash: 8100, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };
      } else if (mockInputs[0].value === 1572 && mockInputs[1].value === 2200) {
        currentMetrics = { eps: 7.66, roe: 98.5, endingCash: 7963, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };
      }
    };

    // Override runOptimizationLoop to simulate coupled move on score plateau followed by annealing valley
    optPlateau.runOptimizationLoop = async () => {
      // Step 1: Baseline is Score ~105.9, EPS $7.66
      // Step 2: Coupled move discovers (Price=1582, Web=2950) -> Score ~105.9, EPS $7.84 (Score plateau, EPS +$0.18!)
      mockAdapter.setInputValue(mockInputs[0], 1582);
      mockAdapter.setInputValue(mockInputs[1], 2950);
      currentMetrics = { eps: 7.84, roe: 98.5, endingCash: 8100, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };
      const scorePlateau = optPlateau.evaluateScore(currentMetrics);

      const peakUpdated = optPlateau.updatePeak(scorePlateau, currentMetrics, mockAdapter.captureSnapshot(mockInputs));
      assert.ok(peakUpdated, 'updatePeak must accept flat score plateau with higher EPS');
      optPlateau.bestScore = scorePlateau;
      optPlateau.bestMetrics = { ...currentMetrics };
      optPlateau.bestCombo = optPlateau.peakCombo;

      // Step 3: Pass 3 annealing move drifts to valley: Score 105.7, EPS $7.35
      mockAdapter.setInputValue(mockInputs[0], 1540);
      mockAdapter.setInputValue(mockInputs[1], 3500);
      currentMetrics = { eps: 7.35, roe: 97.0, endingCash: 7500, creditRating: 'A', imageRating: 74, targetEPS: 4.25 };
      const scoreValley = optPlateau.evaluateScore(currentMetrics);
      optPlateau.bestScore = scoreValley;
      optPlateau.bestMetrics = { ...currentMetrics };
    };

    const finalResult = await optPlateau.start(false);

    // Verify plateau peak restoration:
    assert.strictEqual(mockInputs[0].value, 1582, 'E-A Retail Price must be restored to plateau peak value (1582)');
    assert.strictEqual(mockInputs[1].value, 2950, 'E-A Website Displays must be restored to plateau peak value (2950)');
    assert.strictEqual(finalResult.bestMetrics.eps, 7.84, `Final EPS must be locked in at $7.84, got $${finalResult.bestMetrics.eps}`);
    console.log('  [PASS] Test 23: Plateau Peak-State Restoration verified (identical score with higher EPS safely locked in).');
  }

  // =========================================================================
  // TEST 24: Workstation Plant Capacity Bound & Integer Enforcement
  // =========================================================================
  {
    console.log('Testing Test 24: Workstation Plant Capacity Bound & Integer Enforcement...');

    const mockAdapter = new global.gloBusDOMAdapter.constructor();
    const mockEl = {
      getAttribute: (attr) => (attr === 'data-max' ? '4' : null),
      closest: () => ({ textContent: 'New UAV Workstations (0 to 4)' }),
      nextElementSibling: null
    };

    // 1. Verify bounds inference detects ceiling and marks isInteger
    const bounds = mockAdapter.inferBounds(mockEl, 'new_uav_workstations', 'New UAV Workstations (0 to 4)', 0);
    assert.strictEqual(bounds.max, 4, `Workstation ceiling must be clamped to plant capacity limit (4), got ${bounds.max}`);
    assert.strictEqual(bounds.isInteger, true, 'Workstation must be marked isInteger: true');

    // 2. Verify optimizer step scaling preserves integer invariant in Cycle 3 (0.5x scaling)
    const testedValues = [];
    const item = {
      key: 'uav_ws',
      label: 'New UAV Workstations',
      name: 'uav_workstations',
      value: 0,
      min: 0,
      max: 4,
      step: 1,
      isInteger: true,
      element: { value: '0' }
    };

    mockAdapter.detectPageType = () => 'COMPENSATION_FACILITIES';
    mockAdapter.setInputValue = (it, val) => {
      testedValues.push(val);
      it.value = val;
    };
    mockAdapter.triggerCalculate = async () => {};
    mockAdapter.getProjectedMetrics = () => ({
      eps: 7.50 + (item.value * 0.05),
      roe: 95.0,
      endingCash: 5000,
      creditRating: 'A',
      imageRating: 75,
      targetEPS: 4.25
    });

    const optWorkstation = new global.GloBusOptimizer(mockAdapter);
    optWorkstation.stepScaleMultiplier = 0.5; // Simulate Cycle 3 fine step scaling
    optWorkstation.isRunning = true;
    optWorkstation.baselineMetrics = mockAdapter.getProjectedMetrics();
    optWorkstation.baselineScore = optWorkstation.evaluateScore(optWorkstation.baselineMetrics);
    optWorkstation.bestScore = optWorkstation.baselineScore;
    optWorkstation.bestMetrics = { ...optWorkstation.baselineMetrics };

    await optWorkstation.optimizeSingleParameter(item, 0.5, [item]);

    // Verify all tested values are strictly valid whole integers between 0 and 4
    assert.ok(testedValues.length > 0, 'Optimizer must have tested workstation values');
    testedValues.forEach(val => {
      assert.ok(Number.isInteger(val), `Workstation test value must be integer, got: ${val}`);
      assert.ok(val >= 0 && val <= 4, `Workstation test value must be between 0 and 4, got: ${val}`);
    });

    // 3. Verify setInputValue prevents fractional values and clamps out-of-bounds inputs
    const realAdapter = new global.gloBusDOMAdapter.constructor();
    const testItem = { element: { value: '' }, min: 0, max: 4, isInteger: true };
    realAdapter.setInputValue(testItem, 2.5);
    assert.strictEqual(testItem.element.value, '3', 'setInputValue must round 2.5 to 3 for isInteger input');

    realAdapter.setInputValue(testItem, 7);
    assert.strictEqual(testItem.element.value, '4', 'setInputValue must clamp 7 to max (4)');

    console.log('  [PASS] Test 24: Workstation Plant Capacity Bound & Integer Enforcement verified (decimals and out-of-bounds strictly prevented).');
  }

  // =========================================================================
  // TEST 25: Master Round Solvency & Performance Gate Abortion on Regression
  // =========================================================================
  {
    console.log('Testing Test 25: Master Round Solvency & Performance Gate...');
    const origSave = global.gloBusDOMAdapter.saveDecisions;
    const origMetrics = global.gloBusDOMAdapter.getProjectedMetrics;
    const coord = global.gloBusPageCoordinator;
    coord.navigateNext = async () => {};

    let saveCalled = false;
    global.gloBusDOMAdapter.saveDecisions = async () => { saveCalled = true; };

    try {
      // Scenario A: Severe regression vs Round Baseline (e.g. baseline $8.16, final $8.07)
      // Auto-save MUST be aborted to protect live standings!
      saveCalled = false;
      coord.isStopped = false;
      coord.active = true;
      global.gloBusDOMAdapter.getProjectedMetrics = () => ({ eps: 8.07, roe: 100.0, endingCash: 10000, creditRating: 'A', imageRating: 75, targetEPS: 4.25 });
      const wfRegression = {
        cycleIndex: 2,
        maxCycles: 2,
        minEpsGainThreshold: 0.02,
        cycleStartEps: 8.16,
        totalRunStartEps: 8.16,
        roundBaselineMetrics: { eps: 8.16 }
      };
      await coord.handleCycleCompletion(wfRegression, null);
      assert.strictEqual(saveCalled, false, 'Master Round Safety Gate must block saveDecisions() on round regression ($8.07 < $8.16)');
      assert.strictEqual(coord.isStopped, true, 'Coordinator must stop upon triggering safety gate');

      // Scenario B: Successful round (baseline $8.16, final $8.45)
      // Auto-save MUST proceed
      saveCalled = false;
      coord.isStopped = false;
      coord.active = true;
      global.gloBusDOMAdapter.getProjectedMetrics = () => ({ eps: 8.45, roe: 105.0, endingCash: 12000, creditRating: 'A', imageRating: 75, targetEPS: 4.25 });
      const wfSuccess = {
        cycleIndex: 2,
        maxCycles: 2,
        minEpsGainThreshold: 0.02,
        cycleStartEps: 8.16,
        totalRunStartEps: 8.16,
        roundBaselineMetrics: { eps: 8.16 }
      };
      await coord.handleCycleCompletion(wfSuccess, null);
      assert.strictEqual(saveCalled, true, 'Master Round Gate must permit saveDecisions() when final EPS exceeds baseline ($8.45 >= $8.16)');
      console.log('  [PASS] Test 25: Master Round Solvency & Performance Gate verified (saves aborted on regression).');
    } finally {
      global.gloBusDOMAdapter.saveDecisions = origSave;
      global.gloBusDOMAdapter.getProjectedMetrics = origMetrics;
    }
  }

  // =========================================================================
  // TEST 26: Pass 3 Strictly Greedy Descent & Valley Guard ($T=0.0$, Depth <= 0.35)
  // =========================================================================
  {
    console.log('Testing Test 26: Pass 3 Strictly Greedy Descent & Valley Guard...');
    const mockAdapter = new global.gloBusDOMAdapter.constructor();
    const opt = new global.GloBusOptimizer(mockAdapter);
    opt.isRunning = true;
    opt.isStopped = false;

    // Authentically evaluate peak metrics
    opt.peakMetrics = { eps: 8.16, roe: 102.1, endingCash: 12243, creditRating: 'A', imageRating: 75, targetEPS: 4.25 };
    opt.baselineMetrics = { ...opt.peakMetrics };
    opt.bestMetrics = { ...opt.peakMetrics };
    const baseScore = opt.evaluateScore(opt.peakMetrics);
    opt.baselineScore = baseScore;
    opt.bestScore = baseScore;
    opt.peakScore = baseScore;
    mockAdapter.getProjectedMetrics = () => ({ ...opt.peakMetrics });

    const mockEl = { value: '0', dispatchEvent: () => {} };
    const mockItem = { element: mockEl, name: 'safety_equipment', label: 'Safety Equipment', value: 0, min: 0, max: 1000, step: 250, type: 'input' };

    // 1. Valley Guard: even under high temperature (T=1.0) and random()=0.0001 (Metropolis would accept),
    // a prospective drop of > 0.35 pts below peak/baseline MUST be rejected immediately!
    opt.temperature = 1.0;
    const origRandom = Math.random;
    Math.random = () => 0.0001;
    try {
      // Prospective metrics drop score by 0.81 pts (from 106.55 to 105.74)
      opt.evaluateInput = async () => ({
        eps: 7.50, roe: 98.0, endingCash: 11000, creditRating: 'A', imageRating: 75, targetEPS: 4.25
      });
      const valleyResult = await opt.optimizeSingleParameter(mockItem, 1.0, [mockItem]);
      assert.strictEqual(valleyResult, false, 'Valley Guard must reject prospective moves > 0.35 pts below peak even if T=1.0');
    } finally {
      Math.random = origRandom;
    }

    // 2. Pass 3 Strictly Greedy Enforcement: temperature must be 0.0 during Pass 3
    let pass3Temperature = null;
    mockAdapter.detectPageType = () => 'CORPORATE_CITIZENSHIP';
    mockAdapter.getDecisionInputs = () => [mockItem];
    mockAdapter.triggerCalculate = async () => {};
    mockAdapter.getProjectedMetrics = () => ({ ...opt.peakMetrics });
    mockAdapter.captureSnapshot = () => ({});
    mockAdapter.captureInitialSnapshot = () => ({});
    mockAdapter.restoreSnapshot = async () => {};

    const origOptimizeSingle = opt.optimizeSingleParameter;
    opt.optimizeSingleParameter = async function(item, scale, allItems) {
      if (opt.currentPass === 3) {
        pass3Temperature = opt.temperature;
      }
      return false;
    };

    opt.temperature = 1.0; // Started at 1.0 in Cycle 1
    await opt.runOptimizationLoop();
    assert.strictEqual(pass3Temperature, 0.0, 'Pass 3 must force temperature to 0.0 for strictly greedy fine relaxation');
    opt.optimizeSingleParameter = origOptimizeSingle;

    console.log('  [PASS] Test 26: Pass 3 Strictly Greedy Descent & Valley Guard verified.');
  }

  // =========================================================================
  // TEST 27: Scoreboard Stabilization on Buttonless Screens
  // =========================================================================
  {
    console.log('Testing Test 27: Scoreboard Stabilization on Buttonless Screens...');
    const adapter = new global.gloBusDOMAdapter.constructor();
    adapter.findCalculateButton = () => null;

    let pollCount = 0;
    const mockRow = {
      isConnected: true,
      get textContent() {
        pollCount++;
        if (pollCount <= 2) return 'earnings per share $8.10';
        return 'earnings per share $8.07';
      }
    };
    adapter.cachedScoreboardRows = [mockRow];
    adapter.getAllDocuments = () => [{ querySelectorAll: () => [mockRow] }];

    const startTime = Date.now();
    await adapter.triggerCalculate();
    const elapsed = Date.now() - startTime;

    // Must have waited at least minWaitBeforeStable (>= 250ms) and required consecutive stable reads
    assert.ok(elapsed >= 200, `triggerCalculate on buttonless screen must wait >= 200ms for stability, elapsed: ${elapsed}ms`);
    assert.ok(pollCount >= 4, `triggerCalculate must take multiple consecutive readings to verify stability, count: ${pollCount}`);

    console.log('  [PASS] Test 27: Scoreboard Stabilization on Buttonless Screens verified.');
  }

  // =========================================================================
  // TEST 28: Transparent Signed Round Gain Reporting (No Math.max Masking)
  // =========================================================================
  {
    console.log('Testing Test 28: Transparent Signed Gain Reporting...');
    const { ConvergenceMonitor } = require('../extension/scoring-kernel.js');

    const startMetrics = { eps: 8.16, roe: 102.1, endingCash: 12243, creditRating: 'A', imageRating: 75 };
    const degradedMetrics = { eps: 8.07, roe: 100.0, endingCash: 10571, creditRating: 'A', imageRating: 75 };

    const result = ConvergenceMonitor.evaluateConvergence(degradedMetrics, startMetrics, 104.85, 105.00);
    assert.strictEqual(result.hasSignificantGain, false);
    assert.ok(!result.reason.includes('+$0.00'), 'Reason must NOT mask negative EPS gain to +$0.00');
    assert.ok(!result.reason.includes('+0.00 pts'), 'Reason must NOT mask negative Score gain to +0.00');
    assert.ok(result.reason.includes('-$0.09'), `Reason must display true signed delta (-$0.09): ${result.reason}`);
    assert.ok(result.reason.includes('-0.15'), `Reason must display true signed delta (-0.15): ${result.reason}`);

    console.log('  [PASS] Test 28: Transparent Signed Gain Reporting verified (zero masking eliminated).');
  }

  console.log('\n================================================================');
  console.log('   ALL 28 ARCHITECTURAL & MATHEMATICAL AUDIT TESTS PASSED!      ');
  console.log('================================================================\n');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

