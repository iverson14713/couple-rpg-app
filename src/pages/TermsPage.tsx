import { useEffect } from 'react';
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED_EN, LEGAL_LAST_UPDATED_ZH } from './legalConfig';
import { LegalBulletList, LegalPageLayout, LegalSection } from './LegalPageLayout';

const copy = {
  zh: {
    title: 'LoveQuest 服務條款',
    subtitle: `最後更新日期：${LEGAL_LAST_UPDATED_ZH}`,
    back: '返回 App',
    footer: '繼續使用 LoveQuest 即代表你同意本服務條款。',
    lastUpdated: `最後更新日期：${LEGAL_LAST_UPDATED_ZH}`,
    contact: '聯絡信箱：',
    s1: '服務說明',
    s1Body:
      'LoveQuest 是供情侶使用的生活互動 App，協助你與另一半記錄與同步晚餐、家事、戀愛任務、約會靈感、重要日子提醒、LoveCoin 與成長數值，並提供 AI 約會行程與重要日子安排建議。本 App 為生活輔助工具，不提供心理治療、法律或醫療專業服務。',
    s2: '帳號與登入',
    s2Intro: '你可使用 Email 註冊／登入；亦支援 Google 登入。Apple 登入將於功能開放後提供。登入後可啟用雲端同步與情侶空間綁定。',
    s3: '情侶空間與同步',
    s3Body:
      '建立或加入情侶空間後，雙方可依功能設計同步部分資料。同步範圍可能隨版本更新而調整；未綁定或離線時，部分資料僅保留於本機。',
    s4: 'AI 功能',
    s4Intro: 'AI 約會與重要日子相關功能：',
    s4Items: [
      '依你輸入的條件產生建議，結果僅供參考',
      '免費與 Pro 方案可能有每日次數限制',
      '請自行判斷並安排實際行程，我們不保證準確或適用於所有情境',
    ],
    s5: '重要日子提醒',
    s5Body:
      '目前重要日子提醒主要於你開啟 App 時顯示，不等同於 iOS 或 Android 系統推播。若未來提供推播，將另行說明並可能請你授權通知權限。',
    s6: 'LoveCoin 與 Pro',
    s6Body:
      'LoveCoin、等級與相關數值為 App 內遊戲化設計，不具現金價值。Pro 方案之購買、續訂與退款，依各應用商店（如 App Store）規範辦理；測試或開發環境下的解鎖不代表正式收費已完成。',
    s7: '使用規範',
    s7Intro: '使用本 App 時，請你：',
    s7Items: [
      '提供真實、合法且尊重他人的內容',
      '妥善保管帳號與情侶邀請碼',
      '不得利用本 App 從事騷擾、詐欺或違法行為',
      '尊重另一半的隱私與資料',
    ],
    s8: '免責聲明',
    s8Body:
      '在法律允許範圍內，LoveQuest 依「現狀」提供服務。因網路、第三方服務、裝置或使用者操作所致之間接損失，我們不負賠償責任。AI 建議不構成專業諮詢。',
    s9: '條款變更',
    s9Body: '我們可能更新本條款；更新後繼續使用即視為同意新版本。重大變更將於 App 或網頁合理方式告知。',
    s10: '聯絡我們',
    s10Intro: '如有服務條款相關問題，歡迎來信：',
  },
  en: {
    title: 'LoveQuest Terms of Service',
    subtitle: `Last updated: ${LEGAL_LAST_UPDATED_EN}`,
    back: 'Back to app',
    footer: 'By continuing to use LoveQuest, you agree to these terms.',
    lastUpdated: `Last updated: ${LEGAL_LAST_UPDATED_EN}`,
    contact: 'Contact:',
    s1: 'About the service',
    s1Body:
      'LoveQuest is a couple lifestyle app for sharing dinner plans, chores, love tasks, date ideas, important-date reminders, LoveCoin, and growth stats, with AI date and important-date suggestions. It is a lifestyle helper, not medical, legal, or therapy advice.',
    s2: 'Accounts & sign-in',
    s2Intro:
      'You may register or sign in with email, or use Google. Apple sign-in will be offered when enabled. Sign-in unlocks cloud sync and couple pairing.',
    s3: 'Couple space & sync',
    s3Body:
      'After creating or joining a couple space, partners sync selected data as designed. Scope may change by version; without pairing or connectivity, some data stays on-device only.',
    s4: 'AI features',
    s4Intro: 'For AI date and important-date features:',
    s4Items: [
      'Suggestions are generated from your inputs and are for reference only',
      'Free and Pro plans may have daily limits',
      'You are responsible for real-world plans; we do not guarantee fitness for every situation',
    ],
    s5: 'Important-date reminders',
    s5Body:
      'Reminders are primarily shown when you open the app, not as system push notifications unless we add them later with your permission.',
    s6: 'LoveCoin & Pro',
    s6Body:
      'LoveCoin and growth stats are in-app gamification without cash value. Pro purchases, renewals, and refunds follow your app store rules; test unlocks are not completed billing.',
    s7: 'Acceptable use',
    s7Intro: 'You agree to:',
    s7Items: [
      'Provide lawful, respectful content',
      'Keep your account and invite codes secure',
      'Not use the app for harassment, fraud, or illegal activity',
      'Respect your partner’s privacy and data',
    ],
    s8: 'Disclaimer',
    s8Body:
      'To the extent permitted by law, LoveQuest is provided “as is.” We are not liable for indirect losses from networks, third parties, devices, or user actions. AI output is not professional advice.',
    s9: 'Changes',
    s9Body: 'We may update these terms; continued use means acceptance. Material changes will be communicated reasonably in-app or on the web.',
    s10: 'Contact us',
    s10Intro: 'Questions about these terms? Email:',
  },
} as const;

function detectLang(): keyof typeof copy {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function TermsPage() {
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
        <p>{t.s1Body}</p>
      </LegalSection>

      <LegalSection index={2} title={t.s2}>
        <p>{t.s2Intro}</p>
      </LegalSection>

      <LegalSection index={3} title={t.s3}>
        <p>{t.s3Body}</p>
      </LegalSection>

      <LegalSection index={4} title={t.s4}>
        <p>{t.s4Intro}</p>
        <LegalBulletList items={[...t.s4Items]} />
      </LegalSection>

      <LegalSection index={5} title={t.s5}>
        <p>{t.s5Body}</p>
      </LegalSection>

      <LegalSection index={6} title={t.s6}>
        <p>{t.s6Body}</p>
      </LegalSection>

      <LegalSection index={7} title={t.s7}>
        <p>{t.s7Intro}</p>
        <LegalBulletList items={[...t.s7Items]} />
      </LegalSection>

      <LegalSection index={8} title={t.s8}>
        <p>{t.s8Body}</p>
      </LegalSection>

      <LegalSection index={9} title={t.s9}>
        <p>{t.s9Body}</p>
      </LegalSection>

      <LegalSection index={10} title={t.s10}>
        <p>{t.s10Intro}</p>
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
