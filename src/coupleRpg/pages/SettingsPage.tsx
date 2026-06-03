import { useEffect, useState, type ReactNode } from 'react';
import { Smartphone } from 'lucide-react';
import { AuthSettingsSection } from '../components/AuthSettingsSection';
import { DeleteAccountSection } from '../components/DeleteAccountSection';
import { CloudSyncSection } from '../components/CloudSyncSection';
import { CoupleBindSection } from '../components/CoupleBindSection';
import { CoupleDetailsSection } from '../components/CoupleDetailsSection';
import { ImportantDateRemindersSection } from '../components/ImportantDateRemindersSection';
import { UpgradeCard } from '../components/UpgradeCard';
import { PlanSettingsSection } from '../components/PlanSettingsSection';
import { PromoCodeSection } from '../components/PromoCodeSection';
import { LegalSettingsSection } from '../components/LegalSettingsSection';
import { SettingsSectionErrorBoundary } from '../components/SettingsSectionErrorBoundary';
import { SettingsEntryCard } from '../components/settings/SettingsEntryCard';
import { SettingsSubPageHeader } from '../components/settings/SettingsSubPageHeader';
import { useOnboarding } from '../context/OnboardingContext';
import { useCoupleRpgNav } from '../context/CoupleRpgNavContext';
import { PRO_BENEFIT_LINES } from '../lib/proPlanContent';
import {
  settingsScreenForScrollTarget,
  type SettingsScreenId,
} from '../lib/settingsNav';
import { lq } from '../theme';

function NestedSettingsSections({ children }: { children: ReactNode }) {
  return <div className="space-y-3 [&_section]:!mb-0">{children}</div>;
}

export function SettingsPage({ embedded }: { embedded?: boolean } = {}) {
  const { pendingScrollElementId } = useCoupleRpgNav();
  const { replayOnboarding } = useOnboarding();
  const [screen, setScreen] = useState<SettingsScreenId>('hub');

  useEffect(() => {
    const target = settingsScreenForScrollTarget(pendingScrollElementId);
    if (target) setScreen(target);
  }, [pendingScrollElementId]);

  const goHub = () => setScreen('hub');

  if (screen !== 'hub') {
    return (
      <div>
        {screen === 'pro' ? (
          <SettingsProScreen onBack={goHub} />
        ) : null}
        {screen === 'account' ? (
          <SettingsAccountScreen onBack={goHub} />
        ) : null}
        {screen === 'coupleSpace' ? (
          <SettingsCoupleSpaceScreen onBack={goHub} />
        ) : null}
        {screen === 'coupleProfile' ? (
          <SettingsCoupleProfileScreen onBack={goHub} />
        ) : null}
        {screen === 'reminders' ? (
          <SettingsRemindersScreen onBack={goHub} />
        ) : null}
        {screen === 'about' ? (
          <SettingsAboutScreen onBack={goHub} />
        ) : null}
      </div>
    );
  }

  return (
    <>
      {!embedded ? (
        <section className={`mb-3 p-4 ${lq.card}`}>
          <span className="text-3xl" aria-hidden>
            ⚙️
          </span>
          <h1 className={`mt-2 text-xl font-bold ${lq.text}`}>設定</h1>
          <p className={`mt-1 text-sm ${lq.textSecondary}`}>帳號、情侶空間、提醒與 App</p>
        </section>
      ) : null}

      <div className="space-y-2">
        <SettingsEntryCard
          emoji="✨"
          title="Pro 與兌換碼"
          description="目前方案、恢復購買、輸入活動碼"
          onClick={() => setScreen('pro')}
        />
        <SettingsEntryCard
          emoji="🔐"
          title="帳號與安全"
          description="登入狀態、登出、刪除帳號"
          onClick={() => setScreen('account')}
        />
        <SettingsEntryCard
          emoji="💞"
          title="情侶空間"
          description="綁定狀態、成員、同步連線"
          onClick={() => setScreen('coupleSpace')}
        />
        <SettingsEntryCard
          emoji="💕"
          title="情侶資料與重要日子"
          description="暱稱、生日、紀念日、自訂重要日子"
          onClick={() => setScreen('coupleProfile')}
        />
        <SettingsEntryCard
          emoji="🔔"
          title="提醒與通知"
          description="推播通知、提醒時間、今日提醒"
          onClick={() => setScreen('reminders')}
        />
        <SettingsEntryCard
          emoji="🧭"
          title="新手導覽"
          description="重新查看 LoveQuest 功能介紹"
          onClick={() => replayOnboarding()}
        />
        <SettingsEntryCard
          emoji="🛡️"
          title="關於與法律"
          description="隱私政策、服務條款、PWA"
          onClick={() => setScreen('about')}
        />
      </div>
    </>
  );
}

function SettingsProScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="Pro 與兌換碼"
        subtitle="目前方案、恢復購買、輸入活動碼"
        onBack={onBack}
      />
      <NestedSettingsSections>
        <SettingsSectionErrorBoundary sectionName="訂閱方案">
          <PlanSettingsSection />
        </SettingsSectionErrorBoundary>
        <SettingsSectionErrorBoundary sectionName="兌換碼">
          <PromoCodeSection />
        </SettingsSectionErrorBoundary>
        <SettingsSectionErrorBoundary sectionName="Pro 升級">
          <UpgradeCard className="!mb-0" />
        </SettingsSectionErrorBoundary>
        <section className={`p-4 ${lq.card}`}>
          <h2 className={lq.sectionTitleSm}>Pro 權益說明</h2>
          <ul className="mt-2.5 space-y-1.5">
            {PRO_BENEFIT_LINES.map((line) => (
              <li key={line} className={`text-[12px] leading-snug ${lq.textSecondary}`}>
                {line}
              </li>
            ))}
          </ul>
        </section>
      </NestedSettingsSections>
    </>
  );
}

function SettingsAccountScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="帳號與安全"
        subtitle="登入狀態、登出、刪除帳號"
        onBack={onBack}
      />
      <NestedSettingsSections>
        <SettingsSectionErrorBoundary sectionName="帳號登入">
          <AuthSettingsSection />
        </SettingsSectionErrorBoundary>
        <SettingsSectionErrorBoundary sectionName="刪除帳號">
          <DeleteAccountSection />
        </SettingsSectionErrorBoundary>
      </NestedSettingsSections>
    </>
  );
}

function SettingsCoupleSpaceScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="情侶空間"
        subtitle="綁定狀態、成員、同步連線"
        onBack={onBack}
      />
      <NestedSettingsSections>
        <SettingsSectionErrorBoundary sectionName="情侶空間綁定">
          <CoupleBindSection />
        </SettingsSectionErrorBoundary>
        <SettingsSectionErrorBoundary sectionName="雲端同步">
          <CloudSyncSection />
        </SettingsSectionErrorBoundary>
      </NestedSettingsSections>
    </>
  );
}

function SettingsCoupleProfileScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="情侶資料與重要日子"
        subtitle="暱稱、生日、紀念日、自訂重要日子"
        onBack={onBack}
      />
      <NestedSettingsSections>
        <SettingsSectionErrorBoundary sectionName="情侶資料">
          <CoupleDetailsSection />
        </SettingsSectionErrorBoundary>
      </NestedSettingsSections>
    </>
  );
}

function SettingsRemindersScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="提醒與通知"
        subtitle="推播通知、提醒時間、今日提醒"
        onBack={onBack}
      />
      <SettingsSectionErrorBoundary sectionName="重要日子提醒">
        <ImportantDateRemindersSection compactHero />
      </SettingsSectionErrorBoundary>
    </>
  );
}

function SettingsAboutScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <SettingsSubPageHeader
        title="關於與法律"
        subtitle="隱私政策、服務條款、PWA"
        onBack={onBack}
      />
      <NestedSettingsSections>
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
        <section className={`p-4 ${lq.card}`}>
          <h2 className={lq.sectionTitleSm}>App 資訊</h2>
          <p className={`mt-1 text-[13px] ${lq.textSecondary}`}>LoveQuest 情侶成長 App</p>
        </section>
      </NestedSettingsSections>
    </>
  );
}
