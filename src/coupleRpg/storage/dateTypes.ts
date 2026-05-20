export type DateFilterKey =
  | 'budget'
  | 'romantic'
  | 'indoor'
  | 'outdoor'
  | 'food'
  | 'relax'
  | 'rainy'
  | 'halfDay'
  | 'fullDay';

export type DateCost = 'low' | 'mid' | 'high';
export type DateDuration = '1h' | 'half' | 'full';

export type DateFilters = Record<DateFilterKey, boolean>;

export type DateIdeaTemplate = {
  id: string;
  title: string;
  emoji: string;
  tags: DateFilterKey[];
  cost: DateCost;
  duration: DateDuration;
  description: string;
  scenario: string;
};

export type DateSuggestion = DateIdeaTemplate & {
  instanceId: string;
  generatedAt: string;
  completed: boolean;
};

export type DateHistoryEntry = {
  id: string;
  ideaId: string;
  title: string;
  emoji: string;
  date: string;
  time: string;
  cost: DateCost;
  duration: DateDuration;
};

export type DatePlannerData = {
  filters: DateFilters;
  favoriteIds: string[];
  current: DateSuggestion | null;
  history: DateHistoryEntry[];
};

export const DEFAULT_DATE_FILTERS = (): DateFilters => ({
  budget: false,
  romantic: false,
  indoor: false,
  outdoor: false,
  food: false,
  relax: false,
  rainy: false,
  halfDay: false,
  fullDay: false,
});
