# Rules-first routing sample

**Production booking and planner flows use rules-first NLU** (see [01-voice-nlu-pipeline](../01-voice-nlu-pipeline/)). This folder shows a **routing threshold**: when rule signals are weak, the code returns `llm_candidate` - **no API keys, no model calls** in this repository.

```
STT -> rules parser -> if confident -> backend
                    -> else llm_candidate (escalation / human review)
```

Production today stays on the **rules** branch; this is a small, testable decision function only.

## Run tests

```powershell
cd voice-pipelines/03-rules-first-routing
npm install
npm test
```

---

### Кратко (RU)

В проде - **сначала правила**. Здесь - **порог маршрутизации**: слабый intent или мало обязательных полей → метка `llm_candidate`, без реального LLM и без ключей. Это не замена тестам в п.1.