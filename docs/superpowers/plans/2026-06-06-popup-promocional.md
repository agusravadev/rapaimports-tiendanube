# Popup promocional "X compró Y" — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inyectar una tarjeta tipo social-proof "Nombre L. compró {producto}" en bottom-left, una sola vez por sesión, 10s después de cargar, autodismiss 5s con anillo SVG de cuenta regresiva en la X.

**Architecture:** Una IIFE nueva (`initPopupPromocional`) al final del `<script>` de `script.html`, totalmente autocontenida (no toca `initTiendaNubePersonalizado` ni el MutationObserver existente). Un bloque CSS nuevo al final de `style.css`, namespaced con prefijo `.promo-popup__*`. Cero modificaciones a código existente.

**Tech Stack:** HTML/CSS/JS vanilla, inyectado vía panel de Tiendanube (sin build system, sin framework de tests). Verificación manual en navegador, como indica `CLAUDE.md`.

**Spec:** `docs/superpowers/specs/2026-06-06-popup-promocional-design.md`

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `style.css` | Modificar (append al final) | Estilos visuales de `.promo-popup` y animaciones |
| `script.html` | Modificar (append IIFE antes de `</script>`) | Lógica de trigger, extracción de producto, render, cierre |
| `docs/superpowers/plans/2026-06-06-popup-promocional.md` | Crear (este archivo) | Plan |

No se crean archivos nuevos en el proyecto en sí. Todo va en los dos archivos existentes que ya se inyectan en Tiendanube.

---

## Task 1: CSS de la tarjeta

**Files:**
- Modify: `style.css` (append al final, después de línea 860)

- [ ] **Step 1: Agregar el bloque CSS al final de `style.css`**

Append exactamente este bloque después de la última línea actual de `style.css`:

```css

/* === Popup promocional (social proof) === */
.promo-popup {
	position: fixed;
	bottom: 20px;
	left: 20px;
	z-index: 9990;
	width: 320px;
	background: #fff;
	border-radius: 14px;
	box-shadow: 0 12px 32px rgba(0, 0, 0, .18);
	border-left: 3px solid #e30613;
	padding: 12px 40px 12px 12px;
	transform: translateX(-110%);
	opacity: 0;
	transition: transform .35s cubic-bezier(.4, 0, .2, 1), opacity .35s;
	font-family: inherit;
}

.promo-popup.is-visible {
	transform: translateX(0);
	opacity: 1;
}

.promo-popup.is-leaving {
	transform: translateX(-110%);
	opacity: 0;
	transition-duration: .25s;
}

.promo-popup__link {
	display: flex;
	gap: 12px;
	align-items: center;
	text-decoration: none;
	color: inherit;
}

.promo-popup__img {
	width: 56px;
	height: 56px;
	border-radius: 10px;
	object-fit: cover;
	flex-shrink: 0;
	background: #f3f4f6;
}

.promo-popup__text {
	display: flex;
	flex-direction: column;
	min-width: 0;
	gap: 2px;
}

.promo-popup__person {
	font-size: 12px;
	color: #6b7280;
	line-height: 1.2;
}

.promo-popup__product {
	font-size: 13px;
	font-weight: 600;
	color: #111;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.promo-popup__close {
	position: absolute;
	top: 6px;
	right: 6px;
	width: 26px;
	height: 26px;
	border: 0;
	background: transparent;
	padding: 0;
	cursor: pointer;
	display: grid;
	place-items: center;
}

.promo-popup__progress {
	width: 26px;
	height: 26px;
	position: absolute;
	inset: 0;
	transform: rotate(-90deg);
}

.promo-popup__progress circle {
	fill: none;
	stroke: #e30613;
	stroke-width: 2;
	stroke-dasharray: 100.53;
	stroke-dashoffset: 0;
	animation: promoPopupCountdown 5s linear forwards;
}

.promo-popup__x {
	font-size: 20px;
	line-height: 1;
	color: #111;
	position: relative;
	z-index: 1;
	font-weight: 400;
}

@keyframes promoPopupCountdown {
	to { stroke-dashoffset: 100.53; }
}

@media (max-width: 520px) {
	.promo-popup {
		left: 12px;
		right: 12px;
		bottom: 12px;
		width: auto;
	}
}

@media (prefers-reduced-motion: reduce) {
	.promo-popup {
		transition: opacity .25s;
		transform: none;
	}
	.promo-popup.is-leaving {
		transform: none;
	}
}
```

- [ ] **Step 2: Verificar sintaxis CSS**

En una terminal (o con cualquier validador online), confirmar que no haya llaves desbalanceadas. Comando rápido:

```bash
grep -c "^}" style.css
```
Expected: el contador aumentó vs antes en la cantidad de bloques añadidos (10 selectores + 1 keyframe + 2 media queries con bloques internos).

No hace falta cargar la tienda todavía: hasta que no exista el HTML, no se renderiza nada.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(popup): agregar estilos de tarjeta promocional social proof"
```

---

## Task 2: IIFE de lógica del popup en `script.html`

**Files:**
- Modify: `script.html` (insertar IIFE nueva justo antes de `</script>` en línea 824)

- [ ] **Step 1: Localizar el punto de inserción**

Abrir `script.html`. La última línea útil del bloque actual es:

```
823	  }
824	</script>
```

La línea 823 cierra el `if/else` de `initTiendaNubePersonalizado`. La nueva IIFE va **entre la línea 823 y la línea 824** (`</script>`), como bloque hermano del código existente.

- [ ] **Step 2: Insertar la IIFE completa**

Insertar exactamente este bloque después de la llave de cierre de la línea 823 y antes del `</script>`:

```javascript

  // === Popup promocional (social proof) ===
  (function initPopupPromocional() {
    var STORAGE_KEY = 'rapa_promo_popup_shown';
    var DELAY_MS = 10000;
    var AUTODISMISS_MS = 5000;
    var EXCLUDED_PATHS = /\/(checkout|cart|carrito|account|admin|api)(\/|$|\?)/i;
    var NOMBRES = [
      'Juan', 'Martín', 'Lucas', 'Mateo', 'Agustín', 'Tomás', 'Nicolás',
      'Joaquín', 'Federico', 'Bruno', 'Diego', 'Santiago', 'Franco',
      'Gonzalo', 'Maxi', 'Sofía', 'Camila', 'Valentina', 'Martina',
      'Lucía', 'Julieta', 'Florencia', 'Agustina', 'Micaela', 'Carolina',
      'Ailén', 'Brenda', 'Daniela', 'Romina', 'Antonella'
    ];

    function yaMostrada() {
      try { return sessionStorage.getItem(STORAGE_KEY) === '1'; }
      catch (_) { return false; }
    }

    function marcarMostrada() {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
    }

    function elegirProducto() {
      var cards = document.querySelectorAll('.item-product');
      if (!cards.length) return null;
      var card = cards[Math.floor(Math.random() * cards.length)];
      var nombreEl = card.querySelector('.js-item-name');
      var linkEl = card.querySelector('a.btn-secondary');
      var imgEl = card.querySelector('.js-product-item-image-container-private img');
      if (!nombreEl || !linkEl || !imgEl) return null;
      var nombre = (nombreEl.innerText || nombreEl.textContent || '').trim();
      var url = linkEl.href;
      var img = imgEl.currentSrc || imgEl.src;
      if (!nombre || !url || !img) return null;
      return { nombre: nombre, url: url, img: img };
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

      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'promo-popup__progress');
      svg.setAttribute('viewBox', '0 0 36 36');
      svg.setAttribute('aria-hidden', 'true');
      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', '18');
      circle.setAttribute('cy', '18');
      circle.setAttribute('r', '16');
      svg.appendChild(circle);
      btn.appendChild(svg);

      var x = document.createElement('span');
      x.className = 'promo-popup__x';
      x.setAttribute('aria-hidden', 'true');
      x.textContent = '×';
      btn.appendChild(x);

      aside.appendChild(btn);
      return aside;
    }

    function mostrar() {
      if (yaMostrada()) return;
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

```

Notar la línea en blanco al inicio y al final del bloque para separar visualmente del código existente y del `</script>`.

- [ ] **Step 3: Verificar que la estructura del archivo sigue cerrada correctamente**

```bash
grep -n "</script>" script.html
```
Expected: una sola coincidencia (la del cierre). Si aparecen dos, el bloque se insertó en lugar incorrecto.

```bash
grep -c "(function" script.html
```
Expected: aumentó en 1 (la nueva IIFE).

- [ ] **Step 4: Commit**

```bash
git add script.html
git commit -m "feat(popup): agregar lógica de popup promocional social proof"
```

---

## Task 3: Verificación manual en navegador

**Files:**
- Test: tienda en vivo de Rapa Imports (Tiendanube panel)

> Este proyecto no tiene servidor local. La verificación es manual subiendo `style.css` y `script.html` al panel de Tiendanube como indica `CLAUDE.md`.

- [ ] **Step 1: Subir cambios al panel de Tiendanube**

1. Panel Tiendanube → **Diseño → Editar CSS** → pegar contenido completo de `style.css` → Guardar.
2. Panel Tiendanube → **Configuración → Códigos de seguimiento → Footer** → pegar contenido completo de `script.html` → Guardar.

- [ ] **Step 2: Verificar el flujo feliz en home**

1. Abrir la home de la tienda en una pestaña **nueva en modo incógnito** (para empezar con sessionStorage limpio).
2. Esperar 10 segundos sin interactuar.
3. **Esperado:** aparece la tarjeta abajo-izquierda con animación de slide desde la izquierda. Texto formato "Nombre L. compró" + nombre real de uno de los productos visibles + imagen del producto.
4. El anillo rojo alrededor del X se vacía progresivamente.
5. **Esperado:** a los 5 segundos exactos, la tarjeta se desliza hacia afuera y desaparece.

- [ ] **Step 3: Verificar cierre con X**

1. En la **misma pestaña**, abrir DevTools → Application → Storage → borrar `sessionStorage` para esa origin (o cerrar/abrir pestaña incógnito).
2. Recargar la home, esperar 10s a que aparezca.
3. Hacer click en la X **antes** de los 5s.
4. **Esperado:** la tarjeta se cierra inmediatamente con animación de salida.

- [ ] **Step 4: Verificar "solo una vez por sesión"**

1. Con la tarjeta ya mostrada en esta sesión, navegar a otra página del sitio (ej: una categoría).
2. Esperar 10s.
3. **Esperado:** la tarjeta NO vuelve a aparecer.
4. Recargar la página actual y esperar 10s.
5. **Esperado:** la tarjeta NO vuelve a aparecer.

- [ ] **Step 5: Verificar click en la tarjeta lleva al producto**

1. Limpiar sessionStorage y recargar la home.
2. Esperar 10s a que aparezca la tarjeta.
3. Hacer click en la zona de la imagen o el texto (no en la X).
4. **Esperado:** navegación al detalle del producto que la tarjeta mostraba.

- [ ] **Step 6: Verificar exclusión de páginas de checkout/cart**

1. Limpiar sessionStorage.
2. Agregar un producto al carrito y abrir `/carrito` o `/checkout`.
3. Esperar 15s.
4. **Esperado:** la tarjeta NO aparece en esa página.
5. Volver a la home (sin limpiar sessionStorage), esperar 10s.
6. **Esperado:** la tarjeta SÍ aparece en home (no quedó marcada como mostrada).

- [ ] **Step 7: Verificar comportamiento en página sin productos**

1. Limpiar sessionStorage.
2. Ir a una página sin cards de producto (ej: contacto, "Sobre nosotros", o cualquier página de contenido).
3. Esperar 15s.
4. **Esperado:** la tarjeta NO aparece, sin errores en consola.
5. Navegar a la home (sessionStorage no marcado todavía).
6. Esperar 10s.
7. **Esperado:** la tarjeta SÍ aparece ahora.

- [ ] **Step 8: Verificar mobile**

1. Abrir DevTools → modo responsive → ancho ≤ 500px.
2. Limpiar sessionStorage, recargar home.
3. Esperar 10s.
4. **Esperado:** la tarjeta ocupa el ancho de la pantalla menos 24px de margen, pegada abajo.

- [ ] **Step 9: Verificar que no se rompió nada existente**

Checklist de regresiones (basado en código existente que comparte selectores):

1. **Listado de productos:** los swatches de color siguen funcionando, los botones "Encargar" siguen apareciendo en variantes 9999, los cards de stock físico siguen mostrando el botón normal.
2. **Detalle de producto:** la página de un producto por encargo sigue mostrando el badge naranja "Producto por encargo" y la fila custom de cuotas. El widget de transfer-savings sigue funcionando.
3. **Envío gratis:** las etiquetas de envío gratis en cards y en detalle siguen mostrándose correctamente.
4. **Banner promocional:** sigue ordenado.
5. **View Transitions:** la navegación entre páginas sigue teniendo fade.
6. **Consola:** sin errores nuevos.

- [ ] **Step 10: Commit del registro de verificación (opcional)**

Si hubo ajustes durante la verificación, commitearlos. Si no, no hace falta nuevo commit — Task 1 y Task 2 ya quedaron.

---

## Self-Review (completado por el autor del plan)

**Spec coverage:**
- ✅ Primera aparición a 10s → Task 2 (`DELAY_MS = 10000`)
- ✅ Una vez por sesión → Task 2 (`yaMostrada`/`marcarMostrada` con sessionStorage)
- ✅ Producto random de la página → Task 2 (`elegirProducto` itera `.item-product`)
- ✅ Persona simulada con pool argentino + inicial → Task 2 (`NOMBRES` array + `String.fromCharCode`)
- ✅ Auto-dismiss 5s + X con countdown ring → Task 1 (`@keyframes promoPopupCountdown`) + Task 2 (`AUTODISMISS_MS`)
- ✅ Exclusión de paths → Task 2 (`EXCLUDED_PATHS` regex)
- ✅ Fallback silencioso sin productos → Task 2 (`if (!cards.length) return null`)
- ✅ Estilo: blanco con acento rojo, posición bottom-left, mobile fluido, reduced-motion → Task 1
- ✅ Accesibilidad: role/aria-live/aria-label → Task 2 (`construirTarjeta`)
- ✅ z-index 9990 debajo de modales → Task 1
- ✅ Sin uso de `innerHTML` para datos de producto → Task 2 (`createElement` + `textContent`)
- ✅ try/catch sessionStorage → Task 2 (`yaMostrada`/`marcarMostrada`)
- ✅ Verificación manual cubriendo todos los flujos → Task 3

**Placeholder scan:** sin "TBD"/"TODO"/"implementar después". Todos los bloques de código son completos.

**Type consistency:** el spec usa `promo-popup`, `promo-popup__link`, `promo-popup__img`, `promo-popup__text`, `promo-popup__person`, `promo-popup__product`, `promo-popup__close`, `promo-popup__progress`, `promo-popup__x`. Verificado: las clases en CSS (Task 1) y en JS (Task 2) coinciden exactamente. Las constantes `DELAY_MS` (10000) y `AUTODISMISS_MS` (5000) coinciden con el spec (10s y 5s). La duración de `@keyframes promoPopupCountdown` (5s) coincide con `AUTODISMISS_MS`. La `stroke-dasharray` (100.53) coincide con 2π·16.
