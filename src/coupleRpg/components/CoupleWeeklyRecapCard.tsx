import { useState } from 'react';
import { useLoveQuest } from '../context/LoveQuestContext';
import { WEEKLY_RECAP_FOOTER, WEEKLY_RECAP_UNLOCK_HINT } from '../lib/coupleWeeklyRecap';
import { lq } from '../theme';

export function CoupleWeeklyRecapCard() {
  const { coupleWeeklyRecapView } = useLoveQuest();
  const [lockHint, setLockHint] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const { unlocked, weekTitle, stats, isEmpty, emptyMessage, weekStartDate } =
    coupleWeeklyRecapView;

  if (unlocked && acknowledged) {
    return (
      <section className={`p-3 ${lq.cardSoft}`} aria-label="本週情侶回顧">
        <p className={`text-[13px] font-bold ${lq.text}`}>
          本週情侶回顧 · {weekTitle}
        </p>
        <p className={`mt-0.5 text-[11px] ${lq.textMuted}`}>
          週一 {weekStartDate.replace(/-/g, '/')} 起算 · 已收起，可重新展開
        </p>
        <button
          type="button"
          onClick={() => setAcknowledged(false)}
          className={`mt-2 text-[12px] font-bold text-rose-600 underline-offset-2`}
        >
          查看詳情
        </button>
      </section>
    );
  }

  return (
    <section className={`p-3.5 ${lq.cardElevated}`} aria-label="本週情侶回顧">
      <p className={lq.label}>本週情侶回顧</p>
      <p className={`mt-0.5 text-[13px] ${lq.textSecondary}`}>
        看看你們這週一起完成了什麼
      </p>

      {!unlocked ? (
        <div className={`mt-2.5 rounded-xl px-3 py-3 ${lq.cardSoft}`}>
          <p className={`text-[14px] font-extrabold ${lq.text}`}>Lv.5 解鎖：情侶回顧卡</p>
          <p className={`mt-1 text-[12px] leading-relaxed ${lq.textSecondary}`}>
            升到傳說情侶後，即可查看每週互動、任務與成長統計。
          </p>
        </div>
      ) : (
        <>
          <p className={`mt-2.5 text-[15px] font-extrabold text-violet-900`}>
            本週稱號：{weekTitle}
          </p>

          {isEmpty ? (
            <p className={`mt-2 text-[13px] leading-relaxed ${lq.textSecondary}`}>{emptyMessage}</p>
          ) : (
            <ul className={`mt-2.5 grid grid-cols-2 gap-2 text-[13px] font-semibold ${lq.text}`}>
              <li className={`rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
                🔥 互動天數
                <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-rose-700">
                  {stats.interactionDays} 天
                </span>
              </li>
              <li className={`rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
                💌 戀愛任務
                <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-rose-700">
                  {stats.loveTaskCount} 個
                </span>
              </li>
              <li className={`rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
                🎲 小遊戲
                <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-rose-700">
                  {stats.miniGameCount} 次
                </span>
              </li>
              <li className={`rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
                🏠 家事合作
                <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-rose-700">
                  {stats.choreCount} 件
                </span>
              </li>
              {stats.weekExp > 0 ? (
                <li className={`col-span-2 rounded-xl px-2.5 py-2 ${lq.cardSoft}`}>
                  ✨ 本週 EXP
                  <span className="mt-0.5 block text-[16px] font-extrabold tabular-nums text-violet-700">
                    {stats.weekExp}
                  </span>
                </li>
              ) : null}
            </ul>
          )}

          <p className={`mt-2.5 text-[12px] leading-relaxed ${lq.textMuted}`}>{WEEKLY_RECAP_FOOTER}</p>
        </>
      )}

      {lockHint && !unlocked ? (
        <p className="mt-2 text-[12px] font-semibold text-amber-800">{WEEKLY_RECAP_UNLOCK_HINT}</p>
      ) : null}

      <div className="mt-3 flex gap-2">
        {unlocked ? (
          <button
            type="button"
            onClick={() => setAcknowledged(true)}
            className={`min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold ${lq.btnPrimary}`}
          >
            知道了
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setLockHint(true)}
            className={`min-h-[44px] w-full rounded-xl py-2.5 text-[13px] font-bold ${lq.btnSecondary}`}
          >
            Lv.5 解鎖
          </button>
        )}
      </div>
    </section>
  );
}
