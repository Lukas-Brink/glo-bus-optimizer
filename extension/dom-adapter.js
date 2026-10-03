/**
 * GloBus-Pilot: High-Performance DOM Adapter with Frame Support & Live Diagnostics
 * Interacts with McGraw-Hill GLO-BUS Program 21 Decision Pages:
 * - Product Design (Camera & Drone components, R&D)
 * - Regional Marketing (Camera & Drone pricing, advertising, retailer support, warranties)
 * - Compensation & Facilities / Workforce
 * - Corporate Social Responsibility (CSR)
 * - Finance & Cash Flow
 */

// Centralized Logger
class GloBusLogger {
  constructor() {
    this.logs = [];
    this.listeners = [];
    try {
      if (typeof sessionStorage !== 'undefined') {
        const saved = sessionStorage.getItem('globus_pilot_recent_logs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) this.logs = parsed.slice(-10000);
        }
      }
    } catch (_) {}
  }

  log(level, tag, message, data = null) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      level, // 'info', 'success', 'warn', 'error', 'step'
      tag,
      message,
      data
    };
    this.logs.push(entry);
    // Keep complete session logs without dropping history (safety ceiling of 50,000 entries)
    if (this.logs.length > 50000) this.logs.shift();

    try {
      if (typeof sessionStorage !== 'undefined') {
        const persistentLogs = this.logs.slice(-5000);
        sessionStorage.setItem('globus_pilot_recent_logs', JSON.stringify(persistentLogs));
      }
    } catch (_) {}

    const colors = {
      info: '#38bdf8',
      success: '#34d399',
      warn: '#f59e0b',
      error: '#ef4444',
      step: '#a78bfa'
    };
    const c = colors[level] || '#94a3b8';
    if (typeof console !== 'undefined' && console.log) {
      console.log(`%c[GloBus-Pilot] [${entry.timestamp}] [${tag}] ${message}`, `color: ${c}; font-weight: bold;`, data || '');
    }

    this.listeners.forEach(fn => {
      try { fn(entry, this.logs); } catch (_) {}
    });
  }

  info(tag, msg, data) { this.log('info', tag, msg, data); }
  success(tag, msg, data) { this.log('success', tag, msg, data); }
  warn(tag, msg, data) { this.log('warn', tag, msg, data); }
  error(tag, msg, data) { this.log('error', tag, msg, data); }
  step(tag, msg, data) { this.log('step', tag, msg, data); }

  getLogs() { return this.logs; }

  getPlainText() {
    return this.logs.map(e => `[${e.timestamp}] [${e.level.toUpperCase()}] [${e.tag}] ${e.message} ${e.data ? JSON.stringify(e.data) : ''}`).join('\n');
  }

  addListener(fn) {
    this.listeners.push(fn);
    // If there are existing logs, immediately hydrate the listener
    if (this.logs.length > 0) {
      try { fn(null, this.logs); } catch (_) {}
    }
  }

  removeListener(fn) {
    const idx = this.listeners.indexOf(fn);
    if (idx !== -1) {
      this.listeners.splice(idx, 1);
    }
  }

  clear() {
    this.logs = [];
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('globus_pilot_recent_logs');
      }
    } catch (_) {}
    this.listeners.forEach(fn => {
      try { fn(null, []); } catch (_) {}
    });
  }
}

window.gloBusLogger = window.gloBusLogger || new GloBusLogger();
const logger = window.gloBusLogger;



class GloBusDOMAdapter {
  constructor() {
    this.initialSnapshot = null;
    this.lastObservedMetrics = null;
    this._lastDetectedPageType = null;
    this.cachedCalcBtn = null;
    this.cachedScoreboardRows = null;
    this.recentNotifications = [];
    this._activeInputLabel = null;
    this._notificationListeners = [];
    this._observedDocs = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();
    this._seenToastElements = typeof WeakSet !== 'undefined' ? new WeakSet() : new Set();
    // NOTE: pageType is a live getter — always reflects the current page.
    // Do NOT store it as a property; in-page tab navigation changes the page
    // without reconstructing the adapter, so a stored value would go stale.

    // Initialize Toastr & Site notification listener
    try {
      this.initNotificationListener();
    } catch (_) {}
  }

  /** Always reflects the currently active Glo-Bus decision page. Allows override for testing/mocking. */
  get pageType() {
    return this._pageTypeOverride || this.detectPageType();
  }

  set pageType(val) {
    this._pageTypeOverride = val;
  }

  clearDomCaches() {
    this.cachedCalcBtn = null;
    this.cachedScoreboardRows = null;
  }

  getAllDocuments() {
    const docs = [document];
    const visited = new Set(docs);
    const queue = [document];

    while (queue.length > 0) {
      const currentDoc = queue.shift();
      try {
        const frames = currentDoc.querySelectorAll('iframe, frame');
        frames.forEach(f => {
          try {
            const frameDoc = f.contentDocument || (f.contentWindow && f.contentWindow.document);
            if (frameDoc && !visited.has(frameDoc)) {
              visited.add(frameDoc);
              docs.push(frameDoc);
              queue.push(frameDoc);
            }
          } catch (_) {
            // Cross-origin or detached frame - safely ignored
          }
        });
      } catch (_) {}
    }
    return docs;
  }

  /**
   * Initializes real-time listening for site-level notifications:
   * 1. CodeSeven Toastr notifications (#toast-container, .toast, .toast-error, .toast-warning)
   * 2. In-page modal / validation alerts
   * 3. Native window.alert overrides across all frames/iframes
   */
  initNotificationListener() {
    this.attachToastObservers();
    this.wrapWindowAlerts();
  }

  attachToastObservers() {
    if (typeof MutationObserver === 'undefined') return;
    try {
      const docs = this.getAllDocuments();
      docs.forEach(doc => {
        if (!doc || !doc.body) return;
        try {
          if (this._observedDocs.has(doc)) return;
          this._observedDocs.add(doc);
        } catch (_) {}

        const observer = new MutationObserver(mutations => {
          this.handleDomMutations(mutations, doc);
        });

        observer.observe(doc.body, { childList: true, subtree: true });
        
        // Scan for any existing toasts already in the container
        this.scanDocumentForToasts(doc);
      });
    } catch (_) {}
  }

  handleDomMutations(mutations, doc) {
    if (!mutations || !Array.isArray(mutations)) return;
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      if (mutation.type === 'childList' && mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === 1 /* ELEMENT_NODE */) {
            this.inspectElementForNotification(node);
          }
        }
      }
    }
  }

  scanDocumentForToasts(doc) {
    try {
      if (!doc || typeof doc.querySelectorAll !== 'function') return;
      const toasts = doc.querySelectorAll('#toast-container .toast, .toast-container .toast, .toast');
      toasts.forEach(t => this.inspectElementForNotification(t));
    } catch (_) {}
  }

  inspectElementForNotification(el) {
    if (!el || typeof el.getAttribute !== 'function') return;
    try {
      if (this._seenToastElements.has(el)) return;
    } catch (_) {}

    // Check if element is a Toastr toast itself
    const classStr = (typeof el.getAttribute === 'function' ? el.getAttribute('class') : '') || '';
    const isToast = (el.classList && el.classList.contains && el.classList.contains('toast')) ||
                    classStr.includes('toast') ||
                    (el.id && el.id.includes('toast'));

    if (isToast && (classStr.includes('toast-error') || classStr.includes('toast-warning') || classStr.includes('toast-info') || classStr.includes('toast-success') || classStr.includes('toast '))) {
      try { this._seenToastElements.add(el); } catch (_) {}
      this.processToastElement(el);
    }

    // Also check any child toast elements
    if (typeof el.querySelectorAll === 'function') {
      try {
        const childToasts = el.querySelectorAll('#toast-container .toast, .toast-container .toast, .toast');
        childToasts.forEach(ct => {
          let seen = false;
          try { seen = this._seenToastElements.has(ct); } catch (_) {}
          if (!seen) {
            try { this._seenToastElements.add(ct); } catch (_) {}
            this.processToastElement(ct);
          }
        });
      } catch (_) {}
    }
  }

  processToastElement(toastEl) {
    if (!toastEl) return;

    // Determine severity
    const classList = toastEl.classList;
    const classStr = (typeof toastEl.getAttribute === 'function' ? toastEl.getAttribute('class') : '') || '';
    let level = 'warn';
    if (classStr.includes('error') || (classList && classList.contains && classList.contains('toast-error'))) {
      level = 'error';
    } else if (classStr.includes('warning') || (classList && classList.contains && classList.contains('toast-warning'))) {
      level = 'warn';
    } else if (classStr.includes('info') || (classList && classList.contains && classList.contains('toast-info'))) {
      level = 'info';
    } else if (classStr.includes('success') || (classList && classList.contains && classList.contains('toast-success'))) {
      level = 'success';
    }

    // Extract title
    let title = '';
    const titleEl = toastEl.querySelector ? toastEl.querySelector('.toast-title') : null;
    if (titleEl) {
      title = (titleEl.textContent || '').trim();
    }

    // Extract message
    let message = '';
    const msgEl = toastEl.querySelector ? toastEl.querySelector('.toast-message') : null;
    if (msgEl) {
      message = (msgEl.textContent || '').trim();
    } else {
      const clone = toastEl.cloneNode ? toastEl.cloneNode(true) : null;
      if (clone) {
        const closeBtn = clone.querySelector ? clone.querySelector('.toast-close-button, button') : null;
        if (closeBtn && closeBtn.remove) closeBtn.remove();
        const cloneTitle = clone.querySelector ? clone.querySelector('.toast-title') : null;
        if (cloneTitle && cloneTitle.remove) cloneTitle.remove();
        message = (clone.textContent || '').trim();
      } else {
        message = (toastEl.textContent || '').trim();
      }
    }

    if (!message && !title) return;

    // Auto-learn exact limits from standard Glo-Bus toast pattern:
    // "The <Input Name> must be a valid number between <MIN> and <MAX>."
    const activeItem = this._activeInputItem || this._lastActiveInputItem;
    const boundMatch = message.match(/must be a valid number between\s+(-?\d+(?:\.\d+)?)\s+and\s+(-?\d+(?:\.\d+)?)/i);
    if (boundMatch && activeItem) {
      const minB = parseFloat(boundMatch[1]);
      const maxB = parseFloat(boundMatch[2]);
      if (!isNaN(minB)) activeItem.min = minB;
      if (!isNaN(maxB)) activeItem.max = maxB;
      logger.info('BOUNDS-LEARNED', `Auto-calibrated [${activeItem.label || activeItem.name}] bounds from site toast: [${minB} .. ${maxB}]`);
    }

    const notification = {
      id: 'toast_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type: 'toast',
      level,
      title,
      message,
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString(),
      targetInput: this._activeInputLabel || null
    };

    this.recordSiteNotification(notification);
  }

  wrapWindowAlerts() {
    try {
      const docs = this.getAllDocuments();
      docs.forEach(doc => {
        const win = doc.defaultView;
        if (!win || win._globusPilotAlertWrapped) return;
        win._globusPilotAlertWrapped = true;

        win.alert = (alertMsg) => {
          const msgStr = String(alertMsg || '');
          const notification = {
            id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'alert',
            level: 'error',
            title: 'Site Dialog',
            message: msgStr,
            timestamp: Date.now(),
            timeString: new Date().toLocaleTimeString(),
            targetInput: this._activeInputLabel || null
          };
          this.recordSiteNotification(notification);
          return true;
        };
      });
    } catch (_) {}
  }

  recordSiteNotification(notification) {
    if (!notification) return;

    this.recentNotifications.push(notification);
    if (this.recentNotifications.length > 200) {
      this.recentNotifications.shift();
    }

    const tag = notification.type === 'alert' ? 'SITE_ALERT' : 'SITE_TOAST';
    const titlePrefix = notification.title ? `[${notification.title}] ` : '';
    const inputSuffix = notification.targetInput ? ` (on ${notification.targetInput})` : '';
    const fullMessage = `${titlePrefix}${notification.message}${inputSuffix}`;

    if (notification.level === 'error') {
      logger.error(tag, fullMessage, notification);
    } else if (notification.level === 'warn') {
      logger.warn(tag, fullMessage, notification);
    } else if (notification.level === 'success') {
      logger.success(tag, fullMessage, notification);
    } else {
      logger.info(tag, fullMessage, notification);
    }

    this._notificationListeners.forEach(fn => {
      try { fn(notification); } catch (_) {}
    });
  }

  getRecentNotifications(sinceMs = 5000) {
    const cutoff = Date.now() - sinceMs;
    return this.recentNotifications.filter(n => n.timestamp >= cutoff);
  }

  consumeRecentErrors(sinceMs = 3000) {
    const cutoff = Date.now() - sinceMs;
    const errors = this.recentNotifications.filter(
      n => n.timestamp >= cutoff && (n.level === 'error' || n.level === 'warn') && !n.consumed
    );
    errors.forEach(e => { e.consumed = true; });
    return errors;
  }

  clearActiveToasts() {
    try {
      const docs = this.getAllDocuments();
      docs.forEach(doc => {
        const toasts = doc.querySelectorAll ? doc.querySelectorAll('#toast-container .toast, .toast-container .toast, .toast') : [];
        toasts.forEach(t => {
          const closeBtn = t.querySelector ? t.querySelector('.toast-close-button') : null;
          if (closeBtn && typeof closeBtn.click === 'function') {
            closeBtn.click();
          } else if (typeof t.remove === 'function') {
            t.remove();
          }
        });
      });
    } catch (_) {}
  }

  onNotification(listener) {
    if (typeof listener === 'function') {
      this._notificationListeners.push(listener);
    }
  }

  matchSectionName(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.toLowerCase().trim();
    if (!t) return null;

    // 1. Product Design
    if (t.includes('product design') || t.includes('product-design') || t.includes('product_design') ||
        t.includes('/pds') || t.includes('pds.') || t.includes('pdesign') || t === 'pd' || t === 'panel-pd') {
      return 'PRODUCT_DESIGN';
    }

    // 2. UAV Drone Marketing (Must check before generic marketing)
    if (((t.includes('uav') || t.includes('drone')) && (t.includes('marketing') || t.includes('pricing') || t.includes('region'))) ||
        t.includes('uav drone marketing') || t.includes('drone marketing') || t.includes('uav marketing') ||
        t.includes('/uavm') || t.includes('uavm.') || t === 'dm' || t === 'panel-dm') {
      return 'UAV_MARKETING';
    }

    // 3. AC Camera Marketing
    if (((t.includes('camera') || t.includes('acc') || t.includes('ac ')) && (t.includes('marketing') || t.includes('pricing') || t.includes('region'))) ||
        t.includes('ac camera marketing') || t.includes('camera marketing') || t.includes('ac marketing') ||
        t.includes('/acm') || t.includes('acm.') || t === 'cm' || t === 'panel-cm') {
      return 'AC_MARKETING';
    }

    // 4. Compensation & Facilities / Workforce
    if (t.includes('compensation') || t.includes('facility') || t.includes('facilities') ||
        t.includes('assembly') || t.includes('workforce') || t.includes('/wfc') || t.includes('wfc.') || t === 'wf' || t === 'panel-wf') {
      return 'COMPENSATION_FACILITIES';
    }

    // 5. Special Contract Offers
    if (t.includes('special contract') || t.includes('contract offer') || t.includes('special offer') ||
        t.includes('contract offers') || t.includes('/sco') || t.includes('sco.') || t === 'sco' || t === 'panel-sco') {
      return 'SPECIAL_CONTRACTS';
    }

    // 6. Corporate Social Responsibility (CSR)
    if (t.includes('corporate citizenship') || t.includes('citizenship') || t.includes('corporate social') ||
        t.includes('csr') || t.includes('/csrc') || t.includes('csrc.') || t === 'csr' || t === 'panel-csr') {
      return 'CSR';
    }

    // 7. Finance & Cash Flow
    if (t.includes('finance') || t.includes('cash flow') || t.includes('cash_flow') ||
        t.includes('/fin') || t.includes('fin.') || t === 'fin' || t === 'panel-fin') {
      return 'FINANCE';
    }

    // Generic marketing fallback
    if (t.includes('marketing') || t.includes('/mkt')) {
      return 'AC_MARKETING';
    }

    return null;
  }

  detectPageType() {
    let detected = null;
    const docs = this.getAllDocuments();

    // Strategy 1: Active navigation links, tabs, or sidebar indicators across all documents
    for (const doc of docs) {
      if (detected) break;
      try {
        const activeNavSelectors = [
          '.tab-nav li a.active',
          '.tab-nav a.active',
          '#sidebar a.active',
          '#sidebar li.active a',
          '#left-menu a.active',
          '#left-menu li.active a',
          '#leftmenu a.active',
          '.sidebar a.active',
          'nav a.active',
          '[role="navigation"] a.active',
          '.left_nav a.active',
          '.nav a.active',
          'li.nav-item.active a',
          'li.active a',
          'a.selected',
          'li.selected a',
          '[role="tab"][aria-selected="true"]',
          '[aria-current="page"]'
        ];
        const activeEls = doc.querySelectorAll(activeNavSelectors.join(', '));
        for (const el of activeEls) {
          if (el.closest && el.closest('#globus-pilot-hud')) continue;
          const text = (el.textContent || el.innerText || '').trim();
          const target = (el.getAttribute && el.getAttribute('data-target')) || '';
          const href = (el.getAttribute && el.getAttribute('href')) || '';
          const titleAttr = (el.getAttribute && el.getAttribute('title')) || '';
          const onclickAttr = (el.getAttribute && el.getAttribute('onclick')) || '';
          const match = this.matchSectionName(`${text} ${target} ${href} ${titleAttr} ${onclickAttr}`);
          if (match) {
            detected = match;
            break;
          }
        }
      } catch (_) {}
    }

    // Strategy 2: Active or visible content panels and headings
    if (!detected) {
      for (const doc of docs) {
        if (detected) break;
        try {
          // Look in active panel containers
          const activePanels = doc.querySelectorAll('.panel.active, .tab-pane.active, div[role="tabpanel"].active, .tab-content > .active, div[id^="panel-"].active');
          for (const p of activePanels) {
            const heading = p.querySelector('h1, h2, h3, .panel-title, .page-title, th.header');
            const hText = heading ? (heading.textContent || '') : '';
            const pId = p.id || '';
            const match = this.matchSectionName(`${hText} ${pId}`);
            if (match) {
              detected = match;
              break;
            }
          }
          if (detected) break;

          // Look in prominent visible page headers / titles
          const headings = doc.querySelectorAll('h1, h2, .page-title, #pageTitle, #page-header, .page-header, .content-header');
          for (const h of headings) {
            if (h.closest && h.closest('#globus-pilot-hud')) continue;
            if (h.offsetParent !== null || (h.offsetWidth && h.offsetWidth > 0)) {
              const text = (h.textContent || '').trim();
              const match = this.matchSectionName(text);
              if (match) {
                detected = match;
                break;
              }
            }
          }
        } catch (_) {}
      }
    }

    // Strategy 3: Child frame locations and titles
    if (!detected) {
      for (const doc of docs) {
        if (typeof document !== 'undefined' && doc === document) continue;
        try {
          const loc = doc.location ? (doc.location.pathname + doc.location.search + (doc.location.hash || '')) : '';
          const title = doc.title || '';
          const match = this.matchSectionName(`${loc} ${title}`);
          if (match) {
            detected = match;
            break;
          }
        } catch (_) {}
      }
    }

    // Strategy 4: Distinctive editable form input and select names/IDs in document
    if (!detected) {
      for (const doc of docs) {
        if (detected) break;
        try {
          const inputs = doc.querySelectorAll('input:not([type="hidden"]), select');
          for (const inp of inputs) {
            if (inp.closest && inp.closest('#globus-pilot-hud')) continue;
            const nameId = `${inp.name || ''} ${inp.id || ''}`.toLowerCase();
            if (nameId.includes('cameramodel') || nameId.includes('photoquality') || nameId.includes('camerahousing')) {
              detected = 'PRODUCT_DESIGN'; break;
            } else if (nameId.includes('droneprice') || nameId.includes('uavmodel') || nameId.includes('dronefeature')) {
              detected = 'UAV_MARKETING'; break;
            } else if (nameId.includes('naprice') || nameId.includes('eaprice') || nameId.includes('apprice') || nameId.includes('laprice') || nameId.includes('cameraprice')) {
              detected = 'AC_MARKETING'; break;
            } else if (nameId.includes('basewage') || nameId.includes('workstation') || nameId.includes('fringebenefit') || nameId.includes('attendancebonus')) {
              detected = 'COMPENSATION_FACILITIES'; break;
            } else if (nameId.includes('specialcontract') || nameId.includes('bidprice') || nameId.includes('contractoffer')) {
              detected = 'SPECIAL_CONTRACTS'; break;
            } else if (nameId.includes('charitabledonation') || nameId.includes('greeninitiative') || nameId.includes('ethictraining')) {
              detected = 'CSR'; break;
            } else if (nameId.includes('sharerepurchase') || nameId.includes('repurchase') || nameId.includes('dividend') || nameId.includes('earlyrepayment')) {
              detected = 'FINANCE'; break;
            }
          }
        } catch (_) {}
      }
    }

    // Strategy 5: Top window location and title
    if (!detected) {
      const loc = typeof window !== 'undefined' && window.location ? (window.location.pathname + window.location.search + (window.location.hash || '')) : '';
      const title = typeof document !== 'undefined' ? (document.title || '') : '';
      detected = this.matchSectionName(`${loc} ${title}`);
    }

    detected = detected || 'GENERAL_DECISION';

    if (this._lastDetectedPageType && this._lastDetectedPageType !== detected) {
      this.clearDomCaches();
    }
    this._lastDetectedPageType = detected;
    return detected;
  }

  /**
   * Scrapes all editable decision inputs and dropdowns across document and child iframes
   */
  getDecisionInputs() {
    const inputs = [];
    const docs = this.getAllDocuments();

    docs.forEach(doc => {
      // 1. Form text and number inputs
      const inputElements = doc.querySelectorAll(
        'input.input-field, input.entry-input, input[type="text"]:not([readonly]):not([disabled]), input[type="number"]:not([readonly]):not([disabled]), input[type="range"]:not([readonly]):not([disabled])'
      );

      inputElements.forEach((el, index) => {
        if ((typeof el.closest === 'function' && el.closest('#globus-pilot-hud')) || el.name === 'q' || el.type === 'hidden') return;

        const id = el.id || el.name || `input_${index}`;
        const name = el.name || el.id || `Field_${index}`;
        const label = this.findLabel(el);
        const normalizedLabel = label.toLowerCase().trim();
        const idLower = String(el.id || '').toLowerCase();
        const nameLower = String(el.name || '').toLowerCase();

        // Ignore system messages, feedback prompts, CSRF tokens, search/login inputs, and simulation assumptions
        if (['message', 'msg', 'csrf', 'token', 'search', 'password', 'login'].includes(normalizedLabel) ||
            ['message', 'msg', 'csrf', 'token', 'notice'].includes(nameLower) ||
            ['message', 'msg', 'notice'].includes(idLower) ||
            normalizedLabel.includes('incorporate') || normalizedLabel.includes('projected outcome') || normalizedLabel.includes('assumption') ||
            nameLower.includes('incorporate') || nameLower.includes('assumption') ||
            idLower.includes('incorporate') || idLower.includes('assumption')) {
          return;
        }

        // Parse numeric value, supporting negative and commas
        let rawStr = String(el.value || '0').trim();
        if (rawStr.startsWith('(') && rawStr.endsWith(')')) {
          rawStr = '-' + rawStr.slice(1, -1);
        }
        const rawVal = parseFloat(rawStr.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
        const val = Number.isFinite(rawVal) ? rawVal : 0;
        const bounds = this.inferBounds(el, name, label, val);

        inputs.push({
          element: el,
          type: 'input',
          id: id,
          name: name,
          key: `${this.pageType}.${id}_${index}`,
          label: label,
          value: val,
          min: bounds.min,
          max: bounds.max,
          step: bounds.step,
          category: bounds.category
        });
      });

      // 2. Dropdown selects
      const selectElements = doc.querySelectorAll('select:not([disabled]):not(.entry-assumptions-select)');
      selectElements.forEach((el, index) => {
        if (typeof el.closest === 'function' && el.closest('#globus-pilot-hud')) return;

        const id = el.id || el.name || `select_${index}`;
        const name = el.name || el.id || `Select_${index}`;
        const label = this.findLabel(el);
        const lLower = label.toLowerCase().trim();
        const idLower = String(id).toLowerCase();
        const nameLower = String(name).toLowerCase();

        // Strictly ignore simulation assumption dropdowns (e.g. Special Contracts "Incorporate projected outcomes into Y9 projections")
        const hasAssumpClass = el.classList && typeof el.classList.contains === 'function' &&
          (el.classList.contains('entry-assumptions-select') || el.classList.contains('assumptions-select'));

        if (lLower.includes('incorporate') || lLower.includes('projected outcome') || lLower.includes('assumption') || lLower.includes('probability of winning') ||
            nameLower.includes('incorporate') || nameLower.includes('assumption') ||
            idLower.includes('incorporate') || idLower.includes('assumption') ||
            hasAssumpClass) {
          return;
        }

        if (!el.options) return;

        const options = Array.from(el.options).map(opt => ({
          text: (opt.textContent || opt.value || '').trim(),
          value: opt.value,
          index: opt.index
        }));

        if (options.length > 1) {
          // Infer semantic category from the label, same as text inputs.
          // Without this, every <select> gets 'dropdown' and CSR/warranty/price
          // selects are invisible to category-specific optimizer logic.
          const lLower = label.toLowerCase();
          let selectCategory = 'dropdown';
          if (lLower.includes('charit') || lLower.includes('green') || lLower.includes('safety') ||
              lLower.includes('renewable') || lLower.includes('energy') || lLower.includes('child care') ||
              lLower.includes('cafeteria') || lLower.includes('supplier') || lLower.includes('conduct') ||
              lLower.includes('csr') || lLower.includes('citizenship') || lLower.includes('audit')) {
            selectCategory = 'csr';
          } else if (lLower.includes('warranty')) {
            selectCategory = 'warranty';
          } else if (lLower.includes('price') || lLower.includes('wholesale') || lLower.includes('retail price')) {
            selectCategory = 'price';
          } else if (lLower.includes('promo') || lLower.includes('discount') && lLower.includes('week')) {
            selectCategory = 'discount';
          }

          inputs.push({
            element: el,
            type: 'select',
            id: id,
            name: name,
            key: `${this.pageType}.${id}_${index}`,
            label: label,
            selectedIndex: el.selectedIndex,
            value: el.value,
            options: options,
            min: 0,
            max: options.length - 1,
            step: 1,
            category: selectCategory
          });
        }
      });
    });

    return inputs;
  }

  /**
   * Intelligently resolves human-readable label and column context for an input
   */
  findLabel(element) {
    if (element.title) return element.title.trim();
    if (typeof element.getAttribute === 'function' && element.getAttribute('aria-label')) return element.getAttribute('aria-label').trim();

    const cell = typeof element.closest === 'function' ? element.closest('td, th') : null;
    if (cell) {
      const row = typeof cell.closest === 'function' ? cell.closest('tr') : null;
      if (row) {
        const rowHeader = row.querySelector('th, td:first-child');
        const rowTitle = rowHeader && rowHeader !== cell ? rowHeader.textContent.trim().replace(/\s+/g, ' ') : '';
        const table = typeof row.closest === 'function' ? row.closest('table') : null;
        let colTitle = '';
        if (table) {
          const colIndex = Array.from(row.children).indexOf(cell);
          const headerRow = table.querySelector('thead tr, tr:first-child');
          if (headerRow && headerRow.children[colIndex] && headerRow.children[colIndex] !== cell) {
            colTitle = headerRow.children[colIndex].textContent.trim().replace(/\s+/g, ' ');
          }
        }
        if (rowTitle && colTitle) return `${rowTitle} (${colTitle})`;
        if (rowTitle) return rowTitle;
      }
    }

    if (element.id) {
      const doc = element.ownerDocument || document;
      const labelEl = doc.querySelector ? doc.querySelector(`label[for="${element.id}"]`) : null;
      if (labelEl) return labelEl.textContent.trim().replace(/\s+/g, ' ');
    }

    const parentGroup = typeof element.closest === 'function' ? element.closest('.form-group, .form-row, fieldset, p, div') : null;
    if (parentGroup) {
      const labelEl = parentGroup.querySelector ? parentGroup.querySelector('label, .control-label, legend, span') : null;
      if (labelEl && labelEl !== element) return labelEl.textContent.trim().replace(/\s+/g, ' ');
    }

    return element.name || element.id || 'Decision Field';
  }

  /**
   * Intelligently extracts dynamic board-set limits or range constraints from surrounding DOM
   */
  extractNearbyLimit(element) {
    if (!element) return null;

    const candidates = [];

    // 1. Element attributes
    if (typeof element.getAttribute === 'function') {
      if (element.getAttribute('data-max')) candidates.push(element.getAttribute('data-max'));
      if (element.getAttribute('max')) candidates.push(element.getAttribute('max'));
      if (element.getAttribute('title')) candidates.push(element.getAttribute('title'));
      if (element.getAttribute('placeholder')) candidates.push(element.getAttribute('placeholder'));
    }

    // 2. Immediate parent / cell text
    const cell = element.closest ? element.closest('td, th, .form-group, .form-row, div') : null;
    if (cell) {
      candidates.push(cell.textContent);
    }

    // 3. Table row context: check row directly below / above (standard Glo-Bus pattern for limits)
    const row = element.closest ? element.closest('tr') : null;
    let colIndex = -1;
    if (row && row.parentElement) {
      const children = row.children ? Array.from(row.children) : [];
      colIndex = cell ? children.indexOf(cell) : -1;
      const nextRow = row.nextElementSibling;
      if (nextRow) {
        if (colIndex >= 0 && nextRow.children && nextRow.children[colIndex]) {
          candidates.push(nextRow.children[colIndex].textContent);
        }
        if (/max|limit|allowed|ceiling|space|available|between/i.test(nextRow.textContent)) {
          candidates.push(nextRow.textContent);
        }
      }
      const prevRow = row.previousElementSibling;
      if (prevRow) {
        if (colIndex >= 0 && prevRow.children && prevRow.children[colIndex]) {
          candidates.push(prevRow.children[colIndex].textContent);
        }
        if (/max|limit|allowed|ceiling|space|available|between/i.test(prevRow.textContent)) {
          candidates.push(prevRow.textContent);
        }
      }

      // 3b. Scan entire table columns for workstation space available / capacity limits
      const table = row.closest ? row.closest('table') : null;
      if (table && colIndex >= 0) {
        const allTrs = table.querySelectorAll('tr');
        allTrs.forEach(r => {
          if (/space|available|capacity|limit|between/i.test(r.textContent)) {
            if (r.children && r.children[colIndex]) {
              candidates.push(r.children[colIndex].textContent);
            }
            candidates.push(r.textContent);
          }
        });
      }
    }

    // 4. Sibling elements
    let sib = element.nextElementSibling;
    while (sib) {
      candidates.push(sib.textContent);
      sib = sib.nextElementSibling;
    }

    // Regex patterns for explicit limits
    const patterns = [
      /(?:maximum|max(?:\.|\s+allowed)?|board\s+limit|ceiling|up\s+to)[:\s]*([0-9,]+(?:\.\d+)?)/i,
      /\(\s*(?:max(?:\.|\s+allowed)?[:\s]*|0\s*to\s*)([0-9,]+(?:\.\d+)?)\s*\)/i,
      /between\s+[0-9.]+\s+and\s+([0-9,]+(?:\.\d+)?)/i,
      /(?:space\s+available|available\s+space|space\s+for\s+up\s+to|workstation\s+space|available\s+workstations?|available)[:\s]*([0-9,]+(?:\.\d+)?)/i,
      /\b(?:0\s*-\s*|0\s*to\s*)([0-9,]+(?:\.\d+)?)\b/i,
      /(?:max|maximum)\s*=\s*([0-9,]+(?:\.\d+)?)/i,
      /\b([0-9,]+(?:\.\d+)?)\s*(?:max|maximum|available|allowed)\b/i,
      /range[:\s]*\[?[0-9.]+\s*-\s*([0-9,]+(?:\.\d+)?)/i,
      /^\s*([0-9,]+(?:\.\d+)?)\s*$/
    ];

    for (const text of candidates) {
      if (!text) continue;
      for (const pat of patterns) {
        const m = text.match(pat);
        if (m && m[1]) {
          const num = parseFloat(m[1].replace(/,/g, ''));
          if (Number.isFinite(num) && num >= 0) {
            return num;
          }
        }
      }
    }

    return null;
  }

  /**
   * Provides domain-informed bounds and step sizes for all Glo-Bus variables
   */
  inferBounds(el, name, label, currentVal) {
    const l = `${name || ''} ${label || ''}`.toLowerCase();

    const nativeMin = (el && typeof el.getAttribute === 'function') ? (el.getAttribute('min') !== null ? parseFloat(el.getAttribute('min')) : null) : null;
    const nativeMax = (el && typeof el.getAttribute === 'function') ? (el.getAttribute('max') !== null ? parseFloat(el.getAttribute('max')) : null) : null;
    const nativeStep = (el && typeof el.getAttribute === 'function') ? (el.getAttribute('step') !== null ? parseFloat(el.getAttribute('step')) : null) : null;

    let min = 0;
    let max = 100;
    let step = 1;
    let category = 'general';
    let isInteger = false;

    const safeVal = Number.isFinite(currentVal) ? currentVal : 0;
    const nearbyLimit = this.extractNearbyLimit(el);

    if (l.includes('r&d') || l.includes('research')) {
      min = 0; max = 50000; step = 2500; category = 'rd';
    } else if (l.includes('price') || l.includes('retail price') || l.includes('wholesale')) {
      category = 'price';
      const activePage = this.pageType || (this.detectPageType ? this.detectPageType() : '');
      const isDronePrice = activePage === 'UAV_MARKETING' || l.includes('drone') || l.includes('uav');
      if (isDronePrice) {
        min = 400; max = 3000; step = 10;
      } else {
        min = 100; max = 900; step = 5;
      }
    } else if (l.includes('charit') || l.includes('green') || l.includes('safety') || l.includes('audit') ||
               l.includes('renewable') || l.includes('energy') || l.includes('child care') || l.includes('cafeteria') ||
               l.includes('supplier') || l.includes('conduct') || l.includes('csr') || l.includes('citizenship')) {
      category = 'csr';
      if (l.includes('%') || l.includes('percent')) {
        min = 0; max = 5; step = 1;
      } else if (l.includes('green') || l.includes('safety') || l.includes('child') || l.includes('cafeteria') ||
                 l.includes('supplier') || l.includes('conduct') || l.includes('renewable') || l.includes('energy') ||
                 (nativeMax !== null && nativeMax <= 5)) {
        // Binary program toggle (0 = No, 1 = Yes) or tiered level (0 to 3)
        min = 0;
        max = nativeMax !== null ? nativeMax : (nearbyLimit !== null && nearbyLimit <= 5 ? nearbyLimit : 1);
        step = 1;
      } else {
        // Total dollar donations ($000s)
        min = 0; max = nearbyLimit !== null ? nearbyLimit : 5000; step = 250;
      }
    } else if (l.includes('website') || l.includes('display')) {
      min = 0; max = 5000; step = 250; category = 'marketing';
    } else if (l.includes('advert') || l.includes('promo') || l.includes('search')) {
      min = 0; max = Math.max(safeVal * 2.5, 12000); step = 250; category = 'marketing';
    } else if (l.includes('discount')) {
      const isSpecialContract = this.pageType === 'SPECIAL_CONTRACTS' || l.includes('special') || l.includes('contract') || l.includes('offer');
      min = 0;
      max = isSpecialContract ? 35 : 25;
      step = 1;
      category = isSpecialContract ? 'special_contract_discount' : 'discount';
    } else if (l.includes('support')) {
      min = 0; max = Math.max(safeVal * 2.5, 6000); step = 100; category = 'marketing';
    } else if (l.includes('warranty')) {
      min = 0; max = 36; step = 6; category = 'warranty';
    } else if (l.includes('wage') || l.includes('salary')) {
      min = 20000; max = 45000; step = 500; category = 'compensation';
    } else if (l.includes('incentive')) {
      min = 0.50; max = 8.00; step = 0.25; category = 'compensation';
    } else if (l.includes('fringe') || l.includes('benefit')) {
      min = 1000; max = 5000; step = 250; category = 'compensation';
    } else if (l.includes('bonus')) {
      min = 0; max = 3000; step = 100; category = 'compensation';
    } else if (l.includes('training')) {
      min = 0; max = 3000; step = 250; category = 'compensation';
    } else if (l.includes('overtime')) {
      min = 0; max = 25; step = 5; category = 'compensation';
    } else if (l.includes('workstation')) {
      category = 'facilities';
      isInteger = true;
      // Plant capacity ceiling: if detected from nearby DOM text/table, respect it strictly.
      const ceiling = nearbyLimit !== null ? nearbyLimit : ((nativeMax !== null && nativeMax > 0) ? nativeMax : Math.min(Math.max(safeVal * 1.5, 10), 25));
      min = 0;
      max = ceiling;
      step = 1;
    } else if (l.includes('repurchase') || l.includes('buyback')) {
      category = 'finance';
      // In Glo-Bus, share repurchases are entered in thousands of shares (0 to Board limit)
      const ceiling = nearbyLimit !== null ? nearbyLimit : ((nativeMax && nativeMax > 10) ? nativeMax : 500);
      if (l.includes('%') || (nativeMax && nativeMax <= 10)) {
        min = 0; max = Math.min(ceiling, 5.0); step = 0.5;
      } else {
        min = 0;
        max = ceiling;
        step = Math.max(10, Math.min(25, Math.round(max / 10)));
      }
    } else if (l.includes('dividend')) {
      min = 0.0; max = nearbyLimit !== null ? nearbyLimit : Math.max(safeVal * 3, 5.0); step = 0.10; category = 'finance';
    } else if (l.includes('issue') && (l.includes('stock') || l.includes('share'))) {
      category = 'finance';
      // Issuing stock dilutes EPS/ROE and is strictly prohibited in the same year as repurchases.
      // If safeVal is 0, clamp max to 0 so optimizer never tests positive issue values.
      // If safeVal > 0, permit testing downward towards 0 to accretively boost EPS.
      min = 0;
      max = safeVal > 0 ? safeVal : (nearbyLimit !== null ? nearbyLimit : 0);
      step = 100;
    } else if (l.includes('excess cash') || l.includes('early repayment') || l.includes('retire debt')) {
      category = 'finance';
      // Early loan repayment cannot exceed outstanding debt
      min = 0;
      max = nearbyLimit !== null ? nearbyLimit : Math.max(safeVal, 0);
      step = max > 0 ? Math.max(100, Math.round(max / 10)) : 100;
    } else if (l.includes('loan') || l.includes('debt') || l.includes('borrow')) {
      min = 0; max = nearbyLimit !== null ? nearbyLimit : Math.max(safeVal * 2, 35000); step = 1000; category = 'finance';
    } else if (l.includes('contract') || l.includes('offer') || l.includes('bid')) {
      if (l.includes('price')) {
        min = 100; max = 900; step = 5; category = 'price';
      } else if (l.includes('unit') || l.includes('quantity')) {
        min = 0; max = Math.max(safeVal * 2, 50000); step = 100; category = 'contract';
      } else {
        const span = Math.max(Math.abs(safeVal) * 0.35, 10);
        min = Math.max(0, safeVal - span);
        max = safeVal + span;
        step = span > 100 ? 50 : 5;
        category = 'contract';
      }
    } else {
      const span = Math.max(Math.abs(safeVal) * 0.4, 10);
      min = Math.max(0, safeVal - span);
      max = safeVal + span;
      step = span > 200 ? 50 : (span > 20 ? 5 : 1);
    }

    const resolvedMin = Number.isFinite(nativeMin) ? nativeMin : min;
    const resolvedMax = Number.isFinite(nativeMax) ? nativeMax : max;
    const resolvedStep = Number.isFinite(nativeStep) && nativeStep > 0 ? nativeStep : step;

    return {
      min: resolvedMin,
      max: resolvedMax,
      step: resolvedStep,
      category,
      isInteger: Boolean(isInteger || (Number.isInteger(resolvedStep) && resolvedStep >= 1 && (Number.isInteger(resolvedMin) || resolvedMin === 0) && (Number.isInteger(resolvedMax) || resolvedMax === 1)))
    };
  }

  /**
   * Sets input/select value and dispatches events
   */
  setInputValue(item, value) {
    if (item.type === 'select') {
      const select = item.element;
      const targetIndex = Math.min(Math.max(0, Math.round(value)), item.options.length - 1);
      if (select.selectedIndex !== targetIndex) {
        select.selectedIndex = targetIndex;
        if (select.options[targetIndex]) select.value = select.options[targetIndex].value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof select.onchange === 'function') {
          try { select.onchange(); } catch (_) {}
        }
      }
      return select.selectedIndex === targetIndex;
    } else {
      const input = item.element;
      let finalVal = value;
      if (typeof value === 'number') {
        if (item.min !== undefined && item.min !== null) finalVal = Math.max(item.min, finalVal);
        if (item.max !== undefined && item.max !== null) finalVal = Math.min(item.max, finalVal);
        if (item.isInteger || (Number.isInteger(item.step) && item.step >= 1)) {
          finalVal = Math.round(finalVal);
        }
      }
      const formatted = typeof finalVal === 'number'
        ? (Number.isInteger(finalVal) || item.isInteger ? String(Math.round(finalVal)) : finalVal.toFixed(2))
        : String(finalVal);

      if (input.value !== formatted) {
        const inputLabel = item.label || item.id || item.name || 'Input';
        this._activeInputLabel = inputLabel;
        this._activeInputItem = item;
        this._lastActiveInputItem = item;
        // Re-ensure observers & alert wrappers are attached in case of DOM updates
        this.attachToastObservers();
        this.wrapWindowAlerts();

        // Temporarily silence window.alert during input events so Glo-Bus inline form validation scripts never freeze execution,
        // while capturing the alert text into the notification listener.
        const win = input.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : null);
        const origAlert = win ? win.alert : null;
        if (win) {
          try {
            win.alert = (alertMsg) => {
              const notification = {
                id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: 'alert',
                level: 'error',
                title: 'Site Validation Dialog',
                message: String(alertMsg || ''),
                timestamp: Date.now(),
                timeString: new Date().toLocaleTimeString(),
                targetInput: inputLabel
              };
              this.recordSiteNotification(notification);
              return true;
            };
          } catch (_) {}
        }
        try {
          input.value = formatted;
          if (typeof input.dispatchEvent === 'function') {
            ['input', 'change', 'blur'].forEach(evt => input.dispatchEvent(new Event(evt, { bubbles: true })));
          }
          if (typeof input.onchange === 'function') {
            try { input.onchange(); } catch (_) {}
          }
          if (typeof input.onblur === 'function') {
            try { input.onblur(); } catch (_) {}
          }
          if (typeof input.dispatchEvent === 'function') {
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true }));
          }
        } finally {
          if (win && origAlert) {
            try { win.alert = origAlert; } catch (_) {}
          }
          this._activeInputLabel = null;
        }
      }
      return true;
    }
  }

  /**
   * Triggers the page's calculation engine, then waits for DOM stabilization.
   * On pages with an explicit Calculate button, clicks it.
   * On pages that auto-recalculate (like Corporate Citizenship), polls until the
   * projected scoreboard values stop changing, up to a maximum wait of 1500ms.
   */
  triggerCalculate() {
    return new Promise(resolve => {
      try {
        const docs = this.getAllDocuments();
        let clickedBtn = null;

        if (this.cachedCalcBtn && (this.cachedCalcBtn.isConnected === undefined || this.cachedCalcBtn.isConnected)) {
          clickedBtn = this.cachedCalcBtn;
          try { clickedBtn.click(); } catch (_) {}
        } else {
          for (const doc of docs) {
            const buttons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn'));
            const calcBtn = buttons.find(b => {
              const text = (b.textContent || b.value || '').toLowerCase();
              return text.includes('calculate') || text.includes('update score') || text.includes('recalculate') || text.includes('update projection');
            });
            if (calcBtn) {
              clickedBtn = calcBtn;
              this.cachedCalcBtn = calcBtn;
              try { calcBtn.click(); } catch (_) {}
              break;
            }
          }
        }

        if (!clickedBtn) {
          // No calculate button — page auto-updates on input change.
          // Dispatch additional change/input events to nudge reactive frameworks.
          docs.forEach(doc => {
            try { doc.body?.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
            try { doc.body?.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
          });
        }

        // Poll for DOM stabilization: wait until the scoreboard text stops changing
        // (or until we hit the max wait). This handles async/debounced updates.
        const maxWait = clickedBtn ? 1000 : 1800;
        const minWaitBeforeStable = clickedBtn ? 80 : 250; // enforce settling time for auto-recalculating screens like CSR
        const pollInterval = 50;
        const startTime = Date.now();
        let lastText = '';
        let stableCount = 0;
        const requiredStableRounds = clickedBtn ? 2 : 3;

        const getScoreboardRows = () => {
          if (this.cachedScoreboardRows && this.cachedScoreboardRows.length > 0 &&
              this.cachedScoreboardRows.every(r => r.isConnected === undefined || r.isConnected)) {
            return this.cachedScoreboardRows;
          }
          const foundRows = [];
          for (const doc of this.getAllDocuments()) {
            const rows = doc.querySelectorAll('tr');
            for (const row of rows) {
              const tl = (row.textContent || '').toLowerCase();
              if (tl.includes('earnings per share') || 
                  tl.includes('image rating') || 
                  tl.includes('return on equity') ||
                  tl.includes('ending cash') ||
                  tl.includes('credit rating')) {
                foundRows.push(row);
              }
            }
          }
          this.cachedScoreboardRows = foundRows;
          return foundRows;
        };

        const getScoreboardText = () => {
          const rows = getScoreboardRows();
          let text = '';
          for (const row of rows) {
            text += (row.textContent || '').toLowerCase().replace(/\s+/g, ' ');
          }
          return text;
        };

        if (getScoreboardRows().length === 0) {
          resolve();
          return;
        }

        let pollTimer = null;
        let isDone = false;

        const cleanupAndResolve = () => {
          if (isDone) return;
          isDone = true;
          if (pollTimer) {
            clearTimeout(pollTimer);
            pollTimer = null;
          }
          resolve();
        };

        const poll = () => {
          if (isDone) return;
          try {
            const elapsed = Date.now() - startTime;
            const currentText = getScoreboardText();

            if (currentText === lastText && currentText.length > 0) {
              stableCount++;
            } else {
              stableCount = 0;
              lastText = currentText;
            }

            if ((elapsed >= minWaitBeforeStable && stableCount >= requiredStableRounds) || elapsed >= maxWait) {
              cleanupAndResolve();
            } else {
              pollTimer = setTimeout(poll, pollInterval);
            }
          } catch (_) {
            cleanupAndResolve();
          }
        };

        // Give the page a brief head-start before polling
        pollTimer = setTimeout(poll, 60);
      } catch (_) {
        resolve();
      }
    });
  }

  /**
   * Saves the optimized decisions to Glo-Bus servers and automatically confirms dialog prompts
   */
  saveDecisions() {
    return new Promise(resolve => {
      logger.info('SAVE', 'Initiating decision save transaction...');

      // Pre-Flight Decision Sanitization: Enforce Glo-Bus mutual exclusivity rules
      try {
        const allInputs = (typeof this.getDecisionInputs === 'function' ? this.getDecisionInputs() : null) || [];
        if (Array.isArray(allInputs) && allInputs.length > 0) {
          // 1. CSR Charitable Contributions Mutual Exclusivity
          // Glo-Bus error: "Corporate Citizenship - Charitable Total cannot be set when Charitable Percentage is also set."
          let charitableTotalInput = null;
          let charitablePercentInput = null;
          allInputs.forEach(i => {
            if (!i) return;
            const lbl = `${i.label || ''} ${i.name || ''} ${i.id || ''}`.toLowerCase();
            if (lbl.includes('charit') || lbl.includes('contribut')) {
              if (lbl.includes('percent') || lbl.includes('%') || lbl.includes('profit')) {
                charitablePercentInput = i;
              } else {
                charitableTotalInput = i;
              }
            }
          });
          if (charitableTotalInput && charitablePercentInput) {
            const totalVal = parseFloat(charitableTotalInput.value) || 0;
            const percentVal = parseFloat(charitablePercentInput.value) || 0;
            if (totalVal > 0 && percentVal > 0) {
              logger.warn('SAVE', `Pre-Flight Sanitization: Both Charitable Total ($${totalVal}k) and Percent (${percentVal}%) are set. Zeroing Charitable Percent to prevent Glo-Bus save rejection.`);
              this.setInputValue(charitablePercentInput, 0);
              charitablePercentInput.value = 0;
            }
          }

          // 2. Finance Stock Issue vs Stock Repurchase Mutual Exclusivity
          let stockIssueInput = null;
          let stockRepurchaseInput = null;
          allInputs.forEach(i => {
            if (!i) return;
            const lbl = `${i.label || ''} ${i.name || ''} ${i.id || ''}`.toLowerCase();
            if (lbl.includes('issue') && (lbl.includes('stock') || lbl.includes('share'))) {
              stockIssueInput = i;
            } else if (lbl.includes('repurchase') || lbl.includes('buyback')) {
              stockRepurchaseInput = i;
            }
          });
          if (stockIssueInput && stockRepurchaseInput) {
            const issueVal = parseFloat(stockIssueInput.value) || 0;
            const repVal = parseFloat(stockRepurchaseInput.value) || 0;
            if (issueVal > 0 && repVal > 0) {
              logger.warn('SAVE', `Pre-Flight Sanitization: Both Stock Issue (${issueVal}k) and Stock Repurchase (${repVal}k) are set. Zeroing Stock Issue.`);
              this.setInputValue(stockIssueInput, 0);
              stockIssueInput.value = 0;
            }
          }
        }
      } catch (err) {
        logger.warn('SAVE', `Pre-flight sanitization warning: ${err.message}`);
      }

      const isConfirmButton = (btn, initialSaveButton) => {
        if (!btn || btn === initialSaveButton) return false;
        
        const t = (btn.textContent || btn.value || '').trim().toLowerCase();
        
        // Explicitly reject cancel / close buttons
        if (t === 'cancel' || t === 'no' || t === 'close' || t === 'abort') return false;
        if (btn.classList && typeof btn.classList.contains === 'function' && (btn.classList.contains('close') || btn.classList.contains('btn-cancel'))) return false;
        if (typeof btn.getAttribute === 'function' && btn.getAttribute('aria-label') === 'Close') return false;

        // Positive match conditions for save confirmation:
        const matchesSaveText = 
          t === 'save' ||
          t === 'save decision entries' ||
          t === 'save decisions' ||
          t === 'save entries' ||
          t === 'yes' ||
          t === 'confirm' ||
          t === 'ok' ||
          t === 'proceed' ||
          t === 'submit' ||
          (t.includes('save') && !t.includes('cancel'));

        // 1. Check if button is inside a modal / popup container
        const modalContainer = btn.closest ? btn.closest('.modal, .modal-dialog, .modal-content, [role="dialog"], .dialog, .ui-dialog, .bootbox, .swal2-container, div[class*="modal"], div[class*="popup"], div[class*="dialog"]') : null;
        if (modalContainer && matchesSaveText) {
          return true;
        }

        // 2. Check if button is inside a container that has "Save Decision Entries" or "Are you sure you would like to save"
        const parentWithPrompt = btn.closest ? btn.closest('div') : null;
        if (parentWithPrompt) {
          const parentText = parentWithPrompt.textContent || '';
          if ((parentText.includes('Save Decision Entries') || parentText.includes('save your decision entries')) && matchesSaveText) {
            return true;
          }
        }

        // 3. Check if button has a sibling/co-button that says 'cancel'
        const parentRow = btn.parentElement;
        if (parentRow && typeof parentRow.querySelectorAll === 'function') {
          const siblingButtons = Array.from(parentRow.querySelectorAll('button, a, input[type="button"]'));
          const hasCancelSibling = siblingButtons.some(sib => {
            const st = (sib.textContent || sib.value || '').trim().toLowerCase();
            return st === 'cancel';
          });
          if (hasCancelSibling && (matchesSaveText || (btn.classList && typeof btn.classList.contains === 'function' && (btn.classList.contains('btn-primary') || btn.classList.contains('btn-success'))))) {
            return true;
          }
        }

        return false;
      };

      // Override window.confirm and alert in page and main world, recording originals for restoration
      const origOverrides = [];
      const overrideCode = `
        try { window.confirm = function() { return true; }; } catch (_) {}
        try { window.alert = function() { return true; }; } catch (_) {}
      `;
      const docs = this.getAllDocuments();
      docs.forEach(d => {
        try {
          const s = d.createElement('script');
          s.textContent = overrideCode;
          (d.head || d.documentElement || d.body).appendChild(s);
          s.remove();
        } catch (_) {}
        try {
          if (d.defaultView) {
            origOverrides.push({
              view: d.defaultView,
              confirm: d.defaultView.confirm,
              alert: d.defaultView.alert
            });
            d.defaultView.confirm = () => true;
            d.defaultView.alert = (alertMsg) => {
              this.recordSiteNotification({
                id: 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: 'alert',
                level: 'warn',
                title: 'Post-Save Dialog',
                message: String(alertMsg || ''),
                timestamp: Date.now(),
                timeString: new Date().toLocaleTimeString()
              });
              return true;
            };
          }
        } catch (_) {}
      });

      const restoreDialogs = () => {
        origOverrides.forEach(o => {
          try {
            if (o.view) {
              o.view.confirm = o.confirm;
              o.view.alert = o.alert;
            }
          } catch (_) {}
        });
      };

      // Check if a confirmation modal is ALREADY visible right now
      for (const doc of docs) {
        const existingButtons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a[role="button"]'));
        const alreadyOpenConfirm = existingButtons.find(b => isConfirmButton(b, null));
        if (alreadyOpenConfirm) {
          logger.info('SAVE', `Confirmation modal already open on screen. Clicking "${alreadyOpenConfirm.textContent.trim()}"...`);
          try {
            if (typeof MouseEvent !== 'undefined') {
              alreadyOpenConfirm.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
              alreadyOpenConfirm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            }
            alreadyOpenConfirm.click();
            logger.success('SAVE', `Confirmed active save prompt modal: "${alreadyOpenConfirm.textContent.trim()}".`);
            setTimeout(() => {
              try {
                const postDocs = this.getAllDocuments();
                for (const pDoc of postDocs) {
                  const ackButtons = Array.from(pDoc.querySelectorAll('.modal button, .dialog button, [role="dialog"] button, button'));
                  const okBtn = ackButtons.find(b => {
                    const t = (b.textContent || b.value || '').trim().toLowerCase();
                    return t === 'ok' || t === 'close' || t === 'continue' || t === 'dismiss';
                  });
                  if (okBtn && okBtn !== alreadyOpenConfirm) {
                    okBtn.click();
                    logger.info('SAVE', `Auto-dismissed post-save acknowledgement: "${okBtn.textContent.trim()}".`);
                  }
                }
              } catch (_) {}
              restoreDialogs();
              resolve({ ok: true, message: 'Decisions successfully saved & confirmed!' });
            }, 600);
            return;
          } catch (_) {}
        }
      }

      // Find the main Save Decisions button on the page
      let saveButton = null;
      for (const doc of docs) {
        const buttons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a'));
        saveButton = buttons.find(b => {
          const text = (b.textContent || b.value || '').trim().toLowerCase();
          return text.includes('save decision') || 
                 text === 'save' ||
                 text.includes('save decisions to glo-bus') ||
                 text === 'save decisions';
        });
        if (saveButton) break;
      }

      if (!saveButton) {
        logger.warn('SAVE', 'Save Decisions button was not found in any frame.');
        resolve({ ok: false, error: 'Site "Save Decisions" button was not found on this screen.' });
        return;
      }
      if (saveButton.disabled) {
        logger.warn('SAVE', 'Save Decisions button is disabled.');
        resolve({ ok: false, error: 'Site "Save Decisions" button is disabled.' });
        return;
      }

      // Click the primary page Save Decisions button
      try {
        if (saveButton.scrollIntoView) {
          saveButton.scrollIntoView({ block: 'center', inline: 'nearest' });
        }
      } catch (_) {}
      try {
        if (typeof MouseEvent !== 'undefined') {
          saveButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          saveButton.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        }
      } catch (_) {}
      saveButton.click();
      logger.info('SAVE', `Clicked "${saveButton.textContent?.trim() || 'Save'}" button. Awaiting confirmation popup...`);

      // Monitor for the confirmation popup modal
      let resolved = false;
      const startTime = Date.now();
      const timeoutMs = 6000;

      const finishSave = (result) => {
        if (resolved) return;
        resolved = true;
        clearInterval(interval);
        restoreDialogs();
        resolve(result);
      };

      const interval = setInterval(() => {
        if (resolved) return;

        try {
          const currentDocs = this.getAllDocuments();
          let confirmed = false;

          for (const doc of currentDocs) {
            const clickable = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn, a[role="button"]'));
            const confirmBtn = clickable.find(b => isConfirmButton(b, saveButton));

            if (confirmBtn) {
              confirmed = true;
              clearInterval(interval);

              try {
                if (typeof MouseEvent !== 'undefined') {
                  confirmBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
                  confirmBtn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
                }
              } catch (_) {}
              try {
                confirmBtn.click();
                logger.success('SAVE', `Auto-confirmed save modal: "${confirmBtn.textContent.trim()}". Decisions saved!`);
              } catch (err) {
                logger.error('SAVE', `Error clicking modal confirm: ${err.message}`);
              }

              // Check for any subsequent "OK" acknowledgement dialog
              setTimeout(() => {
                try {
                  const postDocs = this.getAllDocuments();
                  for (const pDoc of postDocs) {
                    const ackButtons = Array.from(pDoc.querySelectorAll('.modal button, .dialog button, [role="dialog"] button, button'));
                    const okBtn = ackButtons.find(b => {
                      const t = (b.textContent || b.value || '').trim().toLowerCase();
                      return t === 'ok' || t === 'close' || t === 'continue' || t === 'dismiss';
                    });
                    if (okBtn && okBtn !== saveButton) {
                      okBtn.click();
                      logger.info('SAVE', `Auto-dismissed post-save acknowledgement: "${okBtn.textContent.trim()}".`);
                    }
                  }
                } catch (_) {}
                finishSave({ ok: true, message: 'Decisions successfully saved & confirmed!' });
              }, 600);

              break;
            }
          }

          if (!confirmed && Date.now() - startTime > timeoutMs) {
            logger.info('SAVE', 'No confirmation modal detected within timeout. Save action dispatched.');
            finishSave({ ok: true, message: 'Save action dispatched.' });
          }
        } catch (err) {
          finishSave({ ok: false, error: err.message });
        }
      }, 50);
    });
  }

  /**
   * Scrapes live projected metrics from scoreboard tables or summary cards
   */
  getProjectedMetrics() {
    const metrics = {
      eps: 0,
      roe: 0,
      stockPrice: 0,
      creditRating: 'B',
      creditRatingScore: 50,
      imageRating: 50,
      endingCash: 0,
      netRevenue: 0,
      netProfit: 0,
      timestamp: Date.now()
    };

    const found = {
      eps: false,
      roe: false,
      stockPrice: false,
      creditRating: false,
      imageRating: false,
      endingCash: false,
      netRevenue: false,
      netProfit: false
    };

    const creditMap = {
      'A+': 100, 'A': 95, 'A-': 90,
      'B+': 82, 'B': 75, 'B-': 68,
      'C+': 58, 'C': 50, 'C-': 40,
      'D': 25, 'F': 0
    };

    const parseNum = (str) => {
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

    const docs = this.getAllDocuments();

    for (const doc of docs) {
      const allRows = Array.from(doc.querySelectorAll('tr'));

      // 1. Locate the projected performance scoreboard container (holds both Scoring Measures and Other Measures)
      let scoreboardContainer = null;
      for (const row of allRows) {
        const text = row.textContent.toLowerCase();
        if (text.includes('earnings per share') || text.includes('scoring measures') || text.includes('projected y')) {
          let curr = row.parentElement;
          while (curr && curr !== doc.body) {
            const cText = curr.textContent.toLowerCase();
            if (cText.includes('ending cash') || cText.includes('other measures') || cText.includes('net profit')) {
              scoreboardContainer = curr;
              break;
            }
            curr = curr.parentElement;
          }
          if (scoreboardContainer) break;
        }
      }

      const rowsToScrape = scoreboardContainer
        ? Array.from(scoreboardContainer.querySelectorAll('tr'))
        : allRows;

      const extractRowMetric = (cells, labelKeywords, excludeKeywords = []) => {
        for (let i = 0; i < cells.length; i++) {
          const txt = cells[i].textContent.trim().toLowerCase();
          const matches = labelKeywords.some(kw => txt.includes(kw));
          const excluded = excludeKeywords.some(ex => txt.includes(ex));
          if (matches && !excluded) {
            let primary = null;
            let secondary = null;
            for (let j = i + 1; j < cells.length; j++) {
              const val = cells[j].textContent.trim();
              if (val && val !== '-' && val !== '--') {
                if (!primary) {
                  primary = { text: val, num: parseNum(val) };
                } else if (!secondary) {
                  secondary = { text: val, num: parseNum(val) };
                  break;
                }
              }
            }
            if (primary) {
              return {
                text: primary.text,
                num: primary.num,
                targetText: secondary ? secondary.text : null,
                targetNum: secondary ? secondary.num : NaN
              };
            }
          }
        }
        return null;
      };

      const parseRowList = (rowList) => {
        rowList.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          if (cells.length < 2) return;

          // EPS
          if (!found.eps) {
            const res = extractRowMetric(cells, ['earnings per share', 'eps'], ['change', 'prior', 'investor']);
            if (res && !isNaN(res.num)) {
              metrics.eps = res.num;
              if (!isNaN(res.targetNum) && res.targetNum > 0) metrics.targetEPS = res.targetNum;
              found.eps = true;
            }
          }
          // ROE
          if (!found.roe) {
            const res = extractRowMetric(cells, ['return on equity', 'roe'], ['change', 'prior', 'investor']);
            if (res && !isNaN(res.num)) {
              metrics.roe = res.num;
              if (!isNaN(res.targetNum) && res.targetNum > 0) metrics.targetROE = res.targetNum;
              found.roe = true;
            }
          }
          // Stock Price
          if (!found.stockPrice) {
            const res = extractRowMetric(cells, ['stock price'], ['change', 'prior']);
            if (res && !isNaN(res.num)) {
              metrics.stockPrice = res.num;
              if (!isNaN(res.targetNum) && res.targetNum > 0) metrics.targetStock = res.targetNum;
              found.stockPrice = true;
            }
          }
          // Credit Rating
          if (!found.creditRating) {
            const res = extractRowMetric(cells, ['credit rating'], ['change', 'prior']);
            if (res) {
              const ratingMatch = res.text.match(/[A-DF][+-]?/i);
              if (ratingMatch) {
                const rating = ratingMatch[0].toUpperCase();
                metrics.creditRating = rating;
                metrics.creditRatingScore = creditMap[rating] !== undefined ? creditMap[rating] : 50;
                found.creditRating = true;
              }
            }
          }
          // Image Rating
          if (!found.imageRating) {
            const res = extractRowMetric(cells, ['image rating'], ['change', 'prior']);
            if (res && !isNaN(res.num)) {
              metrics.imageRating = res.num;
              if (!isNaN(res.targetNum) && res.targetNum > 0) metrics.targetImage = res.targetNum;
              found.imageRating = true;
            }
          }
          // Ending Cash
          if (!found.endingCash) {
            const res = extractRowMetric(cells, ['ending cash', 'cash balance', 'year-end cash'], ['change', 'prior']);
            if (res && !isNaN(res.num)) {
              metrics.endingCash = res.num;
              found.endingCash = true;
            }
          }
          // Net Revenues
          if (!found.netRevenue) {
            const res = extractRowMetric(cells, ['net revenues', 'net revenue', 'total revenues'], ['change', 'prior']);
            if (res && !isNaN(res.num)) {
              metrics.netRevenue = res.num;
              found.netRevenue = true;
            }
          }
          // Net Profit
          if (!found.netProfit) {
            const res = extractRowMetric(cells, ['net profit', 'net income'], ['change', 'prior']);
            if (res && !isNaN(res.num)) {
              metrics.netProfit = res.num;
              found.netProfit = true;
            }
          }
        });
      };

      parseRowList(rowsToScrape);

      // 2. Global sweep fallback if any key metric is still missing
      if (!found.endingCash || !found.netProfit || !found.eps) {
        parseRowList(allRows);
      }

      // 3. Summary card / projection box regex fallback
      if (metrics.eps === 0 || metrics.endingCash === 0) {
        doc.querySelectorAll('.projected-metrics, .projection-box, .scoreboard, [class*="metric"], [class*="projected"]').forEach(box => {
          const text = box.innerText.toLowerCase();
          const epsMatch = text.match(/(?:earnings\s+per\s+share|eps)[:\s]*\$?([0-9.]+)/i);
          if (epsMatch && metrics.eps === 0) metrics.eps = parseFloat(epsMatch[1]);
          const roeMatch = text.match(/(?:return\s+on\s+equity|roe)[:\s]*([0-9.]+)%/i);
          if (roeMatch && metrics.roe === 0) metrics.roe = parseFloat(roeMatch[1]);
          const stockMatch = text.match(/stock\s+price[:\s]*\$?([0-9,]+(?:\.\d+)?)/i);
          if (stockMatch && metrics.stockPrice === 0) metrics.stockPrice = parseFloat(stockMatch[1].replace(/,/g, ''));
          const cashMatch = text.match(/(?:ending\s+cash|year-end\s+cash|cash\s+balance|cash)(?:\s*\(\$000s\))?[:\s]*\$?([0-9,]+)/i);
          if (cashMatch && metrics.endingCash === 0) metrics.endingCash = parseNum(cashMatch[1]);
          const profitMatch = text.match(/net\s+profit(?:\s*\(\$000s\))?[:\s]*\$?([0-9,]+)/i);
          if (profitMatch && metrics.netProfit === 0) metrics.netProfit = parseNum(profitMatch[1]);
          const revMatch = text.match(/net\s+revenues?(?:\s*\(\$000s\))?[:\s]*\$?([0-9,]+)/i);
          if (revMatch && metrics.netRevenue === 0) metrics.netRevenue = parseNum(revMatch[1]);
        });
      }

      if (metrics.eps > 0 && metrics.endingCash > 0) break;
    }

    // Safety fallback: Inherit previous valid ending cash if unparsed on current screen.
    // Also catch NEGATIVE values on non-Finance pages — those are misparsed cost table
    // entries (e.g. CSR page shows "($540k) cost of Green Initiatives" in parentheses,
    // which parseNum converts to -540 and then triggers a catastrophic cash penalty).
    // Only the Finance & Cash Flow page can legitimately report a negative ending cash.
    const isFinancePage = this.pageType === 'FINANCE';
    const cashIsInvalid = metrics.endingCash === 0 ||
                          isNaN(metrics.endingCash) ||
                          (!isFinancePage && metrics.endingCash < 0);

    if (cashIsInvalid && this.lastObservedMetrics?.endingCash > 0 && metrics.eps > 0) {
      metrics.endingCash = this.lastObservedMetrics.endingCash;
    }

    this.lastObservedMetrics = metrics;
    return metrics;
  }

  /**
   * Complete Pre-Flight Diagnostic Inspection of the Current Page
   */
  inspectPage() {
    logger.info('INSPECT', 'Starting full pre-flight diagnostic scan of active page...');
    const pageType = this.detectPageType();
    const docs = this.getAllDocuments();
    const inputs = this.getDecisionInputs();
    const metrics = this.getProjectedMetrics();

    let calcBtnFound = false;
    let saveBtnFound = false;

    docs.forEach(doc => {
      const buttons = Array.from(doc.querySelectorAll('button, input[type="button"], input[type="submit"], a.btn'));
      buttons.forEach(b => {
        const t = (b.textContent || b.value || '').trim().toLowerCase();
        if (t.includes('calculate') || t.includes('update score') || t.includes('recalculate')) calcBtnFound = true;
        if (t.includes('save decision') || t === 'save') saveBtnFound = true;
      });
    });

    const leftTabs = window.gloBusPageCoordinator
      ? window.gloBusPageCoordinator.discoverLeftPaneTabs().map(t => t.name)
      : [];

    const report = {
      detectedPage: pageType,
      framesScanned: docs.length,
      decisionInputsFound: inputs.length,
      sampleInputs: inputs.slice(0, 5).map(i => `${i.label} (Current: ${i.value}, Range: [${i.min}, ${i.max}])`),
      metricsParsed: metrics,
      buttonsDetected: {
        calculateButton: calcBtnFound,
        saveDecisionsButton: saveBtnFound
      },
      leftPaneTabsDetected: leftTabs
    };

    logger.success('INSPECT', `Page scan complete: Found ${inputs.length} inputs across ${docs.length} frame(s). Left-pane tabs: [${leftTabs.join(', ') || 'None'}].`, report);
    if (inputs.length === 0) {
      logger.warn('INSPECT', '0 decision inputs detected! Make sure you are logged into Glo-Bus on an active decision screen.');
    }
    if (metrics.eps === 0) {
      logger.warn('INSPECT', 'Projected EPS parsed as 0. Scoreboard might be loading or located in an isolated container.');
    }
    if (leftTabs.length > 0) {
      logger.info('INSPECT', `Left pane detected ${leftTabs.length} tabs for seamless in-page Full Round optimization!`);
    }

    return report;
  }

  /**
   * Scrapes regional special contract data: Value Index, Contribution Margin ($/unit),
   * Wholesale Price, Discount Offer, Units to be Assembled
   */
  getSpecialContractData() {
    const data = {
      na: { valueIndex: 0, marginPerUnit: 0, units: 0, wholesalePrice: 0, discountPrice: 0 },
      ea: { valueIndex: 0, marginPerUnit: 0, units: 0, wholesalePrice: 0, discountPrice: 0 },
      ap: { valueIndex: 0, marginPerUnit: 0, units: 0, wholesalePrice: 0, discountPrice: 0 },
      la: { valueIndex: 0, marginPerUnit: 0, units: 0, wholesalePrice: 0, discountPrice: 0 }
    };
    const regionKeys = ['na', 'ea', 'ap', 'la'];
    const docs = this.getAllDocuments();

    const parseNum = (str) => {
      if (str === null || str === undefined) return NaN;
      let s = String(str).trim();
      if (s === '' || s === '-' || s === '--' || s.toLowerCase() === 'n/a') return NaN;
      if (s.startsWith('(') && s.endsWith(')')) s = '-' + s.slice(1, -1);
      const cleaned = s.replace(/,/g, '').replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : NaN;
    };

    for (const doc of docs) {
      const allRows = Array.from(doc.querySelectorAll('tr'));
      for (const row of allRows) {
        const text = (row.textContent || '').toLowerCase();
        const cells = Array.from(row.querySelectorAll('td, th'));

        // 1. Value Index (100-point scale)
        if (text.includes('value index')) {
          const nums = cells.map(c => parseNum(c.textContent)).filter(n => Number.isFinite(n));
          if (nums.length >= 4) {
            regionKeys.forEach((r, idx) => {
              data[r].valueIndex = nums[idx];
            });
          }
        }

        // 2. Contribution Margin ($/unit)
        if (text.includes('contribution margin')) {
          const nums = cells.map(c => parseNum(c.textContent)).filter(n => Number.isFinite(n));
          if (nums.length >= 8) {
            // Table format: Total ($000s) followed by $/unit for each of the 4 regions
            regionKeys.forEach((r, idx) => {
              data[r].marginPerUnit = nums[(idx * 2) + 1] !== undefined ? nums[(idx * 2) + 1] : nums[idx];
            });
          } else if (nums.length >= 4) {
            regionKeys.forEach((r, idx) => {
              data[r].marginPerUnit = nums[idx];
            });
          }
        }

        // 3. Special Offers Units to be Assembled (000s)
        if (text.includes('units to be assembled') || text.includes('units to be assembed')) {
          const nums = cells.map(c => parseNum(c.textContent)).filter(n => Number.isFinite(n));
          if (nums.length >= 4) {
            regionKeys.forEach((r, idx) => {
              data[r].units = nums[idx];
            });
          }
        }
      }
    }

    return data;
  }

  /**
   * Synchronizes simulation assumption toggles based on contract competitiveness
   */
  setSpecialContractAssumptions(regionMap = {}) {
    const docs = this.getAllDocuments();
    for (const doc of docs) {
      const selects = doc.querySelectorAll('select');
      selects.forEach(sel => {
        const label = this.findLabel(sel).toLowerCase();
        const name = (sel.name || '').toLowerCase();
        const id = (sel.id || '').toLowerCase();
        const combined = `${label} ${name} ${id}`;

        if (combined.includes('incorporate') || combined.includes('projected outcome')) {
          let targetRegion = null;
          if (combined.includes('n.a') || combined.includes('north america') || combined.includes('na_')) targetRegion = 'na';
          else if (combined.includes('e-a') || combined.includes('europe') || combined.includes('ea_')) targetRegion = 'ea';
          else if (combined.includes('a-p') || combined.includes('asia') || combined.includes('ap_')) targetRegion = 'ap';
          else if (combined.includes('l.a') || combined.includes('latin') || combined.includes('la_')) targetRegion = 'la';

          if (targetRegion && regionMap[targetRegion] !== undefined) {
            const targetVal = regionMap[targetRegion] ? 'yes' : 'no';
            for (let i = 0; i < sel.options.length; i++) {
              const optText = (sel.options[i].textContent || '').toLowerCase().trim();
              const optVal = (sel.options[i].value || '').toLowerCase().trim();
              if (optText === targetVal || optVal === targetVal || optText.startsWith(targetVal) || optVal.startsWith(targetVal)) {
                if (sel.selectedIndex !== i) {
                  sel.selectedIndex = i;
                  sel.value = sel.options[i].value;
                  sel.dispatchEvent(new Event('change', { bubbles: true }));
                }
                break;
              }
            }
          }
        }
      });
    }
  }

  captureSnapshot(cachedInputs = null) {
    const inputs = cachedInputs || this.getDecisionInputs();
    const snapshot = {};
    inputs.forEach(i => {
      snapshot[i.key] = {
        key: i.key,
        id: i.id,
        name: i.name,
        type: i.type,
        selectedIndex: i.type === 'select' ? (i.element?.selectedIndex ?? i.selectedIndex) : undefined,
        value: i.type === 'select' ? (i.element?.value ?? i.value) : (i.element?.value ?? i.value)
      };
    });
    return snapshot;
  }

  captureInitialSnapshot() {
    this.initialSnapshot = this.captureSnapshot();
    return this.initialSnapshot;
  }

  async restoreSnapshot(snapshot) {
    const target = snapshot || this.initialSnapshot;
    if (!target) return;
    const inputs = this.getDecisionInputs();
    for (const item of inputs) {
      const saved = target[item.key] || target[item.id] || target[item.name];
      if (saved !== undefined) {
        if (item.type === 'select') {
          let idx = saved.selectedIndex;
          if (idx === undefined && saved.value !== undefined) {
            const optIdx = item.options ? item.options.findIndex(o => String(o.value) === String(saved.value)) : -1;
            idx = optIdx !== -1 ? optIdx : parseInt(saved.value, 10);
          }
          if (idx !== undefined && !isNaN(idx)) {
            this.setInputValue(item, idx);
          }
        } else {
          this.setInputValue(item, saved.value);
        }
      }
    }
    await this.triggerCalculate();
  }
}

// Attach globally
window.gloBusDOMAdapter = new GloBusDOMAdapter();
