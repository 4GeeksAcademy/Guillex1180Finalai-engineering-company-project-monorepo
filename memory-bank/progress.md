# Progress — TrackFlow

## Estado actual del desarrollo

| Hito   | Descripción                                                          | Estado                                                                    | Rama                        |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------- |
| HITO 1 | Sitio web corporativo público con formulario de captación de leads   | ✅ Completado                                                             | `feature/corporate-website` |
| HITO 2 | Fundamentos de programación — utilidades TypeScript                  | ✅ Completado                                                             | `feature/fundamentals`      |
| HITO 3 | Talent Pipeline Tracker — gestión de candidaturas                    | ✅ Completado                                                             | `feature/domain-models`     |
| HITO 4 | Infraestructura de agentes — memory bank, reglas, skills             | ✅ Completado                                                             | `feature/agent-memory-bank` |
| HITO 5 | Backoffice de inventario — Next.js, integración con API `/inventory` | 🟡 Backoffice implementado y validado; backend/integración real pendiente | `main`                      |

## HITO 1 — Sitio web corporativo

- ✅ Landing page con hero, servicios, cobertura, beneficios y contacto
- ✅ Formulario de captación de leads con validación completa
- ✅ Schema.org markup (Organization)
- ✅ Diseño responsive con Tailwind CSS
- ✅ Ruta: `trackflow-site/`

## HITO 2 — Fundamentos de programación

- ✅ Modelos de datos (Product, Shipment, Carrier, InventoryMovement)
- ✅ Utilidades de colecciones (filtros por almacén, categoría, stock bajo)
- ✅ Funciones de búsqueda
- ✅ Transformaciones de datos
- ✅ Validaciones de dominio
- ✅ Ruta: `src/utils/`

## HITO 3 — Talent Pipeline Tracker

- ✅ Listado de candidaturas con filtros por estado/etapa y búsqueda
- ✅ Detalle de candidato con cambio de estado y etapa
- ✅ CRUD de notas internas
- ✅ Formulario de creación y edición de candidatos
- ✅ Sin prop drilling (StatusControls, NotesPanel autónomos)
- ✅ Etiquetas desde lookup tables (STATUS_LABELS, STAGE_LABELS)
- ✅ Build y tests funcionales pasan (24/24 PASS)
- ✅ Ruta: `uis/talent-pipeline-tracker/`

## HITO 4 — Infraestructura de agentes

- ✅ `BRIEFING.md` creado en la raíz con briefing real de TrackFlow
- ✅ `CONTEXT.es.md` actualizado con información real de TrackFlow
- ✅ `memory-bank/projectbrief.md` creado con descripción del negocio y objetivos
- ✅ `memory-bank/techContext.md` creado con stack, arquitectura y restricciones
- ✅ `memory-bank/progress.md` creado con estado de desarrollo
- ✅ `AGENTS.md` creado con protocolo de operación (6 archivos a leer, flujo 5 pasos pre-commit, carpetas protegidas)
- ✅ `.agents/rules/leer-contexto-al-inicio.md` con scope `always`
- ✅ `.agents/skills/lead-qualification/SKILL.md` con objetivo único, inputs y acceptance criteria
- ✅ Rama `feature/agent-memory-bank` creada y código commiteado
- ✅ PR #1 fusionada a `main` (squash merge)

## Próximos pasos

- Completar backend HITO 5 en `services/` y verificar el contrato real de respuesta con el backoffice.
- Ejecutar `npm install`, `npm run typecheck` y `npm run build` en `uis/backoffice`.
- Probar las vistas contra una API en ejecución y validar token/autorización en servidor.
- Sincronizar ramas derivadas con los cambios de `main`
- ✅ PR #1 abierto contra `main`

## HITO 5 — Backoffice de inventario

- ✅ App Next.js en `uis/backoffice/`, con Tailwind y documentación de ejecución.
- ✅ Cliente centralizado para endpoints `/inventory`, bearer token y errores legibles; ninguna vista invoca `fetch` directamente.
- ✅ Rutas canónicas `/backoffice/inventory/...`: listado de SKU con stock/almacén y umbrales visuales, formularios StockEntry/StockExit e historial de solo lectura.
- ✅ Estados de carga, éxito y error visibles; el outbound evita reportar un fallo si solo falla el refresco posterior a una salida ya confirmada.
- ✅ Protección UX basada en token y formulario para configurar token/UUID sin simular autenticación.
- ✅ `.env.example` documenta `NEXT_PUBLIC_INVENTORY_API_URL`; `.env.local` está ignorado por Git y no rastreado.
- ✅ `npx tsc --noEmit` y `npm run build` ejecutados desde `uis/backoffice` sin errores. No existe script `lint` en el paquete.
- ⚠️ Backend `services/` y proveedor de auth no existen aún; no se ha probado la integración real ni validación de token en servidor.

## HITO 6 — Análisis de incidencias

- ✅ La lógica reutilizable de lectura, validación y agregación vive en `services/incidents.py`; la CLI `scripts/analyze.py` y la API comparten estas reglas TrackFlow.
- ✅ API autenticada: `POST /api/incidents/analyze` recibe `multipart/form-data` con el campo `file`; `GET /api/incidents/results/export` descarga el resumen agregado como CSV.
- ✅ Backoffice protegido en `/backoffice/incidents`, con selector/arrastre de CSV, métricas, desglose de registros inválidos y descarga. Enlace añadido a la navegación.
- ✅ Errores HTTP descriptivos para tipo MIME no admitido, CSV vacío/incorrecto y ausencia de un análisis exportable.
- ✅ Verificados con una muestra sintética los agregados esperados del briefing (100 filas, 95 válidas, 5 inválidas, categorías/estados y promedio 3.06), el rechazo de CSV vacío y la ausencia del email en el CSV exportado.
- ✅ OpenAPI registra las dos rutas y sus métodos esperados.
- ⚠️ Falta ejecutar `npm run typecheck`/`npm run build` y una prueba HTTP extremo a extremo: el entorno actual no permite importar `TestClient` porque no está instalado `httpx2`; no se ha añadido como dependencia de runtime.
- ⚠️ El resultado más reciente se guarda en memoria por usuario; para despliegues multiworker debe usarse almacenamiento compartido.
- ⚠️ El archivo de prueba `incidents-trackflow.csv` no está disponible en el workspace, por lo que falta ejecutar el script contra el CSV original para confirmar los resultados con los datos reales.

## Revisión de release

- ✅ Backend: `python -m unittest discover -s tests -v` (20/20), `pip check` y health/docs/OpenAPI locales.
- ✅ Interfaces `uis/application` y `uis/backoffice`: typecheck y build de producción; auditoría npm sin advisories.
- ✅ `src`: typecheck y demo ejecutados correctamente tras corregir la ruta del script en `src/package.json`.
- ⚠️ `uis/talent-pipeline-tracker`: faltan dependencias instaladas para compilar; `npm audit` informa 1 vulnerabilidad crítica y 1 alta en el lockfile (Next.js 14.2.35). Revisar actualización de versión mayor antes de cambiarla.
- ⚠️ `infra/` solo contiene documentación; no hay manifiestos de despliegue ni destino/credenciales de producción. No se desplegó ni se ejecutó el seeder contra una base externa.
- ⚠️ Árbol Git preexistente muy sucio, con cambios staged/unstaged y artefactos generados; no se creó commit para evitar incluir cambios ajenos o secretos.

## Ajustes de revisión del monorepo

- ✅ Se consolidaron reglas de `.gitignore` para excluir bytecode Python, salida `dist/`, cachés Next.js y entornos locales, manteniendo versionables los `.env.example`.
- ✅ Las tres aplicaciones Next.js declaran la raíz del monorepo para Turbopack; el tracker ya no emite la advertencia de raíz inferida por múltiples lockfiles.
- ✅ `uis/talent-pipeline-tracker/tsconfig.json` excluye artefactos `.next` y el typecheck/build se completan correctamente.
- ✅ Los proxys de `uis/application` y `uis/backoffice` aceptan `TRACKFLOW_API_URL` y normalizan la barra final. El README del backoffice refleja el API, proxy y flujo de token actuales.
- ✅ Verificados 28 tests de Python, typecheck y build de las tres apps; npm audit de dependencias de producción sin vulnerabilidades.
- ⚠️ Next.js advierte que React 18 dejará de ser compatible en Next 17. Mantener React 18 evita un cambio mayor de dependencias sin validación específica.
- ⚠️ Los artefactos `uis/backoffice/.next` ya estaban rastreados por Git y su estado incluye cambios previos; no se eliminaron ni alteró el índice.

## HITO 8 — Autenticación y protección de rutas

- ✅ Usuarios y perfiles se guardan exclusivamente en TinyDB; SQLModel crea solo las tablas del inventario (SKU, entradas y salidas). El `user_uuid` de movimientos procede del ID autenticado de TinyDB.
- ✅ CRUD de credenciales `/users`, perfiles `/profiles/me`, registro y login JWT `/auth`; los roles están limitados a `admin`, `manager` y `user`, y los registros nuevos reciben `user` por defecto.
- ✅ Contraseñas hasheadas con bcrypt mediante `libpass[bcrypt]`; se eliminó la dependencia redundante y no mantenida `passlib[bcrypt]` del manifiesto `requirements.txt` (el import compatible `passlib.hash` lo proporciona libpass).
- ✅ La expiración y la clave JWT se configuran por entorno; los endpoints protegidos de usuarios, perfiles, proveedores, inventario e incidencias validan token, y las comprobaciones de propiedad responden 403.
- ✅ Verificación ejecutada: `python -m unittest discover -s tests -v` (20/20) y `python -m pytest -q tests/test_auth_01.py` (8/8). La prueba parametrizada cubre rutas protegidas con token ausente, inválido, alterado y expirado; advertencia deprecada de Starlette/httpx sin fallo.

## HITO 11 — Auditoría de rendimiento y reutilización

- ✅ Corregido el alcance de auditoría: landing pública en `trackflow-site/` (desktop/móvil) y productos del backoffice (desktop), con resultados before/after en `audit/`.
- ✅ Landing migrada de Tailwind CDN a CSS local compilado (`styles.src.css`, `tailwind.config.js`, `styles.css`); corregidos favicon, contraste y nombre accesible del enlace de LinkedIn.
- ✅ Documentados los resultados finales y limitaciones en `AUDIT.md` y `REPORT.md`; se conservan reportes Lighthouse HTML/JSON y seis capturas JPEG extraídas de sus JSON.
- ✅ Scores: web pública desktop Performance 94→100, Accessibility 96→100, Best Practices 96→100, SEO 100; móvil Performance 87→100. Backoffice desktop Performance 100→100, Accessibility 100→100, Best Practices 96→96, SEO 100→100.
- ⚠️ Lighthouse móvil solo midió Performance; el backoffice se auditó sin sesión de QA autenticada y no valida datos funcionales reales.
- ⚠️ No se desplegó en VPS: no se proporcionaron destino, dominio, proxy ni credenciales. Validación limitada a builds/servidores locales de producción.

## HITO 12 — Auditoría de serialización del backend

- ✅ Auditoría endpoint por endpoint en `docs/serialization-audit.md`; cubre las 24 rutas de routers, `GET /` y `/health`, incluyendo estado previo, contratos finales, campos y decisiones de relaciones.
- ✅ Añadidos contratos explícitos para registro (sin email en respuesta), liveness/root, resumen agregado de incidencias y movimientos; exportación CSV documentada como `text/csv` y DELETE con 204 sin cuerpo.
- ✅ Proyecciones de movimiento SKU aplanadas para historial (nombre/código, sin objeto anidado completo ni FK redundante); receipts de escritura ya no incluyen SKU anidado.
- ✅ Entradas SKU/movimientos rechazan campos adicionales; `user_uuid` se deriva exclusivamente del JWT. Backoffice actualizado para consumir contratos y no enviar UUID local.
- ✅ Suite backend: `pytest tests/test_auth_01.py tests/test_auth_profiles.py tests/test_users.py tests/test_incidents.py` (29/29); typecheck de `uis/backoffice` y `uis/application` sin errores.
- ⚠️ No se ejecutó build de producción en este hito; no se hizo commit/PR porque el árbol contiene cambios y artefactos preexistentes no relacionados.

## HITO 13 — Optimización de carga y caché

- ✅ Caché TTL en `GET /inventory/products` (15 s) y `GET /inventory/orders` (10 s), con claves por identidad autenticada, copias profundas y expiración monotónica.
- ✅ Escrituras de SKU y movimientos invalidan las lecturas de inventario para todas las identidades, ya que el ledger es compartido.
- ✅ Dos cargas dinámicas frontend: resultados de incidencias y tabla de historial de movimientos.
- ✅ `useMemo` para ordenar el historial de forma no trivial, sin mutar el estado.
- ✅ Benchmark aislado reproducible en `scripts/benchmark_inventory_cache.py`; usa almacenes temporales y no modifica `data/`.
- ✅ Informe de alcance, decisiones, limitaciones y resultados observados en `CACHING_REPORT.md`.
- ✅ Pruebas dirigidas de TTL, copia defensiva, separación de identidad e invalidación cruzada en `tests/test_inventory_cache.py`.
- ✅ Pruebas dirigidas del backend (3 pasaron) y typecheck de `uis/application` pasaron.
- ⚠️ Benchmark local de una sola ejecución/TestClient, no representa tráfico de producción ni concurrencia; detalles y cifras en `CACHING_REPORT.md`.
- ⚠️ Pendiente volver a ejecutar suite backend completa, build frontend, smoke y `git diff --check` después de los cambios.
- ⚠️ La caché vive en memoria del proceso; para varios workers/réplicas se requiere caché compartida o aceptar misses/consistencia por proceso.
- ⚠️ Rama `feature/caching-optimisation` iniciada desde `feature/error-handling-audit`; no crear commit/PR hasta revisar cuidadosamente los cambios preexistentes del árbol sucio.

## HITO 15 — Diseño de telemetría

- ✅ Creado/actualizado `docs/telemetry/telemetry-plan.md` con Event Envelope, especificaciones por propiedad para 16 eventos, allowlists, obligatoriedad, privacidad, estrategia Stream/Batch justificada evento por evento, throttling/debounce, tratamiento de muestras intermedias, riesgos y exclusiones.
- ✅ Creado/actualizado `docs/telemetry/event-schemas.json` en Draft-07 con 16 eventos (5 obligatorios y 11 oportunidades), envelope cerrado y allowlists de propiedades cerrados seleccionados por `event_type`.
- ✅ Las categorías del contrato se alinearon con el vocabulario solicitado (`moda`, `electrónica`, `cosmética`); todos los eventos clasificados como inventario contienen `warehouse`, `client_id`, `product_id`, `product_category` y `quantity`.
- ✅ Validación del catálogo de entrega: los 16 `event_type` del esquema tienen decisión Stream o Batch y justificación por urgencia; diagnósticos del editor del plan sin errores.
- ✅ Añadida la métrica `frontend_page_load_recorded` para cubrir tiempos de carga de vistas mencionados por el README; especificada en el plan y el esquema con allowlist, privacidad, agregación y entrega Stream.
- ✅ Corregida la semántica de `api_latency_recorded` (muestra por petición Stream, agregación downstream), el mínimo de discrepancia (`quantity ≥ 1`), el caso de `unknown_sku` sin dimensiones verificables y la taxonomía de delivery (`stream`/`batch`).
- ✅ Se documentaron candidatos considerados y descartados, límites de frecuencia y las exclusiones de privacidad/costo sin añadir eventos al contrato.
- ✅ Validación estructural con el intérprete del workspace: JSON parseable; 16 nombres/definiciones/condicionales; 5/11 clasificaciones; allowlists Markdown idénticos a propiedades JSON; envelope requerido y cerrado; dimensiones obligatorias presentes; discrepancia con mínimo 1; todos los delivery normalizados a `stream` o `batch`.
- ✅ `jsonschema` instalado en el entorno local y validación formal ejecutada: el esquema pasa `Draft7Validator.check_schema` y 16/16 instancias sintéticas (una por evento) pasan el validador Draft-07 con validación de formatos.
- ✅ Capa backend seleccionada: `SKU.client_id` canónico y umbral configurable; el startup añade columnas a bases existentes y backfillea clientes históricos por nombre normalizado.
- ✅ Auditorías de conteo físico persistidas; una discrepancia crea outbox con cantidad absoluta y dirección. Conteos coincidentes también se conservan sin evento de discrepancia.
- ✅ Las entradas, salidas, cruces descendentes del umbral y rechazos explícitos de edición directa generan eventos validados contra las allowlists del JSON Schema y guardados en la transacción del ledger/auditoría.
- ✅ La API registra latencia por ruta lógica allowlisted y errores HTTP con clase/código normalizados; añade `X-Request-ID` y la persistencia de telemetría es best-effort para no alterar las respuestas.
- ✅ Login fallido registra motivo genérico y requestId, sin username/email/contraseña/IP; el login exitoso sigue pendiente porque el modelo de sesión/almacén requerido por contrato no está disponible.
- ✅ Salida rechazada por stock insuficiente registra `inventory_validation_failed` con payload allowlisted; error de telemetría no bloquea la respuesta de negocio.
- ✅ Seed local ampliado a 10 SKUs, 18 entradas y 20 salidas; incluye dos cruces de umbral y una discrepancia sintética reproducible. Prueba nueva valida persistencia e idempotencia sin ejecutar el seed de producción.
- ✅ Prueba HTTP nueva verifica correlación, privacidad y telemetría de error de inventario; prueba de seed verifica conteos/eventos e idempotencia.
- ✅ Plan de telemetría actualizado para distinguir eventos instrumentados, los aún solo diseñados y la outbox sin transporte externo.
- ✅ Persistencia outbox marcada `pending`, con `delivery=stream`; IDs de transición deterministas para evitar duplicación. Pruebas dirigidas del inventario, migración y telemetría ejecutadas.
- ⚠️ Outbox persistente, pero aún sin transportador/broker ni proceso que publique y marque eventos entregados. No es una entrega efectiva a Stream externo.
- ⚠️ `outbound_order_created` refleja el movimiento outbound disponible en la API; no acredita picking/despacho formal ni un ciclo completo de órdenes.
- ✅ Suite backend completa tras los últimos cambios: `pytest -q` (37 passed, 4 subtests passed); suite dirigida de auth HTTP: 11 passed; test de seed: 1 passed. Solo aparece advertencia deprecada Starlette/httpx preexistente.
- ✅ Diagnósticos de editor y validación de errores sin errores en modelos, esquema, router, migración, outbox y pruebas agregadas.
