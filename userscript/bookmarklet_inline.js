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
  const css = "/* ==========================================================================\n   GloBus-Pilot // Sharplink Minimalist Frosted Glass HUD\n   Light Blue/Grey Frosted Gradient Surface with Darker Transparent Grey Glass Elements\n   Inspired by Sharplink (https://www.sharplink.com/)\n   ========================================================================== */\n\n@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');\n\n:root {\n  /* Frosted Glass Outer Surface (Subtle Light Blue/Grey Gradient) */\n  --sl-glass-bg: linear-gradient(155deg, rgba(242, 247, 253, 0.82) 0%, rgba(226, 235, 246, 0.70) 50%, rgba(212, 224, 238, 0.76) 100%);\n  \n  /* Inner Elements: Visibly Darker & Transparent Grey Glass */\n  --sl-glass-card: rgba(15, 23, 42, 0.055);\n  --sl-glass-card-hover: rgba(15, 23, 42, 0.095);\n  --sl-glass-drawer: rgba(15, 23, 42, 0.055);\n  \n  /* Hairline Borders with Defined Contrast */\n  --sl-border: rgba(15, 23, 42, 0.12);\n  --sl-border-subtle: rgba(15, 23, 42, 0.07);\n  --sl-border-hover: rgba(15, 23, 42, 0.24);\n  \n  /* Transparent Grey Buttons (Sharplink Style) */\n  --sl-btn-primary-bg: rgba(15, 23, 42, 0.11);\n  --sl-btn-primary-border: rgba(15, 23, 42, 0.20);\n  --sl-btn-primary-text: #0b0f19;\n  --sl-btn-primary-hover: rgba(15, 23, 42, 0.19);\n  --sl-btn-primary-hover-border: rgba(15, 23, 42, 0.32);\n  --sl-btn-primary-active: rgba(15, 23, 42, 0.26);\n  \n  --sl-btn-secondary-bg: rgba(15, 23, 42, 0.055);\n  --sl-btn-secondary-border: rgba(15, 23, 42, 0.12);\n  --sl-btn-secondary-text: #334155;\n  --sl-btn-secondary-hover: rgba(15, 23, 42, 0.12);\n  --sl-btn-secondary-hover-text: #0b0f19;\n  \n  /* Accent & Status Colors */\n  --sl-brand-blue: #0e76ff;\n  --sl-safe: #059669;\n  --sl-warn: #d97706;\n  --sl-danger: #dc2626;\n  \n  /* Typography Colors */\n  --sl-text-primary: #0b0f19;\n  --sl-text-secondary: #475569;\n  --sl-text-muted: #64748b;\n  \n  /* Fonts */\n  --sl-font-sans: 'Space Grotesk', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  --sl-font-mono: 'JetBrains Mono', 'SF Mono', Consolas, Menlo, monospace;\n}\n\n/* Scoped Box-Sizing Isolation: immune to Glo-Bus page stylesheet content-box overrides */\n#globus-pilot-hud,\n#globus-pilot-hud *,\n#globus-pilot-hud *::before,\n#globus-pilot-hud *::after {\n  box-sizing: border-box !important;\n}\n\n#globus-pilot-hud {\n  position: fixed;\n  top: 24px;\n  right: 24px;\n  width: 340px;\n  max-width: calc(100vw - 32px);\n  background: var(--sl-glass-bg);\n  backdrop-filter: blur(28px) saturate(190%);\n  -webkit-backdrop-filter: blur(28px) saturate(190%);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  box-shadow: \n    0 20px 48px rgba(15, 23, 42, 0.14),\n    0 1px 0 rgba(255, 255, 255, 0.95) inset;\n  color: var(--sl-text-primary);\n  font-family: var(--sl-font-sans);\n  font-size: 12px;\n  z-index: 9999999;\n  overflow: hidden;\n  transition: width 0.2s cubic-bezier(0.16, 1, 0.3, 1), height 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.15s ease;\n  user-select: none;\n}\n\n#globus-pilot-hud:hover {\n  border-color: var(--sl-border-hover);\n}\n\n/* Minimized Docked Capsule */\n#globus-pilot-hud.minimized {\n  width: 210px;\n  height: 38px;\n  border-color: rgba(15, 23, 42, 0.16);\n  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.10);\n  overflow: hidden;\n}\n\n#globus-pilot-hud.minimized .hud-body {\n  display: none;\n}\n\n#globus-pilot-hud.minimized .hud-header {\n  border-bottom: none;\n  height: 38px;\n  padding: 0 12px;\n}\n\n/* ==========================================================================\n   Header Bar\n   ========================================================================== */\n.hud-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 10px 14px;\n  background: rgba(15, 23, 42, 0.035);\n  border-bottom: 1px solid var(--sl-border);\n  cursor: grab;\n}\n\n.hud-header:active {\n  cursor: grabbing;\n}\n\n.hud-brand {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.hud-status-beacon {\n  width: 5px;\n  height: 5px;\n  border-radius: 50%;\n  background: var(--sl-brand-blue);\n  flex-shrink: 0;\n}\n\n.hud-brand-title {\n  font-family: var(--sl-font-sans);\n  font-weight: 700;\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--sl-text-primary);\n}\n\n.hud-actions {\n  display: flex;\n  gap: 4px;\n}\n\n.hud-icon-btn {\n  background: rgba(15, 23, 42, 0.06);\n  border: 1px solid var(--sl-border);\n  color: var(--sl-text-secondary);\n  width: 20px;\n  height: 20px;\n  border-radius: 0px;\n  cursor: pointer;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  font-family: var(--sl-font-mono);\n  font-size: 10px;\n  transition: all 0.15s ease;\n}\n\n.hud-icon-btn:hover {\n  background: rgba(15, 23, 42, 0.14);\n  border-color: var(--sl-border-hover);\n  color: var(--sl-text-primary);\n}\n\n#hud-btn-close:hover {\n  background: rgba(220, 38, 38, 0.15);\n  border-color: rgba(220, 38, 38, 0.40);\n  color: var(--sl-danger);\n}\n\n/* ==========================================================================\n   HUD Body & Layout\n   ========================================================================== */\n.hud-body {\n  padding: 13px;\n  display: flex;\n  flex-direction: column;\n  gap: 11px;\n}\n\n/* Active Screen Breadcrumb (Darker Transparent Tag) */\n.hud-page-tag {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 6px 10px;\n  background: rgba(15, 23, 42, 0.045);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n}\n\n.hud-page-eyebrow {\n  font-family: var(--sl-font-mono);\n  font-size: 9px;\n  font-weight: 600;\n  letter-spacing: 0.1em;\n  color: var(--sl-text-muted);\n}\n\n.hud-page-title {\n  font-family: var(--sl-font-mono);\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--sl-text-primary);\n  letter-spacing: 0.02em;\n}\n\n/* ==========================================================================\n   Metrics Scorecard (Darker Transparent Grey Glass Tiles)\n   ========================================================================== */\n.hud-metrics-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 7px;\n  width: 100%;\n}\n\n.hud-metric-card {\n  min-width: 0;\n  max-width: 100%;\n  overflow: hidden;\n  background: var(--sl-glass-card);\n  backdrop-filter: blur(14px);\n  -webkit-backdrop-filter: blur(14px);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  padding: 9px 10px;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 0 rgba(255, 255, 255, 0.50) inset;\n}\n\n.hud-metric-label {\n  font-family: var(--sl-font-mono);\n  font-size: 9px;\n  font-weight: 600;\n  text-transform: uppercase;\n  color: var(--sl-text-secondary);\n  letter-spacing: 0.06em;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.hud-metric-val {\n  font-family: var(--sl-font-mono);\n  font-size: 18px;\n  font-weight: 700;\n  color: var(--sl-text-primary);\n  line-height: 1.15;\n  letter-spacing: -0.02em;\n  font-variant-numeric: tabular-nums;\n  margin-top: 1px;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.hud-metric-sub {\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  color: var(--sl-text-muted);\n  font-weight: 500;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  margin-top: 2px;\n}\n\n.hud-cash-safe {\n  color: var(--sl-safe);\n}\n\n.hud-cash-warn {\n  color: var(--sl-warn);\n}\n\n.hud-cash-danger {\n  color: var(--sl-danger);\n}\n\n/* ==========================================================================\n   Live Progress Bar\n   ========================================================================== */\n.hud-progress-wrap {\n  display: none;\n  flex-direction: column;\n  gap: 5px;\n  padding: 8px 10px;\n  background: rgba(15, 23, 42, 0.045);\n  border: 1px solid var(--sl-border-subtle);\n  border-radius: 0px;\n}\n\n.hud-progress-wrap.visible {\n  display: flex;\n}\n\n.hud-progress-meta {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n}\n\n.hud-status-text {\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  color: var(--sl-text-secondary);\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.hud-progress-bar-bg {\n  height: 2px;\n  background: rgba(15, 23, 42, 0.10);\n  border-radius: 0px;\n  overflow: hidden;\n}\n\n.hud-progress-bar-fill {\n  height: 100%;\n  width: 0%;\n  background: var(--sl-text-primary);\n  transition: width 0.2s ease;\n}\n\n/* ==========================================================================\n   Toast Notification\n   ========================================================================== */\n.hud-toast {\n  display: none;\n  padding: 7px 11px;\n  background: rgba(5, 150, 105, 0.12);\n  border: 1px solid rgba(5, 150, 105, 0.25);\n  color: var(--sl-safe);\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 10px;\n  font-weight: 600;\n  text-align: center;\n}\n\n.hud-toast.visible {\n  display: block;\n}\n\n/* ==========================================================================\n   Sharplink Primary Button (Transparent Grey Glass with Sharp Corners)\n   ========================================================================== */\n.hud-btn-primary {\n  width: 100%;\n  height: 38px;\n  background: var(--sl-btn-primary-bg);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid var(--sl-btn-primary-border);\n  color: var(--sl-btn-primary-text);\n  border-radius: 0px;\n  font-family: var(--sl-font-sans);\n  font-weight: 700;\n  font-size: 11.5px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  cursor: pointer;\n  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 0 rgba(255, 255, 255, 0.50) inset;\n  transition: all 0.15s ease;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0 14px;\n}\n\n.hud-btn-primary:hover {\n  background: var(--sl-btn-primary-hover);\n  border-color: var(--sl-btn-primary-hover-border);\n  color: #000000;\n  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.10);\n}\n\n.hud-btn-primary:active {\n  background: var(--sl-btn-primary-active);\n}\n\n.hud-btn-text {\n  flex: 1;\n  text-align: center;\n}\n\n.hud-btn-arrow {\n  font-family: var(--sl-font-mono);\n  font-size: 13px;\n  font-weight: 700;\n  transition: transform 0.15s ease;\n  margin-left: 6px;\n}\n\n.hud-btn-primary:hover .hud-btn-arrow {\n  transform: translateX(3px);\n}\n\n.hud-btn-primary.running {\n  background: rgba(220, 38, 38, 0.18);\n  border-color: rgba(220, 38, 38, 0.45);\n  color: var(--sl-danger);\n}\n\n.hud-btn-primary.running:hover {\n  background: rgba(220, 38, 38, 0.28);\n}\n\n/* Secondary Button Row (Transparent Grey Glass Buttons) */\n.hud-secondary-row {\n  display: flex;\n  gap: 7px;\n}\n\n.hud-btn-secondary {\n  flex: 1;\n  height: 32px;\n  background: var(--sl-btn-secondary-bg);\n  backdrop-filter: blur(20px);\n  -webkit-backdrop-filter: blur(20px);\n  border: 1px solid var(--sl-btn-secondary-border);\n  color: var(--sl-btn-secondary-text);\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  font-weight: 600;\n  letter-spacing: 0.08em;\n  text-transform: uppercase;\n  cursor: pointer;\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n  transition: all 0.15s ease;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n\n.hud-btn-secondary:hover {\n  background: var(--sl-btn-secondary-hover);\n  border-color: var(--sl-border-hover);\n  color: var(--sl-btn-secondary-hover-text);\n  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);\n}\n\n/* ==========================================================================\n   Activity Log & Diagnostics Drawer (Darker Transparent Grey)\n   ========================================================================== */\n.hud-drawer-section {\n  border-top: 1px solid var(--sl-border);\n  margin-top: 2px;\n  padding-top: 8px;\n}\n\n.hud-drawer-toggle {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  width: 100%;\n  background: transparent;\n  border: none;\n  color: var(--sl-text-secondary);\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  font-weight: 600;\n  letter-spacing: 0.08em;\n  cursor: pointer;\n  padding: 5px 6px;\n  border-radius: 0px;\n  transition: color 0.15s ease;\n}\n\n.hud-drawer-toggle:hover {\n  color: var(--sl-text-primary);\n}\n\n.hud-toggle-left {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n\n.hud-drawer-arrow {\n  font-size: 8px;\n  color: var(--sl-text-muted);\n  display: inline-block;\n  transition: transform 0.15s ease;\n}\n\n.hud-log-badge {\n  background: rgba(15, 23, 42, 0.08);\n  color: var(--sl-text-secondary);\n  border: 1px solid var(--sl-border-subtle);\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  padding: 1px 5px;\n  border-radius: 0px;\n  font-weight: 600;\n}\n\n.hud-drawer-panel {\n  display: none;\n  flex-direction: column;\n  gap: 6px;\n  margin-top: 6px;\n}\n\n.hud-drawer-panel.open {\n  display: flex;\n}\n\n.hud-drawer-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}\n\n.hud-toolbar-label {\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  color: var(--sl-text-muted);\n  text-transform: uppercase;\n  letter-spacing: 0.08em;\n  font-weight: 600;\n}\n\n.hud-toolbar-actions {\n  display: flex;\n  gap: 4px;\n}\n\n.hud-tool-btn {\n  background: rgba(15, 23, 42, 0.06);\n  border: 1px solid var(--sl-border-subtle);\n  color: var(--sl-text-secondary);\n  padding: 2px 7px;\n  border-radius: 0px;\n  font-family: var(--sl-font-mono);\n  font-size: 8.5px;\n  font-weight: 600;\n  cursor: pointer;\n  transition: all 0.15s ease;\n}\n\n.hud-tool-btn:hover {\n  background: rgba(15, 23, 42, 0.14);\n  color: var(--sl-text-primary);\n  border-color: var(--sl-border);\n}\n\n/* Console Terminal Box (Darker Transparent Panel) */\n.hud-terminal {\n  background: var(--sl-glass-drawer);\n  backdrop-filter: blur(16px);\n  -webkit-backdrop-filter: blur(16px);\n  border: 1px solid var(--sl-border);\n  border-radius: 0px;\n  padding: 8px 10px;\n  max-height: 170px;\n  min-height: 90px;\n  overflow-y: auto;\n  font-family: var(--sl-font-mono);\n  font-size: 9.5px;\n  line-height: 1.5;\n  display: flex;\n  flex-direction: column;\n  gap: 3px;\n  color: var(--sl-text-primary);\n  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.40) inset;\n}\n\n.hud-terminal::-webkit-scrollbar {\n  width: 3px;\n}\n\n.hud-terminal::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n.hud-terminal::-webkit-scrollbar-thumb {\n  background: rgba(15, 23, 42, 0.15);\n  border-radius: 0px;\n}\n\n.hud-terminal::-webkit-scrollbar-thumb:hover {\n  background: rgba(15, 23, 42, 0.30);\n}\n\n.hud-log-empty {\n  color: var(--sl-text-muted);\n  font-style: italic;\n  text-align: center;\n  padding: 22px 8px;\n}\n\n.hud-log-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 6px;\n  word-break: break-word;\n}\n\n.hud-log-time {\n  color: var(--sl-text-muted);\n  font-size: 8.5px;\n  flex-shrink: 0;\n  margin-top: 1px;\n}\n\n.hud-log-tag {\n  font-weight: 600;\n  flex-shrink: 0;\n  font-size: 9px;\n}\n\n.hud-log-msg {\n  color: var(--sl-text-primary);\n  flex: 1;\n}\n\n/* Sharplink Clean Log Colors */\n.hud-log-info .hud-log-tag { color: var(--sl-brand-blue); }\n.hud-log-info .hud-log-msg { color: #1e293b; }\n\n.hud-log-success .hud-log-tag { color: var(--sl-safe); }\n.hud-log-success .hud-log-msg { color: #064e3b; }\n\n.hud-log-warn .hud-log-tag { color: var(--sl-warn); }\n.hud-log-warn .hud-log-msg { color: #78350f; }\n\n.hud-log-error .hud-log-tag { color: var(--sl-danger); }\n.hud-log-error .hud-log-msg { color: #7f1d1d; }\n\n.hud-log-step .hud-log-tag { color: #7c3aed; }\n.hud-log-step .hud-log-msg { color: #3b0764; }\n";
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

  async restoreSnapshot(snapshot, cachedInputsList = null) {
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
            item.selectedIndex = idx;
            item.value = saved.value;
          }
        } else {
          this.setInputValue(item, saved.value);
          item.value = saved.value;
        }
      }
    }

    // Re-synchronize cached/caller input objects if provided
    if (Array.isArray(cachedInputsList)) {
      for (const item of cachedInputsList) {
        const saved = target[item.key] || target[item.id] || target[item.name];
        if (saved !== undefined) {
          if (item.type === 'select') {
            let idx = saved.selectedIndex;
            if (idx === undefined && saved.value !== undefined) {
              const optIdx = item.options ? item.options.findIndex(o => String(o.value) === String(saved.value)) : -1;
              idx = optIdx !== -1 ? optIdx : parseInt(saved.value, 10);
            }
            if (idx !== undefined && !isNaN(idx)) {
              item.selectedIndex = idx;
              item.value = saved.value;
              if (item.element) item.element.selectedIndex = idx;
            }
          } else {
            const numVal = typeof saved.value === 'number' ? saved.value : parseFloat(String(saved.value).replace(/,/g, ''));
            item.value = Number.isFinite(numVal) ? numVal : saved.value;
            if (item.element) item.element.value = saved.value;
          }
        }
      }
    }

    await this.triggerCalculate();
  }
}

// Attach globally
window.gloBusDOMAdapter = new GloBusDOMAdapter();


  // 3. Mathematical & Capacity Kernels
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
        // Operational Image Slack Buffer (Audit Fix #1):
        // On operational screens (1-4), if Image Rating meets or exceeds Investor Expectation (>= targetImage, e.g. 75),
        // award the full +20% expectation bonus so coordinate descent doesn't reject EPS-positive moves due to
        // integer rounding jitter (e.g. 77 -> 76). Non-operational screens (CSR, Finance, Finalization) evaluate
        // the precise bonusPct to maintain authentic game scoring.
        const effectiveBonus = (isOperational && metrics.imageRating >= targetImage) ? 0.20 : bonusPct;
        scoreImage_IE = 20.0 * (1 + effectiveBonus);
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
      // Operational Image Slack Buffer (Audit Fix #1):
      // On operational screens (1-4), if Image Rating meets or exceeds Investor Expectation (>= targetImage, e.g. 75),
      // do not apply the integer BII reduction cliff. This allows coordinate descent to accept EPS-positive moves
      // within a 1-2 pt image rounding band. Screen 6 (CSR) runs in non-operational mode to re-anchor Image >= Baseline.
      const scoreImage_BII = (isOperational && metrics.imageRating >= targetImage)
        ? 20.0
        : 20.0 * Math.min(1.0, metrics.imageRating / benchmarkImage);

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
      // UNBOUNDED COMPETITIVE SURPLUS REGULARIZER (Fix #3, Audit Fix #5)
      // Guarantees non-zero gradient (nabla f != 0) above arbitrary saturation ceilings
      // across EPS, Cash, ROE, and Stock Price.
      // =========================================================================
      const epsRegularizer = 0.20 * metrics.eps;
      // Cash regularizer gives slight tie-breaking preference to cash solvency,
      // but is strictly capped at $10,000k to prevent toxic debt borrowing accumulation.
      const effectiveCash = Math.min(10000, Math.max(0, metrics.endingCash || 0));
      const cashRegularizer = 0.005 * Math.log(1.0 + effectiveCash);
      // ROE regularizer ensures excess cash deployment (dividends/buybacks) produces positive gradient
      const roeRegularizer = 0.02 * (metrics.roe || 0);
      // Stock price regularizer ensures equity/valuation increases produce positive gradient
      const stockRegularizer = 0.002 * (effectiveStockPrice || 0);
      compositeScore += epsRegularizer + cashRegularizer + roeRegularizer + stockRegularizer;

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


  // 4. Optimizer Engine
/**
 * GloBus-Pilot: Multi-Objective Decision Optimizer Engine
 * Algorithms: Bounded Coordinate Descent with Momentum & Heuristic Line Search
 * Safety Guardrails: Hard Constraints for Ending Cash Buffer ($2,500k+), Credit Floor, and Quality Bounds
 */

const ScoringKernel = (typeof window !== 'undefined' && window.GloBusScoringKernel)
  ? window.GloBusScoringKernel
  : (typeof require !== 'undefined' ? (global.GloBusScoringKernel || require('./scoring-kernel.js')) : null);

const CapacityKernel = (typeof window !== 'undefined' && window.GloBusCapacityKernel)
  ? window.GloBusCapacityKernel
  : (typeof require !== 'undefined' ? (global.GloBusCapacityKernel || require('./capacity-kernel.js')) : null);

const StarSolver = (typeof window !== 'undefined' && window.GloBusStarSolver)
  ? window.GloBusStarSolver
  : (typeof require !== 'undefined' ? (global.GloBusStarSolver || require('./star-solver.js')) : null);

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
    this.peakScore = -Infinity;
    this.peakMetrics = null;
    this.peakCombo = null;
    this.autoSave = true;

    // Two-Phase Solvency & Capital Allocation Tracking:
    // Operational Screens (1-6) evaluate decisions with smooth debt shadow pricing to discover high-ROI upgrades.
    // Screen 7 (Finance & Cash Flow) enforces the strict $2,500k cash solvency & loan balance gate.
    this.isOperationalPhase = false;

    // Multi-Cycle Adaptive Simulated Annealing Context (Pillar 3)
    this.cycleIndex = 1;
    this.maxCycles = 3;
    this.temperature = 0.0;
    this.stepScaleMultiplier = 1.0;

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
   * Sets multi-cycle simulated annealing temperature and step scaling schedule (Pillar 3)
   * Cycle 1: Exploration (T=1.0, 2.0x step scale)
   * Cycle 2: Co-Optimization & Refinement (T=0.3, 1.0x step scale)
   * Cycle 3+: Polish & Strict Monotonic Greedy Descent (T=0.0, 0.5x step scale)
   */
  setCycleContext(cycleIndex = 1, maxCycles = 3) {
    this.cycleIndex = cycleIndex;
    this.maxCycles = maxCycles;
    if (cycleIndex <= 1) {
      this.temperature = 1.0;
      this.stepScaleMultiplier = 2.0;
    } else if (cycleIndex === 2) {
      this.temperature = 0.0; // Pure greedy coordinate descent for Deep Convergence (User Request #2)
      this.stepScaleMultiplier = 1.0;
    } else {
      this.temperature = 0.0;
      this.stepScaleMultiplier = 0.5;
    }
    const log = getLogger();
    log.info('ANNEAL', `Cycle context updated: Cycle ${this.cycleIndex}/${this.maxCycles} | Temperature T=${this.temperature.toFixed(2)} | Step Scale ${this.stepScaleMultiplier}x`);
  }

  /**
   * Evaluates score with Anticipated Downstream Margin Valuation Proxy (Pillar 2).
   * Decouples Screen 1 from stale Screen 3 pricing by anticipating downstream pricing power.
   */
  evaluateScoreWithProxy(metrics, targetWholesalePrice = null, targetRetailPrice = null, isOperationalContext = null) {
    if (!metrics || !Number.isFinite(metrics.eps) || metrics.eps <= 0) {
      return -Infinity;
    }
    const proxyMetrics = { ...metrics };
    let epsProxyBonus = 0;
    if (targetWholesalePrice && targetWholesalePrice > 350) {
      const deltaPrice = targetWholesalePrice - 350;
      epsProxyBonus += (deltaPrice / 10.0) * 0.25;
    }
    if (targetRetailPrice && targetRetailPrice > 1300) {
      const deltaPrice = targetRetailPrice - 1300;
      epsProxyBonus += (deltaPrice / 50.0) * 0.20;
    }
    proxyMetrics.eps = (proxyMetrics.eps || 0) + epsProxyBonus;
    return this.evaluateScore(proxyMetrics, isOperationalContext);
  }

  /**
   * Computes the authentic Glo-Bus Composite Game Score (0 to 120 scale)
   * based on the official 50/50 blend of:
   * 1. Investor Expectations (I.E.) Standard (20 pts each, up to 24 pts max for beating target by 40%+)
   * 2. Best-in-Industry (B-I-I) / League Leader Standard (20 pts each relative to benchmarks)
   */
  evaluateScore(metrics, isOperationalContext = null) {
    if (!metrics || metrics._siteRejected || !Number.isFinite(metrics.eps) || metrics.eps <= 0) {
      return -Infinity;
    }

    const config = this.getActiveConfig();
    const isOperational = isOperationalContext !== null
      ? isOperationalContext
      : (this.isOperationalPhase === true);

    if (ScoringKernel && ScoringKernel.ObjectiveKernel) {
      return ScoringKernel.ObjectiveKernel.evaluateScore(metrics, config, isOperational);
    }

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
    // FINANCIAL SOLVENCY & CASH GUARDRAILS
    // Glo-Bus operates on a 7-screen sequential round:
    // Screens 1-6 (Product Design, Marketing, Facilities, Contracts, CSR) are
    // operational/capital screens where high-ROI investments (R&D, Robotics, Ads)
    // generate profits that can and should be financed on Screen 7 (Finance).
    //
    // - On Operational Screens (1-6): Negative ending cash is penalized with a
    //   smooth shadow cost of capital (proportional to debt interest drag),
    //   allowing the engine to discover high-ROI upgrades without being blocked.
    //
    // - On Finance & Cash Flow (Screen 7): The HARD solvency constraint is enforced.
    //   Bank loans, share buybacks, and dividends MUST balance so ending cash
    //   is securely >= $2,500k to eliminate any risk of emergency overdraft loans.
    // =========================================================================
    if (Number.isFinite(metrics.endingCash)) {
      if (isOperational) {
        if (metrics.endingCash < 0) {
          const cashDeficit = Math.abs(metrics.endingCash);
          // Base financing drag: ~0.25 game score points per $1,000k borrowed (~5.5% loan interest after tax)
          let shadowCost = 1.5 + (cashDeficit / 1000.0) * 0.25;
          // Beyond standard commercial bank loan ceiling (~$15,000k), add quadratic capacity drag
          // to penalize excessive over-leverage and prevent unbounded deficit spending
          if (cashDeficit > 15000) {
            const excess = (cashDeficit - 15000) / 1000.0;
            shadowCost += (excess * excess) * 0.05;
          }
          compositeScore -= shadowCost;
        } else if (metrics.endingCash < c.minCash) {
          // Gentle gradient between $0 and minCash ($2,500k buffer)
          compositeScore -= ((c.minCash - metrics.endingCash) / c.minCash) * 1.5;
        }
      } else {
        if (metrics.endingCash < 0) {
          compositeScore -= 5000.0 + (Math.abs(metrics.endingCash) * 0.05);
        } else if (metrics.endingCash > 0 && metrics.endingCash < 1000) {
          compositeScore -= ((c.minCash - metrics.endingCash) * 2.0) + 2000.0;
        } else if (metrics.endingCash > 0 && metrics.endingCash < c.minCash) {
          compositeScore -= ((c.minCash - metrics.endingCash) / c.minCash) * 5.0;
        }
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
    const previousVal = (typeof item.element?.value !== 'undefined' ? item.element.value : item.value);

    // Clear stale notifications before testing this candidate
    if (typeof this.adapter.consumeRecentErrors === 'function') {
      this.adapter.consumeRecentErrors(5000);
    }

    this.adapter.setInputValue(item, value);
    await this.adapter.triggerCalculate();
    const metrics = this.adapter.getProjectedMetrics();

    // Check if Glo-Bus emitted an error notification (Toastr / native alert)
    const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
      ? this.adapter.consumeRecentErrors(2000)
      : [];

    if (siteErrors && siteErrors.length > 0) {
      metrics._siteRejected = true;
      metrics._siteErrorMsg = siteErrors.map(e => e.message || e.title).filter(Boolean).join(' | ');
      getLogger().warn('INPUT-REJECTED',
        `[${item.label || item.name}] Value ${value} rejected by Glo-Bus: "${metrics._siteErrorMsg}". Reverting to safe value (${previousVal}).`
      );
      // Immediately revert to the previous valid value so DOM remains pristine
      this.adapter.setInputValue(item, previousVal);
      await this.adapter.triggerCalculate();
      return metrics;
    }

    // Log whenever Image Rating changes — any page, any input category.
    // Log whenever Image Rating changes — any page, any input category.
    // Always compare against the active champion baseline to avoid probe pollution in telemetry!
    const championMetrics = this.bestMetrics || preMetrics;
    const championImage = championMetrics?.imageRating ?? preImageRating;
    const delta = metrics.imageRating - championImage;
    if (delta !== 0) {
      const sign = delta > 0 ? '+' : '';
      const score = this.evaluateScore(metrics).toFixed(1);
      const baseScore = (this.bestScore !== undefined && this.bestScore !== -Infinity)
        ? this.bestScore.toFixed(1)
        : this.evaluateScore(championMetrics).toFixed(1);
      getLogger().info('IMG-PROBE',
        `[${item.label || item.name}] = ${value} → Image: ${championImage} → ${metrics.imageRating} (Δ${sign}${delta}) | EPS: $${metrics.eps.toFixed(2)} | Score: ${baseScore} → ${score}`
      );
    }

    return metrics;
  }

  /**
   * Evaluates if state A is strictly superior to state B using Multi-Objective criteria:
   * 1. Higher composite game score (sA > sB + 0.001)
   * 2. Plateau (|sA - sB| <= 0.05) with higher EPS (epsA > epsB + 0.005)
   * 3. Plateau with equal EPS (|epsA - epsB| <= 0.005) and higher ROE (roeA > roeB + 0.05)
   * 4. Plateau with equal EPS and equal ROE with higher Ending Cash (cashA > cashB + 100)
   */
  isSuperior(sA, mA, sB, mB) {
    if (sA === undefined || sA === null || sA === -Infinity) return false;
    if (sB === undefined || sB === null || sB === -Infinity) return true;
    if (sA > sB + 0.001) return true;
    if (Math.abs(sA - sB) <= 0.05) {
      const epsA = mA?.eps || 0;
      const epsB = mB?.eps || 0;
      if (epsA > epsB + 0.005) return true;
      if (epsA >= epsB - 0.005) {
        const roeA = mA?.roe || 0;
        const roeB = mB?.roe || 0;
        if (roeA > roeB + 0.05) return true;
        if (roeA >= roeB - 0.01) {
          const cashA = mA?.endingCash || 0;
          const cashB = mB?.endingCash || 0;
          if (cashA > cashB + 100) return true;
        }
      }
    }
    return false;
  }

  /**
   * Evaluates if a given candidate state (score, metrics) is strictly superior to the current recorded peak.
   * Glo-Bus Multi-Objective Tie-Breaking Criterion:
   * 1. Higher composite game score (score > peakScore + 0.001)
   * 2. Equal composite game score plateau (|score - peakScore| <= 0.05) with higher EPS (candidateEPS > peakEPS + 0.005)
   * 3. Equal composite score & EPS with higher ROE (candidateROE > peakROE + 0.05)
   */
  isNewPeak(score, metrics) {
    if (this.peakScore === undefined || this.peakScore === null || this.peakScore === -Infinity) return true;
    if (score > this.peakScore + 0.001) return true;
    if (Math.abs(score - this.peakScore) <= 0.05) {
      const peakEPS = this.peakMetrics?.eps || 0;
      const candidateEPS = metrics?.eps || 0;
      if (candidateEPS > peakEPS + 0.005) return true;
      if (candidateEPS >= peakEPS - 0.005) {
        const peakROE = this.peakMetrics?.roe || 0;
        const candidateROE = metrics?.roe || 0;
        if (candidateROE > peakROE + 0.05) return true;
      }
    }
    return false;
  }

  /**
   * Updates this.peakScore, this.peakMetrics, and this.peakCombo if candidate represents a new peak.
   */
  updatePeak(score, metrics, snapshot) {
    if (this.isNewPeak(score, metrics)) {
      this.peakScore = score;
      this.peakMetrics = metrics ? { ...metrics } : null;
      if (snapshot) {
        this.peakCombo = snapshot;
      }
      return true;
    }
    return false;
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

    // Set operational solvency phase based on active screen
    const detectedPage = this.adapter?.detectPageType ? this.adapter.detectPageType() : (this.adapter?.pageType || 'UNKNOWN');
    const isFinanceScreen = detectedPage === 'FINANCE';
    const isCsrScreen = detectedPage === 'CSR';
    this.isOperationalPhase = !isFinanceScreen && !isCsrScreen && detectedPage !== 'UNKNOWN';

    if (this.isOperationalPhase) {
      log.info('SOLVENCY', `Operational Screen [${detectedPage}]: Scoring with Debt Shadow Cost (Investments allowed to run deficits for Screen 7 financing).`);
    } else if (isCsrScreen) {
      log.info('SOLVENCY', `Corporate Citizenship Screen [${detectedPage}]: Authentic Multi-Objective Scoring ACTIVE (Image recovery and brand equity optimization).`);
    } else {
      log.info('SOLVENCY', `Finance Screen [${detectedPage}]: Strict Solvency Gate ACTIVE (Enforcing Ending Cash >= $${this.getActiveConfig().constraints.minCash}k and Credit >= A-).`);
    }

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
    this.peakScore = this.baselineScore;
    this.peakMetrics = { ...this.baselineMetrics };
    this.peakCombo = this.adapter.captureSnapshot();

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
    // Multi-Objective Peak-State Restoration:
    // If the optimizer explored a valley or ended on an exploratory annealing move,
    // restore the highest recorded peak combo before final verification & auto-save!
    const targetPeakCombo = this.peakCombo || this.bestCombo || this.initialSnapshot;
    const targetPeakScore = (this.peakScore !== undefined && this.peakScore !== -Infinity) ? this.peakScore : this.bestScore;
    const peakEPS = this.peakMetrics?.eps || this.bestMetrics?.eps || 0;
    const baseEPS = this.baselineMetrics?.eps || 0;
    const baseScore = this.baselineScore || 0;

    // Read current live screen state in DOM
    await this.adapter.triggerCalculate();
    const preLiveMetrics = this.adapter.getProjectedMetrics();
    const preLiveScore = this.evaluateScore(preLiveMetrics);

    // Unconditional Peak Restoration: If the current DOM has drifted away from the best recorded state
    // (either an upgraded peak or authentic baseline), restore targetPeakCombo immediately!
    const isDrifted = (preLiveScore < targetPeakScore - 0.01 || preLiveMetrics.eps < peakEPS - 0.01);
    if (targetPeakCombo && isDrifted) {
      log.info('FINALIZE', `Restoring recorded peak decision combination (Peak Score: ${targetPeakScore.toFixed(1)}, EPS: $${peakEPS.toFixed(2)} vs Baseline Score: ${baseScore.toFixed(1)}, EPS: $${baseEPS.toFixed(2)})...`);
      await this.adapter.restoreSnapshot(targetPeakCombo);
    }

    // Verify live screen performance with a clean recalculation
    await this.adapter.triggerCalculate();
    const liveMetrics = this.adapter.getProjectedMetrics();
    const liveScore = this.evaluateScore(liveMetrics);

    // Multi-Objective Safety Verification: Confirm live decisions improve or preserve overall game score and EPS
    const preservesScore = liveScore >= baseScore - 0.05;
    const improvesOrPreservesEPS = liveMetrics.eps >= baseEPS - 0.005;

    if (preservesScore && (liveScore > baseScore + 0.001 || improvesOrPreservesEPS)) {
      this.bestMetrics = liveMetrics;
      this.bestScore = liveScore;
      this.bestCombo = targetPeakCombo || this.adapter.captureSnapshot();
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
        this.bestScore = this.evaluateScore(this.bestMetrics);
      }
      if (this.bestMetrics && this.bestMetrics.eps < baseEPS - 0.005) {
        log.warn('SAFETY', `Rollback verification warning: Restored EPS ($${this.bestMetrics.eps.toFixed(2)}) is below initial baseline ($${baseEPS.toFixed(2)}).`);
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
    this.isOperationalPhase = false;
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
    // R&D & Specs -> Capacity & Compensation -> Margins & Prices -> Volume & Ads -> CSR -> Finance (Debt -> Early Payoff -> Issue -> Buyback -> Dividends)
    const getPriority = (item) => {
      const priorityMap = { rd: 1, facilities: 2, compensation: 3, price: 4, marketing: 5, discount: 6, csr: 7, finance: 8, general: 9 };
      let p = priorityMap[item.category] || 9;
      if (item.category === 'finance') {
        const lbl = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
        // 8.1: Debt & Liquidity Injection: Bank loans / borrowing (supply cash to balance sheet first)
        if ((lbl.includes('loan') || lbl.includes('borrow') || lbl.includes('bank') || lbl.includes('debt')) &&
            !lbl.includes('retire') && !lbl.includes('repay') && !lbl.includes('early')) {
          p = 8.1;
        }
        // 8.2: Early debt retirement / paydown (retire excess debt if cash allows)
        else if (lbl.includes('retire') || lbl.includes('repay') || lbl.includes('excess cash') || lbl.includes('early')) {
          p = 8.2;
        }
        // 8.3: Common Stock Issuance (dilutive, evaluated before buyback)
        else if (lbl.includes('issue')) {
          p = 8.3;
        }
        // 8.4: Share Repurchases (Buybacks) (shrinks share count to boost EPS & ROE)
        else if (lbl.includes('repurchase') || lbl.includes('buyback')) {
          p = 8.4;
        }
        // 8.5: Dividends (returns surplus cash to shareholders)
        else if (lbl.includes('dividend')) {
          p = 8.5;
        }
      }
      return p;
    };

    inputs.sort((a, b) => getPriority(a) - getPriority(b));

    log.info('SCAN', `Found ${inputs.length} decision inputs across page frames. Sorted by economic priority chain.`);

    // 2. Identify tightly coupled interdependent pairs on this screen
    const coupledPairs = this.identifyCoupledPairs(inputs);
    if (coupledPairs.length > 0) {
      log.info('COUPLED', `Identified ${coupledPairs.length} coupled interdependent pair(s) for 2D co-optimization.`);
    }

    // Dedicated Combinatorial Star-Rating Solver for Screen 1 (Product Design) (Pillars 1 & 2)
    const detectedPage = this.adapter?.detectPageType ? this.adapter.detectPageType() : (this.adapter?.pageType || 'UNKNOWN');
    if (detectedPage === 'PRODUCT_DESIGN' && StarSolver) {
      log.step('STAR-TIER', 'Evaluating discrete Pareto star rating bundles with Downstream Price Decoupling...');
      const preStarSnapshot = this.adapter.captureSnapshot(inputs);
      let bundleAccepted = false;
      const candidateTiers = StarSolver.getCandidateStarTiers(4.0);
      for (const tier of candidateTiers) {
        if (!this.isRunning || this.isStopped) break;
        const bundle = StarSolver.CAMERA_STAR_BUNDLES[tier];
        if (!bundle) continue;
        const assignments = StarSolver.matchBundleToInputs(inputs, bundle);
        if (assignments.length > 0) {
          assignments.forEach(a => this.adapter.setInputValue(a.item, a.value));
          await this.adapter.triggerCalculate();
          const metrics = this.adapter.getProjectedMetrics();
          const score = (bundle.targetWholesalePrice && typeof this.evaluateScoreWithProxy === 'function')
            ? this.evaluateScoreWithProxy(metrics, bundle.targetWholesalePrice, bundle.targetRetailPrice)
            : this.evaluateScore(metrics);
          if (score > this.bestScore) {
            this.bestScore = score;
            this.bestMetrics = metrics;
            this.bestCombo = this.adapter.captureSnapshot(inputs);
            this.updatePeak(score, metrics, this.bestCombo);
            bundleAccepted = true;
            log.success('ACCEPT', `[Star Bundle ${tier}★] Coordinated upgrade accepted with Price Proxy! Utility Score: ${this.bestScore.toFixed(1)}, EPS: $${metrics.eps.toFixed(2)}`);
          } else {
            this.updatePeak(score, metrics, this.adapter.captureSnapshot(inputs));
          }
        }
      }

      // Also evaluate Drone Star Bundles if drone inputs present
      if (typeof StarSolver.getCandidateDroneStarTiers === 'function') {
        const droneCandidateTiers = StarSolver.getCandidateDroneStarTiers(4.0);
        for (const tier of droneCandidateTiers) {
          if (!this.isRunning || this.isStopped) break;
          const bundle = StarSolver.DRONE_STAR_BUNDLES ? StarSolver.DRONE_STAR_BUNDLES[tier] : null;
          if (!bundle) continue;
          const droneAssignments = StarSolver.matchDroneBundleToInputs(inputs, bundle);
          if (droneAssignments.length > 0) {
            droneAssignments.forEach(a => this.adapter.setInputValue(a.item, a.value));
            await this.adapter.triggerCalculate();
            const metrics = this.adapter.getProjectedMetrics();
            const score = (bundle.targetRetailPrice && typeof this.evaluateScoreWithProxy === 'function')
              ? this.evaluateScoreWithProxy(metrics, null, bundle.targetRetailPrice)
              : this.evaluateScore(metrics);
            if (score > this.bestScore) {
              this.bestScore = score;
              this.bestMetrics = metrics;
              this.bestCombo = this.adapter.captureSnapshot(inputs);
              this.updatePeak(score, metrics, this.bestCombo);
              bundleAccepted = true;
              log.success('ACCEPT', `[Drone Bundle ${tier}★] Coordinated drone upgrade accepted! Utility Score: ${this.bestScore.toFixed(1)}, EPS: $${metrics.eps.toFixed(2)}`);
            } else {
              this.updatePeak(score, metrics, this.adapter.captureSnapshot(inputs));
            }
          }
        }
      }

      // Revert to initial state if no star bundle produced a net utility gain
      if (!bundleAccepted) {
        await this.adapter.restoreSnapshot(preStarSnapshot);
        await this.adapter.triggerCalculate();
      }
    }

    const totalSteps = (inputs.length * 2) + coupledPairs.length;
    let stepCount = 0;

    // PASS 1: Global Coordinate Descent (Sets the primary operating level for each variable)
    this.currentPass = 1;
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
      this.currentPass = 2;
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
    // Strictly Greedy: Polish passes must never accept exploratory downhill moves!
    this.currentPass = 3;
    log.step('PASS 3', `Pass 3: Fine relaxation polish across ${inputs.length} variables...`);

    // Pre-Pass 3 Peak Combo Restoration (Audit Fix #3 & Bug #1):
    // If Pass 1 or Pass 2 accepted exploratory annealing moves and drifted into a valley,
    // restore the recorded Peak Combo BEFORE running Pass 3 so fine relaxation polish
    // optimizes from the absolute best known state, rather than trying to climb out of a degraded valley.
    const peakToRestore = this.peakCombo || this.bestCombo;
    const isPeakSuperior = peakToRestore && (
      (this.peakScore > this.bestScore + 0.001) ||
      ((this.peakMetrics?.eps || 0) > (this.bestMetrics?.eps || 0) + 0.005) ||
      (Math.abs((this.peakScore || 0) - (this.bestScore || 0)) <= 0.05 && ((this.peakMetrics?.roe || 0) > (this.bestMetrics?.roe || 0) + 0.05))
    );

    if (isPeakSuperior) {
      log.info('PASS 3', `Restoring recorded peak combination before fine polish (Peak Score: ${this.peakScore.toFixed(1)}, EPS: $${this.peakMetrics?.eps?.toFixed(2)})...`);
      await this.adapter.restoreSnapshot(peakToRestore, inputs);
      await this.adapter.triggerCalculate();
      this.bestMetrics = this.adapter.getProjectedMetrics();
      this.bestScore = this.evaluateScore(this.bestMetrics);
    }

    // Re-synchronize BOTH in-memory input states AND DOM elements with peakToRestore
    // Guarantees Pass 3 never inherits stale annealed values (e.g. 2, 27, 2, 18...) and overwrites the DOM!
    if (peakToRestore) {
      for (const item of inputs) {
        const saved = peakToRestore[item.key] || peakToRestore[item.id] || peakToRestore[item.name];
        if (saved !== undefined) {
          if (item.type === 'select') {
            let idx = saved.selectedIndex;
            if (idx === undefined && saved.value !== undefined) {
              const optIdx = item.options ? item.options.findIndex(o => String(o.value) === String(saved.value)) : -1;
              idx = optIdx !== -1 ? optIdx : parseInt(saved.value, 10);
            }
            if (idx !== undefined && !isNaN(idx)) {
              item.selectedIndex = idx;
              item.value = saved.value;
              if (item.element) item.element.selectedIndex = idx;
            }
          } else {
            const numVal = typeof saved.value === 'number' ? saved.value : parseFloat(String(saved.value).replace(/,/g, ''));
            item.value = Number.isFinite(numVal) ? numVal : saved.value;
            if (item.element) item.element.value = saved.value;
          }
        } else if (item.element) {
          if (item.type === 'select') {
            item.selectedIndex = item.element.selectedIndex;
            item.value = item.element.value;
          } else {
            const raw = parseFloat(String(item.element.value || '').replace(/,/g, ''));
            if (Number.isFinite(raw)) item.value = raw;
          }
        }
      }
    }

    const savedTemp = this.temperature;
    this.temperature = 0.0;
    try {
      for (const item of inputs) {
        if (!this.isRunning || this.isStopped) break;
        stepCount++;
        if (this.onProgress) {
          this.onProgress(stepCount, totalSteps, `Refining: ${item.label || item.name}`, this.bestMetrics);
        }
        await this.optimizeSingleParameter(item, 0.5, inputs);
        await new Promise(r => setTimeout(r, 40));
      }
    } finally {
      this.temperature = savedTemp;
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

    try {
      // Temporary Pro-Forma Calibration (Audit Fix #4):
      // Glo-Bus only renders live Value Index and Contribution Margin per unit when the regional incorporation
      // toggle is set to "Yes". We temporarily enable them to calibrate the exact discount % that lands in the
      // winning Value Index sweet spot (51-55) with safe margin.
      this.adapter.setSpecialContractAssumptions({ na: true, ea: true, ap: true, la: true });
      await this.adapter.triggerCalculate();

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

        // Two-Tiered Contract Capacity Reservation & Outsourcing Gate (Fix #4)
        if (CapacityKernel && CapacityKernel.ContractReservation) {
          const capacityCheck = CapacityKernel.ContractReservation.evaluateContractBid(
            { region: regionKey, discount: currentDiscount, bidPrice: 200, estimatedBOM: 95, estimatedLabor: 35 },
            { regularCapacity: 300000, maxOvertimeCapacity: 360000, retailDemand: 290000 }
          );
          if (!capacityCheck.isApproved) {
            log.warn('CONTRACTS', `[${regionName}] Capacity Gate: ${capacityCheck.reason}`);
            this.adapter.setInputValue(item, 0);
            item.value = 0;
            await this.adapter.triggerCalculate();
            continue;
          }
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
    } finally {
      // Cash-Defensive Solvency Policy (Audit Fix #4):
      // In Glo-Bus, setting "Incorporate projected outcomes" to "Yes" adds hypothetical contract
      // revenues (+$8.2M cash, +$0.41 EPS) into pro-forma statements.
      // If incorporated, the Finance screen allocates buybacks and dividends under the assumption that
      // this speculative cash is 100% guaranteed. If competitors outbid in any region, that cash never
      // materializes, causing an emergency overdraft loan (12%+ penalty) and credit collapse.
      //
      // Therefore, we keep all discount offers (bids) fully active (21-25%) so the company competes to win,
      // but strictly force all regional pro-forma incorporation toggles back to "No" in this finally block.
      // This guarantees that Finance plans strictly against guaranteed revenues, protecting the $2,500k cash buffer.
      const assumptionMap = {
        na: false,
        ea: false,
        ap: false,
        la: false
      };
      this.adapter.setSpecialContractAssumptions(assumptionMap);
      await this.adapter.triggerCalculate();
      log.info('CONTRACTS', 'Cash-Defensive Solvency Policy: Regional incorporation toggles set to "No" to protect Finance cash buffer. (Discount bids remain active!)');
    }

    if (!this.isRunning || this.isStopped) return;

    this.bestCombo = this.adapter.captureSnapshot(inputs);
    this.bestMetrics = this.adapter.getProjectedMetrics();
    this.bestScore = this.evaluateScore(this.bestMetrics);
    this.updatePeak(this.bestScore, this.bestMetrics, this.bestCombo);

    log.success('COMPLETE', `Special Contracts bids submitted! Guaranteed Base EPS: $${this.bestMetrics.eps.toFixed(2)} (Any contracts won will provide +$0.40+ bonus upside)`);
  }

  /**
   * Discovers variables that have strong economic cross-elasticities on the same screen
   */
  identifyCoupledPairs(inputs) {
    const pairs = [];
    const used = new Set();

    const getRegion = (item) => {
      const t = `${item.label || ''} ${item.name || ''} ${item.id || ''}`.toLowerCase();
      if (t.includes('north america') || t.includes('n.a') || t.includes('na_') || t.includes(' na ') || t.startsWith('na')) return 'na';
      if (t.includes('europe') || t.includes('e-a') || t.includes('ea_') || t.includes(' ea ') || t.startsWith('ea')) return 'ea';
      if (t.includes('asia') || t.includes('a-p') || t.includes('ap_') || t.includes(' ap ') || t.startsWith('ap')) return 'ap';
      if (t.includes('latin') || t.includes('l.a') || t.includes('la_') || t.includes(' la ') || t.startsWith('la')) return 'la';
      return null;
    };

    for (let i = 0; i < inputs.length; i++) {
      if (used.has(inputs[i])) continue;
      for (let j = i + 1; j < inputs.length; j++) {
        if (used.has(inputs[j])) continue;

        const a = inputs[i];
        const b = inputs[j];
        const aLabel = (a.label + ' ' + a.name).toLowerCase();
        const bLabel = (b.label + ' ' + b.name).toLowerCase();

        const aReg = getRegion(a);
        const bReg = getRegion(b);
        const commonRegion = aReg && bReg && (aReg === bReg);

        // Pair 1: Price and Advertising in the same regional market
        const isRegionalPriceAndAd = ((a.category === 'price' && b.category === 'marketing') ||
                                     (b.category === 'price' && a.category === 'marketing')) && commonRegion;

        // Pair 1b: Price and Retailer Discount in the same regional market
        const isRegionalPriceAndDiscount = ((a.category === 'price' && b.category === 'discount') ||
                                           (b.category === 'price' && a.category === 'discount')) && commonRegion;

        // Pair 2: Base Wage & Assembly Incentive (Labor cost per unit trade-off)
        const isLaborTradeoff = (aLabel.includes('wage') && bLabel.includes('incentive')) ||
                                (bLabel.includes('wage') && aLabel.includes('incentive'));

        // Pair 3: Stock Buyback & Dividend (Capital return trade-off)
        const isBuybackA = aLabel.includes('buyback') || aLabel.includes('repurchase');
        const isBuybackB = bLabel.includes('buyback') || bLabel.includes('repurchase');
        const isFinanceTradeoff = (isBuybackA && bLabel.includes('dividend')) ||
                                 (isBuybackB && aLabel.includes('dividend'));

        if (isRegionalPriceAndAd || isRegionalPriceAndDiscount || isLaborTradeoff || isFinanceTradeoff) {
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
   * Co-optimizes two interdependent variables simultaneously across their diagonal response surface with momentum acceleration
   */
  async optimizeCoupledPair(itemA, itemB, allInputsList = null) {
    const log = getLogger();
    const getVal = (item) => {
      if (item.type === 'select') {
        return (item.element && item.element.selectedIndex !== undefined) ? item.element.selectedIndex : (item.selectedIndex ?? 0);
      }
      if (item.element && item.element.value !== undefined && item.element.value !== '') {
        const parsed = parseFloat(String(item.element.value).replace(/,/g, '').replace(/[^0-9.-]/g, ''));
        return Number.isFinite(parsed) ? parsed : (typeof item.value === 'number' ? item.value : 0);
      }
      return typeof item.value === 'number' ? item.value : 0;
    };
    const valA = getVal(itemA);
    const valB = getVal(itemB);
    itemA.value = valA;
    itemB.value = valB;
    if (itemA.type === 'select') itemA.selectedIndex = valA;
    if (itemB.type === 'select') itemB.selectedIndex = valB;
    const cycleScale = this.stepScaleMultiplier !== undefined ? this.stepScaleMultiplier : 1.0;
    const isIntA = Boolean(itemA.isInteger || itemA.type === 'select' || (Number.isInteger(itemA.step) && itemA.step >= 1));
    const isIntB = Boolean(itemB.isInteger || itemB.type === 'select' || (Number.isInteger(itemB.step) && itemB.step >= 1));
    const stepA = isIntA ? Math.max(1, Math.round(itemA.step * cycleScale)) : Math.max(0.01, itemA.step * cycleScale);
    const stepB = isIntB ? Math.max(1, Math.round(itemB.step * cycleScale)) : Math.max(0.01, itemB.step * cycleScale);

    // Test 4 diagonal coupled perturbations:
    // (+dA, +dB), (+dA, -dB), (-dA, +dB), (-dA, -dB)
    const candidates = [
      { a: Math.min(itemA.max, isIntA ? Math.round(valA + stepA) : valA + stepA), b: Math.min(itemB.max, isIntB ? Math.round(valB + stepB) : valB + stepB) },
      { a: Math.min(itemA.max, isIntA ? Math.round(valA + stepA) : valA + stepA), b: Math.max(itemB.min, isIntB ? Math.round(valB - stepB) : valB - stepB) },
      { a: Math.max(itemA.min, isIntA ? Math.round(valA - stepA) : valA - stepA), b: Math.min(itemB.max, isIntB ? Math.round(valB + stepB) : valB + stepB) },
      { a: Math.max(itemA.min, isIntA ? Math.round(valA - stepA) : valA - stepA), b: Math.max(itemB.min, isIntB ? Math.round(valB - stepB) : valB - stepB) }
    ];

    let bestPair = { a: valA, b: valB };
    let improved = false;

    for (const cand of candidates) {
      if (!this.isRunning || this.isStopped) break;
      if (cand.a === valA && cand.b === valB) continue;

      if (typeof this.adapter.consumeRecentErrors === 'function') {
        this.adapter.consumeRecentErrors(5000);
      }

      this.adapter.setInputValue(itemA, cand.a);
      this.adapter.setInputValue(itemB, cand.b);
      await this.adapter.triggerCalculate();
      const metrics = this.adapter.getProjectedMetrics();

      const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
        ? this.adapter.consumeRecentErrors(2000)
        : [];
      if (siteErrors && siteErrors.length > 0) {
        metrics._siteRejected = true;
      }

      const score = this.evaluateScore(metrics);

      if (this.bestMetrics && metrics.imageRating !== this.bestMetrics.imageRating) {
        const delta = metrics.imageRating - this.bestMetrics.imageRating;
        const sign = delta > 0 ? '+' : '';
        log.info('IMG-PROBE', `[Coupled: ${itemA.label || itemA.name} & ${itemB.label || itemB.name}] = (${cand.a}, ${cand.b}) → Image: ${this.bestMetrics.imageRating} → ${metrics.imageRating} (Δ${sign}${delta}) | Score: ${score.toFixed(1)}`);
      }

      if (this.isSuperior(score, metrics, this.bestScore, this.bestMetrics)) {
        this.bestScore = score;
        this.bestMetrics = metrics;
        bestPair = cand;
        improved = true;
      }
    }

    // Diagonal Momentum Acceleration (Fix #9)
    if (improved && this.isRunning && !this.isStopped) {
      const deltaA = bestPair.a - valA;
      const deltaB = bestPair.b - valB;

      if (deltaA !== 0 || deltaB !== 0) {
        let currentA = bestPair.a;
        let currentB = bestPair.b;
        let momentumSteps = 0;

        while (momentumSteps < 4 && this.isRunning && !this.isStopped) {
          const nextA = deltaA > 0
            ? Math.min(itemA.max, isIntA ? Math.round(currentA + stepA) : currentA + stepA)
            : (deltaA < 0 ? Math.max(itemA.min, isIntA ? Math.round(currentA - stepA) : currentA - stepA) : currentA);
          const nextB = deltaB > 0
            ? Math.min(itemB.max, isIntB ? Math.round(currentB + stepB) : currentB + stepB)
            : (deltaB < 0 ? Math.max(itemB.min, isIntB ? Math.round(currentB - stepB) : currentB - stepB) : currentB);

          if (nextA === currentA && nextB === currentB) break;

          if (typeof this.adapter.consumeRecentErrors === 'function') {
            this.adapter.consumeRecentErrors(5000);
          }

          this.adapter.setInputValue(itemA, nextA);
          this.adapter.setInputValue(itemB, nextB);
          await this.adapter.triggerCalculate();
          const metrics = this.adapter.getProjectedMetrics();

          const siteErrors = typeof this.adapter.consumeRecentErrors === 'function'
            ? this.adapter.consumeRecentErrors(2000)
            : [];
          if (siteErrors && siteErrors.length > 0) {
            metrics._siteRejected = true;
          }

          const score = this.evaluateScore(metrics);

          if (this.isSuperior(score, metrics, this.bestScore, this.bestMetrics)) {
            this.bestScore = score;
            this.bestMetrics = metrics;
            bestPair = { a: nextA, b: nextB };
            currentA = nextA;
            currentB = nextB;
            momentumSteps++;
          } else {
            break;
          }
        }
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
    const currentMetrics = this.adapter.getProjectedMetrics();
    const currentScore = this.evaluateScore(currentMetrics);

    if (improved) {
      this.bestScore = currentScore;
      this.bestMetrics = currentMetrics;
      this.bestCombo = this.adapter.captureSnapshot(allInputsList);
      this.updatePeak(currentScore, currentMetrics, this.bestCombo);
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
    // Always read currentVal directly from live element if present to avoid stale memory drift
    let currentVal;
    if (item.type === 'select') {
      currentVal = (item.element && item.element.selectedIndex !== undefined) ? item.element.selectedIndex : (item.selectedIndex ?? 0);
      item.selectedIndex = currentVal;
    } else {
      if (item.element && item.element.value !== undefined && item.element.value !== '') {
        const domStr = String(item.element.value).trim();
        const parsed = parseFloat(domStr.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
        currentVal = Number.isFinite(parsed) ? parsed : (typeof item.value === 'number' ? item.value : 0);
      } else {
        currentVal = typeof item.value === 'number' ? item.value : 0;
      }
      item.value = currentVal;
    }
    const cycleScale = this.stepScaleMultiplier !== undefined ? this.stepScaleMultiplier : 1.0;
    const isInteger = Boolean(item.isInteger || item.type === 'select' || (Number.isInteger(item.step) && item.step >= 1));
    let step = item.step * stepScale * cycleScale;
    if (isInteger) {
      step = Math.max(1, Math.round(step));
    } else {
      step = Math.max(0.01, step);
    }

    const itemLabel = (item.label + ' ' + item.name + ' ' + (item.id || '')).toLowerCase();
    const paramName = item.label || item.name || 'Param';

    // Audit Fix #5: Dynamic Excess Cash Deployment for Dividends on Screen 7
    // When ending cash exceeds generous solvency cushions ($20M - $50M), probe larger steps
    // so guaranteed idle cash is actively deployed into dividends, boosting ROE and Stock Price.
    const isDividend = itemLabel.includes('dividend');
    if (isDividend) {
      const currentCash = this.bestMetrics?.endingCash || this.baselineMetrics?.endingCash || 0;
      if (currentCash > 50000) {
        step = Math.max(step, 0.50);
      } else if (currentCash > 20000) {
        step = Math.max(step, 0.25);
      }
    }

    let bestVal = currentVal;
    let improved = false;

    // Glo-Bus Financial Safeguard: Mutual Exclusivity between Stock Issue & Stock Repurchase
    const isStockIssue = itemLabel.includes('issue') && (itemLabel.includes('stock') || itemLabel.includes('share'));
    const isStockRepurchase = itemLabel.includes('repurchase') || itemLabel.includes('buyback');

    // Glo-Bus Financial Safeguard: Debt Borrowing Control
    // Never borrow bank debt if ending cash is already >= minCash ($2,500k default).
    // Borrowing when cash is sufficient generates toxic interest expenses and damages Credit Rating.
    const isLoanBorrowing = (item.category === 'finance' || itemLabel.includes('loan') || itemLabel.includes('borrow')) &&
      (itemLabel.includes('loan') || itemLabel.includes('borrow') || itemLabel.includes('bank')) &&
      !itemLabel.includes('retire') && !itemLabel.includes('repay') && !itemLabel.includes('early') && !itemLabel.includes('excess');

    let allowBorrowUp = true;
    if (isLoanBorrowing) {
      const preMetrics = this.adapter.getProjectedMetrics();
      const currentCash = preMetrics ? (preMetrics.endingCash || 0) : 0;
      const minBuffer = this.getActiveConfig().constraints?.minCash || 2500;
      if (currentCash >= minBuffer) {
        if (currentVal === 0) {
          log.info('GUARD', `[${paramName}] Kept at 0 (Cash is already funded at $${Math.round(currentCash)}k; borrowing debt damages Credit Rating).`);
          return false;
        }
        // If loan is already > 0, block upward borrowing and only test downward repayment
        allowBorrowUp = false;
      }
    }

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
      if (CapacityKernel && CapacityKernel.CapexSinkingFund) {
        const preMetrics = this.adapter.getProjectedMetrics();
        const fund = CapacityKernel.CapexSinkingFund.calculateLiquidityFloor({}, preMetrics.endingCash || 0);
        if (fund.isConstrained) {
          log.info('GUARD', `[Stock Repurchase] Constrained to protect strategic Capex Sinking Fund ($${fund.projectedCapexReserve}k growth reserve, cash floor $${fund.minimumLiquidityFloor}k).`);
          return false;
        }
      }

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

    // Glo-Bus CSR Safeguard: Mutual Exclusivity between Charitable Total ($000s) and Charitable Percent (%)
    const isCharitable = itemLabel.includes('charit') || itemLabel.includes('contribut');
    const isCharitablePercent = isCharitable && (itemLabel.includes('percent') || itemLabel.includes('%') || itemLabel.includes('profit'));
    const isCharitableTotal = isCharitable && !isCharitablePercent && (itemLabel.includes('total') || itemLabel.includes('$') || itemLabel.includes('amount') || (!itemLabel.includes('percent') && !itemLabel.includes('%')));

    if (isCharitablePercent) {
      // In Glo-Bus, Charitable Percentage cannot be set when Charitable Total ($000s) is also set
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activeTotal = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name + ' ' + (i.id || '')).toLowerCase();
        const isCh = lbl.includes('charit') || lbl.includes('contribut');
        const isPct = lbl.includes('percent') || lbl.includes('%') || lbl.includes('profit');
        return isCh && !isPct && (parseFloat(i.value) > 0);
      });
      if (activeTotal) {
        log.info('GUARD', `[Charitable Percent] Kept at 0 (Charitable Total is active at $${activeTotal.value}k: Glo-Bus mutual exclusivity rule).`);
        return false;
      }
    }

    if (isCharitableTotal) {
      // If Charitable Percent is active > 0, clear it to 0 before testing Charitable Total
      const allInputs = allInputsList || this.adapter.getDecisionInputs();
      const activePercent = allInputs.find(i => {
        const lbl = (i.label + ' ' + i.name + ' ' + (i.id || '')).toLowerCase();
        const isCh = lbl.includes('charit') || lbl.includes('contribut');
        const isPct = lbl.includes('percent') || lbl.includes('%') || lbl.includes('profit');
        return isCh && isPct && (parseFloat(i.value) > 0);
      });
      if (activePercent) {
        log.info('GUARD', `Clearing [Charitable Percent] (${activePercent.value}%) to 0 to enable Charitable Total under Glo-Bus mutual exclusivity rule...`);
        this.adapter.setInputValue(activePercent, 0);
        activePercent.value = 0;
      }
    }

    // 1. Test Upward perturbation
    const testValUp = allowBorrowUp ? Math.min(item.max, isInteger ? Math.round(currentVal + step) : currentVal + step) : currentVal;
    let scoreUp = -Infinity;
    let metricsUp = null;

    if (testValUp !== currentVal) {
      metricsUp = await this.evaluateInput(item, testValUp);
      scoreUp = this.evaluateScore(metricsUp);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2. Test Downward perturbation
    // Audit Fix #2: Clean DOM probe restoration before evaluating opposing direction
    const testValDown = Math.max(item.min, isInteger ? Math.round(currentVal - step) : currentVal - step);
    let scoreDown = -Infinity;
    let metricsDown = null;

    if (testValDown !== currentVal) {
      if (testValUp !== currentVal) {
        this.adapter.setInputValue(item, currentVal);
        await this.adapter.triggerCalculate();
      }
      metricsDown = await this.evaluateInput(item, testValDown);
      scoreDown = this.evaluateScore(metricsDown);
    }

    if (!this.isRunning || this.isStopped) return false;

    // 2b. Multi-scale exploration: if continuous variable and neither +/-1 step improved, test exploratory 2.5x step
    if (scoreUp <= this.bestScore && scoreDown <= this.bestScore && item.type !== 'select') {
      if (testValDown !== currentVal) {
        this.adapter.setInputValue(item, currentVal);
        await this.adapter.triggerCalculate();
      }
      const exploreStep = isInteger ? Math.max(1, Math.round(step * 2)) : step * 2.5;
      const testValUpExp = allowBorrowUp ? Math.min(item.max, isInteger ? Math.round(currentVal + exploreStep) : currentVal + exploreStep) : currentVal;
      if (testValUpExp !== testValUp && testValUpExp !== currentVal) {
        const mUpExp = await this.evaluateInput(item, testValUpExp);
        const sUpExp = this.evaluateScore(mUpExp);
        if (this.isSuperior(sUpExp, mUpExp, this.bestScore, this.bestMetrics)) {
          scoreUp = sUpExp;
          metricsUp = mUpExp;
          bestVal = testValUpExp;
        }
      }
      if (scoreUp <= this.bestScore && this.isRunning && !this.isStopped) {
        if (testValUpExp !== currentVal) {
          this.adapter.setInputValue(item, currentVal);
          await this.adapter.triggerCalculate();
        }
        const testValDownExp = Math.max(item.min, isInteger ? Math.round(currentVal - exploreStep) : currentVal - exploreStep);
        if (testValDownExp !== testValDown && testValDownExp !== currentVal) {
          const mDownExp = await this.evaluateInput(item, testValDownExp);
          const sDownExp = this.evaluateScore(mDownExp);
          if (this.isSuperior(sDownExp, mDownExp, this.bestScore, this.bestMetrics)) {
            scoreDown = sDownExp;
            metricsDown = mDownExp;
            bestVal = testValDownExp;
          }
        }
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    let acceptedViaAnneal = false;

    // 3. Determine winning direction & apply momentum with Multi-Objective Tie-Breaking
    if (this.isSuperior(scoreUp, metricsUp, this.bestScore, this.bestMetrics) && (scoreUp > scoreDown || (Math.abs(scoreUp - scoreDown) <= 0.05 && (metricsUp?.eps || 0) >= (metricsDown?.eps || 0)))) {
      this.bestScore = scoreUp;
      this.bestMetrics = metricsUp;
      bestVal = (bestVal !== currentVal) ? bestVal : testValUp;
      improved = true;

      // Follow upward momentum while state improves
      let momentumVal = bestVal;
      for (let m = 0; m < 6; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.min(item.max, isInteger ? Math.round(momentumVal + step) : momentumVal + step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (this.isSuperior(nextScore, nextMetrics, this.bestScore, this.bestMetrics)) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    } else if (this.isSuperior(scoreDown, metricsDown, this.bestScore, this.bestMetrics)) {
      this.bestScore = scoreDown;
      this.bestMetrics = metricsDown;
      bestVal = (bestVal !== currentVal) ? bestVal : testValDown;
      improved = true;

      // Follow downward momentum while state improves
      let momentumVal = bestVal;
      for (let m = 0; m < 6; m++) {
        if (!this.isRunning || this.isStopped) break;
        const nextVal = Math.max(item.min, isInteger ? Math.round(momentumVal - step) : momentumVal - step);
        if (nextVal === momentumVal) break;

        const nextMetrics = await this.evaluateInput(item, nextVal);
        const nextScore = this.evaluateScore(nextMetrics);
        if (this.isSuperior(nextScore, nextMetrics, this.bestScore, this.bestMetrics)) {
          this.bestScore = nextScore;
          this.bestMetrics = nextMetrics;
          bestVal = nextVal;
          momentumVal = nextVal;
        } else {
          break;
        }
      }
    } else if (this.temperature > 0) {
      // Pillar 3: Simulated Annealing Metropolis Acceptance for Ridge Climbing
      const candidateScore = Math.max(scoreUp, scoreDown);
      const candidateMetrics = (scoreUp >= scoreDown) ? metricsUp : metricsDown;
      const candidateVal = (scoreUp >= scoreDown) ? testValUp : testValDown;

      // Multi-Objective Degradation Safeguard (Audit Fix #3 & Bug #2):
      // Delta must be measured against the true screen peak / champion benchmark, NOT just a degraded valley!
      const peakScoreAnchor = Math.max(this.peakScore || -Infinity, this.baselineScore || -Infinity);
      const peakEpsAnchor = Math.max(this.peakMetrics?.eps || 0, this.baselineMetrics?.eps || 0);

      const deltaScoreFromCurrent = candidateScore - this.bestScore;
      const deltaScoreFromPeak = peakScoreAnchor > -Infinity ? candidateScore - peakScoreAnchor : deltaScoreFromCurrent;
      const deltaEpsFromPeak = peakEpsAnchor > 0 ? (candidateMetrics?.eps || 0) - peakEpsAnchor : (candidateMetrics?.eps || 0) - (this.bestMetrics?.eps || 0);
      const deltaEpsFromCurrent = (candidateMetrics?.eps || 0) - (this.bestMetrics?.eps || 0);

      // Controlled temperature tolerance: allow up to -0.15 delta (or -0.20 * T) relative to peak
      const minDeltaAllowed = Math.max(-0.15, -0.20 * this.temperature);

      // Valley Guard: Never drift more than 0.35 points below the recorded peak or baseline
      const isTooFarFromPeak = peakScoreAnchor > -Infinity && candidateScore < peakScoreAnchor - 0.35;

      // Effective delta combines score drop and EPS drop to prevent silent downward ratcheting
      const effectiveScoreDelta = Math.min(deltaScoreFromCurrent, deltaScoreFromPeak);
      const effectiveEpsDelta = Math.min(deltaEpsFromCurrent, deltaEpsFromPeak);

      // Calculate Boltzmann acceptance probability:
      // A move that degrades score or EPS has P < 1.0 (penalizing both score loss and EPS loss in exponent).
      // A move that is neutral (effectiveScoreDelta ~= 0 and effectiveEpsDelta ~= 0) is NEVER accepted with P = 1.000!
      // It is only accepted with P = 0.50 if ROE or Cash improved, otherwise P = 0.0.
      let pAccept = 0;
      if (!isTooFarFromPeak && candidateScore > -Infinity && effectiveScoreDelta >= minDeltaAllowed && candidateVal !== currentVal) {
        if (effectiveScoreDelta < -0.0001 || effectiveEpsDelta < -0.001) {
          const combinedLoss = effectiveScoreDelta + Math.min(0, effectiveEpsDelta * 2.0);
          pAccept = Math.min(0.95, Math.exp(combinedLoss / (0.25 * this.temperature)));
        } else if (Math.abs(effectiveScoreDelta) <= 0.0001 && Math.abs(effectiveEpsDelta) <= 0.001) {
          const roeImproved = (candidateMetrics?.roe || 0) > (this.bestMetrics?.roe || 0) + 0.05;
          const cashImproved = (candidateMetrics?.endingCash || 0) > (this.bestMetrics?.endingCash || 0) + 100;
          pAccept = (roeImproved || cashImproved) ? 0.50 : 0.0;
        }
      }

      if (pAccept > 0 && Math.random() < pAccept) {
        bestVal = candidateVal;
        this.bestScore = candidateScore;
        this.bestMetrics = candidateMetrics;
        improved = true;
        acceptedViaAnneal = true;
        log.info('ANNEAL', `[${paramName}] Exploratory move accepted under T=${this.temperature.toFixed(2)} (ΔScore: ${effectiveScoreDelta.toFixed(2)}, P=${pAccept.toFixed(3)}): ${currentVal} -> ${bestVal}`);
      }
    }

    if (!this.isRunning || this.isStopped) return false;

    if (isInteger && typeof bestVal === 'number') {
      bestVal = Math.round(bestVal);
    }

    // 4. Commit winning value to DOM and re-synchronize calculation engine
    this.adapter.setInputValue(item, bestVal);
    item.value = bestVal;
    if (item.type === 'select') item.selectedIndex = bestVal;

    await this.adapter.triggerCalculate();
    const currentMetrics = this.adapter.getProjectedMetrics();
    const currentScore = this.evaluateScore(currentMetrics);

    if (improved) {
      this.bestScore = currentScore;
      this.bestMetrics = currentMetrics;

      const newPeakFound = !acceptedViaAnneal && this.updatePeak(currentScore, currentMetrics, this.adapter.captureSnapshot(allInputsList));
      this.bestCombo = this.peakCombo || this.adapter.captureSnapshot(allInputsList);

      if (acceptedViaAnneal) {
        log.info('ANNEAL', `[${paramName}] Operating point shifted to exploratory ridge (Score: ${currentScore.toFixed(1)} vs Peak: ${(this.peakScore || currentScore).toFixed(1)}). Peak combo safely preserved.`);
      } else {
        const epsDiff = (this.bestMetrics.eps - (this.baselineMetrics?.eps || 0)).toFixed(2);
        log.success('ACCEPT', `[${paramName}] ${currentVal} -> ${bestVal} (EPS: $${this.bestMetrics.eps.toFixed(2)}, Δ ${epsDiff >= 0 ? '+' : ''}$${epsDiff}, Score: ${this.bestScore.toFixed(1)})`);
      }
    } else {
      // Monotonicity Guarantee: Never overwrite this.bestScore with an inferior score upon rejection
      log.info('REJECT', `[${paramName}] Kept at ${currentVal} (neither direction improved overall utility).`);
    }

    return improved;
  }

  /**
   * Reverts all inputs back to original baseline state
   */
  async revertToInitial() {
    this.isOperationalPhase = false;
    await this.adapter.restoreSnapshot(null);
    this.baselineMetrics = this.adapter.getProjectedMetrics();
    this.bestMetrics = { ...this.baselineMetrics };
    this.bestScore = this.evaluateScore(this.baselineMetrics);
    this.peakMetrics = { ...this.baselineMetrics };
    this.peakScore = this.bestScore;
    this.peakCombo = null;
    console.log('GloBus-Pilot: Reverted to initial snapshot.');
  }
}

// Attach globally
if (typeof window !== 'undefined') {
  window.GloBusOptimizer = GloBusOptimizer;
  window.gloBusOptimizer = new GloBusOptimizer(window.gloBusDOMAdapter);
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GloBusOptimizer;
}


  // 5. Page Coordinator
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

  // Synchronous + Asynchronous hybrid storage adapter with extension context invalidation guard
  const storage = {
    async get() {
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (_) {}

      try {
        if (globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local) {
          return new Promise(resolve => {
            try {
              chrome.storage.local.get(STORAGE_KEY, res => {
                if (chrome.runtime?.lastError) return resolve(null);
                resolve(res ? (res[STORAGE_KEY] || null) : null);
              });
            } catch (_) {
              resolve(null);
            }
          });
        }
      } catch (_) {}
      return null;
    },

    async set(val) {
      try {
        const serialized = JSON.stringify(val);
        sessionStorage.setItem(STORAGE_KEY, serialized);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (_) {}

      try {
        if (globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local) {
          return new Promise(resolve => {
            try {
              chrome.storage.local.set({ [STORAGE_KEY]: val }, () => {
                if (chrome.runtime?.lastError) return resolve(val);
                resolve(val);
              });
            } catch (_) {
              resolve(val);
            }
          });
        }
      } catch (_) {}
      return val;
    },

    async remove() {
      try {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      try {
        if (globalThis.chrome?.runtime?.id && globalThis.chrome?.storage?.local) {
          return new Promise(resolve => {
            try {
              chrome.storage.local.remove(STORAGE_KEY, () => resolve());
            } catch (_) {
              resolve();
            }
          });
        }
      } catch (_) {}
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
  // Causal Ordering (Fix #2): Capacity Provision (Facilities) occurs BEFORE Demand Generation (Marketing)
  const DECISION_SECTIONS = [
    {
      key: 'PRODUCT_DESIGN',
      name: 'Product Design',
      patterns: ['product design', 'product-design', 'product_design', '/pds', '/pdesign'],
      order: 1
    },
    {
      key: 'COMPENSATION_FACILITIES',
      name: 'Compensation & Facilities',
      patterns: ['compensation & facilities', 'compensation and facilities', 'workforce & facilities', 'workforce & compensation', 'compensation', 'workforce', 'assembly & facilities', 'assembly and facilities', '/wfc', '/fac', '/comp', 'facilities'],
      order: 2
    },
    {
      key: 'AC_MARKETING',
      name: 'AC Camera Marketing',
      patterns: ['ac camera marketing', 'camera marketing', 'ac marketing', 'acc marketing', 'ac camera', '/acm', '/cam', 'ac-marketing', 'ac_marketing'],
      order: 3
    },
    {
      key: 'UAV_MARKETING',
      name: 'UAV Drone Marketing',
      patterns: ['uav drone marketing', 'drone marketing', 'uav marketing', 'uave drone marketing', 'uav drone', '/uavm', '/drone', '/uav', 'uav-marketing', 'uav_marketing', 'drone-marketing'],
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
      if (detected && detected !== 'GENERAL_DECISION') {
        const canonical = ['PRODUCT_DESIGN', 'AC_MARKETING', 'UAV_MARKETING', 'COMPENSATION_FACILITIES', 'SPECIAL_CONTRACTS', 'CSR', 'FINANCE'];
        if (canonical.includes(detected)) return detected;
        if (detected === 'WORKFORCE_COMPENSATION' || detected === 'WORKFORCE') return 'COMPENSATION_FACILITIES';
      }

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
          cycleStartMetrics: roundBaseline,
          cycleStartEps: startingEps,
          totalRunStartEps: startingEps,
          queue: queue.map(q => ({ key: q.key, name: q.name, order: q.order, url: q.url, selectorText: q.selectorText }))
        };

        await storage.set(workflow);

        const currentSec = DECISION_SECTIONS.find(s => s.key === currentKey) || { name: 'Active Screen' };
        log.info('ROUND', `[1/${workflow.totalCount}] Optimizing current screen: [${currentSec.name}] [Cycle 1/${workflow.maxCycles}] (Saving deferred)...`);
        log.info('ROUND', `Scheduled route: [${[currentSec.name, ...queue.map(q => q.name)].join(' -> ')}]`);

        // Zero-Pass Strategic Archetype Tournament on Screen 1 (Pillar 1: Basin Pre-Selection)
        const StarSolver = (typeof window !== 'undefined' && window.GloBusStarSolver)
          ? window.GloBusStarSolver
          : (typeof require !== 'undefined' ? (global.GloBusStarSolver || require('./star-solver.js')) : null);

        if (currentKey === 'PRODUCT_DESIGN' && (workflow.cycleIndex || 1) === 1 && !workflow.tournamentCompleted && StarSolver && typeof StarSolver.evaluateArchetypeTournament === 'function') {
          log.step('TOURNAMENT', 'Executing Zero-Pass Strategic Archetype Tournament on Screen 1 to select optimal global basin...');
          const tournamentResult = await StarSolver.evaluateArchetypeTournament(adapter, optimizer);
          workflow.tournamentCompleted = true;
          await storage.set(workflow);
          if (tournamentResult && tournamentResult.key !== 'current') {
            log.success('TOURNAMENT', `Archetype [${tournamentResult.name}] won tournament (Score: ${tournamentResult.score.toFixed(1)})! Round warm-started.`);
          } else {
            log.info('TOURNAMENT', `Current baseline won or maintained. Preserving inputs.`);
          }
        }

        // Propagate simulated annealing cycle context (Pillar 3)
        if (typeof optimizer.setCycleContext === 'function') {
          optimizer.setCycleContext(workflow.cycleIndex || 1, workflow.maxCycles || 3);
        }

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
          workflow.cycleStartMetrics = roundBaseline;
          workflow.cycleStartEps = roundBaseline?.eps || 0;
          workflow.totalRunStartEps = roundBaseline?.eps || 0;
          await storage.set(workflow);
        }

        // Zero-Pass Strategic Archetype Tournament on Screen 1 upon arrival
        const StarSolver = (typeof window !== 'undefined' && window.GloBusStarSolver)
          ? window.GloBusStarSolver
          : (typeof require !== 'undefined' ? (global.GloBusStarSolver || require('./star-solver.js')) : null);

        if (currentKey === 'PRODUCT_DESIGN' && (workflow.cycleIndex || 1) === 1 && !workflow.tournamentCompleted && StarSolver && typeof StarSolver.evaluateArchetypeTournament === 'function') {
          log.step('TOURNAMENT', 'Executing Zero-Pass Strategic Archetype Tournament on Screen 1 to select optimal global basin...');
          const tournamentResult = await StarSolver.evaluateArchetypeTournament(adapter, optimizer);
          workflow.tournamentCompleted = true;
          await storage.set(workflow);
          if (tournamentResult && tournamentResult.key !== 'current') {
            log.success('TOURNAMENT', `Archetype [${tournamentResult.name}] won tournament (Score: ${tournamentResult.score.toFixed(1)})! Round warm-started.`);
          } else {
            log.info('TOURNAMENT', `Current baseline won or maintained. Preserving inputs.`);
          }
        }

        const isFinalPage = !workflow.queue || workflow.queue.length === 0;
        const currentSec = DECISION_SECTIONS.find(s => s.key === currentKey) || { name: 'Decision Page' };
        const cycleNum = workflow.cycleIndex || 1;
        const maxCycles = workflow.maxCycles || 3;
        log.info('RESUME', `Arrived on [${currentSec.name}] (${workflow.visitedKeys.length} of ${workflow.totalCount}) [Cycle ${cycleNum}/${maxCycles}]. Resuming optimization (Saving deferred)...`);

        // Propagate simulated annealing cycle context (Pillar 3)
        if (typeof optimizer.setCycleContext === 'function') {
          optimizer.setCycleContext(cycleNum, maxCycles);
        }

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
      const minEpsGainThreshold = workflow.minEpsGainThreshold || 0.02;
      const minGainThreshold = minEpsGainThreshold;

      const currentScore = optimizer?.bestScore || (optimizer && typeof optimizer.evaluateScore === 'function' ? optimizer.evaluateScore(currentMetrics) : 0);
      const cycleStartScore = workflow.cycleStartScore || currentScore;
      const scoreGain = currentScore - cycleStartScore;

      const ScoringKernel = (typeof window !== 'undefined' && window.GloBusScoringKernel)
        ? window.GloBusScoringKernel
        : (typeof require !== 'undefined' ? (global.GloBusScoringKernel || require('./scoring-kernel.js')) : null);

      let convergenceResult = null;
      if (ScoringKernel && ScoringKernel.ConvergenceMonitor) {
        convergenceResult = ScoringKernel.ConvergenceMonitor.evaluateConvergence(
          currentMetrics,
          workflow.cycleStartMetrics || { eps: cycleStartEps, imageRating: currentMetrics?.imageRating, creditRating: currentMetrics?.creditRating },
          currentScore,
          cycleStartScore,
          { minEpsGainThreshold, minScoreGainThreshold: 0.50 }
        );
      }

      const hasSignificantGain = convergenceResult
        ? convergenceResult.hasSignificantGain
        : ((cycleGain >= minGainThreshold) || (scoreGain >= 0.50));

      // Multi-Cycle Convergence Protection (Audit Fix #6):
      // Cycle 1 is coarse (2x step scale) and exploratory (T=1.00). Coarse steps can overshoot
      // fine local optima around strong baselines, yielding +$0.00 gain in Cycle 1.
      // NEVER allow early convergence termination after Cycle 1 if maxCycles > 1!
      // If Cycle 1 yields +$0.00, the optimizer MUST advance to Cycle 2 (1x scale, lower T)
      // and Cycle 3 (0.5x scale, T=0 pure greedy descent) before declaring convergence.
      const isCoarseOrExploratoryCycle = (workflow.cycleIndex || 1) === 1;
      const canContinue = ((workflow.cycleIndex || 1) < maxCycles) && (hasSignificantGain || isCoarseOrExploratoryCycle);

      if (canContinue) {
        const nextCycle = (workflow.cycleIndex || 1) + 1;
        const progressDetail = hasSignificantGain
          ? (convergenceResult?.reason || `EPS +$${cycleGain.toFixed(2)} | Score +${scoreGain.toFixed(2)} pts`)
          : 'Coarse/Exploratory cycle complete; transitioning to fine-grained coordinate descent (1x step scale)';
        log.step('CONVERGE', `Cycle ${workflow.cycleIndex} complete: ${progressDetail}. Looping back to [Product Design] for Cycle ${nextCycle} of ${maxCycles} (Deep Convergence)...`);

        const allLinks = this.discoverDecisionLinks();
        workflow.cycleIndex = nextCycle;
        workflow.cycleStartMetrics = { ...currentMetrics };
        workflow.cycleStartEps = currentEps;
        workflow.cycleStartScore = currentScore;
        workflow.visitedKeys = [];
        workflow.pendingNavigation = false;
        workflow.totalCount = allLinks.length;
        workflow.queue = allLinks.map(q => ({ key: q.key, name: q.name, order: q.order, url: q.url, selectorText: q.selectorText }));

        await storage.set(workflow);
        await this.navigateNext(workflow);
      } else {
        const cycleGainStr = cycleGain >= 0 ? `+$${cycleGain.toFixed(2)}` : `-$${Math.abs(cycleGain).toFixed(2)}`;
        const scoreGainStr = `${scoreGain >= 0 ? '+' : ''}${scoreGain.toFixed(2)}`;
        const totalGainStr = totalGain >= 0 ? `+$${totalGain.toFixed(2)}` : `-$${Math.abs(totalGain).toFixed(2)}`;

        if (!hasSignificantGain) {
          log.success('CONVERGE', `Mathematical convergence achieved! (Cycle ${workflow.cycleIndex} gain: ${cycleGainStr} EPS, ${scoreGainStr} Score pts). Final EPS: $${currentEps.toFixed(2)} (Total round gain: ${totalGainStr}).`);
        } else {
          log.success('CONVERGE', `Completed maximum ${maxCycles} optimization cycles! Peak EPS: $${currentEps.toFixed(2)} (Total round gain: ${totalGainStr}).`);
        }

        // Master Round Solvency & Performance Gate:
        // Strictly prevent auto-saving if the entire round suffered a net degradation vs Round Baseline!
        const baseRoundEps = workflow.roundBaselineMetrics?.eps || workflow.totalRunStartEps || 0;
        const isDegradedVsRoundBaseline = (baseRoundEps > 0 && currentEps < baseRoundEps - 0.01);
        if (isDegradedVsRoundBaseline) {
          log.error('SAFETY', `Master Round Safety Gate: Final EPS ($${currentEps.toFixed(2)}) degraded below locked Round Baseline ($${baseRoundEps.toFixed(2)}). Auto-save aborted to protect live standings!`);
          await this.stop(false);
          return;
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

  // 6. HUD Controller
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
      if (window.gloBusDOMAdapter && typeof window.gloBusDOMAdapter.clearDomCaches === 'function') {
        window.gloBusDOMAdapter.clearDomCaches();
      }
      const label = document.getElementById('hud-active-page');
      if (label && window.gloBusDOMAdapter) {
        const pt = window.gloBusDOMAdapter.pageType;
        const names = {
          PRODUCT_DESIGN: 'Product Design',
          AC_MARKETING: 'AC Camera Marketing',
          UAV_MARKETING: 'UAV Drone Marketing',
          COMPENSATION_FACILITIES: 'Compensation & Facilities',
          WORKFORCE_COMPENSATION: 'Compensation & Facilities',
          SPECIAL_CONTRACTS: 'Special Contract Offers',
          CSR: 'Corporate Citizenship',
          FINANCE: 'Finance & Cash Flow'
        };
        label.textContent = names[pt] || pt.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      }
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

    // Populate existing logs on page load/re-navigation
    if (window.gloBusLogger.logs && window.gloBusLogger.logs.length > 0) {
      logBadge.textContent = window.gloBusLogger.logs.length;
      const emptyEl = document.getElementById('hud-log-empty');
      if (emptyEl) emptyEl.remove();
      window.gloBusLogger.logs.forEach(entry => {
        const row = document.createElement('div');
        row.className = `hud-log-row hud-log-${entry.level}`;
        row.innerHTML = `<span class="hud-log-time">${entry.timestamp}</span> <span class="hud-log-tag">[${escapeHtml(entry.tag)}]</span> <span class="hud-log-msg">${escapeHtml(entry.message)}</span>`;
        terminal.appendChild(row);
      });
      terminal.scrollTop = terminal.scrollHeight;
    }
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
      if (adapter && typeof adapter.clearDomCaches === 'function') {
        adapter.clearDomCaches();
      }
      updatePageLabel();
      refreshLiveScoreboard();
      startHeartbeat();
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

  // Proactively refresh live page label and scoreboard when user clicks any navigation or tab elements
  document.addEventListener('click', (e) => {
    if (e.target && e.target.closest && e.target.closest('#globus-pilot-hud')) return;
    setTimeout(refreshLiveScoreboard, 100);
    setTimeout(refreshLiveScoreboard, 400);
  });

  window.addEventListener('focus', () => {
    if (hud.style.display !== 'none') {
      if (adapter && typeof adapter.clearDomCaches === 'function') {
        adapter.clearDomCaches();
      }
      refreshLiveScoreboard();
    }
  });

  console.log('GloBus-Pilot minimal HUD ready with Live Diagnostics Console.');
})();

})();
