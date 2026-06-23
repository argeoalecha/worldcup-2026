# Product Requirements Document
# WC 2026 Adaptive Predictor

**Version:** 1.0  
**Date:** 2026-06-23  
**Status:** Shipped (MVP)  
**Owner:** Hayah-AI

---

## 1. Product Overview

WC 2026 Adaptive Predictor is a web-based, interactive match prediction tool for the FIFA World Cup 2026. It uses a three-model ensemble (Elo rating system, Poisson goal distribution, and progressive Bayesian learning) to generate probabilistic forecasts for any head-to-head matchup in the 48-team tournament.

The core differentiator is live adaptability: the model shifts weight from pre-tournament historical ratings toward in-tournament performance data as more matches are played, and users can inject new results in real time to recalibrate all predictions instantly.

---

## 2. Problem Statement

Standard football prediction tools either:
- Rely solely on pre-tournament ratings (stale once games are played), or
- Are black-box systems that don't expose model parameters to the user.

Analysts, enthusiasts, and sports-data hobbyists want a tool that:
1. Starts with credible pre-tournament baselines (validated Elo ratings).
2. Updates predictions as real match results come in.
3. Is transparent and tunable — users can adjust model weights and immediately see the impact.

---

## 3. Goals

| Goal | Metric |
|---|---|
| Accurate pre-tournament predictions | Elo ratings sourced from eloratings.net for 18 top-tier teams; remainder FIFA-rank-ordered |
| Live result incorporation | Injected result recalculates all 48-team rankings within the same render cycle |
| Model transparency | 8 tunable weight sliders expose every feature driving the prediction |
| Session persistence | Injected results survive page refresh via localStorage |
| Web-accessible | Deployed as a static SPA on Netlify; no login, no backend required |
| Mobile-usable | Responsive layout that works on 375px-wide phones |

---

## 4. Users

**Primary:** Football analysts and data-curious enthusiasts who want to explore prediction models during the live World Cup 2026 tournament.

**Secondary:** Fans who want a quick head-to-head probability for an upcoming match without needing statistical expertise.

Both audiences access the tool via a web browser (desktop or mobile) with no account or signup required.

---

## 5. Functional Requirements

### 5.1 Shareable Prediction URLs

- Every change to team selection or model configuration is silently encoded into the URL query string using `window.history.replaceState` — no page reload, no visible address bar flash.
- URL parameter mapping (short keys to keep URLs clean):

  | Param | Value |
  |---|---|
  | `a` | Team A ISO code (e.g. `ARG`) |
  | `b` | Team B ISO code (e.g. `BRA`) |
  | `ko` | Knockout mode (`1` = on, `0` = off) |
  | `wf` | Form weight |
  | `wm` | Momentum weight |
  | `wd` | Defensive Solidity weight |
  | `wc` | Convincingness weight |
  | `ws` | Strength of Schedule weight |
  | `we` | Experience weight (knockout) |
  | `k` | Prior shrinkage |
  | `hl` | Recency half-life |

- On page load, URL params are parsed and used to initialize all state — so a shared URL opens the exact same prediction with the same model configuration.
- Invalid or out-of-range params are clamped to valid defaults; unrecognized team codes fall back to the default selection.
- A **"🔗 Share prediction"** button in the Predict tab copies the current URL to the clipboard. Button shows **"✓ Link copied"** for 2 seconds then resets.

### 5.2 Match Prediction (Predict Tab)

- User selects two teams from a dropdown (all 48 tournament participants).
- The app outputs win probability (%) for each team, draw probability (group stage only), and expected goals (xG) for each side.
- Mode toggle: **Group Stage** (three outcomes: win / draw / loss) vs **Knockout** (binary: advances / eliminated, accounting for penalty shootout experience).
- Prediction updates instantly on any input change — no submit button.
- Side-by-side index comparison table shows 6 metrics for each team: Form Index, Momentum, Defensive Solidity, Convincingness, Strength of Schedule, Earned Elo.
- A data maturity indicator (0–100%) communicates how much in-tournament data is informing the prediction vs. pre-tournament Elo.

### 5.3 Power Rankings (Indices Tab)

- Displays all 48 teams ranked by composite power score.
- Each team row shows: rank, flag, team name, games played, Elo rating, source provenance (exact vs. estimated), and 7 metric badges: Form, Momentum, DSI, Convincingness, SOS, Attack Rate, Defense Rate.
- Rankings recompute automatically when new results are injected or model parameters are tuned.
- Elo provenance noted: ✓ = exact from eloratings.net, ~ = FIFA-rank-ordered estimate.

### 5.4 Model Tuning (Tune Tab)

- 8 real-time sliders:
  - **Form Index weight** (0–2.5): recency-weighted points rate
  - **Momentum weight** (0–2.5): trend direction (latest GD minus first GD)
  - **Defensive Solidity weight** (0–2.5): recency-weighted clean-sheet rate
  - **Convincingness weight** (0–2.5): margin-of-victory quality, capped at ±3
  - **Strength of Schedule weight** (0–2.5): adjusts form by average opponent Elo
  - **Big-game experience weight** (0–2.5): knockout mode only — pedigree drift
  - **Prior shrinkage (k)** (0.5–5): controls how fast in-tournament data overtakes pre-tournament Elo
  - **Recency half-life** (0.5–4 matches): controls how heavily the most recent match dominates
- All predictions and rankings update live as sliders move.
- Default value for all weights: 1.0. Default shrinkage: 1.5. Default half-life: 1.5.

### 5.5 Result Injection (Inject Tab)

- User selects Team, Opponent, and goal scores for each side.
- On submit, the result is appended to both teams' match logs and all indices recompute instantly.
- Injected results persist to `localStorage` so they survive page refresh.
- Match log for the selected team is displayed below the inject form showing all recorded results with color-coded outcome (win / draw / loss).
- **Reset to deployment default** button restores the original validated match data and clears localStorage.

---

## 6. Data

### 6.1 Baseline Team Data

- **48 teams** covering all FIFA World Cup 2026 participants.
- **18 teams** have exact Elo ratings sourced from eloratings.net (as of 21 Jun 2026).
- **30 teams** have estimated Elo ratings, FIFA-rank-ordered and scaled proportionally below the lowest exact-rated team (Austria, 1857).
- Highest rated: Spain (2129), Argentina (2128). Lowest: New Zealand (1470).

### 6.2 Validated Match Log

- Baseline match results for all group stage matches played as of 21 Jun 2026 (groups A–H: 2 matches each; groups I–L: 1 match each).
- All results cross-validated against CBS Sports group tables.
- Stored as an immutable baseline on the client; user-injected results extend this baseline in session state.

### 6.3 Data Persistence

- Injected match results are saved to `localStorage` under the key `wc2026:matchLog:v1`.
- No server-side persistence; data is local to the user's browser.
- Reset clears `localStorage` and restores the validated deployment baseline.

---

## 7. Prediction Model

### 7.1 Three-Model Ensemble

| Model | Role |
|---|---|
| Elo Rating | Long-term team strength baseline; accounts for form index, momentum, defensive solidity, convincingness, and strength of schedule as Elo adjustments |
| Poisson Distribution | Generates goal-by-goal probabilities (0–8 goals each team) based on in-tournament attack and defense rates |
| Progressive Bayesian | Dynamically shifts ensemble weight from Elo toward Poisson as GP (games played) increases |

### 7.2 Progressive Learning Behavior

- At tournament start (GP = 0): 100% Elo-driven.
- Early group stage (GP = 1–2): ~55% Elo / 45% Poisson.
- Late tournament / knockout stage (GP ≥ 3): ~30% Elo / 70% Poisson.
- Transition controlled by the prior shrinkage parameter `k`: lower values shift toward in-tournament data faster.

### 7.3 Knockout Mode

- In knockout mode, draw probability is redistributed to win/loss using a penalty-experience multiplier derived from pre-tournament Elo (as a proxy for big-game pedigree).
- Output is binary (Team A advances / Team B advances) with no draw.

---

## 8. Design

### 8.1 Theme

**Hayah Midnight** — dark-first design system.

| Token | Value |
|---|---|
| Page background | `#0F3836` |
| Panel / raised surface | `#15423e` |
| Border / separator | `#1C5753` |
| Primary (teal) | `#25A497` |
| Accent / CTA (coral) | `#ff6b47` |
| Text primary | `#faf7f5` |
| Text muted | `#7a9b96` |
| Text secondary | `#A1E4DB` |

Data-visualization accents (amber, purple, pink, red) are preserved for metric distinction and are not overridden by the brand palette.

### 8.2 Typography

- **Headings:** Syne (700–800 weight)
- **Body / UI:** Geist (400–600 weight)
- **Monospace:** JetBrains Mono (not used in MVP UI, loaded for future code-display needs)
- Fonts loaded via Google Fonts with `display=swap`.

### 8.3 Logo

Hayah-AI brand mark in dark-mode variant: mint arc (`#A1E4DB`), coral dot (`#ff6b47`), light wordmark (`#faf7f5`), muted dash (`#7a9b96`), italic coral `-ai`. Displayed in the app header at 85% scale.

### 8.4 Styling Approach

Inline styles in the React component define the visual language. A supplemental `src/styles.css` provides:
- Global box-sizing reset
- Mobile media query overrides (`max-width: 480px`) via class hooks on key layout elements

---

## 9. Non-Functional Requirements

### 9.1 Performance

- Build output: ~165 KB JS (53 KB gzip). No lazy loading required at this size.
- All prediction computation runs client-side (no network round-trip for results).
- `useMemo` used for ranking and prediction to avoid redundant recalculation on unrelated state changes.

### 9.2 Responsiveness

- Primary target: desktop browsers (1024px+).
- Functional on mobile at 375px width: team selectors stack vertically, score panel stacks, index comparison label column narrows.

### 9.3 Accessibility

- Logo SVG has `role="img"` and `aria-label`.
- Sliders use native `<input type="range">` — keyboard accessible out of the box.
- Color is not the sole differentiator for win/loss/draw outcomes (text labels always present).

### 9.4 Security

- No user authentication; no PII collected.
- No external API calls at runtime.
- `localStorage` key is versioned (`v1`) to allow safe schema migration in future updates.

### 9.5 Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge).
- No IE or legacy browser support required.

---

## 10. Deployment

- **Host:** Netlify (static SPA)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 20 (pinned in `netlify.toml`)
- No server-side functions, redirects, or environment variables required for the base deployment.

---

## 11. Out of Scope (v1)

- User accounts or saved sessions across devices
- Real-time match data feeds / automatic result ingestion
- Tournament bracket visualization
- Head-to-head historical record between teams
- Share / export prediction as image or link
- Multi-language support
- Backend API

---

## 12. Future Considerations

- Auto-ingestion of live results via a public football data API (eliminating the need for manual injection)
- Bracket simulator: run the full WC 2026 knockout bracket probabilistically (R32 → Final), requires the confirmed bracket draw
- User-configurable team shortlists / watchlists
- Backend persistence so injected results sync across sessions and devices
