# Scope after deploy

Read [README.md](./README.md) first — it maps the folder.

## Problem

A deploy can break **nginx**, **static files**, or **routing** while the API still “looks fine” in logs.  
A **short UI check** catches: white screen, missing booking form, wrong bundle.

## On real staging (production process)

Typical checks **after** deploy to staging:

1. Open the app over HTTPS — no hard error on load.
2. Walk **one** path you cannot ship without (here: booking form + service field).
3. If red → **stop** promote to prod; fix or decide manually.
4. **Rollback prod** → operator + runbook ([incident monitoring](../02-incident-monitoring/)), not this script alone.

## What this folder reproduces

| Production habit | How it appears here |
|------------------|---------------------|
| Open booking UI after deploy | Test opens `fixture/booking-shell.html` |
| Critical field must render | Assert `data-testid="service"` is visible |
| Gate in CI/CD | GitHub Actions runs `npm test` |

## What is **not** here (on purpose)

| Topic | Where instead |
|-------|----------------|
| Voice / NLU | `applied-ai/` (`npm test`) |
| Payments, hosted checkout | Out of scope |
| Every admin screen | Full regression (private) |
| Load / soak testing | Out of scope |

## When to run

| When | Why |
|------|-----|
| After deploy to staging (real life) | Catch broken UI before prod |
| On push to this repo (sample) | Prove the gate still runs in CI |

## If the check fails

| Situation | What happens |
|-----------|----------------|
| Test fails before promote | **Do not** move release to prod until fixed or explicitly waived. |
| Prod is already bad | Follow **runbook** — this job does not auto-roll back production. |

---

### Кратко (RU)

**Зачем:** после выкладки убедиться, что UI сервиса не «пустой».  
**Здесь:** одна учебная страница + один тест.  
**Не здесь:** NLU, оплаты, нагрузка — см. другие папки.  
**Провал:** стоп promote; откат боя — вручную по runbook.