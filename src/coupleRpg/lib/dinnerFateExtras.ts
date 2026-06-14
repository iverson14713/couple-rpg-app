const DINNER_FATE_QUIPS = [
  '再不決定，店家都快打烊了。',
  '今天宇宙的答案是這個。',
  '你們已經糾結太久了。',
  '命運說：別再滑手機了，快出門。',
  '這個答案，我幫你們蓋章了。',
  '再猶豫，外送費又要漲了。',
  '今晚就相信這張命運卡吧。',
  '糾結星人退散，答案來了。',
] as const;

export function pickDinnerFateQuip(): string {
  return DINNER_FATE_QUIPS[Math.floor(Math.random() * DINNER_FATE_QUIPS.length)]!;
}

export function quipForLabel(label: string): string {
  const idx = fateIndexForLabel(label) % DINNER_FATE_QUIPS.length;
  return DINNER_FATE_QUIPS[idx]!;
}

export function pickDinnerFateIndex(): number {
  return 82 + Math.floor(Math.random() * 17);
}

/** 依餐點名稱產生穩定的命運指數（已儲存結果用） */
export function fateIndexForLabel(label: string): number {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash + label.charCodeAt(i) * 17) % 20;
  }
  return 78 + hash;
}
