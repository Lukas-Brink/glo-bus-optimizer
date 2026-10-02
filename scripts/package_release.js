/**
 * Glo-Bus Optimizer: Release Packager
 * Builds production-ready distribution archives for GitHub Releases and Chrome Web Store / Firefox AMO
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const extDir = path.join(rootDir, 'extension');
const userDir = path.join(rootDir, 'userscript');

console.log('==> Step 1: Re-bundling userscripts & bookmarklets...');
execSync(`node "${path.join(__dirname, 'bundle_userscript.js')}"`, { stdio: 'inherit' });

console.log('\n==> Step 2: Preparing dist directory...');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const manifest = JSON.parse(fs.readFileSync(path.join(extDir, 'manifest.json'), 'utf8'));
const version = manifest.version || '2.1.2';
const zipName = `glo-bus-optimizer-v${version}-extension.zip`;
const zipPath = path.join(distDir, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`\n==> Step 3: Packaging WebExtension into ${zipName}...`);
const zipPy = path.join(__dirname, 'zip_folder.py');
fs.writeFileSync(zipPy, `import zipfile, os, sys
ext_dir = sys.argv[1]
zip_path = sys.argv[2]
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(ext_dir):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, ext_dir)
            zf.write(full, rel)
print(f"Created {zip_path} with {len(zf.namelist())} files.")
`, 'utf8');

execSync(`python "${zipPy}" "${extDir}" "${zipPath}"`, { stdio: 'inherit' });
if (fs.existsSync(zipPy)) fs.unlinkSync(zipPy);

console.log('\n==> Step 4: Copying standalone distribution artifacts to dist/...');
fs.copyFileSync(path.join(userDir, 'globus-pilot.user.js'), path.join(distDir, 'globus-pilot.user.js'));
fs.copyFileSync(path.join(userDir, 'bookmarklet.txt'), path.join(distDir, 'bookmarklet.txt'));

const releaseNotes = `# Glo-Bus Optimizer v${version} Release Notes

## Autonomous Multi-Objective Decision Optimizer & Simulation Suite

### What's New in v${version}:
- **1-Click Full Round Optimization**: Single "OPTIMIZE FULL ROUND" button autonomously traverses all 7 decision screens in canonical order (Product Design -> AC Marketing -> UAV Marketing -> Compensation & Facilities -> Special Contract Offers -> CSR -> Finance).
- **Multi-Cycle Mathematical Convergence**: Automatically runs up to 3 iterative passes until portfolio EPS stabilizes (Delta EPS < $0.02).
- **Single Master Baseline**: Preserves original Round Baseline throughout all cycles so performance deltas accurately reflect authentic gains over initial team decisions.
- **Cash-Defensive Solvency Policy for Special Contracts**: Solves sealed-bid regional auctions while eliminating speculative revenues from pro-forma statements, defending the $2,500k cash buffer against 12%+ emergency overdraft loans.
- **CSR Image Rating Target**: Intelligently locks image rating to Investor Expectation target (75) to prevent wasteful overspending.
- **Universal Cross-Browser Distribution**:
  - \`${zipName}\`: Ready for Chrome, Edge, Brave, and Firefox unpacked/temporary add-on installation.
  - \`globus-pilot.user.js\`: Standalone userscript for Violentmonkey / Tampermonkey.
  - \`bookmarklet.txt\`: 1-click zero-install bookmarklet.
`;

fs.writeFileSync(path.join(distDir, 'RELEASE_NOTES.md'), releaseNotes, 'utf8');

console.log('\n=============================================================');
console.log('RELEASE PACKAGING COMPLETE:');
console.log(`   [+] Extension Zip:  dist/${zipName}`);
console.log(`   [+] Userscript:     dist/globus-pilot.user.js`);
console.log(`   [+] Bookmarklet:    dist/bookmarklet.txt`);
console.log(`   [+] Release Notes:  dist/RELEASE_NOTES.md`);
console.log('=============================================================\n');
