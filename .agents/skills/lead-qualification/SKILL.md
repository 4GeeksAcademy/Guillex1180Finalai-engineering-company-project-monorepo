---
name: lead-qualification
objective: >
  Capturar, validar y calificar leads comerciales entrantes del formulario de contacto
  del sitio web corporativo de TrackFlow, asegurando que solo pasen a CRM los leads
  que cumplen los criterios de cualificación.
inputs:
  - FormData del formulario de contacto (nombre, email, teléfono, empresa, cargo, empleados, mensaje)
  - Lista de criterios de cualificación definidos en BRIEFING.md
outputs:
  - Lead cualificado (aprobado/rechazado) con score de 0-100
  - Notificación al equipo comercial si el score supera el umbral
  - Registro en el histórico de leads
---

# Lead Qualification Skill

## Objetivo

Evaluar la calidad de los leads entrantes del formulario web de TrackFlow y determinar si deben ser derivados al equipo comercial.

## Inputs esperados

| Campo     | Tipo   | Requerido | Descripción                        |
| --------- | ------ | --------- | ---------------------------------- |
| name      | string | Sí        | Nombre completo del contacto       |
| email     | string | Sí        | Correo electrónico                 |
| phone     | string | No        | Teléfono de contacto               |
| company   | string | Sí        | Nombre de la empresa               |
| role      | string | No        | Cargo del contacto                 |
| employees | number | Sí        | Número de empleados (para filtrar) |
| message   | string | No        | Mensaje o consulta adicional       |

## Criterios de cualificación

Un lead se considera **cualificado** si cumple TODOS estos criterios:

1. **Email válido** — Formato email estándar, sin dominios temporales (mailinator, tempmail, etc.)
2. **Empresa con nombre real** — No vacío, no genérico ("empresa", "test", "asd")
3. **Tamaño de empresa** — Entre 10 y 500 empleados (PYME mediana)
4. **Mensaje con intención** — Si hay mensaje, debe contener al menos 10 caracteres y no ser spam evidente

## Acceptance criteria

- [ ] `qualifyLead(leadData)` devuelve un objeto `{ qualified: boolean, score: number, reasons: string[] }`
- [ ] El score se calcula: +25 por email válido, +25 por empresa válida, +25 por empleados en rango, +25 por mensaje con intención
- [ ] Si `score >= 75`, el lead se considera cualificado (`qualified: true`)
- [ ] Si `score < 75`, se devuelven las razones de rechazo en `reasons[]`
- [ ] La función no tiene efectos secundarios (no envía notificaciones ni escribe a DB)

## Ejemplo de uso

```typescript
import { qualifyLead } from "./lead-qualification";

const result = qualifyLead({
  name: "María García",
  email: "maria@logistika.com",
  company: "Logistika S.L.",
  employees: 45,
  message: "Buscamos socio logístico para e-commerce en España",
});

// result: { qualified: true, score: 100, reasons: [] }
```
