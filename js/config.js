/* ==========================================================================
   Config — constants, tuning and colour palettes
   ========================================================================== */
(function (global) {
  'use strict';

  const CONFIG = {
    WIDTH: 960,
    HEIGHT: 540,
    GROUND_Y: 432,

    BUNNY_X: 205,
    BUNNY_W: 62,
    BUNNY_H: 76,

    GRAVITY: 2050,
    JUMP_VELOCITY: -920,
    MAX_FALL: 1500,

    BASE_SPEED: 255,
    SPEED_PER_SCORE: 9,
    MAX_SPEED: 610,

    FIRST_SPAWN_DELAY: 380,
    CACTUS_MIN_W: 26,
    CACTUS_MAX_W: 46,
    CACTUS_MIN_H: 62,
    CACTUS_MAX_H: 118,

    PALETTE: {
      day: {
        skyTop: '#57c4ef',
        skyBottom: '#ffe6a8',
        sun: '#fff4b8',
        sunGlow: 'rgba(255, 236, 150, 0.55)',
        cloud: '#ffffff',
        hillFar: '#e7ad74',
        hillNear: '#cf8a55',
        groundTop: '#eaa762',
        groundBottom: '#c67a3d',
        groundStripe: '#d9904d',
        pebble: '#a85e2b',
        grass: '#9bb24a',
        dust: '#f2cd94',
        cactusLight: '#74cf52',
        cactusDark: '#3f9a38',
        cactusEdge: '#256b2a',
        cactusSpine: '#e9f7c8',
        cactusFlower: '#ff6f91',
        fur: '#fffaf2',
        furShade: '#e9d9c6',
        furPink: '#ffb3c4',
        eye: '#2b2430',
        eyeShine: '#ffffff'
      },
      night: {
        skyTop: '#080d26',
        skyBottom: '#2a2a5c',
        sun: '#eef0ff',
        sunGlow: 'rgba(190, 195, 255, 0.4)',
        cloud: '#595b8c',
        hillFar: '#33305f',
        hillNear: '#262449',
        groundTop: '#4a3a60',
        groundBottom: '#332744',
        groundStripe: '#564168',
        pebble: '#2a1f38',
        grass: '#5a6b52',
        dust: '#8a7aa0',
        cactusLight: '#4e9b63',
        cactusDark: '#2d6a4a',
        cactusEdge: '#1b4a37',
        cactusSpine: '#bfe0c4',
        cactusFlower: '#ff8fae',
        fur: '#eef0ff',
        furShade: '#c3c6e6',
        furPink: '#ff9fbd',
        eye: '#161430',
        eyeShine: '#ffffff'
      }
    },

    clamp: function (v, min, max) { return v < min ? min : v > max ? max : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    rand: function (min, max) { return min + Math.random() * (max - min); },
    randInt: function (min, max) { return Math.floor(CONFIG.rand(min, max + 1)); }
  };

  global.CONFIG = CONFIG;
})(window);
