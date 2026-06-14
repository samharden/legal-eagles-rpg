"use strict";
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const W = cv.width, CH = cv.height, H = 600, HUD_Y = 600, TILE = 40;
let MAPW = 44, MAPH = 32;
// On touch devices the world renders at 2x zoom: a 480x300 camera window around the
// player, scaled to fill the canvas. HUD and dialogs stay at full canvas resolution.
let IS_TOUCH = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
let ZOOM = IS_TOUCH ? 2 : 1, VW = W/ZOOM, VH = H/ZOOM;

