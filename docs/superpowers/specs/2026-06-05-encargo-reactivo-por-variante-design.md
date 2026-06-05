# Encargo reactivo por variante seleccionada

Fecha: 2026-06-05
Branch: `fix/cambio-de-disponibilidad-segun-color`

## Problema

El sistema actual trata "producto por encargo" como una propiedad estática del producto:

- **Página de detalle** (`script.html:68-71`): lee `<meta property="tiendanube:stock">`. Si vale `9999`, agrega `body.producto-encargo` y queda así toda la sesión. No reacciona al selector de variantes.
- **Listado** (`script.html:152-201`): marca la card como `item-encargo` si **alguna** variante tiene stock 9999, sin importar qué variante esté seleccionada en el swatch.

Cuando un producto tiene variantes mixtas (ej: rojo con stock físico + blanco con stock 9999), esto produce dos bugs:

1. En el listado, el cliente ve siempre el badge de avión y el botón "Encargar" aunque haya tocado el swatch rojo (que sí tiene stock).
2. En el detalle, una vez que entra al producto la UI queda fija — si el meta tag dio 9999 verá siempre "encargo", aunque seleccione una variante con stock; si dio stock real verá siempre "Comprar", aunque seleccione la variante 9999 (sin botón Encargar visible en la zona de compra, solo el de la descripción).

Además, en el detalle no existe un botón "Encargar" en la zona de compra (donde está `Agregar al carrito`). Solo está el bloque hardcodeado en la descripción HTML (`Default-structure/encargo.html`).

## Solución

La señal "encargo" pasa a ser una propiedad **de la variante actualmente seleccionada**, no del producto. Tanto card como detalle reaccionan en tiempo real al swatch tocado:

- Variante con stock real → estado "normal" (botón Comprar, sin badge avión).
- Variante con stock 9999 → estado "encargo" (badge avión + botón Encargar verde WhatsApp, igual al del listado).

Adicionalmente, se inyecta un botón "Encargar" en la zona de compra del detalle (donde vive `Agregar al carrito`), con la misma clase y comportamiento que el `.btn-encargar` del listado (`script.html:185-190`). No se modifica `Agregar al carrito` ni se elimina el bloque de la descripción (`encargo.html`).

## Diseño

### Fuente única de verdad

Una función `evaluarVarianteActiva(scope, variantId)` por contexto (card o detalle). Determina si la variante seleccionada es 9999 y aplica/quita las clases correspondientes:

- Card: toggle `item-encargo` en el `.item-product`.
- Detalle: toggle `producto-encargo` en el `<body>` y toggle visibilidad del botón Encargar inyectado.

### Listado de productos

Reemplaza `marcarProductosEncargo()`:

1. Para cada `.item-product` con `.js-quickshop-container[data-variants]`:
   - Parsea variantes (igual que hoy).
   - Si **ninguna** variante es 9999 → no toca la card (producto totalmente con stock, fuera de scope).
   - Si **todas** son 9999 → marca como `item-encargo` siempre (sin escuchar swatches, no hay alternativa con stock).
   - Si es **mixta** → instala listener en los swatches y evalúa la variante inicial.
2. Listener de swatches: escucha clicks en los elementos del selector de color (selector exacto a confirmar — ver "Discovery técnico"). Al click, identifica la variante activa y llama `evaluarVarianteActiva(card, variantId)`.
3. La función `evaluarVarianteActiva`:
   - Busca la variante en el array por id.
   - Si es 9999 → agrega `item-encargo`, inserta `.btn-encargar` (si no existe), oculta botón Comprar.
   - Si no → quita `item-encargo`, remueve `.btn-encargar`, restaura botón Comprar.

### Página de detalle

Nuevo bloque, reemplaza la detección por meta tag estática (`script.html:68-71`):

1. Al cargar `#single-product`:
   - Parsea variantes desde una fuente confiable (a confirmar en discovery: probablemente la misma `data-variants` o una variable JS expuesta por Tiendanube como `LS.variants`).
   - Identifica la variante inicial seleccionada (la que tiene clase activa en `.js-product-variants`, o la primera).
   - Llama `evaluarVarianteActivaDetalle(variantId)`.
2. Listener en `.js-product-variants`: delegated click handler que detecta cambio de variante y re-evalúa.
3. `evaluarVarianteActivaDetalle`:
   - Si 9999 → agrega `body.producto-encargo` (el CSS existente oculta los botones de compra) e inyecta botón Encargar en la zona donde vive `Agregar al carrito` (si no existe). Usa la misma clase `btn btn-primary btn-small btn-encargar` y construye el `wa.me` con `mensajeEncargar` (mismo formato que el del listado: nombre del producto + URL canónica).
   - Si no → quita `body.producto-encargo`, remueve el botón Encargar inyectado.
4. Guard de idempotencia: el botón Encargar inyectado lleva una clase distintiva (`btn-encargar-detalle`) para no duplicarse si la función corre varias veces (MutationObserver).

### Botón Encargar del detalle

- Clase: `btn btn-primary btn-small btn-encargar btn-encargar-detalle`.
- Texto: `Encargar`.
- `href`: `https://wa.me/542364626266?text=` + encoded `mensajeEncargar`.
- `target="_blank"`, `rel="noopener noreferrer"`.
- Punto de inserción: contenedor de `.js-addtocart` o similar — el script lo localiza y lo inserta al lado/dentro.

### Discovery técnico (al implementar)

Antes de codear, abrir un producto con variantes de color en el navegador (URL la provee el usuario) y confirmar con DevTools:

1. **Selector del swatch en card**: ¿qué clase usan los círculos de color? (candidatos: `.js-insta-variant`, `[data-variant-id]`, `.variant-option`).
2. **Cómo se identifica la variante activa**: ¿clase `.selected` / `.active` / atributo `aria-selected`?
3. **Selector del swatch en detalle**: lo mismo dentro de `.js-product-variants`.
4. **Punto de inserción del botón Encargar en el detalle**: nodo padre exacto de `.js-addtocart` o `[data-store="product-buy-button"]`.
5. **Fuente de variantes en el detalle**: ¿hay `data-variants` también, o conviene usar `LS.product.variants` (variable global típica de Tiendanube)?

El código se escribe defensivamente: si un selector no aparece, falla silenciosamente sin romper la página.

### Lo que NO se hace

- No se modifica `Agregar al carrito` (sigue oculto vía CSS para `body.producto-encargo`).
- No se elimina el bloque "Encargar por WhatsApp" hardcodeado en `Default-structure/encargo.html`.
- No se tocan los templates HTML de descripciones.
- No se modifica el CSS de `.item-encargo` ni `body.producto-encargo` (las reglas existentes siguen aplicando, solo cambia el momento en que se aplica/remueve la clase).

## Cambios por archivo

**`script.html`:**
- Eliminar la detección por meta tag (líneas 68-71).
- Reemplazar `marcarProductosEncargo()` por la versión reactiva descrita arriba.
- Agregar una nueva función `initEncargoDetalle()` para la página `#single-product`, llamada desde `initTiendaNubePersonalizado()`.
- Conectar ambas al MutationObserver existente (con debounce, ya implementado).

**`style.css`:**
- Sin cambios.

**`CLAUDE.md`:**
- Actualizar la sección "Convención producto por encargo (stock 9999)" para reflejar que la detección ahora es por variante seleccionada, no por meta tag estático ni por "alguna variante 9999".

## Riesgos y mitigaciones

- **Re-render de Tiendanube al cambiar variante**: si el theme reemplaza el DOM de la card/detalle al cambiar variante, el MutationObserver puede disparar bucles. Mitigación: el debounce de 300ms existente + guards de "ya procesado para esta variante" (comparar dataset.variantActual antes de re-aplicar).
- **Variante por defecto ambigua**: si el theme no marca variante seleccionada al cargar, defaulteamos a la primera variante con stock > 0 (o la primera de la lista si todas son 9999).
- **Mensaje WhatsApp**: en el detalle ya hay lógica que construye `mensajeEncargar` con `og:title` y canonical. Reutilizamos esa variable (está en scope de `initTiendaNubePersonalizado`) para no duplicar la construcción del mensaje.
- **Producto con todas las variantes en encargo**: comportamiento equivalente al actual — siempre encargo, sin reactividad necesaria.

## Verificación manual (post-implementación)

1. Producto con stock real, sin variantes 9999: card y detalle muestran flujo normal (sin badge, con Comprar).
2. Producto con todas las variantes 9999: card y detalle muestran flujo encargo (badge + Encargar) sin importar swatch.
3. Producto mixto, swatch rojo (con stock) seleccionado en card: card sin badge, con Comprar.
4. Mismo producto, swatch blanco (9999) seleccionado en card: aparece badge + cambia a Encargar.
5. Entrar al detalle con variante mixta seleccionada en blanco: detalle ya muestra Encargar al cargar.
6. Cambiar a rojo dentro del detalle: desaparece badge/Encargar, aparece Comprar.
7. Cambiar de vuelta a blanco: vuelve a Encargar.
8. El bloque de la descripción HTML sigue presente en ambos estados (no se toca).
