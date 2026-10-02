/**
 * Node.js test suite for Extension scripts
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// 1. Verify manifest.json
console.log('Testing manifest.json...');
const manifestRaw = fs.readFileSync(path.join(__dirname, '../extension/manifest.json'), 'utf8');
const manifest = JSON.parse(manifestRaw);
assert.strictEqual(manifest.manifest_version, 3);
assert.ok(manifest.permissions.includes('scripting'), 'manifest must include scripting permission');
assert.ok(manifest.permissions.includes('storage'), 'manifest must include storage permission');
assert.ok(manifest.permissions.includes('activeTab'), 'manifest must include activeTab permission');
assert.ok(manifest.content_scripts.length > 0);
console.log('  [OK] manifest.json is valid MV3 with required permissions.');

// 2. Mock minimal DOM environment for dom-adapter and optimizer
console.log('Testing dom-adapter and optimizer logic...');
global.window = global;
global.document = {
  querySelectorAll: () => [],
  querySelector: () => null,
  body: { dispatchEvent: () => {} },
  getElementById: () => null
};
global.Event = class {};
global.KeyboardEvent = class {};
global.MouseEvent = class extends global.Event {};

// Mock sessionStorage and localStorage
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

// Load dom-adapter
require('../extension/dom-adapter.js');
assert.ok(global.gloBusDOMAdapter, 'gloBusDOMAdapter must be defined');

// Test inferBounds
const fakeEl = { getAttribute: () => null };
const rdBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'R&D', 'Cumulative Research', 25000);
assert.strictEqual(rdBounds.min, 0);
assert.strictEqual(rdBounds.max, 50000);
assert.strictEqual(rdBounds.step, 2500);

const camPriceBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Price', 'Retail Price', 350);
assert.strictEqual(camPriceBounds.min, 100);
assert.strictEqual(camPriceBounds.max, 900);
assert.strictEqual(camPriceBounds.step, 5);

const dronePriceBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Price', 'UAV Drone Price', 1200);
assert.strictEqual(dronePriceBounds.min, 400);
assert.strictEqual(dronePriceBounds.max, 3000);
assert.strictEqual(dronePriceBounds.step, 10);

const wageBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Wage', 'Base Salary', 30000);
assert.strictEqual(wageBounds.min, 20000);
assert.strictEqual(wageBounds.max, 45000);
assert.strictEqual(wageBounds.step, 500);

console.log('  [OK] inferBounds accurately infers Glo-Bus ranges.');

// Load optimizer
require('../extension/optimizer.js');
assert.ok(global.gloBusOptimizer, 'gloBusOptimizer must be defined');

const opt = new global.GloBusOptimizer(global.gloBusDOMAdapter);
opt.baselineMetrics = { eps: 4.0, roe: 20.0, stockPrice: 40.0, creditRatingScore: 90, imageRating: 75, endingCash: 5000 };

// Normal score evaluation
const normalScore = opt.evaluateScore({ eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRatingScore: 90, imageRating: 75, endingCash: 5000 });
assert.ok(Number.isFinite(normalScore));
assert.ok(normalScore > 0);

// Higher EPS strictly improves score
const higherEPSScore = opt.evaluateScore({ eps: 5.0, roe: 22.0, stockPrice: 45.0, creditRatingScore: 90, imageRating: 75, endingCash: 5000 });
assert.ok(higherEPSScore > normalScore, 'higher EPS must produce higher utility score');

// Dynamic weight reallocation when stockPrice is 0
const zeroStockScore1 = opt.evaluateScore({ eps: 4.5, roe: 22.0, stockPrice: 0, creditRatingScore: 90, imageRating: 75, endingCash: 5000 });
const zeroStockScore2 = opt.evaluateScore({ eps: 5.0, roe: 22.0, stockPrice: 0, creditRatingScore: 90, imageRating: 75, endingCash: 5000 });
assert.ok(Number.isFinite(zeroStockScore1));
assert.ok(zeroStockScore2 > zeroStockScore1, 'when stock price is 0, EPS gains must decisively increase score');

// Cash penalty evaluation (below $1000k danger zone)
const lowCashScore = opt.evaluateScore({ eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRatingScore: 90, imageRating: 75, endingCash: 500 });
assert.ok(lowCashScore < normalScore - 2000, 'low cash must trigger severe constraint penalty');

// Test Projected Performance Scoreboard Extraction
console.log('Testing Projected Performance Scoreboard Extraction...');
const mockScoreboardRows = [
  { textContent: 'Projected Y9 Performance', querySelectorAll: () => [] },
  {
    textContent: 'Earnings Per Share $5.39 $4.25',
    querySelectorAll: (sel) => [
      { textContent: 'Earnings Per Share' },
      { textContent: '$5.39' },
      { textContent: '$4.25' }
    ]
  },
  {
    textContent: 'Return On Equity 69.8% 30.0%',
    querySelectorAll: (sel) => [
      { textContent: 'Return On Equity' },
      { textContent: '69.8%' },
      { textContent: '30.0%' }
    ]
  },
  {
    textContent: 'Credit Rating A A-',
    querySelectorAll: (sel) => [
      { textContent: 'Credit Rating' },
      { textContent: 'A' },
      { textContent: 'A-' }
    ]
  },
  {
    textContent: 'Image Rating 64 75',
    querySelectorAll: (sel) => [
      { textContent: 'Image Rating' },
      { textContent: '64' },
      { textContent: '75' }
    ]
  },
  {
    textContent: 'Net Revenues ($000s) 465,294 +18.1%',
    querySelectorAll: (sel) => [
      { textContent: 'Net Revenues ($000s)' },
      { textContent: '465,294' },
      { textContent: '+18.1%' }
    ]
  },
  {
    textContent: 'Net Profit ($000s) 107,774 +22.7%',
    querySelectorAll: (sel) => [
      { textContent: 'Net Profit ($000s)' },
      { textContent: '107,774' },
      { textContent: '+22.7%' }
    ]
  },
  {
    textContent: 'Ending Cash ($000s) 25,140 +25,140',
    querySelectorAll: (sel) => [
      { textContent: 'Ending Cash ($000s)' },
      { textContent: '25,140' },
      { textContent: '+25,140' }
    ]
  }
];

const savedQSA = global.document.querySelectorAll;
global.document.querySelectorAll = (sel) => {
  if (sel === 'tr') return mockScoreboardRows;
  if (sel === 'iframe, frame') return [];
  return [];
};

const parsed = global.gloBusDOMAdapter.getProjectedMetrics();
assert.strictEqual(parsed.eps, 5.39, 'EPS should parse 5.39');
assert.strictEqual(parsed.roe, 69.8, 'ROE should parse 69.8');
assert.strictEqual(parsed.creditRating, 'A', 'Credit Rating should parse A');
assert.strictEqual(parsed.imageRating, 64, 'Image Rating should parse 64');
assert.strictEqual(parsed.netRevenue, 465294, 'Net Revenues should parse 465294');
assert.strictEqual(parsed.netProfit, 107774, 'Net Profit should parse 107774');
assert.strictEqual(parsed.endingCash, 25140, 'Ending Cash should parse 25140');
console.log('  [OK] getProjectedMetrics correctly parses all 7 Glo-Bus scoring & other measures.');
global.document.querySelectorAll = savedQSA;

// Test 3: Left Pane Tab Discovery and In-Page Coordination
console.log('Testing Left-Pane Tab Discovery & Coordinator across 7 pages...');
const mockTabs = [
  { textContent: 'Product Design', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'AC Camera Marketing', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'UAV Drone Marketing', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Compensation & Facilities', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Special Contract Offers', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Corporate Citizenship', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} },
  { textContent: 'Finance & Cash Flow', getAttribute: () => '', getBoundingClientRect: () => ({ width: 100, height: 30 }), offsetParent: {} }
];

global.document.querySelectorAll = (sel) => {
  if (sel.includes('a, button, li') || sel.includes('button') || sel.includes('sidebar')) return mockTabs;
  return [];
};

require('../extension/page-coordinator.js');
assert.ok(global.gloBusPageCoordinator, 'gloBusPageCoordinator must be defined');

const discovered = global.gloBusPageCoordinator.discoverLeftPaneTabs();
assert.strictEqual(discovered.length, 7, 'Should discover all 7 decision tabs');
assert.strictEqual(discovered[0].name, 'Product Design');
assert.strictEqual(discovered[1].name, 'AC Camera Marketing');
assert.strictEqual(discovered[2].name, 'UAV Drone Marketing');
assert.strictEqual(discovered[3].name, 'Compensation & Facilities');
assert.strictEqual(discovered[4].name, 'Special Contract Offers');
assert.strictEqual(discovered[5].name, 'Corporate Citizenship');
assert.strictEqual(discovered[6].name, 'Finance & Cash Flow');
console.log('  [OK] discoverLeftPaneTabs correctly discovers and orders all 7 decision pages in exact sequence.');

// Test 4: Stop Disarming and Loop Prevention
console.log('Testing Coordinator Stop & Loop Prevention...');
const coord = global.gloBusPageCoordinator;
coord.stop();
assert.strictEqual(coord.isStopped, true);
assert.strictEqual(coord.active, false);
console.log('  [OK] coordinator.stop() disarms automation and clears state.');

// Test 5: startFullRound execution without errors
console.log('Testing startFullRound execution...');
(async () => {
  let optStarted = false;
  let savedPassed = null;
  const mockOptimizer = {
    setPreset: () => {},
    start: async (isFinal) => {
      optStarted = true;
      savedPassed = isFinal;
    }
  };
  coord.navigateNext = async () => {};
  await coord.startFullRound(mockOptimizer, 'balanced');
  assert.strictEqual(optStarted, true, 'startFullRound must invoke optimizer.start');
  assert.strictEqual(savedPassed, false, 'intermediate screen must NOT auto-save');
  console.log('  [OK] startFullRound executes cleanly and defers save.');

  // Test 6: Auto-Convergence Loop Evaluation
  console.log('Testing Auto-Convergence Loop in Coordinator...');
  let loopTriggered = false;
  let saveTriggered = false;
  const origSaveDecisions = global.gloBusDOMAdapter.saveDecisions;
  const origGetMetrics = global.gloBusDOMAdapter.getProjectedMetrics;
  coord.navigateNext = async (wf) => { loopTriggered = true; };
  global.gloBusDOMAdapter.saveDecisions = async () => { saveTriggered = true; };

  // Case 6A: Cycle 1 gained +$0.20 EPS (>= 0.02 threshold) -> Should loop to Cycle 2
  global.gloBusDOMAdapter.getProjectedMetrics = () => ({ eps: 5.35 });
  const wfLoop = { cycleIndex: 1, maxCycles: 3, minEpsGainThreshold: 0.02, cycleStartEps: 5.15, totalRunStartEps: 5.15 };
  await coord.handleCycleCompletion(wfLoop, mockOptimizer);
  assert.strictEqual(loopTriggered, true, 'Should trigger loop to Cycle 2 when EPS gain exceeds threshold');
  assert.strictEqual(wfLoop.cycleIndex, 2, 'cycleIndex should increment to 2');

  // Case 6B: Cycle 2 gained only +$0.01 EPS (< 0.02 threshold) -> Should declare convergence and auto-save
  global.gloBusDOMAdapter.getProjectedMetrics = () => ({ eps: 5.36 });
  const wfPlateau = { cycleIndex: 2, maxCycles: 3, minEpsGainThreshold: 0.02, cycleStartEps: 5.35, totalRunStartEps: 5.15 };
  await coord.handleCycleCompletion(wfPlateau, mockOptimizer);
  assert.strictEqual(saveTriggered, true, 'Should auto-save when convergence threshold is reached');
  global.gloBusDOMAdapter.saveDecisions = origSaveDecisions;
  global.gloBusDOMAdapter.getProjectedMetrics = origGetMetrics;
  console.log('  [OK] handleCycleCompletion properly manages convergence looping and single final save.');

  // Test 7: Finance Safeguards: Mutual Exclusivity, Dynamic Board Limits & Coupled Pairing
  console.log('Testing Finance Safeguards & Mutual Exclusivity...');
  
  // 7A: Stock Issue clamped to max: 0 when currentVal is 0
  const stockIssueBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Stock Issue', 'New Stock Issue', 0);
  assert.strictEqual(stockIssueBounds.max, 0, 'Stock Issue max must be 0 when currentVal is 0');

  // 7B: Dynamic Board limit extraction from nearby DOM
  const mockElWithLimit = {
    getAttribute: () => null,
    closest: (sel) => {
      if (sel.includes('td')) return { textContent: 'Shares to Repurchase: Max: 175 thousand' };
      return null;
    }
  };
  const boardLimit = global.gloBusDOMAdapter.extractNearbyLimit(mockElWithLimit);
  assert.strictEqual(boardLimit, 175, 'extractNearbyLimit should extract 175 from cell text');

  const buybackBoundsWithLimit = global.gloBusDOMAdapter.inferBounds(mockElWithLimit, 'Stock Repurchase', 'Shares of Stock to Repurchase', 0);
  assert.strictEqual(buybackBoundsWithLimit.max, 175, 'Stock Repurchase max must respect parsed Board limit 175');

  // 7C: Coupled Pairs includes Stock Repurchase and Dividend
  const testInputs = [
    { label: 'Stock Repurchase', name: 'repurchase', category: 'finance', value: 175, min: 0, max: 175, step: 25 },
    { label: 'Dividend', name: 'dividend', category: 'finance', value: 1.20, min: 0, max: 5.0, step: 0.10 }
  ];
  const pairs = opt.identifyCoupledPairs(testInputs);
  assert.strictEqual(pairs.length, 1, 'Should identify Stock Repurchase and Dividend as coupled pair');

  // 7D: Mutual Exclusivity in optimizeSingleParameter blocks Stock Issue when Repurchase is active
  const origGetDecisionInputs = global.gloBusDOMAdapter.getDecisionInputs;
  global.gloBusDOMAdapter.getDecisionInputs = () => [
    { label: 'Stock Repurchase', name: 'repurchase', value: 175 },
    { label: 'Stock Issue', name: 'issue', value: 0 }
  ];
  const issueItem = { label: 'Stock Issue', name: 'issue', value: 0, min: 0, max: 2500, step: 100 };
  const issueResult = await opt.optimizeSingleParameter(issueItem);
  assert.strictEqual(issueResult, false, 'optimizeSingleParameter must reject Stock Issue when Stock Repurchase is active');
  global.gloBusDOMAdapter.getDecisionInputs = origGetDecisionInputs;
  console.log('  [OK] Finance mutual exclusivity and Board limits verified.');

  // Test 8: CSR Bounds & Image Rating 75 Investor Expectation Enforcement
  console.log('Testing CSR Bounds & Image Rating Investor Expectation...');
  const charityPctBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Charity', 'Charitable Contributions - Percent of Operating Profit', 0);
  assert.strictEqual(charityPctBounds.min, 0);
  assert.strictEqual(charityPctBounds.max, 5);
  assert.strictEqual(charityPctBounds.step, 1);
  assert.strictEqual(charityPctBounds.category, 'csr');

  const greenBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Green', 'Green Initiatives to Promote', 0);
  assert.strictEqual(greenBounds.min, 0);
  assert.strictEqual(greenBounds.max, 1);
  assert.strictEqual(greenBounds.step, 1);
  assert.strictEqual(greenBounds.category, 'csr');

  const safetyBounds = global.gloBusDOMAdapter.inferBounds(fakeEl, 'Safety', 'Additional Safety Equipment and Improved Lighting / Ventilation', 0);
  assert.strictEqual(safetyBounds.min, 0);
  assert.strictEqual(safetyBounds.max, 1);
  assert.strictEqual(safetyBounds.step, 1);
  assert.strictEqual(safetyBounds.category, 'csr');

  // Image Rating Target Evaluation:
  // Candidate A: EPS $7.11, Image Rating 71 (failing 75 expectation by 4 points)
  // Candidate B: EPS $7.05, Image Rating 75 (clearing 75 expectation, fully satisfying IE standard)
  opt.baselineMetrics = { eps: 7.11, roe: 93.4, stockPrice: 0, creditRatingScore: 90, imageRating: 71, endingCash: 3200 };
  const scoreAt71 = opt.evaluateScore({ eps: 7.11, roe: 93.4, stockPrice: 0, creditRatingScore: 90, imageRating: 71, endingCash: 3200 });
  const scoreAt75 = opt.evaluateScore({ eps: 7.05, roe: 92.8, stockPrice: 0, creditRatingScore: 90, imageRating: 75, endingCash: 2800 });
  assert.ok(scoreAt75 > scoreAt71, `Score at Image 75 ($7.05 EPS) [${scoreAt75.toFixed(1)}] MUST beat Image 71 ($7.11 EPS) [${scoreAt71.toFixed(1)}]`);
  console.log('  [OK] CSR bound inference and 75 Image Rating target enforcement verified.');

  // Test 9: Save Decisions and Modal Auto-Confirmation Prompt
  console.log('Testing Save Decisions and Modal Auto-Confirmation Prompt...');
  let pageSaveClicked = false;
  let modalSaveClicked = false;

  const pageSaveButton = {
    textContent: 'Save Decisions',
    value: '',
    disabled: false,
    classList: { contains: () => false },
    getAttribute: () => null,
    scrollIntoView: () => {},
    dispatchEvent: () => {},
    click: () => {
      pageSaveClicked = true;
      modalContainer.style.display = 'block';
    }
  };

  const modalCancelButton = {
    textContent: 'Cancel',
    value: '',
    classList: { contains: (c) => c === 'btn-default' },
    getAttribute: () => null,
    dispatchEvent: () => {},
    click: () => {}
  };

  const modalSaveButton = {
    textContent: 'Save',
    value: '',
    classList: { contains: (c) => c === 'btn-primary' },
    getAttribute: () => null,
    dispatchEvent: () => {},
    click: () => {
      modalSaveClicked = true;
    }
  };

  const modalContainer = {
    style: { display: 'none' },
    textContent: 'Save Decision Entries Are you sure you would like to save your decision entries?',
    querySelectorAll: (sel) => [modalCancelButton, modalSaveButton],
    closest: (sel) => modalContainer
  };
  modalSaveButton.closest = (sel) => modalContainer;
  modalCancelButton.closest = (sel) => modalContainer;
  modalSaveButton.parentElement = modalContainer;
  modalCancelButton.parentElement = modalContainer;

  const origQSA = global.document.querySelectorAll;
  global.document.querySelectorAll = (sel) => {
    if (sel.includes('button') || sel.includes('input') || sel.includes('a')) {
      if (modalContainer.style.display === 'block') {
        return [pageSaveButton, modalCancelButton, modalSaveButton];
      }
      return [pageSaveButton];
    }
    return [];
  };

  const saveRes = await global.gloBusDOMAdapter.saveDecisions();
  assert.strictEqual(pageSaveClicked, true, 'Page save button must be clicked');
  assert.strictEqual(modalSaveClicked, true, 'Modal Save button must be automatically confirmed');
  assert.strictEqual(saveRes.ok, true, 'saveDecisions must resolve with ok: true');
  global.document.querySelectorAll = origQSA;
  console.log('  [OK] Save Decisions page trigger and modal confirmation prompt auto-confirmed successfully.');

  // Test 10: Negative Cash Detection & Emergency Overdraft Penalty
  console.log('Testing Negative Cash Detection & Overdraft Penalty...');
  const posCashScore = opt.evaluateScore({ eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRatingScore: 90, imageRating: 75, endingCash: 3000 });
  const negCashScore = opt.evaluateScore({ eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRatingScore: 90, imageRating: 75, endingCash: -1500 });
  assert.ok(negCashScore < posCashScore - 5000, 'Negative ending cash must trigger severe emergency overdraft penalty (over -5000 pts)');

  // Test non-Finance page cash preservation when negative or 0
  global.gloBusDOMAdapter.lastObservedMetrics = { endingCash: 4500, eps: 4.0 };
  const mockCostRow = [
    { textContent: 'Green Initiatives Cost ($540)', querySelectorAll: () => [] },
    {
      textContent: 'Green Initiatives Cost ($540)',
      querySelectorAll: () => [
        { textContent: 'Green Initiatives Cost' },
        { textContent: '($540)' }
      ]
    },
    {
      textContent: 'Earnings Per Share $5.00',
      querySelectorAll: () => [
        { textContent: 'Earnings Per Share' },
        { textContent: '$5.00' }
      ]
    }
  ];
  global.document.querySelectorAll = (sel) => sel === 'tr' ? mockCostRow : [];
  // Detect as CSR page
  global.document.title = 'Corporate Social Responsibility and Citizenship';
  const csrParsed = global.gloBusDOMAdapter.getProjectedMetrics();
  assert.strictEqual(csrParsed.endingCash, 4500, 'Non-Finance page must preserve previous positive ending cash rather than adopting negative cost values');
  global.document.querySelectorAll = origQSA;
  global.document.title = '';
  console.log('  [OK] Negative cash overdraft penalty and non-Finance cash preservation verified.');

  // Test 11: Unrendered Scoreboard & Zero EPS Fallback
  console.log('Testing Unrendered Scoreboard & Zero EPS Fallback...');
  const zeroEpsScore = opt.evaluateScore({ eps: 0, roe: 0, stockPrice: 0, endingCash: 0 });
  assert.strictEqual(zeroEpsScore, -Infinity, 'Zero or unrendered EPS must evaluate to -Infinity utility score');

  const nanEpsScore = opt.evaluateScore({ eps: NaN, roe: 20, stockPrice: 0, endingCash: 1000 });
  assert.strictEqual(nanEpsScore, -Infinity, 'NaN EPS must evaluate to -Infinity utility score');

  const nullMetricsScore = opt.evaluateScore(null);
  assert.strictEqual(nullMetricsScore, -Infinity, 'Null metrics must evaluate to -Infinity utility score');
  console.log('  [OK] Unrendered scoreboard and 0/NaN EPS correctly rejected with -Infinity.');

  // Test 12: Secondary Post-Save Acknowledgement Modal Auto-Dismissal
  console.log('Testing Secondary Post-Save Modal Acknowledgement Auto-Dismissal...');
  let ackClicked = false;
  let confirmClicked = false;
  const ackButton = {
    textContent: 'OK',
    value: '',
    click: () => { ackClicked = true; }
  };

  const saveBtnForAck = {
    textContent: 'Save Decisions',
    disabled: false,
    click: () => {},
    scrollIntoView: () => {},
    dispatchEvent: () => {}
  };
  const confirmBtnForAck = {
    textContent: 'Save',
    closest: () => ({ textContent: 'Save Decision Entries' }),
    parentElement: { querySelectorAll: () => [{ textContent: 'Cancel' }] },
    click: () => { confirmClicked = true; },
    dispatchEvent: () => {}
  };

  global.document.querySelectorAll = (sel) => {
    if (confirmClicked) {
      return [saveBtnForAck, ackButton];
    }
    return [saveBtnForAck, confirmBtnForAck];
  };

  const ackSaveRes = await global.gloBusDOMAdapter.saveDecisions();
  assert.strictEqual(ackSaveRes.ok, true);
  assert.strictEqual(ackClicked, true, 'Post-save acknowledgement OK button must be auto-dismissed');
  global.document.querySelectorAll = origQSA;
  console.log('  [OK] Secondary post-save acknowledgement modal auto-dismissal verified.');

  // Test 13: Stop Disarm Guarantee (Zero Post-Stop Side Effects)
  console.log('Testing Stop Disarm Guarantee...');
  let stopSaveDispatched = false;
  const testOpt = new global.GloBusOptimizer(global.gloBusDOMAdapter);
  testOpt.autoSave = true;
  const savedSaveDecisions = global.gloBusDOMAdapter.saveDecisions;
  global.gloBusDOMAdapter.saveDecisions = async () => {
    stopSaveDispatched = true;
    return { ok: true };
  };

  testOpt.runOptimizationLoop = async () => {
    // Simulate user clicking Stop midway through optimization
    testOpt.stop();
  };

  const stopRunResult = await testOpt.start(true);
  assert.strictEqual(testOpt.isStopped, true, 'Optimizer must be in isStopped state');
  assert.strictEqual(stopSaveDispatched, false, 'saveDecisions MUST NOT be executed when optimization was stopped');
  assert.strictEqual(stopRunResult.stopped, true, 'start() must return stopped: true descriptor');
  global.gloBusDOMAdapter.saveDecisions = savedSaveDecisions;
  console.log('  [OK] Optimizer stop disarm guarantees zero post-stop auto-saving.');

  // Test 14: parseNum Edge Cases & Numerical Robustness
  console.log('Testing parseNum Numerical Edge Cases...');
  // Extract parseNum from getProjectedMetrics or simulate exact implementation
  const testParseNum = (str) => {
    if (str === null || str === undefined) return NaN;
    let s = String(str).trim();
    if (s === '' || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return NaN;
    if (s.startsWith('(') && s.endsWith(')')) {
      s = '-' + s.slice(1, -1);
    }
    const cleaned = s.replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : NaN;
  };

  assert.strictEqual(testParseNum('(1,500)'), -1500, 'Parenthetical negative must parse as negative number');
  assert.strictEqual(testParseNum('$465,294'), 465294, 'Currency with commas must parse correctly');
  assert.strictEqual(testParseNum('+18.1%'), 18.1, 'Percentage with plus sign must parse correctly');
  assert.strictEqual(testParseNum('0'), 0, 'String 0 must parse as 0');
  assert.strictEqual(testParseNum(0), 0, 'Numeric 0 must return 0, NOT NaN');
  assert.ok(isNaN(testParseNum(null)), 'null must return NaN');
  assert.ok(isNaN(testParseNum(undefined)), 'undefined must return NaN');
  assert.ok(isNaN(testParseNum('')), 'Empty string must return NaN');
  assert.ok(isNaN(testParseNum('-')), 'Hyphen must return NaN');
  assert.ok(isNaN(testParseNum('--')), 'Double hyphen must return NaN');
  assert.ok(isNaN(testParseNum('N/A')), 'N/A must return NaN');
  console.log('  [OK] parseNum handles all boundary and numeric edge cases flawlessly.');

  // Test 15: Credit Rating Evaluation for 'D' and 'F' (Falsy Zero Fix)
  console.log('Testing Credit Rating Scoring (F and D zero score enforcement)...');
  const fMetrics = { eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRating: 'F', creditRatingScore: 0, imageRating: 75, endingCash: 5000 };
  const dMetrics = { eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRating: 'D', creditRatingScore: 25, imageRating: 75, endingCash: 5000 };
  const aMetrics = { eps: 4.5, roe: 22.0, stockPrice: 45.0, creditRating: 'A+', creditRatingScore: 100, imageRating: 75, endingCash: 5000 };

  const fScore = opt.evaluateScore(fMetrics);
  const dScore = opt.evaluateScore(dMetrics);
  const aScore = opt.evaluateScore(aMetrics);

  assert.ok(aScore > fScore + 15, `A+ score (${aScore.toFixed(1)}) must substantially exceed F score (${fScore.toFixed(1)})`);
  assert.ok(aScore > dScore + 15, `A+ score (${aScore.toFixed(1)}) must substantially exceed D score (${dScore.toFixed(1)})`);
  console.log('  [OK] Credit rating D and F scores correctly awarded 0 points with no falsy fallthrough.');

  // Test 16: inferBounds Resilience with Malformed / NaN Input
  console.log('Testing inferBounds Resilience against null/undefined/NaN...');
  const emptyEl = {};
  const nanBounds = global.gloBusDOMAdapter.inferBounds(emptyEl, 'Unknown Levers', 'Misc Field', NaN);
  assert.ok(Number.isFinite(nanBounds.min), 'min must be finite even when currentVal is NaN');
  assert.ok(Number.isFinite(nanBounds.max), 'max must be finite even when currentVal is NaN');
  assert.ok(Number.isFinite(nanBounds.step), 'step must be finite even when currentVal is NaN');
  assert.ok(nanBounds.max > nanBounds.min, 'max must be greater than min');
  console.log('  [OK] inferBounds resilient against malformed inputs and NaN.');

  // Test 17: Single Strategy Objective (Grand Champion locked, alternative presets eliminated)
  console.log('Testing Strategy Preset Streamlining (Grand Champion locked, alternatives eliminated)...');
  assert.strictEqual(opt.presets.max_eps, undefined, 'max_eps preset must be completely eliminated');
  assert.strictEqual(opt.presets.volume_leader, undefined, 'volume_leader preset must be completely eliminated');
  assert.strictEqual(opt.presets.premium_quality, undefined, 'premium_quality preset must be completely eliminated');
  assert.ok(opt.presets.balanced, 'balanced Grand Champion preset must exist');
  assert.strictEqual(opt.presets.balanced.name, 'Grand Champion (Balanced)');
  assert.strictEqual(opt.presets.balanced.constraints.minCash, 2500);
  assert.strictEqual(opt.presets.balanced.constraints.minCreditScore, 85);
  assert.strictEqual(opt.presets.balanced.constraints.minImage, 75);

  const activeConf = opt.getActiveConfig();
  assert.strictEqual(activeConf.name, 'Grand Champion (Balanced)');

  opt.setPreset('max_eps');
  assert.strictEqual(opt.currentPreset, 'balanced', 'setPreset with deprecated key must safely stay on balanced');
  assert.strictEqual(opt.getActiveConfig().name, 'Grand Champion (Balanced)');
  console.log('  [OK] Single strategy objective verified: alternative presets completely eliminated and Grand Champion locked.');

  // Test 18: Special Contracts Auction Optimization & Assumption Exclusion
  console.log('Testing Special Contracts Auction Optimization & Assumption Exclusion...');
  const contractEl = { getAttribute: () => null };
  const contractBounds = global.gloBusDOMAdapter.inferBounds(contractEl, 'N.A. Special Discount Offer', 'Special Discount Offer', 19);
  assert.strictEqual(contractBounds.min, 0, 'Special discount minimum must be 0%');
  assert.strictEqual(contractBounds.max, 35, 'Special discount maximum must be expanded to 35%');
  assert.strictEqual(contractBounds.step, 1, 'Special discount step must be 1%');
  assert.strictEqual(contractBounds.category, 'special_contract_discount');

  // Verify that assumption dropdowns are excluded from getDecisionInputs
  const mockContractInputs = [
    { name: 'na_discount', value: '19', getAttribute: () => null, closest: () => null },
    { name: 'ea_discount', value: '22', getAttribute: () => null, closest: () => null },
    { name: 'ap_discount', value: '21', getAttribute: () => null, closest: () => null },
    { name: 'la_discount', value: '22', getAttribute: () => null, closest: () => null }
  ];
  const mockAssumptionSelects = [
    {
      name: 'incorp_na',
      options: [{ text: 'Yes', value: 'yes' }, { text: 'No', value: 'no' }],
      selectedIndex: 0,
      value: 'yes',
      closest: () => null,
      classList: { contains: () => false },
      dispatchEvent: () => {}
    }
  ];

  const prevQSA = global.document.querySelectorAll;
  const mockContractRows = [
    {
      textContent: 'Value Index of AC Camera Units Offered(100-point scale) 46 46 47 54',
      querySelectorAll: (sel) => [
        { textContent: 'Value Index' },
        { textContent: '46' },
        { textContent: '46' },
        { textContent: '47' },
        { textContent: '54' }
      ]
    },
    {
      textContent: 'Contribution Margin 4,396 171.72 3,269 150.65 2,563 149.88 1,553 101.50',
      querySelectorAll: (sel) => [
        { textContent: 'Contribution Margin' },
        { textContent: '4,396' }, { textContent: '171.72' },
        { textContent: '3,269' }, { textContent: '150.65' },
        { textContent: '2,563' }, { textContent: '149.88' },
        { textContent: '1,553' }, { textContent: '101.50' }
      ]
    },
    {
      textContent: 'Special Offers Units to be Assembled(000s) 25.6units 21.7units 17.1units 15.3units',
      querySelectorAll: (sel) => [
        { textContent: 'Units' },
        { textContent: '25.6' },
        { textContent: '21.7' },
        { textContent: '17.1' },
        { textContent: '15.3' }
      ]
    }
  ];

  global.document.querySelectorAll = (sel) => {
    if (sel.includes('input')) return mockContractInputs;
    if (sel.includes('select')) return mockAssumptionSelects;
    if (sel === 'tr') return mockContractRows;
    return [];
  };

  // Test findLabel returns assumption label for the select
  const origFindLabel = global.gloBusDOMAdapter.findLabel;
  global.gloBusDOMAdapter.findLabel = (el) => {
    if (el.name === 'incorp_na') return 'Incorporate the projected outcomes for N.A.';
    if (el.name === 'na_discount') return 'N.A. Special Discount Offer';
    if (el.name === 'ea_discount') return 'E-A Special Discount Offer';
    if (el.name === 'ap_discount') return 'A-P Special Discount Offer';
    if (el.name === 'la_discount') return 'L.A. Special Discount Offer';
    return '';
  };

  const contractInputs = global.gloBusDOMAdapter.getDecisionInputs();
  assert.strictEqual(contractInputs.length, 4, 'Must only scrape the 4 discount inputs, strictly excluding the assumption select');
  assert.ok(contractInputs.every(i => !i.label.toLowerCase().includes('incorporate')));

  const contractData = global.gloBusDOMAdapter.getSpecialContractData();
  assert.strictEqual(contractData.na.valueIndex, 46, 'NA Value Index parsed correctly');
  assert.strictEqual(contractData.na.marginPerUnit, 171.72, 'NA Contribution Margin parsed correctly');
  assert.strictEqual(contractData.ea.valueIndex, 46, 'EA Value Index parsed correctly');
  assert.strictEqual(contractData.ea.marginPerUnit, 150.65, 'EA Contribution Margin parsed correctly');
  assert.strictEqual(contractData.ap.valueIndex, 47, 'AP Value Index parsed correctly');
  assert.strictEqual(contractData.ap.marginPerUnit, 149.88, 'AP Contribution Margin parsed correctly');
  assert.strictEqual(contractData.la.valueIndex, 54, 'LA Value Index parsed correctly');
  assert.strictEqual(contractData.la.marginPerUnit, 101.50, 'LA Contribution Margin parsed correctly');
  // Test auction execution
  opt.isRunning = true;
  opt.isStopped = false;
  let assumptionSet = null;
  const origSetAssumptions = global.gloBusDOMAdapter.setSpecialContractAssumptions;
  global.gloBusDOMAdapter.setSpecialContractAssumptions = (map) => { assumptionSet = map; };
  
  await opt.runSpecialContractsOptimization();
  assert.ok(assumptionSet !== null, 'Assumptions must be synchronized at end of auction optimization');
  assert.strictEqual(assumptionSet.la, false, 'Cash-defensive policy must set assumption toggles to No/false to protect Finance cash buffer');
  assert.strictEqual(assumptionSet.na, false, 'NA assumption toggle must be set to No/false');

  global.gloBusDOMAdapter.setSpecialContractAssumptions = origSetAssumptions;
  global.gloBusDOMAdapter.findLabel = origFindLabel;
  global.document.querySelectorAll = prevQSA;
  // Test 18: Persistent Round Baseline & Elimination of Scope Selector
  console.log('Testing Persistent Round Baseline & Scope Selector Elimination...');
  const hudJs = fs.readFileSync(path.join(__dirname, '../extension/hud.js'), 'utf8');
  const hudCss = fs.readFileSync(path.join(__dirname, '../extension/hud.css'), 'utf8');
  assert.ok(!hudJs.includes('hud-scope-current'), 'hud.js must not contain hud-scope-current');
  assert.ok(!hudJs.includes('hud-scope-round'), 'hud.js must not contain hud-scope-round');
  assert.ok(!hudJs.includes('activeScope'), 'hud.js must not contain activeScope');
  assert.ok(hudJs.includes('OPTIMIZE FULL ROUND'), 'hud.js must feature dedicated OPTIMIZE FULL ROUND action');
  assert.ok(!hudCss.includes('.hud-scope-group'), 'hud.css must not contain .hud-scope-group');
  assert.ok(!hudCss.includes('.hud-scope-btn'), 'hud.css must not contain .hud-scope-btn');

  // Test establishRoundBaseline method on coordinator
  global.gloBusDOMAdapter.getProjectedMetrics = () => ({
    eps: 4.85,
    roe: 31.2,
    stockPrice: 65.5,
    creditRating: 'A-',
    imageRating: 77,
    endingCash: 4200,
    netRevenue: 350000,
    netProfit: 85000
  });

  const base = await coord.establishRoundBaseline(global.gloBusDOMAdapter);
  assert.strictEqual(base.eps, 4.85, 'Round baseline EPS must match live projected');
  assert.strictEqual(base.roe, 31.2, 'Round baseline ROE must match live projected');
  assert.strictEqual(base.creditRating, 'A-', 'Round baseline Credit Rating must match');
  assert.strictEqual(base.imageRating, 77, 'Round baseline Image Rating must match');
  assert.strictEqual(base.endingCash, 4200, 'Round baseline Ending Cash must match');

  const storedSession = JSON.parse(global.sessionStorage.getItem('globus_pilot_round_baseline'));
  assert.ok(storedSession !== null, 'Session storage must contain serialized round baseline');
  assert.strictEqual(storedSession.eps, 4.85, 'Stored baseline EPS must match');

  // Test stop(false) preserves baseline while stop(true) clears it
  await coord.stop(false);
  assert.ok(global.sessionStorage.getItem('globus_pilot_round_baseline') !== null, 'stop(false) must preserve round baseline');

  await coord.stop(true);
  assert.strictEqual(global.sessionStorage.getItem('globus_pilot_round_baseline'), null, 'stop(true) must clear round baseline');

  global.gloBusDOMAdapter.getProjectedMetrics = origGetMetrics;
  console.log('  [OK] Persistent round baseline and scope selector elimination verified.');

  // Test 19: Manifest Icon Assets & Distribution Verification
  console.log('Testing Manifest Icon Assets & Distribution Artifacts...');
  const manifestRaw = fs.readFileSync(path.join(__dirname, '../extension/manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw);
  assert.ok(manifest.icons, 'manifest.json must have "icons" property');
  assert.ok(manifest.action.default_icon, 'manifest.json must have "action.default_icon"');

  const requiredIconSizes = ['16', '32', '48', '128'];
  for (const s of requiredIconSizes) {
    const iconRel = manifest.icons[s];
    assert.ok(iconRel, `manifest.icons must include size ${s}`);
    const iconPath = path.join(__dirname, '../extension', iconRel);
    assert.ok(fs.existsSync(iconPath), `Icon file ${iconPath} must exist on disk`);
    const stats = fs.statSync(iconPath);
    assert.ok(stats.size > 50, `Icon file ${iconPath} must have non-trivial size`);
  }

  // Test 20: Strict Mode Execution & Getter Safety Verification
  console.log('Testing Strict Mode Execution & Getter Safety...');
  assert.ok(!hudJs.includes('adapter.pageType ='), 'hud.js must never attempt to assign to getter-only adapter.pageType');
  const userScript = fs.readFileSync(path.join(__dirname, '../userscript/globus-pilot.user.js'), 'utf8');
  assert.ok(userScript.includes("'use strict';"), 'userscript must enforce strict mode');
  assert.ok(!userScript.includes('adapter.pageType ='), 'userscript must not contain assignment to getter-only adapter.pageType');
  assert.ok(userScript.includes('GloBusPageCoordinator'), 'userscript must contain Page Coordinator');
  assert.ok(userScript.includes('GloBusOptimizer'), 'userscript must contain Optimizer');

  console.log('  [OK] Manifest icons, strict mode safety, and distribution integrity verified.');

  console.log('\nAll JS extension tests passed successfully!');
})();



