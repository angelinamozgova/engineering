# Voice NLU pipeline (with tests)

**Not an LLM wrapper.** Platform speech-to-text, then **our rule-based parser**, then **save on the application server**, then the database.

We avoid saying **API** in the headline chain (it sounds like “another AI service”). Same step, clearer names:

| Short (EN) | Meaning |
|------------|---------|
| **Voice** | Microphone → text (OS / browser STT) |
| **Structured fields** | Our NLU: intent, names, dates, services, price |
| **Server save** | HTTP handler validates auth → writes JSON to PostgreSQL |
| **Database** | Long-term storage |

| Коротко (RU) | Смысл |
|--------------|--------|
| **Голос** | STT платформы |
| **Поля формы** | Наш разбор текста |
| **Сохранение на сервере** | Проверка доступа + запись |
| **База** | PostgreSQL |

## Two domains in this folder

| Folder | Domain | Tests |
|--------|--------|--------|
| [planner/](./planner/) | Personal planner (tasks, habits, shopping) | `node --test` |
| [beauty-salon/](./beauty-salon/) | **Beauty salon booking** (client, service, time, price) | Vitest |

## Run tests locally

```powershell
cd applied-ai/01-voice-nlu-pipeline
npm install
npm test
```

## Docs

- [interview-notes.md](./interview-notes.md) - what to say on interviews (NLU vs LLM)

---

### Кратко (RU)

Два продукта: **планировщик** и **запись в салон красоты**. Нейросеть внутри **не обучаем** - правила, словари, тесты. Цепочка: голос → поля → **сервер** → БД (не «ещё один AI API»).
