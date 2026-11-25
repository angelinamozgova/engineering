# Post-deploy UI tests

**UI check after deploy** on a staging environment: confirm a **critical user screen** still works, not only “API OK in logs”.

This repository implements **one automated example** of that check (step 5 below). The HTML fixture looks like a booking form only because it is a **concrete sample** — your production gate can start on any critical screen.

## Release flow (where this folder fits)

```
1. Build / merge
   └─ Clean merge; deploy artefact ready (private CI — not in this public repo)

2. Server & perimeter
   └─ devops/01-defense-in-depth

3. Service health & backups
   └─ devops/02-incident-monitoring
   └─ Backup restore — runbook (not automated here)

4. Application logic (tests)
   └─ applied-ai/ — npm test

5. After deploy → UI gate (this folder)
        ↓
   Open a critical service screen in the UI
        ↓
   Essential UI path still works?  →  yes  →  release may proceed
                                 →  no   →  stop and fix
   (here: headless open of fixture + one visibility assertion)

6. Full UI regression / payments
   └─ Private QA — not on GitHub
```

**Scope:** only step 5 sample. Steps 2–4 live in other folders; step 6 is out of scope.

See [health-check-scope.md](./health-check-scope.md).

## Run

```powershell
cd devops/03-post-deploy-ui-tests
npm install
npx playwright install chromium
npm test
```

CI: [post-deploy-ui-tests.yml](../../.github/workflows/post-deploy-ui-tests.yml).

**On failure:** block promote; production roll-back is **manual** (runbook).