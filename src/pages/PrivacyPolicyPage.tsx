import { useEffect } from 'react';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED_EN, LEGAL_LAST_UPDATED_ZH } from './legalConfig';
import { LegalBulletList, LegalPageLayout, LegalSection } from './LegalPageLayout';

const copy = {
  zh: {
    title: 'LoveQuest 隱私政策',
    subtitle: `最後更新日期：${LEGAL_LAST_UPDATED_ZH}`,
    back: '返回 App',
    footer: '繼續使用 LoveQuest 即代表你理解並同意本隱私政策。',
    lastUpdated: `最後更新日期：${LEGAL_LAST_UPDATED_ZH}`,
    contact: '聯絡信箱：',
    s1: '我們收集哪些資料',
    s1Intro: '依你使用的功能，我們可能處理以下類型的資料：',
    s1Items: [
      '帳號資料（例如 Email、登入識別）',
      '情侶資料（暱稱、紀念日、生日等重要日子設定）',
      '生活互動資料（晚餐、家事、戀愛任務、約會點子等）',
      '成長與獎勵資料（LoveCoin、等級、EXP、愛心值、默契值）',
      'AI 使用紀錄與每日 AI 次數',
      '活動與操作紀錄（用於情侶空間內顯示）',
      '本機儲存資料（未登入或未綁定時的部分設定）',
    ],
    s2: '資料用途',
    s2Intro: '我們使用上述資料以提供 LoveQuest 服務，包括：',
    s2Items: [
      '情侶空間與雲端同步',
      'AI 約會行程建議',
      'AI 重要日子安排建議',
      'LoveCoin 與情侶成長數值',
      '帳號登入（Email、Google；Apple 於開放後）',
      '改善 App 穩定性與使用體驗',
    ],
    s3: '本機與雲端資料',
    s3Body:
      '部分資料可先儲存在你的裝置（本機）。登入並綁定情侶空間後，指定項目會同步至雲端，方便換機或與另一半共用。未登入、未綁定或離線時，部分功能僅能使用本機資料，且可能無法與另一半同步。',
    s4: '情侶與 AI 內容',
    s4Body:
      '你輸入的約會偏好、重要日子與 AI 產生的建議，僅用於提供功能與顯示給你與已綁定的情侶成員（依權限與功能設計）。請勿在 App 內輸入不必要的敏感個資。',
    s5: '第三方服務',
    s5Intro: '本 App 使用以下服務提供登入、同步與 AI：',
    s5Items: ['Supabase（帳號、資料庫與同步）', 'Google / Apple 登入（由 Supabase Auth 處理）', 'OpenAI API（AI 功能）'],
    s6: '資料安全',
    s6Body: '我們透過加密連線傳輸資料，並依服務商與平台合理設定存取權限。請妥善保管帳號與裝置。',
    s7: '刪除與停止使用',
    s7Intro: '你可以停止使用 App，並可透過下列方式處理資料：',
    s7Items: [
      '在 App 內調整或刪除部分本機資料',
      '登出帳號',
      '來信要求協助刪除帳號或雲端資料（我們將於合理期限內回覆）',
    ],
    s8: '聯絡我們',
    s8Intro: '如有隱私相關問題，歡迎來信：',
  },
  en: {
    title: 'LoveQuest Privacy Policy',
    subtitle: `Last updated: ${LEGAL_LAST_UPDATED_EN}`,
    back: 'Back to app',
    footer: 'By continuing to use LoveQuest, you acknowledge this privacy policy.',
    lastUpdated: `Last updated: ${LEGAL_LAST_UPDATED_EN}`,
    contact: 'Contact:',
    s1: 'What we collect',
    s1Intro: 'Depending on features you use, we may process:',
    s1Items: [
      'Account data (e.g. email, sign-in identifiers)',
      'Couple profile data (nicknames, anniversaries, important dates)',
      'Daily couple activity (dinner, chores, love tasks, date ideas, etc.)',
      'Growth & rewards (LoveCoin, level, EXP, heart bond, compatibility)',
      'AI usage and daily AI quota',
      'Activity logs shown in your couple space',
      'On-device data when not signed in or not paired',
    ],
    s2: 'How we use data',
    s2Intro: 'We use this data to provide LoveQuest, including:',
    s2Items: [
      'Couple space and cloud sync',
      'AI date itinerary suggestions',
      'AI important-date planning suggestions',
      'LoveCoin and couple growth stats',
      'Sign-in (email, Google; Apple when enabled)',
      'App stability and experience improvements',
    ],
    s3: 'On-device vs cloud',
    s3Body:
      'Some data is stored on your device first. After sign-in and couple pairing, selected items sync to the cloud for new devices and sharing with your partner. Without sign-in, pairing, or connectivity, some features stay local only.',
    s4: 'Couple & AI content',
    s4Body:
      'Inputs you provide and AI outputs are used to run features and show them to you and your paired partner as designed. Avoid entering unnecessary sensitive personal data.',
    s5: 'Third-party services',
    s5Intro: 'We use:',
    s5Items: ['Supabase (auth, database, sync)', 'Google / Apple sign-in (via Supabase Auth)', 'OpenAI API (AI features)'],
    s6: 'Security',
    s6Body: 'Data is sent over encrypted connections with access controls aligned to our providers. Keep your account and device secure.',
    s7: 'Deletion & stopping use',
    s7Intro: 'You may stop using the app and:',
    s7Items: [
      'Adjust or remove some on-device data in the app',
      'Sign out',
      'Email us to request account or cloud data deletion (we will respond within a reasonable time)',
    ],
    s8: 'Contact us',
    s8Intro: 'Privacy questions? Email:',
  },
} as const;

function detectLang(): keyof typeof copy {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function PrivacyPolicyPage() {
  const t = copy[detectLang()];

  useEffect(() => {
    document.title = t.title;
    return () => {
      document.title = 'LoveQuest 情侶生活';
    };
  }, [t.title]);

  return (
    <LegalPageLayout
      title={t.title}
      subtitle={t.subtitle}
      backLabel={t.back}
      footerNote={t.footer}
      lastUpdatedLabel={t.lastUpdated}
      contactLabel={t.contact}
    >
      <LegalSection index={1} title={t.s1}>
        <p>{t.s1Intro}</p>
        <LegalBulletList items={[...t.s1Items]} />
      </LegalSection>

      <LegalSection index={2} title={t.s2}>
        <p>{t.s2Intro}</p>
        <LegalBulletList items={[...t.s2Items]} />
      </LegalSection>

      <LegalSection index={3} title={t.s3}>
        <p>{t.s3Body}</p>
      </LegalSection>

      <LegalSection index={4} title={t.s4}>
        <p>{t.s4Body}</p>
      </LegalSection>

      <LegalSection index={5} title={t.s5}>
        <p>{t.s5Intro}</p>
        <LegalBulletList items={[...t.s5Items]} />
      </LegalSection>

      <LegalSection index={6} title={t.s6}>
        <p>{t.s6Body}</p>
      </LegalSection>

      <LegalSection index={7} title={t.s7}>
        <p>{t.s7Intro}</p>
        <LegalBulletList items={[...t.s7Items]} />
      </LegalSection>

      <LegalSection index={8} title={t.s8}>
        <p>{t.s8Intro}</p>
        <a
          href={`mailto:${LEGAL_CONTACT_EMAIL}`}
          className="mt-2 inline-block font-semibold text-rose-600 underline decoration-rose-200 underline-offset-2"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </LegalSection>
    </LegalPageLayout>
  );
}
