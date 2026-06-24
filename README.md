# FIFA World Cup 2026 — Predictor

Progressive Elo-Poisson match predictor for the FIFA World Cup 2026. Injects live results and recalibrates all predictions in real time.

Live: **https://hayahai-wc2026.netlify.app**

## Stack

Vite + React 18 SPA. No backend. All state is client-side.

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

- **Predict tab**: pick two teams, get win/draw/loss % + xG. Toggle group/knockout mode. Share via URL.
- **Schedule tab**: view the group stage fixture list. Click any group box for fixture details with dates and venues. Today's matches shown at top.
- **Indices tab**: live power ranking recomputed from all injected results.
- **Tune tab**: adjust the 8 model weights and learning controls.
- **Inject tab**: enter a final score to update the model. Group stage enforces same-group opponents. Knockout stage deduplicates same matchup.

## Persistence

User-injected results are saved in `localStorage` under `wc2026:injects:v1` as a plain array of deltas. The match log is rebuilt on every render by replaying injects on top of the current `BASE_MATCH_LOG`, so updated baseline data (from a redeploy) always reaches returning visitors.

Reset: click **Reset all results to default** in the Inject tab.

## Updating baseline results

1. Edit `BASE_MATCH_LOG` in `wc2026-predictor.jsx` with the new confirmed scores.
2. `npm run build`
3. `npx netlify-cli deploy --prod`

Returning visitors will see the updated baseline on their next page load.

## Environment variables

None required. This is a fully static SPA.

## Key files

| File | Purpose |
|---|---|
| `wc2026-predictor.jsx` | Entire app: data, model, component |
| `HayahaiLogo.jsx` | Brand logo (dark variant for Midnight header) |
| `src/main.jsx` | React entry point + error boundary |
| `src/styles.css` | Global reset + mobile media queries |
| `netlify.toml` | Build config + security headers |
| `index.html` | OG/Twitter meta tags, favicon, font preloads |
