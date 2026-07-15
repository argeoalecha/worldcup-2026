// ─── PRE-TOURNAMENT ELO ─────────────────────────────────────────────────────
// All 48 teams — official pre-tournament baseline (world_cup_elo_ratings.xlsx)
export const PRE_ELO = {
  ESP:2157, ARG:2115, FRA:2063, ENG:2024, BRA:1991, POR:1989,
  COL:1982, NED:1948, ECU:1938, GER:1932, NOR:1914, CRO:1912,
  TUR:1911, JPN:1906, BEL:1894, URU:1892, SUI:1891, MEX:1875,
  SEN:1860, PAR:1834, AUT:1830, MAR:1827, CAN:1788, SCO:1782,
  AUS:1777, DZA:1772, IRN:1772, KOR:1758, CZE:1740, PAN:1730,
  USA:1726, UZB:1714, SWE:1712, EGY:1696, CIV:1695, JOR:1680,
  COD:1652, TUN:1628, IRQ:1607, BIH:1595, CPV:1578, KSA:1576,
  NZL:1562, HTI:1548, RSA:1517, GHA:1510, CUW:1434, QAT:1421,
};

// All ratings are from the official pre-tournament baseline source
export const ELO_EXACT = new Set(Object.keys(PRE_ELO));

// ─── OFFICIAL MATCH RESULTS ─────────────────────────────────────────────────
// Edit this file to update results after each matchday.
// Add {opp, gf, ga} entries in chronological order (MD1, MD2, MD3).
// Then: npm run build && npx netlify-cli deploy --prod
export const BASE_MATCH_LOG = {
  // Group A
  MEX:[{opp:"RSA",gf:2,ga:0},{opp:"KOR",gf:1,ga:0},{opp:"CZE",gf:3,ga:0}],
  KOR:[{opp:"CZE",gf:2,ga:1},{opp:"MEX",gf:0,ga:1},{opp:"RSA",gf:0,ga:1}],
  CZE:[{opp:"KOR",gf:1,ga:2},{opp:"RSA",gf:1,ga:1},{opp:"MEX",gf:0,ga:3}],
  RSA:[{opp:"MEX",gf:0,ga:2},{opp:"CZE",gf:1,ga:1},{opp:"KOR",gf:1,ga:0}],
  // Group B
  CAN:[{opp:"BIH",gf:1,ga:1},{opp:"QAT",gf:6,ga:0},{opp:"SUI",gf:1,ga:2}],
  SUI:[{opp:"QAT",gf:1,ga:1},{opp:"BIH",gf:4,ga:1},{opp:"CAN",gf:2,ga:1}],
  BIH:[{opp:"CAN",gf:1,ga:1},{opp:"SUI",gf:1,ga:4},{opp:"QAT",gf:3,ga:1}],
  QAT:[{opp:"SUI",gf:1,ga:1},{opp:"CAN",gf:0,ga:6},{opp:"BIH",gf:1,ga:3}],
  // Group C
  BRA:[{opp:"MAR",gf:1,ga:1},{opp:"HTI",gf:3,ga:0},{opp:"SCO",gf:3,ga:0}],
  MAR:[{opp:"BRA",gf:1,ga:1},{opp:"SCO",gf:1,ga:0},{opp:"HTI",gf:4,ga:2}],
  SCO:[{opp:"HTI",gf:1,ga:0},{opp:"MAR",gf:0,ga:1},{opp:"BRA",gf:0,ga:3}],
  HTI:[{opp:"SCO",gf:0,ga:1},{opp:"BRA",gf:0,ga:3},{opp:"MAR",gf:2,ga:4}],
  // Group D
  USA:[{opp:"PAR",gf:4,ga:1},{opp:"AUS",gf:2,ga:0},{opp:"TUR",gf:2,ga:3}],
  AUS:[{opp:"TUR",gf:2,ga:0},{opp:"USA",gf:0,ga:2},{opp:"PAR",gf:0,ga:0}],
  PAR:[{opp:"USA",gf:1,ga:4},{opp:"TUR",gf:1,ga:0},{opp:"AUS",gf:0,ga:0}],
  TUR:[{opp:"AUS",gf:0,ga:2},{opp:"PAR",gf:0,ga:1},{opp:"USA",gf:3,ga:2}],
  // Group E
  GER:[{opp:"CUW",gf:7,ga:1},{opp:"CIV",gf:2,ga:1},{opp:"ECU",gf:1,ga:2}],
  CIV:[{opp:"ECU",gf:1,ga:0},{opp:"GER",gf:1,ga:2},{opp:"CUW",gf:2,ga:0}],
  ECU:[{opp:"CIV",gf:0,ga:1},{opp:"CUW",gf:0,ga:0},{opp:"GER",gf:2,ga:1}],
  CUW:[{opp:"GER",gf:1,ga:7},{opp:"ECU",gf:0,ga:0},{opp:"CIV",gf:0,ga:2}],
  // Group F
  NED:[{opp:"JPN",gf:2,ga:2},{opp:"SWE",gf:5,ga:1},{opp:"TUN",gf:3,ga:1}],
  JPN:[{opp:"NED",gf:2,ga:2},{opp:"TUN",gf:4,ga:0},{opp:"SWE",gf:1,ga:1}],
  SWE:[{opp:"TUN",gf:5,ga:1},{opp:"NED",gf:1,ga:5},{opp:"JPN",gf:1,ga:1}],
  TUN:[{opp:"SWE",gf:1,ga:5},{opp:"JPN",gf:0,ga:4},{opp:"NED",gf:1,ga:3}],
  // Group G
  EGY:[{opp:"BEL",gf:1,ga:1},{opp:"NZL",gf:3,ga:1},{opp:"IRN",gf:1,ga:1}],
  IRN:[{opp:"NZL",gf:2,ga:2},{opp:"BEL",gf:0,ga:0},{opp:"EGY",gf:1,ga:1}],
  BEL:[{opp:"EGY",gf:1,ga:1},{opp:"IRN",gf:0,ga:0},{opp:"NZL",gf:5,ga:1}],
  NZL:[{opp:"IRN",gf:2,ga:2},{opp:"EGY",gf:1,ga:3},{opp:"BEL",gf:1,ga:5}],
  // Group H
  ESP:[{opp:"CPV",gf:0,ga:0},{opp:"KSA",gf:4,ga:0},{opp:"URU",gf:1,ga:0}],
  URU:[{opp:"KSA",gf:1,ga:1},{opp:"CPV",gf:2,ga:2},{opp:"ESP",gf:0,ga:1}],
  CPV:[{opp:"ESP",gf:0,ga:0},{opp:"URU",gf:2,ga:2},{opp:"KSA",gf:0,ga:0}],
  KSA:[{opp:"URU",gf:1,ga:1},{opp:"ESP",gf:0,ga:4},{opp:"CPV",gf:0,ga:0}],
  // Group I (MD1 + MD2 — validated vs FIFA / CBS Sports 22 Jun 2026)
  FRA:[{opp:"SEN",gf:3,ga:1},{opp:"IRQ",gf:3,ga:0},{opp:"NOR",gf:4,ga:1}],
  NOR:[{opp:"IRQ",gf:4,ga:1},{opp:"SEN",gf:3,ga:2},{opp:"FRA",gf:1,ga:4}],
  SEN:[{opp:"FRA",gf:1,ga:3},{opp:"NOR",gf:2,ga:3},{opp:"IRQ",gf:5,ga:0}],
  IRQ:[{opp:"NOR",gf:1,ga:4},{opp:"FRA",gf:0,ga:3},{opp:"SEN",gf:0,ga:5}],
  // Group J
  ARG:[{opp:"DZA",gf:3,ga:0},{opp:"AUT",gf:2,ga:0},{opp:"JOR",gf:3,ga:1}],
  AUT:[{opp:"JOR",gf:3,ga:1},{opp:"ARG",gf:0,ga:2},{opp:"DZA",gf:3,ga:3}],
  DZA:[{opp:"ARG",gf:0,ga:3},{opp:"JOR",gf:2,ga:1},{opp:"AUT",gf:3,ga:3}],
  JOR:[{opp:"AUT",gf:1,ga:3},{opp:"DZA",gf:1,ga:2},{opp:"ARG",gf:1,ga:3}],
  // Group K
  COL:[{opp:"UZB",gf:3,ga:1},{opp:"COD",gf:1,ga:0},{opp:"POR",gf:0,ga:0}],
  COD:[{opp:"POR",gf:1,ga:1},{opp:"COL",gf:0,ga:1},{opp:"UZB",gf:3,ga:1}],
  POR:[{opp:"COD",gf:1,ga:1},{opp:"UZB",gf:5,ga:0},{opp:"COL",gf:0,ga:0}],
  UZB:[{opp:"COL",gf:1,ga:3},{opp:"POR",gf:0,ga:5},{opp:"COD",gf:1,ga:3}],
  // Group L
  ENG:[{opp:"CRO",gf:4,ga:2},{opp:"GHA",gf:0,ga:0},{opp:"PAN",gf:2,ga:0}],
  GHA:[{opp:"PAN",gf:1,ga:0},{opp:"ENG",gf:0,ga:0},{opp:"CRO",gf:1,ga:2}],
  CRO:[{opp:"ENG",gf:2,ga:4},{opp:"PAN",gf:1,ga:0},{opp:"GHA",gf:2,ga:1}],
  PAN:[{opp:"GHA",gf:0,ga:1},{opp:"CRO",gf:0,ga:1},{opp:"ENG",gf:0,ga:2}],
};

// ─── GROUP STANDINGS (source: FIFA / CBS Sports, updated 2026-06-28 — all 12 groups final) ─
// Edit in-place after each matchday, then rebuild + deploy.
// Fields per row: t=team abbr, gp=played, w/d/l, gf/ga, pts
export const GROUP_STANDINGS = {
  A:[
    {t:"MEX",gp:3,w:3,d:0,l:0,gf:6,ga:0,pts:9},
    {t:"RSA",gp:3,w:1,d:1,l:1,gf:2,ga:3,pts:4},
    {t:"KOR",gp:3,w:1,d:0,l:2,gf:2,ga:3,pts:3},
    {t:"CZE",gp:3,w:0,d:1,l:2,gf:2,ga:6,pts:1},
  ],
  B:[
    {t:"SUI",gp:3,w:2,d:1,l:0,gf:7,ga:3,pts:7},
    {t:"CAN",gp:3,w:1,d:1,l:1,gf:8,ga:3,pts:4},
    {t:"BIH",gp:3,w:1,d:1,l:1,gf:5,ga:6,pts:4},
    {t:"QAT",gp:3,w:0,d:1,l:2,gf:2,ga:10,pts:1},
  ],
  C:[
    {t:"BRA",gp:3,w:2,d:1,l:0,gf:7,ga:1,pts:7},
    {t:"MAR",gp:3,w:2,d:1,l:0,gf:6,ga:3,pts:7},
    {t:"SCO",gp:3,w:1,d:0,l:2,gf:1,ga:4,pts:3},
    {t:"HTI",gp:3,w:0,d:0,l:3,gf:2,ga:8,pts:0},
  ],
  D:[
    {t:"USA",gp:3,w:2,d:0,l:1,gf:8,ga:4,pts:6},
    {t:"AUS",gp:3,w:1,d:1,l:1,gf:2,ga:2,pts:4},
    {t:"PAR",gp:3,w:1,d:1,l:1,gf:2,ga:4,pts:4},
    {t:"TUR",gp:3,w:1,d:0,l:2,gf:3,ga:5,pts:3},
  ],
  E:[
    {t:"GER",gp:3,w:2,d:0,l:1,gf:10,ga:4,pts:6},
    {t:"CIV",gp:3,w:2,d:0,l:1,gf:4,ga:2,pts:6},
    {t:"ECU",gp:3,w:1,d:1,l:1,gf:2,ga:2,pts:4},
    {t:"CUW",gp:3,w:0,d:1,l:2,gf:1,ga:9,pts:1},
  ],
  F:[
    {t:"NED",gp:3,w:2,d:1,l:0,gf:10,ga:4,pts:7},
    {t:"JPN",gp:3,w:1,d:2,l:0,gf:7,ga:3,pts:5},
    {t:"SWE",gp:3,w:1,d:1,l:1,gf:7,ga:7,pts:4},
    {t:"TUN",gp:3,w:0,d:0,l:3,gf:2,ga:12,pts:0},
  ],
  G:[
    {t:"BEL",gp:3,w:1,d:2,l:0,gf:6,ga:2,pts:5},
    {t:"EGY",gp:3,w:1,d:2,l:0,gf:5,ga:3,pts:5},
    {t:"IRN",gp:3,w:0,d:3,l:0,gf:3,ga:3,pts:3},
    {t:"NZL",gp:3,w:0,d:1,l:2,gf:4,ga:10,pts:1},
  ],
  H:[
    {t:"ESP",gp:3,w:2,d:1,l:0,gf:5,ga:0,pts:7},
    {t:"CPV",gp:3,w:0,d:3,l:0,gf:2,ga:2,pts:3},
    {t:"URU",gp:3,w:0,d:2,l:1,gf:3,ga:4,pts:2},
    {t:"KSA",gp:3,w:0,d:2,l:1,gf:1,ga:5,pts:2},
  ],
  I:[
    {t:"FRA",gp:3,w:3,d:0,l:0,gf:10,ga:2,pts:9},
    {t:"NOR",gp:3,w:2,d:0,l:1,gf:8,ga:7,pts:6},
    {t:"SEN",gp:3,w:1,d:0,l:2,gf:8,ga:6,pts:3},
    {t:"IRQ",gp:3,w:0,d:0,l:3,gf:1,ga:12,pts:0},
  ],
  J:[
    {t:"ARG",gp:3,w:3,d:0,l:0,gf:8,ga:1,pts:9},
    {t:"AUT",gp:3,w:1,d:1,l:1,gf:6,ga:6,pts:4},
    {t:"DZA",gp:3,w:1,d:1,l:1,gf:5,ga:7,pts:4},
    {t:"JOR",gp:3,w:0,d:0,l:3,gf:3,ga:9,pts:0},
  ],
  K:[
    {t:"COL",gp:3,w:2,d:1,l:0,gf:4,ga:1,pts:7},
    {t:"POR",gp:3,w:1,d:2,l:0,gf:6,ga:1,pts:5},
    {t:"COD",gp:3,w:1,d:1,l:1,gf:4,ga:3,pts:4},
    {t:"UZB",gp:3,w:0,d:0,l:3,gf:2,ga:11,pts:0},
  ],
  L:[
    {t:"ENG",gp:3,w:2,d:1,l:0,gf:6,ga:2,pts:7},
    {t:"CRO",gp:3,w:2,d:0,l:1,gf:5,ga:5,pts:6},
    {t:"GHA",gp:3,w:1,d:1,l:1,gf:2,ga:2,pts:4},
    {t:"PAN",gp:3,w:0,d:0,l:3,gf:0,ga:4,pts:0},
  ],
};

// ─── TEAM NAMES & FLAGS ─────────────────────────────────────────────────────
export const NAMES = {
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

export const FLAGS = {
  ARG:"🇦🇷",FRA:"🇫🇷",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",BRA:"🇧🇷",ESP:"🇪🇸",POR:"🇵🇹",NED:"🇳🇱",BEL:"🇧🇪",
  GER:"🇩🇪",URU:"🇺🇾",COL:"🇨🇴",USA:"🇺🇸",MEX:"🇲🇽",JPN:"🇯🇵",MAR:"🇲🇦",NOR:"🇳🇴",
  SUI:"🇨🇭",AUS:"🇦🇺",KOR:"🇰🇷",CRO:"🇭🇷",SWE:"🇸🇪",CIV:"🇨🇮",CAN:"🇨🇦",EGY:"🇪🇬",
  SEN:"🇸🇳",ECU:"🇪🇨",SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",PAR:"🇵🇾",QAT:"🇶🇦",IRN:"🇮🇷",NZL:"🇳🇿",CZE:"🇨🇿",
  RSA:"🇿🇦",TUN:"🇹🇳",GHA:"🇬🇭",BIH:"🇧🇦",UZB:"🇺🇿",CPV:"🇨🇻",COD:"🇨🇩",JOR:"🇯🇴",
  DZA:"🇩🇿",KSA:"🇸🇦",HTI:"🇭🇹",TUR:"🇹🇷",CUW:"🇨🇼",IRQ:"🇮🇶",AUT:"🇦🇹",PAN:"🇵🇦",
};

// ─── GROUP STRUCTURE ────────────────────────────────────────────────────────
export const GROUPS = {
  A:["MEX","KOR","CZE","RSA"],B:["CAN","SUI","BIH","QAT"],C:["BRA","MAR","SCO","HTI"],
  D:["USA","AUS","PAR","TUR"],E:["GER","CIV","ECU","CUW"],F:["NED","JPN","SWE","TUN"],
  G:["EGY","IRN","BEL","NZL"],H:["ESP","URU","CPV","KSA"],I:["FRA","NOR","SEN","IRQ"],
  J:["ARG","AUT","DZA","JOR"],K:["COL","COD","POR","UZB"],L:["ENG","GHA","CRO","PAN"],
};

// ─── ROUND OF 32 SCHEDULE ───────────────────────────────────────────────────
// mn = official FIFA bracket match number (73-88), per the can/mex/usa 2026
// scores-fixtures bracket. Mapping (verified against bracket dates):
// RSA/CAN=73, GER/PAR=74, NED/MAR=75, BRA/JPN=76, FRA/SWE=77, CIV/NOR=78,
// MEX/ECU=79, ENG/COD=80, USA/BIH=81, BEL/SEN=82, POR/CRO=83, ESP/AUT=84,
// SUI/DZA=85, ARG/CPV=86, COL/GHA=87, AUS/EGY=88
export const R32_SCHEDULE = [
  // Jun 29
  {mn:73,date:"2026-06-29",a:"RSA",b:"CAN",venue:"Inglewood, CA"},
  // Jun 30
  {mn:76,date:"2026-06-30",a:"BRA",b:"JPN",venue:"Houston, TX"},
  {mn:74,date:"2026-06-30",a:"GER",b:"PAR",venue:"Foxborough, MA"},
  {mn:75,date:"2026-06-30",a:"NED",b:"MAR",venue:"Guadalupe, Mexico"},
  // Jul 1
  {mn:78,date:"2026-07-01",a:"CIV",b:"NOR",venue:"Arlington, TX"},
  {mn:77,date:"2026-07-01",a:"FRA",b:"SWE",venue:"East Rutherford, NJ"},
  {mn:79,date:"2026-07-01",a:"MEX",b:"ECU",venue:"Mexico City, Mexico"},
  // Jul 2
  {mn:80,date:"2026-07-02",a:"ENG",b:"COD",venue:"Atlanta, GA"},
  {mn:82,date:"2026-07-02",a:"BEL",b:"SEN",venue:"Seattle, WA"},
  {mn:81,date:"2026-07-02",a:"USA",b:"BIH",venue:"Santa Clara, CA"},
  // Jul 3
  {mn:84,date:"2026-07-03",a:"ESP",b:"AUT",venue:"Inglewood, CA"},
  {mn:83,date:"2026-07-03",a:"POR",b:"CRO",venue:"Toronto, Canada"},
  {mn:85,date:"2026-07-03",a:"SUI",b:"DZA",venue:"Vancouver, Canada"},
  // Jul 4
  {mn:88,date:"2026-07-04",a:"AUS",b:"EGY",venue:"Arlington, TX"},
  {mn:86,date:"2026-07-04",a:"ARG",b:"CPV",venue:"Miami Gardens, FL"},
  {mn:87,date:"2026-07-04",a:"COL",b:"GHA",venue:"Kansas City, MO"},
];

// ─── ROUND OF 16 SCHEDULE ───────────────────────────────────────────────────
// wA/wB = match numbers of R32 matches whose winners play here.
export const R16_SCHEDULE = [
  // Jul 5
  {mn:89,date:"2026-07-05",wA:74,wB:77,venue:"Philadelphia, PA"},
  {mn:90,date:"2026-07-05",wA:73,wB:75,venue:"Houston, TX"},
  // Jul 6
  {mn:91,date:"2026-07-06",wA:76,wB:78,venue:"East Rutherford, NJ"},
  {mn:92,date:"2026-07-06",wA:79,wB:80,venue:"Mexico City, Mexico"},
  // Jul 7
  {mn:93,date:"2026-07-07",wA:83,wB:84,venue:"Arlington, TX"},
  {mn:94,date:"2026-07-07",wA:81,wB:82,venue:"Seattle, WA"},
  // Jul 8
  {mn:95,date:"2026-07-08",wA:86,wB:88,venue:"Atlanta, GA"},
  {mn:96,date:"2026-07-08",wA:85,wB:87,venue:"Vancouver, Canada"},
];

// ─── QUARTER-FINAL SCHEDULE ─────────────────────────────────────────────────
export const QF_SCHEDULE = [
  {mn:97, date:"2026-07-10",wA:89,wB:90,venue:"Foxborough, MA"},
  {mn:98, date:"2026-07-11",wA:93,wB:94,venue:"Inglewood, CA"},
  {mn:99, date:"2026-07-12",wA:91,wB:92,venue:"Miami Gardens, FL"},
  {mn:100,date:"2026-07-12",wA:95,wB:96,venue:"Kansas City, MO"},
];

// ─── SEMI-FINAL SCHEDULE ────────────────────────────────────────────────────
export const SF_SCHEDULE = [
  {mn:101,date:"2026-07-15",wA:97, wB:98, venue:"Arlington, TX"},
  {mn:102,date:"2026-07-16",wA:99, wB:100,venue:"Atlanta, GA"},
];

// ─── FINAL & THIRD PLACE ────────────────────────────────────────────────────
// M103: lA/lB = losers of those SF matches (3rd place play-off)
// M104: wA/wB = winners of those SF matches (Final)
export const FINAL_SCHEDULE = [
  {mn:103,date:"2026-07-19",lA:101,lB:102,venue:"Miami Gardens, FL"},
  {mn:104,date:"2026-07-20",wA:101,wB:102,venue:"East Rutherford, NJ"},
];

// ─── OFFICIAL KNOCKOUT RESULTS ──────────────────────────────────────────────
// Baked-in knockout results (R32 onward) — the KO analog of BASE_MATCH_LOG.
// Add a {round, team, opp, gf, ga} entry as each KO match is confirmed, then
// build + deploy. The bracket auto-resolves winners into later rounds and Elo
// updates from these. round ∈ "R32" | "R16" | "QF" | "SF" | "Final".
// For penalty shootout wins: set pen:true and gf===ga (regulation score).
// Convention: team = the advancing side; resolveWinner/Loser honour pen:true.
export const BASE_KO_RESULTS = [
  {round:"R32",team:"CAN",opp:"RSA",gf:1,ga:0},              // M73 — Canada 1-0 South Africa → CAN advances
  {round:"R32",team:"PAR",opp:"GER",gf:1,ga:1,pen:true,penTeam:4,penOpp:3},    // M74 — 1-1 AET, Paraguay 4-3 pens → PAR advances
  {round:"R32",team:"MAR",opp:"NED",gf:1,ga:1,pen:true,penTeam:3,penOpp:2},    // M75 — 1-1 AET, Morocco 3-2 pens → MAR advances
  {round:"R32",team:"BRA",opp:"JPN",gf:2,ga:1},              // M76 — Brazil 2-1 Japan → BRA advances
  {round:"R32",team:"FRA",opp:"SWE",gf:3,ga:0},              // M77 — France 3-0 Sweden → FRA advances
  {round:"R32",team:"NOR",opp:"CIV",gf:2,ga:1},              // M78 — Norway 2-1 Ivory Coast → NOR advances
  {round:"R32",team:"MEX",opp:"ECU",gf:2,ga:0},              // M79 — Mexico 2-0 Ecuador → MEX advances
  {round:"R32",team:"ENG",opp:"COD",gf:2,ga:1},              // M80 — England 2-1 Congo DR → ENG advances
  {round:"R32",team:"BEL",opp:"SEN",gf:3,ga:2},              // M82 — Belgium 3-2 Senegal → BEL advances
  {round:"R32",team:"USA",opp:"BIH",gf:2,ga:0},              // M81 — USA 2-0 Bosnia and Herzegovina → USA advances
  {round:"R32",team:"ESP",opp:"AUT",gf:3,ga:0},              // Spain 3-0 Austria → ESP advances
  {round:"R32",team:"POR",opp:"CRO",gf:2,ga:1},              // Portugal 2-1 Croatia → POR advances
  {round:"R32",team:"SUI",opp:"DZA",gf:2,ga:0},              // Switzerland 2-0 Algeria → SUI advances
  {round:"R32",team:"ARG",opp:"CPV",gf:3,ga:2},              // Argentina 3-2 Cape Verde → ARG advances
  {round:"R32",team:"COL",opp:"GHA",gf:1,ga:0},              // Colombia 1-0 Ghana → COL advances
  {round:"R32",team:"EGY",opp:"AUS",gf:1,ga:1,pen:true,penTeam:4,penOpp:2},  // M88 - 1-1 AET, Egypt 4-2 pens → EGY advances
  {round:"R16",team:"FRA",opp:"PAR",gf:1,ga:0},              // M89 — France 1-0 Paraguay → FRA advances
  {round:"R16",team:"MAR",opp:"CAN",gf:3,ga:0},              // M90 — Morocco 3-0 Canada → MAR advances
  {round:"R16",team:"NOR",opp:"BRA",gf:2,ga:1},              // M91 — Norway 2-1 Brazil → NOR advances
  {round:"R16",team:"ENG",opp:"MEX",gf:3,ga:2},              // M92 — England 3-2 Mexico → ENG advances
  {round:"R16",team:"ESP",opp:"POR",gf:1,ga:0},              // M93 — Spain 1-0 Portugal → ESP advances
  {round:"R16",team:"BEL",opp:"USA",gf:4,ga:1},              // M94 — Belgium 4-1 USA → BEL advances
  {round:"R16",team:"ARG",opp:"EGY",gf:3,ga:2},              // M95 — Argentina 3-2 Egypt → ARG advances
  {round:"R16",team:"SUI",opp:"COL",gf:0,ga:0,pen:true,penTeam:4,penOpp:3},  // M96 — 0-0 AET, Switzerland 4-3 pens → SUI advances
  {round:"QF",team:"FRA",opp:"MAR",gf:2,ga:0},               // M97 — France 2-0 Morocco → FRA advances
  {round:"QF",team:"ESP",opp:"BEL",gf:2,ga:1},               // M98 — Spain 2-1 Belgium → ESP advances
  {round:"QF",team:"ENG",opp:"NOR",gf:2,ga:1},               // M99 — Norway 1-2 England → ENG advances
  {round:"QF",team:"ARG",opp:"SUI",gf:3,ga:1},               // M100 — Argentina 3-1 Switzerland → ARG advances
  {round:"SF",team:"ESP",opp:"FRA",gf:2,ga:0},                // M101 — Spain 2-0 France → ESP advances to Final
  {round:"SF",team:"ARG",opp:"ENG",gf:2,ga:1},                // M102 — Argentina 2-1 England → ARG advances to Final
];

// ─── OFFICIAL MATCH SCHEDULE (FIFA, 22–27 Jun 2026) ─────────────────────────
export const MATCH_SCHEDULE = [
  // MD2 — Jun 22
  {date:"2026-06-22",g:"J",a:"ARG",b:"AUT",venue:"Arlington TX"},
  {date:"2026-06-22",g:"I",a:"FRA",b:"IRQ",venue:"Philadelphia, PA"},
  {date:"2026-06-22",g:"I",a:"SEN",b:"NOR",venue:"East Rutherford, NJ"},
  {date:"2026-06-22",g:"J",a:"JOR",b:"DZA",venue:"Santa Clara, CA"},
  // MD2 — Jun 23
  {date:"2026-06-23",g:"K",a:"POR",b:"UZB",venue:"Houston, TX"},
  {date:"2026-06-23",g:"L",a:"ENG",b:"GHA",venue:"Foxborough, MA"},
  {date:"2026-06-23",g:"L",a:"PAN",b:"CRO",venue:"Toronto, Canada"},
  {date:"2026-06-23",g:"K",a:"COL",b:"COD",venue:"Guadalajara, Mexico"},
  // MD3 — Jun 24
  {date:"2026-06-24",g:"B",a:"BIH",b:"QAT",venue:"Seattle, WA"},
  {date:"2026-06-24",g:"B",a:"SUI",b:"CAN",venue:"Vancouver, Canada"},
  {date:"2026-06-24",g:"C",a:"MAR",b:"HTI",venue:"Atlanta, GA"},
  {date:"2026-06-24",g:"C",a:"SCO",b:"BRA",venue:"Miami Gardens, FL"},
  {date:"2026-06-24",g:"A",a:"CZE",b:"MEX",venue:"Mexico City, Mexico"},
  {date:"2026-06-24",g:"A",a:"KOR",b:"RSA",venue:"Guadalupe, Mexico"},
  // MD3 — Jun 25
  {date:"2026-06-25",g:"E",a:"CUW",b:"CIV",venue:"Philadelphia, PA"},
  {date:"2026-06-25",g:"E",a:"ECU",b:"GER",venue:"East Rutherford, NJ"},
  {date:"2026-06-25",g:"F",a:"JPN",b:"SWE",venue:"Arlington, TX"},
  {date:"2026-06-25",g:"F",a:"TUN",b:"NED",venue:"Kansas City, MO"},
  {date:"2026-06-25",g:"D",a:"PAR",b:"AUS",venue:"Santa Clara, CA"},
  {date:"2026-06-25",g:"D",a:"TUR",b:"USA",venue:"Inglewood, CA"},
  // MD3 — Jun 26
  {date:"2026-06-26",g:"I",a:"NOR",b:"FRA",venue:"Foxborough, MA"},
  {date:"2026-06-26",g:"I",a:"SEN",b:"IRQ",venue:"Toronto, Canada"},
  {date:"2026-06-26",g:"H",a:"CPV",b:"KSA",venue:"Houston, TX"},
  {date:"2026-06-26",g:"H",a:"URU",b:"ESP",venue:"Guadalajara Mexico"},
  {date:"2026-06-26",g:"G",a:"EGY",b:"IRN",venue:"Seattle, WA"},
  {date:"2026-06-26",g:"G",a:"NZL",b:"BEL",venue:"Vancouver, Canada"},
  // MD3 — Jun 27
  {date:"2026-06-27",g:"L",a:"CRO",b:"GHA",venue:"Philadelphia PA"},
  {date:"2026-06-27",g:"L",a:"PAN",b:"ENG",venue:"East Rutherford, NJ"},
  {date:"2026-06-27",g:"K",a:"COL",b:"POR",venue:"Miami Gardens, FL"},
  {date:"2026-06-27",g:"K",a:"COD",b:"UZB",venue:"Atlanta, GA"},
  {date:"2026-06-27",g:"J",a:"DZA",b:"AUT",venue:"Kansas City, MO"},
  {date:"2026-06-27",g:"J",a:"JOR",b:"ARG",venue:"Arlington, TX"},
];
