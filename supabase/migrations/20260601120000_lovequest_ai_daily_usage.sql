-- LoveQuest: per-user daily AI usage (server increments; clients read own row)

create table if not exists public.lovequest_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used_count int not null default 0 check (used_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, usage_date)
);

create index if not exists lovequest_ai_daily_usage_date_idx
  on public.lovequest_ai_daily_usage (usage_date);

create or replace function public.set_lovequest_ai_daily_usage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lovequest_ai_daily_usage_updated_at on public.lovequest_ai_daily_usage;
create trigger lovequest_ai_daily_usage_updated_at
  before update on public.lovequest_ai_daily_usage
  for each row execute function public.set_lovequest_ai_daily_usage_updated_at();

alter table public.lovequest_ai_daily_usage enable row level security;

drop policy if exists "lovequest_ai_usage_select_self" on public.lovequest_ai_daily_usage;
create policy "lovequest_ai_usage_select_self"
  on public.lovequest_ai_daily_usage for select to authenticated
  using (auth.uid() = user_id);

grant select on table public.lovequest_ai_daily_usage to authenticated;
