# TODO — FIFA World Cup 2026 Predictor

## Phase 1: Audit Remediation (2026-06-23)
Source: AUDIT.md (this audit run)
Audit verdict: GO with risks accepted

### Critical (BLOCKS DEPLOYMENT)
- None.

### High (must fix before relying on redeploy for daily updates)
- ~~[RELIABILITY] localStorage shadows updated baseline data~~ (resolved 2026-06-23) — now persists only user-injected deltas under `wc2026:injects:v1` and rebuilds the match log from the current `BASE_MATCH_LOG` each render, so redeployed baseline data always reaches returning visitors. Verified: old `wc2026:matchLog:v1` key is ignored.

### Medium (fix this sprint)
- ~~[RELIABILITY] Add a React error boundary~~ (resolved 2026-06-23) — added `ErrorBoundary` in `src/main.jsx` with a fallback + "Reset & reload".
- ~~[SECURITY] Add a `[[headers]]` block in `netlify.toml`~~ (resolved 2026-06-23) — CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy. Verified served on production.
- [ ] [PERFORMANCE] Move `Slider` out of `ProgressivePredictor` (module scope) so it stops remounting every render — `wc2026-predictor.jsx:~349`
- [ ] [A11Y] Make the clickable group box a real `<button>` (or add `role="button"`, `tabIndex={0}`, `onKeyDown`) — `wc2026-predictor.jsx:~565`
- [ ] [A11Y] Add `aria-label`/associated `<label>` to team/opponent `<select>` and goal number `<input>` controls — predict + inject tabs
- [ ] [A11Y] Raise contrast of `C.dim` (#7a9b96 on cream ≈ 2.85:1) to meet WCAG AA 4.5:1 — `wc2026-predictor.jsx:347`

### Low / Advisory (next sprint)
- [ ] [QUALITY] Split the 721-line file into data / model / component modules — `wc2026-predictor.jsx`
- [ ] [QUALITY] Add unit tests for `predict`, `computeIndices`, `poisson`
- [ ] [QUALITY] Consider TypeScript + ESLint to match workspace standard
- [ ] [A11Y] Add `aria-label="Close"` to the group panel `×` button — `wc2026-predictor.jsx:~545`
- [ ] [RELIABILITY] Add idempotency/dedup to knockout inject (prevent double-click duplicates) — `wc2026-predictor.jsx`
- [ ] [READINESS] Add `README.md` (dev/build/deploy instructions)
- ~~[READINESS] Add `.netlify/` to `.gitignore`~~ (resolved 2026-06-23) — added `.netlify` and `.vscode`.
- [ ] [READINESS] Track vite@8 upgrade to clear dev-only esbuild advisory (breaking change)
- [ ] [READINESS] Optional: add Sentry client-side error monitoring
