-- LoveQuest: couple activity log (今日動態) sync between partners

create table if not exists public.couple_activity_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  local_id text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_name text not null default '',
  action_type text not null,
  target_type text not null,
  target_title text,
  message text not null,
  date_key text not null,
  created_at timestamptz not null default now(),
  constraint couple_activity_logs_couple_local_unique unique (couple_id, local_id)
);

create index if not exists couple_activity_logs_couple_date_idx
  on public.couple_activity_logs (couple_id, date_key desc, created_at desc);

alter table public.couple_activity_logs enable row level security;

drop policy if exists "couple_activity_logs_select_member" on public.couple_activity_logs;
create policy "couple_activity_logs_select_member"
  on public.couple_activity_logs for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "couple_activity_logs_insert_member" on public.couple_activity_logs;
create policy "couple_activity_logs_insert_member"
  on public.couple_activity_logs for insert to authenticated
  with check (public.is_couple_member(couple_id));

grant select, insert on table public.couple_activity_logs to authenticated;
