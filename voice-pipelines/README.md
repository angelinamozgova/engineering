# Voice pipelines (NLU in production)

**Voice → structured fields → application backend → database** — rule-based NLU with regression tests, no custom model training in these samples.

```
Voice (STT) -> structured fields (NLU) -> application backend -> database
```

## Context

**Production web applications** where users enter data by voice on mobile:

- **Services booking** — embedded client, appointment fields (see beauty-salon sample).
- **DayGoal** — PWA + mobile, same entities (tasks, habits, shopping); public repo has parser tests only, not full app source.

Speech-to-text comes from the **platform** (OS/browser); **structuring** is our code — dictionaries, field anchors, tests.

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

## Outcomes

- Staff can **dictate** client name, service, date, time, and price; the parser turns utterances into structured fields with test coverage (including real STT-glitch samples in the salon suite).
- **[Fuzzy client match](./02-stt-fuzzy-client-match/)** (Levenshtein) complements field parsing when STT mangled a name — separate small module with its own tests, not a duplicate of the salon parser.
- **Defence in depth** and **incident monitoring** are documented under [devops/01-defense-in-depth](../devops/01-defense-in-depth/) and [devops/02-incident-monitoring](../devops/02-incident-monitoring/) so security and NLU stay reviewable without dumping product code.
- Sensitive values (tokens, production hosts) stay **out of GitHub** by policy.

## Samples (voice NLU)

| Folder | Context |
|--------|---------|
| [01-voice-nlu-pipeline/planner/](./01-voice-nlu-pipeline/planner/) | Tasks, habits, shopping lists |
| [01-voice-nlu-pipeline/beauty-salon/](./01-voice-nlu-pipeline/beauty-salon/) | Appointment fields: client, service, slot, price |

```powershell
cd voice-pipelines/01-voice-nlu-pipeline
npm install
npm test
```

## More in this section

| # | Topic |
|---|--------|
| 1 | [Voice NLU pipeline + tests](./01-voice-nlu-pipeline/) |
| 2 | [STT + fuzzy client match (Levenshtein)](./02-stt-fuzzy-client-match/) |
| 3 | [Rules-first routing sample](./03-rules-first-routing/) |