# Log sources (template commands)

Run on the **VPS** after SSH (preferably over private mesh VPN). Paths are typical for Debian/Ubuntu + nginx + systemd.

| Log | Path or command | Use for |
|-----|-----------------|---------|
| SSH auth | `/var/log/auth.log` | Failed logins, invalid users |
| fail2ban | `/var/log/fail2ban.log` | Bans applied |
| nginx access | `/var/log/nginx/access.log` | Traffic, top IPs, status codes |
| nginx error | `/var/log/nginx/error.log` | Upstream errors, TLS issues |
| API service | `journalctl -u <api-service-name> --since "1 hour ago"` | App errors, webhook handling |
| Backup job | `/var/log/<app>-backup.log` or cron mail | Backup success/failure |
| Security aggregate | `/var/log/<app>-security.log` | Scheduled security summaries |

**Retention (typical defaults)**

| Log | Rough retention |
|-----|-----------------|
| nginx access/error | ~14 days (daily rotate) |
| auth.log | ~weeks (weekly rotate) |
| journalctl | bounded by disk journal size |

---

## Template commands (bash)

```bash
# SSH failures (last lines)
grep "Failed password\|Invalid user" /var/log/auth.log | tail -20

# fail2ban sshd jail status
fail2ban-client status sshd

# API / webhook errors (adjust unit name)
journalctl -u api-service --since "1 hour ago" | grep -iE "webhook|error|401" | tail -30

# Top client IPs today (nginx)
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -20

# Recent nginx errors
tail -50 /var/log/nginx/error.log
```

Replace `<api-service-name>` / unit name with your systemd unit. Do not expose production unit names in public docs if they reveal internal branding.
