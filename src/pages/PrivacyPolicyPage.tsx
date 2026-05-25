import { useEffect } from 'react';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DEVELOPER_NAME,
  LEGAL_LAST_UPDATED_ZH,
} from './legalConfig';
import { LegalBulletList, LegalPageLayout, LegalSection } from './LegalPageLayout';

export function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'LoveQuest 隱私政策';
    return () => {
      document.title = 'LoveQuest 情侶生活';
    };
  }, []);

  return (
    <LegalPageLayout
      title="LoveQuest 隱私政策"
      subtitle={`最後更新日期：${LEGAL_LAST_UPDATED_ZH} · 開發者：${LEGAL_DEVELOPER_NAME}`}
      backLabel="返回 App"
      footerNote="繼續使用 LoveQuest 即代表你理解並同意本隱私政策。"
      lastUpdatedLabel={`最後更新日期：${LEGAL_LAST_UPDATED_ZH}`}
      contactLabel="聯絡信箱："
    >
      <LegalSection index={1} title="我們收集哪些資料">
        <p>依你使用的功能，LoveQuest 可能處理以下類型的資料：</p>
        <LegalBulletList
          items={[
            '帳號資料（例如 Email、Google 登入識別）',
            '情侶資料（暱稱、情侶空間綁定、紀念日與重要日子設定）',
            '約會與生活互動紀錄（約會點子、晚餐、家事、戀愛任務、LoveCoin 與成長數值等）',
            'AI 功能輸入內容與產出紀錄（約會建議、重要日子安排等）',
            '本機快取資料（裝置上的設定與未同步內容）',
          ]}
        />
      </LegalSection>

      <LegalSection index={2} title="資料用途">
        <p>我們使用上述資料以提供並改善 LoveQuest，包括：</p>
        <LegalBulletList
          items={[
            '提供 App 核心功能與情侶空間體驗',
            'AI 約會與重要日子建議',
            '雲端同步與跨裝置存取',
            '改善穩定性、安全性與使用體驗',
          ]}
        />
      </LegalSection>

      <LegalSection index={3} title="我們不會販售個人資料">
        <p>
          我們不會將你的個人資料出售、出租或交換予第三方作廣告或行銷用途。資料僅在提供服務、履行法律義務或經你同意之必要範圍內使用。
        </p>
      </LegalSection>

      <LegalSection index={4} title="本機與雲端資料">
        <p>
          部分資料可先儲存在你的裝置（本機快取）。登入並綁定情侶空間後，指定項目會同步至雲端。未登入、未綁定或離線時，部分功能僅能使用本機資料。個人卡券等項目僅保存在你的帳號中，不會同步給另一半；相關動態可能顯示於情侶空間的今日動態。
        </p>
      </LegalSection>

      <LegalSection index={5} title="第三方服務">
        <p>本 App 使用以下第三方服務以提供登入、同步與 AI 功能：</p>
        <LegalBulletList
          items={[
            'Supabase（帳號驗證、資料庫與雲端同步）',
            'Google 登入（由 Supabase Auth 處理）',
            'OpenAI（AI 約會與重要日子等建議功能）',
          ]}
        />
        <p className="mt-2.5">
          上述服務有其各自的隱私政策；我們僅傳送提供功能所必要的資料。
        </p>
      </LegalSection>

      <LegalSection index={6} title="資料安全">
        <p>
          我們透過加密連線傳輸資料，並依服務商與平台合理設定存取權限。請妥善保管你的帳號、裝置與情侶邀請碼，避免他人未經授權使用。
        </p>
      </LegalSection>

      <LegalSection index={7} title="刪除帳號與資料">
        <p>你可以停止使用 App，並可透過下列方式處理資料：</p>
        <LegalBulletList
          items={[
            '在 App 內調整或刪除部分本機資料',
            '登出帳號',
            '來信要求刪除帳號或雲端資料，我們將於合理期限內回覆並協助處理',
          ]}
        />
      </LegalSection>

      <LegalSection index={8} title="政策變更">
        <p>
          我們可能因功能或法規要求更新本政策。更新後繼續使用 LoveQuest 即視為同意新版本；重大變更將於 App 或本頁面合理方式告知。
        </p>
      </LegalSection>

      <LegalSection index={9} title="聯絡我們">
        <p>如有隱私相關問題，歡迎來信：</p>
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
