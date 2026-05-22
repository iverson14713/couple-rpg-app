import { memo } from 'react';
import { REMINDER_OFFSET_OPTIONS, type ReminderOffsetDays } from '../storage/importantDateReminderTypes';

const BTN_BASE =
  'inline-flex min-h-[36px] w-full items-center justify-center rounded-lg border px-2 py-2 text-[11px] font-semibold leading-tight transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.96]';

type Props = {
  selected: ReminderOffsetDays[];
  onToggle: (offset: ReminderOffsetDays) => void;
};

function ReminderOffsetPickerInner({ selected, onToggle }: Props) {
  const selectedSet = new Set(selected);

  return (
    <div className="grid grid-cols-3 gap-2">
      {REMINDER_OFFSET_OPTIONS.map((o) => {
        const active = selectedSet.has(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o.value)}
            className={`${BTN_BASE} ${
              active
                ? 'border-rose-400 bg-rose-500 text-white'
                : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export const ReminderOffsetPicker = memo(ReminderOffsetPickerInner);
