import type { DateItineraryPlan } from '../../coupleRpg/lib/dateItineraryAiModel';
import type { SavedDateItineraryAi } from '../../coupleRpg/storage/dateItineraryAiCache';
import { todayKey } from '../../coupleRpg/lib/dates';

/** 與 App 內 AI 約會結果結構一致（供 DateItineraryAiResult 展示） */
export const SHOWCASE_DATE_PLAN: DateItineraryPlan = {
  title: '河邊夕陽與儀式感晚餐',
  mood: '從輕鬆聊天慢慢走進浪漫，今天不用趕行程',
  moodTags: ['溫柔', '浪漫', '輕鬆'],
  segments: [
    {
      period: '下午',
      place: '巷弄文青咖啡館',
      headline: '文青咖啡館',
      narrative:
        '先用比較輕鬆的氣氛開場，適合慢慢聊天、交換最近生活的小事。點一杯彼此都想試的飲品，讓今天從「舒服」開始。',
      purpose: '降低約會開場的緊繃感，先建立今天的默契節奏',
      transition: '喝完後散步 10 分鐘到河邊，讓心情從室內轉到戶外',
      conversationCue: '最近有沒有哪件小事，讓你覺得被照顧到？',
      estimatedCost: 'NT$ 350–500',
    },
    {
      period: '傍晚',
      place: '河濱步道',
      headline: '河濱散步',
      narrative:
        '夕陽時間很適合拍照，也比較容易自然聊到未來與夢想。不必趕路，就當兩人專屬的慢速時段。',
      purpose: '製造「一起走向某個方向」的象徵感',
      transition: '天色暗下前前往晚餐地點，保留一點期待感',
      conversationCue: '如果下個月可以偷放一天假，你最想和我一起做什麼？',
      estimatedCost: 'NT$ 80–150',
    },
    {
      period: '晚餐',
      place: '氣氛餐廳',
      headline: '燭光晚餐',
      narrative:
        '安排燈光偏暗、安靜的餐廳，讓整體約會有正式感與紀念感。這段適合把今天最真心的話放在這裡說。',
      purpose: '把約會情緒推到高潮，留下深刻記憶',
      transition: '餐後不要立刻回家，留一段收尾散步',
      estimatedCost: 'NT$ 1,200–1,800',
    },
    {
      period: '晚間收尾',
      place: '附近街區',
      headline: '夜間散步收尾',
      narrative:
        '牽手慢慢走，聊今天最喜歡的瞬間。用輕鬆的語氣確認彼此今天都開心，比急著結束更加分。',
      purpose: '溫柔收尾，避免約會「突然斷掉」',
      conversationCue: '今天我最喜歡的，是你跟我說的哪一句話。',
      estimatedCost: 'NT$ 150–250',
    },
  ],
  aiReminders: ['記得提前訂位', '可以準備一張手寫小卡片', '避免聊工作壓力'],
  partnerLines: ['我很期待今天，因為是跟你一起。', '剛剛那段散步，我想再跟你多走一會。'],
  rainPlan: '改到室內文創市集＋甜點店，一樣保留聊天與拍照節奏',
  tiredPlan: '若對方累了，晚餐後直接買甜點回家，輕鬆看一部短片收尾',
  budgetTier: '$$',
  estimatedTotal: 'NT$ 2,200–2,800（兩人）',
  budgetBreakdown: [
    { label: '下午 · 咖啡', amount: 'NT$ 350–500' },
    { label: '傍晚 · 散步（點心）', amount: 'NT$ 120–200' },
    { label: '晚餐 · 氣氛餐廳', amount: 'NT$ 1,200–1,800' },
    { label: '交通（捷運＋計程車）', amount: 'NT$ 150–300' },
    { label: '小驚喜 · 甜點', amount: 'NT$ 150–250' },
  ],
  budgetNote: '以上為台北都會區一般行情，不含住宿；餐廳酒水另計',
  outfit: '淺色上衣＋好走的鞋，傍晚拍照會很上鏡',
  surprise: '在咖啡館先點對方想試的飲品，說「這杯是給你的」',
  tips: ['記得提前訂位', '可以準備一張手寫小卡片'],
  budget: 'NT$ 2,200–2,800（兩人）',
};

export const SHOWCASE_DATE_AI_RECORD: SavedDateItineraryAi = {
  savedAt: new Date().toISOString(),
  dateKey: todayKey(),
  suggestion: {
    id: 'showcase-date-idea',
    title: '週末城市漫遊',
    emoji: '✨',
    description: '輕鬆走走 · 好吃好拍',
    scenario: 'urban',
    cost: 'mid',
    duration: 'full',
    tags: ['food', 'walk'],
  },
  plan: SHOWCASE_DATE_PLAN,
  settings: {
    departure: '台北車站',
    budget: 'mid',
    customBudget: '',
    transport: 'transit',
    style: 'romantic',
    partnerPrefs: '喜歡安靜、不趕行程',
  },
};
