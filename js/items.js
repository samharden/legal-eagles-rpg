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
    ds:'Prudence Locke vanished at 11:59 p.m., technically compliant. Her letter opener remembers the cut. Briefcase strikes bite far deeper.',
    mods:{ meleeMul:1.8 },
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
};

// ---- inventory state ----
let invOpen = false, invSel = null, invRects = [], invTab = 'items';

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

function equipItem(id){
  const it = ITEMS[id]; if(!it || (it.kind!=='weapon' && it.kind!=='accessory')) return;
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
// accessory passive lookup
function accMod(key, fallback){
  const a = player.equip && ITEMS[player.equip.accessory];
  return (a && a.mods && a.mods[key]!=null) ? a.mods[key] : fallback;
}
function recalcMaxHP(){
  if(!player) return;
  player.maxhp = player.rank.hp + accMod('maxhpAdd',0);
  if(player.hp > player.maxhp) player.hp = player.maxhp;
}

// ---- inventory UI (drawn over the frozen world while invOpen) ----
function toggleInventory(){
  if(state!=='play') return;
  invOpen = !invOpen;
  if(invOpen){ for(const k in keys) keys[k]=false; } // drop held movement so you don't drift while paused
  SFX.blip();
}
function inventoryClick(x, y){
  for(const r of invRects){
    if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h){
      if(r.act==='close'){ toggleInventory(); return; }
      if(r.act==='tab'){ invTab = r.tab; SFX.blip(); return; }
      if(!r.id) return;
      const it = ITEMS[r.id];
      if(it.kind==='consumable') useConsumable(r.id);
      else if(it.kind==='weapon'||it.kind==='accessory') equipItem(r.id);
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

  // equip slots
  const slotY=PY+78;
  const drawSlot=(label, slot, sx)=>{
    ctx.fillStyle='#9b8fb5'; ctx.font='10px monospace';
    ctx.fillText(label, sx, slotY-6);
    ctx.fillStyle='#120e1c'; ctx.fillRect(sx, slotY, 250, 56);
    ctx.strokeStyle='#4a3f63'; ctx.lineWidth=1; ctx.strokeRect(sx, slotY, 250, 56);
    const id=player.equip[slot];
    if(id){ drawSprite(SPR[ITEMS[id].spr], sx+30, slotY+28, 40);
      ctx.fillStyle='#e8e0f0'; ctx.font='12px monospace'; ctx.fillText(ITEMS[id].nm, sx+58, slotY+32); }
    else { ctx.fillStyle='#5a4f73'; ctx.font='italic 12px monospace'; ctx.fillText('— empty —', sx+20, slotY+32); }
  };
  drawSlot('WEAPON MOD', 'weapon', PX+24);
  drawSlot('ACCESSORY', 'accessory', PX+300);

  // carried-item list (deduped with counts)
  const counts={}; for(const id of player.inventory) counts[id]=(counts[id]||0)+1;
  const ids=Object.keys(counts);
  let ly=slotY+96;
  ctx.font='bold 12px monospace'; ctx.fillStyle='#caa84a';
  ctx.fillText('CARRYING', PX+24, ly); ly+=14;
  if(!ids.length){ ctx.fillStyle='#5a4f73'; ctx.font='italic 12px monospace';
    ctx.fillText('Your bag is empty. The firm has taken everything else.', PX+24, ly+8); }
  for(const id of ids){
    const it=ITEMS[id], rh=40, rx=PX+24, rw=PW-48;
    const equipped=(player.equip.weapon===id||player.equip.accessory===id);
    ctx.fillStyle = equipped ? '#2a2340' : '#161122';
    ctx.fillRect(rx,ly,rw,rh);
    if(equipped){ ctx.strokeStyle='#9be05e'; ctx.lineWidth=1; ctx.strokeRect(rx,ly,rw,rh); }
    drawSprite(SPR[it.spr], rx+24, ly+rh/2, 28);
    ctx.fillStyle='#e8e0f0'; ctx.font='bold 12px monospace';
    ctx.fillText(it.nm + (counts[id]>1?`  x${counts[id]}`:'') , rx+48, ly+16);
    ctx.fillStyle='#9b8fb5'; ctx.font='10px monospace';
    const tag = it.kind==='weapon'?'WEAPON':it.kind==='accessory'?'ACCESSORY':it.kind==='consumable'?'CONSUMABLE':it.kind.toUpperCase();
    const action = equipped?'[ EQUIPPED — click to remove ]':it.kind==='consumable'?'[ click to USE ]':(it.kind==='weapon'||it.kind==='accessory')?'[ click to EQUIP ]':'';
    ctx.fillText(tag+'   '+action, rx+48, ly+31);
    invRects.push({x:rx,y:ly,w:rw,h:rh,id});
    ly+=rh+6;
  }

  // selected-item description footer
  if(invSel && ITEMS[invSel]){
    const dy=PY+PH-58, dlines=wrap(ITEMS[invSel].ds, 92);
    ctx.fillStyle='#120e1c'; ctx.fillRect(PX+24, dy, PW-48, 44);
    ctx.fillStyle='#caa84a'; ctx.font='11px monospace';
    dlines.slice(0,2).forEach((l,i)=>ctx.fillText(l, PX+34, dy+18+i*16));
  }
}

// MATTERS tab: special (graph) quests, separate from the main Hargrove matter line
function drawQuestLog(PX,PY,PW,PH){
  ctx.font='11px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText('Special matters — side work beyond Hargrove\'s assignments.', PX+24, PY+54);
  const lines = qLogLines();
  let ly = PY+86;
  if(!lines.length){
    ctx.fillStyle='#5a4f73'; ctx.font='italic 12px monospace';
    ctx.fillText('No special matters yet. Word travels. Something will surface.', PX+24, ly);
    return;
  }
  const tagColor = { ACTIVE:'#9be05e', AVAILABLE:'#f0c75e', DONE:'#5a4f73' };
  for(const q of lines){
    ctx.fillStyle='#161122'; ctx.fillRect(PX+24, ly, PW-48, 50);
    ctx.fillStyle = q.tag==='DONE' ? '#5a4f73' : '#e8e0f0';
    ctx.font='bold 13px monospace';
    ctx.fillText(q.name, PX+36, ly+20);
    ctx.fillStyle = tagColor[q.tag]||'#9b8fb5'; ctx.font='9px monospace';
    ctx.fillText(q.tag, PX+PW-90, ly+20);
    ctx.fillStyle = q.tag==='DONE' ? '#4a4060' : '#9b8fb5'; ctx.font='10px monospace';
    wrap(q.line, 88).slice(0,2).forEach((l,i)=>ctx.fillText(l, PX+36, ly+36+i*12));
    ly += 58;
  }
}
