# Security controls matrix

Production **web app** (embedded client + HTTP API + PostgreSQL on VPS).  
**No** production hostnames, IPs, tokens, or chat identifiers in this document.

| Asset / surface | Threat | Example attack | Controls |
|-----------------|--------|----------------|----------|
| **User traffic (site, embedded client)** | MITM, HTTP downgrade | Intercept cleartext HTTP on public Wi-Fi | TLS 1.2+, Let's Encrypt, forced HTTPS, HSTS, HTTP→HTTPS redirect |
| **Client session in embedded app** | Identity spoofing, replay | Reuse captured signed launch payload | HMAC validation of signed client context; TTL on payload age; bind requests to account id in DB |
| **API from untrusted origins** | Cross-origin abuse | Third-party site calls API from victim browser | CORS allowlist; block preflight for unknown origins |
| **API abuse** | Flood, scraping | High request rate from one IP | App rate limit (~120 req/min per IP/account); nginx `limit_req` (e.g. 15 r/s API, burst 60; 40 r/s static, burst 120) |
| **VPS perimeter (L3/L4)** | Port scan, unsolicited inbound | Masscan + exploit on exposed service | UFW default deny; allow **80/tcp**, **443/tcp** only; admin SSH **not** on public interface |
| **Administrative SSH** | Brute force, password spray | Automated `sshd` password attempts | Key-only SSH; fail2ban on sshd; SSH via **private mesh VPN**; provider console as break-glass |
| **API process port** | Bypass nginx, direct bind attack | Hit app port on public IP | App binds **127.0.0.1** only; nginx reverse proxy to HTTPS; UFW does not expose app port |
| **PostgreSQL** | Remote brute force, SQLi via exposed DB | Open `:5432` on internet | `listen_addresses = localhost`; ORM with parameterized queries; credentials only in `.env` |
| **Inbound webhooks** | Forged POST, replay, DoS | POST webhook without shared secret | Shared secret header (constant-time compare); HTTPS only; idempotency on update id; alert on 401 spikes |
| **Admin API** | Token brute force, data exfiltration | Guess admin header token | Required admin token header; 401 without token; rate limit; alert on 401 spikes |
| **Application secrets (`.env`)** | Local privilege read | World-readable env file | `chmod 600`, root-owned; secrets not in git; deploy over VPN SSH; periodic secret audit script (no values logged) |
| **PII at rest** | DB leak, insider | Dump exposes full phone or similar fields | HMAC + salt for sensitive fields; store hash + minimal suffix only; cascade delete with account; payment flows use **hosted checkout** (provider-side card entry), server-side payment status verification |
| **UI embedding** | Clickjacking | Malicious iframe over checkout | `X-Frame-Options: SAMEORIGIN`; CSP-compatible headers; client runs top-level in host app |
| **Content-type confusion** | XSS via sniffing | Wrong MIME execution | `X-Content-Type-Options: nosniff`; JSON API; no user-upload execution on static host |
| **Referrer leakage** | URL leak to third parties | Internal paths in Referer | `Referrer-Policy: strict-origin-when-cross-origin` |
| **Application-layer flood** | HTTP flood, slowloris (partial) | Exhaust CPU/bandwidth | nginx limits; app rate limit; UFW; monitor 5xx spikes; optional provider anti-DDoS; **no** third-country CDN proxy (compliance) |
| **SSH noise (operations)** | Persistent bots | Many failed auth lines in short window | fail2ban; scheduled log review; alerts to ops channel; dedicated security log archive |
| **Data integrity & availability** | Ransomware, operator error, disk loss | Drop database or disk failure | Daily `pg_dump` (cron), retention window (e.g. 7 days), off-site copy recommended |
| **Incident response** | Late detection | Attack runs unnoticed | Typed alerts (SSH, 5xx, webhook 401, admin 401); runbook for access recovery; email queue from operator workstation if SMTP from VPS blocked |
| **Cross-border / compliance** | Wrong data routing jurisdiction | CDN or proxy abroad without basis | Production VPS in required jurisdiction; CDN not enabled where it breaks compliance story; policies documented on site |
| **Deploy pipeline** | Stolen deploy creds, MITM artifact | Malicious build pushed to prod | Deploy via Ed25519 SSH key (+ agent/passphrase); build + verify before prod; VPN target host |
| **Data on client device** | Device loss | Extract local offline cache | Sensitive cache local-only; no cloud sync for high-risk media; server is source of truth |
| **Logging & forensics** | No audit trail after incident | Cannot trace attacker | nginx access/error rotation; auth.log retention; journal for app service; fail2ban log; security aggregate log |

---

See [architecture.md](./architecture.md) and [design-decisions.md](./design-decisions.md).
