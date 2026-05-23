-- Atomic daily AI usage increment (service_role only) to prevent race over-count.

create or replace function public.increment_lovequest_ai_daily_usage(
  p_user_id uuid,
  p_usage_date date,
  p_limit int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
  did_increment boolean := false;
begin
  if p_limit < 0 then
    raise exception 'invalid limit';
  end if;

  insert into public.lovequest_ai_daily_usage (user_id, usage_date, used_count)
  values (p_user_id, p_usage_date, 0)
  on conflict (user_id, usage_date) do nothing;

  update public.lovequest_ai_daily_usage
  set used_count = used_count + 1,
      updated_at = now()
  where user_id = p_user_id
    and usage_date = p_usage_date
    and used_count < p_limit
  returning used_count into new_count;

  if found then
    did_increment := true;
  else
    select u.used_count into new_count
    from public.lovequest_ai_daily_usage u
    where u.user_id = p_user_id and u.usage_date = p_usage_date;
  end if;

  return jsonb_build_object(
    'used_count', coalesce(new_count, 0),
    'incremented', did_increment
  );
end;
$$;

create or replace function public.decrement_lovequest_ai_daily_usage(
  p_user_id uuid,
  p_usage_date date
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update public.lovequest_ai_daily_usage
  set used_count = greatest(0, used_count - 1),
      updated_at = now()
  where user_id = p_user_id
    and usage_date = p_usage_date
    and used_count > 0
  returning used_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

revoke all on function public.increment_lovequest_ai_daily_usage(uuid, date, int) from public;
revoke all on function public.decrement_lovequest_ai_daily_usage(uuid, date) from public;
grant execute on function public.increment_lovequest_ai_daily_usage(uuid, date, int) to service_role;
grant execute on function public.decrement_lovequest_ai_daily_usage(uuid, date) to service_role;
