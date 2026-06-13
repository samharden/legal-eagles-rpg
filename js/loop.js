"use strict";
// ============================== LOOP & INPUT ==============================
let last = performance.now();
function step(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now;
  musicTick();
  if(state==='play'){ update(dt); draw(); }
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

window.addEventListener('keydown', e=>{
  const k = e.key.toLowerCase();
  if(k===' ') e.preventDefault();
  if(k==='m'){ toggleMute(); return; }
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
  mouse.x=(e.clientX-r.left)*(W/r.width); mouse.y=(e.clientY-r.top)*(H/r.height);
});
cv.addEventListener('mousedown', ()=>mouse.down=true);
window.addEventListener('mouseup', ()=>mouse.down=false);

