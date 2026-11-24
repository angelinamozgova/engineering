# Defense in depth (production VPS)

**Context:** measures from a **production web app** stack (embedded client + API + PostgreSQL on a single VPS). All identifiers are sanitized; no secrets.

| Document | Content |
|----------|---------|
| [security-controls-matrix.md](./security-controls-matrix.md) | Full controls matrix (threat → control) |
| [architecture.md](./architecture.md) | Layered perimeter diagram |
| [architecture-trade-offs.md](./architecture-trade-offs.md) | What we deliberately do **not** use (and why) |

---

### Кратко (RU)

Многослойная защита VPS под **production web app**: HTTPS и заголовки на nginx, приложение только на localhost, UFW, SSH по ключам через private mesh VPN, rate limit, секреты на сервере (не в git), алерты по SSH/401/5xx, бэкапы БД.