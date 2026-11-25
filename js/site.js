/* Larkline Estates · Prototype v2 · shared scripts
   Each feature only runs when its markup is on the page. */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  /* run fn once when el scrolls into view */
  var whenVisible = function (el, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); fn(); }
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  };

  /* ------------------------------------------------------------------
     0a. Rolling digits: each number spins through 0-9 once, then lands.
     ------------------------------------------------------------------ */
  var odos = document.querySelectorAll('.odometer[data-count]');
  if (odos.length && !reduceMotion) {
    odos.forEach(function (o) {
      var target = parseInt(o.dataset.count, 10);
      var strip = document.createElement('span');
      strip.className = 'odo-strip';
      for (var i = 0; i <= 10 + target; i++) {
        var d = document.createElement('span'); d.textContent = i % 10; strip.appendChild(d);
      }
      o.textContent = '';
      o.appendChild(strip);
      o.dataset.steps = 10 + target;
    });
    whenVisible(odos[0].closest('dl') || odos[0], function () {
      odos.forEach(function (o, i) {
        var strip = o.firstChild;
        strip.style.transitionDelay = (i * 0.18) + 's';
        requestAnimationFrame(function () {
          strip.style.transform = 'translateY(-' + o.dataset.steps + 'em)';
        });
      });
    }, 0.5);
  }

  /* ------------------------------------------------------------------
     0b. Selling steps: soft pop, one after another, when in view.
     ------------------------------------------------------------------ */
  /* each step pops when it is well inside the screen, at least 0.6s after the previous one */
  document.querySelectorAll('[data-pop-list]').forEach(function (list) {
    var items = Array.prototype.slice.call(list.children);
    if (!('IntersectionObserver' in window)) { items.forEach(function (li) { li.classList.add('is-in'); }); return; }
    var queue = [], timer = null;
    var next = function () {
      if (!queue.length) { timer = null; return; }
      queue.shift().classList.add('is-in');
      timer = setTimeout(next, 600);
    };
    var io = new IntersectionObserver(function (entries) {
      entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return items.indexOf(a.target) - items.indexOf(b.target); })
        .forEach(function (e) {
          io.unobserve(e.target);
          /* earlier steps that were skipped by a fast scroll come first */
          items.slice(0, items.indexOf(e.target) + 1).forEach(function (li) {
            if (!li.classList.contains('is-in') && queue.indexOf(li) === -1) { queue.push(li); io.unobserve(li); }
          });
        });
      if (!timer) next();
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0.6 });
    items.forEach(function (li) { io.observe(li); });
  });

  /* ------------------------------------------------------------------
     0c. Neighborhood guide: next panel every 5 seconds.
         The progress line under the active tab is the clock (CSS, 5s);
         it pauses on hover, on focus, off screen and with the pause button.
     ------------------------------------------------------------------ */
  var hoodTabs = document.querySelector('[data-hood-tabs]');
  if (hoodTabs) {
    var radios = Array.prototype.slice.call(hoodTabs.querySelectorAll('.tab-input'));
    var pauseBtn = hoodTabs.querySelector('[data-hood-pause]');
    var tabList = hoodTabs.querySelector('.tab-list');
    if (reduceMotion) {
      pauseBtn.hidden = true;
    } else {
      var paused = false, hovered = false, focused = false, onScreen = false;
      var syncHood = function () {
        hoodTabs.classList.toggle('is-playing', !paused);
        hoodTabs.classList.toggle('is-held', hovered || focused || !onScreen || document.hidden);
      };
      var currentHood = function () { return radios.findIndex(function (r) { return r.checked; }); };
      var showHood = function (i) {
        radios[i].checked = true;
        /* keep the active tab in view in the sideways list on phones, without moving the page */
        var lab = hoodTabs.querySelector('[for="' + radios[i].id + '"]');
        if (lab && tabList.scrollWidth > tabList.clientWidth) {
          tabList.scrollTo({ left: lab.offsetLeft - tabList.offsetLeft, behavior: 'smooth' });
        }
      };
      hoodTabs.addEventListener('animationend', function (e) {
        if (e.animationName !== 'tab-progress') return;
        showHood((currentHood() + 1) % radios.length);
      });
      hoodTabs.addEventListener('mouseenter', function () { hovered = true; syncHood(); });
      hoodTabs.addEventListener('mouseleave', function () { hovered = false; syncHood(); });
      hoodTabs.addEventListener('focusin', function (e) { if (e.target !== pauseBtn) { focused = true; syncHood(); } });
      hoodTabs.addEventListener('focusout', function () { focused = false; syncHood(); });
      pauseBtn.addEventListener('click', function () {
        paused = !paused;
        pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', paused ? 'Play the neighborhood slideshow' : 'Pause the neighborhood slideshow');
        syncHood();
      });
      document.addEventListener('visibilitychange', syncHood);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; syncHood(); }, { threshold: 0.4 }).observe(hoodTabs);
      } else { onScreen = true; }
      syncHood();
    }
  }

  /* ------------------------------------------------------------------
     1. Valuation form: two steps, inline errors, no double submit.
        Prototype only: nothing is sent, we go to the confirmation page.
     ------------------------------------------------------------------ */
  var form = document.getElementById('valuation-form');
  if (form) {
    var steps = form.querySelectorAll('.form-step');
    var bars = form.querySelectorAll('.form-progress li');
    var label = document.getElementById('form-step-label');

    var validate = function (step) {
      var ok = true;
      step.querySelectorAll('[required]').forEach(function (el) {
        var err = el.parentElement.querySelector('.field-error');
        var bad = !el.value.trim();
        if (err) err.classList.toggle('hidden', !bad);
        el.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad && ok) { el.focus(); ok = false; }
      });
      return ok;
    };
    var show = function (n) {
      steps.forEach(function (s) { s.hidden = s.dataset.step !== String(n); });
      bars.forEach(function (b, i) { b.classList.toggle('is-active', i < n); });
      label.textContent = n === 1 ? 'Step 1 of 2 · Your home' : 'Step 2 of 2 · Your details';
      var first = steps[n - 1].querySelector('input, select');
      if (first) first.focus();
    };
    form.querySelector('[data-next]').addEventListener('click', function () { if (validate(steps[0])) show(2); });
    form.querySelector('[data-back]').addEventListener('click', function () { show(1); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(steps[1])) return;
      var btn = form.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Sending…';
      var now = new Date();
      var ref = 'LK-' + String(now.getDate()).padStart(2, '0') + String(now.getMonth() + 1).padStart(2, '0') +
        '-' + String(Math.floor(Math.random() * 900) + 100);
      /* Only the reference and the neighborhood travel in the URL, never personal details. */
      var hood = form.querySelector('#f-hood').value;
      setTimeout(function () {
        window.location.href = 'valuation-thanks.html?ref=' + encodeURIComponent(ref) + '&hood=' + encodeURIComponent(hood);
      }, 600);
    });
  }

  /* ------------------------------------------------------------------
     2. Valuation confirmation: show the reference and the local agent.
     ------------------------------------------------------------------ */
  var thanks = document.querySelector('[data-thanks]');
  if (thanks) {
    var params = new URLSearchParams(window.location.search);
    var refEl = document.getElementById('ref-number');
    if (params.get('ref') && /^LK-[0-9-]+$/.test(params.get('ref'))) refEl.textContent = params.get('ref');
    var agents = {
      daniel: ['Centre historique', 'Locmaria', 'Quais de l’Odet'],
      priya: ['Kerfeunteun', 'Providence-Saint-Mathieu', 'Ergué-Armel'],
      marcus: ['Quartier de la Gare', 'Creac’h Gwen', 'Penhars'],
      sofia: ['Le Moulin Vert', 'Le Corniguel', 'Coteau du Frugy']
    };
    var hood = params.get('hood') || '';
    var who = null;
    Object.keys(agents).forEach(function (k) { if (agents[k].indexOf(hood) > -1) who = k; });
    if (who) {
      thanks.querySelectorAll('[data-agent]').forEach(function (el) { el.hidden = el.dataset.agent !== who; });
    }
    var hoodEl = document.getElementById('hood-name');
    if (hoodEl && who) hoodEl.textContent = hood;
  }

  /* ------------------------------------------------------------------
     3. Homes for sale: live filter (type buttons, several at once),
        neighborhood and sort, animated with FLIP.
     ------------------------------------------------------------------ */
  var listing = document.querySelector('[data-listing]');
  if (listing) {
    var cards = Array.prototype.slice.call(listing.querySelectorAll('[data-type]'));
    var allBtn = document.querySelector('[data-filter-all]');
    var typeBtns = Array.prototype.slice.call(document.querySelectorAll('[data-filter-value]'));
    var hoodSelect = document.getElementById('filter-hood');
    var sortSelect = document.getElementById('filter-sort');
    var count = document.getElementById('result-count');
    var empty = document.getElementById('empty-state');
    var clearBtns = document.querySelectorAll('[data-clear-filters]');
    var total = cards.length;
    var DUR = 350, OUT = 200;
    var easing = 'cubic-bezier(0.22, 1, 0.36, 1)';
    var run = 0;

    var activeTypes = function () {
      return typeBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
        .map(function (b) { return b.dataset.filterValue; });
    };
    var matches = function (c, types, h) {
      return (!types.length || types.indexOf(c.dataset.type) > -1) && (!h || c.dataset.hood === h);
    };
    var sortedCards = function () {
      var s = sortSelect.value;
      return cards.slice().sort(function (a, b) {
        if (s === 'low') return a.dataset.price - b.dataset.price;
        if (s === 'high') return b.dataset.price - a.dataset.price;
        return a.dataset.order - b.dataset.order;
      });
    };
    var labelFor = function (n, types, h) {
      if (!types.length && !h) return 'Showing all ' + n + ' homes';
      var what = types.length ? typeBtns.filter(function (b) { return types.indexOf(b.dataset.filterValue) > -1; })
        .map(function (b) { return b.firstChild.textContent.trim().toLowerCase(); }).join(', ') : 'homes';
      return 'Showing ' + n + ' of ' + total + (types.length ? ': ' + what : ' homes') + (h ? ' in ' + h : '');
    };

    var update = function () {
      var myRun = ++run;
      var types = activeTypes();
      var h = hoodSelect.value;
      var filtering = types.length > 0 || !!h;
      var order = sortedCards();
      var next = order.filter(function (c) { return matches(c, types, h); });

      /* buttons, count, clear, empty state */
      allBtn.setAttribute('aria-pressed', types.length ? 'false' : 'true');
      count.textContent = labelFor(next.length, types, h);
      clearBtns.forEach(function (b) { if (b.closest('#empty-state') === null) b.hidden = !filtering; });

      /* stop anything still moving from a previous click */
      cards.forEach(function (c) { c.getAnimations().forEach(function (a) { a.cancel(); }); });

      var visibleNow = cards.filter(function (c) { return !c.hidden; });
      var leaving = visibleNow.filter(function (c) { return next.indexOf(c) === -1; });
      var entering = next.filter(function (c) { return c.hidden; });
      var staying = next.filter(function (c) { return !c.hidden; });

      var commit = function () {
        cards.forEach(function (c) { c.hidden = next.indexOf(c) === -1; }); /* really hidden for screen readers */
        order.forEach(function (c) { listing.appendChild(c); });
        empty.hidden = next.length !== 0;
      };

      if (reduceMotion) { commit(); return; }

      /* 1. leaving cards fade and shrink out, in place */
      var outs = leaving.map(function (c) {
        return c.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.92)' }],
          { duration: OUT, easing: 'ease-in', fill: 'forwards' }).finished.catch(function () {});
      });

      Promise.all(outs).then(function () {
        if (myRun !== run) return;
        /* 2. First: where the staying cards are now */
        var first = new Map();
        staying.forEach(function (c) { first.set(c, c.getBoundingClientRect()); });
        /* 3. change the layout */
        commit();
        leaving.forEach(function (c) { c.getAnimations().forEach(function (a) { a.cancel(); }); });
        /* 4. Last + Invert + Play */
        staying.forEach(function (c) {
          var a = first.get(c), b = c.getBoundingClientRect();
          var dx = a.left - b.left, dy = a.top - b.top;
          if (dx || dy) {
            c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }],
              { duration: DUR, easing: easing });
          }
        });
        entering.forEach(function (c, i) {
          c.animate([{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'scale(1)' }],
            { duration: DUR, easing: easing, delay: 60 + i * 40, fill: 'backwards' });
        });
      });
    };

    allBtn.addEventListener('click', function () {
      typeBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      update();
    });
    typeBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        update();
      });
    });
    hoodSelect.addEventListener('change', update);
    sortSelect.addEventListener('change', update);
    clearBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        typeBtns.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
        hoodSelect.value = '';
        update();
        allBtn.focus();
      });
    });
  }

  /* ------------------------------------------------------------------
     4. Journal archive: filter by category.
     ------------------------------------------------------------------ */
  var journal = document.querySelector('[data-journal]');
  if (journal) {
    document.querySelectorAll('input[name="filter-cat"]').forEach(function (i) {
      i.addEventListener('change', function () {
        journal.querySelectorAll('[data-cat]').forEach(function (c) {
          c.hidden = !!i.value && c.dataset.cat !== i.value;
        });
      });
    });
  }

  /* ------------------------------------------------------------------
     4b. Team accordion: one agent open at a time.
         Hover opens on desktop; click, tap and keyboard focus open everywhere.
         On phones the CSS turns it into a swipe row with every agent open.
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-team-accordion]').forEach(function (list) {
    var panels = Array.prototype.slice.call(list.querySelectorAll('[data-team-panel]'));
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var open = function (panel) {
      panels.forEach(function (p) {
        var on = p === panel;
        p.classList.toggle('is-open', on);
        var btn = p.querySelector('.team-toggle');
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    };
    panels.forEach(function (p) {
      if (canHover) p.addEventListener('mouseenter', function () { open(p); });
      p.addEventListener('click', function () { if (!p.classList.contains('is-open')) open(p); });
      p.addEventListener('focusin', function () { open(p); });
    });
  });

  /* ------------------------------------------------------------------
     5. Bleed slider: native scroll-snap + mouse drag with inertia + arrows.
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-bleed-slider]').forEach(function (root) {
    var track = root.querySelector('.bleed-track');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next-slide]');
    if (!track) return;

    var step = function () {
      var slide = track.querySelector('.bleed-slide');
      if (!slide) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slide.getBoundingClientRect().width + gap;
    };
    var updateArrows = function () {
      var max = track.scrollWidth - track.clientWidth - 2;
      /* snapping may stop just before the very end, so "end" also means the last slide is fully in view */
      var last = track.querySelector('.bleed-slide:last-child');
      var lastIn = last && last.getBoundingClientRect().right <= track.getBoundingClientRect().right + 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max || !!lastIn;
    };
    var go = function (dir) {
      track.scrollBy({ left: dir * step(), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    updateArrows();

    /* Mouse drag (touch and pen keep native scrolling) */
    var dragging = false, moved = false, startX = 0, startLeft = 0, lastX = 0, lastT = 0, velocity = 0, raf = 0;
    var endInertia = function () {
      cancelAnimationFrame(raf);
      track.classList.remove('is-dragging');
    };
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      endInertia();
      dragging = true; moved = false;
      startX = lastX = e.clientX; startLeft = track.scrollLeft; lastT = performance.now(); velocity = 0;
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        track.classList.add('is-dragging'); /* turns snapping off while dragging */
      }
      if (!moved) return;
      track.scrollLeft = startLeft - dx;
      var now = performance.now();
      var dt = Math.max(1, now - lastT);
      velocity = (e.clientX - lastX) / dt; /* px per ms */
      lastX = e.clientX; lastT = now;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      if (!moved) return;
      if (reduceMotion) { track.classList.remove('is-dragging'); return; }
      /* small inertia, then hand back to scroll-snap */
      var v = velocity * 16;
      var tick = function () {
        v *= 0.92;
        track.scrollLeft -= v;
        if (Math.abs(v) > 0.5) { raf = requestAnimationFrame(tick); }
        else { track.classList.remove('is-dragging'); }
      };
      raf = requestAnimationFrame(tick);
    });
    /* a drag must not open the article underneath */
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    track.querySelectorAll('img').forEach(function (img) { img.draggable = false; });
  });

  /* ------------------------------------------------------------------
     6. Shader background: concentric house-gable rings from the logo.
     ------------------------------------------------------------------ */
  document.querySelectorAll('[data-shader]').forEach(function (section) {
    var canvas = section.querySelector('.shader-canvas');
    var gl = canvas && (canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl'));
    if (!gl) {
      if (canvas) canvas.remove();
      section.classList.add('shader-fallback');
      return;
    }

    var vs = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
    var fs = [
      'precision mediump float;',
      'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uPush;',
      'uniform vec3 uDark1;uniform vec3 uDark2;uniform vec3 uBrand1;uniform vec3 uBrand2;',
      /* distance-like field of a house gable (box + pitched roof), like the logo houses */
      'float house(vec2 p){',
      '  p.x=abs(p.x);',
      '  float side=p.x-0.42;',
      '  float base=-p.y-0.40;',
      '  float roof=dot(p-vec2(0.0,0.52),normalize(vec2(0.9,1.0)));',
      '  return max(max(side,base),roof);',
      '}',
      'void main(){',
      '  vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;',
      '  vec2 p=uv;',
      /* soft bubble around the (eased) pointer */
      '  vec2 d=p-uMouse;float r=length(d);',
      '  p+=normalize(d+1e-4)*0.16*exp(-r*r/0.05)*uPush;',
      /* slow wave warp */
      '  p+=0.03*vec2(sin(p.y*5.0+uTime*0.5),cos(p.x*4.0-uTime*0.4));',
      /* slow rotation */
      '  float a=uTime*0.05;p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;',
      '  float k=house(p)*7.0-uTime*0.12;',
      '  float f=fract(k);',
      '  float band=smoothstep(0.0,0.5,f)*smoothstep(1.0,0.5,f);',
      '  vec3 col=mix(uDark1,uDark2,band*0.85);',
      '  float line=smoothstep(0.035,0.0,abs(f-0.5));',
      '  col=mix(col,uBrand2,line*0.45);',
      '  float glow=exp(-r*r/0.08)*uPush;',
      '  col=mix(col,uBrand1,glow*0.10);',
      /* fade to the base colour towards the edges, keeps text calm */
      '  col=mix(col,uDark1,smoothstep(0.55,1.25,length(uv)));',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    var compile = function (type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    var prog = gl.createProgram();
    if (!v || !f) { canvas.remove(); section.classList.add('shader-fallback'); return; }
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); section.classList.add('shader-fallback'); return; }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ['uRes', 'uTime', 'uMouse', 'uPush', 'uDark1', 'uDark2', 'uBrand1', 'uBrand2'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    /* palette straight from the CSS variables */
    var css = getComputedStyle(document.documentElement);
    var rgb = function (name) {
      var h = css.getPropertyValue(name).trim().replace('#', '');
      return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
    };
    gl.uniform3fv(U.uDark1, rgb('--primary-dark-1'));
    gl.uniform3fv(U.uDark2, rgb('--primary-dark-2'));
    gl.uniform3fv(U.uBrand1, rgb('--primary-brand-1'));
    gl.uniform3fv(U.uBrand2, rgb('--primary-brand-2'));

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var resize = function () {
      var r = section.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
    };
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); if (reduceMotion) draw(8); }).observe(section);

    /* pointer: eased target in shader space; wanders on its own without a hovering pointer */
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var target = { x: 0.3, y: 0 }, cur = { x: 0.3, y: 0 }, push = 0, pushTarget = 0, hasPointer = false;
    section.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = section.getBoundingClientRect();
      target.x = (e.clientX - r.left - r.width / 2) / r.height;
      target.y = (r.height / 2 - (e.clientY - r.top)) / r.height;
      hasPointer = true; pushTarget = 1;
    });
    section.addEventListener('pointerleave', function () { hasPointer = false; });

    var draw = function (t) {
      if (!hasPointer) {
        target.x = 0.45 * Math.sin(t * 0.13) + 0.15;
        target.y = 0.28 * Math.cos(t * 0.17);
        pushTarget = finePointer ? 0.6 : 0.8;
      }
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      push += (pushTarget - push) * 0.05;
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uMouse, cur.x, cur.y);
      gl.uniform1f(U.uPush, push);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduceMotion) {
      /* one still frame */
      cur.x = target.x = 0.35; cur.y = target.y = 0.05; push = pushTarget = 0.6;
      draw(8);
      return;
    }

    var visible = false, running = false, last = 0, t0 = performance.now();
    var loop = function (now) {
      if (!visible || document.hidden) { running = false; return; }
      if (now - last >= 1000 / 30) { /* cap at 30fps */
        last = now;
        draw((now - t0) / 1000);
      }
      requestAnimationFrame(loop);
    };
    var start = function () { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(loop); } };
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting; start();
    }, { rootMargin: '100px' }).observe(section);
    document.addEventListener('visibilitychange', start);
    draw(0);
  });

  /* ------------------------------------------------------------------
     7. Curtain footer: the page lifts off a fixed footer underneath.
     ------------------------------------------------------------------ */
  var footer = document.querySelector('[data-curtain-footer]');
  var wrap = document.querySelector('.page-wrap');
  if (footer && wrap) {
    var root = document.documentElement;
    var fh = 0, on = false;
    var measure = function () {
      root.classList.remove('curtain-on');
      wrap.style.marginBottom = '';
      fh = footer.offsetHeight;
      on = fh < window.innerHeight * 0.9; /* too tall (often on phones): keep a normal footer */
      if (on) {
        root.classList.add('curtain-on');
        wrap.style.marginBottom = fh + 'px';
      }
      progress();
    };
    var progress = function () {
      if (!on || reduceMotion) { footer.style.setProperty('--reveal', 1); return; }
      var shown = window.scrollY + window.innerHeight - (root.scrollHeight - fh);
      var p = Math.min(1, Math.max(0, shown / fh));
      footer.style.setProperty('--reveal', p.toFixed(3));
    };
    window.addEventListener('scroll', progress, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    measure();
    /* keyboard: a focused footer link is never left behind the page */
    footer.addEventListener('focusin', function () {
      if (!on) return;
      window.scrollTo({ top: root.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
})();
