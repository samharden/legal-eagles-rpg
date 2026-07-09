"use strict";
// ============================== AUDIO ==============================
// All sound is synthesized via Web Audio — no asset files. The context is
// created on the start-button click (user gesture, satisfies autoplay policy).
const AU = { ctx:null, master:null, sfx:null, mus:null, on:true, step:0, nextT:0, song:'office' };
function audioInit(){
  if(AU.ctx) return;
  const C = new (window.AudioContext||window.webkitAudioContext)();
  AU.ctx = C;
  AU.master = C.createGain(); AU.master.gain.value = AU.on?0.5:0; AU.master.connect(C.destination);
  AU.sfx = C.createGain(); AU.sfx.gain.value = 0.8;  AU.sfx.connect(AU.master);
  AU.mus = C.createGain(); AU.mus.gain.value = 0.3; AU.mus.connect(AU.master);
  // echo send for the lead: dotted-8th delay (time set per song) with damped feedback
  AU.echo = C.createGain(); AU.echo.gain.value = 0.3;
  AU.echoDelay = C.createDelay(1.0); AU.echoDelay.delayTime.value = 0.3;
  const fb = C.createGain(); fb.gain.value = 0.38;
  const damp = C.createBiquadFilter(); damp.type='lowpass'; damp.frequency.value = 2400;
  AU.echo.connect(AU.echoDelay); AU.echoDelay.connect(damp); damp.connect(fb); fb.connect(AU.echoDelay);
  damp.connect(AU.mus);
  AU.nextT = C.currentTime;
  if(C.state==='suspended') C.resume();
}
// A controller-driven start is a synthetic click, not a user gesture, so the
// context can be born suspended — resume it on the first real interaction.
for(const ev of ['pointerdown','keydown','touchstart'])
  window.addEventListener(ev, ()=>{ if(AU.ctx && AU.ctx.state==='suspended') AU.ctx.resume(); }, { capture:true });
function tone({f=440, f2=0, type='square', t=0.1, vol=0.15, when=0, dest=null}){
  if(!AU.ctx || !AU.on) return;
  const C=AU.ctx, o=C.createOscillator(), g=C.createGain(), st=C.currentTime+when;
  o.type=type; o.frequency.setValueAtTime(f, st);
  if(f2) o.frequency.exponentialRampToValueAtTime(Math.max(1,f2), st+t);
  g.gain.setValueAtTime(vol, st);
  g.gain.exponentialRampToValueAtTime(0.001, st+t);
  o.connect(g); g.connect(dest||AU.sfx);
  o.start(st); o.stop(st+t+0.02);
}
function noiseHit({t=0.15, vol=0.2, fc=1200, hp=0, when=0, dest=null}){
  if(!AU.ctx || !AU.on) return;
  const C=AU.ctx, len=Math.max(1, Math.floor(C.sampleRate*t));
  const buf=C.createBuffer(1,len,C.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
  const src=C.createBufferSource(); src.buffer=buf;
  const flt=C.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=fc;
  const g=C.createGain(); g.gain.value=vol;
  src.connect(flt);
  let node=flt;
  if(hp){ const h=C.createBiquadFilter(); h.type='highpass'; h.frequency.value=hp; flt.connect(h); node=h; }
  node.connect(g); g.connect(dest||AU.sfx);
  src.start(C.currentTime+when);
}
const SFX = {
  shoot(cls){ const f={lit:900,corp:300,crim:1150,ip:700,tax:520}[cls]||800; tone({f, f2:f*0.4, t:0.07, vol:0.09}); },
  melee(){ noiseHit({t:0.06, vol:0.1, fc:2600}); },
  hit(){ tone({f:200, f2:90, t:0.08, vol:0.13}); },
  spin(){ tone({f:300, f2:900, type:'sawtooth', t:0.3, vol:0.09}); noiseHit({t:0.25, vol:0.09, fc:1800}); },
  dash(){ tone({f:340, f2:980, type:'sawtooth', t:0.12, vol:0.07}); noiseHit({t:0.1, vol:0.06, fc:2200}); },
  slam(){ noiseHit({t:0.22, vol:0.18, fc:600}); tone({f:90, f2:45, type:'sawtooth', t:0.25, vol:0.14}); },
  die(){ noiseHit({t:0.16, vol:0.16, fc:900}); tone({f:300, f2:60, type:'triangle', t:0.2, vol:0.14}); },
  boom(){ noiseHit({t:0.5, vol:0.28, fc:500}); tone({f:150, f2:40, type:'sawtooth', t:0.5, vol:0.18}); },
  hurt(){ tone({f:220, f2:110, type:'sawtooth', t:0.12, vol:0.15}); },
  pick(){ tone({f:660, t:0.06, vol:0.11}); tone({f:990, t:0.08, vol:0.11, when:0.06}); },
  coffee(){ tone({f:520, t:0.05, vol:0.1}); tone({f:660, t:0.05, vol:0.1, when:0.05}); tone({f:880, t:0.09, vol:0.11, when:0.1}); },
  blip(){ tone({f:740, t:0.035, vol:0.06}); },
  promote(){ [523,659,784,1047].forEach((f,i)=>tone({f, t:0.12, vol:0.13, when:i*0.09})); },
  quest(){ tone({f:392, t:0.1, vol:0.11}); tone({f:523, t:0.14, vol:0.11, when:0.1}); },
  // a matter resolving: a confirming low-then-bright cadence, distinct from the rank-up fanfare
  closeMatter(){ tone({f:330, t:0.14, vol:0.12}); tone({f:494, t:0.16, vol:0.12, when:0.12}); tone({f:659, t:0.22, vol:0.13, when:0.26}); tone({f:988, t:0.12, vol:0.08, when:0.3}); },
  // a boss arriving: subterranean dread under a brief metallic snarl
  bossIntro(){ tone({f:78, f2:52, type:'sawtooth', t:1.0, vol:0.22}); tone({f:155, f2:116, type:'square', t:0.7, vol:0.07, when:0.04}); noiseHit({t:0.7, vol:0.12, fc:320}); tone({f:233, t:0.3, vol:0.05, when:0.5}); },
  gate(){ tone({f:120, f2:60, type:'sawtooth', t:0.4, vol:0.18}); noiseHit({t:0.3, vol:0.13, fc:400}); },
  lever(){ tone({f:440, f2:220, t:0.08, vol:0.11}); },
  buzz(){ tone({f:110, type:'sawtooth', t:0.35, vol:0.16}); },
  stairs(){ tone({f:330, f2:165, type:'triangle', t:0.18, vol:0.11}); },
  crash(){ noiseHit({t:0.4, vol:0.22, fc:700}); tone({f:200, f2:50, t:0.35, vol:0.16}); },
  jingleWin(){ [523,659,784,1047,1319].forEach((f,i)=>tone({f, t:0.16, vol:0.14, when:i*0.12})); },
  jingleLose(){ [392,330,262,196].forEach((f,i)=>tone({f, t:0.22, vol:0.14, when:i*0.16, type:'triangle'})); },
};
// ---- music: a small synth band, one song per floor ------------------------
// Each song is a 4-bar composition (64 8th-note steps): bass/lead lines as MIDI
// note numbers (0 = rest), one pad chord per bar, and 16-step drum strings
// ('x' = hit) that repeat every bar. `swing` delays every off-beat 8th by that
// fraction of a step. Songs may use shorter (16/32-step) lines; they just loop.
const NT = n => 440*Math.pow(2,(n-69)/12);
const SONGS = {
  office:{ bpm:112, swing:0.16,   // billable-hours bossa: Am F Dm E, brushed kit
    kick:'x...x...x...x...', snare:'....x.......x...', hat:'..x...x...x...xx',
    chords:[[57,60,64],[53,57,60],[50,53,57],[52,56,59]],
    bass:[45,0,45,0,52,0,48,0, 45,0,45,0,50,0,43,0,
          41,0,41,0,48,0,45,0, 41,0,41,0,45,0,48,0,
          38,0,38,0,45,0,41,0, 38,0,38,0,41,0,45,0,
          40,0,40,0,47,0,44,0, 40,0,43,0,45,0,47,0],
    lead:[69,0,0,72,0,74,0,72, 0,0,76,0,74,72,0,0,
          0,0,65,0,67,69,0,0, 72,0,0,69,0,0,67,0,
          0,0,62,0,65,0,67,0, 69,0,65,0,62,0,0,0,
          0,0,64,0,68,0,71,0, 72,0,71,0,68,0,64,0] },
  annex:{ bpm:84,                 // records dust: Dm Bb F A, distant and echoing
    kick:'x.......x.......', hat:'....x.......x...',
    chords:[[50,53,57],[46,50,53],[53,57,60],[49,52,57]],
    bass:[38,0,0,0,0,0,45,0, 38,0,0,0,41,0,43,0,
          34,0,0,0,0,0,41,0, 34,0,0,0,38,0,41,0,
          41,0,0,0,0,0,48,0, 41,0,0,0,45,0,41,0,
          33,0,0,0,0,0,40,0, 33,0,0,0,40,0,44,0],
    lead:[0,0,0,0,74,0,0,0, 0,0,72,0,0,0,69,0,
          0,0,0,0,0,77,0,0, 74,0,0,0,0,0,70,0,
          0,0,0,0,72,0,0,0, 0,0,69,0,0,65,0,0,
          0,0,0,0,73,0,0,0, 0,0,76,0,0,0,73,0] },
  garage:{ bpm:96,                // sublevel P3: low pentatonic grind, Am G F E
    kick:'x..x....x..x....', snare:'....x.......x...', hat:'..x...x...x...x.',
    chords:[[57,60,64],[55,59,62],[53,57,60],[52,56,59]],
    bass:[33,0,33,0,36,0,33,0, 40,0,38,0,36,0,33,0,
          31,0,31,0,35,0,31,0, 38,0,36,0,35,0,31,0,
          29,0,29,0,33,0,29,0, 36,0,34,0,33,0,29,0,
          28,0,28,0,32,0,35,0, 32,0,28,0,32,0,35,0],
    lead:[0,0,0,64,0,0,63,0, 0,0,0,60,0,0,0,0,
          0,0,0,62,0,0,59,0, 0,0,0,55,0,0,0,0,
          0,0,0,60,0,0,57,0, 0,0,0,53,0,0,0,0,
          0,0,0,59,0,0,56,0, 0,0,64,0,0,63,0,0] },
  boss:{ bpm:148,                 // no pad — just the riff, the kick, and you
    kick:'x.x.x.x.x.x.x.x.', snare:'....x.......x..x', hat:'xxxxxxxxxxxxxxxx',
    bass:[33,33,45,33,33,33,45,33, 33,33,45,33,31,31,43,31,
          29,29,41,29,29,29,41,29, 31,31,43,31,32,32,44,32],
    lead:[69,0,72,74,0,76,0,74, 72,0,69,0,71,0,67,0,
          65,0,69,72,0,74,0,72, 76,0,75,0,74,0,71,0] },
  floor24:{ bpm:120, swing:0.12,  // executive gloss: Em Cmaj7 Am B, slinky hats
    kick:'x...x...x...x...', snare:'....x.......x...', hat:'x.x.x.xxx.x.x.x.',
    chords:[[52,55,59],[48,52,55],[45,48,52],[47,51,54]],
    bass:[40,0,0,40,47,0,40,0, 40,0,52,0,47,0,45,0,
          36,0,0,36,43,0,36,0, 36,0,48,0,43,0,40,0,
          33,0,0,33,40,0,33,0, 33,0,45,0,40,0,38,0,
          35,0,0,35,42,0,35,0, 35,0,47,0,45,0,42,0],
    lead:[76,0,75,0,71,0,0,0, 0,0,76,0,79,0,76,0,
          0,0,72,0,76,0,79,0, 0,0,76,0,72,0,71,0,
          0,0,69,0,72,0,76,0, 0,0,72,0,69,0,64,0,
          0,0,66,0,71,0,75,0, 78,0,75,0,71,0,66,0] },
  courtroom:{ bpm:100,            // all rise: Cm Ab Eb G, processional
    kick:'x.......x.......', snare:'............x...', hat:'....x.......x...',
    chords:[[48,51,55],[44,48,51],[51,55,58],[43,47,50]],
    bass:[36,0,0,0,43,0,0,0, 36,0,0,0,43,0,41,0,
          32,0,0,0,39,0,0,0, 32,0,0,0,36,0,39,0,
          39,0,0,0,46,0,0,0, 39,0,0,0,43,0,46,0,
          31,0,0,0,38,0,0,0, 31,0,0,0,35,0,38,0],
    lead:[0,0,72,0,0,0,67,0, 0,0,70,0,0,0,67,0,
          0,0,68,0,0,0,63,0, 0,0,68,0,0,0,72,0,
          0,0,70,0,0,0,67,0, 0,0,63,0,0,0,58,0,
          0,0,67,0,0,0,71,0, 0,0,74,0,0,0,71,0] },
  intro:{ bpm:94,                 // the orientation film: noir newsreel, Am with a bad feeling
    kick:'x.......x.......', snare:'............x...', hat:'..x...x...x...x.',
    chords:[[57,60,64],[53,57,60],[52,56,59],[56,59,64]],
    bass:[33,0,0,0,40,0,0,0, 33,0,0,0,39,0,40,0,
          29,0,0,0,36,0,0,0, 29,0,0,0,33,0,36,0,
          28,0,0,0,35,0,0,0, 28,0,0,0,32,0,35,0,
          32,0,0,0,39,0,0,0, 32,0,35,0,38,0,40,0],
    lead:[0,0,69,0,0,0,72,0, 0,0,76,0,0,75,0,0,
          0,0,72,0,0,0,69,0, 0,0,65,0,0,67,0,0,
          0,0,68,0,0,0,64,0, 0,0,62,0,0,64,0,0,
          0,0,64,0,0,0,68,0, 0,0,71,0,0,74,0,0] },
  stacks:{ bpm:76,                // the sub-library: slower than the annex, older than the firm
    kick:'x...............',
    chords:[[48,51,55],[43,46,50],[44,48,51],[46,50,53]],
    bass:[36,0,0,0,0,0,0,0, 36,0,0,0,0,0,43,0,
          31,0,0,0,0,0,0,0, 31,0,0,0,0,0,38,0,
          32,0,0,0,0,0,0,0, 32,0,0,0,0,0,39,0,
          34,0,0,0,0,0,0,0, 34,0,0,0,0,0,41,0],
    lead:[0,0,0,0,0,0,72,0, 0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0, 74,0,0,0,0,0,0,0,
          0,0,0,0,0,0,75,0, 0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0, 0,0,77,0,0,74,0,0] },
};
// ---- band members ----
function kickAt(when, vol=0.34){ tone({f:130, f2:40, type:'sine', t:0.13, vol, when, dest:AU.mus}); }
function snareAt(when, vol=0.11){
  noiseHit({t:0.09, vol, fc:4200, hp:900, when, dest:AU.mus});
  tone({f:195, f2:130, type:'triangle', t:0.07, vol:vol*0.6, when, dest:AU.mus});
}
function hatAt(when, vol=0.035){ noiseHit({t:0.03, vol, fc:9500, hp:5500, when, dest:AU.mus}); }
function bassNote(f, t, when, vol=0.17){
  const C=AU.ctx, st=C.currentTime+when;
  const o=C.createOscillator(); o.type='sawtooth'; o.frequency.value=f;
  const flt=C.createBiquadFilter(); flt.type='lowpass';   // plucky filter envelope
  flt.frequency.setValueAtTime(Math.min(4000, f*5), st);
  flt.frequency.exponentialRampToValueAtTime(Math.max(60, f*1.5), st+t);
  const g=C.createGain(); g.gain.setValueAtTime(vol, st); g.gain.exponentialRampToValueAtTime(0.001, st+t);
  o.connect(flt); flt.connect(g); g.connect(AU.mus);
  o.start(st); o.stop(st+t+0.02);
}
function leadNote(f, t, when, vol=0.045){
  const C=AU.ctx, st=C.currentTime+when, g=C.createGain();
  g.gain.setValueAtTime(vol, st); g.gain.exponentialRampToValueAtTime(0.001, st+t);
  for(const det of [-4,4]){   // two detuned squares = cheap chorus
    const o=C.createOscillator(); o.type='square'; o.frequency.value=f; o.detune.value=det;
    o.connect(g); o.start(st); o.stop(st+t+0.02);
  }
  g.connect(AU.mus); g.connect(AU.echo);
}
function padChord(notes, dur, when, vol=0.02){
  const C=AU.ctx, st=C.currentTime+when, g=C.createGain();
  g.gain.setValueAtTime(0.0001, st);
  g.gain.exponentialRampToValueAtTime(vol, st+dur*0.3);
  g.gain.setValueAtTime(vol, st+dur*0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, st+dur);
  const flt=C.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=1100;
  flt.connect(g); g.connect(AU.mus);
  for(const n of notes) for(const det of [-6,6]){
    const o=C.createOscillator(); o.type='sawtooth'; o.frequency.value=NT(n); o.detune.value=det;
    o.connect(flt); o.start(st); o.stop(st+dur+0.05);
  }
}
function musicTick(){
  if(!AU.ctx || !AU.on) return;
  const C = AU.ctx;
  if(state!=='play' && state!=='dialog' && state!=='intro'){ AU.nextT = Math.max(AU.nextT, C.currentTime); return; }
  const want = state==='intro' ? 'intro' : (enemies && enemies.some(e=>e.boss) ? 'boss' : worldId);
  if(want !== AU.song){   // duck out, restart the new song from its top bar
    AU.song = want; AU.step = 0;
    const g = AU.mus.gain, now = C.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now+0.2);
    g.linearRampToValueAtTime(0.3, now+0.7);
    AU.nextT = Math.max(AU.nextT, now+0.25);
  }
  const song = SONGS[AU.song] || SONGS.office;
  const spb = 60/song.bpm/2; // 8th-note steps
  AU.echoDelay.delayTime.value = Math.min(0.9, spb*3); // dotted-8th echo
  while(AU.nextT < C.currentTime + 0.15){
    const s = AU.step, when = AU.nextT - C.currentTime + (s%2 ? (song.swing||0)*spb : 0);
    const b = song.bass[s % song.bass.length]; if(b) bassNote(NT(b), spb*0.95, when);
    const l = song.lead[s % song.lead.length]; if(l) leadNote(NT(l), spb*0.85, when);
    const d = s % 16;
    if(song.kick  && song.kick[d] ==='x') kickAt(when);
    if(song.snare && song.snare[d]==='x') snareAt(when);
    if(song.hat   && song.hat[d]  ==='x') hatAt(when);
    if(song.chords && d===0) padChord(song.chords[(s>>4) % song.chords.length], spb*16, when);
    AU.step++; AU.nextT += spb;
  }
}
function toggleMute(){
  if(!AU.ctx) return;
  AU.on = !AU.on;
  AU.master.gain.value = AU.on ? 0.5 : 0;
  if(AU.on) AU.nextT = AU.ctx.currentTime; // don't burst-schedule every step missed while muted
  if(typeof announce === 'function' && player) announce(AU.on ? 'Sound: ON. The firm hums again.' : 'Sound: MUTED. Blissful, billable silence.', false, 2);
}

