# Handoff: Legal Eagles — Procedural Animation System

**Target repo:** `samharden/legal-eagles-rpg` (vanilla JS, canvas, no build step)
**For:** Claude Code, implementing directly in the game.

---

## Overview

The game currently draws every character as a single static 16×16 pixel sprite with a `Math.sin` bob, plus a few ad-hoc timers (`swingT`, `spinT`, `hurtT`), linear `shake`, `hitStop`, and spark/paper particles + rising damage text. Characters slide around rigidly.

This handoff replaces that with a **procedural animation engine** (`anim.js`) that rigs the *existing baked sprites* — no new art. It adds squash & stretch, walk-bounce, idle breathing, anticipation→follow-through strikes, spins, dash-stretch with after-images, hit-flash, knockback recoil, spawn pop-in, grounding shadows, a comedic "DISMISSED" rubber-stamp death, plus a trauma-based screen shake, hit-stop, and layered particle/ring/flash/pop-number FX.

## About the files in this bundle

- **`anim.js`** — the engine. **This is production-ready, drop it into `js/` and ship it as-is.** It is framework-free and additive. (Unlike a typical design handoff, this file is *not* just a reference — it is the actual code to include.)
- **`reference-playground.dc.html`** — a self-contained interactive demo that runs `anim.js` on the real game sprites (with an OLD⟷NEW toggle and a state gallery). **Reference only** — do NOT port this file into the game; it exists so you can see every animation state and confirm behavior. It bakes its own sprite subset; the game already has the real `SPR`.

## Fidelity

**High-fidelity / final.** `anim.js` is the shipping implementation. The task is wiring, not recreation. Match the timing/feel shown in the playground.

---

## The engine API (`window.LEAnim`)

```
LEAnim.Rig(opts)   — one per animated entity. opts: {bounce, breathe} (default 1)
  .step(dt, {moving, speed, faceX})   advance passive + active animation each frame
  .draw(ctx, spriteCanvas, x, y, size, flip, alpha)   draw with shadow + transform + flash
  .strike() .spin() .dash(dx,dy) .hurt(dx,dy,power) .spawn()
  .die(mode)         mode = 'pop' (default, enemies) | 'crumple' (player, flatten)
  .punch(v)          generic squash pop (footfall / land)
  .intensity         global squash multiplier (0..2), set live for tuning
  .state             'idle'|'walk'|'strike'|'spin'|'dash'|'hurt'|'die'|'spawn'
  .dead              true once a death animation has finished — remove the entity
  .dx, .bob          current knockback / hop offset (for attaching held items)

LEAnim.FX(SPR, blit) — one shared instance. blit = (ctx,spr,x,y,size,flip,alpha)=>{}
  .step(dt)                    integrate everything; compute shake
  .drawWorld(ctx, cam)         draw particles, rings, flashes, pop-numbers, stamps
  .shakeX .shakeY .shakeRot    apply to ctx before drawing the world
  .trauma  .hitStop            read to gate shake / freeze
  .addTrauma(a)  .stop(t)      screen shake / hit-stop
  .spark(x,y,n) .paper(x,y,n) .dust(x,y,dx,dy,n)
  .ring(x,y,color,maxR,life,w) .flash(x,y,r,color) .muzzle(x,y,ang,color)
  .number(x,y,text,color,big)  floating pop damage number
  .stamp(x,y,text,color)       rubber-stamp slam (the DISMISSED death effect)
  .maxShake  .hitStopScale     tuning knobs (defaults 14, 1)

LEAnim.Easing { linear outQuad outCubic inCubic inOutCubic outBack outElastic }
LEAnim.clamp lerp damp springStep whiteMask
```

Coordinate note: `Rig.draw` and `FX.drawWorld` expect the same space you already draw sprites in — inside the `ctx.scale(ZOOM)` block, with world coords minus `cam`. `draw(...)` takes screen-space `ex = e.x - cam.x` exactly like the current `drawSprite` calls. `drawWorld(ctx, cam)` subtracts `cam` itself.

---

## Implementation steps (edit these real files)

### 1. `index.html` — load it
Add after the `render.js` line, before `loop.js`:
```html
<script src="js/anim.js?v=34"></script>
```

### 2. `state.js` — declare the shared FX
Add to the globals block: `let fx;`

### 3. `story.js` (and any other player-construction site, e.g. NG+ path ~line 194) — give the player a rig + build fx
In the player object literal (the one with `face:{x:0,y:1}, meleeCd:0, spinCd:0, swingT:0, spinT:0, dashT:0 …`, ~line 765) add:
```js
rig: new LEAnim.Rig({ bounce: 1.2 }),
```
Immediately after the player is created, initialize `fx` once:
```js
fx = new LEAnim.FX(SPR, (c,s,x,y,z,fl,a)=>{
  c.save(); c.imageSmoothingEnabled=false; c.globalAlpha=a==null?1:a;
  c.translate(x,y); if(fl) c.scale(-1,1);
  c.drawImage(s,-z/2,-z/2,z,z); c.restore();
});
```
(There are two player-spawn paths — new game and NG+/merger. Both need `rig`. `fx` only needs building once; guard with `if(!fx) fx = …` if simpler.)

### 4. `entities.js` — rigs on spawn + route the combat events

`spawnEnemy(...)`, right before `enemies.push(e)`:
```js
e.rig = new LEAnim.Rig(); e.rig.spawn();
```

`melee()` — at the top after the cooldown guard: `player.rig.strike();`
Inside the hit loop, where it sets `e.hurtT = 0.12`, add `e.rig.hurt(fx_, fy_);` (use the existing `fx`/`fy` facing locals — note they're named `fx,fy` in `melee()`, so pass them but keep the FX global unshadowed: rename the FX global usage or capture facing into `nx,ny` first to avoid the name clash with the local `fx`). On a connecting hit, replace `shake = Math.max(shake,3); hitStop = Math.max(hitStop,0.04);` with `fx.addTrauma(0.35); fx.stop(0.05);` **⚠ NAME CLASH:** `melee()` already uses local `fx, fy` for facing. Rename those locals to `fdx, fdy` (or name the engine instance `FXM`) before wiring, so `fx` unambiguously means the FX manager.

`spin()` — after the cooldown guard: `player.rig.spin(); fx.ring(player.x, player.y, '#f0c75e', 110, 0.4, 4);` and add `e.rig.hurt((e.x-player.x)/(d||1),(e.y-player.y)/(d||1));` in the loop.

`fire()` — after computing `ang`: `fx.muzzle(player.x+player.face.x*18, player.y+player.face.y*18, ang, c.color);`

### 5. `update.js` — step the rigs, route reactions, fix death ordering

After `player.moving` is set (and after the dash block so the dash state is current):
```js
player.rig.step(dt, { moving: player.moving, speed: 220, faceX: player.face.x });
```
In the dash trigger branch (where `player.dashT = 0.16 * …`): `player.rig.dash(player.dashDx, player.dashDy);`

In the enemy `for(const e of enemies)` loop, near `e.wob += dt*6`:
```js
if(e.dying){ e.rig.step(dt, { moving:false }); continue; }   // skip AI while dying
e.rig.step(dt, { moving: !stunned && d>30, speed: e.spd, faceX: Math.cos(ang) });
```
(You'll need `d`/`ang` computed before this — they already are a few lines down; move the rig.step call below them, or hoist `d`/`ang`.)

Where a player shot hits an enemy (`e.hurtT = 0.12`): add `e.rig.hurt(Math.cos(a2), Math.sin(a2));` (derive `a2` from the shot velocity `Math.atan2(s.vy,s.vx)`).

Replace the remaining bare `shake = Math.max(shake, N)` with `fx.addTrauma(N/20)` and `hitStop = Math.max(hitStop, T)` with `fx.stop(T)` at each site (gavel nova, slam, boss phase, charger tackle, deaths). Rough conversion: `trauma ≈ shake/20`, clamped to 1.

`floaters.push({…})` → `fx.number(x, y, text, color, isBig)`.
`particles.push({… spr:'spark'})` → `fx.spark(x, y, n)`;  `spr:'paper'` → `fx.paper(x, y, n)`.
You may leave the old `particles`/`floaters` arrays + their integration/draw in place during migration and delete them once every push is converted.

**Death ordering (required change).** The current loop deletes enemies the instant `hp<=0`, so no death animation plays. Split trigger from removal:
```js
for(const e of enemies){
  if(e.hp<=0 && !e.dying){
    e.dying = true;
    e.rig.die();                          // 'pop'
    fx.paper(e.x, e.y, e.boss?24:12); fx.spark(e.x, e.y, 8, 200);
    fx.ring(e.x, e.y, '#ff9bb0', e.boss?120:60);
    fx.addTrauma(e.boss?0.7:0.4);
    // …ALL existing on-death code (gainXP, loot, questEvent, boardKill,
    //   SFX, KILL_QUIPS floater→fx.number, boss pickups) runs here, ONCE…
  }
}
enemies = enemies.filter(e => !e.rig.dead);   // was: e.hp>0
```
Also guard AI/contact/shooting against `e.dying` (the `continue` above handles the movement/shoot block; make sure contact-damage and "player shots hitting enemy" skip `e.dying` too).

Add at the very end of `update(dt)`: `fx.step(dt);`

`hurtPlayer(d, contact)` — where it sets `player.hurtT` and `shake`: add
```js
player.rig.hurt(nx, ny, 1);   // nx,ny = knockback dir away from the attacker
fx.addTrauma(0.5); fx.number(player.x, player.y-26, Math.round(d), '#ff6b6b');
```
On the fatal branch (`player.hp<=0` → `state='gameover'`): `player.rig.die('crumple'); fx.stamp(player.x, player.y-6, 'DISMISSED', '#c0392b');`

### 6. `loop.js` — point hit-stop at the engine
Replace `if(hitStop>0){ hitStop -= dt; }` with:
```js
if(fx.hitStop>0){ fx.hitStop -= dt; }
```
(Keep the existing `else { update(dt); }`.)

### 7. `render.js` — draw through the rigs + fx

Top of `draw()`: replace
```js
if(shake>0) ctx.translate((Math.random()*2-1)*shake*0.6, (Math.random()*2-1)*shake*0.6);
```
with
```js
if(fx.trauma>0){ ctx.translate(fx.shakeX, fx.shakeY); ctx.rotate(fx.shakeRot); }
```

Enemy draw: replace
```js
drawSprite(SPR[e.type], ex, ey, e.boss?64:34, player.x < e.x, e.hurtT>0?0.55:1);
```
with
```js
e.rig.draw(ctx, SPR[e.type], ex, ey, e.boss?64:34, player.x < e.x, 1);
```
(The rig's own hit-flash replaces the `0.55` alpha dip. Keep drawing the HP bar / boss name / telegraphs as-is — those already read `e.hurtT`, `e.windT`, etc., which are untouched.)

Player draw: replace
```js
drawSprite(pspr, px, py, 38, pflip, blink?0.4:1);
```
with
```js
player.rig.draw(ctx, pspr, px, py, 38, pflip, blink?0.4:1);
```
The briefcase block stays; optionally add the rig offsets so it tracks the hop: use `px + Math.cos(bA)*bR + player.rig.dx` and `py + Math.sin(bA)*bR + player.rig.bob`.

FX layer: **replace** the `// particles` and `// floaters` loops with a single call, kept inside the `ctx.scale(ZOOM)` world block (after entities/allies, before the mood/vignette wash):
```js
fx.drawWorld(ctx, cam);
```
The existing spin ring / shield bubble / retainer draws can stay (or move to `fx.ring`); they don't conflict.

---

## Timing / feel reference (from the playground)

- strike 0.34s (32% anticipation, then `outBack` release), spin 0.42s (two turns, `outCubic`), dash 0.20s stretch + after-images, hurt 0.28s, spawn 0.5s `outBack`, death 'pop' 0.55s / 'crumple' 0.95s.
- Walk: bounce `-3.4px * |sin|`, footfall squash ~7%. Idle breathing ~2%.
- FX defaults: `maxShake` 14px, `maxRot` 0.03rad, trauma decays at 1.8/s (quadratic). Stamp descends 2.9×→1× over 0.22s then holds, `addTrauma(0.7)` on land.
- `rig.intensity` scales all squash for global feel tuning (playground exposes it as a slider).

## Incremental strategy (recommended)

Do **steps 1–4 + the enemy/player draw swaps in step 7** first. The game keeps running with the old `shake`/`hitStop`/`particles` intact, and you immediately get squash/stretch, walk-bounce, shadows and hit-flash. Then convert the step-5 reaction call sites and the death ordering one at a time. The stamp death and shake migration are the last, purely-cosmetic step.

## Gotchas
- **`fx` name clash in `melee()`** — that function already uses `fx, fy` locals for facing. Rename them before wiring (see step 4).
- Every player-construction path (new game **and** NG+/merger in `story.js`) must set `rig`.
- Bosses draw at size 64 and get `hitStop` on death — `e.rig.draw` handles the scale; just keep passing `e.boss?64:34`.
- Don't add a rig to purely static props (plants, computers, files) — keep `drawSprite` for those.

---

## Part 2 — The intro reel (`intro.js`)

The orientation film already works; these edits give it film-splice transitions, sprites that pop in / breathe / react, a ken-burns push on the art, and a punctuation-aware typewriter. Reference build: `reference-intro-reel.dc.html` in this bundle (has an OLD⟷NEW toggle). Do NOT change the scene copy or `buildIntroScenes` data — only the update/draw/art layer.

**A. Scene lifecycle — give each scene its own rigs.** In `startIntro` and `introNext`, reset a per-scene rig map and a transition clock:
```js
introRigs = {}; introBeats = {}; introTrans = 0;   // add `let introRigs, introBeats, introTrans;` up top
```
Add a helper that lazily creates + spawns a rig the first time a scene draws a sprite, and routes to the old `drawSprite` when you want to A/B it:
```js
function introSpr(id, key, x, y, size, flip, alpha){
  let r = introRigs[id];
  if(!r){ r = new LEAnim.Rig({bounce:1}); r.spawn(); introRigs[id] = r; }
  r.step(introDt, {moving:false});           // introDt = last dt, stash it in updateIntro
  r.draw(ctx, SPR[key], x, y, size, !!flip, alpha==null?1:alpha);
  return r;
}
function introBeat(id, period, phase){       // fires once per period (not on the first frame)
  const n = Math.floor((introSceneT+ (phase||0))/period);
  if(introBeats[id]===undefined){ introBeats[id]=n; return false; }
  if(n>introBeats[id]){ introBeats[id]=n; return true; } return false;
}
```
Track `introSceneT` (seconds since this scene started; reset in `startIntro`/`introNext`) alongside `introClock`.

**B. In the art painters (`introArtFirm` … `introArtStart`)** replace the character `drawSprite(SPR.x, …)` calls with `introSpr('uniqueId','x', …)` and drive reactions off beats — e.g. in `introArtHire`:
```js
if(introBeat('hm',2.4,0)) introRigs['hm'] && introRigs['hm'].strike();
introSpr('hm','p_m',415,200,108,false);
```
`introArtLegend` → the emeritus shudders: `if(introBeat('em',3.2)) introRigs['em']&&introRigs['em'].hurt(0,-.3,.45); introSpr('em','grandfather',480,214,128);`. `introArtRoster` → stagger with `if(introSceneT < i*0.12) return;` before each foe and `introBeat('foe'+i,2.6,i*0.4)` → `.hurt(...)`. `introArtPractice` → counsel `.strike()` on a 1.7s beat. Keep purely-static props (`file`, `coffee`, `briefcase`, skyline) on `drawSprite`.

**C. Transitions + ken-burns in `drawIntro`.** After clearing, advance the clock (`if(introTrans<0.5) introTrans+=introDt;`) and wrap the art+header+body block in one save:
```js
const trA = LEAnim.clamp((introTrans-0.08)/0.24,0,1);
const yOff = (1-LEAnim.Easing.outCubic(Math.min(1,introTrans/0.5)))*24;
const kb = 1 + LEAnim.Easing.outCubic(Math.min(1,introSceneT/9))*0.03;
ctx.save(); ctx.globalAlpha=trA;
ctx.translate(W/2,300); ctx.scale(kb,kb); ctx.translate(-W/2,-300+yOff);
  s.art(introClock); /* …header + typed body… */
ctx.restore(); ctx.globalAlpha=1;
// splice: white flash + a few tracking scratch lines
if(introTrans<0.18){ ctx.globalAlpha=1-introTrans/0.18; ctx.fillStyle='#f4eede'; ctx.fillRect(0,0,W,600); ctx.globalAlpha=1; }
```
Then draw the CRT/scanlines/skip-chip/counter at full alpha as today. In `introNext` set `introTrans=0` so each page splices in.

**D. Typewriter cadence in `updateIntro`.** Stash `introDt=dt;`. Gate typing until `introTrans>0.12`. Replace the flat `introChars += INTRO_CPS*dt` with a budget loop that pauses on punctuation and jolts on SHOUTED words:
```js
if(introHoldT>0){ introHoldT-=dt; }
else { introBudget += INTRO_CPS*dt;
  while(introBudget>=1 && introChars<total && introHoldT<=0){
    const ch = flat[Math.floor(introChars)]||''; introChars++; introBudget--;
    if('.!?'.includes(ch)) introHoldT=0.26; else if(',;:\u2014'.includes(ch)) introHoldT=0.13;
    // (optional) if the just-finished word was ALL-CAPS length>=4, nudge a 2px screen shake
  }
}
```
(`flat` = the scene's lines joined by `\n`; `total` = `introTotal(s)`.) A 2px shake can ride the same `shake`/`fx.shakeX` you added for combat.

**Incremental:** do B (rigs in the art painters) first — instantly livelier with zero risk — then C (transitions) and D (typewriter).

## Files to reference in the repo
`index.html`, `js/sprites.js` (baked `SPR`, `drawSprite`), `js/entities.js` (`melee`/`spin`/`fire`/`spawnEnemy`), `js/update.js` (`update`, `hurtPlayer`, enemy loop, death loop), `js/render.js` (`draw`), `js/loop.js` (`step`), `js/state.js` (globals), `js/story.js` (player construction). New file: `js/anim.js`.
