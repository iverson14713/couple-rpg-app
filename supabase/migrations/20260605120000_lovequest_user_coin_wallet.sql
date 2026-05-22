-- LoveQuest Phase 1: per-user LoveCoin wallet (balance + ledger).
-- Couple growth (heart, bond, exp, level) stays on couple_wallets — unchanged in this phase.

-- ===========================================================================
-- 1. Tables
-- ===========================================================================

create table if not exists public.user_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  love_coin_balance integer not null default 0 check (love_coin_balance >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  couple_id uuid not null references public.couples (id) on delete cascade,
  amount integer not null check (amount <> 0),
  tx_type text not null check (tx_type in ('earn', 'spend', 'adjust')),
  source text not null,
  note text,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint user_coin_transactions_user_idempotency unique (user_id, idempotency_key)
);

create index if not exists user_coin_transactions_couple_created_idx
  on public.user_coin_transactions (couple_id, created_at desc);

create index if not exists user_coin_transactions_user_created_idx
  on public.user_coin_transactions (user_id, created_at desc);

drop trigger if exists user_wallets_set_updated_at on public.user_wallets;
create trigger user_wallets_set_updated_at
  before update on public.user_wallets
  for each row execute function public.lovequest_set_updated_at();

comment on table public.user_wallets is 'Per-user LoveCoin balance (source of truth for coins).';
comment on column public.couple_wallets.love_coin_balance is 'DEPRECATED Phase 1: use user_wallets; no longer updated by RPC.';
comment on column public.couple_wallets.balance is 'DEPRECATED Phase 1: legacy alias of couple-level coin; frozen.';

-- ===========================================================================
-- 2. Migrate historical ledger → user_wallets
-- ===========================================================================

insert into public.user_wallets (user_id, love_coin_balance, updated_at)
select
  g.user_id,
  greatest(0, sum(g.love_coin_delta)::integer),
  timezone('utc', now())
from public.couple_growth_transactions g
where g.user_id is not null
group by g.user_id
having sum(g.love_coin_delta) <> 0
on conflict (user_id) do update
set
  love_coin_balance = greatest(
    public.user_wallets.love_coin_balance,
    excluded.love_coin_balance
  ),
  updated_at = timezone('utc', now());

-- Legacy coin_transactions (pre-growth table)
insert into public.user_wallets (user_id, love_coin_balance, updated_at)
select
  ct.user_id,
  greatest(0, sum(ct.amount)::integer),
  timezone('utc', now())
from public.coin_transactions ct
where ct.user_id is not null
group by ct.user_id
on conflict (user_id) do update
set
  love_coin_balance = greatest(
    public.user_wallets.love_coin_balance,
    excluded.love_coin_balance
  ),
  updated_at = timezone('utc', now());

-- Backfill user_coin_transactions from growth ledger (idempotent keys per user)
insert into public.user_coin_transactions (
  user_id,
  couple_id,
  amount,
  tx_type,
  source,
  note,
  idempotency_key,
  metadata,
  created_at
)
select
  g.user_id,
  g.couple_id,
  g.love_coin_delta,
  g.tx_type,
  g.source,
  nullif(trim(coalesce(g.note, '')), ''),
  g.idempotency_key,
  coalesce(g.metadata, '{}'::jsonb),
  g.created_at
from public.couple_growth_transactions g
where g.user_id is not null
  and g.love_coin_delta <> 0
on conflict (user_id, idempotency_key) do nothing;

-- ===========================================================================
-- 3. RPC: post user coin transaction
-- ===========================================================================

create or replace function public.lovequest_post_user_coin_transaction(
  p_user_id uuid,
  p_couple_id uuid,
  p_amount integer,
  p_tx_type text,
  p_source text,
  p_idempotency_key text,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.user_coin_transactions;
  v_balance integer;
  v_wallet public.user_wallets;
  v_row public.user_coin_transactions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if auth.uid() is distinct from p_user_id then
    raise exception 'not_wallet_owner';
  end if;
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;
  if p_amount = 0 then
    raise exception 'invalid_amount';
  end if;
  if p_tx_type not in ('earn', 'spend', 'adjust') then
    raise exception 'invalid_tx_type';
  end if;
  if length(trim(coalesce(p_idempotency_key, ''))) = 0 then
    raise exception 'missing_idempotency_key';
  end if;

  select * into v_existing
  from public.user_coin_transactions
  where user_id = p_user_id and idempotency_key = p_idempotency_key;

  if found then
    select * into v_wallet from public.user_wallets where user_id = p_user_id;
    return jsonb_build_object(
      'transaction', to_jsonb(v_existing),
      'wallet', to_jsonb(v_wallet),
      'duplicate', true
    );
  end if;

  insert into public.user_wallets (user_id, love_coin_balance)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  select love_coin_balance into v_balance
  from public.user_wallets
  where user_id = p_user_id
  for update;

  if v_balance is null then
    v_balance := 0;
  end if;

  if p_amount < 0 and v_balance + p_amount < 0 then
    raise exception 'insufficient_balance';
  end if;

  insert into public.user_coin_transactions (
    user_id,
    couple_id,
    amount,
    tx_type,
    source,
    note,
    idempotency_key,
    metadata
  )
  values (
    p_user_id,
    p_couple_id,
    p_amount,
    p_tx_type,
    p_source,
    coalesce(p_note, ''),
    p_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  update public.user_wallets
  set love_coin_balance = greatest(0, v_balance + p_amount),
      updated_at = timezone('utc', now())
  where user_id = p_user_id
  returning * into v_wallet;

  return jsonb_build_object(
    'transaction', to_jsonb(v_row),
    'wallet', to_jsonb(v_wallet),
    'duplicate', false
  );
end;
$$;

-- One-time: import local LoveCoin for current user when cloud wallet empty
create or replace function public.lovequest_init_user_coin_from_local(
  p_user_id uuid,
  p_couple_id uuid,
  p_love_coin integer,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_wallet public.user_wallets;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    raise exception 'not_allowed';
  end if;
  if not public.is_couple_member(p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  select count(*)::integer into v_count
  from public.user_coin_transactions
  where user_id = p_user_id;

  if v_count > 0 then
    select * into v_wallet from public.user_wallets where user_id = p_user_id;
    return jsonb_build_object('skipped', true, 'reason', 'already_has_history', 'wallet', to_jsonb(v_wallet));
  end if;

  if greatest(0, p_love_coin) = 0 then
    insert into public.user_wallets (user_id, love_coin_balance)
    values (p_user_id, 0)
    on conflict (user_id) do nothing;
    select * into v_wallet from public.user_wallets where user_id = p_user_id;
    return jsonb_build_object('skipped', true, 'reason', 'zero_balance', 'wallet', to_jsonb(v_wallet));
  end if;

  return public.lovequest_post_user_coin_transaction(
    p_user_id,
    p_couple_id,
    greatest(0, p_love_coin),
    'adjust',
    'migration',
    p_idempotency_key,
    '本機 LoveCoin 匯入',
    jsonb_build_object('couple_id', p_couple_id)
  );
end;
$$;

-- ===========================================================================
-- 4. Stop couple wallet from mutating LoveCoin (growth RPC)
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
  v_coin_delta integer := 0;
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

  if p_love_coin_delta <> 0 then
    raise exception 'love_coin_use_user_wallet_rpc';
  end if;

  if p_heart_delta = 0 and p_bond_delta = 0 and p_exp_delta = 0 then
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
    v_coin_delta,
    p_heart_delta,
    p_bond_delta,
    p_exp_delta,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  update public.couple_wallets
  set
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

-- Couple init: no longer writes LoveCoin to couple_wallets
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
  v_coin jsonb;
begin
  if auth.uid() is null or not public.is_couple_member(p_couple_id) then
    raise exception 'not_allowed';
  end if;

  if auth.uid() is not null and p_user_id is not null and greatest(0, p_love_coin) > 0 then
    v_coin := public.lovequest_init_user_coin_from_local(
      coalesce(p_user_id, auth.uid()),
      p_couple_id,
      greatest(0, p_love_coin),
      p_idempotency_key || ':coin'
    );
  end if;

  select count(*)::integer into v_count
  from public.couple_growth_transactions
  where couple_id = p_couple_id
    and (heart_delta <> 0 or bond_delta <> 0 or exp_delta <> 0);

  if v_count > 0 then
    select * into v_wallet from public.couple_wallets where couple_id = p_couple_id;
    return jsonb_build_object(
      'wallet', to_jsonb(v_wallet),
      'skipped', true,
      'reason', 'already_has_growth_history',
      'user_coin', v_coin
    );
  end if;

  v_level := greatest(1, floor(greatest(0, p_exp) / 100)::integer + 1);

  insert into public.couple_wallets (
    couple_id, balance, love_coin_balance, heart_value, bond_value, exp, level
  )
  values (
    p_couple_id,
    0,
    0,
    least(100, greatest(0, p_heart)),
    least(100, greatest(0, p_bond)),
    greatest(0, p_exp),
    v_level
  )
  on conflict (couple_id) do update set
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
    '本機成長數值匯入（不含 LoveCoin）',
    p_idempotency_key || ':growth',
    0,
    0,
    0,
    0,
    jsonb_build_object(
      'snapshot', jsonb_build_object(
        'heart', least(100, greatest(0, p_heart)),
        'bond', least(100, greatest(0, p_bond)),
        'exp', greatest(0, p_exp),
        'level', v_level
      )
    )
  );

  select * into v_wallet from public.couple_wallets where couple_id = p_couple_id;

  return jsonb_build_object('wallet', to_jsonb(v_wallet), 'skipped', false, 'user_coin', v_coin);
end;
$$;

-- ===========================================================================
-- 5. RLS
-- ===========================================================================

alter table public.user_wallets enable row level security;
alter table public.user_coin_transactions enable row level security;

drop policy if exists "user_wallets_select_own" on public.user_wallets;
create policy "user_wallets_select_own"
  on public.user_wallets for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_coin_transactions_select_own" on public.user_coin_transactions;
create policy "user_coin_transactions_select_own"
  on public.user_coin_transactions for select to authenticated
  using (auth.uid() = user_id);

revoke all on function public.lovequest_post_user_coin_transaction(
  uuid, uuid, integer, text, text, text, text, jsonb
) from public;
grant execute on function public.lovequest_post_user_coin_transaction(
  uuid, uuid, integer, text, text, text, text, jsonb
) to authenticated;

revoke all on function public.lovequest_init_user_coin_from_local(
  uuid, uuid, integer, text
) from public;
grant execute on function public.lovequest_init_user_coin_from_local(
  uuid, uuid, integer, text
) to authenticated;

grant select on table public.user_wallets to authenticated;
grant select on table public.user_coin_transactions to authenticated;
