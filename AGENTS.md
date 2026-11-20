# AGENTS.md — Protocolo de operación para agentes de IA en TrackFlow

Este archivo define cómo debe operar cualquier agente de IA (Cursor, Windsurf, Claude Code, etc.) en el repositorio de TrackFlow. Léelo completo al inicio de cada sesión.

---

## 📖 Archivos que el agente debe leer al inicio de cada sesión

Antes de escribir cualquier código, el agente DEBE leer estos archivos en orden:

1. **`BRIEFING.md`** — Descripción de la empresa, stakeholders y restricciones del proyecto
2. **`CONTEXT.es.md`** — Contexto completo del proyecto (negocio + técnico)
3. **`memory-bank/projectbrief.md`** — Objetivos del proyecto y decisiones clave
4. **`memory-bank/techContext.md`** — Stack tecnológico, arquitectura y restricciones técnicas
5. **`memory-bank/progress.md`** — Estado actual del desarrollo y próximos pasos
6. **`AGENTS.md`** (este archivo) — Protocolo de operación

> Si el agente no puede acceder a alguno de estos archivos, debe detenerse y notificar al desarrollador antes de continuar.

---

## 🔄 Flujo obligatorio antes de cada commit

El agente DEBE seguir estos 5 pasos en orden antes de hacer cualquier commit:

### Paso 1: Leer contexto
Leer los archivos del banco de memoria (`memory-bank/`) para entender el estado actual del proyecto, las decisiones tomadas y las restricciones vigentes.

### Paso 2: Verificar alineación con BRIEFING.md
Confirmar que el código que se va a commiteaar está alineado con los requisitos del briefing de la empresa. Si hay discrepancias, detenerse y consultar al desarrollador.

### Paso 3: Ejecutar comprobaciones técnicas
- `npx tsc --noEmit` — Sin errores de tipos
- `npm run build` (si aplica) — Build exitoso
- Revisar lint/built-in errors del editor

### Paso 4: Actualizar memory-bank/progress.md
Reflejar los cambios realizados en el estado de desarrollo (marcar tareas completadas, actualizar próximos pasos).

### Paso 5: Hacer commit con mensaje estructurado
Usar el formato: `tipo(alcance): descripción`

Tipos permitidos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

Ejemplos:
- `feat(hito-4): agregar memory-bank con contexto de TrackFlow`
- `fix(ui): corregir validación de email en formulario de contacto`
- `docs(agents): documentar flujo pre-commit en AGENTS.md`

---

## 🚫 Carpetas y archivos protegidos

El agente NO DEBE modificar los siguientes archivos sin confirmación explícita del desarrollador:

| Ruta | Razón |
|------|-------|
| `uis/*` | Código de producto frontend — requiere revisión manual |
| `services/*` | APIs y servicios backend — cambios sensibles |
| `agents/*` | Agentes de IA para la empresa — requieren coordinación |
| `src/*` | Código compartido — cambios afectan a múltiples proyectos |
| `packages/*` | Paquetes compartidos — cambios afectan a múltiples proyectos |
| `BRIEFING.md` | Documento fuente del proyecto — cambios deben ser aprobados |
| `AGENTS.md` | Protocolo de operación — cambios deben ser aprobados |

El agente SÍ PUEDE modificar sin confirmación:

| Ruta | Razón |
|------|-------|
| `memory-bank/*` | Banco de memoria — debe mantenerse actualizado |
| `.agents/rules/*` | Reglas de desarrollo — parte de la configuración del agente |
| `.agents/skills/*` | Skills reutilizables — parte de la configuración del agente |
| `docs/*` | Documentación general |
| `*.md` (raíz, excepto BRIEFING.md y AGENTS.md) | Documentación del proyecto |

---

## 📂 Mapeo de carpetas de aplicación

Cuando se creen nuevas aplicaciones, deben ubicarse en las siguientes rutas. No crear árboles paralelos:

| Tipo | Ruta | Ejemplo |
|------|------|---------|
| Web pública | `uis/website/` | Sitio corporativo, landing pages |
| App interna | `uis/backoffice/` | Paneles de administración, dashboards |
| API o backend | `services/` | APIs REST, workers, procesamiento de datos |
| Agente IA | `agents/` | Asistentes, automatizaciones, integraciones |

---

## ⚠️ Reglas de conducta

1. No asumas nada — lee el contexto primero
2. Si algo no está claro, pregunta al desarrollador antes de decidir
3. No introduzcas dependencias externas sin autorización explícita
4. No generes código que no se alinee con el BRIEFING.md
5. Documenta siempre los cambios en `memory-bank/progress.md`
6. Respeta las restricciones del `techContext.md` (stack, arquitectura, dependencias permitidas)