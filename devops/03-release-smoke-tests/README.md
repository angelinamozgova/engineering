# Release smoke tests (Selenium patterns)

Sanitized **UI smoke** patterns for a **production web app** (embedded client + backend). No prod URLs, no credentials, no proprietary page dumps.

| Document | Content |
|----------|---------|
| [smoke-scope.md](./smoke-scope.md) | What belongs in smoke vs full regression |
| [selenium-patterns.md](./selenium-patterns.md) | Page objects, waits, CI hook outline |

**Context:** validate that a release still **loads, authenticates (stub), and hits one critical path** after deploy - not a substitute for API/NLU tests in `applied-ai/`.

---

### Кратко (RU)

Дымовые UI-тесты после релиза: страница открывается, критичный сценарий (например запись или вход) проходит в **headless** браузере. Page Object, явные ожидания, запуск из CI. Без prod-URL и секретов - только шаблоны и scope.