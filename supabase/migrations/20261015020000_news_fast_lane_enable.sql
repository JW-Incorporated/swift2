-- P1-08b: the fast-lane row can be enabled now that story-source recording
-- coalesces feed copies before verification. primaryOnly is a data flag (not
-- a name check) that keeps this source out of the normal worker cycle.
-- UPDATE is intentionally guarded by the target row: a database that never
-- received P1-08's seed treats this migration as a no-op.
update public.news_source
set is_enabled = true,
    config = config || '{"primaryOnly":true}'::jsonb
where name = 'Google News — "Taylor Swift" fast lane';
