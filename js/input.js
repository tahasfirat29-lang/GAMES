/* ==========================================================================
   Input — keyboard, mouse and touch handling
   ========================================================================== */
(function (global) {
  'use strict';

  const JUMP_KEYS = { 'Space': 1, 'ArrowUp': 1, 'KeyW': 1 };
  const PAUSE_KEYS = { 'KeyP': 1, 'Escape': 1 };

  function InputManager(canvas, handlers) {
    this.canvas = canvas;
    this.handlers = handlers || {};

    const self = this;

    global.addEventListener('keydown', function (e) {
      if (JUMP_KEYS[e.code]) {
        e.preventDefault();
        if (self.handlers.onAny) self.handlers.onAny();
        if (!e.repeat && self.handlers.onJump) self.handlers.onJump();
      } else if (PAUSE_KEYS[e.code]) {
        e.preventDefault();
        if (self.handlers.onAny) self.handlers.onAny();
        if (!e.repeat && self.handlers.onPause) self.handlers.onPause();
      }
    }, { passive: false });

    if (global.PointerEvent) {
      canvas.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (self.handlers.onAny) self.handlers.onAny();
        if (self.handlers.onJump) self.handlers.onJump();
      });
    } else {
      canvas.addEventListener('touchstart', function (e) {
        e.preventDefault();
        if (self.handlers.onAny) self.handlers.onAny();
        if (self.handlers.onJump) self.handlers.onJump();
      }, { passive: false });
      canvas.addEventListener('mousedown', function (e) {
        e.preventDefault();
        if (self.handlers.onAny) self.handlers.onAny();
        if (self.handlers.onJump) self.handlers.onJump();
      });
    }

    global.addEventListener('contextmenu', function (e) {
      if (e.target === canvas) e.preventDefault();
    });

    global.addEventListener('blur', function () {
      if (self.handlers.onBlur) self.handlers.onBlur();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && self.handlers.onBlur) self.handlers.onBlur();
    });
  }

  global.InputManager = InputManager;
})(window);
