import {
  isDevModeFeatureEnabled,
  readDevXiaoiStateOverride,
  setDevXiaoiStateOverride,
} from '../lib/devModeOverride';
import type { XiaoiState } from '../lib/xiaoiState';
import { useDevModeRevision } from '../hooks/useDevModeRevision';

const XIAOI_STATE_OPTIONS: { state: XiaoiState; label: string }[] = [
  { state: 'happy', label: '開心' },
  { state: 'sad', label: '難過' },
  { state: 'sleepy', label: '睡覺' },
  { state: 'back_angry', label: '背對' },
];

/** 開發模式：首頁 Hero 下方小愛狀態切換（僅 UI 預覽） */
export function XiaoiStateDevSwitcher() {
  const devRevision = useDevModeRevision();

  if (!isDevModeFeatureEnabled()) return null;

  const active = readDevXiaoiStateOverride();
  void devRevision;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-dashed border-rose-200/70 bg-stone-900/88 px-2.5 py-2"
      aria-label="小愛狀態測試（開發模式）"
    >
      <span className="text-[10px] font-bold text-white/90">DEV 小愛</span>
      <button
        type="button"
        onClick={() => setDevXiaoiStateOverride(null)}
        className={`rounded-md px-2 py-0.5 text-[10px] font-bold active:scale-95 ${
          active == null ? 'bg-white text-rose-700' : 'bg-white/15 text-white/85'
        }`}
      >
        自動
      </button>
      {XIAOI_STATE_OPTIONS.map(({ state, label }) => (
        <button
          key={state}
          type="button"
          onClick={() => setDevXiaoiStateOverride(state)}
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold active:scale-95 ${
            active === state ? 'bg-white text-rose-700' : 'bg-white/15 text-white/85'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
