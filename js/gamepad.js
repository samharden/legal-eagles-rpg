"use strict";
// ============================== GAMEPAD ==============================
// Standard-mapping controller support (Xbox / PlayStation / most pads) via the
// Gamepad API. No new input system: the left stick and d-pad feed the same
// `joy` channel as the touch joystick, buttons write the same `keys{}` state
// as the keyboard, and the right stick is twin-stick aim — while deflected it
// steers `player.face` (movement is blocked from overwriting it, see update.js)
// and holds fire, so shots track the stick like they track the mouse cursor.
//
//   Left stick / D-pad   move · navigate menus/dialogs/bag/shop
//   Right stick          aim + auto-fire     A      talk / advance / choose / confirm
//   X / RB / RT          fire                B      strike (in panels: close)
//   LB / LT              dash                Y      spin
//   Start                bag                 Back   field manual
let padAim = null;      // {x,y} unit vector — right-stick aim; update.js yields facing to it
let padOn = false;      // a controller has been seen (dialog marker, field-manual row)
let padDlgSel = 0;      // highlighted dialog choice
let padLastNode = null; // reset padDlgSel when the dialog node changes
let padSel = 0;         // bag/shop cursor — an index into invRects/shopRects
let padPanelWas = false;    // rising edge: reset padSel when a panel opens
let padMenuPos = { row:0, col:0 };  // character-creation cursor
let padNavPrev = 'none';    // last frame's d-pad/stick direction, for one-shot nav edges
const padPrev = [];         // previous frame's buttons, for press edges
const padHeld = {};         // which keys[] entries the pad is currently driving

// The character-creation screen is DOM, not canvas: navigate its buttons as a
// grid of rows (attorneys / practice areas / continue+start) and A-click them.
function padMenuRows(){
  const rows = [];
  const g = [...document.querySelectorAll('#genderRow .pick')];
  const c = [...document.querySelectorAll('#classRow .pick')];
  if(g.length) rows.push(g);
  if(c.length) rows.push(c);
  const btns = [];
  const cont = document.getElementById('continueBtn');
  if(cont && cont.style.display !== 'none') btns.push(cont);
  const start = document.getElementById('startBtn');
  if(start) btns.push(start);
  if(btns.length) rows.push(btns);
  return rows;
}
function padMenuHighlight(){
  document.querySelectorAll('.padsel').forEach(el => el.classList.remove('padsel'));
  const rows = padMenuRows(); if(!rows.length) return null;
  padMenuPos.row = Math.max(0, Math.min(rows.length-1, padMenuPos.row));
  padMenuPos.col = Math.max(0, Math.min(rows[padMenuPos.row].length-1, padMenuPos.col));
  const el = rows[padMenuPos.row][padMenuPos.col];
  el.classList.add('padsel');
  el.scrollIntoView({ block:'nearest' });
  return el;
}

// gold cursor around the selected bag/shop rect — called from the draw pass in loop.js
function padDrawCursor(rects){
  if(!padOn || !rects || !rects.length) return;
  const r = rects[Math.min(padSel, rects.length-1)];
  if(!r) return;
  ctx.save();
  ctx.strokeStyle = '#f0c75e'; ctx.lineWidth = 3;
  ctx.strokeRect(r.x-3, r.y-3, r.w+6, r.h+6);
  ctx.restore();
}

function pollGamepad(){
  if(!navigator.getGamepads) return;
  let gp = null;
  try{ for(const g of navigator.getGamepads()) if(g && g.connected){ gp = g; break; } }catch(e){ return; }
  if(!gp){
    if(padOn) for(const k in padHeld) if(padHeld[k]){ keys[k] = false; padHeld[k] = false; } // unplugged mid-hold
    return;
  }
  if(!padOn){
    padOn = true;
    announce('CONTROLLER RETAINED. Sticks: move & aim-fire · A: talk/confirm · B: strike · X: fire · Y: spin · LB: dash · Start: bag.', false, 6);
    if(state==='menu') padMenuHighlight();
  }
  const pb = gp.buttons.map(b => !!(b && b.pressed));
  const edge = i => pb[i] && !padPrev[i];
  const inPanel = invOpen || shopOpen || helpOpen;

  // --- one-shot navigation edges: d-pad, or the left stick flicked past halfway ---
  const sx = gp.axes[0]||0, sy = gp.axes[1]||0;
  let dir = 'none';
  if(pb[12] || sy < -0.5) dir = 'up';
  else if(pb[13] || sy > 0.5) dir = 'down';
  else if(pb[14] || sx < -0.5) dir = 'left';
  else if(pb[15] || sx > 0.5) dir = 'right';
  const nav = dir !== padNavPrev ? dir : 'none';
  padNavPrev = dir;

  // --- movement: left stick + d-pad → the joystick channel update() already reads ---
  let mx = sx, my = sy;
  if(pb[14]) mx = -1; if(pb[15]) mx = 1;
  if(pb[12]) my = -1; if(pb[13]) my = 1;
  if(Math.hypot(mx,my) > 0.24){ joy.dx = mx; joy.dy = my; joy.on = true; padHeld.move = true; }
  else if(padHeld.move){ joy.dx = 0; joy.dy = 0; joy.on = false; padHeld.move = false; }

  // --- right stick: aim + hold fire (twin-stick) ---
  const ax = gp.axes[2]||0, ay = gp.axes[3]||0, am = Math.hypot(ax,ay);
  if(am > 0.35){
    padAim = { x:ax/am, y:ay/am };
    if(state==='play' && !inPanel && player) player.face = { x:padAim.x, y:padAim.y };
  } else padAim = null;

  // --- held buttons → held keys (write only on transitions, so the keyboard coexists;
  //     suppressed while a panel is up so closing with B doesn't swing the briefcase) ---
  const hold = { j: !inPanel && pb[1], l: !inPanel && pb[3], shift: !inPanel && (pb[4]||pb[6]),
                 k: !inPanel && (!!padAim || pb[2] || pb[5] || pb[7]) };
  for(const k in hold){ if(hold[k] !== !!padHeld[k]){ keys[k] = hold[k]; padHeld[k] = hold[k]; } }

  // opening the bag/shop resets the cursor to the top
  if((invOpen || shopOpen) && !padPanelWas) padSel = 0;
  padPanelWas = invOpen || shopOpen;

  // --- A: confirm wherever you are ---
  if(edge(0)){
    if(state==='menu'){
      const el = padMenuHighlight(); if(el) el.click();
    } else if(state==='dialog' && dlg){
      const node = dlg.nodes[dlg.i];
      if(node.choices) chooseDialog(padDlgSel); else advDialog();
    } else if(invOpen || shopOpen){
      const rects = invOpen ? invRects : shopRects;
      const r = rects[Math.min(padSel, rects.length-1)];
      if(r) (invOpen ? inventoryClick : shopClick)(r.x + r.w/2, r.y + r.h/2);
    } else if(helpOpen){
      toggleHelp();
    } else if(state==='gameover' || state==='victory'){
      document.getElementById('menu').style.display = 'flex';
      state = 'menu'; refreshContinue();
      padMenuHighlight();
    } else keys['e'] = true;   // update() consumes and clears this itself
  }

  // --- B: close whatever panel is up ---
  if(edge(1) && inPanel){
    if(invOpen) toggleInventory(); else if(shopOpen) toggleShop(); else toggleHelp();
  }

  // --- navigation: menu grid, dialog choices, bag/shop cursor ---
  if(nav !== 'none'){
    if(state==='menu'){
      if(nav==='left')  padMenuPos.col--;
      if(nav==='right') padMenuPos.col++;
      if(nav==='up')    padMenuPos.row--;
      if(nav==='down')  padMenuPos.row++;
      padMenuHighlight();
      if(AU.ctx) SFX.blip();
    } else if(state==='dialog' && dlg){
      const node = dlg.nodes[dlg.i];
      if(node !== padLastNode){ padLastNode = node; padDlgSel = 0; }
      if(node.choices && (nav==='up' || nav==='down')){
        const n = node.choices.length;
        padDlgSel = (padDlgSel + (nav==='down'?1:-1) + n) % n;
        SFX.blip();
      }
    } else if(invOpen || shopOpen){
      const rects = invOpen ? invRects : shopRects;
      const rowH = invOpen ? 46 : 56;   // matches each panel's list row pitch
      padSel = Math.min(padSel, Math.max(0, rects.length-1));
      if(nav==='down'){
        // walk the rect list; at the last visible row, scroll the list instead
        if(padSel < rects.length-1) padSel++;
        else if(invOpen) invScroll += rowH; else shopScroll += rowH;
      } else if(nav==='up'){
        // at the first visible item row with content scrolled above, scroll back up
        const r = rects[padSel];
        const prevIsControl = padSel > 0 && !rects[padSel-1].id;
        if(r && r.id && prevIsControl && (invOpen ? invScroll : shopScroll) > 0){
          if(invOpen) invScroll -= rowH; else shopScroll -= rowH;
        } else if(padSel > 0) padSel--;
      }
      if(AU.ctx) SFX.blip();
    }
  }

  // --- Start: bag · Back: field manual (same guards as the keyboard handlers) ---
  if(edge(9) && state==='play' && !shopOpen && !helpOpen) toggleInventory();
  if(edge(8)){
    if(helpOpen) toggleHelp();
    else if(state==='play' && !invOpen && !shopOpen) toggleHelp();
  }

  pb.forEach((v,i) => padPrev[i] = v);
}
