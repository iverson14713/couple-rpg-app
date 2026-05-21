import { RefreshCw } from 'lucide-react';
import type { ChoreSyncStatus } from '../services/choreSyncService';
import { lq } from '../theme';

const STATUS_COPY: Record<
  ChoreSyncStatus,
  { icon: string; label: string; showRetry?: boolean }
> = {
  local: { icon: '📱', label: '本機保存，登入並綁定後自動同步' },
  editing: { icon: '✏️', label: '正在編輯，稍後同步' },
  syncing: { icon: '☁️', label: '同步中...' },
  synced: { icon: '☁️', label: '已同步' },
  error: { icon: '⚠️', label: '同步失敗', showRetry: true },
};

export function ChoreSyncStatusLine({
  status,
  error,
  onRetry,
}: {
  status: ChoreSyncStatus;
  error: string | null;
  onRetry: () => void;
}) {
  const meta = STATUS_COPY[status];
  const spinning = status === 'syncing';

  return (
    <div className="mb-2.5 flex min-h-[28px] flex-wrap items-center gap-x-2 gap-y-1 px-0.5 text-[11px] font-semibold text-stone-500">
      <span className="inline-flex items-center gap-1">
        {spinning ? (
          <RefreshCw className="h-3 w-3 shrink-0 animate-spin text-rose-400" aria-hidden />
        ) : (
          <span aria-hidden>{meta.icon}</span>
        )}
        <span>
          {status === 'error' && error ? error : meta.label}
        </span>
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
  );
}
