-- LoveQuest: couple reward card records (redeem / use / complete sync)

create table if not exists public.reward_card_records (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  local_id text not null,
  card_id text not null,
  card_title text not null,
  card_type text,
  status text not null default 'redeemed',
  redeemed_by uuid references auth.users(id) on delete set null,
  used_by uuid references auth.users(id) on delete set null,
  target_user uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  used_at timestamptz,
  completed_at timestamptz,
  note text,
  cost integer not null default 0,
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_card_records_status_check check (
    status in ('redeemed', 'used', 'completed', 'cancelled')
  ),
  constraint reward_card_records_couple_local_unique unique (couple_id, local_id)
);

create index if not exists reward_card_records_couple_id_idx on public.reward_card_records (couple_id);
create index if not exists reward_card_records_status_idx on public.reward_card_records (couple_id, status);

create or replace function public.set_reward_card_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reward_card_records_updated_at on public.reward_card_records;
create trigger reward_card_records_updated_at
  before update on public.reward_card_records
  for each row execute function public.set_reward_card_records_updated_at();

alter table public.reward_card_records enable row level security;

drop policy if exists "reward_card_records_select_member" on public.reward_card_records;
create policy "reward_card_records_select_member"
  on public.reward_card_records for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "reward_card_records_insert_member" on public.reward_card_records;
create policy "reward_card_records_insert_member"
  on public.reward_card_records for insert to authenticated
  with check (public.is_couple_member(couple_id));

drop policy if exists "reward_card_records_update_member" on public.reward_card_records;
create policy "reward_card_records_update_member"
  on public.reward_card_records for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists "reward_card_records_delete_member" on public.reward_card_records;
create policy "reward_card_records_delete_member"
  on public.reward_card_records for delete to authenticated
  using (public.is_couple_member(couple_id));

grant select, insert, update, delete on table public.reward_card_records to authenticated;
