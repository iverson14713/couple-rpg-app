import { useState } from 'react';
import { HubShell } from '../components/HubShell';
import { AnniversariesPage } from './AnniversariesPage';
import { MemoriesPage } from './MemoriesPage';
import { lq } from '../theme';

const TABS = [
  { id: 'anniversaries', label: '紀念日', emoji: '🎀' },
  { id: 'timeline', label: '歷史', emoji: '📜' },
  { id: 'photos', label: '相簿', emoji: '📷' },
] as const;

type MemoriesSection = (typeof TABS)[number]['id'];

export function MemoriesHubPage() {
  const [section, setSection] = useState<MemoriesSection>('anniversaries');

  return (
    <HubShell
      emoji="📸"
      title="回憶"
      subtitle="紀念日 · 甜蜜時光 · 相簿"
      tabs={[...TABS]}
      active={section}
      onTabChange={(id) => setSection(id as MemoriesSection)}
    >
      {section === 'anniversaries' && <AnniversariesPage embedded />}
      {section === 'timeline' && <MemoriesPage embedded />}
      {section === 'photos' && <PhotosPlaceholder />}
    </HubShell>
  );
}

function PhotosPlaceholder() {
  return (
    <section className={`p-6 text-center ${lq.card}`}>
      <span className="text-4xl">📷</span>
      <h2 className="mt-2 text-sm font-bold text-stone-900">回憶相簿</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-stone-500">
        之後可上傳約會照片、紀念日合照，組成你們的時間軸。
      </p>
      <p className="mt-3 text-[11px] text-rose-500">敬請期待 ✨</p>
    </section>
  );
}
