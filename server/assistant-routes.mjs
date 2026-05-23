import {
  systemBase,
  careBundleUserPrompt,
  qaSystemPrompt,
  qaUserPrompt,
  vetReportUserPrompt,
  weeklyReportUserPrompt,
} from './prompts.mjs';
import { openAiChatCompletion } from './openai.mjs';
import {
  assertDailyQuota,
  assertMinuteRate,
  effectivePlanForResponse,
  getDailyLimit,
  incrementDailyUsed,
  peekDailyUsed,
} from './guard.mjs';
import { appendUsageLog } from './usage-log.mjs';
import {
  lovequestAssistantRateAndQuota,
  lovequestDailyQuotaFields,
  parseLoveQuestAiAuth,
  resolveLoveQuestAiPlan,
} from './lovequest-ai-quota.mjs';

export const MAX_CONTEXT_CHARS = 48_000;
export const MAX_QUESTION_CHARS = 8_000;
export const CARE_MAX_TOKENS = 450;
export const QA_MAX_TOKENS = 1500;
export const VET_REPORT_MAX_TOKENS = 900;
export const WEEKLY_REPORT_MAX_TOKENS = 2000;
export const COUPLE_PROMPT_MAX_CHARS = 16_000;
export const DATE_ITINERARY_MAX_TOKENS = 2400;
export const IMPORTANT_DATE_MAX_TOKENS = 1800;

const COUPLE_SYSTEM_ZH =
  '你是專業、貼心的情侶生活顧問。請依使用者指示，用繁體中文、條列清楚、具體可執行地回覆。';

const DATE_ITINERARY_SYSTEM_ZH =
  '你是會幫朋友安排約會的企劃人。只回傳 JSON 物件，禁止 Markdown。繁體中文。' +
  '時間軸 segments 的 period 只能使用「下午」「傍晚」「晚餐」「晚間收尾」各至多一次、順序固定，禁止重複「晚上」。' +
  '每段需含 headline、narrative（2～4句有情緒）、purpose、transition、conversationCue。' +
  '另含 mood、moodTags、aiReminders、partnerLines、rainPlan、tiredPlan、budgetTier（$|$$|$$$）、estimatedTotal（NT$總計兩人）、budgetBreakdown（分項NT$）、各 segment.estimatedCost、surprise、outfit。金額必須含 NT$ 與數字。';

const IMPORTANT_DATE_SYSTEM_ZH =
  '你是情侶重要日子驚喜顧問。只回傳 JSON 物件，禁止 Markdown（不得使用 #、##、###、---、** 等符號）。所有字串為繁體中文純文字。';

const MODEL = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim();

/** After incrementDailyUsed — attach to JSON so clients are not dependent on GET /health query parsing. */
function dailyQuotaFields(clientId, usageDate, planHint) {
  const limit = getDailyLimit(clientId, planHint);
  const used = peekDailyUsed(clientId, usageDate);
  return {
    dailyLimit: limit,
    dailyUsed: used,
    dailyRemaining: Math.max(0, limit - used),
  };
}

/** @param {unknown} planField */
function planHintFromBody(planField) {
  return planField === 'pro' ? 'pro' : 'free';
}

function estUsdFromUsage(usage) {
  const inPer1m = Number(process.env.AI_EST_INPUT_PER_1M_USD);
  const outPer1m = Number(process.env.AI_EST_OUTPUT_PER_1M_USD);
  if (!usage || (!Number.isFinite(inPer1m) && !Number.isFinite(outPer1m))) return null;
  const pt = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0;
  const ct = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0;
  const i = Number.isFinite(inPer1m) ? inPer1m : 0;
  const o = Number.isFinite(outPer1m) ? outPer1m : 0;
  if (i === 0 && o === 0) return null;
  return (pt / 1_000_000) * i + (ct / 1_000_000) * o;
}

function tryParseJsonObject(raw) {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error('Invalid JSON from model');
  }
}

/** @param {unknown} v */
function careBundleCoerceString(v) {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v).trim();
  return '';
}

/**
 * @param {Record<string, unknown>} obj
 * @param {readonly string[]} keys
 */
function careBundleFirstStringField(obj, keys) {
  for (const k of keys) {
    const s = careBundleCoerceString(obj[k]);
    if (s) return s;
  }
  return '';
}

/**
 * Accept canonical keys plus common aliases; fill missing/empty with safe defaults.
 * @param {unknown} parsed
 * @param {'zh' | 'en'} lang
 */
function normalizeCareBundleFromParsed(parsed, lang) {
  const zh = lang === 'zh';
  const defaults = {
    quickSummary: zh ? '目前無法產生快速摘要。' : 'Could not produce a quick summary.',
    careReminders: zh ? '請持續記錄今日照護項目。' : 'Keep logging today’s care items.',
  };
  let obj =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
  if (Array.isArray(parsed) && parsed[0] && typeof parsed[0] === 'object' && !Array.isArray(parsed[0])) {
    obj = /** @type {Record<string, unknown>} */ (parsed[0]);
  }
  const q =
    careBundleFirstStringField(obj, ['quickSummary', 'summary', 'healthSummary', 'todaySummary']) ||
    defaults.quickSummary;
  const r =
    careBundleFirstStringField(obj, [
      'careReminders',
      'reminders',
      'alerts',
      'sevenDayAnalysis',
    ]) || defaults.careReminders;
  return { quickSummary: q, careReminders: r };
}

/**
 * Model output was not valid JSON — surface raw text in the main block so the feature still works.
 * @param {'zh' | 'en'} lang
 * @param {string} raw
 */
function careBundleFromUnparsedContent(lang, raw) {
  const zh = lang === 'zh';
  const defaults = normalizeCareBundleFromParsed({}, lang);
  const t = typeof raw === 'string' ? raw.trim() : '';
  const prefix = zh
    ? '【以下為助理回覆原文；系統未能解析為預期 JSON，僅供參考。】\n\n'
    : '[Raw assistant reply; could not parse as the expected JSON — for reference only.]\n\n';
  const body = t || (zh ? '（模型未回傳可讀文字。）' : '(No readable text from the model.)');
  return {
    quickSummary: prefix + body,
    careReminders: defaults.careReminders,
  };
}

/** Stable client id from browser localStorage (not a login). */
export function isClientId(s) {
  if (typeof s !== 'string') return false;
  const t = s.trim();
  return t.length >= 8 && t.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(t);
}

export function isYmd(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

export function isCatId(s) {
  return typeof s === 'string' && s.trim().length >= 1 && s.trim().length <= 128;
}

function logLine(partial) {
  appendUsageLog({
    t: new Date().toISOString(),
    model: MODEL,
    ...partial,
  });
}

/** @returns {{ ok: true } | { ok: false, status: number, json: object }} */
function assistantRateAndQuota(clientId, catId, usageDate, feature, planHint) {
  const minute = assertMinuteRate(clientId);
  if (!minute.ok) {
    logLine({
      userId: clientId,
      catId,
      feature,
      ok: false,
      statusCode: 429,
      error: minute.message || 'RATE',
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      estUsd: null,
    });
    return {
      ok: false,
      status: 429,
      json: {
        error:
          'Too many AI requests in a short time. Please wait about a minute and try again.',
        code: 'RATE',
      },
    };
  }

  const daily = assertDailyQuota(clientId, usageDate, planHint);
  if (!daily.ok) {
    logLine({
      userId: clientId,
      catId,
      feature,
      ok: false,
      statusCode: 429,
      error: 'QUOTA',
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      estUsd: null,
    });
    return {
      ok: false,
      status: 429,
      json: {
        error: 'Daily AI limit reached for this device. Try again tomorrow or upgrade to Pro.',
        code: 'QUOTA',
        limit: daily.limit,
        used: daily.used,
        remaining: 0,
      },
    };
  }

  return { ok: true };
}

/**
 * Shared path: OpenAI call → on success only, increment daily pool + append usage log + attach quota fields.
 * @param {{
 *   clientId: string;
 *   catId: string;
 *   usageDate: string;
 *   planHint: 'free' | 'pro';
 *   feature: 'care-bundle' | 'qa' | 'weekly-report' | 'vet-report' | 'date-itinerary' | 'important-date';
 *   run: () => Promise<Record<string, unknown> & { usage: unknown }>;
 * }} opts
 * @returns {Promise<{ status: number, json: object }>}
 */
async function runAssistantOpenAiCounted(opts) {
  const { clientId, catId, usageDate, planHint, feature, run } = opts;
  try {
    const out = await run();
    const usage = out.usage;
    const { usage: _u, ...jsonPayload } = out;
    incrementDailyUsed(clientId, usageDate);
    const estUsd = estUsdFromUsage(usage);
    logLine({
      userId: clientId,
      catId,
      feature,
      ok: true,
      statusCode: 200,
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      estUsd,
    });
    return {
      status: 200,
      json: { ...jsonPayload, ...dailyQuotaFields(clientId, usageDate, planHint) },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logLine({
      userId: clientId,
      catId,
      feature,
      ok: false,
      statusCode: 502,
      error: msg.slice(0, 500),
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      estUsd: null,
    });
    return {
      status: 502,
      json: {
        error: 'The AI service returned an error. Please try again later.',
        code: 'OPENAI',
        detail: msg.slice(0, 300),
      },
    };
  }
}

async function handleCareBundle(lang, recordContext) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: systemBase(lang) },
      { role: 'user', content: careBundleUserPrompt(lang, recordContext) },
    ],
    temperature: 0.25,
    maxTokens: CARE_MAX_TOKENS,
    jsonMode: true,
  });

  let bundle;
  try {
    const parsed = tryParseJsonObject(content);
    bundle = normalizeCareBundleFromParsed(parsed, lang);
  } catch {
    bundle = careBundleFromUnparsedContent(lang, content);
  }
  return { bundle, usage };
}

async function handleQa(lang, recordContext, question) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: qaSystemPrompt(lang) },
      { role: 'user', content: qaUserPrompt(lang, recordContext, question) },
    ],
    temperature: 0.35,
    maxTokens: QA_MAX_TOKENS,
    jsonMode: false,
  });
  return { answer: content, usage };
}

function normalizeWeeklyReportFromParsed(parsed, lang) {
  const zh = lang === 'zh';
  const defaults = {
    weekSummary: zh ? '目前無法產生本週總結。' : 'Could not produce the weekly summary.',
    completionRate: zh ? '目前無法評估照護完成度。' : 'Could not assess logging completion.',
    trends: zh ? '目前無法整理趨勢。' : 'Could not summarize trends.',
    abnormalTimeline: zh ? '本週無異常紀錄或資料不足。' : 'No abnormal timeline or insufficient data.',
    weightChange: zh ? '本週無體重紀錄。' : 'No weight entries this week.',
    vsLastWeek: zh ? '上週資料不足，無法比較。' : 'Not enough prior-week data to compare.',
    nextWeekFocus: zh ? '請持續記錄餵食、喝水與排泄。' : 'Keep logging meals, water, and litter.',
  };
  const obj =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
  const pick = (keys, fallback) => {
    for (const k of keys) {
      const s = careBundleCoerceString(obj[k]);
      if (s) return s;
    }
    return fallback;
  };
  return {
    weekSummary: pick(['weekSummary', 'weeklySummary', 'summary'], defaults.weekSummary),
    completionRate: pick(['completionRate', 'completion', 'loggingCompletion'], defaults.completionRate),
    trends: pick(['trends', 'trend'], defaults.trends),
    abnormalTimeline: pick(['abnormalTimeline', 'abnormal', 'watchItems'], defaults.abnormalTimeline),
    weightChange: pick(['weightChange', 'weight'], defaults.weightChange),
    vsLastWeek: pick(['vsLastWeek', 'compareLastWeek', 'lastWeekCompare'], defaults.vsLastWeek),
    nextWeekFocus: pick(['nextWeekFocus', 'nextWeek'], defaults.nextWeekFocus),
  };
}

async function handleWeeklyReport(lang, recordContext) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: systemBase(lang) },
      { role: 'user', content: weeklyReportUserPrompt(lang, recordContext) },
    ],
    temperature: 0.25,
    maxTokens: WEEKLY_REPORT_MAX_TOKENS,
    jsonMode: true,
  });
  let report;
  try {
    report = normalizeWeeklyReportFromParsed(tryParseJsonObject(content), lang);
  } catch {
    report = normalizeWeeklyReportFromParsed({}, lang);
    report.weekSummary = content.trim().slice(0, 1200) || report.weekSummary;
  }
  return { ...report, usage };
}

/**
 * @param {URLSearchParams} searchParams
 * @returns {{ status: number, json: object }}
 */
export function assistHealthGET(searchParams) {
  const clientId = (searchParams.get('clientId') || '').trim();
  const usageDate = (searchParams.get('usageDate') || '').trim();
  const planHint = planHintFromBody(searchParams.get('plan'));
  const openaiReady = Boolean(process.env.OPENAI_API_KEY?.trim());
  if (!isClientId(clientId) || !isYmd(usageDate)) {
    return {
      status: 200,
      json: {
        ok: true,
        openaiReady,
        dailyLimit: 3,
        dailyUsed: 0,
        dailyRemaining: 3,
        planEffective: 'free',
      },
    };
  }
  const limit = getDailyLimit(clientId, planHint);
  const used = peekDailyUsed(clientId, usageDate);
  const planEffective = effectivePlanForResponse(clientId, planHint);
  return {
    status: 200,
    json: {
      ok: true,
      openaiReady,
      dailyLimit: limit,
      dailyUsed: used,
      dailyRemaining: Math.max(0, limit - used),
      planEffective,
    },
  };
}

/**
 * @param {unknown} body
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistCareBundlePOST(body) {
  const b = body && typeof body === 'object' ? body : {};
  const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : '';
  const catId = typeof b.catId === 'string' ? b.catId.trim() : '';
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';

  if (!isClientId(clientId)) {
    return { status: 400, json: { error: 'Invalid or missing clientId', code: 'BAD_REQUEST' } };
  }
  if (!isCatId(catId)) {
    return { status: 400, json: { error: 'Invalid or missing catId', code: 'BAD_REQUEST' } };
  }
  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }

  const planHint = planHintFromBody(b.plan);
  const rq = assistantRateAndQuota(clientId, catId, usageDate, 'care-bundle', planHint);
  if (!rq.ok) return { status: rq.status, json: rq.json };

  const lang = b.lang;
  const recordContext = b.recordContext;
  if (lang !== 'zh' && lang !== 'en') {
    return { status: 400, json: { error: 'Invalid lang', code: 'BAD_REQUEST' } };
  }
  if (typeof recordContext !== 'string' || !recordContext.trim()) {
    return { status: 400, json: { error: 'Missing recordContext', code: 'BAD_REQUEST' } };
  }
  if (recordContext.length > MAX_CONTEXT_CHARS) {
    return { status: 400, json: { error: 'recordContext too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  return runAssistantOpenAiCounted({
    clientId,
    catId,
    usageDate,
    planHint,
    feature: 'care-bundle',
    run: async () => {
      const { bundle, usage } = await handleCareBundle(lang, recordContext);
      return { ...bundle, usage };
    },
  });
}

/**
 * @param {unknown} body
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistQaPOST(body) {
  const b = body && typeof body === 'object' ? body : {};
  const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : '';
  const catId = typeof b.catId === 'string' ? b.catId.trim() : '';
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';

  if (!isClientId(clientId)) {
    return { status: 400, json: { error: 'Invalid or missing clientId', code: 'BAD_REQUEST' } };
  }
  if (!isCatId(catId)) {
    return { status: 400, json: { error: 'Invalid or missing catId', code: 'BAD_REQUEST' } };
  }
  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }

  const planHint = planHintFromBody(b.plan);
  const rq = assistantRateAndQuota(clientId, catId, usageDate, 'qa', planHint);
  if (!rq.ok) return { status: rq.status, json: rq.json };

  const lang = b.lang;
  const recordContext = b.recordContext;
  const question = b.question;
  if (lang !== 'zh' && lang !== 'en') {
    return { status: 400, json: { error: 'Invalid lang', code: 'BAD_REQUEST' } };
  }
  if (typeof recordContext !== 'string' || !recordContext.trim()) {
    return { status: 400, json: { error: 'Missing recordContext', code: 'BAD_REQUEST' } };
  }
  if (recordContext.length > MAX_CONTEXT_CHARS) {
    return { status: 400, json: { error: 'recordContext too long', code: 'BAD_REQUEST' } };
  }
  if (typeof question !== 'string' || !question.trim()) {
    return { status: 400, json: { error: 'Missing question', code: 'BAD_REQUEST' } };
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return { status: 400, json: { error: 'question too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  return runAssistantOpenAiCounted({
    clientId,
    catId,
    usageDate,
    planHint,
    feature: 'qa',
    run: async () => {
      const { answer, usage } = await handleQa(lang, recordContext, question);
      return { answer, usage };
    },
  });
}

/**
 * @param {unknown} body
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistWeeklyReportPOST(body) {
  const b = body && typeof body === 'object' ? body : {};
  const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : '';
  const catId = typeof b.catId === 'string' ? b.catId.trim() : '';
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';

  if (!isClientId(clientId)) {
    return { status: 400, json: { error: 'Invalid or missing clientId', code: 'BAD_REQUEST' } };
  }
  if (!isCatId(catId)) {
    return { status: 400, json: { error: 'Invalid or missing catId', code: 'BAD_REQUEST' } };
  }
  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }

  const planHint = planHintFromBody(b.plan);
  const rq = assistantRateAndQuota(clientId, catId, usageDate, 'weekly-report', planHint);
  if (!rq.ok) return { status: rq.status, json: rq.json };

  const lang = b.lang;
  const recordContext = b.recordContext;
  if (lang !== 'zh' && lang !== 'en') {
    return { status: 400, json: { error: 'Invalid lang', code: 'BAD_REQUEST' } };
  }
  if (typeof recordContext !== 'string' || !recordContext.trim()) {
    return { status: 400, json: { error: 'Missing recordContext', code: 'BAD_REQUEST' } };
  }
  if (recordContext.length > MAX_CONTEXT_CHARS) {
    return { status: 400, json: { error: 'recordContext too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  return runAssistantOpenAiCounted({
    clientId,
    catId,
    usageDate,
    planHint,
    feature: 'weekly-report',
    run: async () => {
      const { usage, ...report } = await handleWeeklyReport(lang, recordContext);
      return { ...report, usage };
    },
  });
}

function normalizeVetReportFromParsed(parsed, lang) {
  const defaults = {
    watchItems: lang === 'zh' ? '目前無法整理需注意事項。' : 'Could not summarize watch items.',
    observeDirections:
      lang === 'zh' ? '目前無法整理觀察方向。' : 'Could not summarize observation directions.',
    vetHandoff: lang === 'zh' ? '目前無法整理獸醫重點。' : 'Could not summarize vet handoff.',
  };
  const obj =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
  const watchItems =
    typeof obj.watchItems === 'string' && obj.watchItems.trim()
      ? obj.watchItems.trim()
      : defaults.watchItems;
  const observeDirections =
    typeof obj.observeDirections === 'string' && obj.observeDirections.trim()
      ? obj.observeDirections.trim()
      : defaults.observeDirections;
  const vetHandoff =
    typeof obj.vetHandoff === 'string' && obj.vetHandoff.trim()
      ? obj.vetHandoff.trim()
      : defaults.vetHandoff;
  return { watchItems, observeDirections, vetHandoff };
}

async function handleVetReport(lang, recordContext) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: systemBase(lang) },
      { role: 'user', content: vetReportUserPrompt(lang, recordContext) },
    ],
    temperature: 0.25,
    maxTokens: VET_REPORT_MAX_TOKENS,
    jsonMode: true,
  });
  let summary;
  try {
    summary = normalizeVetReportFromParsed(tryParseJsonObject(content), lang);
  } catch {
    summary = normalizeVetReportFromParsed({}, lang);
    summary.watchItems = content.trim().slice(0, 1200) || summary.watchItems;
  }
  return { ...summary, usage };
}

/**
 * Vet report AI — shares the same daily AI pool as care-bundle / qa / weekly-report.
 * @param {unknown} body
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistVetReportPOST(body) {
  const b = body && typeof body === 'object' ? body : {};
  const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : '';
  const catId = typeof b.catId === 'string' ? b.catId.trim() : '';
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';

  if (!isClientId(clientId)) {
    return { status: 400, json: { error: 'Invalid or missing clientId', code: 'BAD_REQUEST' } };
  }
  if (!isCatId(catId)) {
    return { status: 400, json: { error: 'Invalid or missing catId', code: 'BAD_REQUEST' } };
  }
  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }

  const lang = b.lang;
  const recordContext = b.recordContext;
  if (lang !== 'zh' && lang !== 'en') {
    return { status: 400, json: { error: 'Invalid lang', code: 'BAD_REQUEST' } };
  }
  if (typeof recordContext !== 'string' || !recordContext.trim()) {
    return { status: 400, json: { error: 'Missing recordContext', code: 'BAD_REQUEST' } };
  }
  if (recordContext.length > MAX_CONTEXT_CHARS) {
    return { status: 400, json: { error: 'recordContext too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  const planHint = planHintFromBody(b.plan);
  const rq = assistantRateAndQuota(clientId, catId, usageDate, 'vet-report', planHint);
  if (!rq.ok) return { status: rq.status, json: rq.json };

  return runAssistantOpenAiCounted({
    clientId,
    catId,
    usageDate,
    planHint,
    feature: 'vet-report',
    run: async () => handleVetReport(lang, recordContext),
  });
}

async function handleCouplePrompt(prompt, maxTokens) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: COUPLE_SYSTEM_ZH },
      { role: 'user', content: prompt },
    ],
    temperature: 0.55,
    maxTokens,
    jsonMode: false,
  });
  return { answer: content, usage };
}

function stripMarkdownPlain(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function dateItineraryCoerceString(v) {
  return stripMarkdownPlain(careBundleCoerceString(v));
}

function canonicalDatePeriod(raw) {
  const t = dateItineraryCoerceString(raw);
  if (!t) return null;
  if (/下午|afternoon/i.test(t)) return '下午';
  if (/傍晚|黃昏|dusk/i.test(t)) return '傍晚';
  if (/晚餐|dinner/i.test(t)) return '晚餐';
  if (/晚間|晚上|夜|收尾/i.test(t)) return '晚間收尾';
  if (/上午|中午|morning/i.test(t)) return '下午';
  return null;
}

function normalizeDateItinerarySegment(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const periodRaw = dateItineraryCoerceString(o.period ?? o.time ?? o.時段);
  const period = canonicalDatePeriod(periodRaw) ?? (periodRaw || '下午');
  const place = dateItineraryCoerceString(o.place ?? o.location ?? o.地點);
  const headline = dateItineraryCoerceString(o.headline ?? o.title ?? (place !== '—' ? place : ''));
  const narrative = dateItineraryCoerceString(
    o.narrative ?? o.mood ?? o.description ?? o.activity ?? o.活動 ?? o.content
  );
  const purpose = dateItineraryCoerceString(o.purpose ?? o.why ?? o.目的);
  const conversationCue = dateItineraryCoerceString(o.conversationCue ?? o.conversation ?? o.對話建議);
  const transition = dateItineraryCoerceString(o.transition ?? o.轉場);
  let estimatedCost = dateItineraryCoerceString(
    o.estimatedCost ?? o.cost ?? o.花費 ?? o.amount
  );
  if (!estimatedCost && typeof o.amountMin === 'number') {
    const max = typeof o.amountMax === 'number' ? o.amountMax : o.amountMin;
    estimatedCost = `NT$ ${o.amountMin}–${max}`;
  }
  if (estimatedCost && !/NT\$|元/.test(estimatedCost) && /^\d/.test(estimatedCost)) {
    estimatedCost = `NT$ ${estimatedCost}`;
  }
  if (!period && !place && !narrative && !headline) return null;
  return {
    period,
    place: place || '—',
    headline: headline || place || '約會景點',
    narrative: narrative || '—',
    purpose: purpose || '讓約會節奏自然推進',
    conversationCue: conversationCue || undefined,
    transition: transition || undefined,
    estimatedCost: estimatedCost || undefined,
    activity: dateItineraryCoerceString(o.activity ?? o.活動) || undefined,
  };
}

function normalizeBudgetLineItemServer(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const label = dateItineraryCoerceString(o.label ?? o.item ?? o.項目);
  let amount = dateItineraryCoerceString(o.amount ?? o.cost ?? o.金額);
  if (!amount && typeof o.amountMin === 'number') {
    const max = typeof o.amountMax === 'number' ? o.amountMax : o.amountMin;
    amount = `NT$ ${o.amountMin}–${max}`;
  }
  if (!label || !amount) return null;
  return { label, amount };
}

function dedupeDateItinerarySegments(segments) {
  const order = ['下午', '傍晚', '晚餐', '晚間收尾'];
  const map = new Map();
  for (const seg of segments) {
    const key = canonicalDatePeriod(seg.period) ?? seg.period;
    const normalized = { ...seg, period: key };
    if (!map.has(key)) map.set(key, normalized);
  }
  return order.map((k) => map.get(k)).filter(Boolean);
}

function normalizeDateItineraryTips(v) {
  if (Array.isArray(v)) {
    return v.map(dateItineraryCoerceString).filter(Boolean);
  }
  const s = dateItineraryCoerceString(v);
  if (!s) return [];
  return s
    .split(/\n+/)
    .map((x) => x.replace(/^[•\d.)、]+\s*/, '').trim())
    .filter(Boolean);
}

/**
 * @param {unknown} parsed
 */
function normalizeDateItineraryFromParsed(parsed) {
  const obj =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
  const title = dateItineraryCoerceString(obj.title ?? obj.theme ?? obj.行程標題) || '今日約會企劃';
  const mood = dateItineraryCoerceString(obj.mood ?? obj.約會氛圍) || '溫柔而有儀式感';
  const moodTags = normalizeDateItineraryTips(obj.moodTags ?? obj.氛圍標籤).slice(0, 4);
  const budgetNote = dateItineraryCoerceString(obj.budgetNote ?? obj.budget ?? obj.預算) || '依實際消費調整';
  let budgetTier = dateItineraryCoerceString(obj.budgetTier ?? obj.預估花費);
  if (budgetTier !== '$' && budgetTier !== '$$' && budgetTier !== '$$$') budgetTier = '$$';

  const rawSeg = obj.segments ?? obj.schedule ?? obj.timeline ?? obj.時段;
  const segments = dedupeDateItinerarySegments(
    Array.isArray(rawSeg) ? rawSeg.map(normalizeDateItinerarySegment).filter(Boolean) : []
  );

  const aiReminders = normalizeDateItineraryTips(
    obj.aiReminders ?? obj.tips ?? obj.貼心提醒 ?? obj.注意事項
  );
  const partnerLines = normalizeDateItineraryTips(obj.partnerLines ?? obj.可以對伴侶說).slice(0, 4);
  const rainPlan =
    dateItineraryCoerceString(obj.rainPlan ?? obj.雨天備案) || '改為室內咖啡或電影，保留陪伴品質';
  const tiredPlan = dateItineraryCoerceString(obj.tiredPlan ?? obj.累了備案) || undefined;
  const outfit = dateItineraryCoerceString(obj.outfit ?? obj.穿搭) || undefined;
  const surprise = dateItineraryCoerceString(obj.surprise ?? obj.小驚喜) || undefined;

  const rawBreakdown = obj.budgetBreakdown ?? obj.budgetItems ?? obj.costBreakdown;
  /** @type {{ label: string, amount: string }[]} */
  let budgetBreakdown = Array.isArray(rawBreakdown)
    ? rawBreakdown.map(normalizeBudgetLineItemServer).filter(Boolean)
    : [];
  if (budgetBreakdown.length === 0) {
    budgetBreakdown = segments
      .filter((s) => s.estimatedCost)
      .map((s) => ({
        label: `${s.period} · ${s.headline || s.place}`,
        amount: s.estimatedCost,
      }));
  }

  let estimatedTotal = dateItineraryCoerceString(
    obj.estimatedTotal ?? obj.totalCost ?? obj.總計
  );
  if (!estimatedTotal || !/NT\$|元/.test(estimatedTotal)) {
    const m = budgetNote.match(/(NT\$[\d,]+(?:\s*[–\-~]\s*NT\$[\d,]+)?(?:\s*（[^）]+）)?)/);
    if (m) estimatedTotal = m[1];
  }

  return {
    title,
    mood,
    moodTags: moodTags.length ? moodTags : [mood],
    segments,
    aiReminders,
    partnerLines,
    rainPlan,
    tiredPlan,
    budgetTier,
    estimatedTotal: estimatedTotal || '',
    budgetBreakdown,
    budgetNote: budgetNote || estimatedTotal || '依實際消費調整',
    outfit,
    surprise,
    tips: aiReminders,
    budget: budgetNote,
  };
}

async function handleDateItinerary(prompt) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: DATE_ITINERARY_SYSTEM_ZH },
      { role: 'user', content: prompt },
    ],
    temperature: 0.48,
    maxTokens: DATE_ITINERARY_MAX_TOKENS,
    jsonMode: true,
  });

  let itinerary;
  try {
    itinerary = normalizeDateItineraryFromParsed(tryParseJsonObject(content));
  } catch {
    itinerary = normalizeDateItineraryFromParsed({});
    itinerary.tips = [stripMarkdownPlain(content).slice(0, 500) || '請再試一次產生行程'];
  }

  const answer = [
    itinerary.title,
    itinerary.mood ? `氛圍：${itinerary.mood}` : '',
    ...itinerary.segments.map(
      (s) => `${s.period}｜${s.headline}：${s.narrative}`
    ),
    itinerary.budgetNote ? `預算：${itinerary.budgetTier} ${itinerary.budgetNote}` : '',
    itinerary.aiReminders?.length ? `提醒：${itinerary.aiReminders.join('；')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { itinerary, answer, usage };
}

function normalizeImportantDateTimelineItem(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const period = dateItineraryCoerceString(o.period ?? o.time ?? o.時段);
  const place = dateItineraryCoerceString(o.place ?? o.location ?? o.地點);
  const activity = dateItineraryCoerceString(o.activity ?? o.活動 ?? o.content);
  if (!period && !place && !activity) return null;
  return {
    period: period || '時段',
    place: place || '—',
    activity: activity || '—',
  };
}

/**
 * @param {unknown} parsed
 */
function normalizeImportantDateFromParsed(parsed) {
  const obj =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? /** @type {Record<string, unknown>} */ (parsed)
      : {};
  const title = dateItineraryCoerceString(obj.title ?? obj.標題) || '重要日子安排';
  const dateIdeas = dateItineraryCoerceString(
    obj.dateIdeas ?? obj.datePlan ?? obj.約會安排
  );
  const gifts = normalizeDateItineraryTips(obj.gifts ?? obj.禮物建議 ?? obj.禮物);
  const phrase = dateItineraryCoerceString(obj.phrase ?? obj.message ?? obj.一句話);
  const tips = normalizeDateItineraryTips(obj.tips ?? obj.注意事項 ?? obj.貼心提醒);
  const budget = dateItineraryCoerceString(obj.budget ?? obj.預算);

  const rawTimeline = obj.timeline ?? obj.schedule ?? obj.flow ?? obj.當天流程;
  const timeline = Array.isArray(rawTimeline)
    ? rawTimeline.map(normalizeImportantDateTimelineItem).filter(Boolean)
    : [];

  return {
    title,
    dateIdeas: dateIdeas || '依你們的節奏安排一場用心約會',
    gifts,
    timeline,
    phrase,
    tips,
    budget,
  };
}

async function handleImportantDate(prompt) {
  const { content, usage } = await openAiChatCompletion({
    messages: [
      { role: 'system', content: IMPORTANT_DATE_SYSTEM_ZH },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    maxTokens: IMPORTANT_DATE_MAX_TOKENS,
    jsonMode: true,
  });

  let plan;
  try {
    plan = normalizeImportantDateFromParsed(tryParseJsonObject(content));
  } catch {
    plan = normalizeImportantDateFromParsed({});
    plan.tips = [stripMarkdownPlain(content).slice(0, 500) || '請再試一次產生建議'];
  }

  const answer = [
    plan.title,
    plan.dateIdeas ? `約會：${plan.dateIdeas}` : '',
    plan.gifts.length ? `禮物：${plan.gifts.join('、')}` : '',
    ...plan.timeline.map((t) => `${t.period}：${t.place} — ${t.activity}`),
    plan.phrase ? `一句話：${plan.phrase}` : '',
    plan.tips.length ? `提醒：${plan.tips.join('；')}` : '',
    plan.budget ? `預算：${plan.budget}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return { plan, answer, usage };
}

/**
 * @param {unknown} body
 * @param {'date-itinerary' | 'important-date'} feature
 * @param {string} catId
 * @param {number} maxTokens
 * @returns {Promise<{ status: number, json: object }>}
 */
async function assistCouplePromptPOST(body, feature, catId, maxTokens) {
  const b = body && typeof body === 'object' ? body : {};
  const clientId = typeof b.clientId === 'string' ? b.clientId.trim() : '';
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';

  if (!isClientId(clientId)) {
    return { status: 400, json: { error: 'Invalid or missing clientId', code: 'BAD_REQUEST' } };
  }
  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }
  if (!prompt) {
    return { status: 400, json: { error: 'Missing prompt', code: 'BAD_REQUEST' } };
  }
  if (prompt.length > COUPLE_PROMPT_MAX_CHARS) {
    return { status: 400, json: { error: 'prompt too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  const planHint = planHintFromBody(b.plan);
  const rq = assistantRateAndQuota(clientId, catId, usageDate, feature, planHint);
  if (!rq.ok) return { status: rq.status, json: rq.json };

  return runAssistantOpenAiCounted({
    clientId,
    catId,
    usageDate,
    planHint,
    feature,
    run: async () => handleCouplePrompt(prompt, maxTokens),
  });
}

/**
 * LoveQuest: OpenAI → increment Supabase usage on success only.
 * @param {{
 *   userId: string;
 *   coupleId: string | null;
 *   usageDate: string;
 *   plan: 'free' | 'pro';
 *   feature: string;
 *   catId: string;
 *   run: () => Promise<Record<string, unknown> & { usage: unknown }>;
 * }} opts
 */
async function runLoveQuestAssistantOpenAiCounted(opts) {
  const { userId, coupleId, usageDate, plan, feature, catId, run } = opts;
  const { reserveLoveQuestDailyUsed, refundLoveQuestDailyUsed } = await import(
    './lovequest-ai-quota.mjs'
  );

  const reserved = await reserveLoveQuestDailyUsed(userId, usageDate, plan);
  if (!reserved.ok) {
    const errorZh =
      plan === 'pro'
        ? `今日 AI 次數已達上限（${reserved.limit} 次），請明天再試`
        : '今日免費 AI 次數已用完，升級 Pro 可每日使用 30 次';
    return {
      status: 429,
      json: {
        error: errorZh,
        code: 'QUOTA',
        limit: reserved.limit,
        used: reserved.used,
        remaining: 0,
        planEffective: plan,
        feature,
      },
    };
  }

  try {
    const out = await run();
    const usage = out.usage;
    const { usage: _u, ...jsonPayload } = out;
    const estUsd = estUsdFromUsage(usage);
    logLine({
      userId,
      catId,
      feature,
      ok: true,
      statusCode: 200,
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      estUsd,
      coupleId: coupleId || undefined,
    });
    const quotaFields = await lovequestDailyQuotaFields(userId, usageDate, plan);
    return {
      status: 200,
      json: { ...jsonPayload, ...quotaFields },
    };
  } catch (e) {
    await refundLoveQuestDailyUsed(userId, usageDate);
    const msg = e instanceof Error ? e.message : String(e);
    logLine({
      userId,
      catId,
      feature,
      ok: false,
      statusCode: 502,
      error: msg.slice(0, 500),
      promptTokens: null,
      completionTokens: null,
      totalTokens: null,
      estUsd: null,
      coupleId: coupleId || undefined,
    });
    return {
      status: 502,
      json: {
        error: 'AI 服務暫時無法回應，請稍後再試',
        code: 'OPENAI',
        detail: msg.slice(0, 300),
      },
    };
  }
}

/**
 * GET LoveQuest AI quota for logged-in user (Supabase-backed).
 * @param {URLSearchParams} searchParams
 * @param {Record<string, string | string[] | undefined>} [headers]
 */
export async function assistLoveQuestQuotaGET(searchParams, headers = {}) {
  const usageDate = (searchParams.get('usageDate') || '').trim();
  const body = {
    accessToken: (searchParams.get('accessToken') || '').trim(),
    userId: (searchParams.get('userId') || '').trim(),
    coupleId: (searchParams.get('coupleId') || '').trim(),
  };
  const auth = await parseLoveQuestAiAuth(body, headers);
  if (!auth.ok) return { status: auth.status, json: auth.json };

  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }

  const plan = await resolveLoveQuestAiPlan(auth.userId, auth.coupleId);
  const fields = await lovequestDailyQuotaFields(auth.userId, usageDate, plan);
  return {
    status: 200,
    json: { ok: true, openaiReady: Boolean(process.env.OPENAI_API_KEY?.trim()), ...fields },
  };
}

/**
 * @param {unknown} body
 * @param {Record<string, string | string[] | undefined>} [headers]
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistDateItineraryPOST(body, headers = {}) {
  const auth = await parseLoveQuestAiAuth(body, headers);
  if (!auth.ok) return { status: auth.status, json: auth.json };

  const b = body && typeof body === 'object' ? body : {};
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';

  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }
  if (!prompt) {
    return { status: 400, json: { error: 'Missing prompt', code: 'BAD_REQUEST' } };
  }
  if (prompt.length > COUPLE_PROMPT_MAX_CHARS) {
    return { status: 400, json: { error: 'prompt too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  const rq = await lovequestAssistantRateAndQuota({
    userId: auth.userId,
    usageDate,
    coupleId: auth.coupleId,
    feature: 'date-itinerary',
  });
  if (!rq.ok) return { status: rq.status, json: rq.json };

  return runLoveQuestAssistantOpenAiCounted({
    userId: auth.userId,
    coupleId: auth.coupleId,
    usageDate,
    plan: rq.plan,
    catId: 'couple-date-itinerary',
    feature: 'date-itinerary',
    run: async () => handleDateItinerary(prompt),
  });
}

/**
 * @param {unknown} body
 * @param {Record<string, string | string[] | undefined>} [headers]
 * @returns {Promise<{ status: number, json: object }>}
 */
export async function assistImportantDatePOST(body, headers = {}) {
  const auth = await parseLoveQuestAiAuth(body, headers);
  if (!auth.ok) return { status: auth.status, json: auth.json };

  const b = body && typeof body === 'object' ? body : {};
  const usageDate = typeof b.usageDate === 'string' ? b.usageDate.trim() : '';
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';

  if (!isYmd(usageDate)) {
    return {
      status: 400,
      json: { error: 'Invalid or missing usageDate (YYYY-MM-DD)', code: 'BAD_REQUEST' },
    };
  }
  if (!prompt) {
    return { status: 400, json: { error: 'Missing prompt', code: 'BAD_REQUEST' } };
  }
  if (prompt.length > COUPLE_PROMPT_MAX_CHARS) {
    return { status: 400, json: { error: 'prompt too long', code: 'BAD_REQUEST' } };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      status: 503,
      json: { error: 'Server is not configured with OPENAI_API_KEY', code: 'NO_API_KEY' },
    };
  }

  const rq = await lovequestAssistantRateAndQuota({
    userId: auth.userId,
    usageDate,
    coupleId: auth.coupleId,
    feature: 'important-date',
  });
  if (!rq.ok) return { status: rq.status, json: rq.json };

  return runLoveQuestAssistantOpenAiCounted({
    userId: auth.userId,
    coupleId: auth.coupleId,
    usageDate,
    plan: rq.plan,
    catId: 'couple-important-date',
    feature: 'important-date',
    run: async () => handleImportantDate(prompt),
  });
}
