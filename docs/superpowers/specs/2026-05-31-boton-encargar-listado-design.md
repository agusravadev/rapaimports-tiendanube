# Diseño: Botón Encargar en listado de productos

**Fecha:** 2026-05-31
**Estado:** Aprobado

## Problema

Los productos por encargo (stock=9999) muestran en el listado un botón "Comprar" que agrega el producto al carrito, rompiendo la lógica del sistema de encargos. También aparece un botón de quickview (ojo) que no aporta valor para estos productos. El flujo correcto para encargos es siempre consultar por WhatsApp.

## Solución

Reemplazar el botón "Comprar" por un botón "Encargar" (verde WhatsApp) que abre WhatsApp con un mensaje pre-cargado, y ocultar el botón quickview. Aplica únicamente a cards con clase `item-encargo`.

## Cambios

### `style.css`

Ocultar botones originales en cards por encargo:

```css
.item-encargo .js-item-buy-open {
    display: none !important;
}
.item-encargo a.btn-secondary.btn-small {
    display: none !important;
}
```

Estilo del botón inyectado:

```css
.btn-encargar {
    background: #25d366 !important;
    border-color: #25d366 !important;
    color: #fff !important;
}
.btn-encargar:hover {
    background: #1ebe5d !important;
    border-color: #1ebe5d !important;
}
```

### `script.html` — `marcarProductosEncargo()`

Modificar la función existente. La estructura del `forEach` queda así:

```js
document.querySelectorAll('.item-product').forEach(function(item) {
    // 1. Guard al inicio: evitar doble procesamiento si la función se llama más de una vez
    if (item.classList.contains('item-encargo')) return;

    var container = item.querySelector('.js-quickshop-container[data-variants]');
    if (!container) return;
    try {
        var variantes = JSON.parse(container.getAttribute('data-variants'));
        if (variantes.some(function(v) { return Number(v.stock) === 9999; })) {
            item.classList.add('item-encargo');

            // 2. Extraer datos del producto desde el DOM de la card
            var linkEl = item.querySelector('a.btn-secondary.btn-small');
            var url = linkEl ? linkEl.href : window.location.href;
            var nameEl = item.querySelector('.js-item-name');
            var nombre = nameEl ? nameEl.innerText.trim() : 'este producto';

            // 3. Construir URL de WhatsApp
            var mensaje = 'Hola Rapa Imports! Quiero encargar el producto *' + nombre + '* que vi en: ' + url + ' ¿Me podés dar más info?';
            var waUrl = 'https://wa.me/542364626266?text=' + encodeURIComponent(mensaje);

            // 4. Inyectar botón Encargar antes del botón Comprar
            var buyBtn = item.querySelector('.js-item-buy-open');
            if (buyBtn) {
                var encargarBtn = document.createElement('a');
                encargarBtn.href = waUrl;
                encargarBtn.target = '_blank';
                encargarBtn.rel = 'noopener noreferrer';
                encargarBtn.className = buyBtn.className.replace('js-item-buy-open', '').trim();
                encargarBtn.classList.add('btn-encargar');
                encargarBtn.textContent = 'Encargar';
                buyBtn.parentNode.insertBefore(encargarBtn, buyBtn);
            }
        }
    } catch (e) {}
});
```

## Selectores confirmados

| Elemento | Selector |
|---|---|
| Botón Comprar | `.js-item-buy-open` |
| Botón quickview (ojo) | `a.btn-secondary.btn-small` |
| Nombre del producto | `.js-item-name` |
| URL del producto | `a.btn-secondary.btn-small` → `href` |

## Fuente de datos para el mensaje WhatsApp

- **URL:** `href` del botón quickview (contiene la URL canónica del producto)
- **Nombre:** texto de `.js-item-name`
- **Teléfono:** `542364626266` (ya definido en el script existente)

## Limitación conocida

Si Tiendanube carga productos dinámicamente por scroll infinito o AJAX, `marcarProductosEncargo()` corre solo una vez al cargar la página y no procesará las cards nuevas. No es bloqueante para la implementación actual; se puede resolver en el futuro extendiendo el `MutationObserver` existente para también llamar a esta función.
