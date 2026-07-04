# Ficha Tiendanube — Tablero Digital Audi A3

> Archivo de optimización para cargar en Tiendanube. El HTML de la descripción
> está en `tablero-digital-audi-a3-tiendanube.html` (pegar en modo "Editar HTML / código fuente").

## Campos para pegar en Tiendanube

**Tags**
```
audi a3, audi a3 8v, virtual cockpit, tablero digital, cuadro de instrumentos digital, plug and play, tuning audi, accesorios audi a3, audi
```

**Marca**
```
Audi
```

**Título SEO** (máx. 70)
```
Tablero Digital Virtual Cockpit para Audi A3 (2013-2020)
```

**Descripción SEO** (máx. 160)
```
Tablero digital Virtual Cockpit 12.3" Plug & Play para Audi A3 2013-2020. Sin codificación. ¡Compralo ya!
```

**URL del producto**
```
/productos/tablero-digital-audi-a3/
```

## Notas de investigación

- **Fuentes consultadas:** ninguna — contenido provisto íntegramente por el usuario (no se solicitó investigación adicional).
- **Datos confirmados:** compatibilidad (Audi A3, 2013–2020), pantalla (IPS 12.3", 1920×720), sistema operativo (Linux), instalación Plug & Play sin codificación, según lo indicado por el usuario.
- **Revisar manualmente / confirmar:** ninguno — todos los datos vinieron del propio usuario.

## Checklist final

- [x] Título SEO: 56/70 caracteres
- [x] Descripción SEO: 105/160 caracteres
- [x] Placeholders restantes en el HTML: 0
- [x] Archivo HTML generado: sí
- [x] Compatibilidad verificada: sí (según datos provistos por el usuario)
- [x] URL sin acentos, espacios ni símbolos raros
- [x] Contenido original (redactado a partir de la info provista, no copiado de otra web)
- [x] Mención de consulta por WhatsApp si la compatibilidad puede variar

## Notas adicionales

- Se omitieron "Características Destacadas", "Instalación" (paso a paso), la recomendación del mecánico y "Contenido del Kit" del HTML original, por no ser parte de la estructura base de 3 pestañas.
- **Importante — bloque "Encargar por WhatsApp" quitado:** el HTML original traía al principio un botón fijo `<a href="https://wa.me/...">Encargar por WhatsApp</a>` con el texto "Producto por encargo · Tiempo de entrega a confirmar". Ese bloque **no se incluyó** en la ficha porque, según la convención del proyecto (ver `CLAUDE.md`), el botón "Encargar" no va hardcodeado en la descripción: se inyecta automáticamente desde `script.js` (funciones `marcarProductosEncargo()` / `initEncargoDetalle()`) cuando la variante del producto tiene `stock = 9999`. Si este tablero es un producto por encargo, alcanza con cargar la variante correspondiente con stock 9999 en Tiendanube — el botón y el badge "Producto por encargo" aparecen solos, sin tocar el HTML de la descripción.
