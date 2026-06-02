# Notas de diseño — opciones guardadas

## Badge notch "Verde claro" (Opción B — guardada para referencia)

Estilo para `.item-product .transfer-badge` si se quiere implementar en el futuro:

```css
/* Badge — notch verde claro desde adentro del borde superior */
.item-product .payment-discount-price-product-container {
    position: relative !important;
    overflow: hidden !important;
    padding-top: 28px !important; /* espacio para el notch */
}

.item-product .transfer-badge {
    position: absolute !important;
    top: 0 !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background: #dcfce7 !important;       /* verde muy suave */
    color: #15803d !important;            /* verde oscuro */
    font-size: 11px !important;
    font-weight: 700 !important;
    border-radius: 0 0 12px 12px !important;
    padding: 4px 16px !important;
    white-space: nowrap !important;
    letter-spacing: .2px !important;
}
```

**Visual:** Fondo verde muy suave (#dcfce7), texto verde oscuro (#15803d). 
Integrado al card, visible sin ser invasivo.
