# Checklist de validación — Ficha + SEO Tiendanube (Rapa Imports)

Correr esta verificación antes de entregar cualquier ficha. Lo de **bloqueante**
no se entrega si falla; lo de **calidad** es deseable y conviene corregir.

## HTML de la descripción

- [ ] **(Bloqueante)** No queda ningún placeholder `{{...}}` sin reemplazar.
      Verificación rápida: buscar `{{` y `}}` en el archivo generado → 0 resultados.
- [ ] **(Bloqueante)** Los `<script>` (WhatsApp y pestañas) siguen intactos.
- [ ] **(Bloqueante)** No se rompieron los estilos inline (la estructura visual
      se mantiene: header, stats, pestañas, paneles, footer).
- [ ] La tabla de especificaciones tiene sólo filas que aplican al producto
      (mínimo ~3). Nada de specs rellenadas "para completar".
- [ ] No se sobreescribió el template original; se creó una copia nueva.

## Título SEO

- [ ] **(Bloqueante)** Máximo 70 caracteres (contar incluyendo espacios).
- [ ] Incluye producto + modelo principal.
- [ ] Claro y buscable; sin relleno ni repetición de palabras.

## Descripción SEO

- [ ] **(Bloqueante)** Máximo 160 caracteres.
- [ ] Resume producto + compatibilidad + beneficio.
- [ ] Suena natural (no es una lista de keywords).

## URL / slug

- [ ] **(Bloqueante)** Sin acentos, sin espacios, sin símbolos raros.
- [ ] Minúsculas y separado por guiones.
- [ ] Corto pero descriptivo (producto + modelo).

## Tags

- [ ] Incluyen marca, modelo, generación, producto (con sinónimos), material/acabado.
- [ ] Todo en minúsculas, separado por comas.
- [ ] Son relevantes a la búsqueda real (no genéricos vacíos).

## Marca

- [ ] Es la marca del vehículo (Volkswagen, Audi, BMW, Mercedes-Benz…), o la
      marca propia sólo si el producto la tiene.
- [ ] **No** es "Rapa Imports" salvo producto de marca propia.

## Contenido e investigación

- [ ] **(Bloqueante)** La compatibilidad declarada está respaldada por fuentes.
      No hay modelos/generaciones inventados.
- [ ] **(Bloqueante)** No se afirma OEM/original sin confirmación.
- [ ] El texto es original (no copiado textualmente de otra web).
- [ ] Los links de fuentes quedaron registrados en el archivo `tiendanube-seo.md`.
- [ ] Si la compatibilidad puede variar, la ficha invita a consultar por WhatsApp.

## Voz de marca

- [ ] Español de Argentina, tono premium/comercial.
- [ ] Sin emojis.
- [ ] Sin frases exageradas no demostrables ("el mejor del mercado", etc.).
