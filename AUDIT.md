# Pre-Production Audit Report
Date: 2026-06-23
Project type: Web App (static client-only SPA — Vite + React, no backend/DB/auth)
Branch: main
Commit: 6c49fb9

## Phase 0: Pre-flight — PASS (with advisories)
- Branch: on `main` (acceptable for this solo CLI-deploy workflow; no feature-branch gate)
- Working tree: no uncommitted tracked changes
- Untracked: `.netlify/`, `.vscode/` — should be gitignored (advisory)
- Lockfile: present (`package-lock.json`)
- Conflict markers: none

## Phase 1: Build Validation — PASS
- TypeScript: N/A (project is `.jsx`, no type checking configured)
- ESLint: N/A (no lint config present)
- Tests: N/A (no test script / framework)
- Production build: PASS
- Bundle size: largest chunk 180.66 KB (57.24 KB gzip) — within app budget (<250 KB raw)
- `npm audit`: 2 vulns (1 moderate, 1 high) — both in **esbuild/vite (dev-only)**. The esbuild advisory (GHSA-67mh-4wv8-2f99) affects only the local dev server; neither package ships in the static build. No production exposure.

## Phase 2: Static Analysis Findings

Security surface is minimal: no secrets, no network/fetch, no `eval`/`Function`, no `dangerouslySetInnerHTML`, URL params are validated + clamped in `parseUrlParams()`, all dynamic content rendered as React-escaped text. No Critical findings.

### Critical (block deployment)
- None.

### High (fix before next baseline update)
- [RELIABILITY] **localStorage shadows updated baseline data.** `loadMatchLog()` returns stored `wc2026:matchLog:v1` whenever present, falling back to `BASE_MATCH_LOG` only when absent. Baseline data has been updated (e.g. FRA 3–0 IRQ, NOR 3–2 SEN, ARG 2–0 AUT) without bumping the version key, so **returning visitors keep seeing stale results** until they hit "Reset to deployment default." This directly undermines the daily-update-then-redeploy workflow. — `wc2026-predictor.jsx:92, 94-101` (and `KO_KEY` 154)

### Medium
- [RELIABILITY] **No React error boundary.** Any render-time exception blanks the entire page with no fallback UI — exactly the white-screen failure mode already hit once (the koMatches TDZ). — `src/main.jsx`, app root
- [RELIABILITY/PERF] **`Slider` component is defined inside `ProgressivePredictor`.** A new function identity is created every render, so React remounts each slider on every state change — causing janky dragging / focus loss on the Tune tab. — `wc2026-predictor.jsx:~349`
- [A11Y] **Clickable group box is a `<div onClick>`** with no `role="button"`, `tabIndex`, or key handler → not keyboard operable. — `wc2026-predictor.jsx:~565`
- [A11Y] **Form controls lack programmatic labels.** `<select>` (team/opponent) and number `<input>` (goals) rely on visual `<div>` text, not `<label htmlFor>`/`aria-label`. — predict + inject tabs
- [A11Y] **Muted text fails WCAG AA contrast.** `C.dim` `#7a9b96` on cream `#faf7f5` ≈ 2.85:1 (needs 4.5:1), used pervasively for secondary text at 9–12 px. — `wc2026-predictor.jsx:347`
- [SECURITY] **No security headers** (CSP, X-Frame-Options, X-Content-Type-Options) in `netlify.toml`. Low risk for a no-auth/no-PII static app, but cheap defense-in-depth (e.g. clickjacking via framing). — `netlify.toml`

### Low / Advisory
- [QUALITY] 721-line single file mixes data + model + UI; consider splitting `data`, `model`, and component. — `wc2026-predictor.jsx`
- [QUALITY] No unit tests on the pure model functions (`predict`, `computeIndices`, `poisson`) — high-value and trivially testable. — N/A
- [QUALITY] No TypeScript / ESLint — contrary to workspace standard ("TS strict always"); no static safety on a `.jsx` app.
- [A11Y] `×` close button on the group panel lacks `aria-label`. — `wc2026-predictor.jsx:~545`
- [RELIABILITY] Knockout inject has no idempotency — double-click adds duplicate entries to `koMatches` and `matchLog`. — `wc2026-predictor.jsx:316-329`
- [READINESS] No `README.md` (setup/build/deploy docs).
- [READINESS] `.netlify/` not in `.gitignore`.
- [READINESS] Dev-only dep vulns (esbuild/vite) — fix is a breaking `vite@8` upgrade; track, low urgency.
- [READINESS] No client error monitoring (Sentry) — optional for a static app.
- [READINESS] Deploy from `main` via CLI with no CI / branch protection — acceptable for solo, noted only.

## Phase 3: Production Readiness Checklist
| Category | Item | Status |
|---|---|---|
| Env | Env vars / secrets | N/A — app uses none |
| Env | `.env*` in `.gitignore` | PASS |
| Env | `.netlify/` ignored | FAIL (advisory) |
| Monitoring | Error tracking (Sentry) | FAIL (advisory — optional for static) |
| Monitoring | Health endpoint | N/A (static) |
| Rate limiting | Public endpoints | N/A (no backend) |
| Security headers | CSP / X-Frame-Options / nosniff | FAIL (Medium) |
| Security headers | HSTS | PASS (auto on netlify.app) |
| Data integrity | DB migrations / backups | N/A (no DB; source in git) |
| CI/CD | CI runs build on PR | FAIL (advisory — solo CLI deploy) |
| Docs | README | FAIL (advisory) |
| Netlify | build command + publish dir | PASS (`netlify.toml`) |

## Phase 4: TODO Writeback
Appended findings to TODO.md under "Phase 1: Audit Remediation (2026-06-23)".

## Summary
Critical: 0 | High: 1 | Medium: 6 | Low/Advisory: 11
Readiness: core gates PASS; advisory gates open (headers, docs, monitoring)
Verdict: **GO with risks accepted** (app already live; no critical/security blockers)

## Sign-off

**Verdict: GO with risks accepted**

### Blockers (must resolve before deploy)
- None. Build passes; no Critical findings; no secret/injection exposure.

### Risks Accepted (already deployed)
- [RELIABILITY High] localStorage shadows updated baseline — Justification: site is functional and most early traffic is first-time visitors (empty localStorage) who see fresh data; the "Reset to deployment default" button is a manual workaround. Follow-up due: 2026-06-30 (before relying on redeploy to push daily results to returning users).
- [SECURITY Medium] No security headers — Justification: no auth, no PII, no cookies; clickjacking impact is negligible. Follow-up due: next deploy.

### Approved for deployment to: production (https://hayahai-wc2026.netlify.app)
By: a.t.alecha@outlook.com
On: 2026-06-23

### Next re-audit triggered by:
- Code change in `wc2026-predictor.jsx`
- Dependency upgrade (e.g. vite@8)
- Time elapsed: 30 days

## Recommended Follow-ups

Detected project stage: C. Launched (V1) — production live on netlify.app subdomain, shared on social, no custom domain, no backend/users-table yet.

### Recommended now (current stage)
- [ ] Fix the localStorage/baseline freshness issue — it's the linchpin of your daily-update workflow.
- [ ] `/web-perf-audit` on the live URL — verifies delivered security headers + CDN caching that this static audit can't see.
- [ ] Add a React error boundary — you've already had one white-screen crash; this prevents the next from blanking the whole app.

### Plan for next stage (D. Growth)
- [ ] If injected results should be global (not per-browser), introduce a small backend (Supabase) — becomes relevant the moment you want viewers to see live scores without a redeploy.
- [ ] Add unit tests around the prediction model before it grows more complex.

### Out of scope for this audit
- Manual penetration testing — not warranted at this stage/surface.
- Real user research — qualitative usability, requires actual users.
- Legal review — N/A (no data collection, no ToS/privacy surface).
