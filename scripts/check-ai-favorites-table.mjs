#!/usr/bin/env node
/**
 * Verify public.user_ai_favorites exists on the linked Supabase project.
 * Usage: node scripts/check-ai-favorites-table.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  const path = resolve(root, '.env');
  try {
    const raw = readFileSync(path, 'utf8');
    const env = {};
    for (const line of raw.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const endpoint = `${url.replace(/\/$/, '')}/rest/v1/user_ai_favorites?select=record_id,record_payload&limit=1`;
const res = await fetch(endpoint, {
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
  },
});

if (res.status === 200) {
  const rows = await res.json();
  const hasPayloadCol = Array.isArray(rows);
  console.log('OK: user_ai_favorites exists and is reachable.');
  if (!hasPayloadCol) {
    console.warn('Warning: unexpected response shape.');
  } else {
    console.log(
      'Tip: run supabase/migrations/20260610120000_lovequest_user_ai_favorites_payload.sql if record_payload column is missing.'
    );
  }
  process.exit(0);
}

if (res.status === 404) {
  console.error('MISSING: user_ai_favorites table is not on this Supabase project.');
  console.error('');
  console.error('Apply migration in SQL Editor:');
  console.error('  https://supabase.com/dashboard/project/_/sql/new');
  console.error('');
  console.error('File: supabase/migrations/20260609120000_lovequest_user_ai_favorites.sql');
  process.exit(1);
}

const body = await res.text();
console.error(`Unexpected HTTP ${res.status}: ${body}`);
process.exit(1);
