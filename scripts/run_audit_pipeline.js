/**
 * Autonomous Pipeline Controller & Verification Runner for Glo-Bus Optimizer
 * Usage:
 *   node scripts/run_audit_pipeline.js --phase 1
 *   node scripts/run_audit_pipeline.js --phase 2
 *   node scripts/run_audit_pipeline.js --phase 3
 *   node scripts/run_audit_pipeline.js --all
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');

const args = process.argv.slice(2);
const phaseArgIndex = args.indexOf('--phase');
const targetPhase = phaseArgIndex !== -1 ? parseInt(args[phaseArgIndex + 1], 10) : null;
const isAll = args.includes('--all') || targetPhase === null;

console.log('================================================================');
console.log('       GLO-BUS AUTONOMOUS OPTIMIZATION PIPELINE RUNNER          ');
console.log(` Target: ${isAll ? 'ALL PHASES (Full Suite)' : `PHASE ${targetPhase}`}`);
console.log('================================================================\n');

function runCommand(cmd, desc) {
  console.log(`[EXEC] ${desc}...\n       > ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: root, stdio: 'inherit' });
    console.log(`[OK]   ${desc} succeeded.\n`);
    return true;
  } catch (err) {
    console.error(`[FAIL] ${desc} failed with exit code ${err.status}\n`);
    process.exit(1);
  }
}

// 1. Audit Unit & Mathematical Tests
if (isAll || targetPhase === 1 || targetPhase === 2 || targetPhase === 3) {
  runCommand('node tests/test_audit_fixes.js', 'Audit Fixes Verification Suite (All 10 Pitfalls)');
}

// 2. Integration and Full Extension Tests
if (isAll || targetPhase === 1) {
  runCommand('node tests/test_extension.js', 'Core Extension Integration Tests');
}

// 3. Simulator Python Unit Tests
if (isAll) {
  runCommand('python -m unittest discover tests', 'Python Simulation Engine Tests');
}

// 4. Bundling & Distribution Verification
if (isAll || targetPhase === 3) {
  runCommand('node scripts/bundle_userscript.js', 'Userscript & Bookmarklet Bundler');
}

console.log('================================================================');
console.log(' [SUCCESS] Autonomous Pipeline executed with 100% test pass rate!');
console.log('================================================================\n');
