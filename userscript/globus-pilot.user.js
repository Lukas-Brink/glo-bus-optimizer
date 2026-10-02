// ==UserScript==
// @name         GloBus-Pilot: Strategy & Decision Optimizer
// @namespace    https://glo-bus.com/
// @version      2.1.2
// @description  Autonomous multi-objective decision optimizer & simulation HUD for GLO-BUS with Live Diagnostics Console
// @author       GloBus-Pilot AI
// @match        *://*.glo-bus.com/*
// @match        *://glo-bus.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // Prevent multiple injections / reopen if closed
  const existingHud = document.getElementById('globus-pilot-hud');
  if (existingHud) {
    if (window.gloBusHUD && typeof window.gloBusHUD.show === 'function') {
      window.gloBusHUD.show();
    } else {
      existingHud.style.display = '';
      existingHud.classList.remove('minimized');
    }
    return;
  }

  // 1. Inject Styles
  const css = "/* ==========================================================================\n   GloBus-Pilot // Sharplink Minimalist Frosted Glass HUD\n   Light Blue/Grey Frosted Gradient Surface with Darker Transparent Grey Glass Elements\n   Inspired by Sharplink (https://www.sharplink.com/)\n   ========================================================================== */\n\n@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');\n\n:root {\n  /* Frosted Glass Outer Surface (Subtle Light Blue/Grey Gradient) */\n  --sl-glass-bg: linear-gradient(155deg, rgba(242, 247, 253, 0.82) 0%, rgba(226, 235, 246, 0.70) 50%, rgba(212, 224, 238, 0.76) 100%);\n  \n  /* Inner Elements: Visibly Darker & Transparent Grey Glass */\n  --sl-glass-card: rgba(15, 23, 42, 0.055);\n  --sl-glass-card-hover: rgba(15, 23, 42, 0.095);\n  --sl-glass-drawer: rgba(15, 23, 42, 0.055);\n  \n  /* Hairline Borders with Defined Contrast */\n  --sl-border: rgba(15, 23, 42, 0.12);\n  --sl-border-subtle: rgba(15, 23, 42, 0.07);\n  --sl-border-hover: rgba(15, 23, 42, 0.24);\n  \n  /* Transparent Grey Buttons (Sharplink Style) */\n  --sl-btn-primary-bg: rgba(15, 23, 42, 0.11);\n  --sl-btn-primary-border: rgba(15, 23, 42, 0.20);\n  --sl-btn-primary-text: #0b0f19;\n  --sl-btn-primary-hover: rgba(15, 23, 42, 0.19);\n  --sl-btn-primary-hover-border: rgba(15, 23, 42, 0.32);\n  --sl-btn-primary-active: rgba(15, 23, 42, 0.26);\n  \n  --sl-btn-secondary-bg: rgba(15, 23, 42, 0.055);\n  --sl-btn-secondary-border: rgba(15, 23, 42, 0.12);\n  --sl-btn-secondary-text: #334155;\n  --sl-btn-secondary-hover: rgba(15, 23, 42, 0.12);\n  --sl-btn-secondary-hover-text: #0b0f19;\n  \n  /* Accent & Status Colors */\n  --sl-brand-blue: #0e76ff;\n  --sl-safe: #059669;\n  --sl-warn: #d97706;\n  --sl-danger: #dc2626;\n  \n  /* Typography Colors */\n  --sl-text-primary: #0b0f19;\n  --sl-text-secondary: #475569;\n  --sl-text-muted: #64748b;\n  \n  /* Fonts */\n  --sl-font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  --sl-font-mono: 'JetBrains Mono', 'SF Mono', Consolas, Menlo, monospace;\n}\n\n/* ==========================================================================\n   HUD Monolith Container (Frosted Blue/Grey Gradient Glass & Sharp 0px Corners)\n   ========================================================================== */\n#globus-pilot-hud {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  width: 330px;\n  background: var(--sl-glass-bg);\n  backdrop-filter: blur(28px) saturate(190%);\n  -webkit-backdrop-filter: blur(28px) saturate(190%);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  box-shadow: \n    0 20px 48px rgba(15, 23, 42, 0.14),\n    0 1px 0 rgba(255, 255, 255, 0.95) inset;\n  color: var(--sl-text-primary);\n  font-family: var(--sl-font-sans);\n  font-size: 12px;\n  z-index: 9999999;\n  overflow: visible;\n  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease;\n  user-select: none;\n}\n\n#globus-pilot-hud:hover {\n  border-color: var(--sl-border-hover);\n}\n\n/* Minimized Docked Capsule */\n#globus-pilot-hud.minimized {\n  width: 210px;\n  height: 38px;\n  border-color: rgba(15, 23, 42, 0.16);\n  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);\n  overflow: hidden;\n}\n\n#globus-pilot-hud.minimized .hud-body {\n  display: none;\n}\n\n#globus-pilot-hud.minimized .hud-header {\n  border-bottom: none;\n  height: 38px;\n  padding: 0 12px;\n}\n\n/* ==========================================================================\n   Header Bar\n   ========================================================================== */\n.hud-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 10px 14px;\n  background: rgba(15, 23, 42, 0.035);\n  border-bottom: 1px solid var(--sl-border);\n  cursor: grab;\n}\n\n.hud-header:active {\n  cursor: grabbing;\n}\n\n.hud-brand {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.hud-status-beacon {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: var(--sl-brand-blue);\n  flex-shrink: 0;\n}\n\n.hud-brand-title {\n  font-family: var(--sl-font-sans);\n  font-weight: 700;\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--sl-text-primary);\n}\n\n.hud-actions {\n  display: flex;\n  gap: 4px;\n}\n\n.hud-icon-btn {\n  background: rgba(15, 23, 42, 0.06);\n  border: 1px solid var(--sl-border);\n  color: var(--sl-text-secondary);\n  width: 20px;\n  height: 20px;\n  border-radius: 0px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: var(--sl-font-mono);\n  font-size: 10px;\n  transition: all 0.15s ease;\n}\n\n.hud-icon-btn:hover {\n  background: rgba(15, 23, 42, 0.14);\n  border-color: var(--sl-border-hover);\n  color: var(--sl-text-primary);\n}\n\n#hud-btn-close:hover {\n  background: rgba(220, 38, 38, 0.15);\n  border-color: rgba(220, 38, 38, 0.40);\n  color: var(--sl-danger);\n}\n\n/* ==========================================================================\n   HUD Body & Layout\n   ========================================================================== */\n.hud-body {\n  padding: 13px;\n  display: flex;\n  flex-direction: column;\n  gap: 11px;\n}\n\n/* Active Screen Breadcrumb (Darker Transparent Tag) */\n.hud-page-tag {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 10px;\n  background: rgba(15, 23, 42, 0.045);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n}\n\n.hud-page-eyebrow {\n  font-family: var(--sl-font-mono);\n  font-size: 9px;\n  font-weight: 600;\n  letter-spacing: 0.1em;\n  color: var(--sl-text-muted);\n}\n\n.hud-page-title {\n  font-family: var(--sl-font-mono);\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--sl-text-primary);\n  letter-spacing: 0.02em;\n}\n\n/* ==========================================================================\n   Metrics Scorecard (Darker Transparent Grey Glass Tiles)\n   ========================================================================== */\n.hud-metrics-grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 7px;\n}\n\n.hud-metric-card {\n  background: var(--sl-glass-card);\n  backdrop-filter: blur(14px);\n  -webkit-backdrop-filter: blur(14px);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  padding: 9px 10px;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 0 rgba(255, 255, 255, 0.50) inset;\n}\n\n.hud-metric-label {\n  font-family: var(--sl-font-mono);\n  font-size: 9px;\n  font-weight: 600;\n  text-transform: uppercase;\n  color: var(--sl-text-secondary);\n  letter-spacing: 0.06em;\n}\n\n.hud-metric-val {\n  font-family: var(--sl-font-mono);\n  font-size: 18px;\n  font-weight: 700;\n  color: var(--sl-text-primary);\n  line-height: 1.15;\n  letter-spacing: -0.02em;\n  font-variant-numeric: tabular-nums;\n  margin-top: 1px;\n}\n\n.hud-metric-sub {\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  color: var(--sl-text-muted);\n  font-weight: 500;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  margin-top: 2px;\n}\n\n.hud-cash-safe {\n  color: var(--sl-safe);\n}\n\n.hud-cash-warn {\n  color: var(--sl-warn);\n}\n\n.hud-cash-danger {\n  color: var(--sl-danger);\n}\n\n/* ==========================================================================\n   Live Progress Bar\n   ========================================================================== */\n.hud-progress-wrap {\n  display: none;\n  flex-direction: column;\n  gap: 5px;\n  padding: 8px 10px;\n  background: rgba(15, 23, 42, 0.045);\n  border: 1px solid var(--sl-border-subtle);\n  border-radius: 0px;\n}\n\n.hud-progress-wrap.visible {\n  display: flex;\n}\n\n.hud-progress-meta {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n}\n\n.hud-status-text {\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  color: var(--sl-text-secondary);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.hud-progress-bar-bg {\n  height: 2px;\n  background: rgba(15, 23, 42, 0.10);\n  border-radius: 0px;\n  overflow: hidden;\n}\n\n.hud-progress-bar-fill {\n  height: 100%;\n  width: 0%;\n  background: var(--sl-text-primary);\n  transition: width 0.2s ease;\n}\n\n/* ==========================================================================\n   Toast Notification\n   ========================================================================== */\n.hud-toast {\n  display: none;\n  padding: 7px 11px;\n  background: rgba(5, 150, 105, 0.12);\n  border: 1px solid rgba(5, 150, 105, 0.25);\n  color: var(--sl-safe);\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 10px;\n  font-weight: 600;\n  text-align: center;\n}\n\n.hud-toast.visible {\n  display: block;\n}\n\n/* ==========================================================================\n   Sharplink Primary Button (Transparent Grey Glass with Sharp Corners)\n   ========================================================================== */\n.hud-btn-primary {\n  width: 100%;\n  height: 38px;\n  background: var(--sl-btn-primary-bg);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid var(--sl-btn-primary-border);\n  color: var(--sl-btn-primary-text);\n  border-radius: 0px;\n  font-family: var(--sl-font-sans);\n  font-weight: 700;\n  font-size: 11.5px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  cursor: pointer;\n  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 0 rgba(255, 255, 255, 0.50) inset;\n  transition: all 0.15s ease;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0 14px;\n}\n\n.hud-btn-primary:hover {\n  background: var(--sl-btn-primary-hover);\n  border-color: var(--sl-btn-primary-hover-border);\n  color: #000000;\n  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.10);\n}\n\n.hud-btn-primary:active {\n  background: var(--sl-btn-primary-active);\n}\n\n.hud-btn-text {\n  flex: 1;\n  text-align: center;\n}\n\n.hud-btn-arrow {\n  font-family: var(--sl-font-mono);\n  font-size: 13px;\n  font-weight: 700;\n  transition: transform 0.15s ease;\n  margin-left: 6px;\n}\n\n.hud-btn-primary:hover .hud-btn-arrow {\n  transform: translateX(3px);\n}\n\n.hud-btn-primary.running {\n  background: rgba(220, 38, 38, 0.18);\n  border-color: rgba(220, 38, 38, 0.45);\n  color: var(--sl-danger);\n}\n\n.hud-btn-primary.running:hover {\n  background: rgba(220, 38, 38, 0.28);\n}\n\n/* Secondary Button Row (Transparent Grey Glass Buttons) */\n.hud-secondary-row {\n  display: flex;\n  gap: 7px;\n}\n\n.hud-btn-secondary {\n  flex: 1;\n  height: 32px;\n  background: var(--sl-btn-secondary-bg);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid var(--sl-btn-secondary-border);\n  color: var(--sl-btn-secondary-text);\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  font-weight: 600;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  cursor: pointer;\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n  transition: all 0.15s ease;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.hud-btn-secondary:hover {\n  background: var(--sl-btn-secondary-hover);\n  border-color: var(--sl-border-hover);\n  color: var(--sl-btn-secondary-hover-text);\n  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);\n}\n\n/* ==========================================================================\n   Activity Log & Diagnostics Drawer (Darker Transparent Grey)\n   ========================================================================== */\n.hud-drawer-section {\n  border-top: 1px solid var(--sl-border);\n  margin-top: 2px;\n  padding-top: 8px;\n}\n\n.hud-drawer-toggle {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  background: transparent;\n  border: none;\n  color: var(--sl-text-secondary);\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  font-weight: 600;\n  letter-spacing: 0.08em;\n  cursor: pointer;\n  padding: 5px 6px;\n  border-radius: 0px;\n  transition: color 0.15s ease;\n}\n\n.hud-drawer-toggle:hover {\n  color: var(--sl-text-primary);\n}\n\n.hud-toggle-left {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.hud-drawer-arrow {\n  font-size: 8px;\n  color: var(--sl-text-muted);\n  display: inline-block;\n  transition: transform 0.15s ease;\n}\n\n.hud-log-badge {\n  background: rgba(15, 23, 42, 0.08);\n  color: var(--sl-text-secondary);\n  border: 1px solid var(--sl-border-subtle);\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  padding: 1px 5px;\n  border-radius: 0px;\n  font-weight: 600;\n}\n\n.hud-drawer-panel {\n  display: none;\n  flex-direction: column;\n  gap: 6px;\n  margin-top: 6px;\n}\n\n.hud-drawer-panel.open {\n  display: flex;\n}\n\n.hud-drawer-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.hud-toolbar-label {\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  color: var(--sl-text-muted);\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-weight: 600;\n}\n\n.hud-toolbar-actions {\n  display: flex;\n  gap: 4px;\n}\n\n.hud-tool-btn {\n  background: rgba(15, 23, 42, 0.06);\n  border: 1px solid var(--sl-border-subtle);\n  color: var(--sl-text-secondary);\n  padding: 2px 7px;\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n\n.hud-tool-btn:hover {\n  background: rgba(15, 23, 42, 0.14);\n  color: var(--sl-text-primary);\n  border-color: var(--sl-border);\n}\n\n/* Console Terminal Box (Darker Transparent Panel) */\n.hud-terminal {\n  background: var(--sl-glass-drawer);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  padding: 8px 10px;\n  max-height: 170px;\n  min-height: 90px;\n  overflow-y: auto;\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  line-height: 1.5;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  color: var(--sl-text-primary);\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n}\n\n.hud-terminal::-webkit-scrollbar {\n  width: 3px;\n}\n\n.hud-terminal::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n.hud-terminal::-webkit-scrollbar-thumb {\n  background: rgba(15, 23, 42, 0.15);\n  border-radius: 0px;\n}\n\n.hud-terminal::-webkit-scrollbar-thumb:hover {\n  background: rgba(15, 23, 42, 0.30);\n}\n\n.hud-log-empty {\n  color: var(--sl-text-muted);\n  font-style: italic;\n  text-align: center;\n  padding: 22px 8px;\n}\n\n.hud-log-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 6px;\n  word-break: break-word;\n}\n\n.hud-log-time {\n  color: var(--sl-text-muted);\n  font-size: 8.5px;\n  flex-shrink: 0;\n  margin-top: 1px;\n}\n\n.hud-log-tag {\n  font-weight: 600;\n  flex-shrink: 0;\n  font-size: 9px;\n}\n\n.hud-log-msg {\n  color: var(--sl-text-primary);\n  flex: 1;\n}\n\n/* Sharplink Clean Log Colors */\n.hud-log-info .hud-log-tag { color: var(--sl-brand-blue); }\n.hud-log-info .hud-log-msg { color: #1e293b; }\n\n.hud-log-success .hud-log-tag { color: var(--sl-safe); }\n.hud-log-success .hud-log-msg { color: #064e3b; }\n\n.hud-log-warn .hud-log-tag { color: var(--sl-warn); }\n.hud-log-warn .hud-log-msg { color: #78350f; }\n\n.hud-log-error .hud-log-tag { color: var(--sl-danger); }\n.hud-log-error .hud-log-msg { color: #7f1d1d; }\n\n.hud-log-step .hud-log-tag { color: #7c3aed; }\n.hud-log-step .hud-log-msg { color: #3b0764; }\n";
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  // 2. DOM Adapter & Logger
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
          if (Array.isArray(parsed)) this.logs = parsed.slice(-300);
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
    if (this.logs.length > 500) this.logs.shift();

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('globus_pilot_recent_logs', JSON.stringify(this.logs));
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
    // NOTE: pageType is a live getter — always reflects the current page.
    // Do NOT store it as a property; in-page tab navigation changes the page
    // without reconstructing the adapter, so a stored value would go stale.
  }

  /** Always reflects the currently active Glo-Bus decision page. */
  get pageType() {
    return this.detectPageType();
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

  detectPageType() {
    const loc = window.location ? (window.location.pathname + window.location.search) : '';
    const title = typeof document !== 'undefined' ? (document.title || '') : '';
    const combined = `${loc} ${title}`.toLowerCase();

    let detected = 'GENERAL_DECISION';
    if (combined.includes('product-design') || combined.includes('product_design') || combined.includes('product design')) detected = 'PRODUCT_DESIGN';
    else if ((combined.includes('uav') || combined.includes('drone')) && combined.includes('marketing')) detected = 'UAV_MARKETING';
    else if ((combined.includes('acc') || combined.includes('camera') || combined.includes('ac ')) && combined.includes('marketing')) detected = 'AC_MARKETING';
    else if (combined.includes('special') || combined.includes('contract')) detected = 'SPECIAL_CONTRACTS';
    else if (combined.includes('compensation') || combined.includes('facility') || combined.includes('facilities') || combined.includes('assembly') || combined.includes('workforce')) detected = 'COMPENSATION_FACILITIES';
    else if (combined.includes('corporate') || combined.includes('csr') || combined.includes('citizenship')) detected = 'CSR';
    else if (combined.includes('finance') || combined.includes('cash')) detected = 'FINANCE';
    else if (combined.includes('marketing')) detected = 'MARKETING';

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
        if (el.closest('#globus-pilot-hud') || el.name === 'q' || el.type === 'hidden') return;

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
        if (el.closest('#globus-pilot-hud')) return;

        const id = el.id || el.name || `select_${index}`;
        const name = el.name || el.id || `Select_${index}`;
        const label = this.findLabel(el);
        const lLower = label.toLowerCase().trim();
        const idLower = String(id).toLowerCase();
        const nameLower = String(name).toLowerCase();

        // Strictly ignore simulation assumption dropdowns (e.g. Special Contracts "Incorporate projected outcomes into Y9 projections")
        if (lLower.includes('incorporate') || lLower.includes('projected outcome') || lLower.includes('assumption') || lLower.includes('probability of winning') ||
            nameLower.includes('incorporate') || nameLower.includes('assumption') ||
            idLower.includes('incorporate') || idLower.includes('assumption') ||
            el.classList.contains('entry-assumptions-select') || el.classList.contains('assumptions-select')) {
          return;
        }

        const options = Array.from(el.options).map(opt => ({
          text: opt.textContent.trim(),
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
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label').trim();

    const cell = element.closest('td, th');
    if (cell) {
      const row = cell.closest('tr');
      if (row) {
        const rowHeader = row.querySelector('th, td:first-child');
        const rowTitle = rowHeader && rowHeader !== cell ? rowHeader.textContent.trim().replace(/\s+/g, ' ') : '';
        const table = row.closest('table');
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
      const labelEl = doc.querySelector(`label[for="${element.id}"]`);
      if (labelEl) return labelEl.textContent.trim().replace(/\s+/g, ' ');
    }

    const parentGroup = element.closest('.form-group, .form-row, fieldset, p, div');
    if (parentGroup) {
      const labelEl = parentGroup.querySelector('label, .control-label, legend, span');
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

    // 3. Table row context: check row directly below (standard Glo-Bus pattern for limits)
    const row = element.closest ? element.closest('tr') : null;
    if (row && row.parentElement) {
      const children = row.children ? Array.from(row.children) : [];
      const colIndex = cell ? children.indexOf(cell) : -1;
      const nextRow = row.nextElementSibling;
      if (nextRow) {
        if (colIndex >= 0 && nextRow.children && nextRow.children[colIndex]) {
          candidates.push(nextRow.children[colIndex].textContent);
        }
        if (/max|limit|allowed|ceiling/i.test(nextRow.textContent)) {
          candidates.push(nextRow.textContent);
        }
      }
      const prevRow = row.previousElementSibling;
      if (prevRow) {
        if (colIndex >= 0 && prevRow.children && prevRow.children[colIndex]) {
          candidates.push(prevRow.children[colIndex].textContent);
        }
        if (/max|limit|allowed|ceiling/i.test(prevRow.textContent)) {
          candidates.push(prevRow.textContent);
        }
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
      /(?:max|maximum)\s*=\s*([0-9,]+(?:\.\d+)?)/i,
      /\b([0-9,]+(?:\.\d+)?)\s*(?:max|maximum)\b/i,
      /range[:\s]*\[?[0-9.]+\s*-\s*([0-9,]+(?:\.\d+)?)/i
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

    const safeVal = Number.isFinite(currentVal) ? currentVal : 0;
    const nearbyLimit = this.extractNearbyLimit(el);

    if (l.includes('r&d') || l.includes('research')) {
      min = 0; max = 50000; step = 2500; category = 'rd';
    } else if (l.includes('price') || l.includes('retail price') || l.includes('wholesale')) {
      category = 'price';
      if (l.includes('drone') || l.includes('uav')) {
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
    } else if (l.includes('advert') || l.includes('promo') || l.includes('search') || l.includes('website')) {
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
      min = 0; max = Math.max(safeVal * 1.5, 50); step = 1; category = 'facilities';
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

    return {
      min: Number.isFinite(nativeMin) ? nativeMin : min,
      max: Number.isFinite(nativeMax) ? nativeMax : max,
      step: Number.isFinite(nativeStep) && nativeStep > 0 ? nativeStep : step,
      category
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
      const formatted = typeof value === 'number'
        ? (Number.isInteger(value) ? String(value) : value.toFixed(2))
        : String(value);

      if (input.value !== formatted) {
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
        const maxWait = clickedBtn ? 900 : 1500;
        const pollInterval = 50;
        const startTime = Date.now();
        let lastText = '';
        let stableCount = 0;
        const requiredStableRounds = 2; // must be unchanged for 2 consecutive polls

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

            if (stableCount >= requiredStableRounds || elapsed >= maxWait) {
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

      const isConfirmButton = (btn, initialSaveButton) => {
        if (!btn || btn === initialSaveButton) return false;
        
        const t = (btn.textContent || btn.value || '').trim().toLowerCase();
        
        // Explicitly reject cancel / close buttons
        if (t === 'cancel' || t === 'no' || t === 'close' || t === 'abort') return false;
        if (btn.classList && (btn.classList.contains('close') || btn.classList.contains('btn-cancel'))) return false;
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
        if (parentRow) {
          const siblingButtons = Array.from(parentRow.querySelectorAll('button, a, input[type="button"]'));
          const hasCancelSibling = siblingButtons.some(sib => {
            const st = (sib.textContent || sib.value || '').trim().toLowerCase();
            return st === 'cancel';
          });
          if (hasCancelSibling && (matchesSaveText || (btn.classList && (btn.classList.contains('btn-primary') || btn.classList.contains('btn-success'))))) {
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
            d.defaultView.alert = () => true;
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
    inputs.forEach(item => {
      const saved = target[item.key] || target[item.id] || target[item.name];
      if (saved !== undefined) {
        if (item.type === 'select') {
          let idx = saved.selectedIndex;
          if (idx === undefined && saved.value !== undefined) {
            const optIdx = item.options.findIndex(o => String(o.value) === String(saved.value));
            idx = optIdx !== -1 ? optIdx : parseInt(saved.value, 10);
          }
          if (idx !== undefined && !isNaN(idx)) {
            this.setInputValue(item, idx);
          }
        } else {
          this.setInputValue(item, saved.value);
        }
      }
    });
    await this.triggerCalculate();
  }
}

// Attach globally
window.gloBusDOMAdapter = new GloBusDOMAdapter();


  // 3. Optimizer Engine
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


  // 4. Page Coordinator
/**
 * GloBus-Pilot: Multi-Page Round Coordinator
 * Automates sequential navigation and optimization across all Glo-Bus decision pages:
 * Product Design -> Workforce & Facilities -> Camera Marketing -> Drone Marketing -> CSR -> Finance
 *
 * Guarantees:
 * 1. Discovers decision links accurately via sidebar navigation containers and URLs.
 * 2. Saves each decision page automatically before transitioning to protect dirty state.
 * 3. Suppresses dialogs and confirms seamless server persistence without popups.
 * 4. Strict visited tracking prevents duplicate/looping optimizations on the same screen.
 * 5. Automatic resumption on page arrival with disarm protection on stop.
 */

(function () {
  const STORAGE_KEY = 'globus_pilot_full_round_workflow';

  const getLogger = () => window.gloBusLogger || {
    log: () => {}, info: () => {}, success: () => {}, warn: () => {}, error: () => {}, step: () => {}
  };

  // Immediate cleanup of any stale or expired workflows upon script load
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const age = Date.now() - new Date(parsed.startedAt || 0).getTime();
      // Purge if inactive, marked stopped, or older than 90 seconds
      if (!parsed.active || parsed.stopped || isNaN(age) || age > 90000) {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch (_) {}

  // Synchronous + Asynchronous hybrid storage adapter
  const storage = {
    async get() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (_) {}

      if (globalThis.chrome?.storage?.local) {
        return new Promise(resolve => {
          chrome.storage.local.get(STORAGE_KEY, res => resolve(res[STORAGE_KEY] || null));
        });
      }
      return null;
    },

    async set(val) {
      try {
        const serialized = JSON.stringify(val);
        sessionStorage.setItem(STORAGE_KEY, serialized);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (_) {}

      if (globalThis.chrome?.storage?.local) {
        return new Promise(resolve => {
          chrome.storage.local.set({ [STORAGE_KEY]: val }, () => resolve(val));
        });
      }
      return val;
    },

    async remove() {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      if (globalThis.chrome?.storage?.local) {
        return new Promise(resolve => {
          chrome.storage.local.remove(STORAGE_KEY, () => resolve());
        });
      }
    }
  };

  function getAllDocs() {
    if (window.gloBusDOMAdapter && typeof window.gloBusDOMAdapter.getAllDocuments === 'function') {
      return window.gloBusDOMAdapter.getAllDocuments();
    }
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
          } catch (_) {}
        });
      } catch (_) {}
    }
    return docs;
  }

  // Canonical definition of Glo-Bus decision sections and exact sequence
  const DECISION_SECTIONS = [
    {
      key: 'PRODUCT_DESIGN',
      name: 'Product Design',
      patterns: ['product design', 'product-design', 'product_design', '/pds', '/pdesign'],
      order: 1
    },
    {
      key: 'AC_MARKETING',
      name: 'AC Camera Marketing',
      patterns: ['ac camera marketing', 'camera marketing', 'ac marketing', 'acc marketing', 'ac camera', '/acm', '/cam', 'ac-marketing', 'ac_marketing'],
      order: 2
    },
    {
      key: 'UAV_MARKETING',
      name: 'UAV Drone Marketing',
      patterns: ['uav drone marketing', 'drone marketing', 'uav marketing', 'uave drone marketing', 'uav drone', '/uavm', '/drone', '/uav', 'uav-marketing', 'uav_marketing', 'drone-marketing'],
      order: 3
    },
    {
      key: 'COMPENSATION_FACILITIES',
      name: 'Compensation & Facilities',
      patterns: ['compensation & facilities', 'compensation and facilities', 'workforce & facilities', 'workforce & compensation', 'compensation', 'workforce', 'assembly & facilities', 'assembly and facilities', '/wfc', '/fac', '/comp', 'facilities'],
      order: 4
    },
    {
      key: 'SPECIAL_CONTRACTS',
      name: 'Special Contract Offers',
      patterns: ['special contract offers', 'special contract', 'contract offers', 'special contracts', 'special offers', 'contracts', '/sco', '/contract', 'special-contract', 'special_contract'],
      order: 5
    },
    {
      key: 'CSR',
      name: 'Corporate Citizenship',
      patterns: ['corporate citizenship', 'citizenship', 'corporate', 'csr & citizenship', 'csr and citizenship', 'csr', '/csrc', 'corporate social responsibility'],
      order: 6
    },
    {
      key: 'FINANCE',
      name: 'Finance & Cash Flow',
      patterns: ['finance & cash flow', 'finance and cash flow', 'finance', 'cash flow', 'cash_flow', '/fin', '/cash', 'finance & cash'],
      order: 7
    }
  ];

  function matchSection(text = '', href = '', onclick = '') {
    const combined = `${text} ${href} ${onclick}`.toLowerCase();
    for (const sec of DECISION_SECTIONS) {
      if (sec.patterns.some(p => combined.includes(p))) {
        return sec;
      }
    }
    return null;
  }

  class GloBusPageCoordinator {
    constructor() {
      this.isStopped = false;
      this.active = false;
      this.pollInterval = null;
      this.navTimeout = null;
    }

    /**
     * Discovers decision navigation links across the document and sidebar
     */
    discoverDecisionLinks() {
      const found = new Map();
      const docs = getAllDocs();

      docs.forEach(doc => {
        // Look specifically for navigation links in sidebar, navs, or anchors
        const elements = Array.from(doc.querySelectorAll(
          '#sidebar a, #left-menu a, #leftmenu a, .sidebar a, nav a, [role="navigation"] a, .left_nav a, .nav a, a[href], [role="tab"], button, li.nav-item'
        ));

        elements.forEach(el => {
          try {
            // Filter out elements inside HUD or form input tables
            if (el.closest && (el.closest('#globus-pilot-hud') || el.closest('table.decisions') || el.closest('.entry-table') || el.closest('form.decision-form'))) {
              return;
            }

            const text = (el.textContent || el.innerText || '').trim();
            const href = el.getAttribute('href') || '';
            const onclickAttr = el.getAttribute('onclick') || '';

            // Ignore pure anchor-hash links (#help, #top) unless they contain explicit navigation onclicks
            const isHashOrEmpty = !href || href === '#' || href.startsWith('#') || href.startsWith('javascript:');
            const hasNavOnClick = onclickAttr.includes('location') || onclickAttr.includes('href') || onclickAttr.includes('nav');
            if (typeof window !== 'undefined' && window.location && isHashOrEmpty && !hasNavOnClick) {
              return;
            }

            const matchedSec = matchSection(text, href, onclickAttr);
            if (!matchedSec) return;

            // Prioritize left sidebar / visible navigation elements
            let rect = { left: 0, width: 50, height: 20 };
            try {
              if (el.getBoundingClientRect) {
                rect = el.getBoundingClientRect();
              }
            } catch (_) {}

            let targetUrl = '';
            if (href && !href.startsWith('javascript:') && href !== '#') {
              try {
                const base = window.location ? window.location.href : 'http://localhost';
                const full = new URL(href, base);
                if (!window.location || full.origin === window.location.origin) {
                  targetUrl = full.href;
                }
              } catch (_) {}
            }

            // Only overwrite if this candidate has higher navigation priority (e.g. left sidebar or proper URL)
            const isSidebar = rect.left < 360 && (rect.width > 0 || el.offsetParent !== null);
            if (!found.has(matchedSec.key) || (isSidebar && targetUrl)) {
              found.set(matchedSec.key, {
                key: matchedSec.key,
                name: matchedSec.name,
                order: matchedSec.order,
                url: targetUrl || (window.location ? window.location.href : ''),
                selectorText: text,
                element: el,
                isSidebar
              });
            }
          } catch (_) {}
        });
      });

      // Return discovered sections sorted in natural economic order
      return Array.from(found.values()).sort((a, b) => a.order - b.order);
    }

    /**
     * Backward-compatible alias for inspectPage and tests
     */
    discoverLeftPaneTabs() {
      return this.discoverDecisionLinks();
    }

    /**
     * Identifies current active page section key
     */
    getCurrentSectionKey() {
      const adapter = window.gloBusDOMAdapter;
      const detected = adapter ? adapter.detectPageType() : '';
      const url = window.location ? (window.location.pathname + window.location.search) : '';
      const title = typeof document !== 'undefined' ? document.title : '';

      const match = matchSection(title, url, detected);
      if (match) return match.key;

      if (detected === 'PRODUCT_DESIGN') return 'PRODUCT_DESIGN';
      if (detected === 'AC_MARKETING') return 'AC_MARKETING';
      if (detected === 'UAV_MARKETING') return 'UAV_MARKETING';
      if (detected === 'COMPENSATION_FACILITIES' || detected === 'WORKFORCE_COMPENSATION' || detected === 'WORKFORCE') return 'COMPENSATION_FACILITIES';
      if (detected === 'SPECIAL_CONTRACTS') return 'SPECIAL_CONTRACTS';
      if (detected === 'CSR') return 'CSR';
      if (detected === 'FINANCE') return 'FINANCE';

      return 'PRODUCT_DESIGN'; // Default anchor
    }

    /**
     * Establishes and locks the definitive Round Baseline before optimization begins.
     * Retries and stabilizes scoreboard reading to guarantee accurate numbers.
     */
    async establishRoundBaseline(adapter, log = getLogger()) {
      if (!adapter) return null;
      log.info('BASELINE', 'Stabilizing scoreboard to establish authentic Round Baseline...');
      try {
        await adapter.triggerCalculate();
      } catch (_) {}

      let m = adapter.getProjectedMetrics();
      // Retry up to 4 times if metrics are unrendered or 0
      for (let i = 0; i < 4; i++) {
        if (m && m.eps > 0 && Number.isFinite(m.endingCash) && m.endingCash !== 0) break;
        await new Promise(r => setTimeout(r, 250));
        m = adapter.getProjectedMetrics();
      }

      const baseline = {
        eps: m?.eps || 0,
        roe: m?.roe || 0,
        stockPrice: m?.stockPrice || 0,
        creditRating: m?.creditRating || '--',
        imageRating: m?.imageRating || 50,
        endingCash: Number.isFinite(m?.endingCash) ? m.endingCash : 0,
        netRevenue: m?.netRevenue || 0,
        netProfit: m?.netProfit || 0,
        establishedAt: new Date().toISOString()
      };

      try {
        const serialized = JSON.stringify(baseline);
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('globus_pilot_round_baseline', serialized);
        if (typeof localStorage !== 'undefined') localStorage.setItem('globus_pilot_round_baseline', serialized);
      } catch (_) {}

      log.success('BASELINE',
        `Locked Round Baseline: EPS $${baseline.eps.toFixed(2)} | ROE ${baseline.roe.toFixed(1)}% | ` +
        `Cash $${Math.round(baseline.endingCash)}k | Credit ${baseline.creditRating} | Image ${baseline.imageRating}`
      );
      return baseline;
    }

    /**
     * Starts multi-page Full Round optimization:
     * Product Design -> Workforce -> Camera Marketing -> Drone Marketing -> CSR -> Finance
     */
    async startFullRound(optimizer, presetKey = 'balanced') {
      this.isStopped = false;
      this.active = true;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      const log = getLogger();
      try {
        optimizer.setPreset(presetKey);
        log.info('ROUND', 'Starting autonomous Full Round optimization across all decision screens...');

        const currentKey = this.getCurrentSectionKey();
        const allLinks = this.discoverDecisionLinks();
        const adapter = window.gloBusDOMAdapter;

        // If not currently on Product Design, navigate to Product Design first to establish baseline and run 1 -> 7 sequence
        if (currentKey !== 'PRODUCT_DESIGN' && allLinks.some(l => l.key === 'PRODUCT_DESIGN')) {
          log.info('ROUND', 'Relocating to [Product Design] to establish round baseline and execute canonical causal sequence (Product Design -> ... -> Finance & Cash Flow)...');
          const workflow = {
            active: true,
            stopped: false,
            pendingNavigation: false,
            presetKey,
            startedAt: new Date().toISOString(),
            visitedKeys: [],
            totalCount: allLinks.length,
            cycleIndex: 1,
            maxCycles: 3,
            minEpsGainThreshold: 0.02,
            roundBaselineMetrics: null,
            cycleStartEps: 0,
            totalRunStartEps: 0,
            queue: allLinks.map(q => ({ key: q.key, name: q.name, order: q.order, url: q.url, selectorText: q.selectorText }))
          };
          await storage.set(workflow);
          log.info('ROUND', `Scheduled route: [${allLinks.map(q => q.name).join(' -> ')}]`);
          await this.navigateNext(workflow);
          return;
        }

        // Establish and lock definitive Round Baseline on Screen 1 before optimizing
        const roundBaseline = await this.establishRoundBaseline(adapter, log);
        const startingEps = roundBaseline?.eps || 0;

        // Build queue of remaining unvisited sections sorted in economic sequence
        const queue = allLinks.filter(l => l.key !== currentKey);

        const workflow = {
          active: true,
          stopped: false,
          pendingNavigation: false,
          presetKey,
          startedAt: new Date().toISOString(),
          visitedKeys: [currentKey],
          totalCount: queue.length + 1,
          cycleIndex: 1,
          maxCycles: 3,
          minEpsGainThreshold: 0.02,
          roundBaselineMetrics: roundBaseline,
          cycleStartEps: startingEps,
          totalRunStartEps: startingEps,
          queue: queue.map(q => ({ key: q.key, name: q.name, order: q.order, url: q.url, selectorText: q.selectorText }))
        };

        await storage.set(workflow);

        const currentSec = DECISION_SECTIONS.find(s => s.key === currentKey) || { name: 'Active Screen' };
        log.info('ROUND', `[1/${workflow.totalCount}] Optimizing current screen: [${currentSec.name}] [Cycle 1/${workflow.maxCycles}] (Saving deferred)...`);
        log.info('ROUND', `Scheduled route: [${[currentSec.name, ...queue.map(q => q.name)].join(' -> ')}]`);

        // 1. Optimize current page (saving deferred)
        await optimizer.start(false);

        if (this.isStopped || !this.active) {
          await this.stop();
          return;
        }

        // 2. Navigate to the next screen in queue or evaluate cycle completion
        if (workflow.queue.length > 0) {
          await this.navigateNext(workflow);
        } else {
          await this.handleCycleCompletion(workflow, optimizer);
        }
      } catch (err) {
        log.error('ROUND', `Error during full round start: ${err.message}`, err);
        console.error('startFullRound error:', err);
      }
    }

    /**
     * Dispatches navigation to the next unvisited screen
     */
    async navigateNext(workflow) {
      if (this.isStopped || !this.active) {
        await this.stop();
        return;
      }

      const log = getLogger();
      if (!workflow.active || workflow.queue.length === 0) {
        await this.stop();
        log.success('ROUND', 'Full Round optimization complete across all screens! All decisions confirmed on server.');
        return;
      }

      const next = workflow.queue.shift();
      workflow.pendingNavigation = true;
      workflow.targetKey = next.key;
      workflow.targetName = next.name;
      workflow.navigatedAt = new Date().toISOString();
      await storage.set(workflow);

      log.step('NAV', `Moving to next screen (${workflow.visitedKeys.length + 1}/${workflow.totalCount}): ${next.name}...`);

      // 1. Attempt to find the specific navigation link in the DOM
      const docs = getAllDocs();
      let linkEl = null;

      for (const doc of docs) {
        const candidates = Array.from(doc.querySelectorAll(
          '#sidebar a, #left-menu a, #leftmenu a, .sidebar a, nav a, [role="navigation"] a, .left_nav a, .nav a, a[href]'
        ));

        linkEl = candidates.find(el => {
          if (el.closest && (el.closest('#globus-pilot-hud') || el.closest('table.decisions') || el.closest('form.decision-form'))) return false;
          const t = (el.textContent || el.innerText || '').trim();
          const href = (el.getAttribute('href') || '').toLowerCase();
          const onclickAttr = (el.getAttribute('onclick') || '').toLowerCase();
          const m = matchSection(t, href, onclickAttr);
          return m && m.key === next.key;
        });

        if (linkEl) break;
      }

      const startUrl = window.location ? window.location.href : '';

      // 2. Click navigation link cleanly
      let clickSucceeded = false;
      if (linkEl) {
        log.info('NAV', `Clicking navigation menu link for "${next.name}"...`);
        try {
          linkEl.click();
          clickSucceeded = true;
        } catch (_) {}
      }

      // 3. Fallback to direct URL navigation if clicking did not trigger transition within 1200ms
      if (this.navTimeout) {
        clearTimeout(this.navTimeout);
        this.navTimeout = null;
      }
      this.navTimeout = setTimeout(() => {
        this.navTimeout = null;
        if (this.isStopped || !this.active) return;
        const currentUrl = window.location ? window.location.href : '';
        const currentKey = this.getCurrentSectionKey();

        // If we haven't moved to target page and target URL is available
        if (currentKey !== next.key && next.url && next.url !== currentUrl && !next.url.endsWith('#') && !next.url.startsWith('javascript:')) {
          log.info('NAV', `Navigating directly to: ${next.url}`);
          const targetWin = window.top || window;
          try {
            targetWin.location.assign(next.url);
          } catch (_) {
            window.location.href = next.url;
          }
        }
      }, 1200);

      // 4. Poll for in-page transition (e.g. AJAX tab switch without full reload)
      this.pollForPageTransition(workflow, next.key, next.name, startUrl);
    }

    /**
     * Polls for in-page / SPA navigation updates where page does not reload
     */
    pollForPageTransition(workflow, targetKey, targetName, startUrl) {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      let checks = 0;
      this.pollInterval = setInterval(async () => {
        checks++;

        if (this.isStopped || !this.active) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          return;
        }

        const currentKey = this.getCurrentSectionKey();
        const currentUrl = window.location ? window.location.href : '';

        // If arrived on target page
        if (currentKey === targetKey || (currentUrl !== startUrl && currentKey !== workflow.visitedKeys[workflow.visitedKeys.length - 1])) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          const opt = window.gloBusOptimizer;
          if (opt && !opt.isRunning && !this.isStopped) {
            await this.resumeIfActive(opt);
          }
        }

        if (checks > 20) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      }, 500);
    }

    /**
     * Automatically resumes optimization when arriving on the next screen
     */
    async resumeIfActive(optimizer) {
      if (this.isStopped) return;

      const log = getLogger();
      try {
        const workflow = await storage.get();
        // Guard: must be explicitly active, not stopped, and awaiting navigation resumption
        if (!workflow || !workflow.active || workflow.stopped || !workflow.pendingNavigation) {
          return;
        }

        // Expiration check: disarm if older than 60 seconds
        const age = Date.now() - new Date(workflow.navigatedAt || workflow.startedAt || 0).getTime();
        if (isNaN(age) || age > 60000 || age < 0) {
          await this.stop();
          return;
        }

        const currentKey = this.getCurrentSectionKey();

        // STRICT LOOP GUARD: If we are still on an already-visited screen, DO NOT re-optimize it!
        if (workflow.visitedKeys.includes(currentKey)) {
          // Check if there are other unvisited screens in the queue
          if (workflow.queue && workflow.queue.length > 0) {
            log.warn('ROUND', `Page remains on already-optimized screen [${currentKey}]. Retrying next screen in queue...`);
            await this.navigateNext(workflow);
          } else {
            await this.stop();
            log.success('ROUND', 'All remaining screens in round completed.');
          }
          return;
        }

        // Mark navigation as consumed immediately to prevent reload loop
        workflow.pendingNavigation = false;
        workflow.visitedKeys.push(currentKey);
        this.active = true;
        this.isStopped = false;
        await storage.set(workflow);

        optimizer.setPreset(workflow.presetKey || 'balanced');

        // Wait for decision inputs to render on the new page
        const adapter = window.gloBusDOMAdapter;
        for (let i = 0; i < 10; i++) {
          if (this.isStopped) return;
          if (adapter && adapter.getDecisionInputs().length > 0) {
            break;
          }
          await new Promise(r => setTimeout(r, 350));
        }

        if (this.isStopped) return;

        // If roundBaselineMetrics was not yet captured (e.g. relocated to Screen 1), establish now
        if (!workflow.roundBaselineMetrics) {
          const roundBaseline = await this.establishRoundBaseline(adapter, log);
          workflow.roundBaselineMetrics = roundBaseline;
          workflow.cycleStartEps = roundBaseline?.eps || 0;
          workflow.totalRunStartEps = roundBaseline?.eps || 0;
          await storage.set(workflow);
        }

        const isFinalPage = !workflow.queue || workflow.queue.length === 0;
        const currentSec = DECISION_SECTIONS.find(s => s.key === currentKey) || { name: 'Decision Page' };
        const cycleNum = workflow.cycleIndex || 1;
        const maxCycles = workflow.maxCycles || 3;
        log.info('RESUME', `Arrived on [${currentSec.name}] (${workflow.visitedKeys.length} of ${workflow.totalCount}) [Cycle ${cycleNum}/${maxCycles}]. Resuming optimization (Saving deferred)...`);

        // Optimize current screen (saving always deferred during cycle execution)
        await optimizer.start(false);

        if (this.isStopped || !this.active) return;

        // Continue to next screen if any remain in this cycle
        if (workflow.queue && workflow.queue.length > 0) {
          await this.navigateNext(workflow);
        } else {
          await this.handleCycleCompletion(workflow, optimizer);
        }
      } catch (err) {
        log.error('ROUND', `Error during resume: ${err.message}`, err);
        console.error('resumeIfActive error:', err);
      }
    }

    /**
     * Evaluates round cycle convergence. If significant gains continue, loops back to Screen 1.
     * When gains plateau or max cycles reached, commits the final auto-save.
     */
    async handleCycleCompletion(workflow, optimizer) {
      if (this.isStopped || !this.active) return;
      const log = getLogger();
      const adapter = window.gloBusDOMAdapter;
      const currentMetrics = adapter ? adapter.getProjectedMetrics() : { eps: 0 };
      const currentEps = currentMetrics?.eps || 0;
      const cycleStartEps = workflow.cycleStartEps || 0;
      const totalRunStartEps = workflow.roundBaselineMetrics?.eps || workflow.totalRunStartEps || cycleStartEps;

      const cycleGain = currentEps - cycleStartEps;
      const totalGain = currentEps - totalRunStartEps;
      const maxCycles = workflow.maxCycles || 3;
      const minGainThreshold = workflow.minEpsGainThreshold || 0.02;

      const hasSignificantGain = cycleGain >= minGainThreshold;
      const canContinue = ((workflow.cycleIndex || 1) < maxCycles) && hasSignificantGain;

      if (canContinue) {
        const nextCycle = (workflow.cycleIndex || 1) + 1;
        log.step('CONVERGE', `Cycle ${workflow.cycleIndex} complete: EPS rose from $${cycleStartEps.toFixed(2)} -> $${currentEps.toFixed(2)} (+Δ $${cycleGain.toFixed(2)}). Gained ≥ +$${minGainThreshold.toFixed(2)} threshold. Looping back to [Product Design] for Cycle ${nextCycle} of ${maxCycles} (Deep Convergence)...`);

        const allLinks = this.discoverDecisionLinks();
        workflow.cycleIndex = nextCycle;
        workflow.cycleStartEps = currentEps;
        workflow.visitedKeys = [];
        workflow.pendingNavigation = false;
        workflow.totalCount = allLinks.length;
        workflow.queue = allLinks.map(q => ({ key: q.key, name: q.name, order: q.order, url: q.url, selectorText: q.selectorText }));

        await storage.set(workflow);
        await this.navigateNext(workflow);
      } else {
        if (!hasSignificantGain) {
          log.success('CONVERGE', `Mathematical convergence achieved! (Cycle ${workflow.cycleIndex} gain: +$${Math.max(0, cycleGain).toFixed(2)} EPS < $${minGainThreshold.toFixed(2)} threshold). EPS stabilized at $${currentEps.toFixed(2)} (Total round gain: +$${Math.max(0, totalGain).toFixed(2)}).`);
        } else {
          log.success('CONVERGE', `Completed maximum ${maxCycles} optimization cycles! Peak EPS: $${currentEps.toFixed(2)} (Total round gain: +$${Math.max(0, totalGain).toFixed(2)}).`);
        }

        // Final Auto-Save on server
        if (adapter) {
          log.info('SAVE', 'Auto-saving finalized peak decisions to Glo-Bus servers...');
          await adapter.saveDecisions();
        }
        await this.stop(false);
        log.success('ROUND', `Autonomous multi-cycle optimization complete! Peak decisions saved to Glo-Bus.`);
      }
    }

    /**
     * Immediately stops Full Round automation and purges workflow storage.
     * Optionally clears the locked round baseline (default: false to preserve HUD summary).
     */
    async stop(clearBaseline = false) {
      this.isStopped = true;
      this.active = false;
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      if (this.navTimeout) {
        clearTimeout(this.navTimeout);
        this.navTimeout = null;
      }
      await storage.remove();
      try {
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
        if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        if (clearBaseline) {
          if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('globus_pilot_round_baseline');
          if (typeof localStorage !== 'undefined') localStorage.removeItem('globus_pilot_round_baseline');
        }
      } catch (_) {}
      getLogger().info('ROUND', 'Full Round coordination stopped.');
    }
  }

  window.GloBusPageCoordinator = GloBusPageCoordinator;
  window.gloBusPageCoordinator = new GloBusPageCoordinator();

  // Auto-resume ONLY if an in-flight navigation workflow is actively awaiting resumption
  setTimeout(() => {
    if (window.gloBusOptimizer && window.gloBusPageCoordinator) {
      window.gloBusPageCoordinator.resumeIfActive(window.gloBusOptimizer).catch(e => {
        console.error('GloBus-Pilot multi-page resume error:', e);
      });
    }
  }, 1000);
})();

  // 5. HUD Controller
/**
 * GloBus-Pilot: Minimalist Floating HUD Controller
 * Clean, modern in-page controller for 1-click optimization and saving
 */

(function () {
  // Prevent duplicate HUD injection or summon if hidden
  const existingHud = document.getElementById('globus-pilot-hud');
  if (existingHud) {
    if (window.gloBusHUD && typeof window.gloBusHUD.show === 'function') {
      window.gloBusHUD.show();
    } else {
      existingHud.style.display = '';
      existingHud.classList.remove('minimized');
    }
    return;
  }

  const hudHtml = `
  <div id="globus-pilot-hud">
    <div class="hud-header" id="hud-drag-handle">
      <div class="hud-brand">
        <span class="hud-status-beacon" title="Engine Online"></span>
        <span class="hud-brand-title">GLOBUS PILOT</span>
      </div>
      <div class="hud-actions">
        <button class="hud-icon-btn" id="hud-btn-minimize" title="Minimize / Expand">_</button>
        <button class="hud-icon-btn" id="hud-btn-close" title="Close HUD">&times;</button>
      </div>
    </div>

    <div class="hud-body">
      <!-- Active Page Indicator -->
      <div class="hud-page-tag">
        <span class="hud-page-eyebrow">SCREEN</span>
        <span class="hud-page-title" id="hud-active-page">Detecting...</span>
      </div>

      <!-- Live Projected Scorecard -->
      <div class="hud-metrics-grid">
        <div class="hud-metric-card">
          <div class="hud-metric-label">Projected EPS</div>
          <div class="hud-metric-val" id="hud-val-eps">$0.00</div>
          <div class="hud-metric-sub" id="hud-delta-eps">Base: $0.00</div>
        </div>
        <div class="hud-metric-card">
          <div class="hud-metric-label">Projected ROE</div>
          <div class="hud-metric-val" id="hud-val-roe">0.0%</div>
          <div class="hud-metric-sub" id="hud-delta-roe">Base: 0.0%</div>
        </div>
        <div class="hud-metric-card">
          <div class="hud-metric-label">Ending Cash</div>
          <div class="hud-metric-val" id="hud-val-cash">$0k</div>
          <div class="hud-metric-sub hud-cash-safe" id="hud-cash-status">Buffer: Safe</div>
        </div>
        <div class="hud-metric-card">
          <div class="hud-metric-label">Credit / Image</div>
          <div class="hud-metric-val" id="hud-val-credit">-- / --</div>
          <div class="hud-metric-sub" id="hud-credit-target">Grade Target: A-</div>
        </div>
      </div>

      <!-- Live Progress Bar -->
      <div class="hud-progress-wrap" id="hud-progress-wrap">
        <div class="hud-progress-meta">
          <span class="hud-status-text" id="hud-status-text">Ready to optimize.</span>
        </div>
        <div class="hud-progress-bar-bg">
          <div class="hud-progress-bar-fill" id="hud-progress-fill"></div>
        </div>
      </div>

      <!-- Status Toast Message -->
      <div class="hud-toast" id="hud-toast">Decisions optimized and saved to Glo-Bus!</div>

      <!-- Main Action Button (Sharplink Sharp Transparent Grey Style) -->
      <button class="hud-btn-primary" id="hud-btn-optimize">
        <span class="hud-btn-text">OPTIMIZE FULL ROUND</span>
        <span class="hud-btn-arrow">→</span>
      </button>

      <!-- Secondary Actions -->
      <div class="hud-secondary-row">
        <button class="hud-btn-secondary" id="hud-btn-revert">
          <span>REVERT</span>
        </button>
        <button class="hud-btn-secondary" id="hud-btn-inspect">
          <span>INSPECT</span>
        </button>
      </div>

      <!-- Activity Log & Diagnostics Drawer -->
      <div class="hud-drawer-section">
        <button class="hud-drawer-toggle" id="hud-toggle-drawer" type="button">
          <div class="hud-toggle-left">
            <span class="hud-drawer-arrow" id="hud-drawer-arrow">▶</span>
            <span class="hud-drawer-title">DIAGNOSTICS & TELEMETRY</span>
          </div>
          <span class="hud-log-badge" id="hud-log-badge">0</span>
        </button>

        <div class="hud-drawer-panel" id="hud-drawer-panel">
          <div class="hud-drawer-toolbar">
            <span class="hud-toolbar-label">ENGINE LOG</span>
            <div class="hud-toolbar-actions">
              <button class="hud-tool-btn" id="hud-btn-copy" title="Copy debug log">COPY</button>
              <button class="hud-tool-btn" id="hud-btn-clear" title="Clear log">CLEAR</button>
            </div>
          </div>
          <div class="hud-terminal" id="hud-terminal">
            <div class="hud-log-empty" id="hud-log-empty">No events recorded.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  `;

  // Inject HUD into DOM
  const container = document.createElement('div');
  container.innerHTML = hudHtml;
  document.body.appendChild(container.firstElementChild);

  // References
  const hud = document.getElementById('globus-pilot-hud');
  const dragHandle = document.getElementById('hud-drag-handle');
  const btnMinimize = document.getElementById('hud-btn-minimize');
  const btnClose = document.getElementById('hud-btn-close');
  const btnOptimize = document.getElementById('hud-btn-optimize');
  const btnRevert = document.getElementById('hud-btn-revert');
  const btnInspect = document.getElementById('hud-btn-inspect');

  const toggleDrawer = document.getElementById('hud-toggle-drawer');
  const drawerArrow = document.getElementById('hud-drawer-arrow');
  const drawerPanel = document.getElementById('hud-drawer-panel');
  const logBadge = document.getElementById('hud-log-badge');
  const btnCopyLog = document.getElementById('hud-btn-copy');
  const btnClearLog = document.getElementById('hud-btn-clear');
  const terminal = document.getElementById('hud-terminal');

  const activePageLabel = document.getElementById('hud-active-page');

  const valEPS = document.getElementById('hud-val-eps');
  const deltaEPS = document.getElementById('hud-delta-eps');
  const valROE = document.getElementById('hud-val-roe');
  const deltaROE = document.getElementById('hud-delta-roe');
  const valCash = document.getElementById('hud-val-cash');
  const cashStatus = document.getElementById('hud-cash-status');
  const valCredit = document.getElementById('hud-val-credit');
  const creditTarget = document.getElementById('hud-credit-target');

  const progressWrap = document.getElementById('hud-progress-wrap');
  const progressFill = document.getElementById('hud-progress-fill');
  const statusText = document.getElementById('hud-status-text');
  const toast = document.getElementById('hud-toast');

  const adapter = window.gloBusDOMAdapter;
  const optimizer = window.gloBusOptimizer;
  const coordinator = window.gloBusPageCoordinator;

  let baseMetrics = null;

  /**
   * Retrieves active baseline for comparison:
   * Prioritizes persistent Round Baseline if full round is active or completed.
   */
  function getActiveBaseline() {
    try {
      const raw = sessionStorage.getItem('globus_pilot_round_baseline') || localStorage.getItem('globus_pilot_round_baseline');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.eps > 0) return { ...parsed, isRoundBase: true };
      }
    } catch (_) {}

    if (baseMetrics && baseMetrics.eps > 0) {
      return { ...baseMetrics, isRoundBase: false };
    }
    return null;
  }

  const PAGE_NAMES = {
    PRODUCT_DESIGN: 'Product Design',
    AC_MARKETING: 'AC Camera Marketing',
    UAV_MARKETING: 'UAV Drone Marketing',
    COMPENSATION_FACILITIES: 'Compensation & Facilities',
    WORKFORCE_COMPENSATION: 'Compensation & Facilities',
    SPECIAL_CONTRACTS: 'Special Contract Offers',
    CSR: 'Corporate Citizenship',
    FINANCE: 'Finance & Cash Flow'
  };

  // Format page name nicely
  function updatePageLabel() {
    if (adapter) {
      const pageType = adapter.pageType;
      activePageLabel.textContent = PAGE_NAMES[pageType] || pageType
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  // Update live scorecard values
  function renderMetrics(m) {
    if (!m) return;
    if (m.eps > 0) valEPS.textContent = `$${m.eps.toFixed(2)}`;
    if (m.roe > 0) valROE.textContent = `${m.roe.toFixed(1)}%`;
    if (Number.isFinite(m.endingCash)) valCash.textContent = `$${Math.round(m.endingCash).toLocaleString()}k`;
    valCredit.textContent = `${m.creditRating || '--'} / ${m.imageRating || '--'}`;

    // Cash status indicator
    if (m.endingCash < 1500 && m.endingCash > 0) {
      cashStatus.textContent = 'Risk of Overdraft!';
      cashStatus.className = 'hud-metric-sub hud-cash-danger';
    } else if (m.endingCash < 2500 && m.endingCash > 0) {
      cashStatus.textContent = 'Buffer: Moderate';
      cashStatus.className = 'hud-metric-sub hud-cash-warn';
    } else if (m.endingCash >= 2500) {
      cashStatus.textContent = 'Buffer: Safe';
      cashStatus.className = 'hud-metric-sub hud-cash-safe';
    }

    // Delta display relative to active baseline
    const base = getActiveBaseline();

    if (base && base.eps > 0) {
      const prefix = base.isRoundBase ? 'Round Base' : 'Base';
      const dEPS = m.eps - base.eps;
      const dROE = m.roe - base.roe;

      if (Math.abs(dEPS) < 0.005) {
        deltaEPS.textContent = `${prefix}: $${base.eps.toFixed(2)}`;
      } else {
        deltaEPS.textContent = dEPS >= 0
          ? `+ $${dEPS.toFixed(2)} (${prefix}: $${base.eps.toFixed(2)})`
          : `- $${Math.abs(dEPS).toFixed(2)} (${prefix}: $${base.eps.toFixed(2)})`;
      }

      if (Math.abs(dROE) < 0.05) {
        deltaROE.textContent = `${prefix}: ${base.roe.toFixed(1)}%`;
      } else {
        deltaROE.textContent = dROE >= 0
          ? `+ ${dROE.toFixed(1)}% (${prefix}: ${base.roe.toFixed(1)}%)`
          : `- ${Math.abs(dROE).toFixed(1)}% (${prefix}: ${base.roe.toFixed(1)}%)`;
      }

      // Image rating delta feedback
      if (creditTarget && base.imageRating) {
        const dImg = (m.imageRating || 0) - base.imageRating;
        if (dImg !== 0) {
          const sign = dImg > 0 ? '+' : '';
          creditTarget.textContent = `Target: A- | Img: ${sign}${dImg} (${prefix}: ${base.imageRating})`;
        } else {
          creditTarget.textContent = `Target: A- | ${prefix} Img: ${base.imageRating}`;
        }
      }
    } else {
      if (m.eps > 0) deltaEPS.textContent = `Base: $${m.eps.toFixed(2)}`;
      if (m.roe > 0) deltaROE.textContent = `Base: ${m.roe.toFixed(1)}%`;
    }
  }

  let toastTimeout = null;
  function showToast(message, isError = false) {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    toast.textContent = message;
    toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.3)';
    toast.style.color = isError ? '#f87171' : '#34d399';
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    toast.classList.add('visible');
    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
      toastTimeout = null;
    }, 5000);
  }

  // Draggable HUD functionality
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  dragHandle.addEventListener('mousedown', (e) => {
    if (e.target.closest('.hud-icon-btn')) return;
    isDragging = true;
    offsetX = e.clientX - hud.getBoundingClientRect().left;
    offsetY = e.clientY - hud.getBoundingClientRect().top;
  });

  const onMouseMove = (e) => {
    if (!isDragging) return;
    hud.style.left = `${Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, e.clientX - offsetX))}px`;
    hud.style.top = `${Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, e.clientY - offsetY))}px`;
    hud.style.right = 'auto';
  };

  const onMouseUp = () => {
    isDragging = false;
  };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // Minimize / Expand
  btnMinimize.addEventListener('click', () => {
    hud.classList.toggle('minimized');
    btnMinimize.textContent = hud.classList.contains('minimized') ? '□' : '_';
  });

  // Close
  btnClose.addEventListener('click', () => {
    stopHeartbeat();
    hud.style.display = 'none';
  });



  // Drawer Controls
  function setDrawerOpen(isOpen) {
    if (isOpen) {
      drawerPanel.classList.add('open');
      drawerArrow.textContent = '▼';
    } else {
      drawerPanel.classList.remove('open');
      drawerArrow.textContent = '▶';
    }
  }

  toggleDrawer.addEventListener('click', () => {
    setDrawerOpen(!drawerPanel.classList.contains('open'));
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Subscribe to Centralized Logger
  if (window.gloBusLogger) {
    window.gloBusLogger.addListener((entry, allLogs) => {
      if (!entry) {
        terminal.innerHTML = '<div class="hud-log-empty" id="hud-log-empty">No events recorded. Click "Inspect" or "Optimize" to view telemetry.</div>';
        logBadge.textContent = '0';
        return;
      }

      const emptyEl = document.getElementById('hud-log-empty');
      if (emptyEl) emptyEl.remove();

      logBadge.textContent = allLogs.length;

      const row = document.createElement('div');
      row.className = `hud-log-row hud-log-${entry.level}`;
      row.innerHTML = `<span class="hud-log-time">${entry.timestamp}</span> <span class="hud-log-tag">[${escapeHtml(entry.tag)}]</span> <span class="hud-log-msg">${escapeHtml(entry.message)}</span>`;
      
      terminal.appendChild(row);
      terminal.scrollTop = terminal.scrollHeight;
    });
  }

  // Inspect Page Button
  btnInspect.addEventListener('click', () => {
    setDrawerOpen(true);
    if (adapter) {
      const report = adapter.inspectPage();
      if (report.metricsParsed && report.metricsParsed.eps > 0) {
        if (!getActiveBaseline()) {
          baseMetrics = report.metricsParsed;
        }
        renderMetrics(report.metricsParsed);
      }
      showToast(`Scan complete: ${report.decisionInputsFound} inputs, ${report.framesScanned} frame(s), EPS: $${report.metricsParsed.eps.toFixed(2)}`);
    } else {
      showToast('DOM adapter not initialized.', true);
    }
  });

  // Copy Debug Log Button
  btnCopyLog.addEventListener('click', () => {
    if (window.gloBusLogger) {
      const txt = window.gloBusLogger.getPlainText();
      if (!txt) {
        showToast('Log is currently empty.');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => {
          showToast('Debug log copied to clipboard!');
        }).catch(() => fallbackCopy(txt));
      } else {
        fallbackCopy(txt);
      }
    }
  });

  function fallbackCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('Debug log copied to clipboard!');
    } catch (_) {
      showToast('Could not copy log automatically. Check console.', true);
    }
  }

  // Clear Log Button
  btnClearLog.addEventListener('click', () => {
    if (window.gloBusLogger) {
      window.gloBusLogger.clear();
      showToast('Console log cleared.');
    }
  });

  // Optimizer Callbacks
  if (optimizer) {
    optimizer.onStatusChange = (status) => {
      if (status === 'running') {
        btnOptimize.classList.add('running');
        btnOptimize.querySelector('span').textContent = 'STOP OPTIMIZATION';
        progressWrap.classList.add('visible');
        toast.classList.remove('visible');
        setDrawerOpen(true); // Automatically reveal live terminal to user!
      } else {
        btnOptimize.classList.remove('running');
        btnOptimize.querySelector('span').textContent = 'OPTIMIZE FULL ROUND';
        if (status === 'stopped') {
          statusText.textContent = 'Optimization paused.';
        }
      }
    };

    optimizer.onProgress = (step, total, paramName, currentBest) => {
      const pct = Math.min(100, Math.round((step / total) * 100));
      progressFill.style.width = `${pct}%`;
      statusText.textContent = `Tuning: ${paramName.slice(0, 26)} (${pct}%)`;
      if (currentBest) renderMetrics(currentBest);
    };

    optimizer.onComplete = (bestMetrics, saveResult) => {
      progressFill.style.width = '100%';
      statusText.textContent = 'Optimization finished!';
      if (bestMetrics) renderMetrics(bestMetrics);

      if (saveResult && saveResult.ok) {
        showToast('Best decisions successfully applied & saved to Glo-Bus!');
      } else if (saveResult && !saveResult.ok) {
        showToast(`Best values applied! (Note: ${saveResult.error})`, true);
      } else {
        showToast('Best values applied to page!');
      }
    };
    optimizer.onBaselineEstablished = (baseline) => {
      if (!getActiveBaseline()) {
        baseMetrics = baseline;
      }
      renderMetrics(baseline);
    };
  }

  // Primary Action Button (Optimize Full Round)
  btnOptimize.addEventListener('click', async () => {
    if (!optimizer) return;

    if (optimizer.isRunning || (coordinator && coordinator.active)) {
      optimizer.stop();
      if (coordinator) await coordinator.stop(false);
      btnOptimize.classList.remove('running');
      btnOptimize.querySelector('span').textContent = 'OPTIMIZE FULL ROUND';
      statusText.textContent = 'Optimization stopped.';
      return;
    }

    setDrawerOpen(true);
    optimizer.setPreset('balanced');

    if (coordinator) {
      statusText.textContent = 'Starting multi-page round optimization...';
      progressWrap.classList.add('visible');
      await coordinator.startFullRound(optimizer, 'balanced');
    }
  });

  // Revert Button
  btnRevert.addEventListener('click', async () => {
    if (coordinator) await coordinator.stop(true);
    try {
      sessionStorage.removeItem('globus_pilot_round_baseline');
      localStorage.removeItem('globus_pilot_round_baseline');
    } catch (_) {}
    baseMetrics = null;
    if (optimizer) {
      await optimizer.revertToInitial();
      refreshLiveScoreboard();
      showToast('Reverted back to original decisions.');
    }
  });

  // Live Scoreboard Probes and Heartbeat
  function refreshLiveScoreboard() {
    updatePageLabel();
    if (!adapter) return;
    const m = adapter.getProjectedMetrics();
    if (m && m.eps > 0) {
      if (!baseMetrics || baseMetrics.eps === 0) {
        baseMetrics = { ...m };
      } else if (baseMetrics.endingCash === 0 && m.endingCash > 0) {
        baseMetrics.endingCash = m.endingCash;
      }
      renderMetrics(m);
    }
  }

  // Probe at staggered intervals after load to reliably catch async iframe/table rendering
  const startupTimers = [150, 400, 900, 1800, 3200].map(t => setTimeout(refreshLiveScoreboard, t));

  // Periodic heartbeat every 2.5s when idle to keep HUD live and synced
  let heartbeatInterval = null;
  function startHeartbeat() {
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(() => {
      if (hud.style.display !== 'none' && (!optimizer || !optimizer.isRunning)) {
        refreshLiveScoreboard();
      }
    }, 2500);
  }

  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }

  startHeartbeat();


  // Expose HUD controller API for lifecycle management and testing
  window.gloBusHUD = {
    show: () => {
      hud.style.display = '';
      hud.classList.remove('minimized');
      startHeartbeat();
      refreshLiveScoreboard();
    },
    hide: () => {
      stopHeartbeat();
      hud.style.display = 'none';
    },
    destroy: () => {
      stopHeartbeat();
      startupTimers.forEach(t => clearTimeout(t));
      if (toastTimeout) clearTimeout(toastTimeout);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      hud.remove();
      delete window.gloBusHUD;
    }
  };

  console.log('GloBus-Pilot minimal HUD ready with Live Diagnostics Console.');
})();

})();
