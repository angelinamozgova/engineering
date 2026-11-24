# Smoke scope

## In scope (smoke)

- Application shell loads over HTTPS (200, no console fatal).
- Health or version endpoint returns expected shape (if exposed internally in CI).
- One **critical user path** per product line (examples):
  - Services app: open booking form, assert required fields render.
  - Planner: home list renders, add-task control present.

## Out of scope (smoke)

- Full voice NLU matrix (covered in `applied-ai/` unit tests).
- Payment provider flows (hosted checkout).
- Load / soak testing.
- Every admin screen.

## When to run

| Trigger | Goal |
|---------|------|
| After deploy to staging | Catch broken assets or routing |
| Nightly on staging | Detect drift |
| Before promoting tag | Gate with manual approval |

## Failure policy

Smoke **red** blocks promote; does not auto-roll back production without human runbook step.