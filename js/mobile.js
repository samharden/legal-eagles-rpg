"use strict";
// ============================== MOBILE PANEL ==============================
// On touch devices the HUD and dialogs render as DOM below the canvas — native
// font sizes instead of canvas pixels scaled down to a phone width.
let mdlgKey = null, mhudKey = '';
function updateMobilePanel(){
  if(!IS_TOUCH) return;
  // the panel only exists during gameplay — the menu is full-screen on mobile
  const panel = document.getElementById('mpanel');
  const wanted = state !== 'menu' ? 'block' : 'none';
  if(panel.style.display !== wanted) panel.style.display = wanted;
  if(wanted === 'none') return;
  const box = document.getElementById('mdlg');
  if(state==='dialog' && dlg){
    const d = dlg.nodes[dlg.i];
    const key = dlg.i + '|' + d.text;
    if(key !== mdlgKey){
      mdlgKey = key;
      document.getElementById('mdlgImg').src = SPR[d.spr].toDataURL();
      document.getElementById('mdlgName').textContent = d.nm;
      document.getElementById('mdlgText').textContent = d.text;
      const chBox = document.getElementById('mdlgChoices');
      chBox.innerHTML = '';
      if(d.choices){
        d.choices.forEach((c,i)=>{
          const b = document.createElement('button');
          b.textContent = c.t;
          b.onclick = () => chooseDialog(i);
          chBox.appendChild(b);
        });
      } else {
        const b = document.createElement('button');
        b.textContent = 'continue ▸';
        b.onclick = () => advDialog();
        chBox.appendChild(b);
      }
      box.style.display = 'block';
      document.getElementById('mstatus').style.display = 'none'; // dialog takes the HUD's spot
    }
  } else if(box.style.display !== 'none'){
    box.style.display = 'none'; mdlgKey = null;
    document.getElementById('mstatus').style.display = 'block';
  }
  if(!player) return;
  const hpFrac = Math.max(0, player.hp/player.maxhp);
  const hpFill = document.getElementById('mhpfill');
  hpFill.style.width = hpFrac*100 + '%';
  hpFill.style.background = hpFrac > 0.3 ? '#9be05e' : '#ff6b6b';
  document.getElementById('mhplabel').textContent = `ENERGY ${Math.max(0,Math.ceil(player.hp))} / ${player.maxhp}`;
  const cur = player.rank, next = RANKS[Math.min(RANKS.length-1, cur.lvl)];
  document.getElementById('mxpfill').style.width =
    (cur.lvl < 6 ? Math.min(100, (player.xp-cur.xp)/(next.xp-cur.xp)*100) : 100) + '%';
  document.getElementById('mxplabel').textContent =
    cur.lvl < 6 ? `XP ${player.xp} / ${next.xp} → ${next.title.toUpperCase()}` : 'MAXIMUM PRESTIGE';
  const q = QUESTS[questIdx];
  const side = sideQuestLines().join('   ');
  const hudKey = [player.rank.title, worldId, q.name, questProgressText(), side, msg.t>0 ? msg.text : ''].join('|');
  if(hudKey === mhudKey) return;
  mhudKey = hudKey;
  document.getElementById('mrank').textContent =
    `${player.rank.title} (Lv ${player.rank.lvl}) · ${WORLD_NAME[worldId]}`;
  document.getElementById('mquest').textContent = `MATTER ${questIdx+1}/${QUESTS.length}: ${q.name} — ${questProgressText()}`;
  document.getElementById('mside').textContent = side;
  document.getElementById('mmsg').textContent = msg.t > 0 ? msg.text : '';
}

