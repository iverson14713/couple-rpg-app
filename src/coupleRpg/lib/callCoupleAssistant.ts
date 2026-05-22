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

type AiUsageActions = {
  ensureCanCallAi: () => AiUsageGateResult;
  getCoupleAssistantAuth: () => CoupleAssistantAuth | null;
  applyQuotaFromResponse: (fields: {
    dailyUsed?: number;
    dailyLimit?: number;
    dailyRemaining?: number;
    planEffective?: string;
  }) => void;
};

/**
 * Unified LoveQuest AI call: gate → auth → API → update quota on success only.
 */
export async function callCoupleAssistantEndpoint(
  endpoint: CoupleAssistantEndpoint,
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: CoupleAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  const gate = usage.ensureCanCallAi();
  if (!gate.ok) {
    return { ok: false, message: gate.message, code: gate.code };
  }
  const auth = usage.getCoupleAssistantAuth();
  if (!auth) {
    return { ok: false, message: '請先登入後再使用 AI', code: 'AUTH' };
  }
  const result = await postCoupleAssistant(endpoint, prompt, auth);
  if (result.ok) {
    usage.applyQuotaFromResponse(result.data);
  }
  return result;
}

export async function callDateItineraryAssistant(
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: DateItineraryAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  const gate = usage.ensureCanCallAi();
  if (!gate.ok) {
    return { ok: false, message: gate.message, code: gate.code };
  }
  const auth = usage.getCoupleAssistantAuth();
  if (!auth) {
    return { ok: false, message: '請先登入後再使用 AI', code: 'AUTH' };
  }
  const result = await postDateItineraryAssistant(prompt, auth);
  if (result.ok) {
    usage.applyQuotaFromResponse(result.data);
  }
  return result;
}

export async function callImportantDateAssistant(
  prompt: string,
  usage: AiUsageActions
): Promise<
  | { ok: true; data: ImportantDateAssistantSuccess }
  | { ok: false; message: string; code?: string }
> {
  const gate = usage.ensureCanCallAi();
  if (!gate.ok) {
    return { ok: false, message: gate.message, code: gate.code };
  }
  const auth = usage.getCoupleAssistantAuth();
  if (!auth) {
    return { ok: false, message: '請先登入後再使用 AI', code: 'AUTH' };
  }
  const result = await postImportantDateAssistant(prompt, auth);
  if (result.ok) {
    usage.applyQuotaFromResponse(result.data);
  }
  return result;
}
