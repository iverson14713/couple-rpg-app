type Props = {
  value: number | null;
};

export function LoveCrisisCountdown({ value }: Props) {
  return (
    <div className="lq-love-crisis-countdown">
      <div className="lq-love-crisis-countdown__heart" aria-hidden>
        💔
      </div>
      <p className="lq-love-crisis-countdown__label">一起修復</p>
      <p className="lq-love-crisis-countdown__number" key={value ?? 'go'}>
        {value == null || value <= 0 ? '開始！' : value}
      </p>
    </div>
  );
}
