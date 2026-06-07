# Personalización de volantes — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un selector de personalización en la página de detalle de los volantes con 4 ejes de opciones, botón "Cotizar volante" que recalcula el precio, etiqueta USD en el precio, ocultar cuotas/transferencia, y extender el WhatsApp del botón "Encargar ahora" con las opciones elegidas + Total.

**Architecture:** Detección por categoría (`body.es-volante` vía breadcrumb / `LS.product.categories`). Datos centralizados en `script.html` (mismo set para todos los volantes). Inyección idempotente de un bloque dentro de `#single-product` debajo del envío gratis. Reutiliza la infra existente de encargo (`body.producto-encargo`, `initEncargoDetalle`, `ensureBtnEncargar`).

**Tech Stack:** HTML/CSS/JS vanilla, pegado al panel de Tiendanube (sin build, sin tests automáticos).

**Nota de verificación:** este proyecto no tiene framework de tests. La verificación de cada tarea es:
1. Pegar `script.html` y/o `style.css` actualizados en el panel de Tiendanube.
2. Recargar la página de un volante en producción (o en preview), y hacer las comprobaciones visuales/comportamiento descritas.
3. **Cero regresión:** comprobar que las páginas de productos no-volantes y el listado siguen exactamente como antes.

**Spec de referencia:** [docs/superpowers/specs/2026-06-07-volantes-personalizacion-design.md](../specs/2026-06-07-volantes-personalizacion-design.md)

---

## Archivos a modificar

- `script.html` — detección de categoría, modelo de datos, inyección del bloque, handlers de selección/cotizar, extensión del mensaje de WhatsApp.
- `style.css` — etiqueta USD, ocultar widgets, layout del bloque + cards, estilos de Cotizar.

Sin nuevos archivos.

---

## Task 1: Detección de categoría "Volantes" (`body.es-volante`)

**Files:**
- Modify: `script.html` (agregar IIFE de detección temprana + invocar desde el MutationObserver)

- [ ] **Step 1: Agregar IIFE de detección temprana**

Insertar el siguiente bloque en `script.html` **inmediatamente debajo** del IIFE de detección temprana de `producto-encargo` (alrededor de la línea 79, justo después del `})()`; que cierra ese IIFE):

```js
  // Detección temprana de categoría "Volantes" (sin parpadeo).
  // Se intenta primero por LS.product.categories (más rápido y robusto si está
  // disponible) y como fallback por el breadcrumb del DOM. Si ninguna fuente
  // está lista al cargar, el MutationObserver de más abajo reintenta.
  function esCategoriaVolante() {
    try {
      if (typeof LS !== 'undefined' && LS.product && Array.isArray(LS.product.categories)) {
        var hit = LS.product.categories.some(function(c) {
          var nombre = (c && (c.name || c.title || c)) || '';
          return String(nombre).toLowerCase().indexOf('volante') !== -1;
        });
        if (hit) return true;
      }
    } catch (_) {}
    var bc = document.querySelector('.breadcrumb, nav.breadcrumb, .js-breadcrumb');
    if (bc) {
      var texto = (bc.innerText || bc.textContent || '').toLowerCase();
      if (texto.indexOf('volante') !== -1) return true;
    }
    return false;
  }

  function aplicarClaseVolante() {
    if (!document.querySelector('#single-product')) return;
    var es = esCategoriaVolante();
    var ya = document.body.classList.contains('es-volante');
    if (es && !ya) document.body.classList.add('es-volante');
    else if (!es && ya) document.body.classList.remove('es-volante');
  }

  (function() {
    aplicarClaseVolante();
  })();
```

- [ ] **Step 2: Invocar desde el MutationObserver y desde `initTiendaNubePersonalizado`**

En el MutationObserver (alrededor de la línea 803-816), agregar la llamada con debounce:

Buscar:
```js
    var observador = new MutationObserver(function() {
      revisarEnvioGratis();
      clearTimeout(_encargoTimer);
      _encargoTimer = setTimeout(marcarProductosEncargo, 300);
```

Modificar a:
```js
    var _volanteTimer = null;
    var observador = new MutationObserver(function() {
      revisarEnvioGratis();
      clearTimeout(_volanteTimer);
      _volanteTimer = setTimeout(aplicarClaseVolante, 100);
      clearTimeout(_encargoTimer);
      _encargoTimer = setTimeout(marcarProductosEncargo, 300);
```

Y dentro de `initTiendaNubePersonalizado()`, después de la línea `initEncargoDetalle();` (línea ~463), agregar:
```js
    aplicarClaseVolante();
    setTimeout(aplicarClaseVolante, 1500);
```

- [ ] **Step 3: Verificar en navegador**

1. Pegar `script.html` actualizado en Tiendanube → Configuración → Códigos de seguimiento → Footer.
2. Abrir un producto de la categoría **Volantes** en la tienda.
3. Abrir DevTools → Console y ejecutar `document.body.classList.contains('es-volante')` → debe devolver `true`.
4. Abrir un producto de **otra categoría** → la misma consulta debe devolver `false`.
5. En el listado / homepage, la clase tampoco debe estar (porque no hay `#single-product`).

- [ ] **Step 4: Commit**

```bash
git add script.html
git commit -m "feat(volantes): detectar categoria y marcar body.es-volante"
```

---

## Task 2: CSS base — etiqueta "USD" y ocultar widgets

**Files:**
- Modify: `style.css` (agregar bloque al final del archivo)

- [ ] **Step 1: Agregar reglas al final de `style.css`**

```css
/* === Volantes (categoría) === */

/* Etiqueta " USD" al lado del precio (principal y comparativo).
   Se usa pseudoelemento para no ensuciar el DOM ni perderlo en
   re-renderizados de Tiendanube. */
body.es-volante #single-product .price-container > span:nth-child(1)::after,
body.es-volante #single-product .price-container > span:nth-child(2)::after {
	content: " USD";
	font-weight: 600;
	font-size: .7em;
	color: inherit;
	letter-spacing: .03em;
}

/* Ocultar widgets de precio que no aplican a volantes en USD */
body.es-volante #single-product .payment-discount-price-product-container,
body.es-volante #single-product .js-product-payments-container,
body.es-volante #single-product .cuotas-encargo-row {
	display: none !important;
}
```

- [ ] **Step 2: Verificar en navegador**

1. Pegar `style.css` actualizado en Tiendanube → Diseño → Editar CSS.
2. Recargar la página de un volante.
3. El precio debe verse como `$320 USD` (con la etiqueta USD al final, fuente más chica).
4. La caja roja "MEJOR PRECIO 25% OFF" **no debe aparecer**.
5. El bloque de cuotas (3 cuotas de... / Ver más detalles) **no debe aparecer**.
6. En productos **no-volantes** todo se mantiene como antes (con cuotas, transferencia y precio sin "USD").

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(volantes): etiqueta USD y ocultar cuotas/transferencia"
```

---

## Task 3: Modelo de datos + inyección del bloque

**Files:**
- Modify: `script.html` (agregar `PERSONALIZACIONES_VOLANTE`, función `initVolantePersonalizacion`, llamada desde `initTiendaNubePersonalizado`)

- [ ] **Step 1: Agregar modelo y función de inyección dentro de `initTiendaNubePersonalizado`**

Insertar el siguiente bloque **antes** del `marcarProductosEncargo()` de la línea ~462 (es decir, dentro de `initTiendaNubePersonalizado` pero antes de la lista de invocaciones al final):

```js
    // === Volantes: personalización con cálculo de precio ===

    var PERSONALIZACIONES_VOLANTE = [
      {
        id: 'grip',
        label: 'Grip',
        opciones: [
          { id: 'micro',     label: 'Cuero microperforado', extra: 0,    porDefecto: true },
          { id: 'liso',      label: 'Cuero liso',           extra: 0 },
          { id: 'alcantara', label: 'Alcantara',            extra: 60.5 }
        ]
      },
      {
        id: 'display',
        label: 'Display LED',
        opciones: [
          { id: 'sin', label: 'Sin display LED', extra: 0,   porDefecto: true },
          { id: 'con', label: 'Con display LED', extra: 145 }
        ]
      },
      {
        id: 'airbag',
        label: 'Cobertor de air-bag',
        opciones: [
          { id: 'original',  label: 'Original',    extra: 0,    porDefecto: true },
          { id: 'liso',      label: 'Cuero liso',  extra: 60.5 },
          { id: 'alcantara', label: 'Alcantara',   extra: 60.5 }
        ]
      },
      {
        id: 'carbono',
        label: 'Fibra de carbono forjada',
        opciones: [
          { id: 'negra',   label: 'Negra brillante', extra: 0,    porDefecto: true },
          { id: 'forjada', label: 'Forjada',         extra: 60.5 }
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

      var title = document.createElement('h3');
      title.className = 'volante-personalizacion__title';
      title.textContent = 'Personalizá tu volante';
      section.appendChild(title);

      PERSONALIZACIONES_VOLANTE.forEach(function(eje) {
        var ejeWrap = document.createElement('div');
        ejeWrap.className = 'volante-personalizacion__eje';
        ejeWrap.setAttribute('data-eje', eje.id);

        var ejeLabel = document.createElement('h4');
        ejeLabel.className = 'volante-personalizacion__eje-label';
        ejeLabel.textContent = eje.label;
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

          var img = document.createElement('div');
          img.className = 'volante-card__img';
          card.appendChild(img);

          var labelEl = document.createElement('span');
          labelEl.className = 'volante-card__label';
          labelEl.textContent = op.label;
          card.appendChild(labelEl);

          opciones.appendChild(card);
        });

        ejeWrap.appendChild(opciones);
        section.appendChild(ejeWrap);
      });

      var btnCotizar = document.createElement('button');
      btnCotizar.type = 'button';
      btnCotizar.className = 'btn btn-cotizar-volante';
      btnCotizar.textContent = 'Cotizar volante';
      section.appendChild(btnCotizar);

      if (insertarDespuesDe && insertarDespuesDe.parentNode) {
        insertarDespuesDe.parentNode.insertBefore(section, insertarDespuesDe.nextSibling);
      } else if (insertarAntesDe && insertarAntesDe.parentNode) {
        insertarAntesDe.parentNode.insertBefore(section, insertarAntesDe);
      }
    }
```

- [ ] **Step 2: Conectar las llamadas y el reintento**

En el bloque de llamadas al final de `initTiendaNubePersonalizado` (donde están las `setTimeout(... , 1500)`), agregar:

```js
    inyectarBloqueVolante();
    setTimeout(inyectarBloqueVolante, 1500);
```

En el MutationObserver, agregar el debounce:
```js
    var _volanteInyectTimer = null;
```
(arriba del observer, junto a `_volanteTimer`)

Y dentro del callback del observer, agregar al inicio del cuerpo:
```js
      clearTimeout(_volanteInyectTimer);
      _volanteInyectTimer = setTimeout(inyectarBloqueVolante, 200);
```

- [ ] **Step 3: Verificar en navegador (sin estilos todavía)**

1. Pegar `script.html` actualizado.
2. Recargar la página de un volante.
3. Inspeccionar el DOM y verificar que existe `<section class="volante-personalizacion">` con el título, 4 ejes y un botón "Cotizar volante" — aunque visualmente esté sin estilizar.
4. Verificar que el bloque aparece **después** del bloque de envío gratis (`<p class="free-shipping-message">` o `<p class="js-product-form-free-shipping-message">`).
5. Recargar varias veces y verificar que **no se duplica** el bloque (idempotencia).
6. En un producto no-volante, el bloque **no debe existir** en el DOM.

- [ ] **Step 4: Commit**

```bash
git add script.html
git commit -m "feat(volantes): inyectar bloque de personalizacion con datos y DOM"
```

---

## Task 4: Estilos del bloque y de las cards

**Files:**
- Modify: `style.css` (agregar al final, debajo del bloque de Task 2)

- [ ] **Step 1: Agregar estilos al final de `style.css`**

```css
/* === Volantes: bloque de personalización === */

body.es-volante #single-product .volante-personalizacion {
	margin: 18px 0 14px 0;
	padding: 0;
}

body.es-volante #single-product .volante-personalizacion__title {
	font-size: 18px;
	font-weight: 700;
	color: #111;
	margin: 0 0 14px 0;
	letter-spacing: -0.01em;
}

body.es-volante #single-product .volante-personalizacion__eje {
	margin-bottom: 14px;
}

body.es-volante #single-product .volante-personalizacion__eje-label {
	font-size: 13px;
	font-weight: 600;
	color: #4b5563;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	margin: 0 0 8px 0;
}

body.es-volante #single-product .volante-personalizacion__opciones {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
}

@media (min-width: 768px) {
	body.es-volante #single-product .volante-personalizacion__opciones {
		grid-template-columns: repeat(4, 1fr);
		gap: 10px;
	}
}

body.es-volante #single-product .volante-card {
	display: flex;
	flex-direction: column;
	align-items: stretch;
	background: #fff;
	border: 2px solid #e5e7eb;
	border-radius: 10px;
	padding: 6px;
	cursor: pointer;
	transition: border-color .15s ease, box-shadow .15s ease;
	text-align: center;
	font-family: inherit;
}

body.es-volante #single-product .volante-card:hover {
	border-color: #9ca3af;
}

body.es-volante #single-product .volante-card.is-active {
	border-color: #e30613;
	box-shadow: 0 0 0 1px #e30613 inset;
}

body.es-volante #single-product .volante-card__img {
	width: 100%;
	aspect-ratio: 1 / 1;
	background:
		repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 6px, #e5e7eb 6px, #e5e7eb 12px);
	border-radius: 6px;
	margin-bottom: 6px;
}

body.es-volante #single-product .volante-card__label {
	font-size: 11px;
	line-height: 1.2;
	color: #111;
	font-weight: 500;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

body.es-volante #single-product .volante-card.is-active .volante-card__label {
	font-weight: 700;
}

@media (min-width: 768px) {
	body.es-volante #single-product .volante-card__label {
		font-size: 12px;
	}
}
```

- [ ] **Step 2: Verificar en navegador**

1. Pegar `style.css` actualizado.
2. Recargar la página de un volante.
3. Verificar visualmente:
   - El título "Personalizá tu volante" se ve grande y en negrita.
   - Cada eje tiene su subtítulo en gris uppercase.
   - Las cards se muestran en grid de 3 columnas en mobile (resize del navegador < 768px) y 4 en desktop.
   - Cada card tiene un placeholder gris a rayas diagonales arriba y el nombre debajo (sin precio visible).
   - La card por defecto de cada eje tiene **borde rojo** y label en bold.
   - Hover sobre cards inactivas cambia el borde a gris medio.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(volantes): estilos del bloque personalizacion y cards en grid"
```

---

## Task 5: Selección de cards por click

**Files:**
- Modify: `script.html` (agregar event listener delegado al final de `inyectarBloqueVolante`)

- [ ] **Step 1: Agregar listener de click delegado**

Dentro de la función `inyectarBloqueVolante`, **justo antes de la inserción en el DOM** (antes del bloque `if (insertarDespuesDe && ...)`) agregar:

```js
      // Delegación de click en cards: una opción activa por eje.
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
        section.dispatchEvent(new CustomEvent('volante:cambio', { bubbles: false }));
      });
```

- [ ] **Step 2: Verificar en navegador**

1. Pegar `script.html` actualizado.
2. Recargar la página de un volante.
3. Click sobre cualquier card inactiva → el borde rojo se mueve a esa card y la label se pone en bold; la card anteriormente activa pierde el rojo.
4. Click sobre la card activa → no pasa nada (no se duplica activación ni se desactiva).
5. Verificar que cada eje mantiene **exactamente una** card activa.
6. Verificar que un eje no afecta al otro (cambiar Grip no toca Display LED).

- [ ] **Step 3: Commit**

```bash
git add script.html
git commit -m "feat(volantes): seleccion exclusiva por eje en cards"
```

---

## Task 6: Botón Cotizar — estilos, cálculo y reset al cambiar

**Files:**
- Modify: `style.css` (estilos del botón + estado cotizado)
- Modify: `script.html` (handler de cotizar + reset)

- [ ] **Step 1: Agregar estilos del botón al final de `style.css`**

```css
/* === Volantes: botón Cotizar (misma pill que .btn-encargar-detalle, negra) === */

body.es-volante #single-product .btn.btn-cotizar-volante {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	gap: 10px !important;
	width: 100% !important;
	max-width: 100% !important;
	min-width: 0 !important;
	box-sizing: border-box !important;
	background: #111 !important;
	color: #fff !important;
	font-weight: 700 !important;
	font-size: 15px !important;
	padding: 16px !important;
	border: 0 !important;
	border-radius: 999px !important;
	letter-spacing: .06em !important;
	box-shadow: 0 8px 24px rgba(0, 0, 0, .22) !important;
	text-transform: none !important;
	text-decoration: none !important;
	margin: 14px 0 0 0 !important;
	cursor: pointer !important;
	font-family: inherit !important;
}

body.es-volante #single-product .btn.btn-cotizar-volante:hover {
	background: #000 !important;
	box-shadow: 0 10px 28px rgba(0, 0, 0, .28) !important;
}

body.es-volante #single-product .btn.btn-cotizar-volante.is-cotizado {
	opacity: 0.6 !important;
	pointer-events: none !important;
	box-shadow: none !important;
}
```

- [ ] **Step 2: Agregar las utilidades de precio y handler de Cotizar**

Dentro de `initTiendaNubePersonalizado`, **antes** del bloque `PERSONALIZACIONES_VOLANTE` agregar:

```js
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
```

- [ ] **Step 3: Cablear el handler de Cotizar + reset al cambiar**

Dentro de `inyectarBloqueVolante`, **después del listener de click de cards** (de Task 5) y **antes** de la inserción al DOM, agregar:

```js
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
      });

      // Cambio en cualquier card: si ya estaba cotizado, vuelve al precio base
      // y re-habilita Cotizar.
      section.addEventListener('volante:cambio', function() {
        if (!btnCotizar.classList.contains('is-cotizado')) return;
        escribirPrecioMostrado(null); // restaura base
        btnCotizar.classList.remove('is-cotizado');
        btnCotizar.textContent = 'Cotizar volante';
      });
```

- [ ] **Step 4: Verificar en navegador**

1. Pegar `script.html` y `style.css` actualizados.
2. Recargar la página de un volante (precio base, por ejemplo, $320).
3. El botón "Cotizar volante" se ve como pill negra ancha debajo de las cards.
4. Sin tocar nada: el precio sigue siendo $320 USD.
5. Cambiar Grip a "Alcantara" → precio sigue siendo $320 USD (no se actualiza).
6. Cambiar Display LED a "Con display LED" → precio sigue siendo $320 USD.
7. Click en "Cotizar volante" → precio cambia a $525,5 USD (320 + 60,5 + 145). El botón pasa a opacidad reducida con texto "Cotizado ✓" y no responde a click.
8. Cambiar Grip a "Cuero liso" → precio vuelve a $320 USD, botón vuelve a habilitado con texto "Cotizar volante".
9. Verificar que un precio entero (ej: total = $465) se muestra como `$465` (sin decimales), y un precio con fracción (ej: $525,5) se muestra con un decimal.

- [ ] **Step 5: Commit**

```bash
git add script.html style.css
git commit -m "feat(volantes): boton cotizar negro con calculo y reset al cambiar"
```

---

## Task 7: Reposicionar "Encargar ahora" debajo de Cotizar + extender mensaje WhatsApp

**Files:**
- Modify: `script.html` (extender `ensureBtnEncargar` para que (a) en volantes inserte el botón después del `.btn-cotizar-volante`, y (b) regenere el `href` con personalizaciones + Total al click).

- [ ] **Step 1: Extender `ensureBtnEncargar` para insertar después de Cotizar en volantes**

En `script.html`, dentro de la función `ensureBtnEncargar` (línea ~290), buscar al final donde dice:

```js
        parent.appendChild(btn);
      }
```

Reemplazar por:

```js
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
              var ejeLabel = (eje.querySelector('.volante-personalizacion__eje-label') || {}).textContent || '';
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
```

> Nota: el `nombre` y `url` ya están definidos como variables locales en `ensureBtnEncargar` (líneas ~297-298). `calcularTotalVolante` y `formatearMontoVolante` están en el scope superior de `initTiendaNubePersonalizado`, accesibles por closure.

- [ ] **Step 2: Verificar en navegador**

1. Pegar `script.html` actualizado.
2. Recargar la página de un volante (recordá que los volantes son productos por encargo, así que `body.producto-encargo` está activo y aparece el botón naranja "Encargar ahora").
3. Verificar que el botón "Encargar ahora" naranja aparece **inmediatamente debajo** del botón "Cotizar volante" (no en su ubicación anterior).
4. Sin cotizar, click derecho sobre "Encargar ahora" → "Copiar dirección" → pegar en un editor de texto y verificar que la URL incluye:
   - Nombre del producto
   - URL del producto
   - Cada eje con su opción seleccionada (Grip, Display LED, Cobertor de air-bag, Fibra de carbono forjada)
   - `Total = $320 USD` (suma de base con todos los defaults = base)
5. Cambiar a Display LED "Con display LED", click derecho sobre Encargar → Total debe decir `$465 USD` (320 + 145), aunque no se haya cotizado.
6. En un producto no-volante por encargo, el botón Encargar debe estar en la zona original (parent de `[data-store="product-buy-button"]`) y con el mensaje genérico sin personalizaciones — sin regresión.

- [ ] **Step 3: Commit**

```bash
git add script.html
git commit -m "feat(volantes): reposicionar encargar y extender mensaje whatsapp con personalizaciones + total"
```

---

## Verificación final (manual, sobre la tienda)

Después de aplicar las 7 tareas, hacer una pasada de regresión en producción/preview:

- [ ] **Volante:** Página de producto de volante muestra título "Personalizá tu volante" debajo del envío gratis, 4 ejes con cards en grid, defaults marcados con borde rojo, Cotizar negro, Encargar naranja debajo, precio con etiqueta USD, sin cuotas ni transferencia.
- [ ] **Flujo de cotización:** Cambiar opciones no mueve el precio. Cotizar lo actualiza. Cambiar después de cotizar lo resetea.
- [ ] **WhatsApp:** El href del botón Encargar contiene las personalizaciones y el Total en vivo.
- [ ] **Otro producto por encargo (no-volante):** Bloque de personalización no aparece, mensaje WhatsApp original (sin personalizaciones), botón Encargar en su posición original.
- [ ] **Producto con stock (no-volante):** Comportamiento intacto. Botón Agregar al carrito, cuotas, transferencia, etc. funcionan como antes.
- [ ] **Listado / homepage:** Sin cambios. Badge encargo y otros elementos del listado funcionan como antes.
- [ ] **Carga sin parpadeo:** En página de volante, el bloque aparece sin flash visible de contenido fuera de posición.
