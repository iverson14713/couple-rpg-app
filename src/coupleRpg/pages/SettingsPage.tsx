import { Bell, Smartphone } from 'lucide-react';
import { AuthSettingsSection } from '../components/AuthSettingsSection';
import { CloudSyncSection } from '../components/CloudSyncSection';
import { CoupleBindSection } from '../components/CoupleBindSection';
import { MOCK_REMINDERS } from '../mockData';
import { lq } from '../theme';

export function SettingsPage({ embedded }: { embedded?: boolean } = {}) {
  return (
    <>
      {!embedded ? (
        <section className={`mb-4 p-4 ${lq.card}`}>
          <span className="text-3xl" aria-hidden>
            ⚙️
          </span>
          <h1 className="mt-2 text-xl font-bold text-stone-900">設定</h1>
          <p className="mt-1 text-sm text-stone-500">帳號、綁定另一半、雲端與 App</p>
        </section>
      ) : null}

      <AuthSettingsSection />

      <CoupleBindSection />

      <CloudSyncSection />

      <section className={`mb-4 p-4 ${lq.card}`}>
        <RemindersHeader />
        <ul className="space-y-2">
          {MOCK_REMINDERS.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                r.enabled ? 'border-rose-100 bg-rose-50/40' : 'border-stone-100 bg-stone-50/50 opacity-70'
              }`}
            >
              <span className="text-xl">{r.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-stone-800">{r.title}</p>
                <p className="text-[11px] text-stone-500">{r.dueLabel}</p>
              </div>
              <span className={`text-[10px] font-bold ${r.enabled ? 'text-emerald-600' : 'text-stone-400'}`}>
                {r.enabled ? '開啟' : '關閉'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-stone-400">提醒功能保留；完整編輯將於下一階段接上。</p>
      </section>

      <section className={`p-4 ${lq.card}`}>
        <div className="mb-2 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-rose-500" aria-hidden />
          <h2 className="text-base font-bold text-stone-900">PWA</h2>
        </div>
        <p className="text-sm leading-relaxed text-stone-600">
          可將 LoveQuest 加入主畫面，像 App 一樣開啟。manifest 與離線快取已啟用。
        </p>
      </section>
    </>
  );
}

function RemindersHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Bell className="h-5 w-5 text-rose-500" aria-hidden />
      <h2 className="text-base font-bold text-stone-900">提醒</h2>
    </div>
  );
}
