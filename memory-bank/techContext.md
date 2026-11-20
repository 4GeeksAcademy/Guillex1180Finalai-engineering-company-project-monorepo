# Tech Context — TrackFlow

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend web | Next.js | ^14.2.0 |
| UI Runtime | React | ^18.3.0 |
| Lenguaje | TypeScript | ^5.6.0 |
| Estilos | Tailwind CSS | ^3.4.12 |
| Node.js | Runtime | 20.x |
| Package manager | npm | — |

## Dependencias permitidas (frontend)

- `next`, `react`, `react-dom` — únicas dependencias de producción permitidas
- `typescript`, `tailwindcss`, `autoprefixer`, `postcss` — tooling de desarrollo
- **Prohibido:** Redux, Zustand, Jotai o cualquier librería externa de estado global

## Estructura del monorepo

```
/
├── BRIEFING.md                     # Briefing de la empresa (TrackFlow)
├── CONTEXT.es.md                   # Contexto completo del proyecto
├── AGENTS.md                       # Protocolo de operación para agentes de IA
├── .agents/                        # Configuración de agentes de código
│   ├── rules/                      # Reglas de desarrollo (alcance explícito)
│   └── skills/                     # Skills reutilizables
├── memory-bank/                    # Banco de memoria (contexto activo)
│   ├── projectbrief.md             # Descripción del negocio y objetivos
│   ├── techContext.md              # Stack y decisiones de arquitectura
│   └── progress.md                 # Estado actual del desarrollo
├── uis/                            # Frontend de la empresa
│   ├── website/                    # Web corporativa pública (pendiente de crear)
│   ├── backoffice/                 # App interna de administración (pendiente)
│   └── talent-pipeline-tracker/    # Gestión de candidaturas (HITO 3)
├── services/                       # APIs y servicios backend
├── agents/                         # Agentes de IA para la empresa
├── skills/                         # Skills del flujo de trabajo
├── src/                            # Código compartido
│   ├── types/                      # Modelos de datos
│   └── utils/                      # Utilidades (collections, search, transformations, validations)
├── packages/shared/                # Paquetes compartidos
├── trackflow-site/                 # Sitio web público (HITO 1)
├── data/                           # Datos
├── docs/                           # Documentación
├── infra/                          # Infraestructura
├── internal/                       # Documentación interna
├── mcps/                           # MCP servers
├── scripts/                        # Scripts auxiliares
└── workflows/                      # Workflows
```

## Decisiones de arquitectura

1. **Monorepo unificado** — Todo el código de la empresa en un solo repositorio, organizado por carpetas de dominio
2. **Frontend en Next.js App Router** — Para el sitio web público y la app interna de backoffice
3. **API mock externa** — Los datos vienen de la API playground de 4Geeks Academy durante el desarrollo
4. **Componentes autónomos** — Cada componente gestiona su propio estado y llamadas API (sin prop drilling)
5. **Variables de entorno** — Configuración mediante `NEXT_PUBLIC_*` en `.env.local` (nunca commiteado)

## Restricciones técnicas

- El formulario de captación de leads debe tener validación completa en cliente
- Las etiquetas de dominio (estados, etapas) se renderizan desde lookup tables, no valores crudos de API
- El sitio web corporativo debe incluir marcado Schema.org (Organization)
- Las carpetas de app siguen los README de la plantilla — no crear árboles paralelos
- Los agentes de IA no deben modificar archivos en `uis/`, `services/`, `agents/`, `src/` ni `packages/` sin confirmación explícita del desarrollador