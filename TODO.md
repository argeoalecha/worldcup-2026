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
- ~~[PERFORMANCE] Move `Slider` out of `ProgressivePredictor` (module scope)~~ (resolved 2026-06-23) — moved to module scope with `cfg`/`onSet` props; `C` palette also moved to module scope. Slider no longer remounts on every parent render.
- ~~[A11Y] Make the clickable group box a real `<button>`~~ (resolved 2026-06-23) — added `role="button"`, `tabIndex={0}`, `aria-expanded`, `aria-label`, `onKeyDown` (Enter/Space). Kept as `<div>` to avoid nesting buttons.
- ~~[A11Y] Add `aria-label`/associated `<label>` to team/opponent `<select>` and goal number `<input>` controls~~ (resolved 2026-06-23) — added `aria-label` to all 4 selects (Team A, Team B, Team, Opponent) and both goal inputs (dynamic: "ARG goals", etc.) in predict + inject tabs. Slider inputs also labelled.
- ~~[A11Y] Raise contrast of `C.dim` (#7a9b96 on cream ≈ 2.85:1)~~ (resolved 2026-06-23) — changed to `#506c67` (≈5.2:1 against cream #faf7f5), meets WCAG AA 4.5:1.

### Low / Advisory (next sprint)
- [ ] [QUALITY] Split the 721-line file into data / model / component modules — `wc2026-predictor.jsx`
- [ ] [QUALITY] Add unit tests for `predict`, `computeIndices`, `poisson`
- [ ] [QUALITY] Consider TypeScript + ESLint to match workspace standard
- ~~[A11Y] Add `aria-label="Close"` to the group panel `×` button~~ (resolved 2026-06-23)
- ~~[RELIABILITY] Add idempotency/dedup to knockout inject~~ (resolved 2026-06-23) — `setInjects` updater function now returns `prev` unchanged if the same KO round + matchup already exists.
- ~~[READINESS] Add `README.md`~~ (resolved 2026-06-23) — dev/build/deploy/persistence instructions added.
- ~~[READINESS] Add `.netlify/` to `.gitignore`~~ (resolved 2026-06-23) — added `.netlify` and `.vscode`.
- [ ] [READINESS] Track vite@8 upgrade to clear dev-only esbuild advisory (breaking change)
- [ ] [READINESS] Optional: add Sentry client-side error monitoring
