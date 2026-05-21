-- Align reward_card_records with local_id naming (was client_id in initial migration)

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reward_card_records'
      and column_name = 'client_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reward_card_records'
      and column_name = 'local_id'
  ) then
    alter table public.reward_card_records rename column client_id to local_id;
  end if;
end $$;

alter table public.reward_card_records drop constraint if exists reward_card_records_couple_client_unique;

alter table public.reward_card_records
  drop constraint if exists reward_card_records_couple_local_unique;

alter table public.reward_card_records
  add constraint reward_card_records_couple_local_unique unique (couple_id, local_id);

-- Split RLS policies (select / insert / update) per Step 2 spec
drop policy if exists "reward_card_records_all_member" on public.reward_card_records;

drop policy if exists "reward_card_records_select_member" on public.reward_card_records;
create policy "reward_card_records_select_member"
  on public.reward_card_records for select to authenticated
  using (public.is_couple_member(couple_id));

drop policy if exists "reward_card_records_insert_member" on public.reward_card_records;
create policy "reward_card_records_insert_member"
  on public.reward_card_records for insert to authenticated
  with check (public.is_couple_member(couple_id));

drop policy if exists "reward_card_records_update_member" on public.reward_card_records;
create policy "reward_card_records_update_member"
  on public.reward_card_records for update to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
