"use strict";
// ============================== SAVE / LOAD ==============================
// Checkpoint save to localStorage. Only plain data goes in: world structure
// (grids, stairs, locked() closures) is rebuilt by buildWorlds() on load, and
// the save layers the mutable bits (enemies, gates, crates, flags...) on top.
const SAVE_KEY = 'legalEagles.save.v1';

function snapshotWorlds(){
  worlds[worldId].enemies = enemies; worlds[worldId].pickups = pickups; // fold live arrays back in, like setWorld does
  const out = {};
  for(const id in worlds){
    const w = worlds[id];
    out[id] = {
      enemies: w.enemies, pickups: w.pickups,
      crates: w.crates.map(c=>({tx:c.tx, ty:c.ty})),
      gates: Object.fromEntries(Object.entries(w.gates).map(([k,g])=>[k, g.open])),
      levers: w.levers.map(l=>l.on),
      plates: w.plates.map(p=>p.done),
      portraits: (w.portraits||[]).map(p=>p.seen),
    };
  }
  return out;
}

function saveGame(){
  if(!player || (state!=='play' && state!=='dialog')) return;
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      v: 2,
      genderId: player.spr.slice(2), classId: player.cls.id,
      player: { x:player.x, y:player.y, hp:player.hp, maxhp:player.maxhp, xp:player.xp, billables:player.billables, perks:player.perks },
      inventory: player.inventory, equip: player.equip, qstate,
      boardActive, boardOffers, boardSeq,
      worldId, questIdx, questPhase, killCount, collectCount, gameTime,
      flags, npcHidden: NPCS.map(n=>!!n.hidden),
      servers, cart, cartSpawnT, orderT, orderActive, orderFired,
      pendingSpawn: pendingSpawn ? { world: pendingSpawn.world, qid: pendingSpawn.q.id } : null,
      worlds: snapshotWorlds(),
    }));
  }catch(e){ /* storage full or unavailable (private mode) — play on without saving */ }
}

function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(e){} }

function readSave(){
  try{
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if(d && (d.v===1 || d.v===2) && d.worlds && d.worlds[d.worldId]
       && GENDERS.some(g=>g.id===d.genderId) && CLASSES.some(c=>c.id===d.classId)
       && QUESTS[d.questIdx]) return d;
  }catch(e){}
  return null;
}

function loadGame(){
  const d = readSave();
  if(!d){ clearSave(); return false; }
  try{
    startGame(d.genderId, d.classId);   // clean baseline: worlds, flags, NPCs, quest state
    dlg = null; state = 'play';         // skip the intro memo
    Object.assign(player, d.player);
    player.rank = rankFor(player.xp);
    // perks: sanitize; older saves have none and collect their banked picks retroactively
    player.perks = Array.isArray(player.perks) ? player.perks.filter(id => PERKS.some(p=>p.id===id)) : [];
    Object.assign(flags, d.flags);      // merge so flags added in future versions keep their defaults
    // inventory + equipment (v2); migrate from v1 flags otherwise
    if(d.v>=2 && d.inventory){
      player.inventory = d.inventory.filter(id=>ITEMS[id]);
      player.equip = { weapon:null, accessory:null, suit:null, ...(d.equip||{}) };
    } else {
      if(flags.hasStamper)  player.inventory.push('bates_stamper');
      if(flags.hasKey)      player.inventory.push('brass_key');
      if(flags.hasValetKey) player.inventory.push('valet_key');
      if(flags.coffeeUp)    player.inventory.push('espresso_rig');
    }
    recalcMaxHP();
    qRestore(d.qstate);                 // graph-quest progress (defaults if absent)
    boardActive = d.boardActive || null; boardSeq = d.boardSeq || 0;   // assignment board
    boardOffers = (d.boardOffers && d.boardOffers.length) ? d.boardOffers : (refreshBoard(), boardOffers);
    questIdx = d.questIdx; questPhase = d.questPhase;
    killCount = d.killCount|0; collectCount = d.collectCount|0;
    gameTime = d.gameTime || 0;
    NPCS.forEach((n,i)=>{ n.hidden = !!(d.npcHidden && d.npcHidden[i]); });
    servers = d.servers || [];
    cart = d.cart || null; cartSpawnT = d.cartSpawnT || 0;
    orderT = d.orderT ?? 6; orderActive = !!d.orderActive; orderFired = !!d.orderFired;
    pendingSpawn = null;
    if(d.pendingSpawn){
      const q = QUESTS.find(q=>q.id===d.pendingSpawn.qid);
      if(q) pendingSpawn = { world: d.pendingSpawn.world, q };
    }
    for(const id in worlds){
      const w = worlds[id], s = d.worlds[id]; if(!s) continue;
      w.enemies = s.enemies || []; w.pickups = s.pickups || [];
      (s.crates||[]).forEach((c,i)=>{ if(w.crates[i]){ w.crates[i].tx=c.tx; w.crates[i].ty=c.ty; } });
      for(const k in (s.gates||{})) if(w.gates[k]) w.gates[k].open = !!s.gates[k];
      (s.levers||[]).forEach((on,i)=>{ if(w.levers[i]) w.levers[i].on = !!on; });
      (s.plates||[]).forEach((done,i)=>{ if(w.plates[i]) w.plates[i].done = !!done; });
      (s.portraits||[]).forEach((seen,i)=>{ if(w.portraits && w.portraits[i]) w.portraits[i].seen = !!seen; });
    }
    loadWorld(d.worldId);
    if(flags.chadAlly) allies = [{ x:player.x+34, y:player.y, r:14, spr:'chad', cd:1 }];
    announce('CASE FILE RESTORED. The firm never forgets.', false, 3.5);
    return true;
  }catch(e){
    clearSave();
    return false;
  }
}

// autosave: every 10s of play, plus on tab close / hide
setInterval(()=>{ if(state==='play' && !dlg) saveGame(); }, 10000);
window.addEventListener('beforeunload', saveGame);
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') saveGame(); });

