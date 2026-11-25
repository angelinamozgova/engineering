# Voice NLU pipeline (with tests)

Overview and narrative: [../README.md](../README.md).

| Folder | Context |
|--------|---------|
| [planner/](./planner/) | Tasks, habits, shopping lists |
| [beauty-salon/](./beauty-salon/) | Appointment fields: client, service, slot, price |

```powershell
cd applied-ai/01-voice-nlu-pipeline
npm install
npm test
```

Salon parser modules live under [beauty-salon/voice/](./beauty-salon/voice/) (dictionaries, anchors, extractors) — split for maintenance, covered by [salon.test.ts](./beauty-salon/salon.test.ts).