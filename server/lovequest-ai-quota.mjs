import { createClient } from '@supabase/supabase-js';
import {
  assertMinuteRate,
  effectivePlanForResponse,
  getDailyLimit,
  trustClientPlan,
} from './guard.mjs';

const FREE_DEFAULT = 3;
const PRO_DEFAULT = 30;

let adminClient = null;

function freeLimit() {
  const n = Number(process.env.AI_FREE_DAILY_LIMIT);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : FREE_DEFAULT;
}

function proLimit() {
  const n = Number(process.env.AI_PRO_DAILY_LIMIT);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : PRO_DEFAULT;
}

export function getLoveQuestDailyLimit(plan) {
  return plan === 'pro' ? proLimit() : freeLimit();
}

export function isLoveQuestQuotaConfigured() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key);
}

function getSupabaseAdmin() {
  if (adminClient) return adminClient;
  const url = process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  adminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}

function bearerToken(headers) {
  const h = headers?.authorization || headers?.Authorization;
  if (typeof h !== 'string') return '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : '';
}

/**
 * @param {unknown} body
 * @param {Record<string, string | string[] | undefined>} [headers]
 */
export async function parseLoveQuestAiAuth(body, headers = {}) {
  const b = body && typeof body === 'object' ? body : {};
  const token =
    (typeof b.accessToken === 'string' ? b.accessToken.trim() : '') || bearerToken(headers);

  if (!token) {
    return {
      ok: false,
      status: 401,
      json: { error: '請先登入後再使用 AI', code: 'AUTH_REQUIRED' },
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      json: {
        error: '雲端 AI 額度尚未設定，請設定 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY',
        code: 'SUPABASE_NOT_CONFIGURED',
      },
    };
  }

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.id) {
    return {
      ok: false,
      status: 401,
      json: { error: '登入已過期，請重新登入', code: 'AUTH_INVALID' },
    };
  }

  const bodyUserId = typeof b.userId === 'string' ? b.userId.trim() : '';
  if (bodyUserId && bodyUserId !== data.user.id) {
    return {
      ok: false,
      status: 403,
      json: { error: '使用者身分不符', code: 'FORBIDDEN' },
    };
  }

  const coupleId = typeof b.coupleId === 'string' && b.coupleId.trim() ? b.coupleId.trim() : null;

  return {
    ok: true,
    userId: data.user.id,
    coupleId,
    accessToken: token,
  };
}

/**
 * Resolve plan from couple_subscriptions when coupleId is set; otherwise free (prod) or trust hint (dev).
 * @param {string} userId
 * @param {string | null} coupleId
 */
export async function resolveLoveQuestAiPlan(userId, coupleId) {
  const admin = getSupabaseAdmin();
  if (!admin) return 'free';

  if (coupleId) {
    const { data: member, error: memErr } = await admin
      .from('couple_members')
      .select('user_id')
      .eq('couple_id', coupleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memErr || !member) {
      return 'free';
    }

    const { data: sub } = await admin
      .from('couple_subscriptions')
      .select('plan, status')
      .eq('couple_id', coupleId)
      .maybeSingle();

    if (sub && sub.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing')) {
      return 'pro';
    }
    return 'free';
  }

  if (trustClientPlan()) {
    return 'pro';
  }
  return 'free';
}

/**
 * @param {string} userId
 * @param {string} usageDate YYYY-MM-DD
 */
export async function peekLoveQuestDailyUsed(userId, usageDate) {
  const admin = getSupabaseAdmin();
  if (!admin) return 0;

  const { data, error } = await admin
    .from('lovequest_ai_daily_usage')
    .select('used_count')
    .eq('user_id', userId)
    .eq('usage_date', usageDate)
    .maybeSingle();

  if (error || !data) return 0;
  const n = Number(data.used_count);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/**
 * @param {string} userId
 * @param {string} usageDate
 * @param {'free' | 'pro'} plan
 */
export async function assertLoveQuestDailyQuota(userId, usageDate, plan) {
  const limit = getLoveQuestDailyLimit(plan);
  const used = await peekLoveQuestDailyUsed(userId, usageDate);
  const remaining = Math.max(0, limit - used);
  if (used >= limit) {
    return { ok: false, code: 'QUOTA', used, limit, remaining: 0, plan };
  }
  return { ok: true, used, limit, remaining, plan };
}

/** @param {string} userId */
export function assertLoveQuestMinuteRate(userId) {
  return assertMinuteRate(userId);
}

/**
 * @param {string} userId
 * @param {string} usageDate
 */
export async function incrementLoveQuestDailyUsed(userId, usageDate) {
  const admin = getSupabaseAdmin();
  if (!admin) return;

  const used = await peekLoveQuestDailyUsed(userId, usageDate);
  const next = used + 1;
  const { error } = await admin.from('lovequest_ai_daily_usage').upsert(
    {
      user_id: userId,
      usage_date: usageDate,
      used_count: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,usage_date' }
  );
  if (error) {
    console.error('[lovequest-ai-quota] increment failed', error.message);
  }
}

/**
 * @param {string} userId
 * @param {string} usageDate
 * @param {'free' | 'pro'} plan
 */
export async function lovequestDailyQuotaFields(userId, usageDate, plan) {
  const limit = getLoveQuestDailyLimit(plan);
  const used = await peekLoveQuestDailyUsed(userId, usageDate);
  return {
    dailyLimit: limit,
    dailyUsed: used,
    dailyRemaining: Math.max(0, limit - used),
    planEffective: plan,
  };
}

/**
 * @param {{
 *   userId: string;
 *   usageDate: string;
 *   coupleId: string | null;
 *   feature: string;
 * }} opts
 */
export async function lovequestAssistantRateAndQuota(opts) {
  const { userId, usageDate, coupleId, feature } = opts;

  const minute = assertLoveQuestMinuteRate(userId);
  if (!minute.ok) {
    return {
      ok: false,
      status: 429,
      json: {
        error: '請求太頻繁，請稍候約一分鐘再試',
        code: 'RATE',
        feature,
      },
    };
  }

  const plan = await resolveLoveQuestAiPlan(userId, coupleId);
  const daily = await assertLoveQuestDailyQuota(userId, usageDate, plan);
  if (!daily.ok) {
    const errorZh =
      daily.plan === 'pro'
        ? `今日 AI 次數已達上限（${daily.limit} 次），請明天再試`
        : '今日免費 AI 次數已用完，升級 Pro 可每日使用 30 次';
    return {
      ok: false,
      status: 429,
      json: {
        error: errorZh,
        code: 'QUOTA',
        limit: daily.limit,
        used: daily.used,
        remaining: 0,
        planEffective: daily.plan,
        feature,
      },
    };
  }

  return { ok: true, plan, daily };
}

/** Legacy pet-app health fields shape for LoveQuest GET. */
export function lovequestQuotaHealthFallback(planHint = 'free') {
  const plan = planHint === 'pro' && trustClientPlan() ? 'pro' : 'free';
  const limit = getDailyLimit('lq-dev', plan);
  return {
    dailyLimit: limit,
    dailyUsed: 0,
    dailyRemaining: limit,
    planEffective: effectivePlanForResponse('lq-dev', plan),
  };
}
