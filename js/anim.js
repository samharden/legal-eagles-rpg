"use strict";
/* ============================================================================
   LEAnim — Legal Eagles procedural animation engine (drop-in)
   ----------------------------------------------------------------------------
   Brings the game's existing static 16x16 sprites to life WITHOUT new art:
   a per-entity Rig applies squash/stretch, walk-bounce, lean, anticipation,
   follow-through, spins, dash-stretch + after-images, hit-flash, knockback
   recoil, spawn pop-in and a death animation — all layered on top of the
   sprite you already draw. A small FX manager owns particles, floating pop
   numbers, shockwave rings, impact flashes, dust, muzzle flashes, a trauma-
   based screen shake and hit-stop.

   Everything is framework-free and additive. See the "DROP-IN" section of the
   playground for the exact edits to render.js / update.js.
   ========================================================================== */
(function (global) {

  /* ---------------------------------- math -------------------------------- */
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp  = (a, b, t) => a + (b - a) * t;
  // exponential smoothing that's stable at any dt (great for cameras / aim)
  const damp  = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

  const Easing = {
    linear:   t => t,
    outQuad:  t => 1 - (1 - t) * (1 - t),
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inCubic:  t => t * t * t,
    inOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    // overshoot — the workhorse of comedic follow-through
    outBack:  (t, s = 1.9) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    outElastic: t => t === 0 ? 0 : t === 1 ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
  };

  // one semi-implicit spring step — [pos, vel] in, [pos, vel] out. Rock solid.
  function springStep(x, v, target, k, d, dt) {
    const a = -k * (x - target) - d * v;
    v += a * dt;
    x += v * dt;
    return [x, v];
  }

  /* --------------------------- white-flash cache -------------------------- */
  // A connecting hit flashes the sprite solid white for a few frames. We build
  // (once, lazily) a white silhouette of each sprite canvas and cache it.
  const _white = new WeakMap();
  function whiteMask(spr) {
    let w = _white.get(spr);
    if (w) return w;
    w = document.createElement('canvas');
    w.width = spr.width; w.height = spr.height;
    const g = w.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(spr, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, w.width, w.height);
    _white.set(spr, w);
    return w;
  }

  /* ================================== RIG ================================= */
  // One per animated entity. Hold a reference on the entity (e.rig = new Rig())
  // call rig.step(dt, {moving,speed,faceX,faceY}) each frame, trigger events
  // (strike/spin/dash/hurt/die/spawn), and draw through rig.draw(...).
  class Rig {
    constructor(opts = {}) {
      this.state = 'idle';   // idle | walk | strike | spin | dash | hurt | die | spawn
      this.stateT = 0;
      this.dead = false;     // death animation finished — safe to remove entity

      this.sx = 1; this.sy = 1;   // final scale, written every step()
      this.rot = 0;               // final rotation (spin / death tumble)
      this.lean = 0;              // final tilt
      this.bob = 0;               // vertical hop offset (px, pre-scale)
      this.dx = 0; this.dy = 0;   // knockback recoil offset (px)
      this.alpha = 1;
      this.flash = 0;             // 0..1 white overlay

      this.phase = Math.random() * 6.28;   // desync idle/walk between entities
      this.pop = 0; this._popV = 0;        // additive impact squash spring
      this._rvx = 0; this._rvy = 0;        // recoil velocity

      this.after = [];            // dash after-images (captured in draw)
      this._afterCd = 0;
      this.dieMode = 'pop';       // 'pop' (quick dismissal) | 'crumple' (stamped flat)

      this.bounce  = opts.bounce  != null ? opts.bounce  : 1;   // walk-hop scale
      this.breathe = opts.breathe != null ? opts.breathe : 1;   // idle scale
      this.intensity = 1;         // global squash multiplier (tweakable)
      this.dashDir = 0;
    }

    /* --- event triggers ------------------------------------------------- */
    strike() { if (this.state === 'die') return; this.state = 'strike'; this.stateT = 0; }
    spin()   { if (this.state === 'die') return; this.state = 'spin';   this.stateT = 0; this.rot = 0; }
    dash(dx, dy) {
      if (this.state === 'die') return;
      this.state = 'dash'; this.stateT = 0;
      this.dashDir = Math.sign(dx) || this.dashDir;
      this.after.length = 0;
    }
    hurt(dx = 0, dy = 0, power = 1) {
      if (this.state === 'die') return;
      this.state = 'hurt'; this.stateT = 0;
      this.flash = 1;
      this._popV -= 9 * power;                 // stretch on impact
      this._rvx += dx * 220 * power;
      this._rvy += dy * 220 * power;
    }
    die(mode = 'pop') {
      if (this.state === 'die') return;
      this.state = 'die'; this.stateT = 0; this.dieMode = mode;
      this.rot = 0;
      this._rotV = (Math.random() * 2 - 1) * 11;
      this.flash = 1;
    }
    spawn() { this.state = 'spawn'; this.stateT = 0; this.alpha = 0; }
    punch(v = 6) { this._popV += v; }          // generic squash pop (footfall/land)

    /* --- per-frame update ----------------------------------------------- */
    step(dt, mv) {
      dt = Math.min(dt, 1 / 30);
      this.stateT += dt;
      mv = mv || {};
      const moving = !!mv.moving;
      const speed = mv.speed || 0;

      // idle<->walk is the resting machine; transient states run to completion
      if (this.state === 'idle' || this.state === 'walk')
        this.state = moving ? 'walk' : 'idle';

      let tsx = 1, tsy = 1, tlean = 0, bob = 0;

      if (this.state === 'walk') {
        this.phase += dt * (9 + speed * 0.02);
        const up = Math.abs(Math.sin(this.phase));   // 0 at contact, 1 at apex
        bob   = -up * 3.4 * this.bounce;
        tsx   = 1 + (1 - up) * 0.07 * this.bounce;   // squash at each footfall
        tsy   = 1 - (1 - up) * 0.09 * this.bounce;
        tlean = (mv.faceX || 0) * 0.05;
      } else if (this.state === 'idle') {
        const b = Math.sin(this.stateT * 2.2) * 0.022 * this.breathe;
        tsy = 1 + b; tsx = 1 - b * 0.5;
        this.phase = 0;
      } else if (this.state === 'strike') {
        const t = this.stateT / 0.34;
        if (t >= 1) { this.state = 'idle'; }
        else if (t < 0.32) {                         // anticipation: coil back
          const k = Easing.outCubic(t / 0.32);
          tsx = 1 - 0.14 * k; tsy = 1 + 0.12 * k; tlean = -0.22 * k;
        } else {                                     // release + follow-through
          const k = Easing.outBack((t - 0.32) / 0.68);
          tsx = 0.86 + 0.30 * k; tsy = 1.12 - 0.28 * k; tlean = -0.22 + 0.52 * k;
        }
      } else if (this.state === 'spin') {
        const t = this.stateT / 0.42;
        if (t >= 1) { this.state = 'idle'; this.rot = 0; }
        else {
          this.rot = Easing.outCubic(t) * Math.PI * 4;   // two full turns, decelerating
          const s = Math.sin(t * Math.PI);
          tsx = 1 + 0.12 * s; tsy = 1 - 0.10 * s;
        }
      } else if (this.state === 'dash') {
        const t = this.stateT / 0.20;
        if (t >= 1) { this.state = 'idle'; }
        else {
          const k = 1 - t;
          tsx = 1 + 0.38 * k; tsy = 1 - 0.24 * k;       // streak along travel
          tlean = this.dashDir * 0.14 * k;
        }
      } else if (this.state === 'hurt') {
        const t = this.stateT / 0.28;
        if (t >= 1) this.state = moving ? 'walk' : 'idle';
      } else if (this.state === 'spawn') {
        const t = this.stateT / 0.5;
        if (t >= 1) { this.state = 'idle'; this.alpha = 1; }
        else { const e = Easing.outBack(t); tsx = e; tsy = e; this.alpha = clamp(t * 2, 0, 1); }
      } else if (this.state === 'die') {
        if (this.dieMode === 'crumple') {              // stamped into the record — a legal defeat
          const t = this.stateT / 0.95;
          if (t >= 1) this.dead = true;
          if (t < 0.2) {                               // brace up as the stamp falls
            const k = t / 0.2; tsy = 1 + 0.10 * k; tsx = 1 - 0.05 * k; bob = -5 * k;
          } else {                                     // SLAM flat, wobble-settle, tip into a heap
            const k = (t - 0.2) / 0.8;
            const flat = Easing.outElastic(Math.min(1, k * 2.4));
            tsy = 1 - 0.62 * flat;
            tsx = 1 + 0.55 * flat;
            this.rot = Math.min(0.55, this.rot + dt * 1.4);
            this.alpha = k > 0.6 ? Math.max(0, 1 - (k - 0.6) / 0.4) : 1;
          }
        } else {                                       // 'pop' — quick dismissal (enemies)
          const t = this.stateT / 0.55;
          if (t >= 1) this.dead = true;
          if (t < 0.16) { const k = t / 0.16; tsy = 1 - 0.55 * k; tsx = 1 + 0.45 * k; }  // gulp
          else {
            const k = (t - 0.16) / 0.84;
            tsy = 0.45 + 1.1 * Easing.outCubic(k);         // pop tall
            tsx = 1.45 - 1.15 * Easing.outCubic(k);
            this.rot += (this._rotV || 6) * dt;
            bob = -Easing.outQuad(k) * 26;                 // little launch
            this.alpha = 1 - k;
          }
        }
      }

      // apply global squash intensity around the neutral (1.0)
      const I = this.intensity;
      tsx = 1 + (tsx - 1) * I; tsy = 1 + (tsy - 1) * I;
      tlean *= I; bob *= (0.5 + 0.5 * I);

      // additive impact-pop spring (squash punch that settles)
      [this.pop, this._popV] = springStep(this.pop, this._popV, 0, 320, 22, dt);
      // knockback recoil spring — a shove that overshoots home
      [this.dx, this._rvx] = springStep(this.dx, this._rvx, 0, 140, 15, dt);
      [this.dy, this._rvy] = springStep(this.dy, this._rvy, 0, 140, 15, dt);

      this.sx = tsx * (1 + this.pop * 0.5);
      this.sy = tsy * (1 - this.pop * 0.5);
      this.lean = tlean;
      this.bob = bob;
      if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 4.5);

      // dash after-image bookkeeping
      for (const a of this.after) a.t -= dt * 4.5;
      this.after = this.after.filter(a => a.t > 0);
    }

    /* --- draw ----------------------------------------------------------- */
    // (ctx, spriteCanvas, screenX, screenY, size, faceFlip, alpha)
    draw(ctx, spr, x, y, size, flip, alpha = 1) {
      if (!spr) return;
      const a = alpha * this.alpha;

      // grounding shadow — shrinks as the entity hops (huge depth win)
      const lift = clamp(-this.bob / 26, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.32 * (1 - lift * 0.5);
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(x + this.dx, y + size * 0.40, size * (0.30 - lift * 0.06) * Math.abs(this.sx),
                  size * 0.12 * (1 - lift * 0.4), 0, 0, 7);
      ctx.fill();
      ctx.restore();

      // dash after-images (behind the body)
      if (this.state === 'dash') {
        this._afterCd -= 1;
        if (this._afterCd <= 0) { this._afterCd = 1.2; this.after.push({ x, y, sx: this.sx, sy: this.sy, flip, t: 1 }); }
      }
      for (const g of this.after) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha = a * g.t * 0.35;
        ctx.translate(g.x, g.y + this.bob);
        ctx.scale(g.flip ? -g.sx : g.sx, g.sy);
        ctx.drawImage(spr, -size / 2, -size / 2, size, size);
        ctx.restore();
      }

      // main body
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = a;
      ctx.translate(x + this.dx, y + this.bob + this.dy);
      ctx.rotate(this.rot + this.lean);
      ctx.scale(flip ? -this.sx : this.sx, this.sy);
      ctx.drawImage(spr, -size / 2, -size / 2, size, size);
      if (this.flash > 0.01) {
        ctx.globalAlpha = a * this.flash;
        ctx.drawImage(whiteMask(spr), -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }
  }

  /* ================================== FX ================================= */
  class FX {
    constructor(sprites, blit) {
      this.SPR = sprites || {};
      this.blit = blit;                 // (ctx,spr,x,y,size,flip,alpha)
      this.parts = []; this.floats = []; this.rings = []; this.flashes = []; this.stamps = [];
      this.trauma = 0; this.maxShake = 14; this.maxRot = 0.03;
      this.shakeX = 0; this.shakeY = 0; this.shakeRot = 0;
      this.hitStop = 0;
      this.hitStopScale = 1;
    }
    /* emitters */
    addTrauma(a) { this.trauma = clamp(this.trauma + a, 0, 1); }
    stop(t) { this.hitStop = Math.max(this.hitStop, t * this.hitStopScale); }
    spark(x, y, n = 4, spd = 150) {
      for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() * 2 - 1) * spd,
        vy: (Math.random() * 2 - 1) * spd, t: 0.16 + Math.random() * 0.14, spr: 'spark', drag: 0.9 });
    }
    paper(x, y, n = 8, spd = 180) {
      for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() * 2 - 1) * spd,
        vy: (Math.random() * 2 - 1) * spd, t: 0.5 + Math.random() * 0.4, spr: 'paper', drag: 0.94, spin: 1 });
    }
    dust(x, y, dx = 0, dy = 0, n = 6) {
      for (let i = 0; i < n; i++) { const a = Math.atan2(dy, dx) + (Math.random() * 2 - 1) * 1.1, s = 40 + Math.random() * 90;
        this.parts.push({ x, y, vx: -Math.cos(a) * s, vy: -Math.sin(a) * s - 20, t: 0.22 + Math.random() * 0.16, spr: '_dust', drag: 0.88 }); }
    }
    ring(x, y, color = '#f0c75e', maxR = 90, life = 0.35, w = 3) {
      this.rings.push({ x, y, color, maxR, life, max: life, w });
    }
    flash(x, y, r = 30, color = 'rgba(255,255,255,0.9)') { this.flashes.push({ x, y, r, t: 0.12, max: 0.12, color }); }
    muzzle(x, y, ang, color = '#f0c75e') {
      this.flashes.push({ x, y, r: 16, t: 0.08, max: 0.08, color });
      for (let i = 0; i < 3; i++) this.parts.push({ x, y, vx: Math.cos(ang) * (120 + Math.random() * 120),
        vy: Math.sin(ang) * (120 + Math.random() * 120), t: 0.12 + Math.random() * 0.08, spr: 'spark', drag: 0.9 });
    }
    number(x, y, text, color = '#fff', big = false) {
      this.floats.push({ x, y, vy: -34, t: big ? 1.0 : 0.75, max: big ? 1.0 : 0.75, text: String(text), color, big, age: 0 });
    }
    // rubber-stamp slam: text descends huge, lands with a kick + trauma, holds, fades.
    stamp(x, y, text = 'DISMISSED', color = '#c0392b') {
      this.stamps.push({ x, y, text, color, age: 0, life: 1.6, landed: false });
    }

    /* per-frame */
    step(dt) {
      // trauma → shake (quadratic feels punchier than linear)
      this.trauma = Math.max(0, this.trauma - dt * 1.8);
      const s = this.trauma * this.trauma;
      this.shakeX = (Math.random() * 2 - 1) * this.maxShake * s;
      this.shakeY = (Math.random() * 2 - 1) * this.maxShake * s;
      this.shakeRot = (Math.random() * 2 - 1) * this.maxRot * s;

      for (const p of this.parts) { p.t -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= p.drag; p.vy *= p.drag; if (p.spin) p.rot = (p.rot || 0) + dt * 8; }
      this.parts = this.parts.filter(p => p.t > 0);
      for (const f of this.floats) { f.age += dt; f.t -= dt; f.y += f.vy * dt; f.vy *= 0.92; }
      this.floats = this.floats.filter(f => f.t > 0);
      for (const r of this.rings) r.life -= dt;
      this.rings = this.rings.filter(r => r.life > 0);
      for (const f of this.flashes) f.t -= dt;
      this.flashes = this.flashes.filter(f => f.t > 0);
      for (const s of this.stamps) { s.age += dt; if (!s.landed && s.age >= 0.22) { s.landed = true; this.addTrauma(0.7); } }
      this.stamps = this.stamps.filter(s => s.age < s.life);
    }

    /* draw the world-space layer (call inside the camera transform) */
    drawWorld(ctx, cam = { x: 0, y: 0 }) {
      // impact flashes (under particles)
      for (const f of this.flashes) {
        const k = f.t / f.max;
        const g = ctx.createRadialGradient(f.x - cam.x, f.y - cam.y, 0, f.x - cam.x, f.y - cam.y, f.r * (1.6 - k));
        g.addColorStop(0, f.color); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = k; ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(f.x - cam.x, f.y - cam.y, f.r * (1.6 - k), 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // shockwave rings
      for (const r of this.rings) {
        const k = 1 - r.life / r.max;
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.strokeStyle = r.color; ctx.lineWidth = r.w * (1 - k * 0.6);
        ctx.beginPath(); ctx.arc(r.x - cam.x, r.y - cam.y, r.maxR * Easing.outCubic(k), 0, 7); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // particles
      for (const p of this.parts) {
        if (p.spr === '_dust') {
          ctx.globalAlpha = clamp(p.t * 3, 0, 0.5);
          ctx.fillStyle = '#b9a8c4';
          ctx.beginPath(); ctx.arc(p.x - cam.x, p.y - cam.y, 3 + (1 - p.t) * 3, 0, 7); ctx.fill();
        } else if (this.blit && this.SPR[p.spr]) {
          this.blit(ctx, this.SPR[p.spr], p.x - cam.x, p.y - cam.y, 12, false, clamp(p.t * 2.5, 0, 1));
        }
      }
      ctx.globalAlpha = 1;
      // floating pop numbers
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const f of this.floats) {
        const inT = clamp(f.age / 0.16, 0, 1);
        const sc = (f.age < 0.16 ? Easing.outBack(inT) : 1) * (f.big ? 1.55 : 1.05);
        const fade = clamp(f.t * 3, 0, 1);
        ctx.globalAlpha = fade;
        ctx.font = `bold ${Math.round(13 * sc)}px "Courier New", monospace`;
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.strokeText(f.text, f.x - cam.x, f.y - cam.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x - cam.x, f.y - cam.y);
      }
      ctx.globalAlpha = 1;
      // rubber stamps (top of everything)
      for (const s of this.stamps) {
        const inK = clamp(s.age / 0.22, 0, 1);
        const scale = s.age < 0.22 ? lerp(2.9, 1, Easing.inCubic(inK)) : 1;
        const alpha = s.age < 0.22 ? inK * 0.95 : (s.age > s.life - 0.55 ? clamp((s.life - s.age) / 0.55, 0, 1) : 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(s.x - cam.x, s.y - cam.y);
        ctx.rotate(-0.14);
        ctx.font = `bold ${Math.round(26 * scale)}px "Courier New", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const w = ctx.measureText(s.text).width;
        ctx.lineWidth = Math.max(2, 3 * scale); ctx.strokeStyle = s.color;
        ctx.strokeRect(-w / 2 - 10 * scale, -16 * scale, w + 20 * scale, 32 * scale);
        ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(s.text, 0, 0);
        ctx.fillStyle = s.color; ctx.fillText(s.text, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }

  /* ============================== TYPEWRITER ============================= */
  // Reveals text at `cps` chars/sec, holding on sentence/clause punctuation so the
  // narration reads as *spoken*. Fires onShout() when an ALL-CAPS word (>=4) lands.
  // Feed it one line, or several joined by "\n" — read `.shown` and split on "\n".
  class Typewriter {
    constructor(text, opts = {}) { this.cps = opts.cps || 52; this.onShout = opts.onShout; this.set(text || ''); }
    set(text) { this.text = text; this.n = 0; this._budget = 0; this.hold = 0; this.done = false; }
    finish() { this.n = this.text.length; this.done = true; }
    get shown() { return this.text.slice(0, this.n); }
    get count() { return this.n; }
    step(dt) {
      if (this.done) return;
      if (this.hold > 0) { this.hold -= dt; return; }
      this._budget += this.cps * dt;
      const T = this.text;
      while (this._budget >= 1 && this.n < T.length && this.hold <= 0) {
        const ch = T[this.n]; this.n++; this._budget--;
        if ('.!?'.includes(ch)) this.hold = 0.26;
        else if (',;:\u2014'.includes(ch)) this.hold = 0.13;
        else if (this.onShout) {
          const nx = T[this.n] || ' ';
          if (!/[A-Z]/.test(nx)) { let j = this.n - 1, run = 0; while (j >= 0 && /[A-Z]/.test(T[j])) { run++; j--; } if (run >= 4) this.onShout(); }
        }
      }
      if (this.n >= T.length) this.done = true;
    }
  }

  /* ============================== TRANSITION ============================= */
  // A film-splice clock. start() on scene entry; step(dt) each frame; wrap the
  // scene's art/text in a save() using contentAlpha + slideY (+ kenBurns), then
  // paint a white `flash` rect over everything for the first frames.
  class Transition {
    constructor(dur = 0.5) { this.dur = dur; this.t = dur; }   // begins settled
    start() { this.t = 0; }
    step(dt) { if (this.t < this.dur) this.t += dt; }
    get active() { return this.t < this.dur; }
    get contentAlpha() { return clamp((this.t - 0.08) / 0.24, 0, 1); }
    get slideY() { return (1 - Easing.outCubic(Math.min(1, this.t / this.dur))) * 24; }
    get flash() { return this.t < 0.18 ? 1 - this.t / 0.18 : 0; }
    kenBurns(sceneT, amt = 0.03, ramp = 9) { return 1 + Easing.outCubic(Math.min(1, sceneT / ramp)) * amt; }
  }

  global.LEAnim = { Rig, FX, Typewriter, Transition, Easing, clamp, lerp, damp, springStep, whiteMask, version: '1.1' };

})(window);
