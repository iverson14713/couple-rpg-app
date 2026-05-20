-- LoveQuest: fix "column reference couple_id is ambiguous" in couple RPC/helpers.
-- Root cause: RETURNS TABLE (couple_id, ...) creates PL/pgSQL output variables that
-- shadow table columns in INSERT/UPDATE. Run in Supabase SQL Editor after Phase 5/7.
-- Safe to re-run: drops functions whose OUT columns change, then recreates them.

-- ===========================================================================
-- Helper functions
-- ===========================================================================

create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = auth.uid()
  );
$$;

create or replace function public.is_couple_owner(p_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = p_couple_id
      and cm.user_id = auth.uid()
      and cm.role = 'owner'
  );
$$;

create or replace function public.couple_member_count(p_couple_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.couple_members cm
  where cm.couple_id = p_couple_id;
$$;

create or replace function public.my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cm.couple_id
  from public.couple_members cm
  where cm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.enforce_couple_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.couple_member_count(new.couple_id) >= 2 then
    raise exception 'couple_full';
  end if;
  return new;
end;
$$;

-- ===========================================================================
-- Drop RPCs with old OUT column names (Postgres cannot change RETURNS TABLE in-place)
-- ===========================================================================

drop function if exists public.create_couple_space(text);
drop function if exists public.create_couple_space(text, text, text);
drop function if exists public.save_couple_app_state(uuid, jsonb, timestamptz);

-- ===========================================================================
-- RPC: create_couple_space (Phase 7 signature — p_couple_name)
-- Output columns renamed to avoid shadowing table columns.
-- ===========================================================================

create or replace function public.create_couple_space(p_couple_name text default null)
returns table (out_couple_id uuid, out_invite_code text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
  v_code text;
  v_attempts int := 0;
  v_empty_state jsonb := jsonb_build_object('version', 1);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.my_couple_id() is not null then
    raise exception 'already_in_couple';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code(6);
    exit when not exists (
      select 1 from public.couples c where lower(c.invite_code) = lower(v_code)
    );
    if v_attempts > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couples' and column_name = 'created_by'
  ) then
    insert into public.couples (created_by, owner_id, invite_code, display_name, couple_name)
    values (
      v_uid,
      v_uid,
      v_code,
      nullif(trim(p_couple_name), ''),
      nullif(trim(p_couple_name), '')
    )
    returning id into v_couple_id;
  else
    insert into public.couples (owner_id, invite_code, couple_name)
    values (v_uid, v_code, nullif(trim(p_couple_name), ''))
    returning id into v_couple_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couple_members' and column_name = 'partner_slot'
  ) then
    insert into public.couple_members (couple_id, user_id, role, partner_slot)
    values (v_couple_id, v_uid, 'owner', 'A');
  else
    insert into public.couple_members (couple_id, user_id, role)
    values (v_couple_id, v_uid, 'owner');
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'couple_app_state'
  ) then
    insert into public.couple_app_state (couple_id, state, updated_by)
    values (v_couple_id, v_empty_state, v_uid)
    on conflict (couple_id) do nothing;
  elsif exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'couple_stats'
  ) then
    insert into public.couple_stats (couple_id, updated_by)
    values (v_couple_id, v_uid)
    on conflict (couple_id) do nothing;
  end if;

  return query select v_couple_id, v_code;
end;
$$;

-- Phase 5 overload (display_name + partner labels) — same fix
create or replace function public.create_couple_space(
  p_display_name text default null,
  p_partner_a_label text default null,
  p_partner_b_label text default null
)
returns table (out_couple_id uuid, out_invite_code text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
  v_code text;
  v_attempts int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
    raise exception 'already_in_couple';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code(6);
    exit when not exists (
      select 1 from public.couples c where lower(c.invite_code) = lower(v_code)
    );
    if v_attempts > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  insert into public.couples (
    created_by,
    invite_code,
    display_name,
    partner_a_label,
    partner_b_label
  )
  values (
    v_uid,
    v_code,
    nullif(trim(p_display_name), ''),
    nullif(trim(p_partner_a_label), ''),
    nullif(trim(p_partner_b_label), '')
  )
  returning id into v_couple_id;

  insert into public.couple_members (couple_id, user_id, role, partner_slot)
  values (v_couple_id, v_uid, 'owner', 'A');

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'couple_stats'
  ) then
    insert into public.couple_stats (couple_id, updated_by)
    values (v_couple_id, v_uid)
    on conflict (couple_id) do nothing;
  end if;

  return query select v_couple_id, v_code;
end;
$$;

revoke all on function public.create_couple_space(text) from public;
grant execute on function public.create_couple_space(text) to authenticated;

revoke all on function public.create_couple_space(text, text, text) from public;
grant execute on function public.create_couple_space(text, text, text) to authenticated;

-- ===========================================================================
-- RPC: accept_couple_invite
-- ===========================================================================

create or replace function public.accept_couple_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_couple_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select c.id into v_couple_id
  from public.couples c
  where lower(trim(c.invite_code)) = lower(trim(p_code))
  limit 1;

  if v_couple_id is null then
    raise exception 'invalid_invite';
  end if;

  if exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = v_couple_id and cm.user_id = v_uid
  ) then
    return v_couple_id;
  end if;

  if public.couple_member_count(v_couple_id) >= 2 then
    raise exception 'couple_full';
  end if;

  if exists (select 1 from public.couple_members cm where cm.user_id = v_uid) then
    raise exception 'already_in_couple';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'couple_members' and column_name = 'partner_slot'
  ) then
    insert into public.couple_members (couple_id, user_id, role, partner_slot)
    values (v_couple_id, v_uid, 'partner', 'B');
  else
    insert into public.couple_members (couple_id, user_id, role)
    values (v_couple_id, v_uid, 'partner');
  end if;

  return v_couple_id;
end;
$$;

revoke all on function public.accept_couple_invite(text) from public;
grant execute on function public.accept_couple_invite(text) to authenticated;

-- ===========================================================================
-- RPC: regenerate_couple_invite
-- ===========================================================================

create or replace function public.regenerate_couple_invite(p_couple_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_code text;
  v_attempts int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_owner(p_couple_id) then
    raise exception 'forbidden';
  end if;

  loop
    v_attempts := v_attempts + 1;
    v_code := public.generate_invite_code(6);
    exit when not exists (
      select 1 from public.couples c where lower(c.invite_code) = lower(v_code)
    );
    if v_attempts > 20 then
      raise exception 'invite_code_generation_failed';
    end if;
  end loop;

  update public.couples c
  set invite_code = v_code
  where c.id = p_couple_id;

  return v_code;
end;
$$;

revoke all on function public.regenerate_couple_invite(uuid) from public;
grant execute on function public.regenerate_couple_invite(uuid) to authenticated;

-- ===========================================================================
-- RPC: save_couple_app_state (if table exists)
-- ===========================================================================

create or replace function public.save_couple_app_state(
  p_couple_id uuid,
  p_state jsonb,
  p_base_updated_at timestamptz default null
)
returns table (out_ok boolean, out_updated_at timestamptz, out_conflict boolean)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_now timestamptz := timezone('utc', now());
  v_current timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if not public.is_couple_member(p_couple_id) then
    raise exception 'forbidden';
  end if;

  select s.updated_at into v_current
  from public.couple_app_state s
  where s.couple_id = p_couple_id
  for update;

  if v_current is null then
    insert into public.couple_app_state (couple_id, state, updated_at, updated_by)
    values (p_couple_id, coalesce(p_state, '{}'::jsonb), v_now, v_uid);
    return query select true, v_now, false;
    return;
  end if;

  if p_base_updated_at is not null and v_current > p_base_updated_at then
    return query select false, v_current, true;
    return;
  end if;

  update public.couple_app_state s
  set
    state = coalesce(p_state, '{}'::jsonb),
    updated_at = v_now,
    updated_by = v_uid
  where s.couple_id = p_couple_id;

  return query select true, v_now, false;
end;
$$;

revoke all on function public.save_couple_app_state(uuid, jsonb, timestamptz) from public;
grant execute on function public.save_couple_app_state(uuid, jsonb, timestamptz) to authenticated;
