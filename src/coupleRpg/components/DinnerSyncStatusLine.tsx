import { RefreshCw } from 'lucide-react';
import type { DinnerSyncStatus } from '../services/dinnerSyncService';
import { lq } from '../theme';

const OPTIONS_STATUS_COPY: Record<
  Exclude<DinnerSyncStatus, 'local'>,
  { icon: string; label: string; showRetry?: boolean }
> = {
  editing: { icon: '✏️', label: '正在編輯選項，稍後同步' },
  syncing: { icon: '☁️', label: '晚餐選項同步中...' },
  synced: { icon: '☁️', label: '晚餐選項已同步' },
  error: { icon: '⚠️', label: '同步失敗', showRetry: true },
};

export function DinnerSyncStatusLine({
  status,
  error,
  canSyncOptions,
  onRetry,
}: {
  status: DinnerSyncStatus;
  error: string | null;
  canSyncOptions: boolean;
  onRetry: () => void;
}) {
  if (!canSyncOptions) {
    return (
      <p className={`mb-2.5 px-0.5 text-[11px] font-semibold leading-snug ${lq.textMuted}`}>
        <span aria-hidden>📱</span> 今日結果本機保存 · 動態共享
      </p>
    );
  }

  if (status === 'local') {
    return (
      <div className={`mb-2.5 space-y-0.5 px-0.5 text-[11px] font-semibold leading-snug ${lq.textMuted}`}>
        <p>
          <span aria-hidden>📱</span> 今日結果本機保存 · 動態共享
        </p>
        <p className="font-medium text-stone-400">操作紀錄會顯示在今日動態</p>
      </div>
    );
  }

  const meta = OPTIONS_STATUS_COPY[status];
  const spinning = status === 'syncing';

  return (
    <div className={`mb-2.5 space-y-0.5 px-0.5 text-[11px] font-semibold text-stone-500`}>
      <div className="flex min-h-[28px] flex-wrap items-center gap-x-2 gap-y-1">
        <span className="inline-flex items-center gap-1">
          {spinning ? (
            <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-rose-400" aria-hidden />
          ) : (
            <span aria-hidden>{meta.icon}</span>
          )}
          <span>{status === 'error' && error ? error : meta.label}</span>
        </span>
        {meta.showRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold text-rose-600 underline-offset-2 hover:underline ${lq.accent}`}
          >
            重試
          </button>
        ) : null}
      </div>
      <p className={`font-medium ${lq.textMuted}`}>今日結果本機保存 · 動態共享</p>
    </div>
  );
}
