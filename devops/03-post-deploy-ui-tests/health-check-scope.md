# Scope (after deploy)

See [README.md](./README.md) for the flow.

| In this gate | Not in this gate |
|--------------|------------------|
| UI opens; one booking form path | Full NLU suite → `applied-ai/` |
| | Payments, load test |
| | Server/API alerts → `02-incident-monitoring/` |

**On failure:** do not promote; prod roll-back = manual runbook.