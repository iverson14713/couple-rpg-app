-- LoveQuest: unified couple growth stats (LoveCoin, heart, bond, EXP, level) + transaction ledger.
-- Extends 20260602120000 coin wallet. Supabase is source of truth.

-- ===========================================================================
-- 1. Extend couple_wallets snapshot
-- ===========================================================================

alter table public.couple_wallets
  add column if not exists love_coin_balance integer,
  add column if not exists heart_value integer,
  add column if not exists bond_value integer,
  add column if not exists exp integer,
  add column if not exists level integer;

update public.couple_wallets
set
  love_coin_balance = coalesce(love_coin_balance, balance, 0),
  heart_value = coalesce(heart_value, 50),
  bond_value = coalesce(bond_value, 60),
  exp = coalesce(exp, 0),
  level = coalesce(level, greatest(1, floor(coalesce(exp, 0) / 100) + 1))
where love_coin_balance is null
   or heart_value is null
   or bond_value is null
   or exp is null
   or level is null;

alter table public.couple_wallets
  alter column love_coin_balance set default 0,
  alter column heart_value set default 50,
  alter column bond_value set default 60,
  alter column exp set default 0,
  alter column level set default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'couple_wallets_love_coin_nonneg'
  ) then
    alter table public.couple_wallets
      add constraint couple_wallets_love_coin_nonneg check (love_coin_balance >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'couple_wallets_heart_range'
  ) then
    alter table public.couple_wallets
      add constraint couple_wallets_heart_range check (heart_value >= 0 and heart_value <= 100);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'couple_wallets_bond_range'
  ) then
    alter table public.couple_wallets
      add constraint couple_wallets_bond_range check (bond_value >= 0 and bond_value <= 100);
  end if;
end $$;

-- ===========================================================================
-- 2. Growth transaction ledger (replaces coin-only log for new writes)
-- ===========================================================================

create table if not exists public.couple_growth_transactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  tx_type text not null check (tx_type in ('earn', 'spend', 'adjust')),
  source text not null,
  note text,
  idempotency_key text not null,
  love_coin_delta integer not null default 0,
  heart_delta integer not null default 0,
  bond_delta integer not null default 0,
  exp_delta integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint couple_growth_transactions_idempotency unique (couple_id, idempotency_key)
);

create index if not exists couple_growth_transactions_couple_created_idx
  on public.couple_growth_transactions (couple_id, created_at desc);

-- Backfill from legacy coin_transactions if present
insert into public.couple_growth_transactions (
  couple_id,
  user_id,
  tx_type,
  source,
  note,
  idempotency_key,
  love_coin_delta,
  heart_delta,
  bond_delta,
  exp_delta,
  metadata,
  created_at
)
select
  ct.couple_id,
  ct.user_id,
  ct.tx_type,
  ct.source,
  coalesce(nullif(trim(ct.title), ''), ct.source),
  ct.idempotency_key,
  ct.amount,
  0,
  0,
  0,
  ct.metadata,
  ct.created_at
from public.coin_transactions ct
where not exists (
  select 1 from public.couple_growth_transactions g
  where g.couple_id = ct.couple_id and g.idempotency_key = ct.idempotency_key
);

-- ===========================================================================
-- 3. RPC: apply growth event (idempotent, updates wallet snapshot)
-- ===========================================================================

create or replace function public.lovequest_post_growth_event(
  p_couple_id uuid,
  p_user_id uuid,
  p_tx_type text,
  p_source text,
  p_idempotency_key text,
  p_note text default null,
  p_love_coin_delta integer default 0,
  p_heart_delta integer default 0,
  p_bond_delta integer default 0,
  p_exp_delta integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.couple_growth_transactions;
  v_wallet public.couple_wallets;
  v_love integer;
  v_heart integer;
  v_bond integer;
  v_exp integer;
  v_level integer;
  v_row public.couple_growth_transactions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;
  if p_tx_type not in ('earn', 'spend', 'adjust') then
    raise exception 'invalid_tx_type';
  end if;
  if length(trim(coalesce(p_idempotency_key, ''))) = 0 then
    raise exception 'missing_idempotency_key';
  end if;

  if p_love_coin_delta = 0 and p_heart_delta = 0 and p_bond_delta = 0 and p_exp_delta = 0 then
    raise exception 'empty_growth_delta';
  end if;

  select * into v_existing
  from public.couple_growth_transactions
  where couple_id = p_couple_id and idempotency_key = p_idempotency_key;

  if found then
    select * into v_wallet from public.couple_wallets where couple_id = p_couple_id;
    return jsonb_build_object(
      'transaction', to_jsonb(v_existing),
      'wallet', to_jsonb(v_wallet),
      'duplicate', true
    );
  end if;

  insert into public.couple_wallets (couple_id, balance, love_coin_balance, heart_value, bond_value, exp, level)
  values (p_couple_id, 0, 0, 50, 60, 0, 1)
  on conflict (couple_id) do nothing;

  select * into v_wallet
  from public.couple_wallets
  where couple_id = p_couple_id
  for update;

  v_love := coalesce(v_wallet.love_coin_balance, v_wallet.balance, 0);
  v_heart := coalesce(v_wallet.heart_value, 50);
  v_bond := coalesce(v_wallet.bond_value, 60);
  v_exp := coalesce(v_wallet.exp, 0);

  if p_love_coin_delta < 0 and v_love + p_love_coin_delta < 0 then
    raise exception 'insufficient_love_coin';
  end if;

  v_love := greatest(0, v_love + p_love_coin_delta);
  v_heart := least(100, greatest(0, v_heart + p_heart_delta));
  v_bond := least(100, greatest(0, v_bond + p_bond_delta));
  v_exp := greatest(0, v_exp + p_exp_delta);
  v_level := greatest(1, floor(v_exp / 100)::integer + 1);

  insert into public.couple_growth_transactions (
    couple_id,
    user_id,
    tx_type,
    source,
    note,
    idempotency_key,
    love_coin_delta,
    heart_delta,
    bond_delta,
    exp_delta,
    metadata
  )
  values (
    p_couple_id,
    p_user_id,
    p_tx_type,
    p_source,
    coalesce(p_note, ''),
    p_idempotency_key,
    p_love_coin_delta,
    p_heart_delta,
    p_bond_delta,
    p_exp_delta,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  update public.couple_wallets
  set
    balance = v_love,
    love_coin_balance = v_love,
    heart_value = v_heart,
    bond_value = v_bond,
    exp = v_exp,
    level = v_level,
    updated_at = timezone('utc', now())
  where couple_id = p_couple_id;

  select * into v_wallet from public.couple_wallets where couple_id = p_couple_id;

  return jsonb_build_object(
    'transaction', to_jsonb(v_row),
    'wallet', to_jsonb(v_wallet),
    'duplicate', false
  );
end;
$$;

-- One-time: import full local RPG snapshot when cloud wallet is empty
create or replace function public.lovequest_init_growth_from_local(
  p_couple_id uuid,
  p_user_id uuid,
  p_love_coin integer,
  p_heart integer,
  p_bond integer,
  p_exp integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_level integer;
  v_wallet public.couple_wallets;
begin
  if auth.uid() is null or not public.is_couple_member(p_couple_id) then
    raise exception 'not_allowed';
  end if;

  select count(*)::integer into v_count
  from public.couple_growth_transactions
  where couple_id = p_couple_id;

  if v_count > 0 then
    return jsonb_build_object('skipped', true, 'reason', 'already_has_history');
  end if;

  v_level := greatest(1, floor(greatest(0, p_exp) / 100)::integer + 1);

  insert into public.couple_wallets (
    couple_id, balance, love_coin_balance, heart_value, bond_value, exp, level
  )
  values (
    p_couple_id,
    greatest(0, p_love_coin),
    greatest(0, p_love_coin),
    least(100, greatest(0, p_heart)),
    least(100, greatest(0, p_bond)),
    greatest(0, p_exp),
    v_level
  )
  on conflict (couple_id) do update set
    balance = excluded.love_coin_balance,
    love_coin_balance = excluded.love_coin_balance,
    heart_value = excluded.heart_value,
    bond_value = excluded.bond_value,
    exp = excluded.exp,
    level = excluded.level,
    updated_at = timezone('utc', now());

  insert into public.couple_growth_transactions (
    couple_id,
    user_id,
    tx_type,
    source,
    note,
    idempotency_key,
    love_coin_delta,
    heart_delta,
    bond_delta,
    exp_delta,
    metadata
  )
  values (
    p_couple_id,
    p_user_id,
    'adjust',
    'migration',
    '本機成長數值匯入',
    p_idempotency_key,
    0,
    0,
    0,
    0,
    jsonb_build_object(
      'snapshot', jsonb_build_object(
        'love_coin', greatest(0, p_love_coin),
        'heart', least(100, greatest(0, p_heart)),
        'bond', least(100, greatest(0, p_bond)),
        'exp', greatest(0, p_exp),
        'level', v_level
      )
    )
  );

  select * into v_wallet from public.couple_wallets where couple_id = p_couple_id;

  return jsonb_build_object('wallet', to_jsonb(v_wallet), 'skipped', false);
end;
$$;

revoke all on function public.lovequest_post_growth_event(
  uuid, uuid, text, text, text, text, integer, integer, integer, integer, jsonb
) from public;
grant execute on function public.lovequest_post_growth_event(
  uuid, uuid, text, text, text, text, integer, integer, integer, integer, jsonb
) to authenticated;

revoke all on function public.lovequest_init_growth_from_local(
  uuid, uuid, integer, integer, integer, integer, text
) from public;
grant execute on function public.lovequest_init_growth_from_local(
  uuid, uuid, integer, integer, integer, integer, text
) to authenticated;

alter table public.couple_growth_transactions enable row level security;

drop policy if exists "couple_growth_transactions_select_member" on public.couple_growth_transactions;
create policy "couple_growth_transactions_select_member"
  on public.couple_growth_transactions for select to authenticated
  using (public.is_couple_member(couple_id));

grant select on table public.couple_growth_transactions to authenticated;
