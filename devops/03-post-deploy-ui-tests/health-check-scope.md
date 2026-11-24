# Health check scope (after deploy)

## In scope

- Application shell loads over HTTPS (200, no console fatal).
- One **critical user path** per product line (in this repo: booking form field renders on the **fixture**).

## Out of scope

- Full voice NLU matrix (`applied-ai/` unit tests).
- Payment provider flows, load testing, every admin screen.

## When to run

| Trigger | Goal |
|---------|------|
| After deploy to staging | Catch broken assets or routing |
| On push (this sample) | Keep Playwright spec green in CI |

## Failure policy

A **failed UI check** blocks promote; production roll-back follows the human runbook.