import { redeemPromoPOST } from '../../server/promo-redeem.mjs';
import { readBodyStream, sendJsonRes, sendOptions } from '../lib/vercel-res.mjs';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendOptions(res);
    return;
  }

  if (req.method !== 'POST') {
    sendJsonRes(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }

  let bodyRaw;
  try {
    bodyRaw = await readBodyStream(req);
  } catch (e) {
    sendJsonRes(res, 413, { ok: false, error: e instanceof Error ? e.message : 'Body too large' });
    return;
  }

  let body;
  try {
    body = JSON.parse(bodyRaw || '{}');
  } catch {
    sendJsonRes(res, 400, { ok: false, error: 'Invalid JSON body' });
    return;
  }

  const { status, json } = await redeemPromoPOST(body, req.headers);
  sendJsonRes(res, status, json);
}
