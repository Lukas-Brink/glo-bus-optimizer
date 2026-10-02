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
