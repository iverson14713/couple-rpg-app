-- Allow couple members to delete old completed reward card records

drop policy if exists "reward_card_records_delete_member" on public.reward_card_records;
create policy "reward_card_records_delete_member"
  on public.reward_card_records for delete to authenticated
  using (public.is_couple_member(couple_id));
