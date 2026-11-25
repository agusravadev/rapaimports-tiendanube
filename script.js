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

    // Countdown de la sección "Combos": cuenta hasta las 23:59:59 de hoy
    // en hora Argentina (UTC-3), sin importar la zona horaria del visitante.
    // Al llegar a cero reinicia para el día siguiente.
    var _combosCountdownTimer = null;
    function crearCountdownCombos() {
      var box = document.createElement('div');
      box.className = 'combos-countdown';
      box.setAttribute('role', 'timer');
      box.innerHTML =
        '<span class="combos-countdown-label">La oferta termina en</span>' +
        '<span class="combos-countdown-clock">' +
          '<span class="combos-countdown-unit"><b data-cd="h">00</b><small>horas</small></span>' +
          '<span class="combos-countdown-sep">:</span>' +
          '<span class="combos-countdown-unit"><b data-cd="m">00</b><small>min</small></span>' +
          '<span class="combos-countdown-sep">:</span>' +
          '<span class="combos-countdown-unit"><b data-cd="s">00</b><small>seg</small></span>' +
        '</span>';

      function pad(n) { return (n < 10 ? '0' : '') + n; }
      function tick() {
        var AR_OFFSET = -3 * 3600 * 1000;
        var nowAr = Date.now() + AR_OFFSET;
        var finDia = Math.floor(nowAr / 86400000) * 86400000 + 86400000;
        var resto = Math.max(0, Math.floor((finDia - nowAr) / 1000));
        document.querySelectorAll('.combos-countdown').forEach(function(el) {
          el.querySelector('[data-cd="h"]').textContent = pad(Math.floor(resto / 3600));
          el.querySelector('[data-cd="m"]').textContent = pad(Math.floor(resto % 3600 / 60));
          el.querySelector('[data-cd="s"]').textContent = pad(resto % 60);
        });
      }
      if (!_combosCountdownTimer) _combosCountdownTimer = setInterval(tick, 1000);
      setTimeout(tick, 0);
      return box;
    }

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
        titulo.textContent = 'Combos';
        wrapper.appendChild(titulo);
        wrapper.appendChild(crearCountdownCombos());

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
  // Barra de compra fija: se marca con la clase .sp-buybar desde JS en vez
  // de usar :has(.js-addtocart). Safari (iPhone) a veces no reevalúa :has()
  // cuando la página cambia el DOM y la barra "se desenganchaba": volvía a
  // su lugar original a mitad de página hasta el próximo repintado.
  var F = 'body.sp-v3:not(.producto-encargo) #single-product .sp-buybar';
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
${F}{position:fixed!important;left:0!important;right:0!important;bottom:0!important;top:auto!important;transform:none!important;z-index:1000;margin:0!important;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;box-shadow:0 -6px 20px rgba(0,0,0,.12);display:flex;flex-wrap:nowrap;align-items:center;gap:10px}
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
  function marcarBarra() {
    var btn = info.querySelector('#product_form .js-addtocart');
    var row = btn && btn.closest('.form-row.mb-2');
    if (row && !row.classList.contains('sp-buybar')) row.classList.add('sp-buybar');
  }
  function alCambiar() { moverResenas(); marcarBarra(); }
  alCambiar();
  if (window.__sp2Obs) window.__sp2Obs.disconnect();
  window.__sp2Obs = new MutationObserver(alCambiar);
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
/* ---------- Sin deslizamiento lateral ----------
   El encabezado del tema mide 100% + 40px (para tapar el padding del
   modal) y el carrito se arrastraba de costado. Se quita el padding
   lateral/inferior del modal (cada bloque ya tiene el suyo). El carrusel de
   sugerencias tiene su propio scroll y sigue deslizando normal. */
${M}{overflow-x:hidden!important;overscroll-behavior:contain;padding-left:0!important;padding-right:0!important;padding-bottom:0!important}
${M} .modal-header{width:auto!important}
/* ---------- Botón "Iniciar compra" siempre visible ---------- */
.sp-cart-foot{position:sticky;bottom:0;z-index:200;background:#fff;padding:12px 20px calc(2px + env(safe-area-inset-bottom));border-top:1px solid #eee;box-shadow:0 -8px 20px rgba(0,0,0,.08)}
.sp-cart-foot .container-fluid{padding:0!important}
.sp-cart-foot .row{margin-left:0!important;margin-right:0!important}
.sp-cart-foot #ajax-cart-submit-div{margin-bottom:0!important}
.sp-cart-foot .sp-cart-trust{margin:8px 0 6px}
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

  // ---------- Botón de pago fijo abajo ----------
  // Saca el bloque del botón del .modal-body y lo pone al final del form en
  // un pie sticky: queda visible siempre, en el carrito parcial y en el
  // completo. Sigue dentro del form, así que el submit funciona igual.
  function pie() {
    var sub = modal.querySelector('#ajax-cart-submit-div'); if (!sub) return;
    var form = modal.querySelector('.js-ajax-cart-panel') || modal;
    var foot = form.querySelector(':scope > .sp-cart-foot');
    if (!foot) { foot = document.createElement('div'); foot.className = 'sp-cart-foot'; form.appendChild(foot); }
    var wrap = sub.closest('.container-fluid') || sub;
    if (wrap.parentNode !== foot) foot.appendChild(wrap);
    if (foot !== form.lastElementChild) form.appendChild(foot);
    var lleno = !!modal.querySelector('.js-cart-item');
    if (foot.hidden === lleno) foot.hidden = !lleno;
  }

  // ---------- Sugerencias relacionadas ----------
  // Se arman por la CATEGORÍA FINAL de cada producto del carrito (el último
  // eslabón del breadcrumb de su ficha, ej. Marcas > Volkswagen > Vento > MK6
  // → /marcas/volkswagen/vento/mk61/). Nunca por palabras del nombre ni por
  // categorías padre (Volkswagen trae productos de cualquier modelo).
  var cache = {}, catCache = {};
  function itemsCarrito() {
    return [...modal.querySelectorAll('.js-cart-item')].map(function(it) {
      var name = ((it.querySelector('.cart-item-name a, .cart-item-name') || {}).textContent || '').replace(/\s+/g, ' ').trim();
      var id = (it.getAttribute('data-store') || '').replace(/\D/g, '');
      var a = it.querySelector('a[href*="/productos/"]');
      return { name: name, id: id, url: a ? a.href.split('?')[0] : '' };
    });
  }
  function tipo(name) { return (name.split(/\s+/)[0] || '').toLowerCase(); }
  function img(u) { return (u || '').replace(/-1024-1024(\.\w+)$/, '-480-0$1'); }

  // Categoría final de un producto, leída del breadcrumb de su ficha
  function categoriaFinal(url) {
    if (!url) return Promise.resolve(null);
    if (!catCache[url]) {
      catCache[url] = fetch(url).then(function(r){ return r.text(); }).then(function(html) {
        var d = new DOMParser().parseFromString(html, 'text/html');
        var crumbs = [...d.querySelectorAll('.breadcrumbs a.crumb')].slice(1); // sin "Inicio"
        var last = crumbs[crumbs.length - 1];
        if (!last) return null;
        return { url: last.getAttribute('href') };
      }).catch(function(){ return null; });
    }
    return catCache[url];
  }

  // Productos de una categoría (solo con stock real: sin encargo 9999)
  async function listar(path) {
    if (cache[path]) return cache[path];
    var html = await fetch(path).then(function(r){ return r.text(); });
    var d = new DOMParser().parseFromString(html, 'text/html');
    var out = [...d.querySelectorAll('.js-item-product')].map(function(it) {
      var vEl = it.querySelector('[data-variants]'); var vars = [];
      try { vars = JSON.parse(vEl.getAttribute('data-variants')); } catch (e) {}
      // stock null = ilimitado en Tiendanube
      var v = vars.find(function(x){ return x.available && x.stock !== 9999 && (x.stock === null || x.stock > 0); });
      var a = it.querySelector('a[href*="/productos/"]');
      var nm = ((it.querySelector('.js-item-name, .item-name') || {}).textContent || '').trim();
      return v ? { id: String(v.product_id), v: v, name: nm, url: a ? a.href : '#' } : null;
    }).filter(Boolean);
    cache[path] = out; return out;
  }

  var renderKey = '', renderGen = 0, sinSug = false;
  async function sugerencias() {
    var list = modal.querySelector('.js-ajax-cart-list'); if (!list) return;
    var items = itemsCarrito();
    var sec = modal.querySelector('.sp-sug');
    if (!items.length) { if (sec) sec.remove(); renderKey = ''; return; }
    var key = items.map(function(i){ return i.id; }).join(',');
    // sinSug: evita recrear/borrar la sección en bucle cuando no hay sugerencias
    if (key === renderKey && (sec || sinSug)) return;
    renderKey = key; sinSug = false;
    var gen = ++renderGen;
    if (!sec) { sec = document.createElement('div'); sec.className = 'sp-sug'; list.after(sec); }
    sec.innerHTML = '<div class="sp-sug-head"><div><p class="sp-sug-title">Complementá tu compra</p><p class="sp-sug-sub">Accesorios compatibles para tu vehículo</p></div>' +
      '<div class="sp-sug-nav"><button type="button" data-dir="-1" aria-label="Anterior"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><path d="M15 6l-6 6 6 6"/></svg></button><button type="button" data-dir="1" aria-label="Siguiente"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><path d="M9 6l6 6-6 6"/></svg></button></div></div>' +
      '<div class="sp-sug-track"><div class="sp-sug-skel"></div><div class="sp-sug-skel"></div><div class="sp-sug-skel"></div></div>';
    var enCarrito = items.map(function(i){ return i.id; });
    var tiposCarrito = items.map(function(i){ return tipo(i.name); });
    // Categorías finales de todo el carrito, empezando por lo último agregado
    var cats = [], res = [];
    try {
      var todas = await Promise.all(items.slice().reverse().map(function(i){ return categoriaFinal(i.url); }));
      todas.forEach(function(c){ if (c && !cats.some(function(x){ return x.url === c.url; })) cats.push(c); });
      var listas = await Promise.all(cats.map(function(c){ return listar(c.url).catch(function(){ return []; }); }));
      listas.forEach(function(l){ res = res.concat(l); });
    } catch (e) {}
    if (gen !== renderGen || !sec.isConnected) return; // llegó un render más nuevo
    var vistos = {};
    var sug = res.filter(function(p) {
      if (vistos[p.id] || enCarrito.indexOf(p.id) >= 0) return false; vistos[p.id] = 1; return true;
    });
    // primero lo complementario (otro tipo de producto), después el resto
    sug.sort(function(a, b){ return (tiposCarrito.indexOf(tipo(a.name)) >= 0) - (tiposCarrito.indexOf(tipo(b.name)) >= 0); });
    sug = sug.slice(0, 6);
    if (!sug.length) { sinSug = true; sec.remove(); return; }
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

  function refrescar() { header(); trust(); pie(); sugerencias(); }
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


// ============================================================
// Combo Black Friday: "Combo Difusor + Alerón para Golf"
// Solo actúa en el single product del combo (LS.product.id 381089521).
// Agrega banner Black Friday con countdown, bloque de ahorro
// (combo + transferencia) y la sección "Este combo contiene" con la
// personalización del alerón y del pomo. Si el combo tiene variantes
// cargadas con las propiedades "Alerón - Acabado", "Pomo - Color" y
// "Pomo - Acabado", sincroniza los <select> nativos para que la
// configuración llegue en el pedido.
// ============================================================
(function () {
  function initComboBlackFriday() {
    var COMBO_ID = 381089521;
    if (!window.LS || !LS.product || LS.product.id !== COMBO_ID) return;
    if (document.querySelector('.cbf-contiene')) return;
    var sp = document.querySelector('#single-product');
    if (!sp || !sp.querySelector('#product_form') || !sp.querySelector('.js-price-container') || !sp.querySelector('section.page-header')) return;

    var CDN = '//dcdn-us.mitiendanube.com/stores/007/678/416/products/';
    // Mismas texturas que usa initVariantesAcabadoVisual() en las fichas individuales
    var TEXTURA = {
      piano: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/chatgpt-image-sep-12-2026-02_06_39-am-3967622552898a662e17891896131601-1024-1024.webp',
      carbono: 'https://dcdn-us.mitiendanube.com/stores/007/678/416/products/e6915c9d-23d8-48f3-a108-47814d8e30c6-9e62bd67ceafdec93917891891148874-1024-1024.webp'
    };
    var ACABADOS = [
      { v: 'Negro piano brillante', img: TEXTURA.piano },
      { v: 'Simil fibra de carbono', img: TEXTURA.carbono }
    ];

    var ITEMS = [
      { key: 'aleron', nombre: 'Alerón Oettinger Golf GTI MK7/7.5', valor: 210000, url: '/productos/aleron-oettinger-golf-gti/',
        img: CDN + 'dab75253-3add-439a-b61d-21f369891484-a35ecb95ce2aeeaa0d17791936830290-1024-1024.webp',
        imgPor: { 'Negro piano brillante': CDN + 'dab75253-3add-439a-b61d-21f369891484-a35ecb95ce2aeeaa0d17791936830290-1024-1024.webp',
                  'Simil fibra de carbono': CDN + '-672a59dd144dacfaea17831435543611-1024-1024.webp' },
        // Precio de lista del alerón por separado según acabado (ficha individual)
        valorPor: { 'Negro piano brillante': 210000, 'Simil fibra de carbono': 250000 },
        grupos: [ { prop: 'Alerón - Acabado', label: 'Acabado', tipo: 'material', opciones: ACABADOS } ] },
      { key: 'difusor', nombre: 'Difusor trasero Golf GTI/TSI MK7', valor: 234000, url: '/productos/difusor-mk7/',
        img: CDN + 'diseno-sin-titulo-26-188a4107918ac45e7917792287902507-1024-1024.webp', fijo: 'Negro piano brillante', grupos: [] },
      { key: 'pomo', nombre: 'Pomo palanca AT estilo MK8', valor: 94000, regalo: true, url: '/productos/pomo-palanca-de-cambio-negro-brillante-at-estilo-mk8/',
        img: CDN + '7e6d6041-60f2-4b10-9c94-dcd2e1747e65-31d4ded3f8822c77e317862533620107-1024-1024.webp',
        imgs: {
          'Blanco|Negro piano brillante': CDN + '7e6d6041-60f2-4b10-9c94-dcd2e1747e65-31d4ded3f8822c77e317862533620107-1024-1024.webp',
          'Blanco|Simil fibra de carbono': CDN + '2116e2cf-0cd9-413b-81fb-8917249c2dfd-7998d60f7c114b3b1b17862429094914-1024-1024.webp',
          'Rojo|Negro piano brillante': CDN + '5f959644-4342-4b73-ba77-53e270257b0d-7530502c2a7bc5c0a917862537367824-1024-1024.webp',
          'Rojo|Simil fibra de carbono': CDN + 'a9698d03-b03b-43a5-a7cc-a5e06bc901ee-37448daa71dfec0c8117862430398842-1024-1024.webp' },
        grupos: [
          { prop: 'Pomo - Color', label: 'Color', tipo: 'foto', opciones: [
            { v: 'Blanco', img: CDN + '7e6d6041-60f2-4b10-9c94-dcd2e1747e65-31d4ded3f8822c77e317862533620107-100-0.webp' },
            { v: 'Rojo', img: CDN + '5f959644-4342-4b73-ba77-53e270257b0d-7530502c2a7bc5c0a917862537367824-100-0.webp' } ] },
          { prop: 'Pomo - Acabado', label: 'Acabado', tipo: 'material', opciones: ACABADOS } ] }
    ];

    var STORE_KEY = 'rapa_combo_' + COMBO_ID;
    var sel = {};
    try { sel = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; } catch (e) { sel = {}; }

    function fmt(n) { return '$' + Math.round(n).toLocaleString('es-AR'); }
    function precioCombo() { var el = document.querySelector('#price_display'); var raw = el && parseInt(el.getAttribute('data-product-price'), 10); return raw ? raw / 100 : 410960; }
    function precioTransfer() { var el = document.querySelector('.js-payment-discount-price-product'); var raw = el && parseInt(el.getAttribute('data-priceraw-without-shipping'), 10); return raw ? raw / 100 : Math.round(precioCombo() * 0.75); }

    // Cuentas: precio de lista de cada producto por separado vs combo vs combo por transferencia
    // Se recalcula en cada cambio: el valor del alerón depende del acabado
    // elegido y el precio del combo cambia cuando Tiendanube cambia de variante.
    function valorItem(it) {
      if (!it.valorPor) return it.valor;
      var elegido = sel[it.key] && sel[it.key][it.grupos[0].prop];
      return it.valorPor[elegido] || it.valor;
    }
    function calcularAhorro() {
      var separado = ITEMS.reduce(function (a, i) { return a + valorItem(i); }, 0);
      var combo = precioCombo(), transfer = precioTransfer();
      var total = (separado - combo) + (combo - transfer);
      return { separado: separado, combo: separado - combo, transfer: combo - transfer, total: total, pct: Math.round(total / separado * 100) };
    }

    var css = `
    body.cbf-on #single-product{--cbf-red:#d71920;--cbf-ink:#111;--cbf-muted:#6b6b6b;--cbf-line:#e7e7e7;--cbf-soft:#f6f6f6}
    .cbf-hero{position:relative;overflow:hidden;background:#0d0d0d;color:#fff;border-radius:12px;padding:12px 14px;margin:6px 0 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;animation:cbfUp .5s ease both}
    .cbf-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.12) 50%,transparent 70%);transform:translateX(-100%);animation:cbfShine 3.2s ease-in-out infinite;pointer-events:none}
    .cbf-hero-tag{display:flex;flex-direction:column;line-height:1.05}
    .cbf-hero-tag b{font-size:18px;letter-spacing:.06em;font-weight:900}
    .cbf-hero-tag b span{color:var(--cbf-red)}
    .cbf-hero-tag small{font-size:11px;color:#bdbdbd;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
    .cbf-clock{display:flex;align-items:center;gap:4px;font-variant-numeric:tabular-nums}
    .cbf-clock .u{background:#1f1f1f;border:1px solid #2c2c2c;border-radius:6px;min-width:34px;text-align:center;padding:4px 2px}
    .cbf-clock .u b{display:block;font-size:16px;font-weight:800}
    .cbf-clock .u small{display:block;font-size:8px;color:#9a9a9a;text-transform:uppercase;letter-spacing:.06em}
    .cbf-clock .s{color:var(--cbf-red);font-weight:800}
    .cbf-save{position:relative;overflow:hidden;border:0;background:linear-gradient(135deg,#e30613 0%,#b3000c 100%);color:#fff;border-radius:14px;padding:14px 14px 12px;margin:0 0 14px;animation:cbfUp .5s .05s ease both,cbfSaveGlow 2.4s ease-in-out 1s infinite}
    .cbf-save::before{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.08);pointer-events:none}
    .cbf-save::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);transform:translateX(-100%);animation:cbfShine 2.8s ease-in-out infinite;pointer-events:none}
    .cbf-save-top{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px}
    .cbf-save-top b{display:flex;flex-direction:column;color:#fff;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;line-height:1.1}
    .cbf-save-top b em{font-style:normal;color:#fff;font-size:26px;font-weight:900;letter-spacing:-.01em;text-transform:none;margin-top:3px;font-variant-numeric:tabular-nums;text-shadow:0 2px 10px rgba(0,0,0,.18)}
    .cbf-save-pill{background:#fff;color:#e30613;font-weight:900;font-size:18px;padding:8px 12px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,.18);animation:cbfPulse 1.6s ease-in-out infinite;white-space:nowrap;line-height:1}
    .cbf-save-pill small{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;text-align:center;margin-top:2px;color:#111}
    .cbf-save-rows{position:relative;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(255,255,255,.35);font-size:12.5px;color:rgba(255,255,255,.88)}
    .cbf-save-rows div{display:flex;justify-content:space-between;gap:8px;padding:2px 0}
    .cbf-save-rows span:last-child{color:#fff;font-weight:800;white-space:nowrap}
    .cbf-save-rows s{color:rgba(255,255,255,.7)}
    @keyframes cbfSaveGlow{0%,100%{box-shadow:0 6px 18px rgba(227,6,19,.25)}50%{box-shadow:0 8px 28px rgba(227,6,19,.55)}}
    .cbf-contiene{margin:4px 0 18px;animation:cbfUp .5s .1s ease both}
    .cbf-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:10px;gap:8px}
    .cbf-head h3{font-size:15px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin:0;color:var(--cbf-ink)}
    .cbf-head span{font-size:12px;color:var(--cbf-muted);white-space:nowrap}
    .cbf-head span.ok{color:#15803d;font-weight:700}
    .cbf-item{border:1px solid var(--cbf-line);border-radius:12px;background:#fff;margin-bottom:8px;overflow:hidden;transition:border-color .25s,box-shadow .25s;opacity:0;animation:cbfUp .45s ease forwards}
    .cbf-item:nth-child(2){animation-delay:.08s}.cbf-item:nth-child(3){animation-delay:.16s}.cbf-item:nth-child(4){animation-delay:.24s}
    .cbf-item.open{border-color:#cfcfcf;box-shadow:0 6px 18px rgba(0,0,0,.06)}
    .cbf-item.err{border-color:var(--cbf-red);animation:cbfShake .45s ease forwards}
    .cbf-row{display:flex;align-items:center;gap:12px;padding:10px 12px;cursor:pointer;width:100%;background:none;border:0;text-align:left}
    .cbf-thumb{position:relative;width:58px;height:58px;flex:0 0 58px;border-radius:9px;background:var(--cbf-soft);overflow:hidden}
    .cbf-thumb img{width:100%;height:100%;object-fit:contain;transition:opacity .25s,transform .35s}
    .cbf-thumb img.swap{opacity:0;transform:scale(.92)}
    .cbf-info{flex:1;min-width:0;display:block}
    .cbf-name{display:block;font-size:14px;font-weight:700;color:var(--cbf-ink);line-height:1.2}
    .cbf-meta{font-size:12px;color:var(--cbf-muted);margin-top:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
    .cbf-meta s{color:#9a9a9a}
    .cbf-gift{background:#111;color:#fff;font-size:10px;font-weight:800;letter-spacing:.08em;padding:2px 8px;border-radius:999px;display:inline-flex;align-items:center;gap:4px}
    .cbf-gift b{color:#22c55e;font-weight:900}
    .cbf-gift i{display:inline-block;font-style:normal;animation:cbfWiggle 2.4s ease-in-out infinite}
    .cbf-chosen{display:block;font-size:12px;margin-top:4px;color:var(--cbf-ink);font-weight:600}
    .cbf-chosen.pending{color:var(--cbf-red)}
    .cbf-chosen.pending::before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--cbf-red);margin-right:6px;vertical-align:1px;animation:cbfBlink 1.2s ease-in-out infinite}
    .cbf-status{flex:0 0 auto;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cbf-line);transition:all .25s;color:var(--cbf-ink)}
    .cbf-status svg{width:12px;height:12px;transition:transform .3s}
    .cbf-item.open:not(.done) .cbf-status svg{transform:rotate(180deg)}
    .cbf-item.done .cbf-status{background:#111;border-color:#111;color:#fff;animation:cbfPop .35s ease}
    .cbf-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .35s ease}
    .cbf-item.open .cbf-panel{grid-template-rows:1fr}
    .cbf-panel>div{overflow:hidden}
    .cbf-panel-in{padding:2px 0 12px;border-top:1px dashed var(--cbf-line);margin:0 12px}
    .cbf-group{margin-top:12px}
    .cbf-group .form-label{display:block;margin-bottom:8px}
    .cbf-group .form-label strong.pend{color:var(--cbf-red);font-weight:600}
    .cbf-opts-material{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    .cbf-opts-foto{display:flex;flex-wrap:wrap}
    #single-product .cbf-opts-foto .btn-variant-color{position:relative;cursor:pointer}
    #single-product .cbf-opts-foto .btn-variant-color.selected{border:2px solid #e30613 !important}
    #single-product .cbf-opts-foto .btn-variant-content-square{position:relative;overflow:hidden}
    .cbf-fixed{font-size:13px;color:var(--cbf-ink);margin-top:12px;display:flex;align-items:center;gap:10px}
    .cbf-fixed img{width:40px;height:40px;border-radius:5px;object-fit:cover}
    .cbf-link{display:inline-block;margin-top:10px;font-size:12px;color:var(--cbf-muted);text-decoration:underline}
    body.cbf-on #single-product .js-addtocart.cbf-ready{animation:cbfGlow 1.8s ease-in-out infinite}
    .cbf-toast{position:fixed;left:50%;bottom:90px;transform:translate(-50%,20px);opacity:0;background:#111;color:#fff;font-size:13px;padding:10px 14px;border-radius:10px;z-index:100000;max-width:92vw;transition:all .3s;box-shadow:0 8px 24px rgba(0,0,0,.25)}
    .cbf-toast.show{opacity:1;transform:translate(-50%,0)}
    @keyframes cbfUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
    @keyframes cbfShine{0%,60%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
    @keyframes cbfPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
    @keyframes cbfPop{0%{transform:scale(.6)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
    @keyframes cbfShake{0%{opacity:1;transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}100%{opacity:1;transform:none}}
    @keyframes cbfBlink{0%,100%{opacity:1}50%{opacity:.25}}
    @keyframes cbfWiggle{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-14deg)}90%{transform:rotate(12deg)}95%{transform:rotate(-6deg)}}
    @keyframes cbfGlow{0%,100%{box-shadow:0 0 0 0 rgba(255,106,0,.45)}50%{box-shadow:0 0 0 8px rgba(255,106,0,0)}}
    body.cbf-on #single-product #product_form .js-product-variants{display:none !important}
    @media (min-width:768px){.cbf-hero-tag b{font-size:20px}}
    @media (prefers-reduced-motion:reduce){body.cbf-on .cbf-hero::after,body.cbf-on .cbf-save,body.cbf-on .cbf-save::after,body.cbf-on .cbf-save-pill,body.cbf-on .cbf-gift i,body.cbf-on .js-addtocart.cbf-ready{animation:none}}
    `;
    var st = document.createElement('style'); st.id = 'cbf-style'; st.textContent = css; document.head.appendChild(st);
    document.body.classList.add('cbf-on');

    var priceBox = sp.querySelector('.js-price-container');
    var form = sp.querySelector('#product_form');

    // ---------- Banner Black Friday + countdown ----------
    var hero = document.createElement('div'); hero.className = 'cbf-hero';
    hero.innerHTML = '<div class="cbf-hero-tag"><b>BLACK <span>FRIDAY</span></b><small>Combo exclusivo</small></div>' +
      '<div class="cbf-clock" role="timer" aria-label="La oferta termina en"><div class="u"><b data-h>00</b><small>hs</small></div><span class="s">:</span><div class="u"><b data-m>00</b><small>min</small></div><span class="s">:</span><div class="u"><b data-s>00</b><small>seg</small></div></div>';
    var ph = sp.querySelector('section.page-header'); ph.parentNode.insertBefore(hero, ph);
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() { var off = -3 * 3600 * 1000, now = Date.now() + off; var fin = Math.floor(now / 86400000) * 86400000 + 86400000; var r = Math.max(0, Math.floor((fin - now) / 1000));
      hero.querySelector('[data-h]').textContent = pad(Math.floor(r / 3600)); hero.querySelector('[data-m]').textContent = pad(Math.floor(r % 3600 / 60)); hero.querySelector('[data-s]').textContent = pad(r % 60); }
    tick(); setInterval(tick, 1000);

    // ---------- Ahorro: combo + transferencia ----------
    var save = document.createElement('div'); save.className = 'cbf-save';
    save.innerHTML =
      '<div class="cbf-save-top"><b>🔥 Ahorrás hasta<em>$0</em></b><span class="cbf-save-pill"><span data-a="pct"></span><small>OFF</small></span></div>' +
      '<div class="cbf-save-rows">' +
        '<div><span>Por separado (alerón + difusor + pomo)</span><span><s data-a="separado"></s></span></div>' +
        '<div><span>Ahorro por llevar el combo</span><span data-a="combo"></span></div>' +
        '<div><span>Ahorro extra pagando por transferencia</span><span data-a="transfer"></span></div>' +
      '</div>';
    priceBox.parentNode.insertBefore(save, priceBox.nextSibling);

    // Pinta el bloque de ahorro; el total se anima desde el valor anterior
    var ahorroMostrado = 0, ahorroRaf = null, ahorroFirma = '';
    function pintarAhorro() {
      var a = calcularAhorro();
      var firma = [a.separado, a.combo, a.transfer].join('|');
      if (firma === ahorroFirma) return;
      ahorroFirma = firma;
      save.querySelector('[data-a="pct"]').textContent = '-' + a.pct + '%';
      save.querySelector('[data-a="separado"]').textContent = fmt(a.separado);
      save.querySelector('[data-a="combo"]').textContent = '-' + fmt(a.combo);
      save.querySelector('[data-a="transfer"]').textContent = '-' + fmt(a.transfer);
      var em = save.querySelector('em'), desde = ahorroMostrado, hasta = a.total, t0 = performance.now(), dur = desde ? 700 : 1400;
      if (ahorroRaf) cancelAnimationFrame(ahorroRaf);
      function step(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        ahorroMostrado = desde + (hasta - desde) * e;
        em.textContent = fmt(ahorroMostrado);
        if (p < 1) ahorroRaf = requestAnimationFrame(step); else ahorroRaf = null;
      }
      ahorroRaf = requestAnimationFrame(step);
    }
    // Tiendanube reescribe el precio al cambiar de variante: recalcular
    var precioObsTimer;
    new MutationObserver(function () {
      clearTimeout(precioObsTimer);
      precioObsTimer = setTimeout(pintarAhorro, 120);
    }).observe(priceBox, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['data-product-price', 'data-priceraw-without-shipping'] });

    // ---------- Sección Contiene ----------
    var box = document.createElement('section'); box.className = 'cbf-contiene';
    box.innerHTML = '<div class="cbf-head"><h3>Este combo contiene</h3><span class="cbf-head-status"></span></div>';
    var chevron = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 4l4 4 4-4"/></svg>';
    var check = '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 6.5l2.5 2.5L10 3"/></svg>';

    function opcionHTML(g, gi, o) {
      if (g.tipo === 'foto') {
        return '<a class="btn btn-variant btn-variant-color cbf-opt" role="button" title="' + o.v + '" data-g="' + gi + '" data-v="' + o.v + '">' +
          '<span class="btn-variant-content btn-variant-content-square" data-name="' + o.v + '"><img class="img-absolute-centered-vertically" src="' + o.img + '" alt="' + o.v + '"></span></a>';
      }
      return '<a class="btn btn-variant rapa-material-option cbf-opt" role="button" title="' + o.v + '" data-g="' + gi + '" data-v="' + o.v + '">' +
        '<span class="btn-variant-content"><span class="rapa-material-option__image"><img src="' + o.img + '" alt="" loading="lazy"></span>' +
        '<span class="rapa-material-option__label">' + o.v + '</span></span></a>';
    }

    ITEMS.forEach(function (it) {
      sel[it.key] = sel[it.key] || {};
      var card = document.createElement('div'); card.className = 'cbf-item'; card.dataset.key = it.key;
      var meta = it.regalo ? '<span class="cbf-gift"><i>🎁</i> DE <b>REGALO</b></span><s>' + fmt(it.valor) + '</s>' : '<span>Valor <span class="cbf-valor">' + fmt(it.valor) + '</span></span>';
      var panel = '';
      it.grupos.forEach(function (g, gi) {
        panel += '<div class="cbf-group" data-gi="' + gi + '"><label class="form-label">' + g.label + ': <strong class="cbf-glabel"></strong></label>' +
          '<div class="cbf-opts-' + g.tipo + '">' + g.opciones.map(function (o) { return opcionHTML(g, gi, o); }).join('') + '</div></div>';
      });
      if (it.fijo) panel += '<div class="cbf-fixed"><img src="' + TEXTURA.piano + '" alt="">Terminación ' + it.fijo + ' · lista para instalar</div>';
      panel += '<a class="cbf-link" href="' + it.url + '" target="_blank" rel="noopener">Ver detalle del producto</a>';
      card.innerHTML = '<button type="button" class="cbf-row" aria-expanded="false"><span class="cbf-thumb"><img src="' + it.img + '" alt="" loading="lazy"></span>' +
        '<span class="cbf-info"><span class="cbf-name">' + it.nombre + '</span><span class="cbf-meta">' + meta + '</span><span class="cbf-chosen"></span></span>' +
        '<span class="cbf-status">' + chevron + '</span></button><div class="cbf-panel"><div><div class="cbf-panel-in">' + panel + '</div></div></div>';
      box.appendChild(card);

      card.querySelector('.cbf-row').addEventListener('click', function () {
        var open = !card.classList.contains('open');
        box.querySelectorAll('.cbf-item.open').forEach(function (c) { if (c !== card) { c.classList.remove('open'); c.querySelector('.cbf-row').setAttribute('aria-expanded', 'false'); } });
        card.classList.toggle('open', open); this.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      card.querySelectorAll('.cbf-opt').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.preventDefault();
          var g = it.grupos[+b.dataset.g]; sel[it.key][g.prop] = b.dataset.v; card.classList.remove('err'); render(true, it.key);
          if (completo(it)) { var next = ITEMS.filter(function (x) { return !completo(x); })[0]; setTimeout(function () { if (next) abrir(next.key); else card.classList.remove('open'); }, 500); }
        });
      });
    });
    form.parentNode.insertBefore(box, form);

    function completo(it) { return it.grupos.every(function (g) { return sel[it.key][g.prop]; }); }
    function abrir(key) { box.querySelectorAll('.cbf-item').forEach(function (c) { var on = c.dataset.key === key; c.classList.toggle('open', on); c.querySelector('.cbf-row').setAttribute('aria-expanded', on ? 'true' : 'false'); }); }
    function resumen() { var p = []; ITEMS.forEach(function (it) { if (!it.grupos.length) return; p.push(it.nombre.split(' ')[0] + ': ' + it.grupos.map(function (g) { return sel[it.key][g.prop]; }).join(' / ')); }); return p.join(' · '); }

    // Con las variantes cargadas en Tiendanube ("Alerón - Acabado", "Pomo - Color",
    // "Pomo - Acabado") sincroniza los <select> nativos para que la configuración
    // llegue en el pedido como variante.
    function syncVariantes() {
      form.querySelectorAll('.js-product-variants .form-group').forEach(function (grp) {
        var lab = grp.querySelector('label'); var s = grp.querySelector('select.js-variation-option'); if (!lab || !s) return;
        var nombre = lab.textContent.trim().split(':')[0].trim().toLowerCase();
        ITEMS.forEach(function (it) { it.grupos.forEach(function (g) {
          if (g.prop.toLowerCase() === nombre && sel[it.key][g.prop] && s.value !== sel[it.key][g.prop]) { s.value = sel[it.key][g.prop]; s.dispatchEvent(new Event('change', { bubbles: true })); }
        }); });
      });
    }

    function render(anim, changedKey) {
      var listos = 0, total = 0;
      ITEMS.forEach(function (it) {
        var card = box.querySelector('.cbf-item[data-key="' + it.key + '"]'); var chosen = card.querySelector('.cbf-chosen');
        var valorEl = card.querySelector('.cbf-valor'); if (valorEl) valorEl.textContent = fmt(valorItem(it));
        card.querySelectorAll('.cbf-opt').forEach(function (b) { var g = it.grupos[+b.dataset.g]; b.classList.toggle('selected', sel[it.key][g.prop] === b.dataset.v); });
        it.grupos.forEach(function (g, gi) {
          var lbl = card.querySelector('.cbf-group[data-gi="' + gi + '"] .cbf-glabel');
          lbl.textContent = sel[it.key][g.prop] || 'elegí una opción';
          lbl.classList.toggle('pend', !sel[it.key][g.prop]);
        });
        if (!it.grupos.length) { chosen.textContent = it.fijo; chosen.className = 'cbf-chosen'; card.classList.add('done'); card.querySelector('.cbf-status').innerHTML = check; return; }
        total++; var ok = completo(it); if (ok) listos++;
        var faltan = it.grupos.filter(function (g) { return !sel[it.key][g.prop]; }).map(function (g) { return g.label.toLowerCase(); });
        chosen.textContent = ok ? it.grupos.map(function (g) { return sel[it.key][g.prop]; }).join(' · ') : 'Elegí ' + faltan.join(' y ');
        chosen.className = 'cbf-chosen' + (ok ? '' : ' pending');
        card.classList.toggle('done', ok); card.querySelector('.cbf-status').innerHTML = ok ? check : chevron;
        var img = card.querySelector('.cbf-thumb img'), src = it.img;
        if (it.imgs) src = it.imgs[(sel[it.key]['Pomo - Color'] || 'Blanco') + '|' + (sel[it.key]['Pomo - Acabado'] || 'Negro piano brillante')] || it.img;
        else if (it.imgPor) src = it.imgPor[sel[it.key][it.grupos[0].prop]] || it.img;
        if (img.getAttribute('src') !== src) {
          if (anim && changedKey === it.key) { img.classList.add('swap'); setTimeout(function () { img.onload = function () { img.classList.remove('swap'); }; img.src = src; }, 180); }
          else img.src = src;
        }
      });
      var hs = box.querySelector('.cbf-head-status'); var btn = sp.querySelector('.js-addtocart');
      if (listos === total) { hs.textContent = '✔ Combo listo'; hs.className = 'cbf-head-status ok'; btn && btn.classList.add('cbf-ready'); }
      else { hs.textContent = 'Personalizá ' + (total - listos) + (total - listos === 1 ? ' producto' : ' productos'); hs.className = 'cbf-head-status'; btn && btn.classList.remove('cbf-ready'); }
      try { localStorage.setItem(STORE_KEY, JSON.stringify(sel)); } catch (e) {}
      syncVariantes();
      pintarAhorro();
      // El precio del combo puede actualizarse un instante después del cambio de variante
      setTimeout(pintarAhorro, 400);
    }
    render(false);

    function toast(msg) { var t = document.createElement('div'); t.className = 'cbf-toast'; t.textContent = msg; document.body.appendChild(t);
      requestAnimationFrame(function () { t.classList.add('show'); }); setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3200); }

    form.addEventListener('click', function (e) {
      var btn = e.target.closest('.js-addtocart'); if (!btn) return;
      var pend = ITEMS.filter(function (it) { return !completo(it); });
      if (pend.length) { e.preventDefault(); e.stopImmediatePropagation();
        var c = box.querySelector('.cbf-item[data-key="' + pend[0].key + '"]'); c.classList.remove('err'); void c.offsetWidth; c.classList.add('err');
        abrir(pend[0].key); box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        toast('Elegí las opciones del ' + pend[0].nombre.split(' ')[0].toLowerCase() + ' para continuar'); return; }
    }, true);
  }

  function intentar() {
    try { initComboBlackFriday(); } catch (e) { console.warn('[rapa] combo BF', e); }
  }
  function arrancar() {
    intentar();
    setTimeout(intentar, 800);
    setTimeout(intentar, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();

/* ======================================================================
   RAPA IMPORTS · BLACK FRIDAY (solo rama black-friday)
   Portada de Black Friday en la home, sobre la sección Combos:
   - Oculta "El cambio está en tus manos" (antes/después).
   - Sube Combos al primer lugar con fondo oscuro, título BLACK FRIDAY,
     el countdown de Combos (lo crea initBannersCategoriaCarousel) y 3
     beneficios: 25% OFF transferencia · Envío GRATIS · Hasta 6 cuotas.
   - Cinta "Black Friday" y brillo en cada banner; en mobile, "Deslizá
     para ver más combos" + puntos.
   Para volver a la portada normal: cargar script.js desde @main.
   ====================================================================== */
(function () {
  var CSS = `
.bf-combos{position:relative;background:radial-gradient(120% 70% at 50% 0%,#2a0003 0%,#0b0b0b 55%,#000 100%);padding:0 0 44px;overflow:hidden}
.bf-combos::before,.bf-combos::after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;filter:blur(90px);opacity:.35;pointer-events:none;animation:bf-glow 6s ease-in-out infinite alternate}
.bf-combos::before{background:#e30613;top:-160px;left:-140px}
.bf-combos::after{background:#e30613;bottom:-200px;right:-160px;opacity:.22;animation-delay:-3s}
@keyframes bf-glow{to{transform:translate(40px,30px) scale(1.15)}}
.bf-combos>*{position:relative;z-index:1}
.bf-particles{position:absolute!important;inset:0;z-index:0!important;pointer-events:none;overflow:hidden}
.bf-particles span{position:absolute;bottom:-40px;color:#e30613;font:900 22px Montserrat,sans-serif;opacity:0;animation:bf-float linear infinite}
@keyframes bf-float{0%{transform:translateY(0) rotate(0);opacity:0}15%{opacity:.5}85%{opacity:.25}100%{transform:translateY(-110vh) rotate(25deg);opacity:0}}
.bf-hero{text-align:center;padding:34px 16px 6px;font-family:Montserrat,sans-serif;color:#fff}
.bf-title{margin:14px 0 0;font-weight:900;font-size:clamp(44px,9vw,104px);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;color:#fff}
.bf-title .bf-outline{color:transparent;-webkit-text-stroke:2px #fff}
.bf-title .bf-red{color:#e30613;display:block;text-shadow:0 0 28px rgba(227,6,19,.55);animation:bf-flicker 4s infinite}
@keyframes bf-flicker{0%,92%,100%{opacity:1}93%{opacity:.55}94%{opacity:1}96%{opacity:.7}97%{opacity:1}}

.bf-combos .banners-carousel-title{display:none!important}
.bf-combos{scroll-margin-top:var(--bf-header,160px)}
.bf-hero{padding-bottom:22px}
.bf-title .bf-red{display:inline;margin-left:.18em}
@media(max-width:767px){.bf-title .bf-red{display:block;margin-left:0}}
.combos-countdown{display:flex;flex-direction:column;align-items:center;gap:8px;margin:-6px auto 18px;font-family:Montserrat,sans-serif;text-align:center}
.combos-countdown-label{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fff}
.combos-countdown-clock{display:inline-flex;align-items:flex-start;gap:6px}
.combos-countdown-unit{display:flex;flex-direction:column;align-items:center;min-width:58px;padding:8px 6px 6px;background:#fff;color:#000;border-bottom:3px solid #e30613;border-radius:6px;box-shadow:0 6px 24px rgba(227,6,19,.35)}
.combos-countdown-unit b{font-size:26px;font-weight:800;line-height:1;font-variant-numeric:tabular-nums}
.combos-countdown-unit small{margin-top:4px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#777}
.combos-countdown-unit.is-sec b{display:inline-block;animation:bf-tick 1s ease-out infinite}
@keyframes bf-tick{0%{transform:scale(1.18);color:#e30613}40%{transform:scale(1);color:#000}}
.combos-countdown-sep{padding-top:8px;font-size:24px;font-weight:800;line-height:1;color:#e30613;animation:bf-blink 1s steps(1) infinite}
@keyframes bf-blink{50%{opacity:.25}}

.bf-combos .banners-carousel-arrow{display:none!important}
.bf-combos .textbanner{position:relative;outline:2px solid rgba(227,6,19,.7);outline-offset:-2px;overflow:hidden}
.bf-combos .textbanner::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;z-index:2;pointer-events:none;background:linear-gradient(100deg,transparent,rgba(255,255,255,.28),transparent);transform:skewX(-18deg);animation:bf-shine 4.5s ease-in-out infinite}
.bf-combos .js-promotional-banner-container-1 .textbanner::after{animation-delay:1.5s}
.bf-combos .js-promotional-banner-container-3 .textbanner::after{animation-delay:3s}
@keyframes bf-shine{0%,60%{left:-60%}100%{left:130%}}
.bf-ribbon{position:absolute;bottom:16px;left:0;z-index:3;background:#e30613;color:#fff;font:900 11px/1 Montserrat,sans-serif;letter-spacing:.12em;text-transform:uppercase;padding:7px 11px;box-shadow:0 4px 12px rgba(0,0,0,.4);border-radius:0 4px 4px 0}

.bf-swipe,.bf-dots{display:none}
@media(max-width:767px){
  .bf-title .bf-outline{-webkit-text-stroke:1.5px #fff}
  .bf-swipe{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 0;color:#fff;font:700 12px Montserrat,sans-serif;letter-spacing:.14em;text-transform:uppercase}
  .bf-swipe-hand{display:inline-flex;animation:bf-hand 1.6s ease-in-out infinite}
  .bf-swipe-hand svg{width:22px;height:22px;fill:#fff}
  .bf-swipe-chev{display:inline-flex;gap:2px}
  .bf-swipe-chev i{width:7px;height:7px;border-right:2px solid #e30613;border-top:2px solid #e30613;transform:rotate(45deg);animation:bf-chev 1.2s infinite}
  .bf-swipe-chev i:nth-child(2){animation-delay:.15s}.bf-swipe-chev i:nth-child(3){animation-delay:.3s}
  @keyframes bf-hand{0%,100%{transform:translateX(8px)}50%{transform:translateX(-10px)}}
  @keyframes bf-chev{0%,100%{opacity:.2}50%{opacity:1}}
  .bf-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}
  .bf-dots i{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.3);transition:all .3s}
  .bf-dots i.on{width:26px;background:#e30613}
  .bf-combos .banners-carousel-wrapper>.row>.js-promotional-banner-container:not(.banner-clone){animation:bf-peek 1.4s ease-in-out .8s 2}
  @keyframes bf-peek{0%,100%{transform:translateX(0)}45%{transform:translateX(-38px)}}
}

@media(min-width:768px){.combos-countdown-unit{min-width:70px}.combos-countdown-unit b{font-size:32px}}
@media(max-width:767px){.bf-title{font-size:64px}}
.bf-title{margin-top:0}
.bf-title .bf-outline{color:#fff;-webkit-text-stroke:0}
.bf-combos{background:radial-gradient(120% 70% at 50% 0%,#1a0507 0%,#0b0b0b 55%,#000 100%)}
.bf-combos::before{opacity:.11}
.bf-combos::after{opacity:.07}
.bf-title .bf-red{text-shadow:0 0 10px rgba(227,6,19,.15);animation:bf-flicker2 2.2s infinite}
@keyframes bf-flicker2{0%,38%,44%,100%{opacity:1}40%{opacity:.5}42%{opacity:.85}78%{opacity:1}80%{opacity:.6}82%{opacity:1}}
.combos-countdown-unit{box-shadow:0 4px 14px rgba(0,0,0,.45)}
.bf-hero{padding-top:30px}
@media(min-width:768px){.bf-hero{padding-top:48px}}
.bf-particles span{color:#8a1018}
.bf-perks{display:grid!important;grid-template-columns:repeat(3,1fr);gap:12px;max-width:720px;margin:6px auto 28px;padding:0 16px!important;border:0!important}
.bf-block{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 10px 13px;background:rgba(22,22,22,.92);border:1px solid rgba(255,255,255,.1);border-radius:8px;font-family:Montserrat,sans-serif}
.bf-block-k{font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#8c8c8c}
.bf-block-v{margin:6px 0 4px;font-size:24px;font-weight:800;line-height:1;color:#fff;white-space:nowrap}
.bf-block-c{font-size:12px;font-weight:500;color:#b3b3b3}
.bf-green{color:#3bb273}
@media(max-width:767px){
 .bf-perks{gap:6px;margin:4px auto 20px;padding:0 12px!important}
 .bf-block{padding:11px 4px 10px}
 .bf-block-k{font-size:8.5px;letter-spacing:.12em}
 .bf-block-v{font-size:17px;margin:5px 0 3px}
 .bf-block-c{font-size:10px;line-height:1.25}
}
`;

  function aplicarBlackFriday() {
    var home = document.querySelector('.js-home-sections-container');
    if (!home) return true; // no es la home: nada que hacer
    var combos = home.querySelector('[data-store="home-banner-promotional"]');
    var wrapper = combos && combos.querySelector('.banners-carousel-wrapper');
    var cd = wrapper && wrapper.querySelector('.combos-countdown');
    if (!wrapper || !cd) return false; // el carrusel todavía no se armó
    if (combos.classList.contains('bf-combos')) return true; // idempotente

    if (!document.getElementById('bf-css')) {
      var st = document.createElement('style'); st.id = 'bf-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var ba = home.querySelector('[data-store="home-before-after"]');
    if (ba) ba.style.display = 'none';
    combos.classList.add('bf-combos');
    home.insertBefore(combos, home.firstElementChild);

    // Partículas % flotando
    var parts = document.createElement('div'); parts.className = 'bf-particles';
    for (var p = 0; p < 14; p++) {
      var s = document.createElement('span'); s.textContent = p % 3 ? '%' : '★';
      s.style.left = (Math.random() * 100) + '%';
      s.style.fontSize = (14 + Math.random() * 18) + 'px';
      s.style.animationDuration = (9 + Math.random() * 9) + 's';
      s.style.animationDelay = (-Math.random() * 18) + 's';
      parts.appendChild(s);
    }

    // Título
    var hero = document.createElement('div'); hero.className = 'bf-hero';
    hero.innerHTML = '<h2 class="bf-title"><span class="bf-outline">Black</span><span class="bf-red">Friday</span></h2>';
    combos.insertBefore(hero, combos.firstChild);
    combos.insertBefore(parts, combos.firstChild);

    // Countdown existente: estilo BF + segundos animados
    var seg = cd.querySelector('[data-cd="s"]');
    if (seg && seg.parentElement) seg.parentElement.classList.add('is-sec');

    // Beneficios
    var perks = document.createElement('div'); perks.className = 'bf-perks';
    perks.innerHTML =
      '<div class="bf-block"><span class="bf-block-k">Descuento</span><span class="bf-block-v">25% OFF</span><span class="bf-block-c">por transferencia</span></div>' +
      '<div class="bf-block"><span class="bf-block-k">Envío</span><span class="bf-block-v bf-green">GRATIS</span><span class="bf-block-c">a todo el país</span></div>' +
      '<div class="bf-block"><span class="bf-block-k">Cuotas</span><span class="bf-block-v">Hasta 6</span><span class="bf-block-c">con tarjeta</span></div>';
    cd.after(perks);

    // Cintas, swipe y puntos
    combos.querySelectorAll('.textbanner').forEach(function(tb) {
      var r = document.createElement('span'); r.className = 'bf-ribbon'; r.textContent = 'Black Friday'; tb.appendChild(r);
    });
    var row = wrapper.querySelector('.row');
    if (!row) return true;
    var swipe = document.createElement('div'); swipe.className = 'bf-swipe';
    swipe.innerHTML = '<span class="bf-swipe-hand"><svg viewBox="0 0 24 24"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10h.5V8.5a1.5 1.5 0 0 1 3 0V10h.5V9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L4 15.6a1.5 1.5 0 0 1 2.2-2L9 16z"/></svg></span>Deslizá para ver más combos<span class="bf-swipe-chev"><i></i><i></i><i></i></span>';
    wrapper.insertBefore(swipe, row);
    var reales = row.querySelectorAll('.js-promotional-banner-container:not(.banner-clone)').length;
    var dots = document.createElement('div'); dots.className = 'bf-dots';
    for (var d = 0; d < reales; d++) dots.appendChild(document.createElement('i'));
    row.after(dots);
    function updDots() {
      if (!reales) return;
      var first = row.querySelector('.js-promotional-banner-container');
      var step = (first && first.getBoundingClientRect().width) || 1;
      var idx = Math.round(row.scrollLeft / step);
      var real = ((idx - 1) % reales + reales) % reales;
      dots.querySelectorAll('i').forEach(function(el, k) { el.classList.toggle('on', k === real); });
    }
    row.addEventListener('scroll', updDots, { passive: true });
    // Las copias del loop infinito se clonan con la imagen a medio cargar
    combos.querySelectorAll('.banner-clone img.lazyloading').forEach(function(im) {
      im.classList.remove('lazyloading'); im.classList.add('lazyloaded'); im.style.opacity = 1;
    });
    setTimeout(updDots, 120);
    return true;
  }

  function arrancar() {
    var intentos = 0;
    (function intentar() {
      var listo = false;
      try { listo = aplicarBlackFriday(); } catch (e) { console.warn('[rapa] black friday', e); listo = true; }
      if (!listo && ++intentos < 60) setTimeout(intentar, 150);
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();
})();
