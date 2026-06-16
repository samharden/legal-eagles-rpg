"use strict";
// ============================== DATA ==============================
const GENDERS = [
  { id:'m', spr:'p_m', nm:'MALE',       ds:'Owns four identical navy suits.' },
  { id:'f', spr:'p_f', nm:'FEMALE',     ds:'Heels that double as weapons.' },
];

const CLASSES = [
  { id:'lit', spr:'ic_lit', nm:'LITIGATION', atk:'OBJECTION!',
    ds:'Fast, loud, dramatic. Bills by the outburst.',
    dmg:8, cd:0.28, speed:560, count:1, pierce:false, color:'#ff6b6b', size:5, special:null },
  { id:'corp', spr:'briefcase', nm:'CORPORATE M&A', atk:'Hostile Takeover',
    ds:'Slow, heavy, and absolutely non-negotiable.',
    dmg:10, cd:0.75, speed:300, count:1, pierce:false, color:'#5ec8f0', size:11, special:null },
  { id:'crim', spr:'ic_crim', nm:'CRIMINAL DEFENSE', atk:'Cross-Examination',
    ds:'Rapid-fire triple shot of doubt. Reasonable doubt.',
    dmg:3, cd:0.34, speed:500, count:3, pierce:false, color:'#9be05e', size:4, special:'spread' },
  { id:'ip', spr:'ic_ip', nm:'INTELLECTUAL PROPERTY', atk:'Cease & Desist',
    ds:'Letters that hunt down infringers automatically.',
    dmg:8, cd:0.45, speed:380, count:1, pierce:false, color:'#e05ed8', size:6, special:'homing' },
  { id:'tax', spr:'ic_tax', nm:'TAX', atk:'Surprise Audit',
    ds:'Nothing is certain except death and this nova.',
    dmg:8, cd:0.9, speed:330, count:10, pierce:false, color:'#f0c75e', size:5, special:'nova' },
];

const RANKS = [
  { lvl:1,  title:'Junior Associate', xp:0,    hp:100, quip:'You know where the printer is. Barely.' },
  { lvl:2,  title:'Associate',        xp:50,   hp:115, quip:'You can now decline meetings. You won\'t, but you can.' },
  { lvl:3,  title:'Senior Associate', xp:130,  hp:130, quip:'Younger lawyers fear your redlines.' },
  { lvl:4,  title:'Of Counsel',       xp:240,  hp:145, quip:'Nobody knows what you do. Including you.' },
  { lvl:5,  title:'Junior Partner',   xp:390,  hp:160, quip:'You have equity. It is mostly emotional.' },
  { lvl:6,  title:'Partner',          xp:580,  hp:180, quip:'The corner office is yours. So is the malpractice exposure.' },
  { lvl:7,  title:'Senior Partner',   xp:820,  hp:200, quip:'You bill in your sleep. Literally. Legal is looking into it.' },
  { lvl:8,  title:'Managing Partner', xp:1120, hp:225, quip:'You manage partners now. It is exactly like herding cats, if the cats sued.' },
  { lvl:9,  title:'Equity Partner',   xp:1480, hp:250, quip:'Your name is on the capital call. Your soul is on the line item below it.' },
  { lvl:10, title:'NAME PARTNER',     xp:1950, hp:280, quip:'They carved your name in the lobby granite. You checked: it is load-bearing.' },
];

// Per-type combat traits (beyond hp/spd/dmg) make the tool you pick matter:
//   resist : fraction of *ranged* (projectile) damage ignored — melee/spin bypass it.
//            Dense enemies must be struck (Space/J) or spun (L), not just shot.
//   dodge  : chance a projectile whiffs entirely — fast skirmishers you can't snipe.
//   rage   : speeds up while the player stands still — keep moving or get swarmed.
//   strafe : orbits the player at `ring` px instead of beelining — circle-strafe duels.
//   windup : seconds a shooter telegraphs before firing (aim locks at windup start, so
//            sidestepping the tell makes the shot whiff). Defaults: 0.4 grunt / 0.55 boss.
const ENEMY_TYPES = {
  paralegal: { nm:'Rogue Paralegal',       hp:24,  spd:90,  dmg:8,  xp:8,  r:14, shoots:false },
  golem:     { nm:'Paperwork Golem',       hp:55,  spd:55,  dmg:12, xp:12, r:18, shoots:false, resist:0.55 },
  wraith:    { nm:'Billable Hour Wraith',  hp:30,  spd:135, dmg:10, xp:10, r:13, shoots:false, dodge:0.45 },
  counsel:   { nm:'Opposing Counsel',      hp:70,  spd:75,  dmg:14, xp:22, r:15, shoots:true,  shotCd:1.6, strafe:true, ring:210, windup:0.5 },
  chad:      { nm:'Chad Worthington IV',    hp:140, spd:95,  dmg:14, xp:60, r:15, shoots:true,  shotCd:1.2 },
  intern:    { nm:'Over-Caffeinated Intern',hp:16, spd:175, dmg:6,  xp:6,  r:11, shoots:false },
  expert:    { nm:'Hostile Expert Witness', hp:380, spd:60, dmg:18, xp:120,r:26, shoots:true, shotCd:1.1, boss:true },
  emeritus:  { nm:'Senior Partner Emeritus',hp:650, spd:80, dmg:22, xp:250,r:28, shoots:true, shotCd:0.8, boss:true },
  grandfather:{ nm:"Worthington II, 'The Grandfather'", hp:420, spd:75, dmg:18, xp:140, r:24, shoots:true, shotCd:1.0, boss:true },
  assoc:     { nm:'Associate of the Month', hp:60,  spd:110, dmg:12, xp:25, r:14, shoots:true,  shotCd:1.3, strafe:true, ring:170, windup:0.38 },
  bailiff:   { nm:'Bailiff',                hp:90,  spd:70,  dmg:16, xp:20, r:16, shoots:false },
  gremlin:   { nm:'Decaf Gremlin',          hp:20,  spd:150, dmg:6,  xp:8,  r:11, shoots:false, rage:true },
  bane:      { nm:'The Hon. Mortimer Bane', hp:800, spd:65,  dmg:20, xp:400,r:28, shoots:true,  shotCd:0.9, boss:true },
  instrument:{ nm:'The Founding Agreement', hp:1100,spd:48,  dmg:24, xp:600,r:30, shoots:true,  shotCd:0.7, boss:true, resist:0.30 },
};

const QUESTS = [
  { id:0, name:'Orientation Day',           goal:{type:'kill', enemy:'paralegal', n:5}, xp:50,  spawn:[['paralegal',7]] },
  { id:1, name:'Discovery Hell',            goal:{type:'killcollect', enemy:'golem', n:8, items:3}, xp:90, spawn:[['golem',10],['paralegal',3]] },
  { id:2, name:'The Time Entry Reckoning',  goal:{type:'kill', enemy:'wraith', n:10}, xp:120, spawn:[['wraith',12],['intern',4]] },
  { id:3, name:'Meet & Confer (Violently)', goal:{type:'kill', enemy:'counsel', n:4}, xp:150, spawn:[['counsel',5],['wraith',4]] },
  { id:4, name:'The Deposition of Dr. Payne', goal:{type:'kill', enemy:'expert', n:1}, xp:180, spawn:[['expert',1],['intern',6]] },
  { id:5, name:'Partnership Review',        goal:{type:'kill', enemy:'emeritus', n:1}, xp:300, spawn:[['emeritus',1],['counsel',3],['wraith',4]] },
  // ---- ACT II: THE APPEAL ----
  { id:6, name:'Notice of Appeal',          goal:{type:'kill', enemy:'assoc', n:6}, xp:200, spawn:[['assoc',6],['counsel',2]], world:'floor24' },
  { id:7, name:'Discovery, Again',          goal:{type:'killcollect', enemy:'golem', n:6, items:4}, xp:240, spawn:[['golem',8],['wraith',5]], world:'annex', relock:true, itemSpr:'dossier', itemLabel:'TRUST INSTRUMENT SECURED' },
  { id:8, name:"Bane's Court",              goal:{type:'kill', enemy:'bane', n:1}, xp:400, spawn:[], world:'courtroom' },
  // ---- ACT III: IN RE: THE BUILDING ---- (display sentinel; the spine runs on the quest graph)
  { id:9, name:'In Re: The Building',       goal:{type:'none'}, xp:0, spawn:[], act3:true },
];

const KILL_QUIPS = ['Sustained!','Sanctioned!','Case dismissed!','Stricken from the record!','Per curiam!','Res judicata, baby!','Moot!','SO ORDERED.'];
const HURT_QUIPS = ['Objection... overruled.','That\'s sanctionable!','Ow. Billing this as research.','My ergonomic chair!'];

