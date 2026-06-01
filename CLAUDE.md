# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Tienda online **Rapa Imports** en Tiendanube (plataforma SaaS de e-commerce). El código de este repositorio se inyecta manualmente en el panel de administración de Tiendanube:

- [`style.css`](style.css) → panel Tiendanube → **Diseño → Editar CSS**
- [`script.html`](script.html) → panel Tiendanube → **Configuración → Códigos de seguimiento → Footer**

No hay build system, tests, ni servidor local. Los cambios se verifican en la tienda en vivo.

## Reglas de trabajo

- **Nunca modificar código sin permiso explícito del usuario.**
- Cuando se trabaje en una sección, indicar qué otros archivos o partes requieren cambios para que funcione correctamente.

## Arquitectura del sistema de personalización

### Convención "producto por encargo" (stock 9999)

El sistema usa `stock = 9999` como señal especial para marcar productos que son por encargo (no disponibles en inventario físico). Esto se implementa en dos capas:

**Script (detección, `script.html`):**
- Al cargar, lee la meta tag `<meta property="tiendanube:stock">`. Si el valor es `"9999"`, agrega la clase `producto-encargo` al `<body>`.
- En el listado de productos (fuera de `#single-product`), parsea `data-variants` de cada `.js-quickshop-container` y agrega la clase `item-encargo` a las cards cuyo stock sea 9999.

**CSS (visualización, `style.css`):**
- `body.producto-encargo` en la página de producto oculta botones de compra, cantidad y descuento (`display: none !important`), y muestra el badge naranja "Producto por encargo" + texto "15 a 20 días hábiles" vía `::before`/`::after` en `.price-container`.
- `.item-encargo` en las cards del listado muestra un ícono de avión naranja (badge circular) en la esquina superior derecha de la imagen.

### Botones de WhatsApp

- El script busca elementos `.wa-btn` y `#single-product .product-description a[href*="wa.me"]`.
- Según el texto del botón: si contiene "encargar" → mensaje de encargo; si no → mensaje de consulta.
- Los mensajes incluyen el nombre del producto (desde `og:title`) y la URL canónica.
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
