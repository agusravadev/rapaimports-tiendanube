# Comparador antes y después

La implementación principal está en `script.js` y en el bloque final de `style.css`. El comparador ocupa el primer lugar de la portada y reemplaza el banner `home-slider`. En PC mantiene el diseño de dos columnas y la proporción 4:5; en mobile usa una comparación cuadrada de borde a borde, título compacto y la barra existente de marcas pegada al borde inferior de la imagen, sin botón. No muestra el texto “Arrastrá…” ni reserva una franja debajo. El fondo es negro puro y el título usa el rojo de la página (`#E30613`). El divisor se controla con un rango nativo accesible, arrastrando o con teclado.

## Instalación por CDN

1. Pushear `script.js` al repositorio.
2. En **Configuración → Códigos de seguimiento → Footer**, cambiar únicamente el commit de la URL de jsDelivr por el commit nuevo, conservando el resto de los códigos de seguimiento. El archivo servido es `script.js`.
3. Agregar el contenido completo de `comparador-antes-despues.css` al final de **Diseño → Editar CSS**. Es el mismo bloque del comparador que está al final de `style.css`; no es necesario sustituir los estilos existentes.
4. Guardar ambos cambios y recargar la portada.

La URL del footer está fijada a un commit. Pushear el repositorio por sí solo no actualiza el script que sirve la tienda. La versión nueva también conserva las funciones de acabados y de la barra de anuncios del commit `489dd346385685c2a51383813ad9d6b22cb81664`, que era el servido por el CDN al comenzar esta tarea.

El editor CSS de Tiendanube elimina propiedades como `aspect-ratio`, `inset`, `clip-path`, variables CSS y funciones `clamp()`. El comparador reserva el alto con padding y aplica el recorte desde JavaScript. Las fuentes usan tamaños fijos con media queries. Si ya estaba instalado, el arreglo de las imágenes se activa actualizando el commit del script; agregar `correccion-comparador.css` al final del editor también corrige la proporción y los tamaños del título sin volver a pegar todo el bloque.

Para actualizar un comparador ya instalado a la nueva portada, agregar `inicio-mobile.css` **al final** del editor CSS y actualizar el commit del footer. El bloque de PC conserva su diseño. Las imágenes cargan de inmediato porque ahora forman parte del inicio. Si una foto falla, se vuelve a mostrar el banner original; su configuración no se borra del tema.

Si la portada ya estaba instalada con el commit `414e86cfcdd7fb74275ccc2a00f9d9e2b5b7974c`, basta con agregar `ajuste-portada-minimal.css` **al final** del editor CSS y actualizar el commit del footer. Este ajuste replica el mockup aprobado: quita el botón de mobile, reduce el espacio antes de las marcas y aplica negro puro y rojo intenso. La distribución y el botón de PC se conservan. El script nuevo ya no genera el botón de mobile; el CSS también oculta el anterior durante la transición.

Para quitar “Arrastrá…” de una portada ya instalada, actualizar el commit del script del footer a la versión nueva. `script.js` ya no genera ese párrafo ni su referencia `aria-describedby`; el rango conserva su nombre accesible y su estado. No hace falta volver a pegar CSS si ya se aplicaron los ajustes de color y de separación de la barra. Los estilos antiguos de la ayuda en el panel quedan sin efecto porque el elemento deja de existir.
