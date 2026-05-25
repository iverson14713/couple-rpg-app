import { useEffect } from 'react';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DEVELOPER_NAME,
  LEGAL_LAST_UPDATED_ZH,
} from './legalConfig';
import { LegalBulletList, LegalPageLayout, LegalSection } from './LegalPageLayout';

export function TermsPage() {
  useEffect(() => {
    document.title = 'LoveQuest 服務條款';
    return () => {
      document.title = 'LoveQuest 情侶生活';
    };
  }, []);

  return (
    <LegalPageLayout
      title="LoveQuest 服務條款"
      subtitle={`最後更新日期：${LEGAL_LAST_UPDATED_ZH} · 開發者：${LEGAL_DEVELOPER_NAME}`}
      backLabel="返回 App"
      footerNote="繼續使用 LoveQuest 即代表你同意本服務條款。"
      lastUpdatedLabel={`最後更新日期：${LEGAL_LAST_UPDATED_ZH}`}
      contactLabel="聯絡信箱："
    >
      <LegalSection index={1} title="服務說明">
        <p>
          LoveQuest 是由 {LEGAL_DEVELOPER_NAME} 開發的情侶生活互動 App，協助你與另一半記錄晚餐、家事、戀愛任務、約會靈感、重要日子、LoveCoin 與成長數值，並提供 AI 約會與重要日子建議。本 App 為生活輔助工具，不提供心理治療、法律或醫療專業服務。
        </p>
      </LegalSection>

      <LegalSection index={2} title="合法使用">
        <p>使用 LoveQuest 時，你同意：</p>
        <LegalBulletList
          items={[
            '以合法、正當方式使用 App，並遵守適用法律',
            '提供真實、合法且尊重他人的內容',
            '妥善保管帳號、密碼與情侶邀請碼',
            '不得利用本 App 從事騷擾、詐欺、侵權或任何違法行為',
            '尊重另一半的隱私與資料',
          ]}
        />
      </LegalSection>

      <LegalSection index={3} title="AI 功能">
        <p>LoveQuest 的 AI 功能（含約會建議、重要日子安排等）須遵守以下規範：</p>
        <LegalBulletList
          items={[
            '不得濫用 AI 功能（例如大量自動請求、惡意繞過限制、輸入違法或有害內容）',
            'AI 產出僅供參考，不構成專業諮詢；請自行判斷並安排實際行程',
            '我們不保證 AI 內容的完整、準確或適用於所有情境',
            '免費與 Pro 方案可能有每日使用次數限制',
          ]}
        />
      </LegalSection>

      <LegalSection index={4} title="功能更新與調整">
        <p>
          我們可能因產品迭代、技術或營運需要，更新、調整、暫停或終止部分功能（含同步範圍、AI 能力、介面與數值規則）。我們將以合理方式告知重大變更；你亦可隨時停止使用 App。
        </p>
      </LegalSection>

      <LegalSection index={5} title="Pro 功能與訂閱">
        <p>
          LoveQuest 可能提供 Pro 或進階功能（例如更多 AI 次數、自訂卡券、完整同步等）。訂閱方案之價格、內容、試用與續訂條件，以 App 內及 App Store 等應用商店當時顯示為準。購買、續訂、取消與退款，依各應用商店規範辦理。LoveCoin 與 App 內數值為遊戲化設計，不具現金價值。
        </p>
      </LegalSection>

      <LegalSection index={6} title="免責聲明">
        <p>
          在法律允許範圍內，LoveQuest 依「現狀」提供服務。因網路、第三方服務、裝置故障或使用者操作所致之間接或衍生損失，開發者不負賠償責任。
        </p>
      </LegalSection>

      <LegalSection index={7} title="條款變更">
        <p>
          {LEGAL_DEVELOPER_NAME} 保留修改本服務條款之權利。更新後繼續使用 LoveQuest 即視為同意新版本；重大變更將於 App 或本頁面合理方式告知。
        </p>
      </LegalSection>

      <LegalSection index={8} title="聯絡我們">
        <p>如有服務條款相關問題，歡迎來信：</p>
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
