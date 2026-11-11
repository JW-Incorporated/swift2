-- Held-image retry rotation (#6114, #6211): apps/worker's held-image pass
-- retries recent `missing_image` rows each cycle. Track attempts so rows whose
-- image host can never be allowlisted stop starving the rest (least recently
-- tried first, skipped after 5 attempts). Additive; nothing else reads these.
alter table public.current_item add column if not exists image_attempts int not null default 0;
alter table public.current_item add column if not exists last_image_attempt_at timestamptz;
