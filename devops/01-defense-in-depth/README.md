# Defense in depth (production VPS)

**Context:** measures from a **production web app** stack (embedded client + API + PostgreSQL on a single VPS). All identifiers are sanitized; no secrets.

**Audience:** team leads, platform / security reviewers - not a simplified HR one-pager.

| Document | Content |
|----------|---------|
| [security-controls-matrix.md](./security-controls-matrix.md) | Full controls matrix (threat → control) |
| [architecture.md](./architecture.md) | Layered perimeter diagram |
| [design-decisions.md](./design-decisions.md) | What we deliberately do **not** use |

---

### Кратко (RU)

Многослойная защита VPS под **production web app**: HTTPS и заголовки на nginx, API только на localhost, UFW, SSH по ключам через private mesh VPN, rate limit, секреты в `.env`, алерты по SSH/401/5xx, бэкапы БД. Матрица ниже - для разбора на техсобесе; без доменов, IP и названий продуктов.
