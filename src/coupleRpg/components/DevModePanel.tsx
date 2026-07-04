import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLoveQuest } from '../context/LoveQuestContext';
import { useUserPlan } from '../context/UserPlanContext';
import { useDevMode } from '../context/DevModeContext';
import { GameDesignSystemPreview } from '../games/shared/GameDesignSystemPreview';
import {
  clearAllDevOverrides,
  getDevModeDebugInfo,
  readDevOverrides,
  setDevOverride,
} from '../lib/devModeOverride';

const STREAK_SHORTCUTS = [0, 1, 7, 10, 15, 30] as const;

type NumericFieldProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
};

function NumericDevField({ label, value, onChange }: NumericFieldProps) {
  const bump = (delta: number) => onChange(Math.max(0, value + delta));

  return (
    <div className="rounded-2xl border border-rose-100/70 bg-white/80 px-3 py-2.5">
      <p className="text-[12px] font-bold text-[#7a6a74]">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => bump(-10)}
          className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600 active:scale-95"
        >
          -10
        </button>
        <button
          type="button"
          onClick={() => bump(-1)}
          className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600 active:scale-95"
        >
          -1
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            onChange(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
          }}
          className="min-w-0 flex-1 rounded-lg border border-rose-100 bg-white px-2 py-1.5 text-center text-[15px] font-extrabold text-[#3a2e34] focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="button"
          onClick={() => bump(1)}
          className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 active:scale-95"
        >
          +1
        </button>
        <button
          type="button"
          onClick={() => bump(10)}
          className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 active:scale-95"
        >
          +10
        </button>
      </div>
    </div>
  );
}

function StreakDevField({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const bump = (delta: number) => onChange(Math.max(0, value + delta));
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => bump(-10)} className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600 active:scale-95">-10</button>
      <button type="button" onClick={() => bump(-1)} className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600 active:scale-95">-1</button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
        }}
        className="min-w-0 flex-1 rounded-lg border border-rose-100 bg-white px-2 py-1.5 text-center text-[15px] font-extrabold text-[#3a2e34] focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-100"
      />
      <button type="button" onClick={() => bump(1)} className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 active:scale-95">+1</button>
      <button type="button" onClick={() => bump(10)} className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700 active:scale-95">+10</button>
    </div>
  );
}

export function DevModePanel() {
  const { panelOpen, closePanel } = useDevMode();
  const { rpgView, coupleExpView, loveFlameView } = useLoveQuest();
  const { isPro } = useUserPlan();

  const [level, setLevel] = useState(1);
  const [exp, setExp] = useState(0);
  const [loveCoins, setLoveCoins] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [proOn, setProOn] = useState(false);
  const [gameDsPreview, setGameDsPreview] = useState(false);

  const syncFromApp = useCallback(() => {
    const overrides = readDevOverrides();
    setLevel(overrides.level ?? coupleExpView.level);
    setExp(overrides.exp ?? coupleExpView.totalExp);
    setLoveCoins(overrides.loveCoins ?? rpgView.loveCoins);
    setStreakDays(overrides.streakDays ?? loveFlameView.currentStreak);
    setProOn(overrides.isPro ?? isPro);
  }, [coupleExpView, rpgView.loveCoins, loveFlameView.currentStreak, isPro]);

  useEffect(() => {
    if (panelOpen) syncFromApp();
  }, [panelOpen, syncFromApp]);

  const applyLevel = (v: number) => {
    setLevel(v);
    setDevOverride('level', v);
  };

  const applyExp = (v: number) => {
    setExp(v);
    setDevOverride('exp', v);
  };

  const applyCoins = (v: number) => {
    setLoveCoins(v);
    setDevOverride('loveCoins', v);
  };

  const applyStreak = (v: number) => {
    setStreakDays(v);
    setDevOverride('streakDays', v);
  };

  const applyPro = (on: boolean) => {
    setProOn(on);
    setDevOverride('isPro', on);
  };

  const handleClear = () => {
    clearAllDevOverrides();
    closePanel();
  };

  if (!panelOpen) return null;

  const devInfo = getDevModeDebugInfo();

  const sheet = (
    <>
      {gameDsPreview ? <GameDesignSystemPreview onClose={() => setGameDsPreview(false)} /> : null}
    <div className="fixed inset-0 z-[145] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-[#3d3539]/30 backdrop-blur-[3px]"
        aria-label="關閉"
        onClick={closePanel}
      />
      <div
        className="relative z-10 flex max-h-[min(88dvh,100%)] w-full flex-col overflow-hidden rounded-t-[22px] border border-rose-100/60 bg-gradient-to-b from-[#fffafb] to-[#fff5f8] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dev-mode-panel-title"
      >
        <div className="shrink-0 border-b border-rose-100/60 px-4 pb-3 pt-3 text-center">
          <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-rose-200/70" aria-hidden />
          <p id="dev-mode-panel-title" className="text-[18px] font-extrabold text-[#3d3539]">
            開發模式
          </p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#b07a8f]">僅供測試使用</p>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
          <NumericDevField label="等級 Level" value={level} onChange={applyLevel} />
          <NumericDevField label="EXP / 總經驗值" value={exp} onChange={applyExp} />
          <NumericDevField label="LoveCoin" value={loveCoins} onChange={applyCoins} />

          <div className="rounded-2xl border border-rose-100/70 bg-white/80 px-3 py-2.5">
            <p className="mb-2 text-[12px] font-bold text-[#7a6a74]">火苗連續天數 Streak</p>
            <StreakDevField value={streakDays} onChange={applyStreak} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {STREAK_SHORTCUTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => applyStreak(d)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold active:scale-95 ${
                    streakDays === d
                      ? 'bg-rose-500 text-white'
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                  }`}
                >
                  {d} 天
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-rose-100/70 bg-white/80 px-3 py-3">
            <div>
              <p className="text-[13px] font-extrabold text-[#3d3539]">Pro 狀態</p>
              <p className="text-[11px] font-semibold text-[#b07a8f]">本機覆蓋，不經 IAP</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={proOn}
              onClick={() => applyPro(!proOn)}
              className={`relative h-7 w-12 rounded-full transition ${
                proOn ? 'bg-rose-400' : 'bg-stone-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  proOn ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setGameDsPreview(true)}
            className="w-full rounded-2xl border border-violet-200/70 bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-3 text-left active:scale-[0.99]"
          >
            <p className="text-[13px] font-extrabold text-[#3d3539]">Game Design System v0.1</p>
            <p className="mt-0.5 text-[11px] font-semibold text-[#b07a8f]">
              預覽 GameStage、HUD、小愛泡泡
            </p>
          </button>
        </div>

        <div className="shrink-0 space-y-2 border-t border-rose-100/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="rounded-xl bg-stone-50/90 px-3 py-2 text-center ring-1 ring-stone-200/60">
            <p className="text-[11px] font-semibold text-stone-600">
              Dev Mode Enabled: {devInfo.enabled ? 'true' : 'false'}
            </p>
            <p className="mt-0.5 text-[10px] font-medium text-stone-400">
              Source: {devInfo.source ?? '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="w-full rounded-xl border border-rose-200/60 bg-white py-2.5 text-[14px] font-bold text-rose-700 active:scale-[0.99]"
          >
            清除開發覆蓋
          </button>
          <button
            type="button"
            onClick={closePanel}
            className="w-full rounded-xl py-2 text-[13px] font-semibold text-[#b07a8f] active:scale-[0.99]"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
    </>
  );

  if (typeof document === 'undefined') return sheet;
  return createPortal(sheet, document.body);
}
