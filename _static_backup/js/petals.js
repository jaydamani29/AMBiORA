/* ── Sakura Petals · Ambient Canvas Animation ──
   Landing page only. Pauses when tab is hidden.
   Disabled entirely under prefers-reduced-motion. */

(function () {
  'use strict';

  /* Bail out if reduced-motion is preferred */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('petals');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* Palette from design tokens */
  const COLORS = ['#E0577A', '#F4B3C4', '#C93E66', '#F6DAD8', '#e8899f'];
  const MAX = 40;
  let petals = [];
  let raf = null;
  let paused = false;

  /* ── Petal object ── */
  function createPetal() {
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      size: 4 + Math.random() * 8,
      speedY: 0.3 + Math.random() * 0.6,
      speedX: -0.2 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.005 + Math.random() * 0.01,
      opacity: 0.4 + Math.random() * 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    };
  }

  function init() {
    petals = [];
    for (let i = 0; i < MAX; i++) {
      const p = createPetal();
      /* Scatter initial positions across the viewport */
      p.y = Math.random() * canvas.height;
      petals.push(p);
    }
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ── Draw a simple petal shape ── */
  function drawPetal(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(p.size * 0.4, -p.size * 0.6, p.size, -p.size * 0.4, p.size * 0.5, p.size * 0.2);
    ctx.bezierCurveTo(p.size * 0.2, p.size * 0.6, -p.size * 0.1, p.size * 0.4, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  /* ── Animation loop ── */
  function update() {
    if (paused) return;

    /* Only draw if the home page is visible */
    const home = document.getElementById('home');
    if (!home || home.hidden) {
      canvas.style.display = 'none';
      raf = requestAnimationFrame(update);
      return;
    }
    canvas.style.display = '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.y += p.speedY;
      p.wobble += p.wobbleSpeed;
      p.x += p.speedX + Math.sin(p.wobble) * 0.3;
      p.rotation += p.rotSpeed;

      /* Reset when off-screen */
      if (p.y > canvas.height + 20 || p.x < -30 || p.x > canvas.width + 30) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
        p.wobble = Math.random() * Math.PI * 2;
      }

      drawPetal(p);
    }

    raf = requestAnimationFrame(update);
  }

  /* ── Visibility handling ── */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      paused = true;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    } else {
      paused = false;
      if (!raf) update();
    }
  });

  /* ── Kick off ── */
  window.addEventListener('resize', resize);
  resize();
  init();
  update();
})();
