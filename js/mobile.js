"use strict";
// ============================== MOBILE PANEL ==============================
// On touch devices the HUD and dialogs render as DOM below the canvas — native
// font sizes instead of canvas pixels scaled down to a phone width.
let mdlgKey = null, mhudKey = '';
function updateMobilePanel(){
  if(!IS_TOUCH) return;
  updateMobileBag();
  updateMobileShop();
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
    (cur.lvl < RANKS.length ? Math.min(100, (player.xp-cur.xp)/(next.xp-cur.xp)*100) : 100) + '%';
  document.getElementById('mxplabel').textContent =
    (cur.lvl < RANKS.length ? `XP ${player.xp} / ${next.xp} → ${next.title.toUpperCase()}` : 'MAXIMUM PRESTIGE')
    + `   ·   ${fmtBH(player.billables)} hrs`;
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

// ---- mobile bag: a full-screen DOM inventory (the canvas one is too small scaled to a phone) ----
const bagEl  = (tag, cls, text) => { const e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; };
const bagBtn = (cls, text, onclick) => { const b=document.createElement('button'); b.className=cls; b.textContent=text; b.onclick=onclick; return b; };
let mbagKey = null;
function updateMobileBag(){
  const bag = document.getElementById('mbag');
  if(!(invOpen && player && state==='play')){
    if(bag.classList.contains('open')){ bag.classList.remove('open'); bag.innerHTML=''; mbagKey=null; }
    return;
  }
  bag.classList.add('open');
  const key = invTab+'|'+JSON.stringify(player.equip)+'|'+player.inventory.join(',')+'|'+invSel
            +'|'+questIdx+'|'+questPhase+'|'+JSON.stringify(qstate);
  if(key === mbagKey) return;            // only rebuild when something actually changed
  const prevScroll = (bag.querySelector('.blist')||{}).scrollTop || 0;
  mbagKey = key;
  bag.innerHTML = '';

  const head = bagEl('div','bhead');
  head.appendChild(bagEl('h3', null, 'CASE FILE'));
  head.appendChild(bagBtn('btab'+(invTab==='items'?' on':''),  'EFFECTS', ()=>{ invTab='items';  mbagKey=null; }));
  head.appendChild(bagBtn('btab'+(invTab==='quests'?' on':''), 'MATTERS', ()=>{ invTab='quests'; mbagKey=null; }));
  head.appendChild(bagBtn('bclose', 'CLOSE', ()=> toggleInventory()));
  bag.appendChild(head);

  if(invTab==='quests'){ bagBuildQuests(bag); return; }

  const ws=weaponStats();
  const dmgX=(ws.dmg/player.cls.dmg)*dmgMult(), rateX=player.cls.cd/ws.cd, arm=Math.round(equipDefense()*100);
  bag.appendChild(bagEl('div','bstats',
    `FIRE ×${dmgX.toFixed(2)} dmg · ×${rateX.toFixed(2)} rate · ${ws.count} shot${ws.count>1?'s':''}${ws.pierce?' · pierce':''}\nARMOR ${arm}%   ·   MAX HP ${player.maxhp}`));

  const slots = bagEl('div','bslots');
  [['WEAPON','weapon'],['ACCESSORY','accessory'],['SUIT','suit']].forEach(([lbl,slot])=>{
    const s=bagEl('div','bslot'); s.appendChild(bagEl('div','lbl',lbl));
    const id=player.equip[slot];
    s.appendChild(bagEl('div','val'+(id?'':' empty'), id?ITEMS[id].nm:'— empty —'));
    slots.appendChild(s);
  });
  bag.appendChild(slots);

  const list = bagEl('div','blist');
  const counts={}; for(const id of player.inventory) counts[id]=(counts[id]||0)+1;
  const ids=Object.keys(counts);
  if(!ids.length) list.appendChild(bagEl('div','bempty','Your bag is empty. The firm has taken everything else.'));
  for(const id of ids){
    const it=ITEMS[id], equipped=Object.values(player.equip).includes(id);
    const b=bagEl('button','bitem'+(equipped?' eq':''));
    const img=document.createElement('img'); img.src=SPR[it.spr].toDataURL(); b.appendChild(img);
    const col=bagEl('div');
    col.appendChild(bagEl('div','nm', it.nm+(counts[id]>1?`  ×${counts[id]}`:'')));
    const tag = it.kind==='suit'?'SUIT':it.kind.toUpperCase();
    const action = equipped?'EQUIPPED — tap to remove':it.kind==='consumable'?'tap to USE':EQUIP_KINDS.includes(it.kind)?'tap to EQUIP':'';
    col.appendChild(bagEl('div','meta', tag+'   '+action));
    col.appendChild(bagEl('div','desc', it.ds));
    b.appendChild(col);
    b.onclick = ()=>{
      if(it.kind==='consumable') useConsumable(id);
      else if(EQUIP_KINDS.includes(it.kind)) equipItem(id);
      invSel=id; mbagKey=null;
    };
    list.appendChild(b);
  }
  bag.appendChild(list);
  list.scrollTop = prevScroll;
}
function bagBuildQuests(bag){
  const list = bagEl('div','blist');
  const rows = questLogRows();
  if(!rows.length) list.appendChild(bagEl('div','bempty','No open matters. Enjoy it while it lasts.'));
  const tagColor = { MAIN:'#5ec8f0', SIDE:'#9be05e', ACTIVE:'#9be05e', AVAILABLE:'#f0c75e', DONE:'#5a4f73' };
  for(const q of rows){
    const row=bagEl('div','bitem');
    const col=bagEl('div');
    col.appendChild(bagEl('div','nm', q.name));
    col.appendChild(bagEl('div','desc', q.line));
    row.appendChild(col);
    const tag=bagEl('div','qtag', q.tag); tag.style.color = tagColor[q.tag]||'#9b8fb5';
    row.appendChild(tag);
    list.appendChild(row);
  }
  bag.appendChild(list);
}


// ---- mobile Supply Closet shop (full-screen DOM overlay, shares .movl styling) ----
let mshopKey = null;
function updateMobileShop(){
  const sh = document.getElementById('mshop');
  if(!(shopOpen && player && state==='play')){
    if(sh.classList.contains('open')){ sh.classList.remove('open'); sh.innerHTML=''; mshopKey=null; }
    return;
  }
  sh.classList.add('open');
  const stock = shopStock();
  const key = stock.join(',')+'|'+player.billables+'|'+player.inventory.join(',');
  if(key === mshopKey) return;
  const prev = (sh.querySelector('.blist')||{}).scrollTop || 0;
  mshopKey = key;
  sh.innerHTML = '';
  const head = bagEl('div','bhead');
  head.appendChild(bagEl('h3', null, 'SUPPLY CLOSET'));
  const bal = bagEl('div', null, `${fmtBH(player.billables)} hrs`);
  bal.style.color = '#caa84a'; bal.style.fontWeight = 'bold'; bal.style.fontSize = '15px';
  head.appendChild(bal);
  head.appendChild(bagBtn('bclose', 'CLOSE', ()=> toggleShop()));
  sh.appendChild(head);
  const list = bagEl('div','blist');
  for(const id of stock){
    const it=ITEMS[id], price=ITEM_PRICE[id];
    const owned=EQUIP_KINDS.includes(it.kind)&&hasItem(id), afford=player.billables>=price;
    const b=bagEl('button','bitem'); b.style.borderColor=TIER_COLOR[tierOf(id)];
    const img=document.createElement('img'); img.src=SPR[it.spr].toDataURL(); b.appendChild(img);
    const col=bagEl('div');
    col.appendChild(bagEl('div','nm', it.nm));
    const m=bagEl('div','meta', `${TIER_NAME[tierOf(id)]}   ${owned?'OWNED':afford?'BUY · '+price+' hrs':'NEED '+price+' hrs'}`);
    m.style.color = owned?'#5a4f73':afford?'#9be05e':'#c98a8a';
    col.appendChild(m);
    col.appendChild(bagEl('div','desc', it.ds));
    b.appendChild(col);
    if(!owned) b.onclick = ()=>{ buyItem(id); mshopKey=null; };
    list.appendChild(b);
  }
  sh.appendChild(list);
  list.scrollTop = prev;
}
