export type ActivityLogSource = 'local' | 'remote';

export type ActivityActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'redeem'
  | 'use'
  | 'complete'
  | 'sync'
  | 'upgrade';

export type ActivityTargetType =
  | 'couple_profile'
  | 'important_date'
  | 'reward_card'
  | 'chore'
  | 'dinner'
  | 'date_idea'
  | 'love_task'
  | 'mini_game'
  | 'pro_plan';

export type ActivityLogItem = {
  id: string;
  coupleId?: string | null;
  actorUserId?: string | null;
  actorName: string;
  actionType: ActivityActionType;
  targetType: ActivityTargetType;
  targetTitle?: string;
  message: string;
  createdAt: string;
  dateKey: string;
  source: ActivityLogSource;
};

export type ActivityLogInput = {
  coupleId?: string | null;
  actorUserId?: string | null;
  actorName?: string;
  actionType: ActivityActionType;
  targetType: ActivityTargetType;
  targetTitle?: string;
  message?: string;
  source?: ActivityLogSource;
};
