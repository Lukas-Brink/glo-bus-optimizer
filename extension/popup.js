/**
 * GloBus-Pilot: Extension Popup Controller
 * Manages extension popup actions and communicates with active Glo-Bus tabs
 */

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reopen-hud');
  const subtext = document.querySelector('.subtext');

  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        if (subtext) subtext.textContent = 'NO ACTIVE TAB FOUND';
        return;
      }

      const url = tab.url || '';
      const isRestricted = url.startsWith('chrome://') || 
                           url.startsWith('edge://') || 
                           url.startsWith('about:') || 
                           url.startsWith('view-source:') ||
                           url.startsWith('chrome-extension://');

      if (isRestricted) {
        if (subtext) {
          subtext.textContent = 'NAVIGATE TO GLO-BUS.COM FIRST';
          subtext.style.color = '#dc2626';
        }
        return;
      }

      // Check if HUD is present on the page and summon it
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.gloBusHUD && typeof window.gloBusHUD.show === 'function') {
            window.gloBusHUD.show();
            return 'SHOW_CALLED';
          }
          const hud = document.getElementById('globus-pilot-hud');
          if (hud) {
            hud.style.display = '';
            hud.classList.remove('minimized');
            return 'STYLE_RESTORED';
          }
          return 'NOT_INJECTED';
        }
      });

      const res = results && results[0] ? results[0].result : null;

      if (res === 'NOT_INJECTED') {
        // Dynamically inject stylesheet and scripts into the page
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['hud.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['dom-adapter.js', 'optimizer.js', 'page-coordinator.js', 'hud.js']
        });
        if (subtext) {
          subtext.textContent = 'HUD INJECTED & ACTIVATED';
          subtext.style.color = '#059669';
        }
      } else {
        if (subtext) {
          subtext.textContent = 'HUD ACTIVATED ON SCREEN';
          subtext.style.color = '#059669';
        }
      }

      const btnSpan = btn.querySelector('span:first-child');
      if (btnSpan) btnSpan.textContent = 'HUD ACTIVE';

      setTimeout(() => {
        window.close();
      }, 350);
    } catch (e) {
      console.error('Popup error:', e);
      if (subtext) {
        subtext.textContent = 'ERROR: ' + (e.message || 'CANNOT ACCESS PAGE');
        subtext.style.color = '#dc2626';
      }
    }
  });
});
