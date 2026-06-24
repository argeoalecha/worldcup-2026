# WC 2026 Adaptive Predictor — Model Documentation

**Application:** FIFA World Cup 2026 Predictor  
**Model type:** Progressive Elo-Poisson Ensemble with Bayesian Shrinkage  
**Version:** 1.1 (Jun 2026)

---

## 1. What the Model Is

The predictor uses a **Progressive Elo-Poisson Ensemble** — a hybrid approach that combines two proven forecasting traditions:

- **Elo rating systems**, borrowed from chess and widely adopted in football to quantify team strength on a continuous scale based on match outcomes.
- **Poisson process modelling**, the standard statistical method for predicting goal counts in football, treating each team's scoring as an independent random process with a known average rate.

Neither method alone is sufficient for a live tournament predictor. Pure Elo is outcome-based and ignores goal margins. Pure Poisson on small samples is noisy and overfits early results. The ensemble blends both, weighted dynamically by how much actual tournament data is available — a technique called **Bayesian shrinkage**.

The model is *progressive*: it starts from pre-tournament strength estimates and updates continuously as real match results are injected. Predictions on Day 1 are anchored almost entirely to pre-tournament Elo. By Matchday 3, in-tournament performance dominates.

---

## 2. Why This Model

### Why Elo?
Elo is the most widely validated approach for ranking football teams. It naturally accounts for opponent strength — beating a weak team earns few points; beating a strong team earns many. The pre-tournament Elo ratings provide an evidence-based prior that captures decades of international match history in a single number per team.

### Why Poisson?
In football, goals per match approximately follow a Poisson distribution. The model computes an expected goal rate (lambda) for each team per match, then calculates the probability of every scoreline 0–0 through 8–8. This gives a full score distribution rather than just a win probability, and the per-team lambda is surfaced in the UI as the **expected goals (λ)** match-preview metric. Note: this is the model's Poisson rate parameter, *not* shot-quality xG (which requires event-level shot data the app does not ingest).

The raw Poisson assumes the two teams' goal counts are independent, which empirically under-predicts low-scoring draws (0-0, 1-1). The model corrects this with the **Dixon-Coles adjustment** (1997) — see Step 5.

### Why the Ensemble?
Each method has complementary weaknesses:
- Elo ignores *how* a team wins (a 1-0 grinds vs 5-0 thrashings both count as wins).
- Poisson on 1–2 matches is unreliable; a lucky 3-0 opening win inflates lambda.

The ensemble resolves this by blending both signals. As the tournament progresses and more data becomes available, the Poisson component's weight increases. The blend formula is:

```
poissonWeight = 0.45 + 0.25 × dataMaturity
```

Where `dataMaturity` is the average data-trust weight of both teams (0 = no matches played, 1 = fully trusted). At zero matches, the ensemble is 45% Poisson / 55% Elo. At full data maturity (many matches played), it approaches 70% Poisson / 30% Elo.

### Why Progressive (Bayesian shrinkage)?
A team's in-tournament Elo (`earnedElo`) is computed from actual match results via a single chronological pass through all played matches, updating **both** teams' Elos simultaneously after each result — the same approach used by eloratings.net. It starts equal to the pre-tournament rating and diverges as evidence accumulates. The model then blends `earnedElo` with `PRE_ELO` via a shrinkage formula:

```
w = GP / (GP + k)
blendedElo = w × earnedElo + (1 - w) × PRE_ELO
```

Where `k` is the **Prior Shrinkage** parameter (default 1.5). At GP=0, the prior has full weight. At GP=3, with k=1.5, the earned Elo has 67% weight. This prevents the model from overreacting to a single result while still updating meaningfully as evidence accumulates.

---

## 3. How the Model Works — Step by Step

### Step 1: Compute Live Elos (mutual update)

Before any per-team indices are computed, `computeAllEarnedElos(matchLog)` makes a single pass through all played matches in chronological order, updating **both** teams' Elos simultaneously after each result:

```
expA     = 1 / (1 + 10 ^ ((eloB - eloA) / 400))
eloA    += 40 × (result - expA)
eloB    += 40 × ((1 - result) - (1 - expA))
```

All 48 teams start at their `PRE_ELO`. After each played match both teams' ratings shift — wins push the winner's Elo up and the loser's down by the same total amount. This means when Team A's opponent strength is evaluated in Step 2, it reflects how that opponent has actually performed in the tournament, not their frozen pre-tournament rating.

Group matches are processed in schedule order; user-injected knockout matches are appended after. The function returns a `liveElos` map `{ [abbr]: number }` used by all downstream calculations.

### Step 2: Compute Team Indices

For each team with at least one match played, `computeIndices()` calculates seven per-team metrics using the `liveElos` from Step 1. All metrics use **recency-weighted** values — older matches are discounted by an exponential decay:

```
weight(i) = 0.5 ^ (age / halflife)
```

Where `age` is how many matches ago the game was played and `halflife` controls the decay speed.

| Index | Formula | What it measures |
|---|---|---|
| `attRate` | Weighted goals scored per match | Attacking output rate |
| `defRate` | Weighted goals conceded per match | Defensive vulnerability rate |
| `formIdx` | Weighted W/D/L score (W=1, D=0.5, L=0) | Tournament win rate |
| `momentum` | Goal margin of last match − goal margin of first match | Trajectory — improving or declining |
| `dsi` | Weighted clean sheet rate | Defensive solidity |
| `convincing` | Weighted average goal margin, capped at ±3 | Dominance of victories/defeats |
| `sos` | Weighted average opponent `liveElos` | Strength of opponents faced (uses live in-tournament Elo, not frozen PRE_ELO) |
| `earnedElo` | `liveElos[abbr]` — taken directly from the mutual update in Step 1 | Elo earned inside the tournament |

### Step 3: Compute the Composite Score

The composite score translates all indices into a single comparable number per team, used internally for the Elo-based win probability component. Note: the **Power Ranking** tab and the **Predict** tab both display the ranking PWR score (computed without `sosAdj` in the `ranking` useMemo), not `scoreA`/`scoreB` from this step, to ensure consistency across tabs.

```
score = blendedElo
      + wForm  × formIdx   × 200
      + wMom   × momentum  × 25
      + wDSI   × dsi       × 120
      + wConv  × convincing × 40 × sosAdj
```

Where `sosAdj` adjusts the convincing margin for the quality of opponents faced:

```
sosAdj = 1 + wSOS × ((teamSOS - 1650) / 1000)
```

A team that has dominated strong opponents gets a higher convincing bonus than one that ran up the score against weak opposition.

### Step 4: Elo Win Probability

From the composite scores, a standard Elo win probability is derived:

```
eloWinA = 1 / (1 + 10 ^ ((scoreB - scoreA) / 400))
```

This gives the probability that Team A beats Team B based purely on the composite score differential.

### Step 5: Poisson Goal Prediction

The expected goals (lambda) for each team account for attack rate, the opponent's defensive rate, and schedule strength:

```
lambdaA = clamp(0.3, 3.5, attRateA × (defRateB / 1.2) × sosAdjA)
lambdaB = clamp(0.3, 3.5, attRateB × (defRateA / 1.2) × sosAdjB)
```

The opponent's defensive rate scales lambda **directly**: facing a leaky defence (high `defRate`) raises expected goals; facing a stingy one lowers them. `defRate` is floored at 0.5 inside this term so a perfect defensive record cannot zero out the opponent entirely. `attRate` is boosted slightly by tournament form (`wForm × 0.1 × formIdx`), so a team on a strong winning run scores their goals slightly more efficiently. Lambda is clamped to the realistic range **0.3–3.5**: the floor prevents degenerate scorelines when data is sparse; the ceiling stops small-sample blowouts (e.g. an early 7-1) from producing absurd double-digit expected goals.

The Poisson score-grid (0–8 goals per team, 81 scoreline cells) computes win/draw/loss probabilities, with each cell multiplied by the **Dixon-Coles low-score correction** before being summed:

```
τ(i,j) = Dixon-Coles factor (ρ = -0.13), applied only to the four cells 0-0, 1-0, 0-1, 1-1
P(scoreline i-j) = Poisson(lambdaA, i) × Poisson(lambdaB, j) × max(0, τ(i,j))
pWin  = Σ P where i > j
pDraw = Σ P where i = j
pLoss = Σ P where i < j     (all renormalised so pWin + pDraw + pLoss = 1)
```

**Dixon-Coles correction.** Raw Poisson treats the two teams' goal counts as independent, which under-predicts low-scoring draws. The τ adjustment inflates 0-0 and 1-1 and slightly deflates 1-0 and 0-1, lifting draw probability by roughly 3 points in a typical matchup — in line with the published literature. The `max(0, τ)` guard prevents the rare negative-τ cell (possible only at very high lambda) from contributing negative probability; combined with the 3.5 lambda ceiling, negative τ is unreachable in practice.

```
τ(0,0) = 1 − λA·λB·ρ      τ(1,0) = 1 + λB·ρ
τ(0,1) = 1 + λA·ρ         τ(1,1) = 1 − ρ        (all other cells = 1)
```

### Step 6: Ensemble Blend

The Poisson and Elo outputs are blended dynamically:

```
winA = poissonWeight × pWin  + (1 - poissonWeight) × eloWinA
winB = poissonWeight × pLoss + (1 - poissonWeight) × (1 - eloWinA)
draw = max(0.04, 1 - winA - winB)
```

The 4% draw floor prevents the model from ever assigning zero draw probability, which is unrealistic in football.

### Step 7: Knockout Mode (Draw Redistribution)

In knockout matches there is no draw — the match goes to extra time and penalties. The model redistributes the draw probability between both teams using an experience factor:

```
expA = 1 + wExp × ((PRE_ELO[A] - 1650) / 1000)
expB = 1 + wExp × ((PRE_ELO[B] - 1650) / 1000)
```

Teams with higher pre-tournament Elo are considered more experienced in high-pressure situations. The draw is split proportionally to the weighted advantage:

```
splitA  = 0.5 + 0.5 × ((winA×expA - winB×expB) / (winA×expA + winB×expB))
koWinA  = winA + draw × splitA
koWinB  = winB + draw × (1 - splitA)
```

The result is renormalized to sum to 100%.

---

## 4. Tunable Parameters

All eight parameters are adjustable via the Tune tab. Changes apply instantly to all predictions.

| Parameter | Key | Default | Range | Effect |
|---|---|---|---|---|
| Form Index | `wForm` | 1.0 | 0–2.5 | Weight of W/D/L rate in composite score and lambda boost |
| Momentum | `wMom` | 1.0 | 0–2.5 | Weight of trajectory (improving vs declining) |
| Defensive Solidity | `wDSI` | 1.0 | 0–2.5 | Weight of clean sheet rate in composite score |
| Convincing Wins | `wConv` | 1.0 | 0–2.5 | Weight of goal margin dominance |
| Strength of Schedule | `wSOS` | 1.0 | 0–2.5 | Adjustment factor for quality of opponents faced |
| KO Experience | `wExp` | 1.0 | 0–2.5 | Advantage given to higher-Elo teams in penalty shootoff scenarios |
| Prior Shrinkage | `shrink` (k) | 1.5 | 0.5–5.0 | How quickly the model shifts trust from prior Elo to in-tournament data |
| Recency Half-Life | `halflife` | 1.5 | 0.5–4.0 | How fast older matches fade; lower = last match dominates |

---

## 5. Data Architecture

```
PRE_ELO          Official pre-tournament Elo for all 48 teams (baseline prior)
BASE_MATCH_LOG   Immutable official results (updated manually via src/data/results.js)
wc2026:injects:v1   User-injected result deltas (localStorage)
matchLog         Merged log = BASE_MATCH_LOG + replayed injects (rebuilt each render)
```

Every prediction is computed fresh from the merged `matchLog` on each render. No cached prediction state is stored. This means deploying an updated `BASE_MATCH_LOG` immediately propagates to all visitors on their next page load, regardless of their localStorage.

---

## 6. Glossary

| Term / Initialism | Full Form | Definition |
|---|---|---|
| **Elo** | Elo Rating System | A method for calculating relative skill levels, originally for chess, widely applied in football. A number typically between 1000–2200 for international teams. |
| **PRE_ELO** | Pre-tournament Elo | The official Elo rating for each team before the tournament began. Used as the Bayesian prior. |
| **earnedElo** | Earned (In-tournament) Elo | Elo accumulated from actual WC 2026 match results via a single mutual-update pass (`computeAllEarnedElos`). Both teams' ratings shift simultaneously after each match. |
| **liveElos** | Live Elo Map | The `{ [abbr]: number }` map returned by `computeAllEarnedElos` — the in-tournament Elo for all 48 teams after all played matches. Used by `computeIndices` for both `earnedElo` and opponent strength (`sos`). |
| **computeAllEarnedElos** | Mutual Elo Update Function | Processes all played matches chronologically, updating both participants' Elos simultaneously with K=40. Replaces the earlier single-team iterative approximation. |
| **blendedElo** | Blended Elo | The weighted average of earnedElo and PRE_ELO, controlled by the shrinkage formula. |
| **GP** | Games Played | Number of matches a team has played in the current tournament. |
| **K (K-factor)** | Elo K-Factor | The multiplier controlling how much a single result shifts the Elo. Set to 40×weight in this model. |
| **k (shrink)** | Prior Shrinkage Parameter | Controls how quickly the model trusts in-tournament data over the prior. See Bayesian Shrinkage. |
| **λ (lambda)** | Expected Goals (model rate) | The Poisson rate parameter — the average number of goals a team is expected to score in a given match. Clamped to the realistic range 0.3–3.5. Surfaced in the UI as **"exp. goals (λ)"**. |
| **Poisson** | Poisson Distribution | A probability distribution for counting rare independent events (goals) over a fixed interval (a match). |
| **Dixon-Coles** | Dixon-Coles Correction (1997) | A multiplicative adjustment (τ, with ρ = -0.13) applied to the four lowest-scoring cells of the Poisson grid (0-0, 1-0, 0-1, 1-1) to correct the independence assumption's under-prediction of low-scoring draws. Guarded by `max(0, τ)`. |
| **xG** | Expected Goals (shot-based) | The industry metric built from shot-level event data (shot location, angle, pressure). **This model does not compute true xG** — the UI's "exp. goals (λ)" is the Poisson rate parameter, not shot-based xG. |
| **pWin / pDraw / pLoss** | Poisson Win/Draw/Loss Probability | Outcome probabilities derived by summing the Poisson score-grid. |
| **eloWinA** | Elo-based Win Probability | The win probability for Team A derived from composite score differential via the standard Elo formula. |
| **dataMaturity** | Data Maturity | Average data-trust weight across both teams; 0 = no matches played, 1 = full trust in earned data. |
| **poissonWeight** | Poisson Blend Weight | The fraction of the final probability that comes from the Poisson component (vs Elo component). |
| **Ensemble** | Ensemble Model | A model that combines multiple prediction methods (Poisson + Elo) to reduce each method's individual weaknesses. |
| **Bayesian Shrinkage** | Bayesian Shrinkage / Regularization | A technique that pulls estimates toward a prior when data is sparse, and allows observed data to dominate as more accumulates. |
| **formIdx** | Form Index | Weighted win/draw/loss rate (W=1, D=0.5, L=0) over tournament matches. Range: 0–1. |
| **momentum** | Momentum | Difference in goal margin between a team's most recent match and their first match. Positive = improving. |
| **dsi** | Defensive Solidity Index | Weighted clean sheet rate. Range: 0–1. Measures how consistently a team keeps clean sheets. |
| **convincing** | Convincing Wins Index | Weighted average goal margin capped at ±3. Positive = consistently winning by comfortable margins. |
| **sos** | Strength of Schedule | Weighted average Elo of opponents faced. Used to contextualise a team's results relative to opposition quality. |
| **sosAdj** | Strength-of-Schedule Adjustment | A multiplier (near 1.0) applied to the convincing index to reward or penalise based on opponent quality. |
| **attRate** | Attacking Rate | Weighted average goals scored per match. Input to lambda calculation. |
| **defRate** | Defensive Rate | Weighted average goals conceded per match. Scales the opponent's lambda directly (`defRate / 1.2`), floored at 0.5 — a leakier defence yields the opponent more expected goals. |
| **halflife** | Recency Half-Life | The number of matches back at which a result has half the weight of the most recent match. |
| **expA / expB** | Experience Factor | A multiplier derived from PRE_ELO that gives stronger teams a slight advantage in knockout scenarios (penalties/extra time). |
| **koWinA / koWinB** | Knockout Win Probability | Win probability in a knockout match after redistributing the draw probability via the experience factor. |
| **KO** | Knockout | A match format where there is no draw — the losing team is eliminated. |
| **MD** | Matchday | Round of group stage fixtures. MD1 = first round, MD2 = second, MD3 = final group round. |
| **BASE_MATCH_LOG** | Base Match Log | The immutable official result dataset embedded in the application and updated with each deploy. |
| **injects** | User Injections | User-entered result deltas stored in localStorage, replayed on top of the BASE_MATCH_LOG each render. |
| **matchLog** | Merged Match Log | The live working dataset: BASE_MATCH_LOG merged with all user injects. |
| **wForm, wMom, wDSI, wConv, wSOS, wExp** | Index Weights | Tunable multipliers controlling the contribution of each index to the composite score and predictions. |
| **scoreA / scoreB** | Composite Score | The composite strength number for each team inside `predict()`, combining blendedElo with all weighted indices including sosAdj on the convincing term. Used internally for eloWinA. Not displayed in the UI — the Predict tab shows the ranking PWR score instead (see `ranking` useMemo). |
| **ELO_EXACT** | Elo Exact Flag Set | The set of team abbreviations for which Elo values come from the official source file (all 48 in current version). |
| **SCHEDULED_UNPLAYED** | Scheduled Unplayed Matches | Matches in the fixture list that have no corresponding entry in BASE_MATCH_LOG — available for injection. |
| **WC** | World Cup | FIFA World Cup 2026. |
| **FIFA** | Fédération Internationale de Football Association | Governing body of international football. |
| **xT** | — | Not used in this model (common in club football analytics; inapplicable here without event-level tracking data). |
