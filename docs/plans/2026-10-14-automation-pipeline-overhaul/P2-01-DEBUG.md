# P2-01 DEBUG: Tidewatch fails the calibration bars

2026-10-23 05:45Z. This file was filed under architect #15's stop rule: "critical candidate recall < 1.0 = stop, file DEBUG.md, no threshold edits to pass it." Nothing is live. Every class is `enabled: false`. No config or threshold was changed.

## Evidence

All runs used main at 9a5857d. Replay labels were reconciled against D-c in #6230; fixes #6228, #6229 and #6232 had merged.

### 1. Replay eval (run 39906254127, `classify.mjs --eval replay.json`, Jev path)

Jev decided 310 of 771 items. The other 461 went to Haiku and stayed pending (escalation rate 0.602).

| Class | Precision | Recall | Support | Predicted |
|---|---|---|---|---|
| critical_breaking | 0.600 | **0.167** | 18 | 5 |
| critical_personal | n/a | **0.000** | 6 | 0 |
| official_drop | 0.600 | 0.214 | 14 | 5 |
| tour_ticket | 1.000 | 0.125 | 8 | 1 |
| normal_news | 0.953 | 0.135 | 303 | 43 |
| merch_official | 1.000 | 0.949 | 39 | 37 |
| merch_fan | 1.000 | 0.786 | 28 | 22 |
| merch_outfit | 1.000 | 0.239 | 46 | 11 |
| theory_material | 0.750 | 0.375 | 48 | 24 |
| fan_discussion | 1.000 | 0.050 | 160 | 8 |
| rumor | 0.583 | 0.212 | 33 | 12 |
| noise | 0.269 | 0.404 | 52 | 78 |
| privacy_redline | **0.094** | 0.429 | 14 | 64 |

Caveat: the eval scores Jev decisions only. Escalated items are not run through Haiku in eval mode, so recall is structurally low. Even so, the critical hard bar (recall 1.0) fails on the path the eval can see. Jev also over-calls privacy_redline (64 predicted against 14 true) and noise.

### 2. Live decision sample (run 39906256919, seed 1, Sonnet labels with D-c, 5 of 16 calls)

- **Tier A**: 100 model-decided rows labelled. Missed critical: 0. False critical: **7**.
  - critical_personal: 0/7 agree. Sonnet labelled these fan_discussion 3, noise 4.
  - fan_discussion: 8/9.
  - normal_news: 33/56 (59%). The rest went to noise 9, fan_discussion 5, merch_outfit 5, privacy_redline 4.
  - noise: about 7/17.
  - rumor: about 5/11.
  - **By decider: Haiku 47/91 (51.6%), Jev 6/9.**
- **Tier C** (code prefilter):
  - privacy_redline: **0/7**. Sonnet labelled these normal_news 5, rumor 2.
  - duplicate: not scorable (Sonnet has no duplicate class). Sonnet labelled these fan_discussion 4, noise 2, normal_news 4.

### 3. Calibration report (run 39900803738, 358 rows)

- Haiku makes 86.8% of model decisions.
- Jev confidence is concentrated in 0.2–0.7, below every threshold.
- Jev and Haiku agree on 72% of normal_news and 0/13 critical_breaking.

## What this means

- **The Jev-first cascade is not calibrated for this corpus.** Jev's confidence is low and its labels are noisy. This is #15's pre-declared wrong-call signal.
- **Haiku is not a sound primary either.** It agrees with Sonnet only 52% of the time, and it over-calls critical_personal.
- **The privacy_redline code prefilter disagrees with Sonnet on every sampled row.** Either the prefilter is over-broad, or Sonnet's privacy mapping (`x=true`) is too narrow. Unresolved.
- Some disagreement comes from taxonomy fuzziness (normal_news / noise / fan_discussion), not error. The confusion is concentrated there, and Sonnet is a proxy, not ground truth.

## Hypotheses not tested (for the architect)

- **H1:** the taxonomy is too fine. The 13 classes include overlapping low-stakes buckets. Collapsing noise, fan_discussion and normal_news for routing purposes would lift precision without model changes.
- **H2:** the Jev and Haiku prompts lack D-c and class exemplars. A prompt fix would lift both.
- **H3:** go Sonnet-primary for Tier A only. Critical items are rare, so the cost is small. Keep cheap models for low-stakes routing.
- **H4:** the privacy prefilter keyword set is over-broad. It needs its own spot-check against human judgement.
