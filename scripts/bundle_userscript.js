/**
 * Bundles extension components into userscript and bookmarklet formats
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const extDir = path.join(root, 'extension');
const userDir = path.join(root, 'userscript');

const css = fs.readFileSync(path.join(extDir, 'hud.css'), 'utf8');
const domAdapter = fs.readFileSync(path.join(extDir, 'dom-adapter.js'), 'utf8');
const optimizer = fs.readFileSync(path.join(extDir, 'optimizer.js'), 'utf8');
const coordinator = fs.readFileSync(path.join(extDir, 'page-coordinator.js'), 'utf8');
const hud = fs.readFileSync(path.join(extDir, 'hud.js'), 'utf8');

const inlineScript = `(function () {
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
  const css = ${JSON.stringify(css)};
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  (document.head || document.documentElement).appendChild(styleEl);

  // 2. DOM Adapter & Logger
${domAdapter}

  // 3. Optimizer Engine
${optimizer}

  // 4. Page Coordinator
${coordinator}

  // 5. HUD Controller
${hud}
})();
`;

const userScriptHeader = `// ==UserScript==
// @name         GloBus-Pilot: Strategy & Decision Optimizer
// @namespace    https://glo-bus.com/
// @version      2.1.3
// @description  Autonomous multi-objective decision optimizer & simulation HUD for GLO-BUS with Live Diagnostics Console
// @author       GloBus-Pilot AI
// @match        *://*.glo-bus.com/*
// @match        *://glo-bus.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

`;

const fullUserScript = userScriptHeader + inlineScript;
const bookmarkletText = 'javascript:' + encodeURIComponent(inlineScript);

fs.writeFileSync(path.join(userDir, 'globus-pilot.user.js'), fullUserScript, 'utf8');
fs.writeFileSync(path.join(userDir, 'bookmarklet_inline.js'), inlineScript, 'utf8');
fs.writeFileSync(path.join(userDir, 'bookmarklet.txt'), bookmarkletText, 'utf8');

console.log('Successfully bundled userscript and bookmarklets:');
console.log('  - userscript/globus-pilot.user.js (' + fullUserScript.length + ' bytes)');
console.log('  - userscript/bookmarklet_inline.js (' + inlineScript.length + ' bytes)');
console.log('  - userscript/bookmarklet.txt (' + bookmarkletText.length + ' bytes)');
