# Voice NLU pipeline (with tests)

Deterministic **rule-based NLU** on top of platform **speech-to-text**. Parsed fields are validated and stored through the application backend (PostgreSQL).

**Pipeline (wording for docs and interviews):**

```
Voice (STT) -> structured fields (NLU) -> application backend -> database
```

We do not label the backend step as a generic **API** in diagrams when it reads like a separate AI product - same handler, clearer name: **server-side save** or **application backend**.

| Step | Role |
|------|------|
| Voice | OS / browser STT |
| Structured fields | Intents, entities, dates, price |
| Application backend | Auth, validation, persistence |
| Database | PostgreSQL |

## Samples in this repo

| Folder | Context | Test runner |
|--------|---------|-------------|
| [planner/](./planner/) | Tasks, habits, shopping lists | `node --test` |
| [beauty-salon/](./beauty-salon/) | Appointment booking (client, service, slot, price) | Vitest |

Shared idea: dictionaries, anchors, regression tests on noisy transcripts (including real STT glitches in the salon suite).

## Run tests

```powershell
cd applied-ai/01-voice-nlu-pipeline
npm install
npm test
```

No custom model training in these samples - behavior is defined in code and covered by tests.