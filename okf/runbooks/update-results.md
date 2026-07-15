---
type: Runbook
title: Update results and deploy
description: The complete, only workflow for pushing new match results live — manual edit, no automation, no CI.
resource: CLAUDE.md
tags: [deploy, runbook, netlify]
timestamp: 2026-07-12T14:50:46Z
---

# When to use
Any time a real-world match result (group stage or knockout) needs to go live on the site.

# Steps
1. Open [results-data](/tables/results-data.md) (`src/data/results.js`).
2. Group stage: append a `{opp, gf, ga}` entry to `BASE_MATCH_LOG` for the relevant team.
   Knockout stage: append a `{round, team, opp, gf, ga}` entry to `BASE_KO_RESULTS` (add `pen:true, penTeam, penOpp` for shootouts). `team` is always the advancing side.
3. Optionally regenerate the shareable bracket artifacts: `node scripts/predict-bracket.mjs` (markdown cascade check) then `node scripts/bracket-graphic.mjs` (regenerates `bracket-prediction.svg`/`.html`) — see [bracket-cascade](/modules/bracket-cascade.md).
4. Build and deploy: `npm run build && npx netlify-cli deploy --prod`.

# What NOT to do
- Do not scrape or automate result fetching — results are entered manually by the owner.
- Do not push to GitHub — there is no connected repo; deploy is Netlify CLI only.
- Do not modify [prediction-model](/modules/prediction-model.md) math functions as part of a results update unless explicitly asked.

# Live URL
https://hayahai-wc2026.netlify.app
