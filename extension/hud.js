/**
 * GloBus-Pilot: In-Page HUD Controller
 * Injects a floating, draggable glassmorphic HUD into Glo-Bus web pages
 */

(function () {
  // Prevent multiple injections
  if (document.getElementById('globus-pilot-hud')) return;

  const hudHtml = `
  <div id="globus-pilot-hud">
    <div class="hud-header" id="hud-drag-handle">
      <div class="hud-brand">
        <span>⚡ GloBus-Pilot</span>
        <span class="hud-badge">2.0</span>
      </div>
      <div class="hud-actions">
        <button class="hud-icon-btn" id="hud-btn-minimize" title="Minimize / Expand">_</button>
        <button class="hud-icon-btn" id="hud-btn-close" title="Close">✕</button>
      </div>
    </div>

    <div class="hud-body">
      <!-- Status Box -->
      <div class="hud-status-card">
        <div class="hud-status-row">
          <span class="hud-status-title">Status</span>
          <span class="hud-status-badge status-idle" id="hud-status-pill">Idle</span>
        </div>
        <div style="font-size: 11px; color: #cbd5e1;" id="hud-status-desc">Ready to optimize decisions.</div>
      </div>

      <!-- Metrics Display -->
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

      <!-- Strategy Preset -->
      <div class="hud-control-group">
        <label class="hud-label">Strategy Objective</label>
        <select class="hud-select" id="hud-strategy-select">
          <option value="balanced" selected>🏆 Grand Champion (Balanced Scorecard)</option>
          <option value="max_eps">🚀 Wall Street Bull (Max EPS & Buyback)</option>
          <option value="volume_leader">📦 Low-Cost Volume Leader</option>
          <option value="premium_quality">💎 Premium Brand & High P/Q</option>
        </select>
      </div>

      <!-- Main Controls -->
      <button class="hud-btn-primary" id="hud-btn-start">⚡ Start Optimization</button>

      <div class="hud-btn-group">
        <button class="hud-btn-secondary" id="hud-btn-pause" disabled>⏸ Pause</button>
        <button class="hud-btn-secondary" id="hud-btn-apply">✓ Apply Best</button>
      </div>

      <div class="hud-btn-group">
        <button class="hud-btn-secondary hud-btn-danger" id="hud-btn-revert">↺ Revert Original</button>
        <button class="hud-btn-secondary" id="hud-btn-export">📥 Export JSON</button>
      </div>

      <div class="hud-footer">
        GloBus-Pilot AI • Active Page: <span id="hud-active-page">Detecting...</span>
      </div>
    </div>
  </div>
  `;

  // Inject DOM
  const container = document.createElement('div');
  container.innerHTML = hudHtml;
  document.body.appendChild(container.firstElementChild);

  const hud = document.getElementById('globus-pilot-hud');
  const dragHandle = document.getElementById('hud-drag-handle');
  const btnMinimize = document.getElementById('hud-btn-minimize');
  const btnClose = document.getElementById('hud-btn-close');
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
  const activePageLabel = document.getElementById('hud-active-page');

  // Set active page title
  const adapter = window.gloBusDOMAdapter;
  const optimizer = window.gloBusOptimizer;
  if (adapter) {
    activePageLabel.textContent = adapter.pageType.replace(/_/g, ' ');
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

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    hud.style.left = `${Math.max(10, Math.min(window.innerWidth - hud.offsetWidth - 10, e.clientX - offsetX))}px`;
    hud.style.top = `${Math.max(10, Math.min(window.innerHeight - hud.offsetHeight - 10, e.clientY - offsetY))}px`;
    hud.style.right = 'auto';
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Minimize / Expand
  btnMinimize.addEventListener('click', () => {
    hud.classList.toggle('minimized');
    btnMinimize.textContent = hud.classList.contains('minimized') ? '□' : '_';
  });

  // Close
  btnClose.addEventListener('click', () => {
    hud.style.display = 'none';
  });

  // Strategy change
  strategySelect.addEventListener('change', (e) => {
    if (optimizer) optimizer.currentPreset = e.target.value;
  });

  // Hook Optimizer Events
  if (optimizer) {
    optimizer.onStatusChange = (status) => {
      statusPill.className = `hud-status-badge status-${status}`;
      statusPill.textContent = status.toUpperCase();

      if (status === 'running') {
        btnStart.textContent = '⏹ Stop Optimization';
        btnStart.classList.add('hud-btn-danger');
        btnPause.disabled = false;
        btnPause.textContent = '⏸ Pause';
      } else if (status === 'paused') {
        btnPause.textContent = '▶ Resume';
      } else {
        btnStart.textContent = '⚡ Start Optimization';
        btnStart.classList.remove('hud-btn-danger');
        btnPause.disabled = true;
        btnPause.textContent = '⏸ Pause';
      }
    };

    optimizer.onIterationUpdate = (iter, fieldName, bestScore, bestMetrics) => {
      statusDesc.textContent = `Testing: ${fieldName.slice(0, 24)} (Step ${iter})`;
    };

    optimizer.onNewBestScore = (score, metrics) => {
      if (!metrics) return;
      valEPS.textContent = `$${metrics.eps.toFixed(2)}`;
      valROE.textContent = `${metrics.roe.toFixed(1)}%`;
      valCash.textContent = `$${Math.round(metrics.endingCash).toLocaleString()}k`;
      valCredit.textContent = `${metrics.creditRating || '--'} / ${metrics.imageRating || '--'}`;

      if (metrics.endingCash < 1500) {
        valCash.style.color = '#ef4444';
      } else {
        valCash.style.color = '#38bdf8';
      }

      if (optimizer.baselineMetrics) {
        baseEPS.textContent = `Base: $${optimizer.baselineMetrics.eps.toFixed(2)}`;
        baseROE.textContent = `Base: ${optimizer.baselineMetrics.roe.toFixed(1)}%`;
      }
    };
  }

  // Button actions
  btnStart.addEventListener('click', async () => {
    if (!optimizer) return;
    if (optimizer.isRunning) {
      optimizer.stop();
    } else {
      await optimizer.start();
    }
  });

  btnPause.addEventListener('click', () => {
    if (!optimizer) return;
    if (optimizer.isPaused) {
      optimizer.resume();
    } else {
      optimizer.pause();
    }
  });

  btnApply.addEventListener('click', async () => {
    if (optimizer) {
      await optimizer.applyBest();
      statusDesc.textContent = 'Applied best decision values!';
    }
  });

  btnRevert.addEventListener('click', async () => {
    if (optimizer) {
      await optimizer.revertToInitial();
      statusDesc.textContent = 'Reverted to original decisions.';
    }
  });

  btnExport.addEventListener('click', () => {
    if (!optimizer || !optimizer.bestCombo) {
      alert('No optimized combo to export yet. Run the optimizer first!');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(optimizer.bestCombo, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `globus_decisions_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  });

  // Initial metric probe
  setTimeout(async () => {
    if (adapter) {
      const initial = adapter.getProjectedMetrics();
      if (initial && initial.eps > 0) {
        valEPS.textContent = `$${initial.eps.toFixed(2)}`;
        valROE.textContent = `${initial.roe.toFixed(1)}%`;
        valCash.textContent = `$${Math.round(initial.endingCash).toLocaleString()}k`;
        valCredit.textContent = `${initial.creditRating || '--'} / ${initial.imageRating || '--'}`;
        baseEPS.textContent = `Base: $${initial.eps.toFixed(2)}`;
        baseROE.textContent = `Base: ${initial.roe.toFixed(1)}%`;
      }
    }
  }, 600);

  console.log('⚡ GloBus-Pilot HUD injected successfully.');
})();
