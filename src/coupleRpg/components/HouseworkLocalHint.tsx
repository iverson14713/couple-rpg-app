import { lq } from '../theme';

export function HouseworkLocalHint() {
  return (
    <p className={`mb-2.5 px-0.5 text-[11px] font-semibold leading-snug ${lq.textMuted}`}>
      <span aria-hidden>📱</span> 本機家事 · 動態共享
    </p>
  );
}
