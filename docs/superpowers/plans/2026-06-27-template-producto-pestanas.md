# Template de producto con pestañas — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar los dos archivos `Default-structure/producto-carcasas-golf-{DARK,LIGHT}.html` con la versión rediseñada (segmented control + header centrado con franja roja horizontal + stats bar + paneles sin guiones laterales + botón WhatsApp auto-width + LIGHT con naranja medio en Recomendación).

**Architecture:** HTML auto-contenido para pegar en la descripción de Tiendanube. Estilos inline en cada elemento + un `<style>` chico al final del bloque para el media query responsive (única forma de aplicar `@media` en HTML inline). Dos `<script>` IIFE: uno reescribe los links de WhatsApp leyendo `og:title`/`canonical`; otro maneja la lógica de pestañas con `data-rapa-tab` / `data-rapa-panel`.

**Tech Stack:** HTML5 + CSS inline + JS vanilla. Ícono WhatsApp = SVG inline (no se puede asumir Tabler en el front de Tiendanube). Breakpoint responsive: 600px.

**Spec de referencia:** [`docs/superpowers/specs/2026-06-27-template-producto-pestanas-design.md`](../specs/2026-06-27-template-producto-pestanas-design.md)

**Verificación visual:** todo el trabajo se valida abriendo el archivo en navegador local (doble click sobre el `.html` o `file:///` URL). No hay tests automatizados en este repo. Cada task incluye qué mirar después de aplicar los cambios.

---

## Mapa de archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `Default-structure/producto-carcasas-golf-DARK.html` | Reemplazo completo (overwrite) | Template DARK del producto carcasas, listo para pegar en Tiendanube |
| `Default-structure/producto-carcasas-golf-LIGHT.html` | Reemplazo completo (overwrite) | Template LIGHT (mismo HTML, paleta cambiada) |

Trabajamos primero el DARK al 100% (Tasks 1–8) y después la versión LIGHT se genera transformando la paleta del DARK (Task 9). No se tocan `script.js`, `style.css`, `encargo.html`, `stock.html`.

---

## Convenciones que se mantienen en ambos archivos

- **Wrapper:** `<div class="rapa-tabs-wrap" style="...">…</div>`
- **Pestañas:** `<button data-rapa-tab="ID">`
- **Paneles:** `<div data-rapa-panel="ID">`
- **WhatsApp:** `<a class="wa-btn">` (el script reescribe el `href` con `og:title` + `canonical`)
- **Número WhatsApp:** `5492364626266`
- **Saludo WhatsApp:** `"Hola Rapa Imports, vengo desde la tienda online y tenía una consulta sobre este producto"`

---

## Task 1: Crear shell DARK (header + stats bar + nav + footer + scripts)

**Files:**
- Create/overwrite: `Default-structure/producto-carcasas-golf-DARK.html`

Reemplazamos el archivo completo de una. Los paneles se llenan en tasks siguientes.

- [ ] **Step 1: Escribir el archivo completo con shell vacío (paneles como placeholders comentados)**

Sobreescribir `Default-structure/producto-carcasas-golf-DARK.html` con el contenido siguiente exactamente:

```html
<!-- ===========================================================
     RAPA IMPORTS · Descripción de producto con pestañas
     Versión: FONDO OSCURO (DARK)
     Producto: Carcasas de Espejos Retrovisores (VW Golf)
     Pegar tal cual en Tiendanube → Descripción del producto.
     =========================================================== -->

<!-- Script WhatsApp (arma el link wa.me desde los meta de la página) -->
<script>
  var WA_NUMERO  = "5492364626266";
  var WA_SALUDO  = "Hola Rapa Imports, vengo desde la tienda online y tenía una consulta sobre este producto";
  function buildWALink() {
    var nombre = (document.querySelector('meta[property="og:title"]')  || {}).content
              || document.title || "este producto";
    var url    = (document.querySelector('link[rel="canonical"]')      || {}).href
              || (document.querySelector('meta[property="og:url"]')    || {}).content
              || window.location.href;
    var texto  = WA_SALUDO + ": " + nombre + " - " + url;
    var href   = "https://wa.me/" + WA_NUMERO + "?text=" + encodeURIComponent(texto);
    document.querySelectorAll(".wa-btn").forEach(function (btn) { btn.href = href; });
  }
  document.addEventListener("DOMContentLoaded", buildWALink);
</script>

<div class="rapa-tabs-wrap" style="max-width:860px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:#0b0b0b;color:#f5f5f5;border-radius:14px;overflow:hidden;border:1px solid #1e1e1e;width:100%;box-sizing:border-box;">

  <!-- ================= HEADER (siempre visible) ================= -->
  <div class="rapa-header" style="background:linear-gradient(180deg,#161616 0%,#0b0b0b 100%);padding:30px 22px 24px;text-align:center;box-sizing:border-box;">
    <div class="rapa-bar" style="width:44px;height:3px;background:#d91a1a;margin:0 auto 16px;border-radius:2px;"></div>
    <div class="rapa-eyebrow" style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ff5252;font-weight:bold;margin-bottom:12px;line-height:1.4;">Accesorios Tuning de primera línea</div>
    <div class="rapa-title" style="font-size:26px;font-weight:800;color:#ffffff;text-transform:uppercase;letter-spacing:-0.8px;line-height:1.05;word-break:break-word;">Carcasas de Espejos Retrovisores</div>
  </div>

  <!-- ================= STATS BAR (siempre visible) ================= -->
  <div class="rapa-stats" style="display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #1f1f1f;background:#0d0d0d;">
    <div class="rapa-stat" style="padding:14px 12px;border-right:1px solid #1f1f1f;text-align:center;box-sizing:border-box;">
      <div style="font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#6a6a6a;font-weight:bold;margin-bottom:5px;">Material</div>
      <div style="font-size:12px;color:#f0f0f0;font-weight:bold;">ABS</div>
    </div>
    <div class="rapa-stat" style="padding:14px 12px;border-right:1px solid #1f1f1f;text-align:center;box-sizing:border-box;">
      <div style="font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#6a6a6a;font-weight:bold;margin-bottom:5px;">Acabado</div>
      <div style="font-size:12px;color:#f0f0f0;font-weight:bold;">Carbono</div>
    </div>
    <div class="rapa-stat" style="padding:14px 12px;border-right:1px solid #1f1f1f;text-align:center;box-sizing:border-box;">
      <div style="font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#6a6a6a;font-weight:bold;margin-bottom:5px;">Kit</div>
      <div style="font-size:12px;color:#f0f0f0;font-weight:bold;">Par I + D</div>
    </div>
    <div class="rapa-stat" style="padding:14px 12px;text-align:center;box-sizing:border-box;">
      <div style="font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:#6a6a6a;font-weight:bold;margin-bottom:5px;">Compat.</div>
      <div style="font-size:12px;color:#f0f0f0;font-weight:bold;">MK6/7/7.5</div>
    </div>
  </div>

  <!-- ================= NAV SEGMENTED CONTROL ================= -->
  <div class="rapa-nav-wrap" style="padding:14px;background:#0b0b0b;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div class="rapa-nav" style="display:flex;border:1px solid #2a2a2a;background:#111111;border-radius:10px;overflow:hidden;">
      <button type="button" data-rapa-tab="resumen"    style="flex:1 1 0;min-width:0;cursor:pointer;font-family:inherit;padding:12px 6px;border:0;border-right:1px solid #2a2a2a;background:transparent;color:#9a9a9a;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;transition:background .15s,color .15s;"><span class="lbl-d">Resumen</span><span class="lbl-m" style="display:none;">Resumen</span></button>
      <button type="button" data-rapa-tab="specs"       style="flex:1 1 0;min-width:0;cursor:pointer;font-family:inherit;padding:12px 6px;border:0;border-right:1px solid #2a2a2a;background:transparent;color:#9a9a9a;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;transition:background .15s,color .15s;"><span class="lbl-d">Specs</span><span class="lbl-m" style="display:none;">Specs</span></button>
      <button type="button" data-rapa-tab="compat"      style="flex:1 1 0;min-width:0;cursor:pointer;font-family:inherit;padding:12px 6px;border:0;border-right:1px solid #2a2a2a;background:transparent;color:#9a9a9a;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;transition:background .15s,color .15s;"><span class="lbl-d">Compatibilidad</span><span class="lbl-m" style="display:none;">Auto</span></button>
      <button type="button" data-rapa-tab="instalacion" style="flex:1 1 0;min-width:0;cursor:pointer;font-family:inherit;padding:12px 6px;border:0;border-right:1px solid #2a2a2a;background:transparent;color:#9a9a9a;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;transition:background .15s,color .15s;"><span class="lbl-d">Instalación</span><span class="lbl-m" style="display:none;">Pasos</span></button>
      <button type="button" data-rapa-tab="kit"         style="flex:1 1 0;min-width:0;cursor:pointer;font-family:inherit;padding:12px 6px;border:0;background:transparent;color:#9a9a9a;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;transition:background .15s,color .15s;"><span class="lbl-d">Kit</span><span class="lbl-m" style="display:none;">Kit</span></button>
    </div>
  </div>

  <!-- ================= PANELES (se completan en tasks siguientes) ================= -->
  <!-- PANEL: RESUMEN -->
  <!-- PANEL: SPECS -->
  <!-- PANEL: COMPAT -->
  <!-- PANEL: INSTALACION -->
  <!-- PANEL: KIT -->

  <!-- ================= FOOTER (siempre visible) ================= -->
  <div class="rapa-footer" style="background:linear-gradient(90deg,#d91a1a 0%,#b51212 100%);padding:28px 22px;text-align:center;box-sizing:border-box;">
    <div style="font-size:22px;font-weight:800;text-transform:uppercase;color:#ffffff;line-height:1.2;letter-spacing:-0.5px;margin-bottom:10px;">Dale a tu Golf<br />el detalle que merece.</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:4px;font-weight:bold;line-height:1.6;">Rapa Imports</div>
  </div>

</div>

<!-- ================= RESPONSIVE (se completa en Task 8) ================= -->
<!-- @media (max-width:600px) goes here -->

<!-- ================= LÓGICA DE PESTAÑAS ================= -->
<script>
(function () {
  var ACT_BG = "#d91a1a", ACT_TX = "#ffffff";
  var OFF_TX = "#9a9a9a";
  function initRapaTabs(wrap) {
    var btns   = wrap.querySelectorAll("[data-rapa-tab]");
    var panels = wrap.querySelectorAll("[data-rapa-panel]");
    function show(id) {
      panels.forEach(function (p) {
        p.style.display = (p.getAttribute("data-rapa-panel") === id) ? "block" : "none";
      });
      btns.forEach(function (b) {
        var on = b.getAttribute("data-rapa-tab") === id;
        b.style.background = on ? ACT_BG : "transparent";
        b.style.color      = on ? ACT_TX : OFF_TX;
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-rapa-tab")); });
    });
    if (btns.length) show(btns[0].getAttribute("data-rapa-tab"));
  }
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".rapa-tabs-wrap").forEach(initRapaTabs);
  });
})();
</script>
```

- [ ] **Step 2: Verificar visualmente el shell**

Abrir el archivo en el navegador (doble click sobre `Default-structure/producto-carcasas-golf-DARK.html` o cargar `file:///C:/Users/PC/Desktop/rapaimports-tiendanube/Default-structure/producto-carcasas-golf-DARK.html`).

Esperado:
- Fondo negro `#0b0b0b`, wrapper con borde sutil y esquinas redondeadas.
- Header centrado: franja roja chiquita arriba, "Accesorios Tuning de primera línea" en rojo claro, "Carcasas de Espejos Retrovisores" en blanco grande uppercase.
- Stats bar con 4 columnas (Material/Acabado/Kit/Compat.) separadas por hairlines verticales.
- Segmented control con 5 tabs en una sola pieza con divisores. El primero ("Resumen") está activo en rojo y blanco. Los demás en gris sobre transparente.
- **No hay paneles visibles todavía** (es esperado — los agregamos en las próximas tasks).
- Footer rojo con CTA y "Rapa Imports".
- Click en cada tab cambia el fondo rojo al tab clickeado (la lógica funciona aunque los paneles estén vacíos).

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): shell DARK con header centrado, stats bar y segmented control"
```

---

## Task 2: Panel Resumen

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar el comentario `<!-- PANEL: RESUMEN -->`)

- [ ] **Step 1: Reemplazar el placeholder del panel Resumen con el HTML real**

En el archivo, buscar la línea `  <!-- PANEL: RESUMEN -->` y reemplazarla por:

```html
  <!-- ================= PANEL: RESUMEN ================= -->
  <div data-rapa-panel="resumen" style="padding:24px 22px;background:#0b0b0b;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div style="font-size:10px;color:#ff5252;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin-bottom:14px;text-align:center;">Resumen</div>
    <div style="background:#121212;border:1px solid #242424;border-left:3px solid #d91a1a;border-radius:0 10px 10px 0;padding:18px 20px;box-sizing:border-box;">
      <p style="margin:0;color:#c2c2c2;font-size:14px;line-height:1.85;">Un upgrade exterior simple, efectivo y de alto impacto visual. Estas carcasas reemplazan las cubiertas originales de los espejos retrovisores laterales de tu Golf con un acabado símil fibra de carbono. Instalación directa en minutos, sin herramientas adicionales y sin perforar ni cortar nada.</p>
    </div>
  </div>
```

- [ ] **Step 2: Verificar visualmente**

Recargar el archivo en el navegador.

Esperado:
- Panel "Resumen" visible debajo del segmented control (porque es el panel default).
- Título "Resumen" centrado en rojo claro arriba del bloque.
- Caja con borde rojo izquierdo (3px) + texto descriptivo del producto.
- La caja tiene esquinas redondeadas solo a la derecha (porque el borde rojo izquierdo no permite redondeo a la izquierda).
- Click en otras tabs oculta este panel (porque solo "Resumen" tiene contenido todavía — las demás van en las próximas tasks).

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): panel Resumen con caja borde rojo izquierdo"
```

---

## Task 3: Panel Specs (tabla key-value)

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar `<!-- PANEL: SPECS -->`)

- [ ] **Step 1: Reemplazar el placeholder del panel Specs con la tabla**

Buscar `  <!-- PANEL: SPECS -->` y reemplazar por:

```html
  <!-- ================= PANEL: SPECS ================= -->
  <div data-rapa-panel="specs" style="padding:24px 22px;background:#0d0d0d;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div style="font-size:10px;color:#ff5252;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin-bottom:14px;text-align:center;">Especificaciones técnicas</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tbody>
        <tr>
          <td style="padding:12px;width:38%;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Tipo</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;word-break:break-word;">Carcasas / cachas para espejos retrovisores laterales</td>
        </tr>
        <tr>
          <td style="padding:12px;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Material</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;">ABS de alta resistencia</td>
        </tr>
        <tr>
          <td style="padding:12px;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Color</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;">Símil fibra de carbono</td>
        </tr>
        <tr>
          <td style="padding:12px;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Referencia OEM</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;">5K0 857 537 / 5K0 857 538</td>
        </tr>
        <tr>
          <td style="padding:12px;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Fijación</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;">Cinta 3M</td>
        </tr>
        <tr>
          <td style="padding:12px;background:#141414;border:1px solid #252525;color:#7d7d7d;text-transform:uppercase;font-size:10px;letter-spacing:1px;font-weight:bold;vertical-align:top;line-height:1.5;">Instalación</td>
          <td style="padding:12px;background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px;line-height:1.7;">Reemplazo directo, sin modificaciones</td>
        </tr>
      </tbody>
    </table>
  </div>
```

- [ ] **Step 2: Verificar visualmente**

Recargar. Click en tab "Specs".

Esperado:
- Aparece el panel Specs en lugar de Resumen.
- Título "Especificaciones técnicas" centrado en rojo claro arriba, **sin guiones laterales**.
- Tabla de 6 filas, columna izquierda 38% con labels uppercase chicos en gris sobre fondo `#141414`, columna derecha con valores en blanco sobre fondo `#101010`.
- Hairlines `#252525` entre celdas.
- Click en "Resumen" vuelve al panel anterior.

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): panel Specs con tabla key-value clásica"
```

---

## Task 4: Panel Compatibilidad (pills + CTA WhatsApp auto-width)

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar `<!-- PANEL: COMPAT -->`)

- [ ] **Step 1: Reemplazar el placeholder por el HTML del panel**

Buscar `  <!-- PANEL: COMPAT -->` y reemplazar por:

```html
  <!-- ================= PANEL: COMPATIBILIDAD ================= -->
  <div data-rapa-panel="compat" style="padding:24px 22px;background:#0b0b0b;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div style="font-size:10px;color:#ff5252;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin-bottom:14px;text-align:center;">Modelos compatibles</div>
    <div style="line-height:2.4;margin-bottom:18px;text-align:center;">
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">VW Golf MK6 GTI</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">VW Golf MK7 GTI</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">VW Golf MK7 TSI</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">VW Golf MK7.5 GTI</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">VW Golf MK7.5 TSI</span>
    </div>
    <div style="background:rgba(37,211,102,0.06);border:1px solid rgba(37,211,102,0.18);border-radius:10px;padding:18px 16px;text-align:center;box-sizing:border-box;">
      <div style="color:#b0b0b0;font-size:13px;line-height:1.7;margin-bottom:14px;">¿Tenés dudas sobre la compatibilidad con tu Golf? Consultanos directamente por WhatsApp antes de comprar.</div>
      <a class="wa-btn" href="#" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:#ffffff;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:12px 22px;border-radius:8px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.78 11.78 0 0 0 12.06 0C5.5 0 .15 5.34.15 11.91c0 2.1.55 4.15 1.6 5.96L0 24l6.31-1.65a11.9 11.9 0 0 0 5.75 1.47h.01c6.56 0 11.91-5.34 11.91-11.91 0-3.18-1.24-6.17-3.46-8.43zM12.06 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.23-.37a9.85 9.85 0 0 1-1.51-5.25c0-5.45 4.44-9.88 9.88-9.88 2.64 0 5.12 1.03 6.98 2.9a9.81 9.81 0 0 1 2.89 6.99c.01 5.44-4.43 9.87-9.87 9.87zm5.42-7.4c-.3-.15-1.76-.87-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.39-1.47a8.94 8.94 0 0 1-1.65-2.06c-.17-.3-.02-.46.13-.61.13-.13.3-.34.45-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/></svg>
        Consultar por WhatsApp
      </a>
    </div>
  </div>
```

- [ ] **Step 2: Verificar visualmente y funcionalmente**

Recargar. Click en tab "Compatibilidad".

Esperado:
- Título "Modelos compatibles" centrado en rojo claro (sin guiones).
- 5 pills de modelos centradas, con borde sutil y fondo oscuro.
- Caja verde tenue con borde verde tenue, texto consultivo centrado.
- Botón "Consultar por WhatsApp" con ícono SVG de WhatsApp adelante, **ancho ajustado al contenido** (no 100%), centrado horizontalmente, fondo verde `#25D366`.
- Hacer click derecho → "Inspeccionar" el botón: el `href` se reemplazó por algo tipo `https://wa.me/5492364626266?text=...` (el script `buildWALink` lo procesó). El texto del WhatsApp va a salir con el nombre del producto (en local, va a usar `document.title`).

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): panel Compatibilidad con CTA WhatsApp auto-width e ícono SVG"
```

---

## Task 5: Panel Instalación (4 pasos + recomendación)

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar `<!-- PANEL: INSTALACION -->`)

- [ ] **Step 1: Reemplazar el placeholder por el HTML del panel**

Buscar `  <!-- PANEL: INSTALACION -->` y reemplazar por:

```html
  <!-- ================= PANEL: INSTALACIÓN ================= -->
  <div data-rapa-panel="instalacion" style="padding:24px 22px;background:#0b0b0b;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div style="font-size:10px;color:#ff5252;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin-bottom:14px;text-align:center;">Paso a paso</div>

    <div style="background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:10px;overflow:hidden;">
      <div style="background:#1a1a1a;padding:9px 14px;border-bottom:1px solid #252525;">
        <span style="color:#d91a1a;font-size:13px;font-weight:800;letter-spacing:1px;">PASO 1</span>
        <span style="color:#5a5a5a;font-size:10px;letter-spacing:1px;margin-left:6px;">— Acceso a los clips</span>
      </div>
      <div style="padding:13px 14px;font-size:13px;color:#a8a8a8;line-height:1.7;">Con el espejo plegado, buscá la línea de unión entre la carcasa original y el cuerpo del espejo. Usá una espátula plástica o los dedos para hacer palanca suavemente y liberar los clips de fijación.</div>
    </div>

    <div style="background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:10px;overflow:hidden;">
      <div style="background:#1a1a1a;padding:9px 14px;border-bottom:1px solid #252525;">
        <span style="color:#d91a1a;font-size:13px;font-weight:800;letter-spacing:1px;">PASO 2</span>
        <span style="color:#5a5a5a;font-size:10px;letter-spacing:1px;margin-left:6px;">— Retirado</span>
      </div>
      <div style="padding:13px 14px;font-size:13px;color:#a8a8a8;line-height:1.7;">Retirá la carcasa original con cuidado, sin forzar. En caso de resistencia, trabajá los clips de a uno para evitar romper el plástico del espejo.</div>
    </div>

    <div style="background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:10px;overflow:hidden;">
      <div style="background:#1a1a1a;padding:9px 14px;border-bottom:1px solid #252525;">
        <span style="color:#d91a1a;font-size:13px;font-weight:800;letter-spacing:1px;">PASO 3</span>
        <span style="color:#5a5a5a;font-size:10px;letter-spacing:1px;margin-left:6px;">— Colocación</span>
      </div>
      <div style="padding:13px 14px;font-size:13px;color:#a8a8a8;line-height:1.7;">Posicioná la nueva carcasa alineándola con los puntos de fijación originales y presioná firmemente hasta escuchar o sentir que los clips encajan en su lugar.</div>
    </div>

    <div style="background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:16px;overflow:hidden;">
      <div style="background:#1a1a1a;padding:9px 14px;border-bottom:1px solid #252525;">
        <span style="color:#d91a1a;font-size:13px;font-weight:800;letter-spacing:1px;">PASO 4</span>
        <span style="color:#5a5a5a;font-size:10px;letter-spacing:1px;margin-left:6px;">— Lado contrario</span>
      </div>
      <div style="padding:13px 14px;font-size:13px;color:#a8a8a8;line-height:1.7;">Repetí el proceso en el espejo del lado contrario. Verificá que ambas carcasas queden asentadas de manera uniforme y sin holguras.</div>
    </div>

    <div style="background:rgba(255,193,7,0.05);border:1px solid rgba(255,193,7,0.22);border-radius:10px;padding:14px 16px;box-sizing:border-box;">
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px;" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <div>
          <div style="font-size:10px;color:#ffc107;text-transform:uppercase;letter-spacing:2px;font-weight:bold;margin-bottom:6px;">Recomendación</div>
          <div style="font-size:13px;color:#b0b0b0;line-height:1.7;">La instalación es sencilla y puede hacerse en casa, pero si no tenés experiencia con plásticos de carrocería recomendamos llevar el vehículo a tu mecánico o taller de confianza para evitar romper los clips o dañar la carcasa del espejo original durante el desmontaje.</div>
        </div>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Verificar visualmente**

Recargar. Click en tab "Instalación".

Esperado:
- Título "Paso a paso" centrado en rojo (sin guiones).
- 4 cards apiladas verticalmente, cada una con:
  - Header `#1a1a1a` con `"PASO N"` en rojo `#d91a1a` + sub-etiqueta gris al lado (`— Acceso a los clips`, `— Retirado`, etc.).
  - Body con párrafo del paso en gris `#a8a8a8`.
- Al final, caja amarilla tenue de "Recomendación" con ícono herramienta SVG color `#ffc107` a la izquierda y texto a la derecha.
- Los números son `PASO 1`, `PASO 2`, `PASO 3`, `PASO 4` (sin ceros adelante).

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): panel Instalación con cards numeradas PASO N y recomendación amarilla"
```

---

## Task 6: Panel Kit

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar `<!-- PANEL: KIT -->`)

- [ ] **Step 1: Reemplazar el placeholder por el HTML del panel**

Buscar `  <!-- PANEL: KIT -->` y reemplazar por:

```html
  <!-- ================= PANEL: KIT ================= -->
  <div data-rapa-panel="kit" style="padding:24px 22px;background:#0d0d0d;border-top:1px solid #1b1b1b;box-sizing:border-box;">
    <div style="font-size:10px;color:#ff5252;text-transform:uppercase;letter-spacing:3px;font-weight:bold;margin-bottom:14px;text-align:center;">Contenido del kit</div>
    <div style="line-height:2.4;text-align:center;">
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">× 2 Carcasas ABS símil fibra de carbono</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0;font-size:11px;font-weight:bold;">Lado Izquierdo + Lado Derecho</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #1a3a1a;border-radius:999px;color:#aaffaa;font-size:11px;font-weight:bold;">✓ Clips de fijación originales</span>
      <span style="display:inline-block;margin:0 4px 6px;padding:8px 12px;background:#141414;border:1px solid #1a3a1a;border-radius:999px;color:#aaffaa;font-size:11px;font-weight:bold;">✓ Sin herramientas adicionales</span>
    </div>
  </div>
```

- [ ] **Step 2: Verificar visualmente**

Recargar. Click en tab "Kit".

Esperado:
- Título "Contenido del kit" centrado en rojo (sin guiones).
- 4 pills centradas en el contenedor:
  - 2 neutros (borde gris, texto blanco).
  - 2 verdes (`✓` al inicio, borde `#1a3a1a`, texto `#aaffaa`).
- Todas las pestañas alternan correctamente entre paneles cuando se clickea.

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): panel Kit con pills neutros e incluidos"
```

---

## Task 7: Responsive (media query mobile)

**Files:**
- Modify: `Default-structure/producto-carcasas-golf-DARK.html` (reemplazar `<!-- @media (max-width:600px) goes here -->`)

- [ ] **Step 1: Insertar el bloque `<style>` con el media query**

Buscar `<!-- @media (max-width:600px) goes here -->` y reemplazar por:

```html
<style>
@media (max-width: 600px) {
  .rapa-tabs-wrap .rapa-header { padding: 24px 16px 20px !important; }
  .rapa-tabs-wrap .rapa-bar    { width: 36px !important; margin-bottom: 12px !important; }
  .rapa-tabs-wrap .rapa-eyebrow{ font-size: 9px !important; letter-spacing: 2.5px !important; margin-bottom: 10px !important; }
  .rapa-tabs-wrap .rapa-title  { font-size: 20px !important; letter-spacing: -0.5px !important; }
  .rapa-tabs-wrap .rapa-stats  { grid-template-columns: 1fr 1fr !important; }
  .rapa-tabs-wrap .rapa-stat   { padding: 12px 10px !important; }
  .rapa-tabs-wrap .rapa-stat:nth-child(1) { border-right: 1px solid #1f1f1f !important; border-bottom: 1px solid #1f1f1f !important; }
  .rapa-tabs-wrap .rapa-stat:nth-child(2) { border-right: 0 !important;                   border-bottom: 1px solid #1f1f1f !important; }
  .rapa-tabs-wrap .rapa-stat:nth-child(3) { border-right: 1px solid #1f1f1f !important; border-bottom: 0 !important; }
  .rapa-tabs-wrap .rapa-stat:nth-child(4) { border-right: 0 !important;                   border-bottom: 0 !important; }
  .rapa-tabs-wrap .rapa-nav-wrap { padding: 10px !important; }
  .rapa-tabs-wrap .rapa-nav button { padding: 10px 2px !important; font-size: 9px !important; letter-spacing: 0.5px !important; }
  .rapa-tabs-wrap .rapa-nav .lbl-d { display: none !important; }
  .rapa-tabs-wrap .rapa-nav .lbl-m { display: inline !important; }
  .rapa-tabs-wrap [data-rapa-panel] { padding: 20px 16px !important; }
  .rapa-tabs-wrap .rapa-footer { padding: 22px 16px !important; }
  .rapa-tabs-wrap .rapa-footer > div:first-child { font-size: 18px !important; }
}
</style>
```

- [ ] **Step 2: Verificar responsive en navegador**

Abrir el archivo. Apretar F12 (DevTools), click en el ícono "Toggle device toolbar" (Ctrl+Shift+M). Seleccionar dimensiones `iPhone SE` (375×667) o forzar 360px de ancho.

Esperado a 360px:
- Header: padding lateral baja a 16px, título a 20px, franja a 36px.
- Stats bar: pasa a 2×2 grid (Material/Acabado arriba, Kit/Compat abajo). Borders se reorganizan: hairlines verticales solo entre cols 1 y 2 de cada fila, hairline horizontal entre las 2 filas.
- Segmented control: tabs ahora muestran "Resumen / Specs / Auto / Pasos / Kit" (los labels mobile).
- Paneles con padding lateral menor (16px) — el texto no se ahoga contra el borde.
- Footer con padding y font-size más chicos.

Recargar a desktop (>600px) y verificar que vuelve a los labels y layout completos.

- [ ] **Step 3: Commit**

```bash
git add Default-structure/producto-carcasas-golf-DARK.html
git commit -m "feat(template): media query mobile con stats 2x2, labels abreviados y paddings reducidos"
```

---

## Task 8: Verificación integral del DARK

**Files:** (sin cambios, solo verificación)

- [ ] **Step 1: Checklist visual completo del DARK**

Abrir el archivo en navegador, ancho desktop (>800px). Verificar:

- [ ] Header centrado: franja roja chiquita arriba, eyebrow rojo claro, título grande blanco uppercase.
- [ ] Stats bar 4 cols con divisores verticales.
- [ ] Segmented control con activo rojo, inactivos transparentes con texto gris.
- [ ] Click en cada tab muestra solo el panel correspondiente.
- [ ] **Resumen**: caja con borde rojo izquierdo + texto.
- [ ] **Specs**: tabla 6 filas, sin guiones laterales en el título.
- [ ] **Compatibilidad**: 5 pills + caja verde con CTA WhatsApp auto-width (ícono + texto).
- [ ] **Instalación**: 4 cards "PASO N" + caja recomendación amarilla con ícono herramienta.
- [ ] **Kit**: 4 pills (2 neutros, 2 verdes con ✓).
- [ ] Footer rojo con CTA "Dale a tu Golf el detalle que merece" + "Rapa Imports".

Bajar a 360px en DevTools y verificar todo el responsive (Task 7 Step 2).

Inspeccionar el botón WhatsApp y confirmar que `href` se actualizó a `https://wa.me/5492364626266?text=...`.

- [ ] **Step 2: No requiere commit (verificación)**

Si todo OK, pasar a Task 9. Si algo no cuadra, abrir un sub-task para arreglarlo antes de seguir.

---

## Task 9: Crear LIGHT como derivado del DARK

**Files:**
- Create/overwrite: `Default-structure/producto-carcasas-golf-LIGHT.html`

Estrategia: copiar el DARK terminado y aplicar las sustituciones de paleta. Se hacen como reemplazos de strings exactas (Find & Replace), no se reescribe a mano.

- [ ] **Step 1: Copiar el DARK como punto de partida**

Desde PowerShell/Bash:

```bash
cp Default-structure/producto-carcasas-golf-DARK.html Default-structure/producto-carcasas-golf-LIGHT.html
```

- [ ] **Step 2: Actualizar el header del archivo LIGHT**

Editar `Default-structure/producto-carcasas-golf-LIGHT.html`. Reemplazar las primeras 6 líneas (el comentario header):

De:
```html
<!-- ===========================================================
     RAPA IMPORTS · Descripción de producto con pestañas
     Versión: FONDO OSCURO (DARK)
     Producto: Carcasas de Espejos Retrovisores (VW Golf)
     Pegar tal cual en Tiendanube → Descripción del producto.
     =========================================================== -->
```

A:
```html
<!-- ===========================================================
     RAPA IMPORTS · Descripción de producto con pestañas
     Versión: FONDO BLANCO (LIGHT)
     Producto: Carcasas de Espejos Retrovisores (VW Golf)
     Pegar tal cual en Tiendanube → Descripción del producto.
     =========================================================== -->
```

- [ ] **Step 3: Aplicar las sustituciones de paleta (Find & Replace All)**

En el archivo LIGHT, aplicar cada uno de estos reemplazos en orden. Usar Find & Replace All del editor (no usar el editor del navegador).

**Wrap del wrapper:**
- Buscar: `background:#0b0b0b;color:#f5f5f5;border-radius:14px;overflow:hidden;border:1px solid #1e1e1e`
- Reemplazar: `background:#ffffff;color:#1a1a1a;border-radius:14px;overflow:hidden;border:1px solid #e6e6e6`

**Header bg (gradient):**
- Buscar: `background:linear-gradient(180deg,#161616 0%,#0b0b0b 100%)`
- Reemplazar: `background:linear-gradient(180deg,#fafafa 0%,#ffffff 100%)`

**Eyebrow:**
- Buscar todos: `color:#ff5252`
- Reemplazar todos: `color:#d91a1a`

**Título principal (color blanco):**
- Buscar: `color:#ffffff;text-transform:uppercase;letter-spacing:-0.8px`
- Reemplazar: `color:#0b0b0b;text-transform:uppercase;letter-spacing:-0.8px`

**Stats bar bg + borders:**
- Buscar todos: `border-top:1px solid #1f1f1f;background:#0d0d0d`
- Reemplazar todos: `border-top:1px solid #ececec;background:#fafafa`
- Buscar todos: `border-right:1px solid #1f1f1f`
- Reemplazar todos: `border-right:1px solid #ececec`

**Stats labels y valores:**
- Buscar todos: `color:#6a6a6a;font-weight:bold;margin-bottom:5px`
- Reemplazar todos: `color:#888888;font-weight:bold;margin-bottom:5px`
- Buscar todos: `color:#f0f0f0;font-weight:bold;">`
- Reemplazar todos: `color:#222222;font-weight:bold;">`

**Nav wrap bg + border-top:**
- Buscar: `background:#0b0b0b;border-top:1px solid #1b1b1b;box-sizing:border-box;"`
- Reemplazar (en todos los `padding:14px;` o `padding:24px 22px;`): manejar uno por uno. Hay varios — empezar por el del nav-wrap. Para distinguirlos, usar contexto del padding.

Como hay múltiples ocurrencias de `background:#0b0b0b;border-top:1px solid #1b1b1b`, aplicar Find & Replace All de manera más amplia:
- Buscar todos: `background:#0b0b0b;border-top:1px solid #1b1b1b`
- Reemplazar todos: `background:#ffffff;border-top:1px solid #ececec`

- Buscar todos: `background:#0d0d0d;border-top:1px solid #1b1b1b`
- Reemplazar todos: `background:#fafafa;border-top:1px solid #ececec`

**Segmented control:**
- Buscar: `border:1px solid #2a2a2a;background:#111111;border-radius:10px;overflow:hidden`
- Reemplazar: `border:1px solid #dcdcdc;background:#ffffff;border-radius:10px;overflow:hidden`
- Buscar todos: `border-right:1px solid #2a2a2a;background:transparent;color:#9a9a9a`
- Reemplazar todos: `border-right:1px solid #dcdcdc;background:transparent;color:#666666`
- Buscar: `border:0;background:transparent;color:#9a9a9a` (este es el último tab, sin border-right)
- Reemplazar: `border:0;background:transparent;color:#666666`

**Panel Resumen — caja con borde rojo izquierdo:**
- Buscar: `background:#121212;border:1px solid #242424;border-left:3px solid #d91a1a`
- Reemplazar: `background:#fafafa;border:1px solid #ececec;border-left:3px solid #d91a1a`
- Buscar: `color:#c2c2c2;font-size:14px;line-height:1.85`
- Reemplazar: `color:#444444;font-size:14px;line-height:1.85`

**Tabla Specs — celdas key/value:**
- Buscar todos: `background:#141414;border:1px solid #252525;color:#7d7d7d`
- Reemplazar todos: `background:#f5f5f5;border:1px solid #e6e6e6;color:#888888`
- Buscar todos: `background:#101010;border:1px solid #252525;color:#f0f0f0;font-size:12px`
- Reemplazar todos: `background:#ffffff;border:1px solid #e6e6e6;color:#222222;font-size:12px`

**Pills (compatibilidad y kit):**
- Buscar todos: `background:#141414;border:1px solid #262626;border-radius:999px;color:#f0f0f0`
- Reemplazar todos: `background:#f5f5f5;border:1px solid #e0e0e0;border-radius:999px;color:#222222`

**Pills "incluido" verdes:**
- Buscar todos: `background:#141414;border:1px solid #1a3a1a;border-radius:999px;color:#aaffaa`
- Reemplazar todos: `background:#eaf7ea;border:1px solid #bfe3bf;border-radius:999px;color:#1f7a1f`

**Caja WhatsApp consultivo (texto en la caja verde):**
- Buscar: `color:#b0b0b0;font-size:13px;line-height:1.7;margin-bottom:14px`
- Reemplazar: `color:#4a4a4a;font-size:13px;line-height:1.7;margin-bottom:14px`

**Instalación — cards de pasos:**
- Buscar todos: `background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:10px;overflow:hidden`
- Reemplazar todos: `background:#fafafa;border:1px solid #e6e6e6;border-radius:10px;margin-bottom:10px;overflow:hidden`
- Buscar: `background:#141414;border:1px solid #252525;border-radius:10px;margin-bottom:16px;overflow:hidden` (la última card)
- Reemplazar: `background:#fafafa;border:1px solid #e6e6e6;border-radius:10px;margin-bottom:16px;overflow:hidden`
- Buscar todos: `background:#1a1a1a;padding:9px 14px;border-bottom:1px solid #252525`
- Reemplazar todos: `background:#f0f0f0;padding:9px 14px;border-bottom:1px solid #e6e6e6`
- Buscar todos: `color:#5a5a5a;font-size:10px;letter-spacing:1px;margin-left:6px`
- Reemplazar todos: `color:#999999;font-size:10px;letter-spacing:1px;margin-left:6px`
- Buscar todos: `font-size:13px;color:#a8a8a8;line-height:1.7`
- Reemplazar todos: `font-size:13px;color:#444444;line-height:1.7`

**Recomendación (de amarillo → naranja medio):**
- Buscar: `background:rgba(255,193,7,0.05);border:1px solid rgba(255,193,7,0.22);border-radius:10px;padding:14px 16px;box-sizing:border-box;`
- Reemplazar: `background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px 16px;box-sizing:border-box;`
- Buscar (en el SVG): `stroke="#ffc107"`
- Reemplazar: `stroke="#ea580c"`
- Buscar: `font-size:10px;color:#ffc107;text-transform:uppercase;letter-spacing:2px;font-weight:bold;margin-bottom:6px`
- Reemplazar: `font-size:10px;color:#ea580c;text-transform:uppercase;letter-spacing:2px;font-weight:bold;margin-bottom:6px`
- Buscar: `font-size:13px;color:#b0b0b0;line-height:1.7` (la línea del texto descriptivo de la recomendación)
- Reemplazar: `font-size:13px;color:#555555;line-height:1.7`

**Media query — borders de la stats bar:**
- Buscar todos: `border-right: 1px solid #1f1f1f !important;`
- Reemplazar todos: `border-right: 1px solid #ececec !important;`
- Buscar todos: `border-bottom: 1px solid #1f1f1f !important;`
- Reemplazar todos: `border-bottom: 1px solid #ececec !important;`

(El footer NO se cambia — se queda con el gradient rojo idéntico, eso es por diseño.)

- [ ] **Step 4: Verificar el LIGHT en navegador**

Abrir `Default-structure/producto-carcasas-golf-LIGHT.html`.

Esperado:
- Wrap blanco con borde gris claro.
- Header blanco, franja roja arriba, eyebrow rojo `#d91a1a`, título negro grande uppercase.
- Stats bar gris claro `#fafafa`, divisores `#ececec`, labels gris medio, valores casi negro.
- Segmented control blanco con borders grises, activo rojo, inactivos texto gris medio.
- Resumen: caja gris claro con borde rojo izquierdo, texto gris oscuro.
- Specs: tabla con celdas blancas/gris claras, texto oscuro.
- Compatibilidad: pills gris claros con borde sutil; caja verde más legible; botón WhatsApp idéntico.
- Instalación: cards gris claro, headers `#f0f0f0`, "PASO N" en rojo, sub-etiqueta `#999`, texto `#444`. **Caja "Recomendación" en naranja `#ea580c` sobre fondo `#fff7ed` con borde `#fdba74`**, ícono herramienta naranja.
- Kit: pills gris claros + pills verdes claros con texto verde oscuro `#1f7a1f`.
- Footer rojo idéntico al DARK.

Verificar el responsive mobile también (DevTools 360px).

- [ ] **Step 5: Commit**

```bash
git add Default-structure/producto-carcasas-golf-LIGHT.html
git commit -m "feat(template): versión LIGHT con paleta blanca y bloque Recomendación naranja"
```

---

## Task 10: Verificación final integral

**Files:** (sin cambios)

- [ ] **Step 1: Abrir ambos archivos lado a lado en el navegador**

Abrir `producto-carcasas-golf-DARK.html` y `producto-carcasas-golf-LIGHT.html` en dos pestañas distintas. Comparar.

- [ ] **Step 2: Validar paridad estructural**

Misma estructura visual en ambos: header, stats, segmented, paneles, footer. Solo cambian colores.

- [ ] **Step 3: Validar responsive en ambos**

DevTools a 360px en cada archivo. Stats bar pasa a 2×2, segmented usa labels abreviados, paddings se reducen.

- [ ] **Step 4: Validar funcionalidad del JS**

En ambos:
- Click en cada tab cambia el panel y el botón activo.
- Inspeccionar el botón WhatsApp: el `href` está reescrito al `wa.me` correcto.

- [ ] **Step 5: Cleanup y commit final si hay tweaks**

Si en la verificación final aparecen pequeños ajustes (typos, espacios, padding incoherente entre versiones), hacerlos como un único commit "polish":

```bash
git add Default-structure/producto-carcasas-golf-DARK.html Default-structure/producto-carcasas-golf-LIGHT.html
git commit -m "polish(template): ajustes menores tras verificación final"
```

Si no hay tweaks, no commitear (es esperado).

---

## Notas adicionales para el implementador

- **Sin tests**: este proyecto no usa testing automatizado. La verificación es siempre visual abriendo el `.html` en navegador.
- **No tocar `script.js` ni `style.css`** ya que el template es auto-contenido.
- **El script de WhatsApp y el de tabs son IIFE**: si el HTML se pega más de una vez en una sola página, el segundo wrapper también se activa porque ambos scripts iteran `document.querySelectorAll(".rapa-tabs-wrap")`. Eso es deseable.
- **Carácter especial `×` (kit)**: la pill "× 2 Carcasas ABS …" usa el signo `×` (U+00D7 MULTIPLICATION SIGN), no la letra x ni `*`. Si por copy/paste se pierde, restaurarlo.
- **Ícono WhatsApp**: el SVG inline es el path oficial de WhatsApp. No reemplazar por `<img>` ni por emoji.
- **Ícono herramienta (Recomendación)**: SVG de llave inglesa (path simplificado). `stroke="currentColor"` no se usó para poder controlarlo independientemente por paleta.

---

## Self-review notes

✓ Spec coverage: las 9 decisiones de §2 del spec están cubiertas: segmented control (Task 1), header centrado (Task 1), franja roja horizontal (Task 1), eyebrow plano (Task 1), stats bar 4 cols (Task 1), tabla key-value (Task 3), pasos PASO N (Task 5), naranja medio en LIGHT Recomendación (Task 9 Step 3), WhatsApp auto-width (Task 4).

✓ Sin placeholders: cada step muestra el código HTML exacto a aplicar.

✓ Type consistency: convenciones `data-rapa-tab` / `data-rapa-panel` / `.wa-btn` / `.rapa-tabs-wrap` son consistentes en todas las tasks.

✓ Las clases `.rapa-header`, `.rapa-stats`, `.rapa-stat`, `.rapa-nav`, `.rapa-nav-wrap`, `.rapa-bar`, `.rapa-eyebrow`, `.rapa-title`, `.rapa-footer` definidas en Task 1 son las que el media query de Task 7 consume.

✓ Sustituciones de paleta del Task 9 fueron derivadas del HTML real producido en Tasks 1–7 (no de un imaginario): los strings a buscar son literales de las tasks previas.
