"use strict";
// ============================== DIALOGUE ENGINE ==============================
const WHO = {
  hargrove:{ nm:'Managing Partner Hargrove', spr:'hargrove' },
  chad:    { nm:'Chad Worthington IV', spr:'chad' },
  rosa:    { nm:'Rosa (Mailroom)', spr:'rosa' },
  benny:   { nm:'Benny (IT)', spr:'benny' },
  dolores: { nm:'Dolores', spr:'dolores' },
  graves:  { nm:'Thaddeus Graves III', spr:'emeritus' },
  payne:   { nm:'Dr. Ima Payne', spr:'expert' },
  memo:    { nm:'FIRM MEMO', spr:'file' },
  dusty:   { nm:'DUSTY CASE FILE', spr:'dossier' },
  lenny:   { nm:'Lenny (Pro Bono, est. 2019)', spr:'lenny' },
};
const N = (who, text, choices) => ({ nm:WHO[who].nm, spr:WHO[who].spr, text, choices });

function startDialog(nodes, onDone){ dlg = { nodes: nodes.filter(Boolean), i:0, onDone }; state = 'dialog'; }
function endDialog(){ const f = dlg && dlg.onDone; dlg = null; if(state==='dialog') state = 'play'; if(f) f(); }
function advDialog(){ SFX.blip(); dlg.i++; if(dlg.i >= dlg.nodes.length) endDialog(); }
function chooseDialog(idx){
  const node = dlg.nodes[dlg.i];
  if(!node.choices || idx >= node.choices.length) return;
  const c = node.choices[idx];
  const r = c.fx && c.fx();
  if(r === 'stop') return;
  if(c.say) dlg.nodes.splice(dlg.i+1, 0, { nm:node.nm, spr:node.spr, text:c.say });
  advDialog();
}
const rep_ = (e,a) => () => { flags.ethics += e; flags.ambition += a; };

