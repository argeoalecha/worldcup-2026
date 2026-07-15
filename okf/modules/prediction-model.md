---
type: Module
title: Prediction Model (Elo + Poisson ensemble)
description: The match-prediction ensemble — earned Elo, form indices, Poisson/Dixon-Coles scoreline model, and travel fatigue — documented in full in MODEL.md.
resource: MODEL.md
tags: [model, elo, poisson, prediction]
timestamp: 2026-07-12T14:50:46Z
---

# Purpose
Predicts win/draw/loss probability and a most-likely scoreline for any two teams, blending pre-tournament Elo with in-tournament form. Full derivation and parameter rationale lives in `MODEL.md` (260 lines) — this concept is the index/summary an agent should read first.

# Pipeline (in call order)
1. `computeAllEarnedElos(matchLog)` (predictor line 168) — single chronological pass over all played matches, mutual Elo update for all 48 teams, seeded from [PRE_ELO](/tables/results-data.md).
2. `computeIndices(abbr, halflife, matchLog, liveElos)` (line 199) — per-team form index, momentum, defensive solidity (DSI), convincing-win index, strength-of-schedule (SOS), attack/defense rates. Recency-weighted via `recencyWeights(n, halflife)` (line 157, exponential decay).
3. `predict(aAbbr, bAbbr, cfg, matchLog, penA, penB)` (line 238) — blends earned Elo (shrunk toward `PRE_ELO` by games-played via `cfg.shrink`) with the weighted indices into a logistic win probability, and separately into Poisson-distributed scorelines adjusted by a Dixon-Coles low-score correlation term (`dixonColesTau`, line 230, rho=-0.13). The two probability estimates are blended by `dataMaturity` (average games-played weight) — early tournament trusts Elo more, later trusts the Poisson scoreline blend more.
4. Knockout-only: `cfg.knockout` reallocates the draw probability into a KO win split (`koWinA`/`koWinB`) weighted by pre-tournament experience (`cfg.wExp`), since draws can't stand in a KO match.

# Travel fatigue
`computeTravelInfo(fromVenue, toVenue)` (line 323) + `VENUE_INFO` (line 279): haversine distance between a team's previous and next match venue, plus timezone shift (`tz`, hours behind Eastern), penalizes `scoreA`/`scoreB` up to 20 Elo-score points and shrinks the Poisson lambda proportionally. East-shift travel compounds the distance burden.

# Tunable parameters (CFG)
All exposed via the Features Tuning tab and persisted in the URL. Defaults in `CFG_DEFAULTS` (predictor line 115):

| Key | Default | Role |
|---|---|---|
| `wForm` | 1.0 | Form index weight |
| `wMom` | 1.0 | Momentum weight |
| `wDSI` | 1.0 | Defensive solidity weight |
| `wConv` | 1.0 | Convincing-win weight |
| `wSOS` | 1.0 | Strength-of-schedule adjustment |
| `wExp` | 1.0 | KO experience factor |
| `shrink` | 1.5 | Prior shrinkage — trust in `PRE_ELO` vs earned Elo |
| `halflife` | 1.5 | Recency decay for match weighting |

# Dependencies
- [results-data tables](/tables/results-data.md) — `PRE_ELO`, `MATCH_SCHEDULE`, `BASE_MATCH_LOG`, `BASE_KO_RESULTS`.
- Consumed by [predictor-component](/modules/predictor-component.md) (UI) and [bracket-cascade](/modules/bracket-cascade.md) (standalone scripts).

# Caveats
- **Do not modify** `recencyWeights`, `computeAllEarnedElos`, `computeIndices`, `poisson`, or `predict` without an explicit user request — pinned in the project `CLAUDE.md`.
- `predict-bracket.mjs` keeps a **verbatim copy** of these functions (not imported) — a model change must be applied in both `wc2026-predictor.jsx` and `scripts/predict-bracket.mjs`/`scripts/bracket-graphic.mjs` to stay in sync.
