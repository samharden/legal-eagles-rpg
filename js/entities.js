"use strict";
// ============================== ENTITIES ==============================
// Rigs are live objects, so they never survive a save round-trip and the
// pre-placed enemies baked by buildWorlds() never had one. Attach on demand:
// loadWorld() sweeps the incoming roster, spawnEnemy() rigs its own.
function ensureRig(e){
  if(!(e.rig instanceof LEAnim.Rig)) e.rig = new LEAnim.Rig();
  return e.rig;
}

// A pop-number that dwells: ambient barks and narrative asides need to be
// readable, not flicked away at damage-number speed.
function bark(x, y, text, color, life){
  fx.number(x, y, text, color);
  const f = fx.floats[fx.floats.length-1];
  f.t = f.max = life || 2.4; f.vy = -10;
  return f;
}

function spawnEnemy(type, x, y, scale){
  const t = ENEMY_TYPES[type];
  let s = scale || 1;
  if(flags.ngplus) s *= 1.5;   // THE MERGER: the whole opposition re-papered, 50% angrier
  const e = { type, ...t, x, y, hp:t.hp*s, maxhp:t.hp*s, shotT: Math.random()*1.5, hurtT:0, wob:Math.random()*7 };
  if(s !== 1){ e.dmg = Math.round(t.dmg*(1+(s-1)*0.5)); e.xp = Math.round(t.xp*s); } // dmg scales gentler than hp
  e.rig = new LEAnim.Rig(); e.rig.spawn();
  enemies.push(e);
  if(t.boss) SFX.bossIntro();   // every boss gets a dread sting, wherever it spawns
}

function fire(atCursor){
  const c = weaponStats();
  if(player.cd > 0) return;
  player.cd = c.cd;
  // mouse fire aims at the cursor (world coords); key fire keeps 8-way facing
  if(atCursor && !IS_TOUCH && mouse.y < HUD_Y){
    const wx = mouse.x/ZOOM + cam.x, wy = mouse.y/ZOOM + cam.y;
    if(Math.hypot(wx-player.x, wy-player.y) > 4){
      const a = Math.atan2(wy-player.y, wx-player.x);
      player.face = { x:Math.cos(a), y:Math.sin(a) };   // turn into the shot
    }
  }
  if(orderActive && worldId==='courtroom' && !orderFired){
    orderFired = true;
    const p = findOpen(player.x, player.y, 180);
    spawnEnemy('bailiff', p.x, p.y);
    SFX.buzz();
    announce('CONTEMPT OF COURT. A bailiff is summoned from the clerk\'s office.', false, 3);
  }
  SFX.shoot(c.id);
  const ang = Math.atan2(player.face.y, player.face.x);
  fx.muzzle(player.x + player.face.x*18, player.y + player.face.y*18, ang, c.color);
  const mk = (a) => shots.push({
    x:player.x, y:player.y, vx:Math.cos(a)*c.speed, vy:Math.sin(a)*c.speed,
    dmg:c.dmg*dmgMult(), r:c.size, color:c.color, pierce:c.pierce, homing:c.special==='homing', life:1.6, hit:new Set()
  });
  if(c.special==='nova'){
    for(let i=0;i<c.count;i++) mk(i/c.count*Math.PI*2);
    fx.number(player.x, player.y-26, 'AUDIT!', c.color);
  } else if(c.special==='spread'){
    for(let i=0;i<c.count;i++) mk(ang + (i-(c.count-1)/2)*0.16);
  } else {
    mk(ang);
    if(c.id==='lit' && Math.random()<0.25)
      fx.number(player.x, player.y-26, 'OBJECTION!', c.color);
  }
}

function melee(){
  if(player.meleeCd > 0) return;
  player.meleeCd = 0.38; player.swingT = 0.18;
  player.rig.strike();
  const fdx = player.face.x, fdy = player.face.y;   // facing (NOT `fx` — that's the FX layer)
  const cx = player.x + fdx*34, cy = player.y + fdy*34;
  const base = 16 * dmgMult() * gearMul('meleeMul');
  const bossMul = gearMul('bossMul');   // Letter Opener: bites deepest into things that shouldn't exist
  const slow = gearHas('slow');
  let hit = false;
  for(const e of enemies){
    if(Math.hypot(e.x-cx, e.y-cy) < e.r + 28){
      let dmg = base * (e.boss ? bossMul : 1);
      if(perkHas('execute') && e.hp < e.maxhp*0.35) dmg *= 1.2;   // The Closer
      e.hp -= dmg; e.hurtT = 0.12; hit = true;
      ensureRig(e).hurt(fdx, fdy);
      if(slow){ e.slowT = 1.4; fx.number(e.x, e.y-e.r-18, 'STAMPED', '#5ec8f0'); }
      moveEntity(e, fdx*260, fdy*260, 0.06); // knockback, wall-aware
      fx.number(e.x, e.y-e.r-6, Math.round(dmg), e.boss&&bossMul>1?'#caa84a':'#fff');
      fx.spark(e.x, e.y, 3);
      fx.flash(e.x, e.y, 22);
    }
  }
  SFX.melee();
  if(hit){ fx.addTrauma(0.35); fx.stop(0.05); SFX.hit(); } // a connecting strike has weight
}

function spin(){
  if(player.spinCd > 0) return;
  player.spinCd = 6 * perkMul('spinCdMul'); player.spinT = 0.35;   // Motion Practice: granted faster
  player.rig.spin();
  fx.ring(player.x, player.y, '#f0c75e', 110, 0.4, 4);
  SFX.spin();
  const dmg = 24 * dmgMult();
  for(const e of enemies){
    const d = Math.hypot(e.x-player.x, e.y-player.y);
    if(d < 84 + e.r){
      e.hp -= dmg; e.hurtT = 0.15;
      ensureRig(e).hurt((e.x-player.x)/(d||1), (e.y-player.y)/(d||1));
      if(!e.boss) e.stunT = Math.max(e.stunT||0, 1.3); // Motion to Strike also stuns the room
      moveEntity(e, (e.x-player.x)/(d||1)*430, (e.y-player.y)/(d||1)*430, 0.08);
      fx.number(e.x, e.y-e.r-6, Math.round(dmg), '#f0c75e');
    }
  }
  enemyShots = enemyShots.filter(sh => Math.hypot(sh.x-player.x, sh.y-player.y) > 95);
  fx.number(player.x, player.y-32, 'MOTION TO STRIKE!', '#f0c75e', true);
  fx.addTrauma(0.3); fx.stop(0.06);
}

