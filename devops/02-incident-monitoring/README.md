# Incident monitoring and response

**Context:** how a **production web app** on a single VPS detects attacks and operational failures, and what the operator checks first. Sanitized - no hostnames, IPs, or channel IDs.

| Document | Content |
|----------|---------|
| [alert-types.md](./alert-types.md) | What fires alerts and why |
| [log-sources.md](./log-sources.md) | Where to look (template shell commands) |
| [runbook-outline.md](./runbook-outline.md) | Alert → checks → escalation checklist |
| [design-notes.md](./design-notes.md) | Alert channel design, email workaround |

---

### Кратко (RU)

Для **production web app**: алерты в отдельный ops-канал (мessaging), типы - SSH, всплеск 401 на webhook/admin API, 5xx, сбой бэкапа. Логи - nginx, auth.log, fail2ban, journal сервиса API. Runbook - короткий чеклист «увидела → проверила → зафиксировала». Email с рабочей станции - запасной канал, если SMTP с VPS заблокирован провайдером (см. design-notes).
