# Post-deploy UI tests

## Start here (30 seconds)

After we **deploy a new version**, we need a **fast** check: did the **service UI** still open and show the booking flow, or is it a blank page / broken form?

This folder contains a **tiny working example** of that check:

| File | Role in one line |
|------|------------------|
| [fixture/booking-shell.html](./fixture/booking-shell.html) | **Fake booking page** in the repo (not your live site). |
| [tests/booking-shell.spec.ts](./tests/booking-shell.spec.ts) | **Script** that opens the page and checks the service field is visible. |
| [health-check-scope.md](./health-check-scope.md) | **Rules**: what belongs in this kind of check vs full regression. |

On **production** the same *idea* runs against **staging URL** after deploy.  
On **GitHub** it runs against **booking-shell.html** so we can publish code without secrets.

```text
Deploy finished  →  open UI  →  one critical screen OK?  →  only then promote further
```

---

## The only automated test (what it does in plain language)

Open [tests/booking-shell.spec.ts](./tests/booking-shell.spec.ts) — **7 lines of logic**:

| Step | Code idea | Meaning |
|------|-----------|---------|
| 1 | open `/booking-shell.html` | Load the fake booking page (like opening the app after deploy). |
| 2 | find element with `data-testid="service"` | The **service** field must exist (main booking input). |
| 3 | assert visible | User would see the form — not an empty or broken shell. |

That is **intentionally one scenario**. Full voice NLU, payments, and load tests live elsewhere (`applied-ai/`, other pipelines).

---

## Why not test the real salon site here?

| Production | This repository |
|------------|-----------------|
| Real HTTPS URL, login, data | Static HTML file `fixture/booking-shell.html` |
| Secrets in CI variables | Nothing sensitive to leak |
| Many UI paths | **One** path as a pattern |

We are showing **release discipline + CI**, not exporting the whole QA suite.

---

## Run locally

```powershell
cd devops/03-post-deploy-ui-tests
npm install
npx playwright install chromium
npm test
```

You should see **1 passed**.

---

## CI

[`.github/workflows/post-deploy-ui-tests.yml`](../../.github/workflows/post-deploy-ui-tests.yml) runs `npm test` on push when this folder changes.

---

### Кратко (RU)

Короткая проверка UI в браузере после деплоя. Здесь рабочие тесты.

**Что внутри:** учебная страница записи + один тест «страница открылась, поле услуги видно». На бою та же логика, но с URL staging, без выкладки prod в GitHub.

**Если тест зелёный:** минимальный UI жив. **Если красный:** релиз дальше не катим. Откат на бою — по runbook, не автоматом из этого job.