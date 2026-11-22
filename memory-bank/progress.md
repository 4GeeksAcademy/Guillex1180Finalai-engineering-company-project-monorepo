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
