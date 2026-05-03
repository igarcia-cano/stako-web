/* ============================================================
   STAKO — Constelación viva (fondo animado de la landing)
   Canvas con puntos dorados conectados por líneas verdes.
   El cursor atrae los puntos cercanos (efecto magnético).
   Pausa en tabs ocultos. Respeta prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isMobile() {
    // Misma logica que el CSS: 880px coincide con el breakpoint donde
    // ocultamos la constelacion en .stk-constellation (mobile y tablet).
    return !!(window.matchMedia && window.matchMedia('(max-width: 880px)').matches);
  }

  function init() {
    var canvas = document.getElementById('stk-constellation');
    if (!canvas) return;

    // En movil/tablet, ni siquiera intentamos animar: el CSS oculta
    // el canvas y la animacion solo gastaria CPU y bateria sin
    // beneficio (no hay cursor con el que interactuar).
    if (isMobile()) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (reducedMotion()) {
      // Una sola pasada estatica: puntos sin animacion ni interaccion
      drawStatic(canvas, ctx);
      return;
    }

    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var pts = [];
    var raf = null;
    var paused = false;
    var mouse = { x: -9999, y: -9999, active: false };
    var resizeTimer = null;

    function resize() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed(w, h);
    }

    function seed(w, h) {
      pts = [];
      // Densidad ajustada por área (mín 40, máx 85)
      var n = Math.min(85, Math.max(40, Math.floor((w * h) / 18000)));
      for (var i = 0; i < n; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: Math.random() * 1.4 + 0.6,
          bx: 0,
          by: 0
        });
      }
    }

    function tick() {
      if (paused) {
        raf = requestAnimationFrame(tick);
        return;
      }
      var w = canvas.width / dpr;
      var h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      var i, j, p, dx, dy, d;
      var mActive = mouse.active;
      var mx = mouse.x, my = mouse.y;

      // Actualizar y pintar puntos
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        if (mActive) {
          dx = mx - p.x;
          dy = my - p.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180 && d > 0.001) {
            var force = ((180 - d) / 180) * 0.55;
            p.bx += (dx / d) * force;
            p.by += (dy / d) * force;
          }
        }
        p.bx *= 0.92;
        p.by *= 0.92;
        p.x += p.vx + p.bx * 0.05;
        p.y += p.vy + p.by * 0.05;

        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        else if (p.x > w) { p.x = w; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        else if (p.y > h) { p.y = h; p.vy *= -1; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(217,194,133,0.55)';
        ctx.fill();
      }

      // Pintar líneas entre pares cercanos
      for (i = 0; i < pts.length; i++) {
        var a = pts[i];
        for (j = i + 1; j < pts.length; j++) {
          var b = pts[j];
          dx = a.x - b.x;
          dy = a.y - b.y;
          d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            var alpha = (1 - d / 140) * 0.20;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = 'rgba(105,212,147,' + alpha.toFixed(3) + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(tick);
    }

    // Cursor: capturado en window porque el canvas tiene pointer-events:none
    window.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }, { passive: true });

    window.addEventListener('mouseleave', function () {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      mouse.active = false;
    }, { passive: true });

    // Pausa cuando la pestaña está oculta (ahorra batería)
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
    });

    // Resize con debounce
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    resize();
    raf = requestAnimationFrame(tick);
  }

  function drawStatic(canvas, ctx) {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var w = window.innerWidth, h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.min(60, Math.floor((w * h) / 24000));
    var pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.6 });
    }
    for (var i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, pts[i].r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217,194,133,0.4)';
      ctx.fill();
    }
    for (var i = 0; i < pts.length; i++) {
      for (var j = i + 1; j < pts.length; j++) {
        var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) {
          var a = (1 - d / 140) * 0.15;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = 'rgba(105,212,147,' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
