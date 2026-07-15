# FIFA World Cup 2026 — Predictor

Progressive Elo-Poisson-Bayesian match predictor for the FIFA World Cup 2026, covering all 48 teams through group stage and knockouts. Results are read-only — the owner updates confirmed scores after each matchday and redeploys; predictions recalibrate from there.

Live: **https://hayahai-wc2026.netlify.app**

## Stack

Vite + React 18 SPA (plain JSX, inline styles, no CSS framework). No backend. All state is client-side.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # output → dist/
npm run preview    # preview the production build locally
```

## Deploy

Manual deploy via Netlify CLI (no GitHub connection):

```bash
npm run build
npx netlify-cli deploy --prod
```

## How it works

- **Predict tab**: pick two teams, get win/draw/loss % + xG, Elo, and index comparison. Toggle group/knockout mode and travel-fatigue adjustment. Share via URL (all params, including tuning weights, persist in the query string).
- **Schedule tab**: group-stage fixtures by group (click a group for match-by-match detail) and the full knockout bracket schedule (R32 → Final) with resolved/pending matchups and confirmed scores.
- **Brackets tab**: a static rendered graphic of the full knockout bracket — confirmed results shown as-is, unresolved matches cascade-predicted by the model (with travel fatigue applied) all the way to a projected champion. Regenerated from `src/data/results.js`, not live-computed in the browser.
- **Power Ranking tab**: live power ranking recomputed from all confirmed results.
- **Features Tuning tab**: adjust the 8 model weights and learning controls (prior shrinkage, recency half-life), plus the travel fatigue toggle.
- **Official Results tab**: read-only group standings and knockout results as confirmed in `src/data/results.js`.

## Persistence

`localStorage` under `wc2026:injects:v1` only holds legacy locally-added results from before results became read-only. If a returning visitor has stale entries there, the Official Results tab shows a "Reset all locally-added results" button to clear them. There is no in-app way to add new results — all results come from the deployed baseline.

## Updating results

1. Edit `src/data/results.js`:
   - `BASE_MATCH_LOG` + `GROUP_STANDINGS` for group-stage scores
   - `BASE_KO_RESULTS` for confirmed knockout results (`{round, team, opp, gf, ga}`, `pen`/`penTeam`/`penOpp` for shootouts)
2. If knockout results changed, regenerate the Brackets tab graphic:
   ```bash
   node scripts/bracket-graphic.mjs
   ```
   (runs `scripts/predict-bracket.mjs`, which cascades the model through unresolved rounds using the same functions as the live app, and writes `bracket-prediction.svg`/`.html`)
3. `npm run build && npx netlify-cli deploy --prod`

Returning visitors see the updated baseline on their next page load.

## Environment variables

None required. This is a fully static SPA.

## Key files

| File | Purpose |
|---|---|
| `wc2026-predictor.jsx` | Entire app UI + model functions |
| `src/data/results.js` | All tournament data — Elo, results, standings, schedule. The one file edited between deploys |
| `scripts/predict-bracket.mjs` | Standalone cascade predictor (R32 → Final), verbatim copy of the app's model |
| `scripts/bracket-graphic.mjs` | Renders `bracket-prediction.svg`/`.html` from the cascade |
| `HayahaiLogo.jsx` | Brand logo (dark variant for Midnight header) |
| `src/main.jsx` | React entry point + error boundary |
| `src/styles.css` | Global reset + mobile media queries |
| `netlify.toml` | Build config + security headers |
| `index.html` | OG/Twitter meta tags, favicon, font preloads |
| `MODEL.md` | Full model documentation (indices, ensemble, travel fatigue) |
