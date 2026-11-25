# STT + fuzzy client match (Levenshtein)

After platform **speech-to-text**, client names are often wrong (glue, case, typos). This sample ranks roster entries with **Levenshtein distance** on a normalized string - complement to field parsing in [01-voice-nlu-pipeline](../01-voice-nlu-pipeline/).

The salon parser also uses **dictionary normalization** (cases, glued words); this folder isolates **fuzzy roster match** with unit tests.

## Run tests

```powershell
cd applied-ai/02-stt-fuzzy-client-match
npm install
npm test
```

## Related

| Piece | Link |
|-------|------|
| Voice field parsing | [beauty-salon/voice](../01-voice-nlu-pipeline/beauty-salon/voice/) |
| Overview | [applied-ai README](../README.md) |

---

### Кратко (RU)

После STT имя клиента часто кривое. Справочник сверяем через **Левенштейна** на нормализованной строке (регистр, `ё`). Дополнение к разбору полей в п.1, с отдельными тестами.