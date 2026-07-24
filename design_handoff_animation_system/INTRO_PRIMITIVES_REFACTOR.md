# Task: refactor `js/intro.js` to use the `LEAnim` animation primitives

**Repo:** `samharden/legal-eagles-rpg` (vanilla JS, canvas, no build step)
**Depends on:** `js/anim.js` v1.1+ already present and loaded in `index.html` (it exposes `window.LEAnim` with `Rig`, `FX`, `Typewriter`, `Transition`). If it isn't there yet, add `anim.js` to `js/` and load it after `render.js` first.

## Context

The intro "orientation film" (`js/intro.js`, `state === 'intro'`, driven by `updateIntro()` / `drawIntro()`) has already been upgraded with per-scene sprite rigs (`introSpr` / `introBeat` helpers) and hand-rolled scene transitions + a punctuation-aware typewriter.

This task **replaces that hand-rolled transition + typewriter bookkeeping with two reusable engine primitives** so the intro shares one implementation with the rest of the game. It is a pure refactor — no behavior change, no new copy, no change to `buildIntroScenes` data or to the `introSpr` / `introBeat` rig helpers (leave those exactly as they are).

## The primitives (already in `anim.js`, do not reimplement)

```
LEAnim.Typewriter(text, { cps, onShout })
  .step(dt)   reveal over time; holds 0.26s on . ! ? and 0.13s on , ; : —
              and calls onShout() when an ALL-CAPS word (length >= 4) lands
  .finish()   reveal everything now
  .count      number of chars revealed (int)   .shown  revealed substring   .done  bool
  Feed multiple lines joined by "\n"; read .count / .shown and split on "\n".

LEAnim.Transition(dur = 0.5)   // constructed "settled" (t = dur)
  .start()             begin the splice (t = 0)
  .step(dt)            advance
  .contentAlpha        0->1 fade-in for the scene body
  .slideY              px vertical slide that eases to 0
  .flash               1->0 white-splice alpha for the first ~0.18s
  .kenBurns(sceneT)    slow scale (1 -> 1.03 over ~9s) for the art push
  .active / .t         still transitioning / raw seconds
```

## Edits

### 1. Globals (top of `intro.js`)
Remove the hand-rolled scalars (`introChars`, `introBudget`, `introHoldT`, and the numeric `introTrans`) and declare:
```js
let introTW, introTrans;          // Typewriter + Transition for the current scene
// keep: introN, introClock, introSceneT, introDt, introRigs, introBeats, introScenes
```

### 2. Scene entry — build a fresh primitive pair
In **both** `startIntro(...)` and `introNext()`, where a scene becomes active:
```js
const s = introScenes[introN];
introTW = new LEAnim.Typewriter(s.lines.join('\n'), {
  cps: INTRO_CPS,
  onShout: () => { shake = Math.max(shake, 2.2); },   // reuse the combat screen-shake
});
introTrans = new LEAnim.Transition(0.5);
introTrans.start();
introSceneT = 0; introRigs = {}; introBeats = {};
```
(If `startIntro` and `introNext` share a scene-init path, put it there once.)

### 3. `updateIntro(dt)` — replace the whole typewriter/transition block with
```js
introDt = dt;                     // introSpr() reads this
introClock += dt; introSceneT += dt;
introTrans.step(dt);
if (introTrans.t > 0.12) introTW.step(dt);   // let the splice settle before typing
```

### 4. `introAdvance()` — finish typing, else turn the page
```js
if (!introTW) return;
if (!introTW.done) { introTW.finish(); return; }
introNext();
```
And in `introSkip()` (or wherever skip lands on the last reel) call `introTW.finish();` after setting the scene.

### 5. `drawIntro()` — use the transition getters + read the body from `introTW`
Wrap the art + header + typed body in one save, using the primitive instead of the manual math:
```js
const s = introScenes[introN];
ctx.save();
ctx.globalAlpha = introTrans.contentAlpha;
const kb = introTrans.kenBurns(introSceneT);
ctx.translate(W/2, 300); ctx.scale(kb, kb); ctx.translate(-W/2, -300 + introTrans.slideY);
  s.art(introClock);
  // ---- header (exhibit tag + title) unchanged ----
  // ---- typed body: iterate s.lines, but drive the reveal from introTW.count ----
  //      let left = introTW.count;   // was: introChars
  //      (rest of the per-line slice + blinking cursor logic is unchanged)
ctx.restore(); ctx.globalAlpha = 1;

// film-splice white flash over everything, first frames only
if (introTrans.flash > 0) {
  ctx.globalAlpha = introTrans.flash; ctx.fillStyle = '#f4eede';
  ctx.fillRect(0, 0, W, 600); ctx.globalAlpha = 1;
}
// ---- CRT scanlines / rolling band / vignette / skip chip / reel counter / letterbox: unchanged ----
```

## Acceptance check
- Play the reel start to finish: each exhibit **splices in** (brief white flash + fade + slight upward settle), the art has a slow ken-burns push, and body text types on with a beat pause after `. , ; : ! ? —`.
- SHOUTED words (GRAVES, OBJECT, DEWEY, NAME PARTNER…) give a tiny screen jolt as they finish.
- Any key / click still fast-forwards the current scene's typing, then advances; **Esc** still skips to the end.
- The `introSpr` / `introBeat` sprite rigs (emeritus shudder, hire strikes, roster stagger, counsel strike) behave exactly as before.
- No console errors; `window.LEAnim.Typewriter` and `.Transition` are defined.

## Do NOT
- Reimplement the pause/shout logic or the transition math inline — call the primitives.
- Touch `buildIntroScenes` copy, the `introSpr` / `introBeat` helpers, or the CRT/skip-chip chrome.
- Add a build step or any dependency; this is plain browser JS.

## Reference
`reference-intro-reel.dc.html` in this bundle is a working build of the intro on these exact primitives (with an OLD⟷NEW toggle) — open it in a browser to see the target behavior. `anim.js` is the source of truth for the primitive APIs.
