# Salon voice parser modules

One pipeline, many small files (not “extra tests on the page” — **source** for [salon.test.ts](../salon.test.ts)).

| File / group | Role |
|--------------|------|
| `dictionary.ts`, `lexicon-beauty-services.ts`, `extendedServiceKeywords.ts` | Service names and triggers (split for size) |
| `fieldAnchors.ts`, `parseSegmented.ts` | Dictation by field anchors |
| `preprocessTranscript.ts`, `gluedWordSplitters.ts` | STT glue and cleanup |
| `voiceExtractors.ts`, `parseIntent.ts` | Main parse path |
| `reconcileFields.ts`, `validateFields.ts`, `secondPass.ts` | Merge and fix fields |
| `normalizeName.ts` | Client name cases |
| `serviceResolution.ts` | Match service string |
| `*.test.ts` | Unit slices (plus full suite in `../salon.test.ts`) |

Do not delete keyword files without merging into `dictionary.ts` — tests import the full graph.