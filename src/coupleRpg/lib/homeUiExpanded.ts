import { LQ_KEYS } from '../storage/keys';

function loadFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function saveFlag(key: string, expanded: boolean): void {
  try {
    localStorage.setItem(key, expanded ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function loadHomeConsoleExpanded(): boolean {
  return loadFlag(LQ_KEYS.homeConsoleExpanded);
}

export function saveHomeConsoleExpanded(expanded: boolean): void {
  saveFlag(LQ_KEYS.homeConsoleExpanded, expanded);
}

export function loadHomeDatesExpanded(): boolean {
  return loadFlag(LQ_KEYS.homeDatesExpanded);
}

export function saveHomeDatesExpanded(expanded: boolean): void {
  saveFlag(LQ_KEYS.homeDatesExpanded, expanded);
}
