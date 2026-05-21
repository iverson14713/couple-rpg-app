import { useMemo, useState, type ReactNode } from 'react';
import { ANNIVERSARY_TYPE_OPTIONS, typeMeta } from '../data/anniversaryMeta';
import { RpgMiniStats } from '../components/RpgMiniStats';
import { PageHero, PrimaryButton } from '../components/ui';
import { ProBadgeIfNeeded } from '../components/ProBadge';
import { useProFeature } from '../hooks/useProFeature';
import { useLoveQuest } from '../context/LoveQuestContext';
import type { AnniversaryEventType } from '../storage/anniversaryTypes';
import { lq } from '../theme';

export function AnniversariesPage({ embedded }: { embedded?: boolean } = {}) {
  const {
    rpg,
    anniversaries,
    upcomingAnniversaries,
    nextAnniversary,
    addAnniversary,
    updateAnniversary,
    removeAnniversary,
    generateAnniversaryPlan,
    completeAnniversaryPlan,
    markAnniversaryCelebrated,
    updateGiftPrefs,
    generateGiftSuggestions,
  } = useLoveQuest();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  const editing = editingId ? anniversaries.events.find((e) => e.id === editingId) : null;

  return (
    <>
      {!embedded ? <PageHero emoji="🎀" title="紀念日" subtitle="節日提醒 · AI 計畫 · 禮物靈感" /> : null}
      {!embedded ? (
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RpgMiniStats compact />
        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-800 ring-1 ring-violet-100">
          🏆 紀念成就 {rpg.anniversaryAchievements}
        </span>
      </div>
      ) : null}

      {nextAnniversary ? (
        <section className={`mb-3 p-3 ${lq.card}`}>
          <p className="text-[11px] font-bold text-rose-500">下一個重要日子</p>
          <p className="mt-1 text-lg font-bold text-stone-900">
            {nextAnniversary.emoji} {nextAnniversary.event.name}
          </p>
          <p className="text-sm text-stone-600">
            {nextAnniversary.daysUntil === 0
              ? '就是今天！'
              : `還有 ${nextAnniversary.daysUntil} 天`}
            <span className="text-stone-400"> · {nextAnniversary.occurrenceDate}</span>
          </p>
        </section>
      ) : null}

      <EventsSection
        events={anniversaries.events}
        plans={anniversaries.plans}
        upcoming={upcomingAnniversaries}
        showForm={showForm}
        editing={editing ?? null}
        expandedPlanId={expandedPlanId}
        onToggleForm={() => {
          setEditingId(null);
          setShowForm((v) => !v);
        }}
        onEdit={(id) => {
          setEditingId(id);
          setShowForm(true);
        }}
        onCancelForm={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSave={(input) => {
          if (editingId) updateAnniversary(editingId, input);
          else addAnniversary(input);
          setShowForm(false);
          setEditingId(null);
        }}
        onRemove={removeAnniversary}
        onPlan={(id) => {
          generateAnniversaryPlan(id);
          setExpandedPlanId(id);
        }}
        onCompletePlan={completeAnniversaryPlan}
        onCelebrate={markAnniversaryCelebrated}
        onTogglePlan={(id) => setExpandedPlanId((p) => (p === id ? null : id))}
      />

      <GiftSection
        prefs={anniversaries.giftPreferences}
        suggestions={anniversaries.lastGiftSuggestions}
        onUpdatePrefs={updateGiftPrefs}
        onGenerate={generateGiftSuggestions}
      />
    </>
  );
}

function EventsSection({
  events,
  plans,
  upcoming,
  showForm,
  editing,
  expandedPlanId,
  onToggleForm,
  onEdit,
  onCancelForm,
  onSave,
  onRemove,
  onPlan,
  onCompletePlan,
  onCelebrate,
  onTogglePlan,
}: {
  events: ReturnType<typeof useLoveQuest>['anniversaries']['events'];
  plans: ReturnType<typeof useLoveQuest>['anniversaries']['plans'];
  upcoming: ReturnType<typeof useLoveQuest>['upcomingAnniversaries'];
  showForm: boolean;
  editing: (typeof events)[0] | null;
  expandedPlanId: string | null;
  onToggleForm: () => void;
  onEdit: (id: string) => void;
  onCancelForm: () => void;
  onSave: (input: {
    name: string;
    date: string;
    type: AnniversaryEventType;
    note: string;
    repeatYearly: boolean;
  }) => void;
  onRemove: (id: string) => void;
  onPlan: (id: string) => void;
  onCompletePlan: (id: string) => void;
  onCelebrate: (id: string) => void;
  onTogglePlan: (id: string) => void;
}) {
  const upcomingMap = useMemo(() => new Map(upcoming.map((u) => [u.event.id, u])), [upcoming]);

  return (
    <section className={`mb-3 p-3 ${lq.card}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-stone-900">紀念日管理</h2>
        <button
          type="button"
          onClick={onToggleForm}
          className="text-[11px] font-bold text-rose-600"
        >
          {showForm ? '收起' : '+ 新增'}
        </button>
      </div>

      {showForm ? (
        <EventForm
          key={editing?.id ?? 'new'}
          initial={editing}
          onCancel={onCancelForm}
          onSave={onSave}
        />
      ) : null}

      {events.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-stone-500">還沒有紀念日，點「新增」開始記錄</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const up = upcomingMap.get(event.id);
            const plan = plans[event.id];
            const meta = typeMeta(event.type);
            const showPlan = expandedPlanId === event.id && plan;

            return (
              <li key={event.id} className="rounded-2xl border border-rose-50 bg-rose-50/20 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-stone-900">
                      {meta.emoji} {event.name}
                    </p>
                    <p className="text-[11px] text-stone-500">
                      {meta.label} · {event.date}
                      {up
                        ? up.daysUntil === 0
                          ? ' · 今天'
                          : ` · ${up.daysUntil} 天後`
                        : ''}
                    </p>
                    {event.note ? <p className="mt-1 text-[12px] text-stone-600">{event.note}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <IconBtn label="編輯" onClick={() => onEdit(event.id)}>
                      ✏️
                    </IconBtn>
                    <IconBtn label="刪除" onClick={() => onRemove(event.id)}>
                      🗑️
                    </IconBtn>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SmallBtn onClick={() => onPlan(event.id)}>✨ 幫我規劃</SmallBtn>
                  {plan ? (
                    <SmallBtn onClick={() => onTogglePlan(event.id)}>
                      {showPlan ? '收起計畫' : '看計畫'}
                    </SmallBtn>
                  ) : null}
                  <SmallBtn onClick={() => onCelebrate(event.id)}>🎉 已慶祝</SmallBtn>
                </div>

                {showPlan && plan ? (
                  <PlanCard plan={plan} onComplete={() => onCompletePlan(event.id)} />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EventForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: ReturnType<typeof useLoveQuest>['anniversaries']['events'][0] | null;
  onCancel: () => void;
  onSave: (input: {
    name: string;
    date: string;
    type: AnniversaryEventType;
    note: string;
    repeatYearly: boolean;
  }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [type, setType] = useState<AnniversaryEventType>(initial?.type ?? 'relationship');
  const [note, setNote] = useState(initial?.note ?? '');
  const [repeatYearly, setRepeatYearly] = useState(initial?.repeatYearly ?? true);

  const onTypeChange = (t: AnniversaryEventType) => {
    setType(t);
    const opt = ANNIVERSARY_TYPE_OPTIONS.find((o) => o.value === t);
    if (opt) setRepeatYearly(opt.defaultRepeatYearly);
    if (opt?.suggestedDate && !date) {
      const y = new Date().getFullYear();
      setDate(`${y}-${opt.suggestedDate}`);
    }
  };

  return (
    <form
      className="mb-3 space-y-2 rounded-xl border border-rose-100 bg-white/80 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !date) return;
        onSave({ name, date, type, note, repeatYearly });
      }}
    >
      <Field label="名稱">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：交往一週年"
          required
        />
      </Field>
      <Field label="日期">
        <input
          type="date"
          className={inputCls}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </Field>
      <Field label="類型">
        <select className={inputCls} value={type} onChange={(e) => onTypeChange(e.target.value as AnniversaryEventType)}>
          {ANNIVERSARY_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.emoji} {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="備註">
        <textarea
          className={`${inputCls} min-h-[60px] resize-none`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="選填"
        />
      </Field>
      <label className="flex items-center gap-2 text-[12px] text-stone-600">
        <input type="checkbox" checked={repeatYearly} onChange={(e) => setRepeatYearly(e.target.checked)} />
        每年重複提醒
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl py-2 text-[12px] font-bold text-stone-500">
          取消
        </button>
        <button type="submit" className={`flex-1 rounded-xl py-2 text-[12px] font-bold ${lq.btnPrimary}`}>
          儲存
        </button>
      </div>
    </form>
  );
}

function PlanCard({ plan, onComplete }: { plan: NonNullable<ReturnType<typeof useLoveQuest>['anniversaries']['plans'][string]>; onComplete: () => void }) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-2.5 text-[12px]">
      <PlanRow title="約會計畫" value={plan.datePlan} />
      <PlanRow title="預算建議" value={plan.budget} />
      <PlanRow title="時間安排" value={plan.schedule} />
      <PlanRow title="驚喜小點子" value={plan.surprises} />
      <PlanRow title="備案" value={plan.backup} />
      <p className="text-[10px] text-violet-600/80">AI 示範內容 · 之後可接 OpenAI</p>
      <button type="button" onClick={onComplete} className={`w-full rounded-lg py-2 text-[11px] font-bold ${lq.btnSecondary}`}>
        ✓ 完成規劃（領獎勵）
      </button>
    </div>
  );
}

function PlanRow({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <span className="font-bold text-violet-800">{title}</span>
      <p className="leading-snug text-stone-700">{value}</p>
    </div>
  );
}

function GiftSection({
  prefs,
  suggestions,
  onUpdatePrefs,
  onGenerate,
}: {
  prefs: ReturnType<typeof useLoveQuest>['anniversaries']['giftPreferences'];
  suggestions: ReturnType<typeof useLoveQuest>['anniversaries']['lastGiftSuggestions'];
  onUpdatePrefs: (p: typeof prefs) => void;
  onGenerate: () => void;
}) {
  const aiPro = useProFeature('ai_in_app');
  return (
    <section className={`p-3 ${lq.card}`}>
      <h2 className={`mb-2 flex flex-wrap items-center gap-2 ${lq.sectionTitleSm}`}>
        🎁 AI 禮物建議
        <ProBadgeIfNeeded show={aiPro.showProBadge} feature="ai_in_app" />
      </h2>
      <div className="space-y-2">
        <Field label="喜歡的顏色">
          <input
            className={inputCls}
            value={prefs.favoriteColor}
            onChange={(e) => onUpdatePrefs({ ...prefs, favoriteColor: e.target.value })}
            placeholder="例如：粉色、大地色"
          />
        </Field>
        <Field label="興趣">
          <input
            className={inputCls}
            value={prefs.interests}
            onChange={(e) => onUpdatePrefs({ ...prefs, interests: e.target.value })}
            placeholder="例如：咖啡、旅行、手作"
          />
        </Field>
        <Field label="預算">
          <input
            className={inputCls}
            value={prefs.budget}
            onChange={(e) => onUpdatePrefs({ ...prefs, budget: e.target.value })}
            placeholder="例如：1500 以內"
          />
        </Field>
        <Field label="不喜歡">
          <input
            className={inputCls}
            value={prefs.dislikes}
            onChange={(e) => onUpdatePrefs({ ...prefs, dislikes: e.target.value })}
            placeholder="例如：太甜的甜點"
          />
        </Field>
      </div>
      <PrimaryButton className="mt-3" onClick={onGenerate}>
        ✨ 產生禮物靈感
      </PrimaryButton>
      {suggestions.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {suggestions.map((g) => (
            <li key={g.id} className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5 text-[12px]">
              <p className="font-bold text-stone-900">{g.name}</p>
              <p className="text-amber-800">{g.budgetRange}</p>
              <p className="mt-1 text-stone-700">{g.whyFit}</p>
              <p className="mt-1 text-[11px] text-stone-500">📋 {g.prepTip}</p>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-[10px] text-stone-400">示範 AI · 之後可接 OpenAI API</p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] font-semibold text-stone-500">{label}</span>
      {children}
    </label>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="rounded-lg p-1 text-sm active:scale-95">
      {children}
    </button>
  );
}

function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-rose-700 ring-1 ring-rose-100 active:scale-95"
    >
      {children}
    </button>
  );
}

const inputCls =
  'w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-[13px] text-stone-800 outline-none focus:ring-2 focus:ring-rose-200';
