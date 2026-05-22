-- LoveQuest: personal reward cards (per-user wallet; not couple-synced)

create table if not exists public.user_reward_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete set null,
  local_id text not null,
  reward_id text not null,
  title text not null,
  cost integer not null default 0,
  status text not null default 'redeemed',
  redeemed_at timestamptz not null default now(),
  used_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  card_type text,
  emoji text,
  note text,
  description text,
  is_custom boolean not null default false,
  needs_partner_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reward_cards_status_check check (
    status in ('redeemed', 'used', 'completed', 'cancelled')
  ),
  constraint user_reward_cards_user_local_unique unique (user_id, local_id)
);

create index if not exists user_reward_cards_user_id_idx
  on public.user_reward_cards (user_id);

create index if not exists user_reward_cards_user_status_idx
  on public.user_reward_cards (user_id, status);

create or replace function public.set_user_reward_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_reward_cards_updated_at on public.user_reward_cards;
create trigger user_reward_cards_updated_at
  before update on public.user_reward_cards
  for each row execute function public.set_user_reward_cards_updated_at();

alter table public.user_reward_cards enable row level security;

drop policy if exists "user_reward_cards_select_own" on public.user_reward_cards;
create policy "user_reward_cards_select_own"
  on public.user_reward_cards for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_reward_cards_insert_own" on public.user_reward_cards;
create policy "user_reward_cards_insert_own"
  on public.user_reward_cards for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_reward_cards_update_own" on public.user_reward_cards;
create policy "user_reward_cards_update_own"
  on public.user_reward_cards for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_reward_cards_delete_own" on public.user_reward_cards;
create policy "user_reward_cards_delete_own"
  on public.user_reward_cards for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_reward_cards to authenticated;
