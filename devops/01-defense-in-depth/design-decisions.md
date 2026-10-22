# Design decisions (deliberate non-goals)

| Decision | Rationale |
|----------|-----------|
| **No public CDN / WAF (e.g. Cloudflare) on this deployment** | Data residency and compliance constraints for personal data; traffic stays on VPS in target jurisdiction; simpler regulatory story at current scale |
| **No SSH on public interface** | SSH listens only on VPN interface; reduces botnet noise and credential stuffing |
| **No polling bot worker in production** | Inbound **webhook** mode for the messaging integration; separate long-poll service disabled |
| **No plaintext storage for sensitive PII** | Phone-like identifiers stored as HMAC + last digits; see matrix row **PII at rest** |
| **No application port on firewall** | API reachable only via nginx on localhost upstream |

These are trade-offs, not universal rules - document **why** for audits and interviews.
