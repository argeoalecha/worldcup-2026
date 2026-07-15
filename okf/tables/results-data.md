---
type: Table
title: results.js data constants
description: All static tournament data — Elo ratings, team metadata, official results, and the full match schedule.
resource: src/data/results.js
tags: [data, elo, schedule, results]
timestamp: 2026-07-12T14:50:46Z
---

# Constants
| Constant | Line | Purpose |
|---|---|---|
| `PRE_ELO` | 3 | Official pre-tournament Elo for all 48 teams (eloratings.net WC 2026 start ratings). |
| `ELO_EXACT` | 15 | Set of all 48 team abbreviations derived from `PRE_ELO` keys. |
| `BASE_MATCH_LOG` | 21 | Immutable official group-stage results, keyed by team abbreviation. |
| `GROUP_STANDINGS` | 87 | Computed/cached group table standings. |
| `NAMES` | 163 | Team abbreviation → full display name. |
| `FLAGS` | 175 | Team abbreviation → flag emoji. |
| `GROUPS` | 185 | Group letter → member team abbreviations. |
| `R32_SCHEDULE` | 198 | Round of 32 fixture list (dates, venues). |
| `R16_SCHEDULE` | 225 | Round of 16 — each entry references `wA`/`wB` match numbers whose winners meet here. |
| `QF_SCHEDULE` | 241 | Quarter-finals — same `wA`/`wB` convention. |
| `SF_SCHEDULE` | 249 | Semi-finals — same convention. |
| `FINAL_SCHEDULE` | 257 | M103 (3rd place, `lA`/`lB` = SF losers) and M104 (Final, `wA`/`wB` = SF winners). |
| `BASE_KO_RESULTS` | 269 | Confirmed knockout results (R32 onward) — the KO analog of `BASE_MATCH_LOG`. Each entry: `{round, team, opp, gf, ga, pen?, penTeam?, penOpp?}`. |
| `MATCH_SCHEDULE` | 303 | Full group-stage fixture list (MD2–MD3, Jun 22–27 2026). |

# `BASE_KO_RESULTS` entry shape
```js
{round:"QF", team:"FRA", opp:"MAR", gf:2, ga:0}
// Convention: `team` = the advancing side. resolveWinner/resolveLoser honor pen:true.
{round:"R32", team:"PAR", opp:"GER", gf:1, ga:1, pen:true, penTeam:4, penOpp:3}
// Penalty shootout: gf===ga is the regulation/AET score; penTeam/penOpp are shootout goals.
```
`round` ∈ `"R32" | "R16" | "QF" | "SF" | "Final"`.

# Match number ranges
R32 = M73–M88 · R16 = M89–M96 · QF = M97–M100 · SF = M101–M102 · 3rd place = M103 · Final = M104.

# Joins
- Consumed by [predictor-component](/modules/predictor-component.md) (live UI) and [bracket-cascade](/modules/bracket-cascade.md) (standalone scripts) identically — both read the same exported constants, no duplication of the data itself (only the model math is duplicated, see [prediction-model](/modules/prediction-model.md) caveats).
- User-entered result deltas persist separately in `localStorage` under `wc2026:injects:v1` and are merged over `BASE_MATCH_LOG` at render time by `buildMatchLog()` — they never touch this file. `BASE_KO_RESULTS` has no equivalent inject/override path — it is edited directly per the [update-results runbook](/runbooks/update-results.md).

# Caveats
- `BASE_MATCH_LOG` is the one part of this file meant to be edited routinely (group stage). `BASE_KO_RESULTS` is edited routinely for the knockout stage instead — both are described as "the one thing that gets edited between deploys" for their respective phase.
- Deploying an updated file always propagates to all visitors on next page load — there is no CDN/query caching layer to bust.
