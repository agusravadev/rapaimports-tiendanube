# Diseño: Rediseño del componente de precio por transferencia en cards del listado

**Fecha:** 2026-06-01  
**Branch:** feat/price-ui-redesign

---

## Objetivo

Rediseñar el bloque `.payment-discount-price-product-container` que aparece dentro de las **cards del listado de productos** (no en la página de detalle). Actualmente muestra el precio de transferencia como texto plano sin jerarquía visual. El nuevo diseño debe llamar la atención, ser profesional y no saturar el espacio compacto de la card.

---

## Contexto del componente

HTML original que se estiliza:

```html
<div class="js-payment-discount-price-product-container payment-discount-price-product-container mt-1 mb-2 ...">
  <span class="js-payment-discount-price-product" data-priceraw-without-shipping="6714000">$67.140,00</span>
  <span>con</span>
  <span class="js-payment-discount-name-product">Transferencia bancaria</span>
</div>
```

El componente vive dentro de la card del listado, **fuera de `#single-product`**.  
Selector de aplicación: `.item-product .payment-discount-price-product-container`

---

## Diseño aprobado: G2 — Fila centrada

### Layout

```
┌────────────────────────────────┐
│  Transferencia bancaria [25%OFF]  │  ← fila centrada
│         $721.500,00            │  ← precio, centrado, verde
│         Ahorrás $240.500       │  ← ahorro, centrado, negro
└────────────────────────────────┘
```

### Especificaciones visuales del contenedor

| Propiedad | Valor |
|---|---|
| Fondo | `#f0fdf4` |
| Borde | `1px solid #bbf7d0` |
| Border-radius | `12px` |
| Padding | `10px 12px` |
| Margin | reemplaza `mt-1 mb-2` del tema |

**Fila superior (método + badge) — `.transfer-top-row`:**
- `display: flex`, `justify-content: center`, `align-items: center`, `gap: 6px`
- `.js-payment-discount-name-product`: `font-size: 11px`, `font-weight: 600`, `color: #111827`, `white-space: nowrap`
- `.transfer-badge` (inyectado por JS): `background: #15803d`, `color: #fff`, `font-size: 10px`, `font-weight: 800`, `border-radius: 20px`, `padding: 2px 8px`, `white-space: nowrap`

**Precio — `.js-payment-discount-price-product`:**
- `font-size: 18px`, `font-weight: 800`
- `color: #15803d` (mismo verde que el badge)
- `letter-spacing: -0.8px`, `text-align: center`, `display: block`

**Ahorrás — `.transfer-saving` (inyectado por JS):**
- `font-size: 11px`, `font-weight: 600`, `color: #111827`
- `text-align: center`, `display: block`

---

## Reglas de implementación

### CSS (`style.css`)

- Agregar bloque nuevo con selector `.item-product .payment-discount-price-product-container`
- Ocultar el span `con` literal con `display: none` (segundo hijo del contenedor)
- No tocar los estilos existentes de `#single-product .payment-discount-price-product-container`

### JS (`script.html`)

El script debe procesar todos los `.js-payment-discount-price-product-container` que estén **fuera de `#single-product`**:

1. **Crear `.transfer-top-row`**: mover `.js-payment-discount-name-product` dentro de un `div.transfer-top-row` junto a un `span.transfer-badge` con el texto "25% OFF"
2. **Calcular ahorro**:
   - Precio descuento raw: `data-priceraw-without-shipping` del span `.js-payment-discount-price-product` (en centavos)
   - Precio de lista raw: atributo `data-price` del contenedor `.js-product-item` cercano, o de la card (Tiendanube lo expone en el markup de la card)
   - Ahorro = precio lista − precio descuento, formateado como `$XXX.XXX`
3. **Insertar `.transfer-saving`**: `<span class="transfer-saving">Ahorrás $X</span>` después del precio

El script debe ejecutarse en `DOMContentLoaded` y re-ejecutarse si hay cambios de variante en la card.

---

## Lo que NO cambia

- Los estilos de `#single-product .payment-discount-price-product-container` (página de detalle, intacta)
- La lógica de WhatsApp, envío gratis, producto por encargo
- El resto del archivo `style.css`

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `style.css` | Agregar bloque de estilos para `.item-product .payment-discount-price-product-container` |
| `script.html` | Agregar función que inyecta `.transfer-top-row`, `.transfer-badge` y `.transfer-saving` en las cards |
