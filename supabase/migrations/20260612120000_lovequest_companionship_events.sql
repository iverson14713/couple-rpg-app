-- LoveQuest: 陪伴一下 — lightweight couple companionship pings

create table if not exists public.companionship_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  local_id text not null,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  receiver_user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  constraint companionship_events_couple_local_unique unique (couple_id, local_id)
);

create index if not exists companionship_events_couple_created_idx
  on public.companionship_events (couple_id, created_at desc);

create index if not exists companionship_events_receiver_unseen_idx
  on public.companionship_events (couple_id, receiver_user_id, seen_at, created_at desc);

alter table public.companionship_events enable row level security;

drop policy if exists "companionship_events_select_member" on public.companionship_events;
create policy "companionship_events_select_member"
  on public.companionship_events for select to authenticated
  using (public.is_couple_member (couple_id));

drop policy if exists "companionship_events_insert_sender" on public.companionship_events;
create policy "companionship_events_insert_sender"
  on public.companionship_events for insert to authenticated
  with check (
    public.is_couple_member (couple_id)
    and sender_user_id = auth.uid ()
  );

drop policy if exists "companionship_events_update_receiver_seen" on public.companionship_events;
create policy "companionship_events_update_receiver_seen"
  on public.companionship_events for update to authenticated
  using (
    public.is_couple_member (couple_id)
    and receiver_user_id = auth.uid ()
  )
  with check (
    public.is_couple_member (couple_id)
    and receiver_user_id = auth.uid ()
  );

grant select, insert, update on table public.companionship_events to authenticated;
