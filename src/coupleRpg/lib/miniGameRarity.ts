export type MiniGameRarity = 'common' | 'rare' | 'superRare' | 'legendary';

const RARITY_LABEL: Record<MiniGameRarity, string> = {
  common: '💚 普通',
  rare: '💙 稀有',
  superRare: '💜 超稀有',
  legendary: '💛 傳說',
};

/** 抽選結果顯示用稀有度（不寫入題庫或獎勵邏輯） */
export function rollMiniGameRarity(): MiniGameRarity {
  const r = Math.random() * 100;
  if (r < 2) return 'legendary';
  if (r < 10) return 'superRare';
  if (r < 30) return 'rare';
  return 'common';
}

export function formatRarityTaskLabel(rarity: MiniGameRarity): string {
  return `${RARITY_LABEL[rarity]}任務`;
}

export function rarityBadgeClass(rarity: MiniGameRarity): string {
  switch (rarity) {
    case 'legendary':
      return 'game-card-rarity--legendary';
    case 'superRare':
      return 'game-card-rarity--super-rare';
    case 'rare':
      return 'game-card-rarity--rare';
    default:
      return 'game-card-rarity--common';
  }
}
