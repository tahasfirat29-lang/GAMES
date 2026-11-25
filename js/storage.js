/* ==========================================================================
   Storage — safe localStorage wrapper for high score + settings
   ========================================================================== */
(function (global) {
  'use strict';

  const KEY_HIGH = 'bcr.highScore';
  const KEY_SETTINGS = 'bcr.settings';

  const DEFAULTS = {
    music: true,
    volume: 60,
    night: false
  };

  function safeGet(key) {
    try { return global.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, value) {
    try { global.localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  const Storage = {
    getHighScore: function () {
      const raw = safeGet(KEY_HIGH);
      const n = raw === null ? 0 : parseInt(raw, 10);
      return isNaN(n) || n < 0 ? 0 : n;
    },
    setHighScore: function (score) {
      safeSet(KEY_HIGH, String(score));
    },
    getSettings: function () {
      const settings = {};
      let stored = {};
      const raw = safeGet(KEY_SETTINGS);
      if (raw) {
        try { stored = JSON.parse(raw) || {}; } catch (e) { stored = {}; }
      }
      settings.music = typeof stored.music === 'boolean' ? stored.music : DEFAULTS.music;
      settings.volume = typeof stored.volume === 'number' ? CONFIG.clamp(stored.volume, 0, 100) : DEFAULTS.volume;
      settings.night = typeof stored.night === 'boolean' ? stored.night : DEFAULTS.night;
      return settings;
    },
    saveSettings: function (settings) {
      safeSet(KEY_SETTINGS, JSON.stringify(settings));
    }
  };

  global.Storage = Storage;
})(window);
