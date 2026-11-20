# Project Brief — TrackFlow

## Descripción del negocio

**TrackFlow** es una empresa de logística fundada en 2009 en Los Ángeles, California, con operaciones en Estados Unidos (Los Ángeles) y España (Zaragoza). La empresa ofrece servicios de gestión de almacenes, entregas de última milla y logística inversa para marcas medianas de e-commerce en los sectores de moda, electrónica y cosmética. Cuenta con aproximadamente 130 empleados y una facturación anual de ~9 millones de euros.

## Problema que resuelve

Las marcas de e-commerce necesitan externalizar su logística para escalar sin invertir en infraestructura propia. TrackFlow les ofrece una solución integrada: almacenamiento, preparación de pedidos, entregas al cliente final y gestión de devoluciones, todo con cobertura en dos mercados clave (EE. UU. y España).

## Objetivos del proyecto

1. **Sitio web corporativo público** — Presentar los servicios de TrackFlow y capturar leads cualificados de empresas interesadas en externalizar su logística.
2. **Utilidades de programación** — Construir funciones TypeScript reutilizables para procesamiento de datos logísticos (inventario, envíos, transportistas).
3. **Talent Pipeline Tracker** — Aplicación interna para gestionar candidaturas del proceso de selección de la empresa.
4. **Infraestructura de agentes** — Configurar el repositorio con banco de memoria, reglas y skills para que los agentes de IA trabajen de forma consistente.

## Stakeholders

| Persona       | Rol                          | Área           |
| ------------- | ---------------------------- | -------------- |
| Andrés Kim    | CTO                          | TrackFlow Tech |
| Miguel Torres | Director Comercial           | Comercial      |
| Ana Whitfield | Head of Warehouse Operations | Operaciones    |

## Decisiones clave

- El monorepo sigue la estructura de la plantilla de 4Geeks Academy — no crear árboles paralelos
- El código de producto frontend va en `uis/` (website público, backoffice interno)
- Las APIs y servicios backend van en `services/`
- No usar librerías de estado global externas (Redux, Zustand, Jotai)
- Las etiquetas de dominio deben mapearse desde lookup tables, nunca valores crudos de API
- Los agentes de IA deben leer el banco de memoria al inicio de cada sesión
