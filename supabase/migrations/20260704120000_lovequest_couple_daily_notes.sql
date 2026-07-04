-- LoveQuest: 今日一句話 — lightweight couple daily notes (LoveBook precursor)

create table if not exists public.couple_daily_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  note_date date not null,
  content text not null,
  is_favorite boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couple_daily_notes_content_length check (char_length(content) <= 120),
  constraint couple_daily_notes_content_not_blank check (trim(content) <> ''),
  constraint couple_daily_notes_couple_date_unique unique (couple_id, note_date)
);

create index if not exists couple_daily_notes_couple_date_idx
  on public.couple_daily_notes (couple_id, note_date desc);

alter table public.couple_daily_notes enable row level security;

drop policy if exists "couple_daily_notes_select_member" on public.couple_daily_notes;
create policy "couple_daily_notes_select_member"
  on public.couple_daily_notes for select to authenticated
  using (public.is_couple_member (couple_id));

drop policy if exists "couple_daily_notes_insert_member" on public.couple_daily_notes;
create policy "couple_daily_notes_insert_member"
  on public.couple_daily_notes for insert to authenticated
  with check (
    public.is_couple_member (couple_id)
    and created_by = auth.uid ()
  );

drop policy if exists "couple_daily_notes_update_member" on public.couple_daily_notes;
create policy "couple_daily_notes_update_member"
  on public.couple_daily_notes for update to authenticated
  using (public.is_couple_member (couple_id))
  with check (public.is_couple_member (couple_id));

grant select, insert, update on table public.couple_daily_notes to authenticated;

create or replace function public.upsert_couple_daily_note (
  p_couple_id uuid,
  p_note_date date,
  p_content text
)
returns public.couple_daily_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text;
  v_row public.couple_daily_notes;
begin
  if auth.uid () is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_couple_member (p_couple_id) then
    raise exception 'not_couple_member';
  end if;

  v_content := trim(p_content);

  if v_content = '' then
    raise exception 'empty_content';
  end if;

  if char_length(v_content) > 120 then
    raise exception 'content_too_long';
  end if;

  insert into public.couple_daily_notes (couple_id, created_by, note_date, content)
  values (p_couple_id, auth.uid (), p_note_date, v_content)
  on conflict (couple_id, note_date)
  do update
    set
      content = excluded.content,
      updated_at = timezone('utc', now())
  returning *
  into v_row;

  return v_row;
end;
$$;

revoke all on function public.upsert_couple_daily_note (uuid, date, text) from public;
grant execute on function public.upsert_couple_daily_note (uuid, date, text) to authenticated;
