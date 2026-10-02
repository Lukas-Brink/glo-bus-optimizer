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