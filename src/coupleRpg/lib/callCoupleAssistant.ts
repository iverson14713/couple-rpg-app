import type { CoupleAssistantAuth } from './coupleAssistantApi';
import {
  postDateItineraryAssistant,
  postImportantDateAssistant,
  postCoupleAssistant,
  type CoupleAssistantEndpoint,
  type CoupleAssistantSuccess,
  type DateItineraryAssistantSuccess,
  type ImportantDateAssistantSuccess,
} from './coupleAssistantApi';
import type { AiUsageGateResult } from '../hooks/useAiUsage';
import type { AiQuotaApiFields } from './aiUsageManager';

export type AiUsageActions = {
  ensureCanCallAi: () => AiUsageGateResult;
  tryBeginAiCall: () => boolean;
  endAiCall: () => void;
  getCoupleAssistantAuth: () => CoupleAssistantAuth | null;
  syncQuotaAfterAiSuccess: (fields: AiQuotaApiFields) => Promise<void>;
};

async function runCoupleAiCall<T extends CoupleAssistantSuccess>(
  usage: AiUsageActions,
  call: () => Promise<{ ok: true; data: T } | { ok: false; message: string; code?: string }>
): Promise<{ ok: true; data: T } | { ok: false; message: string; code?: string }> {
  const gate = usage.ensureCanCallAi();
  if (!gate.ok) {
    return { ok: false, message: gate.message, code: gate.code };
  }
  if (!usage.tryBeginAiCall()) {
    return { ok: false, message: 'AI 正在處理中，請稍候', code: 'BUSY' };
  }

  try {
    const auth = usage.getCoupleAssistantAuth();
    if (!auth) {
      return { ok: false, message: '請先登入後再使用 AI', code: 'AUTH' };
    }
    const result = await call();
    if (result.ok) {
      await usage.syncQuotaAfterAiSuccess(result.data);
    }
    return result;
  } finally {
    usage.endAiCall();
  }
}

/**
 * Unified LoveQuest AI call: gate → lock → auth → API → server quota sync on success only.
 */
export async function callCoupleAssistantEndpoint(
  endpoint: CoupleAssistantEndpoint,
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: CoupleAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  return runCoupleAiCall(usage, () => {
    const auth = usage.getCoupleAssistantAuth();
    if (!auth) {
      return Promise.resolve({ ok: false, message: '請先登入後再使用 AI', code: 'AUTH' });
    }
    return postCoupleAssistant(endpoint, prompt, auth);
  });
}

export async function callDateItineraryAssistant(
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: DateItineraryAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  return runCoupleAiCall(usage, () => {
    const auth = usage.getCoupleAssistantAuth();
    if (!auth) {
      return Promise.resolve({ ok: false, message: '請先登入後再使用 AI', code: 'AUTH' });
    }
    return postDateItineraryAssistant(prompt, auth);
  });
}

export async function callImportantDateAssistant(
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: ImportantDateAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  return runCoupleAiCall(usage, () => {
    const auth = usage.getCoupleAssistantAuth();
    if (!auth) {
      return Promise.resolve({ ok: false, message: '請先登入後再使用 AI', code: 'AUTH' });
    }
    return postImportantDateAssistant(prompt, auth);
  });
}
