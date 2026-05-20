import { lq } from '../theme';

type Props = {
  emoji: string;
  title: string;
  subtitle?: string;
};

export function TabPageHeader({ emoji, title, subtitle }: Props) {
  return (
    <header className={`mb-3 px-1 ${subtitle ? 'pb-0' : ''}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          {emoji}
        </span>
        <div>
          <h1 className="text-lg font-bold text-stone-900">{title}</h1>
          {subtitle ? <p className="text-[12px] text-stone-500">{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}
