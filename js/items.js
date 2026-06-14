"use strict";
// ============================== ITEMS & INVENTORY ==============================
// Data-driven item registry. Equippable items layer stat modifiers on top of the
// player's practice-area class (weapon slot) or grant passive bonuses (accessory
// slot). Keys and dossiers are inventory-only. Consumables are used from the bag.
//
//   kind: 'weapon' | 'accessory' | 'consumable' | 'key' | 'lore'
//   weapon mods : dmgMul, cdMul, speedMul, countAdd, sizeAdd, pierce, special, color
//   accessory mods: dmgMul, meleeMul, maxhpAdd, slow
//   consumable  : heal
const ITEMS = {
  good_pens: {
    nm:'The Good Pens', spr:'key', kind:'weapon',
    ds:'Silas Grabbit took the firm\'s good pens in 1981. These are the spares. They write through anything — including opposing counsel.',
    mods:{ dmgMul:1.35, pierce:true, sizeAdd:1, color:'#caa84a' },
  },
  letter_opener: {
    nm:'Letter Opener of P. Locke', spr:'key', kind:'accessory',
    ds:'Prudence Locke vanished at 11:59 p.m., technically compliant. Her opener remembers the cut. Briefcase strikes bite deeper — and savage anything that shouldn\'t exist (bosses).',
    mods:{ meleeMul:1.3, bossMul:2.2 },
  },
  bates_stamper: {
    nm:'Emotional Support Bates Stamper', spr:'stamper', kind:'accessory',
    ds:'Counter reads 999999. Hums with administrative power. Your briefcase strikes now STAMP enemies — slowing them under the weight of process.',
    mods:{ meleeMul:1.25, slow:true },
  },
  espresso_rig: {
    nm:'Weaponized Espresso Rig', spr:'machine', kind:'accessory',
    ds:'Rebuilt from three scavenged parts and spite. Vintage 1987 descaling solution, industrial heating element. Runs on pure billable adrenaline.',
    mods:{ dmgMul:1.15, maxhpAdd:30 },
  },
  brass_key: {
    nm:'Heavy Brass Key', spr:'key', kind:'key',
    ds:'Label long faded. It wants to be turned.',
  },
  valet_key: {
    nm:'Valet Key, Sublevel P3', spr:'key', kind:'key',
    ds:'Smells of cigars and deferred maintenance. Worthington II parked something down here he never meant to leave.',
  },
  cold_brew: {
    nm:'Emergency Cold Brew', spr:'coffee', kind:'consumable',
    ds:'Nitro, unlabeled, found in the back of the break-room fridge behind a 2014 yogurt. Restores 45 Billable Energy.',
    heal:45,
  },
  // ---- suits (armor: the 'suit' slot; defense soaks a % of every hit) ----
  pinstripe_suit: {
    nm:'Off-the-Rack Pinstripes', spr:'briefcase', kind:'suit',
    ds:'A starter suit from the firm supply closet. Smells faintly of toner and ambition. Soaks 12% of incoming damage.',
    mods:{ defense:0.12 },
  },
  bespoke_suit: {
    nm:'Bespoke Three-Piece', spr:'briefcase', kind:'suit',
    ds:'Tailored on the firm\'s dime during a "client development" lunch. Soaks 25% of damage and steadies your nerves (+20 max Billable Energy).',
    mods:{ defense:0.25, maxhpAdd:20 },
  },
  kevlar_suit: {
    nm:'Litigation-Grade Kevlar Pinstripes', spr:'briefcase', kind:'suit',
    ds:'Trial lawyers run hot. This suit is rated for hostile depositions and the occasional thrown gavel. Soaks 40% of damage, +35 max Billable Energy.',
    mods:{ defense:0.40, maxhpAdd:35 },
  },
  // ---- early weapons (so the bag matters from Act I) ----
  red_pen: {
    nm:'The Red Pen of Doom', spr:'key', kind:'weapon',
    ds:'Every associate fears it. Your practice-area attack hits 25% harder and fires noticeably faster.',
    mods:{ dmgMul:1.25, cdMul:0.8 },
  },
  precedent_binder: {
    nm:'Three-Ring Precedent Binder', spr:'dossier', kind:'weapon',
    ds:'Heavy with citations. Adds an extra projectile to every attack, though each lands a little softer.',
    mods:{ countAdd:1, dmgMul:0.82 },
  },
  // ---- side-quest reward gear ----
  server_capacitor: {
    nm:'IT Surplus Capacitor', spr:'gear', kind:'weapon',
    ds:"Salvaged from the server Benny is legally forbidden to describe. Your attack fires 30% faster and hits a touch harder.",
    mods:{ speedMul:1.2, cdMul:0.78, dmgMul:1.05 },
  },
  monogrammed_cufflinks: {
    nm:'Worthington Monogrammed Cufflinks', spr:'key', kind:'accessory',
    ds:"Solid, heavy, faintly judgmental. A Worthington heirloom. Soaks 10% of damage and steels the nerves (+15 max energy).",
    mods:{ defense:0.10, maxhpAdd:15 },
  },
  pro_bono_plaque: {
    nm:'Pro Bono Service Plaque', spr:'sign', kind:'accessory',
    ds:"Lenny had it engraved with his last twelve dollars. The goodwill is, somehow, load-bearing. +30 max Billable Energy.",
    mods:{ maxhpAdd:30 },
  },
  founders_signet: {
    nm:"Founders' Signet Ring", spr:'key', kind:'accessory',
    ds:"Pried from the eleventh portrait's painted hand. It remembers every partner the building overwrote. Briefcase strikes hit bosses 60% harder.",
    mods:{ bossMul:1.6 },
  },
  mail_vest: {
    nm:'Mailroom Hazard Vest', spr:'briefcase', kind:'accessory',
    ds:"Reflective, dented, smells of toner and survival. Rosa insists you keep it. Soaks 12% of incoming damage.",
    mods:{ defense:0.12 },
  },
  printer_companion: {
    nm:'The One Working Printer', spr:'computer', kind:'accessory',
    ds:"The firm's last functioning printer, now loyal to you. It floats at your side and auto-fires paper-jam projectiles at the nearest enemy. PC LOAD LETTER.",
    mods:{ companion:true },
  },
};

// ---- inventory state ----
let invOpen = false, invSel = null, invRects = [], invTab = 'items', invScroll = 0;

function giveItem(id, quiet){
  if(!ITEMS[id]) return false;
  player.inventory.push(id);
  questEvent('collect', { item:id });
  if(!quiet){
    SFX.pick();
    floaters.push({ x:player.x, y:player.y-26, text:'GOT: '+ITEMS[id].nm.toUpperCase(), t:1.4, color:'#caa84a' });
    announce('Acquired: '+ITEMS[id].nm+'. (Press I to open your bag.)', false, 4);
  }
  return true;
}
function hasItem(id){ return player && player.inventory && player.inventory.includes(id); }
function countItem(id){ return player.inventory.filter(x=>x===id).length; }

const EQUIP_KINDS = ['weapon','accessory','suit'];
function equipItem(id){
  const it = ITEMS[id]; if(!it || !EQUIP_KINDS.includes(it.kind)) return;
  const slot = it.kind;
  player.equip[slot] = (player.equip[slot]===id) ? null : id; // click again to unequip
  recalcMaxHP();
  SFX.blip();
}
function useConsumable(id){
  const it = ITEMS[id]; if(!it || it.kind!=='consumable') return;
  const i = player.inventory.indexOf(id); if(i<0) return;
  player.inventory.splice(i,1);
  if(it.heal){ player.hp = Math.min(player.maxhp, player.hp + it.heal);
    floaters.push({ x:player.x, y:player.y-22, text:`+${it.heal} CAFFEINE`, t:0.9, color:'#9be05e' }); }
  SFX.coffee();
}

// ---- effective stats: class base + equipped weapon ----
function weaponStats(){
  const c = player.cls;
  const s = { id:c.id, atk:c.atk, dmg:c.dmg, cd:c.cd, speed:c.speed, count:c.count,
              pierce:c.pierce, color:c.color, size:c.size, special:c.special };
  const w = player.equip && ITEMS[player.equip.weapon];
  if(w && w.mods){
    const m = w.mods;
    if(m.dmgMul)   s.dmg   *= m.dmgMul;
    if(m.cdMul)    s.cd    *= m.cdMul;
    if(m.speedMul) s.speed *= m.speedMul;
    if(m.countAdd) s.count += m.countAdd;
    if(m.sizeAdd)  s.size  += m.sizeAdd;
    if(m.pierce)   s.pierce = true;
    if(m.special)  s.special = m.special;
    if(m.color)    s.color = m.color;
  }
  return s;
}
// passive-gear lookups across the accessory + suit slots (weapon mods are
// applied separately in weaponStats so dmgMul etc. aren't double-counted)
const GEAR_SLOTS = ['accessory','suit'];
function gearSum(key){ let v=0; for(const s of GEAR_SLOTS){ const it=player.equip&&ITEMS[player.equip[s]]; if(it&&it.mods&&it.mods[key]) v+=it.mods[key]; } return v; }
function gearMul(key){ let m=1; for(const s of GEAR_SLOTS){ const it=player.equip&&ITEMS[player.equip[s]]; if(it&&it.mods&&it.mods[key]) m*=it.mods[key]; } return m; }
function gearHas(key){ for(const s of GEAR_SLOTS){ const it=player.equip&&ITEMS[player.equip[s]]; if(it&&it.mods&&it.mods[key]) return true; } return false; }
// fraction of incoming damage blocked by equipped suit/accessory armor (capped)
function equipDefense(){ return Math.min(0.70, gearSum('defense')); }
function recalcMaxHP(){
  if(!player) return;
  player.maxhp = player.rank.hp + gearSum('maxhpAdd');
  if(player.hp > player.maxhp) player.hp = player.maxhp;
}

// ---- inventory UI (drawn over the frozen world while invOpen) ----
function toggleInventory(){
  if(state!=='play') return;
  invOpen = !invOpen;
  if(invOpen){ for(const k in keys) keys[k]=false; invScroll = 0; } // drop held movement; start at top
  SFX.blip();
}
function inventoryClick(x, y){
  for(const r of invRects){
    if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){
      if(r.act==='close'){ toggleInventory(); return; }
      if(r.act==='tab'){ invTab = r.tab; invScroll = 0; SFX.blip(); return; }
      if(!r.id) return;
      const it = ITEMS[r.id];
      if(it.kind==='consumable') useConsumable(r.id);
      else if(EQUIP_KINDS.includes(it.kind)) equipItem(r.id);
      invSel = r.id;
      return;
    }
  }
}
function drawInventory(){
  invRects = [];
  const PX=140, PY=70, PW=W-280, PH=H-140;
  ctx.fillStyle='rgba(13,10,20,0.92)'; ctx.fillRect(0,0,W,CH);
  ctx.fillStyle='#1c1730'; ctx.fillRect(PX,PY,PW,PH);
  ctx.strokeStyle='#caa84a'; ctx.lineWidth=2; ctx.strokeRect(PX,PY,PW,PH);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.font='bold 18px monospace'; ctx.fillStyle='#f0c75e';
  ctx.fillText('CASE FILE', PX+24, PY+34);

  // tab headers
  const mkTab=(label, tab, tx)=>{
    const on=invTab===tab, tb={x:tx,y:PY+18,w:96,h:24,act:'tab',tab};
    ctx.fillStyle=on?'#caa84a':'#2a2340'; ctx.fillRect(tb.x,tb.y,tb.w,tb.h);
    ctx.fillStyle=on?'#1c1730':'#9b8fb5'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
    ctx.fillText(label, tb.x+tb.w/2, tb.y+16); ctx.textAlign='left';
    invRects.push(tb);
  };
  mkTab('EFFECTS','items', PX+150);
  mkTab('MATTERS','quests', PX+252);

  // close button
  const cb={x:PX+PW-90,y:PY+16,w:70,h:26,act:'close'};
  ctx.fillStyle='#3a2440'; ctx.fillRect(cb.x,cb.y,cb.w,cb.h);
  ctx.strokeStyle='#caa84a'; ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle='#f0c75e'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText('CLOSE', cb.x+cb.w/2, cb.y+18); ctx.textAlign='left';
  invRects.push(cb);

  if(invTab==='quests'){ drawQuestLog(PX,PY,PW,PH); return; }

  ctx.font='11px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText('click an item to equip / unequip / use', PX+24, PY+54);

  // equip slots (three across: weapon / accessory / suit)
  const slotY=PY+78, slotW=Math.floor((PW-48-32)/3);
  const drawSlot=(label, slot, sx)=>{
    ctx.fillStyle='#9b8fb5'; ctx.font='10px monospace';
    ctx.fillText(label, sx, slotY-6);
    ctx.fillStyle='#120e1c'; ctx.fillRect(sx, slotY, slotW, 56);
    ctx.strokeStyle='#4a3f63'; ctx.lineWidth=1; ctx.strokeRect(sx, slotY, slotW, 56);
    const id=player.equip[slot];
    if(id){ drawSprite(SPR[ITEMS[id].spr], sx+26, slotY+28, 36);
      ctx.fillStyle='#e8e0f0'; ctx.font='11px monospace';
      wrap(ITEMS[id].nm, 18).slice(0,2).forEach((l,i)=>ctx.fillText(l, sx+48, slotY+24+i*14)); }
    else { ctx.fillStyle='#5a4f73'; ctx.font='italic 11px monospace'; ctx.fillText('— empty —', sx+16, slotY+32); }
  };
  drawSlot('WEAPON MOD', 'weapon', PX+24);
  drawSlot('ACCESSORY', 'accessory', PX+24+slotW+16);
  drawSlot('SUIT (ARMOR)', 'suit', PX+24+(slotW+16)*2);

  // effective-stats summary line
  const ws=weaponStats();
  const dmgX=(ws.dmg/player.cls.dmg)*dmgMult(), rateX=player.cls.cd/ws.cd, arm=Math.round(equipDefense()*100);
  ctx.font='11px monospace'; ctx.fillStyle='#caa84a';
  ctx.fillText(`FIRE x${dmgX.toFixed(2)} dmg · x${rateX.toFixed(2)} rate · ${ws.count} shot${ws.count>1?'s':''}${ws.pierce?' · pierce':''}  |  ARMOR ${arm}%  ·  MAX HP ${player.maxhp}`, PX+24, slotY+78);

  // carried-item list (deduped with counts) — clipped, scrollable viewport
  const counts={}; for(const id of player.inventory) counts[id]=(counts[id]||0)+1;
  const ids=Object.keys(counts);
  ctx.font='bold 12px monospace'; ctx.fillStyle='#caa84a';
  ctx.fillText('CARRYING', PX+24, slotY+98);
  if(!ids.length){ ctx.fillStyle='#5a4f73'; ctx.font='italic 12px monospace';
    ctx.fillText('Your bag is empty. The firm has taken everything else.', PX+24, slotY+118); }
  const rx=PX+24, rw=PW-48, rh=40, rowH=rh+6;
  const showFooter = invSel && ITEMS[invSel];
  const vy0 = slotY+108, vy1 = PY+PH - (showFooter ? 56 : 14), vh = vy1-vy0;
  const contentH = ids.length*rowH;
  invScroll = Math.max(0, Math.min(invScroll, contentH - vh)); // clamp each frame
  ctx.save();
  ctx.beginPath(); ctx.rect(rx, vy0, rw, vh); ctx.clip();
  for(let i=0;i<ids.length;i++){
    const id=ids[i], it=ITEMS[id], ry=vy0 + i*rowH - invScroll;
    if(ry+rh < vy0 || ry > vy1) continue;           // skip rows scrolled out of view
    const equipped=Object.values(player.equip).includes(id);
    ctx.fillStyle = equipped ? '#2a2340' : '#161122';
    ctx.fillRect(rx,ry,rw,rh);
    if(equipped){ ctx.strokeStyle='#9be05e'; ctx.lineWidth=1; ctx.strokeRect(rx,ry,rw,rh); }
    drawSprite(SPR[it.spr], rx+24, ry+rh/2, 28);
    ctx.fillStyle='#e8e0f0'; ctx.font='bold 12px monospace';
    ctx.fillText(it.nm + (counts[id]>1?`  x${counts[id]}`:'') , rx+48, ry+16);
    ctx.fillStyle='#9b8fb5'; ctx.font='10px monospace';
    const tag = it.kind==='suit'?'SUIT':it.kind.toUpperCase();
    const action = equipped?'[ EQUIPPED — click to remove ]':it.kind==='consumable'?'[ click to USE ]':EQUIP_KINDS.includes(it.kind)?'[ click to EQUIP ]':'';
    ctx.fillText(tag+'   '+action, rx+48, ry+31);
    invRects.push({x:rx,y:ry,w:rw,h:rh,id});
  }
  ctx.restore();
  // scrollbar
  if(contentH > vh){
    const trackH=vh, thumbH=Math.max(24, trackH*vh/contentH), thumbY=vy0 + (invScroll/(contentH-vh))*(trackH-thumbH);
    ctx.fillStyle='#2a2340'; ctx.fillRect(rx+rw-5, vy0, 4, trackH);
    ctx.fillStyle='#caa84a'; ctx.fillRect(rx+rw-5, thumbY, 4, thumbH);
  }

  // selected-item description footer
  if(showFooter){
    const dy=PY+PH-50, dlines=wrap(ITEMS[invSel].ds, 92);
    ctx.fillStyle='#120e1c'; ctx.fillRect(PX+24, dy, PW-48, 42);
    ctx.fillStyle='#caa84a'; ctx.font='11px monospace';
    dlines.slice(0,2).forEach((l,i)=>ctx.fillText(l, PX+34, dy+17+i*16));
  }
}

// MATTERS tab: the live main matter + bespoke side quests + special (graph) quests
function questLogRows(){
  const rows = [];
  // 1) current main matter (skip the Act III display sentinel; that surfaces as a graph quest)
  const mq = QUESTS[questIdx];
  if(mq && !mq.act3 && questPhase!=='done'){
    rows.push({ name:`MATTER ${questIdx+1}: ${mq.name}`, line:questProgressText(), tag:'MAIN' });
  }
  // 2) bespoke side quests (same source the HUD uses), parsed into name/detail
  for(let s of sideQuestLines()){
    s = s.replace(/^\*\s*/,'');
    const ci = s.indexOf(':');
    rows.push({ name: ci>0 ? s.slice(0,ci) : 'Side matter',
                line: ci>0 ? s.slice(ci+1).trim() : s, tag:'SIDE' });
  }
  // 3) special / graph quests (Good Pens, Act III, P. Locke...)
  for(const q of qLogLines()) rows.push(q);
  return rows;
}
function drawQuestLog(PX,PY,PW,PH){
  ctx.font='11px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText('Open matters — your assignments, side work, and special business.', PX+24, PY+54);
  const rows = questLogRows();
  let ly = PY+82;
  if(!rows.length){
    ctx.fillStyle='#5a4f73'; ctx.font='italic 12px monospace';
    ctx.fillText('No open matters. Enjoy it while it lasts.', PX+24, ly);
    return;
  }
  const tagColor = { MAIN:'#5ec8f0', SIDE:'#9be05e', ACTIVE:'#9be05e', AVAILABLE:'#f0c75e', DONE:'#5a4f73' };
  for(const q of rows){
    if(ly > PY+PH-30) break;   // don't overflow the panel
    const wl = wrap(q.line, 84).slice(0,2);
    const rh = 24 + wl.length*13;
    ctx.fillStyle='#161122'; ctx.fillRect(PX+24, ly, PW-48, rh);
    ctx.fillStyle = q.tag==='DONE' ? '#5a4f73' : '#e8e0f0';
    ctx.font='bold 12px monospace';
    ctx.fillText(q.name, PX+36, ly+18);
    ctx.fillStyle = tagColor[q.tag]||'#9b8fb5'; ctx.font='9px monospace';
    ctx.fillText(q.tag, PX+PW-92, ly+18);
    ctx.fillStyle = q.tag==='DONE' ? '#4a4060' : '#9b8fb5'; ctx.font='10px monospace';
    wl.forEach((l,i)=>ctx.fillText(l, PX+36, ly+32+i*12));
    ly += rh + 6;
  }
}
