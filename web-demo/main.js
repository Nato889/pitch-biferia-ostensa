(() => {
  window.bfReduced = () => matchMedia('(prefers-reduced-motion:reduce)').matches;   // solo si el sistema pide menos movimiento
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const dpr = Math.min(devicePixelRatio || 1, 2);

  /* ---------- mouse global ---------- */
  const mouse = { x: -9999, y: -9999 };
  const setM = e => { mouse.x = e.clientX; mouse.y = e.clientY; };
  addEventListener('pointermove', setM); addEventListener('pointerdown', setM);
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  addEventListener('pointerup', e => { if (e.pointerType === 'touch') mouse.x = mouse.y = -9999; });

  /* ---------- canvas helper: tamaño + visibilidad ---------- */
  function setupCanvas(canvas, host) {
    const ctx = canvas.getContext('2d');
    const st = { ctx, w: 0, h: 0, visible: false };
    const fit = () => {
      const r = (host || canvas).getBoundingClientRect();
      st.w = r.width; st.h = r.height;
      canvas.width = st.w * dpr; canvas.height = st.h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    new ResizeObserver(fit).observe(host || canvas);
    new IntersectionObserver(([e]) => st.visible = e.isIntersecting).observe(host || canvas);
    st.local = () => {
      const r = canvas.getBoundingClientRect();
      return { x: mouse.x - r.left, y: mouse.y - r.top, inside: mouse.x >= r.left && mouse.x <= r.right && mouse.y >= r.top && mouse.y <= r.bottom, top: r.top };
    };
    return st;
  }

  /* contorno amorfo del cursor: 8 puntos que "respiran" despacio; nodos amarillos en los lados */
  const NS = 'http://www.w3.org/2000/svg';
  function blobRing(el, seed) {
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-60 -60 120 120');
    const path = document.createElementNS(NS, 'path'); svg.appendChild(path);
    const nodes = [1, 3, 5, 7].map(() => { const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 5.5); svg.appendChild(c); return c; });
    el.appendChild(svg);
    return t => {
      const P = [];
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2 - Math.PI / 2;
        const r = 42 * (1 + .2 * Math.sin(t * .9 + i * 1.9 + seed) + .1 * Math.sin(t * 1.7 + i * 3.1)) * (i % 2 ? 1.06 : .94);
        P.push([Math.cos(a) * r, Math.sin(a) * r]);
      }
      path.setAttribute('d', 'M' + P.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L') + ' Z');
      [1, 3, 5, 7].forEach((k, j) => { nodes[j].setAttribute('cx', P[k][0].toFixed(1)); nodes[j].setAttribute('cy', P[k][1].toFixed(1)); });
    };
  }

  const loops = [];
  const tick = t => { loops.forEach(fn => fn(t / 1000)); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);

  /* ---------- HERO: líneas onduladas que se juntan en el cursor ---------- */
  (function hero() {
    const host = $('#waves'), canvas = $('#wavesCanvas');
    const c = setupCanvas(canvas, host);
    const ring = $('#heroRing'), dot = $('#heroDot'), label = $('#heroLabel');
    const morph = blobRing(ring, 0);
    let N = 62, STEP = 8;
    const m = { x: 0, y: 0, p: 0, tx: 0, ty: 0 };

    loops.push(t0 => {
      if (!c.visible) return;
      const t = window.bfReduced() ? 0 : t0;
      const { ctx, w, h } = c;
      N = w < 600 ? 34 : 62; STEP = w < 600 ? 12 : 8;
      const lm = c.local();
      if (lm.inside) { m.tx = lm.x; m.ty = lm.y; if (m.p < .01) { m.x = m.tx; m.y = m.ty; } }
      m.x = lerp(m.x, m.tx, .12); m.y = lerp(m.y, m.ty, .12);
      m.p = lerp(m.p, lm.inside ? 1 : 0, .08);
      host.classList.toggle('on-cursor', lm.inside);
      ring.style.transform = dot.style.transform = label.style.transform = `translate(${m.x}px,${m.y}px)`;
      morph(t);

      ctx.clearRect(0, 0, w, h);
      const top = 20, span = h - 40, RX = Math.min(330, w * .42), RY = Math.min(190, h * .38);   // radio con que el cursor atrae las líneas
      const ink = css('--ink');
      const lines = new Path2D(), hot = new Path2D();
      const OX = Math.min(250, w * .32), OY = Math.min(145, h * .29);   // tamaño del óvalo rojo
      for (let i = 0; i < N; i++) {
        const by = top + span * (i / (N - 1));
        let on = false;
        for (let x = 0; x <= w + STEP; x += STEP) {
          let y = by + Math.sin(x * .0042 + t * .6 + i * .05) * (24 + 18 * Math.sin(i * .09 + t * .2))
                     + Math.sin(x * .011 - t * .9 + i * .12) * 7;
          const dx = (x - m.x) / RX, dy = (y - m.y) / RY;
          const f = Math.exp(-(dx * dx + dy * dy) * 1.3) * m.p;
          y += (m.y - y) * f * .78;
          x === 0 ? lines.moveTo(x, y) : lines.lineTo(x, y);
          const ox = (x - m.x) / OX, oy = (y - m.y) / OY;
          if (Math.exp(-(ox * ox + oy * oy) * 1.3) * m.p > .18) { on ? hot.lineTo(x, y) : hot.moveTo(x, y); on = true; } else on = false;
        }
      }
      ctx.lineWidth = 1; ctx.strokeStyle = ink; ctx.globalAlpha = .9;
      ctx.stroke(lines);

      // foco: óvalo rojo (transparente) alrededor del cursor; las líneas que lo cruzan se pintan de rojo
      ctx.strokeStyle = css('--red'); ctx.lineWidth = 1.6; ctx.globalAlpha = 1;
      ctx.stroke(hot);
    });
  })();

  /* ---------- GRILLA DEFORMABLE (reutilizable) ---------- */
  function warpGrid(canvas, o = {}) {
    const c = setupCanvas(canvas, canvas.parentElement);
    const bx = o.cellX || 150, by = o.cellY || 80, bR = o.radius || 230; let cx = bx, cy = by, R = bR;
    const m = { x: 0, y: 0, p: 0 };
    loops.push(t => {
      if (!c.visible) return;
      const { ctx, w, h } = c;
      const k = w < 600 ? (o.type === "dots" || o.type === "hlines" ? .8 : .62) : 1; cx = bx * k; cy = by * k; R = bR * k;
      const lm = c.local();
      if (lm.inside) { if (m.p < .02) { m.x = lm.x; m.y = lm.y; } m.x = lerp(m.x, lm.x, .14); m.y = lerp(m.y, lm.y, .14); }
      m.p = lerp(m.p, lm.inside ? 1 : 0, .07);
      const sp = o.scroll ? o.scroll(lm.top) : 0;
      const pt = (x, y) => {
        const dx = x - m.x, dy = y - m.y;
        const f = Math.exp(-(dx * dx + dy * dy) / (R * R)) * m.p;
        let nx = x + dx * f * .55, ny = y + dy * f * .55;
        ny += Math.sin(x * .004 + sp) * (o.wave || 0) * (1 - Math.abs(x / w - .5) * .6);
        nx += Math.cos(y * .004 + sp * .8) * (o.wave || 0) * .5;
        return [nx, ny];
      };
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue('--line').trim(); ctx.lineWidth = 1;
      const type = o.type || 'grid';
      const line = pts => pts.forEach(([x, y], i) => { const [px, py] = pt(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      const ox = (w % cx) / 2, oy = (h % cy) / 2;
      ctx.beginPath();
      if (type === 'grid') {                       // cuadrícula
        for (let x = ox; x <= w; x += cx) { const a = []; for (let y = 0; y <= h; y += 16) a.push([x, y]); line(a); }
        for (let y = oy; y <= h; y += cy) { const a = []; for (let x = 0; x <= w; x += 16) a.push([x, y]); line(a); }
      } else if (type === 'diag') {                // líneas diagonales cruzadas
        for (let s = -h; s <= w; s += cx) {
          const a = [], b = [];
          for (let y = 0; y <= h; y += 16) { a.push([s + y, y]); b.push([s + h - y, y]); }
          line(a); line(b);
        }
      } else if (type === 'hlines') {              // curvas de nivel horizontales
        for (let y = oy; y <= h; y += cy) { const a = []; for (let x = 0; x <= w; x += 14) a.push([x, y]); line(a); }
      } else if (type === 'radial') {              // anillos y rayos desde el centro
        const X = w / 2, Y = h / 2, max = Math.hypot(X, Y);
        for (let rad = cx; rad <= max; rad += cx) { const a = []; for (let i = 0; i <= 96; i++) { const t = i / 96 * Math.PI * 2; a.push([X + Math.cos(t) * rad, Y + Math.sin(t) * rad * (o.squash || 1)]); } line(a); }
        for (let i = 0; i < (o.spokes || 16); i++) { const t = i / (o.spokes || 16) * Math.PI * 2, a = []; for (let rad = 0; rad <= max; rad += 20) a.push([X + Math.cos(t) * rad, Y + Math.sin(t) * rad * (o.squash || 1)]); line(a); }
      }
      ctx.stroke();
      if (type === 'dots' || type === 'cross') {   // puntos o cruces que crecen cerca del cursor
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath();
        for (let x = ox; x <= w; x += cx) for (let y = oy; y <= h; y += cy) {
          const [px, py] = pt(x, y), d = Math.hypot(x - m.x, y - m.y), f = Math.exp(-(d * d) / (R * R)) * m.p;
          if (type === 'dots') { const rr = 1.4 + f * 3.2; ctx.moveTo(px + rr, py); ctx.arc(px, py, rr, 0, 7); }
          else { const s = 4 + f * 6; ctx.moveTo(px - s, py); ctx.lineTo(px + s, py); ctx.moveTo(px, py - s); ctx.lineTo(px, py + s); }
        }
        type === 'dots' ? ctx.fill() : ctx.stroke();
      }
      o.after && o.after(m, lm);
    });
    return { c, m };
  }

  /* ---------- MANIFIESTO: perspectiva + scroll ---------- */
  (function manifesto() {
    const sec = $('#manifesto'), stage = $('#stage'), floor = $('#floor'), words = $('#words');
    const spans = $$('span', words), tag = $('#tagline'), sdot = $('#scrollDot');
    const ring = $('#stageRing'), dot = $('#stageDot');
    const morph2 = blobRing(ring, 2.4);
    const warpEl = $('#stageWarp');
    let p = 0;
    warpGrid(warpEl, {
      cellX: 150, cellY: 80, radius: 200, wave: 0,
      after: (m, lm) => {
        stage.classList.toggle('on-cursor', lm.inside && p > .85);
        ring.style.transform = dot.style.transform = `translate(${m.x}px,${m.y}px)`;
        morph2(window.bfReduced() ? 0 : performance.now() / 1000);
      }
    });
    function update() {
      const r = sec.getBoundingClientRect();
      p = clamp(-r.top / (sec.offsetHeight - innerHeight));
      const e = ease(clamp(p / .8));
      const a = (1 - e) * 72;
      floor.style.transform = `rotateX(${a}deg)`;
      words.style.transform = `rotateX(${a * .9}deg) scale(${.5 + .5 * e})`;
      spans.forEach((s, i) => {
        const k = (1 - e);
        s.style.transform = `skewX(${-k * 16}deg) scaleX(${1 + k * (.55 + i * .08) * (innerWidth < 600 ? .4 : 1)})`;
        s.style.letterSpacing = `${k * .04}em`;
      });
      const wp = clamp((p - .82) / .15);
      warpEl.style.opacity = wp;
      floor.style.opacity = 1 - wp;
      tag.style.opacity = clamp((p - .88) / .08);
      tag.style.transform = `translateY(${(1 - clamp((p - .88) / .08)) * 20}px)`;
      sdot.style.top = `calc(${p * 100}% - ${p * 13}px)`;
    }
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', update); update();
  })();

  /* ---------- QUIÉNES SOMOS / PARTICIPAR: grillas que se curvan con scroll + mouse ---------- */
  // cada sección tiene su propia trama (forma y escala)
  warpGrid($('#coexWarp'),   { type: 'grid',   cellX: 240, cellY: 240, radius: 300, wave: 10, scroll: top => top * .003 });   // cuadrícula grande
  warpGrid($('#aboutWarp'),  { type: 'dots',   cellX: 34,  cellY: 34,  radius: 190, wave: 14, scroll: top => top * .004 });   // puntos pequeños
  warpGrid($('#spaceWarp'),  { type: 'diag',   cellX: 86,  cellY: 86,  radius: 240, wave: 10, scroll: top => top * .003 });   // diagonales
  warpGrid($('#gameWarp'),   { type: 'radial', cellX: 78,  cellY: 78,  radius: 260, wave: 6,  spokes: 18, squash: .8, scroll: top => top * .002 }); // anillos
  warpGrid($('#ticketWarp'), { type: 'cross',  cellX: 64,  cellY: 64,  radius: 210, wave: 8,  scroll: top => top * .003 });   // cruces
  warpGrid($('#infoWarp'),   { type: 'hlines', cellX: 30,  cellY: 30,  radius: 230, wave: 10, scroll: top => top * .003 });   // curvas de nivel
  warpGrid($('#joinWarp'), { cellX: 125, cellY: 105, radius: 240, wave: 14, scroll: top => top * .003 });

  /* ---------- EXPERIENCIAS ---------- */
  (function exp() {
    const chips = $$('.chip'), cards = $$('.xcard'), rows = $$('.giant .giant-row'), crumb = $('#crumb');
    cards.forEach((c, i) => { c.style.setProperty('--r', (i % 2 ? 4 : -5) + 'deg'); c.style.setProperty('--y', (i % 3) * 18 + 'px'); });
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(x => x.classList.toggle('on', x === ch));
      const f = ch.dataset.f;
      crumb.textContent = ch.textContent.replace(/\s*\(\d+\)/, '');
      cards.forEach(c => c.classList.toggle('hide', f !== 'todas' && c.dataset.c !== f));
      rows.forEach(r => r.classList.toggle('on', r.dataset.k === f));
    }));
    // palabras gigantes: parallax horizontal con scroll
    const sec = $('#experiencias');
    const move = () => {
      const r = sec.getBoundingClientRect();
      rows.forEach((row, i) => row.style.transform = `translateX(${(-r.top * (i % 2 ? -.35 : .35)) - 300}px)`);
    };
    addEventListener('scroll', move, { passive: true }); move();
    // tilt 3D con el mouse
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(700px) rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateY(-14px) scale(1.04)`;
      });
      card.addEventListener('pointerleave', () => card.style.transform = '');
    });
  })();

  /* ---------- PARTICIPAR ---------- */
  $$('#options .opt').forEach(o => o.addEventListener('click', () => $$('#options .opt').forEach(x => x.classList.toggle('on', x === o))));
  (function form() {
    const f = $('#form'), ok = $('#ok'), send = $('#send'), proy = $('#proyecto'), msg = $('#f-msg'), count = $('#count');
    const proyReq = [$('#f-proy'), $('#f-rubro')];
    const syncProy = () => {
      const on = $('#q2').checked; proy.hidden = !on;
      proyReq.forEach(el => { el.required = on; if (!on) el.classList.remove('is-invalid'); });
    };
    $$('input[name="quiero"]').forEach(r => r.addEventListener('change', syncProy));
    msg.addEventListener('input', () => count.textContent = `${msg.value.length} / 500`);
    const web = $('#f-web');
    const checkWeb = () => { const v = web.value.trim(); web.setCustomValidity(!v || /^@[\w.]{2,30}$/.test(v) || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/.test(v) ? '' : 'x'); };
    web.addEventListener('input', checkWeb);
    f.addEventListener('submit', async e => {
      e.preventDefault(); checkWeb(); ok.hidden = true; ok.classList.remove('err');
      f.classList.add('was-validated');
      if (!f.checkValidity()) { const bad = f.querySelector(':invalid'); bad && bad.focus({ preventScroll: false }); return; }
      send.disabled = true; send.textContent = 'Enviando…';
      const say = (t, err) => { ok.textContent = t; ok.classList.toggle('err', !!err); ok.hidden = false; };
      try {
        if (location.protocol === 'file:') {
          say(`¡Gracias, ${$('#f-nombre').value.trim()}! Recibimos tu mensaje y te escribimos pronto.`);
        } else {
          const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(f)).toString() });
          if (!r.ok) throw new Error(r.status);
          say(`¡Gracias, ${$('#f-nombre').value.trim()}! Recibimos tu mensaje y te escribimos pronto.`);
        }
        f.reset(); f.classList.remove('was-validated'); syncProy(); count.textContent = '0 / 500';
      } catch (err) { say('No pudimos enviar el mensaje. Probá de nuevo en un rato.', true); }
      send.disabled = false; send.textContent = 'Enviar →';
    });
  })();


  /* ---------- CONTRASTE ---------- */
  $('#contrast').addEventListener('click', () => {
    const r = document.documentElement;
    r.dataset.theme = r.dataset.theme === 'light' ? '' : 'light';
  });
})();

/* ---------- GRUNGE: garabatos que se dibujan + manchas de tinta ---------- */
(() => {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .6 });
  document.querySelectorAll('.scrib').forEach(el => io.observe(el));
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  document.querySelectorAll('.splat').forEach(box => {
    let g = '<circle cx="50" cy="50" r="7" fill="#000"/>';
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2, len = 10 + rnd() * 38, r = len + 4;
      const x = 50 + Math.cos(a) * len, y = 50 + Math.sin(a) * len;
      const cx = 50 + Math.cos(a + .35) * len * .55, cy = 50 + Math.sin(a + .35) * len * .55;
      g += `<path d="M50 50 Q${cx} ${cy} ${x} ${y}" stroke="#000" stroke-width="${.3 + rnd() * .7}" fill="none"/><circle cx="${x}" cy="${y}" r="${.7 + rnd() * 1.9}" fill="#000"/>`;
    }
    box.innerHTML = `<svg viewBox="0 0 100 100">${g}</svg>`;
  });
})();

/* ---------- COLLAGE: parallax con mouse/scroll + stickers arrastrables ---------- */
(() => {
  const lerp = (a, b, t) => a + (b - a) * t;
  const fx = [...document.querySelectorAll('.fx')].map(el => ({
    el, d: +el.dataset.d || 0, s: +el.dataset.s || 0, r: +el.dataset.r || 0, sec: el.closest('section')
  }));
  let mx = 0, my = 0, cx = 0, cy = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  (function loop() {
    const reduce = window.bfReduced();
    cx = lerp(cx, mx, .06); cy = lerp(cy, my, .06);
    for (const f of fx) {
      const r = f.sec.getBoundingClientRect();
      if (r.bottom < -300 || r.top > innerHeight + 300) continue;
      const x = reduce ? 0 : cx * f.d * 2, y = (reduce ? 0 : cy * f.d * 2) + r.top * f.s;
      f.el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${f.r + (reduce ? 0 : cx * f.d * .12)}deg)`;
    }
    requestAnimationFrame(loop);
  })();

  let z = 5;
  document.querySelectorAll('.sticker').forEach(el => {
    let sx = 0, sy = 0, ox = 0, oy = 0, lx = 0, drag = false;
    el.addEventListener('pointerdown', e => {
      drag = true; el.setPointerCapture(e.pointerId); el.classList.add('drag');
      el.style.zIndex = ++z; sx = e.clientX - ox; sy = e.clientY - oy; lx = e.clientX;
    });
    el.addEventListener('pointermove', e => {
      if (!drag) return;
      ox = e.clientX - sx; oy = e.clientY - sy;
      el.style.setProperty('--x', ox + 'px'); el.style.setProperty('--y', oy + 'px');
      el.style.setProperty('--tilt', Math.max(-16, Math.min(16, (e.clientX - lx) * .9)) + 'deg'); lx = e.clientX;
    });
    const end = () => { drag = false; el.classList.remove('drag'); el.style.setProperty('--tilt', '0deg'); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });
})();

/* ---------- contornos irregulares con nodos en las cards ---------- */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const j = a => (rnd() - .5) * 2 * a;
  const addContour = el => {
    if (el.querySelector(':scope > .contour')) return;
    const svg = document.createElementNS(NS, 'svg'); svg.classList.add('contour'); el.appendChild(svg);
    const rs = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()]; // forma fija por card
    const build = () => {
      const w = el.offsetWidth, h = el.offsetHeight, m = 22, o = 12;
      svg.style.left = svg.style.top = -m + 'px';
      svg.setAttribute('width', w + 2 * m); svg.setAttribute('height', h + 2 * m);
      const q = i => (rs[i] - .5) * 2;
      const P = [
        [-o + q(0) * 8, -o + q(1) * 8], [w / 2 + q(2) * 24, -o - 4 + q(3) * 8], [w + o + q(4) * 8, -o + q(5) * 8],
        [w + o + 4 + q(6) * 8, h / 2 + q(7) * 24], [w + o + q(1) * 8, h + o + q(2) * 8], [w / 2 + q(3) * 24, h + o + 4 + q(4) * 8],
        [-o + q(5) * 8, h + o + q(6) * 8], [-o - 4 + q(7) * 8, h / 2 + q(0) * 24]
      ].map(([x, y]) => [x + m, y + m]);
      svg.innerHTML = `<path d="M${P.map(p => p.join(' ')).join(' L')} Z"/>` +
        [1, 3, 5, 7].map(i => `<circle cx="${P[i][0]}" cy="${P[i][1]}" r="7.5"/>`).join('');
    };
    build(); new ResizeObserver(build).observe(el);
  };
  window.bfContour = addContour;   // lo usa tienda.js para las cards de producto
  document.querySelectorAll('.card4, .xcard').forEach(addContour);
})();

/* ---------- MUNDO del cierre: esfera + círculos que se deforman con el mouse ---------- */
(() => {
  const canvas = document.getElementById('globe'), host = canvas.parentElement, ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2), css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let w = 0, h = 0, vis = false, mx = -9999, my = -9999, sx = 0, sy = 0, p = 0;
  const mask = document.createElement('canvas'), mctx = mask.getContext('2d'); // huecos que deja el cursor
  let px = null, py = null; const ER = 200;
  const fit = () => { const r = host.getBoundingClientRect(); w = r.width; h = r.height; canvas.width = mask.width = w * dpr; canvas.height = mask.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit(); new ResizeObserver(fit).observe(host);
  new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(host);
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; });
  addEventListener('pointerdown', e => { mx = e.clientX; my = e.clientY; });
  addEventListener('pointerup', e => { if (e.pointerType === 'touch') mx = my = -9999; });

  requestAnimationFrame(function loop(ms) {
    requestAnimationFrame(loop);
    if (!vis) return;
    const t = window.bfReduced() ? 0 : ms / 1000, r = canvas.getBoundingClientRect();
    const lx = mx - r.left, ly = my - r.top, inside = lx >= 0 && lx <= w && ly >= 0 && ly <= h;
    if (inside) { if (p < .02) { sx = lx; sy = ly; } sx += (lx - sx) * .14; sy += (ly - sy) * .14; }
    p += ((inside ? 1 : 0) - p) * .07;
    // los huecos se rellenan de a poco; donde pasa el cursor, desaparece
    mctx.globalCompositeOperation = 'destination-out'; mctx.fillStyle = 'rgba(0,0,0,.025)'; mctx.fillRect(0, 0, w, h); mctx.globalCompositeOperation = 'source-over';
    if (inside && p > .35) {
      const ax = px === null ? sx : px, ay = py === null ? sy : py, n = Math.max(1, Math.ceil(Math.hypot(sx - ax, sy - ay) / 24));
      for (let i = 1; i <= n; i++) {
        const X = ax + (sx - ax) * i / n, Y = ay + (sy - ay) * i / n, g = mctx.createRadialGradient(X, Y, 0, X, Y, ER);
        g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(.7, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        mctx.fillStyle = g; mctx.fillRect(X - ER, Y - ER, ER * 2, ER * 2);
      }
      px = sx; py = sy;
    } else { px = py = null; }
    const cx = w / 2, cy = h / 2, R = Math.max(150, Math.min(w, h) * .27);
    const warp = (x, y) => {
      const dx = x - sx, dy = y - sy, f = Math.exp(-(dx * dx + dy * dy) / (R * R)) * p;
      // lente: empuja hacia afuera + pequeña onda para que respire
      return [x + dx * f * .55 + Math.sin(y * .01 + t) * 1.2, y + dy * f * .55 + Math.cos(x * .01 + t * .8) * 1.2];
    };
    const path = pts => { pts.forEach(([x, y], i) => { const [a, b] = warp(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); };
    ctx.clearRect(0, 0, w, h);

    // esfera: meridianos y paralelos
    const rx = Math.min(617, w * .43), ry = rx * .63;
    ctx.strokeStyle = css('--line'); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = -6; i <= 6; i++) {
      const pts = []; for (let k = 0; k <= 80; k++) { const a = k / 80 * Math.PI * 2; pts.push([cx + Math.cos(a) * rx * i / 6, cy + Math.sin(a) * ry]); }
      path(pts);
    }
    for (let j = -4; j <= 4; j++) {
      const y0 = j * ry / 4.6, kk = Math.sqrt(1 - (y0 / ry) ** 2), pts = [];
      for (let k = 0; k <= 60; k++) { const u = k / 60; pts.push([cx + (u * 2 - 1) * rx * kk, cy + y0 * (1 + .44 * u * (1 - u))]); }
      path(pts);
    }
    ctx.stroke();

    // círculo sólido y círculo punteado que gira
    const cr = Math.min(350, w * .46);
    const ring = (rad, rot) => { const pts = []; for (let k = 0; k <= 140; k++) { const a = k / 140 * Math.PI * 2 + rot; pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } ctx.beginPath(); path(pts); };
    ctx.strokeStyle = css('--ink'); ctx.lineWidth = 2; ring(cr, 0); ctx.stroke();
    ctx.strokeStyle = css('--violet'); ctx.lineWidth = 2; ctx.setLineDash([7, 9]); ctx.lineDashOffset = -t * 14; ring(cr + 20, 0); ctx.stroke(); ctx.setLineDash([]);
    ctx.globalCompositeOperation = 'destination-out'; ctx.drawImage(mask, 0, 0, w, h); ctx.globalCompositeOperation = 'source-over';
  });
})();


/* ---------- MENÚ de celular y tablet ---------- */
(() => {
  const header = document.querySelector('.header'), btn = document.getElementById('menu');
  if (!btn) return;
  const set = open => { header.classList.toggle('nav-open', open); btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú'); };
  btn.addEventListener('click', () => set(!header.classList.contains('nav-open')));
  document.querySelectorAll('.bf-nav a').forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  addEventListener('resize', () => { if (innerWidth >= 600) set(false); });
})();
