// =====================================================================
// SINGLE PRODUCT · Rediseño de la página de producto (vista previa)
// ---------------------------------------------------------------------
// Script de vista previa para probar en vivo sobre rapaimports.com
// (navegador integrado / consola). NO está conectado a producción.
//
// Qué hace en la página de producto:
//  - Quita el breadcrumb y pone estrellas + calificación arriba del título.
//  - Título más chico; precio pegado al título y con peso 600.
//  - "AHORRA 25%" cerca de la caja de transferencia sin tapar su subrayado.
//  - Cantidad (− +) y "Agregar al carrito" fijos abajo, botón naranja.
//    (No aplica a productos por encargo: ahí no hay botón de carrito.)
//  - Al agregar al carrito se abre el carrito real a ~60% del ancho
//    (330px en celular), entra de derecha a izquierda y al cerrarse
//    deja al cliente donde estaba. El ícono del carrito no cambia.
//
// Uso: pegar el contenido en la consola estando en una página de producto.
// Una vez aprobado, pasar el CSS a style.css y la lógica a script.js.
// =====================================================================

(function(){
  var info = document.querySelector('#single-product [data-store^="product-info"]');
  if (!info) return 'no es página de producto';
  document.querySelectorAll('#sp2-preview-css').forEach(e => e.remove());
  document.body.classList.add('sp-v3');
  var B = 'body.sp-v3 #single-product';
  var F = 'body.sp-v3:not(.producto-encargo) #single-product #product_form .form-row.mb-2:has(.js-addtocart)';
  var css = `
/* Sin breadcrumb */
${B} .breadcrumbs{display:none!important}
${B} .page-header{margin-bottom:6px!important}
/* Estrellas + calificación arriba del título */
${B} .page-header .rapa-reviews-row{display:flex!important;margin:0 0 6px!important}
/* Título más chico */
${B} .js-product-name{font-size:21px!important;line-height:1.25!important;font-weight:600!important}
@media(min-width:768px){${B} .js-product-name{font-size:26px!important}}
/* Precio más pegado y más grueso */
${B} .js-price-container{margin-bottom:10px!important}
${B} #price_display{font-weight:600!important;font-size:28px!important;line-height:1.1!important}
${B} #compare_price_display{font-weight:600!important}
${B} .js-payment-discount-price-product{font-weight:600!important}
${B} .js-price-container{row-gap:6px!important}
${B} .rapa-ahorra-texto{top:0!important}
${B} .js-rapa-ahorra{margin:10px 0 0!important;height:auto!important;padding-bottom:2px}
/* Resto igual, solo más compacto */
${B} .js-cuotas-encargo-row{margin-bottom:10px!important}
${B} .js-free-shipping-minimum-message{margin-bottom:10px!important}
/* Carrito fijo abajo con + y - (no aplica a productos por encargo) */
${F}{position:fixed;left:0;right:0;bottom:0;z-index:1000;margin:0!important;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -6px 20px rgba(0,0,0,.12);display:flex;flex-wrap:nowrap;align-items:center;gap:10px}
${F} > .col-4{width:118px!important;flex:0 0 118px!important;max-width:none;padding:0}
${F} > .col-8{flex:1 1 auto;max-width:none;padding:0!important}
${F} > .col-12{position:absolute;left:12px;right:12px;bottom:100%;width:auto;flex:none;padding:0}
${F} .form-group{margin:0}
${F} .form-quantity{height:50px;border-radius:10px}
${F} .js-quantity{width:100%}
${F} .js-addtocart{margin:0!important}
${B} .js-addtocart.btn-primary{width:100%;height:50px;border:0!important;border-radius:10px!important;background:#ff5a1f!important;color:#fff!important;font-weight:800!important;font-size:15px!important;letter-spacing:.06em;box-shadow:0 6px 16px rgba(255,90,31,.35)}
${B} .js-addtocart.btn-primary:hover{background:#f04c10!important}
body.sp-v3:not(.producto-encargo){padding-bottom:84px}
body.sp-v3:not(.producto-encargo) .js-btn-fixed-bottom.btn-whatsapp{bottom:88px!important}
@media(min-width:768px){${F}{padding-left:max(12px,calc((100vw - 1110px)/2));padding-right:max(12px,calc((100vw - 1110px)/2))}}
`;
  var st = document.createElement('style'); st.id = 'sp2-preview-css'; st.textContent = css; document.head.appendChild(st);

  function moverResenas() {
    var rev = info.querySelector('.js-rapa-reviews-row');
    var h1 = info.querySelector('.js-product-name');
    if (rev && h1 && rev.nextElementSibling !== h1) h1.parentNode.insertBefore(rev, h1);
  }
  moverResenas();
  if (window.__sp2Obs) window.__sp2Obs.disconnect();
  window.__sp2Obs = new MutationObserver(moverResenas);
  window.__sp2Obs.observe(info, { subtree: true, childList: true });

  // ===================================================================
  // Al agregar al carrito: abrir el carrito real a un poco más de la
  // mitad de la pantalla (entra de derecha a izquierda, sale al revés).
  // El ícono del carrito sigue abriéndolo como siempre.
  // ===================================================================
  (function spCartDrawer() {
    document.querySelectorAll('#sp-cart-css').forEach(e => e.remove());
    var css = `
/* El aviso chico ya no se muestra: lo reemplaza el carrito */
body.sp-v3 .js-alert-added-to-cart{display:none!important}
body.sp-v3 .js-added-to-cart-product-message{display:none!important}
/* Carrito parcial */
#modal-cart.sp-partial{width:min(max(60vw,330px),760px)!important;max-width:calc(100vw - 36px)!important;left:auto!important;box-shadow:-18px 0 50px rgba(0,0,0,.28);transition:right .45s cubic-bezier(.2,.8,.2,1)!important}
#modal-cart.sp-partial:not(.modal-show){right:-110%!important}
.js-modal-overlay[data-modal-id="#modal-cart"].sp-partial-ov{background:rgba(0,0,0,.45)!important;cursor:pointer}
`;
    var st = document.createElement('style'); st.id = 'sp-cart-css'; st.textContent = css; document.head.appendChild(st);

    var modal = document.querySelector('#modal-cart');
    var toggle = document.querySelector('.js-toggle-cart');
    var overlay = document.querySelector('.js-modal-overlay[data-modal-id="#modal-cart"]');
    if (!modal || !toggle) return;

    function abrirParcial() {
      if (modal.classList.contains('modal-show')) return;
      modal.classList.add('sp-partial');
      if (overlay) overlay.classList.add('sp-partial-ov');
      toggle.click();
    }
    // Al cerrarse, quitar el modo parcial después de la animación de salida
    new MutationObserver(function() {
      // Limpiar el #hash que deja el carrito para que "atrás" no lo reabra
      if (!modal.classList.contains('modal-show') && location.hash === '#modal-fullscreen-cart') {
        history.replaceState(null, '', location.pathname + location.search);
      }
      if (!modal.classList.contains('modal-show') && modal.classList.contains('sp-partial')) {
        setTimeout(function() {
          if (!modal.classList.contains('modal-show')) {
            modal.classList.remove('sp-partial');
            if (overlay) overlay.classList.remove('sp-partial-ov');
          }
        }, 500);
      }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });

    // Detectar "agregado al carrito" con el aviso de la tienda
    document.querySelectorAll('.js-alert-added-to-cart').forEach(function(n) {
      new MutationObserver(function() {
        if (n.classList.contains('notification-visible')) {
          n.classList.remove('notification-visible'); n.classList.add('notification-hidden');
          abrirParcial();
        }
      }).observe(n, { attributes: true, attributeFilter: ['class'] });
    });
    window.__spAbrirCarritoParcial = abrirParcial;
  })();
  return 'single product v3 aplicado';
})()
