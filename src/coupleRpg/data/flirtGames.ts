import type { FlirtGameId } from '../storage/types';

export type { FlirtGameId };

export type FlirtGameDef = {
  id: FlirtGameId;
  title: string;
  emoji: string;
  description: string;
};

export const FLIRT_GAMES: FlirtGameDef[] = [
  { id: 'dice', title: '情侶骰子', emoji: '🎲', description: '擲骰獲得甜蜜小挑戰' },
  { id: 'truth', title: '真心話', emoji: '💬', description: '輪流回答暖心問題' },
  { id: 'coquettish', title: '撒嬌挑戰', emoji: '🥺', description: '可愛互動，笑場也沒關係' },
  { id: 'stare', title: '30 秒對視', emoji: '👀', description: '安靜看著彼此的眼睛' },
  { id: 'massage', title: '幫對方按摩', emoji: '💆', description: '輕柔肩頸放鬆 3 分鐘' },
];

export const DICE_ACTIONS = [
  '牽手 30 秒',
  '說一句真誠稱讚',
  '擁抱 10 秒',
  '一起拍一張合照',
  '幫對方倒一杯水',
  '分享今天最開心的事',
];

export const TRUTH_QUESTIONS = [
  '你最喜歡我們一起做的哪件事？',
  '你覺得我哪個小習慣最可愛？',
  '最近哪一刻讓你覺得很安心？',
  '如果週末只有兩小時，你想一起做什麼？',
  '你想對我說但還沒說的一句話是？',
  '我們第一次約會你印象最深的是？',
];

export const COQUETTISH_CHALLENGES = [
  '用可愛語氣說「謝謝你陪我」',
  '牽著對方手搖一搖，說「今天辛苦了」',
  '送對方一個擊掌，再說「你最棒」',
  '模仿卡通角色說「好想你喔」',
  '對著對方笑 5 秒，然後說「喜歡你」',
];

export const STARE_PROMPT = '面對面站好或坐下，安靜對視 30 秒。可以微笑，不要玩手機。';

export const MASSAGE_PROMPT = '請輕柔幫對方按摩肩膀與頸部約 3 分鐘，記得先問力道是否可以。';
