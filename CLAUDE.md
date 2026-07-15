# WC 2026 Adaptive Predictor — Project Instructions

## What This Project Is

A fully static, client-side FIFA World Cup 2026 prediction tool. No backend, no database, no auth. Deployed as a SPA on Netlify via CLI.

Live URL: https://hayahai-wc2026.netlify.app

---

## Knowledge Base

This project has an OKF knowledge bundle at `okf/`. Read `okf/index.md` before starting any code task — it documents the prediction model, the bracket-cascade scripts, and the results-data schema. Keep it in sync when those change (see `/okf-knowledge`).

---

## Stack

- **Bundler:** Vite 5 + React 18 (JSX, not TypeScript)
- **Styling:** Inline styles throughout — no CSS framework, no Tailwind
- **Theme:** Hayah Classic (cream bg `#faf7f5`, deep teal `#0a3d3a`, coral `#ff6b47`, teal green `#25A497`)
- **Fonts:** DM Serif Display (headings) + Plus Jakarta Sans (body)
- **Deployment:** Netlify CLI — no GitHub connection, no CI pipeline
- **State:** React `useState` + `useMemo` + `useCallback` only — no external state library
- **Persistence:** `localStorage` under key `wc2026:injects:v1` (user-injected deltas only)

---

## File Structure

```
worldcup-2026/
├── src/
│   ├── data/
│   │   └── results.js          ← EDIT THIS to update match results or ELO
│   ├── main.jsx                ← React entry point + ErrorBoundary
│   └── styles.css              ← Global reset + mobile media queries
├── wc2026-predictor.jsx        ← Entire app component + model functions
├── HayahaiLogo.jsx             ← Brand logo (dark variant)
├── index.html                  ← OG/Twitter meta, favicon, font preloads
├── netlify.toml                ← Build config + security headers
├── vite.config.js
├── package.json
├── MODEL.md                    ← Prediction model documentation
└── CLAUDE.md                   ← This file
```

---

## Daily Update Workflow

The owner updates results manually — no browser automation or scraping.

1. Open `src/data/results.js`
2. Find `BASE_MATCH_LOG` and add new confirmed scores as `{opp, gf, ga}` entries
3. Say **"build and deploy"** — run: `npm run build && npx netlify-cli deploy --prod`

That is the complete workflow. Do not deviate from it.

---

## Key Data Constants (all in `src/data/results.js`)

| Constant | Purpose |
|---|---|
| `PRE_ELO` | Official pre-tournament Elo for all 48 teams (from eloratings.net WC 2026 start ratings) |
| `ELO_EXACT` | Set of all 48 team abbreviations — all from the official eloratings.net source |
| `BASE_MATCH_LOG` | Immutable official results — the one thing that gets edited between deploys |
| `NAMES` | Team abbreviation → full name map |
| `FLAGS` | Team abbreviation → flag emoji map |
| `GROUPS` | Group letter → team abbreviations |
| `MATCH_SCHEDULE` | Full fixture list with dates, groups, venues (MD2–MD3 Jun 22–27 2026) |

---

## Persistence Architecture

- `BASE_MATCH_LOG` is the immutable baseline embedded at build time
- User injects are stored as a delta array in `localStorage` under `wc2026:injects:v1`
- `buildMatchLog(injects)` merges baseline + deltas on every render — never caches the merged result
- Deploying an updated `BASE_MATCH_LOG` always propagates to all visitors on next page load
- `SCHEDULED_UNPLAYED` = `MATCH_SCHEDULE` entries not yet in `BASE_MATCH_LOG` — controls what the Official Results tab allows

---

## Model Functions — Do Not Modify Without Being Explicitly Asked

These functions implement the prediction model (documented in `MODEL.md`). Do not refactor, rename, or alter their logic unless the user explicitly asks:

- `recencyWeights(n, halflife)` — exponential decay weights
- `computeAllEarnedElos(matchLog)` — single chronological pass, mutual Elo update for all 48 teams
- `computeIndices(abbr, halflife, matchLog, liveElos)` — per-team index calculation; takes `liveElos` map from `computeAllEarnedElos`
- `poisson(lambda, k)` — Poisson probability function
- `predict(aAbbr, bAbbr, cfg, matchLog)` — full ensemble prediction

---

## Tunable Parameters (CFG)

All controlled via the **Features Tuning** tab. Defaults live in `CFG_DEFAULTS` in `wc2026-predictor.jsx`. URL params persist the current state.

| Key | Default | Role |
|---|---|---|
| `wForm` | 1.0 | Form index weight |
| `wMom` | 1.0 | Momentum weight |
| `wDSI` | 1.0 | Defensive solidity weight |
| `wConv` | 1.0 | Convincing wins weight |
| `wSOS` | 1.0 | Strength-of-schedule adjustment |
| `wExp` | 1.0 | KO experience factor |
| `shrink` (k) | 1.5 | Prior shrinkage — trust in pre-tournament Elo vs earned Elo |
| `halflife` | 1.5 | Recency decay — how fast older matches fade |

---

## Deploy Command

```bash
npm run build && npx netlify-cli deploy --prod
```

Never push to GitHub — there is no connected repo. Deploy is always CLI only.

---

## What Not To Do

- Do not add TypeScript — this project is plain JSX by design
- Do not add a CSS framework or replace inline styles
- Do not add a backend, API routes, or database
- Do not alter model math functions unless explicitly asked
- Do not add features beyond what is asked — the app is intentionally minimal
- Do not commit `.env` files (there are none, but keep it that way)
