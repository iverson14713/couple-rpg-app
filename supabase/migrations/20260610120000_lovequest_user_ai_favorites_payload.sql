-- Store full AI record JSON so favorites survive logout (local history is cleared).

alter table public.user_ai_favorites
  add column if not exists record_payload jsonb;

comment on column public.user_ai_favorites.record_payload is
  'Snapshot of SavedDateItineraryAi or SavedImportantDateAi for restore after login';

notify pgrst, 'reload schema';
