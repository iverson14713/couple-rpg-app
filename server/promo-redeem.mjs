import { parseLoveQuestAiAuth } from './lovequest-ai-quota.mjs';
import { getSupabaseAdmin, isSupabaseAdminConfigured } from './supabase-admin.mjs';

const LOG = '[PROMO_REDEEM]';

/**
 * @param {unknown} body
 * @param {Record<string, string | string[] | undefined>} [headers]
 */
export async function redeemPromoPOST(body, headers = {}) {
  console.log(`${LOG} start`);

  if (!isSupabaseAdminConfigured()) {
    return fail(503, '兌換服務尚未設定', 'SUPABASE_NOT_CONFIGURED');
  }

  const auth = await parseLoveQuestAiAuth(body, headers);
  if (!auth.ok) {
    const code = auth.json?.code === 'AUTH_REQUIRED' ? 'AUTH_REQUIRED' : 'AUTH_INVALID';
    const msg = code === 'AUTH_REQUIRED' ? '請先登入後再兌換' : auth.json?.error || '登入已過期，請重新登入';
    return fail(auth.status, msg, code);
  }

  const payload = body && typeof body === 'object' ? body : {};
  const rawCode = typeof payload.code === 'string' ? payload.code.trim() : '';
  const normalized = rawCode.toUpperCase();

  if (!normalized) {
    return fail(400, '請輸入兌換碼', 'CODE_REQUIRED');
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return fail(503, '兌換服務尚未設定', 'SUPABASE_NOT_CONFIGURED');
  }

  const userId = auth.userId;

  try {
    const { data: promo, error: promoErr } = await admin
      .from('promo_codes')
      .select('id, code, type, duration_days, max_uses, used_count, expires_at, is_active')
      .eq('code', normalized)
      .maybeSingle();

    if (promoErr) throw promoErr;
    if (!promo) {
      return fail(404, '兌換碼不存在', 'CODE_NOT_FOUND');
    }
    if (!promo.is_active) {
      return fail(400, '兌換碼已停用', 'CODE_INACTIVE');
    }
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      return fail(400, '兌換碼已過期', 'CODE_EXPIRED');
    }
    if (promo.max_uses != null && (promo.used_count ?? 0) >= promo.max_uses) {
      return fail(400, '兌換碼已達使用上限', 'CODE_EXHAUSTED');
    }

    const { data: prior, error: priorErr } = await admin
      .from('promo_redemptions')
      .select('id')
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (priorErr) throw priorErr;
    if (prior) {
      return fail(400, '這組兌換碼已經使用過', 'ALREADY_REDEEMED');
    }

    const grantedUntil = await applyPromoProGrant(admin, userId, promo.duration_days);

    const { error: redeemErr } = await admin.from('promo_redemptions').insert({
      promo_code_id: promo.id,
      user_id: userId,
      code: normalized,
      granted_until: grantedUntil,
    });

    if (redeemErr) {
      if (redeemErr.code === '23505') {
        return fail(400, '這組兌換碼已經使用過', 'ALREADY_REDEEMED');
      }
      throw redeemErr;
    }

    const { error: bumpErr } = await admin
      .from('promo_codes')
      .update({ used_count: (promo.used_count ?? 0) + 1 })
      .eq('id', promo.id);

    if (bumpErr) throw bumpErr;

    const days = promo.duration_days;
    const message = `兌換成功，已開通 Pro ${days} 天`;
    console.log(`${LOG} success user=${userId} code=${normalized} until=${grantedUntil}`);

    return {
      status: 200,
      json: {
        ok: true,
        message,
        grantedUntil,
      },
    };
  } catch (e) {
    console.error(`${LOG} failed`, e);
    const msg = e instanceof Error ? e.message : String(e);
    return fail(500, '兌換失敗，請稍後再試', 'REDEEM_FAILED', msg);
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string} userId
 * @param {number} durationDays
 */
async function applyPromoProGrant(admin, userId, durationDays) {
  const now = Date.now();
  const addMs = durationDays * 24 * 60 * 60 * 1000;

  let baseMs = now;

  const { data: userGrant } = await admin
    .from('user_pro_grants')
    .select('granted_until')
    .eq('user_id', userId)
    .maybeSingle();

  if (userGrant?.granted_until) {
    baseMs = Math.max(baseMs, new Date(userGrant.granted_until).getTime());
  }

  const { data: memberships } = await admin
    .from('couple_members')
    .select('couple_id')
    .eq('user_id', userId);

  for (const row of memberships ?? []) {
    const coupleId = row.couple_id;
    const { data: sub } = await admin
      .from('couple_subscriptions')
      .select('plan, status, current_period_end')
      .eq('couple_id', coupleId)
      .maybeSingle();

    if (
      sub?.plan === 'pro' &&
      (sub.status === 'active' || sub.status === 'trialing') &&
      sub.current_period_end
    ) {
      baseMs = Math.max(baseMs, new Date(sub.current_period_end).getTime());
    }
  }

  const grantedUntil = new Date(baseMs + addMs).toISOString();

  await admin.from('user_pro_grants').upsert(
    {
      user_id: userId,
      granted_until: grantedUntil,
      source: 'promo',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  for (const row of memberships ?? []) {
    const coupleId = row.couple_id;
    const nowIso = new Date().toISOString();
    const payload = {
      couple_id: coupleId,
      plan: 'pro',
      status: 'active',
      billing_owner: userId,
      provider: 'promo',
      current_period_start: nowIso,
      current_period_end: grantedUntil,
      updated_at: nowIso,
    };

    const { data: existing } = await admin
      .from('couple_subscriptions')
      .select('id')
      .eq('couple_id', coupleId)
      .maybeSingle();

    if (existing?.id) {
      await admin.from('couple_subscriptions').update(payload).eq('id', existing.id);
    } else {
      await admin.from('couple_subscriptions').insert(payload);
    }
  }

  return grantedUntil;
}

function fail(status, error, code, detail) {
  console.error(`${LOG} failed`, code, error);
  return {
    status,
    json: {
      ok: false,
      error,
      code,
      ...(detail ? { detail } : {}),
    },
  };
}
