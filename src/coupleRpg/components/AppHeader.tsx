import { useLoveQuest } from '../context/LoveQuestContext';
import { NicknameSetupBanner } from './NicknameSetupBanner';
import { APP_NAME, APP_NAME_EN, lq } from '../theme';

type Props = {
  dateLabel: string;
};

export function AppHeader({ dateLabel }: Props) {
  const { couple } = useLoveQuest();
  return (
    <>
    <NicknameSetupBanner compact />
    <header className={`mb-4 p-4 ${lq.card}`}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 text-2xl shadow-inner">
          💕
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-stone-900">{APP_NAME}</h1>
          <p className="text-[11px] font-medium tracking-wide text-stone-400">{APP_NAME_EN}</p>
          <p className="mt-0.5 truncate text-xs text-stone-600">
            {couple.emojiA} {couple.nameA} · {couple.emojiB} {couple.nameB} · {dateLabel}
          </p>
        </div>
      </div>
    </header>
    </>
  );
}
