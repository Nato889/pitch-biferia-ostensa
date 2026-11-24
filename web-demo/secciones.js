/* =====================================================================
   SECCIONES NUEVAS · detalle de experiencias y espacios, mapa, juego
   ===================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- contenido ---------- */
  const OPCIONES_COMIDA = 'Vegetarianas · Veganas · Sin TACC';
  const XP = $$('.xcard').map(c => ({
    cat: $('small', c).textContent.trim(), title: $('h3', c).textContent.trim(), desc: $('p', c).textContent.trim(),
    img: ($('.img img', c) || {}).src || '', cut: !!$('.img.cut', c), kind: 'xp',
    opts: c.dataset.c === 'comida' ? OPCIONES_COMIDA : ''
  }));
  // texto ampliado de la primera experiencia (según el diseño); las demás conservan su texto
  XP[0].desc += ' Cada propuesta llega con su origen, su receta y su manera de entender la comida.';
  const SP = $$('.space').map(c => ({
    cat: $('small', c).textContent.replace(/^\d+\s*\/\s*/, '').trim(), title: $('h3', c).textContent.trim(), desc: $('p', c).textContent.trim(),
    kind: 'sp', img: ($('.card-img img', c) || {}).src || '', alt: ($('.card-img img', c) || {}).alt || ''
  }));

  /* ---------- ventana de detalle ---------- */
  const dlg = $('#detail');
  let cur = { list: XP, i: 0 };
  function show(list, i) {
    cur = { list, i }; const d = list[i], isXp = d.kind === 'xp';
    $('#dtCrumb').innerHTML = isXp
      ? `<li class="breadcrumb-item"><a href="#inicio" data-close>Inicio</a></li><li class="breadcrumb-item"><a href="#experiencias" data-close>Experiencias</a></li><li class="breadcrumb-item active" aria-current="page">${d.cat}</li>`
      : `<li class="breadcrumb-item"><a href="#inicio" data-close>Inicio</a></li><li class="breadcrumb-item"><a href="#espacios" data-close>Espacios</a></li><li class="breadcrumb-item active" aria-current="page">${d.title}</li>`;
    const img = $('#dtImg');
    img.hidden = !d.img;
    img.className = 'dt-img' + (d.cut ? ' cut' : '') + (isXp ? '' : ' wide3d');
    img.innerHTML = d.img ? `<img src="${d.img}" alt="${isXp ? '' : d.alt}">` : '';
    $('#dtCat').textContent = isXp ? d.cat : `Espacio · ${d.cat}`;
    $('#dtTitle').textContent = d.title; $('#dtDesc').textContent = d.desc;
    $('#dtOpts').hidden = !d.opts; $('#dtOptsV').textContent = d.opts || '';
    $('#dtMap').hidden = !isXp;   // las zonas del mapa son de otra edición: solo se enlaza desde experiencias
    $('#dtNext').textContent = isXp ? 'Ver otra experiencia →' : 'Ver otro espacio →';
    if (!dlg.open) dlg.showModal();
    $('.co-wrap', dlg).scrollTop = 0;
  }
  $$('[data-xp]').forEach(b => b.addEventListener('click', () => show(XP, +b.dataset.xp)));
  $$('[data-sp]').forEach(b => b.addEventListener('click', () => show(SP, +b.dataset.sp)));
  $('#dtX').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });
  $('#dtNext').addEventListener('click', () => show(cur.list, (cur.i + 1) % cur.list.length));
  $('#dtMap').addEventListener('click', () => dlg.close());

  /* ---------- mapa ---------- */
  // El plano se muestra tal cual; las áreas están en el HTML (lista "Áreas de la feria").
  // Cuando estén los pictogramas y sus posiciones, se ubican sobre el plano dentro de #mapbox.

  /* ---------- juego del oso ---------- */
  // Cuando tengas el link del juego, pegalo en data-game-url de la sección #juego (index.html).
  const sec = $('#juego'), go = $('#gameGo');
  const gameUrl = (sec.dataset.gameUrl || '').trim();
  const qr = $('#qrBox');
  if (gameUrl && qr && window.QRCode) {   // QR real hacia el juego (dibujado en la pantalla)
    qr.textContent = ''; qr.classList.add('has-qr');
    new QRCode(qr, { text: gameUrl, width: 100, height: 100, colorDark: '#322e33', colorLight: '#f1ede4', correctLevel: QRCode.CorrectLevel.M });
  }
  go.addEventListener('click', e => {
    const url = (sec.dataset.gameUrl || '').trim();
    if (!url) { e.preventDefault(); window.bfShop && window.bfShop.toast('Pronto vas a poder jugar'); return; }
    e.preventDefault(); window.open(url, '_blank', 'noopener');
  });

  /* hilos de Experiencias: empiezan a extenderse cuando la sección entra en pantalla */
  const th = $('.threads');
  if (th) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { th.classList.add('run'); o.disconnect(); } }, { threshold: .2 }).observe(th);

  /* áreas: al tocar una etiqueta (o su marcador) se selecciona; la etiqueta y su marcador del mapa se vuelven amarillos juntos */
  const chips = $$('.area-list li'), pins = $$('.pic-pin');
  const peers = key => $$(`[data-area="${key}"]`);
  function select(key, el) {
    const same = el.classList.contains('sel');
    $$('.sel').forEach(x => { x.classList.remove('sel'); if (x.matches('li')) x.setAttribute('aria-pressed', 'false'); });
    if (same) return;
    (key ? peers(key) : [el]).forEach(x => { x.classList.add('sel'); if (x.matches('li')) x.setAttribute('aria-pressed', 'true'); });
  }
  chips.concat(pins).forEach(el => {
    const key = el.dataset.area || '';
    ['mouseenter', 'focus'].forEach(t => el.addEventListener(t, () => key && peers(key).forEach(p => p.classList.add('on'))));
    ['mouseleave', 'blur'].forEach(t => el.addEventListener(t, () => key && peers(key).forEach(p => p.classList.remove('on'))));
    // con mouse alcanza con pasar el cursor; el clic solo fija la selección en pantallas táctiles
    el.addEventListener('click', () => { if (!matchMedia('(hover:hover)').matches) select(key, el); });
    if (el.matches('li')) el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!matchMedia('(hover:hover)').matches) select(key, el); } });
  });
})();
