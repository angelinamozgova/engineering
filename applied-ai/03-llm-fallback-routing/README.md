# LLM fallback routing (demo, not production)

**Production booking and planner flows use rules-first NLU** (see [01-voice-nlu-pipeline](../01-voice-nlu-pipeline/)). This folder is a **small routing sample**: when rule signals are weak, mark `llm_candidate` - **no API keys, no model calls** on GitHub.

```
STT -> rules parser -> if confident -> backend
                    -> else llm_candidate (human review / future demo only)
```

## Run tests

```powershell
cd applied-ai/03-llm-fallback-routing
npm install
npm test
```

Interview line: hybrid is **optional future work**, not what ships today.

---

### Кратко (RU)

В проде - **сначала правила**. Этот каталог - **демо порога**: если intent слабый или мало обязательных полей, ставим метку `llm_candidate`, без реального LLM и без ключей. На собесе: «rules first, LLM - отдельный эксперимент, не замена тестам в п.1».