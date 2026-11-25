/* ==========================================================================
   Game — engine, physics, collisions, difficulty and render loop
   ========================================================================== */
(function (global) {
  'use strict';

  const C = CONFIG;
  const E = global.Entities;

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function Game(canvas, audio) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;

    this.settings = global.Storage.getSettings();
    this.highScore = global.Storage.getHighScore();
    this.listeners = {};

    this.scenery = new E.Scenery();
    this.bunny = new E.Bunny();
    this.particles = new E.Particles();
    this.cacti = [];

    this.state = 'menu';
    this.score = 0;
    this.speed = C.BASE_SPEED;
    this.elapsed = 0;
    this.spawnTimer = C.FIRST_SPAWN_DELAY;
    this.time = 0;
    this.shake = 0;
    this.hitFlash = 0;
    this.lastTime = 0;

    this.applyTheme();
    this.audio.setMusicEnabled(this.settings.music);
    this.audio.setVolume(this.settings.volume);
  }

  Game.prototype.on = function (event, cb) {
    (this.listeners[event] || (this.listeners[event] = [])).push(cb);
  };
  Game.prototype.emit = function (event, data) {
    const list = this.listeners[event];
    if (!list) return;
    for (let i = 0; i < list.length; i++) list[i](data);
  };

  Game.prototype.applyTheme = function () {
    document.body.classList.toggle('theme-day', !this.settings.night);
    document.body.classList.toggle('theme-night', !!this.settings.night);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', this.settings.night ? '#141433' : '#f6c86b');
  };

  Game.prototype.palette = function () {
    return this.settings.night ? C.PALETTE.night : C.PALETTE.day;
  };

  Game.prototype.getSettings = function () {
    return {
      music: this.settings.music,
      volume: this.settings.volume,
      night: this.settings.night
    };
  };

  Game.prototype.setSettings = function (patch) {
    if (patch && typeof patch === 'object') {
      if (typeof patch.music === 'boolean') this.settings.music = patch.music;
      if (typeof patch.volume === 'number') this.settings.volume = C.clamp(patch.volume, 0, 100);
      if (typeof patch.night === 'boolean') this.settings.night = patch.night;
    }
    global.Storage.saveSettings(this.settings);
    this.applyTheme();
    this.audio.setMusicEnabled(this.settings.music);
    this.audio.setVolume(this.settings.volume);
    if (this.settings.music && this.state === 'playing') this.audio.startMusic();
    this.emit('settings', this.getSettings());
  };

  Game.prototype.level = function () {
    return Math.min(10, 1 + Math.floor(this.score / 5));
  };

  Game.prototype.start = function () {
    this.score = 0;
    this.speed = C.BASE_SPEED;
    this.elapsed = 0;
    this.spawnTimer = C.FIRST_SPAWN_DELAY;
    this.cacti.length = 0;
    this.particles.reset();
    this.bunny.reset();
    this.shake = 0;
    this.hitFlash = 0;
    this.state = 'playing';
    this.audio.startMusic();
    this.emit('start', { score: 0, level: 1 });
    this.emit('score', { score: 0, level: 1 });
  };

  Game.prototype.pause = function () {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.stopMusic();
    this.emit('pause');
  };

  Game.prototype.resume = function () {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.audio.startMusic();
    this.emit('resume');
  };

  Game.prototype.togglePause = function () {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  };

  Game.prototype.toMenu = function () {
    this.state = 'menu';
    this.audio.stopMusic();
    this.cacti.length = 0;
    this.particles.reset();
    this.bunny.reset();
    this.spawnTimer = 400;
    this.emit('menu', { best: this.highScore });
  };

  Game.prototype.jump = function () {
    if (this.state !== 'playing') return;
    if (this.bunny.jump()) {
      this.audio.playJump();
      this.particles.burst(this.bunny.x - 8, C.GROUND_Y - 2, 5, this.palette().dust, 55);
    }
  };

  Game.prototype.gameOver = function () {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.bunny.dead = true;
    this.audio.stopMusic();
    this.audio.playHit();
    this.shake = 0.45;
    this.hitFlash = 0.7;
    this.particles.burst(this.bunny.x + 10, this.bunny.y - 40, 16, this.palette().furPink, 180);
    this.particles.burst(this.bunny.x + 10, C.GROUND_Y - 4, 10, this.palette().dust, 130);

    const newBest = this.score > this.highScore;
    if (newBest) {
      this.highScore = this.score;
      global.Storage.setHighScore(this.highScore);
    }
    this.emit('gameover', { score: this.score, best: this.highScore, newBest: newBest });
  };

  Game.prototype.updateSpeed = function () {
    this.speed = Math.min(
      C.MAX_SPEED,
      C.BASE_SPEED + this.score * C.SPEED_PER_SCORE + this.elapsed * 1.6
    );
  };

  Game.prototype.computeGap = function () {
    const diff = C.clamp(this.score / 32, 0, 1);
    const reaction = C.lerp(1.3, 0.92, diff) + C.rand(-0.06, 0.16);
    return Math.max(210, this.speed * reaction + C.rand(20, 90));
  };

  Game.prototype.spawnCactus = function (ambient) {
    const lv = ambient ? 1 : this.level();
    const maxH = lv <= 1 ? 84 : lv === 2 ? 100 : C.CACTUS_MAX_H;
    const h = C.rand(C.CACTUS_MIN_H, maxH);
    const w = C.clamp(h * 0.34 + C.rand(-4, 6), C.CACTUS_MIN_W, C.CACTUS_MAX_W);
    let type = 0;
    if (lv >= 2 && Math.random() < 0.4) type = 1;
    if (lv >= 3) type = C.randInt(0, 3);
    if (ambient) type = Math.random() < 0.5 ? 0 : 2;

    const cactus = new E.Cactus(w, h, type);
    this.cacti.push(cactus);

    // Close "cluster" obstacles at higher levels — clearable with one jump.
    if (!ambient && lv >= 4 && Math.random() < 0.24) {
      const h2 = C.rand(C.CACTUS_MIN_H, Math.min(h + 6, C.CACTUS_MAX_H));
      const w2 = C.clamp(h2 * 0.34, C.CACTUS_MIN_W, C.CACTUS_MAX_W);
      const second = new E.Cactus(w2, h2, Math.random() < 0.5 ? 0 : 2);
      second.x = cactus.x + cactus.w * 0.75 + 14;
      this.cacti.push(second);
    }
  };

  Game.prototype.updateCacti = function (dt, speed, check) {
    const bhb = check ? this.bunny.getHitbox() : null;
    for (let i = this.cacti.length - 1; i >= 0; i--) {
      const cactus = this.cacti[i];
      cactus.update(dt, speed);

      if (check) {
        if (!cactus.scored && cactus.x + cactus.w / 2 < this.bunny.x - 6) {
          cactus.scored = true;
          this.score++;
          this.audio.playScore();
          this.emit('score', { score: this.score, level: this.level() });
        }
        if (overlaps(cactus.getHitbox(), bhb)) {
          this.gameOver();
          return;
        }
      }

      if (cactus.x < -100) this.cacti.splice(i, 1);
    }
  };

  Game.prototype.update = function (dt) {
    this.time += dt;
    const active = this.state === 'playing';
    const ambientSpeed = this.state === 'menu' ? 135 : (this.state === 'gameover' ? 28 : 0);

    this.scenery.update(dt, active ? this.speed : ambientSpeed);
    this.particles.update(dt);

    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 1.5);
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 2.2);

    if (active) {
      this.elapsed += dt;
      this.updateSpeed();
      this.bunny.update(dt, this.speed);
      if (this.bunny.landed) {
        this.particles.burst(this.bunny.x, C.GROUND_Y - 2, 4, this.palette().dust, 45);
      }
      this.spawnTimer -= this.speed * dt;
      if (this.spawnTimer <= 0) {
        this.spawnCactus(false);
        this.spawnTimer = this.computeGap();
      }
      this.updateCacti(dt, this.speed, true);
    } else if (this.state === 'menu') {
      this.bunny.runPhase += dt * 7;
      this.spawnTimer -= ambientSpeed * dt;
      if (this.spawnTimer <= 0) {
        this.spawnCactus(true);
        this.spawnTimer = C.rand(420, 700);
      }
      this.updateCacti(dt, ambientSpeed, false);
    } else if (this.state === 'gameover') {
      this.updateCacti(dt, ambientSpeed, false);
    }
  };

  Game.prototype.render = function () {
    const ctx = this.ctx;
    const p = this.palette();
    const night = !!this.settings.night;

    ctx.save();
    if (this.shake > 0) {
      const m = this.shake * 14;
      ctx.translate(C.rand(-m, m), C.rand(-m, m));
    }

    this.scenery.draw(ctx, p, night);

    this.bunny.drawShadow(ctx);
    for (let i = 0; i < this.cacti.length; i++) this.cacti[i].draw(ctx, p);
    this.particles.draw(ctx);
    this.bunny.draw(ctx, p, this.time);

    ctx.restore();

    if (this.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = this.hitFlash * 0.4;
      ctx.fillStyle = '#ff3b30';
      ctx.fillRect(0, 0, C.WIDTH, C.HEIGHT);
      ctx.restore();
    }
  };

  Game.prototype.loop = function (timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    this.update(dt);
    this.render();
    const self = this;
    global.requestAnimationFrame(function (t) { self.loop(t); });
  };

  Game.prototype.run = function () {
    const self = this;
    global.requestAnimationFrame(function (t) { self.loop(t); });
  };

  global.Game = Game;
})(window);
