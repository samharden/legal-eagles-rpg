"use strict";
// ============================== MENU ==============================
let selGender=null, selClass=null;
const genderRow=document.getElementById('genderRow'), classRow=document.getElementById('classRow');
const startBtn=document.getElementById('startBtn');
function mkPick(row, item, onSel){
  const b=document.createElement('button');
  b.className='pick';
  b.innerHTML=`<span class="em"><img src="${SPR[item.spr].toDataURL()}" alt=""></span><span class="nm">${item.nm}</span><span class="ds">${item.ds}${item.atk?`<br><b style="color:#e8e0f0">Attack: ${item.atk}</b>`:''}</span>`;
  b.onclick=()=>{ [...row.children].forEach(c=>c.classList.remove('sel')); b.classList.add('sel'); onSel(item.id); checkReady(); };
  row.appendChild(b);
}
GENDERS.forEach(g=>mkPick(genderRow,g,id=>selGender=id));
CLASSES.forEach(c=>mkPick(classRow,c,id=>selClass=id));
function checkReady(){ startBtn.disabled = !(selGender&&selClass); }
startBtn.onclick=()=>{
  audioInit(); // user gesture: safe to start the AudioContext here
  clearSave(); // signing a fresh engagement letter abandons the old case file
  document.getElementById('menu').style.display='none';
  startIntro(selGender, selClass); // the orientation film runs first; it calls startGame
  SFX.quest();
};
const continueBtn=document.getElementById('continueBtn');
function refreshContinue(){ continueBtn.style.display = readSave() ? '' : 'none'; }
refreshContinue();
continueBtn.onclick=()=>{
  audioInit();
  if(loadGame()){
    document.getElementById('menu').style.display='none';
    SFX.quest();
  } else refreshContinue(); // save was corrupt and got cleared — hide the button
};

requestAnimationFrame(loop);
