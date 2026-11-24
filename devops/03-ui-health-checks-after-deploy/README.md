# UI health checks after deploy

Sanitized **browser health-check** patterns for a **production web app** (embedded client + backend). No prod URLs, no credentials, no proprietary page dumps.

| Document | Content |
|----------|---------|
| [health-check-scope.md](./health-check-scope.md) | What to cover after deploy vs full regression |
| [selenium-patterns.md](./selenium-patterns.md) | Page objects, waits, CI hook outline |

**Context:** after deploy, confirm the app **loads** and one **critical path** still works in a browser - complementary to API/NLU tests in `applied-ai/`.

---

### Кратко (RU)

После выкладки релиза: проверка в браузере, что приложение открывается и один ключевой сценарий проходит. Page Object, явные ожидания, шаблон для CI. Без prod-URL и секретов.