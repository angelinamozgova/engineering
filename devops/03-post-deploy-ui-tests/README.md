# Post-deploy UI tests (Playwright)

Runnable **browser checks** after a release: one critical path on an **in-repo fixture** (not production). Same discipline as prod post-deploy gates — **scope + CI**.

| Piece | Content |
|-------|---------|
| [health-check-scope.md](./health-check-scope.md) | What to check after deploy vs full regression |
| [fixture/booking-shell.html](./fixture/booking-shell.html) | Minimal booking form (`data-testid`) |
| [tests/](./tests/) | Playwright specs |

## Run locally

```powershell
cd devops/03-post-deploy-ui-tests
npm install
npx playwright install chromium
npm test
```

## CI

GitHub Actions workflow [`.github/workflows/post-deploy-ui-tests.yml`](../../.github/workflows/post-deploy-ui-tests.yml) runs on push when this folder changes.

**Honest line:** tests exercise the **fixture**; patterns mirror how we gate real deploys (stable selectors, one critical path).

---

### Кратко (RU)

После деплоя — короткая проверка UI в браузере. Здесь — **рабочие** Playwright-тесты на учебной странице в репозитории, плюс описание scope. Не prod URL.