---
type: Module
title: ProgressivePredictor (main app component)
description: Single-file React component holding the entire app — tabs, model math, and bracket cascade logic.
resource: wc2026-predictor.jsx
tags: [react, ui, model]
timestamp: 2026-07-12T14:50:46Z
---

# Purpose
`wc2026-predictor.jsx` is the whole app: one default-exported component (`ProgressivePredictor`, line 355) plus the model functions it calls. No component splitting — this is a deliberate project convention (see `CLAUDE.md`), not an oversight.

# Tabs
State `tab` (line 361) switches between six views rendered in the same component, generated from an array (line 443) and labeled inline (line 445): `predict` (⚔️ Predict), `schedule` (📅 Schedule — group + KO fixture lists), `brackets` (🏆 Brackets — live-computed bracket view, distinct from the static SVG in [bracket-cascade](/modules/bracket-cascade.md)), `indices` (📈 Power Ranking), `tune` (🎛️ Features Tuning), `inject` (📋 Official Results — read-only display of [BASE_KO_RESULTS](/tables/results-data.md) and `GROUP_STANDINGS`; despite the tab id, there is no UI to add new results — see caveat below).

# Key entry points
| Symbol | Line | Description |
|---|---|---|
| `resolveWinner(mn, koMatches)` | 24 | Resolves the winning team abbreviation for a given knockout match number, honoring `pen:true` shootouts. |
| `resolveLoser(mn, koMatches)` | 45 | Same, for the loser (feeds the 3rd-place playoff). |
| `resolveMatchTeams(mn, koMatches)` | 63 | Resolves both sides of a bracket slot (`wA`/`wB`/`lA`/`lB` references) into concrete team abbreviations. |
| `loadInjects()` / `mergeInjects()` | 84, 109 | Reads/merges user-entered result deltas from `localStorage`. |
| `buildMatchLog(injects)` | 93 | Merges `BASE_MATCH_LOG` (see [results-data](/tables/results-data.md)) + injects into the live match log used everywhere else. Never cached — rebuilt every render. |
| `predict(aAbbr, bAbbr, cfg, matchLog, penA, penB)` | 238 | Full ensemble prediction — see [prediction-model](/modules/prediction-model.md). |
| `computeTravelInfo(fromVenue, toVenue)` | 323 | Haversine distance + fatigue penalty between a team's previous and next venue. |

# Dependencies
- [results.js data tables](/tables/results-data.md) — all static tournament data (Elo, schedules, official results).
- [prediction-model](/modules/prediction-model.md) — the math the UI calls into.

# Caveats
- Model math functions (`recencyWeights`, `computeAllEarnedElos`, `computeIndices`, `poisson`, `predict`) are marked **do not modify without explicit request** in the project's `CLAUDE.md` — treat them as frozen unless the user asks otherwise.
- `CFG_DEFAULTS` (line 115) is the single source of truth for default tunable weights; the Features Tuning tab's URL params round-trip through `parseUrlParams()` (line 118).
- The manual result-injection UI was removed (`d88645a`, 2026-07-13). `loadInjects()`/`mergeInjects()` (lines 84, 109) and `wc2026:injects:v1` `localStorage` now exist only to detect and clear **legacy** locally-added results from before this change — via `resetMatchLog()` (line 403) and the "Reset all locally-added results" button on the Official Results tab. There is no remaining path for a visitor to add a result; all results ship in `BASE_MATCH_LOG`/`BASE_KO_RESULTS` at deploy time.
