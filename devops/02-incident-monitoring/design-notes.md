# Design notes

## Dedicated ops alert channel

Security and ops alerts go to a **separate messaging channel**, not the same thread as product notifications. Reduces alert fatigue and makes 401/SSH spikes visible without mixing user signup noise.

Configuration uses env vars only on the server (channel id, bot token) - never committed.

## Email from operator workstation (one paragraph)

Some VPS providers **block outbound SMTP** (e.g. to consumer mail hosts). Then the server **enqueues** admin or security notification payloads locally, and a **scheduled job on the operator PC** (or another trusted network) runs a small script to deliver mail via a normal ISP or office SMTP path.

Why publish this pattern: it shows real-world ops (provider constraints) without exposing scripts, paths, or addresses. Alternatives: third-party transactional email API with VPS allowlisting, or alerts-only via messaging with no email.

## What we do not rely on for solo scale

- Full anti-DDoS appliance on-box (CPU/memory cost).
- Public CDN by default when compliance prefers traffic in one jurisdiction (see [design-decisions](../01-defense-in-depth/design-decisions.md) in defense-in-depth doc).

When traffic grows: nginx rate limits first, then provider anti-DDoS or CDN as a **documented** compliance decision.
