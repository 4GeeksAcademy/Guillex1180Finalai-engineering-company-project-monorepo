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
