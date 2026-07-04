-- LoveQuest: 今日小回憶（LoveBook Lite precursor）
-- Shared one memory per couple per day; Free 10 / Pro 30 new dates per month.

create table if not exists public.couple_daily_memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  memory_date date not null,
  content text,
  photo_path text,
  photo_width int,
  photo_height int,
  created_by uuid not null references auth.users (id) on delete cascade,
  last_edited_by uuid references auth.users (id) on delete set null,
  last_edited_at timestamptz,
  source_type text,
  source_id text,
  source_meta jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couple_daily_memories_couple_date_unique unique (couple_id, memory_date),
  constraint couple_daily_memories_content_length check (
    content is null or char_length(content) <= 200
  ),
  constraint couple_daily_memories_has_content check (
    deleted_at is not null
    or (content is not null and trim(content) <> '')
    or photo_path is not null
  )
);

create index if not exists couple_daily_memories_couple_date_idx
  on public.couple_daily_memories (couple_id, memory_date desc)
  where deleted_at is null;

create table if not exists public.couple_daily_memory_monthly_usage (
  couple_id uuid not null references public.couples (id) on delete cascade,
  year_month text not null,
  memory_count int not null default 0,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (couple_id, year_month)
);

alter table public.couple_daily_memories enable row level security;
alter table public.couple_daily_memory_monthly_usage enable row level security;

drop policy if exists "couple_daily_memories_select_member" on public.couple_daily_memories;
create policy "couple_daily_memories_select_member"
  on public.couple_daily_memories for select to authenticated
  using (public.is_couple_member (couple_id));

drop policy if exists "couple_daily_memories_insert_member" on public.couple_daily_memories;
create policy "couple_daily_memories_insert_member"
  on public.couple_daily_memories for insert to authenticated
  with check (
    public.is_couple_member (couple_id)
    and created_by = auth.uid ()
  );

drop policy if exists "couple_daily_memories_update_member" on public.couple_daily_memories;
create policy "couple_daily_memories_update_member"
  on public.couple_daily_memories for update to authenticated
  using (public.is_couple_member (couple_id))
  with check (public.is_couple_member (couple_id));

drop policy if exists "couple_daily_memory_usage_select_member" on public.couple_daily_memory_monthly_usage;
create policy "couple_daily_memory_usage_select_member"
  on public.couple_daily_memory_monthly_usage for select to authenticated
  using (public.is_couple_member (couple_id));

grant select, insert, update on table public.couple_daily_memories to authenticated;
grant select on table public.couple_daily_memory_monthly_usage to authenticated;

-- Migrate text-only notes if present
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'couple_daily_notes'
  ) then
    insert into public.couple_daily_memories (
      couple_id, memory_date, content, created_by, is_favorite, created_at, updated_at
    )
    select
      n.couple_id,
      n.note_date,
      n.content,
      n.created_by,
      coalesce(n.is_favorite, false),
      n.created_at,
      n.updated_at
    from public.couple_daily_notes n
    on conflict (couple_id, memory_date) do nothing;

    insert into public.couple_daily_memory_monthly_usage (couple_id, year_month, memory_count)
    select
      m.couple_id,
      to_char(m.memory_date, 'YYYY-MM'),
      count(*)::int
    from public.couple_daily_memories m
    where m.deleted_at is null
    group by m.couple_id, to_char(m.memory_date, 'YYYY-MM')
    on conflict (couple_id, year_month) do update
      set memory_count = greatest(
        public.couple_daily_memory_monthly_usage.memory_count,
        excluded.memory_count
      );
  end if;
end $$;

create or replace function public.get_couple_daily_memory_quota (
  p_couple_id uuid,
  p_year_month text,
  p_is_pro boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int := 0;
  v_limit int;
begin
  if auth.uid () is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_member (p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  v_limit := case when p_is_pro then 30 else 10 end;

  select coalesce(u.memory_count, 0)
  into v_used
  from public.couple_daily_memory_monthly_usage u
  where u.couple_id = p_couple_id
    and u.year_month = p_year_month;

  return jsonb_build_object(
    'yearMonth', p_year_month,
    'used', coalesce(v_used, 0),
    'limit', v_limit,
    'remaining', greatest(v_limit - coalesce(v_used, 0), 0)
  );
end;
$$;

create or replace function public.upsert_couple_daily_memory (
  p_couple_id uuid,
  p_memory_date date,
  p_content text default null,
  p_photo_path text default null,
  p_photo_width int default null,
  p_photo_height int default null,
  p_source_type text default null,
  p_source_id text default null,
  p_source_meta jsonb default '{}'::jsonb,
  p_is_pro boolean default false,
  p_clear_photo boolean default false
)
returns public.couple_daily_memories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text;
  v_row public.couple_daily_memories;
  v_existing public.couple_daily_memories;
  v_year_month text;
  v_used int;
  v_limit int;
  v_photo_path text;
  v_photo_width int;
  v_photo_height int;
begin
  if auth.uid () is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_member (p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  v_content := nullif(trim(coalesce(p_content, '')), '');
  if v_content is not null and char_length(v_content) > 200 then
    raise exception 'content_too_long';
  end if;

  select * into v_existing
  from public.couple_daily_memories m
  where m.couple_id = p_couple_id
    and m.memory_date = p_memory_date
    and m.deleted_at is null
  for update;

  if v_existing.id is not null then
    if p_clear_photo then
      v_photo_path := null;
      v_photo_width := null;
      v_photo_height := null;
    elsif p_photo_path is not null then
      v_photo_path := p_photo_path;
      v_photo_width := p_photo_width;
      v_photo_height := p_photo_height;
    else
      v_photo_path := v_existing.photo_path;
      v_photo_width := v_existing.photo_width;
      v_photo_height := v_existing.photo_height;
    end if;

    if v_content is null and v_photo_path is null then
      raise exception 'empty_content';
    end if;

    update public.couple_daily_memories
    set
      content = v_content,
      photo_path = v_photo_path,
      photo_width = v_photo_width,
      photo_height = v_photo_height,
      last_edited_by = auth.uid (),
      last_edited_at = timezone('utc', now()),
      updated_at = timezone('utc', now()),
      source_type = coalesce(p_source_type, source_type),
      source_id = coalesce(p_source_id, source_id),
      source_meta = case
        when p_source_meta is null or p_source_meta = '{}'::jsonb then source_meta
        else p_source_meta
      end
    where id = v_existing.id
    returning * into v_row;

    return v_row;
  end if;

  v_photo_path := case when p_clear_photo then null else p_photo_path end;
  v_photo_width := case when p_clear_photo then null else p_photo_width end;
  v_photo_height := case when p_clear_photo then null else p_photo_height end;

  if v_content is null and v_photo_path is null then
    raise exception 'empty_content';
  end if;

  v_year_month := to_char(p_memory_date, 'YYYY-MM');
  v_limit := case when p_is_pro then 30 else 10 end;

  insert into public.couple_daily_memory_monthly_usage (couple_id, year_month, memory_count)
  values (p_couple_id, v_year_month, 0)
  on conflict (couple_id, year_month) do nothing;

  select u.memory_count into v_used
  from public.couple_daily_memory_monthly_usage u
  where u.couple_id = p_couple_id
    and u.year_month = v_year_month
  for update;

  if coalesce(v_used, 0) >= v_limit then
    raise exception 'quota_exceeded';
  end if;

  insert into public.couple_daily_memories (
    couple_id,
    memory_date,
    content,
    photo_path,
    photo_width,
    photo_height,
    created_by,
    last_edited_by,
    last_edited_at,
    source_type,
    source_id,
    source_meta
  )
  values (
    p_couple_id,
    p_memory_date,
    v_content,
    v_photo_path,
    v_photo_width,
    v_photo_height,
    auth.uid (),
    auth.uid (),
    timezone('utc', now()),
    p_source_type,
    p_source_id,
    coalesce(p_source_meta, '{}'::jsonb)
  )
  returning * into v_row;

  update public.couple_daily_memory_monthly_usage
  set
    memory_count = memory_count + 1,
    updated_at = timezone('utc', now())
  where couple_id = p_couple_id
    and year_month = v_year_month;

  return v_row;
end;
$$;

revoke all on function public.get_couple_daily_memory_quota (uuid, text, boolean) from public;
grant execute on function public.get_couple_daily_memory_quota (uuid, text, boolean) to authenticated;

revoke all on function public.upsert_couple_daily_memory (
  uuid, date, text, text, int, int, text, text, jsonb, boolean, boolean
) from public;
grant execute on function public.upsert_couple_daily_memory (
  uuid, date, text, text, int, int, text, text, jsonb, boolean, boolean
) to authenticated;

-- Storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'couple-daily-memories',
  'couple-daily-memories',
  false,
  1048576,
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "couple_daily_memories_storage_select" on storage.objects;
create policy "couple_daily_memories_storage_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'couple-daily-memories'
    and public.is_couple_member ((storage.foldername (name))[1]::uuid)
  );

drop policy if exists "couple_daily_memories_storage_insert" on storage.objects;
create policy "couple_daily_memories_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'couple-daily-memories'
    and public.is_couple_member ((storage.foldername (name))[1]::uuid)
  );

drop policy if exists "couple_daily_memories_storage_update" on storage.objects;
create policy "couple_daily_memories_storage_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'couple-daily-memories'
    and public.is_couple_member ((storage.foldername (name))[1]::uuid)
  )
  with check (
    bucket_id = 'couple-daily-memories'
    and public.is_couple_member ((storage.foldername (name))[1]::uuid)
  );

drop policy if exists "couple_daily_memories_storage_delete" on storage.objects;
create policy "couple_daily_memories_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'couple-daily-memories'
    and public.is_couple_member ((storage.foldername (name))[1]::uuid)
  );
