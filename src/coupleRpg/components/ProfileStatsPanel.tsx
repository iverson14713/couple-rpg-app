import { useLoveQuest } from '../context/LoveQuestContext';
import { CoupleBindSection } from './CoupleBindSection';
import { NicknameSetupBanner } from './NicknameSetupBanner';
import { RpgMiniStats } from './RpgMiniStats';
import { UpgradeCard } from './UpgradeCard';
import { PlanStatusPill } from './ProBadge';
import { useUserPlan } from '../context/UserPlanContext';
import { lq } from '../theme';

/** `hideAccountChrome` — 僅用於截圖預覽，正式 App 請勿傳入 */
export function ProfileStatsPanel({ hideAccountChrome }: { hideAccountChrome?: boolean } = {}) {
  const { couple, rpg, rpgView, weeklyTitles, todayCoinEarned, activity } = useLoveQuest();
  const { isPro } = useUserPlan();

  return (
    <>
      {!hideAccountChrome ? <UpgradeCard compact className="mb-3" /> : null}
      {!hideAccountChrome ? <NicknameSetupBanner /> : null}
      <section className={`mb-3 overflow-hidden p-4 ${lq.card}`}>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-xl ring-2 ring-white">
              {couple.emojiA}
            </span>
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-xl ring-2 ring-white">
              {couple.emojiB}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900">
              💑 {couple.nameA} & {couple.nameB}
            </p>
            <p className="text-[12px] text-rose-600">
              Lv.{rpgView.level} {rpgView.title}
            </p>
            <PlanStatusPill isPro={isPro} />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-stone-400">愛心幣</p>
            <p className="text-lg font-extrabold text-amber-700">{rpg.loveCoins}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] text-stone-500">
            <span>EXP（本等級）</span>
            <span>
              {rpgView.levelSegmentXp}/{rpgView.xpNext}
            </span>
          </div>
          <div className={`h-2 overflow-hidden rounded-full ${lq.progressTrack}`}>
            <div className={`h-full rounded-full ${lq.progress} transition-all`} style={{ width: `${rpgView.xpPct}%` }} />
          </div>
        </div>
      </section>

      {!hideAccountChrome ? <CoupleBindSection /> : null}

      <RpgMiniStats compact />

      <section className="mb-3 grid grid-cols-2 gap-2">
        <Stat emoji="💖" label="愛心值" value={`${rpgView.heartPoints}`} sub={`/ ${rpgView.heartMax}`} />
        <Stat emoji="🤝" label="默契度" value={`${rpgView.compatibility}%`} />
        <Stat emoji="🏠" label="家事積分" value={String(rpgView.houseworkPoints)} />
        <Stat emoji="🪙" label="今日愛心幣" value={`+${todayCoinEarned}`} />
        <Stat emoji="💑" label="約會成就" value={String(rpgView.dateAchievements)} sub="次" />
        <Stat emoji="🔥" label="連續登入" value={`${rpgView.loginStreak} 天`} />
      </section>

      <section className={`mb-3 p-3 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">本週稱號</h2>
        <ul className="space-y-1.5 text-[12px]">
          <li className="rounded-xl bg-amber-50/80 px-2.5 py-2 text-stone-700">
            👑 家事王：
            {weeklyTitles.houseworkKing
              ? ` ${weeklyTitles.houseworkKing.emoji} ${weeklyTitles.houseworkKing.name}`
              : ' 本週加油'}
          </li>
          <li className="rounded-xl bg-pink-50/80 px-2.5 py-2 text-stone-700">💗 {weeklyTitles.sweetheart}</li>
        </ul>
      </section>

      <section className={`p-3 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">最近動態</h2>
        {activity.length === 0 ? (
          <p className="text-[12px] text-stone-500">完成生活或互動任務後會出現在這裡</p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {activity.slice(0, 10).map((a) => (
              <li key={a.id} className="text-[11px] text-stone-600">
                <span className="text-stone-400">{a.date}</span> · {a.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-2 text-center text-[10px] text-stone-400">
        等級與獎勵會隨家事、任務、約會自動成長 · 無需獨立 RPG 頁
      </p>
    </>
  );
}

function Stat({
  emoji,
  label,
  value,
  sub,
}: {
  emoji: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-xl p-2.5 ${lq.cardSoft}`}>
      <span className="text-lg">{emoji}</span>
      <p className="text-[10px] font-bold text-stone-500">{label}</p>
      <p className={`text-base font-extrabold ${lq.accent}`}>{value}</p>
      {sub ? <p className="text-[9px] text-stone-400">{sub}</p> : null}
    </div>
  );
}
