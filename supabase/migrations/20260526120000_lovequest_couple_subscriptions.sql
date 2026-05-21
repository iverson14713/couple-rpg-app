-- LoveQuest: couple-space shared subscription (one plan per couple)

create table if not exists public.couple_subscriptions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  billing_owner uuid references auth.users(id) on delete set null,
  provider text default 'manual',
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint couple_subscriptions_couple_id_unique unique (couple_id),
  constraint couple_subscriptions_plan_check check (plan in ('free', 'pro')),
  constraint couple_subscriptions_status_check check (
    status in ('active', 'trialing', 'cancelled', 'expired')
  )
);

create index if not exists couple_subscriptions_couple_id_idx on public.couple_subscriptions (couple_id);
create index if not exists couple_subscriptions_plan_idx on public.couple_subscriptions (couple_id, plan);

create or replace function public.set_couple_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists couple_subscriptions_updated_at on public.couple_subscriptions;
create trigger couple_subscriptions_updated_at
  before update on public.couple_subscriptions
  for each row execute function public.set_couple_subscriptions_updated_at();

alter table public.couple_subscriptions enable row level security;

drop policy if exists "couple_subscriptions_select_member" on public.couple_subscriptions;
create policy "couple_subscriptions_select_member"
  on public.couple_subscriptions for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "couple_subscriptions_insert_member" on public.couple_subscriptions;
create policy "couple_subscriptions_insert_member"
  on public.couple_subscriptions for insert to authenticated
  with check (public.is_couple_member(couple_id));

drop policy if exists "couple_subscriptions_update_member" on public.couple_subscriptions;
create policy "couple_subscriptions_update_member"
  on public.couple_subscriptions for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

grant select, insert, update on table public.couple_subscriptions to authenticated;
