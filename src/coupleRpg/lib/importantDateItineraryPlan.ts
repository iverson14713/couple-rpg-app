import type { DateItineraryPlan } from './dateItineraryAiModel';
import type { ImportantDatePlan } from './importantDateAiModel';

export type SavedImportantDatePlan = ImportantDatePlan | DateItineraryPlan;

export function isSavedImportantItineraryPlan(
  plan: SavedImportantDatePlan | null | undefined
): plan is DateItineraryPlan {
  return Boolean(plan && Array.isArray((plan as DateItineraryPlan).segments));
}
