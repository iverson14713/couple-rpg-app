-- LoveQuest: LoveCoin wallet + append-only transaction ledger (source of truth).
-- Balance is derived from couple_wallets (maintained by RPC on each transaction).

create table if not exists public.couple_wallets (
  couple_id uuid primary key references public.couples (id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  amount integer not null check (amount <> 0),
  tx_type text not null check (tx_type in ('earn', 'spend', 'adjust')),
  source text not null,
  title text,
  emoji text,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint coin_transactions_couple_idempotency unique (couple_id, idempotency_key)
);

create index if not exists coin_transactions_couple_created_idx
  on public.coin_transactions (couple_id, created_at desc);

create index if not exists couple_wallets_updated_at_idx
  on public.couple_wallets (updated_at desc);

drop trigger if exists couple_wallets_set_updated_at on public.couple_wallets;
create trigger couple_wallets_set_updated_at
  before update on public.couple_wallets
  for each row execute function public.lovequest_set_updated_at();

-- Atomic post with idempotency + insufficient balance check
create or replace function public.lovequest_post_coin_transaction(
  p_couple_id uuid,
  p_user_id uuid,
  p_amount integer,
  p_tx_type text,
  p_source text,
  p_idempotency_key text,
  p_title text default null,
  p_emoji text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.coin_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.coin_transactions;
  v_balance integer;
  v_row public.coin_transactions;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
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
  from public.coin_transactions
  where couple_id = p_couple_id and idempotency_key = p_idempotency_key;

  if found then
    return v_existing;
  end if;

  insert into public.couple_wallets (couple_id, balance)
  values (p_couple_id, 0)
  on conflict (couple_id) do nothing;

  select balance into v_balance
  from public.couple_wallets
  where couple_id = p_couple_id
  for update;

  if v_balance is null then
    v_balance := 0;
  end if;

  if p_amount < 0 and v_balance + p_amount < 0 then
    raise exception 'insufficient_balance';
  end if;

  insert into public.coin_transactions (
    couple_id,
    user_id,
    amount,
    tx_type,
    source,
    title,
    emoji,
    idempotency_key,
    metadata
  )
  values (
    p_couple_id,
    p_user_id,
    p_amount,
    p_tx_type,
    p_source,
    coalesce(p_title, ''),
    coalesce(p_emoji, ''),
    p_idempotency_key,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_row;

  update public.couple_wallets
  set balance = greatest(0, v_balance + p_amount),
      updated_at = timezone('utc', now())
  where couple_id = p_couple_id;

  return v_row;
end;
$$;

revoke all on function public.lovequest_post_coin_transaction(
  uuid, uuid, integer, text, text, text, text, text, jsonb
) from public;
grant execute on function public.lovequest_post_coin_transaction(
  uuid, uuid, integer, text, text, text, text, text, jsonb
) to authenticated;

alter table public.couple_wallets enable row level security;
alter table public.coin_transactions enable row level security;

drop policy if exists "couple_wallets_select_member" on public.couple_wallets;
create policy "couple_wallets_select_member"
  on public.couple_wallets for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "coin_transactions_select_member" on public.coin_transactions;
create policy "coin_transactions_select_member"
  on public.coin_transactions for select to authenticated
  using (public.is_couple_member(couple_id));

grant select on table public.couple_wallets to authenticated;
grant select on table public.coin_transactions to authenticated;
