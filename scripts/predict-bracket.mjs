// Standalone bracket predictor — imports real tournament data and runs the
// exact model functions from wc2026-predictor.jsx (verbatim) to cascade
// predicted winners R32 → Final, with travel-fatigue penalties applied per match.
import {
  PRE_ELO, BASE_MATCH_LOG, BASE_KO_RESULTS, NAMES, FLAGS, MATCH_SCHEDULE,
  R32_SCHEDULE, R16_SCHEDULE, QF_SCHEDULE, SF_SCHEDULE, FINAL_SCHEDULE,
} from "../src/data/results.js";

const CFG = {knockout:true,shrink:1.5,halflife:1.5,wForm:1.0,wMom:1.0,wDSI:1.0,wConv:1.0,wSOS:1.0,wExp:1.0,travel:true};

// ─── MODEL (verbatim from wc2026-predictor.jsx) ─────────────────────────────
function recencyWeights(n, halflife) {
  const w = [];
  for (let i = 0; i < n; i++) { const age = (n - 1) - i; w.push(Math.pow(0.5, age / halflife)); }
  return w;
}
function computeAllEarnedElos(matchLog) {
  const elos = { ...PRE_ELO };
  const seen = new Set();
  const played = [];
  for (const m of MATCH_SCHEDULE) {
    const key = [m.a, m.b].sort().join("|");
    if (seen.has(key)) continue;
    const result = (matchLog[m.a] || []).find(r => r.opp === m.b);
    if (result) { played.push({ a: m.a, b: m.b, gf: result.gf, ga: result.ga }); seen.add(key); }
  }
  for (const [team, results] of Object.entries(matchLog)) {
    for (const r of results) {
      const key = [team, r.opp].sort().join("|");
      if (seen.has(key)) continue;
      if ((matchLog[r.opp] || []).find(x => x.opp === team)) { played.push({ a: team, b: r.opp, gf: r.gf, ga: r.ga }); seen.add(key); }
    }
  }
  for (const m of played) {
    const eA = elos[m.a] || 1500, eB = elos[m.b] || 1500;
    const expA = 1 / (1 + Math.pow(10, (eB - eA) / 400));
    const result = m.gf > m.ga ? 1 : m.gf === m.ga ? 0.5 : 0;
    elos[m.a] += 40 * (result - expA);
    elos[m.b] += 40 * ((1 - result) - (1 - expA));
  }
  return elos;
}
function computeIndices(abbr, halflife, matchLog, liveElos) {
  const log = matchLog[abbr] || [];
  const gp = log.length;
  const earnedElo = (liveElos && liveElos[abbr]) || PRE_ELO[abbr] || 1500;
  if (gp === 0) return { gp:0, formIdx:0, momentum:0, dsi:0, convincing:0, sos:1500, attRate:1, defRate:1.2, earnedElo };
  const w = recencyWeights(gp, halflife);
  const wSum = w.reduce((a,b)=>a+b,0);
  let wGF=0, wGA=0, wResult=0, wMargin=0, wOppElo=0, cleanSheets=0;
  log.forEach((m, i) => {
    const oppElo = (liveElos && liveElos[m.opp]) || PRE_ELO[m.opp] || 1500;
    wGF += w[i]*m.gf; wGA += w[i]*m.ga; wOppElo += w[i]*oppElo;
    const result = m.gf>m.ga ? 1 : m.gf===m.ga ? 0.5 : 0;
    wResult += w[i]*result;
    wMargin += w[i]*Math.max(-3,Math.min(3,m.gf-m.ga));
    if (m.ga===0) cleanSheets += w[i];
  });
  return { gp, attRate: wGF/wSum, defRate: wGA/wSum, sos: wOppElo/wSum, formIdx: wResult/wSum,
    momentum: gp>=2 ? (log[gp-1].gf-log[gp-1].ga)-(log[0].gf-log[0].ga) : (log[gp-1].gf-log[gp-1].ga),
    dsi: cleanSheets/wSum, convincing: wMargin/wSum, earnedElo };
}
function poisson(lambda,k){ let f=1; for(let i=2;i<=k;i++)f*=i; return Math.exp(-lambda)*Math.pow(lambda,k)/f; }
function dixonColesTau(x,y,lambda,mu,rho){
  if(x===0&&y===0) return 1-lambda*mu*rho;
  if(x===1&&y===0) return 1+mu*rho;
  if(x===0&&y===1) return 1+lambda*rho;
  if(x===1&&y===1) return 1-rho;
  return 1;
}
function predict(aAbbr,bAbbr,cfg,matchLog,penA=0,penB=0){
  const liveElos=computeAllEarnedElos(matchLog);
  const A=computeIndices(aAbbr,cfg.halflife,matchLog,liveElos), B=computeIndices(bAbbr,cfg.halflife,matchLog,liveElos);
  const wA=A.gp/(A.gp+cfg.shrink), wB=B.gp/(B.gp+cfg.shrink);
  const eloA=wA*A.earnedElo+(1-wA)*(PRE_ELO[aAbbr]||1500);
  const eloB=wB*B.earnedElo+(1-wB)*(PRE_ELO[bAbbr]||1500);
  const sosAdjA=1+cfg.wSOS*((A.sos-1650)/1000), sosAdjB=1+cfg.wSOS*((B.sos-1650)/1000);
  const scoreA=eloA+cfg.wForm*A.formIdx*200+cfg.wMom*A.momentum*25+cfg.wDSI*A.dsi*120+cfg.wConv*A.convincing*40*sosAdjA-penA;
  const scoreB=eloB+cfg.wForm*B.formIdx*200+cfg.wMom*B.momentum*25+cfg.wDSI*B.dsi*120+cfg.wConv*B.convincing*40*sosAdjB-penB;
  const eloWinA=1/(1+Math.pow(10,(scoreB-scoreA)/400));
  const baseA=(A.attRate||1)*(1+cfg.wForm*0.1*A.formIdx), baseB=(B.attRate||1)*(1+cfg.wForm*0.1*B.formIdx);
  const lambdaA=Math.min(3.5,Math.max(0.3,baseA*(Math.max(0.5,B.defRate)/1.2)*sosAdjA*(1-penA/400)));
  const lambdaB=Math.min(3.5,Math.max(0.3,baseB*(Math.max(0.5,A.defRate)/1.2)*sosAdjB*(1-penB/400)));
  let pWin=0,pDraw=0,pLoss=0,pTot=0;
  for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const p=poisson(lambdaA,i)*poisson(lambdaB,j)*Math.max(0,dixonColesTau(i,j,lambdaA,lambdaB,-0.13)); pTot+=p; if(i>j)pWin+=p; else if(i===j)pDraw+=p; else pLoss+=p;}
  pWin/=pTot; pDraw/=pTot; pLoss/=pTot;
  const dataMaturity=(wA+wB)/2;
  const poissonW=0.45+0.25*dataMaturity;
  let winA=poissonW*pWin+(1-poissonW)*eloWinA;
  let winB=poissonW*pLoss+(1-poissonW)*(1-eloWinA);
  let draw=Math.max(0.04,1-winA-winB);
  let koWinA=null,koWinB=null;
  if(cfg.knockout){
    const expA=1+cfg.wExp*(((PRE_ELO[aAbbr]||1500)-1650)/1000);
    const expB=1+cfg.wExp*(((PRE_ELO[bAbbr]||1500)-1650)/1000);
    const sA=winA*expA, sB=winB*expB;
    const splitA=0.5+0.5*((sA-sB)/(sA+sB||1));
    koWinA=sA+draw*splitA; koWinB=sB+draw*(1-splitA);
    const t=koWinA+koWinB; koWinA/=t; koWinB/=t;
  }
  const tot=winA+winB+draw;
  return { winA:winA/tot, draw:draw/tot, winB:winB/tot, koWinA, koWinB,
    lambdaA, lambdaB, eloA:Math.round(eloA), eloB:Math.round(eloB),
    scoreA:Math.round(scoreA), scoreB:Math.round(scoreB) };
}

// ─── TRAVEL (verbatim) ──────────────────────────────────────────────────────
const VENUE_INFO = {
  "Arlington":{lat:32.748,lon:-97.092,tz:1},"Philadelphia":{lat:39.901,lon:-75.168,tz:0},
  "East Rutherford":{lat:40.813,lon:-74.074,tz:0},"Santa Clara":{lat:37.403,lon:-121.970,tz:3},
  "Houston":{lat:29.685,lon:-95.411,tz:1},"Foxborough":{lat:42.091,lon:-71.264,tz:0},
  "Toronto":{lat:43.633,lon:-79.419,tz:0},"Guadalajara":{lat:20.642,lon:-103.399,tz:1},
  "Seattle":{lat:47.595,lon:-122.332,tz:3},"Vancouver":{lat:49.277,lon:-123.112,tz:3},
  "Atlanta":{lat:33.755,lon:-84.401,tz:0},"Miami Gardens":{lat:25.958,lon:-80.239,tz:0},
  "Mexico City":{lat:19.303,lon:-99.150,tz:1},"Guadalupe":{lat:25.676,lon:-100.252,tz:1},
  "Kansas City":{lat:39.049,lon:-94.484,tz:1},"Inglewood":{lat:33.953,lon:-118.339,tz:3},
};
function venueInfo(str){for(const[k,v]of Object.entries(VENUE_INFO))if(str.includes(k))return v;return null;}
function haversineKm(la1,lo1,la2,lo2){const R=6371,r=d=>d*Math.PI/180,dLa=r(la2-la1),dLo=r(lo2-lo1),a=Math.sin(dLa/2)**2+Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dLo/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
function computeTravelInfo(fromVenue,toVenue){
  const from=venueInfo(fromVenue),to=venueInfo(toVenue);
  if(!from||!to)return null;
  const miles=Math.round(haversineKm(from.lat,from.lon,to.lat,to.lon)*0.621371);
  const tzEast=Math.max(0,from.tz-to.tz);
  const burden=miles+tzEast*200;
  const penalty=Math.min(20,(burden/1000)*10);
  return{miles,tzEast,burden,penalty,fromVenue,toVenue};
}

// ─── CASCADE ────────────────────────────────────────────────────────────────
// Match log = group stage + any confirmed knockout results, so earned Elo/form
// reflect played KO matches just as the live app does.
const matchLog = JSON.parse(JSON.stringify(BASE_MATCH_LOG));
for(const d of BASE_KO_RESULTS){
  (matchLog[d.team]=matchLog[d.team]||[]).push({opp:d.opp,gf:d.gf,ga:d.ga});
  (matchLog[d.opp]=matchLog[d.opp]||[]).push({opp:d.team,gf:d.ga,ga:d.gf});
}
// A KO pair meets at most once, so team-pair alone identifies a confirmed result.
const actualFor = (a,b) => BASE_KO_RESULTS.find(d=>(d.team===a&&d.opp===b)||(d.team===b&&d.opp===a));
const KO_ALL = {};
[...R32_SCHEDULE,...R16_SCHEDULE,...QF_SCHEDULE,...SF_SCHEDULE,...FINAL_SCHEDULE].forEach(e=>{KO_ALL[e.mn]=e;});

// Each team's previous-match venue (start = last group-stage match venue).
const prevVenue = {};
function lastGroupVenue(team){
  for(let i=MATCH_SCHEDULE.length-1;i>=0;i--){const m=MATCH_SCHEDULE[i];if(m.a===team||m.b===team)return m.venue;}
  return null;
}
const winnerOf = {};  // mn -> winning abbr
const loserOf  = {};  // mn -> losing abbr
const results  = {};  // mn -> prediction record

function teamsFor(mn){
  const e = KO_ALL[mn];
  if(e.a&&e.b) return {a:e.a,b:e.b};
  if(e.lA!==undefined) return {a:loserOf[e.lA],b:loserOf[e.lB]};
  return {a:winnerOf[e.wA],b:winnerOf[e.wB]};
}

function pct(x){return (x*100).toFixed(1);}
function predictedScore(p){
  // expected-goals rounded; ensure the model's KO winner gets the higher/equal-broken score
  let ga=Math.round(p.lambdaA), gb=Math.round(p.lambdaB);
  const aWins=p.koWinA>=p.koWinB;
  if(aWins&&ga<=gb) ga=gb+1;
  if(!aWins&&gb<=ga) gb=ga+1;
  return [ga,gb];
}

const order = [
  ...R32_SCHEDULE.map(e=>e.mn),
  ...R16_SCHEDULE.map(e=>e.mn),
  ...QF_SCHEDULE.map(e=>e.mn),
  ...SF_SCHEDULE.map(e=>e.mn),
  ...FINAL_SCHEDULE.map(e=>e.mn),
];

const ROUND_FOR_MN = mn => mn<=88?"R32":mn<=96?"R16":mn<=100?"QF":mn<=102?"SF":(mn===103?"3rd Place":"Final");

for(const mn of order){
  const e=KO_ALL[mn];
  const {a,b}=teamsFor(mn);
  if(!a||!b) continue; // bracket slot not yet resolvable
  if(prevVenue[a]===undefined) prevVenue[a]=lastGroupVenue(a);
  if(prevVenue[b]===undefined) prevVenue[b]=lastGroupVenue(b);
  // Confirmed result → use it verbatim; otherwise predict.
  const actual=actualFor(a,b);
  if(actual){
    const ga=actual.team===a?actual.gf:actual.ga, gb=actual.team===a?actual.ga:actual.gf;
    const w=actual.team, l=actual.opp;
    winnerOf[mn]=w; loserOf[mn]=l;
    results[mn]={mn,round:ROUND_FOR_MN(mn),date:e.date,venue:e.venue,a,b,
      koA:w===a?1:0,koB:w===b?1:0,winner:w,loser:l,score:[ga,gb],actual:true,
      pen:actual.pen?{team:actual.team,penTeam:actual.penTeam,penOpp:actual.penOpp}:null,
      eloA:null,eloB:null,penA:0,penB:0,tA:null,tB:null,p:null};
    prevVenue[w]=e.venue;
    continue;
  }
  const tA=CFG.travel?computeTravelInfo(prevVenue[a],e.venue):null;
  const tB=CFG.travel?computeTravelInfo(prevVenue[b],e.venue):null;
  const penA=tA?tA.penalty:0, penB=tB?tB.penalty:0;
  const p=predict(a,b,CFG,matchLog,penA,penB);
  const aWins=p.koWinA>=p.koWinB;
  const w=aWins?a:b, l=aWins?b:a;
  winnerOf[mn]=w; loserOf[mn]=l;
  const [ga,gb]=predictedScore(p);
  results[mn]={mn,round:ROUND_FOR_MN(mn),date:e.date,venue:e.venue,a,b,
    koA:p.koWinA,koB:p.koWinB,winner:w,loser:l,score:[ga,gb],actual:false,
    eloA:p.eloA,eloB:p.eloB,penA,penB,tA,tB,p};
  // Advance the winner's venue. Power ranking stays fixed from played results;
  // only travel cascades — mirrors the app's predict.
  prevVenue[w]=e.venue;
}

export { results, winnerOf, loserOf, KO_ALL };
export { NAMES, FLAGS } from "../src/data/results.js";

// ─── OUTPUT ─────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
const fmtTeam=t=>`${FLAGS[t]||""} ${NAMES[t]||t}`;
function line(mn){
  const r=results[mn];
  const aw=r.winner===r.a;
  const fav=aw?r.a:r.b, favP=aw?r.koA:r.koB;
  const travA=r.tA?` _(−${r.penA.toFixed(1)}, ${r.tA.miles}mi)_`:"";
  const travB=r.tB?` _(−${r.penB.toFixed(1)}, ${r.tB.miles}mi)_`:"";
  const conf=r.actual?"✓ result":`${pct(favP)}%`;
  return `| M${r.mn} | ${r.date} | ${fmtTeam(r.a)}${travA} | ${fmtTeam(r.b)}${travB} | **${fmtTeam(r.winner)}** | ${conf} | ${r.score[0]}–${r.score[1]} |`;
}

if(!isMain){ /* imported as a module — skip CLI output */ }
else {
const J=process.argv.includes("--json");
if(J){ console.log(JSON.stringify(results,null,2)); process.exit(0); }

let out="";
const rounds=[["R32",R32_SCHEDULE],["R16",R16_SCHEDULE],["QF",QF_SCHEDULE],["SF",SF_SCHEDULE]];
for(const [name,sched] of rounds){
  out+=`\n### ${name}\n\n| Match | Date | Side A | Side B | Predicted Winner | Win % | Score |\n|---|---|---|---|---|---|---|\n`;
  for(const e of sched) out+=line(e.mn)+"\n";
}
out+=`\n### 3rd Place & Final\n\n| Match | Date | Side A | Side B | Predicted Winner | Win % | Score |\n|---|---|---|---|---|---|---|\n`;
for(const e of FINAL_SCHEDULE) out+=line(e.mn)+"\n";

const champ=winnerOf[104], runner=loserOf[104], third=winnerOf[103];
out+=`\n### Podium\n\n- 🥇 Champion: **${fmtTeam(champ)}**\n- 🥈 Runner-up: **${fmtTeam(runner)}**\n- 🥉 Third place: **${fmtTeam(third)}**\n`;
console.log(out);
}
