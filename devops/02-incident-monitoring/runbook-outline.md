# Runbook outline (alert → action)

Checklist for the **on-call operator** (solo or small team). Expand in internal docs; this is the public skeleton.

## 1. SSH / fail2ban alert

1. Confirm spike in `auth.log` (template in [log-sources.md](./log-sources.md)).
2. Check `fail2ban-client status sshd` - bans active?
3. If SSH is VPN-only: verify no accidental re-open of `0.0.0.0:22` on firewall.
4. Document time range and top source IPs (for post-incident note).
5. If sustained attack: consider provider anti-DDoS or stricter jail thresholds.

## 2. Webhook 401 spike

1. `journalctl` on API service - same window as alert.
2. Verify webhook secret env var unchanged vs integration dashboard.
3. Check recent deploy - regression in secret header validation?
4. Distinguish misconfiguration (steady 401) vs scan (short burst).
5. Rotate webhook secret if leak suspected; replay idempotency still required.

## 3. Admin API 401 spike

1. Confirm routes are not exposed beyond need; rate limit active.
2. Check for scanner User-Agents in nginx access log.
3. No token values in tickets - rotate admin token if guessing suspected.

## 4. 5xx / site down

1. `tail` nginx error log - upstream connection refused vs timeout?
2. API process up? `systemctl status <api-service>`
3. PostgreSQL up? local connect test on loopback.
4. Recent deploy? rollback procedure if needed.
5. Note duration for SLA / postmortem.

## 5. Backup failure

1. Read backup log - disk full vs auth vs path.
2. Confirm cron still installed; manual test run off-peak.
3. Verify last good dump size reasonable.

## 6. After action

- Short note: what happened, root cause, what changed.
- Link to [defense in depth](../01-defense-in-depth/security-controls-matrix.md) if control gap found.
