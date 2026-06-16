"use strict";
// ============================== QUEST GRAPH ==============================
// Additive, data-driven quest system that runs ALONGSIDE the linear main-quest
// loop (questIdx/questPhase) and the bespoke flag side-quests. It only LISTENS
// to gameplay events the rest of the code already emits — kill / item / talk /
// reach — and GRANTS rewards through existing functions (giveItem, gainXP,
// flags). It never alters main-quest or side-quest control flow. New story
// (Act III, the item side quests) is authored here as data, not code.
//
//   stages : talk{npc} · kill{enemy,n} · collect{item,n} · reach{world}
//   prereq(): availability gate (returns true when the quest may appear)
//   auto    : self-start when prereq passes (else a giver NPC offers it)
//   reward  : { items:[], xp, ethics, ambition, msg }
const QLINE = [
  {
    id:'good_pens',
    name:'The Good Pens',
    blurb:'Silas Grabbit took the firm\'s good pens to Grabbit & Runn in 1981. Get them back.',
    prereq:()=> questIdx>=6,        // Act II: the 24th floor is reachable
    auto:true,
    stages:[
      { type:'reach', world:'floor24', hint:'Ride the lobby elevator up to Grabbit & Runn, 24th Floor.' },
      { type:'kill',  enemy:'assoc', n:3, hint:'Make examples of 3 Associates of the Month.' },
    ],
    reward:{ items:['good_pens'], xp:120, ethics:1,
             msg:'THE GOOD PENS are yours — a weapon that writes through anything. Equip them from your bag [I].' },
  },
  {
    id:'in_re_building',
    name:'In Re: The Building',
    blurb:'The founding agreement is real — and the building is a party to it. Descend to Sublevel C and end it.',
    prereq:()=> flags.act3,
    auto:true,
    stages:[
      { type:'reach', world:'vault', hint:'Descend the sealed stair in the Records Annex to Sublevel C.' },
      { type:'kill', enemy:'instrument', n:1, hint:'Confront the Founding Agreement and make your choice.',
        onStart:()=>{
          const v = worlds.vault.instrument;
          spawnEnemy('instrument', v.tx*TILE+20, v.ty*TILE+20);
          SFX.boom(); shake = Math.max(shake, 14);
          announce('The instrument case splits. Forty years of harvested hours pour upward into a shape. THE FOUNDING AGREEMENT stands.', true, 5.5);
        } },
    ],
    onComplete:()=> act3Finale(),
  },
  {
    id:'p_locke',
    name:'The Vanishing of P. Locke',
    blurb:'A ghost haunts the Vault — the one partner who escaped being amended. She wants a word.',
    prereq:()=> flags.act3,
    auto:true,
    stages:[ { type:'talk', npc:'locke', hint:'Find Prudence Locke\'s ghost in the Vault (Sublevel C) and hear her out.' } ],
    reward:{ items:['letter_opener'], xp:80, ethics:1,
             msg:'The Letter Opener of P. Locke — an accessory whose edge bites deepest into bosses. Equip it from your bag [I].' },
  },
  {
    id:'printer_jam',
    name:'The One Working Printer',
    blurb:"The firm's last working printer is jammed and besieged in the break room. Reboot it (press E at the printer) and hold the line.",
    prereq:()=> questIdx>=2,
    auto:false,                       // started by interacting with the printer itself
    stages:[
      { type:'kill', enemy:'intern', n:6, hint:'Defend the printer while it reboots — clear 6 paper jams (interns).',
        onStart:()=>{
          for(let i=0;i<6;i++){ const p=findOpen(player.x, player.y, 300); spawnEnemy('intern', p.x, p.y); }
          SFX.buzz(); shake = Math.max(shake, 8);
          announce('The printer roars to life and IMMEDIATELY jams. Over-caffeinated interns swarm it. Defend it!', true, 4.5);
        } },
    ],
    reward:{ items:['printer_companion'], xp:90, ethics:1,
             msg:'THE ONE WORKING PRINTER is yours. Equip it [I] and it floats at your side, auto-firing paper jams.' },
  },
];

let qstate = {};   // id -> { status:'locked'|'available'|'active'|'done', stage, prog }
function qInit(){
  qstate = {};
  for(const q of QLINE) qstate[q.id] = { status:'locked', stage:0, prog:0 };
}
const qDef = id => QLINE.find(q=>q.id===id);

// fire the current stage's onStart hook (boss spawns, scripted setup)
function enterStage(q){
  const st = qstate[q.id]; const stage = q.stages[st.stage];
  if(stage && stage.onStart) try{ stage.onStart(); }catch(e){}
}

// promote locked quests to available/active when their prereq passes
function qTick(){
  if(!player) return;
  for(const q of QLINE){
    const st = qstate[q.id]; if(!st || st.status!=='locked') continue;
    let ok; try{ ok = !q.prereq || q.prereq(); }catch(e){ ok = false; }
    if(!ok) continue;
    st.status = q.auto ? 'active' : 'available';
    if(q.auto){ SFX.quest(); announce('NEW MATTER: '+q.name+' — '+q.blurb, true, 5); enterStage(q); }
  }
}
function qStartQuest(id){ // giver NPC accepts an offered quest
  const st = qstate[id]; if(!st || st.status!=='available') return;
  st.status = 'active'; SFX.quest();
  announce('MATTER ACCEPTED: '+qDef(id).name, true, 3.5);
  enterStage(qDef(id));
}

function stageMatch(stage, type, data){
  if(stage.type!==type) return false;
  if(type==='kill')    return stage.enemy===data.enemy;
  if(type==='collect') return stage.item===data.item;
  if(type==='talk')    return stage.npc===data.npc;
  if(type==='reach')   return stage.world===data.world;
  if(type==='use')     return stage.item===data.item;
  return false;
}
// the single entry point the rest of the game calls to drive graph quests
function questEvent(type, data){
  if(!player || !QLINE.length) return;
  for(const q of QLINE){
    const st = qstate[q.id]; if(!st || st.status!=='active') continue;
    const stage = q.stages[st.stage]; if(!stage) continue;
    if(!stageMatch(stage, type, data)) continue;
    st.prog++;
    if(st.prog >= (stage.n||1)){
      st.prog = 0; st.stage++;
      if(st.stage >= q.stages.length) qComplete(q);
      else { SFX.quest(); enterStage(q); }
    }
  }
}
function qComplete(q){
  const st = qstate[q.id];
  st.status = 'done'; st.stage = q.stages.length; st.prog = 0;
  const r = q.reward || {};
  if(r.items) for(const it of r.items) giveItem(it, true);
  if(r.xp) gainXP(r.xp);
  if(r.ethics)   flags.ethics   += r.ethics;
  if(r.ambition) flags.ambition += r.ambition;
  // a quest with its own onComplete presents its own conclusion (scenes, endings)
  if(q.onComplete){ saveGame(); try{ q.onComplete(); }catch(e){} return; }
  SFX.closeMatter();
  announce('MATTER CLOSED: '+q.name+(r.msg ? ' — '+r.msg : ''), true, 5.5);
  saveGame();
}

// load-state restore: merge saved progress over fresh defaults
function qRestore(saved){
  qInit();
  if(!saved) return;
  for(const id in saved){
    if(qstate[id]) qstate[id] = { status:'locked', stage:0, prog:0, ...saved[id] };
  }
}

// lines for the MATTERS tab of the bag UI
function qLogLines(){
  const out = [];
  for(const q of QLINE){
    const st = qstate[q.id]; if(!st) continue;
    if(st.status==='active'){
      const stage = q.stages[st.stage];
      const prog = stage.n ? `  (${st.prog}/${stage.n})` : '';
      out.push({ name:q.name, line:(stage.hint||'...')+prog, tag:'ACTIVE' });
    } else if(st.status==='available'){
      out.push({ name:q.name, line:q.blurb, tag:'AVAILABLE' });
    } else if(st.status==='done'){
      out.push({ name:q.name, line:'Closed. Reward claimed.', tag:'DONE' });
    }
  }
  return out;
}

// ============================== ASSIGNMENT BOARD ==============================
// Repeatable "matters" — the billables faucet. Self-contained plain-data system
// (not QLINE), so it serializes trivially. Offered via the dialogue UI, so it
// works on desktop and mobile with no extra panel. One active matter at a time;
// accepting spawns its targets on the floor, killing them closes it for billables.
const MATTER_TEMPLATES = [
  { enemy:'paralegal', verb:'Pacify',   noun:'rogue paralegals',        pay:14 },
  { enemy:'intern',    verb:'Sober up', noun:'over-caffeinated interns', pay:12 },
  { enemy:'wraith',    verb:'Banish',   noun:'billable-hour wraiths',    pay:16 },
  { enemy:'golem',     verb:'Shred',    noun:'paperwork golems',         pay:20 },
  { enemy:'counsel',   verb:'Out-file', noun:'opposing counsel',         pay:26, minQ:3 },
  { enemy:'assoc',     verb:'Outbill',  noun:'Associates of the Month',  pay:24, minQ:6 },
];
let boardOffers = [], boardActive = null, boardSeq = 0;
const matterName = m => `${m.hazard?'HAZARD: ':''}${m.verb} ${m.n} ${m.noun}`;
function genOffer(){
  const pool = MATTER_TEMPLATES.filter(t => !t.minQ || questIdx >= t.minQ);
  const t = pool[Math.floor(Math.random()*pool.length)];
  const n = 3 + Math.floor(Math.random()*5);              // 3..7
  // ~30% of matters are HAZARD work: ~2.4x the fee, but the targets arrive with an
  // opposing-counsel escort. A real risk/reward call against the billables faucet.
  const hazard = questIdx >= 3 && Math.random() < 0.30;
  const mult = hazard ? 2.4 : 1;
  return { id:'m'+(boardSeq++), enemy:t.enemy, verb:t.verb, noun:t.noun, n, hazard,
           bh:Math.round(n*t.pay*mult), xp:Math.round(n*t.pay*0.4*mult) };
}
function refreshBoard(){ boardOffers = [genOffer(), genOffer(), genOffer()]; }
function acceptMatter(i){
  const m = boardOffers[i];
  if(!m || boardActive) return;
  boardActive = { ...m, prog:0 };
  for(let k=0;k<m.n;k++){ const p = findOpen(player.x, player.y, 320); spawnEnemy(m.enemy, p.x, p.y); }
  if(m.hazard) for(let k=0;k<2;k++){ const p = findOpen(player.x, player.y, 360); spawnEnemy('counsel', p.x, p.y); } // the escort
  SFX.quest(); shake = Math.max(shake, 6);
  announce(`MATTER ACCEPTED: ${matterName(m)}. The work has been dispatched to the floor — defend your billables.`, true, 4.5);
  boardOffers[i] = genOffer();   // the slot refreshes immediately
  saveGame();
}
function boardKill(type){
  if(!boardActive || boardActive.enemy !== type) return;
  boardActive.prog++;
  if(boardActive.prog >= boardActive.n){
    gainBillables(boardActive.bh); gainXP(boardActive.xp);
    flags.boardClosed = (flags.boardClosed||0) + 1;
    SFX.closeMatter();
    announce(`MATTER CLOSED: ${matterName(boardActive)}. +${boardActive.bh} billable hours, billed and collected.`, true, 5);
    boardActive = null;
    saveGame();
  }
}
