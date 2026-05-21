import { useMemo, useState } from 'react';
import {
  COST_LABEL,
  DATE_FILTER_OPTIONS,
  DURATION_LABEL,
} from '../data/dateIdeasPool';
import { DateItineraryAiSheet } from '../components/DateItineraryAiSheet';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { PageHero, PrimaryButton } from '../components/ui';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { DateSuggestion } from '../storage/dateTypes';
import { lq } from '../theme';

export function DatesPage({ embedded }: { embedded?: boolean } = {}) {
  const {
    rpg,
    datePlanner,
    dateHistory,
    favoriteIdeas,
    setDateFilter,
    clearDateFilters,
    generateDateIdea,
    toggleDateFavorite,
    completeCurrentDate,
  } = useLoveQuest();

  const current = datePlanner.current;
  const activeCount = useMemo(
    () => DATE_FILTER_OPTIONS.filter((o) => datePlanner.filters[o.key]).length,
    [datePlanner.filters]
  );

  const favSet = useMemo(() => new Set(datePlanner.favoriteIds), [datePlanner.favoriteIds]);
  const [noMatch, setNoMatch] = useState(false);
  const [aiSheetOpen, setAiSheetOpen] = useState(false);

  const handleGenerate = () => {
    const ok = generateDateIdea();
    setNoMatch(!ok);
    setAiSheetOpen(false);
  };

  return (
    <>
      {!embedded ? (
        <>
          <PageHero emoji="💑" title="約會去哪" subtitle="篩選條件 · 隨機提案 · 收藏點子" />
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <RpgMiniStats compact />
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-bold text-pink-800 ring-1 ring-pink-100">
              🏆 約會成就 {rpg.dateAchievements}
            </span>
          </div>
        </>
      ) : null}

      <section className={`mb-3 p-3 ${lq.card}`}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-stone-900">
            <span aria-hidden>🎯</span> 篩選條件
          </h2>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={clearDateFilters}
              className="text-[11px] font-semibold text-rose-500 underline-offset-2 hover:underline"
            >
              清除
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DATE_FILTER_OPTIONS.map((opt) => {
            const on = datePlanner.filters[opt.key];
            return (
              <FilterChip
                key={opt.key}
                label={opt.label}
                emoji={opt.emoji}
                active={on}
                onClick={() => setDateFilter(opt.key, !on)}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-stone-500">
          {activeCount === 0 ? '未選條件時從全部點子中隨機' : `已選 ${activeCount} 項 · 需同時符合`}
        </p>
      </section>

      <section className={`mb-3 p-3 ${lq.card}`}>
        <PrimaryButton onClick={handleGenerate}>🎲 隨機產生約會建議</PrimaryButton>
        {noMatch ? (
          <p className="mt-2 text-center text-[12px] font-medium text-amber-700">
            沒有符合全部條件的點子，試著減少篩選～
          </p>
        ) : null}
        {current ? (
          <SuggestionCard
            suggestion={current}
            isFavorite={favSet.has(current.id)}
            onToggleFavorite={() => toggleDateFavorite(current.id)}
            onComplete={completeCurrentDate}
            onOpenAiPlan={() => setAiSheetOpen(true)}
          />
        ) : (
          <p className="mt-3 text-center text-[13px] text-stone-500">點上方按鈕，一起決定今天去哪～</p>
        )}
      </section>

      {aiSheetOpen && current ? (
        <DateItineraryAiSheet suggestion={current} onClose={() => setAiSheetOpen(false)} />
      ) : null}

      {favoriteIdeas.length > 0 ? (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <h2 className="mb-2 text-sm font-bold text-stone-900">⭐ 收藏點子</h2>
          <ul className="space-y-1.5">
            {favoriteIdeas.map((idea) => (
              <li
                key={idea.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-rose-50 bg-rose-50/30 px-2.5 py-2 text-[12px]"
              >
                <span className="min-w-0 truncate font-semibold text-stone-800">
                  {idea.emoji} {idea.title}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDateFavorite(idea.id)}
                  className="shrink-0 text-[11px] font-bold text-rose-500"
                >
                  取消
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={`p-3 ${lq.card}`}>
        <h2 className="mb-2 text-sm font-bold text-stone-900">最近 7 筆約會紀錄</h2>
        {dateHistory.length === 0 ? (
          <p className="text-[13px] text-stone-500">完成約會後會記錄在這裡</p>
        ) : (
          <ul className="space-y-1.5">
            {dateHistory.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-rose-50 bg-white/80 px-2.5 py-2 text-[12px]"
              >
                <span className="min-w-0 font-semibold text-stone-800">
                  {h.emoji} {h.title}
                </span>
                <span className="shrink-0 text-stone-400">
                  {h.date} {h.time}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-stone-500">完成約會：愛心 +4 · 默契 +3 · EXP +18 · 成就 +1</p>
      </section>
    </>
  );
}

function FilterChip({
  label,
  emoji,
  active,
  onClick,
}: {
  label: string;
  emoji: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-bold transition active:scale-95 ${
        active
          ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-200'
          : 'bg-white text-stone-600 ring-1 ring-rose-100'
      }`}
    >
      <span>{emoji}</span>
      {label}
    </button>
  );
}

function SuggestionCard({
  suggestion,
  isFavorite,
  onToggleFavorite,
  onComplete,
  onOpenAiPlan,
}: {
  suggestion: DateSuggestion;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onComplete: () => void;
  onOpenAiPlan: () => void;
}) {
  const tagLabels = suggestion.tags
    .map((k) => DATE_FILTER_OPTIONS.find((o) => o.key === k)?.label)
    .filter(Boolean) as string[];

  return (
    <article className="mt-4 rounded-2xl border-2 border-rose-100/90 bg-gradient-to-br from-rose-50/95 via-white to-pink-50/60 p-4 shadow-[0_12px_36px_-14px_rgba(244,63,94,0.22)]">
      <div className="mb-3 flex items-start gap-3">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[2.5rem] leading-none shadow-inner ring-1 ring-rose-100"
          aria-hidden
        >
          {suggestion.emoji}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[26px] font-extrabold leading-tight tracking-tight text-stone-900">
              {suggestion.title}
            </h3>
            {suggestion.completed ? (
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-bold text-emerald-700">
                已完成
              </span>
            ) : null}
          </div>

          {tagLabels.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {tagLabels.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white px-2.5 py-1 text-[13px] font-bold text-rose-700 ring-1 ring-rose-100"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-xl bg-white/90 px-3 py-1.5 text-[13px] font-bold text-stone-700 ring-1 ring-stone-100">
          💰 預算 {COST_LABEL[suggestion.cost]}
        </span>
        <span className="rounded-xl bg-white/90 px-3 py-1.5 text-[13px] font-bold text-stone-700 ring-1 ring-stone-100">
          ⏱ {DURATION_LABEL[suggestion.duration]}
        </span>
      </div>

      <p className="text-[15px] leading-relaxed text-stone-700">{suggestion.description}</p>

      <div className="mt-3 rounded-xl bg-rose-50/90 px-3 py-2.5 ring-1 ring-rose-100/80">
        <p className="text-[14px] font-extrabold leading-snug text-rose-800">
          <span className="text-rose-500">適合：</span>
          {suggestion.scenario}
        </p>
      </div>

      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          onClick={onToggleFavorite}
          className={`flex min-h-[48px] flex-1 items-center justify-center rounded-xl text-[14px] font-bold ring-1 transition active:scale-[0.98] ${
            isFavorite
              ? 'bg-amber-50 text-amber-800 ring-amber-200'
              : 'bg-white text-stone-700 ring-rose-100'
          }`}
        >
          {isFavorite ? '★ 已收藏' : '☆ 收藏'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={suggestion.completed}
          className={`flex min-h-[48px] flex-1 items-center justify-center rounded-xl text-[14px] font-bold transition active:scale-[0.98] disabled:opacity-50 ${
            suggestion.completed ? 'bg-stone-100 text-stone-400' : lq.btnPrimary
          }`}
        >
          {suggestion.completed ? '已打卡' : '✓ 完成約會'}
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenAiPlan}
        className={`mt-2.5 flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-violet-100 bg-gradient-to-r from-violet-50/90 to-rose-50/80 text-[14px] font-bold text-violet-900 shadow-sm active:scale-[0.98]`}
      >
        <span aria-hidden>✨</span>
        AI 規劃整天行程
      </button>
    </article>
  );
}
