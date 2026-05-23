/** 固定約會時間軸（不可重複、不可都用「晚上」）。 */
export const DATE_ITINERARY_TIMELINE_SLOTS = [
  { key: 'afternoon', label: '下午', icon: '☀️' },
  { key: 'dusk', label: '傍晚', icon: '🌅' },
  { key: 'dinner', label: '晚餐', icon: '🍽️' },
  { key: 'evening', label: '晚間收尾', icon: '🌙' },
] as const;

export type DateItineraryTimelineLabel = (typeof DATE_ITINERARY_TIMELINE_SLOTS)[number]['label'];

const PERIOD_ALIASES: { pattern: RegExp; label: DateItineraryTimelineLabel }[] = [
  { pattern: /^下午|afternoon/i, label: '下午' },
  { pattern: /^傍晚|黃昏|夕陽|dusk/i, label: '傍晚' },
  { pattern: /^晚餐|用餐|dinner/i, label: '晚餐' },
  { pattern: /^晚間|晚上|夜間|收尾|after/i, label: '晚間收尾' },
  { pattern: /^上午|早上|中午|morning|noon/i, label: '下午' },
];

export function canonicalDateItineraryPeriod(raw: string): DateItineraryTimelineLabel | null {
  const t = raw.trim();
  if (!t) return null;
  for (const { pattern, label } of PERIOD_ALIASES) {
    if (pattern.test(t)) return label;
  }
  if (t.includes('下午')) return '下午';
  if (t.includes('傍晚')) return '傍晚';
  if (t.includes('晚餐')) return '晚餐';
  if (t.includes('晚')) return '晚間收尾';
  return null;
}

export function timelineIconForPeriod(period: string): string {
  const label = canonicalDateItineraryPeriod(period) ?? period;
  return DATE_ITINERARY_TIMELINE_SLOTS.find((s) => s.label === label)?.icon ?? '💕';
}
