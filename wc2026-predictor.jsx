import { useState, useMemo, useCallback, useEffect } from "react";
import HayahaiLogo from "./HayahaiLogo.jsx";

// ─── VALIDATED BASE DATA ────────────────────────────────────────────────────
// PRE_ELO: EXACT values for 18 teams from eloratings.net (21 Jun 2026).
// Remaining WC teams ESTIMATED, FIFA-rank-ordered (ESPN Jun 2026), scaled to
// sit just below Austria (1857). Exact entries flagged in ELO_EXACT below.
const PRE_ELO = {
  // ── EXACT (eloratings.net, 21 Jun 2026) ──
  ESP:2129, ARG:2128, FRA:2084, ENG:2055, COL:1998, BRA:1986,
  NED:1972, POR:1967, GER:1954, NOR:1929, JPN:1910, MEX:1896,
  CRO:1881, BEL:1879, URU:1870, MAR:1866, ECU:1864, AUT:1857,
  // ── ESTIMATED, FIFA-rank-ordered, scaled below Austria ──
  USA:1845, SEN:1838, SUI:1822, IRN:1808, SWE:1800, KOR:1792,
  EGY:1784, CIV:1776, AUS:1768, DZA:1760, CAN:1752, PAN:1740,
  CZE:1730, PAR:1720, SCO:1712, TUN:1700, COD:1688, QAT:1640,
  IRQ:1632, RSA:1620, KSA:1608, JOR:1596, BIH:1584, CPV:1568,
  UZB:1552, GHA:1536, TUR:1788, CUW:1492, HTI:1486, NZL:1470,
};

// Provenance: which ratings are exact (eloratings.net) vs estimated
const ELO_EXACT = new Set([
  "ESP","ARG","FRA","ENG","COL","BRA","NED","POR","GER","NOR","JPN","MEX",
  "CRO","BEL","URU","MAR","ECU","AUT",
]);

// BASE_MATCH_LOG: every score validated against CBS Sports group tables (21 Jun 2026).
// {opp, gf, ga} per match, in chronological order (MD1 then MD2).
const BASE_MATCH_LOG = {
  // Group A
  MEX:[{opp:"RSA",gf:2,ga:0},{opp:"KOR",gf:1,ga:0}],
  KOR:[{opp:"CZE",gf:2,ga:1},{opp:"MEX",gf:0,ga:1}],
  CZE:[{opp:"KOR",gf:1,ga:2},{opp:"RSA",gf:1,ga:1}],
  RSA:[{opp:"MEX",gf:0,ga:2},{opp:"CZE",gf:1,ga:1}],
  // Group B
  CAN:[{opp:"BIH",gf:1,ga:1},{opp:"QAT",gf:6,ga:0}],
  SUI:[{opp:"QAT",gf:1,ga:1},{opp:"BIH",gf:4,ga:1}],
  BIH:[{opp:"CAN",gf:1,ga:1},{opp:"SUI",gf:1,ga:4}],
  QAT:[{opp:"SUI",gf:1,ga:1},{opp:"CAN",gf:0,ga:6}],
  // Group C
  BRA:[{opp:"MAR",gf:1,ga:1},{opp:"HTI",gf:3,ga:0}],
  MAR:[{opp:"BRA",gf:1,ga:1},{opp:"SCO",gf:1,ga:0}],
  SCO:[{opp:"HTI",gf:1,ga:0},{opp:"MAR",gf:0,ga:1}],
  HTI:[{opp:"SCO",gf:0,ga:1},{opp:"BRA",gf:0,ga:3}],
  // Group D
  USA:[{opp:"PAR",gf:4,ga:1},{opp:"AUS",gf:2,ga:0}],
  AUS:[{opp:"TUR",gf:2,ga:0},{opp:"USA",gf:0,ga:2}],
  PAR:[{opp:"USA",gf:1,ga:4},{opp:"TUR",gf:1,ga:0}],
  TUR:[{opp:"AUS",gf:0,ga:2},{opp:"PAR",gf:0,ga:1}],
  // Group E
  GER:[{opp:"CUW",gf:7,ga:1},{opp:"CIV",gf:2,ga:1}],
  CIV:[{opp:"ECU",gf:1,ga:0},{opp:"GER",gf:1,ga:2}],
  ECU:[{opp:"CIV",gf:0,ga:1},{opp:"CUW",gf:0,ga:0}],
  CUW:[{opp:"GER",gf:1,ga:7},{opp:"ECU",gf:0,ga:0}],
  // Group F
  NED:[{opp:"JPN",gf:2,ga:2},{opp:"SWE",gf:5,ga:1}],
  JPN:[{opp:"NED",gf:2,ga:2},{opp:"TUN",gf:4,ga:0}],
  SWE:[{opp:"TUN",gf:5,ga:1},{opp:"NED",gf:1,ga:5}],
  TUN:[{opp:"SWE",gf:1,ga:5},{opp:"JPN",gf:0,ga:4}],
  // Group G
  EGY:[{opp:"BEL",gf:1,ga:1},{opp:"NZL",gf:3,ga:1}],
  IRN:[{opp:"NZL",gf:2,ga:2},{opp:"BEL",gf:0,ga:0}],
  BEL:[{opp:"EGY",gf:1,ga:1},{opp:"IRN",gf:0,ga:0}],
  NZL:[{opp:"IRN",gf:2,ga:2},{opp:"EGY",gf:1,ga:3}],
  // Group H
  ESP:[{opp:"CPV",gf:0,ga:0},{opp:"KSA",gf:4,ga:0}],
  URU:[{opp:"KSA",gf:1,ga:1},{opp:"CPV",gf:2,ga:2}],
  CPV:[{opp:"ESP",gf:0,ga:0},{opp:"URU",gf:2,ga:2}],
  KSA:[{opp:"URU",gf:1,ga:1},{opp:"ESP",gf:0,ga:4}],
  // Group I (MD1 + MD2 played — validated vs ESPN 22 Jun 2026)
  FRA:[{opp:"SEN",gf:3,ga:1},{opp:"IRQ",gf:3,ga:0}],
  NOR:[{opp:"IRQ",gf:4,ga:1},{opp:"SEN",gf:3,ga:2}],
  SEN:[{opp:"FRA",gf:1,ga:3},{opp:"NOR",gf:2,ga:3}],
  IRQ:[{opp:"NOR",gf:1,ga:4},{opp:"FRA",gf:0,ga:3}],
  // Group J (MD1 played; MD2: ARG-AUT played 22 Jun; JOR-DZA upcoming)
  ARG:[{opp:"DZA",gf:3,ga:0},{opp:"AUT",gf:2,ga:0}],
  AUT:[{opp:"JOR",gf:3,ga:1},{opp:"ARG",gf:0,ga:2}],
  DZA:[{opp:"ARG",gf:0,ga:3}],
  JOR:[{opp:"AUT",gf:1,ga:3}],
  // Group K (1 match each)
  COL:[{opp:"UZB",gf:3,ga:1}],
  COD:[{opp:"POR",gf:1,ga:1}],
  POR:[{opp:"COD",gf:1,ga:1}],
  UZB:[{opp:"COL",gf:1,ga:3}],
  // Group L (1 match each)
  ENG:[{opp:"CRO",gf:4,ga:2}],
  GHA:[{opp:"PAN",gf:1,ga:0}],
  CRO:[{opp:"ENG",gf:2,ga:4}],
  PAN:[{opp:"GHA",gf:0,ga:1}],
};

const STORAGE_KEY = "wc2026:matchLog:v1";
const cloneBase = () => JSON.parse(JSON.stringify(BASE_MATCH_LOG));
function loadMatchLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : cloneBase();
  } catch {
    return cloneBase();
  }
}

const CFG_DEFAULTS = {knockout:true,shrink:1.5,halflife:1.5,wForm:1.0,wMom:1.0,wDSI:1.0,wConv:1.0,wSOS:1.0,wExp:1.0};
const PARAM_MAP = {a:"teamA",b:"teamB",ko:"knockout",wf:"wForm",wm:"wMom",wd:"wDSI",wc:"wConv",ws:"wSOS",we:"wExp",k:"shrink",hl:"halflife"};

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
  return {teamA, teamB, cfg};
}

const NAMES = {
  ARG:"Argentina",FRA:"France",BEL:"Belgium",ENG:"England",BRA:"Brazil",ESP:"Spain",
  POR:"Portugal",NED:"Netherlands",NOR:"Norway",COL:"Colombia",URU:"Uruguay",USA:"USA",
  MAR:"Morocco",CRO:"Croatia",MEX:"Mexico",GER:"Germany",JPN:"Japan",SWE:"Sweden",
  SEN:"Senegal",IRN:"IR Iran",SUI:"Switzerland",AUS:"Australia",KOR:"Korea Rep.",
  AUT:"Austria",TUN:"Tunisia",QAT:"Qatar",ECU:"Ecuador",SCO:"Scotland",EGY:"Egypt",
  DZA:"Algeria",CIV:"Ivory Coast",COD:"Congo DR",GHA:"Ghana",KSA:"Saudi Arabia",
  PAR:"Paraguay",CPV:"Cape Verde",BIH:"Bosnia",UZB:"Uzbekistan",JOR:"Jordan",
  NZL:"New Zealand",CZE:"Czechia",RSA:"S. Africa",HTI:"Haiti",TUR:"Turkiye",
  CUW:"Curacao",IRQ:"Iraq",CAN:"Canada",PAN:"Panama",
};

const FLAGS = {
  ARG:"🇦🇷",FRA:"🇫🇷",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",BRA:"🇧🇷",ESP:"🇪🇸",POR:"🇵🇹",NED:"🇳🇱",BEL:"🇧🇪",
  GER:"🇩🇪",URU:"🇺🇾",COL:"🇨🇴",USA:"🇺🇸",MEX:"🇲🇽",JPN:"🇯🇵",MAR:"🇲🇦",NOR:"🇳🇴",
  SUI:"🇨🇭",AUS:"🇦🇺",KOR:"🇰🇷",CRO:"🇭🇷",SWE:"🇸🇪",CIV:"🇨🇮",CAN:"🇨🇦",EGY:"🇪🇬",
  SEN:"🇸🇳",ECU:"🇪🇨",SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",PAR:"🇵🇾",QAT:"🇶🇦",IRN:"🇮🇷",NZL:"🇳🇿",CZE:"🇨🇿",
  RSA:"🇿🇦",TUN:"🇹🇳",GHA:"🇬🇭",BIH:"🇧🇦",UZB:"🇺🇿",CPV:"🇨🇻",COD:"🇨🇩",JOR:"🇯🇴",
  DZA:"🇩🇿",KSA:"🇸🇦",HTI:"🇭🇹",TUR:"🇹🇷",CUW:"🇨🇼",IRQ:"🇮🇶",AUT:"🇦🇹",PAN:"🇵🇦",
};

// ─── GROUP STRUCTURE ────────────────────────────────────────────────────────
const GROUPS={
  A:["MEX","KOR","CZE","RSA"],B:["CAN","SUI","BIH","QAT"],C:["BRA","MAR","SCO","HTI"],
  D:["USA","AUS","PAR","TUR"],E:["GER","CIV","ECU","CUW"],F:["NED","JPN","SWE","TUN"],
  G:["EGY","IRN","BEL","NZL"],H:["ESP","URU","CPV","KSA"],I:["FRA","NOR","SEN","IRQ"],
  J:["ARG","AUT","DZA","JOR"],K:["COL","COD","POR","UZB"],L:["ENG","GHA","CRO","PAN"],
};
const TEAM_GROUP={};
Object.entries(GROUPS).forEach(([g,ts])=>ts.forEach(t=>{TEAM_GROUP[t]=g;}));

const KO_KEY="wc2026:ko:v1";
function loadKoMatches(){try{const r=localStorage.getItem(KO_KEY);return r?JSON.parse(r):[]}catch{return [];}}

// ─── OFFICIAL MATCH SCHEDULE (ESPN, 22–27 Jun 2026) ────────────────────────
const MATCH_SCHEDULE=[
  // MD2 — Jun 22
  {date:"2026-06-22",g:"J",a:"ARG",b:"AUT",venue:"AT&T Stadium, Arlington TX"},
  {date:"2026-06-22",g:"I",a:"FRA",b:"IRQ",venue:"Lincoln Financial Field, Philadelphia PA"},
  {date:"2026-06-22",g:"I",a:"SEN",b:"NOR",venue:"MetLife Stadium, East Rutherford NJ"},
  {date:"2026-06-22",g:"J",a:"JOR",b:"DZA",venue:"Levi's Stadium, Santa Clara CA"},
  // MD2 — Jun 23
  {date:"2026-06-23",g:"K",a:"POR",b:"UZB",venue:"NRG Stadium, Houston TX"},
  {date:"2026-06-23",g:"L",a:"ENG",b:"GHA",venue:"Gillette Stadium, Foxborough MA"},
  {date:"2026-06-23",g:"L",a:"PAN",b:"CRO",venue:"BMO Field, Toronto Canada"},
  {date:"2026-06-23",g:"K",a:"COL",b:"COD",venue:"Estadio Akron, Guadalajara Mexico"},
  // MD3 — Jun 24
  {date:"2026-06-24",g:"B",a:"BIH",b:"QAT",venue:"Lumen Field, Seattle WA"},
  {date:"2026-06-24",g:"B",a:"SUI",b:"CAN",venue:"BC Place, Vancouver Canada"},
  {date:"2026-06-24",g:"C",a:"MAR",b:"HTI",venue:"Mercedes-Benz Stadium, Atlanta GA"},
  {date:"2026-06-24",g:"C",a:"SCO",b:"BRA",venue:"Hard Rock Stadium, Miami Gardens FL"},
  {date:"2026-06-24",g:"A",a:"CZE",b:"MEX",venue:"Estadio Banorte, Mexico City Mexico"},
  {date:"2026-06-24",g:"A",a:"KOR",b:"RSA",venue:"Estadio BBVA, Guadalupe Mexico"},
  // MD3 — Jun 25
  {date:"2026-06-25",g:"E",a:"CUW",b:"CIV",venue:"Lincoln Financial Field, Philadelphia PA"},
  {date:"2026-06-25",g:"E",a:"ECU",b:"GER",venue:"MetLife Stadium, East Rutherford NJ"},
  {date:"2026-06-25",g:"F",a:"JPN",b:"SWE",venue:"AT&T Stadium, Arlington TX"},
  {date:"2026-06-25",g:"F",a:"TUN",b:"NED",venue:"GEHA Field at Arrowhead, Kansas City MO"},
  {date:"2026-06-25",g:"D",a:"PAR",b:"AUS",venue:"Levi's Stadium, Santa Clara CA"},
  {date:"2026-06-25",g:"D",a:"TUR",b:"USA",venue:"SoFi Stadium, Inglewood CA"},
  // MD3 — Jun 26
  {date:"2026-06-26",g:"I",a:"NOR",b:"FRA",venue:"Gillette Stadium, Foxborough MA"},
  {date:"2026-06-26",g:"I",a:"SEN",b:"IRQ",venue:"BMO Field, Toronto Canada"},
  {date:"2026-06-26",g:"H",a:"CPV",b:"KSA",venue:"NRG Stadium, Houston TX"},
  {date:"2026-06-26",g:"H",a:"URU",b:"ESP",venue:"Estadio Akron, Guadalajara Mexico"},
  {date:"2026-06-26",g:"G",a:"EGY",b:"IRN",venue:"Lumen Field, Seattle WA"},
  {date:"2026-06-26",g:"G",a:"NZL",b:"BEL",venue:"BC Place, Vancouver Canada"},
  // MD3 — Jun 27
  {date:"2026-06-27",g:"L",a:"CRO",b:"GHA",venue:"Lincoln Financial Field, Philadelphia PA"},
  {date:"2026-06-27",g:"L",a:"PAN",b:"ENG",venue:"MetLife Stadium, East Rutherford NJ"},
  {date:"2026-06-27",g:"K",a:"COL",b:"POR",venue:"Hard Rock Stadium, Miami Gardens FL"},
  {date:"2026-06-27",g:"K",a:"COD",b:"UZB",venue:"Mercedes-Benz Stadium, Atlanta GA"},
  {date:"2026-06-27",g:"J",a:"DZA",b:"AUT",venue:"GEHA Field at Arrowhead, Kansas City MO"},
  {date:"2026-06-27",g:"J",a:"JOR",b:"ARG",venue:"AT&T Stadium, Arlington TX"},
];
const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDate=d=>{const[,m,day]=d.split("-");return `${MONTHS[+m-1]} ${+day}`;};
function getSchedInfo(a,b){return MATCH_SCHEDULE.find(m=>(m.a===a&&m.b===b)||(m.a===b&&m.b===a))||null;}

// ─── CALCULABLE INDICES ─────────────────────────────────────────────────────
function recencyWeights(n, halflife) {
  const w = [];
  for (let i = 0; i < n; i++) {
    const age = (n - 1) - i;
    w.push(Math.pow(0.5, age / halflife));
  }
  return w;
}

function computeIndices(abbr, halflife, matchLog) {
  const log = matchLog[abbr] || [];
  const gp = log.length;
  if (gp === 0) {
    return { gp:0, formIdx:0, momentum:0, dsi:0, convincing:0, sos:1500, attRate:1, defRate:1.2, earnedElo: PRE_ELO[abbr]||1500 };
  }
  const w = recencyWeights(gp, halflife);
  const wSum = w.reduce((a,b)=>a+b,0);
  let wGF=0, wGA=0, wResult=0, wMargin=0, wOppElo=0, cleanSheets=0;
  let earnedElo = PRE_ELO[abbr] || 1500;
  log.forEach((m, i) => {
    const oppElo = PRE_ELO[m.opp] || 1500;
    wGF += w[i]*m.gf; wGA += w[i]*m.ga; wOppElo += w[i]*oppElo;
    const result = m.gf>m.ga ? 1 : m.gf===m.ga ? 0.5 : 0;
    wResult += w[i]*result;
    wMargin += w[i]*Math.max(-3,Math.min(3,m.gf-m.ga));
    if (m.ga===0) cleanSheets += w[i];
    const expected = 1/(1+Math.pow(10,(oppElo-earnedElo)/400));
    earnedElo += 40*w[i]*(result-expected);
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

function predict(aAbbr,bAbbr,cfg,matchLog){
  const A=computeIndices(aAbbr,cfg.halflife,matchLog), B=computeIndices(bAbbr,cfg.halflife,matchLog);
  const wA=A.gp/(A.gp+cfg.shrink), wB=B.gp/(B.gp+cfg.shrink);
  const eloA=wA*A.earnedElo+(1-wA)*(PRE_ELO[aAbbr]||1500);
  const eloB=wB*B.earnedElo+(1-wB)*(PRE_ELO[bAbbr]||1500);
  const sosAdjA=1+cfg.wSOS*((A.sos-1650)/1000), sosAdjB=1+cfg.wSOS*((B.sos-1650)/1000);
  const scoreA=eloA+cfg.wForm*A.formIdx*200+cfg.wMom*A.momentum*25+cfg.wDSI*A.dsi*120+cfg.wConv*A.convincing*40*sosAdjA;
  const scoreB=eloB+cfg.wForm*B.formIdx*200+cfg.wMom*B.momentum*25+cfg.wDSI*B.dsi*120+cfg.wConv*B.convincing*40*sosAdjB;
  const eloWinA=1/(1+Math.pow(10,(scoreB-scoreA)/400));
  const baseA=(A.attRate||1)*(1+cfg.wForm*0.1*A.formIdx), baseB=(B.attRate||1)*(1+cfg.wForm*0.1*B.formIdx);
  const lambdaA=Math.max(0.3,baseA*(1.2/Math.max(0.5,B.defRate))*sosAdjA);
  const lambdaB=Math.max(0.3,baseB*(1.2/Math.max(0.5,A.defRate))*sosAdjB);
  let pWin=0,pDraw=0,pLoss=0;
  for(let i=0;i<=8;i++)for(let j=0;j<=8;j++){const p=poisson(lambdaA,i)*poisson(lambdaB,j); if(i>j)pWin+=p; else if(i===j)pDraw+=p; else pLoss+=p;}
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

export default function ProgressivePredictor(){
  const [matchLog,setMatchLog]=useState(loadMatchLog);
  const allAbbrs=Object.keys(NAMES).filter(a=>matchLog[a]);
  const [tab,setTab]=useState("predict");
  const [{teamA:initA,teamB:initB,cfg:initCfg}]=useState(parseUrlParams);
  const [teamA,setTeamA]=useState(initA);
  const [teamB,setTeamB]=useState(initB);
  const [cfg,setCfg]=useState(initCfg);
  const [copied,setCopied]=useState(false);
  const [koMatches,setKoMatches]=useState(loadKoMatches);
  const [openGroup,setOpenGroup]=useState(null);
  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(matchLog)); }catch{} },[matchLog]);
  useEffect(()=>{ try{ localStorage.setItem(KO_KEY, JSON.stringify(koMatches)); }catch{} },[koMatches]);

  useEffect(()=>{
    const p=new URLSearchParams();
    p.set("a",teamA); p.set("b",teamB);
    p.set("ko",cfg.knockout?"1":"0");
    p.set("wf",cfg.wForm); p.set("wm",cfg.wMom); p.set("wd",cfg.wDSI);
    p.set("wc",cfg.wConv); p.set("ws",cfg.wSOS); p.set("we",cfg.wExp);
    p.set("k",cfg.shrink); p.set("hl",cfg.halflife);
    window.history.replaceState(null,"","?"+p.toString());
  },[teamA,teamB,cfg]);

  const copyLink=useCallback(()=>{
    navigator.clipboard.writeText(window.location.href).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),2000);
    });
  },[]);
  const [injRound,setInjRound]=useState("group");
  const [injTeam,setInjTeam]=useState("ARG");
  const [injOpp,setInjOpp]=useState("AUT");
  const [injGF,setInjGF]=useState(1);
  const [injGA,setInjGA]=useState(0);
  const set=(k,v)=>setCfg(c=>({...c,[k]:v}));

  const result=useMemo(()=> teamA===teamB?null:predict(teamA,teamB,cfg,matchLog),[teamA,teamB,cfg,matchLog]);

  const injectResult=useCallback(()=>{
    if(injTeam===injOpp)return;
    setMatchLog(prev=>{
      const next=JSON.parse(JSON.stringify(prev));
      if(!next[injTeam])next[injTeam]=[];
      if(!next[injOpp])next[injOpp]=[];
      next[injTeam].push({opp:injOpp,gf:Number(injGF),ga:Number(injGA)});
      next[injOpp].push({opp:injTeam,gf:Number(injGA),ga:Number(injGF)});
      return next;
    });
    if(injRound!=="group"){
      setKoMatches(prev=>[...prev,{round:injRound,a:injTeam,b:injOpp,gf:Number(injGF),ga:Number(injGA)}]);
    }
  },[injTeam,injOpp,injGF,injGA,injRound]);

  const resetMatchLog=useCallback(()=>{
    try{ localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(KO_KEY); }catch{}
    setMatchLog(cloneBase());
    setKoMatches([]);
  },[]);

  const ranking=useMemo(()=>allAbbrs.map(a=>{
    const idx=computeIndices(a,cfg.halflife,matchLog);
    const w=idx.gp/(idx.gp+cfg.shrink);
    const elo=w*idx.earnedElo+(1-w)*(PRE_ELO[a]||1500);
    const score=elo+cfg.wForm*idx.formIdx*200+cfg.wMom*idx.momentum*25+cfg.wDSI*idx.dsi*120+cfg.wConv*idx.convincing*40;
    return {abbr:a,...idx,elo:Math.round(elo),score:Math.round(score)};
  }).sort((x,y)=>y.score-x.score),[cfg,matchLog,allAbbrs]);

  const maxScore=ranking[0]?.score||1;
  const pct=v=>(v*100).toFixed(1)+"%";
  const C={bg:"#faf7f5",panel:"#e8f4f1",panelAlt:"#F3FFF9",line:"rgba(161,228,219,0.5)",lineStrong:"#A1E4DB",text:"#0a3d3a",dim:"#7a9b96",green:"#25A497",blue:"#1C5753",coral:"#ff6b47",amber:"#b45309",purple:"#7c3aed",pink:"#be185d",red:"#b91c1c"};

  const Slider=({label,k,min,max,step,color,help})=>(
    <div style={{marginBottom:"14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontSize:"12px",color:C.text,fontWeight:600}}>{label}</span>
        <span style={{fontSize:"12px",fontWeight:800,color}}>{cfg[k].toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={cfg[k]} onChange={e=>set(k,parseFloat(e.target.value))} style={{width:"100%",accentColor:color,cursor:"pointer"}}/>
      {help&&<div style={{fontSize:"10px",color:C.dim,marginTop:"2px"}}>{help}</div>}
    </div>
  );
  const injGroup=TEAM_GROUP[injTeam];
  const groupMates=(GROUPS[injGroup]||[]).filter(t=>t!==injTeam);
  const remainingMatches=injRound==="group"?groupMates.filter(b=>!(matchLog[injTeam]||[]).some(m=>m.opp===b)):[];

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
            <h1 style={{margin:0,fontSize:"38px",fontWeight:400,color:"#faf7f5",fontFamily:"'DM Serif Display',Georgia,serif",letterSpacing:"-0.025em",whiteSpace:"nowrap"}}>FIFA Worldcup 2026 — <em style={{color:C.coral,fontStyle:"italic"}}>Predictor</em></h1>
          </div>
          <div style={{textAlign:"right"}}>
            <button onClick={()=>set("knockout",!cfg.knockout)} style={{background:cfg.knockout?C.coral:"rgba(255,255,255,0.08)",color:cfg.knockout?"#fff":"#A1E4DB",border:`1px solid ${cfg.knockout?C.coral:"rgba(161,228,219,0.3)"}`,borderRadius:"9999px",padding:"8px 18px",fontWeight:700,fontSize:"12px",cursor:"pointer",letterSpacing:"0.5px"}}>{cfg.knockout?"🏆 KNOCKOUT STAGE":"📊 GROUP STAGE"}</button>
          </div>
        </div>
        <div style={{display:"flex",gap:"4px",marginTop:"14px",flexWrap:"wrap"}}>
          {["predict","schedule","indices","tune","inject"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:tab===t?"#25A497":"transparent",color:tab===t?"#0a3d3a":"#A1E4DB",border:"none",borderRadius:"8px 8px 0 0",fontWeight:tab===t?600:400,fontSize:"13px",cursor:"pointer",textTransform:"capitalize",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
              {t==="predict"?"⚔️ Predict":t==="schedule"?"📅 Schedule":t==="indices"?"📈 Indices":t==="tune"?"🎛️ Tune":"💉 Inject"}
            </button>
          ))}
        </div>
      </div>

      <div className="wc-body" style={{padding:"22px 26px"}}>
        {tab==="predict"&&result&&(
          <div>
            <div className="wc-predict-teams" style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:"10px",alignItems:"center",marginBottom:"18px"}}>
              <div>
                <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>TEAM A</div>
                <select value={teamA} onChange={e=>setTeamA(e.target.value)} style={{width:"100%",background:C.panel,border:`1px solid ${C.line}`,color:C.text,padding:"9px 11px",borderRadius:"8px",fontSize:"14px"}}>
                  {allAbbrs.map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                </select>
              </div>
              <div style={{color:C.blue,fontWeight:800,fontSize:"16px",paddingTop:"18px",textAlign:"center"}}>VS</div>
              <div>
                <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>TEAM B</div>
                <select value={teamB} onChange={e=>setTeamB(e.target.value)} style={{width:"100%",background:C.panel,border:`1px solid ${C.line}`,color:C.text,padding:"9px 11px",borderRadius:"8px",fontSize:"14px"}}>
                  {allAbbrs.map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                </select>
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"12px"}}>
              <button onClick={copyLink} style={{background:copied?"rgba(37,164,151,0.15)":"transparent",color:copied?C.green:C.dim,border:`1px solid ${copied?C.green:C.line}`,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
                {copied?"✓ Link copied":"🔗 Share prediction"}
              </button>
            </div>

            <div className="wc-score-panel" style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:C.panel,borderRadius:"14px",padding:"20px",marginBottom:"14px",border:`1px solid ${C.line}`}}>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:"38px"}}>{FLAGS[teamA]}</div>
                <div style={{fontSize:"15px",fontWeight:700}}>{NAMES[teamA]}</div>
                <div style={{fontSize:"12px",color:C.dim}}>Elo {result.eloA} · Pwr {result.scoreA}</div>
                <div style={{fontSize:"30px",fontWeight:900,color:C.green,marginTop:"6px"}}>{pct(cfg.knockout?result.koWinA:result.winA)}</div>
                <div style={{fontSize:"10px",color:C.dim}}>{cfg.knockout?"advances":"win"}</div>
              </div>
              <div style={{textAlign:"center",padding:"0 12px"}}>
                {!cfg.knockout&&<><div style={{fontSize:"22px",fontWeight:900,color:C.amber}}>{pct(result.draw)}</div><div style={{fontSize:"10px",color:C.dim,marginBottom:"10px"}}>draw</div></>}
                <div style={{fontSize:"10px",color:C.dim}}>xG</div>
                <div style={{fontSize:"14px",fontWeight:700,color:C.blue}}>{result.lambdaA}–{result.lambdaB}</div>
                <div style={{marginTop:"8px",fontSize:"10px",color:C.dim}}>data maturity</div>
                <div style={{fontSize:"13px",fontWeight:700,color:C.purple}}>{(result.dataMaturity*100).toFixed(0)}%</div>
              </div>
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:"38px"}}>{FLAGS[teamB]}</div>
                <div style={{fontSize:"15px",fontWeight:700}}>{NAMES[teamB]}</div>
                <div style={{fontSize:"12px",color:C.dim}}>Elo {result.eloB} · Pwr {result.scoreB}</div>
                <div style={{fontSize:"30px",fontWeight:900,color:C.blue,marginTop:"6px"}}>{pct(cfg.knockout?result.koWinB:result.winB)}</div>
                <div style={{fontSize:"10px",color:C.dim}}>{cfg.knockout?"advances":"win"}</div>
              </div>
            </div>

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
          </div>
        )}

        {tab==="indices"&&(
          <div>
            <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"4px"}}>LIVE POWER RANKING · recomputes from injected results</div>
            <div style={{fontSize:"10px",color:C.dim,marginBottom:"12px"}}>Elo marker: ✓ = exact (eloratings.net) · ~ = FIFA-rank estimate. All match results validated vs CBS Sports.</div>
            {ranking.map((t,i)=>(
              <div key={t.abbr} style={{background:C.panel,borderRadius:"10px",padding:"11px 14px",marginBottom:"7px",border:`1px solid ${i===0?C.green+"60":C.line}`}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"7px"}}>
                  <span style={{fontSize:"11px",fontWeight:800,color:C.blue,width:"22px"}}>#{i+1}</span>
                  <span style={{fontSize:"17px"}}>{FLAGS[t.abbr]}</span>
                  <div style={{flex:1}}><span style={{fontSize:"13px",fontWeight:700}}>{NAMES[t.abbr]}</span><span style={{fontSize:"11px",color:C.dim}}> · {t.gp} GP · Elo {t.elo}{ELO_EXACT.has(t.abbr)?" ✓":" ~"}</span></div>
                  <span style={{fontSize:"15px",fontWeight:800,color:C.green}}>{(t.score/maxScore*100).toFixed(0)}</span>
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
              <Slider label="Form Index weight" k="wForm" min={0} max={2.5} step={0.1} color={C.green} help="Recency-weighted points rate (W/D/L)"/>
              <Slider label="Momentum weight" k="wMom" min={0} max={2.5} step={0.1} color={C.amber} help="Trend: latest GD minus first GD"/>
              <Slider label="Defensive Solidity weight" k="wDSI" min={0} max={2.5} step={0.1} color={C.purple} help="Recency-weighted clean-sheet rate"/>
              <Slider label="Convincingness weight" k="wConv" min={0} max={2.5} step={0.1} color={C.pink} help="Margin-of-victory quality (capped ±3)"/>
              <Slider label="Strength-of-Schedule weight" k="wSOS" min={0} max={2.5} step={0.1} color={C.blue} help="Adjusts form by avg opponent Elo"/>
              <Slider label="Big-game experience weight" k="wExp" min={0} max={2.5} step={0.1} color={C.text} help="Knockout-only: pedigree drift in tight games"/>
            </div>
            <div style={{background:C.panel,borderRadius:"12px",padding:"18px",border:`1px solid ${C.line}`}}>
              <div style={{fontSize:"11px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"12px"}}>PROGRESSIVE LEARNING CONTROLS</div>
              <Slider label="Prior shrinkage (k)" k="shrink" min={0.5} max={5} step={0.5} color={C.green} help="Lower = trust tournament data faster vs pre-tournament Elo"/>
              <Slider label="Recency half-life (matches)" k="halflife" min={0.5} max={4} step={0.5} color={C.blue} help="Lower = newest result dominates more heavily"/>
            </div>
            <div style={{marginTop:"12px",padding:"12px",background:"rgba(10,61,58,0.05)",border:"1px solid rgba(161,228,219,0.5)",borderRadius:"10px",fontSize:"12px",color:C.blue,lineHeight:1.6}}>
              <strong style={{color:C.text}}>Why this is progressive:</strong> as GP rises, prior shrinkage GP/(GP+k) shifts weight from pre-tournament Elo toward earned-Elo and form indices. By the knockout stage (GP≥3), the model is ~70%+ data-driven. The Poisson/Elo ensemble weight also scales with data maturity.
            </div>
          </div>
        )}

        {tab==="schedule"&&(()=>{
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
                          <div>
                            <div style={{fontSize:"9px",color:C.dim,marginBottom:"2px"}}>{m.venue.split(",")[0]}</div>
                            <button onClick={()=>{setTab("inject");setInjTeam(m.a);setInjOpp(m.b);setInjRound("group");}} style={{background:C.coral,color:"#fff",border:"none",borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer"}}>+ add result</button>
                          </div>
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
                    <button onClick={()=>setOpenGroup(null)} style={{background:"transparent",border:"none",color:C.dim,fontSize:"18px",lineHeight:1,cursor:"pointer",padding:"0 4px"}}>×</button>
                  </div>
                  {rows.map(({a,b,info,res})=>(
                    <div key={a+b} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.line}`}}>
                      <span style={{fontSize:"12px",fontWeight:600,flex:1,textAlign:"right"}}>{FLAGS[a]} {NAMES[a]}</span>
                      <div style={{textAlign:"center",minWidth:"110px"}}>
                        <div style={{fontSize:"9px",fontWeight:700,color:C.blue,letterSpacing:"0.5px",marginBottom:"2px"}}>{info?fmtDate(info.date):"matchday 1"}</div>
                        {res?(
                          <span style={{fontSize:"13px",fontWeight:800,color:res.gf>res.ga?C.green:res.gf<res.ga?C.red:C.amber}}>{res.gf}–{res.ga}</span>
                        ):(
                          <div>
                            {info&&<div style={{fontSize:"9px",color:C.dim,marginBottom:"2px"}}>{info.venue.split(",")[0]}</div>}
                            <button onClick={()=>{setTab("inject");setInjTeam(a);setInjOpp(b);setInjRound("group");}} style={{background:C.coral,color:"#fff",border:"none",borderRadius:"5px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer"}}>+ add result</button>
                          </div>
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
                  <div key={g} onClick={()=>setOpenGroup(isOpen?null:g)} style={{background:C.panel,borderRadius:"10px",padding:"12px",border:`1px solid ${isOpen?C.lineStrong:C.line}`,cursor:"pointer",boxShadow:isOpen?`0 0 0 1px ${C.lineStrong}`:"none"}}>
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
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:"52px",gap:"2px"}}>
                              {info&&<span style={{fontSize:"9px",color:C.dim,whiteSpace:"nowrap"}}>{fmtDate(info.date)}</span>}
                              <button onClick={(e)=>{e.stopPropagation();setTab("inject");setInjTeam(a);setInjOpp(b);setInjRound("group");}} style={{background:"transparent",color:C.coral,border:`1px solid ${C.coral}`,borderRadius:"4px",padding:"1px 5px",fontSize:"9px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>+add</button>
                            </div>
                          )}
                          <span style={{fontSize:"11px",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b} {FLAGS[b]}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:"20px"}}>
              <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"12px"}}>KNOCKOUT STAGE</div>
              {["R32","R16","QF","SF","Final"].map(round=>{
                const rMatches=koMatches.filter(m=>m.round===round);
                const label=round==="R32"?"Round of 32":round==="R16"?"Round of 16":round==="QF"?"Quarter-Finals":round==="SF"?"Semi-Finals":"Final";
                return (
                  <div key={round} style={{background:C.panel,borderRadius:"10px",padding:"12px",marginBottom:"8px",border:`1px solid ${C.line}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:rMatches.length?"8px":"0"}}>
                      <span style={{fontSize:"11px",fontWeight:800,color:C.blue}}>{label}</span>
                      <button onClick={()=>{setTab("inject");setInjRound(round);}} style={{background:"transparent",color:C.coral,border:`1px solid ${C.coral}`,borderRadius:"6px",padding:"2px 8px",fontSize:"10px",fontWeight:700,cursor:"pointer"}}>+ add result</button>
                    </div>
                    {rMatches.length===0?(
                      <div style={{fontSize:"10px",color:C.dim,fontStyle:"italic"}}>No results yet.</div>
                    ):rMatches.map((m,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:i<rMatches.length-1?`1px solid ${C.line}`:"none"}}>
                        <span style={{fontSize:"11px"}}>{FLAGS[m.a]} {NAMES[m.a]}</span>
                        <span style={{fontSize:"12px",fontWeight:800,color:m.gf>m.ga?C.green:m.gf<m.ga?C.red:C.amber}}>{m.gf}–{m.ga}</span>
                        <span style={{fontSize:"11px"}}>{NAMES[m.b]} {FLAGS[m.b]}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {tab==="inject"&&(
          <div>
            <div style={{fontSize:"12px",color:C.blue,fontWeight:700,letterSpacing:"2px",marginBottom:"14px"}}>INJECT RESULT · live model recalibration</div>
            <div style={{display:"flex",gap:"6px",marginBottom:"14px",flexWrap:"wrap"}}>
              {[["group","Group Stage"],["R32","R of 32"],["R16","R of 16"],["QF","Quarter-Finals"],["SF","Semi-Finals"],["Final","Final"]].map(([r,label])=>(
                <button key={r} onClick={()=>{
                  if(r==="group"&&!groupMates.includes(injOpp)&&groupMates.length)setInjOpp(groupMates[0]);
                  setInjRound(r);
                }} style={{padding:"5px 11px",background:injRound===r?C.coral:"transparent",color:injRound===r?"#fff":C.dim,border:`1px solid ${injRound===r?C.coral:C.line}`,borderRadius:"9999px",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>{label}</button>
              ))}
            </div>
            {injRound==="group"&&remainingMatches.length===0&&(
              <div style={{fontSize:"11px",color:C.green,marginBottom:"10px",padding:"8px 12px",background:"rgba(37,164,151,0.08)",borderRadius:"8px",border:`1px solid rgba(37,164,151,0.2)`}}>✓ All Group {injGroup} matches logged for {NAMES[injTeam]}</div>
            )}
            {injRound==="group"&&remainingMatches.length>0&&(
              <div style={{background:C.panelAlt,borderRadius:"10px",padding:"10px",marginBottom:"12px",border:`1px solid ${C.line}`}}>
                <div style={{fontSize:"10px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"6px"}}>GROUP {injGroup} — REMAINING FOR {NAMES[injTeam]}</div>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {remainingMatches.map(b=>(
                    <button key={b} onClick={()=>setInjOpp(b)} style={{background:injOpp===b?C.green:"transparent",color:injOpp===b?"#fff":C.text,border:`1px solid ${injOpp===b?C.green:C.line}`,borderRadius:"8px",padding:"5px 10px",fontSize:"12px",cursor:"pointer",fontWeight:600}}>
                      {FLAGS[b]} {NAMES[b]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{background:C.panel,borderRadius:"12px",padding:"18px",border:`1px solid ${C.line}`}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
                <div>
                  <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>TEAM</div>
                  <select value={injTeam} onChange={e=>{
                    const t=e.target.value;
                    setInjTeam(t);
                    if(injRound==="group"){const mates=(GROUPS[TEAM_GROUP[t]]||[]).filter(x=>x!==t);if(mates.length&&!mates.includes(injOpp))setInjOpp(mates[0]);}
                  }} style={{width:"100%",background:C.bg,border:`1px solid ${C.line}`,color:C.text,padding:"9px",borderRadius:"8px",fontSize:"13px"}}>
                    {Object.keys(NAMES).map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>OPPONENT{injRound==="group"&&<span style={{fontSize:"9px",marginLeft:"4px",color:C.dim}}>(group only)</span>}</div>
                  <select value={injOpp} onChange={e=>setInjOpp(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.line}`,color:C.text,padding:"9px",borderRadius:"8px",fontSize:"13px"}}>
                    {(injRound==="group"?groupMates:Object.keys(NAMES)).map(a=><option key={a} value={a}>{FLAGS[a]} {NAMES[a]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
                <div>
                  <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>{injTeam} GOALS</div>
                  <input type="number" min={0} max={12} value={injGF} onChange={e=>setInjGF(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.line}`,color:C.text,padding:"9px",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <div style={{fontSize:"11px",color:C.dim,marginBottom:"5px"}}>{injOpp} GOALS</div>
                  <input type="number" min={0} max={12} value={injGA} onChange={e=>setInjGA(e.target.value)} style={{width:"100%",background:C.bg,border:`1px solid ${C.line}`,color:C.text,padding:"9px",borderRadius:"8px",fontSize:"14px",boxSizing:"border-box"}}/>
                </div>
              </div>
              <button onClick={injectResult} style={{width:"100%",background:C.coral,color:"#fff",border:"none",borderRadius:"8px",padding:"12px",fontWeight:800,fontSize:"14px",cursor:"pointer"}}>💉 Inject {injGF}–{injGA} · {injRound==="group"?"Group Stage":injRound==="R32"?"Round of 32":injRound==="R16"?"Round of 16":injRound==="QF"?"Quarter-Finals":injRound==="SF"?"Semi-Finals":"Final"}</button>
              <button onClick={resetMatchLog} style={{width:"100%",marginTop:"10px",background:"transparent",color:C.dim,border:`1px solid ${C.line}`,borderRadius:"8px",padding:"10px",fontWeight:700,fontSize:"13px",cursor:"pointer"}}>🔄 Reset all results to default</button>
            </div>
            <div style={{marginTop:"14px",background:C.panel,borderRadius:"12px",padding:"16px",border:`1px solid ${C.line}`}}>
              <div style={{fontSize:"11px",color:C.dim,fontWeight:700,letterSpacing:"1px",marginBottom:"10px"}}>{FLAGS[injTeam]} {NAMES[injTeam]} · MATCH LOG ({(matchLog[injTeam]||[]).length})</div>
              {(matchLog[injTeam]||[]).map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<((matchLog[injTeam]||[]).length-1)?`1px solid ${C.line}`:"none",fontSize:"13px"}}>
                  <span style={{color:C.dim}}>vs {FLAGS[m.opp]} {m.opp}</span>
                  <span style={{fontWeight:700,color:m.gf>m.ga?C.green:m.gf<m.ga?C.red:C.amber}}>{m.gf}–{m.ga}</span>
                </div>
              ))}
              {(matchLog[injTeam]||[]).length===0&&<div style={{fontSize:"12px",color:C.dim}}>No matches logged yet.</div>}
            </div>
          </div>
        )}
      </div>

      <div style={{textAlign:"center",padding:"14px",borderTop:"1px solid rgba(161,228,219,0.4)",fontSize:"11px",color:C.dim,lineHeight:1.6}}>
        Progressive Elo-Poisson · Bayesian prior decay · {cfg.knockout?"knockout":"group"} mode<br/>
        Results validated vs CBS Sports group tables · Elo: 18 teams exact from eloratings.net (21 Jun 2026), rest FIFA-rank-ordered estimates
      </div>
    </div>
  );
}
