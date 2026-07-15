---
type: Module
title: Bracket Cascade Scripts
description: Standalone Node scripts that resolve the KO bracket tree from official results and render predicted winners through to the Final as markdown + SVG/HTML.
resource: scripts/predict-bracket.mjs
tags: [bracket, cli, svg, prediction]
timestamp: 2026-07-12T14:50:46Z
---

# Purpose
Two scripts generate the shareable bracket artifacts (not used by the live app UI — the UI computes its own Bracket tab view live):

- `scripts/predict-bracket.mjs` — imports the real data tables, re-implements the model verbatim, and cascades R32 → R16 → QF → SF → Final, printing a markdown table per round plus a podium summary.
- `scripts/bracket-graphic.mjs` — imports `results`, `winnerOf`, `loserOf`, `NAMES`, `FLAGS` from `predict-bracket.mjs` and renders the same cascade as an SVG mirroring FIFA's official bracket layout (R32 on outer edges converging to a centered Final, 3rd-place playoff below), plus an HTML wrapper. Writes `bracket-prediction.svg` / `.html` to the repo root.

# Cascade logic
- A match number (`mn`) resolves its two sides from either [BASE_KO_RESULTS](/tables/results-data.md) (if already played — shown as `✓ result`) or a `predict()` call against the two teams resolved from the child matches' winners (`wA`/`wB`) or losers (`lA`/`lB`, only for the 3rd-place playoff, M103).
- The bracket tree structure (`L`/`R` objects in `bracket-graphic.mjs`, lines 18–25) hardcodes which match numbers feed which — this must be kept in sync with `QF_SCHEDULE`/`SF_SCHEDULE`/`FINAL_SCHEDULE` in [results-data](/tables/results-data.md) if the schedule ever changes.

# Dependencies
- [prediction-model](/modules/prediction-model.md) — verbatim copy of the model functions (see caveat there about keeping in sync).
- [results-data](/tables/results-data.md) — `PRE_ELO`, `BASE_MATCH_LOG`, `BASE_KO_RESULTS`, schedules.

# Caveats
- Match numbering: R32 = M73–M88, R16 = M89–M96, QF = M97–M100, SF = M101–M102, 3rd place = M103, Final = M104.
- Re-run both scripts (`node scripts/predict-bracket.mjs` then `node scripts/bracket-graphic.mjs`) any time `BASE_KO_RESULTS` changes — outputs are not auto-regenerated on build. See the [update-results runbook](/runbooks/update-results.md).
