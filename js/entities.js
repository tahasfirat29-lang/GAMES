/* ==========================================================================
   Entities — all artwork is drawn procedurally on the canvas
   ========================================================================== */
(function (global) {
  'use strict';

  const C = CONFIG;

  function ellipse(ctx, x, y, rx, ry, fill, stroke, lw) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke, lw) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  /* -------------------------------------------------------------- SCENERY */
  function Scenery() {
    this.groundOffset = 0;
    this.hillOffset = 0;
    this.time = 0;
    this.clouds = [];
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: C.rand(0, C.WIDTH),
        y: C.rand(55, 190),
        s: C.rand(0.55, 1.25),
        v: C.rand(8, 20)
      });
    }
    this.stars = [];
    for (let i = 0; i < 55; i++) {
      this.stars.push({
        x: C.rand(0, C.WIDTH),
        y: C.rand(10, 280),
        r: C.rand(0.6, 1.9),
        p: C.rand(0, Math.PI * 2)
      });
    }
  }

  Scenery.prototype.update = function (dt, speed) {
    this.time += dt;
    this.groundOffset = (this.groundOffset + speed * dt) % 120;
    this.hillOffset = (this.hillOffset + speed * dt * 0.08) % (C.WIDTH * 2);
    for (let i = 0; i < this.clouds.length; i++) {
      const cl = this.clouds[i];
      cl.x -= (cl.v + speed * 0.06) * dt;
      if (cl.x < -140 * cl.s) {
        cl.x = C.WIDTH + C.rand(30, 240);
        cl.y = C.rand(55, 190);
        cl.s = C.rand(0.55, 1.25);
      }
    }
  };

  Scenery.prototype.drawSky = function (ctx, p, night) {
    const g = ctx.createLinearGradient(0, 0, 0, C.GROUND_Y);
    g.addColorStop(0, p.skyTop);
    g.addColorStop(1, p.skyBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, C.WIDTH, C.GROUND_Y);

    if (night) {
      for (let i = 0; i < this.stars.length; i++) {
        const st = this.stars[i];
        const a = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 1.7 + st.p));
        ctx.globalAlpha = a;
        ellipse(ctx, st.x, st.y, st.r, st.r, '#ffffff');
      }
      ctx.globalAlpha = 1;
      ellipse(ctx, 805, 96, 40, 40, p.sun);
      ellipse(ctx, 792, 86, 36, 36, p.skyTop);
      ctx.globalAlpha = 0.18;
      ellipse(ctx, 805, 96, 72, 72, p.sunGlow);
      ctx.globalAlpha = 1;
    } else {
      const gr = ctx.createRadialGradient(805, 96, 10, 805, 96, 110);
      gr.addColorStop(0, p.sunGlow);
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(660, 0, 290, 250);
      ellipse(ctx, 805, 96, 40, 40, p.sun);
    }

    for (let i = 0; i < this.clouds.length; i++) {
      const cl = this.clouds[i];
      ctx.save();
      ctx.translate(cl.x, cl.y);
      ctx.scale(cl.s, cl.s);
      ctx.globalAlpha = night ? 0.45 : 0.92;
      ellipse(ctx, 0, 8, 42, 16, p.cloud);
      ellipse(ctx, -20, 2, 24, 18, p.cloud);
      ellipse(ctx, 8, -6, 30, 22, p.cloud);
      ellipse(ctx, 32, 4, 22, 15, p.cloud);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  };

  Scenery.prototype.drawHills = function (ctx, p, night) {
    const base = C.GROUND_Y + 6;
    const drawRange = function (amp, waveLen, offset, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, base);
      for (let x = 0; x <= C.WIDTH; x += 12) {
        const y = base - amp - Math.sin((x + offset) / waveLen) * amp * 0.55
          - Math.sin((x + offset) / (waveLen * 0.43)) * amp * 0.22;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(C.WIDTH, base);
      ctx.closePath();
      ctx.fill();
    };
    drawRange(64, 150, this.hillOffset, p.hillFar);
    drawRange(38, 100, this.hillOffset * 1.7 + 90, p.hillNear);
  };

  Scenery.prototype.drawGround = function (ctx, p) {
    const g = ctx.createLinearGradient(0, C.GROUND_Y, 0, C.HEIGHT);
    g.addColorStop(0, p.groundTop);
    g.addColorStop(1, p.groundBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, C.GROUND_Y, C.WIDTH, C.HEIGHT - C.GROUND_Y);

    ctx.fillStyle = p.groundStripe;
    ctx.fillRect(0, C.GROUND_Y, C.WIDTH, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, C.GROUND_Y + 6, C.WIDTH, 3);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, C.GROUND_Y + 9, C.WIDTH, C.HEIGHT - C.GROUND_Y - 9);
    ctx.clip();
    for (let i = -1; i < 12; i++) {
      const x = i * 120 - this.groundOffset;
      ellipse(ctx, x + 22, C.GROUND_Y + 34, 7, 3, p.pebble);
      ellipse(ctx, x + 78, C.GROUND_Y + 62, 5, 2.5, p.pebble);
      ctx.strokeStyle = p.groundStripe;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 44, C.GROUND_Y + 80);
      ctx.lineTo(x + 60, C.GROUND_Y + 80);
      ctx.stroke();
      ctx.strokeStyle = p.grass;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 96, C.GROUND_Y + 16);
      ctx.lineTo(x + 96, C.GROUND_Y + 8);
      ctx.moveTo(x + 101, C.GROUND_Y + 16);
      ctx.lineTo(x + 104, C.GROUND_Y + 9);
      ctx.stroke();
    }
    ctx.restore();
  };

  Scenery.prototype.draw = function (ctx, p, night) {
    this.drawSky(ctx, p, night);
    this.drawHills(ctx, p, night);
    this.drawGround(ctx, p);
  };

  /* ---------------------------------------------------------------- BUNNY */
  function Bunny() {
    this.x = C.BUNNY_X;
    this.y = C.GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.runPhase = 0;
    this.squash = 0;
    this.landed = false;
    this.dead = false;
  }

  Bunny.prototype.reset = function () {
    this.y = C.GROUND_Y;
    this.vy = 0;
    this.onGround = true;
    this.runPhase = 0;
    this.squash = 0;
    this.landed = false;
    this.dead = false;
  };

  Bunny.prototype.jump = function () {
    if (!this.onGround || this.dead) return false;
    this.vy = C.JUMP_VELOCITY;
    this.onGround = false;
    this.squash = -0.12;
    return true;
  };

  Bunny.prototype.update = function (dt, speed) {
    this.landed = false;
    if (this.onGround) {
      this.runPhase += dt * (6 + speed * 0.035);
    } else {
      this.vy = Math.min(this.vy + C.GRAVITY * dt, C.MAX_FALL);
      this.y += this.vy * dt;
      if (this.y >= C.GROUND_Y) {
        this.y = C.GROUND_Y;
        this.vy = 0;
        this.onGround = true;
        this.landed = true;
        this.squash = 0.2;
      }
    }
    this.squash *= Math.pow(0.001, dt);
  };

  Bunny.prototype.getHitbox = function () {
    const w = C.BUNNY_W * 0.56;
    const h = C.BUNNY_H * 0.66;
    return { x: this.x - w / 2, y: this.y - h - 6, w: w, h: h };
  };

  Bunny.prototype.drawShadow = function (ctx) {
    const height = C.GROUND_Y - this.y;
    const scale = C.clamp(1 - height / 260, 0.35, 1);
    ctx.save();
    ctx.globalAlpha = 0.22 * scale;
    ellipse(ctx, this.x, C.GROUND_Y + 9, 34 * scale, 9 * scale, '#000000');
    ctx.restore();
  };

  Bunny.prototype.draw = function (ctx, p, time) {
    const air = !this.onGround;
    const rising = this.vy < 0;
    const run = Math.sin(this.runPhase);
    const run2 = Math.cos(this.runPhase * 2);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(1 - this.squash * 0.5, 1 + this.squash);

    if (this.dead) ctx.rotate(-0.35);

    const outline = 'rgba(90, 55, 35, 0.85)';

    // tail
    ellipse(ctx, -30, -30 + run2 * 1.5, 11, 11, p.fur, outline, 2);
    ellipse(ctx, -34, -33, 5, 5, p.furShade);

    // back leg
    ctx.save();
    ctx.translate(-13, -12);
    ctx.rotate(air ? (rising ? -0.7 : 0.5) : run * 0.55);
    ellipse(ctx, 0, 0, 13, 7, p.furShade, outline, 2);
    ellipse(ctx, 7, 3, 8, 4, p.fur);
    ctx.restore();

    // front leg
    ctx.save();
    ctx.translate(13, -12);
    ctx.rotate(air ? (rising ? 0.6 : -0.4) : -run * 0.55);
    ellipse(ctx, 0, 0, 14, 7.5, p.fur, outline, 2);
    ellipse(ctx, 7, 3, 9, 4.5, p.fur);
    ctx.restore();

    // body
    ellipse(ctx, 0, -35 + (air ? 0 : run2 * 1.2), 32, 28, p.fur, outline, 2.5);
    ellipse(ctx, 6, -31, 20, 18, p.furShade);

    // head
    ctx.save();
    ctx.translate(18, -68 + (air ? 0 : Math.sin(this.runPhase * 2) * 1.5));
    ellipse(ctx, 0, 0, 24, 22, p.fur, outline, 2.5);

    // ears
    const earTilt = air ? (rising ? -0.55 : 0.15) : Math.sin(this.runPhase) * 0.12 - 0.12;
    const drawEar = function (ex, tilt, scale) {
      ctx.save();
      ctx.translate(ex, -16);
      ctx.rotate(tilt + earTilt);
      ctx.scale(scale, scale);
      ellipse(ctx, 0, -20, 7.5, 23, p.fur, outline, 2);
      ellipse(ctx, 0, -21, 3.6, 16, p.furPink);
      ctx.restore();
    };
    drawEar(-8, -0.16, 1);
    drawEar(7, 0.1, 0.92);

    // eye
    ellipse(ctx, 11, -2, 6.5, 7.5, '#ffffff', outline, 1.5);
    ellipse(ctx, 13, -1, 3.4, 4.2, p.eye);
    ellipse(ctx, 14.2, -2.6, 1.3, 1.5, p.eyeShine);

    // nose + mouth
    ellipse(ctx, 22, 5, 4, 3, p.furPink, outline, 1.2);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(20, 9, 4, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // cheek
    ctx.globalAlpha = 0.5;
    ellipse(ctx, 12, 8, 5, 3, p.furPink);
    ctx.globalAlpha = 1;

    ctx.restore();
    ctx.restore();
  };

  /* --------------------------------------------------------------- CACTUS */
  function Cactus(w, h, type) {
    this.w = w;
    this.h = h;
    this.type = type;
    this.x = C.WIDTH + 60;
    this.sway = C.rand(0, Math.PI * 2);
    this.scored = false;
  }

  Cactus.prototype.update = function (dt, speed) {
    this.x -= speed * dt;
    this.sway += dt * 2.2;
  };

  Cactus.prototype.getHitbox = function () {
    const w = this.w * 0.64;
    const h = this.h * 0.84;
    return { x: this.x - w / 2, y: C.GROUND_Y - h, w: w, h: h };
  };

  Cactus.prototype.draw = function (ctx, p) {
    ctx.save();
    ctx.translate(this.x, C.GROUND_Y);
    ctx.rotate(Math.sin(this.sway) * 0.018);

    const w = this.w;
    const h = this.h;
    const grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, p.cactusDark);
    grad.addColorStop(0.45, p.cactusLight);
    grad.addColorStop(1, p.cactusDark);

    // arms behind trunk
    if (this.type === 1 || this.type === 2) {
      roundRect(ctx, w / 2 - 3, -h * 0.66, w * 0.62, w * 0.46, w * 0.22, p.cactusDark, p.cactusEdge, 2);
      roundRect(ctx, w / 2 + w * 0.42, -h * 0.88, w * 0.46, h * 0.34, w * 0.22, grad, p.cactusEdge, 2);
    }
    if (this.type === 2 || this.type === 3) {
      roundRect(ctx, -w / 2 - w * 0.56, -h * 0.5, w * 0.6, w * 0.44, w * 0.22, p.cactusDark, p.cactusEdge, 2);
      roundRect(ctx, -w / 2 - w * 0.42, -h * 0.74, w * 0.44, h * 0.3, w * 0.22, grad, p.cactusEdge, 2);
    }

    // trunk
    roundRect(ctx, -w / 2, -h, w, h, w * 0.45, grad, p.cactusEdge, 2.5);

    // ridges
    ctx.strokeStyle = p.cactusDark;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-w * 0.16, -h + 10); ctx.lineTo(-w * 0.16, -8);
    ctx.moveTo(w * 0.16, -h + 10); ctx.lineTo(w * 0.16, -8);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // spines
    ctx.strokeStyle = p.cactusSpine;
    ctx.lineWidth = 1.4;
    for (let yy = -h + 14; yy < -8; yy += 15) {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 3, yy); ctx.lineTo(-w / 2 - 4, yy - 3);
      ctx.moveTo(w / 2 - 3, yy + 5); ctx.lineTo(w / 2 + 4, yy + 2);
      ctx.stroke();
    }

    // flower
    if (this.type === 3) {
      ellipse(ctx, 0, -h - 3, 7, 6, p.cactusFlower);
      ellipse(ctx, -5, -h - 7, 4, 4, p.cactusFlower);
      ellipse(ctx, 5, -h - 7, 4, 4, p.cactusFlower);
      ellipse(ctx, 0, -h - 10, 4, 4, p.cactusFlower);
      ellipse(ctx, 0, -h - 5, 2.5, 2.5, '#ffe27a');
    }

    ctx.restore();
  };

  /* -------------------------------------------------------------- PARTICLES */
  function Particles() {
    this.items = [];
  }

  Particles.prototype.reset = function () { this.items.length = 0; };

  Particles.prototype.burst = function (x, y, count, color, spread) {
    for (let i = 0; i < count; i++) {
      this.items.push({
        x: x, y: y,
        vx: C.rand(-spread, spread),
        vy: C.rand(-spread * 0.9, -20),
        life: C.rand(0.3, 0.65),
        maxLife: 0.65,
        r: C.rand(2, 5.5),
        color: color
      });
    }
  };

  Particles.prototype.update = function (dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || p.y > C.HEIGHT) this.items.splice(i, 1);
    }
  };

  Particles.prototype.draw = function (ctx) {
    for (let i = 0; i < this.items.length; i++) {
      const p = this.items[i];
      ctx.globalAlpha = C.clamp(p.life / p.maxLife, 0, 1);
      ellipse(ctx, p.x, p.y, p.r, p.r * 0.7, p.color);
    }
    ctx.globalAlpha = 1;
  };

  global.Entities = {
    Scenery: Scenery,
    Bunny: Bunny,
    Cactus: Cactus,
    Particles: Particles,
    ellipse: ellipse,
    roundRect: roundRect
  };
})(window);
