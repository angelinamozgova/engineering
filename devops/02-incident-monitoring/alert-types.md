# Alert types

Generic names for a **production web app** deployment. Wording in prod may differ; semantics stay the same.

| Alert | Typical trigger | What it usually means |
|-------|-----------------|------------------------|
| **SSH brute-force / noise** | Many failed auth lines in short window | Internet bots hitting sshd (or residual noise before SSH moved off public interface) |
| **Webhook auth spike (401)** | Burst of 401 on inbound webhook route | Wrong or missing webhook secret, replay attempt, or misconfigured integration |
| **Admin API auth spike (401)** | Burst of 401 on `/api/admin/*` | Token guessing or scanner hitting admin routes |
| **Site / API errors (5xx)** | nginx or upstream 5xx rate above threshold | App crash, DB down, deploy regression, overload |
| **Backup failure** | Cron backup job error in log | `pg_dump` failed, disk full, permissions |
| **Security watch summary** | Scheduled job (e.g. every 15 min) | Rolled-up SSH / auth anomalies for ops review |

**Delivery**

- Primary: **ops messaging channel** (dedicated alert room, not end-user chat).
- Secondary: optional **email** from operator workstation when VPS cannot send SMTP directly (see [design-notes.md](./design-notes.md)).

**Env knobs (names only, no values)**

- `SECURITY_ALERTS_*` - routing security alerts to the ops channel.
- `ADMIN_NOTIFY_EMAIL` - destination for batched admin notifications.
