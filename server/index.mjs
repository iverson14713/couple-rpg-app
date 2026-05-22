import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import dotenv from 'dotenv';
import http from 'node:http';
import {
  assistCareBundlePOST,
  assistDateItineraryPOST,
  assistHealthGET,
  assistLoveQuestQuotaGET,
  assistImportantDatePOST,
  assistQaPOST,
  assistVetReportPOST,
  assistWeeklyReportPOST,
} from './assistant-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const ENV_FILE = path.join(ROOT_DIR, '.env');
const ENV_LOCAL_FILE = path.join(ROOT_DIR, '.env.local');
dotenv.config({ path: ENV_FILE });
dotenv.config({ path: ENV_LOCAL_FILE, override: true });

const PORT = Number(process.env.ASSISTANT_SERVER_PORT || 8788);
const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function readBody(req, maxBytes = 512_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

function logRequest(method, pathname) {
  console.log(`[assistant-api] ${method} ${pathname}`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    logRequest('OPTIONS', pathname);
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && pathname === '/api/assistant/health') {
      logRequest('GET', pathname);
      const { status, json } = assistHealthGET(url.searchParams);
      sendJson(res, status, json);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/assistant/lovequest-quota') {
      logRequest('GET', pathname);
      const { status, json } = await assistLoveQuestQuotaGET(url.searchParams, req.headers);
      sendJson(res, status, json);
      return;
    }

    if (req.method !== 'POST') {
      logRequest(req.method || 'GET', pathname);
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    logRequest('POST', pathname);

    let bodyRaw;
    try {
      bodyRaw = await readBody(req);
    } catch (e) {
      sendJson(res, 413, { error: e instanceof Error ? e.message : 'Body too large' });
      return;
    }

    let body;
    try {
      body = JSON.parse(bodyRaw || '{}');
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    if (pathname === '/api/assistant/care-bundle') {
      const { status, json } = await assistCareBundlePOST(body);
      sendJson(res, status, json);
      return;
    }

    if (pathname === '/api/assistant/qa') {
      const { status, json } = await assistQaPOST(body);
      sendJson(res, status, json);
      return;
    }

    if (pathname === '/api/assistant/vet-report') {
      const { status, json } = await assistVetReportPOST(body);
      sendJson(res, status, json);
      return;
    }

    if (pathname === '/api/assistant/weekly-report') {
      const { status, json } = await assistWeeklyReportPOST(body);
      sendJson(res, status, json);
      return;
    }

    if (pathname === '/api/assistant/date-itinerary') {
      const { status, json } = await assistDateItineraryPOST(body, req.headers);
      sendJson(res, status, json);
      return;
    }

    if (pathname === '/api/assistant/important-date') {
      const { status, json } = await assistImportantDatePOST(body, req.headers);
      sendJson(res, status, json);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const status = e?.code === 'NO_API_KEY' ? 503 : 500;
    sendJson(res, status, { error: msg, code: e?.code === 'NO_API_KEY' ? 'NO_API_KEY' : 'SERVER' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[assistant-api] http://127.0.0.1:${PORT}`);
  console.log(`[assistant-api] Project root (where .env should live): ${ROOT_DIR}`);
  console.log(
    `[assistant-api] .env: ${fs.existsSync(ENV_FILE) ? 'file found' : 'file missing'} → ${ENV_FILE}`
  );
  console.log(
    `[assistant-api] .env.local: ${fs.existsSync(ENV_LOCAL_FILE) ? 'file found' : 'not present'} → ${ENV_LOCAL_FILE}`
  );
  console.log(`[assistant-api] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set' : 'missing'}`);
  console.log(`[assistant-api] OPENAI_MODEL: ${MODEL}`);
  console.log(`[assistant-api] Usage log: server/logs/usage.jsonl`);
});
