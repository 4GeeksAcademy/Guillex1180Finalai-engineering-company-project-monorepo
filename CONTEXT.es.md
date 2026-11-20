# Contexto — TrackFlow

**Empresa:** TrackFlow — Gestión de Última Milla y Almacenes
**Fundación:** 2009
**Sede central:** Los Ángeles, California (EE. UU.)
**Segunda sede:** Zaragoza, España
**Empleados:** ~130
**Facturación anual:** ~9 millones de euros
**Web corporativa:** https://trackflow.com

---

## Descripción del negocio

TrackFlow es un operador logístico especializado en e-commerce que ofrece tres servicios principales:

1. **Gestión de almacenes** — Almacenamiento, picking, packing e inventario en tiempo real para marcas de e-commerce. Opera almacenes en Los Ángeles y Zaragoza.
2. **Entregas de última milla** — Red de carriers certificados (UPS, FedEx, DHL, MRW, SEUR) con cobertura en EE. UU. y España, seguimiento unificado y gestión de incidencias.
3. **Logística inversa** — Gestión completa de devoluciones, inspección, reacondicionamiento e integración con plataformas de venta.

Sus clientes son marcas medianas de moda, electrónica y cosmética que venden en línea.

---

## Unidad tecnológica: TrackFlow Tech

La unidad **TrackFlow Tech** es el equipo interno de tecnología que lidera la transformación digital de la empresa. Reporta directamente al CTO **Andrés Kim**.

### Stakeholders clave

| Persona | Rol | Área |
|---------|-----|------|
| Andrés Kim | CTO | TrackFlow Tech |
| Miguel Torres | Director Comercial | Comercial |
| Ana Whitfield | Head of Warehouse Operations | Operaciones de Almacén |

---

## Hitos del proyecto

| Hito | Descripción | Estado |
|------|-------------|--------|
| HITO 1 | Sitio web corporativo público con formulario de captación de leads | ✅ Completado en `trackflow-site/` |
| HITO 2 | Fundamentos de programación (utilidades TypeScript) | ✅ Completado en `src/utils/` |
| HITO 3 | Talent Pipeline Tracker (gestión de candidaturas) | ✅ Completado en `uis/talent-pipeline-tracker/` |
| HITO 4 | Infraestructura de agentes (memory bank, reglas, skills) | 🔄 En curso |

---

## Estructura del monorepo

| Ruta | Propósito |
|------|-----------|
| `uis/` | Proyectos frontend de la empresa |
| `uis/website/` | Web corporativa pública (ruta `/`, marca y copy alineados con BRIEFING.md) |
| `uis/backoffice/` | App interna de administración (layout propio, separado del sitio público) |
| `services/` | APIs y servicios backend |
| `agents/` | Agentes e integraciones de IA para la empresa (módulos posteriores) |
| `skills/` | Skills reutilizables del flujo de trabajo de la empresa |
| `memory-bank/` | Banco de memoria del proyecto (contexto activo para agentes de IA) |
| `.agents/` | Configuración de agentes de código: reglas y skills de desarrollo |
| `src/` | Código compartido (utilidades, tipos, validaciones) |
| `packages/shared/` | Paquetes compartidos entre proyectos |
| `trackflow-site/` | Sitio web público de TrackFlow (HITO 1) |

---

## Stack tecnológico

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Servicios REST (API mock de 4Geeks Academy)
- **Tooling:** Node.js, npm, TypeScript 5.x
- **Entorno:** GitHub Codespaces / local

## Restricciones técnicas

1. No usar librerías externas de estado global (Redux, Zustand, Jotai)
2. Las etiquetas de dominio deben mapearse desde lookup tables, nunca valores crudos de API
3. El esquema de colores y branding debe ser coherente con la identidad de TrackFlow
4. Los formularios deben incluir validación completa en el cliente
5. Las carpetas del monorepo siguen los README de la plantilla — no crear árboles paralelos

---

_These instructions are also available in [English](./CONTEXT.md)._
