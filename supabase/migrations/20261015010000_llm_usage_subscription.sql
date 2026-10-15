-- Extend the shared LLM usage ledger for Claude subscription telemetry.

alter table public.llm_usage
  drop constraint if exists llm_usage_provider_check;

alter table public.llm_usage
  add constraint llm_usage_provider_check
  check (provider in ('jev', 'claude', 'claude-subscription'));

alter table public.llm_usage
  add column if not exists cache_creation_input_tokens integer,
  add column if not exists cache_read_input_tokens integer;
