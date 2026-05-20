import { useEffect, useState } from 'react';
import { Dices, UtensilsCrossed } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { formatDateShort } from '../lib/dates';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, OptionChip, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

export function DinnerPage({ embedded }: { embedded?: boolean } = {}) {
  const lqState = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    void lqState.pullDinnerFromCloud();
  }, [lqState.pullDinnerFromCloud]);

  const displayResult = lqState.draftPick ?? lqState.todayDinner?.label ?? null;

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="🍽️" title="晚餐決定器" subtitle="新增選項、隨機抽籤，再也不吵架" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <div className="mb-3 flex justify-end">
        <button
          type="button"
          disabled={syncBusy}
          onClick={() => {
            setSyncBusy(true);
            void lqState.syncDinnerFoodOptions().finally(() => setSyncBusy(false));
          }}
          className="rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm active:scale-[0.98] disabled:opacity-50"
        >
          {syncBusy ? '同步中…' : '同步晚餐資料'}
        </button>
      </div>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">今晚吃什麼？</h2>
        <div
          className={`mb-3 flex min-h-[88px] flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center ${
            displayResult ? 'border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50/80' : 'border-rose-100 bg-rose-50/40'
          }`}
        >
          {displayResult ? (
            <>
              <UtensilsCrossed className="mb-1 h-6 w-6 text-rose-400" aria-hidden />
              <p className="text-xl font-extrabold text-rose-700">{displayResult}</p>
              {lqState.todayDinner && !lqState.draftPick ? (
                <p className="mt-1 text-[11px] text-stone-500">已儲存今日結果</p>
              ) : lqState.draftPick ? (
                <p className="mt-1 text-[11px] text-stone-500">抽籤結果 · 記得儲存</p>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-stone-500">按下隨機抽籤開始</p>
          )}
        </div>

        <PrimaryButton onClick={lqState.rollDinner} className="flex items-center justify-center gap-2">
          <Dices className="h-4 w-4" aria-hidden />
          隨機抽籤
        </PrimaryButton>
        <PrimaryButton
          variant="secondary"
          disabled={!displayResult}
          onClick={() => lqState.saveDinnerResult()}
          className="mt-2"
        >
          儲存今日結果
        </PrimaryButton>
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">晚餐選項</h2>
        <InlineInput
          value={newLabel}
          onChange={setNewLabel}
          placeholder="例如：麻辣鍋、披薩…"
          onSubmit={() => {
            lqState.addDinnerOption(newLabel);
            setNewLabel('');
          }}
        />
        <ChipRow>
          {lqState.dinner.options.map((o) => (
            <OptionChip key={o.id} label={o.label} onRemove={() => lqState.removeDinnerOption(o.id)} />
          ))}
        </ChipRow>
        {lqState.dinner.options.length === 0 ? (
          <p className="mt-2 text-[12px] text-stone-500">至少新增一個選項才能抽籤</p>
        ) : null}
      </section>

      <section className={`p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">最近 7 天晚餐</h2>
        {lqState.dinnerHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">尚無紀錄，儲存今日結果後會出現在這裡</p>
        ) : (
          <ul className="space-y-1.5">
            {lqState.dinnerHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-rose-50/50 px-3 py-2 text-[13px]"
              >
                <span className="font-semibold text-stone-800">{h.label}</span>
                <span className="text-stone-400">{formatDateShort(h.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
