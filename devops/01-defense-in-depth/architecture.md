# Architecture - defence in depth

```
Internet
   |
   v
[UFW: 80,443 public only] --> [nginx: TLS, limit_req, security headers]
   |                                |
   |                                v
   |                          [127.0.0.1:APP_PORT  API server]
   |                                |
   |                                +-- signed client context (HMAC)
   |                                +-- rate limit
   |                                +-- webhook secret
   |                                +-- admin token header
   v
[127.0.0.1:5432  PostgreSQL]

Admin path (parallel):
Operator --> [Private mesh VPN] --> [SSH bound to VPN interface] --> VPS
Fallback: hosting provider out-of-band console (VNC / serial)
```

**Principles**

- Public surface: only reverse proxy ports.
- Application and database: loopback bind only.
- Administration: not exposed on `0.0.0.0:22`; VPN-first.
