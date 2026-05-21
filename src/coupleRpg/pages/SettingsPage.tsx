import { Smartphone } from 'lucide-react';
import { AuthSettingsSection } from '../components/AuthSettingsSection';
import { CloudSyncSection } from '../components/CloudSyncSection';
import { CoupleBindSection } from '../components/CoupleBindSection';
import { CoupleDetailsSection } from '../components/CoupleDetailsSection';
import { ImportantDateRemindersSection } from '../components/ImportantDateRemindersSection';
import { UpgradeCard } from '../components/UpgradeCard';
import { PlanSettingsSection } from '../components/PlanSettingsSection';
import { lq } from '../theme';

export function SettingsPage({ embedded }: { embedded?: boolean } = {}) {
  return (
    <>
      <PlanSettingsSection />
      <UpgradeCard className="mb-4" />

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

      <CoupleDetailsSection />

      <ImportantDateRemindersSection compactHero />

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

