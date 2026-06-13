"use strict";
// ============================== TOUCH CONTROLS ==============================
const joy = { dx:0, dy:0, on:false };
if(IS_TOUCH){
  // body.touch drives all the mobile layout: cropped canvas, full-screen menu,
  // visible controls, hidden keyboard hints (see CSS)
  document.body.classList.add('touch');

  // virtual joystick
  const joyEl = document.getElementById('joy'), stickEl = document.getElementById('stick');
  const joyMove = t => {
    const r = joyEl.getBoundingClientRect();
    let jx = (t.clientX - (r.left + r.width/2)) / (r.width/2);
    let jy = (t.clientY - (r.top + r.height/2)) / (r.height/2);
    const m = Math.hypot(jx, jy);
    if(m > 1){ jx /= m; jy /= m; }
    joy.dx = jx; joy.dy = jy; joy.on = true;
    stickEl.style.transform = `translate(${jx*34}px, ${jy*34}px)`;
  };
  joyEl.addEventListener('touchstart', e=>{ e.preventDefault(); joyMove(e.changedTouches[0]); }, {passive:false});
  joyEl.addEventListener('touchmove',  e=>{ e.preventDefault(); joyMove(e.changedTouches[0]); }, {passive:false});
  const joyEnd = e=>{ e.preventDefault(); joy.dx=0; joy.dy=0; joy.on=false; stickEl.style.transform=''; };
  joyEl.addEventListener('touchend', joyEnd, {passive:false});
  joyEl.addEventListener('touchcancel', joyEnd, {passive:false});

  // action buttons (hold-down maps onto the key state the game already reads)
  const bindBtn = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', e=>{
      e.preventDefault();
      if(key === 'e' && state==='dialog' && dlg){
        const node = dlg.nodes[dlg.i];
        if(!node.choices) advDialog();
        return;
      }
      keys[key] = true;
    }, {passive:false});
    const up = e=>{ e.preventDefault(); keys[key] = false; };
    el.addEventListener('touchend', up, {passive:false});
    el.addEventListener('touchcancel', up, {passive:false});
  };
  bindBtn('tbJ','j'); bindBtn('tbK','k'); bindBtn('tbL','l'); bindBtn('tbE','e');
  document.getElementById('tbM').addEventListener('touchstart', e=>{ e.preventDefault(); toggleMute(); }, {passive:false});

  // taps on the canvas: advance dialog, pick choices, restart from end screens
  cv.addEventListener('touchstart', e=>{
    e.preventDefault();
    const t = e.changedTouches[0], r = cv.getBoundingClientRect();
    const x = (t.clientX - r.left)*(W/r.width), y = (t.clientY - r.top)*(CH/r.height);
    if(state==='dialog' && dlg){
      const node = dlg.nodes[dlg.i];
      if(node.choices){
        for(let i=0;i<dlgRects.length;i++){
          const rc = dlgRects[i];
          if(x >= rc.x && x <= rc.x+rc.w && y >= rc.y && y <= rc.y+rc.h){ chooseDialog(i); return; }
        }
      } else advDialog();
    } else if(state==='gameover' || state==='victory'){
      document.getElementById('menu').style.display = 'flex';
      state = 'menu';
      refreshContinue();
    }
  }, {passive:false});
}

