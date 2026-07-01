/**
 * Release / App Store Capacitor build guard.
 * Forces VITE_ENABLE_DEV_MODE=false (overrides .env.capacitor for this build only).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILES = ['.env.capacitor', '.env.capacitor.local'];

function parseEnvValue(filePath, key) {
  if (!existsSync(filePath)) return undefined;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq).trim();
    if (k !== key) continue;
    return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return undefined;
}

if (process.env.VITE_ENABLE_DEV_MODE === 'true') {
  console.error('[guard-ios-release] Shell VITE_ENABLE_DEV_MODE=true is not allowed for release build.');
  process.exit(1);
}

for (const rel of ENV_FILES) {
  const value = parseEnvValue(resolve(rel), 'VITE_ENABLE_DEV_MODE');
  if (value === 'true') {
    console.warn(
      `[guard-ios-release] ${rel} has VITE_ENABLE_DEV_MODE=true — release build will override to false for this run.`
    );
  }
}

console.log('[guard-ios-release] OK — release build will set VITE_ENABLE_DEV_MODE=false');
