/* =====================================================================
   TIENDA · catálogo, carrito (se guarda en el navegador) y checkout simulado
   ===================================================================== */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = n => '$' + Math.round(n).toLocaleString('es-AR');
  const FREE_FROM = 50000, SHIPPING = 4500;
  const KEY = 'bf-cart-v1', ORDERS = 'bf-orders-v1';

  /* ---------- catálogo (precios de ejemplo) ---------- */
  const PRODUCTS = [
    { id: 'remera', name: 'Remera ACCIONAR', cat: 'indumentaria', price: 32000, img: 'assets/merch/remera.jpg', bg: '#ffffff',
      desc: 'Remera oversize con la estampa ACCIONAR en la espalda.', opt: { label: 'Talle', values: ['S', 'M', 'L', 'XL'] } },
    { id: 'taza', name: 'Taza enlozada', cat: 'accesorios', price: 14500, img: 'assets/merch/taza.jpg', bg: '#ffffff', zoom: 1.12,
      desc: 'Taza enlozada con borde negro y la trama de la grilla.' },
    { id: 'neceser', name: 'Neceser Bioferia', cat: 'accesorios', price: 19800, img: 'assets/merch/neceser.jpg', bg: '#c2c0c1', zoom: 1.32,
      desc: 'Neceser con cierre, estampado con la red de la feria.', opt: { label: 'Modelo', values: ['Rectangular', 'Trapecio'] } },
    { id: 'lapices-cruces', name: 'Lápices · Cruces', cat: 'papeleria', price: 6500, img: 'assets/merch/lapices-cruces.jpg', bg: '#ffffff', zoom: 1.04,
      desc: 'Pack de 4 lápices crema con trama de cruces.' },
    { id: 'lapices-pixeles', name: 'Lápices · Píxeles', cat: 'papeleria', price: 6500, img: 'assets/merch/lapices-pixeles.jpg', bg: '#ffffff', zoom: 1.04,
      desc: 'Pack de 4 lápices con trama de píxeles azules.' },
    { id: 'agenda', name: 'Agenda 2027', cat: 'papeleria', price: 24900, img: 'assets/merch/agenda.jpg', bg: '#ded9df', zoom: 1.12,
      desc: 'Agenda 2027: «Registrá tus huellas».' }
  ];
  const TICKETS = [
    { id: 'tk-general', key: 'general', name: 'Entrada General', price: 20000, ticket: true, tag: 'GEN' },
    { id: 'tk-manija', key: 'manija', name: 'Pack Manija', price: 40000, ticket: true, tag: '3×2' },
    { id: 'tk-tribu', key: 'tribu', name: 'Pack Tribu', price: 60000, ticket: true, tag: '4×3' },
    { id: 'tk-gratis', key: 'gratis', name: 'Entrada gratuita', price: 0, ticket: true, tag: '$0' }
  ];
  const byId = Object.fromEntries([...PRODUCTS, ...TICKETS].map(p => [p.id, p]));
  const PROVINCES = ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];

  /* ---------- estado del carrito ---------- */
  const read = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento: el carrito vive solo en esta visita */ } };
  let cart = read(KEY).filter(i => byId[i.id] && i.qty > 0);
  const save = () => write(KEY, cart);
  const lineKey = (id, v) => id + '|' + (v || '');
  const count = () => cart.reduce((n, i) => n + i.qty, 0);
  const subtotal = () => cart.reduce((n, i) => n + byId[i.id].price * i.qty, 0);
  const isTicket = i => !!byId[i.id].ticket;
  const physical = () => cart.filter(i => !isTicket(i));
  const physSub = () => physical().reduce((n, i) => n + byId[i.id].price * i.qty, 0);
  const hasPhysical = () => physical().length > 0;
  const shippingFor = (_sub, entrega) => { const p = physSub(); return hasPhysical() && entrega === 'domicilio' && p < FREE_FROM ? SHIPPING : 0; };

  /* ---------- catálogo en pantalla ---------- */
  const grid = $('#products'), chips = $$('.shop-chip'), counter = $('#shopCount');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="pcard" data-cat="${p.cat}" data-id="${p.id}">
      <div class="pimg" style="background:${p.bg};--z:${p.zoom || 1}"><img src="${p.img}" alt="${p.name}" loading="lazy" decoding="async"></div>
      <div class="pbody">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        ${p.opt ? `<label class="visually-hidden" for="o-${p.id}">${p.opt.label}</label>
        <select class="form-select" id="o-${p.id}">${p.opt.values.map(v => `<option>${v}</option>`).join('')}</select>` : ''}
        <div class="pfoot"><span class="price">${money(p.price)}</span>
          <button class="bf-btn padd" type="button" data-add="${p.id}" aria-label="Agregar ${p.name} al carrito">Agregar +</button></div>
      </div>
    </article>`).join('');

  // mismo sistema que las otras cards: contorno punteado con nodos, leve inclinación y tilt 3D con el mouse
  $$('.pcard').forEach((card, i) => {
    card.style.setProperty('--r', (i % 2 ? 1.6 : -1.6) + 'deg');
    card.style.setProperty('--y', (i % 3) * 10 + 'px');
    window.bfContour && window.bfContour(card);
    card.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.style.transform = `perspective(800px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) translateY(-12px) scale(1.03)`;
    });
    card.addEventListener('pointerleave', () => card.style.transform = '');
  });

  const applyFilter = f => {
    let n = 0;
    $$('.pcard').forEach(c => { const show = f === 'todo' || c.dataset.cat === f; c.hidden = !show; if (show) n++; });
    counter.textContent = n === 1 ? 'Mostrando 1 producto' : `Mostrando ${n} productos`;
  };
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => { const on = x === ch; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    applyFilter(ch.dataset.f);
    const sc = $('#shopCrumb'); if (sc) sc.textContent = ch.textContent.trim();
  }));
  chips.forEach(x => x.setAttribute('aria-pressed', x.classList.contains('on')));
  applyFilter('todo');

  /* ---------- carrito (panel lateral) ---------- */
  const drawer = $('#drawer'), scrim = $('#scrim'), cartBtn = $('#cartBtn'), badge = $('#cartCount');
  const body = $('#drawerBody'), foot = $('#drawerFoot');
  const page = () => $$('.header, main, .footer');
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement; renderDrawer();
    scrim.hidden = false; drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
    page().forEach(e => e.setAttribute('inert', '')); document.body.classList.add('no-scroll');
    $('#drawerX').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
    page().forEach(e => e.removeAttribute('inert')); document.body.classList.remove('no-scroll');
    (lastFocus && lastFocus.focus) ? lastFocus.focus() : cartBtn.focus();
  }
  cartBtn.addEventListener('click', openDrawer);
  $('#drawerX').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

  function renderBadge() {
    const n = count();
    badge.textContent = n > 99 ? '99+' : n; badge.hidden = n === 0;
    cartBtn.setAttribute('aria-label', n ? `Abrir carrito (${n} ${n === 1 ? 'producto' : 'productos'})` : 'Abrir carrito');
  }

  function renderDrawer() {
    if (!cart.length) {
      body.innerHTML = `<div class="empty"><p>Tu carrito está vacío.</p><p class="muted">Sumá algo del merch y aparece acá.</p></div>`;
      foot.innerHTML = `<button class="bf-btn" type="button" id="dKeep">Ver productos →</button>`;
      $('#dKeep').addEventListener('click', () => { closeDrawer(); location.hash = '#tienda'; });
      return;
    }
    const sub = subtotal(), ps = physSub(), missing = FREE_FROM - ps;
    body.innerHTML = `
      ${hasPhysical() ? `<p class="ship-note">${missing > 0 ? `Te faltan <b>${money(missing)}</b> en merch para el envío gratis a domicilio.` : '¡Tenés <b>envío gratis</b> a domicilio!'}</p>
      <div class="ship-bar" aria-hidden="true"><i style="width:${Math.min(100, ps / FREE_FROM * 100)}%"></i></div>` : '<p class="ship-note">Las entradas te llegan por email.</p>'}
      <ul class="items">${cart.map(i => { const p = byId[i.id]; return `
        <li class="ci" data-k="${lineKey(i.id, i.v)}">
          <div class="ci-img" style="background:${p.bg || 'var(--yellow)'}">${p.img ? `<img src="${p.img}" alt="">` : `<span class="ci-tk">${p.tag}</span>`}</div>
          <div class="ci-main"><b>${p.name}</b>${i.v ? `<small>${p.opt.label}: ${i.v}</small>` : ''}
            <div class="qty" role="group" aria-label="Cantidad de ${p.name}">
              <button type="button" data-q="-1" aria-label="Quitar una unidad">−</button><span aria-live="polite">${i.qty}</span><button type="button" data-q="1" aria-label="Sumar una unidad">+</button>
            </div></div>
          <div class="ci-side"><span class="price">${money(p.price * i.qty)}</span><button type="button" class="ci-rm" data-rm aria-label="Eliminar ${p.name}">Eliminar</button></div>
        </li>`; }).join('')}</ul>`;
    foot.innerHTML = `
      <div class="row-sum"><span>Subtotal</span><b>${money(sub)}</b></div>
      <p class="muted small-note">El envío se calcula al finalizar la compra.</p>
      <button class="bf-btn" type="button" id="dBuy">Finalizar compra →</button>
      <button class="link-btn" type="button" id="dClear">Vaciar carrito</button>`;
    $('#dBuy').addEventListener('click', () => { closeDrawer(); openCheckout(); });
    $('#dClear').addEventListener('click', () => { cart = []; save(); update(); });
  }
  body.addEventListener('click', e => {
    const li = e.target.closest('.ci'); if (!li) return;
    const item = cart.find(i => lineKey(i.id, i.v) === li.dataset.k); if (!item) return;
    const q = e.target.closest('[data-q]');
    if (q) { item.qty += +q.dataset.q; if (item.qty < 1) cart = cart.filter(i => i !== item); }
    else if (e.target.closest('[data-rm]')) cart = cart.filter(i => i !== item);
    else return;
    save(); update();
  });

  let update = function () { renderBadge(); if (drawer.classList.contains('open')) renderDrawer(); };

  /* ---------- agregar al carrito ---------- */
  const toast = $('#toast'), toastMsg = $('#toastMsg'); let tT;
  const showToast = msg => { toastMsg.textContent = msg; toast.hidden = false; clearTimeout(tT); tT = setTimeout(() => toast.hidden = true, 3500); };
  $('#toastGo').addEventListener('click', () => { toast.hidden = true; openDrawer(); });

  grid.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const p = byId[b.dataset.add], sel = $('#o-' + p.id), v = sel ? sel.value : '';
    const line = cart.find(i => lineKey(i.id, i.v) === lineKey(p.id, v));
    line ? line.qty++ : cart.push({ id: p.id, v, qty: 1 });
    save(); update();
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    showToast(`${p.name}${v ? ` (${v})` : ''} agregado al carrito`);
  });

  /* ---------- checkout simulado ---------- */
  const dlg = $('#checkout'), form = $('#coForm'), done = $('#coDone');
  const dom = $('#coDomicilio'), domReq = ['#c-calle', '#c-ciudad', '#c-cp', '#c-prov'].map(s => $(s));
  const prov = $('#c-prov');
  prov.innerHTML = '<option value="" selected disabled>Elegí una provincia</option>' + PROVINCES.map(p => `<option>${p}</option>`).join('');
  const entrega = () => (hasPhysical() ? (form.elements.entrega.value || 'retiro') : 'retiro');

  function summaryHTML() {
    const sub = subtotal(), ship = shippingFor(sub, entrega());
    return `<ul class="co-items">${cart.map(i => { const p = byId[i.id]; return `<li><span>${i.qty} × ${p.name}${i.v ? ` <small>(${i.v})</small>` : ''}</span><b>${money(p.price * i.qty)}</b></li>`; }).join('')}</ul>
      <div class="row-sum"><span>Subtotal</span><b>${money(sub)}</b></div>
      <div class="row-sum"><span>Envío</span><b>${ship ? money(ship) : 'Gratis'}</b></div>
      <div class="row-sum total"><span>Total</span><b>${money(sub + ship)}</b></div>`;
  }
  const syncCheckout = () => {
    const phys = hasPhysical(), dom_on = entrega() === 'domicilio';
    $('#coEntrega').hidden = !phys; $('#coTicketNote').hidden = !cart.some(isTicket);
    dom.hidden = !dom_on;
    domReq.forEach(el => { el.required = dom_on; });
    $('#coSummary').innerHTML = summaryHTML();
  };
  form.addEventListener('change', e => { if (e.target.name === 'entrega') syncCheckout(); });

  function openCheckout() {
    if (!cart.length) return;
    form.hidden = false; done.hidden = true; $('#coErr').hidden = true;
    form.classList.remove('was-validated'); syncCheckout();
    dlg.showModal();
  }
  $('#coX').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $('#coAgain').addEventListener('click', () => { dlg.close(); location.hash = '#tienda'; });

  form.addEventListener('submit', e => {
    e.preventDefault(); form.classList.add('was-validated');
    if (!form.checkValidity()) { const bad = form.querySelector(':invalid'); bad && bad.focus(); return; }
    const sub = subtotal(), ship = shippingFor(sub, entrega());
    const num = `BF-2027-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const fd = new FormData(form);
    const order = { num, fecha: new Date().toISOString(), cliente: `${fd.get('nombre')} ${fd.get('apellido')}`, email: fd.get('email'),
      entrega: entrega(), pago: fd.get('pago'), items: cart.map(i => ({ ...i, nombre: byId[i.id].name, precio: byId[i.id].price })), subtotal: sub, envio: ship, total: sub + ship };
    write(ORDERS, [...read(ORDERS), order]);
    $('#coNum').textContent = num;
    const parts = [`Te enviamos el detalle a ${fd.get('email')}.`];
    if (cart.some(isTicket)) parts.push('Tus entradas llegan por email.');
    if (hasPhysical()) parts.push(entrega() === 'retiro' ? 'Retirás tu merch en la feria.' : `Mandamos tu merch a ${fd.get('calle')}, ${fd.get('ciudad')}.`);
    $('#coMsg').textContent = parts.join(' ');
    $('#coFinal').innerHTML = summaryHTML();
    cart = []; save(); update();
    form.reset(); form.hidden = true; done.hidden = false; done.focus();
  });

  /* ---------- sección Entradas: usa el mismo carrito ---------- */
  const tkCount = $('#tkCount'), tkTotal = $('#tkTotal');
  function renderTickets() {
    if (!tkCount) return;
    const ts = cart.filter(isTicket), n = ts.reduce((a, i) => a + i.qty, 0), tot = ts.reduce((a, i) => a + byId[i.id].price * i.qty, 0);
    tkCount.textContent = n === 1 ? '1 entrada' : `${n} entradas`; tkTotal.textContent = money(tot);
  }
  const baseUpdate = update;
  update = () => { baseUpdate(); renderTickets(); };
  $$('[data-ticket]').forEach(b => b.addEventListener('click', () => {
    const p = byId['tk-' + b.dataset.ticket], line = cart.find(i => i.id === p.id);
    line ? line.qty++ : cart.push({ id: p.id, v: '', qty: 1 });
    save(); update();
    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
    showToast(`${p.name} agregada al carrito`);
  }));
  $('#tkGo') && $('#tkGo').addEventListener('click', () => {
    if (!cart.length) return showToast('Elegí una entrada para continuar');
    openCheckout();
  });
  window.bfShop = { toast: showToast };
  renderTickets();
  renderBadge();
})();
