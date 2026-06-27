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
  // Group I (MD1 + MD2 — validated vs ESPN 22 Jun 2026)
  FRA:[{opp:"SEN",gf:3,ga:1},{opp:"IRQ",gf:3,ga:0},{opp:"NOR",gf:4,ga:1}],
  NOR:[{opp:"IRQ",gf:4,ga:1},{opp:"SEN",gf:3,ga:2},{opp:"FRA",gf:1,ga:4}],
  SEN:[{opp:"FRA",gf:1,ga:3},{opp:"NOR",gf:2,ga:3},{opp:"IRQ",gf:5,ga:0}],
  IRQ:[{opp:"NOR",gf:1,ga:4},{opp:"FRA",gf:0,ga:3},{opp:"SEN",gf:0,ga:5}],
  // Group J (MD1 + MD2 — validated vs ESPN 22 Jun 2026)
  ARG:[{opp:"DZA",gf:3,ga:0},{opp:"AUT",gf:2,ga:0}],
  AUT:[{opp:"JOR",gf:3,ga:1},{opp:"ARG",gf:0,ga:2}],
  DZA:[{opp:"ARG",gf:0,ga:3},{opp:"JOR",gf:2,ga:1}],
  JOR:[{opp:"AUT",gf:1,ga:3},{opp:"DZA",gf:1,ga:2}],
  // Group K (MD1 + MD2)
  COL:[{opp:"UZB",gf:3,ga:1},{opp:"COD",gf:1,ga:0}],
  COD:[{opp:"POR",gf:1,ga:1},{opp:"COL",gf:0,ga:1}],
  POR:[{opp:"COD",gf:1,ga:1},{opp:"UZB",gf:5,ga:0}],
  UZB:[{opp:"COL",gf:1,ga:3},{opp:"POR",gf:0,ga:5}],
  // Group L (MD1 + MD2)
  ENG:[{opp:"CRO",gf:4,ga:2},{opp:"GHA",gf:0,ga:0}],
  GHA:[{opp:"PAN",gf:1,ga:0},{opp:"ENG",gf:0,ga:0}],
  CRO:[{opp:"ENG",gf:2,ga:4},{opp:"PAN",gf:1,ga:0}],
  PAN:[{opp:"GHA",gf:0,ga:1},{opp:"CRO",gf:0,ga:1}],
};

// ─── GROUP STANDINGS (source: CBS Sports, updated 2026-06-24) ───────────────
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
    {t:"EGY",gp:2,w:1,d:1,l:0,gf:4,ga:2,pts:4},
    {t:"IRN",gp:2,w:0,d:2,l:0,gf:2,ga:2,pts:2},
    {t:"BEL",gp:2,w:0,d:2,l:0,gf:1,ga:1,pts:2},
    {t:"NZL",gp:2,w:0,d:1,l:1,gf:3,ga:5,pts:1},
  ],
  H:[
    {t:"ESP",gp:2,w:1,d:1,l:0,gf:4,ga:0,pts:4},
    {t:"URU",gp:2,w:0,d:2,l:0,gf:3,ga:3,pts:2},
    {t:"CPV",gp:2,w:0,d:2,l:0,gf:2,ga:2,pts:2},
    {t:"KSA",gp:2,w:0,d:1,l:1,gf:1,ga:5,pts:1},
  ],
  I:[
    {t:"FRA",gp:2,w:2,d:0,l:0,gf:6,ga:1,pts:6},
    {t:"NOR",gp:2,w:2,d:0,l:0,gf:7,ga:3,pts:6},
    {t:"SEN",gp:2,w:0,d:0,l:2,gf:3,ga:6,pts:0},
    {t:"IRQ",gp:2,w:0,d:0,l:2,gf:1,ga:7,pts:0},
  ],
  J:[
    {t:"ARG",gp:2,w:2,d:0,l:0,gf:5,ga:0,pts:6},
    {t:"AUT",gp:2,w:1,d:0,l:1,gf:3,ga:3,pts:3},
    {t:"DZA",gp:2,w:1,d:0,l:1,gf:2,ga:4,pts:3},
    {t:"JOR",gp:2,w:0,d:0,l:2,gf:2,ga:5,pts:0},
  ],
  K:[
    {t:"POR",gp:2,w:1,d:1,l:0,gf:6,ga:1,pts:4},
    {t:"COL",gp:2,w:2,d:0,l:0,gf:4,ga:1,pts:6},
    {t:"COD",gp:2,w:0,d:1,l:1,gf:1,ga:2,pts:1},
    {t:"UZB",gp:2,w:0,d:0,l:2,gf:1,ga:8,pts:0},
  ],
  L:[
    {t:"ENG",gp:2,w:1,d:1,l:0,gf:4,ga:2,pts:4},
    {t:"GHA",gp:2,w:1,d:1,l:0,gf:1,ga:0,pts:4},
    {t:"PAN",gp:2,w:0,d:0,l:2,gf:0,ga:2,pts:0},
    {t:"CRO",gp:2,w:1,d:0,l:1,gf:3,ga:4,pts:3},
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

// ─── OFFICIAL MATCH SCHEDULE (ESPN, 22–27 Jun 2026) ─────────────────────────
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
