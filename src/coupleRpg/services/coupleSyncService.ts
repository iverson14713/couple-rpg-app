import type { SupabaseClient } from '@supabase/supabase-js';
import { LQ_KEYS } from '../storage/keys';
import { loadJson } from '../storage/persist';
import type { CoupleSpaceInfo } from './coupleSpaceApi';

export type SyncPhase = 'disabled' | 'not_logged_in' | 'not_bound' | 'ready' | 'building';

export type CoupleSyncStatus = {
  phase: SyncPhase;
  title: string;
  description: string;
  networkLabel: '已連線' | '離線';
  accountLabel: string;
  coupleSpaceLabel: '已綁定' | '未綁定' | '等待另一半' | '讀取中';
  memberCountLabel: string | null;
  supabaseConfigured: boolean;
  coupleId: string | null;
};

export type SyncActionResult = {
  ok: boolean;
  message: string;
};

type SyncStatusInput = {
  isOnline: boolean;
  supabaseConfigured: boolean;
  userId: string | null;
  /** 已登入時顯示的使用者名稱 */
  userDisplayName?: string | null;
  coupleSpaceLoading: boolean;
  space: CoupleSpaceInfo | null;
  isFullyBound: boolean;
};

/** Derive UI copy + phase from auth, network, and couple space (no remote data sync yet). */
export function getSyncStatus(input: SyncStatusInput): CoupleSyncStatus {
  const {
    isOnline,
    supabaseConfigured,
    userId,
    userDisplayName,
    coupleSpaceLoading,
    space,
    isFullyBound,
  } = input;

  const loggedInLabel = userDisplayName?.trim() || '已登入';

  const networkLabel: CoupleSyncStatus['networkLabel'] = isOnline ? '已連線' : '離線';
  const coupleId = space?.coupleId ?? loadJson<string | null>(LQ_KEYS.coupleSpaceId, null);

  if (!supabaseConfigured) {
    return {
      phase: 'disabled',
      title: '雲端同步尚未啟用',
      description: '尚未設定 Supabase，目前僅使用本機資料。',
      networkLabel,
      accountLabel: '未設定',
      coupleSpaceLabel: '未綁定',
      memberCountLabel: null,
      supabaseConfigured: false,
      coupleId,
    };
  }

  if (!userId) {
    return {
      phase: 'not_logged_in',
      title: '雲端同步尚未啟用',
      description: '請先登入帳號，才能使用情侶同步功能。',
      networkLabel,
      accountLabel: '未登入',
      coupleSpaceLabel: '未綁定',
      memberCountLabel: null,
      supabaseConfigured: true,
      coupleId: null,
    };
  }

  if (coupleSpaceLoading) {
    return {
      phase: 'building',
      title: '同步功能建置中',
      description: '正在讀取情侶空間狀態…',
      networkLabel,
      accountLabel: loggedInLabel,
      coupleSpaceLabel: '讀取中',
      memberCountLabel: null,
      supabaseConfigured: true,
      coupleId,
    };
  }

  if (!space) {
    return {
      phase: 'not_bound',
      title: '尚未綁定另一半',
      description: '建立或加入情侶空間後，才能開始同步晚餐、家事與約會資料。',
      networkLabel,
      accountLabel: loggedInLabel,
      coupleSpaceLabel: '未綁定',
      memberCountLabel: null,
      supabaseConfigured: true,
      coupleId: null,
    };
  }

  const memberCountLabel = `${space.memberCount}/2`;

  if (isFullyBound) {
    return {
      phase: 'ready',
      title: '雲端同步準備完成',
      description:
        '你已完成登入與情侶空間綁定。晚餐、家事、約會與任務紀錄將在下一階段逐步同步。',
      networkLabel,
      accountLabel: loggedInLabel,
      coupleSpaceLabel: '已綁定',
      memberCountLabel,
      supabaseConfigured: true,
      coupleId: space.coupleId,
    };
  }

  return {
    phase: 'not_bound',
    title: '尚未綁定另一半',
    description: '建立或加入情侶空間後，才能開始同步晚餐、家事與約會資料。',
    networkLabel,
    accountLabel: loggedInLabel,
    coupleSpaceLabel: '等待另一半',
    memberCountLabel,
    supabaseConfigured: true,
    coupleId: space.coupleId,
  };
}

/** Phase 7.2: first-time upload of localStorage bundle to couple_app_state. */
export async function pushInitialLocalData(
  _supabase: SupabaseClient,
  _coupleId: string
): Promise<SyncActionResult> {
  return {
    ok: false,
    message: '同步功能建置中：首次上傳將於下一階段開放',
  };
}

/** Phase 7.2: pull couple_app_state into local stores. */
export async function pullRemoteData(
  _supabase: SupabaseClient,
  _coupleId: string
): Promise<SyncActionResult> {
  return {
    ok: false,
    message: '同步功能建置中：雲端拉取將於下一階段開放',
  };
}

/** Manual sync entry (debounced background sync later). */
export async function syncNow(
  _supabase: SupabaseClient,
  coupleId: string,
  input: Pick<SyncStatusInput, 'isOnline' | 'supabaseConfigured' | 'userId' | 'coupleSpaceLoading' | 'space' | 'isFullyBound'>
): Promise<SyncActionResult> {
  const status = getSyncStatus(input);
  if (!coupleId || status.phase !== 'ready') {
    return { ok: false, message: '請先完成登入與情侶空間綁定（2/2 成員）' };
  }
  return {
    ok: false,
    message: '同步功能建置中：手動同步將於下一階段開放',
  };
}
