# Update Log

## 2026-07-16
* **Review + correction pass**: [predictor-component](/modules/predictor-component.md) understated the tab bar (said four tabs, actually six — `predict`/`schedule`/`brackets`/`indices`/`tune`/`inject`) and didn't reflect the `d88645a` removal of the manual result-injection UI; both fixed. Added a caveat to [bracket-cascade](/modules/bracket-cascade.md) about the winner-resolution bugfix in `predict-bracket.mjs` (was comparing `gf`/`ga` instead of using `actual.team`, which broke on penalty-shootout draws) and the hand-edited, non-derived header caption in `bracket-graphic.mjs`. Fixed a stale line number for `MATCH_SCHEDULE` in [results-data](/tables/results-data.md) (301 → 303). Updated the [update-results runbook](/runbooks/update-results.md) — GitHub is now connected (`origin` → https://github.com/argeoalecha/worldcup-2026) for history/backup; deploy remains Netlify-CLI-only and independent of git push.
* **Data**: Semi-final results confirmed (M101 Spain 2–0 France, M102 Argentina 2–1 England) and added to `BASE_KO_RESULTS`, cascading the model's Final prediction to Spain vs Argentina.

## 2026-07-12
* **Creation**: Initial OKF bundle — [predictor-component](/modules/predictor-component.md), [prediction-model](/modules/prediction-model.md), [bracket-cascade](/modules/bracket-cascade.md), [results-data](/tables/results-data.md), [update-results runbook](/runbooks/update-results.md). Written after QF results (M97–M100) were added and the site deployed.
