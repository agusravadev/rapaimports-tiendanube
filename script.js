  // Transición fade entre páginas:
  //  - View Transitions nativa para atrás/adelante.
  //  - Prefetch al hover/touchstart para que la página destino ya esté
  //    en caché al hacer click → la View Transition alcanza a ejecutarse
  //    también en navegación adelante (igual que al volver).
  (function() {
    try {
      var s = document.createElement('style');
      s.textContent = [
        '@view-transition { navigation: auto; }',
        '::view-transition-old(root), ::view-transition-new(root) {',
        '  animation-duration: 450ms;',
        '  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);',
        '}'
      ].join('\n');
      document.head.appendChild(s);
    } catch(e) {}

    var prefetched = new Set();

    function isInternalCandidate(link) {
      if (!link || !link.href) return false;
      if (link.target && link.target !== '' && link.target !== '_self') return false;
      if (link.hasAttribute('download')) return false;

      var href = link.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#') return false;
      if (/^(mailto:|tel:|javascript:|whatsapp:)/i.test(href)) return false;

      var url;
      try { url = new URL(link.href, location.href); } catch(_) { return false; }
      if (url.origin !== location.origin) return false;
      if (url.pathname === location.pathname && url.search === location.search) return false;

      // No prefetchear carrito/checkout/cuenta para no disparar acciones server-side
      if (/\/(checkout|cart|carrito|account|admin|api)(\/|$|\?)/i.test(url.pathname)) return false;

      return url.href;
    }

    function prefetch(href) {
      if (prefetched.has(href)) return;
      prefetched.add(href);
      try {
        var l = document.createElement('link');
        l.rel = 'prefetch';
        l.href = href;
        l.as = 'document';
        document.head.appendChild(l);
      } catch(e) {}
    }

    function handleIntent(e) {
      var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!link) return;
      var href = isInternalCandidate(link);
      if (href) prefetch(href);
    }

    // Mobile: el toque inicial nos da ~50-150ms de cabeza antes del click final
    document.addEventListener('touchstart', handleIntent, { capture: true, passive: true });
    // PC: el hover nos da varios cientos de ms antes del click
    document.addEventListener('mouseover', handleIntent, { capture: true, passive: true });
  })();

  // Detección temprana sin parpadeo: si LS.variants ya está disponible y la
  // variante por defecto del detalle es 9999, marcamos body antes del primer
  // paint. El meta tiendanube:stock no sirve para productos con variantes
  // mixtas porque informa la suma de stocks, no la variante seleccionada.
  (function() {
    if (!document.querySelector('#single-product')) return;
    if (typeof LS === 'undefined' || !LS.variants || !LS.variants.length) return;
    var defecto = LS.variants[0];
    if (defecto && Number(defecto.stock) === 9999) {
      document.body.classList.add('producto-encargo');
    }
  })();

  // Detección temprana de categoría "Volantes" (sin parpadeo).
  // Se intenta primero por LS.product.categories (más rápido y robusto si está
  // disponible) y como fallback por el breadcrumb del DOM. Si ninguna fuente
  // está lista al cargar, el MutationObserver de más abajo reintenta.
  function esCategoriaVolante() {
    // 1. Tag del producto (fuente principal): no depende de categorías ni del
    //    breadcrumb, viaja siempre en LS.product.tags sin importar cuántas
    //    categorías tenga el producto ni cuál sea la primaria.
    //    Regla de operación: todo volante debe llevar el tag "volante" en el panel.
    try {
      if (typeof LS !== 'undefined' && LS.product && Array.isArray(LS.product.tags)) {
        var hitTag = LS.product.tags.some(function(t) {
          return String(t).trim().toLowerCase() === 'volante';
        });
        if (hitTag) return true;
      }
    } catch (_) {}
    // 2. Fallback: LS.product.categories (hoy viene undefined en el detalle;
    //    se deja por si Tiendanube lo expone en el futuro).
    try {
      if (typeof LS !== 'undefined' && LS.product && Array.isArray(LS.product.categories)) {
        var hit = LS.product.categories.some(function(c) {
          var nombre = (c && (c.name || c.title)) || '';
          return String(nombre).trim().toLowerCase() === 'volantes';
        });
        if (hit) return true;
      }
    } catch (_) {}
    // 3. Fallback: breadcrumb. Solo detecta si "Volantes" es la categoría
    //    primaria (la única que Tiendanube renderiza en el breadcrumb).
    var bc = document.querySelector('.breadcrumbs, .breadcrumb, nav.breadcrumb, .js-breadcrumb');
    if (bc) {
      var texto = (bc.textContent || '').toLowerCase();
      if (/\bvolantes\b/.test(texto)) return true;
    }
    return false;
  }

  // Idempotente: cambiar body.classList no dispara el MutationObserver
  // (solo escucha childList/subtree, no attributes), así que es seguro.
  function aplicarClaseVolante() {
    if (!document.querySelector('#single-product')) return;
    var es = esCategoriaVolante();
    var ya = document.body.classList.contains('es-volante');
    if (es && !ya) document.body.classList.add('es-volante');
    else if (!es && ya) document.body.classList.remove('es-volante');
  }

  aplicarClaseVolante();

  function initTiendaNubePersonalizado() {
    // 1. Lógica de WhatsApp en descripciones (botones de consulta)
    //    El botón "Encargar" ya no vive en la descripción: se inyecta
    //    dinámicamente desde marcarProductosEncargo / initEncargoDetalle
    //    según la variante seleccionada. Acá solo manejamos los botones
    //    de consulta (.wa-btn y links wa.me en .product-description).
    var nombre = (document.querySelector('meta[property="og:title"]') || {}).content || document.title || 'este producto';
    var url = (document.querySelector('link[rel="canonical"]') || {}).href || (document.querySelector('meta[property="og:url"]') || {}).content || window.location.href;

    var mensajeConsultar = 'Hola Rapa Imports! Tengo una consulta sobre el producto *' + nombre + '* que vi en: ' + url;
    var hrefConsulta = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensajeConsultar);

    document.querySelectorAll('.wa-btn, #single-product .product-description a[href*="wa.me"]').forEach(function(btn) {
      btn.href = hrefConsulta;
    });

    // Botón flotante de WhatsApp (fixed bottom): mensaje por defecto genérico
    var mensajeFixed = 'Hola Rapa Imports, queria hacerte una consulta...';
    document.querySelectorAll('.js-btn-fixed-bottom.btn-whatsapp, a.btn-whatsapp[href^="https://wa.me/"]:not(.wa-btn)').forEach(function(btn) {
      if (btn.closest('#single-product .product-description')) return;
      btn.href = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensajeFixed);
    });

    // 2. Lógica para "incluso en este producto" en página de producto
    function revisarEnvioGratis() {
      var contenedores = document.querySelectorAll('.free-shipping-message, .js-product-form-free-shipping-message');
      contenedores.forEach(function(contenedor) {
        var textoVisible = contenedor.innerText.toLowerCase();
        var agregado = contenedor.querySelector('.js-incluso-en-este-producto');
        if (textoVisible.includes('gratis') && !textoVisible.includes('superando') && !textoVisible.includes('más de')) {
          if (!agregado) {
            var spanNuevo = document.createElement('span');
            spanNuevo.className = 'js-incluso-en-este-producto';
            spanNuevo.style.fontWeight = '400';
            spanNuevo.style.color = 'inherit';
            spanNuevo.innerText =' incluido en este producto';
            var textoFuerte = contenedor.querySelector('.text-accent');
            if (textoFuerte) {
              textoFuerte.insertAdjacentElement('afterend', spanNuevo);
            }
          }
        } else {
          if (agregado) { agregado.remove(); }
        }
      });
    }

    // 2b. Precio con transferencia — inyectar badge en cards del listado
    function initTransferSavings() {
      document.querySelectorAll('.item-product .js-payment-discount-price-product-container').forEach(function(container) {
        if (container.querySelector('.transfer-badge')) return; // ya procesado

        var precioSpan = container.querySelector('.js-payment-discount-price-product');
        var metodoSpan = container.querySelector('.js-payment-discount-name-product');
        if (!precioSpan || !metodoSpan) return;

        // Ocultar el span "con" literal
        container.querySelectorAll(':scope > span').forEach(function(span) {
          if (span.textContent.trim() === 'con') {
            span.classList.add('transfer-con-hidden');
          }
        });

        // Fila superior: solo método (badge va absoluto en esquina)
        var topRow = document.createElement('div');
        topRow.className = 'transfer-top-row';
        topRow.appendChild(metodoSpan);
        container.insertBefore(topRow, precioSpan);

        // Badge absoluto — esquina superior derecha del contenedor
        var badge = document.createElement('span');
        badge.className = 'transfer-badge';
        badge.textContent = '25% OFF';
        container.appendChild(badge);
      });
    }

    // 3. Badge "por encargo" reactivo en cards del listado
    //    La señal "encargo" depende de la variante seleccionada en el swatch,
    //    no del producto. Si ninguna variante es 9999, no se toca la card.
    //    Si alguna lo es, se instala un listener en los swatches y se evalúa
    //    el estado cada vez que cambia la selección.
    function marcarProductosEncargo() {
      if (document.querySelector('#single-product')) return;

      document.querySelectorAll('.item-product').forEach(function(item) {
        var container = item.querySelector('.js-quickshop-container[data-variants]');
        if (!container) return;

        var variantes;
        try {
          variantes = JSON.parse(container.getAttribute('data-variants'));
        } catch (e) { return; }
        if (!variantes || !variantes.length) return;

        var anyEncargo = variantes.some(function(v) { return Number(v.stock) === 9999; });
        if (!anyEncargo) return;

        function variantePorOption(option) {
          if (option != null) {
            var match = variantes.find(function(v) { return String(v.option0) === String(option); });
            if (match) return match;
          }
          return variantes[0];
        }

        function getVarianteActiva() {
          // El bullet activo se marca con .selected al hacer click.
          // En carga inicial nada está .selected → defaulteamos a la
          // primera variante (que es la que Tiendanube muestra como default).
          var activo = item.querySelector('.js-color-variant.item-colors-bullet.selected');
          if (activo && activo.dataset.option) return variantePorOption(activo.dataset.option);
          return variantes[0];
        }

        function construirBtnEncargar() {
          var linkEl = item.querySelector('a.btn-secondary');
          var url = linkEl ? linkEl.href : window.location.href;
          var nameEl = item.querySelector('.js-item-name');
          var nombre = nameEl ? nameEl.innerText.trim() : 'este producto';
          var mensaje = 'Hola Rapa Imports! Quiero encargar el producto *' + nombre + '* que vi en: ' + url + ' ¿Me podés dar más info?';
          var waUrl = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensaje);

          var insertionPoint = item.querySelector('.js-item-buy-open') || item.querySelector('a.btn-secondary');
          if (!insertionPoint) return;
          var colDiv = insertionPoint.parentNode;
          var rowDiv = colDiv && colDiv.parentNode;

          var esVolanteCard = item.classList.contains('item-volante');

          var btn = document.createElement('a');
          if (esVolanteCard) {
            btn.href = url.split('#')[0] + '#personalizacion';
            btn.className = 'btn btn-primary btn-small btn-encargar btn-personalizar';
            btn.textContent = 'Personalizar';
          } else {
            btn.href = waUrl;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
            btn.className = 'btn btn-primary btn-small btn-encargar';
            btn.textContent = 'Encargar';
          }

          if (rowDiv && rowDiv !== item && rowDiv.parentNode) {
            rowDiv.parentNode.insertBefore(btn, rowDiv);
            rowDiv.style.setProperty('display', 'none', 'important');
            btn.dataset.rowHidden = '1';
          } else {
            colDiv.insertBefore(btn, insertionPoint);
          }
        }

        function quitarBtnEncargar() {
          var btn = item.querySelector('.btn-encargar');
          if (!btn) return;
          if (btn.dataset.rowHidden === '1') {
            var sibling = btn.nextElementSibling;
            if (sibling) sibling.style.removeProperty('display');
          }
          btn.remove();
        }

        function aplicarEstado() {
          var v = getVarianteActiva();
          if (!v) return;
          var esEncargo = Number(v.stock) === 9999;
          // Guard: si nada cambió, salir
          if (item.dataset.encargoEstado === (esEncargo ? '1' : '0')) return;
          item.dataset.encargoEstado = esEncargo ? '1' : '0';

          if (esEncargo) {
            item.classList.add('item-encargo');
            if (!item.querySelector('.btn-encargar')) construirBtnEncargar();
          } else {
            item.classList.remove('item-encargo');
            quitarBtnEncargar();
          }
        }

        // Listener de swatches (idempotente)
        if (!item.dataset.encargoListener) {
          item.dataset.encargoListener = '1';
          item.querySelectorAll('.js-color-variant.item-colors-bullet[data-option]').forEach(function(sw) {
            sw.addEventListener('click', function() {
              // Tiendanube actualiza la clase active de forma síncrona,
              // pero damos un microtask por las dudas.
              setTimeout(aplicarEstado, 30);
            });
          });
        }

        aplicarEstado();
      });
    }

    // 3a-ter. Redirección desde "Comprar" (listado) cuando el producto tiene
    //         variantes nativas de Tiendanube. El popup de quickshop no tiene
    //         espacio para renderizar bien el selector dentro de la card, así
    //         que en vez de abrirlo llevamos al usuario a la ficha del
    //         producto y scrolleamos hasta el selector de variantes.
    //         Interceptamos en fase de captura (tercer parámetro true) para
    //         ganarle al handler nativo de Tiendanube que abre el popup:
    //         la fase de captura corre antes que cualquier listener en
    //         bubble, sin importar el orden de carga de los scripts.
    //         Delegado en document: cubre cards ya presentes y las que
    //         inyecte el paginado/infinite scroll más adelante, sin
    //         necesidad de re-registrar el listener.
    function initRedireccionPersonalizacion() {
      document.addEventListener('click', function(e) {
        var btn = e.target.closest ? e.target.closest('.js-item-buy-open') : null;
        if (!btn) return;
        var item = btn.closest('.item-product');
        if (!item) return;
        var linkEl = item.querySelector('a.item-link, a.js-product-item-image-link-private');
        if (!linkEl || !linkEl.href) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        window.location.href = linkEl.href.split('#')[0] + '#personalizaciones';
      }, true);
    }

    // 3a-bis. Marcar cards de productos de la categoría "Volantes" en
    //         listados. Detección por slug de URL (el listado no expone
    //         la categoría en el HTML de la card). Idempotente.
    function marcarProductosVolanteListado() {
      if (document.querySelector('#single-product')) return;
      var rx = /\/productos\/[^/?#]*volante/i;
      document.querySelectorAll('.item-product').forEach(function(item) {
        if (item.dataset.volanteMarcado === '1') return;
        var link = item.querySelector('a.js-product-item-image-link-private, a.item-link');
        var href = link ? link.getAttribute('href') || '' : '';
        if (rx.test(href)) {
          item.classList.add('item-volante');
          item.dataset.volanteMarcado = '1';
        }
      });
    }

    // 3b. Encargo reactivo en página de detalle (#single-product)
    //     Inyecta/quita un botón "Encargar" en la zona de compra y togglea
    //     body.producto-encargo según la variante seleccionada.
    function initEncargoDetalle() {
      var single = document.querySelector('#single-product');
      if (!single) return;
      if (typeof LS === 'undefined' || !LS.variants || !LS.variants.length) return;

      function variantePorOption(option) {
        if (option != null) {
          var match = LS.variants.find(function(v) { return String(v.option0) === String(option); });
          if (match) return match;
        }
        return LS.variants[0];
      }

      function getVarianteActiva() {
        var activo = single.querySelector('.js-insta-variant.selected');
        if (activo && activo.dataset.option) return variantePorOption(activo.dataset.option);
        return LS.variants[0];
      }

      function ensureBtnEncargar() {
        if (single.querySelector('.btn-encargar-detalle')) return;
        var buyBtn = single.querySelector('[data-store="product-buy-button"], .js-addtocart:not(.js-addtocart-placeholder)');
        if (!buyBtn) return;
        var parent = buyBtn.parentElement;
        if (!parent) return;

        var nombre = (document.querySelector('meta[property="og:title"]') || {}).content || document.title || 'este producto';
        var url = (document.querySelector('link[rel="canonical"]') || {}).href || (document.querySelector('meta[property="og:url"]') || {}).content || window.location.href;
        var mensaje = 'Hola Rapa Imports! Quiero encargar el producto *' + nombre + '* que vi en: ' + url + ' ¿Me podés dar más info?';

        var btn = document.createElement('a');
        btn.href = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensaje);
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        // Imita layout de Agregar al carrito (btn-block + mb-4) para que
        // ocupe el mismo espacio. mt-3 da separación contra el bloque de
        // envío gratis en productos sin variantes.
        btn.className = 'btn btn-primary btn-block mt-3 mb-4 btn-encargar btn-encargar-detalle';
        btn.innerHTML =
          '<svg viewBox="0 0 448 512" width="18" height="18" fill="currentColor" aria-hidden="true">' +
            '<path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>' +
          '</svg>' +
          '<span>Encargar ahora</span>';
        // En volantes, el botón Encargar va inmediatamente debajo de
        // "Cotizar volante" (al final del bloque de personalización).
        var esVolante = document.body.classList.contains('es-volante');
        var cotizar = esVolante ? single.querySelector('.btn-cotizar-volante') : null;
        if (cotizar && cotizar.parentNode) {
          cotizar.parentNode.insertBefore(btn, cotizar.nextSibling);
        } else {
          parent.appendChild(btn);
        }

        // En volantes, regenerar el href en cada click para reflejar la
        // selección actual + el total calculado en vivo.
        if (esVolante) {
          btn.addEventListener('click', function() {
            var section = single.querySelector('.volante-personalizacion');
            if (!section) return;
            var seleccion = [];
            section.querySelectorAll('.volante-personalizacion__eje').forEach(function(eje) {
              // El título visible ya incluye la opción ("GRIP: Cuero liso").
              // Usar el nombre del eje para no repetirla en el mensaje.
              var ejeLabel = (eje.getAttribute('data-eje-label') || '').trim();
              var activa = eje.querySelector('.volante-card.is-active');
              var opcionLabel = activa ? (activa.getAttribute('data-label') || activa.textContent || '').trim() : '';
              if (ejeLabel && opcionLabel) {
                seleccion.push('- ' + ejeLabel + ': ' + opcionLabel);
              }
            });
            var total = calcularTotalVolante(section);
            var totalLine = (total != null) ? ('Total = $' + formatearMontoVolante(total) + ' USD') : '';

            var msg = 'Hola Rapa Imports! Quiero encargar el producto *' + nombre + '* que vi en: ' + url + '\n\n' +
                      'Personalizaciones elegidas:\n' + seleccion.join('\n') + '\n\n' +
                      (totalLine ? (totalLine + '\n\n') : '') +
                      '¿Me podés dar más info?';
            btn.href = 'https://wa.me/542364626266?text=' + encodeURIComponent(msg);
          }, true); // captura: corre antes de que el navegador siga el link
        }
      }

      function quitarBtnEncargar() {
        var btn = single.querySelector('.btn-encargar-detalle');
        if (btn) btn.remove();
      }

      function aplicarEstado() {
        var v = getVarianteActiva();
        if (!v) return;
        var esEncargo = Number(v.stock) === 9999;
        if (single.dataset.encargoEstado === (esEncargo ? '1' : '0')) return;
        single.dataset.encargoEstado = esEncargo ? '1' : '0';

        if (esEncargo) {
          document.body.classList.add('producto-encargo');
          ensureBtnEncargar();
        } else {
          document.body.classList.remove('producto-encargo');
          quitarBtnEncargar();
        }
        // Recalcular row de "3 cuotas sin interés" después del toggle de clase
        initCuotasEncargo();
      }

      // Listeners (idempotentes)
      if (!single.dataset.encargoListener) {
        single.dataset.encargoListener = '1';
        single.querySelectorAll('.js-insta-variant').forEach(function(sw) {
          sw.addEventListener('click', function() { setTimeout(aplicarEstado, 30); });
        });
        var sel = single.querySelector('.js-variation-option');
        if (sel) sel.addEventListener('change', function() { setTimeout(aplicarEstado, 30); });
      }

      aplicarEstado();
    }

    // 3b-bis. Scroll al selector de variantes nativas en la ficha de producto
    //         cuando se llega con #personalizaciones (ver
    //         initRedireccionPersonalizacion). El header sticky (.js-head-main)
    //         cambia de alto según cuánto se scrolleó la página (se achica al
    //         pasar cierto umbral, clase .compress) — un offset fijo queda mal
    //         según en qué estado esté el header al aterrizar. Medimos su alto
    //         real en el momento del scroll en vez de hardcodear un número.
    function initScrollPersonalizacionesDetalle() {
      if (window.location.hash !== '#personalizaciones') return;
      var single = document.querySelector('#single-product');
      if (!single) return;
      var target = single.querySelector('.js-product-variants');
      if (!target) return;
      setTimeout(function() {
        var header = document.querySelector('.js-head-main');
        var headerH = header ? header.getBoundingClientRect().height : 160;
        var offset = headerH + 250;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      }, 150);
    }

    // 3c. Cuotas reactivas en página de detalle — reemplaza el widget de pagos
    //     original (que mostraba la cuota máxima, ej "24 cuotas de $X") por un
    //     row custom "3 cuotas de $X · Ver más detalles" cuando la variante activa
    //     es por encargo. Fuente: primera fila tr.js-payment-provider-installments-row
    //     del modal #info-payment-method-credit_card con amount===3 (planilla por
    //     defecto que Tiendanube calcula para todo producto). El link "Ver más
    //     detalles" dispara el mismo modal nativo de Tiendanube vía data-toggle.
    //     Anclaje: justo antes del bloque de envío gratis (o, si no existe, al
    //     final del #single-product). NO se inserta dentro de .price-container
    //     porque ese contenedor usa flexbox con order custom y rompe la posición.
    //     Si no encuentra ninguna fila de 3 cuotas, no inserta nada.
    function initCuotasEncargo() {
      var single = document.querySelector('#single-product');
      if (!single) return;

      // Quitar row previo si existe (re-evaluación por cambio de variante)
      var existing = single.querySelector('.js-cuotas-encargo-row');
      if (existing) existing.remove();

      // Buscar la primera fila de 3 cuotas en el modal de pagos
      var precio3cuotas = null;
      var rows = document.querySelectorAll(
        '#info-payment-method-credit_card tr.js-payment-provider-installments-row'
      );
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var amountEl = row.querySelector('.js-installment-amount');
        if (!amountEl) continue;
        if (parseInt(amountEl.textContent, 10) !== 3) continue;
        var priceEl = row.querySelector('.js-installment-price');
        if (!priceEl) continue;
        precio3cuotas = priceEl.textContent.trim();
        break;
      }

      if (!precio3cuotas) return;

      // Anclaje preferido: el bloque de envío gratis. Insertamos ANTES.
      // Fallback: el contenedor .price-container — insertamos como hermano
      // posterior (fuera del flex container del precio).
      var newRow = document.createElement('div');
      newRow.className = 'js-cuotas-encargo-row cuotas-encargo-row';
      newRow.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
          '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/>' +
        '</svg>' +
        '<span><strong>3</strong> cuotas de <strong>' + precio3cuotas + '</strong></span>' +
        '<a href="javascript:void(0)" class="js-cuotas-encargo-vermas cuotas-encargo-vermas">' +
          'Ver más detalles' +
        '</a>';

      // Delegar el click de "Ver más detalles" al botón nativo de Tiendanube
      // (#btn-installments es el que dispara el modal fullscreen de cuotas).
      var vermas = newRow.querySelector('.js-cuotas-encargo-vermas');
      if (vermas) {
        vermas.addEventListener('click', function(e) {
          e.preventDefault();
          var nativo = document.getElementById('btn-installments') ||
                       single.querySelector('.js-product-payments-container');
          if (nativo) nativo.click();
        });
      }

      var shipping = single.querySelector('.js-product-form-free-shipping-message, .free-shipping-message');
      if (shipping && shipping.parentNode) {
        shipping.parentNode.insertBefore(newRow, shipping);
        return;
      }

      var priceContainer = single.querySelector('.price-container');
      if (priceContainer && priceContainer.parentNode) {
        if (priceContainer.nextSibling) {
          priceContainer.parentNode.insertBefore(newRow, priceContainer.nextSibling);
        } else {
          priceContainer.parentNode.appendChild(newRow);
        }
        return;
      }
    }

    // 4. "AHORRAS $xxx" debajo del bloque transferencia en página de producto
    function initTransferSavingsProduct() {
      var single = document.querySelector('#single-product');
      if (!single) return;

      // Remover label anterior si existe (para re-ejecución por cambio de variante)
      var old = single.querySelector('.js-transfer-savings-label');
      if (old) old.remove();

      var container = single.querySelector('.payment-discount-price-product-container');
      if (!container) return;

      var precioTransSpan = container.querySelector('.js-payment-discount-price-product[data-priceraw-without-shipping]');
      var precioRegSpan   = single.querySelector('.js-price-display[data-product-price]');
      if (!precioTransSpan || !precioRegSpan) return;

      var transRaw = parseInt(precioTransSpan.getAttribute('data-priceraw-without-shipping'), 10);
      var regRaw   = parseInt(precioRegSpan.getAttribute('data-product-price'), 10);
      if (!transRaw || !regRaw || transRaw >= regRaw) return;

      var ahorro = Math.round((regRaw - transRaw) / 100);
      var ahorroFmt = ahorro.toLocaleString('es-AR');

      var label = document.createElement('p');
      label.className = 'js-transfer-savings-label transfer-savings-label';
      label.innerHTML = 'AHORRAS <strong>$' + ahorroFmt + '</strong>';
      container.appendChild(label);
    }

    // === Volantes: personalización con cálculo de precio ===

    // Lee el precio principal del detalle (en ARS según Tiendanube, pero
    // numéricamente representa USD por convención de carga del admin).
    function leerPrecioBaseVolante() {
      var single = document.querySelector('#single-product');
      if (!single) return null;
      var span = single.querySelector('.js-price-display[data-product-price]');
      if (!span) return null;
      var raw = parseInt(span.getAttribute('data-product-price'), 10);
      if (!raw) return null;
      // data-product-price viene en centavos (ej: 32000 = $320)
      return raw / 100;
    }

    function formatearMontoVolante(n) {
      // Decimal: sin decimales si es entero, un decimal si tiene fracción.
      var entero = Math.floor(n);
      var fraccion = Math.round((n - entero) * 10) / 10;
      var opts = (fraccion === 0)
        ? { maximumFractionDigits: 0, minimumFractionDigits: 0 }
        : { maximumFractionDigits: 1, minimumFractionDigits: 1 };
      return n.toLocaleString('es-AR', opts);
    }

    function calcularTotalVolante(section) {
      var base = leerPrecioBaseVolante();
      if (base == null) return null;
      var extras = 0;
      section.querySelectorAll('.volante-card.is-active').forEach(function(c) {
        extras += parseFloat(c.getAttribute('data-extra') || '0') || 0;
      });
      return base + extras;
    }

    function escribirPrecioMostrado(monto) {
      var single = document.querySelector('#single-product');
      if (!single) return;
      var span = single.querySelector('.js-price-display[data-product-price]');
      if (!span) return;
      if (monto == null) {
        // Restaurar: re-renderizar desde data-product-price (precio base).
        var raw = parseInt(span.getAttribute('data-product-price'), 10);
        if (!raw) return;
        span.textContent = '$' + formatearMontoVolante(raw / 100);
        return;
      }
      span.textContent = '$' + formatearMontoVolante(monto);
    }

    // Tras cotizar: sube hasta el precio y hace un "flash" del número
    // (blanco instantáneo → vuelve al color original #111827 en ~1s) para
    // llamar la atención sobre el monto recién calculado. La transición vive
    // en la regla base del CSS; .precio-flash corta la transición para que el
    // salto a blanco sea inmediato, y al quitarla la vuelta anima sola.
    // Solo se invoca dentro del bloque de volantes, así que no afecta a
    // ningún otro producto.
    function resaltarPrecioCotizado() {
      var single = document.querySelector('#single-product');
      if (!single) return;
      var priceContainer = single.querySelector('.price-container');
      if (priceContainer) {
        var offset = 274; // distancia deseada del tope del precio al borde superior
        var top = priceContainer.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
      }
      var span = single.querySelector('.js-price-display[data-product-price]');
      if (!span) return;
      // Esperamos a que el scroll suave acerque el precio antes del flash.
      setTimeout(function() {
        span.classList.add('precio-flash');   // salto instantáneo a blanco
        void span.offsetWidth;                 // fuerza reflow
        requestAnimationFrame(function() {
          span.classList.remove('precio-flash'); // transición color → original (1s)
        });
      }, 380);
    }

    // Para asignar imagen a una opción, completá su campo `img` con la URL.
    // Si `img` queda como '', se muestra el placeholder gris a rayas.
    var PERSONALIZACIONES_VOLANTE = [
      {
        id: 'grip',
        label: 'Grip',
        opciones: [
          { id: 'micro',     label: 'Cuero microperforado', extra: 0,    porDefecto: true, img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/6cee7853-a7fe-44d7-b13c-9644c178b0f8-f50e6a88cb88c774fc17813204646935-1024-1024.webp' },
          { id: 'liso',      label: 'Cuero liso',           extra: 0,                       img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/chatgpt-image-jun-13-2026-12_31_41-am-a410351347c1416ccd17813215330909-1024-1024.png' },
          { id: 'alcantara', label: 'Alcantara',            extra: 60.5,                    img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/65d9b6f8-6c64-43dd-9ae4-28836082b31c-e00a0238141e77a16f17813212780847-1024-1024.webp' }
        ]
      },
      {
        id: 'display',
        label: 'Display LED',
        opciones: [
          { id: 'sin', label: 'Sin display LED', extra: 0,   porDefecto: true, img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/321e5119-ae28-43bc-8377-60fed26282d3-e3a0e102c1e5b9924517813235669571-1024-1024.webp' },
          { id: 'con', label: 'Con display LED', extra: 145,                   img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/7ae6a990-7863-4d37-8b54-542cf7d01096-0fea72fab5f5b9efc517813228406613-1024-1024.webp' }
        ]
      },
      {
        id: 'airbag',
        label: 'Cobertor de air-bag',
        opciones: [
          { id: 'original',  label: 'Original',    extra: 0,    porDefecto: true, img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/chatgpt-image-jun-14-2026-12_45_11-am-8ecabe16c0efe34b4617814087203084-1024-1024.webp' },
          { id: 'liso',      label: 'Cuero liso',  extra: 60.5,                   img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/46977cae-1601-41dd-b2ba-108cee83b640-11a3a01e9292f0df5a17813261928089.png' },
          { id: 'alcantara', label: 'Alcantara',   extra: 60.5,                   img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/a98c1118-0dea-440f-8f7e-7a09e022955d-da3f11c70f43f27e6e17813240786341-1024-1024.webp' }
        ]
      },
      {
        id: 'carbono',
        label: 'Fibra de carbono',
        opciones: [
          { id: 'negra',   label: 'Negra brillante', extra: 0,    porDefecto: true, img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/5b3bff65-d7e4-4ab7-bf6f-9b12270063e2-2e70ae9114863806e017808175757161-1024-1024.webp' },
          { id: 'forjada', label: 'Forjada',         extra: 60.5,                   img: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/b448d684-486e-49d4-8a52-e8b1df5e2737-43934581685e23692917814094362190-1024-1024.webp',
            mensaje: 'Consultar colores por WhatsApp' }
        ]
      }
    ];

    function inyectarBloqueVolante() {
      if (!document.body.classList.contains('es-volante')) return;
      var single = document.querySelector('#single-product');
      if (!single) return;
      if (single.querySelector('.volante-personalizacion')) return; // idempotente

      // Posición: después del último envío gratis visible; fallback antes
      // del botón de compra.
      var anchor = single.querySelector('.js-product-form-free-shipping-message') ||
                   single.querySelector('.free-shipping-message');
      var insertarDespuesDe = anchor || null;
      var insertarAntesDe = null;
      if (!anchor) {
        insertarAntesDe = single.querySelector('[data-store="product-buy-button"]');
        if (!insertarAntesDe) return; // sin anchor seguro, esperamos al próximo tick
      }

      var section = document.createElement('section');
      section.className = 'volante-personalizacion';
      section.id = 'personalizacion';

      var title = document.createElement('h3');
      title.className = 'volante-personalizacion__title';
      title.textContent = 'Personalizá tu volante';
      section.appendChild(title);

      PERSONALIZACIONES_VOLANTE.forEach(function(eje) {
        var ejeWrap = document.createElement('div');
        ejeWrap.className = 'volante-personalizacion__eje';
        ejeWrap.setAttribute('data-eje', eje.id);
        ejeWrap.setAttribute('data-eje-label', eje.label.toUpperCase());

        var defaultOpcion = eje.opciones.find(function(o) { return o.porDefecto; }) || eje.opciones[0];

        var ejeLabel = document.createElement('h4');
        ejeLabel.className = 'volante-personalizacion__eje-label';
        ejeLabel.textContent = eje.label.toUpperCase() + ': ' + defaultOpcion.label;
        ejeWrap.appendChild(ejeLabel);

        var opciones = document.createElement('div');
        opciones.className = 'volante-personalizacion__opciones';

        eje.opciones.forEach(function(op) {
          var card = document.createElement('button');
          card.type = 'button';
          card.className = 'volante-card' + (op.porDefecto ? ' is-active' : '');
          card.setAttribute('data-opcion', op.id);
          card.setAttribute('data-extra', String(op.extra));
          card.setAttribute('data-label', op.label);
          card.setAttribute('data-mensaje', op.mensaje || '');
          card.setAttribute('aria-label', eje.label + ': ' + op.label);

          var img = document.createElement('div');
          img.className = 'volante-card__img';
          if (op.img) {
            img.classList.add('has-image');
            var imgEl = document.createElement('img');
            imgEl.src = op.img;
            imgEl.alt = op.label;
            imgEl.loading = 'lazy';
            img.appendChild(imgEl);
          }
          card.appendChild(img);

          opciones.appendChild(card);
        });

        ejeWrap.appendChild(opciones);

        // Mensaje condicional debajo del eje (ej: "Consultar colores por
        // WhatsApp" cuando se selecciona Forjada). Se renderiza siempre y
        // se muestra/oculta vía clase .is-visible según la opción activa.
        var mensajeEl = document.createElement('p');
        mensajeEl.className = 'volante-personalizacion__mensaje';
        if (defaultOpcion.mensaje) {
          mensajeEl.textContent = defaultOpcion.mensaje;
          mensajeEl.classList.add('is-visible');
        }
        ejeWrap.appendChild(mensajeEl);

        section.appendChild(ejeWrap);
      });

      var btnCotizar = document.createElement('button');
      btnCotizar.type = 'button';
      btnCotizar.className = 'btn btn-cotizar-volante';
      btnCotizar.textContent = 'Cotizar volante';
      section.appendChild(btnCotizar);

      // Delegación de click en cards: una opción activa por eje.
      // Al cambiar la opción, actualiza el header del eje con el formato
      // "EJE: Opción elegida".
      section.addEventListener('click', function(ev) {
        var card = ev.target.closest('.volante-card');
        if (!card) return;
        ev.preventDefault();
        var ejeWrap = card.closest('.volante-personalizacion__eje');
        if (!ejeWrap) return;
        if (card.classList.contains('is-active')) return; // sin cambio
        ejeWrap.querySelectorAll('.volante-card.is-active').forEach(function(c) {
          c.classList.remove('is-active');
        });
        card.classList.add('is-active');
        var ejeLabelEl = ejeWrap.querySelector('.volante-personalizacion__eje-label');
        if (ejeLabelEl) {
          var ejeName = ejeWrap.getAttribute('data-eje-label') || '';
          var opcionName = card.getAttribute('data-label') || '';
          ejeLabelEl.textContent = ejeName + ': ' + opcionName;
        }
        var mensajeEl = ejeWrap.querySelector('.volante-personalizacion__mensaje');
        if (mensajeEl) {
          var mensaje = card.getAttribute('data-mensaje') || '';
          if (mensaje) {
            mensajeEl.textContent = mensaje;
            mensajeEl.classList.add('is-visible');
          } else {
            mensajeEl.textContent = '';
            mensajeEl.classList.remove('is-visible');
          }
        }
        section.dispatchEvent(new CustomEvent('volante:cambio', { bubbles: false }));
      });

      // Click en Cotizar: calcula y muestra el total. Pasa a estado "cotizado".
      btnCotizar.addEventListener('click', function() {
        if (btnCotizar.classList.contains('is-cotizado')) return;
        var total = calcularTotalVolante(section);
        if (total == null) {
          console.warn('[volantes] no se pudo leer el precio base, abortar cotización');
          return;
        }
        escribirPrecioMostrado(total);
        btnCotizar.classList.add('is-cotizado');
        btnCotizar.textContent = 'Cotizado ✓';
        resaltarPrecioCotizado();
      });

      // Cambio en cualquier card: si ya estaba cotizado, vuelve al precio base
      // y re-habilita Cotizar.
      section.addEventListener('volante:cambio', function() {
        if (!btnCotizar.classList.contains('is-cotizado')) return;
        escribirPrecioMostrado(null); // restaura base
        btnCotizar.classList.remove('is-cotizado');
        btnCotizar.textContent = 'Cotizar volante';
      });

      if (insertarDespuesDe && insertarDespuesDe.parentNode) {
        insertarDespuesDe.parentNode.insertBefore(section, insertarDespuesDe.nextSibling);
      } else if (insertarAntesDe && insertarAntesDe.parentNode) {
        insertarAntesDe.parentNode.insertBefore(section, insertarAntesDe);
      }

      // Scroll diferido a la sección si la URL trae #personalizacion.
      // El navegador intenta el scroll nativo antes de que esta sección
      // exista (la inyectamos vía JS post-load), así que lo forzamos
      // nosotros una vez insertada.
      if (window.location.hash === '#personalizacion') {
        setTimeout(function() {
          var offset = 138;
          var top = section.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }, 50);
      }

      // Si el botón "Encargar ahora" ya fue inyectado por initEncargoDetalle
      // antes de que existiera el bloque de personalización, lo movemos para
      // que quede inmediatamente debajo de "Cotizar volante".
      var encargarExistente = single.querySelector('.btn-encargar-detalle');
      if (encargarExistente && btnCotizar.parentNode) {
        btnCotizar.parentNode.insertBefore(encargarExistente, btnCotizar.nextSibling);
      }
    }

    marcarProductosVolanteListado();
    marcarProductosEncargo();
    initEncargoDetalle();
    initRedireccionPersonalizacion();
    initScrollPersonalizacionesDetalle();
    aplicarClaseVolante();
    setTimeout(aplicarClaseVolante, 1500);
    revisarEnvioGratis();
    initTransferSavings();
    initTransferSavingsProduct();
    initCuotasEncargo();
    initResenasPrueba();
    setTimeout(initResenasPrueba, 1500);
    initAhorraTransferencia();
    setTimeout(initAhorraTransferencia, 1500);
    setTimeout(marcarProductosVolanteListado, 1500);
    setTimeout(marcarProductosEncargo, 1500);
    setTimeout(initEncargoDetalle, 1500);
    setTimeout(initCuotasEncargo, 1500);
    inyectarBloqueVolante();
    setTimeout(inyectarBloqueVolante, 1500);

    // Las funciones de acabado están declaradas más abajo (se elevan), pero
    // las URLs deben existir antes de la primera ejecución.
    IMAGENES_ACABADO = {
      carbono: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/e6915c9d-23d8-48f3-a108-47814d8e30c6-9e62bd67ceafdec93917891891148874-1024-1024.webp',
      negroPiano: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/chatgpt-image-sep-12-2026-02_06_39-am-3967622552898a662e17891896131601-1024-1024.webp'
    };
    initMarqueeAdbar();
    setTimeout(initMarqueeAdbar, 200);
    initVariantesAcabadoVisual();
    setTimeout(initVariantesAcabadoVisual, 500);
    setTimeout(initBrandsMarquee, 1000);
    initComparadorAntesDespues();

    function initComparadorAntesDespues() {
      var home = document.querySelector('.js-home-sections-container');
      if (!home) return;
      var existente = document.getElementById('rapa-before-after');
      if (existente) {
        if (!existente.hidden) colocarAlInicio(existente);
        return;
      }

      var section = document.createElement('section');
      section.id = 'rapa-before-after';
      section.className = 'section-before-after-home';
      section.setAttribute('data-store', 'home-before-after');
      section.setAttribute('aria-labelledby', 'rapa-before-after-title');
      section.innerHTML = [
        '<div class="rapa-compare-layout">',
          '<div class="rapa-compare-copy">',
            '<p class="rapa-compare-eyebrow">Antes &amp; después</p>',
            '<h2 id="rapa-before-after-title">El cambio está<br>en <span>tus manos.</span></h2>',
            '<p class="rapa-compare-description">Dale otra presencia al interior de tu auto. Combiná materiales, terminaciones y tecnología en un volante hecho a tu medida.</p>',
            '<a class="rapa-compare-link" href="/volantes/">Encontrá tu volante <span aria-hidden="true">&#8599;</span></a>',
          '</div>',
          '<div class="rapa-compare-media">',
            '<div class="rapa-compare-view" id="rapa-before-after-view" style="height:0;padding-top:125%">',
              '<img class="rapa-compare-image rapa-compare-after" style="top:0;left:0" src="https://dcdn-us.mitiendanube.com/stores/007/678/416/products/volante-despues-4710de5be37b5031b517923032342461-1024-1024.webp" alt="Después: volante personalizado en fibra de carbono, con display y costuras rojas" width="1200" height="1500" loading="eager" fetchpriority="high" decoding="async" draggable="false">',
              '<img class="rapa-compare-image rapa-compare-before" style="top:0;left:0;clip-path:inset(0 50% 0 0)" src="https://dcdn-us.mitiendanube.com/stores/007/678/416/products/volantes-antes-1b7f4b739986606b9d17923032341602-1024-1024.webp" alt="Antes: volante original de Volkswagen" width="1200" height="1500" loading="eager" fetchpriority="high" decoding="async" draggable="false">',
              '<span class="rapa-compare-label rapa-compare-label-before" aria-hidden="true">Antes</span>',
              '<span class="rapa-compare-label rapa-compare-label-after" aria-hidden="true">Después</span>',
              '<input class="rapa-compare-range" type="range" min="0" max="100" step="1" value="50" aria-label="Comparar el volante antes y después" aria-controls="rapa-before-after-view" aria-valuetext="50 % del antes y 50 % del después">',
              '<div class="rapa-compare-divider" style="left:50%" aria-hidden="true"><span class="rapa-compare-handle"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5m8-10 5 5-5 5M3 12h18"/></svg></span></div>',
            '</div>',
          '</div>',
        '</div>'
      ].join('');

      // El editor CSS de Tiendanube elimina aspect-ratio, inset y clip-path.
      // Reservamos el alto con padding y aplicamos el recorte directamente
      // desde JS para que no pase por ese procesamiento.
      var before = section.querySelector('.rapa-compare-before');
      var divider = section.querySelector('.rapa-compare-divider');
      var range = section.querySelector('.rapa-compare-range');
      range.addEventListener('input', function() {
        var position = Number(range.value);
        before.style.clipPath = 'inset(0 ' + (100 - position) + '% 0 0)';
        divider.style.left = position + '%';
        range.setAttribute('aria-valuetext', position + ' % del antes y ' + (100 - position) + ' % del después');
      });

      // Ante un error de imagen, recuperamos el banner original de la tienda.
      section.querySelectorAll('img').forEach(function(img) {
        img.addEventListener('error', function() {
          section.hidden = true;
          home.querySelectorAll('[data-rapa-banner-display]').forEach(function(banner) {
            banner.hidden = banner.getAttribute('data-rapa-banner-hidden') === '1';
            var display = banner.getAttribute('data-rapa-banner-display');
            if (display) banner.style.setProperty('display', display, banner.getAttribute('data-rapa-banner-priority'));
            else banner.style.removeProperty('display');
            banner.removeAttribute('data-rapa-banner-display');
            banner.removeAttribute('data-rapa-banner-priority');
            banner.removeAttribute('data-rapa-banner-hidden');
          });
        });
      });

      colocarAlInicio(section);

      function colocarAlInicio(comparador) {
        home.querySelectorAll('[data-store="home-slider"]').forEach(function(banner) {
          if (banner.hasAttribute('data-rapa-banner-display')) return;
          banner.setAttribute('data-rapa-banner-display', banner.style.getPropertyValue('display'));
          banner.setAttribute('data-rapa-banner-priority', banner.style.getPropertyPriority('display'));
          banner.setAttribute('data-rapa-banner-hidden', banner.hidden ? '1' : '0');
          banner.hidden = true;
          banner.style.setProperty('display', 'none', 'important');
        });
        if (home.firstElementChild !== comparador) home.insertBefore(comparador, home.firstChild);
      }
    }


    // === PRUEBA: fila de reseñas (estrellas + "4.5 de 5") ===
    // Réplica del widget de saferazor.com.ar.
    //
    // Forma de la estrella: saferazor usa el glifo "★" de Times. Ese glifo es
    // un pentagrama clásico, con radio interno / radio externo = cos(72°) /
    // cos(36°) ≈ 0.382, que es lo que le da las puntas afiladas. Las estrellas
    // "de librería" (feather, bootstrap y similares) usan ratio 0.5: cuerpo
    // ancho y puntas romas, que es lo que se ve como emoji. Acá el path se
    // calculó con 0.382 para que coincida con el glifo.
    //
    // Van como SVG inline y no como el glifo con gradiente recortado
    // (background-clip: text + text-fill transparent) que usa saferazor:
    // esa técnica depende de que el editor de CSS de Tiendanube no toque el
    // `content` unicode ni las propiedades -webkit-, y ahí las estrellas
    // quedaban invisibles. El SVG lleva medidas y colores como atributos
    // propios, así que no depende de fuentes, de background-clip ni del CSS.
    //
    // Es un bloque de PRUEBA: el puntaje no sale de reseñas reales, se deriva
    // del id del producto (ver puntajeResenaProducto).
    // Se inserta dentro de .price-container, debajo del precio (ver `order`
    // en style.css). Para quitarlo: borrar estas funciones, las dos llamadas
    // a initResenasPrueba y el bloque ".rapa-reviews-row" de style.css.

    // Hash estable (djb2): el mismo producto devuelve siempre el mismo
    // puntaje, así no cambia en cada recarga, pero varía entre productos.
    function hashCadena(str) {
      var h = 5381;
      for (var i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) | 0;
      }
      return Math.abs(h);
    }

    // Devuelve el puntaje en décimas (41 a 50) => 4.1 a 5.0.
    function puntajeResenaProducto() {
      var idInput = document.querySelector('input[name="add_to_cart"]');
      var semilla = (idInput && idInput.value) || location.pathname;
      return 41 + (hashCadena(semilla) % 10);
    }

    // relleno: 0 = vacía, 1 = llena, 0.5 = mitad pintada. La parte no pintada
    // queda gris (no desaparece).
    function svgEstrella(relleno, uid) {
      // Las constantes viven acá adentro a propósito: initResenasPrueba() se
      // llama más arriba en el archivo que este bloque, así que un `var` a
      // nivel de módulo estaría hoisteado pero todavía sin asignar (undefined)
      // en la primera llamada, y las estrellas salían con d="undefined".
      // Pentagrama con ratio 0.382 en un viewBox de 24x24 (centro 12,12, R=11).
      var PATH = 'M12,1L14.47,8.6L22.46,8.6L16,13.3L18.47,20.9L12,16.2L5.53,20.9L8,13.3L1.54,8.6L9.53,8.6Z';
      var LLENO = '#fd9a52';
      var VACIO = '#e1e1e1';

      var svgAbre = '<svg viewBox="0 0 24 24" width="18.5" height="18.5" aria-hidden="true">';
      if (relleno >= 1) {
        return svgAbre + '<path d="' + PATH + '" fill="' + LLENO + '"/></svg>';
      }
      if (relleno <= 0) {
        return svgAbre + '<path d="' + PATH + '" fill="' + VACIO + '"/></svg>';
      }
      // Relleno parcial: un gradiente con los dos stops en el mismo offset
      // corta la estrella en seco, sin degradé.
      var corte = (relleno * 100).toFixed(1) + '%';
      var gid = 'rapa-star-grad-' + uid;
      return svgAbre +
          '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="' + corte + '" stop-color="' + LLENO + '"/>' +
            '<stop offset="' + corte + '" stop-color="' + VACIO + '"/>' +
          '</linearGradient></defs>' +
          '<path d="' + PATH + '" fill="url(#' + gid + ')"/>' +
        '</svg>';
    }

    function initResenasPrueba() {
      var single = document.querySelector('#single-product');
      if (!single) return;
      if (single.querySelector('.js-rapa-reviews-row')) return;

      var priceContainer = single.querySelector('.price-container');
      if (!priceContainer) return;

      var decimas = puntajeResenaProducto();
      var puntaje = decimas / 10;
      // "5 de 5" si es redondo, "4.3 de 5" si no.
      var puntajeTexto = (decimas % 10 === 0) ? String(decimas / 10) : puntaje.toFixed(1);

      var estrellas = '';
      for (var i = 0; i < 5; i++) {
        var relleno = Math.max(0, Math.min(1, puntaje - i));
        estrellas += svgEstrella(relleno, i);
      }

      var row = document.createElement('div');
      row.className = 'js-rapa-reviews-row rapa-reviews-row';
      row.setAttribute('aria-label', puntajeTexto + ' de 5');
      row.innerHTML =
        '<span class="rapa-reviews-stars">' + estrellas + '</span>' +
        '<span class="rapa-reviews-count">' + puntajeTexto + ' de 5</span>';

      priceContainer.appendChild(row);
    }

    // === "AHORRA 25%" arriba del recuadro de transferencia ===
    // Va dentro de .price-container, entre la fila de reseñas (order 3) y el
    // recuadro de transferencia (order 5); ver style.css.
    //
    // Subrayado copiado de saferazor (.text-button): línea de 1px de ancho
    // completo, 2px por debajo del texto, en el color del texto al 40% de
    // opacidad. Allá se arma con un ::before absoluto en `top: calc(100% +
    // 2px)`; acá se resuelve con border-bottom + padding-bottom, que da el
    // mismo resultado sin depender de pseudo-elementos (el panel de CSS de
    // Tiendanube ya nos descartó una regla ::before antes). No se copia el
    // ::after que saferazor despliega en hover: ese texto allá es un enlace
    // y este es una etiqueta fija.

    // Descuento por transferencia calculado de los precios reales, para no
    // mostrar un número fijo que podría no coincidir con el del producto.
    // Si no se puede leer, cae en 25 (el descuento configurado en la tienda).
    function porcentajeTransferencia() {
      var single = document.querySelector('#single-product');
      if (!single) return 25;
      var trans = single.querySelector('.js-payment-discount-price-product[data-priceraw-without-shipping]');
      var reg = single.querySelector('.js-price-display[data-product-price]');
      if (!trans || !reg) return 25;
      var t = parseInt(trans.getAttribute('data-priceraw-without-shipping'), 10);
      var r = parseInt(reg.getAttribute('data-product-price'), 10);
      if (!t || !r || t >= r) return 25;
      return Math.round((1 - t / r) * 100);
    }

    function initAhorraTransferencia() {
      var single = document.querySelector('#single-product');
      if (!single) return;
      if (single.querySelector('.js-rapa-ahorra')) return;

      var priceContainer = single.querySelector('.price-container');
      if (!priceContainer) return;

      // El div ocupa la fila completa y el span de adentro es inline-block,
      // para que el subrayado mida lo que mide el texto y no toda la fila.
      var fila = document.createElement('div');
      fila.className = 'js-rapa-ahorra rapa-ahorra';
      fila.innerHTML =
        '<span class="rapa-ahorra-texto">AHORRA ' + porcentajeTransferencia() + '%</span>';

      priceContainer.appendChild(fila);
    }

    function initMarqueeAdbar() {
      var adbar = document.querySelector('.js-swiper-adbar');
      if (!adbar || adbar.dataset.marqueeInit) return;
      adbar.dataset.marqueeInit = '1';

      var slides = adbar.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
      if (!slides.length) return;

      var textos = Array.from(slides).map(function(s) { return s.innerText.trim(); });
      var sep = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
      var texto = textos.join(sep);
      var textoDoble = texto + sep + texto;

      var wrapper = document.createElement('div');
      wrapper.className = 'adbar-marquee-custom';

      var inner = document.createElement('span');
      inner.className = 'adbar-marquee-inner';
      inner.innerHTML = textoDoble;
      wrapper.appendChild(inner);

      var container = adbar.parentNode;
      adbar.style.setProperty('display', 'none', 'important');
      var prev = container.querySelector('.js-swiper-adbar-prev');
      var next = container.querySelector('.js-swiper-adbar-next');
      if (prev) prev.style.setProperty('display', 'none', 'important');
      if (next) next.style.setProperty('display', 'none', 'important');

      container.insertBefore(wrapper, adbar);

      // En desktop, dos copias pueden ser más angostas que la pantalla. Se
      // repite el grupo hasta llenar el viewport y luego se duplica: así al
      // salir el texto por la izquierda, la siguiente copia entra de inmediato
      // por la derecha, sin dejar un hueco. Mobile conserva sus dos copias
      // originales y por lo tanto su comportamiento actual.
      if (window.matchMedia && window.matchMedia('(min-width: 768px)').matches) {
        var groupWidth = inner.scrollWidth / 2;
        var copies = groupWidth ? Math.ceil(wrapper.clientWidth / groupWidth) : 1;

        if (copies > 1) {
          var grupoCompleto = Array(copies).fill(texto).join(sep);
          inner.innerHTML = grupoCompleto + sep + grupoCompleto;
        }
      }
    }

    // Convierte únicamente los selectores de acabado que ofrecen Negro piano
    // y alguna terminación de fibra de carbono en tarjetas visuales. Los <a>
    // originales de Tiendanube se conservan para no interferir con su lógica
    // de variantes, precio, stock ni carrito.
    var IMAGENES_ACABADO;

    function normalizarAcabado(valor) {
      return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
    }

    function tipoAcabadoVisual(valor) {
      var nombre = normalizarAcabado(valor);
      if (nombre.indexOf('negro piano') !== -1) return 'negroPiano';
      if (nombre.indexOf('fibra de carbono') !== -1 ||
          nombre.indexOf('simil carbono') !== -1 ||
          nombre.indexOf('carbono forjad') !== -1 ||
          nombre.indexOf('fibra forjad') !== -1 ||
          nombre === 'forjada') return 'carbono';
      return null;
    }

    function initVariantesAcabadoVisual() {
      var single = document.querySelector('#single-product');
      if (!single) return;

      single.querySelectorAll('.js-product-variants-group').forEach(function(grupo) {
        if (grupo.dataset.rapaAcabadosInit) return;

        var opciones = Array.from(grupo.querySelectorAll('.js-insta-variant'));
        if (opciones.length < 2) return;

        var datos = opciones.map(function(opcion) {
          var nombre = opcion.getAttribute('data-option') ||
                       opcion.getAttribute('title') ||
                       opcion.textContent;
          return {
            elemento: opcion,
            nombre: String(nombre || '').trim(),
            tipo: tipoAcabadoVisual(nombre)
          };
        });

        // El grupo completo debe ser de materiales y debe ofrecer las dos
        // familias. Así no se modifican talles, colores u otras variantes.
        var todosSonAcabados = datos.every(function(dato) { return !!dato.tipo; });
        var tieneNegroPiano = datos.some(function(dato) { return dato.tipo === 'negroPiano'; });
        var tieneCarbono = datos.some(function(dato) { return dato.tipo === 'carbono'; });
        if (!todosSonAcabados || !tieneNegroPiano || !tieneCarbono) return;

        datos.forEach(function(dato) {
          var opcion = dato.elemento;
          var contenido = opcion.querySelector('.btn-variant-content');
          if (!contenido) return;

          opcion.classList.add('rapa-material-option');
          opcion.setAttribute('data-rapa-material', dato.tipo);

          var imagenWrap = document.createElement('span');
          imagenWrap.className = 'rapa-material-option__image';

          var imagen = document.createElement('img');
          imagen.src = IMAGENES_ACABADO[dato.tipo];
          imagen.alt = '';
          imagen.loading = 'lazy';
          imagen.decoding = 'async';
          imagen.setAttribute('aria-hidden', 'true');
          imagenWrap.appendChild(imagen);

          var etiqueta = document.createElement('span');
          etiqueta.className = 'rapa-material-option__label';
          etiqueta.textContent = dato.nombre;

          contenido.textContent = '';
          contenido.appendChild(imagenWrap);
          contenido.appendChild(etiqueta);
        });

        // Se marca como inicializado recién después de completar todas las
        // tarjetas. Si algo falla, un reintento todavía puede recuperarlo.
        grupo.classList.add('rapa-material-group');
        grupo.dataset.rapaAcabadosInit = '1';
      });
    }

    function initBrandsMarquee() {
      var brandsEl = document.querySelector('.js-swiper-brands');
      if (!brandsEl || brandsEl.dataset.marqueeInit) return;
      brandsEl.dataset.marqueeInit = '1';

      var existing = brandsEl.swiper;
      if (existing) existing.destroy(false, true);

      var slides = brandsEl.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)');
      if (!slides.length) return;

      var items = Array.from(slides).map(function(s) {
        var img = s.querySelector('img');
        var link = s.querySelector('a');
        if (!img) return '';
        var imgClone = img.cloneNode(false);
        imgClone.src = img.getAttribute('data-src') || img.src;
        imgClone.alt = img.alt;
        imgClone.removeAttribute('data-src');
        imgClone.className = 'brand-image';
        var div = document.createElement('div');
        div.className = 'brands-marquee-item';
        if (link) {
          var a = document.createElement('a');
          a.href = link.href;
          a.appendChild(imgClone);
          div.appendChild(a);
        } else {
          div.appendChild(imgClone);
        }
        return div.outerHTML;
      }).filter(Boolean);

      var inner = document.createElement('div');
      inner.className = 'brands-marquee-inner';
      inner.innerHTML = items.join('') + items.join('');

      var wrapper = document.createElement('div');
      wrapper.className = 'brands-marquee-custom';
      wrapper.appendChild(inner);

      var container = brandsEl.parentNode;
      brandsEl.style.setProperty('display', 'none', 'important');

      var section = brandsEl.closest('[data-store="home-brands"]') || brandsEl.closest('section') || container;
      var prevBtn = section.querySelector('.js-swiper-brands-prev');
      var nextBtn = section.querySelector('.js-swiper-brands-next');
      if (prevBtn) prevBtn.style.setProperty('display', 'none', 'important');
      if (nextBtn) nextBtn.style.setProperty('display', 'none', 'important');

      container.insertBefore(wrapper, brandsEl);

      // rAF-driven scroll con soporte de drag/touch
      var SPEED = 55; // px por segundo
      var pos = 0;
      var isDragging = false;
      var userInteracted = false;
      var resumeTimer = null;
      var lastX = 0;
      var lastTime = null;

      function onDragEnd() {
        isDragging = false;
        userInteracted = true;
        wrapper.style.cursor = '';
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function() {
          userInteracted = false;
        }, 5000);
      }

      function tick(ts) {
        if (!lastTime) lastTime = ts;
        var dt = Math.min(ts - lastTime, 50) / 1000;
        lastTime = ts;

        var half = inner.scrollWidth / 2;
        if (half > 0) {
          if (!isDragging && !userInteracted) pos -= SPEED * dt;
          // módulo para normalización inmediata sin importar cuánto se acumuló
          pos = pos % half;
          if (pos > 0) pos -= half;
          inner.style.transform = 'translateX(' + pos + 'px)';
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      wrapper.addEventListener('touchstart', function(e) {
        isDragging = true;
        userInteracted = false;
        clearTimeout(resumeTimer);
        lastX = e.touches[0].clientX;
      }, { passive: true });
      wrapper.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        pos += e.touches[0].clientX - lastX;
        lastX = e.touches[0].clientX;
      }, { passive: true });
      wrapper.addEventListener('touchend',   function() { onDragEnd(); });
      wrapper.addEventListener('touchcancel',function() { onDragEnd(); });

      wrapper.addEventListener('mousedown', function(e) {
        isDragging = true;
        userInteracted = false;
        clearTimeout(resumeTimer);
        lastX = e.clientX;
        wrapper.style.cursor = 'grabbing';
        e.preventDefault();
      });
      document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        pos += e.clientX - lastX;
        lastX = e.clientX;
      });
      document.addEventListener('mouseup', function() {
        if (!isDragging) return;
        onDragEnd();
      });
    }

    var _encargoTimer = null;
    var _encargoDetalleTimer = null;
    var _transferTimer = null;
    var _savingsTimer = null;
    var _volanteInyectTimer = null;

    // Carrusel de banners de categoría (mobile, infinito)
    function initBannersCategoriaCarousel() {
      var rows = document.querySelectorAll('.row');
      rows.forEach(function(row) {
        if (!row.querySelector('.js-promotional-banner-container')) return;
        if (row.parentNode && row.parentNode.classList.contains('banners-carousel-wrapper')) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'banners-carousel-wrapper';
        row.parentNode.insertBefore(wrapper, row);

        var titulo = document.createElement('h2');
        titulo.className = 'banners-carousel-title h6 text-primary h1-md';
        titulo.textContent = 'Lo más buscado...';
        wrapper.appendChild(titulo);

        wrapper.appendChild(row);

        // Reordenar físicamente: Volantes (2) → Tableros (1) → Accesorios (3)
        var b1 = row.querySelector('.js-promotional-banner-container-1');
        var b2 = row.querySelector('.js-promotional-banner-container-2');
        var b3 = row.querySelector('.js-promotional-banner-container-3');
        if (b1 && b2 && b3) {
          row.appendChild(b2);
          row.appendChild(b1);
          row.appendChild(b3);
        }

        // Clones para loop infinito
        var reales = Array.prototype.slice.call(row.querySelectorAll('.js-promotional-banner-container'));
        var n = reales.length;
        if (n > 1) {
          var cloneOfFirst = reales[0].cloneNode(true);
          cloneOfFirst.classList.add('banner-clone');
          cloneOfFirst.setAttribute('aria-hidden', 'true');
          var cloneOfLast = reales[n - 1].cloneNode(true);
          cloneOfLast.classList.add('banner-clone');
          cloneOfLast.setAttribute('aria-hidden', 'true');
          row.insertBefore(cloneOfLast, reales[0]);
          row.appendChild(cloneOfFirst);
        }

        // Flechas
        var prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'banners-carousel-arrow banners-carousel-prev';
        prev.setAttribute('aria-label', 'Anterior');
        var next = document.createElement('button');
        next.type = 'button';
        next.className = 'banners-carousel-arrow banners-carousel-next';
        next.setAttribute('aria-label', 'Siguiente');
        wrapper.appendChild(prev);
        wrapper.appendChild(next);

        function getStep() {
          var first = row.querySelector('.js-promotional-banner-container');
          return first ? first.getBoundingClientRect().width : 0;
        }

        function totalSlides() {
          return row.querySelectorAll('.js-promotional-banner-container').length;
        }

        function jumpNoAnim(left) {
          var prevBehavior = row.style.scrollBehavior;
          row.style.scrollBehavior = 'auto';
          row.scrollLeft = left;
          requestAnimationFrame(function() {
            row.style.scrollBehavior = prevBehavior || '';
          });
        }

        function setInitialPosition() {
          var step = getStep();
          if (!step) return;
          jumpNoAnim(n > 1 ? step : 0);
        }

        // Si quedamos en una clon, saltamos silenciosamente al slide real
        function checkLoop() {
          if (n <= 1) return;
          var step = getStep();
          if (!step) return;
          var total = totalSlides();
          var idx = Math.round(row.scrollLeft / step);
          if (idx <= 0) {
            jumpNoAnim(n * step);
          } else if (idx >= total - 1) {
            jumpNoAnim(step);
          }
        }

        function snapToNearest(thenCheckLoop) {
          var step = getStep();
          if (!step) return;
          var idx = Math.round(row.scrollLeft / step);
          var target = idx * step;
          if (Math.abs(row.scrollLeft - target) > 1) {
            row.scrollTo({ left: target, behavior: 'smooth' });
          }
          if (thenCheckLoop) setTimeout(checkLoop, 380);
        }

        function scrollByOne(dir) {
          wrapper.setAttribute('data-user-interacted', '1');
          var step = getStep();
          if (!step) return;
          var currentIdx = Math.round(row.scrollLeft / step);
          var targetIdx = currentIdx + dir;
          row.scrollTo({ left: targetIdx * step, behavior: 'smooth' });
          setTimeout(checkLoop, 420);
        }

        prev.addEventListener('click', function() { scrollByOne(-1); });
        next.addEventListener('click', function() { scrollByOne(1); });

        var _snapTimer = null;
        var _touchStartX = 0;
        var _touchStartScroll = 0;
        var _touchActive = false;

        row.addEventListener('scroll', function() {
          if (_touchActive) return;
          clearTimeout(_snapTimer);
          _snapTimer = setTimeout(function() { snapToNearest(true); }, 140);
        }, { passive: true });

        row.addEventListener('touchstart', function(e) {
          if (!e.touches.length) return;
          _touchActive = true;
          _touchStartX = e.touches[0].clientX;
          _touchStartScroll = row.scrollLeft;
          clearTimeout(_snapTimer);
        }, { passive: true });

        row.addEventListener('touchend', function(e) {
          _touchActive = false;
          wrapper.setAttribute('data-user-interacted', '1');
          var step = getStep();
          if (!step) return;
          var endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : _touchStartX;
          var deltaX = _touchStartX - endX;
          var startIdx = Math.round(_touchStartScroll / step);
          var threshold = Math.min(35, step * 0.08);
          var targetIdx;
          if (Math.abs(deltaX) > threshold) {
            targetIdx = startIdx + (deltaX > 0 ? 1 : -1);
          } else {
            targetIdx = Math.round(row.scrollLeft / step);
          }
          row.scrollTo({ left: targetIdx * step, behavior: 'smooth' });
          setTimeout(checkLoop, 450);
        }, { passive: true });

        row.addEventListener('touchcancel', function() {
          _touchActive = false;
        }, { passive: true });

        window.addEventListener('resize', function() {
          var step = getStep();
          if (!step) return;
          var idx = Math.round(row.scrollLeft / step);
          jumpNoAnim(idx * step);
        });

        setTimeout(setInitialPosition, 50);
      });
    }
    initBannersCategoriaCarousel();

    var _bannersCarouselTimer = null;
    var _volanteTimer = null;
    var _volanteListadoTimer = null;
    var _acabadosVisualesTimer = null;
    var observador = new MutationObserver(function() {
      revisarEnvioGratis();
      clearTimeout(_volanteTimer);
      _volanteTimer = setTimeout(aplicarClaseVolante, 100);
      clearTimeout(_volanteInyectTimer);
      _volanteInyectTimer = setTimeout(inyectarBloqueVolante, 200);
      clearTimeout(_volanteListadoTimer);
      _volanteListadoTimer = setTimeout(marcarProductosVolanteListado, 250);
      clearTimeout(_encargoTimer);
      _encargoTimer = setTimeout(marcarProductosEncargo, 300);
      clearTimeout(_encargoDetalleTimer);
      _encargoDetalleTimer = setTimeout(initEncargoDetalle, 300);
      clearTimeout(_transferTimer);
      _transferTimer = setTimeout(initTransferSavings, 300);
      clearTimeout(_savingsTimer);
      _savingsTimer = setTimeout(initTransferSavingsProduct, 300);
      clearTimeout(_bannersCarouselTimer);
      _bannersCarouselTimer = setTimeout(initBannersCategoriaCarousel, 300);
      initComparadorAntesDespues();
      clearTimeout(_acabadosVisualesTimer);
      _acabadosVisualesTimer = setTimeout(initVariantesAcabadoVisual, 300);
    });
    observador.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTiendaNubePersonalizado);
  } else {
    initTiendaNubePersonalizado();
  }

  // === Popup promocional (social proof) ===
  (function initPopupPromocional() {
    var STORAGE_KEY = 'rapa_promo_popup_shown';
    var DELAY_MS = 10000;
    // AUTODISMISS_MS y la animación promoPopupCountdown en style.css deben coincidir.
    var AUTODISMISS_MS = 5000;
    var EXCLUDED_PATHS = /\/(checkout|cart|carrito|account|admin|api)(\/|$|\?)/i;
    var NOMBRES = [
      'Juan', 'Martín', 'Lucas', 'Mateo', 'Agustín', 'Tomás', 'Nicolás',
      'Joaquín', 'Federico', 'Bruno', 'Diego', 'Santiago', 'Franco',
      'Gonzalo', 'Matías', 'Ezequiel', 'Ignacio', 'Sebastián', 'Pablo',
      'Andrés', 'Cristian', 'Leandro', 'Emanuel', 'Javier', 'Marcos',
      'Hernán', 'Rodrigo', 'Gastón', 'Nahuel', 'Facundo'
    ];

    function yaMostrada() {
      try { return sessionStorage.getItem(STORAGE_KEY) === '1'; }
      catch (_) { return false; }
    }

    function marcarMostrada() {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    }

    function esUrlValida(u) {
      if (!u) return false;
      if (/^data:/i.test(u)) return false;
      if (u.indexOf('blank') !== -1) return false;
      return /^https?:\/\//i.test(u) || u.indexOf('//') === 0 || u.charAt(0) === '/';
    }

    function leerImgSrc(imgEl) {
      var candidatos = [
        imgEl.currentSrc,
        imgEl.getAttribute('data-src'),
        imgEl.getAttribute('data-original'),
        imgEl.getAttribute('data-image'),
        imgEl.src
      ];
      for (var i = 0; i < candidatos.length; i++) {
        if (esUrlValida(candidatos[i])) return candidatos[i];
      }
      var srcset = imgEl.getAttribute('srcset') || imgEl.getAttribute('data-srcset');
      if (srcset) {
        var partes = srcset.split(',');
        for (var j = 0; j < partes.length; j++) {
          var u = partes[j].trim().split(/\s+/)[0];
          if (esUrlValida(u)) return u;
        }
      }
      return null;
    }

    function extraerProducto(card) {
      var nombreEl = card.querySelector('.js-item-name');
      var linkEl = card.querySelector('a.btn-secondary');
      var imgEl = card.querySelector('.js-product-item-image-container-private img');
      if (!nombreEl || !linkEl || !imgEl) return null;
      var nombre = (nombreEl.innerText || nombreEl.textContent || '').trim();
      var url = linkEl.href;
      var img = leerImgSrc(imgEl);
      if (!nombre || !url || !img) return null;
      if (!/^https?:\/\//i.test(url)) return null;
      return { nombre: nombre, url: url, img: img };
    }

    function elegirProducto() {
      var cards = Array.prototype.slice.call(document.querySelectorAll('.item-product'));
      if (!cards.length) return null;
      cards.sort(function() { return Math.random() - 0.5; });
      for (var i = 0; i < cards.length; i++) {
        var producto = extraerProducto(cards[i]);
        if (producto) return producto;
      }
      return null;
    }

    function generarPersona() {
      var nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      var inicial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      return nombre + ' ' + inicial + '.';
    }

    function construirTarjeta(producto, persona) {
      var aside = document.createElement('aside');
      aside.className = 'promo-popup';
      aside.setAttribute('role', 'status');
      aside.setAttribute('aria-live', 'polite');

      var link = document.createElement('a');
      link.className = 'promo-popup__link';
      link.href = producto.url;

      var img = document.createElement('img');
      img.className = 'promo-popup__img';
      img.src = producto.img;
      img.alt = '';
      img.loading = 'lazy';

      var text = document.createElement('div');
      text.className = 'promo-popup__text';

      var person = document.createElement('span');
      person.className = 'promo-popup__person';
      person.textContent = persona + ' compró';

      var prod = document.createElement('span');
      prod.className = 'promo-popup__product';
      prod.textContent = producto.nombre;

      text.appendChild(person);
      text.appendChild(prod);
      link.appendChild(img);
      link.appendChild(text);
      aside.appendChild(link);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'promo-popup__close';
      btn.setAttribute('aria-label', 'Cerrar');

      var ring = document.createElement('span');
      ring.className = 'promo-popup__ring';
      ring.setAttribute('aria-hidden', 'true');
      btn.appendChild(ring);

      aside.appendChild(btn);
      return aside;
    }

    function mostrar() {
      if (yaMostrada()) return;
      if (EXCLUDED_PATHS.test(location.pathname)) return;
      var producto = elegirProducto();
      if (!producto) return;
      var persona = generarPersona();
      var el = construirTarjeta(producto, persona);
      document.body.appendChild(el);
      marcarMostrada();

      requestAnimationFrame(function() {
        el.classList.add('is-visible');
      });

      var autoTimer = setTimeout(cerrar, AUTODISMISS_MS);

      function cerrar() {
        clearTimeout(autoTimer);
        if (!el.parentNode) return;
        el.classList.add('is-leaving');
        setTimeout(function() {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
      }

      el.querySelector('.promo-popup__close').addEventListener('click', cerrar);
    }

    function arrancar() {
      if (yaMostrada()) return;
      if (EXCLUDED_PATHS.test(location.pathname)) return;
      setTimeout(mostrar, DELAY_MS);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', arrancar);
    } else {
      arrancar();
    }
  })();


/* ======================================================================
   RAPA IMPORTS · Página de producto + carrito (rediseño)
   Se carga junto con el resto de script.js (jsDelivr).
   - Producto: reseñas arriba del título, precio compacto, carrito fijo
     abajo (naranja) y carrito parcial al agregar.
   - Carrito (todas las páginas): rediseño, sugerencias del mismo
     vehículo y precio con transferencia destacado.
   ====================================================================== */
(function () {
  function rapaProducto() {
    return (function(){
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
})();
  }
  function rapaCarrito() {
    return (function spCartRedesign(){
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
})();
  }
  function init() {
    try { rapaProducto(); } catch (e) { console.warn('[rapa] producto', e); }
    try { rapaCarrito(); } catch (e) { console.warn('[rapa] carrito', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
