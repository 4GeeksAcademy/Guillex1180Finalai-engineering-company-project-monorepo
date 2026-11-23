# Auditoría de rendimiento — HITO 11

## Alcance y método

Auditoría local de producción con Lighthouse 12.8.2, ejecutado en Chromium 140 (imagen oficial `mcr.microsoft.com/playwright:v1.55.0-noble`). Los dos frontends se compilaron con `npm run build` y se sirvieron con `npm run start`; no se usó `next dev`. Las corridas antes/después usan las mismas rutas, preset y condiciones de laboratorio. Los reportes HTML y JSON se guardan en `audit/before/` y `audit/after/`.

| Aplicación y ruta | Modo | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT | TTFB |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Application `/` (redirige a productos) | Desktop | 100 | 100 | 96 | 100 | 0.3 s | 0.7 s | 0 | 40 ms | 30 ms |
| Application `/` | Mobile | 90 | 100 | 96 | 100 | 1.0 s | 2.5 s | 0 | 330 ms | 10 ms |
| Backoffice `/backoffice/inventory/products` | Desktop | 100 | 100 | 96 | 100 | 0.2 s | 0.6 s | 0 | 0 ms | 70 ms |

> Los scores son las mediciones iniciales guardadas en los archivos `*.report.json`; los tiempos son valores de laboratorio redondeados que reporta Lighthouse.

## Hallazgos y causas raíz

1. **Redirección en la ruta raíz de Application.** `/` dirige a `/backoffice/inventory/products`, y una visita sin sesión termina en login por la protección cliente. Lighthouse reporta el coste de esta navegación y una oportunidad estimada de ahorro; el cambio a `replace` modifica el historial de navegación, pero no elimina por sí solo una respuesta HTTP de redirección ni prueba una mejora causal de rendimiento. Esta es una auditoría de la ruta de entrada real, no del contenido autenticado con datos.
2. **La carga de estilos bloquea el primer render.** Lighthouse señala un CSS pequeño de Next/Tailwind (3.8 KB en Application y 3.7 KB en Backoffice; ahorro de laboratorio de 50–80 ms). Es el CSS inicial generado por el framework y es crítico para pintar el layout; no se aplazó a ciegas para evitar FOUC o cambios visuales.
3. **JavaScript de framework no usado en la primera pantalla.** El chunk común señalado contiene aproximadamente 24 KB de código no ejecutado en esta navegación y cerca de 13 KB de compatibilidad legacy. No hay una carga grande de imágenes/terceros en las vistas auditadas. Parte de ese coste proviene del runtime de Next/React y de la composición cliente actual, no de un recurso externo fácilmente removible con una corrección segura y local.
4. **El documento de inventario no autenticado intenta cargar datos y registra un 404.** El error de consola de las tres corridas iniciales fue una petición de red con HTTP 404, coincidente con el API local sin una ruta de inventario disponible/sembrada en esta corrida. Lighthouse no está usando una sesión real, así que no mide datos de usuario auténticos. Confirmar la ruta/API y correr adicionalmente con un usuario de QA sería necesario para diagnosticar la vista autenticada; no se ocultó el error ni se falseó la medición.
5. **Repetición funcional en protección de páginas.** `uis/application/components/ProtectedPage.tsx` y `uis/backoffice/src/components/ProtectedPage.tsx` repetían comprobación del token en `useEffect`, estado `ready` y redirección a `/login`. Esto dificulta mantener el mismo comportamiento, pero no explica por sí solo la mayoría del LCP: la navegación medida acaba en login sin sesión.
6. **Repetición adicional observada en páginas de inventario.** Las páginas de productos en ambas aplicaciones repiten el ciclo de carga (`loading`, `error`, `useCallback`, `useEffect`, reintento) y el render de tabla/estados de stock. Es candidato a un componente de tabla y/o hook compartido con props de API y copy, pero las diferencias funcionales actuales aconsejan extraerlo con pruebas y no como parte de una auditoría superficial.

## Abstracción aplicada

Se extrajo el hook `useProtectedSession` desde la lógica idéntica de las dos implementaciones de `ProtectedPage`. Vive en `uis/application/lib/useProtectedSession.ts`; ambos frontends lo importan y le proporcionan su propio `getAccessToken`, manteniendo sus bibliotecas de autenticación separadas. La verificación ocurre en efecto cliente, tal como antes, y preserva la ruta `/login` y el estado de espera.

## Restricciones

Las puntuaciones de Lighthouse son sensibles al ruido del entorno compartido y no sustituyen RUM. Las mediciones fueron HTTP loopback en contenedor, sin TLS ni un token/cuenta de QA. La auditoría de desktop de `Application /` alcanza en realidad el flujo de redirección/protección. La evaluación de una página autenticada debe repetirse con una cuenta de prueba segura y el backend/datos de inventario activos.
