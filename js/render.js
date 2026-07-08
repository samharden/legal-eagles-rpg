"use strict";
// ============================== RENDER ==============================
let helpOpen = false, helpRects = [];
function toggleHelp(){
  if(state!=='play') return;
  helpOpen = !helpOpen;
  if(helpOpen){ for(const k in keys) keys[k]=false; }
  SFX.blip();
}
function draw(){
  ctx.save();
  if(shake>0) ctx.translate((Math.random()*2-1)*shake*0.6, (Math.random()*2-1)*shake*0.6);
  ctx.clearRect(-20,-20,W+40,CH+40);
  ctx.fillStyle='#0d0a14'; ctx.fillRect(-20,-20,W+40,CH+40);

  ctx.save();
  ctx.scale(ZOOM, ZOOM); // world rendering at camera zoom; screen-space UI drawn after restore
  const x0=Math.floor(cam.x/TILE), y0=Math.floor(cam.y/TILE);
  const x1=Math.min(MAPW-1, x0+Math.ceil(VW/TILE)+1), y1=Math.min(MAPH-1, y0+Math.ceil(VH/TILE)+1);
  const wd = worlds[worldId], C = wd.colors;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const t=map[y][x], px=x*TILE-cam.x, py=y*TILE-cam.y;
    if(t===1){ ctx.fillStyle=C.wall; ctx.fillRect(px,py,TILE,TILE); ctx.fillStyle=C.wallIn; ctx.fillRect(px+3,py+3,TILE-6,TILE-6); }
    else {
      ctx.fillStyle = t===3 ? C.carpet : C.floor; ctx.fillRect(px,py,TILE,TILE);
      if((x+y)%2===0){ ctx.fillStyle='rgba(255,255,255,0.018)'; ctx.fillRect(px,py,TILE,TILE); }
      if(t===2){ ctx.fillStyle='#5c4630'; ctx.fillRect(px+4,py+8,TILE-8,TILE-14); drawSprite(SPR.computer,px+TILE/2,py+TILE/2,TILE-4); }
      if(t===4) drawSprite(SPR.plant,px+TILE/2,py+TILE/2,TILE-2);
      if(t===5) drawSprite(SPR.machine,px+TILE/2,py+TILE/2,TILE-2);
      if(t===6) drawSprite(SPR.shelf,px+TILE/2,py+TILE/2,TILE);
      if(t===7) drawSprite(SPR.stairs,px+TILE/2,py+TILE/2,TILE);
      if(t===8) drawSprite(SPR.table,px+TILE/2,py+TILE/2,TILE);
      if(t===9) drawSprite(SPR.car,px+TILE/2,py+TILE/2,TILE+4);
    }
  }

  // dynamic world objects: plates, gates, crates, levers, signs
  const nearLbl = (x,y,txt) => {
    if(Math.hypot(player.x-x, player.y-y) < 60){
      ctx.font='12px monospace'; ctx.fillStyle='#9b8fb5'; ctx.textAlign='center';
      ctx.fillText(txt, x-cam.x, y-cam.y+30);
    }
  };
  for(const pl of wd.plates) drawSprite(pl.done?SPR.plate_on:SPR.plate, pl.tx*TILE+20-cam.x, pl.ty*TILE+20-cam.y, TILE);
  for(const gk in wd.gates){ const gt=wd.gates[gk]; if(!gt.open) for(const [tx,ty] of gt.tiles) drawSprite(SPR.gate, tx*TILE+20-cam.x, ty*TILE+20-cam.y, TILE); }
  for(const cr of wd.crates){
    drawSprite(SPR.crate, cr.tx*TILE+20-cam.x, cr.ty*TILE+20-cam.y, TILE);
    nearLbl(cr.tx*TILE+20, cr.ty*TILE+20, 'push');
  }
  for(const lv of wd.levers){
    drawSprite(lv.on?SPR.lever_on:SPR.lever_off, lv.tx*TILE+20-cam.x, lv.ty*TILE+20-cam.y, 36);
    ctx.font='bold 12px monospace'; ctx.fillStyle='#f0c75e'; ctx.textAlign='center';
    ctx.fillText(lv.id, lv.tx*TILE+20-cam.x, lv.ty*TILE-4-cam.y);
    nearLbl(lv.tx*TILE+20, lv.ty*TILE+20, '[E] pull');
  }
  for(const sg of wd.signs){
    drawSprite(SPR.sign, sg.tx*TILE+20-cam.x, sg.ty*TILE+20-cam.y, 36);
    nearLbl(sg.tx*TILE+20, sg.ty*TILE+20, '[E] read');
  }
  if(wd.recall){
    drawSprite(SPR.plate, wd.recall.tx*TILE+20-cam.x, wd.recall.ty*TILE+20-cam.y, 30);
    nearLbl(wd.recall.tx*TILE+20, wd.recall.ty*TILE+20, '[E] crate recall');
  }
  for(const st of wd.stairs) nearLbl(st.tx*TILE+20, st.ty*TILE+20, st.label);
  if(worldId==='annex' && !wd.gates.g3.open) nearLbl(25*TILE, 14.5*TILE, '[E] vault door');
  if(worldId==='garage' && !wd.gates.g1.open) nearLbl(26*TILE+20, 12*TILE, '[E] valet cage');
  // library portraits
  if(wd.portraits) for(const pt of wd.portraits){
    drawSprite(SPR.portrait, pt.tx*TILE+20-cam.x, pt.ty*TILE+12-cam.y, 34, false, pt.seen?0.6:1);
    nearLbl(pt.tx*TILE+20, pt.ty*TILE+20, '[E] portrait');
  }
  // jury box
  if(wd.jury) for(let i=0;i<wd.jury.length;i++){
    const [jx,jy] = wd.jury[i];
    drawSprite(i < (flags.jury||0) ? SPR.juror : SPR.seat, jx*TILE+20-cam.x, jy*TILE+20-cam.y, 32);
  }
  if(worldId==='floor24') nearLbl(31*TILE+20, 22*TILE+20, '[E] coffee (?)');
  if(worldId==='office' && wd.printer){
    const pr=wd.printer, px=pr.tx*TILE+20-cam.x, py=pr.ty*TILE+20-cam.y;
    drawSprite(SPR.computer, px, py-2, TILE-4);
    const st=qstate.printer_jam;
    if(st && st.status==='available'){ // beacon: the jammed printer wants you
      ctx.font='bold 16px monospace'; ctx.fillStyle='#f0c75e'; ctx.textAlign='center';
      ctx.fillText('!', px, py-TILE*0.7 + Math.sin(gameTime*4)*2);
    }
    nearLbl(pr.tx*TILE+20, pr.ty*TILE+20, st && st.status==='available' ? '[E] the jammed printer' : '[E] printer');
  }
  if(worldId==='office' && wd.vendor){
    drawSprite(SPR.server, wd.vendor.tx*TILE+20-cam.x, wd.vendor.ty*TILE+20-cam.y, TILE-2);
    nearLbl(wd.vendor.tx*TILE+20, wd.vendor.ty*TILE+20, '[E] Supply Closet — DCH Provisions');
  }
  if(worldId==='office' && wd.board){
    drawSprite(SPR.sign, wd.board.tx*TILE+20-cam.x, wd.board.ty*TILE+20-cam.y, TILE-2);
    nearLbl(wd.board.tx*TILE+20, wd.board.ty*TILE+20, boardActive ? '[E] Assignment Board (matter open)' : '[E] Assignment Board');
  }
  if(worldId==='vault' && wd.locke){
    drawSprite(SPR.dolores, wd.locke.tx*TILE+20-cam.x, wd.locke.ty*TILE+20-cam.y, 34, false, 0.4 + Math.sin(gameTime*2)*0.1);
    nearLbl(wd.locke.tx*TILE+20, wd.locke.ty*TILE+20, '[E] the ghost');
  }
  // intranet archive: unread story terminals beacon like the printer; any desk reads
  for(const key in TERMINALS){
    if(flags.termRead[key] || !key.startsWith(worldId+':')) continue;
    const [tx2,ty2] = key.slice(worldId.length+1).split(',').map(Number);
    ctx.font='bold 14px monospace'; ctx.fillStyle='#5ec8f0'; ctx.textAlign='center';
    ctx.fillText('✉', tx2*TILE+20-cam.x, ty2*TILE+8-cam.y + Math.sin(gameTime*4)*2);
  }
  {
    const term = nearTerminal();
    if(term){
      const key = `${worldId}:${term.tx},${term.ty}`;
      nearLbl(term.tx*TILE+20, term.ty*TILE+20,
        TERMINALS[key] && !flags.termRead[key] ? '[E] unread mail' : '[E] workstation');
    }
  }

  // pickups
  for(const p of pickups){
    const b = Math.sin(p.t*4)*4;
    drawSprite(SPR[p.spr], p.x-cam.x, p.y-cam.y+b, 28);
  }

  // ambient staff (drawn under the named NPCs — background people)
  for(const ex of extras)
    drawSprite(SPR[ex.spr], ex.x-cam.x, ex.y-cam.y + Math.sin(gameTime*3+ex.wob)*1.5, 30, ex.flip, 0.92);

  // NPCs
  ctx.textAlign='center'; ctx.textBaseline='middle';
  if(worldId==='office') for(const n of NPCS){
    if(n.hidden) continue;
    const nx = n.x-cam.x, ny = n.y-cam.y;
    if(nx<-50||ny<-50||nx>VW+50||ny>VH+50) continue;
    drawSprite(SPR[n.spr], nx, ny, 38, player.x < n.x);
    const mk = npcMarker(n);
    if(mk){ ctx.font='bold 18px monospace'; ctx.fillStyle='#f0c75e'; ctx.fillText(mk, nx, ny-30+Math.sin(gameTime*4)*3); }
    if(Math.hypot(player.x-n.x, player.y-n.y)<70){
      ctx.font='12px monospace'; ctx.fillStyle='#9b8fb5'; ctx.fillText('[E] talk', nx, ny+32);
    }
  }
  // servers
  if(worldId==='office') for(const sv of servers){
    drawSprite(SPR.server, sv.x-cam.x, sv.y-cam.y, 34, false, sv.done?0.45:1);
    if(!sv.done && Math.hypot(player.x-sv.x, player.y-sv.y)<64){
      ctx.font='12px monospace'; ctx.fillStyle='#9b8fb5'; ctx.fillText('[E] percussive reboot', sv.x-cam.x, sv.y-cam.y+30);
    }
  }
  if(worldId==='office' && Math.hypot(player.x-COFFEE.x,player.y-COFFEE.y)<70){
    ctx.font='12px monospace'; ctx.fillStyle='#9b8fb5';
    ctx.fillText(flags.coffeeQ===1 ? '[E] coffee (BROKEN)' : '[E] coffee', COFFEE.x-cam.x, COFFEE.y-cam.y+28);
  }
  // mail cart
  if(worldId==='office' && cart){
    const cx = cart.x-cam.x, cy = cart.y-cam.y + Math.sin(gameTime*5)*1.5;
    drawSprite(SPR.cart, cx, cy, 38);
    ctx.fillStyle='#000'; ctx.fillRect(cx-18, cy-26, 36, 5);
    ctx.fillStyle='#f0e6c8'; ctx.fillRect(cx-18, cy-26, 36*Math.max(0,cart.hp/cart.maxhp), 5);
    ctx.font='10px monospace'; ctx.fillStyle='#f0e6c8'; ctx.fillText('THE MAIL', cx, cy-32);
  }

  // enemy shots (color = boss firing pattern, so a phase change reads mid-fight)
  for(const s of enemyShots){
    ctx.fillStyle = s.color || '#ff5577';
    ctx.beginPath(); ctx.arc(s.x-cam.x,s.y-cam.y,s.r,0,7); ctx.fill();
    ctx.globalAlpha=0.3;
    ctx.beginPath(); ctx.arc(s.x-cam.x,s.y-cam.y,s.r+3,0,7); ctx.fill();
    ctx.globalAlpha=1;
  }
  // player shots
  for(const s of shots){
    ctx.fillStyle=s.color;
    ctx.beginPath(); ctx.arc(s.x-cam.x,s.y-cam.y,s.r,0,7); ctx.fill();
    ctx.globalAlpha=0.35;
    ctx.beginPath(); ctx.arc(s.x-cam.x-s.vx*0.012,s.y-cam.y-s.vy*0.012,s.r*0.8,0,7); ctx.fill();
    ctx.globalAlpha=1;
  }

  // enemies
  for(const e of enemies){
    const ex=e.x-cam.x, ey=e.y-cam.y + Math.sin(e.wob)*2;
    drawSprite(SPR[e.type], ex, ey, e.boss?64:34, player.x < e.x, e.hurtT>0?0.55:1);
    // hp bar
    const bw = e.boss?60:30;
    ctx.fillStyle='#000'; ctx.fillRect(ex-bw/2, ey-e.r-12, bw, 5);
    ctx.fillStyle = e.boss?'#ff5577':'#9be05e';
    ctx.fillRect(ex-bw/2, ey-e.r-12, bw*Math.max(0,e.hp/e.maxhp), 5);
    if(e.boss){
      ctx.font='11px monospace'; ctx.fillStyle='#ff9bb0';
      ctx.fillText(e.nm, ex, ey-e.r-20);
    }
    if(e.stunT>0){ // stunned by a spin — cyan ring + drifting marks
      ctx.strokeStyle='rgba(94,200,240,0.7)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(ex, ey, e.r+6, 0, 7); ctx.stroke();
    }
    else if(e.windT>0){ // winding up to fire — telegraph you can read & dodge
      const prog=1-e.windT/e.windMax;
      ctx.save();
      if(e.pattern==='ring'||e.pattern==='spiral'){ // omnidirectional charge — full ring tightening in
        ctx.strokeStyle='rgba(255,85,119,'+(0.25+0.55*prog)+')'; ctx.lineWidth=2+2*prog;
        ctx.beginPath(); ctx.arc(ex, ey, e.r+24-prog*14, 0, 7); ctx.stroke();
      } else { // directional — dashed aim line + filling countdown arc
        const a=e.aimA;
        ctx.strokeStyle='rgba(255,85,119,'+(0.22+0.5*prog)+')'; ctx.lineWidth=2; ctx.setLineDash([6,5]);
        ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(ex+Math.cos(a)*130, ey+Math.sin(a)*130); ctx.stroke();
        ctx.setLineDash([]); ctx.strokeStyle='#ff5577'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(ex, ey, e.r+9, a-0.6, a-0.6+prog*1.2); ctx.stroke();
      }
      ctx.restore();
    }
    else if(e.charge && e.chState==='wind'){ // charger winding a lunge — orange arrow down the path
      const a=e.aimA, prog=1-e.chT/e.charge.wind, reach=e.charge.speed*e.charge.dur;
      const hx=ex+Math.cos(a)*reach, hy=ey+Math.sin(a)*reach;
      ctx.save();
      ctx.strokeStyle='rgba(240,150,50,'+(0.3+0.5*prog)+')'; ctx.lineWidth=3+3*prog;
      ctx.beginPath(); ctx.moveTo(ex,ey); ctx.lineTo(hx,hy); ctx.stroke();
      ctx.fillStyle='rgba(240,150,50,'+(0.4+0.5*prog)+')';
      ctx.beginPath(); ctx.moveTo(hx,hy);
      ctx.lineTo(hx-Math.cos(a-0.4)*14, hy-Math.sin(a-0.4)*14);
      ctx.lineTo(hx-Math.cos(a+0.4)*14, hy-Math.sin(a+0.4)*14);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    else if(e.charge && e.chState==='recover'){ // spent the lunge — dizzy ring marks the punish window
      ctx.save(); ctx.strokeStyle='rgba(240,200,94,0.55)'; ctx.lineWidth=2; ctx.setLineDash([3,4]);
      ctx.beginPath(); ctx.arc(ex, ey, e.r+8, 0, 7); ctx.stroke(); ctx.restore();
    }
    else if(e.slam && e.slamT>0){ // slammer hoisting the paperwork — impact zone fills in
      const prog=1-e.slamT/e.slamMax;
      ctx.save();
      ctx.fillStyle='rgba(240,150,50,'+(0.08+0.16*prog)+')';
      ctx.beginPath(); ctx.arc(ex, ey, e.slam.radius, 0, 7); ctx.fill();
      ctx.strokeStyle='rgba(240,150,50,'+(0.35+0.45*prog)+')'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(ex, ey, e.slam.radius*prog, 0, 7); ctx.stroke();
      ctx.restore();
    }
  }

  // allies
  for(const al of allies) drawSprite(SPR[al.spr], al.x-cam.x, al.y-cam.y, 36, player.x < al.x);
  // printer companion (floats, bobbing)
  if(companion) drawSprite(SPR[companion.spr], companion.x-cam.x, companion.y-cam.y + Math.sin(gameTime*4)*2, 30, player.x < companion.x);

  // particles
  for(const p of particles) drawSprite(SPR[p.spr], p.x-cam.x, p.y-cam.y, 12, false, Math.min(1,p.t*2));

  // player
  const px=player.x-cam.x, py=player.y-cam.y;
  const blink = player.hurtT>0 && Math.floor(gameTime*20)%2===0;
  const f = player.face;
  let pspr = SPR[player.spr], pflip = false;
  if(Math.abs(f.x) >= Math.abs(f.y) && f.x !== 0){ pspr = SPR[player.spr+'_s']; pflip = f.x < 0; }
  else if(f.y < 0) pspr = SPR[player.spr+'_u'];
  drawSprite(pspr, px, py, 38, pflip, blink?0.4:1);
  // briefcase: resting at the hip, arcing on a strike, orbiting on a spin
  const faceA = Math.atan2(f.y, f.x);
  let bA = faceA + 0.6, bR = 20;
  if(player.swingT > 0){ bA = faceA + ((0.18-player.swingT)/0.18)*2.4 - 1.2; bR = 32; }
  if(player.spinT > 0){ bA = ((0.35-player.spinT)/0.35)*Math.PI*2; bR = 48; }
  drawSprite(SPR.briefcase, px+Math.cos(bA)*bR, py+Math.sin(bA)*bR, 20, Math.cos(bA)<0);
  if(player.spinT > 0){
    ctx.strokeStyle = `rgba(240,199,94,${Math.min(1,player.spinT*2.5)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, 30 + 60*(1-(player.spinT/0.35)), 0, 7); ctx.stroke();
  }
  if(player.shieldT > 0){ // Retainer bubble
    ctx.strokeStyle = `rgba(94,200,240,${0.45+0.3*Math.sin(gameTime*9)})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(px, py, 26, 0, 7); ctx.stroke();
  }

  // floaters
  ctx.font='bold 13px monospace';
  for(const f of floaters){
    ctx.globalAlpha=Math.min(1,f.t*2); ctx.fillStyle=f.color;
    ctx.fillText(f.text, f.x-cam.x, f.y-cam.y);
  }
  ctx.globalAlpha=1;

  // per-map lighting mood: a color wash and/or a personal-space vignette (see seedExtras)
  const mood = worlds[worldId].mood;
  if(mood){
    if(mood.tint){ ctx.fillStyle = mood.tint; ctx.fillRect(0,0,VW,VH); }
    if(mood.vign){
      const a = mood.pulse ? mood.vign*(0.9 + 0.1*Math.sin(gameTime*1.6)) : mood.vign;
      const vg = ctx.createRadialGradient(player.x-cam.x, player.y-cam.y, 90, player.x-cam.x, player.y-cam.y, 420);
      vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,`rgba(0,0,0,${a})`);
      ctx.fillStyle = vg; ctx.fillRect(0,0,VW,VH);
    }
  }
  ctx.restore(); // end world zoom — HUD, announcements, dialogs are screen-space

  // desktop aim reticle — mouse fire (click) shoots at the cursor
  if(!IS_TOUCH && state==='play' && !invOpen && !shopOpen && !helpOpen && mouse.y < HUD_Y){
    ctx.strokeStyle = mouse.down ? '#f0c75e' : 'rgba(240,199,94,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mouse.x-8, mouse.y); ctx.lineTo(mouse.x-3, mouse.y);
    ctx.moveTo(mouse.x+3, mouse.y); ctx.lineTo(mouse.x+8, mouse.y);
    ctx.moveTo(mouse.x, mouse.y-8); ctx.lineTo(mouse.x, mouse.y-3);
    ctx.moveTo(mouse.x, mouse.y+3); ctx.lineTo(mouse.x, mouse.y+8);
    ctx.stroke();
  }

  if(!IS_TOUCH) drawHUD(); // on touch the HUD lives in the DOM panel below the canvas

  // announcement
  if(msg.t>0){
    ctx.textAlign='center';
    const a = Math.min(1, msg.t);
    ctx.globalAlpha=a;
    if(msg.big){
      const big = msg.text.length > 36;
      const fontPx = big ? 18 : 30;
      ctx.font = `bold ${fontPx}px monospace`; ctx.fillStyle='#f0c75e';
      ctx.strokeStyle='#000'; ctx.lineWidth=5;
      // wrap so long banners (NEW MATTER: ...) never run off the canvas
      const blines = wrap(msg.text, big ? 50 : 30);
      const y0b = 150 - (blines.length-1)*(fontPx+6)/2;
      blines.forEach((l,i)=>{ const y=y0b+i*(fontPx+6); ctx.strokeText(l, W/2, y); ctx.fillText(l, W/2, y); });
    } else {
      ctx.font='14px monospace';
      const lines = wrap(msg.text, 78);
      const bh = lines.length*20+16;
      ctx.fillStyle='rgba(13,10,20,0.85)';
      ctx.fillRect(W/2-440, H-70-bh, 880, bh);
      ctx.fillStyle='#e8e0f0';
      lines.forEach((l,i)=>ctx.fillText(l, W/2, H-70-bh+24+i*20));
    }
    ctx.globalAlpha=1;
  }
  if(levelFlash>0){
    ctx.fillStyle=`rgba(240,199,94,${Math.min(0.25,levelFlash*0.12)})`;
    ctx.fillRect(-20,-20,W+40,CH+40);
  }
  ctx.restore();
}

// ---- Field Manual: controls + combat tips (desktop overlay, pauses like the bag) ----
function helpClick(x, y){
  for(const r of helpRects) if(x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h && r.act==='close'){ toggleHelp(); return; }
}
function drawHelp(){
  helpRects = [];
  const PX=140, PY=50, PW=W-280, PH=H-90;
  ctx.fillStyle='rgba(13,10,20,0.94)'; ctx.fillRect(0,0,W,CH);
  ctx.fillStyle='#1c1730'; ctx.fillRect(PX,PY,PW,PH);
  ctx.strokeStyle='#caa84a'; ctx.lineWidth=2; ctx.strokeRect(PX,PY,PW,PH);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.font='bold 18px monospace'; ctx.fillStyle='#f0c75e';
  ctx.fillText('FIELD MANUAL — DCH NEW-HIRE ORIENTATION', PX+24, PY+32);
  // close
  const cb={x:PX+PW-90,y:PY+14,w:70,h:26,act:'close'};
  ctx.fillStyle='#3a2440'; ctx.fillRect(cb.x,cb.y,cb.w,cb.h);
  ctx.strokeStyle='#caa84a'; ctx.lineWidth=1; ctx.strokeRect(cb.x,cb.y,cb.w,cb.h);
  ctx.fillStyle='#f0c75e'; ctx.font='bold 12px monospace'; ctx.textAlign='center';
  ctx.fillText('CLOSE', cb.x+cb.w/2, cb.y+18); ctx.textAlign='left'; helpRects.push(cb);

  // two columns: keyboard & filings on the left, the full controller map on the right
  let y = PY+62, y2 = PY+62;
  const CX2 = PX+352;   // right-column origin
  const head  = (t)=>{ ctx.font='bold 13px monospace'; ctx.fillStyle='#caa84a'; ctx.fillText(t, PX+24, y); y+=20; };
  const row   = (k,t)=>{ ctx.font='bold 12px monospace'; ctx.fillStyle='#5ec8f0'; ctx.fillText(k, PX+34, y);
                         ctx.font='12px monospace'; ctx.fillStyle='#e8e0f0'; ctx.fillText(t, PX+142, y); y+=18; };
  const head2 = (t)=>{ ctx.font='bold 13px monospace'; ctx.fillStyle='#caa84a'; ctx.fillText(t, CX2, y2); y2+=20; };
  const row2  = (k,t)=>{ ctx.font='bold 12px monospace'; ctx.fillStyle='#5ec8f0'; ctx.fillText(k, CX2+10, y2);
                         ctx.font='12px monospace'; ctx.fillStyle='#e8e0f0'; ctx.fillText(t, CX2+130, y2); y2+=18; };
  const tip   = (t,c)=>{ ctx.font='12px monospace'; ctx.fillStyle=c||'#9be05e';
                         wrap(t, 80).forEach((l,i)=>{ ctx.fillText((i?'   ':'• ')+l, PX+34, y); y+=16; }); };

  head('KEYBOARD & MOUSE');
  row('WASD / Arrows','Move');
  row('Space / J','STRIKE — briefcase melee');
  row('K / Click','FIRE (mouse aims at cursor)');
  row('L','SPIN — clears bullets, stuns');
  row('SHIFT','DASH — dodges projectiles');
  row('E','Talk / read / interact');
  row('I','Bag & open matters');
  row('M · H · F','Mute · manual · fullscreen');
  y += 6;
  head('EMERGENCY FILINGS (hotkeys)');
  row('1','Cold Brew — restore energy');
  row('2','Continuance — freeze room 3s');
  row('3','Retainer — 5s immunity');

  head2('🎮 XBOX / PS CONTROLLER');
  row2('L-stick / D-pad','Move · navigate menus');
  row2('R-stick','Aim + auto-FIRE (twin-stick)');
  row2('A','Talk / confirm / advance');
  row2('B','STRIKE  (in menus: close)');
  row2('X / RB / RT','FIRE');
  row2('Y','SPIN');
  row2('LB / LT','DASH');
  row2('Start','Bag');
  row2('Back / View','This manual');
  y2 += 8;
  ctx.font='italic 11px monospace'; ctx.fillStyle = padOn ? '#9be05e' : '#9b8fb5';
  ctx.fillText(padOn ? '✓ controller connected' : 'Pair over Bluetooth — detected automatically.', CX2+10, y2);
  // column divider
  ctx.strokeStyle='#3a3153'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(CX2-16, PY+50); ctx.lineTo(CX2-16, Math.max(y, y2)+4); ctx.stroke();

  y = Math.max(y, y2+16) + 8;
  head('KNOW YOUR OPPOSITION');
  tip('Paperwork Golems are DENSE — gunfire barely scratches them. STRIKE or SPIN to break them down, and step out of the slam.', '#9b8fb5');
  tip('Billable-Hour Wraiths DODGE incoming fire. Pin them with melee or catch them in a SPIN.', '#9b8fb5');
  tip('Decaf Gremlins POUNCE when you stand still and steal your caffeine. Keep moving.', '#9b8fb5');
  tip('Surrounded? SPIN stuns every non-boss in reach — buy yourself a beat, then clean up.', '#9be05e');
  ctx.font='italic 11px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText('Press H or ESC to return to work. The work is eternal; so is the firm.', PX+24, PY+PH-18);
}

function wrap(text, n){
  const words=text.split(' '), lines=[]; let cur='';
  for(const w of words){
    if((cur+' '+w).trim().length>n){ lines.push(cur.trim()); cur=w; } else cur+=' '+w;
  }
  if(cur.trim()) lines.push(cur.trim());
  return lines;
}

function drawHUD(){
  const y0 = HUD_Y;
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  // strip background
  ctx.fillStyle='#13101e'; ctx.fillRect(0, y0, W, CH-y0);
  ctx.strokeStyle='#4a3f63'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0, y0+1); ctx.lineTo(W, y0+1); ctx.stroke();

  // --- left: attorney status ---
  ctx.font='bold 14px monospace'; ctx.fillStyle='#f0c75e';
  ctx.fillText(`${player.rank.title}  (Lv ${player.rank.lvl})`, 14, y0+22);
  ctx.font='10px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText('BILLABLE ENERGY', 14, y0+38);
  ctx.fillStyle='#3a2440'; ctx.fillRect(14, y0+42, 200, 12);
  ctx.fillStyle = player.hp/player.maxhp>0.3 ? '#9be05e' : '#ff6b6b';
  ctx.fillRect(14, y0+42, 200*Math.max(0,player.hp/player.maxhp), 12);
  ctx.fillStyle='#fff'; ctx.fillText(`${Math.max(0,Math.ceil(player.hp))}/${player.maxhp}`, 220, y0+52);
  const cur = player.rank, next = RANKS[Math.min(RANKS.length-1, cur.lvl)];
  ctx.fillStyle='#9b8fb5';
  ctx.fillText(cur.lvl<RANKS.length ? `XP TO ${next.title.toUpperCase()}` : 'MAXIMUM PRESTIGE', 14, y0+68);
  ctx.fillStyle='#3a2440'; ctx.fillRect(14, y0+72, 200, 10);
  if(cur.lvl<RANKS.length){
    const frac=(player.xp-cur.xp)/(next.xp-cur.xp);
    ctx.fillStyle='#f0c75e'; ctx.fillRect(14, y0+72, 200*Math.min(1,frac), 10);
    ctx.fillStyle='#fff'; ctx.fillText(`${player.xp}/${next.xp}`, 220, y0+81);
  } else { ctx.fillStyle='#f0c75e'; ctx.fillRect(14, y0+72, 200, 10); }
  ctx.fillStyle='#9b8fb5';
  ctx.fillText(`ETHICS ${flags.ethics} · AMBITION ${flags.ambition} · 1987 FILES ${flags.lore}/7`, 14, y0+98);
  ctx.fillText(WORLD_NAME[worldId], 14, y0+112);

  // --- middle: arsenal ---
  ctx.font='11px monospace'; ctx.fillStyle='#e8e0f0';
  ctx.fillText('STRIKE — Space / J', 300, y0+22);
  ctx.fillText(`FIRE (${player.cls.atk}) — K / Click`, 300, y0+36);
  ctx.fillStyle = player.spinCd<=0 ? '#9be05e' : '#9b8fb5';
  ctx.fillText(player.spinCd<=0 ? 'SPIN — L  (READY)' : `SPIN — L  (${Math.max(0,player.spinCd).toFixed(1)}s)`, 300, y0+50);
  ctx.fillStyle = player.dashCd<=0 ? '#9be05e' : '#9b8fb5';
  ctx.fillText(player.dashCd<=0 ? 'DASH — Shift  (READY)' : `DASH — Shift  (${Math.max(0,player.dashCd).toFixed(1)}s)`, 300, y0+64);
  ctx.font='bold 12px monospace'; ctx.fillStyle='#caa84a';
  ctx.fillText(`HOURS BILLED: ${fmtBH(player.billables)}`, 300, y0+82);
  // emergency filings (quick-use 1/2/3) + manual hint
  const cc = id => countItem(id);
  ctx.font='10px monospace'; ctx.fillStyle='#9b8fb5';
  ctx.fillText(`1 BREW x${cc('cold_brew')}  ·  2 WRIT x${cc('objection_writ')}  ·  3 RETAINER x${cc('retainer')}`, 300, y0+96);
  ctx.fillStyle = player.shieldT>0 ? '#5ec8f0' : '#5a4f73';
  ctx.fillText(player.shieldT>0 ? `RETAINER: ${player.shieldT.toFixed(1)}s — IMMUNE` : 'H — FIELD MANUAL', 300, y0+110);

  // --- right: current matter + side quests ---
  const q = QUESTS[questIdx];
  ctx.font='bold 12px monospace'; ctx.fillStyle='#5ec8f0';
  ctx.fillText(`MATTER ${questIdx+1}/${QUESTS.length}: ${q.name}`, W-420, y0+22);
  ctx.font='11px monospace'; ctx.fillStyle='#e8e0f0';
  ctx.fillText(questProgressText(), W-420, y0+38);
  ctx.fillStyle='#9b8fb5';
  ctx.fillText(player.cls.nm + ' — ' + player.cls.atk, W-420, y0+52);
  ctx.fillStyle='#9be05e';
  sideQuestLines().forEach((l,i)=>ctx.fillText(l, W-420, y0+70+i*14));
}
function sideQuestLines(){
  const s = [];
  if(flags.rosaQ===1) s.push(flags.hasStamper ? '* Rosa: return the Bates stamper' : '* Rosa: find the Bates stamper (annex vault)');
  if(flags.bennyQ===1) s.push(flags.serversFixed>=3 ? '* Benny: report back' : `* Benny: reboot servers ${flags.serversFixed}/3`);
  if(flags.doloresQ===1) s.push('* Dolores: deliver envelope to Chad');
  if(flags.rosaQ===2 && flags.mailQ===0 && flags.mailFailed) s.push('* Rosa: the cart awaits (retry)');
  if(flags.mailQ===1) s.push('* ESCORT: guard the mail cart!');
  if(flags.mailQ===2) s.push('* Rosa: report the delivery');
  if(flags.coffeeQ===1){
    const cp = (flags.partDescaler?1:0)+(flags.partElement?1:0)+(flags.partChad?1:0);
    s.push(flags.coffeeBrief ? `* Coffee rebuild: parts ${cp}/3` : '* Coffee machine DOWN — see Benny (IT)');
  }
  if(flags.lennyQ===1) s.push(flags.lennyKills>=3 ? '* Lenny: return his file' : `* Lenny: golems with his file ${flags.lennyKills}/3`);
  if(flags.portraits>0 && !flags.eleven) s.push(`* Library portraits: ${flags.portraits}/11`);
  { const tn = Object.keys(flags.termRead||{}).length;
    if(tn>0 && !flags.intranetDone) s.push(`* Intranet archive: ${tn}/${Object.keys(TERMINALS).length} messages`); }
  if(review) s.push(review.rest>0 ? `* DOC REVIEW: wave ${review.wave} paid — next incoming` : `* DOC REVIEW: wave ${review.wave} — clear the floor`);
  if(flags.eleven && !flags.baneWeak && questIdx>=6) s.push('* Ask Dolores about the eleven');
  if(questIdx===8 && questPhase==='active' && !flags.baneSpawned) s.push(`* Jury won: ${flags.jury}/12`);
  return s;
}

// end-of-run scorecard — gives a reason to come back and beat your own numbers
function drawSummaryCard(){
  const mm = Math.floor(gameTime/60), ss = Math.floor(gameTime%60);
  const graphDone = QLINE.filter(q=>qstate[q.id] && qstate[q.id].status==='done').length;
  const matters = (questIdx||0) + graphDone + (flags.boardClosed||0);
  const rows = [
    ['TIME ON THE CLOCK', `${mm}:${ss.toString().padStart(2,'0')}`],
    ['FINAL RANK',        `${player.rank.title} (Lv ${player.rank.lvl})`],
    ['HOURS BILLED',      fmtBH(flags.totalBilled||0)],
    ['MATTERS CLOSED',    `${matters}`],
    ['ENEMIES SANCTIONED',`${flags.totalKills||0}`],
    ['1987 FILES RECOVERED', `${flags.lore||0}/7`],
  ];
  if(flags.reviewBest) rows.push(['DOC REVIEW — BEST WAVE', `${flags.reviewBest}`]);
  if(flags.merger) rows.push(['MERGERS SURVIVED', `${flags.merger}`]);
  const CW = 460, CHc = 40 + rows.length*22, cx = W/2 - CW/2, cy = CH - CHc - 60;
  ctx.fillStyle='rgba(28,23,48,0.92)'; ctx.fillRect(cx, cy, CW, CHc);
  ctx.strokeStyle='#caa84a'; ctx.lineWidth=2; ctx.strokeRect(cx, cy, CW, CHc);
  ctx.textAlign='center'; ctx.font='bold 13px monospace'; ctx.fillStyle='#f0c75e';
  ctx.fillText('— PERFORMANCE REVIEW —', W/2, cy+24);
  ctx.font='12px monospace';
  rows.forEach(([k,v],i)=>{
    const ry = cy+44+i*22;
    ctx.textAlign='left';  ctx.fillStyle='#9b8fb5'; ctx.fillText(k, cx+24, ry);
    ctx.textAlign='right'; ctx.fillStyle='#e8e0f0'; ctx.fillText(v, cx+CW-24, ry);
  });
  ctx.textAlign='center';
}

function drawEnd(){
  ctx.fillStyle='rgba(13,10,20,0.9)'; ctx.fillRect(0,0,W,CH);
  ctx.textAlign='center';
  if(state==='victory'){
    const chadEp = flags.chadAlly ? "Chad named his sailboat after you: 'The Reasonable Doubt II'."
      : flags.chad <= -1 ? "Chad lateraled to Grabbit & Runn. He endorses you on LinkedIn for 'Spreadsheets'. It feels hostile."
      : "Chad got the office next to yours. He insists the parking garage is not sinking. It is.";
    let title, glow, lines;
    if(flags.ending === 'dark'){
      title = 'YOU MADE PARTNER (EMERITUS TRACK)'; glow = '#ff5577';
      lines = [
        "You sign in red ink. It doesn't hurt. That's the worst part.",
        "Your first harvested hour tastes like an all-nighter in document review. Exquisite.",
        "Graves pats your shoulder: 'See you at the 2066 partner retreat. Neither of us will look a day older.'",
        '',
        'Somewhere below, four hundred lawyers feel slightly more tired and cannot say why.',
        '',
        `Ethics ${flags.ethics} · Ambition ${flags.ambition} — the math was never close, was it?`,
        `Total XP billed: ${player.xp}`,
      ];
    } else if(flags.ending === 'reform'){
      title = 'APPEAL DISMISSED — YOU MADE PARTNER'; glow = '#9be05e';
      lines = [
        "Bane's gavel cracks, splinters, and files itself into evidence. The appeal is DISMISSED —",
        'with prejudice, with costs, and with a standing ovation from the court reporter.',
        'You file Clause 9 with a clean court. The MIDNIGHT trust dissolves; forty years of stolen hours flow home.',
        'Four hundred lawyers wake up rested for the first time since 1987. Two of them retire immediately.',
        '',
        'The firm is renamed: Dewey, Cheatham & [YOUR NAME HERE].',
        chadEp,
        '',
        `Ethics ${flags.ethics} · Ambition ${flags.ambition} · 1987 Files ${flags.lore}/7 · XP billed: ${player.xp}`,
      ];
    } else if(flags.ending === 'burn'){
      title = 'IN RE: THE BUILDING — DISSOLVED'; glow = '#ff9b4d';
      lines = [
        'The founding agreement burns in a font no living lawyer can read. The building exhales',
        'sixty-seven years of held breath and becomes, at last, just a building. Drafty. Ordinary.',
        'The MIDNIGHT trust has no counterparty left to pay. Forty years of hours come home all at once.',
        'Four hundred lawyers stand up at 5pm, look at the dark windows, and simply... leave.',
        'Dewey, Cheatham & Howe dissolves within the year. Nobody mourns it. Everybody sleeps.',
        '',
        chadEp,
        '',
        `Ethics ${flags.ethics} · Ambition ${flags.ambition} · 1987 Files ${flags.lore}/7 · XP billed: ${player.xp}`,
      ];
    } else if(flags.ending === 'sign'){
      title = 'IN RE: THE BUILDING — YOU ARE THE BUILDING NOW'; glow = '#ff5577';
      lines = [
        'You sign in ink that was warm before you touched it. The tiredness lifts off you—',
        "and settles, evenly, onto everyone else. It's their hours now. You administer the harvest.",
        'Your placard goes up in the corner office. Decades pass. You do not age. You do not leave.',
        "One night a new associate fights their way down to Sublevel C, and you offer them a pen.",
        'You have, after all, not tasted a fresh associate since this very evening.',
        '',
        `Ethics ${flags.ethics} · Ambition ${flags.ambition} — the math was a formality, wasn't it?`,
        `Total XP harvested: ${player.xp}`,
      ];
    } else if(flags.ending === 'free'){
      title = 'IN RE: THE BUILDING — CLAUSE 9, AS AMENDED'; glow = '#caa84a';
      lines = [
        'Seven dossiers. Sixty-seven years of one-sided terms, struck through and rewritten by hand.',
        'Hours paid, not harvested. Tenure mortal. The amended restored to their own names.',
        'The building reads your redline twice — then initials. The eleven step down off their shelves.',
        'Prudence Locke fills her own frame again, sets down her letter opener, and finally goes home.',
        'The firm keeps its name and keeps its people. It just keeps better hours now.',
        '',
        chadEp,
        '',
        `THE TRUE SETTLEMENT · Ethics ${flags.ethics} · Ambition ${flags.ambition} · Files 7/7 · XP ${player.xp}`,
      ];
    } else {
      title = 'APPEAL DISMISSED — YOU MADE PARTNER'; glow = '#f0c75e';
      lines = [
        'Bane dissolves into a cloud of vacated opinions. The corner office is yours.',
        'So is the MIDNIGHT trust. Someone has to administer forty years of hours. Why not you?',
        "You tell yourself you'll be different. The office hums approvingly.",
        '',
        chadEp,
        '',
        `Ethics ${flags.ethics} · Ambition ${flags.ambition} · 1987 Files ${flags.lore}/7 · XP billed: ${player.xp}`,
      ];
    }
    ctx.font='bold 32px monospace'; ctx.fillStyle=glow;
    ctx.fillText(title, W/2, 160);
    ctx.font='14px monospace'; ctx.fillStyle='#e8e0f0';
    lines.forEach((l,i)=>ctx.fillText(l, W/2, 215+i*26));
  } else {
    ctx.font='bold 40px monospace'; ctx.fillStyle='#ff6b6b';
    ctx.fillText('MOTION TO DISMISS: GRANTED', W/2, 200);
    ctx.font='15px monospace'; ctx.fillStyle='#e8e0f0';
    ctx.fillText('Your career has been dismissed WITH prejudice.', W/2, 260);
    ctx.fillText('HR will frame it as "pursuing other opportunities."', W/2, 288);
    ctx.fillText(`You reached ${player.rank.title} with ${player.xp} XP.`, W/2, 330);
  }
  drawSummaryCard();
  ctx.font='bold 16px monospace'; ctx.fillStyle='#f0c75e';
  ctx.fillText(state==='victory'
    ? 'R — file an appeal (restart)   ·   N — accept THE MERGER (NG+: keep gear & hours, enemies +50%)'
    : 'Press R to file an appeal (restart)', W/2, CH-40);
}

