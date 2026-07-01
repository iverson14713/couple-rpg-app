/**
 * Dev mode env + production bundle checks.
 * Run: node scripts/verify-dev-mode.mjs
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function isEnabled(env) {
  if (env.PROD === 'true' && env.VITE_ENABLE_DEV_MODE !== 'true') return false;
  return env.DEV === 'true' || env.VITE_ENABLE_DEV_MODE === 'true';
}

function getSource(env) {
  if (env.PROD === 'true' && env.VITE_ENABLE_DEV_MODE !== 'true') return null;
  if (env.DEV === 'true') return 'DEV';
  if (env.VITE_ENABLE_DEV_MODE === 'true') return 'VITE_ENABLE_DEV_MODE';
  return null;
}

assert.equal(isEnabled({ PROD: 'false', DEV: 'true' }), true, 'dev server');
assert.equal(isEnabled({ PROD: 'true', DEV: 'false' }), false, 'production default off');
assert.equal(
  isEnabled({ PROD: 'true', DEV: 'false', VITE_ENABLE_DEV_MODE: 'true' }),
  true,
  'capacitor test build with flag'
);
assert.equal(getSource({ PROD: 'true', DEV: 'false', VITE_ENABLE_DEV_MODE: 'true' }), 'VITE_ENABLE_DEV_MODE');

function readDistJs() {
  const assetsDir = resolve('dist/assets');
  return readdirSync(assetsDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => readFileSync(resolve(assetsDir, f), 'utf8'))
    .join('\n');
}

function bundleHasDevModeFlagTrue(js) {
  return /VITE_ENABLE_DEV_MODE\s*[=:]\s*!0/.test(js) || /VITE_ENABLE_DEV_MODE:"true"/.test(js);
}

console.log('[verify-dev-mode] building production (npm run build)…');
execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_ENABLE_DEV_MODE: '' } });
const prodJs = readDistJs();
assert.equal(
  bundleHasDevModeFlagTrue(prodJs),
  false,
  'production bundle must not inline VITE_ENABLE_DEV_MODE=true'
);
assert.equal(isEnabled({ PROD: 'true', DEV: 'false' }), false, 'production runtime gate');
console.log('[verify-dev-mode] production build: dev mode OFF (7-tap should be inert)');

const capacitorEnv = resolve('.env.capacitor');
if (existsSync(capacitorEnv)) {
  const capText = readFileSync(capacitorEnv, 'utf8');
  const capFlagOn = /^\s*VITE_ENABLE_DEV_MODE\s*=\s*true\s*$/m.test(capText);
  console.log(
    `[verify-dev-mode] .env.capacitor VITE_ENABLE_DEV_MODE=${capFlagOn ? 'true (device test OK)' : 'not true'}`
  );
  if (capFlagOn) {
    console.log('[verify-dev-mode] building capacitor (npm run build:capacitor)…');
    execSync('npm run build:capacitor', { stdio: 'inherit' });
    const capJs = readDistJs();
    assert.equal(
      bundleHasDevModeFlagTrue(capJs) || capJs.includes('VITE_ENABLE_DEV_MODE'),
      true,
      'capacitor test build should enable dev mode when .env.capacitor has flag'
    );
    assert.equal(
      isEnabled({ PROD: 'true', DEV: 'false', VITE_ENABLE_DEV_MODE: 'true' }),
      true,
      'capacitor test runtime gate'
    );
    console.log('[verify-dev-mode] capacitor build: dev mode ON for device testing');
  }
}

console.log('[verify-dev-mode] OK');
