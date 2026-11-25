# Scope

Parent: [README.md](./README.md).

| In this folder | Elsewhere |
|----------------|-----------|
| One post-deploy UI gate (sample) | Server/perimeter → `01-defense-in-depth` |
| | Monitoring, backups → `02-incident-monitoring` |
| | NLU/logic tests → `applied-ai/` |
| | Full UI regression → private QA |

**On failure:** do not promote; prod roll-back = manual runbook.