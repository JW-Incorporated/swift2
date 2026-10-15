-- Extend the shared LLM usage ledger for Claude subscription telemetry.

alter table public.llm_usage
  drop constraint if exists llm_usage_provider_check;

alter table public.llm_usage
  add constraint llm_usage_provider_check
  check (provider in ('jev', 'claude', 'claude-subscription'));

alter table public.llm_usage
  add column if not exists cache_creation_input_tokens integer;

alter table public.llm_usage
  drop constraint if exists llm_usage_cache_creation_input_tokens_check;

alter table public.llm_usage
  add constraint llm_usage_cache_creation_input_tokens_check
  check (cache_creation_input_tokens is null or cache_creation_input_tokens >= 0);
