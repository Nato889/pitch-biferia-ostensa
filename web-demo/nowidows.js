/* =====================================================================
   SIN VIUDAS · ningún texto termina con una palabra sola en el último renglón.
   Une la última palabra con la anterior con un espacio que no se parte (nbsp).
   También corre sobre lo que se arma después (tienda, carrito, ventanas de detalle).
   ===================================================================== */
(() => {
  const SEL = 'p,h1,h2,h3,h4,li,figcaption,summary span,.opt p,.tk p,.pbody p,.xcard p,.xcard h3,.dt-desc,.zone p,.ship-note,.ok,.form-check-label,.invalid-feedback,.req-note,.form-text,.faq summary span,.co-order,.tk-bar b';
  const SKIP = '.giant,.words,.hero-title,.glitch,.gs-track,.visually-hidden,.tape-img';
  const NBSP = ' ';
  function fix(el) {
    if (el.closest(SKIP)) return;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 2 });
    let prev = null, last = null, n;
    while ((n = w.nextNode())) { prev = last; last = n; }
    if (!last) return;
    const v = last.nodeValue, t = v.replace(/\s+$/, ''), tail = v.slice(t.length);
    const i = t.lastIndexOf(' '), j = t.lastIndexOf(NBSP);
    if (j > i) return;                                   // ya está unida: no volver a tocarla
    if (i > 0) {
      last.nodeValue = t.slice(0, i) + NBSP + t.slice(i + 1) + tail;
    } else if (i < 0 && prev && /[ ]$/.test(prev.nodeValue)) {
      prev.nodeValue = prev.nodeValue.replace(/ +$/, '') + NBSP;   // palabra suelta dentro de un span
    }
  }
  const run = () => document.querySelectorAll(SEL).forEach(fix);
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; run(); }); })
    .observe(document.body, { childList: true, subtree: true });
  run();
})();
