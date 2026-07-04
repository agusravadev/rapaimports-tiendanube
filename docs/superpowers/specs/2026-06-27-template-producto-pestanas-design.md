# Template de descripción de producto con pestañas — rediseño

**Fecha:** 2026-06-27
**Rama:** `main` (trabajo directo sobre `Default-structure/`)
**Alcance:** Rediseño visual del template HTML que se pega en la descripción del producto de Tiendanube. Actualiza los archivos `Default-structure/producto-carcasas-golf-DARK.html` y `Default-structure/producto-carcasas-golf-LIGHT.html`. No toca `script.js`, `style.css` ni los templates base `encargo.html` / `stock.html`.

El producto piloto sigue siendo **Carcasas de Espejos Retrovisores (VW Golf)**; los archivos rediseñados pasan a ser la referencia visual para futuras descripciones de productos con pestañas.

---

## 1. Objetivo

Transformar la descripción HTML inline en una pieza:

- **Robusta y sólida** visualmente: tipografía con peso, bordes definidos, geometría rectilínea, sin efectos glass ni decorativos.
- **Legible y navegable**: el contenido largo se divide en pestañas (Resumen · Specs · Compatibilidad · Instalación · Kit) para que el cliente acceda directo a lo que busca.
- **100% responsive**: rinde igual de bien a 860px de ancho que a 360px.
- **Reutilizable como template**: los patrones de header, segmented control, paneles y paletas sirven para futuros productos con cambios mínimos.

Se entregan **dos versiones paralelas** del mismo HTML (DARK y LIGHT) que solo difieren en paleta.

---

## 2. Decisiones de diseño tomadas

| Componente | Decisión | Razón |
|---|---|---|
| Navegación de pestañas | **Segmented control** (5 segmentos pegados, divididos por hairlines, activo lleno en rojo `#d91a1a` con texto blanco) | Se siente "premium" y unificado (una sola pieza dividida), más sólido que botones sueltos. |
| Header — layout | **Centrado** horizontalmente | Pedido del usuario. La franja vertical roja de la propuesta anterior no convive con texto centrado, se reemplazó por una franja horizontal corta. |
| Header — anclaje rojo | **Línea horizontal corta** (44px × 3px) arriba del eyebrow, centrada, redondeada | Mantiene la presencia del rojo como identidad sin romper el centrado. |
| Header — eyebrow | Texto plano (sin pill/badge), `letter-spacing: 3px`, `color: #ff5252` en DARK / `#d91a1a` en LIGHT | El pill agregaba ruido visual; el eyebrow plano es más editorial. |
| Header — stats bar | **Grid de 4 datos clave** abajo del título (Material · Acabado · Kit · Compatibilidad), con divisores verticales y labels en uppercase | El cliente ve la "ficha rápida" antes de tocar una sola pestaña. Refuerza la sensación de ficha técnica. |
| Panel Specs | **Tabla key-value clásica** (2 columnas alternadas), filas con borde `#252525` (DARK) / `#e6e6e6` (LIGHT) | Es el patrón más "manual de servicio". B (grid de cards) competía visualmente con la stats bar. |
| Panel Instalación — paso | **Card con header numerado** "PASO N" + sub-etiqueta descriptiva, texto del paso debajo | El sub-título por paso ("PASO 1 — Acceso a los clips") mejora la legibilidad. Números enteros, no `01`/`02`. |
| Bloque "Recomendación" | Amarillo en DARK (`#ffc107`), **naranja medio en LIGHT** (`#ea580c`) | En LIGHT el amarillo dorado quedaba flojo; el naranja medio tiene presencia sin ser estridente. |
| Botón "Consultar por WhatsApp" | **Auto-width** centrado dentro de la caja verde, con ícono Tabler `ti-brand-whatsapp` adelante, padding `12px 22px` | El ancho 100% se leía como barra, no como CTA. |
| Títulos de sección dentro de paneles | Texto plano centrado, sin guiones laterales (eliminar `— Especificaciones técnicas —` que tenían los borradores anteriores) | Decisión del usuario. Aplica a TODOS los paneles. |
| Footer | Mantiene el gradient rojo actual con "Rapa Imports" abajo | Funciona, no se toca. |

---

## 3. Estructura visual completa

Orden vertical de la pieza, de arriba abajo:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (siempre visible)                                    │
│   · franja roja horizontal corta · centrada                 │
│   · eyebrow rojo · centrado                                 │
│   · título grande uppercase · centrado                      │
├─────────────────────────────────────────────────────────────┤
│ STATS BAR (siempre visible)                                 │
│   grid 4 cols (4 datos · 1 fila) en ≥600px                  │
│   grid 2 cols (4 datos · 2 filas) en <600px                 │
├─────────────────────────────────────────────────────────────┤
│ NAV SEGMENTED CONTROL (siempre visible)                     │
│   5 segmentos: Resumen · Specs · Compatibilidad ·           │
│                Instalación · Kit                            │
│   En mobile: tabs abreviados (Resumen · Specs · Auto ·      │
│                                Pasos · Kit)                 │
├─────────────────────────────────────────────────────────────┤
│ PANEL ACTIVO (uno por vez según pestaña)                    │
│   ──────────────────────────────────────                    │
│   · Resumen: caja con borde rojo izq + texto descriptivo    │
│   · Specs: tabla key-value (6 filas)                        │
│   · Compatibilidad: pills de modelos + caja verde con CTA   │
│                     WhatsApp auto-width                     │
│   · Instalación: 4 cards "PASO N — etiqueta" + caja         │
│                  Recomendación al final                     │
│   · Kit: pills (neutros + verdes para "incluidos")          │
├─────────────────────────────────────────────────────────────┤
│ FOOTER (siempre visible)                                    │
│   gradient rojo · CTA emocional + "Rapa Imports"            │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Header

- `text-align: center` en todo el bloque.
- Franja roja: `width: 44px; height: 3px; background: #d91a1a; border-radius: 2px; margin: 0 auto 16px`.
- Eyebrow: `font-size: 10px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700`. Color rojo (ver paletas).
- Título: `font-size: 26px` desktop / `20px` mobile; `font-weight: 800; text-transform: uppercase; letter-spacing: -0.8px; line-height: 1.05`.
- En mobile: la franja se reduce a 36px, el margin inferior baja a 12px, el padding lateral baja a 16px.

### 3.2 Stats bar

- 4 columnas iguales en desktop, separadas por borde vertical de 1px.
- Cada celda: label uppercase chico arriba + valor en peso 700 abajo, todo centrado.
- En mobile (`max-width: 600px`): `grid-template-columns: 1fr 1fr`, las 4 celdas pasan a 2×2; bordes verticales solo entre las columnas, bordes horizontales solo entre las filas.
- Los datos son configurables por producto. Para el piloto: Material / Acabado / Kit / Compatibilidad.

### 3.3 Nav segmented control

- Una sola pieza: `display: flex; border: 1px solid #2a2a2a; background: #111; border-radius: 10px; overflow: hidden` (DARK).
- Cada segmento `flex: 1` con divisor `border-right` (excepto el último).
- Activo: fondo rojo `#d91a1a`, texto blanco.
- Inactivo: texto gris (`#9a9a9a` DARK / `#666` LIGHT).
- En mobile el padding se reduce y el label corto pasa a abreviatura (ver mapa abajo).
- Convención `data-rapa-tab` (botón) / `data-rapa-panel` (sección) — se mantiene del JS existente.

**Mapa de labels desktop → mobile**

| Desktop | Mobile |
|---|---|
| Resumen | Resumen |
| Specs | Specs |
| Compatibilidad | Auto |
| Instalación | Pasos |
| Kit | Kit |

(La abreviatura se aplica con `@media (max-width: 600px)` o, dado que va embebido sin CSS externo, con clases `.label-desktop` / `.label-mobile` que toggle vía media query inline.)

### 3.4 Paneles

Cada panel arranca con un **título centrado** en rojo (color del eyebrow), uppercase, `letter-spacing: 3px`, **sin guiones laterales**.

**Resumen**

```
[ rojo izquierdo border ▌ texto descriptivo ]
```

Caja `#121212` (DARK) con `border-left: 3px solid #d91a1a` y `border-radius: 0 10px 10px 0`.

**Specs**

Tabla key-value 2 columnas, 6 filas (Tipo, Material, Color, Referencia OEM, Fijación, Instalación). En mobile: la celda key sigue siendo 38% y la value 62%, los font-size bajan 1px.

**Compatibilidad**

- Bloque 1: pills de modelos (`display: inline-block; border-radius: 999px; padding: 8px 12px`), centrados.
- Bloque 2: caja verde de WhatsApp con `text-align: center`, texto consultivo arriba, botón auto-width con ícono abajo.

Botón:
```
display: inline-flex
align-items: center
gap: 8px
padding: 12px 22px
border-radius: 8px
background: #25D366
color: #fff
ícono: <i class="ti ti-brand-whatsapp" style="font-size: 16px"></i>
texto: CONSULTAR POR WHATSAPP
```

**Instalación**

4 cards apiladas, cada una con:
- Header: fondo `#1a1a1a` (DARK) + `"PASO N"` en rojo, `font-weight: 800` + `" — etiqueta"` en gris chico.
- Body: párrafo del paso con `line-height: 1.7`.

Al final, caja "Recomendación" con ícono Tabler `ti-tool`, label uppercase + texto.

**Kit**

Pills `inline-block` centradas, dos tipos:
- Neutros: borde `#262626`, texto `#f0f0f0`.
- Incluidos (con `✓`): borde verde `#1a3a1a`, texto verde claro `#aaffaa`.

### 3.5 Footer

Sin cambios respecto al actual. Mantener:
- `background: linear-gradient(90deg,#d91a1a 0%,#b51212 100%)`.
- CTA emocional en `<br>` dos líneas, `font-size: 20px desktop / 16px mobile`.
- "Rapa Imports" abajo, `letter-spacing: 4px`.

---

## 4. Paletas exactas

### 4.1 DARK

| Rol | Hex |
|---|---|
| Wrap bg | `#0b0b0b` |
| Header bg (gradient) | `#161616 → #0b0b0b` |
| Stats bar bg | `#0d0d0d` |
| Cards bg | `#141414` |
| Card header bg | `#1a1a1a` |
| Borders | `#1f1f1f` (hairlines) · `#252525` (cards) · `#2a2a2a` (segmented) |
| Texto primario | `#f0f0f0` |
| Texto cuerpo | `#a8a8a8` |
| Texto muted | `#7a7a7a` |
| Texto label small | `#6a6a6a` |
| Rojo identidad | `#d91a1a` |
| Eyebrow rojo claro | `#ff5252` |
| Amarillo recomendación | `#ffc107` (fondo `rgba(255,193,7,0.05)`, borde `rgba(255,193,7,0.22)`) |
| Verde WhatsApp | `#25D366` |
| Verde "incluido" texto | `#aaffaa` (borde `#1a3a1a`) |

### 4.2 LIGHT

| Rol | Hex |
|---|---|
| Wrap bg | `#ffffff` |
| Header bg (gradient) | `#fafafa → #ffffff` |
| Stats bar bg | `#fafafa` |
| Cards bg | `#fafafa` |
| Card header bg | `#f5f5f5` |
| Borders | `#ececec` (hairlines) · `#e6e6e6` (cards) · `#dcdcdc` (segmented) |
| Texto primario | `#222222` |
| Texto cuerpo | `#444444` |
| Texto muted | `#888888` |
| Texto label small | `#777777` |
| Rojo identidad | `#d91a1a` (sin cambio) |
| Eyebrow rojo | `#d91a1a` (mismo que identidad, sin el tono claro) |
| **Naranja recomendación** | **texto `#ea580c` · fondo `#fff7ed` · borde `#fdba74`** |
| Verde WhatsApp | `#25D366` (sin cambio) |
| Verde "incluido" texto | `#1f7a1f` (borde `#bfe3bf`, fondo `#eaf7ea`) |

El footer rojo es **idéntico en DARK y LIGHT** (el gradient siempre va con texto blanco).

---

## 5. Reglas responsive

Breakpoint principal: **600px** (cambio desktop → mobile).

Cambios aplicados al cruzar el breakpoint:

| Propiedad | Desktop | Mobile |
|---|---|---|
| Padding lateral wrap | 22px | 16px |
| Padding header | `30px 22px 24px` | `24px 16px 20px` |
| Font-size título | 26px | 20px |
| Franja roja width | 44px | 36px |
| Stats bar columnas | 4 | 2 (2×2) |
| Padding stats celda | `14px 12px` | `12px 10px` |
| Segmented padding tab | `12px 6px` | `10px 2px` |
| Segmented label | completo | abreviado (mapa §3.3) |
| Segmented `letter-spacing` | 1px | 0.5px |
| Padding paneles | `24px 22px` | `20px 16px` |

Todo el sistema es **fluid** — usa `flex` y `grid` con `1fr` para que no haya widths fijos. No hay `min-width` que rompa el wrap.

---

## 6. Reglas y convenciones del template (generalizables)

Para usar este template con un nuevo producto, lo único que se reemplaza es **contenido**, no estilo:

1. **Header**: texto del eyebrow, título.
2. **Stats bar**: los 4 pares label/valor (siempre 4, abreviar valores a 1–2 palabras).
3. **Paneles**:
   - Resumen → 1 párrafo (2–4 líneas).
   - Specs → 4–8 filas key/value.
   - Compatibilidad → N pills + caja WhatsApp (texto consultivo configurable).
   - Instalación → N pasos `PASO 1 — Etiqueta corta` + recomendación.
   - Kit → N pills (neutros + verdes para "incluidos").
4. **Footer**: CTA emocional en 2 líneas + "Rapa Imports".

**Reglas constantes (no cambian entre productos):**

- Eyebrow plano sin pill.
- Franja horizontal roja corta arriba del eyebrow.
- Todo el header centrado.
- Stats bar siempre 4 columnas (si hay menos datos, dejar la 4ta vacía o consolidar).
- Títulos de sección **sin guiones laterales**.
- Pasos numerados con números enteros (`PASO 1`, no `PASO 01`).
- Botón WhatsApp **siempre auto-width centrado** con ícono Tabler.

**Lo que NO se hace en este template:**

- No usar emojis decorativos en pills, headers ni labels (el icono Tabler `ti-tool` en Recomendación es la única excepción, junto con `ti-brand-whatsapp` en el CTA).
- No mezclar paletas: o DARK puro o LIGHT puro.
- No agregar shadows, blurs, glass effects.
- No usar `width: 100%` en botones internos (todos los CTAs son auto-width centrados).

---

## 7. Sistema de pestañas (JS)

Se mantiene la convención existente de los archivos `producto-carcasas-golf-{DARK,LIGHT}.html`:

- Wrapper raíz tiene clase `.rapa-tabs-wrap`.
- Cada botón de tab: `<button data-rapa-tab="ID">`.
- Cada panel: `<div data-rapa-panel="ID">`.
- Un `<script>` IIFE al final que:
  1. Lee `[data-rapa-tab]` y `[data-rapa-panel]` dentro de cada `.rapa-tabs-wrap`.
  2. Setea handler `click` en cada tab que muestra el panel asociado y reestila los botones.
  3. Activa por default la primera tab al cargar.

No cambia respecto a los archivos actuales; lo que cambia son los **estilos aplicados** al estado activo/inactivo (que ahora reflejan el segmented control en lugar de los botones sueltos).

El script de WhatsApp (`buildWALink` sobre `.wa-btn`) se mantiene idéntico al actual — sigue leyendo `og:title` y `link[rel=canonical]` para armar el `wa.me`.

---

## 8. Lo que NO cubre este spec (out of scope)

- **No modifica `script.js` ni `style.css`**. El template es HTML inline auto-contenido que se pega en la descripción de Tiendanube. El JS interno del tab switching es inline al final del bloque (igual que hoy).
- **No cambia los templates base** `Default-structure/encargo.html` ni `stock.html`. Esos son para productos sin pestañas. El nuevo template es una opción adicional.
- **No define el flujo de generación de nuevos productos** desde este template. Eso es trabajo de la fase de implementación + plan futuro.
- **No incluye el HTML final**. Esa es la fase siguiente (writing-plans).
- **No interactúa con la convención `stock = 9999`** (producto por encargo) ni con `body.producto-encargo`. El template es agnóstico al modo de venta.

---

## 9. Entregables de la fase de implementación

1. `Default-structure/producto-carcasas-golf-DARK.html` — reemplazado por el nuevo HTML.
2. `Default-structure/producto-carcasas-golf-LIGHT.html` — reemplazado por el nuevo HTML.
3. Commit que documente: "Rediseño del template de producto con pestañas (segmented control + header centrado)".

No hay pruebas automatizadas (el proyecto no tiene tests). La verificación se hace pegando ambos archivos en una descripción de prueba de Tiendanube y abriendo el producto en desktop y mobile.
