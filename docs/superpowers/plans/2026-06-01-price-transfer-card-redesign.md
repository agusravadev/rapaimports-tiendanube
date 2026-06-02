# Price Transfer Card Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el bloque de precio con transferencia bancaria en las cards del listado de productos, siguiendo el diseño G2 aprobado.

**Architecture:** Dos archivos a modificar: `style.css` recibe el bloque CSS nuevo para el componente en el contexto de card; `script.html` recibe una función que inyecta el badge "25% OFF" y el texto "Ahorrás $X" como elementos DOM, reutilizando el `MutationObserver` existente.

**Tech Stack:** CSS puro + JavaScript vanilla. Sin build system. Los cambios se pegan manualmente en el panel de Tiendanube.

---

## Archivos a modificar

| Archivo | Qué cambia |
|---|---|
| `style.css` | Nuevo bloque al final del archivo: estilos del componente `.item-product .payment-discount-price-product-container` |
| `script.html` | Nueva función `initTransferSavings()` llamada dentro de `initTiendaNubePersonalizado()` y en el `MutationObserver` existente |

---

## Task 1: CSS — Estilizar el contenedor en cards

**Files:**
- Modify: `style.css` (agregar al final)

- [ ] **Step 1: Agregar el bloque CSS al final de `style.css`**

Pegar exactamente esto al final del archivo, después del último bloque existente:

```css
/* ── Precio con transferencia bancaria — cards del listado ── */

.item-product .payment-discount-price-product-container {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  gap: 5px !important;
  background: #f0fdf4 !important;
  border: 1px solid #bbf7d0 !important;
  border-radius: 12px !important;
  padding: 10px 12px !important;
  margin-top: 6px !important;
  margin-bottom: 6px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

/* Ocultar el "con" literal — clase asignada por JS */
.item-product .transfer-con-hidden {
  display: none !important;
}

/* Fila superior: "Transferencia bancaria" + badge "25% OFF" */
.item-product .transfer-top-row {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  flex-wrap: nowrap !important;
}

/* Texto del método de pago */
.item-product .js-payment-discount-name-product {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #111827 !important;
  white-space: nowrap !important;
}

/* Badge "25% OFF" */
.item-product .transfer-badge {
  background: #15803d !important;
  color: #fff !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  border-radius: 20px !important;
  padding: 2px 8px !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

/* Precio con descuento */
.item-product .js-payment-discount-price-product {
  font-size: 18px !important;
  font-weight: 800 !important;
  color: #15803d !important;
  letter-spacing: -0.8px !important;
  line-height: 1 !important;
  display: block !important;
  text-align: center !important;
}

/* Línea "Ahorrás $X" */
.item-product .transfer-saving {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #111827 !important;
  display: block !important;
  text-align: center !important;
}
```

- [ ] **Step 2: Verificar que no hay conflicto con el bloque existente de `#single-product`**

Asegurarse de que el nuevo bloque NO tiene el prefijo `#single-product`. El bloque existente en `style.css` (líneas 89–154 aprox.) comienza con `#single-product .payment-discount-price-product-container` y no se toca.

- [ ] **Step 3: Commit del CSS**

```bash
git add style.css
git commit -m "style: rediseño del componente de precio por transferencia en cards del listado"
```

---

## Task 2: JS — Inyectar badge y texto de ahorro

**Files:**
- Modify: `script.html`

- [ ] **Step 1: Agregar la función `initTransferSavings` dentro de `initTiendaNubePersonalizado`**

Ubicar el comentario `// 3. Badge "por encargo"` en `script.html` (línea ~49). Agregar la nueva función **antes** de ese bloque:

```js
// 2b. Precio con transferencia — inyectar badge y ahorrás en cards del listado
function initTransferSavings() {
  if (document.querySelector('#single-product')) return;

  document.querySelectorAll('.item-product .js-payment-discount-price-product-container').forEach(function(container) {
    if (container.querySelector('.transfer-top-row')) return; // ya procesado

    var precioSpan = container.querySelector('.js-payment-discount-price-product');
    var metodoSpan = container.querySelector('.js-payment-discount-name-product');
    if (!precioSpan || !metodoSpan) return;

    // Calcular ahorro: el descuento es siempre 25%, entonces ahorro = precioDescuento / 3
    var rawDescuento = parseInt(precioSpan.getAttribute('data-priceraw-without-shipping'), 10);
    var rawAhorro = Math.round(rawDescuento / 3);
    var pesosAhorro = Math.round(rawAhorro / 100);
    var ahorroFormateado = '$' + pesosAhorro.toLocaleString('es-AR', { maximumFractionDigits: 0 });

    // Construir fila superior: método + badge
    var topRow = document.createElement('div');
    topRow.className = 'transfer-top-row';

    var badge = document.createElement('span');
    badge.className = 'transfer-badge';
    badge.textContent = '25% OFF';

    // Ocultar el span "con" literal (segundo hijo original)
    container.querySelectorAll(':scope > span').forEach(function(span) {
      if (span.textContent.trim() === 'con') {
        span.classList.add('transfer-con-hidden');
      }
    });

    topRow.appendChild(metodoSpan); // mover el span existente al div
    topRow.appendChild(badge);
    container.insertBefore(topRow, precioSpan);

    // Insertar "Ahorrás $X" después del precio
    var savingSpan = document.createElement('span');
    savingSpan.className = 'transfer-saving';
    savingSpan.textContent = 'Ahorrás ' + ahorroFormateado;
    precioSpan.insertAdjacentElement('afterend', savingSpan);
  });
}
```

- [ ] **Step 2: Llamar la función dentro de `initTiendaNubePersonalizado`**

Localizar las llamadas a `marcarProductosEncargo()` y `revisarEnvioGratis()` al final de `initTiendaNubePersonalizado` (líneas ~101–103). Agregar la llamada nueva:

```js
marcarProductosEncargo();
revisarEnvioGratis();
initTransferSavings(); // ← agregar esta línea
setTimeout(marcarProductosEncargo, 1500);
```

- [ ] **Step 3: Agregar `initTransferSavings` al `MutationObserver`**

Localizar el `MutationObserver` al final del script (líneas ~137–143). Agregar la llamada:

```js
var observador = new MutationObserver(function() {
  revisarEnvioGratis();
  clearTimeout(_encargoTimer);
  _encargoTimer = setTimeout(marcarProductosEncargo, 300);
  initTransferSavings(); // ← agregar esta línea
});
observador.observe(document.body, { childList: true, subtree: true });
```

- [ ] **Step 4: Commit del JS**

```bash
git add script.html
git commit -m "feat: inyectar badge y texto de ahorro en precio por transferencia en cards"
```

---

## Task 3: Verificación en la tienda

- [ ] **Step 1: Pegar `style.css` en Tiendanube → Diseño → Editar CSS**

Copiar el contenido completo del archivo y reemplazar el CSS en el panel.

- [ ] **Step 2: Pegar `script.html` en Tiendanube → Configuración → Códigos de seguimiento → Footer**

Copiar el contenido completo del archivo y reemplazar el script en el panel.

- [ ] **Step 3: Verificar en el listado de productos**

Abrir una página de categoría que tenga productos con precio de transferencia. Verificar que cada card muestre:

```
┌────────────────────────────────────┐
│  Transferencia bancaria  [25% OFF] │
│         $XXX.XXX,00                │
│         Ahorrás $XXX.XXX           │
└────────────────────────────────────┘
```

- Fondo verde claro `#f0fdf4`
- Borde `#bbf7d0`
- Precio en verde `#15803d`
- Textos "Transferencia bancaria" y "Ahorrás" en negro
- Badge verde oscuro con texto blanco

- [ ] **Step 4: Verificar que la página de detalle de producto NO cambió**

Abrir cualquier producto y confirmar que la sección de precio con transferencia en `#single-product` se ve igual que antes.

- [ ] **Step 5: Verificar el cálculo del ahorro**

Para un producto con precio de transferencia visible, calcular manualmente: `precioTransferencia / 0.75 * 0.25` y confirmar que coincide con el "Ahorrás" mostrado.
