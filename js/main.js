/* ==========================================================================
   Main — UI controller: screens, buttons, settings and game events
   ========================================================================== */
(function (global) {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const $ = function (id) { return document.getElementById(id); };

    const audio = new global.AudioManager();
    const game = new global.Game($('gameCanvas'), audio);

    const screens = {
      menu: $('menuScreen'),
      pause: $('pauseScreen'),
      gameover: $('gameOverScreen'),
      settings: $('settingsScreen'),
      how: $('howScreen')
    };
    const hud = $('hud');

    function showScreen(name) {
      Object.keys(screens).forEach(function (key) {
        screens[key].classList.toggle('active', key === name);
      });
    }

    function updateHud(data) {
      $('scoreValue').textContent = data.score;
      $('hudBestValue').textContent = Math.max(game.highScore, data.score);
      $('levelBadge').textContent = 'LV ' + data.level;
    }

    function refreshBest() {
      $('menuBestValue').textContent = game.highScore;
      $('hudBestValue').textContent = game.highScore;
    }
    refreshBest();

    /* ---------------- game events ---------------- */
    game.on('start', function (data) {
      showScreen(null);
      hud.classList.remove('hidden');
      updateHud(data);
    });
    game.on('score', function (data) { updateHud(data); });
    game.on('menu', function () {
      showScreen('menu');
      hud.classList.add('hidden');
      refreshBest();
    });
    game.on('pause', function () { showScreen('pause'); });
    game.on('resume', function () { showScreen(null); });
    game.on('gameover', function (data) {
      $('finalScore').textContent = data.score;
      $('finalBest').textContent = data.best;
      $('newBestTag').classList.toggle('hidden', !data.newBest);
      showScreen('gameover');
    });

    /* ---------------- settings UI ---------------- */
    const musicToggle = $('musicToggle');
    const themeToggle = $('themeToggle');
    const volumeSlider = $('volumeSlider');

    function syncSettingsUI() {
      const s = game.getSettings();
      musicToggle.setAttribute('aria-checked', String(s.music));
      themeToggle.setAttribute('aria-checked', String(s.night));
      themeToggle.querySelector('.toggle-icon').textContent = s.night ? '🌙' : '☀️';
      volumeSlider.value = s.volume;
      $('volumeValue').textContent = s.volume + '%';
    }

    $('settingsBtn').addEventListener('click', function () {
      audio.playClick();
      syncSettingsUI();
      showScreen('settings');
    });
    $('howBtn').addEventListener('click', function () {
      audio.playClick();
      showScreen('how');
    });
    $('settingsBackBtn').addEventListener('click', function () {
      audio.playClick();
      showScreen('menu');
    });
    $('howBackBtn').addEventListener('click', function () {
      audio.playClick();
      showScreen('menu');
    });

    musicToggle.addEventListener('click', function () {
      audio.unlock();
      const next = musicToggle.getAttribute('aria-checked') !== 'true';
      musicToggle.setAttribute('aria-checked', String(next));
      game.setSettings({ music: next });
      if (next) audio.playClick();
    });

    themeToggle.addEventListener('click', function () {
      audio.playClick();
      const next = themeToggle.getAttribute('aria-checked') !== 'true';
      themeToggle.setAttribute('aria-checked', String(next));
      themeToggle.querySelector('.toggle-icon').textContent = next ? '🌙' : '☀️';
      game.setSettings({ night: next });
    });

    volumeSlider.addEventListener('input', function () {
      const v = Number(volumeSlider.value);
      $('volumeValue').textContent = v + '%';
      game.setSettings({ volume: v });
    });
    volumeSlider.addEventListener('change', function () { audio.playClick(); });

    /* ---------------- gameplay buttons ---------------- */
    $('playBtn').addEventListener('click', function () {
      audio.unlock();
      audio.playClick();
      game.start();
    });
    $('pauseBtn').addEventListener('click', function () {
      audio.playClick();
      game.togglePause();
    });
    $('resumeBtn').addEventListener('click', function () {
      audio.playClick();
      game.resume();
    });
    $('pauseRestartBtn').addEventListener('click', function () {
      audio.playClick();
      game.start();
    });
    $('pauseMenuBtn').addEventListener('click', function () {
      audio.playClick();
      game.toMenu();
    });
    $('restartBtn').addEventListener('click', function () {
      audio.playClick();
      game.start();
    });
    $('overMenuBtn').addEventListener('click', function () {
      audio.playClick();
      game.toMenu();
    });

    /* ---------------- input ---------------- */
    new global.InputManager($('gameCanvas'), {
      onAny: function () { audio.unlock(); },
      onJump: function () { game.jump(); },
      onPause: function () { game.togglePause(); },
      onBlur: function () { game.pause(); }
    });

    document.addEventListener('pointerdown', function () { audio.unlock(); }, { once: true });
    document.addEventListener('keydown', function () { audio.unlock(); }, { once: true });

    syncSettingsUI();
    game.run();
  });
})(window);
