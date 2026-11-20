---
scope: always
description: >
  El agente debe leer los archivos del banco de memoria (memory-bank/) y AGENTS.md al inicio
  de cada sesión antes de escribir o modificar cualquier código.
---

# Rule: Leer contexto antes de actuar

## Alcance
Esta regla aplica **siempre** al inicio de cada sesión, sin importar el archivo o tarea.

## Comportamiento esperado

1. Al comenzar una sesión, el agente DEBE leer estos archivos en orden:
   - `memory-bank/projectbrief.md`
   - `memory-bank/techContext.md`
   - `memory-bank/progress.md`
   - `AGENTS.md`

2. Solo después de haber leído y comprendido el contexto actual, el agente puede proceder con la tarea solicitada.

3. Si alguno de estos archivos no existe o no es accesible, el agente DEBE detenerse y notificar al desarrollador antes de continuar.

## Justificación
TrackFlow es un monorepo con múltiples hitos, restricciones técnicas y decisiones de arquitectura documentadas. Saltarse la lectura del contexto puede llevar a:
- Modificar archivos protegidos sin autorización
- Introducir dependencias no permitidas
- Desalinearse con los requisitos del BRIEFING.md
- Duplicar trabajo ya completado en hitos anteriores

## Consecuencias de no cumplir la regla
- Riesgo de corrupción del código de producto (uis/, services/, src/)
- Inconsistencias en la documentación del proyecto
- Pérdida de tiempo en trabajo redundante o incorrecto