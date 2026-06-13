"use strict";
// ============================== ENTITIES ==============================
function spawnEnemy(type, x, y){
  const t = ENEMY_TYPES[type];
  enemies.push({ type, ...t, x, y, hp:t.hp, maxhp:t.hp, shotT: Math.random()*1.5, hurtT:0, wob:Math.random()*7 });
}

function fire(){
  const c = weaponStats();
  if(player.cd > 0) return;
  player.cd = c.cd;
  if(orderActive && worldId==='courtroom' && !orderFired){
    orderFired = true;
    const p = findOpen(player.x, player.y, 180);
    spawnEnemy('bailiff', p.x, p.y);
    SFX.buzz();
    announce('CONTEMPT OF COURT. A bailiff is summoned from the clerk\'s office.', false, 3);
  }
  SFX.shoot(c.id);
  const ang = Math.atan2(player.face.y, player.face.x);
  const mk = (a) => shots.push({
    x:player.x, y:player.y, vx:Math.cos(a)*c.speed, vy:Math.sin(a)*c.speed,
    dmg:c.dmg*dmgMult(), r:c.size, color:c.color, pierce:c.pierce, homing:c.special==='homing', life:1.6, hit:new Set()
  });
  if(c.special==='nova'){
    for(let i=0;i<c.count;i++) mk(i/c.count*Math.PI*2);
    floaters.push({ x:player.x, y:player.y-26, text:'AUDIT!', t:0.7, color:c.color });
  } else if(c.special==='spread'){
    for(let i=0;i<c.count;i++) mk(ang + (i-(c.count-1)/2)*0.16);
  } else {
    mk(ang);
    if(c.id==='lit' && Math.random()<0.25)
      floaters.push({ x:player.x, y:player.y-26, text:'OBJECTION!', t:0.7, color:c.color });
  }
}

function melee(){
  if(player.meleeCd > 0) return;
  player.meleeCd = 0.38; player.swingT = 0.18;
  const fx = player.face.x, fy = player.face.y;
  const cx = player.x + fx*34, cy = player.y + fy*34;
  const base = 16 * dmgMult() * accMod('meleeMul', 1);
  const bossMul = accMod('bossMul', 1);   // Letter Opener: bites deepest into things that shouldn't exist
  const slow = accMod('slow', false);
  let hit = false;
  for(const e of enemies){
    if(Math.hypot(e.x-cx, e.y-cy) < e.r + 28){
      const dmg = base * (e.boss ? bossMul : 1);
      e.hp -= dmg; e.hurtT = 0.12; hit = true;
      if(slow){ e.slowT = 1.4; floaters.push({ x:e.x, y:e.y-e.r-18, text:'STAMPED', t:0.6, color:'#5ec8f0' }); }
      moveEntity(e, fx*260, fy*260, 0.06); // knockback, wall-aware
      floaters.push({ x:e.x, y:e.y-e.r-6, text:Math.round(dmg), t:0.6, color: e.boss&&bossMul>1?'#caa84a':'#fff' });
    }
  }
  SFX.melee();
  if(hit){ shake = Math.max(shake, 3); SFX.hit(); }
}

function spin(){
  if(player.spinCd > 0) return;
  player.spinCd = 6; player.spinT = 0.35;
  SFX.spin();
  const dmg = 24 * dmgMult();
  for(const e of enemies){
    const d = Math.hypot(e.x-player.x, e.y-player.y);
    if(d < 84 + e.r){
      e.hp -= dmg; e.hurtT = 0.15;
      moveEntity(e, (e.x-player.x)/(d||1)*430, (e.y-player.y)/(d||1)*430, 0.08);
      floaters.push({ x:e.x, y:e.y-e.r-6, text:Math.round(dmg), t:0.6, color:'#f0c75e' });
    }
  }
  enemyShots = enemyShots.filter(sh => Math.hypot(sh.x-player.x, sh.y-player.y) > 95);
  floaters.push({ x:player.x, y:player.y-32, text:'MOTION TO STRIKE!', t:0.9, color:'#f0c75e' });
  shake = Math.max(shake, 6);
}

