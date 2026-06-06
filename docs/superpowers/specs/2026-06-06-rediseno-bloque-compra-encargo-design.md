# Rediseño bloque de compra — producto por encargo (página de detalle)

**Fecha:** 2026-06-06
**Rama:** `feat/redesign-product-ui`
**Alcance:** UI del bloque de compra en `#single-product` **solo** cuando la variante activa es por encargo (`body.producto-encargo`). No afecta productos con stock físico.

---

## 1. Objetivo

Rediseñar el bloque de compra de productos por encargo para que tenga mayor impacto visual y jerarquía más clara, manteniendo un estilo minimalista en light mode, alineado a los colores semánticos del sitio (verde = transferencia/envío, naranja = encargo).

## 2. Mockup de referencia

`.superpowers/brainstorm/695-1780714342/content/encargo-final-v6-compact.html` (v6 compact, aprobado).

Composición del bloque (top → bottom):

1. Pill naranja `Producto por encargo` + eta `⏱ 15 a 20 días hábiles` *(sin cambios respecto del actual)*.
2. Precio regular (tachado opcional / precio de lista). *(sin cambios)*
3. **Bloque transferencia rediseñado** (ver §4).
4. Info-row `3 cuotas de $X` + link `Ver más detalles`.
5. Info-row `Envío gratis incluido en este producto` *(sin cambios respecto del actual)*.
6. **CTA pill naranja `Encargar ahora` con ícono de WhatsApp** (ver §5).

## 3. Reglas de scoping

- Todas las reglas CSS nuevas deben prefijarse con `body.producto-encargo #single-product …` para que productos con stock físico mantengan el bloque transferencia actual.
- Los productos con stock físico **no deben cambiar** (regresión cero).
- La activación es reactiva por variante: cuando el usuario cambia a una variante con stock, el bloque vuelve al diseño actual (lo gestiona `initEncargoDetalle()` togglando `body.producto-encargo`).

## 4. Bloque transferencia — diseño detallado

### Selector base
`body.producto-encargo #single-product .payment-discount-price-product-container`

### Cambios respecto del diseño actual
| Aspecto | Actual | Nuevo |
|---|---|---|
| Fondo | `#f0fdf4` plano | Degradé `linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)` |
| Borde | `1px solid #bbf7d0` | `1px solid #bbf7d0` *(igual)* |
| Border-radius | `10px` | `12px` |
| Padding | `14px 16px` | `8px 14px 12px` |
| Label "MEJOR PRECIO" | `::before` afuera arriba (`top:-18px`), texto `MEJOR PRECIO 🔥` | `::before` dentro arriba, texto `MEJOR PRECIO · TRANSFERENCIA`, sin emoji |
| Badge descuento | `::after` esquina superior derecha pegado al borde, `border-radius: 0 10px 0 10px`, texto `25% OFF` | Mismo `::after` pero `border-radius: 6px`, ubicado `top: 8px; right: 14px`, texto `−25%` (signo menos Unicode `\2212`) |
| Texto "con Transferencia" (span:nth-child(2)) | Visible al lado del precio | Oculto (`display: none !important`) |
| Línea "AHORRAS $xxx" (`.transfer-savings-label`) | Visible debajo | **Oculta** (`display: none !important`) — la función `initTransferSavingsProduct` sigue corriendo pero no aporta visual en encargo |
| Tipografía label | `font-size:11px; font-weight:400; letter-spacing:.5px; color:#111827` | `font-size:10px; font-weight:800; letter-spacing:0.14em; text-transform:uppercase; color:#15803d` |
| Tipografía precio (`.js-payment-discount-price-product`) | `font-weight:700; color:#15803d` | `font-size:24px; font-weight:800; color:#15803d; line-height:1.1; letter-spacing:-0.01em` |

### Tokens visuales (resumen)

```
--encargo-tx-bg-start: #ecfdf5
--encargo-tx-bg-end:   #f0fdf4
--encargo-tx-border:   #bbf7d0
--encargo-tx-label:    #15803d
--encargo-tx-price:    #15803d
--encargo-tx-pct-bg:   #16a34a
--encargo-tx-pct-fg:   #ffffff
```

*(No es necesario declararlas como custom properties; pueden vivir inline en las reglas scopeadas. Las dejo nombradas para que el spec sea autocontenido.)*

### Notas técnicas
- El `::before` actual está posicionado `absolute` con `top:-18px`. Hay que neutralizarlo y reescribirlo dentro del contenedor — `position: static` o `top: 8px; left: 14px`.
- El `::after` actual usa `top:-1px; right:-1px` para morder el borde. Hay que reposicionarlo `top: 8px; right: 14px`.
- La línea `AHORRAS` la inyecta `initTransferSavingsProduct()` en `script.html`. Solución: ocultarla por CSS cuando `body.producto-encargo` está activo. **No** se modifica la función.

## 5. CTA — botón `Encargar ahora`

### Selector
`body.producto-encargo #single-product .btn-encargar-detalle`

### Diseño
- Border-radius: `999px` (pill completo).
- Padding: `16px`.
- Background: `#ea580c` sólido.
- Color: `#ffffff`.
- Font-weight: `700`.
- Font-size: `15px`.
- Letter-spacing: `0.06em`.
- Box-shadow: `0 8px 24px rgba(234, 88, 12, 0.28)`.
- Layout interno: `display:flex; align-items:center; justify-content:center; gap:10px`.
- Texto: `Encargar ahora` *(actualmente dice `Encargar`)*.
- **Ícono de WhatsApp inline**: SVG 18×18 antes del texto, `fill: currentColor`.

### Cambios requeridos en `script.html`
1. En `ensureBtnEncargar()` (función `initEncargoDetalle`):
   - Cambiar `btn.textContent = 'Encargar';` por construcción con `innerHTML` que contenga el SVG + el texto `Encargar ahora`.
   - El SVG debe escapar correctamente en el `innerHTML` (no usar `textContent`).
2. Mantener las clases actuales: `btn btn-primary btn-block mt-3 mb-4 btn-encargar btn-encargar-detalle`. El CSS scopeado sobreescribe `btn-primary` para encargo.

### SVG WhatsApp
```html
<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
  <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.2-.7.2-.2.3-.7.9-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.4-3.8-3.2-.3-.5.3-.4.8-1.4.1-.2.1-.4 0-.5-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.3 5.3 4.6 2 .8 2.8.9 3.8.7.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>
</svg>
```

## 6. Cuotas — display `3 cuotas sin interés de $X`

### Decisión tomada
Mostrar **3 cuotas sin interés** con el monto real expuesto por Tiendanube en el modal de medios de pago. Si Tiendanube **no ofrece una opción de 3 cuotas sin interés** para el producto, **ocultar el bloque cuotas** en encargo (no mostrar nada).

### Fuente del dato (confirmada)
El modal de pagos `#info-payment-method-credit_card` (renderizado por Tiendanube en el DOM al cargar la página de producto) contiene una o más `<table class="js-payments-table">`, una por proveedor / promoción. Cada fila es:

```html
<tr class="js-payment-provider-installments-row" id="installment_Mercado_Pago_3">
  <td>
    <strong><span class="js-installment-amount">3</span></strong>
    <span>cuotas</span> <span>de</span>
    <strong><span class="js-installment-price">$36.947,89</span></strong>
    sin interés    <!-- text node opcional, indica promoción sin interés -->
  </td>
  <td><small>CFT: 0,00% | TEA: 0,00%</small></td>
  <td class="text-right">
    <strong><span class="mr-1">Total </span></strong>
    <span class="js-installment-total-price">$110.843,66</span>
  </td>
</tr>
```

### Algoritmo de selección (orden de preferencia)

1. **Por marcador textual:** recorrer todos los `tr.js-payment-provider-installments-row`. Para cada uno:
   - Leer `.js-installment-amount` → si `parseInt(text) === 3`, candidato.
   - Verificar que el primer `<td>` del row contenga el texto literal `sin interés` (case-insensitive, trim). Si sí → es un row de 3 cuotas sin interés.
   - Extraer el precio de `.js-installment-price` (texto crudo, ej. `$36.947,89`).
   - **Tomar el primer match** y salir.

2. **Fallback por comparación de total:** si el paso 1 no encuentra ningún row con texto `sin interés` pero sí encuentra rows con `amount === 3`, comparar el monto de `.js-installment-total-price` del row con el precio base del producto (`#single-product .js-price-display[data-product-price]`, normalizando ambos a centavos o número). Si total ≈ base (tolerancia ±$1) → también es sin interés.

3. **Fallback final:** si ningún paso encuentra match → ocultar el row de cuotas (CSS `display:none` o no insertar el row).

### Implementación

Nueva función `initCuotasEncargo()` en `script.html` (sección 3c, después de `initEncargoDetalle`):

```js
function initCuotasEncargo() {
  var single = document.querySelector('#single-product');
  if (!single) return;
  if (!document.body.classList.contains('producto-encargo')) {
    // No es encargo → quitar row si existe
    var existing = single.querySelector('.js-cuotas-encargo-row');
    if (existing) existing.remove();
    return;
  }

  // Idempotente: si ya existe, no duplicar
  if (single.querySelector('.js-cuotas-encargo-row')) return;

  // 1) Buscar 3 cuotas sin interés
  var precio3sinInteres = null;
  var rows = document.querySelectorAll('#info-payment-method-credit_card tr.js-payment-provider-installments-row');
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var amountEl = row.querySelector('.js-installment-amount');
    if (!amountEl || parseInt(amountEl.textContent, 10) !== 3) continue;
    var firstCell = row.querySelector('td');
    var hasSinInteres = firstCell && /sin\s+inter[eé]s/i.test(firstCell.textContent);
    if (hasSinInteres) {
      var priceEl = row.querySelector('.js-installment-price');
      if (priceEl) { precio3sinInteres = priceEl.textContent.trim(); break; }
    }
  }
  // 2) (Opcional) fallback por comparación de total — omitir si paso 1 ya cubre

  // 3) Si no hay match → no insertar nada
  if (!precio3sinInteres) return;

  // Insertar el row visual
  var ctaBtn = single.querySelector('.btn-encargar-detalle');
  if (!ctaBtn) return;
  var row = document.createElement('div');
  row.className = 'info-row js-cuotas-encargo-row';
  row.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/>' +
    '</svg>' +
    '<span>3 cuotas sin interés de <strong>' + precio3sinInteres + '</strong></span>';
  ctaBtn.parentNode.insertBefore(row, ctaBtn);
}
```

- Se llama desde `initEncargoDetalle.aplicarEstado()` justo después del toggle de `body.producto-encargo`.
- Se vuelve a llamar en el listener de cambio de variante (mismo timer `setTimeout(30)` que el resto).
- Re-corre en el setTimeout 1500ms inicial (mismo patrón que `initEncargoDetalle`) por si el modal de pagos carga tardío.

### Visual del row
- Mismo estilo `.info-row` actual (borde gris claro, border-radius 10px, padding 12px 14px, font-size 13px).
- Ícono de tarjeta a la izquierda (SVG inline 18×18, sin librería).
- Texto: `3 cuotas sin interés de <strong>$X.XXX,XX</strong>`.
- Sin link "Ver más detalles" en MVP (el modal de pagos de Tiendanube sigue accesible vía el botón propio del tema si existe; no agregamos uno custom).

### Riesgo conocido
- El modal `#info-payment-method-credit_card` puede no estar presente en el DOM si el tema cambia. La función debe verificar la existencia antes de iterar.
- El texto `sin interés` es localización-dependiente. Si Tiendanube cambia el copy (ej. "sin recargo"), el detector falla. Para mitigar parcialmente, el regex acepta acentos opcionales (`inter[eé]s`).
- En productos sin promociones sin interés a 3 cuotas, el bloque queda oculto (decisión explícita).

## 7. Envío gratis — sin cambios

El bloque `.js-product-form-free-shipping-message` ya funciona como en el mockup (verde, texto "Envío gratis incluido en este producto"). Verificar que sigue mostrándose correctamente cuando `body.producto-encargo` está activo. **No se modifica.**

## 8. Estados

| Estado | Disparador | Resultado visual |
|---|---|---|
| Variante con stock activa | `body` sin `.producto-encargo` | Bloque actual sin cambios (regresión cero). |
| Variante por encargo activa | `body.producto-encargo` agregada por `initEncargoDetalle()` | Bloque rediseñado: transferencia compacta, cuotas a 3, CTA pill con WhatsApp. |
| Transición entre variantes | Click en swatch o `change` del select | Toggle reactivo de `body.producto-encargo`. CSS y JS se reaplican sin parpadeo (delay 30ms ya existe). |

## 9. Arquitectura y archivos afectados

| Archivo | Cambio | Naturaleza |
|---|---|---|
| `style.css` | Nuevo bloque de reglas scopeadas `body.producto-encargo #single-product …` para transferencia + CTA + cuotas-row + ocultar AHORRAS. | Aditivo — no se borran reglas actuales. |
| `script.html` → `ensureBtnEncargar()` | Reemplazar `textContent = 'Encargar'` por `innerHTML` con SVG WhatsApp + `Encargar ahora`. | Modificación de 2 líneas. |
| `script.html` → nueva función `initCuotasEncargo()` | Reescribe el bloque cuotas a "3 cuotas de $X". Reactivo al toggle de variante. | Nueva función, llamada desde `initEncargoDetalle.aplicarEstado()`. |

**No** se tocan:
- `Default-structure/encargo.html` / `stock.html` (templates de descripción de producto).
- Listado de productos (CSS de `.item-encargo` y `marcarProductosEncargo`).
- Bloque envío gratis.
- Lógica de detección temprana (`LS.variants` early check).

## 10. Pruebas manuales (acceptance)

Verificar en la tienda en vivo después de inyectar CSS + JS:

1. **Producto 100% por encargo** (todas las variantes stock 9999):
   - Bloque transferencia: label arriba pegado, sin "AHORRAS", pill `−25%` con border-radius 6px.
   - CTA pill naranja con ícono WhatsApp, texto "Encargar ahora".
   - Cuotas: "3 cuotas de $..." con monto real.
2. **Producto con stock físico** (todas las variantes con stock < 9999):
   - Bloque transferencia idéntico al de hoy (texto "MEJOR PRECIO 🔥", AHORRAS visible, badge esquina, cuotas a 24).
   - Botón Agregar al carrito original visible. **Sin regresión.**
3. **Producto con variantes mixtas** (ej: rojo stock 9, blanco stock 9999):
   - Al seleccionar variante con stock → diseño actual.
   - Al seleccionar variante por encargo → diseño nuevo.
   - Toggle reactivo sin recargar página, sin parpadeo.
4. **Sin opción de 3 cuotas**: bloque cuotas oculto en encargo, resto OK.
5. **Mobile** (≤ 480px): bloque transferencia y CTA no se cortan; padding sigue siendo cómodo.

## 11. Decisiones tomadas / abiertas

**Decidido:**
- Light mode (no dark gradient).
- Cuotas a 3 con monto real de Tiendanube.
- `Ahorrás $xxx` se elimina del bloque transferencia (no se muestra en encargo).
- CTA pill naranja con icono WhatsApp, texto `Encargar ahora`.
- Scope estricto a `body.producto-encargo`.

**Abierto / a resolver en implementación:**
- Ninguno bloqueante. Fuente del dato de 3 cuotas sin interés ya confirmada (DOM del modal `#info-payment-method-credit_card`, filas `tr.js-payment-provider-installments-row` con `.js-installment-amount === 3` + texto `sin interés`).

## 12. Out of scope

- Rediseño del bloque transferencia en productos con stock (no se toca).
- Cambios en la galería de imágenes, título del producto, descripción, breadcrumbs.
- Cambios en el botón Encargar del listado de productos.
- Cambios en el header naranja "Producto por encargo" + eta (ya cumplen).
