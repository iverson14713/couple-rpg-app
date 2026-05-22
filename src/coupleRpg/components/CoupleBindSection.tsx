import { useState, type ReactNode } from 'react';
import { Check, Copy, Loader2, Users } from 'lucide-react';
import { useSupabaseAuth } from '../../useSupabaseAuth';
import { useCoupleSpace } from '../context/CoupleSpaceContext';
import { lq } from '../theme';

export function CoupleBindSection() {
  const auth = useSupabaseAuth();
  const {
    space,
    loading,
    busy,
    actionError,
    successMessage,
    isFullyBound,
    hasMembership,
    createSpace,
    joinSpace,
    copyCode,
    clearMessages,
  } = useCoupleSpace();

  const [coupleName, setCoupleName] = useState('');
  const [inviteInput, setInviteInput] = useState('');

  if (!auth.configured) {
    return (
      <BindCard title="情侶空間綁定" subtitle="尚未設定 Supabase，無法使用雲端綁定">
        <p className="text-[12px] text-stone-500">請在 Vercel 設定 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY。</p>
      </BindCard>
    );
  }

  if (!auth.user) {
    return (
      <BindCard title="情侶空間綁定" subtitle="登入後可建立或加入情侶空間">
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-900">請先登入</p>
        <p className="mt-2 text-[11px] text-stone-500">
          請到「設定」分頁登入或註冊；登入後即可建立或加入情侶空間。
        </p>
      </BindCard>
    );
  }

  if (loading) {
    return (
      <BindCard title="情侶空間綁定" subtitle="讀取綁定狀態…">
        <div className="flex items-center justify-center gap-2 py-4 text-[12px] text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin text-rose-400" aria-hidden />
          載入中…
        </div>
      </BindCard>
    );
  }

  return (
    <BindCard
      id="couple-bind-section"
      title="情侶空間綁定"
      subtitle={isFullyBound ? '已與另一半同步連線' : hasMembership ? '等待另一半加入' : '建立空間或輸入邀請碼加入'}
    >
      {isFullyBound ? (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
          <Check className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
          <div>
            <p className="text-[13px] font-bold text-emerald-900">已綁定</p>
            <p className="text-[11px] text-emerald-800/90">你們已是同一個情侶空間，可一起記錄生活</p>
          </div>
        </div>
      ) : hasMembership ? (
        <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
          <p className="text-[12px] font-bold text-amber-900">等待另一半加入（{space?.memberCount ?? 1}/2）</p>
          <p className="text-[11px] text-amber-800/90">將下方邀請碼傳給對方，對方輸入後即完成綁定</p>
        </div>
      ) : null}

      <MessageBanner error={actionError} success={successMessage} onDismiss={clearMessages} />

      {space?.inviteCode && !isFullyBound ? (
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 p-3 ring-1 ring-rose-100">
          <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">你的邀請碼</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-2xl font-extrabold tracking-[0.2em] text-rose-700">{space.inviteCode}</p>
            <button
              type="button"
              onClick={() => void copyCode()}
              disabled={busy}
              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold ${lq.btnSecondary}`}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              複製
            </button>
          </div>
        </div>
      ) : null}

      {space ? (
        <div className={`mb-3 p-3 ${lq.cardSoft}`}>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-stone-600">
            <Users className="h-3.5 w-3.5" aria-hidden />
            成員（{space.memberCount}/2）
          </div>
          <ul className="space-y-1.5">
            {(space.members ?? []).map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-1.5 text-[12px]"
              >
                <span className="font-semibold text-stone-800">{m.label}</span>
                <span className="text-[10px] text-stone-400">{m.role === 'owner' ? '建立者' : '伴侶'}</span>
              </li>
            ))}
          </ul>
          {space.coupleName ? (
            <p className="mt-2 text-[10px] text-stone-500">空間名稱：{space.coupleName}</p>
          ) : null}
        </div>
      ) : null}

      {!hasMembership ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-bold text-stone-600">空間名稱（選填）</label>
            <input
              type="text"
              value={coupleName}
              onChange={(e) => setCoupleName(e.target.value)}
              placeholder="例如：我們的小窩"
              maxLength={40}
              className="w-full rounded-xl border border-rose-100 bg-white px-3 py-2 text-[13px] outline-none ring-rose-200 focus:ring-2"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void createSpace(coupleName)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold ${lq.btnPrimary}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            建立情侶空間
          </button>

          <div className="relative py-1 text-center">
            <span className="bg-white/80 px-2 text-[10px] font-bold text-stone-400">或</span>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold text-stone-600">輸入邀請碼加入</label>
            <input
              type="text"
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
              placeholder="6 碼邀請碼"
              maxLength={8}
              className="mb-2 w-full rounded-xl border border-rose-100 bg-white px-3 py-2 font-mono text-center text-lg tracking-widest outline-none ring-rose-200 focus:ring-2"
            />
            <button
              type="button"
              disabled={busy || !inviteInput.trim()}
              onClick={() => void joinSpace(inviteInput)}
              className="w-full rounded-xl border border-rose-200 bg-white py-2.5 text-[13px] font-bold text-rose-700 active:scale-[0.99]"
            >
              {busy ? '加入中…' : '加入情侶空間'}
            </button>
          </div>
        </div>
      ) : null}
    </BindCard>
  );
}

function BindCard({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`mb-3 p-3 ${lq.card}`}>
      <h2 className="text-sm font-bold text-stone-900">{title}</h2>
      <p className="mb-3 text-[11px] text-stone-500">{subtitle}</p>
      {children}
    </section>
  );
}

function MessageBanner({
  error,
  success,
  onDismiss,
}: {
  error: string | null;
  success: string | null;
  onDismiss: () => void;
}) {
  if (!error && !success) return null;
  return (
    <div
      className={`mb-3 rounded-xl px-3 py-2 text-[12px] font-medium ${
        error ? 'bg-red-50 text-red-800 ring-1 ring-red-100' : 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
      }`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-2">
        <span>{error ?? success}</span>
        <button type="button" onClick={onDismiss} className="shrink-0 text-[10px] font-bold opacity-70">
          關閉
        </button>
      </div>
    </div>
  );
}
