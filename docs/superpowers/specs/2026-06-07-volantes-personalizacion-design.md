# Personalización de volantes en página de detalle

**Fecha:** 2026-06-07
**Rama:** `feat/volantes`
**Alcance:** UI y lógica de personalización en `#single-product` **solo** para productos de la categoría "Volantes". No afecta otras categorías ni el listado.

---

## 1. Objetivo

Agregar un selector de personalización en la página de detalle de los volantes. El usuario elige opciones en 4 ejes (Grip, Display LED, Cobertor de air-bag, Fibra de carbono forjada), aprieta "Cotizar volante" para ver el precio final, y "Encargar ahora" para enviar la consulta por WhatsApp con el detalle.

Los volantes son siempre productos por encargo (variante con `stock = 9999`), así que el flujo reutiliza la infra existente (`body.producto-encargo`, `initEncargoDetalle`) y solo agrega capas específicas para volantes.

Los precios de los volantes se muestran con etiqueta "USD" al lado del monto (el resto del sitio sigue en ARS sin cambios).

## 2. Detección de categoría y alcance

### Activación

El script agrega `body.es-volante` antes del primer paint si detecta que el producto pertenece a "Volantes". Método de detección, en orden de prioridad:

1. **Breadcrumb del DOM:** buscar dentro de `.breadcrumb` cualquier link/texto que contenga "Volantes" (case-insensitive, ignora acentos).
2. **Fallback:** si Tiendanube expone `LS.product.categories` con los nombres de categoría, buscar "Volantes" ahí.

Si ninguna fuente está disponible al cargar, se reintenta vía `MutationObserver` sobre el contenedor del breadcrumb (mismo patrón de reintentos que `initEncargoDetalle` actual).

### Activaciones gatilladas por `body.es-volante`

- Sufijo " USD" al lado del precio (principal y comparativo).
- Ocultar bloque de cuotas (nativo de Tiendanube y `.cuotas-encargo-row` custom).
- Ocultar caja de transferencia (`.payment-discount-price-product-container`).
- Inyectar bloque "Personalizá tu volante" debajo de la sección de envío gratis.
- Inyectar botón "Cotizar volante" al final del bloque.
- Posicionar el botón "Encargar ahora" (ya existente, inyectado por `initEncargoDetalle`) inmediatamente después de "Cotizar volante".
- Extender el mensaje de WhatsApp para incluir personalizaciones elegidas + Total en USD.

### Aislamiento

- Todas las reglas CSS nuevas se prefijan con `body.es-volante #single-product …`. Otras categorías mantienen el comportamiento actual.
- En productos de otras categorías que también son por encargo, sigue funcionando el flujo `producto-encargo` sin la capa de personalización.
- En el listado (homepage, categorías) no se aplica nada. La detección solo corre en la página de detalle (`#single-product` presente en DOM).

## 3. Modelo de datos de personalización

Datos centralizados en `script.html` como un único objeto JS. Mismo set para todos los volantes.

```js
var PERSONALIZACIONES_VOLANTE = [
  {
    id: 'grip',
    label: 'Grip',
    opciones: [
      { id: 'micro',     label: 'Cuero microperforado', extra: 0,    default: true },
      { id: 'liso',      label: 'Cuero liso',           extra: 0 },
      { id: 'alcantara', label: 'Alcantara',            extra: 60.5 }
    ]
  },
  {
    id: 'display',
    label: 'Display LED',
    opciones: [
      { id: 'sin', label: 'Sin display LED', extra: 0,   default: true },
      { id: 'con', label: 'Con display LED', extra: 145 }
    ]
  },
  {
    id: 'airbag',
    label: 'Cobertor de air-bag',
    opciones: [
      { id: 'original',  label: 'Original',    extra: 0,    default: true },
      { id: 'liso',      label: 'Cuero liso',  extra: 60.5 },
      { id: 'alcantara', label: 'Alcantara',   extra: 60.5 }
    ]
  },
  {
    id: 'carbono',
    label: 'Fibra de carbono forjada',
    opciones: [
      { id: 'negra',   label: 'Negra brillante', extra: 0,    default: true },
      { id: 'forjada', label: 'Forjada',         extra: 60.5 }
    ]
  }
];
```

### Reglas de negocio

- El campo `extra` es **interno**, nunca se renderiza en el DOM visible al cliente. Vive solo en el objeto JS (puede aparecer en `data-*` attributes para que el handler de click lea el valor, pero sin texto visible).
- Todos los defaults son `+0` → al cargar la página, el precio mostrado coincide con el precio base de Tiendanube.
- La selección es obligatoria en los 4 ejes (siempre hay exactamente una opción activa por eje).
- Camino futuro para imágenes: agregar un campo `img: 'url'` por opción. Mientras tanto cada card renderiza un placeholder gris.

## 4. UI del bloque de personalización

### Estructura DOM inyectada

```html
<section class="volante-personalizacion">
  <h3 class="volante-personalizacion__title">Personalizá tu volante</h3>

  <div class="volante-personalizacion__eje" data-eje="grip">
    <h4 class="volante-personalizacion__eje-label">Grip</h4>
    <div class="volante-personalizacion__opciones">
      <button class="volante-card is-active" data-opcion="micro" data-extra="0">
        <div class="volante-card__img"></div>
        <span class="volante-card__label">Cuero microperforado</span>
      </button>
      <button class="volante-card" data-opcion="liso" data-extra="0">
        <div class="volante-card__img"></div>
        <span class="volante-card__label">Cuero liso</span>
      </button>
      <button class="volante-card" data-opcion="alcantara" data-extra="60.5">
        <div class="volante-card__img"></div>
        <span class="volante-card__label">Alcantara</span>
      </button>
    </div>
  </div>

  <!-- mismo patrón para display, airbag, carbono -->

  <button class="btn btn-cotizar-volante" type="button">Cotizar volante</button>
</section>
```

### Posicionamiento

- Inserción inmediatamente **después** del último elemento de envío gratis visible (`.js-product-form-free-shipping-message` o `.free-shipping-message`).
- Fallback: si no se encuentra ningún elemento de envío, el bloque va inmediatamente antes de la zona de compra (`[data-store="product-buy-button"]`).
- Idempotente: si ya existe `.volante-personalizacion` en el DOM, no se vuelve a inyectar.

### Layout de cards (grid)

| Breakpoint | Cards por fila | Lado de card |
|---|---|---|
| Mobile (<768px) | 3 | ~100px |
| Desktop (≥768px) | 4 | ~120px |

- Cada card: recuadro de imagen arriba (placeholder gris con patrón diagonal mientras no haya `img`) + label abajo (texto chico, máx 2 líneas, ellipsis si desborda).
- Card activa: borde rojo (color de marca Rapa), label en bold.
- Card hover: borde gris medio.
- Sin texto de precio visible en ninguna card.

### Botones al final

Ambos botones usan exactamente las mismas dimensiones, padding, margin, tipografía y forma de pill que el `.btn-encargar-detalle` actual ([style.css:822](style.css:822)).

| Botón | Texto | Fondo | Texto | Icono |
|---|---|---|---|---|
| `Cotizar volante` | "Cotizar volante" | Negro | Blanco | — |
| `Encargar ahora` | "Encargar ahora" | Naranja (sin cambios) | Blanco | SVG WhatsApp (sin cambios) |

Orden vertical: Cotizar primero, Encargar inmediatamente debajo.

## 5. Flujo de precio

### Estados del precio mostrado

| Momento | Precio mostrado |
|---|---|
| Carga inicial | Precio base de Tiendanube + " USD" |
| Usuario cambia una opción | **Sin cambio** (sigue siendo base) |
| Click "Cotizar volante" | `base + Σ(extras seleccionados)` + " USD" |
| Usuario cambia opción después de cotizar | **Vuelve a base** (se descarta el cotizado) |

### Estados del botón Cotizar

| Estado | Apariencia | Acción al click |
|---|---|---|
| Habilitado | Pill negra normal, texto "Cotizar volante" | Calcula total, actualiza precio en pantalla, transiciona a "cotizado" |
| Cotizado | Opacidad 0.6, texto "Cotizado ✓", `pointer-events: none` | (no clickeable) |

Cuando el usuario cambia cualquier opción estando en estado "cotizado", el botón vuelve a "habilitado" y el precio en pantalla vuelve a base.

### Escritura del precio en el DOM

- El monto se renderiza dentro del `<span>` que ya usa Tiendanube en `.price-container` (el ordenado por `order: 2` según [CLAUDE.md](CLAUDE.md) — sección "Precio y descuentos").
- La etiqueta " USD" se aplica vía pseudoelemento `::after` con `content: " USD"` sobre el span del precio (dentro de `body.es-volante`). Esto evita ensuciar el DOM y sobrevive a re-renderizados de Tiendanube.
- El JS solo reescribe el número del span; el `::after` mantiene la etiqueta automáticamente.

### Edge cases

- Si `LS.product` o el span del precio no están disponibles al inicio, hay reintento con timeout 1500ms + `MutationObserver` (mismo patrón que `initEncargoDetalle`).
- Si el precio base no se puede parsear, el cálculo no se ejecuta, se loguea `console.warn`, y el botón Cotizar queda visible pero el click no produce cambios (no rompe la página).
- Formato numérico del precio renderizado en pantalla: convención `es-AR` (separador de miles `.`, decimal `,`). Decimales: si el Total cae justo (ej: $320), se muestra sin decimales; si tiene fracción (ej: $380,5 por sumar +60,5), se muestra con un decimal. Coherente con cómo Tiendanube ya renderiza precios en la tienda.
- Mismo formato se usa en el `MONTO` del mensaje de WhatsApp (sección 7).

## 6. Widgets ocultos en volantes

Vía `body.es-volante #single-product`:

| Selector | Acción | Por qué |
|---|---|---|
| `.payment-discount-price-product-container` | `display: none` | Caja "MEJOR PRECIO 25% OFF" de transferencia, no aplica a volantes USD |
| `.js-product-payments-container` | `display: none` | Bloque de cuotas nativo de Tiendanube |
| `.cuotas-encargo-row` | `display: none` | Row custom de "3 cuotas sin interés" inyectado por `initCuotasEncargo` |

El resto del bloque (precio, envío gratis, swatches de variantes nativas si las hay, descripción del producto) se mantiene sin cambios.

### Interacción con `body.producto-encargo`

Los volantes son por encargo, así que `body.producto-encargo` también está activo. La infra existente sigue funcionando: oculta agregar al carrito, cantidad, descuento — todo eso queda igual. Las reglas `body.es-volante` se superponen sobre las de `producto-encargo` con prefijos específicos para que ambas convivan sin pisarse.

## 7. Mensaje de WhatsApp ("Encargar ahora" en volantes)

El botón "Encargar ahora" para volantes extiende el mensaje base actual con la lista de personalizaciones elegidas y el Total calculado en vivo.

### Estructura del mensaje

```
Hola Rapa Imports! Quiero encargar el producto *{NOMBRE_PRODUCTO}* que vi en: {URL}

Personalizaciones elegidas:
- Grip: {opción}
- Display LED: {opción}
- Cobertor de air-bag: {opción}
- Fibra de carbono forjada: {opción}

Total = ${MONTO} USD

¿Me podés dar más info?
```

### Reglas

- `NOMBRE_PRODUCTO` y `URL` se leen igual que hoy: `meta[property="og:title"]` + `link[rel="canonical"]` / `meta[property="og:url"]` ([script.html:297-298](script.html:297)).
- La sección "Personalizaciones elegidas" se arma a partir del objeto en memoria con la selección actual al momento del click (no del último cotizado).
- `MONTO` se calcula al momento del click: `base + Σ(extras de opciones actualmente seleccionadas)`. Independiente de si el botón Cotizar fue presionado o no.
- Si la selección coincide con todos los defaults (todos +0), el Total es igual al precio base.
- En productos de otras categorías, el botón Encargar sigue armando el mensaje genérico actual (sin sección de personalizaciones ni Total) — sin cambios respecto del comportamiento actual.

### Integración con `initEncargoDetalle`

La función `ensureBtnEncargar` ([script.html:290](script.html:290)) se extiende: si `body.es-volante` está activo, el `href` del botón se actualiza con el mensaje extendido cada vez que el usuario clickea Encargar (handler de click que regenera el `href` antes de que el navegador siga el link, o regeneración perezosa via listener en `pointerdown`).

## 8. Archivos a modificar

| Archivo | Cambios |
|---|---|
| `script.html` | Detección de categoría (`body.es-volante`), objeto `PERSONALIZACIONES_VOLANTE`, función de inyección del bloque, handlers de click en cards, handler de Cotizar, extensión de `ensureBtnEncargar` con mensaje de volante |
| `style.css` | Reglas con prefijo `body.es-volante #single-product` para: etiqueta USD vía `::after`, ocultar widgets de cuotas/transferencia, estilos del bloque `.volante-personalizacion`, grid de cards, estados activo/cotizado de Cotizar |

Sin nuevos archivos ni cambios en `Default-structure/*.html` ni en otros componentes.

## 9. Out of scope (explícito)

- Imágenes reales de las opciones de personalización (se trabajan en una iteración posterior; el spec define el placeholder y el path de migración).
- Listado de productos: no se cambia nada en cards del homepage/categorías.
- Otros productos por encargo no-volantes: no reciben ningún cambio.
- Carrito nativo de Tiendanube: no hay add-to-cart, todo se canaliza por WhatsApp como hasta ahora.
- Cotización en tiempo real con dólar de mercado o API externa: el admin carga el número en USD directamente en el campo de precio de Tiendanube.
- Persistencia de la selección entre recargas o entre sesiones: la selección vive solo en memoria.
