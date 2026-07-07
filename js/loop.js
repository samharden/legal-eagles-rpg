"use strict";
// ============================== LOOP & INPUT ==============================
let last = performance.now();
function step(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  pollGamepad();
  musicTick();
  if(state==='play'){
    if(helpOpen){ draw(); if(!IS_TOUCH) drawHelp(); }
    else if(invOpen){ draw(); if(!IS_TOUCH){ drawInventory(); padDrawCursor(invRects); } }
    else if(shopOpen){ draw(); if(!IS_TOUCH){ drawShop(); padDrawCursor(shopRects); } }
    else { if(hitStop>0){ hitStop -= dt; } else { update(dt); } draw(); } // hit-stop freezes the world, not the render
  }
  else if(state==='dialog'){ draw(); if(!IS_TOUCH) drawDialog(); }
  else if(state==='gameover'||state==='victory'){ draw(); drawEnd(); }
  updateMobilePanel();
}
function loop(now){
  step(now);
  requestAnimationFrame(loop);
}
// keep ticking when rAF is throttled (hidden/background tab)
setInterval(()=>{ const now = performance.now(); if(now - last > 250) step(now); }, 125);

// fullscreen — F key or the ⛶ footer button; Esc exits natively.
// The wrap div (not the canvas) goes fullscreen so the menu overlay stays usable.
function toggleFullscreen(){
  const wrap = document.getElementById('wrap');
  const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
  try{
    if(fsEl){ const p = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if(p && p.catch) p.catch(()=>{}); }
    else { const p = (wrap.requestFullscreen || wrap.webkitRequestFullscreen).call(wrap); if(p && p.catch) p.catch(()=>{}); }
  }catch(e){ /* unsupported (e.g. iPhone Safari) — play on in the page */ }
}
const fsBtn = document.getElementById('fsBtn');
if(fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(k===' ') e.preventDefault();
  if(k==='m'){ toggleMute(); return; }
  if(k==='f'){ toggleFullscreen(); return; }
  if(helpOpen){ if(k==='escape' || k==='h') toggleHelp(); return; }
  if(k==='h' && state==='play' && !invOpen && !shopOpen){ toggleHelp(); return; }
  if(k==='i' && (state==='play')){ toggleInventory(); return; }
  // emergency filings: quick-use a carried consumable mid-fight
  if(state==='play' && !invOpen && !shopOpen && !dlg){
    if(k==='1'){ quickUse('cold_brew'); return; }
    if(k==='2'){ quickUse('objection_writ'); return; }
    if(k==='3'){ quickUse('retainer'); return; }
  }
  if(invOpen){ // bag is open: swallow gameplay keys; allow scroll + close
    if(k==='escape' || k==='i') toggleInventory();
    else if(k==='arrowdown' || k==='s') invScroll += 48;
    else if(k==='arrowup'   || k==='w') invScroll -= 48;
    return;
  }
  if(shopOpen){ // vending machine open: swallow gameplay keys; allow scroll + close
    if(k==='escape' || k==='e') toggleShop();
    else if(k==='arrowdown' || k==='s') shopScroll += 48;
    else if(k==='arrowup'   || k==='w') shopScroll -= 48;
    return;
  }
  if(state==='dialog' && dlg){
    const node = dlg.nodes[dlg.i];
    if(node.choices){
      const n = parseInt(k, 10);
      if(n >= 1 && n <= node.choices.length) chooseDialog(n-1);
    } else if(k==='e' || k===' ' || k==='enter'){
      advDialog();
    }
    return;
  }
  keys[k]=true;
  if(k==='r' && (state==='gameover'||state==='victory')){
    document.getElementById('menu').style.display='flex';
    state='menu';
    refreshContinue();
  }
});
window.addEventListener('keyup', e=>{ keys[e.key.toLowerCase()]=false; });
cv.addEventListener('mousemove', e=>{
  const r=cv.getBoundingClientRect();
  mouse.x=(e.clientX-r.left)*(W/r.width); mouse.y=(e.clientY-r.top)*(CH/r.height);
});
cv.addEventListener('mousedown', ()=>mouse.down=true);
window.addEventListener('mouseup', ()=>mouse.down=false);
cv.addEventListener('click', e=>{
  if(!invOpen && !shopOpen && !helpOpen) return;
  const r=cv.getBoundingClientRect();
  const x=(e.clientX-r.left)*(W/r.width), y=(e.clientY-r.top)*(CH/r.height);
  if(helpOpen) helpClick(x, y);
  else if(invOpen) inventoryClick(x, y); else shopClick(x, y);
});
cv.addEventListener('wheel', e=>{
  if(!invOpen && !shopOpen) return;
  e.preventDefault();
  if(invOpen) invScroll += e.deltaY; else shopScroll += e.deltaY;
}, { passive:false });

