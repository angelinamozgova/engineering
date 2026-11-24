# Beauty services booking (production web app)

Short narrative for recruiters and tech leads. No proprietary source, no hostnames, no secrets.

## Context

A **production web application** for appointment-driven beauty and personal services: clients book slots; staff manage schedule, services, and payments metadata. Users reach the product through an **embedded client** inside a third-party messenger surface (public wording: embedded client, not a standalone consumer brand on GitHub).

## Problem

- Booking data must land in **PostgreSQL** reliably while staff work from phones.
- **Voice input** is faster than forms on a small screen, but platform **STT** produces noisy Russian text (merged words, wrong names).
- The VPS must stay **reachable for HTTPS only**; administration and data layers must not add attack surface.

## Approach

| Layer | Decision |
|-------|----------|
| Voice | Platform STT → **rule-based NLU** (dictionaries, anchors, regression tests) → application backend → database |
| API surface | Reverse proxy on 443; app and Postgres on loopback; signed client context for embedded traffic |
| Operations | Typed alerts (SSH noise, auth spikes, 5xx, backup), runbook-oriented log sources |
| Public portfolio | Sanitized matrices and parser tests only - see linked repos below |

## Architecture (high level)

```
Embedded client  -->  HTTPS / nginx  -->  application backend  -->  PostgreSQL
       |                                      ^
       +---- voice (STT) ----> NLU ----------+
```

Admin access: **SSH over private mesh VPN**, not public port 22. Details: [defense in depth](../devops/01-defense-in-depth/architecture.md).

## Outcomes

- Staff can **dictate** client name, service, date, time, and price; parser turns utterances into structured fields with test coverage (including real STT-glitch samples in Vitest).
- **Defence in depth** and **incident monitoring** patterns documented separately so security and NLU stay reviewable without dumping product code.
- Sensitive values (tokens, IPs, `.env`) stay **out of GitHub** by policy.

## Related public notes

| Topic | Link |
|-------|------|
| Voice NLU sample (salon domain) | [applied-ai/01-voice-nlu-pipeline/beauty-salon/](../applied-ai/01-voice-nlu-pipeline/beauty-salon/) |
| Security layers | [devops/01-defense-in-depth/](../devops/01-defense-in-depth/) |
| Alerts and runbook outline | [devops/02-incident-monitoring/](../devops/02-incident-monitoring/) |

---

### Кратко (RU)

Кейс про **production web app** для записи в сфере beauty / услуг: клиенты бронируют время, сотрудники ведут расписание. Вход - через **встроенный клиент** (embedded client) в мессенджере; в публичных текстах без названия мессенджера.

**Проблема:** с телефона формы медленные; **голос** удобнее, но STT платформы портит русский текст. Данные должны стабильно попадать в **PostgreSQL**; снаружи VPS - только **HTTPS**.

**Решение:** STT платформы → **rule-based NLU** (словари, якоря, тесты, в т.ч. кривой STT) → backend → БД. Периметр: nginx, app и Postgres на loopback, админка по **SSH через private VPN**. Алерты и runbook - отдельно в `devops/`.

**Итог:** диктовка имени, услуги, даты, времени, цены; на GitHub - санитизированные матрицы безопасности и тесты парсера, без prod-кода и секретов.