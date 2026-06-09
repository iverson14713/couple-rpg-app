export type CompanionshipEvent = {
  id: string;
  coupleId: string;
  senderUserId: string;
  receiverUserId: string;
  type: string;
  message: string;
  createdAt: string;
  seenAt: string | null;
  source: 'local' | 'remote';
  /** local-only: seen 待同步 */
  seenPending?: boolean;
};

export type CompanionshipStats = {
  todayCount: number;
  streakDays: number;
};
