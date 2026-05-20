import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { ChipRow, InlineInput, PageHero, PrimaryButton } from '../components/ui';
import { lq } from '../theme';

export function HouseworkPage({ embedded }: { embedded?: boolean } = {}) {
  const game = useLoveQuest();
  const [newLabel, setNewLabel] = useState('');
  const pending = game.housework.pendingSpin;

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="🏠" title="家事轉盤" subtitle="公平隨機分配，完成可獲得積分與愛心值" />
          <RpgMiniStats compact />
        </>
      ) : null}

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">轉盤結果</h2>
        <SpinArea spinning={game.spinning} pending={pending} game={game} />

        <PrimaryButton
          onClick={game.rollHousework}
          disabled={game.housework.items.length === 0 || game.spinning}
          className="mt-3 flex items-center justify-center gap-2"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {game.spinning ? '轉盤中…' : '開始轉盤'}
        </PrimaryButton>

        {pending && !game.spinning ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PrimaryButton onClick={game.completeHouseworkSpin}>完成家事 ✓</PrimaryButton>
            <PrimaryButton variant="ghost" onClick={game.clearHouseworkSpin}>
              重轉
            </PrimaryButton>
          </div>
        ) : null}

        <p className="mt-2 text-center text-[11px] text-stone-500">
          完成 +10 家事分 · 愛心 +3 · 默契 +2 · EXP +20
        </p>
      </section>

      <section className={`mb-3 p-4 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">家事項目</h2>
        <InlineInput
          value={newLabel}
          onChange={setNewLabel}
          placeholder="新增家事…"
          onSubmit={() => {
            game.addHouseworkItem(newLabel);
            setNewLabel('');
          }}
        />
        <ChipRow>
          {game.housework.items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-stone-800 ring-1 ring-rose-100"
            >
              <span>{item.emoji}</span>
              {item.label}
              <button
                type="button"
                onClick={() => game.removeHouseworkItem(item.id)}
                className="text-stone-400 hover:text-rose-600"
                aria-label={`刪除 ${item.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </ChipRow>
      </section>

      <WeeklyStatsSection />
    </>
  );
}

function SpinArea({
  spinning,
  pending,
  game,
}: {
  spinning: boolean;
  pending: ReturnType<typeof useLoveQuest>['housework']['pendingSpin'];
  game: ReturnType<typeof useLoveQuest>;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl p-5 text-center transition ${
        spinning ? 'animate-pulse bg-rose-100' : 'bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50'
      }`}
    >
      {pending && !spinning ? (
        <>
          <p className="text-4xl">{pending.emoji}</p>
          <p className="mt-2 text-lg font-extrabold text-stone-900">{pending.taskLabel}</p>
          <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-rose-700 shadow-sm ring-1 ring-rose-100">
            → {game.partnerEmoji(pending.partner)} {game.partnerName(pending.partner)}
          </p>
        </>
      ) : (
        <p className="py-6 text-sm text-stone-500">{spinning ? '轉盤轉呀轉…' : '按下開始轉盤'}</p>
      )}
    </div>
  );
}

function WeeklyStatsSection() {
  const { weeklyStats, couple } = useLoveQuest();

  return (
    <section className={`p-4 ${lq.card}`}>
      <h2 className="mb-1 text-sm font-bold text-stone-900">本週家事統計</h2>
      <p className="mb-3 text-[11px] text-stone-500">{weeklyStats.weekKey}</p>

      <div className="grid grid-cols-3 gap-2">
        <StatBox label="本週完成" value={String(weeklyStats.total)} />
        <StatBox label={`${couple.emojiA} ${couple.nameA}`} value={String(weeklyStats.byPartner.A)} />
        <StatBox label={`${couple.emojiB} ${couple.nameB}`} value={String(weeklyStats.byPartner.B)} />
      </div>

      {weeklyStats.byTask.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {weeklyStats.byTask.map((t) => (
            <li
              key={`${t.label}-${t.emoji}`}
              className="flex items-center justify-between rounded-lg bg-rose-50/50 px-2.5 py-1.5 text-[12px]"
            >
              <span>
                {t.emoji} {t.label}
              </span>
              <span className="font-bold text-rose-600">{t.count} 次</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-stone-500">本週尚無完成紀錄</p>
      )}
    </section>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className={`rounded-xl p-3 text-center ${lq.cardSoft}`}>
      <p className="truncate text-[10px] font-bold text-stone-500">{label}</p>
      <p className={`text-xl font-extrabold ${lq.accent}`}>{value}</p>
    </div>
  );
}
