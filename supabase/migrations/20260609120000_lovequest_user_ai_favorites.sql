-- LoveQuest: per-user AI record favorites (cross-device; survives logout)

create table if not exists public.user_ai_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  record_id text not null,
  created_at timestamptz not null default now(),
  constraint user_ai_favorites_record_id_nonempty check (char_length(trim(record_id)) > 0),
  constraint user_ai_favorites_user_record_unique unique (user_id, record_id)
);

create index if not exists user_ai_favorites_user_id_idx
  on public.user_ai_favorites (user_id);

create index if not exists user_ai_favorites_user_created_idx
  on public.user_ai_favorites (user_id, created_at desc);

alter table public.user_ai_favorites enable row level security;

drop policy if exists "user_ai_favorites_select_own" on public.user_ai_favorites;
create policy "user_ai_favorites_select_own"
  on public.user_ai_favorites for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_ai_favorites_insert_own" on public.user_ai_favorites;
create policy "user_ai_favorites_insert_own"
  on public.user_ai_favorites for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_ai_favorites_delete_own" on public.user_ai_favorites;
create policy "user_ai_favorites_delete_own"
  on public.user_ai_favorites for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, delete on table public.user_ai_favorites to authenticated;

-- Refresh PostgREST schema cache so clients see the new table immediately
notify pgrst, 'reload schema';
