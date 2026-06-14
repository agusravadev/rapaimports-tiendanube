# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tienda online **Rapa Imports** en Tiendanube (plataforma SaaS de e-commerce). El código de este repositorio se inyecta manualmente en el panel de administración de Tiendanube:

- [`style.css`](style.css) → panel Tiendanube → **Diseño → Editar CSS**
- [`script.js`](script.js) → se sirve vía jsDelivr y se carga desde el footer de Tiendanube (**Configuración → Códigos de seguimiento → Footer**).
- [`script.html`](script.html) → versión legacy del mismo script embebida en `<script>…</script>`. **Quedó como referencia/respaldo**: los cambios de JS se hacen sobre `script.js` (el archivo que efectivamente se sirve en producción).

No hay build system, tests, ni servidor local. Los cambios se verifican en la tienda en vivo.

## Reglas de trabajo

- **Nunca modificar código sin permiso explícito del usuario.**
- **Todas las modificaciones de JavaScript se hacen sobre [`script.js`](script.js)**, no sobre `script.html`. `script.html` quedó como referencia/legacy.
- Cuando se trabaje en una sección, indicar qué otros archivos o partes requieren cambios para que funcione correctamente.

## Flujo de trabajo: armar descripción HTML de un producto

Cuando el usuario pida crear o completar la descripción HTML de un producto, seguir este flujo **siempre**:

1. **Preguntar si el producto es por encargo o tiene stock físico.**
   - Por encargo → usar [`Default-structure/encargo.html`](Default-structure/encargo.html)
   - Stock físico → usar [`Default-structure/stock.html`](Default-structure/stock.html)

2. **Buscar información del producto en internet** (nombre, specs técnicas, modelos compatibles, pasos de instalación, contenido del kit). Usar fuentes confiables: fabricante, tiendas especializadas, foros de la marca del vehículo.

3. **Completar todos los placeholders** `{{...}}` de la estructura base elegida con los datos reales del producto. No dejar ningún placeholder sin reemplazar.

4. **Entregar el HTML listo para copiar** en el panel de descripción de Tiendanube.

### Diferencias clave entre los dos templates

| Sección | `encargo.html` | `stock.html` |
|---|---|---|
| Sección Beneficios/Características | Incluida | Opcional (ver comentario en template) |

> El botón "Encargar" ya no vive en la descripción. Se inyecta automáticamente desde `script.js` en la zona de compra (junto al botón Agregar al carrito) cuando la variante seleccionada es 9999. Los dos templates solo se diferencian por la sección de beneficios.

### Placeholders comunes a ambos templates

- `{{BADGE_CATEGORIA}}` — categoría breve del producto (ej: "Accesorios Tuning de primera línea")
- `{{TITULO_PRODUCTO}}` — nombre del producto en mayúsculas
- `{{SUBTITULO_PRODUCTO}}` — specs resumidas en una línea separadas por `·`
- `{{DESCRIPCION_CORTA}}` — párrafo introductorio (~2-3 oraciones)
- `{{FILAS_ESPECIFICACIONES}}` — filas `<tr>` de la tabla técnica
- `{{MODELOS_COMPATIBLES}}` — `<span>` por cada modelo compatible
- `{{TEXTO_COMPATIBILIDAD}}` — frase antes del botón WhatsApp en compatibilidad
- `{{PASOS_INSTALACION}}` — bloques numerados 01/02/03/04
- `{{TEXTO_RECOMENDACION}}` — aviso del bloque 🔧 amarillo
- `{{ITEMS_KIT}}` — `<span>` con el contenido de la caja (neutros en gris, incluidos en verde)
- `{{FOOTER_LINEA1}}` / `{{FOOTER_LINEA2}}` — CTA del footer rojo

## Arquitectura del sistema de personalización

### Convención "producto por encargo" (stock 9999)

El sistema usa `stock = 9999` como señal de que esa variante es por encargo (sin inventario físico). La señal vive **a nivel de variante**, no de producto: un producto puede tener variantes mixtas (ej: rojo con stock 9 + blanco con stock 9999) y la UI reacciona a la variante seleccionada en tiempo real.

**Script (detección reactiva, `script.js`):**
- Detección temprana sin parpadeo: si `LS.variants` está disponible y la variante por defecto del detalle es 9999, agrega `body.producto-encargo` antes del primer paint. El meta `tiendanube:stock` no se usa: informa la suma de stocks (ej: 10008 = 9999 + 9), no la variante seleccionada.
- `marcarProductosEncargo()` (listado): si alguna variante del card es 9999, instala listener en los swatches `.js-color-variant.item-colors-bullet[data-option]` (activo: `js-color-variant-active`) y togglea `item-encargo` + botón `.btn-encargar` según el stock de la variante actual.
- `initEncargoDetalle()` (página de producto): lee `LS.variants` (global de Tiendanube), identifica la variante por `.js-insta-variant.selected[data-option]`, togglea `body.producto-encargo` e inyecta/quita un botón `.btn-encargar-detalle` en el contenedor de `Agregar al carrito`. Escucha clicks en swatches y `change` en el `<select>` oculto `.js-variation-option`.
- Ambas usan `data-encargo-estado` para no re-aplicar si el estado no cambió (evita bucles del MutationObserver).

**CSS (visualización, `style.css`):**
- `body.producto-encargo` en la página de producto oculta botones de compra, cantidad y descuento (`display: none !important`), y muestra el badge naranja "Producto por encargo" + texto "15 a 20 días hábiles" vía `::before`/`::after` en `.price-container`.
- `.item-encargo` en las cards del listado muestra un ícono de avión naranja (badge circular) en la esquina superior derecha de la imagen.
- En la página de producto, cuando `body.producto-encargo` está activo el bloque transferencia se rediseña (light gradient, label `MEJOR PRECIO · TRANSFERENCIA` adentro arriba, pill `−25%` rounded rectangle, sin texto "AHORRAS" ni "con Transferencia"). El widget original de cuotas (`.js-product-payments-container`) se oculta y se reemplaza por un row custom `.cuotas-encargo-row` que la función `initCuotasEncargo()` inyecta con el monto real de "3 cuotas sin interés" leído del modal `#info-payment-method-credit_card`. El CTA `.btn-encargar-detalle` se estiliza como pill naranja con ícono SVG de WhatsApp y texto "Encargar ahora".

### Botones de WhatsApp

- **Botones de consulta** (`.wa-btn` y links `wa.me` en `.product-description`): el script los reescribe todos al mismo `wa.me` con `mensajeConsultar` (nombre del producto desde `og:title` + URL canónica). Ya no se distinguen por texto — el botón "Encargar" dejó de vivir en la descripción.
- **Botones de encargo** (listado y detalle): se inyectan dinámicamente desde `marcarProductosEncargo()` y `initEncargoDetalle()` según la variante seleccionada, con un mensaje propio (`mensajeEncargar`).
- Número de WhatsApp: `542364626266`.
- El CSS estiliza los links `a[href*="wa.me"]` dentro de `.product-description` como botón verde animado con ícono de WhatsApp incrustado como SVG en `::before`.

### Envío gratis

Dos elementos distintos con comportamiento diferente:
- `.free-shipping-message`: borde gris neutro (envío gratis condicional, ej: "superando X").
- `.js-product-form-free-shipping-message`: fondo verde animado (`shipping-pop`), solo visible cuando el envío es gratis para ese producto. El script inyecta el texto "incluido en este producto" después de `.text-accent` cuando el mensaje contiene "gratis" (sin "superando" ni "más de").
- Un `MutationObserver` en `document.body` re-evalúa el estado de envío cuando el DOM cambia (ej: cambio de variante).

### Precio y descuentos en página de producto (`#single-product`)

El CSS reordena los elementos dentro de `.price-container` con `order`:
1. `span:nth-child(2)` → precio tachado (compare price) — `order: 1`
2. `span:nth-child(1)` → precio principal — `order: 2`
3. `.payment-discount-price-product-container` → caja "MEJOR PRECIO 🔥" — `order: 3`, ancho 100%

La caja de descuento de pago (`payment-discount-price-product-container`) usa `::before` para el label "MEJOR PRECIO 🔥" y `::after` hardcodeado con "25% OFF".

### Labels de envío gratis en cards del listado

Los selectores `[data-promotion-type="free-shipping"]`, `[data-store="product-item-label-shipping"]`, `[data-store="product-item-label-free-shipping"]` y `.js-free-shipping-label` se reemplazan visualmente con CSS puro: fondo negro, borde rojo, texto "ENVÍO" (blanco, con ícono camión rojo SVG) + "GRATIS" (rojo) vía `::before`/`::after`. El texto original se oculta con `text-indent: -9999px` y `font-size: 0`.

### Banner promocional

`.textbanner-text.over-image` tiene layout corregido con flexbox para distribuir título arriba y botón abajo dentro del banner.
