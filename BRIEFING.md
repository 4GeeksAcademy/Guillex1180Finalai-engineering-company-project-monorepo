# BRIEFING.md — TrackFlow

## Hito 1: Sitio Web Público de tu Empresa

> Este documento describe tu empresa y la situación concreta para la que estás construyendo este hito. Léelo completo antes de escribir ningún código. Todo lo que construyas debe reflejar este contexto.

---

## Tu empresa

**TrackFlow** es una empresa de gestión de almacenes y entregas de última milla fundada en 2009 en Los Ángeles, Estados Unidos. Opera en dos mercados —Estados Unidos (Los Ángeles) y España (Zaragoza)— y ofrece tres servicios: gestión de almacenes para marcas de e-commerce, entregas de última milla (el último tramo desde el almacén hasta el cliente final), y logística inversa (devoluciones y reacondicionamiento de productos). Tiene aproximadamente 130 empleados y genera alrededor de 9 millones de euros en facturación anual. Sus clientes son marcas medianas de moda, electrónica y cosmética que venden en línea.

---

## Tu departamento y el problema que debes resolver

Trabajas en la unidad **TrackFlow Tech**, reportando directamente al CTO Andrés Kim. El sitio web corporativo actual de TrackFlow fue construido hace años por una agencia externa y está completamente desactualizado. No refleja que la empresa opera en dos países, no explica claramente los servicios, y no hay forma de que empresas interesadas soliciten información de manera estructurada. Miguel Torres (Director Comercial) necesita un sitio web profesional que presente los servicios de TrackFlow y capture leads de empresas potenciales que quieran externalizar su logística.

---

## Tu stakeholder

**Miguel Torres**, Director Comercial

> Hola,
>
> Necesitamos un nuevo sitio web que presente TrackFlow como lo que somos: un operador logístico serio con presencia en Estados Unidos y España. Debe explicar nuestros tres servicios principales: gestión de almacenes, última milla, y logística inversa. También necesito una página con un formulario para que empresas interesadas puedan solicitar información. Actualmente nos llegan consultas muy vagas por email y perdemos mucho tiempo calificando si son clientes reales o no. Quiero capturar: datos de la empresa, tipo de producto que manejan, volumen mensual estimado de envíos, países donde operan, y qué servicios les interesan. El sitio debe ser responsive, accesible, y optimizado para SEO. Usa Tailwind y asegúrate de que el formulario tenga validación completa.

---

## Contenido de la landing page

Tu landing page debe incluir las siguientes secciones, en este orden:

### Header
- Logo o nombre "TrackFlow"
- Navegación: Inicio | Servicios | Cobertura | Contacto

### Hero
- **Titular:** "Logística que escala con tu e-commerce"
- **Subtítulo:** "Gestión de almacenes, entregas de última milla y logística inversa en Estados Unidos y España. Más de 15 años ayudando a marcas de moda, electrónica y cosmética a crecer sin preocuparse por la operación."
- **Call to action:** Botón "Solicitar información" que enlace al formulario

### Servicios (3 columnas)
1. **Gestión de Almacenes** — Almacenamiento, picking y packing, inventario en tiempo real, operamos almacenes en Los Ángeles y Zaragoza
2. **Entregas de Última Milla** — Red de carriers certificados en ambos países, seguimiento unificado de envíos, gestión de incidencias y devoluciones
3. **Logística Inversa** — Gestión completa de devoluciones, inspección y reacondicionamiento, integración con tu plataforma de ventas

### Cobertura (2 columnas)
- **Estados Unidos:** Almacén en Los Ángeles, cobertura nacional, carriers: UPS, FedEx, DHL
- **España:** Almacén en Zaragoza, cobertura peninsular e islas, carriers: MRW, SEUR, DHL

### Por qué TrackFlow (4 beneficios)
- Operación binacional | +130 profesionales | Tecnología propia | Especialización e-commerce

### Contacto
- comercial@trackflow.com
- Los Ángeles: +1 213 555 0147
- Zaragoza: +34 976 123 456

### Footer
- © 2025 TrackFlow. Todos los derechos reservados.

---

## Campos del formulario de solicitud de información

| Campo | Tipo | Obligatorio |
|-------|------|:-----------:|
| Nombre de la empresa | text | Sí |
| Persona de contacto | text | Sí |
| Email corporativo | email | Sí |
| Teléfono | tel | Sí |
| Sitio web de la empresa | url | No |
| País de operación principal | select | Sí |
| Tipo de producto | select | Sí |
| Volumen mensual estimado de envíos | select | Sí |
| Servicios de interés | checkbox | Sí |
| ¿Actualmente trabajas con otro 3PL? | radio | Sí |
| Comentarios o necesidades específicas | textarea | No |
| Acepto política de privacidad | checkbox | Sí |

---

## Restricción específica

El formulario está diseñado para **empresas de e-commerce que buscan externalizar su logística**, no para consumidores finales. Si el volumen seleccionado es "0-100 envíos/mes", incluir un mensaje de advertencia.

---

## Schema.org markup requerido

Implementa marcado `Organization` con nombre, descripción, fecha de fundación, direcciones en Los Ángeles y Zaragoza, y punto de contacto.