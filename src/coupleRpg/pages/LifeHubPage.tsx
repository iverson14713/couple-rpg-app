import { useState } from 'react';
import { HubShell } from '../components/HubShell';
import { DinnerPage } from './DinnerPage';
import { HouseworkPage } from './HouseworkPage';
import { DatesPage } from './DatesPage';
import { lq } from '../theme';

const TABS = [
  { id: 'dinner', label: '晚餐', emoji: '🍽️' },
  { id: 'housework', label: '家事', emoji: '🏠' },
  { id: 'dates', label: '約會', emoji: '💑' },
  { id: 'holiday', label: '假日', emoji: '🌴' },
] as const;

type LifeSection = (typeof TABS)[number]['id'];

export function LifeHubPage() {
  const [section, setSection] = useState<LifeSection>('dinner');

  return (
    <HubShell
      emoji="🍜"
      title="生活"
      subtitle="晚餐 · 家事 · 約會 · 假日行程"
      tabs={[...TABS]}
      active={section}
      onTabChange={(id) => setSection(id as LifeSection)}
    >
      {section === 'dinner' && <DinnerPage embedded />}
      {section === 'housework' && <HouseworkPage embedded />}
      {section === 'dates' && <DatesPage embedded />}
      {section === 'holiday' && <HolidayPlaceholder />}
    </HubShell>
  );
}

function HolidayPlaceholder() {
  return (
    <section className={`p-5 text-center ${lq.card}`}>
      <span className="text-4xl">🌴</span>
      <h2 className="mt-2 text-sm font-bold text-stone-900">假日行程建議</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
        依天氣與你們的默契度，推薦一日小旅行、郊遊或宅家約會組合。
      </p>
      <p className="mt-3 text-[11px] text-rose-500">下一版接上 · 敬請期待</p>
    </section>
  );
}
