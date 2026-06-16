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
  AU.mus = C.createGain(); AU.mus.gain.value = 0.32; AU.mus.connect(AU.master);
  AU.nextT = C.currentTime;
  if(C.state==='suspended') C.resume();
}
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
function noiseHit({t=0.15, vol=0.2, fc=1200, when=0, dest=null}){
  if(!AU.ctx || !AU.on) return;
  const C=AU.ctx, len=Math.max(1, Math.floor(C.sampleRate*t));
  const buf=C.createBuffer(1,len,C.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*(1-i/len);
  const src=C.createBufferSource(); src.buffer=buf;
  const flt=C.createBiquadFilter(); flt.type='lowpass'; flt.frequency.value=fc;
  const g=C.createGain(); g.gain.value=vol;
  src.connect(flt); flt.connect(g); g.connect(dest||AU.sfx);
  src.start(C.currentTime+when);
}
const SFX = {
  shoot(cls){ const f={lit:900,corp:300,crim:1150,ip:700,tax:520}[cls]||800; tone({f, f2:f*0.4, t:0.07, vol:0.09}); },
  melee(){ noiseHit({t:0.06, vol:0.1, fc:2600}); },
  hit(){ tone({f:200, f2:90, t:0.08, vol:0.13}); },
  spin(){ tone({f:300, f2:900, type:'sawtooth', t:0.3, vol:0.09}); noiseHit({t:0.25, vol:0.09, fc:1800}); },
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
// ---- music: 16-step loops (MIDI note numbers, 0 = rest), one song per floor ----
const NT = n => 440*Math.pow(2,(n-69)/12);
const SONGS = {
  office:{ bpm:112, hat:true,
    bass:[45,0,52,0,48,0,52,0,43,0,50,0,45,0,52,53],
    lead:[69,0,72,0,74,0,72,0,76,74,0,72,0,69,0,0] },
  annex:{ bpm:84, hat:false,
    bass:[38,0,0,0,41,0,0,0,36,0,0,0,43,0,41,0],
    lead:[0,0,74,0,0,0,0,0,0,77,0,0,0,0,75,0] },
  garage:{ bpm:96, hat:false,
    bass:[33,0,33,0,36,0,33,0,31,0,31,0,40,0,38,0],
    lead:[0,0,0,64,0,0,63,0,0,0,0,60,0,0,0,0] },
  boss:{ bpm:148, hat:true,
    bass:[33,33,45,33,33,33,45,36,31,31,43,31,38,38,40,41],
    lead:[69,0,69,72,0,74,0,76,0,75,0,72,74,0,71,0] },
  floor24:{ bpm:120, hat:true,
    bass:[40,0,47,0,43,0,47,0,38,0,45,0,40,0,46,47],
    lead:[76,0,75,0,72,0,0,71,0,72,0,75,0,0,76,0] },
  courtroom:{ bpm:100, hat:false,
    bass:[36,0,43,0,40,0,43,0,36,0,43,0,41,0,38,0],
    lead:[0,0,72,0,0,0,67,0,0,0,71,0,0,0,0,0] },
};
function musicTick(){
  if(!AU.ctx || !AU.on) return;
  const C = AU.ctx;
  if(state!=='play' && state!=='dialog'){ AU.nextT = Math.max(AU.nextT, C.currentTime); return; }
  AU.song = enemies && enemies.some(e=>e.boss) ? 'boss' : worldId;
  const song = SONGS[AU.song] || SONGS.office;
  const spb = 60/song.bpm/2; // 8th notes
  while(AU.nextT < C.currentTime + 0.12){
    const when = AU.nextT - C.currentTime;
    const b = song.bass[AU.step % song.bass.length];
    if(b) tone({f:NT(b), type:'triangle', t:spb*0.9, vol:0.2, when, dest:AU.mus});
    const l = song.lead[AU.step % song.lead.length];
    if(l) tone({f:NT(l), type:'square', t:spb*0.8, vol:0.055, when, dest:AU.mus});
    if(song.hat && AU.step%4===2) noiseHit({t:0.03, vol:0.05, fc:6000, when, dest:AU.mus});
    AU.step++; AU.nextT += spb;
  }
}
function toggleMute(){
  if(!AU.ctx) return;
  AU.on = !AU.on;
  AU.master.gain.value = AU.on ? 0.5 : 0;
  if(typeof announce === 'function' && player) announce(AU.on ? 'Sound: ON. The firm hums again.' : 'Sound: MUTED. Blissful, billable silence.', false, 2);
}

