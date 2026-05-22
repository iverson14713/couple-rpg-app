-- Reward cards: explicit owner + completed_by (user_id based, not nickname)

alter table public.reward_card_records
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.reward_card_records
  add column if not exists completed_by uuid references auth.users(id) on delete set null;

update public.reward_card_records
set owner_user_id = redeemed_by
where owner_user_id is null and redeemed_by is not null;

update public.reward_card_records
set completed_by = coalesce(target_user, used_by)
where completed_by is null
  and status = 'completed';
