"use strict";
// ============================== INTRO / ORIENTATION FILM ==============================
// The arcade-style cold open: a skippable, auto-advancing briefing reel that plays
// between signing the engagement letter and the first frame of gameplay. Runs as
// state==='intro' — loop.js drives updateIntro()/drawIntro(); any key/tap/A-press
// advances (or fast-forwards the typewriter), Esc / B / the SKIP chip goes straight
// to startGame with the selections held in introPend.
let introPend = null;                       // {genderId, classId} held until the reel ends
let introN = 0, introClock = 0;
let introSceneT = 0, introDt = 0;           // seconds in the current reel; last frame's dt (introSpr reads it)
let introTW = null, introTrans = null;      // LEAnim.Typewriter + LEAnim.Transition for the current scene
let introRigs = {}, introBeats = {};        // per-scene sprite rigs + beat counters (reset every scene)
let introShake = 0;                         // tiny SHOUT/splice jolt, local to the reel
let introScenes = [];
const INTRO_CPS = 55;                       // typewriter speed, chars/sec
const INTRO_SKIP = { x:830, y:14, w:114, h:32 };

// Every reel starts here: fresh typewriter, fresh splice, fresh rigs.
function introBeginScene(){
  const s = introScenes[introN]; if(!s) return;
  introTW = new LEAnim.Typewriter(s.lines.join('\n'), {
    cps: INTRO_CPS,
    // an ALL-CAPS word landing gives the film a jolt — GRAVES, OBJECT, NAME PARTNER…
    onShout: () => { introShake = Math.max(introShake, 2.2); },
  });
  introTrans = new LEAnim.Transition(0.5);
  introTrans.start();
  introSceneT = 0; introRigs = {}; introBeats = {}; introShake = 2;
}

// Lazily rig a sprite the first time a scene draws it, then draw through the rig
// so it pops in, breathes, and can react. Returns the rig so callers can trigger it.
function introSpr(id, key, x, y, size, flip, alpha){
  let r = introRigs[id];
  if(!r){ r = new LEAnim.Rig({ bounce:1 }); r.spawn(); introRigs[id] = r; }
  r.step(introDt, { moving:false });
  r.draw(ctx, SPR[key], x, y, size, !!flip, alpha==null?1:alpha);
  return r;
}
// Fires once per `period` seconds of scene time — never on the first frame.
function introBeat(id, period, phase){
  const n = Math.floor((introSceneT + (phase||0))/period);
  if(introBeats[id]===undefined){ introBeats[id] = n; return false; }
  if(n > introBeats[id]){ introBeats[id] = n; return true; }
  return false;
}

function startIntro(genderId, classId){
  introPend = { genderId, classId };
  introScenes = buildIntroScenes();
  introN = 0; introClock = 0;
  introBeginScene();
  state = 'intro';
}

// Each scene: exhibit tag + title (header), an art painter fn(t), source lines
// (wrapped here once), and the y the typed text starts at.
function buildIntroScenes(){
  // touch renders the canvas at ~40% size, so the reel gets bigger type and a narrower wrap
  const wl = (lines, n = IS_TOUCH ? 66 : 80) => lines.flatMap(t => wrap(t, n));
  const practice = IS_TOUCH ? [
      "Tap TALK next to partners and staff — a gold ! means they have work for you.",
      "STRIKE, FIRE, SPIN and DASH with the buttons. Move with the joystick.",
      "Coffee heals. The supply closet sells gear for billable hours. Your BAG holds gear and open matters.",
    ] : [
      "TALK [E] to partners and staff — a gold ! means they have work for you.",
      "STRIKE [Space] · FIRE [K or click — the mouse aims] · SPIN [L] · DASH [Shift].",
      "Coffee heals. The supply closet sells gear for billable hours. Press H in-game for the full Field Manual.",
    ];
  if(padOn) practice.push("Controller detected — A talk · B strike · X fire · Y spin · LB dash.");
  return [
    { ex:'EXHIBIT A', title:'THE FIRM', art:introArtFirm, ty:352, lines:wl([
        "11:58 PM. Downtown. The tower at 1959 Precedent Plaza.",
        "DEWEY, CHEATHAM & HOWE LLP — four hundred attorneys, six-minute billing increments, one elevator button nobody talks about.",
        "The lights on the executive floors never go out.",
        "Neither, strictly speaking, do the partners.",
      ]) },
    { ex:'EXHIBIT B', title:'MARCH 13, 1987', art:introArtLegend, ty:372, lines:wl([
        "On this night, Senior Partner THADDEUS GRAVES III billed twenty-five hours in a single day.",
        "At midnight he was promoted to Partner Emeritus. He stopped aging. The firm stopped asking.",
        "Since that night, hours have vanished from every associate's timesheet — and some associates have vanished with them.",
        "HR calls this 'attrition'. HR is the printer now.",
      ]) },
    { ex:'EXHIBIT C', title:'THE NEW HIRE', art:introArtHire, ty:372, lines:wl([
        "You. Fresh bar card, one pinstripe suit, student debt visible from orbit.",
        "The firm has offered you a desk, a briefcase, and every matter nobody else would touch.",
        "Close the matters. Bill the hours. Rise from ASSOCIATE to NAME PARTNER.",
        "And if the basement asks for your hours — OBJECT.",
      ]) },
    { ex:'EXHIBIT D', title:'THE OPPOSITION', art:introArtRoster, ty:446, lines:wl([
        "Everything the practice of law can throw at you, it will. Sanction it all — every hour is billable.",
        "Rumor speaks of something older, below the records annex. The rumor bills twenty-five hours a day.",
      ]) },
    { ex:'EXHIBIT E', title:'YOUR PRACTICE', art:introArtPractice, ty:368, lines:wl(practice) },
    { ex:'EXHIBIT F', title:'THE ENGAGEMENT', art:introArtStart, ty:392, lines:wl([
        "Your signature is binding. Your desk is on fire. This is normal.",
        "Bill well, counselor — and stay out of the basement after midnight.",
      ]) },
  ];
}

// deterministic pseudo-random — stable stars/windows across frames
const ir = i => { const x = Math.sin(i*127.1)*43758.5453; return x - Math.floor(x); };

function updateIntro(dt){
  introDt = dt;                     // introSpr() steps the rigs with this
  introClock += dt; introSceneT += dt;
  if(!introScenes[introN] || !introTrans) return;
  introTrans.step(dt);
  if(introShake > 0) introShake = Math.max(0, introShake - dt*26);
  const prev = introTW.count;
  if(introTrans.t > 0.12) introTW.step(dt);   // let the splice settle before typing
  // typewriter tick every few characters
  if(AU.ctx && AU.on && (prev/3|0) !== (introTW.count/3|0))
    tone({ f:1250 + ((introTW.count*37)%5)*85, type:'square', t:0.012, vol:0.018 });
  // when fully typed we simply wait here for the player's input (introAdvance)
  // instead of auto-advancing, so nobody gets rushed past a scene mid-read.
}
function introAdvance(){ // any input: finish the typing first, then turn the page
  if(!introTW) return;
  if(!introTW.done){ introTW.finish(); return; }
  introNext();
}
function introNext(){
  introN++;
  if(introN >= introScenes.length){ introFinish(); return; }
  introBeginScene();
  if(AU.ctx && AU.on){ noiseHit({ t:0.09, vol:0.06, fc:3200, hp:900 }); tone({ f:392, t:0.06, vol:0.05 }); }
}
function introSkip(){ introFinish(); }
function introFinish(){
  if(!introPend) return;                 // double-fire guard (key + pointer same frame)
  const p = introPend; introPend = null;
  SFX.quest();
  startGame(p.genderId, p.classId);
}

// ---- scene art -------------------------------------------------------------
// All art lives in the y 84..340 band so the typed text and mobile crop are safe.
function introArtFirm(t){
  for(let i=0;i<70;i++){ // stars
    ctx.globalAlpha = 0.25 + 0.5*Math.abs(Math.sin(t*1.6 + i));
    ctx.fillStyle = '#d8d2e8';
    ctx.fillRect(20 + ir(i)*920, 84 + ir(i+99)*180, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8d2e8'; ctx.beginPath(); ctx.arc(800, 122, 20, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#bcb0d4'; ctx.beginPath(); ctx.arc(793, 116, 5, 0, Math.PI*2); ctx.fill();
  // background skyline
  for(const [bx,by,bw] of [[120,190,90],[230,158,70],[640,172,80],[740,206,66],[300,214,60]]){
    ctx.fillStyle = '#141021'; ctx.fillRect(bx, by, bw, 320-by);
    ctx.fillStyle = 'rgba(240,199,94,0.25)';
    for(let i=0;i<8;i++) if(ir(bx+i)>0.6) ctx.fillRect(bx+6+(i%3)*((bw-16)/3), by+8+((i/3)|0)*22, 8, 6);
  }
  // the firm's tower
  ctx.fillStyle = '#241d36'; ctx.fillRect(410, 98, 140, 222);
  ctx.strokeStyle = '#4a3f63'; ctx.lineWidth = 2; ctx.strokeRect(410, 98, 140, 222);
  ctx.strokeStyle = '#4a3f63'; ctx.beginPath(); ctx.moveTo(480, 98); ctx.lineTo(480, 74); ctx.stroke();
  ctx.fillStyle = `rgba(255,85,119,${0.4+0.5*Math.abs(Math.sin(t*2.4))})`;
  ctx.fillRect(477, 70, 6, 6); // aviation light, allegedly
  for(let c=0;c<6;c++) for(let r=0;r<12;r++){
    const lit = ir(c*31 + r*7) > 0.48;
    if(r < 2){ ctx.fillStyle = `rgba(255,85,119,${0.35+0.4*Math.abs(Math.sin(t*3 + c))})`; }
    else if(lit){ ctx.fillStyle = 'rgba(240,199,94,0.75)'; }
    else ctx.fillStyle = '#161122';
    ctx.fillRect(418 + c*22, 106 + r*17, 14, 10);
  }
  ctx.fillStyle = '#1a1626'; ctx.fillRect(0, 320, W, 14); // street
}
function introArtLegend(t){
  // film frame
  ctx.fillStyle = '#221a10'; ctx.fillRect(240, 92, 480, 232);
  ctx.strokeStyle = '#6b5836'; ctx.lineWidth = 4; ctx.strokeRect(240, 92, 480, 232);
  ctx.fillStyle = '#0d0a14';
  for(let y=100;y<316;y+=26){ ctx.fillRect(250, y, 12, 14); ctx.fillRect(698, y, 12, 14); }
  // the emeritus, at rest — and periodically not at rest
  if(introBeat('emeritus', 3.2)){ const r = introRigs['emeritus']; if(r) r.hurt(0, -0.3, 0.45); }
  introSpr('emeritus', 'grandfather', 480, 214, 128, false, 0.95);
  ctx.font = 'bold 24px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = `rgba(255,85,119,${0.45+0.5*Math.abs(Math.sin(t*6.5))})`;
  ctx.fillText('25:00:00', 480 + (Math.random()<0.06 ? 3 : 0), 128);
  drawSprite(SPR.file, 348, 286, 30, false, 0.85);
  drawSprite(SPR.file, 612, 280, 30, true, 0.85);
  drawSprite(SPR.file, 388, 148, 26, false, 0.7);
  ctx.fillStyle = 'rgba(255,244,214,0.05)'; // grain
  for(let i=0;i<36;i++) ctx.fillRect(250+Math.random()*460, 100+Math.random()*214, 2, 2);
  ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#8a7448';
  ctx.fillText('ARCHIVE FOOTAGE — RESOLUTION: DO NOT INVESTIGATE', 480, 344);
}
function introArtHire(t){
  const g = ctx.createRadialGradient(480, 230, 30, 480, 230, 220);
  g.addColorStop(0, 'rgba(240,199,94,0.10)'); g.addColorStop(1, 'rgba(240,199,94,0)');
  ctx.fillStyle = g; ctx.fillRect(260, 84, 440, 260);
  if(introBeat('hm', 2.4, 0))   introRigs['hm'] && introRigs['hm'].strike();
  if(introBeat('hf', 2.4, 1.2))  introRigs['hf'] && introRigs['hf'].strike();
  introSpr('hm', 'p_m', 415, 200, 108, false);
  introSpr('hf', 'p_f', 545, 200, 108, true);
  ctx.font = 'bold 20px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = '#f0c75e';
  ctx.fillText('!', 415, 128 + Math.sin(t*5)*3);
  ctx.fillText('!', 545, 128 + Math.sin(t*5 + 2)*3);
  drawSprite(SPR.briefcase, 400, 306, 42);
  drawSprite(SPR.stamper, 480, 306, 42);
  drawSprite(SPR.coffee, 560, 306, 42);
}
function introArtRoster(t){
  const foes = [
    ['paralegal', 'ROGUE PARALEGAL', 8], ['intern', 'OVER-CAFFEINATED INTERN', 6],
    ['wraith', 'BILLABLE HOUR WRAITH', 10], ['golem', 'PAPERWORK GOLEM', 12],
    ['counsel', 'OPPOSING COUNSEL', 22], ['bailiff', 'BAILIFF', 20],
  ];
  ctx.textAlign = 'left';
  foes.forEach(([spr, nm, hrs], i) => {
    const x = i%2 ? 560 : 210, y = 132 + ((i/2)|0)*76;
    if(introSceneT < i*0.12) return;                       // staggered entrance
    if(introBeat('foe'+i, 2.6, i*0.4)){ const r = introRigs['foe'+i]; if(r) r.hurt(i%2 ? -1 : 1, 0, 0.7); }
    introSpr('foe'+i, spr, x, y, 52, i%2===1);
    ctx.font = 'bold 15px "Courier New", monospace'; ctx.fillStyle = '#e8e0f0';
    ctx.fillText(nm, x + 40, y - 4);
    ctx.font = '13px "Courier New", monospace'; ctx.fillStyle = '#f0c75e';
    ctx.fillText(hrs + ' HRS', x + 40, y + 14);
  });
  // and the thing in the sub-basement
  drawSprite(SPR.grandfather, 244, 398, 54, false, 0.20 + 0.06*Math.sin(t*1.3));
  ctx.font = 'bold 14px "Courier New", monospace'; ctx.fillStyle = '#ff5577';
  ctx.fillText('??? — SUBLEVEL B4 AND BELOW', 290, 392);
  ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#9b8fb5';
  ctx.fillText('[RATE SEALED BY COURT ORDER]', 290, 410);
}
function introArtPractice(t){
  const panels = [
    ['TALK',       'hargrove',  IS_TOUCH ? 'gold ! = work' : 'E — gold ! = work'],
    ['SANCTION',   'counsel',   'strike · fire · spin · dash'],
    ['CAFFEINATE', 'coffee',    'coffee is medicine'],
    ['LAWYER UP',  'briefcase', IS_TOUCH ? 'BAG — gear & matters' : 'I — bag · H — manual'],
  ];
  panels.forEach(([lbl, spr, sub], i) => {
    const x = 128 + i*184;
    ctx.fillStyle = '#161122'; ctx.fillRect(x, 104, 168, 208);
    ctx.strokeStyle = '#4a3f63'; ctx.lineWidth = 2; ctx.strokeRect(x, 104, 168, 208);
    ctx.font = 'bold 15px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#f0c75e'; ctx.fillText(lbl, x+84, 128);
    if(i===0 && introBeat('harg', 2.1))    introRigs['pan0'] && introRigs['pan0'].punch(4);
    if(i===1 && introBeat('counsel', 1.7))  introRigs['pan1'] && introRigs['pan1'].strike();
    if(spr==='coffee' || spr==='briefcase') drawSprite(SPR[spr], x+84, 208 + Math.sin(t*2 + i)*3, 66);
    else introSpr('pan'+i, spr, x+84, 208, 66);
    if(i===0){ ctx.fillStyle = '#f0c75e'; ctx.font = 'bold 18px "Courier New", monospace';
               ctx.fillText('!', x+84, 158 + Math.sin(t*5)*3); }
    if(i===1){ ctx.strokeStyle = `rgba(240,199,94,${0.5+0.4*Math.sin(t*4)})`; ctx.lineWidth = 3;
               ctx.beginPath(); ctx.arc(x+84, 208, 46, t*3, t*3 + 1.2); ctx.stroke(); }
    ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#9b8fb5';
    ctx.fillText(sub, x+84, 296);
  });
}
function introArtStart(t){
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = '#7a5c00'; ctx.shadowBlur = 22;
  ctx.fillStyle = '#f0c75e'; ctx.font = 'bold 52px "Courier New", monospace';
  ctx.fillText('LEGAL EAGLES', 480, 168);
  ctx.restore();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9b8fb5'; ctx.font = '18px "Courier New", monospace';
  ctx.fillText('R I S E   T O   P A R T N E R', 480, 204);
  introSpr('sm', 'p_m', 428, 282, 84, false);
  introSpr('sf', 'p_f', 532, 282, 84, true);
  if(introSceneT > 1.4){
    ctx.fillStyle = '#f0c75e'; ctx.font = 'bold 20px "Courier New", monospace';
    ctx.fillText('YOUR HOURS START NOW.', 480, 344);
  }
}

// ---- render ----------------------------------------------------------------
function drawIntro(){
  const s = introScenes[introN]; if(!s || !introTrans) return;
  const t = introClock;
  ctx.setTransform(1,0,0,1,0,0);
  if(introShake > 0) ctx.translate((Math.random()*2-1)*introShake, (Math.random()*2-1)*introShake);
  ctx.fillStyle = '#08060f'; ctx.fillRect(-8, -8, W+16, CH+16);

  // the reel body splices in: fade + upward settle + a slow ken-burns push
  ctx.save();
  ctx.globalAlpha = introTrans.contentAlpha;
  const kb = introTrans.kenBurns(introSceneT);
  ctx.translate(W/2, 300); ctx.scale(kb, kb); ctx.translate(-W/2, -300 + introTrans.slideY);
  s.art(t);
  // header
  ctx.textAlign = 'center';
  ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#7d7397';
  ctx.fillText(`DEWEY, CHEATHAM & HOWE LLP · ORIENTATION FILM No. 000-1959 · ${s.ex}`, 480, 34);
  ctx.font = 'bold 26px "Courier New", monospace'; ctx.fillStyle = '#f0c75e';
  ctx.fillText(s.title.split('').join(' '), 480, 64);
  // typed body — larger type on touch, and pull the block up if the extra
  // wrapped lines would run into the prompt at y 556
  ctx.textAlign = 'left';
  ctx.font = (IS_TOUCH ? 20 : 16) + 'px "Courier New", monospace';
  const lineH = IS_TOUCH ? 30 : 27;
  let left = introTW.count, y = Math.min(s.ty, 540 - (s.lines.length-1)*lineH);
  for(const line of s.lines){
    if(left <= 0) break;
    const n = Math.min(line.length, Math.floor(left));
    ctx.fillStyle = '#e8e0f0';
    const shown = line.slice(0, n);
    ctx.fillText(shown, 140, y);
    if(n < line.length || (left - line.length - 1 < 0 && Math.sin(t*8) > 0)){
      ctx.fillStyle = '#f0c75e';
      ctx.fillText('▌', 140 + ctx.measureText(shown).width, y);
    }
    left -= line.length + 1;
    y += lineH;
  }
  ctx.restore(); ctx.globalAlpha = 1;

  // film splice: white flash, then a few tracking scratches as the frame settles
  if(introTrans.flash > 0){
    ctx.globalAlpha = introTrans.flash; ctx.fillStyle = '#f4eede';
    ctx.fillRect(0, 0, W, 600); ctx.globalAlpha = 1;
  }
  if(introTrans.t < 0.32){
    ctx.globalAlpha = (1 - introTrans.t/0.32)*0.5; ctx.fillStyle = '#0a0812';
    for(let i=0;i<4;i++) ctx.fillRect(0, ir(i + introTrans.t*40)*600, W, 2);
    ctx.globalAlpha = 1;
  }

  // footer: prompt + reel counter (kept above y 600 so the mobile crop sees it)
  ctx.textAlign = 'center';
  if(Math.sin(t*3.2) > -0.4){
    ctx.font = 'bold 14px "Courier New", monospace'; ctx.fillStyle = '#5ec8f0';
    ctx.fillText(IS_TOUCH ? 'TAP TO CONTINUE' : (padOn ? 'A — CONTINUE · B — SKIP' : 'ANY KEY / CLICK — CONTINUE · ESC — SKIP'), 480, 556);
  }
  ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#7d7397';
  ctx.fillText(`REEL ${introN+1} OF ${introScenes.length}`, 480, 582);
  // skip chip
  const k = INTRO_SKIP;
  ctx.fillStyle = 'rgba(36,29,54,0.9)'; ctx.fillRect(k.x, k.y, k.w, k.h);
  ctx.strokeStyle = '#4a3f63'; ctx.lineWidth = 2; ctx.strokeRect(k.x, k.y, k.w, k.h);
  ctx.font = 'bold 13px "Courier New", monospace'; ctx.fillStyle = '#9b8fb5';
  ctx.fillText('SKIP ▸▸', k.x + k.w/2, k.y + 21);
  // CRT dressing: scanlines + a slow-rolling brightness band + vignette
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  for(let sy=0; sy<600; sy+=4) ctx.fillRect(0, sy, W, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fillRect(0, (t*46)%640 - 30, W, 30);
  const vg = ctx.createRadialGradient(480, 300, 260, 480, 300, 620);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, 600);
  // desktop letterbox strip below the 600px playfield (cropped away on mobile)
  ctx.fillStyle = '#08060f'; ctx.fillRect(0, 600, W, CH-600);
  ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#4a3f63';
  ctx.fillText('PROPERTY OF THE ORIENTATION & COMPLIANCE DEPARTMENT — DO NOT DUPLICATE — DO NOT REWIND PAST 1987', 480, 662);
}

// pointer input: tap/click the skip chip to skip, anywhere else to advance
cv.addEventListener('pointerdown', e => {
  if(state !== 'intro') return;
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left)*(W/r.width), y = (e.clientY - r.top)*(CH/r.height);
  const k = INTRO_SKIP;
  if(x >= k.x && x <= k.x + k.w && y >= k.y && y <= k.y + k.h) introSkip();
  else introAdvance();
});
