/**
 * GloBus-Pilot: DOM Adapter
 * Interacts with GLO-BUS Program 21 Decision Pages:
 * - Product Design (Camera & Drone components, R&D)
 * - Marketing (Regional pricing, advertising, promotions, warranties)
 * - Compensation & Assembly / Workforce
 * - Corporate Social Responsibility (CSR)
 * - Finance & Cash Flow
 */

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

  /**
   * Scrapes all editable inputs and select elements on the current decision screen
   */
  getDecisionInputs() {
    const inputs = [];

    // Form text and number inputs
    const inputElements = document.querySelectorAll(
      'input.input-field, input.entry-input, input[type="text"]:not([readonly]):not([disabled]), input[type="number"]:not([readonly]):not([disabled])'
    );

    inputElements.forEach((el, index) => {
      // Exclude search bars, login fields, or optimizer's own HUD inputs
      if (el.closest('#globus-pilot-hud') || el.name === 'q' || el.type === 'hidden') return;

      const id = el.id || el.name || `input_${index}`;
      const name = el.name || el.id || `Field_${index}`;
      const label = this.findLabel(el);
      const rawVal = parseFloat(el.value.replace(/[^0-9.-]/g, ''));
      const val = isNaN(rawVal) ? 0 : rawVal;

      // Extract min / max / step bounds based on context or attributes
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

    // Dropdown selects (e.g. Warranty, Sensor, Frame, Modes, Software)
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

  /**
   * Tries to find descriptive text or label for the input element
   */
  findLabel(element) {
    if (element.title) return element.title;
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');

    // Check enclosing or previous table header / td
    const cell = element.closest('td');
    if (cell) {
      const row = cell.closest('tr');
      if (row) {
        const rowLabel = row.querySelector('th, td:first-child');
        if (rowLabel && rowLabel !== cell) {
          const colIndex = Array.from(row.children).indexOf(cell);
          const table = row.closest('table');
          let colHeader = '';
          if (table) {
            const headerRow = table.querySelector('thead tr, tr:first-child');
            if (headerRow && headerRow.children[colIndex]) {
              colHeader = ' [' + headerRow.children[colIndex].textContent.trim().replace(/\s+/g, ' ') + ']';
            }
          }
          return rowLabel.textContent.trim().replace(/\s+/g, ' ') + colHeader;
        }
      }
    }

    if (element.id) {
      const labelEl = document.querySelector(`label[for="${element.id}"]`);
      if (labelEl) return labelEl.textContent.trim();
    }

    return element.name || element.id || 'Decision Field';
  }

  /**
   * Infer sensible optimization bounds & step increments based on Glo-Bus field semantics
   */
  inferBounds(el, name, label, currentVal) {
    const l = (name + ' ' + label).toLowerCase();

    // R&D expenditure (Product Design)
    if (l.includes('r&d') || l.includes('research')) {
      return { min: 0, max: 50000, step: 2500, category: 'rd' };
    }
    // Prices (Camera: $100-$1000, Drone: $400-$3000)
    if (l.includes('price') || l.includes('retail')) {
      if (l.includes('drone') || l.includes('uav')) {
        return { min: Math.max(200, currentVal - 400), max: currentVal + 600, step: 10, category: 'price' };
      }
      return { min: Math.max(50, currentVal - 150), max: currentVal + 250, step: 5, category: 'price' };
    }
    // Advertising budget ($000s)
    if (l.includes('advert') || l.includes('promo') || l.includes('search')) {
      return { min: 0, max: Math.max(currentVal * 2.5, 10000), step: 250, category: 'marketing' };
    }
    // Retailer support / discount
    if (l.includes('discount') || l.includes('support')) {
      return { min: 0, max: 25, step: 1, category: 'discount' };
    }
    // Warranty (days / years)
    if (l.includes('warranty')) {
      return { min: 0, max: 3, step: 1, category: 'warranty' };
    }
    // Wages & compensation
    if (l.includes('wage') || l.includes('salary')) {
      return { min: Math.max(0, currentVal * 0.8), max: currentVal * 1.5, step: 500, category: 'compensation' };
    }
    if (l.includes('incentive') || l.includes('bonus')) {
      return { min: 0, max: Math.max(currentVal * 2, 10), step: 0.5, category: 'compensation' };
    }

    // Default fallback: allow +/- 30% variation around current value
    const span = Math.max(Math.abs(currentVal) * 0.35, 10);
    return {
      min: Math.max(0, currentVal - span),
      max: currentVal + span,
      step: span > 100 ? 50 : (span > 20 ? 5 : 1),
      category: 'general'
    };
  }

  /**
   * Sets input value and emits required browser events to notify Glo-Bus's UI
   */
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

  /**
   * Triggers the page's calculation/update button
   */
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
        // Many modern Glo-Bus screens update automatically upon blur/change events.
        // Also fire an event on the body to trigger any debounced watchers
        document.body.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Allow DOM & Glo-Bus calculation engine to finish
      setTimeout(resolve, 350);
    });
  }

  /**
   * Scrapes live projected metrics from the scoreboard table
   */
  getProjectedMetrics() {
    const metrics = {
      eps: 0,
      roe: 0,
      stockPrice: 0,
      creditRating: 'B',
      creditRatingScore: 50,
      imageRating: 0,
      endingCash: 0,
      netRevenue: 0,
      netProfit: 0,
      cameraPQ: null,
      dronePQ: null,
      timestamp: Date.now()
    };

    // Credit rating mapping to numerical scale (0 to 100)
    const creditMap = {
      'A+': 100, 'A': 95, 'A-': 90,
      'B+': 82, 'B': 75, 'B-': 68,
      'C+': 58, 'C': 50, 'C-': 40,
      'D': 25, 'F': 0
    };

    // Look for scoreboard cells
    // Strategy 1: Look for table rows with td.measure and td.score
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
        const ratingMatch = rawText.match(/[A-DF][+-]?/i);
        if (ratingMatch) {
          const rating = ratingMatch[0].toUpperCase();
          metrics.creditRating = rating;
          metrics.creditRatingScore = creditMap[rating] || 50;
        }
      } else if (label.includes('image rating')) {
        if (!isNaN(numVal)) metrics.imageRating = numVal;
      } else if (label.includes('ending cash') || label.includes('cash balance') || label === 'cash') {
        if (!isNaN(numVal)) metrics.endingCash = numVal;
      } else if (label.includes('net revenue') || label.includes('total revenue')) {
        if (!isNaN(numVal)) metrics.netRevenue = numVal;
      } else if (label.includes('net profit') || label.includes('net income')) {
        if (!isNaN(numVal)) metrics.netProfit = numVal;
      } else if (label.includes('camera p/q') || label.includes('ac camera p/q')) {
        if (!isNaN(numVal)) metrics.cameraPQ = numVal;
      } else if (label.includes('drone p/q') || label.includes('uav drone p/q')) {
        if (!isNaN(numVal)) metrics.dronePQ = numVal;
      }
    });

    // Strategy 2: Check header bar or summary card elements if standard table was not found
    if (metrics.eps === 0) {
      document.querySelectorAll('.projected-metrics, .projection-box, .scoreboard, [class*="metric"]').forEach(box => {
        const text = box.innerText.toLowerCase();
        const epsMatch = text.match(/eps[:\s]*\$?([0-9.]+)/i);
        if (epsMatch) metrics.eps = parseFloat(epsMatch[1]);

        const roeMatch = text.match(/roe[:\s]*([0-9.]+)%/i);
        if (roeMatch) metrics.roe = parseFloat(roeMatch[1]);

        const cashMatch = text.match(/cash[:\s]*\$?([0-9.,-]+)/i);
        if (cashMatch) metrics.endingCash = parseFloat(cashMatch[1].replace(/,/g, ''));
      });
    }

    this.lastObservedMetrics = metrics;
    return metrics;
  }

  /**
   * Take a full snapshot of current page decisions
   */
  captureSnapshot() {
    const inputs = this.getDecisionInputs();
    const snapshot = {};
    inputs.forEach(i => {
      snapshot[i.id] = {
        id: i.id,
        name: i.name,
        type: i.type,
        value: i.type === 'select' ? i.selectedIndex : i.value
      };
    });
    if (!this.initialSnapshot) {
      this.initialSnapshot = JSON.parse(JSON.stringify(snapshot));
    }
    return snapshot;
  }

  /**
   * Restore decisions from snapshot
   */
  async restoreSnapshot(snapshot) {
    if (!snapshot) snapshot = this.initialSnapshot;
    if (!snapshot) return;

    const inputs = this.getDecisionInputs();
    inputs.forEach(item => {
      if (snapshot[item.id] !== undefined) {
        this.setInputValue(item, snapshot[item.id].value);
      }
    });

    await this.triggerCalculate();
  }
}

// Attach globally
window.gloBusDOMAdapter = new GloBusDOMAdapter();
