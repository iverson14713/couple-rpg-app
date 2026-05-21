-- LoveQuest Step 3: extend chores / chore_records for housework assignment sync

-- ---------------------------------------------------------------------------
-- public.chores
-- ---------------------------------------------------------------------------
alter table public.chores add column if not exists local_id text;
alter table public.chores add column if not exists title text;
alter table public.chores add column if not exists icon text;
alter table public.chores add column if not exists difficulty int not null default 1;
alter table public.chores add column if not exists is_default boolean not null default false;
alter table public.chores add column if not exists is_active boolean not null default true;
alter table public.chores add column if not exists created_by uuid references auth.users(id) on delete set null;

update public.chores set local_id = coalesce(local_id, client_id) where local_id is null and client_id is not null;
update public.chores set title = coalesce(title, label) where title is null;
update public.chores set icon = coalesce(icon, emoji) where icon is null;

alter table public.chores drop constraint if exists chores_couple_local_unique;
alter table public.chores
  add constraint chores_couple_local_unique unique (couple_id, local_id);

-- ---------------------------------------------------------------------------
-- public.chore_records
-- ---------------------------------------------------------------------------
alter table public.chore_records add column if not exists local_id text;
alter table public.chore_records add column if not exists chore_local_id text;
alter table public.chore_records add column if not exists title text;
alter table public.chore_records add column if not exists assigned_to uuid references auth.users(id) on delete set null;
alter table public.chore_records add column if not exists assigned_role text;
alter table public.chore_records add column if not exists assigned_name text;
alter table public.chore_records add column if not exists date_key text;
alter table public.chore_records add column if not exists status text not null default 'pending';
alter table public.chore_records add column if not exists rewarded boolean not null default false;
alter table public.chore_records add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.chore_records add column if not exists updated_at timestamptz not null default timezone('utc', now());
alter table public.chore_records add column if not exists note text;

update public.chore_records set local_id = coalesce(local_id, client_id) where local_id is null and client_id is not null;
update public.chore_records set title = coalesce(title, task_label) where title is null;
update public.chore_records set assigned_role = coalesce(assigned_role, partner_slot) where assigned_role is null;
update public.chore_records set chore_local_id = coalesce(chore_local_id, client_id) where chore_local_id is null and client_id is not null;
update public.chore_records set date_key = coalesce(date_key, to_char(completed_at at time zone 'utc', 'YYYY-MM-DD'))
  where date_key is null and completed_at is not null;
update public.chore_records set status = 'completed' where status = 'pending' and completed_at is not null;

alter table public.chore_records alter column completed_at drop not null;

alter table public.chore_records drop constraint if exists chore_records_status_check;
alter table public.chore_records
  add constraint chore_records_status_check check (
    status in ('pending', 'completed', 'skipped')
  );

alter table public.chore_records drop constraint if exists chore_records_couple_local_unique;
alter table public.chore_records
  add constraint chore_records_couple_local_unique unique (couple_id, local_id);

create index if not exists chore_records_couple_date_idx
  on public.chore_records (couple_id, date_key);

create or replace function public.set_chore_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists chore_records_set_updated_at on public.chore_records;
create trigger chore_records_set_updated_at
  before update on public.chore_records
  for each row execute function public.set_chore_records_updated_at();
