import { useState, useMemo, useCallback, useEffect } from "react";
import HayahaiLogo from "./HayahaiLogo.jsx";
import { PRE_ELO, ELO_EXACT, BASE_MATCH_LOG, GROUP_STANDINGS, NAMES, FLAGS, GROUPS, MATCH_SCHEDULE, R32_SCHEDULE, R16_SCHEDULE, QF_SCHEDULE, SF_SCHEDULE, FINAL_SCHEDULE, BASE_KO_RESULTS } from "./src/data/results.js";
import bracketSvgRaw from "./bracket-prediction.svg?raw";

// Predicted-bracket graphic, made responsive: CSS width overrides the SVG's
// intrinsic width while the viewBox preserves aspect ratio across screens.
const BRACKET_SVG = bracketSvgRaw.replace("<svg ", '<svg style="width:100%;height:auto;display:block" ');

// Flat lookup: matchNum → schedule entry (covers R32 through Final).
const KO_ALL = {};
[...R32_SCHEDULE, ...R16_SCHEDULE, ...QF_SCHEDULE, ...SF_SCHEDULE, ...FINAL_SCHEDULE]
  .forEach(e => { KO_ALL[e.mn] = e; });

const ROUND_FOR_MN = mn => {
  if (mn <= 88) return "R32";
  if (mn <= 96) return "R16";
  if (mn <= 100) return "QF";
  if (mn <= 102) return "SF";
  return "Final";
};

// Returns the winning team abbr of a given match number, or null if not yet known.
function resolveWinner(mn, koMatches) {
  const entry = KO_ALL[mn];
  if (!entry) return null;
  if (entry.a && entry.b) {
    // R32: actual teams are known
    const round = "R32";
    const inj = koMatches.find(d => d.round === round && ((d.team === entry.a && d.opp === entry.b) || (d.team === entry.b && d.opp === entry.a)));
    if (!inj) return null;
    return (inj.gf > inj.ga || inj.pen) ? inj.team : inj.opp;
  }
  // R16+: resolve both sides recursively
  const teamA = resolveWinner(entry.wA, koMatches);
  const teamB = resolveWinner(entry.wB, koMatches);
  if (!teamA || !teamB) return null;
  const round = ROUND_FOR_MN(mn);
  const inj = koMatches.find(d => d.round === round && ((d.team === teamA && d.opp === teamB) || (d.team === teamB && d.opp === teamA)));
  if (!inj) return null;
  return (inj.gf > inj.ga || inj.pen) ? inj.team : inj.opp;
}

// Returns the losing team abbr of a match, or null if not yet known.
function resolveLoser(mn, koMatches) {
  const entry = KO_ALL[mn];
  if (!entry) return null;
  if (entry.a && entry.b) {
    const inj = koMatches.find(d => d.round === "R32" && ((d.team === entry.a && d.opp === entry.b) || (d.team === entry.b && d.opp === entry.a)));
    if (!inj) return null;
    return (inj.gf > inj.ga || inj.pen) ? inj.opp : inj.team;
  }
  const teamA = resolveWinner(entry.wA, koMatches);
  const teamB = resolveWinner(entry.wB, koMatches);
  if (!teamA || !teamB) return null;
  const round = ROUND_FOR_MN(mn);
  const inj = koMatches.find(d => d.round === round && ((d.team === teamA && d.opp === teamB) || (d.team === teamB && d.opp === teamA)));
  if (!inj) return null;
  return (inj.gf > inj.ga || inj.pen) ? inj.opp : inj.team;
}

// Returns {a, b} team abbrs for a match number's two participants, or null if either is unresolved.
function resolveMatchTeams(mn, koMatches) {
  const entry = KO_ALL[mn];
  if (!entry) return null;
  if (entry.a && entry.b) return { a: entry.a, b: entry.b };
  if (entry.lA !== undefined) {
    const a = resolveLoser(entry.lA, koMatches);
    const b = resolveLoser(entry.lB, koMatches);
    if (!a || !b) return null;
    return { a, b };
  }
  const a = resolveWinner(entry.wA, koMatches);
  const b = resolveWinner(entry.wB, koMatches);
  if (!a || !b) return null;
  return { a, b };
}

// Persist only user-injected deltas, never the merged log — so every deploy's
// updated BASE_MATCH_LOG always reaches returning visitors. The match log is
// rebuilt from the current baseline + replayed injects on each render.
const STORAGE_KEY = "wc2026:injects:v1";
const cloneBase = () => JSON.parse(JSON.stringify(BASE_MATCH_LOG));
function loadInjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function buildMatchLog(injects) {
  const log = cloneBase();
  for (const d of injects) {
    if (!d || !d.team || !d.opp) continue;
    if (!log[d.team]) log[d.team] = [];
    if (!log[d.opp]) log[d.opp] = [];
    log[d.team].push({ opp: d.opp, gf: Number(d.gf), ga: Number(d.ga) });
    log[d.opp].push({ opp: d.team, gf: Number(d.ga), ga: Number(d.gf) });
  }
  return log;
}

// Merge baked-in official KO results with the user's localStorage injects.
// Official results win: a user inject for the same KO match (round + team pair)
// is dropped so it can't double-count. Group injects always pass through.
const koKey = d => `${d.round}|${[d.team, d.opp].sort().join("-")}`;
function mergeInjects(base, user) {
  const baked = new Set(base.filter(d => d.round && d.round !== "group").map(koKey));
  const extra = user.filter(d => !d.round || d.round === "group" || !baked.has(koKey(d)));
  return [...base, ...extra];
}

const CFG_DEFAULTS = {knockout:true,shrink:1.5,halflife:1.5,wForm:1.0,wMom:1.0,wDSI:1.0,wConv:1.0,wSOS:1.0,wExp:1.0,travel:true};
const PARAM_MAP = {a:"teamA",b:"teamB",ko:"knockout",wf:"wForm",wm:"wMom",wd:"wDSI",wc:"wConv",ws:"wSOS",we:"wExp",k:"shrink",hl:"halflife",tr:"travel"};

function parseUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const teamA = p.has("a") && NAMES[p.get("a")] ? p.get("a") : "ARG";
  const teamB = p.has("b") && NAMES[p.get("b")] ? p.get("b") : "BRA";
  const cfg = {...CFG_DEFAULTS};
  if(p.has("ko"))  cfg.knockout = p.get("ko")==="1";
  if(p.has("wf"))  cfg.wForm    = Math.min(2.5,Math.max(0,parseFloat(p.get("wf"))||1));
  if(p.has("wm"))  cfg.wMom     = Math.min(2.5,Math.max(0,parseFloat(p.get("wm"))||1));
  if(p.has("wd"))  cfg.wDSI     = Math.min(2.5,Math.max(0,parseFloat(p.get("wd"))||1));
  if(p.has("wc"))  cfg.wConv    = Math.min(2.5,Math.max(0,parseFloat(p.get("wc"))||1));
  if(p.has("ws"))  cfg.wSOS     = Math.min(2.5,Math.max(0,parseFloat(p.get("ws"))||1));
  if(p.has("we"))  cfg.wExp     = Math.min(2.5,Math.max(0,parseFloat(p.get("we"))||1));
  if(p.has("k"))   cfg.shrink   = Math.min(5,Math.max(0.5,parseFloat(p.get("k"))||1.5));
  if(p.has("hl"))  cfg.halflife = Math.min(4,Math.max(0.5,parseFloat(p.get("hl"))||1.5));
  if(p.has("tr"))  cfg.travel   = p.get("tr")==="1";
  return {teamA, teamB, cfg};
}

const TEAM_GROUP={};
Object.entries(GROUPS).forEach(([g,ts])=>ts.forEach(t=>{TEAM_GROUP[t]=g;}));

const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate=d=>{const[,m,day]=d.split("-");return `${MONTHS[+m-1]} ${+day}`;};
function getSchedInfo(a,b,koMatches){
  const gs=MATCH_SCHEDULE.find(m=>(m.a===a&&m.b===b)||(m.a===b&&m.b===a));
  if(gs)return gs;
  const r32=R32_SCHEDULE.find(m=>(m.a===a&&m.b===b)||(m.a===b&&m.b===a));
  if(r32)return r32;
  if(!koMatches)return null;
  for(const sched of[R16_SCHEDULE,QF_SCHEDULE,SF_SCHEDULE,FINAL_SCHEDULE]){
    for(const e of sched){
      const t=resolveMatchTeams(e.mn,koMatches);
      if(t&&((t.a===a&&t.b===b)||(t.a===b&&t.b===a)))return e;
    }
  }
  return null;
}
function hasBaseResult(a,b){return (BASE_MATCH_LOG[a]||[]).some(m=>m.opp===b);}
const SCHEDULED_UNPLAYED=MATCH_SCHEDULE.filter(m=>!hasBaseResult(m.a,m.b));

// ─── CALCULABLE INDICES ─────────────────────────────────────────────────────
function recencyWeights(n, halflife) {
  const w = [];
  for (let i = 0; i < n; i++) {
    const age = (n - 1) - i;
    w.push(Math.pow(0.5, age / halflife));
  }
  return w;
}

// Single chronological pass through all played matches, updating both teams
// simultaneously — fixes the frozen-opponent-Elo approximation in computeIndices.
function computeAllEarnedElos(matchLog) {
  const elos = { ...PRE_ELO };
  const seen = new Set();
  const played = [];
  // Group matches in schedule order first
  for (const m of MATCH_SCHEDULE) {
    const key = [m.a, m.b].sort().join("|");
    if (seen.has(key)) continue;
    const result = (matchLog[m.a] || []).find(r => r.opp === m.b);
    if (result) { played.push({ a: m.a, b: m.b, gf: result.gf, ga: result.ga }); seen.add(key); }
  }
  // KO injected matches not covered by MATCH_SCHEDULE
  for (const [team, results] of Object.entries(matchLog)) {
    for (const r of results) {
      const key = [team, r.opp].sort().join("|");
      if (seen.has(key)) continue;
      if ((matchLog[r.opp] || []).find(x => x.opp === team)) {
        played.push({ a: team, b: r.opp, gf: r.gf, ga: r.ga }); seen.add(key);
      }
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
  if (gp === 0) {
    return { gp:0, formIdx:0, momentum:0, dsi:0, convincing:0, sos:1500, attRate:1, defRate:1.2, earnedElo };
  }
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
  return {
    gp,
    attRate: wGF/wSum, defRate: wGA/wSum, sos: wOppElo/wSum,
    formIdx: wResult/wSum,
    momentum: gp>=2 ? (log[gp-1].gf-log[gp-1].ga)-(log[0].gf-log[0].ga) : (log[gp-1].gf-log[gp-1].ga),
    dsi: cleanSheets/wSum, convincing: wMargin/wSum, earnedElo,
  };
}

function poisson(lambda,k){ let f=1; for(let i=2;i<=k;i++)f*=i; return Math.exp(-lambda)*Math.pow(lambda,k)/f; }

// Dixon-Coles correction: adjusts Poisson probabilities for low-score outcomes.
// ρ=-0.13 is the empirically estimated value from the original 1997 paper.
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
    lambdaA:lambdaA.toFixed(2), lambdaB:lambdaB.toFixed(2),
    eloA:Math.round(eloA), eloB:Math.round(eloB), scoreA:Math.round(scoreA), scoreB:Math.round(scoreB),
    idxA:A, idxB:B, wA, wB, dataMaturity };
}

// ─── TRAVEL FATIGUE ──────────────────────────────────────────────────────────
// tz = hours behind Eastern Time. East-shift compounds distance burden.
// Penalty = min(20, burden/1000 * 10) Elo-score points subtracted from scoreA/B
// and a proportional lambda reduction (1 - pen/400).
const VENUE_INFO = {
  "Arlington":       {lat:32.748,lon:-97.092,tz:1},
  "Philadelphia":    {lat:39.901,lon:-75.168,tz:0},
  "East Rutherford": {lat:40.813,lon:-74.074,tz:0},
  "Santa Clara":     {lat:37.403,lon:-121.970,tz:3},
  "Houston":         {lat:29.685,lon:-95.411,tz:1},
  "Foxborough":      {lat:42.091,lon:-71.264,tz:0},
  "Toronto":         {lat:43.633,lon:-79.419,tz:0},
  "Guadalajara":     {lat:20.642,lon:-103.399,tz:1},
  "Seattle":         {lat:47.595,lon:-122.332,tz:3},
  "Vancouver":       {lat:49.277,lon:-123.112,tz:3},
  "Atlanta":         {lat:33.755,lon:-84.401,tz:0},
  "Miami Gardens":   {lat:25.958,lon:-80.239,tz:0},
  "Mexico City":     {lat:19.303,lon:-99.150,tz:1},
  "Guadalupe":       {lat:25.676,lon:-100.252,tz:1},
  "Kansas City":     {lat:39.049,lon:-94.484,tz:1},
  "Inglewood":       {lat:33.953,lon:-118.339,tz:3},
};
function venueInfo(str){for(const[k,v]of Object.entries(VENUE_INFO))if(str.includes(k))return v;return null;}
function haversineKm(la1,lo1,la2,lo2){const R=6371,r=d=>d*Math.PI/180,dLa=r(la2-la1),dLo=r(lo2-lo1),a=Math.sin(dLa/2)**2+Math.cos(r(la1))*Math.cos(r(la2))*Math.sin(dLo/2)**2;return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));}
const KO_SCHED_BY_ROUND = {R32:R32_SCHEDULE,R16:R16_SCHEDULE,QF:QF_SCHEDULE,SF:SF_SCHEDULE,Final:FINAL_SCHEDULE};
function getKoVenue(round, team, opp, koMatches) {
  const sched = KO_SCHED_BY_ROUND[round] || [];
  for(const e of sched){
    let a=e.a,b=e.b;
    if(!a||!b){const t=resolveMatchTeams(e.mn,koMatches);if(t){a=t.a;b=t.b;}}
    if((a===team&&b===opp)||(a===opp&&b===team))return e.venue;
  }
  return null;
}
function getTeamPrevVenue(abbr,matchLog,koMatches){
  // Walk KO rounds most-recent first
  for(const round of ["Final","SF","QF","R16","R32"]){
    const km=(koMatches||[]).find(m=>m.round===round&&(m.team===abbr||m.opp===abbr));
    if(km){
      const v=getKoVenue(round,km.team,km.opp,koMatches);
      if(v)return v;
      break;
    }
  }
  // Fall back to most recent played group-stage match
  for(let i=MATCH_SCHEDULE.length-1;i>=0;i--){const m=MATCH_SCHEDULE[i];if(m.a===abbr||m.b===abbr)if((matchLog[m.a]||[]).some(r=>r.opp===m.b))return m.venue;}
  return null;
}
function computeTravelInfo(fromVenue,toVenue){
  const from=venueInfo(fromVenue),to=venueInfo(toVenue);
  if(!from||!to)return null;
  const miles=Math.round(haversineKm(from.lat,from.lon,to.lat,to.lon)*0.621371);
  const tzEast=Math.max(0,from.tz-to.tz);
  const burden=miles+tzEast*200;
  const penalty=Math.min(20,(burden/1000)*10);
  return{miles,tzEast,burden,penalty,fromVenue,toVenue};
}

const C={bg:"#faf7f5",panel:"#e8f4f1",panelAlt:"#F3FFF9",line:"rgba(161,228,219,0.5)",lineStrong:"#A1E4DB",text:"#0a3d3a",dim:"#506c67",green:"#25A497",blue:"#1C5753",coral:"#ff6b47",amber:"#b45309",purple:"#7c3aed",pink:"#be185d",red:"#b91c1c"};

function Slider({label,k,min,max,step,color,help,cfg,onSet}){
  return (
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontSize:"12px",color:C.text,fontWeight:600}}>{label}</span>
        <span style={{fontSize:"12px",fontWeight:800,color}}>{cfg[k].toFixed(2)}</span>
      </div>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={cfg[k]} onChange={e=>onSet(k,parseFloat(e.target.value))} style={{width:"100%",accentColor:color,cursor:"pointer"}}/>
      {help&&<div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{help}</div>}
    </div>
  );
}

export default function ProgressivePredictor(){
  const [injects,setInjects]=useState(loadInjects);
  const allInjects=useMemo(()=>mergeInjects(BASE_KO_RESULTS,injects),[injects]);
  const matchLog=useMemo(()=>buildMatchLog(allInjects),[allInjects]);
  const koMatches=useMemo(()=>allInjects.filter(d=>d.round&&d.round!=="group"),[allInjects]);
  const allAbbrs=Object.keys(NAMES).filter(a=>matchLog[a]);
  const [tab,setTab]=useState("predict");
  const [{teamA:initA,teamB:initB,cfg:initCfg}]=useState(parseUrlParams);
  const [teamA,setTeamA]=useState(initA);
  const [teamB,setTeamB]=useState(initB);
  const [cfg,setCfg]=useState(initCfg);
  const [copied,setCopied]=useState(false);
  const [openGroup,setOpenGroup]=useState(null);
  const [koSchedRound,setKoSchedRound]=useState("R32");
  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(injects)); }catch{} },[injects]);

  useEffect(()=>{
    const p=new URLSearchParams();
    p.set("a",teamA); p.set("b",teamB);
    p.set("ko",cfg.knockout?"1":"0");
    p.set("wf",cfg.wForm); p.set("wm",cfg.wMom); p.set("wd",cfg.wDSI);
    p.set("wc",cfg.wConv); p.set("ws",cfg.wSOS); p.set("we",cfg.wExp);
    p.set("k",cfg.shrink); p.set("hl",cfg.halflife);
    p.set("tr",cfg.travel?"1":"0");
    window.history.replaceState(null,"","?"+p.toString());
  },[teamA,teamB,cfg]);

  const copyLink=useCallback(()=>{
    navigator.clipboard.writeText(window.location.href).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    });
  },[]);
  const [injRound,setInjRound]=useState("group");
  const [injSub,setInjSub]=useState("group");
  const [injTeam,setInjTeam]=useState("ARG");
  const [injOpp,setInjOpp]=useState("AUT");
  const [injGF,setInjGF]=useState(1);
  const [injGA,setInjGA]=useState(0);
  const set=(k,v)=>setCfg(c=>({...c,[k]:v}));

  const travelInfo=useMemo(()=>{
    if(!cfg.travel)return{penA:0,penB:0,infoA:null,infoB:null};
    const sched=getSchedInfo(teamA,teamB,koMatches);
    if(!sched)return{penA:0,penB:0,infoA:null,infoB:null};
    const fromA=getTeamPrevVenue(teamA,matchLog,koMatches),fromB=getTeamPrevVenue(teamB,matchLog,koMatches);
    const infoA=fromA?computeTravelInfo(fromA,sched.venue):null;
    const infoB=fromB?computeTravelInfo(fromB,sched.venue):null;
    return{penA:infoA?.penalty??0,penB:infoB?.penalty??0,infoA,infoB};
  },[teamA,teamB,cfg.travel,matchLog,koMatches]);

  const result=useMemo(()=> teamA===teamB?null:predict(teamA,teamB,cfg,matchLog,travelInfo.penA,travelInfo.penB),[teamA,teamB,cfg,matchLog,travelInfo]);

  const injectResult=useCallback(()=>{
    if(injTeam===injOpp)return;
    setInjects(prev=>{
      if(injRound!=="group"){
        const dup=prev.some(d=>d.round===injRound&&((d.team===injTeam&&d.opp===injOpp)||(d.team===injOpp&&d.opp===injTeam)));
        if(dup)return prev;
      }
      return [...prev,{round:injRound,team:injTeam,opp:injOpp,a:injTeam,b:injOpp,gf:Number(injGF),ga:Number(injGA)}];
    });
  },[injTeam,injOpp,injGF,injGA,injRound]);

  const resetMatchLog=useCallback(()=>{
    try{ localStorage.removeItem(STORAGE_KEY); }catch{}
    setInjects([]);
  },[]);

  const removeInject=useCallback((idx)=>{
    setInjects(prev=>prev.filter((_,i)=>i!==idx));
  },[]);

  const ranking=useMemo(()=>{const liveElos=computeAllEarnedElos(matchLog); return allAbbrs.map(a=>{
    const idx=computeIndices(a,cfg.halflife,matchLog,liveElos);
    const w=idx.gp/(idx.gp+cfg.shrink);
    const elo=w*idx.earnedElo+(1-w)*(PRE_ELO[a]||1500);
    const score=elo+cfg.wForm*idx.formIdx*200+cfg.wMom*idx.momentum*25+cfg.wDSI*idx.dsi*120+cfg.wConv*idx.convincing*40;
    return {abbr:a,...idx,elo:Math.round(elo),score:Math.round(score)};
  }).sort((x,y)=>y.score-x.score);},[cfg,matchLog,allAbbrs]);

  const maxScore=ranking[0]?.score||1;
  const pct=v=>(v*100).toFixed(1)+"%";

  const idxBadge=(val,color,label)=>(
    <div style={{textAlign:"center",flex:1}}>
      <div style={{fontSize:"15px",fontWeight:800,color}}>{val}</div>
      <div style={{fontSize:"9px",color:C.dim,letterSpacing:"0.5px"}}>{label}</div>
    </div>
  );

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",color:C.text}}>
      <div className="wc-header" style={{position:"sticky",top:0,zIndex:100,background:"#0a3d3a",borderBottom:"1px solid rgba(161,228,219,0.2)",padding:"16px 26px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:"12px"}}>
          <div><HayahaiLogo scale={0.62} onDark={true} /></div>
          <div style={{textAlign:"center"}}>
            <h1 className="wc-header-title" style={{margin:0,fontSize:"38px",fontWeight:400,color:"#faf7f5",fontFamily:"'DM Serif Display',Georgia,serif",letterSpacing:"-0.025em",whiteSpace:"nowrap"}}>FIFA Worldcup 2026 — <em style={{color:C.coral,fontStyle:"italic"}}>Predictor</em></h1>
          </div>
          <div style={{textAlign:"right"}}>
            <button onClick={()=>set("knockout",!cfg.knockout)} style={{background:cfg.knockout?C.coral:"rgba(255,255,255,0.08)",color:cfg.knockout?"#fff":"#A1E4DB",border:`1px solid ${cfg.knockout?C.coral:"rgba(161,228,219,0.3)"}`,borderRadius:"9999px",padding:"8px 18px",fontWeight:700,fontSize:"12px",cursor:"pointer",letterSpacing:"0.5px"}}>{cfg.knockout?"🏆 KNOCKOUT STAGE":"📊 GROUP STAGE"}</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"4px",marginTop:"14px",flexWrap:"wrap"}}>
          {["predict","schedule","brackets","indices","tune","inject"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:tab===t?"#25A497":"transparent",color:tab===t?"#0a3d3a":"#A1E4DB",border:"none",borderRadius:"8px 8px 0 0",fontWeight:tab===t?600:400,fontSize:"13px",cursor:"pointer",textTransform:"capitalize",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
              {t==="predict"?"⚔️ Predict":t==="schedule"?"📅 Schedule":t==="brackets"?"🏆 Brackets":t==="indices"?"📈 Power Ranking":t==="tune"?"🎛️ Features Tuning":"📋 Official Results"}
            </button>
          ))}
        </div>
      </div>

      <div className="wc-body" style={{padding:"22px 26px"}}>
        {tab==="predict"&&(
          <div>
            <div className="wc-predict-teams" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"10px",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>TEAM A</div>
                <select aria-label="Team A" value={teamA} onChange={e=>setTeamA(e.target.value)} style={{width:"100%",background:C.panel,border:`1px solid ${C.line}`,color:C.text,padding:"9px 11px",borderRadius:"8px",fontSize:"14px"}}>
                  {allAbbrs.map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                </select>
              </div>
              <div style={{color:C.blue,fontWeight:800,fontSize:"16px",paddingTop:"18px",textAlign:"center"}}>VS</div>
              <div>
                <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>TEAM B</div>
                <select aria-label="Team B" value={teamB} onChange={e=>setTeamB(e.target.value)} style={{width:"100%",background:C.panel,border:`1px solid ${C.line}`,color:C.text,padding:"9px 11px",borderRadius:"8px",fontSize:"14px"}}>
                  {allAbbrs.map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                </select>
              </div>
            </div>

            {result?(<>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
              <button onClick={()=>set("travel",!cfg.travel)} style={{background:cfg.travel?"rgba(255,107,71,0.1)":"transparent",color:cfg.travel?C.coral:C.dim,border:`1px solid ${cfg.travel?"rgba(255,107,71,0.4)":C.line}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                ✈ Travel {cfg.travel?"ON":"OFF"}
              </button>
              <button onClick={copyLink} style={{background:copied?"rgba(37,164,151,0.15)":"transparent",color:copied?C.green:C.dim,border:`1px solid ${copied?C.green:C.line}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                {copied?"✓ Link copied":"🔗 Share prediction"}
              </button>
            </div>

            <div className="wc-score-panel" style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.panel,borderRadius:"14px",padding:"20px",marginBottom:"14px",border:`1px solid ${C.line}`}}>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:"38px"}}>{FLAGS[teamA]}</div>
                <div style={{fontSize:"15px",fontWeight:700}}>{NAMES[teamA]}</div>
                <div style={{fontSize:"12px",color:C.dim}}>Elo {result.eloA} · PWR {ranking.find(t=>t.abbr===teamA)?.score??result.scoreA}</div>
                <div style={{fontSize:"30px",fontWeight:900,color:C.green,marginTop:"6px"}}>{pct(cfg.knockout?result.koWinA:result.winA)}</div>
                <div style={{fontSize:"10px",color:C.dim}}>{cfg.knockout?"advances":"win"}</div>
              </div>
              <div style={{textAlign:"center",padding:"0 12px"}}>
                {!cfg.knockout&&<><div style={{fontSize:"22px",fontWeight:900,color:C.amber}}>{pct(result.draw)}</div><div style={{fontSize:"10px",color:C.dim,marginBottom:"10px"}}>draw</div></>}
                <div style={{fontSize:"10px",color:C.dim}}>exp. goals (λ)</div>
                <div style={{fontSize:"14px",fontWeight:700,color:C.blue}}>{result.lambdaA}–{result.lambdaB}</div>
                <div style={{marginTop:"8px",fontSize:"10px",color:C.dim}}>data maturity</div>
                <div style={{fontSize:"13px",fontWeight:700,color:C.purple}}>{(result.dataMaturity*100).toFixed(0)}%</div>
              </div>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:"38px"}}>{FLAGS[teamB]}</div>
                <div style={{fontSize:"15px",fontWeight:700}}>{NAMES[teamB]}</div>
                <div style={{fontSize:"12px",color:C.dim}}>Elo {result.eloB} · PWR {ranking.find(t=>t.abbr===teamB)?.score??result.scoreB}</div>
                <div style={{fontSize:"30px",fontWeight:900,color:C.blue,marginTop:"6px"}}>{pct(cfg.knockout?result.koWinB:result.winB)}</div>
                <div style={{fontSize:"10px",color:C.dim}}>{cfg.knockout?"advances":"win"}</div>
              </div>
            </div>

            {cfg.travel&&(travelInfo.infoA||travelInfo.infoB)&&(
              <div style={{background:"rgba(255,107,71,0.05)",borderRadius:"12px",padding:"12px 16px",marginBottom:"14px",border:"1px solid rgba(255,107,71,0.2)"}}>
                <div style={{fontSize:"10px",color:C.coral,fontWeight:700,letterSpacing:"1.5px",marginBottom:"8px"}}>TRAVEL ADJUSTMENT · ACTIVE</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"6px",fontSize:"11px",alignItems:"start"}}>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontWeight:700,color:C.text,marginBottom:"2px"}}>{NAMES[teamA]}</div>
                    {travelInfo.infoA?(
                      <>
                        <div style={{color:C.dim}}>{travelInfo.infoA.fromVenue.split(",")[0]} → {travelInfo.infoA.miles.toLocaleString()}mi</div>
                        {travelInfo.infoA.tzEast>0&&<div style={{color:C.dim}}>{travelInfo.infoA.tzEast}hr east shift</div>}
                        <div style={{color:travelInfo.penA>0?C.coral:C.dim,fontWeight:700,marginTop:"2px"}}>−{travelInfo.penA.toFixed(1)} pts</div>
                      </>
                    ):<div style={{color:C.dim}}>no data</div>}
                  </div>
                  <div style={{textAlign:"center",color:C.dim,paddingTop:"14px",fontSize:"10px"}}>vs</div>
                  <div style={{textAlign:"left"}}>
                    <div style={{fontWeight:700,color:C.text,marginBottom:"2px"}}>{NAMES[teamB]}</div>
                    {travelInfo.infoB?(
                      <>
                        <div style={{color:C.dim}}>{travelInfo.infoB.fromVenue.split(",")[0]} → {travelInfo.infoB.miles.toLocaleString()}mi</div>
                        {travelInfo.infoB.tzEast>0&&<div style={{color:C.dim}}>{travelInfo.infoB.tzEast}hr east shift</div>}
                        <div style={{color:travelInfo.penB>0?C.coral:C.dim,fontWeight:700,marginTop:"2px"}}>−{travelInfo.penB.toFixed(1)} pts</div>
                      </>
                    ):<div style={{color:C.dim}}>no data</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{background:C.panel,borderRadius:"12px",padding:"16px",border:`1px solid ${C.line}`}}>
              <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"14px"}}>INDEX COMPARISON (recency-weighted)</div>
              {[
                ["Form Index",result.idxA.formIdx.toFixed(2),result.idxB.formIdx.toFixed(2),C.green],
                ["Momentum",(result.idxA.momentum>0?"+":"")+result.idxA.momentum,(result.idxB.momentum>0?"+":"")+result.idxB.momentum,C.amber],
                ["Def. Solidity",result.idxA.dsi.toFixed(2),result.idxB.dsi.toFixed(2),C.purple],
                ["Convincingness",result.idxA.convincing.toFixed(2),result.idxB.convincing.toFixed(2),C.pink],
                ["Str. of Schedule",Math.round(result.idxA.sos),Math.round(result.idxB.sos),C.blue],
                ["Earned Elo",Math.round(result.idxA.earnedElo),Math.round(result.idxB.earnedElo),C.green],
              ].map(([label,a,b,color])=>(
                <div key={label} style={{display:"flex",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.line}`}}>
                  <div style={{flex:1,textAlign:"right",fontSize:"14px",fontWeight:700,color:Number(a)>=Number(b)?color:C.dim}}>{a}</div>
                  <div className="wc-idx-row-label" style={{width:"140px",textAlign:"center",fontSize:"11px",color:C.dim}}>{label}</div>
                  <div style={{flex:1,textAlign:"left",fontSize:"14px",fontWeight:700,color:Number(b)>=Number(a)?color:C.dim}}>{b}</div>
                </div>
              ))}
            </div>
            </>):(
              <div style={{background:C.panel,borderRadius:"12px",padding:"20px",border:`1px solid ${C.line}`,textAlign:"center",color:C.dim,fontSize:"13px"}}>
                Pick two different teams to see a prediction.
              </div>
            )}
          </div>
        )}

        {tab==="indices"&&(
          <div>
            <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"4px"}}>LIVE POWER RANKING · recomputes from injected results</div>
            <div style={{fontSize:"10px",color:C.dim,marginBottom:"12px"}}>Pre-tournament Elo: all 48 teams from eloratings.net (WC 2026 start). Fixtures &amp; results: FIFA (official) and CBS Sports.</div>
            {ranking.map((t,i)=>(
              <div key={t.abbr} style={{background:C.panel,borderRadius:"10px",padding:"11px 14px",marginBottom:"7px",border:`1px solid ${i===0?C.green+"60":C.line}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
                  <span style={{fontSize:"11px",fontWeight:800,color:C.blue,width:"22px"}}>#{i+1}</span>
                  <span style={{fontSize:"17px"}}>{FLAGS[t.abbr]}</span>
                  <div style={{flex:1}}><span style={{fontSize:"13px",fontWeight:700}}>{NAMES[t.abbr]}</span><span style={{fontSize:"11px",color:C.dim}}> · {t.gp} GP · Elo {t.elo}</span></div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"16px",fontWeight:800,color:C.green}}>{t.score}</div>
                    <div style={{fontSize:"9px",color:C.dim,letterSpacing:"1px"}}>PWR</div>
                  </div>
                </div>
                <div style={{height:"3px",background:C.line,borderRadius:"2px",marginBottom:"7px"}}>
                  <div style={{height:"3px",borderRadius:"2px",background:`linear-gradient(90deg,${C.green},${C.blue})`,width:`${(t.score/maxScore*100).toFixed(1)}%`}}/>
                </div>
                <div style={{display:"flex",gap:"4px"}}>
                  {idxBadge(t.formIdx.toFixed(2),C.green,"FORM")}
                  {idxBadge((t.momentum>0?"+":"")+t.momentum,C.amber,"MOM")}
                  {idxBadge(t.dsi.toFixed(2),C.purple,"DSI")}
                  {idxBadge(t.convincing.toFixed(1),C.pink,"CONV")}
                  {idxBadge(Math.round(t.sos),C.blue,"SOS")}
                  {idxBadge(t.attRate.toFixed(1),C.text,"ATT")}
                  {idxBadge(t.defRate.toFixed(1),C.red,"DEF")}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==="tune"&&(
          <div>
            <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"16px"}}>FEATURE WEIGHT INJECTION · live model tuning</div>
            <div style={{background:C.panel,borderRadius:"12px",padding:"18px",border:`1px solid ${C.line}`,marginBottom:"14px"}}>
              <Slider label="Form Index weight" k="wForm" min={0} max={2.5} step={0.1} color={C.green} help="How much a team's win/draw/loss record in this tournament shifts the prediction. Recent matches are weighted more than early ones. Slide right if you believe tournament form is the best signal; slide left to rely more on pre-tournament Elo." cfg={cfg} onSet={set}/>
              <Slider label="Momentum weight" k="wMom" min={0} max={2.5} step={0.1} color={C.amber} help="Captures whether a team is peaking or wobbling — measured as the goal-difference trend from their first match to their latest. A team winning by wider margins over time scores higher. Increase this if you think trajectory matters more than average form." cfg={cfg} onSet={set}/>
              <Slider label="Defensive Solidity weight" k="wDSI" min={0} max={2.5} step={0.1} color={C.purple} help="Measures how often a team has kept clean sheets, weighted toward recent matches. Strong defensive teams tend to control outcomes in tight knockout games. Raise this in later stages when a single goal often decides the match." cfg={cfg} onSet={set}/>
              <Slider label="Convincingness weight" k="wConv" min={0} max={2.5} step={0.1} color={C.pink} help="Rewards teams that not only win, but win by large, consistent margins — margin capped at ±3 so a 7-0 blowout doesn't distort the model. Increase this to favour teams that have been dominant, not just unbeaten." cfg={cfg} onSet={set}/>
              <Slider label="Strength-of-Schedule weight" k="wSOS" min={0} max={2.5} step={0.1} color={C.blue} help="Scales a team's form stats by the average Elo of opponents they have faced. Beating a top-ranked side counts for more than beating a weak side. Raise this when comparing teams from different groups with very different opposition quality." cfg={cfg} onSet={set}/>
              <Slider label="Big-game experience weight" k="wExp" min={0} max={2.5} step={0.1} color={C.text} help="Knockout-only: in close matches, teams with a higher pre-tournament Elo get a small pedigree boost — reflecting years of World Cup experience in high-pressure games. Raise this if you believe established giants hold an edge over upstarts in do-or-die situations." cfg={cfg} onSet={set}/>
            </div>
            <div style={{background:C.panel,borderRadius:"12px",padding:"18px",border:`1px solid ${C.line}`}}>
              <div style={{fontSize:"11px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"12px"}}>PROGRESSIVE LEARNING CONTROLS</div>
              <Slider label="Prior shrinkage (k)" k="shrink" min={0.5} max={5} step={0.5} color={C.green} help="Controls how quickly the model shifts its trust from pre-tournament Elo to live tournament stats. Low k (e.g. 0.5–1.0) means even 1–2 matches heavily update the model; high k (4–5) means it stays close to the pre-tournament Elo until a team has played many games. Useful when you think early results are noisy — raise k in the group stage, lower it by the knockouts." cfg={cfg} onSet={set}/>
              <Slider label="Recency half-life (matches)" k="halflife" min={0.5} max={4} step={0.5} color={C.blue} help="Sets how fast older matches fade in importance relative to newer ones. At 1.0, the most recent match is weighted twice as heavily as the one before it. At 0.5, it is four times heavier — making the model very streak-sensitive. Lower values suit a fast-evolving tournament where form can shift dramatically match to match." cfg={cfg} onSet={set}/>
            </div>
            <div style={{marginTop:"12px",padding:"12px",background:"rgba(10,61,58,0.05)",border:"1px solid rgba(161,228,219,0.5)",borderRadius:"10px",fontSize:"12px",color:C.blue,lineHeight:1.6}}>
              <strong style={{color:C.text}}>Why this is progressive:</strong> as GP rises, prior shrinkage GP/(GP+k) shifts weight from pre-tournament Elo toward earned-Elo and form indices. By the knockout stage (GP≥3), the model is ~70%+ data-driven. The Poisson/Elo ensemble weight also scales with data maturity.
            </div>
            <div style={{marginTop:"12px",background:C.panel,borderRadius:"12px",padding:"18px",border:`1px solid ${C.line}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                <div style={{fontSize:"11px",color:C.dim,fontWeight:700,letterSpacing:"1px"}}>TRAVEL FATIGUE</div>
                <button onClick={()=>set("travel",!cfg.travel)} style={{background:cfg.travel?"rgba(255,107,71,0.1)":"transparent",color:cfg.travel?C.coral:C.dim,border:`1px solid ${cfg.travel?"rgba(255,107,71,0.4)":C.line}`,borderRadius:"8px",padding:"4px 12px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>
                  {cfg.travel?"ON":"OFF"}
                </button>
              </div>
              <div style={{fontSize:"11px",color:C.dim,lineHeight:1.6}}>
                When enabled, applies a penalty to teams based on their travel distance and time-zone east-shift from their previous match city. Burden = miles + (TZ east hours × 200). Penalty = min(20, burden ÷ 1000 × 10) score points, capped at 20 pts. Also reduces expected goals (λ) proportionally. Only active for scheduled matches with known prior venues.
              </div>
            </div>
          </div>
        )}

        {tab==="schedule"&&(()=>{
          const KO_ROUNDS=[
            {id:"R32",label:"Round of 32",sched:R32_SCHEDULE},
            {id:"R16",label:"Round of 16",sched:R16_SCHEDULE},
            {id:"QF",label:"Quarter-Finals",sched:QF_SCHEDULE},
            {id:"SF",label:"Semi-Finals",sched:SF_SCHEDULE},
            {id:"Final",label:"Final",sched:FINAL_SCHEDULE},
          ];
          if(cfg.knockout){
            const curRound=KO_ROUNDS.find(r=>r.id===koSchedRound)||KO_ROUNDS[0];
            const injForRound=koMatches.filter(m=>m.round===koSchedRound);

            // Render a single KO match row (works for all rounds)
            const KoMatchRow=({entry})=>{
              // Resolve actual team abbrs (null if bracket not yet determined)
              const isLoserBracket=entry.lA!==undefined;
              let tA=entry.a, tB=entry.b;
              if(!tA){tA=isLoserBracket?resolveLoser(entry.lA,koMatches):resolveWinner(entry.wA,koMatches);}
              if(!tB){tB=isLoserBracket?resolveLoser(entry.lB,koMatches):resolveWinner(entry.wB,koMatches);}
              const refA=isLoserBracket?entry.lA:entry.wA;
              const refB=isLoserBracket?entry.lB:entry.wB;
              const prefix=isLoserBracket?"L":"W";
              // Labels: team name if known, "W/L{mn}" if not
              const labelA=tA?(FLAGS[tA]+" "+(NAMES[tA]||tA)):`${prefix}${refA||entry.mn}`;
              const labelB=tB?((NAMES[tB]||tB)+" "+FLAGS[tB]):`${prefix}${refB||entry.mn}`;
              // Find injected result (if both teams known)
              let res=null;
              if(tA&&tB){res=injForRound.find(r=>(r.team===tA&&r.opp===tB)||(r.team===tB&&r.opp===tA))||null;}
              const gf=res?(res.team===tA?res.gf:res.ga):null;
              const ga=res?(res.team===tA?res.ga:res.gf):null;
              const penA=res?.pen?(res.team===tA?res.penTeam:res.penOpp):null;
              const penB=res?.pen?(res.team===tA?res.penOpp:res.penTeam):null;
              const bothKnown=!!(tA&&tB);
              return (
                <div style={{background:C.panel,borderRadius:"10px",padding:"10px 14px",border:`1px solid ${res?C.lineStrong:C.line}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px"}}>
                  <div style={{flex:1,textAlign:"right"}}>
                    <div style={{fontSize:"12px",fontWeight:tA?600:400,color:tA?C.text:C.dim}}>{labelA}</div>
                    {!tA&&(()=>{const r=R32_SCHEDULE.find(x=>x.mn===entry.wA);return r?<div style={{fontSize:"9px",color:C.dim}}>{r.a}/{r.b}</div>:null;})()}
                  </div>
                  <div style={{textAlign:"center",minWidth:"106px"}}>
                    <div style={{fontSize:"9px",color:C.dim,marginBottom:"2px"}}>{fmtDate(entry.date)} · M{entry.mn}</div>
                    {res!=null?(
                      <div style={{fontSize:"14px",fontWeight:800,color:(gf>ga||(res.pen&&res.team===tA))?C.green:(gf<ga||(res.pen&&res.opp===tA))?C.red:C.amber}}>{penA!=null?`${gf}(${penA})–${ga}(${penB})`:res.pen?`${gf}–${ga} (p)`:`${gf}–${ga}`}</div>
                    ):(
                      <div>
                        <div style={{fontSize:"9px",color:C.dim,marginBottom:"3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100px"}}>{entry.venue.split(",")[0]}</div>
                        {!bothKnown&&(
                          <div style={{fontSize:"9px",color:C.dim,fontStyle:"italic"}}>awaiting bracket</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"12px",fontWeight:tB?600:400,color:tB?C.text:C.dim}}>{labelB}</div>
                    {!tB&&(()=>{const r=R32_SCHEDULE.find(x=>x.mn===entry.wB);return r?<div style={{fontSize:"9px",color:C.dim}}>{r.a}/{r.b}</div>:null;})()}
                  </div>
                </div>
              );
            };

            return (
              <div>
                <div style={{fontSize:"12px",color:C.coral,fontWeight:700,letterSpacing:"2px",marginBottom:"14px"}}>MATCH SCHEDULE · KNOCKOUT STAGE</div>
                <div style={{display:"flex",gap:"6px",marginBottom:"16px",flexWrap:"wrap"}}>
                  {KO_ROUNDS.map(({id,label})=>{
                    const active=koSchedRound===id;
                    return (
                      <button key={id} onClick={()=>setKoSchedRound(id)} style={{padding:"6px 14px",background:active?C.coral:"transparent",color:active?"#fff":C.coral,border:`1px solid ${C.coral}`,borderRadius:"9999px",fontWeight:active?700:500,fontSize:"11px",cursor:"pointer",letterSpacing:"0.3px",transition:"all 0.15s"}}>
                        {label}
                      </button>
                    );
                  })}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                  {curRound.sched.map((entry,i)=><KoMatchRow key={i} entry={entry}/>)}
                </div>
              </div>
            );
          }
          // ── GROUP STAGE SCHEDULE ──
          const today=new Date().toISOString().slice(0,10);
          const todayMatches=MATCH_SCHEDULE.filter(m=>m.date===today);
          return (
          <div>
            <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"14px"}}>MATCH SCHEDULE · GROUP STAGE</div>
            {todayMatches.length>0&&(
              <div style={{background:C.panelAlt,borderRadius:"10px",padding:"12px",marginBottom:"14px",border:`1px solid ${C.lineStrong}`}}>
                <div style={{fontSize:"10px",fontWeight:800,color:C.green,letterSpacing:"1px",marginBottom:"8px"}}>TODAY — {fmtDate(today).toUpperCase()}</div>
                {todayMatches.map(m=>{
                  const res=(matchLog[m.a]||[]).find(r=>r.opp===m.b)||null;
                  return (
                    <div key={m.a+m.b} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.line}`}}>
                      <span style={{fontSize:"12px",fontWeight:600,flex:1,textAlign:"right"}}>{FLAGS[m.a]} {NAMES[m.a]}</span>
                      <div style={{textAlign:"center",minWidth:"110px"}}>
                        <div style={{fontSize:"9px",fontWeight:700,color:C.blue,letterSpacing:"0.5px",marginBottom:"2px"}}>GROUP {m.g}</div>
                        {res?(
                          <span style={{fontSize:"13px",fontWeight:800,color:res.gf>res.ga?C.green:res.gf<res.ga?C.red:C.amber}}>{res.gf}–{res.ga}</span>
                        ):(
                          <div style={{fontSize:"9px",color:C.dim}}>{m.venue.split(",")[0]}</div>
                        )}
                      </div>
                      <span style={{fontSize:"12px",fontWeight:600,flex:1}}>{NAMES[m.b]} {FLAGS[m.b]}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {openGroup&&(()=>{
              const ts=GROUPS[openGroup];
              const rows=[];
              for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){
                const [a,b]=[ts[i],ts[j]];
                const info=getSchedInfo(a,b);
                const res=(matchLog[a]||[]).find(m=>m.opp===b)||null;
                rows.push({a,b,info,res});
              }
              rows.sort((x,y)=>(x.info?.date||"").localeCompare(y.info?.date||""));
              return (
                <div style={{background:C.panelAlt,borderRadius:"10px",padding:"12px",marginBottom:"14px",border:`1px solid ${C.lineStrong}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                    <span style={{fontSize:"11px",fontWeight:800,color:C.green,letterSpacing:"1px"}}>GROUP {openGroup} — FIXTURES</span>
                    <button onClick={()=>setOpenGroup(null)} aria-label="Close" style={{background:"transparent",border:"none",color:C.dim,fontSize:"18px",lineHeight:1,cursor:"pointer",padding:"0 4px"}}>×</button>
                  </div>
                  {rows.map(({a,b,info,res})=>(
                    <div key={a+b} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.line}`}}>
                      <span style={{fontSize:"12px",fontWeight:600,flex:1,textAlign:"right"}}>{FLAGS[a]} {NAMES[a]}</span>
                      <div style={{textAlign:"center",minWidth:"110px"}}>
                        <div style={{fontSize:"9px",fontWeight:700,color:C.blue,letterSpacing:"0.5px",marginBottom:"2px"}}>{info?fmtDate(info.date):"matchday 1"}</div>
                        {res?(
                          <span style={{fontSize:"13px",fontWeight:800,color:res.gf>res.ga?C.green:res.gf<res.ga?C.red:C.amber}}>{res.gf}–{res.ga}</span>
                        ):(
                          <div style={{fontSize:"9px",color:C.dim}}>{info?info.venue.split(",")[0]:""}</div>
                        )}
                      </div>
                      <span style={{fontSize:"12px",fontWeight:600,flex:1}}>{NAMES[b]} {FLAGS[b]}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
            <div className="wc-schedule-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
              {Object.keys(GROUPS).map(g=>{
                const ts=GROUPS[g];
                const pairs=[];
                for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){
                  const [a,b]=[ts[i],ts[j]];
                  const res=(matchLog[a]||[]).find(m=>m.opp===b)||null;
                  pairs.push({a,b,res});
                }
                const playedCount=pairs.filter(p=>p.res).length;
                const isOpen=openGroup===g;
                return (
                  <div key={g} role="button" tabIndex={0} aria-expanded={isOpen} aria-label={`Group ${g} fixtures`} onClick={()=>setOpenGroup(isOpen?null:g)} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setOpenGroup(isOpen?null:g);}}} style={{background:C.panel,borderRadius:"10px",padding:"12px",border:`1px solid ${isOpen?C.lineStrong:C.line}`,cursor:"pointer",boxShadow:isOpen?`0 0 0 1px ${C.lineStrong}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                      <span style={{fontSize:"12px",fontWeight:800,color:C.blue,letterSpacing:"1px"}}>GROUP {g}</span>
                      <span style={{fontSize:"10px",color:C.dim}}>{playedCount}/6</span>
                    </div>
                    <div style={{fontSize:"10px",color:C.dim,marginBottom:"8px"}}>{ts.map(t=>FLAGS[t]).join(" ")}</div>
                    {pairs.map(({a,b,res})=>{
                      const info=getSchedInfo(a,b);
                      return (
                        <div key={a+b} style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 0",borderBottom:`1px solid ${C.line}`}}>
                          <span style={{fontSize:"11px",flex:1,textAlign:"right",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{FLAGS[a]} {a}</span>
                          {res?(
                            <span style={{fontSize:"12px",fontWeight:800,minWidth:"34px",textAlign:"center",color:res.gf>res.ga?C.green:res.gf<res.ga?C.red:C.amber}}>{res.gf}–{res.ga}</span>
                          ):(
                            <span style={{fontSize:"9px",color:C.dim,whiteSpace:"nowrap",minWidth:"34px",textAlign:"center"}}>{info?fmtDate(info.date):""}</span>
                          )}
                          <span style={{fontSize:"11px",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b} {FLAGS[b]}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {tab==="brackets"&&(
          <div>
            <div style={{marginBottom:"12px"}}>
              <div style={{fontSize:"16px",fontWeight:700,color:C.text,fontFamily:"'DM Serif Display',Georgia,serif"}}>Predicted Knockout Bracket</div>
              <div style={{fontSize:"12px",color:C.dim,marginTop:"3px"}}>Model-projected winners R32 → Final, with travel fatigue applied. Winners shown in teal with their win probability. <span style={{color:C.coral,fontWeight:600}}>Scroll sideways to explore the full bracket.</span></div>
            </div>
            <div style={{overflowX:"auto",overflowY:"hidden",WebkitOverflowScrolling:"touch",border:`1px solid ${C.line}`,borderRadius:"12px",background:C.bg}}>
              <div style={{minWidth:"900px"}} dangerouslySetInnerHTML={{__html:BRACKET_SVG}}/>
            </div>
            <div style={{fontSize:"10px",color:C.dim,marginTop:"10px"}}>Static projection generated from the group-stage results; it does not update with the sliders. Re-rendered each deploy.</div>
          </div>
        )}

        {tab==="inject"&&(()=>{
          const isUserInjected=(a,b)=>injects.some(d=>d.round==="group"&&((d.team===a&&d.opp===b)||(d.team===b&&d.opp===a)));
          const pending=SCHEDULED_UNPLAYED.filter(m=>!isUserInjected(m.a,m.b));
          const userAdded=SCHEDULED_UNPLAYED.filter(m=>isUserInjected(m.a,m.b));
          const isSel=(a,b)=>injRound==="group"&&injTeam===a&&injOpp===b;
          const koInjs=injects.filter(d=>d.round&&d.round!=="group"&&!BASE_KO_RESULTS.some(b=>b.round===d.round&&((b.team===d.team&&b.opp===d.opp)||(b.team===d.opp&&b.opp===d.team))));
          return (
            <div>
              <div style={{display:"flex",gap:"6px",marginBottom:"18px",borderBottom:`1px solid ${C.line}`,paddingBottom:"12px"}}>
                {[["group","📊 Group Stage Standings"],["ko","🏆 Knockout Stage"]].map(([s,label])=>(
                  <button key={s} onClick={()=>{setInjSub(s);setInjRound(s==="ko"?"R32":"group");}} style={{padding:"7px 14px",background:injSub===s?C.green:"transparent",color:injSub===s?"#0a3d3a":C.dim,border:`1px solid ${injSub===s?C.green:C.line}`,borderRadius:"9999px",fontSize:"12px",fontWeight:injSub===s?800:600,cursor:"pointer"}}>{label}</button>
                ))}
              </div>

              {injSub==="group"&&(<>
              {/* ── Group Standings ── */}
              <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"4px"}}>GROUP STANDINGS · AS OF 2026-06-24</div>
              <div style={{fontSize:"10px",color:C.dim,marginBottom:"14px"}}>Source: FIFA (official) and CBS Sports. Top 2 from each group advance; 8 best 3rd-place teams also qualify.</div>
              <div className="wc-schedule-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"24px"}}>
                {Object.entries(GROUP_STANDINGS).map(([g, teams])=>{
                  const allDone=teams.every(r=>r.gp===3);
                  return (
                    <div key={g} style={{background:C.panel,borderRadius:"10px",padding:"10px",border:`1px solid ${allDone?C.green+"50":C.line}`}}>
                      <div style={{fontSize:"11px",fontWeight:800,color:C.blue,letterSpacing:"1px",marginBottom:"7px"}}>GROUP {g}</div>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"10px"}}>
                        <thead>
                          <tr style={{color:C.dim}}>
                            <th style={{textAlign:"left",fontWeight:600,paddingBottom:"4px",width:"14px"}}>#</th>
                            <th style={{textAlign:"left",fontWeight:600,paddingBottom:"4px"}}>Team</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"20px"}}>GP</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"16px"}}>W</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"16px"}}>D</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"16px"}}>L</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"18px"}}>GF</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"18px"}}>GA</th>
                            <th style={{textAlign:"center",fontWeight:600,paddingBottom:"4px",width:"24px"}}>GD</th>
                            <th style={{textAlign:"center",fontWeight:700,paddingBottom:"4px",width:"22px",color:C.text}}>Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teams.map((row,i)=>{
                            const isQ=i<2, is3rd=i===2;
                            const gd=row.gf-row.ga;
                            return (
                              <tr key={row.t} style={{borderTop:`1px solid ${C.line}`}}>
                                <td style={{padding:"4px 0",color:isQ?C.green:is3rd?C.amber:C.dim,fontWeight:700,fontSize:"9px"}}>{i+1}</td>
                                <td style={{padding:"4px 2px"}}>
                                  <span style={{display:"inline-flex",alignItems:"center",gap:"3px",borderLeft:`2px solid ${isQ?C.green:is3rd?C.amber:"transparent"}`,paddingLeft:"4px"}}>
                                    {FLAGS[row.t]}<span style={{fontWeight:600}}>{row.t}</span>
                                  </span>
                                </td>
                                <td style={{textAlign:"center",color:C.dim}}>{row.gp}</td>
                                <td style={{textAlign:"center",fontWeight:700,color:row.w>0?C.green:C.dim}}>{row.w}</td>
                                <td style={{textAlign:"center",color:C.dim}}>{row.d}</td>
                                <td style={{textAlign:"center",color:row.l>0?C.red:C.dim}}>{row.l}</td>
                                <td style={{textAlign:"center",color:C.dim}}>{row.gf}</td>
                                <td style={{textAlign:"center",color:C.dim}}>{row.ga}</td>
                                <td style={{textAlign:"center",color:gd>0?C.green:gd<0?C.red:C.dim}}>{gd>0?"+":""}{gd}</td>
                                <td style={{textAlign:"center",fontWeight:800,color:isQ?C.green:C.text}}>{row.pts}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              </>)}

              {injSub==="ko"&&(<>
              {/* ── Knockout Stage ── */}
              <div style={{background:C.panel,borderRadius:"10px",padding:"12px",border:`1px solid ${C.line}`}}>
                {BASE_KO_RESULTS.length>0&&(
                  <div>
                    <div style={{fontSize:"10px",color:C.green,fontWeight:700,letterSpacing:"1px",marginBottom:"6px"}}>OFFICIAL KNOCKOUT RESULTS</div>
                    {["R32","R16","QF","SF","Final"].map(r=>{
                      const rms=BASE_KO_RESULTS.filter(d=>d.round===r);
                      if(!rms.length)return null;
                      const rl=r==="R32"?"Round of 32":r==="R16"?"Round of 16":r==="QF"?"QF":r==="SF"?"SF":"Final";
                      return (
                        <div key={r} style={{marginBottom:"6px"}}>
                          <div style={{fontSize:"9px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"3px"}}>{rl}</div>
                          {rms.map((d,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",borderBottom:`1px solid ${C.line}`}}>
                              <span style={{fontSize:"11px",flex:1,textAlign:"right"}}>{FLAGS[d.team]} {NAMES[d.team]}</span>
                              <span style={{fontSize:"12px",fontWeight:800,color:d.gf>d.ga||d.pen?C.green:d.gf<d.ga?C.red:C.amber,minWidth:"60px",textAlign:"center"}}>{d.penTeam!=null?`${d.gf}(${d.penTeam})–${d.ga}(${d.penOpp})`:d.pen?`${d.gf}–${d.ga} (p)`:`${d.gf}–${d.ga}`}</span>
                              <span style={{fontSize:"11px",flex:1}}>{NAMES[d.opp]} {FLAGS[d.opp]}</span>
                              <span style={{fontSize:"8px",fontWeight:800,color:C.green,border:`1px solid ${C.green}`,borderRadius:"4px",padding:"1px 4px",letterSpacing:"0.5px"}}>OFFICIAL</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                {koInjs.length>0&&(
                  <div style={{marginTop:"12px",paddingTop:"12px",borderTop:`1px solid ${C.line}`}}>
                    <div style={{fontSize:"10px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"6px"}}>YOUR ADDED RESULTS (LOCAL)</div>
                    {["R32","R16","QF","SF","Final"].map(r=>{
                      const rms=koInjs.filter(d=>d.round===r);
                      if(!rms.length)return null;
                      const rl=r==="R32"?"Round of 32":r==="R16"?"Round of 16":r==="QF"?"QF":r==="SF"?"SF":"Final";
                      return (
                        <div key={r} style={{marginBottom:"6px"}}>
                          <div style={{fontSize:"9px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"3px"}}>{rl}</div>
                          {rms.map((d,i)=>{
                            const gi=injects.indexOf(d);
                            return (
                              <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"4px 0",borderBottom:`1px solid ${C.line}`}}>
                                <span style={{fontSize:"11px",flex:1,textAlign:"right"}}>{FLAGS[d.a]} {NAMES[d.a]}</span>
                                <span style={{fontSize:"12px",fontWeight:800,color:d.gf>d.ga||d.pen?C.green:d.gf<d.ga?C.red:C.amber,minWidth:"30px",textAlign:"center"}}>{d.gf}–{d.ga}{d.pen?" (p)":""}</span>
                                <span style={{fontSize:"11px",flex:1}}>{NAMES[d.b]} {FLAGS[d.b]}</span>
                                <button onClick={()=>removeInject(gi)} aria-label="Remove" style={{background:"transparent",border:"none",color:C.dim,fontSize:"16px",lineHeight:1,cursor:"pointer",padding:"0 2px"}}>×</button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </>)}

              {injects.length>0&&(
                <button onClick={resetMatchLog} style={{width:"100%",marginTop:"16px",background:"transparent",color:C.dim,border:`1px solid ${C.line}`,borderRadius:"8px",padding:"10px",fontWeight:700,fontSize:"12px",cursor:"pointer"}}>
                  Reset all locally-added results
                </button>
              )}
            </div>
          );
        })()}
      </div>

      <div style={{textAlign:"center",padding:"14px",borderTop:"1px solid rgba(161,228,219,0.4)",fontSize:"11px",color:C.dim,lineHeight:1.6}}>
        Progressive Elo-Poisson · Dixon-Coles · travel-adjusted · Bayesian shrinkage · {cfg.knockout?"knockout":"group"} mode<br/>
        Fixtures &amp; results: FIFA (official) and CBS Sports · Elo: all 48 teams from eloratings.net pre-tournament ratings (WC 2026 start)
      </div>
    </div>
  );
}
