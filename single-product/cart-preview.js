// =====================================================================
// CARRITO · Rediseño + sugerencias relacionadas (vista previa)
// ---------------------------------------------------------------------
// Pegar en la consola de cualquier página de la tienda.
//  - Encabezado "Tu carrito (N)", productos en tarjetas, envío gratis en verde.
//  - Sección "Completá tu <marca modelo>": productos del mismo vehículo
//    (busca en /search/), primero los complementarios; "+ Agregar" usa el
//    flujo AJAX de la tienda y no saca al cliente de la página.
//  - Total más chico y precio con transferencia grande y en verde.
//  - "INICIAR COMPRA" naranja + línea de confianza.
// =====================================================================

(function spCartRedesign(){
  var modal = document.querySelector('#modal-cart');
  if (!modal) return 'sin carrito';
  document.querySelectorAll('#sp-cartv2-css').forEach(e => e.remove());
  var M = '#modal-cart';
  var css = `
/* ---------- Carrito: base ---------- */
${M}{background:#fafafa!important;font-family:inherit}
${M} .modal-header{display:flex!important;align-items:center;gap:10px;padding:18px 20px!important;margin:0!important;background:#fff;border-bottom:1px solid #eee;font-size:18px!important;font-weight:800!important;letter-spacing:-.01em;color:#111}
${M} .modal-header .modal-close{order:2;margin-left:auto!important;width:34px;height:34px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:#f2f2f2;transition:background .2s}
${M} .modal-header .modal-close:hover{background:#e6e6e6}
${M} .modal-header .modal-close svg{width:14px;height:14px}
.sp-cart-count{display:inline-flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 7px;border-radius:999px;background:#111;color:#fff;font-size:12px;font-weight:700}
${M} .modal-body{padding:0!important}

/* ---------- Productos ---------- */
${M} .js-ajax-cart-list{background:#fff;padding:6px 20px!important;margin:0!important}
${M} .js-cart-item{padding:16px 0!important;margin:0!important;border-bottom:1px solid #f0f0f0;align-items:flex-start!important}
${M} .js-cart-item:last-child{border-bottom:0}
${M} .js-cart-item .col-2{flex:0 0 76px!important;max-width:76px!important;padding:0!important}
${M} .js-cart-item .col-2 img{width:76px;height:76px;object-fit:cover;border-radius:10px!important;background:#f4f4f4;border:1px solid #eee}
${M} .js-cart-item .col-10{flex:1 1 auto!important;max-width:none!important;padding:0 8px 0 14px!important}
${M} .cart-item-name{font-size:14px!important;font-weight:600!important;line-height:1.35!important;margin-bottom:10px!important;color:#111}
${M} .cart-item-name small,${M} .cart-item-name span{color:#888;font-weight:500}
${M} .cart-item-quantity{display:inline-flex!important;align-items:center;border:1px solid #e3e3e3;border-radius:999px;background:#fff;padding:2px 4px}
${M} .cart-item-quantity .btn,${M} .cart-item-quantity button,${M} .cart-item-quantity span[class*="js-cart-quantity-btn"]{width:28px;height:28px;padding:0!important;display:inline-flex;align-items:center;justify-content:center;border-radius:50%}
${M} .cart-item-quantity input{width:30px!important;border:0!important;text-align:center;font-weight:700;background:transparent!important;padding:0!important}
${M} .cart-item-subtotal{font-size:15px!important;font-weight:800!important;color:#111}
${M} .cart-item-delete{flex:0 0 auto!important;max-width:none!important;padding:0!important}
${M} .cart-item-delete .btn{opacity:.45;transition:opacity .2s;padding:4px!important}
${M} .cart-item-delete .btn:hover{opacity:1}

/* ---------- Envío gratis ---------- */
${M} .cart-row:not(.js-ajax-cart-list){padding:0 20px!important;margin:0!important}
${M} .js-ship-free-rest{margin:16px 0 4px!important;padding:12px 14px;background:#eef8f2;border-radius:12px}
${M} .js-ship-free-rest .progress-bar-title-container{font-size:13px;font-weight:600;color:#1f8a4c!important}
${M} .js-ship-free-rest .bar-progress{height:6px!important;border-radius:999px;background:#d6eedf!important;overflow:hidden}
${M} .js-ship-free-rest .bar-progress *{border-radius:999px}

/* ---------- Totales y botón ---------- */
${M} .cart-totals-container{font-size:14px}
${M} .cart-subtotal,${M} .cart-shipping-costs-container{font-size:14px!important;font-weight:500!important;color:#555;margin-bottom:6px!important}
${M} .cart-subtotal-price{color:#111;font-weight:700}
${M} .cart-total{align-items:baseline!important;margin:8px 0 2px!important}
${M} .cart-total-label{font-size:16px!important;font-weight:700!important}
${M} .cart-total-price{font-size:24px!important;font-weight:800!important;letter-spacing:-.01em}
${M} .payment-discount-price-cart-container{display:inline-block;margin-top:2px;padding:4px 10px;border-radius:999px;background:#eef8f2;color:#1f8a4c!important;font-weight:700;font-size:12px!important}
${M} #ajax-cart-submit-div input.btn-primary{height:54px;border:0!important;border-radius:12px!important;background:#ff5a1f!important;color:#fff!important;font-weight:800!important;font-size:15px!important;letter-spacing:.08em;box-shadow:0 8px 20px rgba(255,90,31,.3);transition:transform .15s,background .2s}
${M} #ajax-cart-submit-div input.btn-primary:hover{background:#f04c10!important;transform:translateY(-1px)}
.sp-cart-trust{display:flex;justify-content:center;gap:14px;margin:4px 0 10px;font-size:11px;color:#888;font-weight:600}
.sp-cart-trust span{display:inline-flex;align-items:center;gap:5px}
.sp-cart-trust svg{width:13px;height:13px;stroke:#888}

/* ---------- Sugerencias ---------- */
.sp-sug{background:#fff;margin:10px 0 0;padding:16px 0 18px;border-top:1px solid #eee;border-bottom:1px solid #eee}
.sp-sug-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:0 20px;margin-bottom:12px}
.sp-sug-title{font-size:14px;font-weight:800;color:#111;margin:0}
.sp-sug-sub{font-size:12px;color:#888;margin:2px 0 0}
.sp-sug-nav{display:flex;gap:6px}
.sp-sug-nav button{width:28px;height:28px;border-radius:50%;border:1px solid #e3e3e3;background:#fff;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0}
.sp-sug-nav svg{width:12px;height:12px;stroke:#111}
.sp-sug-track{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding:0 20px 4px;scrollbar-width:none}
.sp-sug-track::-webkit-scrollbar{display:none}
.sp-sug-card{flex:0 0 150px;scroll-snap-align:start;display:flex;flex-direction:column;border:1px solid #eee;border-radius:12px;overflow:hidden;background:#fff;transition:box-shadow .2s,transform .2s}
.sp-sug-card:hover{box-shadow:0 8px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
.sp-sug-img{display:block;aspect-ratio:1/1;background:#f4f4f4}
.sp-sug-img img{width:100%;height:100%;object-fit:cover;display:block}
.sp-sug-body{display:flex;flex-direction:column;gap:4px;padding:9px 10px 10px;flex:1}
.sp-sug-name{font-size:12px;font-weight:600;line-height:1.3;color:#111;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:31px;text-decoration:none!important}
.sp-sug-price{font-size:14px;font-weight:800;color:#111}
.sp-sug-transfer{font-size:11px;color:#1f8a4c;font-weight:600}
.sp-sug-add{margin-top:auto;height:32px;border-radius:8px;border:1.5px solid #111;background:#fff;color:#111;font-size:12px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;transition:background .2s,color .2s}
.sp-sug-add:hover{background:#111;color:#fff}
.sp-sug-add[disabled]{opacity:.6;cursor:default}
.sp-sug-add.ok{border-color:#1f8a4c;background:#1f8a4c;color:#fff}
.sp-sug-skel{flex:0 0 150px;height:236px;border-radius:12px;background:linear-gradient(90deg,#f2f2f2 25%,#e9e9e9 50%,#f2f2f2 75%);background-size:200% 100%;animation:sp-skel 1.2s infinite}
@keyframes sp-skel{to{background-position:-200% 0}}
@media(min-width:768px){.sp-sug-card,.sp-sug-skel{flex-basis:168px}}

/* ---------- Ajustes de layout ---------- */
${M} .js-cart-item{flex-wrap:nowrap!important}
${M} .js-cart-item .col-10{flex:1 1 0!important;min-width:0}
${M} .cart-item-delete{width:auto!important;flex:0 0 28px!important}
${M} .cart-item-quantity{width:auto!important;padding:2px!important}
${M} .cart-item-quantity > .row{flex-wrap:nowrap!important;width:auto!important}
${M} .cart-item-quantity .form-control-container{flex:0 0 32px!important;max-width:32px!important;padding:0!important}
${M} .cart-item-quantity input{width:32px!important;height:28px}
${M} .js-cart-item .col-10 > .w-100{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px}
${M} .cart-item-name{flex:0 0 100%}
${M} .modal-header .modal-close svg{fill:#111!important;color:#111}
.sp-sug-img{padding:10px}
.sp-sug-img img{object-fit:contain!important}
${M} .js-ship-free-rest .ship-free-rest-text,${M} .js-ship-free-rest .ship-free-rest-message,${M} .js-ship-free-rest .js-ship-free-dif{color:#1f8a4c!important;font-weight:700}
${M} .js-ship-free-rest svg{fill:#1f8a4c!important}
${M} .js-ship-free-rest .bar-progress-active{background:#1f8a4c!important;background-image:none!important}
${M} .js-ship-free-rest .bar-progress-check{display:none!important}
${M} [data-store="shipping-calculator"] input{height:44px;border-radius:10px 0 0 10px!important;border-color:#e3e3e3!important}
${M} [data-store="shipping-calculator"] .btn{height:44px;border-radius:0 10px 10px 0!important;font-weight:700;letter-spacing:.06em}
/* ---------- Total chico + transferencia destacada ---------- */
${M} .cart-total{margin:8px 0 6px!important}
${M} .cart-total-label{font-size:15px!important;font-weight:600!important;color:#555}
${M} .cart-total-price{font-size:18px!important;font-weight:700!important;color:#111}
${M} .cart-secondary-total-container{text-align:right;margin-bottom:14px}
${M} .payment-discount-price-cart-container{display:flex!important;flex-wrap:wrap;justify-content:flex-end;align-items:baseline;column-gap:4px;width:100%!important;margin:0!important;padding:12px 14px!important;border-radius:12px!important;background:#eef8f2!important;color:#1f8a4c!important}
${M} .payment-discount-price-cart-container > span:first-child{display:none!important}
${M} .payment-discount-price-cart{flex:0 0 100%;font-size:28px!important;font-weight:800!important;line-height:1.1;letter-spacing:-.01em;color:#1f8a4c!important}
${M} .payment-discount-price-cart-container > span:nth-child(3),${M} .js-payment-discount-name-cart{font-size:13px!important;font-weight:600!important;color:#1f8a4c!important;text-transform:lowercase}
`;
  var st = document.createElement('style'); st.id = 'sp-cartv2-css'; st.textContent = css; document.head.appendChild(st);

  // ---------- Encabezado: "Tu carrito (N)" ----------
  function header() {
    var h = modal.querySelector('.modal-header'); if (!h) return;
    var n = (document.querySelector('.js-cart-widget-amount') || {}).textContent || '';
    var t = h.querySelector('.sp-cart-title');
    if (!t) {
      [...h.childNodes].forEach(function(c){ if (c.nodeType === 3 && c.textContent.trim()) c.textContent = ''; });
      h.querySelectorAll(':scope > :not(.modal-close)').forEach(function(c){ if (!c.classList.contains('sp-cart-title')) c.style.display = 'none'; });
      t = document.createElement('span'); t.className = 'sp-cart-title'; h.insertBefore(t, h.firstChild);
    }
    var th = 'Tu carrito <span class="sp-cart-count">' + n.trim() + '</span>';
    if (t.innerHTML !== th) t.innerHTML = th;
  }

  // ---------- Confianza bajo el botón ----------
  function trust() {
    var sub = modal.querySelector('#ajax-cart-submit-div'); if (!sub || modal.querySelector('.sp-cart-trust')) return;
    var d = document.createElement('div'); d.className = 'sp-cart-trust';
    d.innerHTML = '<span><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>Compra protegida</span>' +
      '<span><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="18.5" cy="18.5" r="2"/></svg>Envíos a todo el país</span>';
    sub.after(d);
  }

  // ---------- Sugerencias relacionadas ----------
  var cache = {};
  var MARCAS = /(Audi|BMW|Mercedes(?:-Benz)?|Volkswagen|VW|Amarok|Golf|Vento|Polo|Scirocco|Toyota|Hilux|Chevrolet|Ford|Peugeot|Fiat|Renault)/i;
  function itemsCarrito() {
    return [...modal.querySelectorAll('.js-cart-item')].map(function(it) {
      var name = ((it.querySelector('.cart-item-name') || {}).textContent || '').replace(/\s+/g, ' ').trim();
      var id = (it.getAttribute('data-store') || '').replace(/\D/g, '');
      return { name: name, id: id };
    });
  }
  function claveVehiculo(name) {
    var m = name.match(MARCAS); if (!m) return null;
    var resto = name.slice(m.index + m[0].length).trim().split(/\s+/)[0] || '';
    var modelo = resto.split('/')[0].replace(/[^\w-]/g, '');
    var marca = m[0].replace(/^VW$/i, 'Volkswagen');
    return { query: (marca + ' ' + modelo).trim(), label: (marca + ' ' + modelo).trim(), marca: marca };
  }
  function tipo(name) { return (name.split(/\s+/)[0] || '').toLowerCase(); }
  function img(u) { return (u || '').replace(/-1024-1024(\.\w+)$/, '-480-0$1'); }

  async function buscar(q) {
    if (cache[q]) return cache[q];
    var html = await fetch('/search/?q=' + encodeURIComponent(q)).then(function(r){ return r.text(); });
    var d = new DOMParser().parseFromString(html, 'text/html');
    var out = [...d.querySelectorAll('.js-item-product')].map(function(it) {
      var vEl = it.querySelector('[data-variants]'); var vars = [];
      try { vars = JSON.parse(vEl.getAttribute('data-variants')); } catch (e) {}
      var v = vars.find(function(x){ return x.available && x.stock && x.stock !== 9999 && x.stock > 0; });
      var a = it.querySelector('a[href*="/productos/"]');
      var nm = ((it.querySelector('.js-item-name, .item-name') || {}).textContent || '').trim();
      return v ? { id: String(v.product_id), v: v, name: nm, url: a ? a.href : '#' } : null;
    }).filter(Boolean);
    cache[q] = out; return out;
  }

  var renderKey = '';
  async function sugerencias() {
    var list = modal.querySelector('.js-ajax-cart-list'); if (!list) return;
    var items = itemsCarrito();
    var sec = modal.querySelector('.sp-sug');
    if (!items.length) { if (sec) sec.remove(); renderKey = ''; return; }
    var ultimo = items[items.length - 1];
    var k = claveVehiculo(ultimo.name);
    var key = items.map(function(i){ return i.id; }).join(',') + '|' + (k ? k.query : '');
    if (key === renderKey && sec) return;
    renderKey = key;
    if (!sec) { sec = document.createElement('div'); sec.className = 'sp-sug'; list.after(sec); }
    var titulo = k ? 'Completá tu ' + k.label : 'También te puede interesar';
    sec.innerHTML = '<div class="sp-sug-head"><div><p class="sp-sug-title">' + titulo + '</p><p class="sp-sug-sub">Accesorios compatibles para sumar a tu pedido</p></div>' +
      '<div class="sp-sug-nav"><button type="button" data-dir="-1" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" data-dir="1" aria-label="Siguiente"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg></button></div></div>' +
      '<div class="sp-sug-track"><div class="sp-sug-skel"></div><div class="sp-sug-skel"></div><div class="sp-sug-skel"></div></div>';
    var enCarrito = items.map(function(i){ return i.id; });
    var tiposCarrito = items.map(function(i){ return tipo(i.name); });
    var res = [];
    try {
      if (k) res = await buscar(k.query);
      if (k && res.filter(function(p){ return enCarrito.indexOf(p.id) < 0; }).length < 3) res = res.concat(await buscar(k.marca));
    } catch (e) {}
    var vistos = {};
    var sug = res.filter(function(p) {
      if (vistos[p.id] || enCarrito.indexOf(p.id) >= 0) return false; vistos[p.id] = 1; return true;
    });
    // Si hay productos del mismo modelo, mostrar solo esos; si no, los de la marca
    var modelo = k ? k.query.split(' ').slice(1).join(' ').toLowerCase() : '';
    var delModelo = modelo ? sug.filter(function(p){ return p.name.toLowerCase().indexOf(modelo) >= 0; }) : [];
    if (delModelo.length) sug = delModelo;
    else if (k) titulo = 'Más accesorios para tu ' + k.marca;
    sec.querySelector('.sp-sug-title').textContent = titulo;
    // primero lo complementario (otro tipo de producto), después el resto
    sug.sort(function(a, b){ return (tiposCarrito.indexOf(tipo(a.name)) >= 0) - (tiposCarrito.indexOf(tipo(b.name)) >= 0); });
    sug = sug.slice(0, 6);
    if (!sug.length) { sec.remove(); return; }
    var track = sec.querySelector('.sp-sug-track');
    track.innerHTML = sug.map(function(p) {
      return '<div class="sp-sug-card" data-pid="' + p.id + '">' +
        '<a class="sp-sug-img" href="' + p.url + '"><img loading="lazy" src="' + img(p.v.image_url) + '" alt=""></a>' +
        '<div class="sp-sug-body"><a class="sp-sug-name" href="' + p.url + '">' + p.name + '</a>' +
        '<span class="sp-sug-price">' + p.v.price_short.replace(/,00$/, '') + '</span>' +
        (p.v.price_with_payment_discount_short ? '<span class="sp-sug-transfer">' + p.v.price_with_payment_discount_short.replace(/,00$/, '') + ' por transferencia</span>' : '') +
        '<button type="button" class="sp-sug-add">+ Agregar</button></div></div>';
    }).join('');
    sec.querySelectorAll('.sp-sug-nav button').forEach(function(b) {
      b.onclick = function(){ track.scrollBy({ left: Number(b.dataset.dir) * 170, behavior: 'smooth' }); };
    });
    sec.querySelectorAll('.sp-sug-card').forEach(function(card) {
      var p = sug.find(function(x){ return x.id === card.dataset.pid; });
      card.querySelector('.sp-sug-add').onclick = function() { agregar(p, this); };
    });
  }

  // Agrega usando el mismo flujo AJAX de la tienda (form .js-product-form)
  function agregar(p, btn) {
    btn.disabled = true; btn.textContent = 'Agregando…';
    var f = document.createElement('form');
    f.className = 'js-product-form'; f.method = 'post'; f.action = '/comprar/'; f.style.display = 'none';
    var html = '<input type="hidden" name="add_to_cart" value="' + p.id + '">';
    ['option0', 'option1', 'option2'].forEach(function(o, i) {
      if (p.v[o]) html += '<input type="hidden" name="variation[' + i + ']" value="' + String(p.v[o]).replace(/"/g, '&quot;') + '">';
    });
    html += '<input type="hidden" name="quantity" value="1"><input type="submit" class="js-addtocart js-prod-submit-form btn btn-primary" value="Agregar">';
    f.innerHTML = html; document.body.appendChild(f);
    f.querySelector('.js-addtocart').click();
    var t0 = Date.now();
    var iv = setInterval(function() {
      var ok = itemsCarrito().some(function(i){ return i.id === p.id; });
      if (ok || Date.now() - t0 > 8000) {
        clearInterval(iv); f.remove();
        btn.textContent = ok ? '✓ Agregado' : 'Reintentar'; btn.classList.toggle('ok', ok); btn.disabled = ok;
      }
    }, 300);
  }

  function refrescar() { header(); trust(); sugerencias(); }
  refrescar();
  if (window.__spCartObs) window.__spCartObs.disconnect();
  var t;
  window.__spCartObs = new MutationObserver(function(muts) {
    if (muts.every(function(m){ return m.target.closest && m.target.closest('.sp-sug, .sp-cart-title, .sp-cart-trust'); })) return;
    clearTimeout(t); t = setTimeout(refrescar, 250);
  });
  window.__spCartObs.observe(modal, { subtree: true, childList: true, characterData: true });
  return 'carrito v2 aplicado';
})()
