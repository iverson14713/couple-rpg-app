import { useMemo, useState } from 'react';
import {
  COST_LABEL,
  DATE_FILTER_OPTIONS,
  DURATION_LABEL,
} from '../data/dateIdeasPool';
import { DateItineraryAiSheet } from '../components/DateItineraryAiSheet';
import { RecentDateItineraryAiCard } from '../components/RecentDateItineraryAiCard';
import {
  savedSuggestionToDateSuggestion,
  type SavedDateItineraryAi,
} from '../storage/dateItineraryAiCache';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useAiUsage } from '../hooks/useAiUsage';
import { useProFeature } from '../hooks/useProFeature';
import { AiUsageQuotaLabel } from '../components/AiUsageQuotaLabel';
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
  const [aiSavedRecord, setAiSavedRecord] = useState<SavedDateItineraryAi | null>(null);

  const openAiSheet = (saved?: SavedDateItineraryAi) => {
    setAiSavedRecord(saved ?? null);
    setAiSheetOpen(true);
  };

  const closeAiSheet = () => {
    setAiSheetOpen(false);
    setAiSavedRecord(null);
  };

  const handleGenerate = () => {
    const ok = generateDateIdea();
    setNoMatch(!ok);
    closeAiSheet();
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

      <RecentDateItineraryAiCard onView={(record) => openAiSheet(record)} className="mb-3" />

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

      {aiSheetOpen && (current || aiSavedRecord) ? (
        <DateItineraryAiSheet
          suggestion={
            aiSavedRecord
              ? savedSuggestionToDateSuggestion(aiSavedRecord.suggestion)
              : current!
          }
          savedRecord={aiSavedRecord}
          onClose={closeAiSheet}
        />
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
        <h2 className={`mb-2 ${lq.sectionTitleSm}`}>最近 7 筆約會紀錄</h2>
        {dateHistory.length === 0 ? (
          <p className={`text-[13px] ${lq.textMuted}`}>完成約會後會記錄在這裡</p>
        ) : (
          <ul className="space-y-1.5">
            {dateHistory.map((h) => (
              <li
                key={h.id}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 text-[12px] ${lq.cardSoft}`}
              >
                <span className={`min-w-0 font-semibold ${lq.text}`}>
                  {h.emoji} {h.title}
                </span>
                <span className={`shrink-0 ${lq.textHint}`}>
                  {h.date} {h.time}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className={`mt-2 text-[11px] ${lq.textMuted}`}>完成約會：愛心 +4 · 默契 +3 · EXP +18 · 成就 +1</p>
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
        active ? `${lq.badgeAccent} !text-white !bg-rose-500` : lq.badge
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
  const aiPro = useProFeature('ai_in_app');
  const aiUsage = useAiUsage();
  const tagLabels = suggestion.tags
    .map((k) => DATE_FILTER_OPTIONS.find((o) => o.key === k)?.label)
    .filter(Boolean) as string[];

  return (
    <article className={`mt-4 p-4 ${lq.cardHero}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className={`h-16 w-16 text-[2.5rem] leading-none ${lq.iconChip}`} aria-hidden>
          {suggestion.emoji}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className={`text-[26px] font-extrabold leading-tight tracking-tight ${lq.text}`}>
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
                  className={lq.badgeAccent}
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className={`px-3 py-1.5 text-[13px] font-bold ${lq.badge}`}>
          💰 預算 {COST_LABEL[suggestion.cost]}
        </span>
        <span className={`px-3 py-1.5 text-[13px] font-bold ${lq.badge}`}>
          ⏱ {DURATION_LABEL[suggestion.duration]}
        </span>
      </div>

      <p className={`text-[15px] leading-relaxed ${lq.textSecondary}`}>{suggestion.description}</p>

      <div className={`mt-3 px-3 py-2.5 ${lq.cardSoft}`}>
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
              : lq.btnSecondary
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

      <div className="mt-2.5">
        <div className="mb-1.5 flex justify-end px-0.5">
          <AiUsageQuotaLabel />
        </div>
        <button
          type="button"
          onClick={onOpenAiPlan}
          disabled={!aiUsage.canUseAi}
          className={`flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-violet-100 bg-gradient-to-r from-violet-50/90 to-rose-50/80 text-[14px] font-bold text-violet-900 shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50`}
        >
          <span aria-hidden>✨</span>
          {!aiUsage.isLoggedIn
            ? '登入後使用 AI 規劃'
            : !aiUsage.canUseAi
              ? '今日 AI 次數已用完'
              : 'AI 規劃整天行程'}
          <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" size="sm" />
        </button>
      </div>
    </article>
  );
}
