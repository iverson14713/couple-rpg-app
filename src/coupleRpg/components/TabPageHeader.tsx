import { lq } from '../theme';

type Props = {
  emoji: string;
  title: string;
  subtitle?: string;
};

export function TabPageHeader({ emoji, title, subtitle }: Props) {
  return (
    <header className={`mb-4 px-0.5 ${subtitle ? 'pb-0' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span className={`h-11 w-11 ${lq.iconChip} ${lq.pageEmoji}`} aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0">
          <h1 className={lq.pageTitle}>{title}</h1>
          {subtitle ? <p className={`mt-0.5 ${lq.pageSubtitle}`}>{subtitle}</p> : null}
        </div>
      </div>
    </header>
  );
}
