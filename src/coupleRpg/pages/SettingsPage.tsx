import { Smartphone } from 'lucide-react';
import { AuthSettingsSection } from '../components/AuthSettingsSection';
import { CloudSyncSection } from '../components/CloudSyncSection';
import { CoupleBindSection } from '../components/CoupleBindSection';
import { CoupleDetailsSection } from '../components/CoupleDetailsSection';
import { ImportantDateRemindersSection } from '../components/ImportantDateRemindersSection';
import { UpgradeCard } from '../components/UpgradeCard';
import { OnboardingSettingsSection } from '../components/OnboardingSettingsSection';
import { PlanSettingsSection } from '../components/PlanSettingsSection';
import { LegalSettingsSection } from '../components/LegalSettingsSection';
import { SettingsSectionErrorBoundary } from '../components/SettingsSectionErrorBoundary';
import { lq } from '../theme';

export function SettingsPage({ embedded }: { embedded?: boolean } = {}) {
  return (
    <>
      <SettingsSectionErrorBoundary sectionName="訂閱方案">
        <PlanSettingsSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="Pro 升級">
        <UpgradeCard className="mb-4" />
      </SettingsSectionErrorBoundary>

      {!embedded ? (
        <section className={`mb-4 p-4 ${lq.card}`}>
          <span className="text-3xl" aria-hidden>
            ⚙️
          </span>
          <h1 className={`mt-2 text-xl font-bold ${lq.text}`}>設定</h1>
          <p className={`mt-1 text-sm ${lq.textSecondary}`}>帳號、綁定另一半、雲端與 App</p>
        </section>
      ) : null}

      <SettingsSectionErrorBoundary sectionName="新手導覽">
        <OnboardingSettingsSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="帳號登入">
        <AuthSettingsSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="情侶空間綁定">
        <CoupleBindSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="雲端同步">
        <CloudSyncSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="情侶資料">
        <CoupleDetailsSection />
      </SettingsSectionErrorBoundary>

      <SettingsSectionErrorBoundary sectionName="重要日子提醒">
        <ImportantDateRemindersSection compactHero />
      </SettingsSectionErrorBoundary>

      <section className={`p-4 ${lq.card}`}>
        <div className="mb-2 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-rose-500" aria-hidden />
          <h2 className={lq.sectionTitleSm}>PWA</h2>
        </div>
        <p className={`text-sm leading-relaxed ${lq.textSecondary}`}>
          可將 LoveQuest 加入主畫面，像 App 一樣開啟。manifest 與離線快取已啟用。
        </p>
      </section>

      <SettingsSectionErrorBoundary sectionName="法律與隱私">
        <LegalSettingsSection />
      </SettingsSectionErrorBoundary>
    </>
  );
}
