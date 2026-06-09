import { dateKeyFromIso, todayKey } from '../lib/dates';
import { loadJson, saveJson } from './persist';
import { LQ_KEYS } from './keys';
import type { CompanionshipEvent, CompanionshipStats } from './companionshipTypes';

const UPDATED_EVENT = 'lq-companionship-updated';

let scheduleSync: ((reason?: string) => void) | null = null;

export function registerCompanionshipSyncScheduler(fn: ((reason?: string) => void) | null): void {
  scheduleSync = fn;
}

export function subscribeCompanionshipUpdated(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(UPDATED_EVENT, handler);
  return () => window.removeEventListener(UPDATED_EVENT, handler);
}

export function notifyCompanionshipUpdated(): void {
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

export function loadCompanionshipEvents(): CompanionshipEvent[] {
  return loadJson<CompanionshipEvent[]>(LQ_KEYS.companionshipEvents, []);
}

export function saveCompanionshipEvents(events: CompanionshipEvent[]): void {
  saveJson(LQ_KEYS.companionshipEvents, events);
  notifyCompanionshipUpdated();
}

export function mergeCompanionshipEvents(
  local: CompanionshipEvent[],
  remote: CompanionshipEvent[]
): CompanionshipEvent[] {
  const byId = new Map<string, CompanionshipEvent>();
  for (const item of [...local, ...remote]) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    if (!existing) {
      byId.set(item.id, item);
      continue;
    }
    const existingSeen = existing.seenAt ? Date.parse(existing.seenAt) : 0;
    const itemSeen = item.seenAt ? Date.parse(item.seenAt) : 0;
    const newer =
      Date.parse(item.createdAt) >= Date.parse(existing.createdAt)
        ? item
        : existing;
    byId.set(item.id, {
      ...newer,
      seenAt: itemSeen > existingSeen ? item.seenAt : existing.seenAt,
      seenPending: existing.seenPending || item.seenPending,
    });
  }
  return [...byId.values()].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function appendCompanionshipEvent(event: CompanionshipEvent): boolean {
  const merged = mergeCompanionshipEvents(loadCompanionshipEvents(), [event]);
  saveCompanionshipEvents(merged);
  const saved = loadCompanionshipEvents().some((e) => e.id === event.id);
  if (saved) scheduleSync?.('append');
  return saved;
}

export function removeCompanionshipEventById(eventId: string): void {
  const next = loadCompanionshipEvents().filter((e) => e.id !== eventId);
  saveCompanionshipEvents(next);
}

export function markCompanionshipSeenLocal(eventId: string, seenAt: string): void {
  const next = loadCompanionshipEvents().map((e) =>
    e.id === eventId ? { ...e, seenAt, seenPending: true } : e
  );
  saveCompanionshipEvents(next);
  scheduleSync?.('seen');
}

export function computeCompanionshipStats(
  events: CompanionshipEvent[],
  refDate = new Date()
): CompanionshipStats {
  const today = todayKey(refDate);
  const todayCount = events.filter((e) => dateKeyFromIso(e.createdAt) === today).length;

  const daySet = new Set(events.map((e) => dateKeyFromIso(e.createdAt)));
  let streakDays = 0;
  const cursor = new Date(refDate);
  while (daySet.has(todayKey(cursor))) {
    streakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { todayCount, streakDays };
}

export function getLatestUnseenForReceiver(
  events: CompanionshipEvent[],
  receiverUserId: string | null
): CompanionshipEvent | null {
  if (!receiverUserId) return null;
  return (
    events.find(
      (e) => e.receiverUserId === receiverUserId && !e.seenAt && e.senderUserId !== receiverUserId
    ) ?? null
  );
}

export function newCompanionshipLocalId(): string {
  return `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
