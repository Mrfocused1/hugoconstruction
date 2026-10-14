/* Hugo Harrison — site behaviour */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* Logo: reuse the intro's finished-state SVG, with unique ids per copy */
  function logoMarkup(prefix) {
    if (!window.HHIntro || !window.HHIntro.logoSVG) return '';
    return window.HHIntro.logoSVG
      .replace(/(id="hh-reveal-rect"[^>]*?)y="920"([^>]*?)height="0"/, '$1y="0"$2height="969"')
      .replace(/id="hh-/g, 'id="' + prefix + '-')
      .replace(/url\(#hh-/g, 'url(#' + prefix + '-');
  }
  $$('[data-hh-logo]').forEach(function (el, i) {
    var svg = logoMarkup('hhl' + i);
    if (!svg) { el.textContent = 'HH'; return; }
    el.innerHTML = svg;
    el.firstElementChild.setAttribute('aria-hidden', 'true');
  });

  /* Images: show a labelled placeholder if a photo is missing */
  $$('[data-media] img').forEach(function (img) {
    var mark = function () { img.parentNode.setAttribute('data-empty', 'Photo · ' + img.alt); img.remove(); };
    if (img.complete && img.naturalWidth === 0) mark(); else img.addEventListener('error', mark);
  });

  /* Navigation: dropdowns + mobile menu */
  var nav = document.querySelector('[data-nav]');
  var menu = document.querySelector('[data-nav-menu]');
  var toggle = document.querySelector('[data-nav-toggle]');
  var drops = $$('[data-drop]', nav);
  function closeDrops(except) {
    drops.forEach(function (b) {
      if (b === except) return;
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).classList.remove('is-open');
    });
  }
  drops.forEach(function (b) {
    var panel = document.getElementById(b.getAttribute('aria-controls'));
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      closeDrops(b);
      b.setAttribute('aria-expanded', String(open));
      panel.classList.toggle('is-open', open);
    });
  });
  var viaKeyboard = false;
  toggle.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') viaKeyboard = true; });
  function setMenu(open) {
    var was = menu.classList.contains('is-open');
    if (open && !was) {   // the overlay grows out of the toggle, wherever it sits
      var r = toggle.getBoundingClientRect();
      menu.style.setProperty('--ox', Math.round(r.left + r.width / 2) + 'px');
      menu.style.setProperty('--oy', Math.round(r.top + r.height / 2) + 'px');
    }
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('nav-open', open);
    toggle.querySelector('.sr').textContent = open ? 'Close menu' : 'Menu';
    if (!open) closeDrops();
    if (open && !was && viaKeyboard) { var first = menu.querySelector('.nav__link'); if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350); }   // keyboard users land in the menu
    viaKeyboard = false;
    if (!open && was && menu.contains(document.activeElement)) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) { closeDrops(); setMenu(false); } });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) { closeDrops(); setMenu(false); } });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var openDrop = drops.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
    closeDrops(); setMenu(false);
    if (openDrop) openDrop.focus();
  });

  /* Finance calculator: 3 payments at 0% APR */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var input = calc.querySelector('[data-calc-input]'), range = calc.querySelector('[data-calc-range]');
    var eachEls = $$('[data-calc-each]', calc), lastEl = calc.querySelector('[data-calc-last]'), totalEl = calc.querySelector('[data-calc-total]');
    var gbp = function (n) { return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
    var digits = function (str) { return Number(String(str).replace(/[^0-9]/g, '')) || 0; };
    var update = function (v, from) {
      v = Math.max(0, Math.round(v));
      var each = Math.floor((v / 3) * 100) / 100, last = Math.round((v - 2 * each) * 100) / 100;
      eachEls.forEach(function (el) { el.textContent = gbp(each); });
      if (lastEl) lastEl.textContent = gbp(last);
      totalEl.textContent = gbp(v);
      if (from !== 'input') input.value = v.toLocaleString('en-GB');
      if (from !== 'range') range.value = Math.min(Number(range.max), Math.max(Number(range.min), v));
      var min = Number(range.min), max = Number(range.max);
      range.style.setProperty('--fill', ((Number(range.value) - min) / (max - min)) * 100 + '%');
    };
    input.addEventListener('input', function () { update(digits(input.value), 'input'); });
    input.addEventListener('blur', function () { input.value = digits(input.value).toLocaleString('en-GB'); });
    range.addEventListener('input', function () { update(Number(range.value), 'range'); });
    update(digits(input.value));
  }

  /* Hero video: lighter file on small screens */
  $$('source[data-mobile-src]').forEach(function (src) {
    if (window.matchMedia('(max-width: 767px)').matches) { src.src = src.getAttribute('data-mobile-src'); src.parentNode.load(); }
  });

  /* Videos: no autoplay for reduced-motion users */
  if (reduce) $$('[data-video]').forEach(function (video) { video.removeAttribute('autoplay'); video.pause(); });

  /* Services: text stays pinned while photos stack (desktop) */
  var stack = document.querySelector('[data-stack]');
  if (stack) {
    var cards = $$('.stack__card', stack), texts = $$('.stack__text', stack), active = 0;
    var wide = window.matchMedia('(min-width: 900px)');
    var paint = function () {
      if (!wide.matches) { cards.forEach(function (c) { c.style.filter = ''; }); return; }
      var stick = 136, idx = 0;
      cards.forEach(function (c, i) { if (c.getBoundingClientRect().top <= stick + 48) idx = i; });
      if (idx !== active) { active = idx; texts.forEach(function (t, i) { t.classList.toggle('is-active', i === idx); }); }
      if (reduce) return;
      cards.forEach(function (c, i) {
        var next = cards[i + 1];
        if (!next) return;
        var dist = next.getBoundingClientRect().top - stick;
        var cover = Math.min(1, Math.max(0, 1 - dist / c.offsetHeight));
        c.style.filter = cover ? 'brightness(' + (1 - 0.35 * cover).toFixed(3) + ')' : '';   // same size and position, so the next photo covers it exactly
      });
    };
    var queued = false, fallback = 0;
    var onScroll = function () {
      if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; paint(); }); }
      clearTimeout(fallback); fallback = setTimeout(paint, 100);      // in case animation frames are throttled
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    paint();
  }

  /* FAQ: category tabs + accordion */
  var faq = document.querySelector('[data-faq]');
  if (faq) {
    var tabs = $$('[role="tab"]', faq), panels = $$('[role="tabpanel"]', faq), cur = 0;
    var show = function (i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[k].hidden = !on;
      });
      if (focus) tabs[cur].focus();
    };
    tabs.forEach(function (t, i) { t.addEventListener('click', function () { show(i); }); });
    faq.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
    });
    show(0);
    $$('.acc__q', faq).forEach(function (q) {
      var a = document.getElementById(q.getAttribute('aria-controls'));
      q.addEventListener('click', function () {
        var open = q.getAttribute('aria-expanded') !== 'true';
        q.setAttribute('aria-expanded', String(open));
        a.classList.toggle('is-open', open);
      });
    });
  }

  /* Text: blur fade in on arrival, blur fade out once scrolled past (and back again) */
  var tx = $$('main h1, main h2, main h3, main p, main li, main dt, main dd, main .label, .end h2, .end p, .end .footer__group a, .end .footer__group .label, .opt__body > span')
    .filter(function (el) { return !el.closest('.stack__text, .nav, .acc__a, .fin, .cform'); });
  tx = tx.filter(function (el) { return !tx.some(function (o) { return o !== el && el.contains(o); }); });   // animate leaves only
  var setState = function (el, state) {
    el.classList.toggle('tx-in', state === 'in');
    el.classList.toggle('tx-above', state === 'above');
    el.classList.toggle('tx-below', state === 'below');
  };
  var NAV_EDGE = 120;   // just under the floating menu
  tx.forEach(function (el) { el.classList.add('tx'); setState(el, reduce ? 'in' : 'below'); });
  if (!reduce) {
    var stateOf = function (el) {   // always judged from the element's live position
      var r = el.getBoundingClientRect();
      return r.bottom < NAV_EDGE ? 'above' : r.top > window.innerHeight * 0.94 ? 'below' : 'in';
    };
    var sweepTx = function () { tx.forEach(function (el) { setState(el, stateOf(el)); }); };
    if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { setState(e.target, stateOf(e.target)); });
      }, { rootMargin: '-' + NAV_EDGE + 'px 0px -6% 0px', threshold: 0 });
      tx.forEach(function (el) { tio.observe(el); });
    }
    var txTimer = 0;   // keeps states right even if the observer is throttled
    window.addEventListener('scroll', function () { clearTimeout(txTimer); txTimer = setTimeout(sweepTx, 120); }, { passive: true });
    setTimeout(sweepTx, 700);
  }

  /* Footer background video: load only when it's close */
  var endVid = document.querySelector('[data-lazy-video]');
  if (endVid && !reduce) {
    var startEnd = function () {
      if (endVid.getAttribute('data-started')) return;
      endVid.setAttribute('data-started', '1');
      endVid.src = endVid.getAttribute('data-lazy-video');
      var pr = endVid.play(); if (pr && pr.catch) pr.catch(function () {});
    };
    window.addEventListener('scroll', function () { if (endVid.getBoundingClientRect().top < window.innerHeight + 600) startEnd(); }, { passive: true });
  }

  /* Quote form: validation, success state, then the visitor's email app */
  var form = document.querySelector('[data-quote]');
  if (form) {
    var success = form.querySelector('.form__success');
    var check = function (field) {
      var el = field.querySelector('input, textarea');
      var err = field.querySelector('.field__error');
      if (!el || !err) return true;
      var ok = el.checkValidity() && el.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      el.setAttribute('aria-invalid', String(!ok));
      err.hidden = ok;
      return ok;
    };
    $$('.field', form).forEach(function (field) {
      var el = field.querySelector('input, textarea');
      if (el) el.addEventListener('blur', function () { if (field.classList.contains('is-invalid') || el.value) check(field); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('.field', form), firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f.querySelector('input, textarea'); });
      if (firstBad) { firstBad.focus(); success.hidden = true; return; }
      var d = new FormData(form);
      var body = ['Name: ' + d.get('name'), 'Phone: ' + (d.get('phone') || '-'), 'Email: ' + d.get('email'), 'Project: ' + d.get('type'), '', d.get('message')].join('\n');
      success.hidden = false;
      window.location.href = 'mailto:hugo.harrison@hhcrane.co.uk?subject=' + encodeURIComponent('Project enquiry — ' + d.get('type')) + '&body=' + encodeURIComponent(body);
    });
  }

  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
