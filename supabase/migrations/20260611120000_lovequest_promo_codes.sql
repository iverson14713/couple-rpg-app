-- LoveQuest: Pro promo / redemption codes (KOL, events, testing)

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  type text not null default 'pro',
  duration_days integer not null check (duration_days > 0),
  max_uses integer,
  used_count integer not null default 0,
  expires_at timestamptz,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint promo_codes_code_unique unique (code),
  constraint promo_codes_type_check check (type in ('pro'))
);

create index if not exists promo_codes_code_idx on public.promo_codes (code);

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  code text not null,
  redeemed_at timestamptz not null default timezone('utc', now()),
  granted_until timestamptz,
  constraint promo_redemptions_user_code_unique unique (promo_code_id, user_id)
);

create index if not exists promo_redemptions_user_id_idx on public.promo_redemptions (user_id);

create table if not exists public.user_pro_grants (
  user_id uuid primary key references auth.users (id) on delete cascade,
  granted_until timestamptz not null,
  source text not null default 'promo',
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.promo_codes enable row level security;
alter table public.promo_redemptions enable row level security;
alter table public.user_pro_grants enable row level security;

-- No client policies: promo tables are server-only (service role).
