# Popup promocional "X compró Y" — Spec de diseño

**Fecha:** 2026-06-06
**Rama:** `feat/popup-promocional`
**Estado:** Aprobado por el usuario, pendiente de plan de implementación

## Objetivo

Mostrar una tarjeta tipo "social proof" en la esquina inferior izquierda del sitio que diga "Nombre L. compró {producto}" con la imagen del producto y un link al detalle. Aparece una sola vez por sesión, 10 segundos después de cargar la página, y se cierra automáticamente a los 5s (o antes con la X).

## Requisitos funcionales

1. **Primera aparición:** 10s después del `DOMContentLoaded` de la página.
2. **Frecuencia:** una sola vez por sesión (sessionStorage). Si el usuario cierra la pestaña y vuelve a entrar otro día, ve la tarjeta de nuevo.
3. **Origen del contenido:** producto elegido al azar entre los `.item-product` visibles en la página actual. Si no hay cards en esa página, no se muestra nada (fallback silencioso).
4. **Persona simulada:** nombre de pila de un pool de ~30 nombres argentinos comunes + una letra A–Z al azar seguida de punto. Ej: "Martín K.", "Sofía R.".
5. **Cierre:**
   - Auto-dismiss a los 5s.
   - Botón X en esquina superior derecha con un anillo SVG que sirve de cuenta regresiva visual (se va vaciando durante esos 5s).
6. **Páginas excluidas:** rutas que matcheen `/(checkout|cart|carrito|account|admin|api)`. Misma regex que ya usa el prefetcher en `script.html`.
7. **Click en la tarjeta:** lleva al detalle del producto elegido.

## Requisitos no funcionales

- **No romper código existente.** Todo va con prefijo `promo-popup` y `rapa_promo_popup_*` para sessionStorage.
- **Falla silenciosa.** Si falta algún selector, si no hay productos, si sessionStorage no está disponible, simplemente no aparece nada — sin errores en consola.
- **Performance:** lazy en imagen, sin librerías externas, ~50 líneas de JS y ~80 líneas de CSS.
- **Accesibilidad:** `role="status"`, `aria-live="polite"`, X con `aria-label="Cerrar"`. Respeta `prefers-reduced-motion` (sin slide, solo fade; la animación del redondel se mantiene por ser informativa).
- **Mobile:** ancho fluido con margen 12px en pantallas ≤520px.

## Arquitectura

### Distribución de archivos

| Archivo | Cambio | Ubicación dentro del archivo |
|---|---|---|
| `script.html` | Nueva IIFE `initPopupPromocional` | Al final del bloque `<script>`, después de las inicializaciones existentes |
| `style.css` | Bloque nuevo `/* === Popup promocional === */` | Al final del archivo |

No se modifica nada existente. Todos los selectores son nuevos y namespaced.

### Selectores que se LEEN (no se modifican)

| Selector | Para qué se usa | Por qué es confiable |
|---|---|---|
| `.item-product` | Detectar cards de producto en la página | Clase estándar del theme, ya usada por el código de encargo |
| `.js-item-name` | Extraer el nombre del producto | Ya se usa en `construirBtnEncargar` (`script.html:199`) |
| `a.btn-secondary` (dentro del card) | Extraer la URL del producto | Ya se usa en `construirBtnEncargar` (`script.html:197`) |
| `.js-product-item-image-container-private img` | Extraer la imagen del producto | Ya estilizado en `style.css:358-377`, garantizado presente |

### Lógica JS — pseudocódigo

```js
(function initPopupPromocional() {
  // Guards
  if (sessionStorage.getItem('rapa_promo_popup_shown') === '1') return;
  if (/\/(checkout|cart|carrito|account|admin|api)(\/|$|\?)/i.test(location.pathname)) return;

  function arrancar() {
    setTimeout(function() {
      var cards = document.querySelectorAll('.item-product');
      if (!cards.length) return;

      var card = cards[Math.floor(Math.random() * cards.length)];
      var nombreEl = card.querySelector('.js-item-name');
      var linkEl = card.querySelector('a.btn-secondary');
      var imgEl = card.querySelector('.js-product-item-image-container-private img');
      if (!nombreEl || !linkEl || !imgEl) return;

      var producto = {
        nombre: nombreEl.innerText.trim(),
        url: linkEl.href,
        img: imgEl.currentSrc || imgEl.src
      };

      var NOMBRES = ['Juan','Martín','Lucas','Mateo','Agustín','Tomás', /* ~30 total */];
      var nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)];
      var inicial = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      var persona = nombre + ' ' + inicial + '.';

      var el = construirTarjeta(producto, persona);
      document.body.appendChild(el);
      try { sessionStorage.setItem('rapa_promo_popup_shown', '1'); } catch(_) {}

      requestAnimationFrame(function() { el.classList.add('is-visible'); });

      var autoTimer = setTimeout(cerrar, 5000);
      el.querySelector('.promo-popup__close').addEventListener('click', function() {
        clearTimeout(autoTimer);
        cerrar();
      });

      function cerrar() {
        el.classList.add('is-leaving');
        setTimeout(function() { el.remove(); }, 300);
      }
    }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
```

`construirTarjeta` arma el HTML descrito abajo con `createElement` (sin innerHTML para evitar inyección si algún nombre de producto trae HTML raro).

### Estructura HTML inyectada

```html
<aside class="promo-popup" role="status" aria-live="polite">
  <a class="promo-popup__link" href="{url}">
    <img class="promo-popup__img" src="{img}" alt="" loading="lazy">
    <div class="promo-popup__text">
      <span class="promo-popup__person">Martín K. compró</span>
      <span class="promo-popup__product">{nombre}</span>
    </div>
  </a>
  <button type="button" class="promo-popup__close" aria-label="Cerrar">
    <svg class="promo-popup__progress" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16"></circle>
    </svg>
    <span class="promo-popup__x" aria-hidden="true">×</span>
  </button>
</aside>
```

### Estilo (`style.css`)

- **`.promo-popup`**: `position: fixed; bottom: 20px; left: 20px; z-index: 9990; width: 320px; background: #fff; border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.18); border-left: 3px solid #e30613; padding: 12px 36px 12px 12px; transform: translateX(-110%); opacity: 0; transition: transform .35s cubic-bezier(.4,0,.2,1), opacity .35s;`
- **`.promo-popup.is-visible`**: `transform: translateX(0); opacity: 1;`
- **`.promo-popup.is-leaving`**: `transform: translateX(-110%); opacity: 0; transition-duration: .25s;`
- **`.promo-popup__link`**: `display: flex; gap: 12px; align-items: center; text-decoration: none; color: inherit;`
- **`.promo-popup__img`**: `width: 56px; height: 56px; border-radius: 10px; object-fit: cover; flex-shrink: 0;`
- **`.promo-popup__text`**: `display: flex; flex-direction: column; min-width: 0;`
- **`.promo-popup__person`**: `font-size: 12px; color: #6b7280; line-height: 1.2;`
- **`.promo-popup__product`**: `font-size: 13px; font-weight: 600; color: #111; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`
- **`.promo-popup__close`**: `position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; border: 0; background: transparent; padding: 0; cursor: pointer; display: grid; place-items: center;`
- **`.promo-popup__progress`**: `width: 26px; height: 26px; position: absolute; inset: 0; transform: rotate(-90deg);`
- **`.promo-popup__progress circle`**: `fill: none; stroke: #e30613; stroke-width: 2; stroke-dasharray: 100.53; stroke-dashoffset: 0; animation: promoPopupCountdown 5s linear forwards;` (circunferencia con r=16 → 2π·16 ≈ 100.53)
- **`.promo-popup__x`**: `font-size: 18px; line-height: 1; color: #111; position: relative; z-index: 1;`
- **`@keyframes promoPopupCountdown { to { stroke-dashoffset: 100.53; } }`**
- **`@media (max-width: 520px)`**: `.promo-popup { left: 12px; right: 12px; bottom: 12px; width: auto; }`
- **`@media (prefers-reduced-motion: reduce)`**: `.promo-popup { transition: opacity .25s; transform: none; }` y `.promo-popup.is-leaving { transform: none; }` (el redondel del contador se mantiene porque es informativo).

## Pool de nombres

~30 nombres argentinos comunes (mix género, edades variadas). Borrador: Juan, Martín, Lucas, Mateo, Agustín, Tomás, Nicolás, Joaquín, Federico, Bruno, Diego, Santiago, Franco, Gonzalo, Maxi, Sofía, Camila, Valentina, Martina, Lucía, Julieta, Florencia, Agustina, Micaela, Carolina, Ailén, Brenda, Daniela, Romina, Antonella.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Tiendanube cambia un selector | Guards verifican existencia de cada elemento; si falta uno, no se muestra |
| sessionStorage bloqueado (navegación privada estricta) | `try/catch` alrededor del `setItem` — la tarjeta aparece igual, solo no se persiste el flag |
| Nombre de producto con HTML | Se usa `textContent`/`createTextNode`, no `innerHTML` |
| Conflicto de z-index con modales/drawer | z-index 9990, debajo del 9999+ que usa Tiendanube |
| Página con SPA-style nav (View Transitions) | El script ya está debajo del bloque de View Transitions y usa `DOMContentLoaded`, que sí dispara por navegación normal. Si en el futuro se mueve a SPA, habrá que re-evaluar |

## Fuera de scope (decisiones explícitas)

- No hay loop de varias tarjetas seguidas.
- No hay pool de productos hardcodeado: se usan los productos reales de la página.
- No se muestra nada en páginas sin cards de producto.
- No hay tracking/analytics de impresiones o cierres.
- No hay configuración admin/panel: la lista de nombres y los textos viven en el JS.
