# Cross-platform day planner (PWA + mobile)

Short narrative. Sanitized; private product code is not published.

## Context

A **cross-platform planner**: daily goals, tasks, habits, shopping lists, and notes. Delivered as a **PWA** and **mobile** builds sharing one product concept - users expect the same entities whether they open the browser or the app.

## Problem

- Capture must be **fast** (voice and short phrases), not only tap-heavy forms.
- Parsed items must map to **distinct types** (task vs habit vs shopping) without calling an LLM on every utterance.
- Readers should see **proof**, not marketing: a small **public parser extract + tests**, not the full app repository.

## Approach

| Topic | Decision |
|-------|----------|
| NLU | Deterministic **rule-based** parser exported for Node tests; same pipeline idea as in production mobile/PWA builds |
| Sync | Production apps use backend persistence; public sample stops at **parse → structured JSON** (no user data on GitHub) |
| Quality | `node --test` on representative Russian phrases (tasks, habits, shopping) |

## Architecture (conceptual)

```
User voice (platform STT)  -->  parseVoiceTranscript  -->  typed items (task | habit | shopping | ...)
                                                          -->  application sync in prod (not in this repo)
```

## Outcomes

- Voice parsing is backed by **runnable tests** in [planner/](../applied-ai/01-voice-nlu-pipeline/planner/).
- Clear separation: **NLU sample** is public; **full UI, auth, and hosting** stay private.
- Same engineering story as the services booking case: **STT is platform**, **structure is ours**, persistence is **backend**, not an "AI API".

## Related public notes

| Topic | Link |
|-------|------|
| Voice NLU sample (planner domain) | [applied-ai/01-voice-nlu-pipeline/planner/](../applied-ai/01-voice-nlu-pipeline/planner/) |
| Full pipeline README | [applied-ai/01-voice-nlu-pipeline/](../applied-ai/01-voice-nlu-pipeline/) |

---

### Кратко (RU)

**Кроссплатформенный планировщик:** цели дня, задачи, привычки, список покупок, заметки. Доставка - **PWA** и **мобильное** приложение с одной логикой сущностей.

**Проблема:** ввод должен быть быстрым (голос и короткие фразы); нужно различать типы (задача / привычка / покупка) **без LLM на каждую фразу**. В открытом репозитории - **вырезка парсера + тесты**, а не весь код продукта.

**Решение:** STT платформы → `parseVoiceTranscript` → типизированные объекты; в проде дальше синхронизация через backend (в публичном репо этого нет). Качество - `node --test` на русских фразах.

**Итог:** тот же инженерный сюжет, что у кейса записи: **STT чужой, структура наша**, сохранение через backend, не «AI API». Тесты - в `applied-ai/01-voice-nlu-pipeline/planner/`.