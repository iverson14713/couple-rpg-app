import type { DailyMemoryPromptRequest } from '../storage/dailyNotesTypes';

/** Decouples LoveQuest events from Daily Memory prompt UI. */

type DailyMemoryPromptListener = (request: DailyMemoryPromptRequest) => void;

let listener: DailyMemoryPromptListener | null = null;

export function setDailyNotePromptListener(next: DailyMemoryPromptListener | null): void {
  listener = next;
}

export function requestDailyNotePrompt(request: DailyMemoryPromptRequest | string): void {
  if (typeof request === 'string') {
    listener?.({ noteDate: request, sourceType: 'love_task' });
    return;
  }
  listener?.(request);
}
