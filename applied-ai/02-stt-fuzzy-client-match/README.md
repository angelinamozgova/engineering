# STT + fuzzy client match (Levenshtein)

After platform **speech-to-text**, client names are often wrong (glue, case, typos). This sample ranks roster entries with **Levenshtein distance** on a normalized string - complement to field parsing in [01-voice-nlu-pipeline](../01-voice-nlu-pipeline/).

Production also uses **dictionary normalization** (cases, glued words) inside the salon parser; this folder isolates **fuzzy roster match** for interviews and tests.

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
| Case study | [01-beauty-services-booking](../../case-studies/01-beauty-services-booking.md) |

---

### Кратко (RU)

После STT имя клиента часто кривое. Справочник сверяем через **Левенштейна** на нормализованной строке (регистр, `ё`). Это дополнение к разбору полей в п.1, отдельно - чтобы на собесе показать **fuzzy match** с тестами.