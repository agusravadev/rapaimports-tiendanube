# Rediseño bloque de compra (producto por encargo) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el bloque de compra de la página de detalle cuando la variante activa es por encargo (`body.producto-encargo`) con el diseño v6-compact: bloque transferencia compacto en light green, row custom "3 cuotas sin interés", y CTA pill naranja con ícono de WhatsApp. Sin regresión en productos con stock físico.

**Architecture:** Cero infraestructura nueva. Todas las reglas CSS se scopean a `body.producto-encargo #single-product …` y se concatenan al final de `style.css`. Los cambios JS son: (a) reemplazar el `innerHTML` del botón inyectado por `ensureBtnEncargar()` para incluir el SVG de WhatsApp, y (b) agregar una función `initCuotasEncargo()` que lee el modal `#info-payment-method-credit_card` para encontrar el row de 3 cuotas sin interés, lo formatea como info-row e inserta después del bloque transferencia. Se invoca desde `aplicarEstado()` de `initEncargoDetalle` y desde el `setTimeout(1500)` de bootstrap.

**Tech Stack:** Plain CSS3, vanilla JavaScript ES5 (compatibilidad con tema Tiendanube), sin build system. Verificación manual en la tienda en vivo (panel Tiendanube → Diseño → Editar CSS y Configuración → Códigos de seguimiento → Footer).

**Spec de referencia:** [`docs/superpowers/specs/2026-06-06-rediseno-bloque-compra-encargo-design.md`](../specs/2026-06-06-rediseno-bloque-compra-encargo-design.md)

**Mockup aprobado:** `.superpowers/brainstorm/695-1780714342/content/encargo-final-v6-compact.html`

---

## Decisión menor: punto de inserción del row de cuotas

El spec §6 sugiere insertar el row antes del CTA (`ctaBtn.parentNode.insertBefore(row, ctaBtn)`). Sin embargo, el orden natural del DOM coloca `.js-product-payments-container` y `.js-product-form-free-shipping-message` entre el transfer block y el CTA. Para respetar el orden del mockup (transferencia → cuotas → envío → CTA), el plan inserta el row **después de `.payment-discount-price-product-container`** y oculta el `.js-product-payments-container` original vía CSS en encargo.

---

## File Structure

**A modificar:**
- `style.css` — append nuevo bloque de reglas scopeadas al final (~50-70 líneas).
- `script.html` — modificar `ensureBtnEncargar()` (líneas 290-311), agregar nueva función `initCuotasEncargo()` después de `initEncargoDetalle()` (después de la línea 345), agregar 2 wirings.

**Sin cambios:**
- `Default-structure/encargo.html`, `Default-structure/stock.html`
- Reglas existentes en `style.css` para productos con stock
- Lógica de detección temprana, `marcarProductosEncargo`, `revisarEnvioGratis`, etc.

---

## Cómo se verifica cada task (no hay test runner)

Este proyecto inyecta el código a mano en el panel de Tiendanube. No hay test runner ni servidor local. Por lo tanto, cada task se verifica así:

1. **Tras el cambio**: copiar el bloque modificado al panel correspondiente:
   - `style.css` → panel Tiendanube → Diseño → Editar CSS → pegar contenido completo → Guardar.
   - `script.html` → panel Tiendanube → Configuración → Códigos de seguimiento → Footer → pegar contenido completo → Guardar.
2. **Abrir 3 URLs de prueba en pestañas separadas** (anotar antes de empezar):
   - Producto **100% por encargo** (todas las variantes 9999).
   - Producto **con stock físico** (todas las variantes con stock < 9999).
   - Producto **con variantes mixtas** (al menos una variante 9999 y al menos una con stock).
3. **Hard refresh** (Ctrl+F5) en cada URL después de cada cambio.
4. **Confirmar el resultado esperado** del task antes de commitear.

Si no tenés a mano URLs candidatas, en la sección "Setup" pedile al usuario que las anote antes de empezar el Task 1.

---

## Task 0: Setup

**Files:** *(ninguno modificado)*

- [ ] **Step 0.1: Confirmar la rama**

```bash
git branch --show-current
```

Esperado: `feat/redesign-product-ui`. Si no, hacer `git checkout feat/redesign-product-ui`.

- [ ] **Step 0.2: Anotar 3 URLs de prueba**

Pedir al usuario:
- URL_ENCARGO (todas las variantes stock 9999)
- URL_STOCK (todas las variantes con stock real)
- URL_MIXTO (variantes mixtas: algunas 9999, otras con stock)

Anotarlas en un scratch buffer; se reusan en cada task.

- [ ] **Step 0.3: Tomar screenshot del estado actual**

En URL_ENCARGO, hacer screenshot del bloque de compra antes de cualquier cambio. Sirve de antes/después y como rollback visual si algo se rompe.

---

## Task 1: CSS — Bloque transferencia rediseñado (encargo)

**Files:**
- Modify: `style.css` (append al final)

Esta task aplica los cambios visuales del §4 del spec al recuadro verde de transferencia, scopeados a `body.producto-encargo`. El recuadro pasa a tener fondo degradé, label arriba del recuadro, pill `−25%` con border-radius 6px.

- [ ] **Step 1.1: Append el bloque CSS al final de `style.css`**

Append (no reemplazar nada existente):

```css

/* ============================================================
   REDISEÑO BLOQUE COMPRA — PRODUCTO POR ENCARGO (2026-06-06)
   Scope: body.producto-encargo #single-product
   Spec:  docs/superpowers/specs/2026-06-06-rediseno-bloque-compra-encargo-design.md
   ============================================================ */

/* Bloque transferencia: fondo degradé, label adentro arriba, pill -25% suave */
body.producto-encargo #single-product .payment-discount-price-product-container {
	background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%) !important;
	border: 1px solid #bbf7d0 !important;
	border-radius: 12px !important;
	padding: 8px 14px 12px !important;
	margin-top: 14px !important;
	margin-bottom: 12px !important;
	overflow: visible !important;
}

/* Label "MEJOR PRECIO · TRANSFERENCIA" anclado al top adentro del recuadro */
body.producto-encargo #single-product .payment-discount-price-product-container::before {
	content: "Mejor precio · Transferencia" !important;
	position: static !important;
	display: block !important;
	font-size: 10px !important;
	font-weight: 800 !important;
	letter-spacing: 0.14em !important;
	text-transform: uppercase !important;
	color: #15803d !important;
	margin: 0 0 4px !important;
	white-space: nowrap !important;
	line-height: 1.2 !important;
}

/* Badge "-25%" como pill rounded rectangle (no esquina asimétrica) */
body.producto-encargo #single-product .payment-discount-price-product-container::after {
	content: "−25%" !important;
	position: absolute !important;
	top: 8px !important;
	right: 14px !important;
	background: #16a34a !important;
	color: #ffffff !important;
	font-size: 12px !important;
	font-weight: 800 !important;
	padding: 5px 10px !important;
	border-radius: 6px !important;
	letter-spacing: 0.02em !important;
	line-height: 1.2 !important;
}

/* Precio de transferencia — más grande y peso fuerte */
body.producto-encargo #single-product .js-payment-discount-price-product {
	font-size: 24px !important;
	font-weight: 800 !important;
	color: #15803d !important;
	line-height: 1.1 !important;
	letter-spacing: -0.01em !important;
	margin-right: 0 !important;
}

/* Ocultar el texto "con Transferencia" inline en encargo */
body.producto-encargo #single-product .payment-discount-price-product-container > span:nth-child(2),
body.producto-encargo #single-product .js-payment-discount-name-product {
	display: none !important;
}

/* Ocultar la línea AHORRAS $xxx que inyecta initTransferSavingsProduct */
body.producto-encargo #single-product .transfer-savings-label,
body.producto-encargo #single-product .js-transfer-savings-label {
	display: none !important;
}
```

- [ ] **Step 1.2: Pegar el CSS completo en el panel de Tiendanube**

Panel → Diseño → Editar CSS → reemplazar todo el contenido con el `style.css` actualizado → Guardar.

- [ ] **Step 1.3: Verificar en URL_ENCARGO (hard refresh)**

Esperado en el bloque transferencia:
- Fondo verde claro con leve degradé.
- Label `MEJOR PRECIO · TRANSFERENCIA` adentro arriba, peso 800, color verde oscuro.
- Precio `$721.500,00` (o el del producto) grande, peso 800, color verde.
- Pill `−25%` esquina superior derecha, rounded rectangle, NO con esquina asimétrica.
- Sin el texto "con Transferencia" al lado del precio.
- Sin la línea "AHORRAS $..." debajo.

- [ ] **Step 1.4: Verificar en URL_STOCK (hard refresh)**

Esperado: bloque transferencia **idéntico al de antes del cambio**. Texto "MEJOR PRECIO 🔥" arriba afuera del recuadro, badge "25% OFF" con esquina asimétrica, línea "AHORRAS $..." debajo. **Cero diferencia visual** con el estado anterior.

Si hay diferencia en URL_STOCK → revisar que todas las reglas nuevas tengan el prefijo `body.producto-encargo`.

- [ ] **Step 1.5: Verificar en URL_MIXTO**

Cambiar entre variantes:
- Variante con stock → diseño actual.
- Variante por encargo → diseño nuevo.
- Toggle reactivo sin recargar página.

- [ ] **Step 1.6: Commit**

```bash
git add style.css
git commit -m "feat(encargo): rediseno bloque transferencia scopeado a body.producto-encargo"
```

---

## Task 2: CSS — CTA pill naranja con ícono WhatsApp (encargo)

**Files:**
- Modify: `style.css` (append después del bloque del Task 1)

- [ ] **Step 2.1: Append el CSS del CTA al final de `style.css`**

```css

/* CTA pill naranja con sombra suave (reemplaza btn-primary rectangular en encargo) */
body.producto-encargo #single-product .btn-encargar-detalle {
	display: flex !important;
	align-items: center !important;
	justify-content: center !important;
	gap: 10px !important;
	width: 100% !important;
	background: #ea580c !important;
	color: #ffffff !important;
	font-weight: 700 !important;
	font-size: 15px !important;
	padding: 16px !important;
	border: 0 !important;
	border-radius: 999px !important;
	letter-spacing: 0.06em !important;
	box-shadow: 0 8px 24px rgba(234, 88, 12, 0.28) !important;
	text-transform: none !important;
	text-decoration: none !important;
}

body.producto-encargo #single-product .btn-encargar-detalle:hover {
	background: #c2410c !important;
	box-shadow: 0 10px 28px rgba(234, 88, 12, 0.35) !important;
}

body.producto-encargo #single-product .btn-encargar-detalle svg {
	width: 18px !important;
	height: 18px !important;
	flex-shrink: 0 !important;
}
```

- [ ] **Step 2.2: Pegar el CSS en el panel y guardar**

Panel → Diseño → Editar CSS → reemplazar todo → Guardar.

- [ ] **Step 2.3: Verificar en URL_ENCARGO**

Esperado:
- CTA naranja sigue mostrándose como rectangular **porque el JS aún no inyecta el SVG**.
- Pero ya tiene esquinas redondeadas (pill), sombra naranja difusa, y padding 16px.

**No-regresión:** El texto sigue siendo "Encargar" (hasta el Task 3). El estilo cambió, el texto no.

- [ ] **Step 2.4: Verificar en URL_STOCK**

Esperado: botón "Agregar al carrito" original SIN CAMBIOS. (No tiene clase `.btn-encargar-detalle`, así que las reglas no aplican.)

- [ ] **Step 2.5: Commit**

```bash
git add style.css
git commit -m "feat(encargo): CTA pill naranja con sombra para btn-encargar-detalle"
```

---

## Task 3: JS — Cambiar `ensureBtnEncargar` para inyectar SVG WhatsApp + texto "Encargar ahora"

**Files:**
- Modify: `script.html` líneas 290-311 (función `ensureBtnEncargar` dentro de `initEncargoDetalle`)

- [ ] **Step 3.1: Modificar el bloque de creación del botón**

Localizar en `script.html` el bloque actual (líneas ~301-310):

```javascript
        var btn = document.createElement('a');
        btn.href = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensaje);
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        // Imita layout de Agregar al carrito (btn-block + mb-4) para que
        // ocupe el mismo espacio. mt-3 da separación contra el bloque de
        // envío gratis en productos sin variantes.
        btn.className = 'btn btn-primary btn-block mt-3 mb-4 btn-encargar btn-encargar-detalle';
        btn.textContent = 'Encargar';
        parent.appendChild(btn);
```

Reemplazarlo por:

```javascript
        var btn = document.createElement('a');
        btn.href = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensaje);
        btn.target = '_blank';
        btn.rel = 'noopener noreferrer';
        // Imita layout de Agregar al carrito (btn-block + mb-4) para que
        // ocupe el mismo espacio. mt-3 da separación contra el bloque de
        // envío gratis en productos sin variantes.
        btn.className = 'btn btn-primary btn-block mt-3 mb-4 btn-encargar btn-encargar-detalle';
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">' +
            '<path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.4-3.8-3.2-.3-.5.3-.4.8-1.4.1-.2.1-.4 0-.5-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.3 5.3 4.6 2 .8 2.8.9 3.8.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>' +
          '</svg>' +
          '<span>Encargar ahora</span>';
        parent.appendChild(btn);
```

Único cambio: `btn.textContent = 'Encargar';` → bloque `btn.innerHTML = ...` con SVG + span.

- [ ] **Step 3.2: Pegar el `script.html` completo en el panel**

Panel → Configuración → Códigos de seguimiento → Footer → reemplazar contenido → Guardar.

- [ ] **Step 3.3: Verificar en URL_ENCARGO**

Esperado:
- CTA naranja pill (del Task 2) con **ícono de WhatsApp blanco** al izquierda y texto **"Encargar ahora"** centrado.
- Click abre `wa.me/542364626266` con el mensaje pre-armado (sin cambios funcionales).

- [ ] **Step 3.4: Verificar en URL_STOCK**

Esperado: NO existe el botón `.btn-encargar-detalle` (la función `initEncargoDetalle` no lo inyecta para stock). Botón "Agregar al carrito" intacto.

- [ ] **Step 3.5: Verificar en URL_MIXTO**

Cambiar variantes:
- Variante stock → no aparece btn-encargar-detalle.
- Variante encargo → aparece botón nuevo con SVG + "Encargar ahora".

- [ ] **Step 3.6: Commit**

```bash
git add script.html
git commit -m "feat(encargo): CTA Encargar con SVG WhatsApp inline y texto Encargar ahora"
```

---

## Task 4: JS — Nueva función `initCuotasEncargo()`

**Files:**
- Modify: `script.html` — agregar función después de `initEncargoDetalle` (después de la línea ~345, antes de `initTransferSavingsProduct`)

Esta task agrega la función pero **no la wirea**. Se prueba aisladamente en consola del navegador antes de wiring.

- [ ] **Step 4.1: Insertar la nueva función en `script.html`**

Localizar el cierre de `initEncargoDetalle` (línea ~345):

```javascript
      aplicarEstado();
    }

    // 4. "AHORRAS $xxx" debajo del bloque transferencia en página de producto
    function initTransferSavingsProduct() {
```

Insertar entre las dos funciones (después de `aplicarEstado(); }` y antes del comentario `// 4. "AHORRAS $xxx"`):

```javascript
      aplicarEstado();
    }

    // 3c. Cuotas reactivas en página de detalle — reemplaza el widget de pagos
    //     original por un row custom "3 cuotas sin interés de $X" cuando la
    //     variante activa es por encargo. Fuente: modal #info-payment-method-credit_card
    //     (filas tr.js-payment-provider-installments-row con amount===3 + texto
    //     "sin interés" en la primera celda). Si no encuentra match, no inserta
    //     nada y deja el row del widget original oculto vía CSS.
    function initCuotasEncargo() {
      var single = document.querySelector('#single-product');
      if (!single) return;

      // Quitar row previo si existe (re-evaluación por cambio de variante)
      var existing = single.querySelector('.js-cuotas-encargo-row');
      if (existing) existing.remove();

      // Si no es encargo → no insertar nada (el row queda removido arriba)
      if (!document.body.classList.contains('producto-encargo')) return;

      // Buscar 3 cuotas sin interés en el modal de pagos
      var precio3sinInteres = null;
      var rows = document.querySelectorAll(
        '#info-payment-method-credit_card tr.js-payment-provider-installments-row'
      );
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var amountEl = row.querySelector('.js-installment-amount');
        if (!amountEl) continue;
        if (parseInt(amountEl.textContent, 10) !== 3) continue;
        var firstCell = row.querySelector('td');
        if (!firstCell) continue;
        if (!/sin\s+inter[eé]s/i.test(firstCell.textContent)) continue;
        var priceEl = row.querySelector('.js-installment-price');
        if (!priceEl) continue;
        precio3sinInteres = priceEl.textContent.trim();
        break;
      }

      // Fallback opcional: comparar total con precio base si no hubo match textual
      if (!precio3sinInteres) {
        var baseEl = single.querySelector('.js-price-display[data-product-price]');
        if (baseEl) {
          var baseCents = parseInt(baseEl.getAttribute('data-product-price'), 10);
          for (var j = 0; j < rows.length; j++) {
            var r = rows[j];
            var aEl = r.querySelector('.js-installment-amount');
            if (!aEl || parseInt(aEl.textContent, 10) !== 3) continue;
            var totalEl = r.querySelector('.js-installment-total-price');
            if (!totalEl) continue;
            var totalCents = parseInt(
              totalEl.textContent.replace(/[^\d]/g, ''), 10
            );
            if (!baseCents || !totalCents) continue;
            // Tolerancia: 100 centavos
            if (Math.abs(totalCents - baseCents) <= 100) {
              var pEl = r.querySelector('.js-installment-price');
              if (pEl) { precio3sinInteres = pEl.textContent.trim(); break; }
            }
          }
        }
      }

      if (!precio3sinInteres) return;

      // Anclaje: después del bloque transferencia
      var anchor = single.querySelector('.payment-discount-price-product-container');
      if (!anchor || !anchor.parentNode) return;

      var newRow = document.createElement('div');
      newRow.className = 'js-cuotas-encargo-row cuotas-encargo-row';
      newRow.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
          '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/>' +
        '</svg>' +
        '<span>3 cuotas sin interés de <strong>' + precio3sinInteres + '</strong></span>';

      // Insertar después del anchor
      if (anchor.nextSibling) {
        anchor.parentNode.insertBefore(newRow, anchor.nextSibling);
      } else {
        anchor.parentNode.appendChild(newRow);
      }
    }

    // 4. "AHORRAS $xxx" debajo del bloque transferencia en página de producto
    function initTransferSavingsProduct() {
```

- [ ] **Step 4.2: Pegar el `script.html` completo en el panel y guardar**

Panel → Configuración → Códigos de seguimiento → Footer → reemplazar contenido → Guardar.

- [ ] **Step 4.3: Verificación aislada de la función en consola**

En URL_ENCARGO, abrir DevTools → Console. Ejecutar:

```javascript
initCuotasEncargo();
```

Esperado:
- Si el producto tiene 3 cuotas sin interés disponibles → aparece un nuevo `<div class="js-cuotas-encargo-row cuotas-encargo-row">` después del bloque transferencia (sin estilizar todavía, va a verse feo — eso lo arregla el Task 6).
- Si no tiene 3 cuotas sin interés → no aparece nada.

Verificar en DOM:

```javascript
document.querySelector('.js-cuotas-encargo-row')?.outerHTML;
```

Esperado: HTML con el SVG + texto `3 cuotas sin interés de $X.XXX,XX` (X siendo el monto real del modal).

Re-ejecutar `initCuotasEncargo()` segunda vez: el row no se duplica (la función remueve el anterior antes de insertar).

- [ ] **Step 4.4: Verificar fallback (sin encargo)**

En URL_STOCK, en Console:

```javascript
initCuotasEncargo();
```

Esperado: no inserta nada (`body.producto-encargo` no está presente).

- [ ] **Step 4.5: Commit**

```bash
git add script.html
git commit -m "feat(encargo): funcion initCuotasEncargo lee 3 cuotas sin interes del modal"
```

---

## Task 5: JS — Wire `initCuotasEncargo` en `aplicarEstado` y bootstrap

**Files:**
- Modify: `script.html` líneas ~318-332 (función `aplicarEstado` dentro de `initEncargoDetalle`)
- Modify: `script.html` líneas ~376-385 (bootstrap calls)

- [ ] **Step 5.1: Llamar a `initCuotasEncargo` desde `aplicarEstado`**

Localizar `aplicarEstado()` dentro de `initEncargoDetalle()` (líneas ~318-332):

```javascript
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
      }
```

Reemplazar por:

```javascript
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
```

Único cambio: agregar `initCuotasEncargo();` al final de `aplicarEstado()`.

- [ ] **Step 5.2: Agregar bootstrap calls**

Localizar el bloque de llamadas de inicialización (líneas ~376-385):

```javascript
    marcarProductosEncargo();
    initEncargoDetalle();
    revisarEnvioGratis();
    initTransferSavings();
    initTransferSavingsProduct();
    setTimeout(marcarProductosEncargo, 1500);
    setTimeout(initEncargoDetalle, 1500);
    initMarqueeAdbar();
    setTimeout(initMarqueeAdbar, 200);
    setTimeout(initBrandsMarquee, 1000);
```

Reemplazar por:

```javascript
    marcarProductosEncargo();
    initEncargoDetalle();
    revisarEnvioGratis();
    initTransferSavings();
    initTransferSavingsProduct();
    initCuotasEncargo();
    setTimeout(marcarProductosEncargo, 1500);
    setTimeout(initEncargoDetalle, 1500);
    setTimeout(initCuotasEncargo, 1500);
    initMarqueeAdbar();
    setTimeout(initMarqueeAdbar, 200);
    setTimeout(initBrandsMarquee, 1000);
```

Cambios: agregar `initCuotasEncargo();` después de `initTransferSavingsProduct()`, y `setTimeout(initCuotasEncargo, 1500);` después del setTimeout de `initEncargoDetalle`.

- [ ] **Step 5.3: Pegar el `script.html` completo en el panel y guardar**

Panel → Configuración → Códigos de seguimiento → Footer → reemplazar contenido → Guardar.

- [ ] **Step 5.4: Verificar en URL_ENCARGO (hard refresh)**

Esperado:
- Sin abrir consola, el row `3 cuotas sin interés de $X` aparece automáticamente después del bloque transferencia (puede demorar hasta 1.5s si el modal de pagos carga tardío).
- Aún sin estilo final (eso lo aplica el Task 6).

- [ ] **Step 5.5: Verificar en URL_MIXTO**

- Cargar URL_MIXTO en una variante con stock → row "3 cuotas sin interés" **NO** debe aparecer.
- Cambiar a variante por encargo → row aparece (puede demorar 30ms).
- Volver a variante con stock → row desaparece.

- [ ] **Step 5.6: Verificar en URL_STOCK (hard refresh)**

Esperado: el widget de cuotas original de Tiendanube (`.js-product-payments-container`) sigue visible y funcional. Sin row `.js-cuotas-encargo-row`.

- [ ] **Step 5.7: Commit**

```bash
git add script.html
git commit -m "feat(encargo): wire initCuotasEncargo en aplicarEstado y bootstrap"
```

---

## Task 6: CSS — Estilo del row custom de cuotas + ocultar widget original en encargo

**Files:**
- Modify: `style.css` (append al final, después de los bloques del Task 1 y 2)

- [ ] **Step 6.1: Append el CSS al final de `style.css`**

```css

/* Row custom "3 cuotas sin interés" — estilo info-row coherente con el resto */
body.producto-encargo #single-product .cuotas-encargo-row {
	display: flex !important;
	gap: 10px !important;
	align-items: center !important;
	padding: 12px 14px !important;
	border: 1px solid #e5e7eb !important;
	border-radius: 10px !important;
	font-size: 13px !important;
	color: #374151 !important;
	margin-bottom: 8px !important;
	background: transparent !important;
}

body.producto-encargo #single-product .cuotas-encargo-row svg {
	width: 18px !important;
	height: 18px !important;
	color: #6b7280 !important;
	flex-shrink: 0 !important;
}

body.producto-encargo #single-product .cuotas-encargo-row strong {
	color: #0a0a0a !important;
	font-weight: 700 !important;
}

/* Ocultar el widget de pagos original de Tiendanube en encargo
   (reemplazado por .cuotas-encargo-row inyectado por initCuotasEncargo) */
body.producto-encargo #single-product .js-product-payments-container {
	display: none !important;
}
```

- [ ] **Step 6.2: Pegar el CSS completo en el panel y guardar**

Panel → Diseño → Editar CSS → reemplazar todo → Guardar.

- [ ] **Step 6.3: Verificar en URL_ENCARGO (hard refresh)**

Esperado, en orden vertical:
1. Pill naranja `Producto por encargo` + eta.
2. Precio regular.
3. Bloque transferencia rediseñado (verde claro, label arriba, pill `−25%`).
4. **Row `3 cuotas sin interés de $X.XXX,XX`** con ícono tarjeta + borde gris claro.
5. Envío gratis (sin cambios).
6. CTA pill `Encargar ahora` con WhatsApp.

El widget original de cuotas de Tiendanube (`.js-product-payments-container`) NO debe verse.

- [ ] **Step 6.4: Verificar en URL_STOCK (hard refresh)**

Esperado: widget de cuotas original de Tiendanube **visible y sin cambios**. Cero regresión.

Si está oculto en stock → la regla `display:none` no está scopeada correctamente. Verificar el prefijo `body.producto-encargo`.

- [ ] **Step 6.5: Verificar en URL_MIXTO**

- Variante con stock → widget original visible, sin `.cuotas-encargo-row`.
- Variante por encargo → widget original oculto, `.cuotas-encargo-row` visible.
- Toggle reactivo sin recargar.

- [ ] **Step 6.6: Verificar fallback — producto sin 3 cuotas sin interés**

Si hay disponible un producto por encargo SIN promoción de 3 cuotas sin interés (o se simula removiendo la fila en DevTools antes de re-ejecutar `initCuotasEncargo()`):
- El row `.cuotas-encargo-row` NO debe aparecer.
- El widget original también queda oculto (decisión explícita del spec §6).
- Resultado: entre transfer y envío no hay nada extra.

- [ ] **Step 6.7: Commit**

```bash
git add style.css
git commit -m "feat(encargo): estilo cuotas-encargo-row + ocultar widget original en encargo"
```

---

## Task 7: Verificación final y acceptance del spec §10

**Files:** *(ninguno modificado — solo verificación)*

- [ ] **Step 7.1: Checklist visual completo en URL_ENCARGO**

Comparar contra el mockup `.superpowers/brainstorm/695-1780714342/content/encargo-final-v6-compact.html`:

- [ ] Pill naranja `Producto por encargo` arriba.
- [ ] Eta `15 a 20 días hábiles` al lado del pill.
- [ ] Precio regular en negro grande.
- [ ] Bloque transferencia: fondo verde claro degradé, label arriba, pill `−25%` rounded rectangle.
- [ ] Precio de transferencia en verde, peso 800, ~24px.
- [ ] Sin "con Transferencia" inline. Sin "AHORRAS $...".
- [ ] Row `3 cuotas sin interés de $X.XXX,XX` con ícono tarjeta.
- [ ] Row envío gratis sin cambios.
- [ ] CTA pill naranja con WhatsApp icon + texto "Encargar ahora".

- [ ] **Step 7.2: Checklist no-regresión en URL_STOCK**

- [ ] Bloque transferencia con el diseño anterior (label `MEJOR PRECIO 🔥` arriba afuera, badge esquina, AHORRAS abajo).
- [ ] Widget de cuotas original visible (24 cuotas, etc.).
- [ ] Botón Agregar al carrito intacto.
- [ ] Envío gratis sin cambios.

- [ ] **Step 7.3: Checklist transición reactiva en URL_MIXTO**

- [ ] Al cargar la página en variante con stock → diseño actual.
- [ ] Click en swatch de variante por encargo → toggle a diseño nuevo sin recargar, sin parpadeo visible.
- [ ] Click en swatch de variante con stock → vuelve al diseño actual.

- [ ] **Step 7.4: Checklist mobile (≤480px)**

Abrir DevTools → device toolbar → iPhone SE (375px). Verificar en URL_ENCARGO:
- Bloque transferencia no se corta, pill `−25%` no se superpone con el precio.
- CTA pill ocupa el ancho disponible, ícono visible.
- Row cuotas legible.

- [ ] **Step 7.5: Click manual al CTA**

Click al botón "Encargar ahora". Debe abrir WhatsApp con el mensaje pre-armado correcto (nombre del producto + URL canónica).

- [ ] **Step 7.6: Actualizar CLAUDE.md con la nueva mecánica**

Localizar en `CLAUDE.md` la sección `### Convención "producto por encargo" (stock 9999)` → subsección "CSS (visualización, `style.css`)".

Agregar al final de esa subsección:

```markdown
- En la página de producto, cuando `body.producto-encargo` está activo el bloque transferencia se rediseña (light gradient, label `MEJOR PRECIO · TRANSFERENCIA` adentro arriba, pill `−25%` rounded rectangle, sin texto "AHORRAS" ni "con Transferencia"). El widget original de cuotas (`.js-product-payments-container`) se oculta y se reemplaza por un row custom `.cuotas-encargo-row` que la función `initCuotasEncargo()` inyecta con el monto real de "3 cuotas sin interés" leído del modal `#info-payment-method-credit_card`. El CTA `.btn-encargar-detalle` se estiliza como pill naranja con ícono SVG de WhatsApp y texto "Encargar ahora".
```

- [ ] **Step 7.7: Commit final**

```bash
git add CLAUDE.md
git commit -m "docs: documentar rediseno bloque compra encargo en CLAUDE.md"
```

- [ ] **Step 7.8: Resumen al usuario**

Confirmar al usuario:
- Rama `feat/redesign-product-ui` lista para merge.
- Cambios: `style.css` (+~80 líneas al final), `script.html` (modificación de 1 bloque + 1 función nueva + 2 wirings), `CLAUDE.md` (1 párrafo). Cero archivos nuevos.
- Verificación manual completa en 3 productos (encargo, stock, mixto) + mobile.

---

## Notas para el ejecutor

- **TDD adaptado:** no hay test runner. Cada task tiene su "test" como verificación visual en la tienda en vivo después de pegar el código en el panel correspondiente. No saltearse los steps de verificación.
- **Idempotencia del CSS:** todas las reglas usan `!important` por consistencia con el resto del `style.css` (que ya usa el patrón en masa, ver líneas 89-148). No abusar fuera de este alcance.
- **Idempotencia del JS:** `initCuotasEncargo()` siempre remueve el row anterior antes de evaluar — seguro de llamar múltiples veces.
- **No tocar otros archivos:** spec §12 lista lo que queda out-of-scope. Si durante la implementación te tienta refactorear algo no listado, parar y consultar.
