# Post-deploy UI tests

Sample **UI gate after deploy**: staging must show a usable booking screen, not only green API logs.

## Release chain

```
1. Build / merge
   └─ Clean merge; deploy artefact ready (private CI — not in this public repo)

2. Server & perimeter
   └─ HTTPS, loopback API, firewall, SSH — devops/01-defense-in-depth

3. Service health & backups
   └─ 5xx, auth spikes, backup job — devops/02-incident-monitoring
   └─ Backup restore — runbook (not automated here)

4. Application logic
   └─ NLU / parsers — npm test in applied-ai/

5. After deploy → UI gate (this folder)
   └─ Booking screen; main form renders — fixture + test below

6. Full UI regression / payments
   └─ Private QA — not on GitHub
```

## Logic (this folder)

```
New version deployed
        ↓
Open the booking screen in the UI (not only “API OK in logs”)
        ↓
Main booking form renders?  →  yes  →  release may proceed
                            →  no   →  stop and fix
```

The test uses [fixture/booking-shell.html](./fixture/booking-shell.html) and [tests/booking-shell.spec.ts](./tests/booking-shell.spec.ts).

## Run

**Local**

```powershell
cd devops/03-post-deploy-ui-tests
npm install
npx playwright install chromium
npm test
```

**GitHub:** [post-deploy-ui-tests.yml](../../.github/workflows/post-deploy-ui-tests.yml) on push.

**On failure:** block promote; production roll-back is **manual** (runbook).

---

### Цепочка релиза (RU)

```
1. Сборка / merge
   └─ Чистый merge; артефакт на выкладку (приватный CI — не в этом репо)

2. Сервер и периметр
   └─ HTTPS, API на localhost, firewall, SSH — devops/01-defense-in-depth

3. Доступность и бэкапы
   └─ 5xx, 401, бэкап — devops/02-incident-monitoring
   └─ Восстановление из бэкапа — runbook (не автотест здесь)

4. Логика приложения
   └─ NLU — npm test в applied-ai/

5. После выкладки → UI-gate (эта папка)
   └─ Экран записи; форма отрисована — фикстура + тест

6. Полная регрессия UI / оплаты
   └─ Приватная QA — не на GitHub
```

### Логика (RU)

```
Выложили новую версию
        ↓
Открыли экран записи в UI (не только «в логах API ок»)
        ↓
Основная форма записи отрисовалась?  →  да  →  можно дальше по релизу
                                    →  нет →  стоп, чиним
```

Провал теста — стоп promote; откат прода — вручную по runbook.