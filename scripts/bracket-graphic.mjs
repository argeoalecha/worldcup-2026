// Renders the predicted knockout bracket as an SVG (+ HTML wrapper), mirroring
// the official FIFA bracket layout: R32 on the outer edges converging to the
// Final in the centre, with a third-place play-off below it.
// Source of truth = scripts/predict-bracket.mjs (official bracket tree + model).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { results, winnerOf, loserOf, NAMES, FLAGS } from "./predict-bracket.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");

// Display abbreviations (data key → bracket label, matching FIFA conventions).
const ABBR = { DZA: "ALG" };
const ab = t => ABBR[t] || t;

// ─── BRACKET TREE (official structure) ──────────────────────────────────────
const L = { mn:101, kids:[
  { mn:97, kids:[ {mn:89,kids:[{mn:74},{mn:77}]}, {mn:90,kids:[{mn:73},{mn:75}]} ]},
  { mn:98, kids:[ {mn:93,kids:[{mn:83},{mn:84}]}, {mn:94,kids:[{mn:81},{mn:82}]} ]},
]};
const R = { mn:102, kids:[
  { mn:99,  kids:[ {mn:91,kids:[{mn:76},{mn:78}]}, {mn:92,kids:[{mn:79},{mn:80}]} ]},
  { mn:100, kids:[ {mn:95,kids:[{mn:86},{mn:88}]}, {mn:96,kids:[{mn:85},{mn:87}]} ]},
]};

// ─── GEOMETRY ───────────────────────────────────────────────────────────────
const W = 2400, BW = 190, RH = 34, BH = 2*RH;
const topY = 175, P = 182;               // R32 vertical pitch
const colsL = [60, 320, 580, 840];       // R32,R16,QF,SF (left edges)
const colsR = [W-60-BW, W-320-BW, W-580-BW, W-840-BW];
const finalX = W/2 - BW/2;

const colFor = mn => mn<=88?0 : mn<=96?1 : mn<=100?2 : 3;

// Assign each node a center-y. Leaves get evenly spaced slots in DFS order.
function assign(node, side, leafCounter){
  const x = (side==="L"?colsL:colsR)[colFor(node.mn)];
  if(!node.kids){
    const i = leafCounter.n++;
    node.cy = topY + i*P + BH/2;
    node.x = x;
    return node.cy;
  }
  const cys = node.kids.map(k=>assign(k,side,leafCounter));
  node.cy = (Math.min(...cys)+Math.max(...cys))/2;
  node.x = x;
  return node.cy;
}
assign(L,"L",{n:0});
assign(R,"R",{n:0});

const cy101 = L.cy, cy102 = R.cy;
const finalCy = (cy101+cy102)/2;
const thirdCy = finalCy + 250;

// ─── SVG PARTS ──────────────────────────────────────────────────────────────
const C = { bg:"#faf7f5", box:"#ffffff", border:"#cfe9e3", line:"#9bd9cf",
  text:"#0a3d3a", dim:"#9aa8a4", win:"#25A497", winTx:"#ffffff",
  champ:"#ff6b47", head:"#6b7d79" };
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
let svg = "";

function teamRow(x, y, abbr, isWin, isLoserDim, pctTxt){
  const fill = isWin ? C.win : C.box;
  const tcol = isWin ? C.winTx : (isLoserDim ? C.dim : C.text);
  const weight = isWin ? 800 : 600;
  let s = `<rect x="${x}" y="${y}" width="${BW}" height="${RH}" fill="${fill}"/>`;
  s += `<text x="${x+12}" y="${y+RH/2+5}" font-size="18">${FLAGS[abbr]||""}</text>`;
  s += `<text x="${x+44}" y="${y+RH/2+5}" font-size="15" font-weight="${weight}" fill="${tcol}" font-family="'Plus Jakarta Sans',sans-serif">${esc(ab(abbr))}</text>`;
  if(pctTxt) s += `<text x="${x+BW-12}" y="${y+RH/2+5}" font-size="12" font-weight="800" text-anchor="end" fill="${isWin?C.winTx:C.dim}">${pctTxt}</text>`;
  return s;
}

function box(node, opts={}){
  const r = results[node.mn];
  if(!r) return;
  const x = node.x, y = node.cy - BH/2;
  const aWin = r.winner===r.a, bWin = r.winner===r.b;
  const pa = Math.round(r.koA*100)+"%", pb = Math.round(r.koB*100)+"%";
  // header: date + match label
  const d = r.date.slice(5).replace("-","/");
  const champBorder = opts.champ ? `stroke="${C.champ}" stroke-width="2.5"` : `stroke="${C.border}" stroke-width="1"`;
  svg += `<text x="${x}" y="${y-8}" font-size="11" fill="${C.head}" font-family="'Plus Jakarta Sans',sans-serif">M${node.mn} · ${d}</text>`;
  svg += `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="7" fill="${C.box}" ${champBorder}/>`;
  svg += `<clipPath id="c${node.mn}"><rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="7"/></clipPath>`;
  svg += `<g clip-path="url(#c${node.mn})">`;
  svg += teamRow(x, y,      r.a, aWin, bWin, aWin?pa:null);
  svg += teamRow(x, y+RH,   r.b, bWin, aWin, bWin?pb:null);
  svg += `</g>`;
  svg += `<line x1="${x}" y1="${y+RH}" x2="${x+BW}" y2="${y+RH}" stroke="${C.border}" stroke-width="1"/>`;
  svg += `<rect x="${x}" y="${y}" width="${BW}" height="${BH}" rx="7" fill="none" ${champBorder}/>`;
}

// connectors: child → parent (classic bracket elbow)
function connect(node, side){
  if(!node.kids) return;
  const [c1,c2] = node.kids;
  const childEdge = side==="L" ? c1.x+BW : c1.x;     // outgoing edge of children
  const parentEdge = side==="L" ? node.x : node.x+BW; // incoming edge of parent
  const midX = (childEdge + parentEdge)/2;
  const ln = (x1,y1,x2,y2)=>{ svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.line}" stroke-width="1.5"/>`; };
  ln(childEdge, c1.cy, midX, c1.cy);
  ln(childEdge, c2.cy, midX, c2.cy);
  ln(midX, c1.cy, midX, c2.cy);
  ln(midX, node.cy, parentEdge, node.cy);
  node.kids.forEach(k=>connect(k,side));
}

// ─── DRAW ───────────────────────────────────────────────────────────────────
connect(L,"L"); connect(R,"R");
// SF → Final connectors
const fLeftEdge = finalX, fRightEdge = finalX+BW;
svg += `<line x1="${L.x+BW}" y1="${cy101}" x2="${(L.x+BW+fLeftEdge)/2}" y2="${cy101}" stroke="${C.line}" stroke-width="1.5"/>`;
svg += `<line x1="${(L.x+BW+fLeftEdge)/2}" y1="${cy101}" x2="${(L.x+BW+fLeftEdge)/2}" y2="${finalCy}" stroke="${C.line}" stroke-width="1.5"/>`;
svg += `<line x1="${(L.x+BW+fLeftEdge)/2}" y1="${finalCy}" x2="${fLeftEdge}" y2="${finalCy}" stroke="${C.line}" stroke-width="1.5"/>`;
svg += `<line x1="${R.x}" y1="${cy102}" x2="${(R.x+fRightEdge)/2}" y2="${cy102}" stroke="${C.line}" stroke-width="1.5"/>`;
svg += `<line x1="${(R.x+fRightEdge)/2}" y1="${cy102}" x2="${(R.x+fRightEdge)/2}" y2="${finalCy}" stroke="${C.line}" stroke-width="1.5"/>`;
svg += `<line x1="${(R.x+fRightEdge)/2}" y1="${finalCy}" x2="${fRightEdge}" y2="${finalCy}" stroke="${C.line}" stroke-width="1.5"/>`;

// all match boxes
function drawTree(node, side){ box(node); if(node.kids) node.kids.forEach(k=>drawTree(k,side)); }

// Final + 3rd place placed as pseudo-nodes
const champ = winnerOf[104];
const finalNode = { mn:104, x:finalX, cy:finalCy };
const thirdNode = { mn:103, x:finalX, cy:thirdCy };

// labels
svg += `<text x="${W/2}" y="50" text-anchor="middle" font-size="34" font-weight="700" fill="${C.text}" font-family="'DM Serif Display',Georgia,serif">FIFA World Cup 2026 — Predicted Knockout Bracket</text>`;
svg += `<text x="${W/2}" y="78" text-anchor="middle" font-size="14" fill="${C.head}" font-family="'Plus Jakarta Sans',sans-serif">Hayah-AI adaptive model · power ranking + travel fatigue · generated 2026-06-28 (group stage complete)</text>`;
svg += `<text x="${finalX+BW/2}" y="${finalCy-BH/2-30}" text-anchor="middle" font-size="20" font-weight="700" fill="${C.text}" font-family="'DM Serif Display',Georgia,serif">Final</text>`;
svg += `<text x="${finalX+BW/2}" y="${thirdCy-BH/2-26}" text-anchor="middle" font-size="14" font-weight="600" fill="${C.head}" font-family="'Plus Jakarta Sans',sans-serif">Play-off for third place</text>`;

// round headers (top)
const heads = [["Round of 32",colsL[0]],["Round of 16",colsL[1]],["Quarter-final",colsL[2]],["Semi-final",colsL[3]],
  ["Semi-final",colsR[3]],["Quarter-final",colsR[2]],["Round of 16",colsR[1]],["Round of 32",colsR[0]]];
for(const [t,x] of heads) svg += `<text x="${x}" y="${topY-72}" font-size="14" font-weight="700" fill="${C.head}" font-family="'Plus Jakarta Sans',sans-serif">${t}</text>`;

drawTree(L,"L"); drawTree(R,"R");
box(finalNode,{champ:true});
box(thirdNode);

// champion banner
svg += `<g transform="translate(${finalX+BW/2}, ${finalCy+BH/2+44})">`;
svg += `<rect x="-150" y="-26" width="300" height="52" rx="10" fill="${C.champ}"/>`;
svg += `<text x="0" y="-4" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="'Plus Jakarta Sans',sans-serif" letter-spacing="1">PREDICTED CHAMPION</text>`;
svg += `<text x="0" y="17" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="'Plus Jakarta Sans',sans-serif">${FLAGS[champ]||""} ${esc(NAMES[champ]||champ)}</text>`;
svg += `</g>`;

const Hgt = topY + 8*P + 80;
const svgDoc = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hgt}" viewBox="0 0 ${W} ${Hgt}" font-family="sans-serif">`
  + `<rect width="${W}" height="${Hgt}" fill="${C.bg}"/>` + svg + `</svg>`;

writeFileSync(join(ROOT,"bracket-prediction.svg"), svgDoc);
const html = `<!doctype html><html><head><meta charset="utf-8">`
  + `<style>html,body{margin:0;padding:0;background:${C.bg}}</style></head>`
  + `<body>${svgDoc}</body></html>`;
writeFileSync(join(ROOT,"bracket-prediction.html"), html);
console.log(`Wrote bracket-prediction.svg and .html (${W}x${Hgt}). Champion: ${NAMES[champ]||champ}`);
