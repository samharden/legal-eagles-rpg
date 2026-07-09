"use strict";
// ============================== QUESTS ==============================
function doQuestSpawns(q){
  // spawn enemies scattered around the current map, away from the player
  for(const [type, n] of q.spawn){
    for(let i=0;i<n;i++){
      let p;
      do { p = findOpen(MAPW*TILE/2, MAPH*TILE/2, MAPW*TILE/2); }
      while(Math.hypot(p.x-player.x, p.y-player.y) < 260);
      spawnEnemy(type, p.x, p.y);
    }
  }
  if(q.goal.items){
    for(let i=0;i<q.goal.items;i++){
      const p = findOpen(MAPW*TILE/2, MAPH*TILE/2, MAPW*TILE/2);
      pickups.push({ x:p.x, y:p.y, spr:q.itemSpr||'file', kind:'file', label:q.itemLabel, t:0 });
    }
  }
}
function relockAnnex(){
  const w = worlds.annex;
  for(const k in w.gates) w.gates[k].open = false;
  w.plates.forEach(p=>p.done=false);
  w.levers.forEach(l=>l.on=false); w.leverProgress = 0;
  w.crates.forEach(c=>{ c.tx=c.ox; c.ty=c.oy; });
}
function acceptQuest(){
  const q = QUESTS[questIdx];
  questPhase = 'active'; killCount = 0; collectCount = 0;
  SFX.quest();
  if(questIdx === 5){ announce(`MATTER: ${q.name}`, true, 3.2); return; } // the finale spawns via the Graves confrontation
  if(q.relock) relockAnnex();
  const tw = q.world || 'office';
  if(tw === worldId){
    announce(`MATTER: ${q.name}`, true, 3.2);
    doQuestSpawns(q);
  } else {
    pendingSpawn = { world: tw, q };
    announce(`MATTER: ${q.name} — proceed to ${WORLD_NAME[tw]}`, true, 4);
  }
  saveGame();
}
function questGoalMet(){
  const q = QUESTS[questIdx];
  if(q.goal.type==='kill') return killCount >= q.goal.n;
  return killCount >= q.goal.n && collectCount >= q.goal.items;
}
function questProgressText(){
  const q = QUESTS[questIdx];
  if(q.act3 || questPhase==='done') return 'See your MATTERS [I] — special business below the annex';
  const giverNm = (WHO[questGiver()] || WHO.hargrove).nm;
  if(questPhase==='get') return `See ${giverNm} (press E)`;
  if(questPhase==='turnin') return `Report back to ${giverNm}`;
  const e = ENEMY_TYPES[q.goal.enemy];
  let s = `${e.nm}: ${Math.min(killCount,q.goal.n)}/${q.goal.n}`;
  if(q.goal.items) s += `  •  Files: ${collectCount}/${q.goal.items}`;
  return s;
}


function gainXP(n){
  player.xp += n;
  floaters.push({ x:player.x, y:player.y-22, text:`+${n} XP`, t:1.2, color:'#f0c75e' });
  const nr = rankFor(player.xp);
  if(nr.lvl > player.rank.lvl){
    player.rank = nr;
    player.maxhp = nr.hp + gearSum('maxhpAdd');
    player.hp = player.maxhp;
    levelFlash = 2.5;
    SFX.promote();
    announce(`PROMOTED: ${nr.title.toUpperCase()} — ${nr.quip}`, true, 4);
    // promotion bonus: +10% damage per level via lvl multiplier (applied at shot time)
  }
}
const dmgMult = () => (1 + (player.rank.lvl-1)*0.10) * gearMul('dmgMul')
  * (perkHas('stand') && player.standT > 1 ? 1.25 : 1);   // Stare Decisis: precedent rewards patience

// Billable Hours — the firm's currency (distinct from XP/rank). Quiet on kills
// (the HUD counter updates); a floater on quest/board payouts.
function gainBillables(n, quiet){
  if(!player || n<=0) return;
  n = Math.round(n * perkMul('bhMul'));   // Rainmaker: the work finds you
  player.billables += n;
  flags.totalBilled = (flags.totalBilled||0) + n;   // lifetime hours, for the performance review

  if(!quiet) floaters.push({ x:player.x, y:player.y-12, text:`+${n} hrs billed`, t:1.2, color:'#caa84a' });
}
const fmtBH = n => (n||0).toLocaleString('en-US');

