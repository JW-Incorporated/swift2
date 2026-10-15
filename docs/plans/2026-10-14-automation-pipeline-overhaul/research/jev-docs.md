# Jev (TypeSafe) docs research, 2026-10-14 (untrusted web content; fetch tool summarizes via small model, verify quotes)

## 1. What Jev is
- Provider TypeSafe. "Flagship model and first System One model" (https://docs.typesafe.ai/). NOT a generative LLM: no text/code/reasoning output; text-only input (https://docs.typesafe.ai/concepts/system-one). Returns typed Choice (choice, probabilities, confidence), Score (2-10 ordered levels), Noul (yes/no prob 0-1). Questions in one call run in parallel and isolation.
- Models (https://docs.typesafe.ai/models.md): jev-1.14.0 (available Oct 14 2026), jev-1.13.0; jev-latest -> 1.13.0, jev-preview -> 1.14.0.
- Price $0.042/Mtok input, output free. Context 64k/request, 32k/question; 262k with header TypeSafe-Danger-Zone-Long-Context: true (slower, less accurate).
- Rate limits per org (tokens/s, requests/s), numbers only in console; 429 -> SDK retries.
- Latency: cookbook figures only: 114 ms mean, ~$0.000046/call (consistency_choice_cookbook); 13 questions on ~54k chars 0.27 s, $0.000497 (parallel_questions).

## 2. API
POST https://api.typesafe.ai/v1/systemone, Authorization: Bearer key. Own schema (not OpenAI-compatible). Request {state, model, questions{id:{type,instructions,criteria}}}; response {model, answers, usage}. Choice <=255 options; body <=32 MiB; gzip/zstd. Errors 400/401/413/415/422/429/529. Streaming, tool calling, caching, batch endpoint: undocumented. Python: typesafe-sdk (3.10+). Node: @typesafe-ai/sdk (Node 20+/22+). Env TYPESAFE_API_KEY.

## 3. Cookbooks (https://docs.typesafe.ai/cookbooks/<slug>)
function_calling [a,b]; skill_suggestion [a,b]; llm_guardrails [a]; citation_check [d]; classifying_rag_passages [a,f]; basic_memory; hierarchical_classification [a]; classification_using_confidence [a,f]; twitch_chat_filter [a]; sde_cascade [c,f]; date_extraction_cookbook [c]; pre_parsed_value_extraction_cookbook [c]; autoformat; rerank_typesafe; semantic_find [d]; entity_alignment [d]; consistency_choice_cookbook [a,f]; consistency_noul_cookbook [a,f]; parallel_questions [a,f]; autoresearch_feature_discovery.
Nothing for style/voice (e) or CI (g).
Key numbers: classification: conf>=0.9 -> 27/30 right; <0.9 -> 12/30, fallback to parent label 70%; always-answer 39/60. Consistency: uncertain if top prob<0.60; Jev policy agreement 99.2% (haiku-4-5 t=0 100%, opus-4-8 94.2%). Cascade: gpt-5.4-mini extract, Jev verify, escalate to gpt-5.5 if P(wrong)>0.7. Intent routing: conf<0.5 -> human, complexity score>1 -> escalate. Confidence routing: floor 0.6, auto >0.85. Citation check: string match then Choice; conf<0.8 -> human.

## 4. Gotchas
jev-1.13 limits (https://docs.typesafe.ai/model-jaggedness/jev-1.13.md): literal reading, weak at counting/dates/arithmetic/multi-hop, noisy large state hurts, prompt injection shifts answers, first-option bias, cannot generate text. Legal (https://docs.typesafe.ai/legal.md): commitment not to train on user data; ZDR enterprise only; regions/SLA/status not stated.

## 5. Not verified
Numeric rate limits, status page, regions, SLA, deprecation policy, output-training wording, streaming/caching/batch, questions-per-call cap, general benchmark vs Claude/GPT, CI guidance, signup terms; pages not read in full: fan-out, composite-scoring, state, python SDK, agent-skill, ~12 cookbooks.
