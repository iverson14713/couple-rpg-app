import type { EmotionType, LineInteractionType } from './loveCrisisTypes';

const SEQUENCES_4: EmotionType[][] = [
  ['listen', 'comfort', 'affirm', 'action'],
  ['calm', 'listen', 'comfort', 'affirm'],
  ['listen', 'comfort', 'calm', 'action'],
  ['comfort', 'listen', 'affirm', 'calm'],
  ['calm', 'comfort', 'listen', 'action'],
];

const SEQUENCES_5: EmotionType[][] = [
  ['listen', 'comfort', 'affirm', 'calm', 'action'],
  ['calm', 'listen', 'comfort', 'affirm', 'action'],
  ['listen', 'calm', 'comfort', 'affirm', 'action'],
  ['comfort', 'listen', 'calm', 'affirm', 'action'],
  ['calm', 'listen', 'affirm', 'comfort', 'action'],
];

const SEQUENCES_6: EmotionType[][] = [
  ['calm', 'listen', 'comfort', 'affirm', 'action', 'comfort'],
  ['listen', 'calm', 'comfort', 'affirm', 'action', 'affirm'],
  ['comfort', 'listen', 'calm', 'affirm', 'action', 'listen'],
];

const STORIES: string[] = [
  '他今天加班很累，你們有點冷戰。',
  '一句話說重了，氣氛突然僵住。',
  '你們忙到忘了說晚安。',
  '小誤會累積成沉默。',
  '他心情低落，卻不知道怎麼開口。',
  '你覺得被忽略，其實對方也在硬撐。',
  '計畫被打亂，彼此都有點煩。',
  '訊息已讀不回，心裡開始胡思亂想。',
  '紀念日差點忘記，你有點委屈。',
  '家務分工不均，誰都不想先開口。',
  '異地時差，聯繫變得斷斷續續。',
  '朋友聚會後，你覺得被冷落了一下。',
  '玩笑開過頭，氣氛瞬間尷尬。',
  '壓力太大，說話語氣變得衝。',
  '你想被擁抱，卻只收到一句「我很忙」。',
  '睡前小爭執，誰都不想先道歉。',
  '他忘了你提過的小事，你有點失望。',
  '你們都在等對方先靠近一步。',
  '今天運氣不好，情緒也跟著低落。',
  '愛還在，只是暫時卡住了。',
];

/** 數學角度池（0°=右、-90°=上），shuffle 後取用 */
const MASTER_ANGLE_POOL = [-90, -50, -25, 15, 40, 145, 200, 235, 260];

const MIN_ANGLE_SEPARATION = 28;
const MAX_DOWN_SIN = 0.72;

function seededUnit(seed: number, index: number): number {
  const x = Math.sin(seed * 9999.13 + index * 127.17) * 43758.5453;
  return x - Math.floor(x);
}

function fisherYatesShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seededUnit(seed, i) * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function angleTooLow(deg: number): boolean {
  const rad = (deg * Math.PI) / 180;
  return Math.sin(rad) > MAX_DOWN_SIN;
}

function minSeparation(angles: number[]): number {
  let min = 360;
  for (let i = 0; i < angles.length; i += 1) {
    for (let j = i + 1; j < angles.length; j += 1) {
      const diff = Math.abs(angles[i]! - angles[j]!);
      min = Math.min(min, diff, 360 - diff);
    }
  }
  return min;
}

export function distributeLineAngles(count: number, seed: number): number[] {
  const pool = fisherYatesShuffle(MASTER_ANGLE_POOL, seed);

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const shuffled = fisherYatesShuffle(pool, seed + attempt * 17);
    const picked = shuffled
      .filter((a) => !angleTooLow(a))
      .slice(0, count)
      .map((a) => a + (seededUnit(seed + attempt, a) * 10 - 5));

    if (picked.length === count && minSeparation(picked) >= MIN_ANGLE_SEPARATION) {
      return picked;
    }
  }

  return pool.filter((a) => !angleTooLow(a)).slice(0, count);
}

function assignInteractions(heartNumber: number, length: number): LineInteractionType[] {
  const types: LineInteractionType[] = Array.from({ length }, () => 'tap');

  if (heartNumber >= 3 && length >= 4) {
    const holdIdx = 1 + Math.floor(Math.random() * Math.max(1, length - 2));
    types[holdIdx] = 'hold';
  }

  if (heartNumber >= 5 && length >= 5) {
    let doubleIdx = Math.floor(Math.random() * length);
    let guard = 0;
    while (types[doubleIdx] !== 'tap' && guard < length) {
      doubleIdx = (doubleIdx + 1) % length;
      guard += 1;
    }
    if (types[doubleIdx] === 'tap') {
      types[doubleIdx] = 'double';
    }
  }

  return types;
}

export function getLineCountForHeart(heartNumber: number): number {
  if (heartNumber <= 2) return 4;
  if (heartNumber <= 4) return 5;
  return Math.random() < 0.5 ? 5 : 6;
}

export function buildHeartPuzzle(
  heartNumber: number,
  seed: number
): {
  story: string;
  sequence: EmotionType[];
  lines: { emotion: EmotionType; angle: number; interaction: LineInteractionType }[];
} {
  const lineCount = getLineCountForHeart(heartNumber);
  const pool = lineCount === 4 ? SEQUENCES_4 : lineCount === 5 ? SEQUENCES_5 : SEQUENCES_6;
  const sequence = [...pool[(seed + heartNumber) % pool.length]!];
  const story = STORIES[(seed + heartNumber * 3) % STORIES.length]!;
  const angles = distributeLineAngles(sequence.length, seed + heartNumber * 41);
  const interactions = assignInteractions(heartNumber, sequence.length);

  const lines = sequence.map((emotion, i) => ({
    emotion,
    angle: angles[i]!,
    interaction: interactions[i]!,
  }));

  return { story, sequence, lines };
}
