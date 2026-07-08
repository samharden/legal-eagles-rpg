"use strict";
// ============================== UPDATE ==============================
function moveEntity(e, vx, vy, dt){
  const nx = e.x + vx*dt, ny = e.y + vy*dt;
  if(!collides(nx, e.y, e.r)) e.x = nx;
  if(!collides(e.x, ny, e.r)) e.y = ny;
}

function eShot(e, a, sp, r, color){
  enemyShots.push({ x:e.x, y:e.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, dmg:e.dmg, r:r||6, life:2.5, color });
}
// Boss firing patterns — chosen by the active phase's `pattern`. Radial patterns
// (ring/spiral) ignore aim; spread/aimed3 fire along the telegraphed angle e.aimA.
// Each pattern has its own shot color so a phase change reads mid-fight.
function bossFire(e){
  const base = e.aimA||0, P = e.pattern||'spread';
  if(P==='ring'){              // full radial wall — circle out of it
    const n=14; for(let i=0;i<n;i++) eShot(e, i/n*Math.PI*2, 200, 7, '#ff9bb0');
  } else if(P==='spiral'){     // rotating arms — keep moving to thread them
    e.spiralA=(e.spiralA||0)+0.5;
    for(let i=0;i<3;i++) eShot(e, e.spiralA + i*(Math.PI*2/3), 215, 6, '#c58cff');
  } else if(P==='aimed3'){     // tight fast triple straight at you
    for(let i=0;i<3;i++) eShot(e, base+(i-1)*0.10, 320, 6, '#ffb35e');
  } else {                     // 'spread' — the classic wide triple
    for(let i=0;i<3;i++) eShot(e, base+(i-1)*0.22, 260, 6);
  }
}

function update(dt){
  gameTime += dt;
  qTick();
  if(msg.t>0) msg.t -= dt;
  if(levelFlash>0) levelFlash -= dt;
  if(shake>0) shake -= dt*40;

  // player movement
  let dx=0, dy=0;
  if(keys['w']||keys['arrowup']) dy--;
  if(keys['s']||keys['arrowdown']) dy++;
  if(keys['a']||keys['arrowleft']) dx--;
  if(keys['d']||keys['arrowright']) dx++;
  if(!dx && !dy && joy.on && Math.hypot(joy.dx, joy.dy) > 0.25){ dx = joy.dx; dy = joy.dy; }
  player.moving = !!(dx||dy);   // Decaf Gremlins rage when you hold still
  // DASH — Motion to Expedite: a committed ~140px burst (Shift / DASH button) that
  // phases through projectiles while it lasts; contact damage still applies, so it
  // dodges the telegraphed shot, not the bailiff parked on top of you.
  player.dashCd -= dt;
  if(player.dashT > 0){
    player.dashT -= dt;
    moveEntity(player, player.dashDx*880, player.dashDy*880, dt);
    player.face = { x:player.dashDx, y:player.dashDy };
    player.moving = true;
    particles.push({ x:player.x, y:player.y, vx:-player.dashDx*60, vy:-player.dashDy*60, t:0.18, spr:'spark' });
  } else if(keys['shift'] && player.dashCd <= 0){
    const l = Math.hypot(dx,dy);   // dash along held input; standing still dashes where you face
    player.dashDx = l ? dx/l : player.face.x;
    player.dashDy = l ? dy/l : player.face.y;
    player.dashT = 0.16; player.dashCd = 1.6;
    SFX.dash();
  } else if(dx||dy){ const l=Math.hypot(dx,dy); moveEntity(player, dx/l*220, dy/l*220, dt);
    if(!padAim) player.face = {x:dx/l, y:dy/l}; }   // right-stick aim outranks run direction
  player.pushCd = (player.pushCd||0) - dt;
  if((dx||dy) && player.pushCd <= 0){
    if(dx && tryPush(Math.sign(dx),0)) player.pushCd = 0.22;
    else if(dy && tryPush(0,Math.sign(dy))) player.pushCd = 0.22;
  }
  player.cd -= dt;
  player.meleeCd -= dt; player.spinCd -= dt;
  if(player.swingT>0) player.swingT -= dt;
  if(player.spinT>0) player.spinT -= dt;
  if(player.hurtT>0) player.hurtT -= dt;
  if(player.coffeeCd>0) player.coffeeCd -= dt;
  if(player.shieldT>0) player.shieldT -= dt;   // Retainer: temporary damage immunity
  if(keys[' '] || keys['j']) melee();
  if(keys['k'] || mouse.down) fire(mouse.down);
  if(keys['l']) spin();

  // camera
  cam.x = Math.max(0, Math.min(MAPW*TILE - VW, player.x - VW/2));
  cam.y = Math.max(0, Math.min(MAPH*TILE - VH, player.y - VH/2));

  // E interactions
  if(keys['e']){
    keys['e'] = false;
    let used = false;
    // portraits outrank NPCs (Dolores stands within talk range of the middle frames);
    // frames hang 40px apart, so always pick the nearest one in range
    if(worldId==='office'){
      let pt = null, ptD = 60;
      for(const p of worlds.office.portraits){
        const d = Math.hypot(player.x-(p.tx*TILE+20), player.y-(p.ty*TILE+20));
        if(d < ptD){ ptD = d; pt = p; }
      }
      if(pt){
        startDialog([{nm:'PORTRAIT', spr:'portrait', text:pt.text}]);
        if(!pt.seen){
          pt.seen = true; flags.portraits++;
          gainXP(5);
          if(flags.portraits === 11){
            flags.eleven = true;
            announce('Eleven portraits. Eleven managing partners. All by the same artist. All facing the corner office. Dolores would know more.', false, 6);
          }
        }
        used = true;
      }
    }
    if(!used && worldId==='office') for(const n of NPCS){
      if(n.hidden) continue;
      if(Math.hypot(player.x-n.x, player.y-n.y) < 70){ talkTo(n); used = true; break; }
    }
    if(!used && worldId==='office') for(const sv of servers){
      if(!sv.done && Math.hypot(player.x-sv.x, player.y-sv.y) < 64){
        sv.done = true; flags.serversFixed++;
        SFX.hit(); SFX.lever();
        announce('PERCUSSIVE REBOOT SUCCESSFUL. The server forgives you. The interns do not.', false, 3.5);
        for(let i=0;i<2;i++){ const p = findOpen(sv.x, sv.y, 110); spawnEnemy('intern', p.x, p.y); }
        used = true; break;
      }
    }
    const nearT = o => Math.hypot(player.x-(o.tx*TILE+20), player.y-(o.ty*TILE+20)) < 60;
    if(!used) for(const lv of worlds[worldId].levers){ if(nearT(lv)){ pullLever(lv); used = true; break; } }
    if(!used && worldId==='floor24' && Math.hypot(player.x-(31*TILE+20), player.y-(22*TILE+20)) < 70){
      player.hp = Math.max(1, player.hp - 15);
      SFX.buzz();
      announce('You drink from the enemy machine. It is DECAF. (-15 Billable Energy) You feel betrayal, then sleepy.', false, 3.5);
      used = true;
    }
    if(!used && worldId==='annex'){
      const w = worlds.annex;
      if(w.recall && nearT(w.recall)){ resetCrates(); used = true; }
      if(!used && !w.gates.g3.open && Math.hypot(player.x-25*TILE, player.y-14.5*TILE) < 80){
        if(flags.hasKey){ w.gates.g3.open = true; SFX.gate(); announce('The brass key turns. The Vault of Misfiled Things exhales forty years of dust.', false, 4); }
        else announce('Locked. A brass keyhole, dusty with judgment.', false, 3);
        used = true;
      }
    }
    if(!used && worldId==='vault'){
      const lk = worlds.vault.locke;
      if(Math.hypot(player.x-(lk.tx*TILE+20), player.y-(lk.ty*TILE+20)) < 64){ talkLocke(); used = true; }
    }
    if(!used && worldId==='garage' && !worlds.garage.gates.g1.open
       && Math.hypot(player.x-(26*TILE+20), player.y-12*TILE) < 80){
      if(flags.hasValetKey){
        worlds.garage.gates.g1.open = true;
        SFX.gate();
        tone({f:60, f2:30, type:'sawtooth', t:1.2, vol:0.25}); // something old exhales
        spawnEnemy('grandfather', 31*TILE+20, 12*TILE+20);
        announce('The valet cage swings open. Cigar smoke gathers into a shape behind the partner sedans. "Billables aren\'t everything, associate. They\'re the ONLY thing."', false, 5.5);
        shake = Math.max(shake, 10);
      } else announce('A valet cage, padlocked. A small brass plate: KEY WITH VALET. Below it, engraved: W. A Worthington might still have it.', false, 3.5);
      used = true;
    }
    if(!used) for(const sg of worlds[worldId].signs){
      if(nearT(sg)){ startDialog([{nm:'FADED SIGN', spr:'sign', text:sg.text}]); used = true; break; }
    }
    if(!used) for(const st of worlds[worldId].stairs){
      if(nearT(st)){
        if(st.locked && st.locked()){ announce(st.lockMsg, false, 3.5); used = true; break; }
        setWorld(st.to, st.dx, st.dy);
        SFX.stairs();
        announce(WORLD_GREET[st.to], false, 4);
        used = true; break;
      }
    }
    if(!used && worldId==='office' && worlds.office.vendor){
      const v = worlds.office.vendor;
      if(Math.hypot(player.x-(v.tx*TILE+20), player.y-(v.ty*TILE+20)) < 64){ toggleShop(); used = true; }
    }
    if(!used && worldId==='office' && worlds.office.board){
      const b = worlds.office.board;
      if(Math.hypot(player.x-(b.tx*TILE+20), player.y-(b.ty*TILE+20)) < 64){ talkBoard(); used = true; }
    }
    if(!used && worldId==='office' && worlds.office.printer){
      const pr = worlds.office.printer;
      if(Math.hypot(player.x-(pr.tx*TILE+20), player.y-(pr.ty*TILE+20)) < 64){
        const st = qstate.printer_jam;
        if(st && st.status==='available') qStartQuest('printer_jam');
        else if(st && st.status==='active') announce('The printer is mid-reboot — hold the line! Clear the jams.', false, 3);
        else if(st && st.status==='done') announce('The printer purrs. It prints only for you now. PC LOAD LETTER, affectionately.', false, 3);
        else announce('A dormant printer, toner light blinking. It might matter more once you have a few matters under your belt.', false, 3.5);
        used = true;
      }
    }
    // desk workstations — last in the chain so named stations always win the press
    if(!used){
      const term = nearTerminal();
      if(term){ SFX.blip(); readTerminal(term.tx, term.ty); used = true; }
    }
    if(!used && worldId==='office' && Math.hypot(player.x-COFFEE.x, player.y-COFFEE.y) < 70){
      if(flags.coffeeQ===1){
        const parts = (flags.partDescaler?1:0)+(flags.partElement?1:0)+(flags.partChad?1:0);
        if(parts >= 3){
          flags.coffeeQ = 2; flags.coffeeUp = true; gainXP(50);
          giveItem('espresso_rig', true);
          SFX.promote();
          announce('REBUILT. The machine roars to life with unsettling enthusiasm. Output: WEAPONIZED ESPRESSO RIG — equip it from your bag [I]. (+60 energy, faster brew)', false, 5.5);
        } else if(flags.coffeeBrief){
          const need = [];
          if(!flags.partDescaler) need.push('descaling solution (annex)');
          if(!flags.partElement) need.push('heating element (garage P3)');
          if(!flags.partChad) need.push('portafilter (Chad)');
          announce(`Still dead. Parts: ${parts}/3. Missing: ${need.join(', ')}.`, false, 3.5);
        } else announce('The machine is cold and silent. Benny (IT) might know what to do.', false, 3);
      } else if(flags.coffeeQ===0 && questIdx>=2){
        flags.coffeeQ = 1;
        SFX.buzz();
        announce('The machine emits one final, heartbreaking gurgle and DIES. The productivity of four hundred lawyers dies with it. Benny (IT) fixes things... percussively.', false, 5);
      } else if(player.coffeeCd<=0){
        const heal = flags.coffeeUp ? 60 : 40;
        player.hp = Math.min(player.maxhp, player.hp + heal);
        player.coffeeCd = flags.coffeeUp ? 6 : 12;
        floaters.push({ x:player.x, y:player.y-22, text:`+${heal} CAFFEINE`, t:1, color:'#9be05e' });
        SFX.coffee();
        announce(flags.coffeeUp ? 'The rebuilt machine produces something between espresso and a legal threat. (+60 Billable Energy)'
                                : 'You drink the firm coffee. It tastes like deadlines and regret. (+40 Billable Energy)', false, 3);
      } else announce('The coffee machine is "descaling." Classic.', false, 2.5);
    }
  }

  // quest completion check
  if(questPhase==='active' && questGoalMet()){
    questPhase='turnin';
    const giverNm = (WHO[questGiver()] || WHO.hargrove).nm;
    announce(`Objective complete! Report back to ${giverNm}. Try to look busy on the way.`, false, 4);
  }

  // mail-cart escort
  if(cart && worldId==='office'){
    const wp = CART_WP[cart.wp];
    if(wp){
      const txp = wp[0]*TILE+20, typ = wp[1]*TILE+20;
      const d = Math.hypot(txp-cart.x, typ-cart.y);
      if(d < 5) cart.wp++;
      else { cart.x += (txp-cart.x)/d*55*dt; cart.y += (typ-cart.y)/d*55*dt; }
    } else {
      flags.mailQ = 2; cart = null; gainXP(40);
      SFX.quest();
      announce('SPECIAL DELIVERY COMPLETE. Hargrove accepts forty years of mail without blinking. Report to Rosa.', false, 5);
    }
    if(cart){
      cartSpawnT -= dt;
      if(cartSpawnT <= 0){
        cartSpawnT = 8;
        if(enemies.length < 10){
          for(let i=0;i<2;i++){ const p = findOpen(cart.x, cart.y, 240); spawnEnemy('wraith', p.x, p.y); }
          announce('Unbilled hours converge on the cart!', false, 2.5);
        }
      }
      if(cart.hp <= 0){
        for(let i=0;i<20;i++) particles.push({ x:cart.x, y:cart.y, vx:(Math.random()*2-1)*180, vy:(Math.random()*2-1)*180, t:0.5+Math.random()*0.4, spr:'paper' });
        cart = null; flags.mailQ = 0; flags.mailFailed = true;
        SFX.crash();
        announce('The mail cart is DOWN. Envelopes everywhere. Rosa felt that from the mailroom.', false, 4.5);
      }
    }
  }

  // the trial (Q9): waves of witnesses fill the jury box, then Bane takes the bench
  if(worldId==='courtroom' && questIdx===8 && questPhase==='active'){
    if(!flags.baneSpawned && enemies.length===0){
      if(flags.trialWave < 3){
        flags.trialWave++;
        flags.jury = (flags.trialWave-1)*4;
        const waves = [
          [['bailiff',2],['assoc',2]],
          [['bailiff',3],['assoc',2],['gremlin',2]],
          [['bailiff',3],['assoc',3],['counsel',2]],
        ];
        for(const [t,n] of waves[flags.trialWave-1]) for(let i=0;i<n;i++){
          let p;
          do { p = findOpen(15*TILE, 9*TILE, 300); }
          while(Math.hypot(p.x-player.x, p.y-player.y) < 180);
          spawnEnemy(t, p.x, p.y);
        }
        SFX.quest();
        announce(`THE COURT CALLS ITS ${['FIRST','SECOND','THIRD'][flags.trialWave-1]} WAVE OF WITNESSES`, true, 3);
      } else {
        flags.baneSpawned = true; flags.jury = 12;
        spawnEnemy('bane', 15*TILE, 5*TILE);
        const b = enemies[enemies.length-1];
        let mult = 1, edge = '';
        if(flags.baneWeak){ mult *= 0.65; edge += ' You cite 12 Yale L.J. 404 (1959). He flinches, structurally.'; }
        if(flags.lore >= 7){ mult *= 0.75; edge += ' Seven files of evidence burn in your briefcase.'; }
        b.hp = b.maxhp * mult;
        SFX.boom(); shake = Math.max(shake, 12);
        announce('BANE TAKES THE BENCH. "Forty years on this docket, counselor. Overruled — ALL of it."' + edge, false, 6);
      }
    }
    // ORDER IN THE COURT — fire during it and be sanctioned
    orderT -= dt;
    if(orderActive){
      if(orderT <= 0){ orderActive = false; orderFired = false; orderT = 11 + Math.random()*5; }
    } else if(orderT <= 0 && enemies.length > 0){
      orderActive = true; orderT = 2.4;
      SFX.gate();
      announce('ORDER IN THE COURT — HOLD YOUR FIRE', true, 2.4);
    }
  } else orderActive = false;

  // shots
  for(const s of shots){
    if(s.homing){
      let best=null, bd=240;
      for(const e of enemies){ const d=Math.hypot(e.x-s.x,e.y-s.y); if(d<bd){bd=d;best=e;} }
      if(best){
        const a=Math.atan2(best.y-s.y,best.x-s.x), cur=Math.atan2(s.vy,s.vx);
        let da=a-cur; while(da>Math.PI)da-=Math.PI*2; while(da<-Math.PI)da+=Math.PI*2;
        const na=cur+Math.max(-4*dt,Math.min(4*dt,da)), sp=Math.hypot(s.vx,s.vy);
        s.vx=Math.cos(na)*sp; s.vy=Math.sin(na)*sp;
      }
    }
    s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt;
    if(blockedShot(s.x,s.y)) s.life = 0;
  }
  shots = shots.filter(s=>s.life>0);

  // enemy shots
  for(const s of enemyShots){
    s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt;
    if(blockedShot(s.x,s.y)) s.life=0;
    if(s.life>0 && Math.hypot(s.x-player.x,s.y-player.y) < player.r+s.r){
      if(player.dashT>0){ // mid-dash: the filing sails through where you just were
        if(!s.dodged){ s.dodged = true; floaters.push({ x:player.x, y:player.y-26, text:'EXPEDITED', t:0.7, color:'#5ec8f0' }); }
      } else { hurtPlayer(s.dmg); s.life=0; }
    }
  }
  enemyShots = enemyShots.filter(s=>s.life>0);

  // enemies
  for(const e of enemies){
    e.wob += dt*6;
    if(e.hurtT>0) e.hurtT -= dt;
    if(e.slowT>0) e.slowT -= dt;
    if(e.stunT>0) e.stunT -= dt;
    const stunned = e.stunT>0;   // struck by a spin: can't move or shoot
    // boss phases: as HP drops past each threshold, swap firing pattern/cadence/speed.
    // phases are listed high→low `at` (hp fraction); we jump to the deepest one crossed.
    if(e.boss && e.phases){
      if(e.phaseIdx===undefined){ e.phaseIdx = -1; e.baseSpd = e.spd; }
      const frac = e.hp/e.maxhp;
      let want = e.phaseIdx;
      for(let i=e.phaseIdx+1;i<e.phases.length;i++) if(frac<=e.phases[i].at) want = i;
      if(want>e.phaseIdx){
        e.phaseIdx = want; const ph = e.phases[want];
        if(ph.pattern) e.pattern = ph.pattern;
        if(ph.shotCd!==undefined) e.shotCd = ph.shotCd;
        if(ph.windup!==undefined) e.windup = ph.windup;
        if(ph.spd!==undefined) e.spd = e.baseSpd*ph.spd;
        if(ph.say){ announce(ph.say, false, 3); shake=Math.max(shake,10); hitStop=Math.max(hitStop,0.08); if(SFX.boss) SFX.boss(); }
      }
    }
    // target the mail cart instead of the player when it's closer
    let tgt = player;
    let d = Math.hypot(player.x-e.x, player.y-e.y);
    if(cart && worldId==='office'){
      const dc = Math.hypot(cart.x-e.x, cart.y-e.y);
      if(dc < d){ tgt = cart; d = dc; }
    }
    const ang = Math.atan2(tgt.y-e.y, tgt.x-e.x);
    // CHARGER state machine (bailiff): approach → wind up (rooted tell) → committed
    // straight lunge → recover (rooted & vulnerable, so a whiffed charge is punishable).
    // While winding/dashing/recovering it drives its own motion, so the normal chase below
    // is skipped (charging flag). Reuses e.aimA for the locked lunge angle (chargers don't shoot).
    let charging = false;
    if(e.charge && !stunned){
      const C = e.charge;
      if(e.chState===undefined){ e.chState='ready'; e.chCd = C.cd*0.5; }
      if(e.chState==='ready'){
        e.chCd -= dt;
        if(e.chCd<=0 && d < (C.range||280) && d > 40){ e.chState='wind'; e.chT = C.wind; e.aimA = ang; }
      } else if(e.chState==='wind'){
        charging = true; e.chT -= dt;
        if(e.chT<=0){ e.chState='dash'; e.chT = C.dur; e.chDx = Math.cos(e.aimA); e.chDy = Math.sin(e.aimA); if(SFX.melee) SFX.melee(); }
      } else if(e.chState==='dash'){
        charging = true; e.chT -= dt;
        moveEntity(e, e.chDx*C.speed, e.chDy*C.speed, dt);
        // a connecting lunge is one heavy hit that sends you flying (wall-aware),
        // then the charger is spent — no grinding a pinned player
        if(tgt===player && Math.hypot(player.x-e.x, player.y-e.y) < e.r + player.r + 6){
          hurtPlayer(e.dmg);
          moveEntity(player, e.chDx*1500, e.chDy*1500, 0.12);
          shake = Math.max(shake, 9); hitStop = Math.max(hitStop, 0.07);
          floaters.push({ x:player.x, y:player.y-30, text:'TACKLED!', t:0.9, color:'#ff9bb0' });
          e.chState='recover'; e.chT = C.recover;
        }
        else if(e.chT<=0){ e.chState='recover'; e.chT = C.recover; floaters.push({ x:e.x, y:e.y-e.r-6, text:'WINDED', t:0.6, color:'#f0c75e' }); }
      } else { // recover
        charging = true; e.chT -= dt;
        if(e.chT<=0){ e.chState='ready'; e.chCd = C.cd; }
      }
    }
    // SLAMMER (golem): parks in reach, raises the full weight of process (rooted tell),
    // then drops it — an AoE burst you sidestep. Slammers deal no passive contact
    // grind (see the touch block below): all their damage is this telegraphed slam.
    let slamWind = false;
    if(e.slam && !stunned){
      const S = e.slam;
      if(e.slamCd===undefined) e.slamCd = S.cd*0.5;
      if(e.slamT > 0){
        slamWind = true;
        e.slamT -= dt;
        if(e.slamT <= 0){
          e.slamCd = S.cd;
          if(Math.hypot(player.x-e.x, player.y-e.y) < S.radius + player.r){
            hurtPlayer(e.dmg*S.mult);
            const dp = Math.hypot(player.x-e.x, player.y-e.y)||1;   // shoved off the impact
            moveEntity(player, (player.x-e.x)/dp*900, (player.y-e.y)/dp*900, 0.1);
          }
          if(cart && Math.hypot(cart.x-e.x, cart.y-e.y) < S.radius + cart.r) cart.hp -= e.dmg*S.mult;
          shake = Math.max(shake, 6); SFX.slam();
          for(let i=0;i<8;i++){ const a=i/8*Math.PI*2;
            particles.push({ x:e.x+Math.cos(a)*20, y:e.y+Math.sin(a)*20, vx:Math.cos(a)*200, vy:Math.sin(a)*200, t:0.3+Math.random()*0.15, spr:'paper' }); }
        }
      } else {
        e.slamCd -= dt;
        if(e.slamCd<=0 && d < S.range + e.r){ e.slamT = e.slamMax = S.wind; }
      }
    }
    // chase (shooters keep distance)
    let want = 1;
    if(e.shoots && d < 220) want = -0.6;
    if(e.slowT>0) want *= 0.45; // Bates-stamped: slowed under the weight of process
    let spd = e.spd;
    if(e.rage && !player.moving) spd *= 1.85; // Decaf Gremlin pounces on the stationary
    const winding = e.windT>0 || slamWind;     // mid-telegraph: plant and commit to the attack
    if(winding) spd *= 0.22;                    // rooted while winding up — that's the tell you read
    // movement vector: strafers orbit at a preferred ring; everyone else beelines (±want)
    let mvx, mvy;
    if(e.strafe && !winding){
      if(e.sdir===undefined) e.sdir = Math.random()<0.5?1:-1;
      const ring = e.ring||200;
      const radial = d>ring+25 ? 1 : (d<ring-25 ? -0.9 : 0); // close to / back off from the ring
      mvx = Math.cos(ang)*radial + Math.cos(ang+Math.PI/2)*e.sdir*0.95; // + tangent = orbit
      mvy = Math.sin(ang)*radial + Math.sin(ang+Math.PI/2)*e.sdir*0.95;
    } else {
      mvx = Math.cos(ang)*want; mvy = Math.sin(ang)*want;
    }
    if(d > 30 && !stunned && !charging){
      const bx=e.x, by=e.y;
      moveEntity(e, mvx*spd, mvy*spd, dt);
      if(e.strafe && e.x===bx && e.y===by) e.sdir = -e.sdir; // bumped a wall — reverse the orbit
    }
    // contact damage — range matches the drawn sprites (34px, bosses 64px), not the
    // smaller hitbox radii, so an enemy visibly touching the target always damages it.
    // Must also exceed the 30px approach standoff above, where melee enemies park.
    const touch = (e.boss ? 30 : 17) + 17;
    if(d < touch && !e.slam){
      if(tgt === player){
        hurtPlayer(e.dmg*dt*2.2, true);
        if(e.type==='gremlin' && player.coffeeCd < 8){
          player.coffeeCd = 8;
          floaters.push({ x:player.x, y:player.y-30, text:'CAFFEINE STOLEN!', t:0.9, color:'#9be05e' });
        }
      }
      else cart.hp -= e.dmg*dt*2.2;
    }
    // Bane's gavel: periodic radial shockwave
    if(e.type==='bane'){
      e.novaT = (e.novaT===undefined ? 3.5 : e.novaT) - dt;
      if(e.novaT <= 0){
        e.novaT = 5;
        for(let i=0;i<12;i++){
          const a = i/12*Math.PI*2;
          enemyShots.push({ x:e.x, y:e.y, vx:Math.cos(a)*210, vy:Math.sin(a)*210, dmg:e.dmg, r:7, life:2.2, color:'#f0c75e' });
        }
        floaters.push({ x:e.x, y:e.y-44, text:'GAVEL.', t:0.9, color:'#ff9bb0' });
        shake = Math.max(shake, 8); hitStop = Math.max(hitStop, 0.05); SFX.boom();
      }
    }
    // shooting — telegraphed: lock aim, wind up (drawn in render), THEN fire along the
    // committed angle. Sidestep the tell and the shot whiffs. Aim freezes at windup start.
    if(e.shoots && !stunned){
      const dp = Math.hypot(player.x-e.x, player.y-e.y);
      if(e.windT>0){
        e.windT -= dt;
        if(e.windT<=0){
          if(e.boss) bossFire(e);                  // phase-driven pattern (spread/aimed3/ring/spiral)
          else eShot(e, e.aimA, 260, 6);           // grunts: one aimed shot
          SFX.shoot();
        }
      } else {
        e.shotT -= dt;
        if(e.shotT<=0 && dp<480){
          e.shotT = e.shotCd;
          e.aimA = Math.atan2(player.y-e.y, player.x-e.x);                  // commit aim now…
          e.windT = e.windMax = (e.windup!==undefined ? e.windup : (e.boss?0.55:0.4)); // …and telegraph it
        }
      }
    }
    // player shots hitting enemy
    for(const s of shots){
      if(s.life<=0 || s.hit.has(e)) continue;
      if(Math.hypot(s.x-e.x, s.y-e.y) < e.r + s.r){
        if(e.dodge && Math.random() < e.dodge){     // wraith slips the shot — strike or spin it
          floaters.push({ x:e.x, y:e.y-e.r-6, text:'WITHDRAWN', t:0.5, color:'#9b8fb5' });
          if(s.pierce) s.hit.add(e); else s.life = 0;
          continue;
        }
        const dmg = s.dmg * (1 - (e.resist||0));     // golem/instrument: paper-dense, shrugs off paper
        e.hp -= dmg; e.hurtT = 0.12;
        floaters.push({ x:e.x, y:e.y-e.r-6, text:e.resist?'DENSE '+Math.round(dmg):Math.round(dmg), t:0.6, color:e.resist?'#9b8fb5':'#fff' });
        for(let i=0;i<2;i++) particles.push({ x:s.x, y:s.y, vx:(Math.random()*2-1)*110, vy:(Math.random()*2-1)*110, t:0.14+Math.random()*0.1, spr:'spark' });
        if(s.pierce) s.hit.add(e); else s.life = 0;
      }
    }
  }
  // deaths
  for(const e of enemies){
    if(e.hp<=0){
      const q = QUESTS[questIdx];
      if(questPhase==='active' && e.type===q.goal.enemy) killCount++;
      flags.totalKills = (flags.totalKills||0) + 1;            // lifetime tally for the performance review
      if(e.boss) hitStop = Math.max(hitStop, 0.18);            // a boss death lands hard
      questEvent('kill', { enemy:e.type });
      boardKill(e.type);                                       // assignment-board matter progress
      gainXP(e.xp);
      gainBillables(Math.max(1, Math.round(e.xp*0.5)), true); // auto-credit billables on kill
      if(e.proBono) flags.lennyKills++;
      if(e.boss) SFX.boom(); else SFX.die();
      if(e.boss){ // costs awarded against the losing party, plus a recovery spread
        gainBillables(e.xp);
        for(let i=0;i<3;i++){ const p = findOpen(e.x, e.y, 70); pickups.push({ x:p.x, y:p.y, spr:'coffee', t:0, heal:25 }); }
      }
      if(e.type==='grandfather'){
        flags.grandfatherDown = true;
        announce('Worthington II dissipates into cigar smoke and unvested equity. The garage feels... settled.', false, 5);
      }
      shake = Math.max(shake, e.boss?14:5);
      for(let i=0;i<(e.boss?40:12);i++)
        particles.push({ x:e.x, y:e.y, vx:(Math.random()*2-1)*180, vy:(Math.random()*2-1)*180, t:0.5+Math.random()*0.4, spr: Math.random()<0.5?'paper':'spark' });
      if(Math.random()<0.35 || e.boss)
        floaters.push({ x:e.x, y:e.y-20, text:KILL_QUIPS[Math.floor(Math.random()*KILL_QUIPS.length)], t:1, color:'#f0c75e' });
      if(Math.random()<0.18 && !e.boss)
        pickups.push({ x:e.x, y:e.y, spr:'coffee', t:0, heal:18 });
    }
  }
  enemies = enemies.filter(e=>e.hp>0);

  // allies (billing immunity: invulnerable, highly motivated)
  for(const al of allies){
    const pd = Math.hypot(player.x-al.x, player.y-al.y);
    if(pd > 90){ const a = Math.atan2(player.y-al.y, player.x-al.x); moveEntity(al, Math.cos(a)*200, Math.sin(a)*200, dt); }
    al.cd -= dt;
    let best=null, bd=420;
    for(const e of enemies){ const d2=Math.hypot(e.x-al.x, e.y-al.y); if(d2<bd){ bd=d2; best=e; } }
    if(best && al.cd <= 0){
      al.cd = 0.5;
      const a = Math.atan2(best.y-al.y, best.x-al.x);
      shots.push({ x:al.x, y:al.y, vx:Math.cos(a)*480, vy:Math.sin(a)*480, dmg:9, r:4, color:'#e8d06a', pierce:false, homing:false, life:1.4, hit:new Set() });
      if(Math.random() < 0.1) floaters.push({ x:al.x, y:al.y-24, text:'BILLED!', t:0.7, color:'#e8d06a' });
    }
  }

  // printer companion — synced from the equipped accessory, follows + auto-fires paper jams
  if(gearHas('companion')){
    if(!companion) companion = { x:player.x-34, y:player.y, r:12, spr:'computer', cd:1 };
    const pd = Math.hypot(player.x-companion.x, player.y-companion.y);
    if(pd > 64){ const a = Math.atan2(player.y-companion.y, player.x-companion.x); moveEntity(companion, Math.cos(a)*230, Math.sin(a)*230, dt); }
    companion.cd -= dt;
    let best=null, bd=360;
    for(const e of enemies){ const d=Math.hypot(e.x-companion.x, e.y-companion.y); if(d<bd){ bd=d; best=e; } }
    if(best && companion.cd <= 0){
      companion.cd = 1.3;
      const a = Math.atan2(best.y-companion.y, best.x-companion.x);
      shots.push({ x:companion.x, y:companion.y, vx:Math.cos(a)*430, vy:Math.sin(a)*430, dmg:7*dmgMult(), r:5, color:'#cfd6e0', pierce:false, homing:false, life:1.5, hit:new Set() });
      if(Math.random() < 0.18) floaters.push({ x:companion.x, y:companion.y-22, text:'PC LOAD LETTER', t:0.7, color:'#cfd6e0' });
    }
  } else companion = null;

  // pickups
  for(const p of pickups){
    p.t += dt;
    if(Math.hypot(p.x-player.x, p.y-player.y) < player.r + 16){
      SFX.pick();
      if(p.heal){
        player.hp = Math.min(player.maxhp, player.hp + p.heal);
        floaters.push({ x:player.x, y:player.y-22, text:`+${p.heal} CAFFEINE`, t:0.8, color:'#9be05e' });
      } else if(p.kind === 'lore'){
        flags.lore++; gainXP(10);
        startDialog([N('dusty', LORE[p.idx])], () => {
          if(flags.lore === 3) announce('You understand Clause 9 now. Something new will be possible at midnight.', false, 5);
          if(flags.lore === 7) announce('Seven files. The whole sordid ledger, 1959 to now. Bane will not enjoy how much you know.', false, 5);
        });
      } else if(p.kind === 'item'){
        giveItem(p.item);
      } else if(p.kind === 'stamper'){
        flags.hasStamper = true;
        giveItem('bates_stamper', true);
        announce('The Emotional Support Bates Stamper. Counter reads 999999, hums with administrative power. Equip it from your bag [I].', false, 4.5);
      } else if(p.kind === 'key'){
        flags.hasKey = true;
        giveItem('brass_key', true);
        announce('A heavy brass key, label long faded. It wants to be turned.', false, 4);
      } else if(p.kind === 'descaler'){
        flags.partDescaler = true;
        announce('A jug of artisanal descaling solution, vintage 1987. The label says DO NOT DRINK in eleven languages.', false, 4);
      } else if(p.kind === 'element'){
        flags.partElement = true;
        announce('An industrial heating element, pried from a partner\'s abandoned espresso rig. Still warm. Somehow.', false, 4);
      } else if(p.kind === 'chest'){
        gainXP(60);
        announce('A forgotten retainer chest! Sixty XP of pre-paid, never-billed 1986 legal fees.', false, 4);
      } else if(p.kind === 'file'){
        collectCount++;
        floaters.push({ x:player.x, y:player.y-22, text:p.label||'PRIVILEGED FILE SECURED', t:1, color:'#5ec8f0' });
      }
      p.dead = true;
    }
  }
  pickups = pickups.filter(p=>!p.dead);

  // floaters & particles
  for(const f of floaters){ f.t -= dt; f.y -= 26*dt; }
  floaters = floaters.filter(f=>f.t>0);
  for(const p of particles){ p.t-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.94; p.vy*=0.94; }
  particles = particles.filter(p=>p.t>0);

  if(player.hp<=0){ state='gameover'; SFX.jingleLose(); }
}

function hurtPlayer(d, contact=false){
  if(player.shieldT>0){                         // Retainer in effect: the firm absorbs it
    if(!contact && Math.random()<0.5) floaters.push({ x:player.x, y:player.y-26, text:'RETAINED', t:0.7, color:'#5ec8f0' });
    return;
  }
  d *= (1 - equipDefense());   // suit / accessory armor soaks a fraction of every hit
  if(player.hurtT>0 && contact) { player.hp -= d; return; } // contact ticks don't spam quips
  player.hp -= d;
  if(!contact || Math.random()<0.05){
    player.hurtT = 0.5; shake = Math.max(shake,6);
    SFX.hurt();
    if(Math.random()<0.4)
      floaters.push({ x:player.x, y:player.y-26, text:HURT_QUIPS[Math.floor(Math.random()*HURT_QUIPS.length)], t:1, color:'#ff6b6b' });
  }
}

