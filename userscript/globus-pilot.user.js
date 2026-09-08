// ==UserScript==
// @name         GloBus-Pilot: Strategy & Decision Optimizer
// @namespace    https://glo-bus.com/
// @version      2.0.0
// @description  Floating real-time decision optimizer & simulation HUD for GLO-BUS (Camera & Drone Simulation)
// @author       GloBus-Pilot AI
// @match        *://*.glo-bus.com/*
// @match        *://glo-bus.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Inject Styles
  const css = `
  #globus-pilot-hud {
    position: fixed;
    top: 24px;
    right: 24px;
    width: 360px;
    background: rgba(18, 22, 34, 0.95);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(80, 110, 240, 0.3);
    border-radius: 14px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(66, 133, 244, 0.15);
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    z-index: 9999999;
    overflow: hidden;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    user-select: none;
  }
  #globus-pilot-hud.minimized {
    width: 240px;
    height: 48px;
    border-color: rgba(66, 133, 244, 0.5);
  }
  #globus-pilot-hud.minimized .hud-body {
    display: none;
  }
  .hud-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(30, 41, 69, 0.9), rgba(15, 23, 42, 0.9));
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    cursor: grab;
  }
  .hud-header:active {
    cursor: grabbing;
  }
  .hud-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.3px;
    color: #fff;
  }
  .hud-badge {
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    color: white;
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .hud-actions {
    display: flex;
    gap: 6px;
  }
  .hud-icon-btn {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #cbd5e1;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: all 0.15s ease;
  }
  .hud-icon-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    color: #fff;
  }
  .hud-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-height: 80vh;
    overflow-y: auto;
  }
  .hud-status-card {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    padding: 10px 12px;
  }
  .hud-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  .hud-status-title {
    color: #94a3b8;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .hud-status-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .status-idle { background: #334155; color: #94a3b8; }
  .status-running { background: #065f46; color: #34d399; }
  .status-paused { background: #78350f; color: #fbbf24; }
  .status-completed { background: #1e3a8a; color: #60a5fa; }
  .hud-metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .hud-metric-box {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .hud-metric-label {
    font-size: 11px;
    color: #94a3b8;
  }
  .hud-metric-val {
    font-size: 17px;
    font-weight: 700;
    color: #38bdf8;
    margin-top: 2px;
  }
  .hud-metric-sub {
    font-size: 10px;
    color: #64748b;
  }
  .hud-control-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .hud-label {
    font-size: 11px;
    font-weight: 600;
    color: #cbd5e1;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }
  .hud-select {
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #f8fafc;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 12px;
    outline: none;
  }
  .hud-btn-primary {
    background: linear-gradient(135deg, #2563eb, #4f46e5);
    color: white;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    width: 100%;
  }
  .hud-btn-primary:hover {
    background: linear-gradient(135deg, #1d4ed8, #4338ca);
  }
  .hud-btn-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .hud-btn-secondary {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    padding: 8px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
  }
  .hud-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.14);
    color: #fff;
  }
  .hud-btn-danger {
    background: rgba(220, 38, 38, 0.15);
    border: 1px solid rgba(220, 38, 38, 0.3);
    color: #f87171;
  }
  .hud-footer {
    font-size: 10px;
    color: #64748b;
    text-align: center;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 8px;
  }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // DOM Adapter Class
  class GloBusDOMAdapter {
    constructor() {
      this.initialSnapshot = null;
      this.lastObservedMetrics = null;
      this.pageType = this.detectPageType();
    }

    detectPageType() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('product-design') || path.includes('product_design')) return 'PRODUCT_DESIGN';
      if (path.includes('marketing')) return 'MARKETING';
      if (path.includes('assembly') || path.includes('workforce') || path.includes('compensation')) return 'ASSEMBLY_COMPENSATION';
      if (path.includes('corporate') || path.includes('csr') || path.includes('citizenship')) return 'CSR';
      if (path.includes('finance') || path.includes('cash')) return 'FINANCE';
      return 'GENERAL_DECISION';
    }

    getDecisionInputs() {
      const inputs = [];
      const inputElements = document.querySelectorAll(
        'input.input-field, input.entry-input, input[type="text"]:not([readonly]):not([disabled]), input[type="number"]:not([readonly]):not([disabled])'
      );

      inputElements.forEach((el, index) => {
        if (el.closest('#globus-pilot-hud') || el.name === 'q' || el.type === 'hidden') return;
        const id = el.id || el.name || `input_${index}`;
        const name = el.name || el.id || `Field_${index}`;
        const label = this.findLabel(el);
        const rawVal = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
        const val = isNaN(rawVal) ? 0 : rawVal;
        const bounds = this.inferBounds(el, name, label, val);

        inputs.push({
          element: el,
          type: 'input',
          id: id,
          name: name,
          label: label,
          value: val,
          min: bounds.min,
          max: bounds.max,
          step: bounds.step,
          category: bounds.category
        });
      });

      const selectElements = document.querySelectorAll('select:not([disabled]):not(.entry-assumptions-select)');
      selectElements.forEach((el, index) => {
        if (el.closest('#globus-pilot-hud')) return;
        const id = el.id || el.name || `select_${index}`;
        const name = el.name || el.id || `Select_${index}`;
        const label = this.findLabel(el);
        const options = Array.from(el.options).map(opt => ({
          text: opt.textContent.trim(),
          value: opt.value,
          index: opt.index
        }));

        if (options.length > 1) {
          inputs.push({
            element: el,
            type: 'select',
            id: id,
            name: name,
            label: label,
            selectedIndex: el.selectedIndex,
            value: el.value,
            options: options,
            min: 0,
            max: options.length - 1,
            step: 1,
            category: 'dropdown'
          });
        }
      });

      return inputs;
    }

    findLabel(element) {
      if (element.title) return element.title;
      if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');
      const cell = element.closest('td');
      if (cell) {
        const row = cell.closest('tr');
        if (row) {
          const rowLabel = row.querySelector('th, td:first-child');
          if (rowLabel && rowLabel !== cell) {
            return rowLabel.textContent.trim().replace(/\s+/g, ' ');
          }
        }
      }
      if (element.id) {
        const labelEl = document.querySelector(`label[for="${element.id}"]`);
        if (labelEl) return labelEl.textContent.trim();
      }
      return element.name || element.id || 'Decision Field';
    }

    inferBounds(el, name, label, currentVal) {
      const l = (name + ' ' + label).toLowerCase();
      if (l.includes('r&d') || l.includes('research')) return { min: 0, max: 50000, step: 2500, category: 'rd' };
      if (l.includes('price') || l.includes('retail')) {
        if (l.includes('drone') || l.includes('uav')) {
          return { min: Math.max(200, currentVal - 400), max: currentVal + 600, step: 10, category: 'price' };
        }
        return { min: Math.max(50, currentVal - 150), max: currentVal + 250, step: 5, category: 'price' };
      }
      if (l.includes('advert') || l.includes('promo') || l.includes('search')) return { min: 0, max: Math.max(currentVal * 2.5, 10000), step: 250, category: 'marketing' };
      if (l.includes('discount') || l.includes('support')) return { min: 0, max: 25, step: 1, category: 'discount' };
      if (l.includes('warranty')) return { min: 0, max: 3, step: 1, category: 'warranty' };
      if (l.includes('wage') || l.includes('salary')) return { min: Math.max(0, currentVal * 0.8), max: currentVal * 1.5, step: 500, category: 'compensation' };
      if (l.includes('incentive') || l.includes('bonus')) return { min: 0, max: Math.max(currentVal * 2, 10), step: 0.5, category: 'compensation' };

      const span = Math.max(Math.abs(currentVal) * 0.35, 10);
      return {
        min: Math.max(0, currentVal - span),
        max: currentVal + span,
        step: span > 100 ? 50 : (span > 20 ? 5 : 1),
        category: 'general'
      };
    }

    setInputValue(item, value) {
      if (item.type === 'select') {
        const select = item.element;
        const targetIndex = Math.min(Math.max(0, Math.round(value)), item.options.length - 1);
        if (select.selectedIndex !== targetIndex) {
          select.selectedIndex = targetIndex;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        const input = item.element;
        const formatted = typeof value === 'number' ? (Number.isInteger(value) ? value.toString() : value.toFixed(2)) : value;
        if (input.value !== formatted) {
          input.value = formatted;
          ['input', 'change', 'blur'].forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true })));
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
        }
      }
    }

    triggerCalculate() {
      return new Promise((resolve) => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn'));
        const calcBtn = buttons.find(b => {
          const text = (b.textContent || b.value || '').toLowerCase();
          return text.includes('calculate') || text.includes('update score') || text.includes('recalculate');
        });
        if (calcBtn) {
          calcBtn.click();
        } else {
          document.body.dispatchEvent(new Event('change', { bubbles: true }));
        }
        setTimeout(resolve, 350);
      });
    }

    getProjectedMetrics() {
      const metrics = {
        eps: 0,
        roe: 0,
        stockPrice: 0,
        creditRating: 'B',
        creditRatingScore: 50,
        imageRating: 0,
        endingCash: 0,
        timestamp: Date.now()
      };
      const creditMap = { 'A+': 100, 'A': 95, 'A-': 90, 'B+': 82, 'B': 75, 'B-': 68, 'C+': 58, 'C': 50, 'C-': 40, 'D': 25, 'F': 0 };

      document.querySelectorAll('tr').forEach(row => {
        const measureCell = row.querySelector('td.measure, th.measure, td:first-child');
        const scoreCell = row.querySelector('td.score, td.score.text-center, td:last-child, td:nth-child(2)');
        if (!measureCell || !scoreCell) return;
        const label = measureCell.textContent.trim().toLowerCase();
        const rawText = scoreCell.textContent.trim();
        const numVal = parseFloat(rawText.replace(/[^0-9.-]/g, ''));

        if (label.includes('earnings per share') || label === 'eps') {
          if (!isNaN(numVal)) metrics.eps = numVal;
        } else if (label.includes('return on equity') || label === 'roe') {
          if (!isNaN(numVal)) metrics.roe = numVal;
        } else if (label.includes('stock price')) {
          if (!isNaN(numVal)) metrics.stockPrice = numVal;
        } else if (label.includes('credit rating')) {
          const m = rawText.match(/[A-DF][+-]?/i);
          if (m) {
            metrics.creditRating = m[0].toUpperCase();
            metrics.creditRatingScore = creditMap[metrics.creditRating] || 50;
          }
        } else if (label.includes('image rating')) {
          if (!isNaN(numVal)) metrics.imageRating = numVal;
        } else if (label.includes('ending cash') || label.includes('cash balance') || label === 'cash') {
          if (!isNaN(numVal)) metrics.endingCash = numVal;
        }
      });

      this.lastObservedMetrics = metrics;
      return metrics;
    }

    captureSnapshot() {
      const inputs = this.getDecisionInputs();
      const snapshot = {};
      inputs.forEach(i => {
        snapshot[i.id] = { id: i.id, name: i.name, type: i.type, value: i.type === 'select' ? i.selectedIndex : i.value };
      });
      if (!this.initialSnapshot) this.initialSnapshot = JSON.parse(JSON.stringify(snapshot));
      return snapshot;
    }

    async restoreSnapshot(snapshot) {
      if (!snapshot) snapshot = this.initialSnapshot;
      if (!snapshot) return;
      const inputs = this.getDecisionInputs();
      inputs.forEach(item => {
        if (snapshot[item.id] !== undefined) this.setInputValue(item, snapshot[item.id].value);
      });
      await this.triggerCalculate();
    }
  }

  // Optimizer Class
  class GloBusOptimizer {
    constructor(domAdapter) {
      this.adapter = domAdapter;
      this.isRunning = false;
      this.isPaused = false;
      this.iteration = 0;
      this.delayMs = 300;
      this.currentPreset = 'balanced';
      this.presets = {
        balanced: { weights: { eps: 0.35, roe: 0.25, stockPrice: 0.20, credit: 0.10, image: 0.10 }, constraints: { minCash: 2500, minCreditScore: 82, minImage: 70 } },
        max_eps: { weights: { eps: 0.65, roe: 0.25, stockPrice: 0.10, credit: 0.0, image: 0.0 }, constraints: { minCash: 1500, minCreditScore: 68, minImage: 50 } },
        volume_leader: { weights: { eps: 0.30, roe: 0.20, stockPrice: 0.20, credit: 0.15, image: 0.15 }, constraints: { minCash: 3000, minCreditScore: 82, minImage: 65 } },
        premium_quality: { weights: { eps: 0.25, roe: 0.20, stockPrice: 0.20, credit: 0.15, image: 0.20 }, constraints: { minCash: 2500, minCreditScore: 90, minImage: 80 } }
      };
      this.baselineMetrics = null;
      this.bestScore = -Infinity;
      this.bestMetrics = null;
      this.bestCombo = null;
    }

    evaluateScore(metrics) {
      if (!metrics || isNaN(metrics.eps)) return -Infinity;
      const c = this.presets[this.currentPreset].constraints;
      const w = this.presets[this.currentPreset].weights;
      const baseEPS = Math.max(0.5, this.baselineMetrics?.eps || 2.0);
      const baseROE = Math.max(5.0, this.baselineMetrics?.roe || 15.0);
      const baseStock = Math.max(10.0, this.baselineMetrics?.stockPrice || 25.0);

      let score = (w.eps * (metrics.eps / baseEPS) * 100) +
                  (w.roe * (metrics.roe / baseROE) * 100) +
                  (w.stockPrice * (metrics.stockPrice / baseStock) * 100) +
                  (w.credit * (metrics.creditRatingScore || 50)) +
                  (w.image * (metrics.imageRating || 50));

      if (metrics.endingCash < c.minCash) score -= ((c.minCash - metrics.endingCash) * 1.5) + 500;
      if (metrics.creditRatingScore < c.minCreditScore) score -= ((c.minCreditScore - metrics.creditRatingScore) * 15) + 200;
      if (metrics.imageRating < c.minImage) score -= ((c.minImage - metrics.imageRating) * 8) + 100;
      return score;
    }

    async start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.isPaused = false;
      this.iteration = 0;
      if (this.onStatusChange) this.onStatusChange('running');

      this.adapter.captureSnapshot();
      await this.adapter.triggerCalculate();
      this.baselineMetrics = this.adapter.getProjectedMetrics();
      this.bestScore = this.evaluateScore(this.baselineMetrics);
      this.bestMetrics = { ...this.baselineMetrics };
      this.bestCombo = this.adapter.captureSnapshot();
      if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);

      try {
        await this.runLoop();
      } finally {
        this.isRunning = false;
        this.isPaused = false;
        if (this.onStatusChange) this.onStatusChange('completed');
      }
    }

    async runLoop() {
      const inputs = this.adapter.getDecisionInputs();
      if (!inputs.length) return;

      inputs.sort((a, b) => {
        const p = { price: 1, rd: 2, marketing: 3, compensation: 4, discount: 5, dropdown: 6, general: 7 };
        return (p[a.category] || 10) - (p[b.category] || 10);
      });

      for (let cycle = 0; cycle < 4; cycle++) {
        let cycleGain = false;
        for (const item of inputs) {
          if (!this.isRunning) return;
          while (this.isPaused) await new Promise(r => setTimeout(r, 200));

          const curVal = item.type === 'select' ? item.selectedIndex : item.value;
          const step = item.step || 1;

          // Test UP
          const upVal = Math.min(item.max, curVal + step);
          let scoreUp = -Infinity, mUp = null;
          if (upVal !== curVal) {
            this.adapter.setInputValue(item, upVal);
            await this.adapter.triggerCalculate();
            mUp = this.adapter.getProjectedMetrics();
            scoreUp = this.evaluateScore(mUp);
          }

          // Test DOWN
          const downVal = Math.max(item.min, curVal - step);
          let scoreDown = -Infinity, mDown = null;
          if (downVal !== curVal) {
            this.adapter.setInputValue(item, downVal);
            await this.adapter.triggerCalculate();
            mDown = this.adapter.getProjectedMetrics();
            scoreDown = this.evaluateScore(mDown);
          }

          let winningVal = curVal;
          if (scoreUp > this.bestScore && scoreUp >= scoreDown) {
            winningVal = upVal;
            this.bestScore = scoreUp;
            this.bestMetrics = { ...mUp };
            this.bestCombo = this.adapter.captureSnapshot();
            cycleGain = true;
            if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);
          } else if (scoreDown > this.bestScore) {
            winningVal = downVal;
            this.bestScore = scoreDown;
            this.bestMetrics = { ...mDown };
            this.bestCombo = this.adapter.captureSnapshot();
            cycleGain = true;
            if (this.onNewBestScore) this.onNewBestScore(this.bestScore, this.bestMetrics);
          }

          this.adapter.setInputValue(item, winningVal);
          item.value = winningVal;
          this.iteration++;
          if (this.onIterationUpdate) this.onIterationUpdate(this.iteration, item.label);
          await new Promise(r => setTimeout(r, this.delayMs));
        }
        if (!cycleGain) break;
      }
    }

    async applyBest() { if (this.bestCombo) await this.adapter.restoreSnapshot(this.bestCombo); }
    async revertToInitial() { if (this.adapter.initialSnapshot) await this.adapter.restoreSnapshot(this.adapter.initialSnapshot); }
    pause() { this.isPaused = true; if (this.onStatusChange) this.onStatusChange('paused'); }
    resume() { this.isPaused = false; if (this.onStatusChange) this.onStatusChange('running'); }
    stop() { this.isRunning = false; if (this.onStatusChange) this.onStatusChange('stopped'); }
  }

  // Inject HUD
  const adapter = new GloBusDOMAdapter();
  const optimizer = new GloBusOptimizer(adapter);

  const hudHtml = `
  <div id="globus-pilot-hud">
    <div class="hud-header" id="hud-drag-handle">
      <div class="hud-brand"><span>⚡ GloBus-Pilot</span><span class="hud-badge">Userscript</span></div>
      <div class="hud-actions">
        <button class="hud-icon-btn" id="hud-btn-minimize">_</button>
        <button class="hud-icon-btn" id="hud-btn-close">✕</button>
      </div>
    </div>
    <div class="hud-body">
      <div class="hud-status-card">
        <div class="hud-status-row">
          <span class="hud-status-title">Status</span>
          <span class="hud-status-badge status-idle" id="hud-status-pill">Idle</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1;" id="hud-status-desc">Ready to optimize decisions.</div>
      </div>
      <div class="hud-metrics-grid">
        <div class="hud-metric-box">
          <div class="hud-metric-label">Best EPS</div>
          <div class="hud-metric-val" id="hud-val-eps">$0.00</div>
          <div class="hud-metric-sub" id="hud-base-eps">Base: $0.00</div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">Best ROE</div>
          <div class="hud-metric-val" id="hud-val-roe">0.0%</div>
          <div class="hud-metric-sub" id="hud-base-roe">Base: 0.0%</div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">Ending Cash</div>
          <div class="hud-metric-val" id="hud-val-cash">$0k</div>
          <div class="hud-metric-sub">Buffer: Safe</div>
        </div>
        <div class="hud-metric-box">
          <div class="hud-metric-label">Credit / Image</div>
          <div class="hud-metric-val" id="hud-val-credit">-- / --</div>
          <div class="hud-metric-sub">Rating Target: A-</div>
        </div>
      </div>
      <div class="hud-control-group">
        <label class="hud-label">Strategy Objective</label>
        <select class="hud-select" id="hud-strategy-select">
          <option value="balanced" selected>🏆 Grand Champion (Balanced)</option>
          <option value="max_eps">🚀 Wall Street Bull (Max EPS)</option>
          <option value="volume_leader">📦 Low-Cost Volume Leader</option>
          <option value="premium_quality">💎 Premium Brand & P/Q</option>
        </select>
      </div>
      <button class="hud-btn-primary" id="hud-btn-start">⚡ Start Optimization</button>
      <div class="hud-btn-group">
        <button class="hud-btn-secondary" id="hud-btn-pause" disabled>⏸ Pause</button>
        <button class="hud-btn-secondary" id="hud-btn-apply">✓ Apply Best</button>
      </div>
      <div class="hud-btn-group">
        <button class="hud-btn-secondary hud-btn-danger" id="hud-btn-revert">↺ Revert Original</button>
        <button class="hud-btn-secondary" id="hud-btn-export">📥 Export JSON</button>
      </div>
      <div class="hud-footer">GloBus-Pilot AI • Program 21 Active</div>
    </div>
  </div>`;

  const container = document.createElement('div');
  container.innerHTML = hudHtml;
  document.body.appendChild(container.firstElementChild);

  const hud = document.getElementById('globus-pilot-hud');
  const dragHandle = document.getElementById('hud-drag-handle');
  const btnStart = document.getElementById('hud-btn-start');
  const btnPause = document.getElementById('hud-btn-pause');
  const btnApply = document.getElementById('hud-btn-apply');
  const btnRevert = document.getElementById('hud-btn-revert');
  const btnExport = document.getElementById('hud-btn-export');
  const strategySelect = document.getElementById('hud-strategy-select');
  const statusPill = document.getElementById('hud-status-pill');
  const statusDesc = document.getElementById('hud-status-desc');
  const valEPS = document.getElementById('hud-val-eps');
  const valROE = document.getElementById('hud-val-roe');
  const valCash = document.getElementById('hud-val-cash');
  const valCredit = document.getElementById('hud-val-credit');
  const baseEPS = document.getElementById('hud-base-eps');
  const baseROE = document.getElementById('hud-base-roe');

  // Dragging logic
  let isDrag = false, ox = 0, oy = 0;
  dragHandle.addEventListener('mousedown', e => {
    if (e.target.closest('.hud-icon-btn')) return;
    isDrag = true;
    ox = e.clientX - hud.getBoundingClientRect().left;
    oy = e.clientY - hud.getBoundingClientRect().top;
  });
  window.addEventListener('mousemove', e => {
    if (!isDrag) return;
    hud.style.left = `${Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, e.clientX - ox))}px`;
    hud.style.top = `${Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, e.clientY - oy))}px`;
    hud.style.right = 'auto';
  });
  window.addEventListener('mouseup', () => { isDrag = false; });

  document.getElementById('hud-btn-minimize').addEventListener('click', () => hud.classList.toggle('minimized'));
  document.getElementById('hud-btn-close').addEventListener('click', () => { hud.style.display = 'none'; });
  strategySelect.addEventListener('change', e => { optimizer.currentPreset = e.target.value; });

  optimizer.onStatusChange = (status) => {
    statusPill.className = `hud-status-badge status-${status}`;
    statusPill.textContent = status.toUpperCase();
    if (status === 'running') {
      btnStart.textContent = '⏹ Stop Optimization';
      btnStart.classList.add('hud-btn-danger');
      btnPause.disabled = false;
    } else {
      btnStart.textContent = '⚡ Start Optimization';
      btnStart.classList.remove('hud-btn-danger');
      btnPause.disabled = true;
    }
  };

  optimizer.onIterationUpdate = (iter, label) => {
    statusDesc.textContent = `Testing: ${label.slice(0, 22)} (Step ${iter})`;
  };

  optimizer.onNewBestScore = (score, metrics) => {
    if (!metrics) return;
    valEPS.textContent = `$${metrics.eps.toFixed(2)}`;
    valROE.textContent = `${metrics.roe.toFixed(1)}%`;
    valCash.textContent = `$${Math.round(metrics.endingCash).toLocaleString()}k`;
    valCredit.textContent = `${metrics.creditRating || '--'} / ${metrics.imageRating || '--'}`;
    if (optimizer.baselineMetrics) {
      baseEPS.textContent = `Base: $${optimizer.baselineMetrics.eps.toFixed(2)}`;
      baseROE.textContent = `Base: ${optimizer.baselineMetrics.roe.toFixed(1)}%`;
    }
  };

  btnStart.addEventListener('click', () => optimizer.isRunning ? optimizer.stop() : optimizer.start());
  btnPause.addEventListener('click', () => optimizer.isPaused ? optimizer.resume() : optimizer.pause());
  btnApply.addEventListener('click', () => optimizer.applyBest());
  btnRevert.addEventListener('click', () => optimizer.revertToInitial());
  btnExport.addEventListener('click', () => {
    if (!optimizer.bestCombo) return alert('No optimized decisions yet!');
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(optimizer.bestCombo, null, 2));
    a.download = `globus_decisions_${Date.now()}.json`;
    a.click();
  });

  // Probe initial
  setTimeout(() => {
    const init = adapter.getProjectedMetrics();
    if (init && init.eps > 0) {
      valEPS.textContent = `$${init.eps.toFixed(2)}`;
      valROE.textContent = `${init.roe.toFixed(1)}%`;
      valCash.textContent = `$${Math.round(init.endingCash).toLocaleString()}k`;
      valCredit.textContent = `${init.creditRating || '--'} / ${init.imageRating || '--'}`;
      baseEPS.textContent = `Base: $${init.eps.toFixed(2)}`;
      baseROE.textContent = `Base: ${init.roe.toFixed(1)}%`;
    }
  }, 600);
})();
