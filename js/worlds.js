"use strict";
// ============================== WORLDS ==============================
// tiles: 0 floor, 1 wall, 2 desk, 3 carpet, 4 plant, 5 coffee, 6 shelf, 7 stairs, 8 table, 9 parked car
let map = [];
let worlds = {}, worldId = 'office';
const solid = t => t===1||t===2||t===4||t===5||t===6||t===8||t===9;

function mkGrid(w,h,fill){
  const g=[];
  for(let y=0;y<h;y++){ g.push([]); for(let x=0;x<w;x++) g[y].push((x===0||y===0||x===w-1||y===h-1)?1:fill); }
  return g;
}
const hline=(g,x0,x1,y,t)=>{ for(let x=x0;x<=x1;x++) g[y][x]=t; };
const vline=(g,x,y0,y1,t)=>{ for(let y=y0;y<=y1;y++) g[y][x]=t; };
const rectF=(g,x0,y0,x1,y1,t)=>{ for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) g[y][x]=t; };

function buildOffice(){
  const g = mkGrid(44,32,0);
  // north suites: library | executive | IT
  hline(g,1,42,8,1); [7,8,21,22,36,37].forEach(x=>g[8][x]=0);
  vline(g,13,1,7,1); vline(g,30,1,7,1);
  rectF(g,14,1,29,7,3);
  for(const y of [2,4,6]) for(let x=2;x<=11;x++) if(x!==6&&x!==7) g[y][x]=6;
  // west wing: conference room + mailroom
  vline(g,11,9,30,1); [13,14,27,28].forEach(y=>g[y][11]=0);
  hline(g,1,10,19,1); g[19][5]=0; g[19][6]=0;
  rectF(g,4,12,7,14,8);
  // east wing: break room + Chad's corner + annex nook
  vline(g,32,9,30,1); [11,12,21,22,27,28].forEach(y=>g[y][32]=0);
  hline(g,33,42,15,1); g[15][37]=0; g[15][38]=0;
  g[11][40]=5;
  hline(g,33,42,25,1); g[25][35]=0; g[25][36]=0;
  g[28][40]=7;
  g[21][2]=7; // freight elevator (mailroom) down to the parking garage
  g[28][30]=7; // elevator bank (lobby) up to the 24th floor — Act II
  g[28][13]=7; // firm car (lobby) to the courthouse — Act II
  // lobby
  hline(g,12,31,25,1); [17,18,25,26].forEach(x=>g[25][x]=0);
  for(const x of [19,20,23,24]) g[28][x]=2;
  // cubicle farm
  for(const y of [11,14,17,20,23]) for(const x of [14,15,19,20,25,26]) g[y][x]=2;
  // plants
  for(const [x,y] of [[12,9],[31,9],[12,24],[31,24],[2,9],[33,9],[42,16],[12,26],[31,26],[2,30],[16,2]])
    if(g[y][x]===0||g[y][x]===3) g[y][x]=4;
  worlds.office = {
    grid:g, w:44, h:32,
    colors:{ floor:'#221b33', carpet:'#3a2440', wall:'#4a3f63', wallIn:'#352c4a' },
    enemies:[],
    pickups:[
      { x:6*TILE+20, y:3*TILE+20, spr:'dossier', kind:'lore', idx:0, t:0 },
      { x:9*TILE+20, y:13*TILE+20, spr:'dossier', kind:'lore', idx:1, t:1 },
      { x:8*TILE+20, y:29*TILE+20, spr:'dossier', kind:'lore', idx:4, t:2 },
      { x:40*TILE+20, y:23*TILE+20, spr:'key', kind:'item', item:'red_pen', t:0.4 }, // break-room: an early weapon
    ],
    crates:[ {tx:13,ty:22,ox:13,oy:22}, {tx:28,ty:12,ox:28,oy:12} ],
    plates:[], gates:{}, levers:[], signs:[], recall:null, printer:{tx:35, ty:12}, vendor:{tx:38, ty:13}, board:{tx:16, ty:24},
    portraits:[
      { tx:2,  ty:1, seen:false, text:"EZEKIEL DEWEY (1908–1929). Founded the firm with a handshake. Died of a different handshake." },
      { tx:3,  ty:1, seen:false, text:"MORTIMER CHEATHAM (1929–1941). Pioneered the billable hour. Then billed for pioneering it." },
      { tx:4,  ty:1, seen:false, text:"REGINALD HOWE (1941–1953). Argued 44 cases before the Supreme Court. Won 12. Framed all 44." },
      { tx:5,  ty:1, seen:false, text:"AUGUSTINE PLY (1953–1958). Merged the firm with itself in a tax maneuver no one has successfully explained." },
      { tx:6,  ty:1, seen:false, text:"CORNELIA VANCE (1958–1964). Made the artist repaint this eleven times. He hangs in the basement now." },
      { tx:7,  ty:1, seen:false, text:"BARNABY QUILL (1964–1970). Believed the building was 'just a building.' The building disagreed." },
      { tx:8,  ty:1, seen:false, text:"HENRY WORTHINGTON II (1970–1976). Took his bonus in parking. You've met him." },
      { tx:9,  ty:1, seen:false, text:"PRUDENCE LOCKE (1976–1981). Banned midnight meetings. Vanished at 11:59 p.m. Technically compliant." },
      { tx:10, ty:1, seen:false, text:"SILAS GRABBIT (1981–1984). Left to found a rival firm. Took the good pens." },
      { tx:11, ty:1, seen:false, text:"T. GRAVES III (1984–1987). The frame is empty. The nameplate is warm." },
      { tx:12, ty:1, seen:false, text:"O. HARGROVE (1987–    ). Decades younger. Visibly terrified. The placard's first initial has been scratched at, repeatedly, with a letter opener." },
    ],
    stairs:[
      { tx:40, ty:28, to:'annex',  dx:5*TILE+20, dy:3*TILE+20,  label:'[E] Records Annex' },
      { tx:2,  ty:21, to:'garage', dx:2*TILE+20, dy:4*TILE+20,  label:'[E] freight elevator (P3)' },
      { tx:30, ty:28, to:'floor24', dx:3*TILE+20, dy:22*TILE+20, label:'[E] elevator — 24th floor',
        locked:()=>questIdx<6, lockMsg:'The 24-button is dark. A brass plaque: GRABBIT & RUNN LLP — BY APPOINTMENT ONLY.' },
      { tx:13, ty:28, to:'courtroom', dx:15*TILE+20, dy:19*TILE+20, label:'[E] firm car — courthouse',
        locked:()=>questIdx<8, lockMsg:'The firm car idles, judgmentally. Nothing on the court calendar. Yet.' },
    ],
  };
}

function buildAnnex(){
  const g = mkGrid(32,26,1);
  const c=(x0,y0,x1,y1)=>rectF(g,x0,y0,x1,y1,0);
  c(1,1,8,7);                       // entrance chamber
  vline(g,8,1,7,1); g[5][8]=0;      // doorway east
  c(9,3,16,7);                      // crate puzzle room
  g[5][17]=0;                       // gated corridor (g1)
  c(18,1,29,8);                     // lever room
  g[9][23]=0; g[9][24]=0;           // gated passage south (g2)
  c(2,10,29,13);                    // the great hall of misfiled things
  g[14][5]=0; g[14][6]=0;           // key room door
  c(2,15,9,22);                     // key room
  g[14][24]=0; g[14][25]=0;         // vault door (g3)
  c(20,15,29,23);                   // the vault
  g[3][3]=7;                        // stairs up
  g[12][15]=7;                      // ACT III: the descent to Sublevel C (sealed until then)
  for(const x of [3,8,13,18,27]) g[10][x]=6;
  for(const x of [21,25,29]) g[23][x]=6;
  worlds.annex = {
    grid:g, w:32, h:26,
    colors:{ floor:'#2a2118', carpet:'#2a2118', wall:'#54422c', wallIn:'#3c2f1f' },
    enemies:[],
    pickups:[
      { x:22*TILE+20, y:21*TILE+20, spr:'dossier', kind:'lore', idx:2, t:0 },
      { x:26*TILE+20, y:19*TILE+20, spr:'stamper', kind:'stamper', t:1 },
      { x:4*TILE+20,  y:19*TILE+20, spr:'key',     kind:'key',     t:2 },
      { x:28*TILE+20, y:17*TILE+20, spr:'chest',   kind:'chest',   t:0.5 },
      { x:6*TILE+20,  y:3*TILE+20,  spr:'coffee',  kind:'item', item:'cold_brew', t:1.3 },
      { x:21*TILE+20, y:12*TILE+20, spr:'jug',     kind:'descaler', t:1.5 },
      { x:15*TILE+20, y:11*TILE+20, spr:'dossier', kind:'item', item:'precedent_binder', t:0.7 },
    ],
    crates:[ {tx:12,ty:5,ox:12,oy:5} ],
    plates:[ {tx:12,ty:3,gate:'g1',done:false} ],
    gates:{ g1:{open:false,tiles:[[17,5]]}, g2:{open:false,tiles:[[23,9],[24,9]]}, g3:{open:false,tiles:[[24,14],[25,14]]} },
    levers:[ {tx:20,ty:2,id:'A',on:false}, {tx:23,ty:2,id:'B',on:false}, {tx:26,ty:2,id:'C',on:false} ],
    leverOrder:['B','A','C'], leverProgress:0, leverGate:'g2', leverFail:[24,5],
    signs:[ {tx:28,ty:5,text:"RE-FILING PROTOCOL (REV. 1987): The BOTTOM DRAWER (B) first. Then the ARCHIVE (A). The CATALOG (C) last. Improper filing wakes the hours."} ],
    recall:{tx:9,ty:7},
    stairs:[
      { tx:3, ty:3, to:'office', dx:39*TILE+20, dy:28*TILE+20, label:'[E] back upstairs' },
      { tx:15, ty:12, to:'vault', dx:13*TILE+20, dy:15*TILE+20, label:'[E] descend — Sublevel C',
        locked:()=>!flags.act3, lockMsg:'A stairwell you never noticed, sealed with a wax seal older than the firm. It will not open. Not yet.' },
    ],
  };
  const mk=(t,x,y)=>{ const e=ENEMY_TYPES[t]; worlds.annex.enemies.push({ type:t, ...e, x:x*TILE+20, y:y*TILE+20, hp:e.hp, maxhp:e.hp, shotT:1, hurtT:0, wob:Math.random()*7 }); };
  mk('golem',10,12); mk('golem',16,12); mk('wraith',26,12); mk('wraith',20,11);
  mk('golem',3,17); mk('golem',7,20); mk('wraith',5,21); mk('wraith',24,6);
}

function buildGarage(){
  const g = mkGrid(36,24,0);
  // concrete pillars
  for(const x of [6,11,16,21]) for(const y of [6,12,18]) g[y][x]=1;
  // the valet cage — "the NICE part"
  vline(g,26,1,22,1); g[11][26]=0; g[12][26]=0;
  rectF(g,27,1,34,22,3);
  // parked cars (two tiles each)
  const park=(x,y)=>{ g[y][x]=9; g[y][x+1]=9; };
  park(3,2); park(8,2); park(13,2); park(18,2);
  park(3,21); park(8,21); park(13,21); park(18,21); park(22,21);
  park(8,8); park(13,8); park(8,16); park(18,16);
  park(28,2); park(32,2); park(28,21); park(32,21);
  g[2][2]=7; // freight elevator up
  worlds.garage = {
    grid:g, w:36, h:24,
    colors:{ floor:'#1d1d24', carpet:'#262031', wall:'#3c3c48', wallIn:'#2b2b35' },
    enemies:[],
    pickups:[
      { x:30*TILE+20, y:5*TILE+20,  spr:'dossier', kind:'lore', idx:3, t:1 },
      { x:33*TILE+20, y:12*TILE+20, spr:'gear',    kind:'element', t:2 },
      { x:29*TILE+20, y:18*TILE+20, spr:'chest',   kind:'chest', t:0.5 },
      { x:9*TILE+20,  y:20*TILE+20, spr:'briefcase', kind:'item', item:'bespoke_suit', t:0.6 },
    ],
    crates:[], plates:[], levers:[],
    signs:[
      { tx:4,  ty:4,  text:"SUBLEVEL P3. The garage is NOT sinking. Cracks are 'character'. — Building Management, 1987" },
      { tx:24, ty:10, text:"VALET PARKING — EQUITY PARTNERS ONLY. The NICE part. Trespassers will be deposed, then towed. Key with valet. There has been no valet since 1987." },
    ],
    gates:{ g1:{ open:false, tiles:[[26,11],[26,12]] } },
    recall:null,
    stairs:[ { tx:2, ty:2, to:'office', dx:4*TILE+20, dy:21*TILE+20, label:'[E] freight elevator (up)' } ],
  };
  const mk=(t,x,y)=>{ const e=ENEMY_TYPES[t]; worlds.garage.enemies.push({ type:t, ...e, x:x*TILE+20, y:y*TILE+20, hp:e.hp, maxhp:e.hp, shotT:1, hurtT:0, wob:Math.random()*7 }); };
  mk('wraith',10,12); mk('wraith',15,5); mk('wraith',19,18); mk('golem',13,12); mk('golem',7,19);
  mk('golem',4,16); mk('wraith',2,14);
  // the Grandfather himself materializes only when the valet cage is unlocked
  mk('counsel',29,8); mk('counsel',32,16);
}

function buildFloor24(){
  const g = mkGrid(36,26,0);
  // partner offices north (their executive carpet, colder)
  hline(g,1,34,7,1); [5,6,17,18,29,30].forEach(x=>g[7][x]=0);
  vline(g,12,1,6,1); vline(g,24,1,6,1);
  rectF(g,13,1,23,6,3);
  // records room east, behind the conflicts-check gate
  vline(g,27,9,16,1); hline(g,28,34,9,1); hline(g,28,34,16,1);
  g[12][27]=0; g[13][27]=0;
  // bullpen
  for(const y of [11,14,17]) for(const x of [4,5,9,10,14,15,19,20]) g[y][x]=2;
  // reception south
  hline(g,1,34,20,1); [8,9,26,27].forEach(x=>g[20][x]=0);
  for(const x of [16,17,18,19]) g[22][x]=2;
  g[22][31]=5; // the decaf machine
  g[23][3]=7;  // elevator home
  for(const [x,y] of [[2,8],[34,8],[2,19],[14,22],[21,22]]) if(g[y][x]===0) g[y][x]=4;
  worlds.floor24 = {
    grid:g, w:36, h:26,
    colors:{ floor:'#16202e', carpet:'#1d2a3e', wall:'#2e4a6e', wallIn:'#223850' },
    enemies:[],
    pickups:[
      { x:31*TILE+20, y:12*TILE+20, spr:'dossier', kind:'lore', idx:5, t:0 },
      { x:33*TILE+20, y:14*TILE+20, spr:'chest', kind:'chest', t:0.5 },
      { x:6*TILE+20,  y:14*TILE+20, spr:'briefcase', kind:'item', item:'kevlar_suit', t:0.5 },
    ],
    crates:[], plates:[],
    levers:[ {tx:29,ty:18,id:'A',on:false}, {tx:31,ty:18,id:'B',on:false}, {tx:33,ty:18,id:'C',on:false} ],
    leverOrder:['C','B','A'], leverProgress:0, leverGate:'g1', leverFail:[30,19],
    signs:[
      { tx:34, ty:18, text:"CONFLICTS CHECK PROTOCOL (G&R REV. 12): Clear the CATALOG (C) first. Then the BOTTOM DRAWER (B). The ARCHIVE (A) last. We file like we bill: backwards." },
      { tx:12, ty:21, text:"WELCOME TO GRABBIT & RUNN LLP. Visitors must sign in, waive liability, and surrender outerwear of quality." },
    ],
    gates:{ g1:{ open:false, tiles:[[27,12],[27,13]] } },
    recall:null,
    stairs:[ { tx:3, ty:23, to:'office', dx:30*TILE+20, dy:27*TILE+20, label:'[E] elevator — down to DC&H' } ],
  };
  const mk=(t,x,y)=>{ const e=ENEMY_TYPES[t]; worlds.floor24.enemies.push({ type:t, ...e, x:x*TILE+20, y:y*TILE+20, hp:e.hp, maxhp:e.hp, shotT:1, hurtT:0, wob:Math.random()*7 }); };
  mk('gremlin',16,12); mk('gremlin',7,15); mk('gremlin',22,16); mk('counsel',18,4); mk('counsel',8,4);
}

function buildCourtroom(){
  const g = mkGrid(30,22,0);
  rectF(g,11,2,18,3,8);                       // the bench
  g[8][21]=8;                                 // witness stand
  vline(g,8,4,13,1); g[9][8]=0; g[10][8]=0;   // jury box rail
  // gallery pews with a center aisle
  for(const y of [15,17,19]){ for(let x=4;x<=11;x++) g[y][x]=8; for(let x=18;x<=25;x++) g[y][x]=8; }
  for(let y=5;y<=19;y++){ g[y][14]=3; g[y][15]=3; }
  g[20][15]=7;                                // doors south — firm car
  worlds.courtroom = {
    grid:g, w:30, h:22,
    colors:{ floor:'#2c2824', carpet:'#5a1620', wall:'#5a5044', wallIn:'#463e34' },
    enemies:[],
    pickups:[ { x:24*TILE+20, y:3*TILE+20, spr:'dossier', kind:'lore', idx:6, t:0 } ],
    crates:[], plates:[], levers:[],
    signs:[
      { tx:21, ty:7, text:"WITNESS STAND. Occupancy: 1. Perjury: frowned upon. The chair remembers everyone who has lied in it." },
      { tx:9, ty:4, text:"JURY BOX — TWELVE SEATS. Win them with argument. The court does not accept fruit baskets. Anymore." },
    ],
    gates:{}, recall:null,
    jury:[[2,5],[4,5],[6,5],[2,7],[4,7],[6,7],[2,9],[4,9],[6,9],[2,11],[4,11],[6,11]],
    stairs:[ { tx:15, ty:20, to:'office', dx:13*TILE+20, dy:27*TILE+20, label:'[E] firm car — back to the office' } ],
  };
}

function buildVault(){
  // ACT III — Sublevel C: where the building files what it amends.
  const g = mkGrid(28,20,1);
  const c=(x0,y0,x1,y1)=>rectF(g,x0,y0,x1,y1,0);
  c(2,2,25,17);                                   // the great archival chamber
  for(const y of [4,8,12]) for(const x of [4,8,12,16,20,23]) g[y][x]=6; // shelves: the filed partners
  rectF(g,10,5,17,11,3);                          // central dais
  for(const x of [10,17]) for(const y of [5,8,11]) g[y][x]=0; // keep the dais approachable
  g[16][13]=7;                                    // stairs up to the annex
  worlds.vault = {
    grid:g, w:28, h:20,
    colors:{ floor:'#141120', carpet:'#241c33', wall:'#33294a', wallIn:'#221a30' },
    enemies:[], pickups:[],
    crates:[], plates:[], gates:{}, levers:[],
    signs:[ {tx:13, ty:14, text:"FILED UNDER: PERMANENT. The eleven who would not be amended. The building keeps what it overwrites."} ],
    recall:null,
    instrument:{ tx:13, ty:7 },                   // the founding agreement stands here; the avatar manifests here
    locke:{ tx:5, ty:15 },                        // P. Locke's ghost (Act III-b)
    stairs:[ { tx:13, ty:16, to:'annex', dx:15*TILE+20, dy:13*TILE+20, label:'[E] back up to the annex' } ],
  };
}
// ---- ambient staff & lighting moods (session-transient; not saved) ----
// mood: { vign: edge-darkness 0..1, tint: css color washed over the floor, pulse: breathe }
function extraSpot(w){
  let tx, ty, tries = 0;
  do { tx = 2+Math.floor(Math.random()*(w.w-4)); ty = 2+Math.floor(Math.random()*(w.h-4)); }
  while(solid(w.grid[ty][tx]) && ++tries < 200);
  return { x:tx*TILE+20, y:ty*TILE+20 };
}
function seedExtras(){
  const mkx = (w, n, sprs) => {
    w.extras = [];
    for(let i=0;i<n;i++){
      const p = extraSpot(w);
      w.extras.push({ x:p.x, y:p.y, tx:p.x, ty:p.y, r:12, spr:sprs[i%sprs.length],
                      pauseT:Math.random()*2, barkT:3+Math.random()*10, wob:Math.random()*7, flip:false });
    }
  };
  mkx(worlds.office, 7, ['juror','p_m','p_f']);
  mkx(worlds.floor24, 5, ['p_f','juror','p_m']);
  worlds.office.mood = null;                                              // fluorescent honesty
  worlds.annex.mood  = { vign:0.55 };
  worlds.garage.mood = { vign:0.55, tint:'rgba(40,60,120,0.05)' };        // sodium-lamp chill
  worlds.floor24.mood = { tint:'rgba(70,130,220,0.07)' };                 // thermostat set to "deposition"
  worlds.courtroom.mood = { vign:0.30, tint:'rgba(200,170,90,0.05)' };    // gavel-colored gravity
  worlds.vault.mood = { vign:0.68, tint:'rgba(60,200,140,0.05)', pulse:true }; // it breathes
}
function buildWorlds(){ worlds = {}; buildOffice(); buildAnnex(); buildGarage(); buildFloor24(); buildCourtroom(); buildVault(); seedExtras(); }
function loadWorld(id){
  worldId = id; const w = worlds[id];
  map = w.grid; MAPW = w.w; MAPH = w.h;
  enemies = w.enemies; pickups = w.pickups;
  extras = w.extras || [];
}
function setWorld(id, px, py){
  if(worldId==='office' && id!=='office') reviewEnd();   // leaving the floor recesses Document Review
  worlds[worldId].enemies = enemies; worlds[worldId].pickups = pickups; worlds[worldId].extras = extras;
  loadWorld(id);
  questEvent('reach', { world:id });
  player.x = px; player.y = py;
  shots = []; enemyShots = [];
  for(const al of allies){ al.x = player.x+34; al.y = player.y; }
  if(pendingSpawn && pendingSpawn.world === worldId){
    const q = pendingSpawn.q; pendingSpawn = null;
    doQuestSpawns(q);
  }
  saveGame();
}

function tileAt(px,py){
  const tx=Math.floor(px/TILE), ty=Math.floor(py/TILE);
  if(!(tx>=0&&ty>=0&&tx<MAPW&&ty<MAPH)) return 1; // NaN-safe: treat anything out of range as wall
  return map[ty][tx];
}
function dynBlockAt(tx,ty){
  const w = worlds[worldId]; if(!w) return false;
  if(w.crates.some(c=>c.tx===tx&&c.ty===ty)) return true;
  for(const k in w.gates){ const gt=w.gates[k]; if(!gt.open && gt.tiles.some(t=>t[0]===tx&&t[1]===ty)) return true; }
  return false;
}
function collides(x,y,r){
  for(const [dx,dy] of [[-r,-r],[r,-r],[-r,r],[r,r],[0,-r],[0,r],[-r,0],[r,0]]){
    const px=x+dx, py=y+dy;
    if(solid(tileAt(px,py))) return true;
    if(dynBlockAt(Math.floor(px/TILE), Math.floor(py/TILE))) return true;
  }
  return false;
}
const blockedShot = (px,py) => solid(tileAt(px,py)) || dynBlockAt(Math.floor(px/TILE), Math.floor(py/TILE));
function findOpen(nearX, nearY, spread){
  for(let i=0;i<200;i++){
    const x = nearX + (Math.random()*2-1)*spread;
    const y = nearY + (Math.random()*2-1)*spread;
    if(x>TILE*1.5 && y>TILE*1.5 && x<(MAPW-1.5)*TILE && y<(MAPH-1.5)*TILE && !collides(x,y,16)) return {x,y};
  }
  return { x:nearX, y:nearY };
}

// ---- movable crates ----
function tryPush(sx,sy){
  const w = worlds[worldId];
  if(!w.crates.length) return false;
  const tx=Math.floor((player.x+sx*(player.r+8))/TILE), ty=Math.floor((player.y+sy*(player.r+8))/TILE);
  const c = w.crates.find(c=>c.tx===tx&&c.ty===ty);
  if(!c) return false;
  const nx=tx+sx, ny=ty+sy;
  const t = (map[ny]||[])[nx];
  if(t===undefined || solid(t) || t===7 || dynBlockAt(nx,ny)) return false;
  c.tx=nx; c.ty=ny;
  for(const pl of w.plates){
    if(!pl.done && pl.tx===c.tx && pl.ty===c.ty){
      pl.done=true; w.gates[pl.gate].open=true;
      SFX.gate();
      announce('KA-CHUNK. The weight registers. Somewhere, a filing gate slides open.', false, 3.5);
    }
  }
  return true;
}
function resetCrates(){
  worlds[worldId].crates.forEach(c=>{ c.tx=c.ox; c.ty=c.oy; });
  announce('CRATE RECALL. The boxes shuffle back, deeply embarrassed.', false, 3);
}
function pullLever(lv){
  const w = worlds[worldId];
  if(w.gates[w.leverGate].open){ announce('The levers are spent. The gate remembers.', false, 2.5); return; }
  if(lv.id === w.leverOrder[w.leverProgress]){
    lv.on = true; w.leverProgress++;
    SFX.lever();
    if(w.leverProgress >= w.leverOrder.length){
      w.gates[w.leverGate].open = true;
      SFX.gate();
      announce(worldId==='annex' ? 'KA-CHUNK. Proper filing! The archive gate grinds open, almost approvingly.'
                                 : 'BEEP. CONFLICTS CLEARED. The records room unlocks with corporate reluctance.', false, 4);
    } else announce('CLUNK. That felt... procedurally correct.', false, 2.5);
  } else {
    w.leverProgress = 0; w.levers.forEach(l=>l.on=false);
    SFX.buzz();
    announce('A buzzer of pure disappointment. The levers reset. Something hisses awake.', false, 3.5);
    spawnEnemy('wraith', w.leverFail[0]*TILE+20, w.leverFail[1]*TILE+20);
  }
}

