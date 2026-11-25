# Applied AI (NLU in products)

**Voice → structured fields → application backend → database** — rule-based NLU with regression tests, no custom model training in these samples.

```
Voice (STT) -> structured fields (NLU) -> application backend -> database
```

## Context

**Production web applications** where users enter data by voice on mobile: appointments (services domain) and personal planning (tasks, habits, shopping). Speech-to-text comes from the **platform** (OS/browser); **structuring** is our code — dictionaries, field anchors, tests.

## Problem

- Forms on a small screen are slow; **voice** is faster.
- Platform **STT** returns noisy Russian text (glued words, wrong names, missing spaces).
- Reviewers need **runnable tests**, not a dump of private product repos.

## Approach

| Layer | Decision |
|-------|----------|
| Voice | Platform STT → rule-based NLU → application backend → database |
| Quality | Regression tests on real messy phrases (salon suite is the larger one) |
| Public slice | Parser extracts + tests only; no secrets or prod hosts |

## Samples (voice NLU)

| Folder | Context |
|--------|---------|
| [01-voice-nlu-pipeline/planner/](./01-voice-nlu-pipeline/planner/) | Tasks, habits, shopping lists |
| [01-voice-nlu-pipeline/beauty-salon/](./01-voice-nlu-pipeline/beauty-salon/) | Appointment fields: client, service, slot, price |

```powershell
cd applied-ai/01-voice-nlu-pipeline
npm install
npm test
```

Product story (booking app + ops): [case-studies/01-beauty-services-booking.md](../case-studies/01-beauty-services-booking.md).

## More in this section

| # | Topic |
|---|--------|
| 1 | [Voice NLU pipeline + tests](./01-voice-nlu-pipeline/) |
| 2 | [STT + fuzzy client match (Levenshtein)](./02-stt-fuzzy-client-match/) |
| 3 | [Rules-first routing sample](./03-llm-fallback-routing/) |