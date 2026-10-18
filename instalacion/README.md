# Comparador antes y después

La implementación principal está en `script.js` y en el bloque final de `style.css`. Usa las dos imágenes WebP subidas a Tiendanube, con proporción 4:5, y se coloca entre Destacados e Instagram. El divisor se controla con un rango nativo accesible, arrastrando o con teclado.

## Instalación por CDN

1. Pushear `script.js` al repositorio.
2. En **Configuración → Códigos de seguimiento → Footer**, cambiar únicamente el commit de la URL de jsDelivr por el commit nuevo, conservando el resto de los códigos de seguimiento. El archivo servido es `script.js`.
3. Agregar el contenido completo de `comparador-antes-despues.css` al final de **Diseño → Editar CSS**. Es el mismo bloque del comparador que está al final de `style.css`; no es necesario sustituir los estilos existentes.
4. Guardar ambos cambios y recargar la portada.

La URL del footer está fijada a un commit. Pushear el repositorio por sí solo no actualiza el script que sirve la tienda. La versión nueva también conserva las funciones de acabados y de la barra de anuncios del commit `489dd346385685c2a51383813ad9d6b22cb81664`, que era el servido por el CDN al comenzar esta tarea.

El editor CSS de Tiendanube elimina propiedades como `aspect-ratio`, `inset`, `clip-path`, variables CSS y funciones `clamp()`. El comparador reserva el alto con padding y aplica el recorte desde JavaScript. Las fuentes usan tamaños fijos con media queries. Si ya estaba instalado, el arreglo de las imágenes se activa actualizando el commit del script; agregar `correccion-comparador.css` al final del editor también corrige la proporción y los tamaños del título sin volver a pegar todo el bloque.
