---
name: rapaimports-tiendanube-product-seo
description: >-
  Arma fichas completas de producto para la tienda Rapa Imports en Tiendanube.
  Investiga el producto en internet (Alibaba, Amazon, MercadoLibre, foros y
  fichas técnicas), completa la plantilla HTML base con pestañas
  (Default-structure/estructura-base-producto.html) y genera los campos de
  optimización de Tiendanube: Tags, Marca, Título SEO (≤70 caracteres),
  Descripción SEO (≤160 caracteres) y URL/slug del producto. Usá esta skill
  siempre que el usuario pida cargar, crear, completar o armar la ficha o la
  descripción HTML de un producto para Rapa Imports, generar el HTML de un
  producto, completar el template, o pedir Tags / Marca / Título SEO /
  Descripción SEO / URL para un accesorio de auto (volantes en fibra de carbono,
  displays LED, tableros digitales, cachas/carcasas de espejo, difusores,
  alerones, palancas DSG, etc. para Volkswagen, Audi, BMW, Mercedes-Benz y
  otros), aunque no diga explícitamente "SEO" ni "Tiendanube".
---

# Rapa Imports · Ficha de producto + SEO para Tiendanube

Esta skill convierte un producto (a veces sólo un nombre y un modelo de auto) en
una ficha lista para publicar en Tiendanube: el **HTML de la descripción** ya
completo + los **campos de optimización** (Tags, Marca, Título SEO, Descripción
SEO, URL). El objetivo real es ahorrarle al usuario la parte tediosa —
investigar el producto, redactar contenido original y vestirlo con el diseño de
la marca— sin inventar datos que después generen una venta mal vendida.

## Contexto del negocio

Rapa Imports vende accesorios y upgrades para autos: volantes en fibra de
carbono, displays LED, tableros digitales (virtual cockpit), cachas/carcasas de
espejo, difusores, alerones, palancas DSG y similares, principalmente para
Volkswagen, Audi y BMW. El cliente típico busca un upgrade estético o tecnológico
concreto para **su** modelo, así que lo más importante de una ficha es que se
entienda **qué es, para qué auto sirve y por qué le conviene**.

## Inputs que podés recibir

El usuario puede darte uno o varios de estos datos (y faltarán otros — está bien):
nombre del producto, marca del vehículo, modelo/generación (ej. Golf MK7, MK7.5,
BMW F20, Audi A3 8V), fotos o links de referencia, ruta del template HTML, datos
técnicos sueltos, precio, material/acabado/variantes, y si quiere un archivo
nuevo o modificar una copia. Tomá lo que haya y completá el resto con
investigación. Si algo no se puede confirmar, no lo inventes (ver más abajo).

## Flujo de trabajo

### 1. Entender el producto

Identificá: nombre, marca del vehículo, modelo(s) compatible(s), generación/años,
material, acabado, tipo de instalación y el beneficio principal. Si falta algo
importante, lo resolvés en la investigación. Lo que no se pueda confirmar va
marcado como **"confirmar"** en las notas — nunca como un dato afirmado.

### 2. Investigar en internet

Buscá en fuentes confiables y **siempre revisá Alibaba, Amazon y MercadoLibre**
(son las que mejor muestran este tipo de accesorios genéricos: fotos, medidas,
compatibilidades y referencias OEM). Sumá foros técnicos de la marca, catálogos y
fichas de tiendas similares.

Reglas de investigación (importan porque una compatibilidad mal puesta = una
devolución y un cliente enojado):

- Priorizá datos verificables: compatibilidad, referencia OEM, material,
  generación del vehículo, años aproximados, tipo de instalación, nombres técnicos.
- **No inventes compatibilidades.** Si una fuente dice MK7 pero no MK7.5, no
  agregues MK7.5 "por las dudas".
- **No afirmes que algo es OEM/original** si no está confirmado. "Compatible con
  referencia OEM XXX" sólo si lo viste en una fuente; si no, omitilo.
- **No copies textos largos** de otras webs. Usá la info como insumo y redactá
  contenido original para Rapa Imports.
- Guardá los links de las fuentes — van en el archivo de notas del producto.

### 3. Completar el HTML

La plantilla canónica del proyecto es
[`Default-structure/estructura-base-producto.html`](../../../Default-structure/estructura-base-producto.html)
(diseño definitivo: pestañas Descripción · Especificaciones · Compatibilidad,
fondo blanco). Usala siempre que exista en el proyecto. Si el usuario indica otra
ruta, usá esa. Si no hay ninguna, usá la copia incluida en
[`templates/product-description-template.html`](templates/product-description-template.html).

Reglas al completar:

- **Leé el template entero antes de tocarlo.** Reemplazá los placeholders `{{...}}`
  con contenido optimizado. No dejes ninguno sin completar.
- **No rompas los estilos inline ni borres los `<script>`** (el de WhatsApp y el de
  las pestañas son los que hacen funcionar la ficha). Mantené la estructura visual.
- La tabla de especificaciones es **flexible**: poné las filas `<tr>` que el
  producto realmente tenga (mínimo ~3, sin tope). No fuerces specs que no aplican.
- **Nunca sobreescribas el template original.** Generá siempre una copia nueva en
  la carpeta del producto (ver paso 5).

Si el template usa otra convención de nombres de placeholder, mapealos así:

| Placeholder genérico (inglés)        | Placeholder de la plantilla Rapa (real)        |
|--------------------------------------|------------------------------------------------|
| `{{PRODUCT_TITLE}}`                  | `{{TITULO_PRODUCTO}}`                           |
| `{{EYEBROW}}`                        | `{{BADGE_CATEGORIA}}`                           |
| `{{SHORT_DESCRIPTION}}` / `{{DESCRIPTION_BODY}}` | `{{DESCRIPCION}}`                  |
| `{{MATERIAL}}` / `{{ACABADO}}` / `{{COMPATIBILIDAD_RESUMEN}}` | `{{STAT1_VALOR}}` / `{{STAT2_VALOR}}` / `{{STAT3_VALOR}}` (con sus `{{STATn_LABEL}}`) |
| `{{SPECS_ROWS}}`                     | `{{FILAS_ESPECIFICACIONES}}`                   |
| `{{COMPATIBILITY_BADGES}}`           | `{{MODELOS_COMPATIBLES}}`                       |
| `{{WHATSAPP_TEXT}}`                  | `{{TEXTO_COMPATIBILIDAD}}`                      |
| `{{FOOTER_TITLE}}`                   | `{{FOOTER_LINEA1}}` + `{{FOOTER_LINEA2}}`      |

Detectá qué placeholders existen realmente en el archivo elegido y completá esos.

#### Variantes de terminación (negro piano / símil carbono)

Muchos de estos productos vienen en **dos terminaciones**: **negro piano brillante**
y **símil fibra de carbono**. La descripción es la misma para ambas — sólo cambia
el color/acabado. Para no duplicar publicaciones, una sola ficha cubre las dos
variantes (en Tiendanube se cargan como variantes del producto).

Reglas:

- **Si el usuario indica que el producto viene en las dos terminaciones**, escribí
  el acabado como **"Negro piano brillante / símil fibra de carbono"** en todos los
  lugares donde aparece (stat "Acabado", fila "Acabado" de la tabla y la prosa de la
  descripción), y **mantené la descripción indiferente a la terminación**: no
  describas un único acabado ni uses frases que sólo apliquen a uno. La idea es que
  el mismo texto sirva para cualquiera de las dos variantes.
  - Stat "Acabado" (compacto, va en la barra de 3 columnas): `Negro piano / Símil carbono`
  - Fila "Acabado" de la tabla de especificaciones: `Negro piano brillante o símil fibra de carbono (elegí la variante al comprar)`
  - Prosa: hablá del acabado en general (ej. "con terminación premium negro piano
    brillante o símil fibra de carbono, a elección"), nunca atado a uno solo.
  - **Tags:** incluí términos de las dos (`negro piano`, `simil carbono`, `fibra de carbono`).
- **Cómo nombrar la terminación de carbono según el lugar:**
  - En el **stat "Acabado"** (la barra compacta de 3 columnas) usá la forma corta
    **"Símil carbono"**, para que no quede demasiado largo.
  - En la **tabla de especificaciones**, la **prosa** y los textos largos usá la
    forma completa **"Símil fibra de carbono"**.
  - Nunca uses "Carbono" a secas ni "Fibra carbono". Esto vale tanto para doble
    terminación como para producto sólo en carbono.
- **Si el usuario indica una sola terminación**, usá esa y listo (no menciones la otra).
- **No inventes** que un producto viene en las dos: sólo aplicá esta regla cuando el
  usuario lo aclare.

#### Badges de modelos compatibles (rango de años, no un badge por año)

Cuando un producto es compatible con un modelo en un **rango continuo de años**
(ej. 2010-2019), **no generes un badge por cada año** duplicando el modelo. Un
solo badge con el rango completo:

- Correcto: `VW Vento MK6 2011-2018`
- Incorrecto: `VW Vento MK6 2011`, `VW Vento MK6 2012`, `VW Vento MK6 2013`… (un
  badge por año)

Si hay más de un modelo compatible (ej. A3 y S3, o Hatchback y Sportback con
rangos distintos), un badge por modelo con su propio rango, no por año:

- Ej.: `Audi A3/S3 8V Hatchback 2013-2020` (un solo badge, no ocho).

Sólo abrí badges separados por año si el rango **no es continuo** (ej. el
producto aplica a 2013-2015 y después a 2018-2020 pero no al medio, según lo que
diga la fuente) — ahí sí hace falta partirlo para no afirmar años que no están
confirmados.

#### Mensaje de consulta por WhatsApp (compatibilidad)

El texto que acompaña al botón de WhatsApp en la pestaña de Compatibilidad
(placeholder `{{TEXTO_COMPATIBILIDAD}}`) tiene que ser **genérico**, no
personalizado por modelo/año. Usar siempre esta frase, tal cual:

```
¿Tenés dudas de la compatibilidad de este producto con tu vehículo? Consultanos por WhatsApp.
```

No redactes variantes largas explicando el rango de años o la carrocería en esa
frase — esa información ya está en el párrafo de compatibilidad y en los badges;
el mensaje de WhatsApp es sólo la invitación a consultar.

### 4. Generar los campos de Tiendanube

**A) Tags** — palabras clave para la búsqueda interna de Tiendanube. Incluí marca,
modelo, generación, producto (con sinónimos: "cachas de espejo" y "carcasas de
espejo"), material, acabado y términos comunes. Lista separada por comas, en
minúsculas. Ej.:
`golf, golf mk7, golf mk7.5, gti, tsi, cachas de espejo, carcasas de espejo, espejo carbono, accesorios golf, volkswagen`

**B) Marca** — el campo "Marca > Nombre". Usá la **marca real del vehículo**
(Volkswagen, Audi, BMW, Mercedes-Benz…). Si el producto es genérico sin marca
propia, igual usás la del vehículo compatible. **No uses "Rapa Imports"** como
marca salvo que sea un producto de marca propia.

**C) Título SEO** — **máximo 70 caracteres**. Claro, buscable, comercial.
Producto + modelo principal. Sin relleno. Ej.:
`Carcasas de Espejo Carbono para Golf MK7 y MK7.5`

**D) Descripción SEO** — **máximo 160 caracteres**. Resume producto +
compatibilidad + beneficio + estilo, natural para Google y redes, y **terminá
siempre con un llamado a la acción corto** del estilo `¡Compralo ya!` o
`Compralo en Rapa Imports` (el que entre sin pasarte de 160). Ej.:
`Carcasas de espejo símil carbono para VW Golf MK7 y MK7.5. Upgrade exterior simple y de instalación directa. ¡Compralo ya!`

**E) URL / slug** — minúsculas, sin acentos, sin símbolos raros, separado por
guiones, corto pero descriptivo. Ej.:
`/productos/carcasas-espejo-carbono-golf-mk7-mk75/`

### 5. Guardar la salida

Creá una carpeta por producto dentro de `templates/` de la skill, con slug del
producto como nombre, conteniendo dos archivos:

```
templates/<slug-del-producto>/
├── <slug-del-producto>-tiendanube.html   ← HTML completo, listo para pegar
└── tiendanube-seo.md                      ← campos SEO + notas + fuentes
```

Usá [`templates/_seo-output-template.md`](templates/_seo-output-template.md) como
base del archivo `tiendanube-seo.md`. (Si el usuario prefiere otra ruta —ej.
`output/` o la raíz del proyecto— respetala; este es sólo el default.)

### 6. Validación final

Antes de entregar, revisá contra
[`checklists/tiendanube-seo-checklist.md`](checklists/tiendanube-seo-checklist.md).
Lo mínimo no negociable: cero placeholders sin reemplazar, Título SEO ≤70,
Descripción SEO ≤160, URL sin acentos/espacios/símbolos, compatibilidad no
inventada, contenido original (no copiado), y mención de consultar por WhatsApp
cuando la compatibilidad pueda variar.

## Reglas de estilo (voz de marca)

- **Español de Argentina.** Tono premium, directo, claro y comercial.
- **Sin emojis.**
- **Sin frases exageradas** tipo "el mejor del mercado" salvo que se pueda
  demostrar. El cliente de autos huele el verso a la distancia; la credibilidad
  vende más que el hype.
- No sobrecargues de texto. Priorizá conversión: qué es, para qué auto, por qué
  conviene.
- Incluí la consulta por WhatsApp cuando haya dudas de compatibilidad.
- Coherencia con Rapa Imports (premium/racing, sin sonar falso).

## Formato de salida (lo que mostrás al usuario)

Después de generar los archivos, respondé con esta estructura exacta:

```
Archivo HTML generado: <ruta>

Resumen del contenido:
<2-4 líneas describiendo la ficha creada>

--- Campos para pegar en Tiendanube ---

Tags:
<lista separada por comas>

Marca:
<marca del vehículo>

Título SEO:
<texto>

Descripción SEO:
<texto>

URL del producto:
<slug>

--- Notas de investigación ---
- Fuentes consultadas: <links>
- Datos confirmados: <...>
- Revisar manualmente: <... o "ninguno">

--- Checklist final ---
- Título SEO: X/70 caracteres
- Descripción SEO: X/160 caracteres
- Placeholders restantes: 0
- Archivo HTML generado: sí/no
- Compatibilidad verificada: sí / no / parcial
```

Avisá siempre que el HTML se pega en Tiendanube en modo **"Editar HTML / código
fuente"** (no en el editor visual), para que no se rompan los `<script>`.
