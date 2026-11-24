# Informe de cambios y medición — HITO 11

## Resumen

Se corrigió el alcance y se midieron los dos frontends requeridos: la web corporativa real (`trackflow-site/`) y la ruta de productos del backoffice en build de producción. La mejora técnica principal fue eliminar Tailwind cargado dinámicamente desde CDN y generar un CSS estático local con Tailwind CLI. Se corrigieron además contrastes, el nombre accesible del enlace de LinkedIn, reglas CSS `@apply` inválidas en el HTML estático y el favicon ausente de la web pública.

La web corporativa desktop mejoró de 94 a 100 en Performance; móvil, de 87 a 100. En desktop Accessibility pasó de 96 a 100 y Best Practices de 96 a 100. La vista del backoffice ya puntuaba 100 en Performance antes de los cambios y conservó 100 después; no se aplicaron cambios artificiales para fabricar una diferencia. Los resultados son mediciones de laboratorio y no demuestran causalidad estadística a partir de una única corrida por modo.

## Comparativa medida

| Vista / preset                                      | Categoría      |         Antes |       Después |      Diferencia |
| --------------------------------------------------- | -------------- | ------------: | ------------: | --------------: |
| Web pública `/` desktop                             | Performance    |            94 |           100 |              +6 |
|                                                     | Accessibility  |            96 |           100 |              +4 |
|                                                     | Best Practices |            96 |           100 |              +4 |
|                                                     | SEO            |           100 |           100 |               0 |
|                                                     | FCP / LCP      | 0.7 s / 0.7 s | 0.4 s / 0.4 s | -0.3 s / -0.3 s |
|                                                     | TBT / CLS      |    190 ms / 0 |      0 ms / 0 |     -190 ms / 0 |
| Web pública `/` móvil                               | Performance    |            87 |           100 |             +13 |
|                                                     | FCP / LCP      | 2.4 s / 2.4 s | 1.1 s / 1.1 s | -1.3 s / -1.3 s |
|                                                     | TBT / CLS      |    270 ms / 0 |      0 ms / 0 |     -270 ms / 0 |
| Backoffice `/backoffice/inventory/products` desktop | Performance    |           100 |           100 |               0 |
|                                                     | Accessibility  |           100 |           100 |               0 |
|                                                     | Best Practices |            96 |            96 |               0 |
|                                                     | SEO            |           100 |           100 |               0 |
|                                                     | FCP / LCP      | 0.2 s / 0.5 s | 0.2 s / 0.5 s |           0 / 0 |
|                                                     | TBT / CLS      |     10 ms / 0 |      0 ms / 0 |      -10 ms / 0 |

## Mejoras implementadas

1. **CSS de Tailwind local y purgado.** Se eliminaron los scripts CDN de `trackflow-site/index.html` y `application.html`, y ambas páginas enlazan `styles.css`. Se incorporaron `styles.src.css` y `tailwind.config.js` como fuente/configuración reproducible; `styles.css` es el bundle minificado. Esto quita la dependencia remota de ejecución observada por Lighthouse y el bloqueo de renderizado estimado por Lighthouse en ~310 ms desktop / ~1,160 ms móvil.
2. **CSS estático válido para estados de formulario.** Se reemplazaron directivas Tailwind `@apply` en el `<style>` de la homepage por declaraciones CSS normales, porque el navegador no procesa directivas de build en HTML plano.
3. **Accesibilidad pública.** Se corrigieron colores de contraste reportados y la correspondencia entre texto visible y nombre accesible del enlace de LinkedIn. Los hallazgos de contraste pasaron de 17 a 0 en el informe desktop y Accessibility subió de 96 a 100.
4. **Favicon de la web pública.** Se declaró un favicon data URI vacío para evitar la solicitud implícita fallida a `/favicon.ico`, que generaba un error de consola en la medición inicial de la página corporativa.
5. **Hook compartido de protección de sesión.** Se extrajo la lógica duplicada de carga/verificación de sesión y redirección a `uis/application/lib/useProtectedSession.ts`, integrada por las protecciones de ambas aplicaciones con su respectivo proveedor de token. Es una mejora de mantenibilidad, no se atribuye como causa del incremento Lighthouse del sitio corporativo.

## Valoración del impacto y limitaciones

El cambio de mayor alcance fue retirar Tailwind runtime del CDN en la web pública; después de los cambios la misma página, en el mismo entorno/preset, registró mejores puntuaciones y menor FCP/LCP/TBT. Puesto que solo hay una muestra antes y después por modo, los deltas deben leerse como resultados observados, no como prueba causal aislada. Conviene repetir varias corridas y validar métricas de usuarios reales cuando el sitio esté desplegado.

No se elevó Performance del backoffice porque ya era 100 antes. Best Practices permanece en 96. El TBT medido fue 10 ms antes y 0 ms después. Además, la ruta fue auditada sin una sesión de inventario autenticada; no acredita la carga de datos reales.

Las pruebas se hicieron localmente contra servidores de producción (build + start para el backoffice), en loopback y sin la latencia, TLS o CDN de un VPS. No se realizó despliegue externo: faltan destino, dominio/configuración de proxy y credenciales.

## Evidencia y verificación

- Informes Lighthouse HTML/JSON: `audit/before/` y `audit/after/`; archivos `corporate-home-*` representan el sitio público y `backoffice-products-desktop` el inventario del backoffice. Los seis reportes no registran errores de runtime.
- Capturas JPEG extraídas del `final-screenshot` embebido en cada JSON: `audit/{before,after}/*.screenshot.jpg`. Los informes HTML son la vista interactiva completa.
- En móvil solo se ejecutó Performance; Accessibility, Best Practices y SEO no se midieron para ese preset.
- El análisis técnico de causas raíz, métricas y refactorización se encuentra en `AUDIT.md`.
- `git diff --check` no reportó errores en la verificación registrada.
- No se creó commit automáticamente. Las antiguas evidencias `application-home-*`, si se conservan en el repositorio, corresponden a la app interna y no deben confundirse con la web corporativa.
