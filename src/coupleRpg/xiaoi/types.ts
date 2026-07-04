/** 小愛怪四種情緒狀態（Design System v0.1） */
export type XiaoiState = 'happy' | 'sad' | 'sleepy' | 'back_angry';

export type XiaoiEmotionalTone = 'joyful' | 'lonely' | 'calm' | 'upset';

export type XiaoiHeroLayout = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

/** 單一狀態的完整視覺與文案 profile（單一真相來源） */
export type XiaoiStateProfile = {
  state: XiaoiState;
  displayName: string;
  /** 首頁 Hero caption（`XIAOI_HERO_MESSAGES`） */
  message: string;
  /** `getXiaoiState()` 回傳的 `message` 欄位（可與 Hero caption 不同） */
  detailMessage: string;
  widgetMessage: string;
  imageName: string;
  widgetImageName: string;
  /** v0.1 預留；尚未套用 CSS animation */
  animationClass: string;
  shadowStyle: string;
  mainColor: string;
  emotionalTone: XiaoiEmotionalTone;
  heroLayout: XiaoiHeroLayout;
};

/** `getXiaoiState()` 回傳格式（維持既有 App API） */
export type XiaoiStateResult = {
  state: XiaoiState;
  imageName: string;
  title: string;
  message: string;
  /** Reserved for future pet level visuals */
  level?: number;
  /** Reserved for future skins */
  skin?: string;
  /** Reserved for future backgrounds */
  background?: string;
  /** Reserved for future animations */
  animation?: string;
};

export type XiaoiStateInput = {
  hasInteractedToday: boolean;
  flameDays: number;
  lastInteractionDate: string | null;
  isLoggedIn?: boolean;
  isCoupleBound?: boolean;
  currentHour?: number;
  today?: string;
};
