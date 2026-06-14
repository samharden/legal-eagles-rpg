"use strict";
// ============================== STATE ==============================
let state = 'menu'; // menu | play | gameover | victory
let player, enemies, shots, enemyShots, pickups, floaters, particles;
let cam = {x:0,y:0};
let questIdx, questPhase; // phase: 'get'|'active'|'turnin'|'none'
let allies = [], servers = [], dlg = null, flags = {};
let companion = null; // the Printer Companion follower (synced each frame from equip state)
let cart = null, cartSpawnT = 0; // Rosa's mail-cart escort (office only)
let pendingSpawn = null;         // quest spawns deferred until the player reaches the quest's world
let orderT = 6, orderActive = false, orderFired = false; // ORDER IN THE COURT (Q9)
const CART_WP = [[4,24],[5,24],[5,21],[5,17],[9,17],[9,13],[12,13],[17,13],[17,10],[21,10],[21,5]];
const WORLD_GREET = {
  annex:  'THE RECORDS ANNEX — SUBLEVEL B4. It is cold. The files are watching.',
  garage: 'SUBLEVEL P3 — THE PARKING GARAGE. The temperature drops. Somewhere in the dark, a luxury sedan settles.',
  office: 'Back upstairs. The fluorescent hum has never sounded so friendly.',
  floor24:'THE 24TH FLOOR — GRABBIT & RUNN LLP. The thermostat is set to "deposition."',
  courtroom:'THE COURTHOUSE — DEPT. 13, HON. MORTIMER BANE PRESIDING. The gavel is already warm.',
  vault:  'SUBLEVEL C — THE VAULT. Colder than the annex. The air tastes of old ink and older promises. Something here is listening, and has been since 1959.',
};
const WORLD_NAME = {
  office: 'DEWEY, CHEATHAM & HOWE — MAIN FLOOR',
  annex:  'THE RECORDS ANNEX — SUBLEVEL B4',
  garage: 'THE PARKING GARAGE — SUBLEVEL P3',
  floor24:'GRABBIT & RUNN LLP — 24TH FLOOR',
  courtroom:'COURTHOUSE — DEPARTMENT 13',
  vault:  'SUBLEVEL C — THE VAULT',
};
let killCount, collectCount;
let msg = { text:'', t:0, big:false };
let mouse = { x:480, y:300, down:false };
let keys = {};
let levelFlash = 0, shake = 0, gameTime = 0;

const NPCS = [
  { id:'hargrove', nm:'Managing Partner Hargrove', spr:'hargrove', x:22*TILE, y:4*TILE },
  { id:'dolores',  nm:'Dolores (Secretary, est. 1974)', spr:'dolores', x:8*TILE,  y:4*TILE },
  { id:'benny',    nm:'Benny (IT)',                spr:'benny',    x:38*TILE, y:4*TILE },
  { id:'rosa',     nm:'Rosa (Mailroom)',           spr:'rosa',     x:4*TILE,  y:26*TILE },
  { id:'chad',     nm:'Chad Worthington IV',       spr:'chad',     x:30*TILE, y:26*TILE },
  { id:'lenny',    nm:'Lenny (Pro Bono, est. 2019)', spr:'lenny',  x:16*TILE, y:27*TILE },
];

