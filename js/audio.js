/* ==========================================================================
   Audio — Web Audio API sound effects + lightweight generated music
   ========================================================================== */
(function (global) {
  'use strict';

  function AudioManager() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.noiseBuffer = null;

    this.volume = 60;
    this.musicEnabled = true;
    this.musicPlaying = false;
    this.timer = null;
    this.step = 0;
    this.nextNoteTime = 0;

    this.stepDuration = 60 / 150 / 2; // eighth notes at 150 BPM
    this.melody = [523, 0, 659, 784, 659, 0, 523, 0, 587, 0, 698, 880, 784, 0, 659, 0];
    this.bass = [131, 0, 131, 0, 175, 0, 175, 0, 196, 0, 196, 0, 147, 0, 147, 0];
  }

  AudioManager.prototype.unlock = function () {
    if (!this.ctx) {
      const AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.volume / 100;
        this.master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.55;
        this.sfxGain.connect(this.master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.18;
        this.musicGain.connect(this.master);

        const length = Math.floor(this.ctx.sampleRate * 0.4);
        this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
      } catch (e) {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  };

  AudioManager.prototype.setVolume = function (v) {
    this.volume = CONFIG.clamp(v, 0, 100);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume / 100, this.ctx.currentTime, 0.02);
    }
  };

  AudioManager.prototype.setMusicEnabled = function (enabled) {
    this.musicEnabled = !!enabled;
    if (!this.musicEnabled) this.stopMusic();
  };

  AudioManager.prototype.tone = function (freq, duration, type, gainValue, slideTo, when, destination) {
    if (!this.ctx) return;
    const t = when || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(destination || this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  };

  AudioManager.prototype.noise = function (duration, gainValue) {
    if (!this.ctx || !this.noiseBuffer) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + duration);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    src.start(t);
    src.stop(t + duration);
  };

  AudioManager.prototype.playJump = function () {
    if (!this.ctx) return;
    this.tone(380, 0.16, 'square', 0.35, 760);
    this.tone(190, 0.12, 'triangle', 0.2, 380);
  };

  AudioManager.prototype.playHit = function () {
    if (!this.ctx) return;
    this.noise(0.35, 0.5);
    this.tone(220, 0.32, 'sawtooth', 0.35, 60);
    this.tone(110, 0.42, 'square', 0.25, 45);
  };

  AudioManager.prototype.playScore = function () {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(880, 0.1, 'sine', 0.22, null, t);
    this.tone(1320, 0.14, 'sine', 0.18, null, t + 0.08);
  };

  AudioManager.prototype.playClick = function () {
    if (!this.ctx) return;
    this.tone(600, 0.07, 'square', 0.12, 900);
  };

  AudioManager.prototype.scheduleStep = function (step, time) {
    const mel = this.melody[step];
    if (mel) this.tone(mel, this.stepDuration * 0.85, 'triangle', 0.5, null, time, this.musicGain);
    const bass = this.bass[step];
    if (bass) this.tone(bass, this.stepDuration * 0.9, 'sine', 0.55, null, time, this.musicGain);
    if (step % 4 === 0) this.tone(60, 0.05, 'square', 0.22, null, time, this.musicGain);
  };

  AudioManager.prototype.tick = function () {
    if (!this.ctx || !this.musicPlaying) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += this.stepDuration;
      this.step = (this.step + 1) % this.melody.length;
    }
  };

  AudioManager.prototype.startMusic = function () {
    if (!this.ctx || !this.musicEnabled || this.musicPlaying) return;
    this.musicPlaying = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.06;
    const self = this;
    this.tick();
    this.timer = global.setInterval(function () { self.tick(); }, 25);
  };

  AudioManager.prototype.stopMusic = function () {
    this.musicPlaying = false;
    if (this.timer) {
      global.clearInterval(this.timer);
      this.timer = null;
    }
  };

  global.AudioManager = AudioManager;
})(window);
