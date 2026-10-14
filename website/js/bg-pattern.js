/* Hugo Harrison — isometric construction grid, limited to chosen sections ([data-pattern]).
   Each zone fades out with a radial mask (CSS) and gold blocks rise around the cursor inside it. */
(function () {
  'use strict';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var A = 28;            // cell size: diamonds are 2A wide, A tall
  var R = 180;           // hover influence radius
  var MAX_H = 46;        // tallest block (px)
  var GRID = 'rgba(21, 20, 15, 0.09)';

  Array.prototype.forEach.call(document.querySelectorAll('[data-pattern]'), function (zone) {
    var host = zone.parentElement;
    var canvas = document.createElement('canvas');
    zone.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var W = 0, H = 0, sMin = 0, sMax = 0, dMin = 0, dMax = 0, nd = 0, heat = null;
    var px = -9999, py = -9999, active = false, visible = false, raf = 0, lastStep = 0;

    function idx(s, d) { return (s - sMin) * nd + (d - dMin); }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = zone.clientWidth; H = zone.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sMin = -2; sMax = Math.ceil((2 * (H + MAX_H)) / A) + 2;
      dMin = -2; dMax = Math.ceil(W / A) + 2; nd = dMax - dMin + 1;
      heat = new Float32Array((sMax - sMin + 1) * nd);
      draw();
    }

    function grid() {
      ctx.beginPath(); ctx.lineWidth = 1; ctx.strokeStyle = GRID;
      for (var c = -Math.ceil(W / 2 / A) * A; c <= H + A; c += A) { ctx.moveTo(0, c); ctx.lineTo(W, c + W / 2); }
      for (c = 0; c <= H + W / 2 + A; c += A) { ctx.moveTo(0, c); ctx.lineTo(W, c - W / 2); }
      ctx.stroke();
    }

    function poly(pts, fill) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    }

    function block(x, y, h) {
      var hh = h * h * MAX_H;
      var top = [x, y - A / 2], right = [x + A, y], bottom = [x, y + A / 2], left = [x - A, y];
      var T = [top[0], top[1] - hh], Rr = [right[0], right[1] - hh], B = [bottom[0], bottom[1] - hh], L = [left[0], left[1] - hh];
      poly([left, bottom, B, L], 'rgba(150, 110, 34, ' + (0.16 * h).toFixed(3) + ')');
      poly([bottom, right, Rr, B], 'rgba(176, 129, 40, ' + (0.22 * h).toFixed(3) + ')');
      poly([T, Rr, B, L], 'rgba(214, 170, 82, ' + (0.28 * h).toFixed(3) + ')');
      ctx.beginPath(); ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(200, 149, 47, ' + (0.75 * h).toFixed(3) + ')';
      ctx.moveTo(T[0], T[1]); ctx.lineTo(Rr[0], Rr[1]); ctx.lineTo(B[0], B[1]); ctx.lineTo(L[0], L[1]); ctx.closePath();
      ctx.moveTo(L[0], L[1]); ctx.lineTo(left[0], left[1]); ctx.lineTo(bottom[0], bottom[1]); ctx.lineTo(right[0], right[1]); ctx.lineTo(Rr[0], Rr[1]);
      ctx.moveTo(B[0], B[1]); ctx.lineTo(bottom[0], bottom[1]);
      ctx.stroke();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      grid();
      for (var s = sMin; s <= sMax; s++) for (var d = dMin; d <= dMax; d++) {
        if ((s - d) & 1) continue;
        var h = heat[idx(s, d)];
        if (h > 0.02) block(d * A, s * A / 2 + A / 2, h);
      }
    }

    function step() {
      raf = 0; lastStep = performance.now();
      var warm = false;
      for (var s = sMin; s <= sMax; s++) for (var d = dMin; d <= dMax; d++) {
        if ((s - d) & 1) continue;
        var k = idx(s, d), t = 0;
        if (active) {
          var dx = d * A - px, dy = (s * A / 2 + A / 2 - py) * 1.6, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < R) t = Math.pow(1 - dist / R, 1.4);
        }
        var v = Math.max(heat[k] * 0.94, t);
        heat[k] = v < 0.01 ? 0 : v;
        if (heat[k]) warm = true;
      }
      draw();
      if ((warm || active) && visible) raf = requestAnimationFrame(step);
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(step);
      setTimeout(function () { if (raf && performance.now() - lastStep > 100) { cancelAnimationFrame(raf); step(); } }, 120);
    }

    resize();
    if (window.ResizeObserver) new ResizeObserver(resize).observe(zone); else window.addEventListener('resize', resize);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(zone); else visible = true;
    if (reduce) return;                                   // static grid only

    host.addEventListener('pointermove', function (e) {
      var r = zone.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      active = e.pointerType === 'mouse' || e.pressure > 0; visible = true; kick();
    }, { passive: true });
    host.addEventListener('pointerleave', function () { active = false; kick(); });
    host.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { active = false; kick(); } });

    // Ambient: occasionally one block rises near the middle of the zone, only while it's on screen
    setInterval(function () {
      if (!visible || document.visibilityState !== 'visible' || !heat) return;
      var sMid = (sMin + sMax) / 2, dMid = (dMin + dMax) / 2;
      var s = Math.round(sMid + (Math.random() - 0.5) * (sMax - sMin) * 0.5);
      var d = Math.round(dMid + (Math.random() - 0.5) * nd * 0.5);
      if ((s - d) & 1) d += 1;
      var k = idx(s, d); heat[k] = Math.max(heat[k], 0.55); kick();
    }, 1600);
  });
})();
