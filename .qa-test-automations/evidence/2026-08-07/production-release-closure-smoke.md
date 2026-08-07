# Production release closure smoke

- Verified at: `2026-08-07T10:16:38+09:00`
- Production: `https://gaepyo-tycoon.web.app`
- PR: #11, `MERGED`, `2026-08-06T15:29:49Z`
- Merge commit: `6977a5d529a24ce4fe198caa26e32d3491172120`
- GitHub CI `test-build`: `COMPLETED / SUCCESS`

| Route | HTTP | Content-Type | Cache-Control |
|---|---:|---|---|
| `/` | 200 | `text/html; charset=utf-8` | `no-cache, max-age=0, must-revalidate` |
| `/privacy.html` | 200 | `text/html; charset=utf-8` | `max-age=3600` |
| `/manifest.webmanifest` | 200 | `application/manifest+json` | `no-cache, max-age=0, must-revalidate` |
| `/sw.js` | 200 | `text/javascript; charset=utf-8` | `no-cache, no-store, must-revalidate` |
| `/release-smoke-spa-fallback` | 200 | `text/html; charset=utf-8` | `max-age=3600` |

The smoke check used read-only HTTP requests. GitHub PR state and check conclusion were queried with `gh pr view 11`.
