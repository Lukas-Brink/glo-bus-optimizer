# Browser Setup Guide for Glo-Bus Optimizer

Glo-Bus Optimizer is designed to work universally across all modern **Chromium-based** (Google Chrome, Microsoft Edge, Brave, Opera) and **Firefox / Gecko-based** browsers.

You have **four convenient ways** to run Glo-Bus Optimizer:

---

## Method 1: The 1-Click Bookmarklet (Recommended — Zero Installation)
*Works universally in Chrome, Firefox, Edge, Brave, and any modern browser without installing any add-on or extension.*

1. Ensure your browser's Bookmarks Toolbar is visible (`Ctrl + Shift + B` in Chrome, Firefox, and Edge).
2. Right-click any blank space on the bookmarks toolbar and select **"Add Bookmark..."** (or "New Bookmark" / "Add Page").
3. Set the **Name** to:
   ```text
   ⚡ Glo-Bus Optimizer
   ```
4. In the **URL** (or Location) box, open [`bookmarklet_inline.js`](../userscript/bookmarklet_inline.js) or [`bookmarklet.txt`](../userscript/bookmarklet.txt), copy the entire single line of code starting with `javascript:`, and paste it in.
5. Click **Save**.
6. **How to use**:
   - Navigate to any Glo-Bus decision page (e.g. *Product Design*, *Marketing*, *Workforce & Compensation*, *Finance & Cash Flow*).
   - Click your **⚡ Glo-Bus Optimizer** bookmark!
   - The dark-glass floating HUD will immediately dock on the top-right of your Glo-Bus screen.

---

## Method 2: Violentmonkey / Tampermonkey Userscript
*Ideal if you already use a userscript manager in Firefox or Chromium.*

1. Install **Violentmonkey** or **Tampermonkey** from the Firefox Add-ons store or Chrome Web Store.
2. Open [`globus-pilot.user.js`](../userscript/globus-pilot.user.js).
3. Copy its contents, click **"Create a new script"** in your userscript manager, and paste the code.
4. Click **Save**.
5. Whenever you visit `glo-bus.com`, the optimizer HUD will automatically activate.

---

## Method 3: Load Extension in Firefox (`about:debugging`)
*For Firefox and Gecko-based browsers.*

1. In Firefox, navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Click **"Load Temporary Add-on..."**.
3. In the file picker, select `manifest.json` located inside the `extension/` folder of this repository:
   ```text
   extension/manifest.json
   ```
4. The extension is now active and will run on all `glo-bus.com` pages.

---

## Method 4: Load Extension in Chromium (Chrome / Edge / Brave)
*For Google Chrome, Microsoft Edge, Brave, and other Chromium browsers.*

1. In your Chromium browser, navigate to `chrome://extensions` or `edge://extensions`.
2. Turn on the **"Developer mode"** toggle in the top-right corner.
3. Click **"Load unpacked"**.
4. Select the `extension/` directory from this repository.
5. Done! The optimizer icon will appear in your browser toolbar, and the HUD will dock into any active Glo-Bus decision screen.
