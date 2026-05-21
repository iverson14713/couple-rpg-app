-- LoveQuest Step 4: extend food_options / food_decisions for dinner sync

-- ---------------------------------------------------------------------------
-- public.food_options
-- ---------------------------------------------------------------------------
alter table public.food_options add column if not exists local_id text;
alter table public.food_options add column if not exists name text;
alter table public.food_options add column if not exists emoji text;
alter table public.food_options add column if not exists is_active boolean not null default true;
alter table public.food_options add column if not exists created_by uuid references auth.users(id) on delete set null;

update public.food_options set local_id = coalesce(local_id, client_id) where local_id is null and client_id is not null;
update public.food_options set name = coalesce(name, label) where name is null;
update public.food_options set is_active = true where is_active is null;

alter table public.food_options drop constraint if exists food_options_couple_local_unique;
alter table public.food_options
  add constraint food_options_couple_local_unique unique (couple_id, local_id);

-- ---------------------------------------------------------------------------
-- public.food_decisions
-- ---------------------------------------------------------------------------
alter table public.food_decisions add column if not exists local_id text;
alter table public.food_decisions add column if not exists date_key text;
alter table public.food_decisions add column if not exists selected_food_name text;
alter table public.food_decisions add column if not exists selected_food_local_id text;
alter table public.food_decisions add column if not exists decided_at timestamptz;
alter table public.food_decisions add column if not exists decided_by uuid references auth.users(id) on delete set null;
alter table public.food_decisions add column if not exists note text;
alter table public.food_decisions add column if not exists updated_at timestamptz not null default timezone('utc', now());

update public.food_decisions set local_id = coalesce(local_id, client_id) where local_id is null and client_id is not null;
update public.food_decisions set date_key = coalesce(date_key, to_char(decision_date, 'YYYY-MM-DD')) where date_key is null;
update public.food_decisions set selected_food_name = coalesce(selected_food_name, label) where selected_food_name is null;
update public.food_decisions set decided_at = coalesce(decided_at, saved_at) where decided_at is null;
update public.food_decisions set decided_by = coalesce(decided_by, created_by) where decided_by is null and created_by is not null;

-- Keep one row per couple + date_key (newest updated_at / saved_at wins)
delete from public.food_decisions fd
using (
  select id
  from (
    select id,
      row_number() over (
        partition by couple_id, coalesce(date_key, to_char(decision_date, 'YYYY-MM-DD'))
        order by coalesce(updated_at, saved_at, created_at) desc nulls last
      ) as rn
    from public.food_decisions
  ) ranked
  where rn > 1
) dup
where fd.id = dup.id;

alter table public.food_decisions drop constraint if exists food_decisions_couple_date_key_unique;
alter table public.food_decisions
  add constraint food_decisions_couple_date_key_unique unique (couple_id, date_key);

create index if not exists food_decisions_couple_date_key_idx
  on public.food_decisions (couple_id, date_key);

drop trigger if exists food_decisions_set_updated_at on public.food_decisions;
create trigger food_decisions_set_updated_at
  before update on public.food_decisions
  for each row execute function public.lovequest_set_updated_at();
