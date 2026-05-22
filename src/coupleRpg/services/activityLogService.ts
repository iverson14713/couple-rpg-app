/**
 * 今日動態 / activity log（MVP：localStorage，預留 Supabase couple_id 同步）
 */
import { makeId } from '../lib/id';
import { todayKey } from '../lib/dates';
import {
  ACTIVITY_LOG_RETENTION_DAYS_FREE,
  ACTIVITY_LOG_RETENTION_DAYS_PRO,
} from '../constants/activityLogRetention';
import { resolveDisplayNameForUserId, type UserDisplayNameContext } from '../lib/coupleDisplayNames';
import type { ActivityLogInput, ActivityLogItem } from '../storage/activityLogTypes';
import { LQ_KEYS } from '../storage/keys';
import { loadJson, saveJson } from '../storage/persist';

const LOG_KEY = LQ_KEYS.activityLog;
const MAX_STORED = 400;
const EVENT = 'lq-activity-log-updated';

let activityLogSyncScheduler: ((reason?: string) => void) | null = null;

/** LoveQuestContext 註冊；新增動態後 debounce 推送到 Supabase */
export function registerActivityLogSyncScheduler(
  fn: ((reason?: string) => void) | null
): void {
  activityLogSyncScheduler = fn;
}

export type ActivityLogActorContext = UserDisplayNameContext;

export function notifyActivityLogUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeActivityLogUpdated(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

export function resolveActorName(
  actorUserId: string | null | undefined,
  ctx: ActivityLogActorContext
): string {
  if (!actorUserId) return '某位成員';
  if (!ctx.currentUserId) return '某位成員';
  return resolveDisplayNameForUserId(actorUserId, ctx);
}

function quoteTitle(title?: string): string {
  const t = title?.trim();
  return t ? `「${t}」` : '';
}

export function formatActivityMessage(item: Pick<
  ActivityLogItem,
  'actorName' | 'actionType' | 'targetType' | 'targetTitle' | 'message'
>): string {
  if (item.message?.trim()) return item.message.trim();

  const who = item.actorName?.trim() || '某位成員';
  const title = quoteTitle(item.targetTitle);

  const key = `${item.actionType}:${item.targetType}`;
  const templates: Record<string, string> = {
    'update:couple_profile': `${who} 修改了情侶資料`,
    'create:important_date': `${who} 新增了重要日子${title}`,
    'update:important_date': `${who} 更新了重要日子${title}`,
    'delete:important_date': `${who} 刪除了重要日子${title}`,
    'redeem:reward_card': `${who} 兌換了${title}`,
    'use:reward_card': `${who} 使用了${title}`,
    'complete:reward_card': `${who} 完成了${title}`,
    'create:chore': `${who} 新增了家事${title}`,
    'update:chore': `${who} 更新了家事${title}`,
    'delete:chore': `${who} 刪除了家事${title}`,
    'complete:chore': `${who} 完成了${title}`,
    'sync:chore': `${who} 建立了今日家事分配`,
    'create:dinner': `${who} 新增了晚餐選項${title}`,
    'update:dinner': `${who} 更新了晚餐選項${title}`,
    'delete:dinner': `${who} 刪除了晚餐選項${title}`,
    'complete:dinner': `${who} 決定今晚吃${title}`,
    'create:date_idea': `${who} 收藏了約會點子${title}`,
    'complete:date_idea': `${who} 完成了約會${title}`,
    'complete:love_task': `${who} 完成了今日戀愛任務`,
    'complete:mini_game': `${who} 完成了一次情侶小遊戲`,
    'upgrade:pro_plan': `${who} 開通了 Pro 體驗`,
  };

  return templates[key] ?? `${who} 進行了一項操作`;
}

export function loadActivityLogs(): ActivityLogItem[] {
  const raw = loadJson<ActivityLogItem[]>(LOG_KEY, []);
  return Array.isArray(raw) ? raw.filter((x) => x?.id && x?.message) : [];
}

export function saveActivityLogs(items: ActivityLogItem[]): void {
  saveJson(LOG_KEY, items.slice(0, MAX_STORED));
}

export function retentionDaysForPlan(isPro: boolean): number {
  return isPro ? ACTIVITY_LOG_RETENTION_DAYS_PRO : ACTIVITY_LOG_RETENTION_DAYS_FREE;
}

export function cleanupOldActivityLogs(isPro = false, refDate = new Date()): ActivityLogItem[] {
  const days = retentionDaysForPlan(isPro);
  const today = todayKey(refDate);
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffKey = todayKey(cutoff);

  const kept = loadActivityLogs().filter((item) => {
    const dk = item.dateKey?.trim();
    if (!dk) return false;
    if (dk === today) return true;
    return dk >= cutoffKey;
  });

  saveActivityLogs(kept);
  return kept;
}

export function addActivityLog(
  input: ActivityLogInput,
  ctx: ActivityLogActorContext,
  options?: { isPro?: boolean }
): ActivityLogItem {
  const isPro = options?.isPro ?? false;
  cleanupOldActivityLogs(isPro);

  const actorUserId = input.actorUserId ?? ctx.currentUserId ?? null;
  const actorName = input.actorName?.trim() || resolveActorName(actorUserId, ctx);
  const createdAt = new Date().toISOString();
  const dateKey = todayKey();

  const draft: ActivityLogItem = {
    id: makeId(),
    coupleId: input.coupleId ?? null,
    actorUserId,
    actorName,
    actionType: input.actionType,
    targetType: input.targetType,
    targetTitle: input.targetTitle?.trim() || undefined,
    message: '',
    createdAt,
    dateKey,
    source: input.source ?? 'local',
  };

  draft.message = formatActivityMessage({
    ...draft,
    message: input.message,
  });

  const next = [draft, ...loadActivityLogs()];
  saveActivityLogs(next);
  notifyActivityLogUpdated();
  if (draft.source === 'local') {
    activityLogSyncScheduler?.('add');
  }
  return draft;
}

export function getTodayActivityLogs(refDate = new Date()): ActivityLogItem[] {
  const today = todayKey(refDate);
  return loadActivityLogs()
    .filter((x) => x.dateKey === today)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function getActivityLogsByDate(dateKey: string): ActivityLogItem[] {
  return loadActivityLogs()
    .filter((x) => x.dateKey === dateKey)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** 最近 N 天（含今天），依日期分組、新到舊 */
export function getRecentActivityLogsByDay(
  dayCount: number,
  refDate = new Date()
): { dateKey: string; items: ActivityLogItem[] }[] {
  const all = loadActivityLogs();
  const keys: string[] = [];
  const d = new Date(refDate);
  for (let i = 0; i < dayCount; i++) {
    keys.push(todayKey(d));
    d.setDate(d.getDate() - 1);
  }
  const keySet = new Set(keys);

  const groups = new Map<string, ActivityLogItem[]>();
  for (const item of all) {
    if (!keySet.has(item.dateKey)) continue;
    const list = groups.get(item.dateKey) ?? [];
    list.push(item);
    groups.set(item.dateKey, list);
  }

  return keys
    .filter((k) => (groups.get(k)?.length ?? 0) > 0)
    .map((dateKey) => ({
      dateKey,
      items: (groups.get(dateKey) ?? []).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      ),
    }));
}
