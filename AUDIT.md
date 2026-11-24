# Auditoría Lighthouse — HITO 11

## Alcance y método

La auditoría cubre los dos frontends del proyecto y distingue explícitamente el sitio corporativo público del producto autenticado:

- **Sitio corporativo público** (`trackflow-site/index.html`): home en desktop y móvil.
- **Backoffice** (`uis/backoffice`): pantalla de productos de inventario en desktop, servida desde el build de producción local.

Las mediciones se ejecutaron con Lighthouse 12.8.2 sobre Chromium 140, contra servidores locales en modo producción para las aplicaciones construidas. URLs: `http://127.0.0.1:3102/` (home estática) y `http://127.0.0.1:3101/backoffice/inventory/products` (backoffice). Se hicieron ejecuciones before y after bajo el mismo entorno, de forma secuencial para evitar interstitials de Chrome. Los seis reportes JSON y HTML se conservan en `audit/{before,after}/` junto a capturas JPEG extraídas del `final-screenshot` de cada reporte.

En el preset móvil solo se solicitó la categoría **Performance**; por eso no se reportan Accessibility, Best Practices ni SEO para móvil. Desktop usó las cuatro categorías.

> Los resultados son mediciones de laboratorio local, no datos de campo (CrUX). Lighthouse presenta variación entre ejecuciones; interprete los valores de tiempo como una comparación de laboratorio, no como una garantía de rendimiento en todos los dispositivos.

## Resultados

| Página / preset               | Etapa   | Performance | Accessibility | Best Practices |   SEO |   FCP |   LCP |    TBT | CLS |
| ----------------------------- | ------- | ----------: | ------------: | -------------: | ----: | ----: | ----: | -----: | --: |
| Sitio público, desktop        | Antes   |          94 |            96 |             96 |   100 | 0.7 s | 0.7 s | 190 ms |   0 |
| Sitio público, desktop        | Después |         100 |           100 |            100 |   100 | 0.4 s | 0.4 s |   0 ms |   0 |
| Sitio público, móvil          | Antes   |          87 |         N/M\* |          N/M\* | N/M\* | 2.4 s | 2.4 s | 270 ms |   0 |
| Sitio público, móvil          | Después |         100 |         N/M\* |          N/M\* | N/M\* | 1.1 s | 1.1 s |   0 ms |   0 |
| Backoffice, productos desktop | Antes   |         100 |           100 |             96 |   100 | 0.2 s | 0.5 s |  10 ms |   0 |
| Backoffice, productos desktop | Después |         100 |           100 |             96 |   100 | 0.2 s | 0.5 s |   0 ms |   0 |

- N/M = categoría no ejecutada en ese preset; no equivale a una puntuación cero.

No se detectó `runtimeError` en ninguno de los seis reportes finales. En la comparación del backoffice se conserva Performance 100: no se introdujeron cambios artificiales para mejorar una puntuación que ya estaba en el máximo. Best Practices permanece en 96.

## Hallazgos y cambios implementados

### Sitio corporativo

- Se eliminó la dependencia de Tailwind por CDN en las páginas estáticas y se sustituyó por CSS local compilado (`trackflow-site/styles.css`), con fuente/configuración reproducible en `styles.src.css` y `tailwind.config.js`. Esto evita la descarga de un script de estilos externo y su trabajo de runtime. Lighthouse estimaba un ahorro de recursos que bloqueaban el renderizado de aproximadamente 310 ms en desktop y 1.16 s en móvil. El cambio se refleja también en TBT observado (190→0 ms desktop y 270→0 ms móvil), aunque el delta de laboratorio no debe atribuirse exclusivamente a una causa aislada.
- Se incluyó un favicon válido (`data:,`) en la home para evitar la solicitud fallida anterior.
- Se mejoró el contraste de las insignias que Lighthouse detectó (antes medido en 3.62:1) y se ajustó el color a `text-indigo-700`.
- Se corrigió el nombre accesible del enlace de LinkedIn para que sea coherente con su texto visible.
- La página `trackflow-site/application.html` también migró a la hoja local, aunque no forma parte de la matriz Lighthouse de este hito.

### Backoffice

La ruta auditada fue la vista de productos de inventario del build de producción local. El entorno Lighthouse no contaba con una sesión autenticada de QA; por lo tanto, esta ejecución no demuestra la carga ni exactitud de datos reales protegidos por sesión. La ruta sirve para documentar la medición del frontend, no como prueba de aceptación funcional autenticada. El score 96 en Best Practices no se modificó.

## Reutilización y duplicación observada

1. **Guards de páginas protegidas**: la lógica repetida entre `uis/application/components/ProtectedPage.tsx` y `uis/backoffice/src/components/ProtectedPage.tsx` se centralizó en `uis/application/lib/useProtectedSession.ts`; ambos guards consumen el hook común. Esta es una abstracción implementada, no solo una recomendación.
2. **Tablas y estados de inventario**: se observan patrones repetidos en pantallas de inventario (estructura de tabla, estados de carga/vacío y presentación de acciones). No se extrajo una abstracción compartida en este hito; queda como oportunidad que requiere definir primero los límites entre los dos frontends.

## Evidencias

Cada directorio `audit/before/` y `audit/after/` contiene reportes Lighthouse `.report.html` y `.report.json` para:

- `corporate-home-desktop`
- `corporate-home-mobile`
- `backoffice-products-desktop`

Y la captura JPEG final correspondiente (`*.screenshot.jpg`). Las medidas móviles registran únicamente Performance; desktop registra las cuatro categorías.

## Limitaciones

- No se realizó despliegue a un VPS externo: la sesión no disponía de dominio, endpoint, credenciales ni datos de infraestructura. El “despliegue” verificado fue servir builds de producción localmente.
- Backoffice se auditó sin una sesión de QA autenticada y las métricas no validan datos de usuario ni flujos protegidos.
- Lighthouse es una prueba sintética local. Para validar producción se debe repetir con URL pública, configuración de producción y una sesión de QA apropiada para la pantalla protegida.
