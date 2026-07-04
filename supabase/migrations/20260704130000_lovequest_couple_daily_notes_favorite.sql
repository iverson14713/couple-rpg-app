-- LoveQuest: 今日一句話 — 預留精選欄位（⭐ 精選一句話，尚未實作 UI）

alter table public.couple_daily_notes
  add column if not exists is_favorite boolean not null default false;
