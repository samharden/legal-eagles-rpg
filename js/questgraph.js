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
  SFX.promote();
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
