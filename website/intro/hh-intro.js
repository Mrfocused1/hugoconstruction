/*!
 * Hugo Harrison — HH logo intro animation
 *
 * Use: in <head>, add
 *   <link rel="stylesheet" href="intro/hh-intro.css">
 *   <script src="intro/hh-intro.js"></script>
 *
 * - Plays once per browser session (add ?intro to the URL to force it, ?nointro to suppress it).
 * - Click, tap, or press Esc / Enter / Space to skip.
 * - Respects prefers-reduced-motion (shows the finished logo briefly instead).
 * - API: HHIntro.play({ force: true }), HHIntro.skip()
 * - Fires "hhintro:leave" on document as the overlay starts to lift, and "hhintro:done" once it has gone.
 * - Debug: ?introAt=2.4 freezes the animation at 2.4s (for checking frames).
 */
(function () {
  'use strict';

  var SVG = `<svg class="hh-intro__svg" viewBox="0 0 2025 969" role="img" aria-label="Hugo Harrison HH logo" xmlns="http://www.w3.org/2000/svg"><defs><filter id="hh-goldfx" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB"><feGaussianBlur in="SourceAlpha" stdDeviation="6" result="bump"/><feDiffuseLighting in="bump" surfaceScale="8" diffuseConstant="1" lighting-color="#fff" result="diff"><feDistantLight azimuth="235" elevation="55"/></feDiffuseLighting><feComposite in="SourceGraphic" in2="diff" operator="arithmetic" k1="1.22" result="base"/><feTurbulence type="fractalNoise" baseFrequency="0.003 0.005" numOctaves="3" seed="11" result="mottN"/><feColorMatrix in="mottN" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="mottG"/><feComposite in="base" in2="mottG" operator="arithmetic" k1="0.24" k2="0.88" result="mottOut"/><feTurbulence type="fractalNoise" baseFrequency="0.0025 0.25" numOctaves="2" seed="4" result="grainN"/><feColorMatrix in="grainN" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="grainG"/><feComposite in="mottOut" in2="grainG" operator="arithmetic" k1="0.1" k2="0.95" result="grainOut"/><feComposite in="grainOut" in2="SourceAlpha" operator="in" result="baseIn"/><feSpecularLighting in="bump" surfaceScale="8" specularConstant="1.3" specularExponent="28" lighting-color="#fff1c6" result="spec"><feDistantLight azimuth="235" elevation="38"/></feSpecularLighting><feComposite in="spec" in2="SourceAlpha" operator="in" result="specIn"/><feComposite in="specIn" in2="baseIn" operator="arithmetic" k2="0.85" k3="1" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter><linearGradient id="hh-shine-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffaf0" stop-opacity="0"/><stop offset=".5" stop-color="#fffaf0" stop-opacity=".85"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/></linearGradient><clipPath id="hh-reveal"><rect id="hh-reveal-rect" x="1120" y="920" width="905" height="0"/></clipPath><clipPath id="hh-hshape"><path transform="matrix(1.017986,0,0,1.017986,1040.802158,-210.784173)" d="M348.4,686.438L348.4,990.8C348.4,1036.4 350.4,1061.2 354.4,1065.2C363.2,1074 389.2,1079.2 432.4,1080.8C441.2,1080.8 445.6,1084 445.6,1090.4C445.6,1096.8 440.8,1100 431.2,1100L419.2,1100C414.4,1097.6 360,1096.4 256,1096.4C236,1096.4 216,1097.2 196,1098.8C185.6,1099.6 169.6,1100 148,1100C137.6,1100 132.4,1096.4 132.4,1089.2C132.4,1082.8 142.8,1079.2 163.6,1078.4C195.6,1077.6 214.4,1073.8 220,1067C225.6,1060.2 228.4,1037.2 228.4,998L228.4,366.8C228.4,327.6 226.4,305.6 222.4,300.8C217.6,292.8 195.6,288 156.4,286.4C141.2,285.6 133.6,282.4 133.6,276.8C133.6,269.6 138.4,266 148,266L310,268.4C322,268.4 345.2,268 379.6,267.2L425.2,266C438,266 444.4,269.6 444.4,276.8C444.4,283.2 426.8,287.2 391.6,288.8C371.6,289.6 359.4,293.2 355,299.6C350.6,306 348.4,322.8 348.4,350L348.4,657.951L690.096,657.951L690.096,366.8C690.096,327.6 688.096,305.6 684.096,300.8C679.296,292.8 657.296,288 618.096,286.4C602.896,285.6 595.296,282.4 595.296,276.8C595.296,269.6 600.096,266 609.696,266L771.696,268.4C783.696,268.4 806.896,268 841.296,267.2L886.896,266C899.696,266 906.096,269.6 906.096,276.8C906.096,283.2 888.496,287.2 853.296,288.8C833.296,289.6 821.096,293.2 816.696,299.6C812.296,306 810.096,322.8 810.096,350L810.096,990.8C810.096,1036.4 812.096,1061.2 816.096,1065.2C824.896,1074 850.896,1079.2 894.096,1080.8C902.896,1080.8 907.296,1084 907.296,1090.4C907.296,1096.8 902.496,1100 892.896,1100L880.896,1100C876.096,1097.6 821.696,1096.4 717.696,1096.4C697.696,1096.4 677.696,1097.2 657.696,1098.8C647.296,1099.6 631.296,1100 609.696,1100C599.296,1100 594.096,1096.4 594.096,1089.2C594.096,1082.8 604.496,1079.2 625.296,1078.4C657.296,1077.6 676.096,1073.8 681.696,1067C687.296,1060.2 690.096,1037.2 690.096,998L690.096,686.438L348.4,686.438Z"/></clipPath></defs><g id="hh-crane" transform="translate(-42,-60)"><g transform="matrix(1.017986,0,0,1.017986,372.802158,-150.784173)"><path id="hh-mast-outline" class="hh-line" d="M445.6,1090.4C445.6,1096.8 440.8,1100 431.2,1100L419.2,1100C414.4,1097.6 360,1096.4 256,1096.4C236,1096.4 216,1097.2 196,1098.8C185.6,1099.6 169.6,1100 148,1100C137.6,1100 132.4,1096.4 132.4,1089.2C132.4,1082.8 142.8,1079.2 163.6,1078.4C195.6,1077.6 214.4,1073.8 220,1067C225.6,1060.2 228.4,1037.2 228.4,998L228.4,366.8C228.4,327.6 226.4,305.6 222.4,300.8C217.6,292.8 195.6,288 156.4,286.4C141.2,285.6 133.6,282.4 133.6,276.8C133.6,269.6 138.4,266 148,266L310,268.4C322,268.4 345.2,268 379.6,267.2L425.2,266C438,266 444.4,269.6 444.4,276.8C444.4,283.2 426.8,287.2 391.6,288.8C371.6,289.6 359.4,293.2 355,299.6C350.6,306 348.4,322.8 348.4,350L348.4,990.8C348.4,1036.4 350.4,1061.2 354.4,1065.2C363.2,1074 389.2,1079.2 432.4,1080.8C441.2,1080.8 445.6,1084 445.6,1090.4Z" stroke-width="7"/></g><g transform="matrix(1.017986,0,0,1.017986,862.802158,-150.784173)"><path id="hh-inline-outline" class="hh-line" d="M445.6,1090.4C445.6,1096.8 440.8,1100 431.2,1100L419.2,1100C414.4,1097.6 360,1096.4 256,1096.4C236,1096.4 216,1097.2 196,1098.8C185.6,1099.6 169.6,1100 148,1100C137.6,1100 132.4,1096.4 132.4,1089.2C132.4,1082.8 142.8,1079.2 163.6,1078.4C195.6,1077.6 214.4,1073.8 220,1067C225.6,1060.2 228.4,1037.2 228.4,998L228.4,366.8C228.4,327.6 226.4,305.6 222.4,300.8C217.6,292.8 195.6,288 156.4,286.4C141.2,285.6 133.6,282.4 133.6,276.8C133.6,269.6 138.4,266 148,266L310,268.4C322,268.4 345.2,268 379.6,267.2L425.2,266C438,266 444.4,269.6 444.4,276.8C444.4,283.2 426.8,287.2 391.6,288.8C371.6,289.6 359.4,293.2 355,299.6C350.6,306 348.4,322.8 348.4,350L348.4,990.8C348.4,1036.4 350.4,1061.2 354.4,1065.2C363.2,1074 389.2,1079.2 432.4,1080.8C441.2,1080.8 445.6,1084 445.6,1090.4Z" stroke-width="7"/></g><path id="hh-a-frame" class="hh-line" d="M667,142L614,384.102M667,142L720,395.02M667,142L667,389.561M656.488,190L667,230L638.967,270L667,310L621.446,350M677.055,190L667,230L693.814,270L667,310L710.573,350" stroke-width="5"/><path id="hh-lattice" class="hh-line" d="M667,461.96L667,872M614,461.96L720,543.968M720,461.96L614,543.968M614,543.968L720,625.976M720,543.968L614,625.976M614,625.976L720,707.984M720,625.976L614,707.984M614,707.984L720,789.992M720,707.984L614,789.992M614,789.992L720,872M720,789.992L614,872" stroke-width="5"/><path id="hh-jib-rails" class="hh-line" d="M205,341.975L1086,432.718M180,419L1086,491.48M1086,409L1086,522L1102,522M205,341.975C160,336 122,356 120,412M165,363C175.486,363 184,371.514 184,382C184,392.486 175.486,401 165,401C154.514,401 146,392.486 146,382C146,371.514 154.514,363 165,363Z" stroke-width="7"/><path id="hh-jib-truss" class="hh-line" d="M215,343.005L253.9,424.912L292.8,351.018L331.7,431.136L370.6,359.032L409.5,437.36L448.4,367.045L487.3,443.584L526.2,375.059L565.1,449.808L604,383.072M724,395.432L759.6,465.368L795.2,402.766L830.8,471.064L866.4,410.099L902,476.76L937.6,417.433L973.2,482.456L1008.8,424.766L1044.4,488.152L1080,432.1" stroke-width="5"/><path id="hh-ties" class="hh-line" d="M207,338L652,210M667,142L1086,409" stroke-width="5"/><path id="hh-strut" class="hh-line" d="M720,548L905,477" stroke-width="5"/><path id="hh-hairlines" class="hh-line" d="M1112,150C1118,180 1124,215 1126,252M1148,150C1162,230 1178,320 1184,425" stroke-width="5"/><path id="hh-sweep" class="hh-line" d="M1088,447C1130,452 1180,470 1212,522M1090,488C1125,500 1170,540 1211,598M1092,548C1135,556 1175,585 1212,632" stroke-width="5"/><g id="hh-hoist"><path id="hh-hoist-cables" class="hh-line" d="M120,412L120,646M180,419L180,646" stroke-width="6"/><g id="hh-load"><path id="hh-hook-block" class="hh-line" d="M116,702L102,664C102,630 202,630 202,664L188,702L116,702ZM110,672L194,672M138,672L138,702M166,672L166,702" stroke-width="6"/><g id="hh-hook"><path class="hh-fill" d="M145,702H159V722H145Z"/><path class="hh-fill" d="M143,722H161L162,742C186,756 196,786 190,810C184,840 160,856 136,852C112,848 100,826 104,804L112,784L118,790C116,808 124,830 142,834C162,838 176,822 174,804C172,784 160,768 143,756Z"/><path class="hh-line" d="M143,748L117,784" stroke-width="4"/></g></g></g></g><g clip-path="url(#hh-reveal)"><g id="hh-solid"><path transform="matrix(1.017986,0,0,1.017986,1040.802158,-210.784173)" d="M348.4,686.438L348.4,990.8C348.4,1036.4 350.4,1061.2 354.4,1065.2C363.2,1074 389.2,1079.2 432.4,1080.8C441.2,1080.8 445.6,1084 445.6,1090.4C445.6,1096.8 440.8,1100 431.2,1100L419.2,1100C414.4,1097.6 360,1096.4 256,1096.4C236,1096.4 216,1097.2 196,1098.8C185.6,1099.6 169.6,1100 148,1100C137.6,1100 132.4,1096.4 132.4,1089.2C132.4,1082.8 142.8,1079.2 163.6,1078.4C195.6,1077.6 214.4,1073.8 220,1067C225.6,1060.2 228.4,1037.2 228.4,998L228.4,366.8C228.4,327.6 226.4,305.6 222.4,300.8C217.6,292.8 195.6,288 156.4,286.4C141.2,285.6 133.6,282.4 133.6,276.8C133.6,269.6 138.4,266 148,266L310,268.4C322,268.4 345.2,268 379.6,267.2L425.2,266C438,266 444.4,269.6 444.4,276.8C444.4,283.2 426.8,287.2 391.6,288.8C371.6,289.6 359.4,293.2 355,299.6C350.6,306 348.4,322.8 348.4,350L348.4,657.951L690.096,657.951L690.096,366.8C690.096,327.6 688.096,305.6 684.096,300.8C679.296,292.8 657.296,288 618.096,286.4C602.896,285.6 595.296,282.4 595.296,276.8C595.296,269.6 600.096,266 609.696,266L771.696,268.4C783.696,268.4 806.896,268 841.296,267.2L886.896,266C899.696,266 906.096,269.6 906.096,276.8C906.096,283.2 888.496,287.2 853.296,288.8C833.296,289.6 821.096,293.2 816.696,299.6C812.296,306 810.096,322.8 810.096,350L810.096,990.8C810.096,1036.4 812.096,1061.2 816.096,1065.2C824.896,1074 850.896,1079.2 894.096,1080.8C902.896,1080.8 907.296,1084 907.296,1090.4C907.296,1096.8 902.496,1100 892.896,1100L880.896,1100C876.096,1097.6 821.696,1096.4 717.696,1096.4C697.696,1096.4 677.696,1097.2 657.696,1098.8C647.296,1099.6 631.296,1100 609.696,1100C599.296,1100 594.096,1096.4 594.096,1089.2C594.096,1082.8 604.496,1079.2 625.296,1078.4C657.296,1077.6 676.096,1073.8 681.696,1067C687.296,1060.2 690.096,1037.2 690.096,998L690.096,686.438L348.4,686.438Z" fill="#c8952f" filter="url(#hh-goldfx)"/></g></g><g clip-path="url(#hh-hshape)"><rect id="hh-shine" x="1000" y="-40" width="230" height="1060" fill="url(#hh-shine-grad)" opacity="0"/></g></svg>`;
  var KEY = 'hhIntroSeen';
  var root = document.documentElement;
  var query = location.search;
  var forced = /[?&]intro(At)?\b/.test(query);
  var disabled = /[?&]nointro\b/.test(query);
  var freezeAt = (query.match(/[?&]introAt=([\d.]+)/) || [])[1];
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var ease = {
    linear: function (t) { return t; },
    out: function (t) { return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  };

  function seen() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }

  var current = null;

  function play(opts) {
    opts = opts || {};
    if (current) return current;
    if (!opts.force && !forced && seen()) { root.classList.remove('hh-intro-pending'); return null; }

    var el = document.createElement('div');
    el.className = 'hh-intro';
    el.innerHTML =
      '<div class="hh-intro__stage">' +
        '<div class="hh-intro__logo">' + SVG + '</div>' +
        '<div class="hh-intro__rule"></div>' +
        '<p class="hh-intro__tag">Bespoke Construction Solutions</p>' +
      '</div>' +
      '<button class="hh-intro__skip" type="button">Skip intro</button>';
    document.body.appendChild(el);
    root.classList.add('hh-intro-lock');
    root.classList.remove('hh-intro-pending');

    var svg = el.querySelector('svg');
    var $ = function (id) { return svg.querySelector('#hh-' + id); };
    var tracks = [];
    var add = function (start, dur, fn, update) { tracks.push({ start: start, dur: dur, fn: fn, update: update, done: false }); };

    // Line-draw a stroked path (works for multi-subpath paths: they draw in sequence).
    function draw(id, start, dur, fn) {
      var p = $(id); if (!p) return;
      var len = p.getTotalLength();
      p.style.strokeDasharray = len + ' ' + (len + 4);
      p.style.strokeDashoffset = len;
      p.style.opacity = 0;
      add(start, dur, fn || ease.inOut, function (t) { p.style.opacity = 1; p.style.strokeDashoffset = len * (1 - t); });
    }

    // 1. Outline stems trace in
    draw('mast-outline', 0.15, 1.25);
    draw('inline-outline', 0.35, 1.25);
    // 2. Tower and jib
    draw('lattice', 0.75, 1.0);
    draw('a-frame', 0.9, 0.8);
    draw('jib-rails', 1.05, 0.9);
    draw('jib-truss', 1.25, 0.9);
    draw('ties', 1.55, 0.7, ease.out);
    draw('strut', 1.7, 0.45, ease.out);
    draw('hairlines', 2.0, 0.7, ease.out);
    draw('sweep', 2.1, 0.7, ease.out);

    // 3. Hook lowers on its cables, then swings to rest about the jib tip
    var hoist = $('hoist'), load = $('load'), cables = $('hoist-cables');
    var DROP = 234;
    var setDrop = function (t) {
      var dy = -DROP * (1 - t);
      cables.setAttribute('d', 'M120,412L120,' + (646 + dy) + 'M180,419L180,' + (646 + dy));
      load.setAttribute('transform', 'translate(0,' + dy + ')');
      load.style.opacity = Math.min(1, t * 3);
      cables.style.opacity = t > 0 ? 1 : 0;
    };
    setDrop(0);
    add(1.85, 0.75, ease.out, setDrop);
    add(2.45, 1.7, ease.linear, function (t) {
      var a = t >= 1 ? 0 : 4.5 * Math.exp(-3 * t) * Math.sin(t * Math.PI * 4);
      hoist.setAttribute('transform', 'rotate(' + a.toFixed(3) + ' 150 415)');
    });

    // 4. Solid H rises into place, then a glint crosses it
    var rev = $('reveal-rect'), solid = $('solid'), shine = $('shine');
    add(2.3, 0.95, ease.inOut, function (t) {
      var y = 920 - 880 * t;
      rev.setAttribute('y', y); rev.setAttribute('height', 920 - y);
      solid.setAttribute('transform', 'translate(0,' + (24 * (1 - t)).toFixed(2) + ')');
    });
    add(3.15, 0.95, ease.inOut, function (t) {
      shine.setAttribute('opacity', t >= 1 ? 0 : 1);
      shine.setAttribute('transform', 'translate(' + (-520 + 1720 * t).toFixed(1) + ',0) skewX(-18)');
    });

    // 5. Rule + tagline (CSS transitions)
    add(3.2, 0.01, ease.linear, function () { el.classList.add('is-tag'); });
    // 6. Lift away
    add(4.45, 0.01, ease.linear, function () { finish(); });

    var t0 = performance.now(), raf = 0, timer = 0, lastFrame = 0, finished = false;
    function render(time) {
      for (var i = 0; i < tracks.length; i++) {
        var k = tracks[i];
        if (k.done || time < k.start) continue;
        var p = Math.min(1, (time - k.start) / k.dur);
        k.update(k.fn(p));
        if (p >= 1) k.done = true;
      }
    }
    function tick() { lastFrame = performance.now(); render((lastFrame - t0) / 1000); }
    function frame() {
      tick();
      if (!finished) raf = requestAnimationFrame(frame);
    }
    function start() {
      raf = requestAnimationFrame(frame);
      // Fallback for browsers that throttle animation frames on a visible page
      timer = setInterval(function () {
        if (!finished && document.visibilityState === 'visible' && performance.now() - lastFrame > 120) tick();
      }, 33);
    }

    function finish() {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      clearInterval(timer);
      render(1e6);                       // jump everything to its end state
      el.classList.add('is-tag', 'is-leaving');
      markSeen();
      document.dispatchEvent(new CustomEvent('hhintro:leave'));
      var cleaned = false;
      var cleanup = function () {
        if (cleaned) return; cleaned = true;
        el.remove();
        root.classList.remove('hh-intro-lock');
        document.removeEventListener('keydown', onKey);
        current = null;
        document.dispatchEvent(new CustomEvent('hhintro:done'));
      };
      el.addEventListener('transitionend', function (e) { if (e.target === el) cleanup(); });
      setTimeout(cleanup, 1600);         // fallback if transitionend never fires
    }

    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } }
    el.addEventListener('click', finish);
    document.addEventListener('keydown', onKey);

    if (freezeAt !== undefined) {        // debug: hold a single frame
      render(parseFloat(freezeAt));
      if (parseFloat(freezeAt) >= 3.2) el.classList.add('is-tag');
      current = { skip: finish };
      return current;
    }
    if (reduceMotion) {
      render(1e6);
      el.classList.add('is-tag');
      setTimeout(finish, 1400);
    } else {
      start();
    }
    current = { skip: finish };
    return current;
  }

  window.HHIntro = {
    logoSVG: SVG,                        // finished-state logo markup, reused by the site
    play: play,
    skip: function () { if (current) current.skip(); }
  };

  // Auto-play: hide the page until the overlay is mounted, so there's no flash of content.
  if (!disabled && (forced || !seen())) {
    root.classList.add('hh-intro-pending');
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { play(); });
    else play();
  }
})();
