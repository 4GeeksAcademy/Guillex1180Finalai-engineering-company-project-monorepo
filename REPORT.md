# Informe de cambios y medición — HITO 11

## Resumen ejecutivo

Se completó el ciclo medir → analizar → corregir → volver a medir con builds y servidores Next.js de producción. Se extrajo un hook reutilizable de protección de sesión en ambos frontends y se cambió la redirección de la ruta raíz de Application a reemplazo de historial (`redirect(..., 'replace')`). Este ajuste cambia el historial de navegación, no la respuesta HTTP ni el número de redirecciones. La compilación TypeScript de ambos proyectos y las corridas finales Lighthouse se completaron.

Las mediciones finales muestran una mejora del score Performance móvil de Application de 90 a 98 (+8 puntos) y reducción del LCP móvil de 2.5 s a 2.3 s. Las vistas desktop mantuvieron sus puntuaciones máximas de Performance y las demás categorías se mantuvieron iguales. Son diferencias observadas entre muestras de laboratorio; el cambio `replace` no explica por sí solo el delta y no se atribuye causalidad sin corridas repetidas controladas. Se recomienda volver a medir varias veces y en hosting real.

## Comparativa

| Página / modo | Métrica | Antes | Después | Cambio |
|---|---|---:|---:|---:|
| Application `/` desktop | Performance | 100 | 100 | 0 |
|  | Accessibility | 100 | 100 | 0 |
|  | Best Practices | 96 | 96 | 0 |
|  | SEO | 100 | 100 | 0 |
|  | LCP / TBT / CLS | 0.7 s / 40 ms / 0 | 0.6 s / 10 ms / 0 | -0.1 s / -30 ms / 0 |
| Application `/` mobile | Performance | 90 | 98 | **+8** |
|  | Accessibility | 100 | 100 | 0 |
|  | Best Practices | 96 | 96 | 0 |
|  | SEO | 100 | 100 | 0 |
|  | LCP / TBT / CLS | 2.5 s / 330 ms / 0 | 2.3 s / 100 ms / 0 | -0.2 s / -230 ms / 0 |
| Backoffice `/backoffice/inventory/products` desktop | Performance | 100 | 100 | 0 |
|  | Accessibility | 100 | 100 | 0 |
|  | Best Practices | 96 | 96 | 0 |
|  | SEO | 100 | 100 | 0 |
|  | LCP / TBT / CLS | 0.6 s / 0 ms / 0 | 0.5 s / 0 ms / 0 | -0.1 s / 0 ms / 0 |

Los reportes fuente completos (incluidas las cuatro categorías y diagnósticos por auditoría) están en `audit/before/` y `audit/after/` en HTML y JSON.

## Cambios aplicados

1. **Reemplazo del historial en la entrada:** `uis/application/app/page.tsx` usa `redirect('/backoffice/inventory/products', 'replace')`. Esto evita conservar la ruta raíz en el historial del navegador, pero no elimina un salto HTTP; no se cambió el destino ni el control de acceso.
2. **Hook compartido para sesión protegida:** `uis/application/lib/useProtectedSession.ts` encapsula espera, consulta de token y redirección a `/login`; ambas copias de `ProtectedPage` llaman el hook pasando su función de auth local. Elimina duplicación entre las aplicaciones sin cambiar la arquitectura ni compartir credenciales.
3. **Sin cambios cosméticos para inflar scores:** se mantuvieron el CSS inicial, runtime de Next y polyfills que Lighthouse reporta como oportunidades, porque su retirada requiere cambios de build o validación visual/compatibilidad y el coste absoluto es pequeño para estas rutas. El CSS crítico no se difirió para evitar FOUC.

## Impacto y lectura

La mayor diferencia observada fue la mejora de Performance móvil de Application (+8), acompañada de menor TBT y LCP, pero el muestreo no permite atribuirla a un cambio concreto. La ruta raíz actualmente dirige al área protegida, no a una landing pública con contenido SEO. El backoffice ya mide 100 en Performance desktop; por tanto, el refactor de código ayuda principalmente al mantenimiento y a la consistencia, no se le atribuye una mejora Lighthouse inexistente.

Best Practices permanece en 96 en las tres mediciones. Las categorías Accessibility y SEO se mantuvieron en 100. Los resultados deben interpretarse como muestras locales de laboratorio: hubo una respuesta 404 de red en consola por la carga de datos sin sesión/API de inventario utilizable; para validar la tabla real se necesita backend sembrado y credenciales de QA. Lighthouse con `localhost` tampoco representa TLS, CDN, compresión ni latencia de producción.

## Verificación

- `npm run build` pasó en `uis/application` y `uis/backoffice` después de las correcciones.
- Las seis corridas (tres before, tres after) usaron Lighthouse 12.8.2 y builds `next build` servidos con `next start`, con los mismos URL/preset desktop o mobile correspondientes.
- Evidencia archivada en `audit/before/` y `audit/after/`. Los informes HTML muestran la auditoría; los JSON permiten revisar cada métrica y diagnóstico; los JPEG separados conservan la captura final de cada corrida.
- No se creó commit automáticamente. Los cambios quedan en el workspace para revisión y commit del usuario.
