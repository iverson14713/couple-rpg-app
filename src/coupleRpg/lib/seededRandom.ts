/** Deterministic PRNG from string seed (same seed → same sequence). */
export function createSeededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickCountForDay(dateKey: string, min: number, max: number): number {
  const rand = createSeededRandom(`${dateKey}-count`);
  return min + Math.floor(rand() * (max - min + 1));
}

export function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  const rand = createSeededRandom(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
