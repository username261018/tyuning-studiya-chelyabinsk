/* Тюнинг студия · motion engine (vanilla). Hidden states live only under html.m-on. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, W = window;
  var motion = html.classList.contains('m-on');
  var fine = W.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* strip + header height -> --top-h */
  var top = d.querySelector('[data-top]');
  function setTop() { if (top) html.style.setProperty('--top-h', top.offsetHeight + 'px'); }
  setTop();
  if (top && 'ResizeObserver' in W) new ResizeObserver(setTop).observe(top);

  /* menu (disclosure) */
  var burger = d.querySelector('[data-burger]');
  if (burger) {
    var nav = d.getElementById(burger.getAttribute('aria-controls'));
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      html.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    if (nav) nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    });
    W.matchMedia('(min-width: 1000px)').addEventListener('change', function () { setMenu(false); });
  }

  /* map on click */
  d.querySelectorAll('[data-map]').forEach(function (box) {
    var btn = box.querySelector('button');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = d.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = box.getAttribute('data-title') || 'Карта';
      f.setAttribute('allowfullscreen', '');
      box.textContent = '';
      box.appendChild(f);
    });
  });

  if (!motion) return;
  html.classList.add('m-ready');

  /* headings: word masks, text kept whole for screen readers */
  function words(el, step) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var walk = d.createTreeWalker(el, NodeFilter.SHOW_TEXT), list = [], n = 0, t;
    while ((t = walk.nextNode())) list.push(t);
    list.forEach(function (node) {
      var frag = d.createDocumentFragment();
      node.nodeValue.split(/([ \t\r\n]+)/).forEach(function (p) {
        if (!p) return;
        if (/^[ \t\r\n]+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
        var w = d.createElement('span'), wi = d.createElement('span');
        w.className = 'w'; w.setAttribute('aria-hidden', 'true');
        wi.className = 'wi'; wi.textContent = p;
        wi.style.transitionDelay = (n++ * step) + 'ms';
        w.appendChild(wi); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  d.querySelectorAll('[data-rv="w"]').forEach(function (el) { words(el, el.tagName === 'H1' ? 70 : 60); });

  /* stagger: index inside groups */
  d.querySelectorAll('[data-stagger]').forEach(function (g) {
    g.querySelectorAll('[data-rv]').forEach(function (c, i) { c.style.setProperty('--i', i); });
  });

  /* curtains release their clip once settled */
  d.querySelectorAll('[data-rv="cur"]').forEach(function (el) {
    el.addEventListener('transitionend', function (e) {
      if (e.target === el && e.propertyName === 'clip-path') el.classList.add('done');
    });
  });

  /* entrance reveals: rect sweep (plays once) */
  var queue = [].slice.call(d.querySelectorAll('[data-rv]:not([data-hero])'));
  function sweep(all) {
    var vh = W.innerHeight, rest = [];
    queue.forEach(function (el) {
      if (all || el.getBoundingClientRect().top < vh - 1) el.classList.add('in'); else rest.push(el);
    });
    queue = rest;
  }
  function hero() {
    d.querySelectorAll('[data-hero]').forEach(function (el) {
      setTimeout(function () { el.classList.add('in'); }, +el.getAttribute('data-hero') || 0);
    });
  }

  /* one paragraph lights up with scroll */
  var lights = [].slice.call(d.querySelectorAll('[data-light]'));
  lights.forEach(function (p) {
    var txt = p.textContent.trim();
    p.setAttribute('aria-label', txt);
    p.innerHTML = txt.split(/\s+/).map(function (w) { return '<span class="lw" aria-hidden="true">' + w + '</span>'; }).join(' ');
    p._w = [].slice.call(p.querySelectorAll('.lw'));
  });

  var panels = [].slice.call(d.querySelectorAll('[data-panel]'));
  var lanes = [].slice.call(d.querySelectorAll('[data-lane]'));
  var wide = W.matchMedia('(min-width: 900px)');

  function layLanes() {
    lanes.forEach(function (s) {
      var view = s.querySelector('.lane__view'), track = s.querySelector('.lane__track'), pin = s.querySelector('.lane__pin');
      track.style.transform = '';
      if (!wide.matches) { s.classList.remove('lane-on'); s.style.height = ''; s._max = 0; return; }
      s.classList.add('lane-on');
      var max = Math.max(track.scrollWidth - view.clientWidth, 0);
      var cap = (+s.getAttribute('data-lane') || 1.3) * W.innerHeight;
      s._max = max;
      s.style.height = (pin.offsetHeight + Math.min(max, cap)) + 'px';
    });
  }

  function cl(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function scrolled() {
    var vh = W.innerHeight;
    lights.forEach(function (p) {
      var r = p.getBoundingClientRect(), k = cl((vh * 0.9 - r.top) / (vh * 0.45)), n = p._w.length, f = k * (n + 3);
      for (var i = 0; i < n; i++) p._w[i].style.opacity = (0.25 + 0.75 * cl(f - i)).toFixed(3);
    });
    panels.forEach(function (el) {
      var k = cl((vh - el.getBoundingClientRect().top) / (vh * 0.6));
      var mx = parseFloat(getComputedStyle(el).getPropertyValue('--fx-max')) || 48;
      el.style.setProperty('--fx', (mx * (1 - k)).toFixed(1) + 'px');
    });
    lanes.forEach(function (s) {
      if (!s.classList.contains('lane-on')) return;
      var pin = s.querySelector('.lane__pin'), r = s.getBoundingClientRect();
      var span = r.height - pin.offsetHeight, topPx = parseFloat(getComputedStyle(pin).top) || 0;
      var k = span > 0 ? cl((topPx - r.top) / span) : 0;
      s.querySelector('.lane__track').style.transform = 'translate3d(' + (-k * s._max).toFixed(1) + 'px,0,0)';
      var bar = s.querySelector('.lane__bar i');
      if (bar) bar.style.transform = 'scaleX(' + k.toFixed(4) + ')';
    });
  }

  var busy = false;
  function tick() {
    if (busy) return;
    busy = true;
    requestAnimationFrame(function () { busy = false; sweep(false); scrolled(); });
  }

  /* fine pointer: polaroid tilt + light spot */
  if (fine) {
    var spot = d.querySelector('.spot'), tilts = [].slice.call(d.querySelectorAll('[data-tilt]'));
    var mx = 0, my = 0, raf = 0;
    var paint = function () {
      raf = 0;
      if (spot) spot.style.transform = 'translate3d(' + (mx - 320) + 'px,' + (my - 320) + 'px,0)';
      tilts.forEach(function (t) {
        var r = t.getBoundingClientRect();
        var dx = (mx - (r.left + r.width / 2)) / W.innerWidth, dy = (my - (r.top + r.height / 2)) / W.innerHeight;
        t.style.transform = 'perspective(900px) rotateY(' + (dx * 9).toFixed(2) + 'deg) rotateX(' + (-dy * 7).toFixed(2) + 'deg)';
      });
    };
    W.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
    if (spot) spot.classList.add('spot-on');
  }

  function start() { layLanes(); sweep(false); scrolled(); setTimeout(hero, 300); }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
  W.addEventListener('scroll', tick, { passive: true });
  W.addEventListener('resize', function () { layLanes(); tick(); });
  W.addEventListener('load', function () { layLanes(); tick(); });
  W.addEventListener('hashchange', function () { setTimeout(function () { sweep(false); scrolled(); }, 60); });
  W.addEventListener('beforeprint', function () { sweep(true); });
  wide.addEventListener('change', function () { layLanes(); scrolled(); });
})();
