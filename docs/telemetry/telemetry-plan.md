# Plan de telemetría — TrackFlow

**Estado:** contrato implementado parcialmente en la API; outbox local `pending`, sin transporte externo  
**Versión del contrato:** `1.0.0`  
**Ámbito:** inventario de almacén, autenticación, rendimiento (API y carga de vistas), errores y navegación del backoffice.

## 1. Objetivo y reglas de diseño

Este plan convierte las preguntas de Operaciones, Comercial y Tecnología en eventos accionables. Las cinco métricas del briefing son obligatorias; las demás son oportunidades identificadas. El alcance es el sistema de inventario y el backoffice, no el tracking de última milla.

Principios:

1. Emitir eventos de negocio en el servidor, después de confirmar el resultado de la operación. Las acciones del cliente no son fuente de verdad para mutaciones.
2. Usar taxonomía `entidad_acción`, IDs estables, timestamps UTC y esquema versionado.
3. Permitir únicamente las propiedades definidas para cada evento; rechazar o descartar claves extra antes de persistir.
4. No capturar nombres, emails, credenciales, direcciones, datos del destinatario ni contenido libre de errores.
5. Capturar el actor de forma seudónima en `userId`; el identificador debe ser opaco y no derivable de email. Limitar acceso y retención.
6. No emitir eventos duplicados al reintentar: aplicar idempotencia con el ID de la orden o la clave de deduplicación aplicable.

## 2. Dominio y estado observado

### Entidades del briefing

- **`Product`**: SKU de un único cliente B2B, con categoría. No reutilizar un `product_id` entre clientes.
- **`InboundOrder`**: recepción de mercancía de un cliente en un almacén.
- **`OutboundOrder`**: picking completado y pedido despachado a un transportista. Los eventos de este plan no incluyen transportista ni destinatario.
- **`warehouse`**: Los Ángeles o Zaragoza; en telemetría se codifica como `los_angeles` o `zaragoza`.
- **`client`**: marca propietaria del SKU; se representa mediante `client_id` opaco.

### Implementación existente y diferencias relevantes

La API registra `SKU`, `StockEntry` y `StockExit`; calcula el stock desde movimientos, impide salidas superiores al disponible y deriva `user_uuid` del usuario autenticado. La base ahora asocia cada SKU con un `client_id` canónico, permite `threshold_quantity` y conserva auditorías físicas. Las entradas/salidas continúan siendo movimientos y no necesariamente órdenes con el ciclo completo descrito por el briefing. El estado de implementación real es:

- ✅ Se mapean `LA` → `los_angeles` y `ZGZ` → `zaragoza` en la proyección de telemetría, sin cambiar el contrato de inventario.
- ✅ Existe un ID canónico de cliente asociado al SKU; no se usa el nombre como identificador del evento.
- ✅ `product_id` es una proyección del ID interno del SKU (cadena); no equivale al código SKU.
- ✅ Hay umbral configurable y auditoría física. Se emiten eventos para entradas, salidas, cruces descendentes, discrepancias y rechazos explícitos de edición directa; el rechazo de stock insuficiente también se instrumenta.
- ⚠️ No hay ciclo formal de orden/picking/despacho: `outbound_order_created` solo representa el movimiento outbound registrado y no debe interpretarse como prueba de picking o entrega al transportista.
- ⚠️ La outbox SQL persiste eventos como `pending`; todavía no hay worker, broker ni publicación externa.
- El campo `quantity` obligatorio en los cinco eventos significa unidades afectadas: cantidad recibida/despachada; para umbral, stock resultante al cruzar el límite; para discrepancia, magnitud absoluta de la diferencia (el signo se documenta adicionalmente como `discrepancy_direction`). Para un intento directo rechazado representa unidades solicitadas.

Las categorías del contrato de telemetría son exactamente `moda`, `electrónica` y `cosmética`, según este encargo. Si el backend mantiene valores internos distintos, la capa de proyección debe traducirlos antes de emitir el evento.

## 3. Flujo y puntos de instrumentación

1. El login fallido persiste `auth_login_failed` con motivo genérico y correlación de request; no se capturan email, username, contraseña ni IP. `auth_login_succeeded` aún no se instrumenta.
2. El operador consulta productos o historial. La navegación registra rutas permitidas, nunca query strings ni texto introducido.
3. El cliente envía una orden de entrada o salida. El servidor valida payload, usuario, SKU, almacén y disponibilidad; errores se agregan sin guardar el cuerpo de la petición.
4. Si se rechaza un intento de edición directa, se registra `direct_stock_edit_rejected`; la mutación no se aplica y se conserva el vínculo de auditoría disponible.
5. En una entrada aceptada, confirmar la transacción y emitir `inbound_order_created` una sola vez.
6. En una salida, validar stock; si es insuficiente, emitir `inventory_validation_failed`. Si se completa picking y despacho, confirmar y emitir `outbound_order_created`.
7. Comparar el stock resultante con el umbral configurado; emitir `stock_threshold_triggered` en el cruce de arriba hacia abajo, no en cada lectura mientras permanezca debajo. Restablecer el estado al superar el umbral.
8. Tras conteo físico o auditoría, registrar diferencia y emitir `inventory_discrepancy_detected`.
9. El middleware registra latencia por petición para rutas lógicas allowlisted y errores HTTP con códigos/clases normalizados. Los eventos frontend, cargas de vista, navegación, expiración de sesión y otros eventos del catálogo permanecen como diseño, no instrumentación activa.

### Estado de implementación por evento

| Estado                                        | Eventos                                                                                                                                                                                                                                          | Alcance actual                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Implementado en la API y persistido en outbox | `inbound_order_created`, `outbound_order_created`, `stock_threshold_triggered`, `direct_stock_edit_rejected`, `inventory_discrepancy_detected`, `inventory_validation_failed`, `auth_login_failed`, `api_latency_recorded`, `api_error_recorded` | Validación contra el contrato, persistencia local `pending` y límites de privacidad descritos en cada ruta. |
| Diseñado, sin emisor activo                   | `inbound_order_cancelled`, `auth_login_succeeded`, `session_expired`, `frontend_page_load_recorded`, `frontend_error_captured`, `backoffice_page_viewed`, `inventory_flow_abandoned`                                                             | El esquema no implica que exista instrumentación frontend o ciclo funcional asociado.                       |

Los eventos persistidos en la outbox son durables en la base local/configurada, pero el campo de entrega (`stream`/`batch`) es una decisión del contrato, no una garantía de transporte. No se debe afirmar que hay procesamiento Stream/Batch efectivo hasta desplegar y operar un consumidor.

## 4. Event Envelope común

Cada evento lleva exactamente estos campos de nivel superior:

| Campo           | Tipo               | Requisito | Definición                                                                                                                            |
| --------------- | ------------------ | --------: | ------------------------------------------------------------------------------------------------------------------------------------- |
| `eventId`       | string (UUID)      |        Sí | Identificador único de emisión. En reintentos de una misma operación de negocio debe conservarse para deduplicar.                     |
| `timestamp`     | string (date-time) |        Sí | Instante UTC en ISO 8601, por ejemplo `2026-11-24T12:30:00Z`; generado por el servidor para eventos de servidor.                      |
| `sessionId`     | string o null      |        Sí | ID opaco de sesión. `null` para eventos sin sesión, como un login fallido previo a autenticación. Nunca usar cookie/token como valor. |
| `userId`        | string o null      |        Sí | ID interno seudónimo del actor; `null` si no está autenticado. Nunca email, nombre ni token.                                          |
| `event_type`    | string             |        Sí | Uno de los 16 nombres enumerados abajo, con formato `entidad_acción`.                                                                 |
| `schemaVersion` | string             |        Sí | Versión semántica del esquema, inicialmente `1.0.0`. Cambios incompatibles incrementan major.                                         |
| `requestId`     | string o null      |        Sí | Correlación opaca generada/propagada por la API; nunca contiene URL con datos ni token. `null` para eventos sin petición asociada.    |
| `properties`    | object             |        Sí | Payload cerrado por allowlist del evento; no se aceptan propiedades adicionales.                                                      |

Los valores `null` son explícitos cuando no existe una sesión, usuario o request aplicable. Los IDs de evento se generan en origen; el consumidor debe poder deduplicar. La validación del envelope y de cada allowlist debe fallar cerrada.

## 5. Catálogo de eventos

Hay **16 eventos: 5 obligatorios y 11 oportunidades identificadas**, en cinco categorías (inventario/negocio, autenticación, rendimiento, errores y navegación). El catálogo incluye rendimiento del servidor y carga percibida por el cliente. `event-schemas.json` contiene los esquemas formales, propiedades, privacidad y modalidad de entrega.

|   # | `event_type`                     | Clase / categoría           | Disparador                                               | Hipótesis → decisión                                                                      | Entrega                                                                      |
| --: | -------------------------------- | --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
|   1 | `inbound_order_created`          | Obligatorio / inventario    | Recepción confirmada                                     | Volumen entrante por almacén y cliente → planificar capacidad y personal.                 | Stream: refleja capacidad operativa actual.                                  |
|   2 | `outbound_order_created`         | Obligatorio / inventario    | Picking completado y despacho confirmado                 | Ritmo de salidas por almacén y cliente → detectar cuellos de botella y riesgo SLA.        | Stream: detección durante el turno.                                          |
|   3 | `stock_threshold_triggered`      | Obligatorio / inventario    | Cruce descendente de stock bajo el mínimo                | Frecuencia de riesgo de quiebre por SKU → alertar cliente/equipo comercial.               | Stream: alerta accionable inmediata.                                         |
|   4 | `direct_stock_edit_rejected`     | Obligatorio / control       | Intento de mutación de stock fuera de orden, rechazado   | Intentos de saltar trazabilidad por almacén/actor → reforzar formación o permisos.        | Stream: investigar mientras ocurre.                                          |
|   5 | `inventory_discrepancy_detected` | Obligatorio / inventario    | Auditoría/conteo confirma diferencia                     | SKUs y almacenes con discrepancias → priorizar auditorías.                                | Stream: priorizar corrección; reportes agregados luego.                      |
|   6 | `inventory_validation_failed`    | Oportunidad / inventario    | Payload o regla de stock rechaza una orden               | Productos/reglas con más fallos → mejorar UX, formación o reglas.                         | Batch: análisis de tendencias diario; severidad alta puede alertarse aparte. |
|   7 | `inbound_order_cancelled`        | Oportunidad / inventario    | Orden de entrada cancelada antes de confirmarse          | Cancelaciones por almacén/cliente → ajustar planificación y proceso de recepción.         | Batch: tendencia suficiente al cierre diario.                                |
|   8 | `auth_login_failed`              | Oportunidad / autenticación | Credenciales rechazadas                                  | Volumen de fallos y patrones de abuso → reforzar protección o asistencia.                 | Stream: detectar abuso rápidamente; nunca incluir credencial/email.          |
|   9 | `auth_login_succeeded`           | Oportunidad / autenticación | Autenticación correcta y sesión creada                   | Adopción y frecuencia de acceso por rol/mercado → planificar soporte y revisar actividad. | Batch: analítica diaria; alertas de seguridad separadas.                     |
|  10 | `session_expired`                | Oportunidad / autenticación | Sesión expira y el cliente/API la reconoce               | Frecuencia de interrupción → ajustar expiración y reautenticación.                        | Batch: agregación diaria.                                                    |
|  11 | `api_latency_recorded`           | Oportunidad / rendimiento   | Finaliza una petición instrumentada                      | Latencia por ruta lógica y estado → optimizar endpoint/dependencia.                       | Stream de muestras; alertas sobre agregados por ventana.                     |
|  12 | `api_error_recorded`             | Oportunidad / errores       | API responde con error no esperado                       | Errores por servicio/ruta/clase → priorizar correcciones y rollback.                      | Stream: impacto operativo requiere detección rápida.                         |
|  13 | `frontend_page_load_recorded`    | Oportunidad / rendimiento   | La vista termina de cargar y la medición está disponible | Tiempos percibidos por vista → priorizar optimizaciones frontend.                         | Stream de muestras; alertas sobre agregados por ventana.                     |
|  14 | `frontend_error_captured`        | Oportunidad / errores       | Excepción no controlada en UI                            | Errores por vista/versión → corregir fallos visibles a operadores.                        | Batch: agrupar y deduplicar; fallo bloqueante, vía operacional existente.    |
|  15 | `backoffice_page_viewed`         | Oportunidad / navegación    | Vista de ruta lógica abierta                             | Secciones más usadas → priorizar UX y soporte.                                            | Batch: no requiere reacción en segundos.                                     |
|  16 | `inventory_flow_abandoned`       | Oportunidad / navegación    | Flujo de orden iniciado pero sin finalización en 30 min  | Puntos de abandono → simplificar formularios y mejorar instrucciones.                     | Batch: analizar embudo diario; emitir una vez por flujo.                     |

### Especificación completa de propiedades y privacidad

En todas las tablas, **requerido** significa que la clave debe estar presente en cada evento de ese tipo. No hay claves opcionales en la versión `1.0.0`. El allowlist de cada evento es exactamente la lista de la tabla: cualquier otra clave se rechaza antes de persistir o publicar. `event-schemas.json` aplica esta regla con `additionalProperties: false` en cada esquema específico.

#### `inbound_order_created` — recepción de mercancía confirmada

**Allowlist:** `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`, `order_id`.

| Propiedad          | Tipo                                             | Presencia | Descripción                                                 |
| ------------------ | ------------------------------------------------ | --------- | ----------------------------------------------------------- |
| `warehouse`        | string enum (`los_angeles`, `zaragoza`)          | Requerido | Almacén que registra la recepción.                          |
| `client_id`        | string                                           | Requerido | ID opaco de la marca propietaria del SKU.                   |
| `product_id`       | string                                           | Requerido | Identificador estable del SKU, asociado a un único cliente. |
| `product_category` | string enum (`moda`, `electrónica`, `cosmética`) | Requerido | Categoría del SKU.                                          |
| `quantity`         | integer ≥ 0                                      | Requerido | Unidades recibidas y confirmadas.                           |
| `order_id`         | string                                           | Requerido | ID opaco de InboundOrder para deduplicación.                |

**PII/sensibles:** no contiene PII prevista. `client_id`, `product_id` y `order_id` son identificadores de negocio seudónimos; no incluir proveedor, destinatario, transportista ni notas libres.

#### `outbound_order_created` — picking y despacho confirmados

**Allowlist:** `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`, `order_id`.

| Propiedad          | Tipo                                             | Presencia | Descripción                                                          |
| ------------------ | ------------------------------------------------ | --------- | -------------------------------------------------------------------- |
| `warehouse`        | string enum (`los_angeles`, `zaragoza`)          | Requerido | Almacén desde el que se despacha.                                    |
| `client_id`        | string                                           | Requerido | ID opaco de la marca propietaria del SKU.                            |
| `product_id`       | string                                           | Requerido | Identificador estable del SKU, asociado a un único cliente.          |
| `product_category` | string enum (`moda`, `electrónica`, `cosmética`) | Requerido | Categoría del SKU.                                                   |
| `quantity`         | integer ≥ 0                                      | Requerido | Unidades preparadas y despachadas.                                   |
| `order_id`         | string                                           | Requerido | ID opaco de OutboundOrder; nunca ID del pedido del consumidor final. |

**PII/sensibles:** no contiene PII prevista. No emitir destinatario, dirección, transportista, número de seguimiento ni identificador de pedido de última milla.

#### `stock_threshold_triggered` — cruce descendente del mínimo

**Allowlist:** `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`, `threshold_quantity`.

| Propiedad            | Tipo                                             | Presencia | Descripción                                              |
| -------------------- | ------------------------------------------------ | --------- | -------------------------------------------------------- |
| `warehouse`          | string enum (`los_angeles`, `zaragoza`)          | Requerido | Almacén donde se detecta el cruce.                       |
| `client_id`          | string                                           | Requerido | ID opaco de la marca propietaria del SKU.                |
| `product_id`         | string                                           | Requerido | Identificador estable del SKU.                           |
| `product_category`   | string enum (`moda`, `electrónica`, `cosmética`) | Requerido | Categoría del SKU.                                       |
| `quantity`           | integer ≥ 0                                      | Requerido | Stock disponible resultante al cruzar debajo del mínimo. |
| `threshold_quantity` | integer ≥ 0                                      | Requerido | Mínimo configurado en el instante del cruce.             |

**PII/sensibles:** no contiene PII prevista; IDs opacos de negocio. Emitir una vez por cruce de `>= threshold` a `< threshold`, sin incluir datos de reabastecimiento del destinatario.

#### `direct_stock_edit_rejected` — edición directa rechazada

**Allowlist:** `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`, `rejection_code`.

| Propiedad          | Tipo                                                                         | Presencia | Descripción                                       |
| ------------------ | ---------------------------------------------------------------------------- | --------- | ------------------------------------------------- |
| `warehouse`        | string enum (`los_angeles`, `zaragoza`)                                      | Requerido | Almacén asociado al intento.                      |
| `client_id`        | string                                                                       | Requerido | ID opaco de la marca propietaria del SKU.         |
| `product_id`       | string                                                                       | Requerido | SKU al que se intentó aplicar la mutación.        |
| `product_category` | string enum (`moda`, `electrónica`, `cosmética`)                             | Requerido | Categoría del SKU.                                |
| `quantity`         | integer ≥ 0                                                                  | Requerido | Unidades solicitadas por el intento rechazado.    |
| `rejection_code`   | string enum (`order_required`, `permission_denied`, `unsupported_operation`) | Requerido | Código normalizado de rechazo; sin mensaje libre. |

**PII/sensibles:** el actor solo se representa mediante `userId` seudónimo del envelope; no se incluyen identidad, payload de petición ni texto libre. La operación siempre queda rechazada y no altera stock.

#### `inventory_discrepancy_detected` — discrepancia confirmada por conteo/auditoría

**Allowlist:** `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`, `discrepancy_direction`, `audit_id`.

| Propiedad               | Tipo                                             | Presencia | Descripción                                                                                                 |
| ----------------------- | ------------------------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------- |
| `warehouse`             | string enum (`los_angeles`, `zaragoza`)          | Requerido | Almacén auditado.                                                                                           |
| `client_id`             | string                                           | Requerido | ID opaco de la marca propietaria del SKU.                                                                   |
| `product_id`            | string                                           | Requerido | SKU contado.                                                                                                |
| `product_category`      | string enum (`moda`, `electrónica`, `cosmética`) | Requerido | Categoría del SKU.                                                                                          |
| `quantity`              | integer ≥ 1                                      | Requerido | Magnitud absoluta positiva de la diferencia entre sistema y conteo físico; cero no constituye discrepancia. |
| `discrepancy_direction` | string enum (`system_higher`, `physical_higher`) | Requerido | Indica qué cantidad era mayor.                                                                              |
| `audit_id`              | string                                           | Requerido | ID opaco del conteo/auditoría; no identifica personas.                                                      |

**PII/sensibles:** no contiene PII prevista; no incluir notas del auditor, firmas, fotografías ni comentarios libres.

#### `inventory_validation_failed` — validación de orden fallida

**Allowlist:** `order_type`, `validation_code`, `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`.

| Propiedad          | Tipo                                                                                                                                   | Presencia | Descripción                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| `order_type`       | string enum (`inbound`, `outbound`)                                                                                                    | Requerido | Tipo de orden que falló.                                                                                                   |
| `validation_code`  | string enum (`insufficient_stock`, `invalid_quantity`, `unknown_sku`, `warehouse_mismatch`, `missing_required_field`, `invalid_state`) | Requerido | Causa normalizada de validación.                                                                                           |
| `warehouse`        | string enum (`los_angeles`, `zaragoza`)                                                                                                | Requerido | Almacén de la operación evaluada.                                                                                          |
| `client_id`        | string                                                                                                                                 | Requerido | ID opaco de la marca propietaria del SKU.                                                                                  |
| `product_id`       | string                                                                                                                                 | Requerido | SKU afectado y resuelto; para `unknown_sku`, solo emitir si las dimensiones pueden verificarse en una fuente autoritativa. |
| `product_category` | string enum (`moda`, `electrónica`, `cosmética`)                                                                                       | Requerido | Categoría del SKU afectado.                                                                                                |
| `quantity`         | integer ≥ 0                                                                                                                            | Requerido | Unidades solicitadas en la orden rechazada.                                                                                |

**PII/sensibles:** el payload de entrada y el mensaje de error pueden contener datos sensibles; se descartan. Para `unknown_sku`, emitir este evento solo si se pueden resolver y verificar las cinco dimensiones requeridas de manera fiable (por ejemplo, SKU no existente en el catálogo global pero con cliente, almacén y categoría declarados y validados por una fuente autoritativa). Si no pueden validarse, no emitir un evento que finja dimensiones: conservar el rechazo en el canal de auditoría/seguridad operacional fuera de este contrato y contabilizar solo una métrica agregada de calidad sin identificadores ni payload.

#### `inbound_order_cancelled` — orden de entrada cancelada antes de recepción

**Allowlist:** `order_id`, `client_id`, `warehouse`, `product_id`, `product_category`, `quantity`, `cancellation_code`.

| Propiedad           | Tipo                                                                                          | Presencia | Descripción                                             |
| ------------------- | --------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------- |
| `order_id`          | string                                                                                        | Requerido | ID opaco de InboundOrder.                               |
| `client_id`         | string                                                                                        | Requerido | ID opaco de la marca.                                   |
| `warehouse`         | string enum (`los_angeles`, `zaragoza`)                                                       | Requerido | Almacén planificado.                                    |
| `product_id`        | string                                                                                        | Requerido | SKU de la orden cancelada.                              |
| `product_category`  | string enum (`moda`, `electrónica`, `cosmética`)                                              | Requerido | Categoría del SKU.                                      |
| `quantity`          | integer ≥ 0                                                                                   | Requerido | Unidades planificadas en la orden de entrada cancelada. |
| `cancellation_code` | string enum (`duplicate`, `supplier_delay`, `capacity_change`, `operator_cancelled`, `other`) | Requerido | Motivo normalizado, sin comentario libre.               |

**PII/sensibles:** no se recopilan datos personales; eliminar comentarios y detalles de contacto del proveedor antes de emitir.

#### `auth_login_failed` — inicio de sesión rechazado

**Allowlist:** `failure_reason`, `client_version`.

| Propiedad        | Tipo                                                                               | Presencia | Descripción                                                      |
| ---------------- | ---------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------- |
| `failure_reason` | string enum (`invalid_credentials`, `account_disabled`, `rate_limited`, `unknown`) | Requerido | Motivo genérico, sin distinguir ni revelar si una cuenta existe. |
| `client_version` | string, máximo 40 caracteres                                                       | Requerido | Versión del cliente que inició el intento.                       |

**PII/sensibles:** el evento toca credenciales. Nunca incluir email, username, contraseña, IP, cookie, token ni valor de formulario; `sessionId` y `userId` del envelope son `null` cuando no se conocen y no deben derivarse de la entrada.

#### `auth_login_succeeded` — autenticación correcta

**Allowlist:** `role`, `warehouse`, `client_version`.

| Propiedad        | Tipo                                     | Presencia | Descripción                               |
| ---------------- | ---------------------------------------- | --------- | ----------------------------------------- |
| `role`           | string enum (`admin`, `manager`, `user`) | Requerido | Rol operativo normalizado.                |
| `warehouse`      | string enum (`los_angeles`, `zaragoza`)  | Requerido | Almacén asignado al contexto autenticado. |
| `client_version` | string, máximo 40 caracteres             | Requerido | Versión del cliente.                      |

**PII/sensibles:** identidad del actor solo como `userId` seudónimo del envelope; no incluir nombre, email, credenciales, cookie ni token.

#### `session_expired` — sesión expirada o revocada

**Allowlist:** `expiration_reason`, `client_version`.

| Propiedad           | Tipo                                                                   | Presencia | Descripción                                         |
| ------------------- | ---------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| `expiration_reason` | string enum (`idle_timeout`, `absolute_timeout`, `revoked`, `unknown`) | Requerido | Causa normalizada de expiración/revocación.         |
| `client_version`    | string, máximo 40 caracteres                                           | Requerido | Versión del cliente que reconoció el fin de sesión. |

**PII/sensibles:** no incluir token, cookie ni contenido de sesión; mantener `sessionId` opaco o `null` según disponibilidad y política de retención.

#### `api_latency_recorded` — observación de latencia de API

**Allowlist:** `route`, `method`, `status_code`, `duration_ms`.

| Propiedad     | Tipo                                                                                                                                                                                     | Presencia | Descripción                                    |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------- |
| `route`       | string enum (`inventory_products_list`, `inventory_product_detail`, `inventory_inbound_create`, `inventory_outbound_create`, `inventory_orders_list`, `auth_login`, `other_allowlisted`) | Requerido | Nombre lógico allowlisted; nunca URL completa. |
| `method`      | string enum (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)                                                                                                                                    | Requerido | Método HTTP.                                   |
| `status_code` | integer 100–599                                                                                                                                                                          | Requerido | Código de respuesta.                           |
| `duration_ms` | number ≥ 0                                                                                                                                                                               | Requerido | Duración observada en milisegundos.            |

**PII/sensibles:** sin PII prevista; eliminar query string, headers, parámetros, cuerpos y valores de usuario. Cada evento de este esquema representa una petición terminada y lleva su muestra `duration_ms`; se entrega al flujo Stream. El consumidor agrega por `route`/`method`/`status_code` en ventanas de 1 minuto (conteo e histograma/buckets suficientes para p95/p99). La muestra no es un resumen de ventana; los agregados alimentan alertas e informes. No se define un segundo tipo de evento ni se promete archivar muestras detalladas por lotes.

#### `api_error_recorded` — error normalizado de API

**Allowlist:** `route`, `method`, `status_code`, `error_code`, `error_class`.

| Propiedad     | Tipo                                                                                             | Presencia | Descripción                            |
| ------------- | ------------------------------------------------------------------------------------------------ | --------- | -------------------------------------- |
| `route`       | mismo enum lógico de `api_latency_recorded`                                                      | Requerido | Ruta lógica sin datos de URL.          |
| `method`      | string enum (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)                                            | Requerido | Método HTTP.                           |
| `status_code` | integer 400–599                                                                                  | Requerido | Estado de error de la API.             |
| `error_code`  | string, patrón `^[a-z0-9_]{1,64}$`                                                               | Requerido | Código técnico normalizado y no libre. |
| `error_class` | string enum (`validation`, `authorization`, `not_found`, `conflict`, `dependency`, `unexpected`) | Requerido | Clase genérica del error.              |

**PII/sensibles:** stack trace, mensaje bruto, cuerpo, parámetros y valores de usuario pueden contener secretos/PII y se excluyen; solo códigos normalizados.

#### `frontend_page_load_recorded` — duración de carga percibida por el cliente

**Allowlist:** `view`, `client_version`, `duration_ms`, `navigation_type`.

| Propiedad         | Tipo                                                          | Presencia | Descripción                                                                                                                                                                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `view`            | enum de vistas lógicas (el mismo de `backoffice_page_viewed`) | Requerido | Vista cargada; nunca URL ni query.                                                                                                                                                                                                                                                                                                        |
| `client_version`  | string, máximo 40 caracteres                                  | Requerido | Versión de la aplicación cliente.                                                                                                                                                                                                                                                                                                         |
| `duration_ms`     | number > 0                                                    | Requerido | Milisegundos medidos con reloj monotónico: en `initial_load`, `loadEventEnd - startTime` de `PerformanceNavigationTiming`; en `client_navigation` y `back_forward`, desde el inicio del cambio de ruta hasta el siguiente frame tras montar el contenido principal de la vista destino. No emitir si no está disponible o no es positiva. |
| `navigation_type` | enum (`initial_load`, `client_navigation`, `back_forward`)    | Requerido | Tipo normalizado de navegación asociado a la medida.                                                                                                                                                                                                                                                                                      |

**PII/sensibles:** no capturar URL completa, query, fragmento, texto introducido, identificadores de usuario ni métricas crudas de alta cardinalidad. Agregar por vista, versión y tipo de navegación en ventanas de 1 minuto; usar los agregados para comparar carga inicial y navegación interna.

#### `frontend_error_captured` — error no controlado de interfaz

**Allowlist:** `error_fingerprint`, `view`, `client_version`, `severity`.

| Propiedad           | Tipo                                                                                                                                 | Presencia | Descripción                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------------------------------------------- |
| `error_fingerprint` | string hexadecimal, patrón `^[a-f0-9]{16,64}$`                                                                                       | Requerido | Hash de firma de error previamente sanitizada. |
| `view`              | string enum (`inventory_products`, `inventory_inbound`, `inventory_outbound`, `inventory_history`, `incidents`, `other_allowlisted`) | Requerido | Vista lógica donde ocurrió.                    |
| `client_version`    | string, máximo 40 caracteres                                                                                                         | Requerido | Versión de la aplicación.                      |
| `severity`          | string enum (`error`, `fatal`)                                                                                                       | Requerido | Severidad normalizada.                         |

**PII/sensibles:** sanitizar antes de generar fingerprint; eliminar stack, URL con parámetros, DOM, texto escrito y valores del formulario. Deduplicar por fingerprint/versión.

#### `backoffice_page_viewed` — vista del backoffice abierta

**Allowlist:** `view`, `client_version`.

| Propiedad        | Tipo                                                                                                                                                       | Presencia | Descripción                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------- |
| `view`           | string enum (`inventory_products`, `inventory_inbound`, `inventory_outbound`, `inventory_history`, `incidents`, `suppliers`, `users`, `other_allowlisted`) | Requerido | Identificador lógico de vista, no URL. |
| `client_version` | string, máximo 40 caracteres                                                                                                                               | Requerido | Versión de la aplicación.              |

**PII/sensibles:** no se capturan PII; excluir URL completa, query, fragmento, búsquedas, clics individuales y contenido de formulario.

#### `inventory_flow_abandoned` — flujo de orden sin completar

**Allowlist:** `flow_id`, `order_type`, `last_stage`, `warehouse`.

| Propiedad    | Tipo                                                                                | Presencia | Descripción                                                          |
| ------------ | ----------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------- |
| `flow_id`    | string UUID                                                                         | Requerido | ID aleatorio de correlación del flujo; no es ID de orden ni usuario. |
| `order_type` | string enum (`inbound`, `outbound`)                                                 | Requerido | Tipo de flujo iniciado.                                              |
| `last_stage` | string enum (`started`, `sku_selected`, `quantity_entered`, `review`, `submission`) | Requerido | Última etapa alcanzada, sin valores introducidos.                    |
| `warehouse`  | string enum (`los_angeles`, `zaragoza`)                                             | Requerido | Almacén seleccionado para el flujo.                                  |

**PII/sensibles:** no registrar texto, cantidades introducidas, campos del formulario, nombre, email ni datos del destinatario. Emitir una vez a los 30 minutos de inactividad, salvo que la orden termine o se cancele.

### Dimensiones mínimas de los eventos de inventario

En los siete eventos de inventario diseñados se mantienen los cinco campos dimensionales: `warehouse`, `client_id`, `product_id`, `product_category`, `quantity`. El resto del allowlist se limita a las claves enumeradas en el JSON. `warehouse` solo admite `los_angeles` o `zaragoza`; no se aceptan `LA`/`ZGZ` en telemetría. `quantity` conserva la semántica específica definida en cada evento.

### Catálogo adicional: hipótesis y privacidad

- `inventory_validation_failed`: conservar únicamente `validation_code` de un enum cerrado y `order_type`; no conservar mensaje libre ni cuerpo de entrada.
- `inbound_order_cancelled`: usar ID opaco de orden y código de motivo de enum; excluir comentario libre.
- `auth_login_failed`: no guardar email, username, contraseña ni IP completa. `failure_reason` será un enum genérico; para abuso puede usarse un bucket temporal de red con retención corta, separado de este contrato.
- `auth_login_succeeded`: usar rol de enum y almacén/country code solo si es necesario; no guardar identidad directa.
- `session_expired`: solo causa de expiración de enum y versión cliente; no session token.
- `api_latency_recorded`: ruta lógica de allowlist, método, status y duraciones; excluir query string, headers y valores de parámetros.
- `frontend_page_load_recorded`: duración percibida agregada por vista/versión/tipo de navegación; no conservar URL, parámetros, valores introducidos ni muestras crudas innecesarias.
- `api_error_recorded`: clase/código normalizado y ruta lógica; no stack trace, mensaje con datos de usuario ni cuerpo HTTP en el evento de analítica.
- `frontend_error_captured`: código/fingerprint sanitizado, vista lógica y versión; eliminar stack traces y texto del DOM que pueda contener PII.
- `backoffice_page_viewed`: nombre de ruta lógico allowlisted; excluir URL completa, query, fragmento y campos de búsqueda.
- `inventory_flow_abandoned`: flow ID aleatorio y etapa enumerada; no grabar escritura, campos del formulario ni texto ingresado.

## 6. Política de entrega, frecuencia y retención

### 6.1 Definiciones y regla de decisión

- **Stream:** el evento se entrega en segundos desde la confirmación/detección porque esperar al lote retrasaría una acción durante el turno, la protección del SLA, la prevención de quiebre o la respuesta de seguridad.
- **Batch:** el evento se acumula y consolida en intervalos porque su propósito es planificación, análisis de tendencia o priorización posterior; una demora acotada no empeora una operación en curso.
- La etiqueta por evento indica su vía principal. Un evento Stream puede agregarse en ventanas antes de disparar alertas; eso reduce ruido sin retrasar la detección. Un evento Batch conserva los conteos necesarios para informar tendencias.
- Las decisiones siguientes responden a urgencia operativa/de negocio, no a conveniencia de implementación.

### 6.2 Decisión de entrega para cada evento

| `event_type`                     | Entrega    | Justificación basada en urgencia                                                                                                                                                                                                                          |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inbound_order_created`          | **Stream** | La recepción confirmada cambia el stock operativo y la capacidad disponible durante el turno; Operaciones debe ver el volumen entrante al registrarse, no al cierre diario.                                                                               |
| `outbound_order_created`         | **Stream** | El picking y despacho completados son señal del ritmo de salida y del avance del SLA; detectarlos durante el turno permite actuar ante acumulación o retraso.                                                                                             |
| `stock_threshold_triggered`      | **Stream** | La alerta debe llegar antes de que el SKU llegue a cero para permitir reabastecimiento o comunicación comercial; un lote podría llegar tarde. Emitir solo en el cruce descendente.                                                                        |
| `direct_stock_edit_rejected`     | **Stream** | Un intento de evitar órdenes trazables requiere investigación o corrección de permisos/formación mientras el actor y la operación están disponibles. El rechazo siempre precede a cualquier cambio; el stock no se modifica.                              |
| `inventory_discrepancy_detected` | **Stream** | Una diferencia confirmada afecta la confianza del stock disponible y puede afectar órdenes del turno; la alerta permite priorizar el conteo/corrección sin esperar al informe periódico.                                                                  |
| `inventory_validation_failed`    | **Batch**  | Los fallos normalizados sirven principalmente para identificar reglas, productos y fricción recurrentes y corregir UX/formación; salvo el rechazo de la orden, que ocurre síncronamente, el análisis no requiere una alerta de telemetría por cada fallo. |
| `inbound_order_cancelled`        | **Batch**  | Las cancelaciones apoyan planificación de recepción y análisis de causas; su consolidación por ventana/día es suficiente y no cambia una recepción ya cancelada.                                                                                          |
| `auth_login_failed`              | **Stream** | Una ráfaga puede indicar abuso o bloquear a operadores durante la jornada; Seguridad necesita detección rápida. La señal se limita a códigos genéricos y no identifica credenciales.                                                                      |
| `auth_login_succeeded`           | **Batch**  | El acceso correcto es útil para adopción y actividad agregada por rol/almacén, no exige actuar en segundos; los eventos se consolidan para reporte diario.                                                                                                |
| `session_expired`                | **Batch**  | La frecuencia y causa de expiración orientan el ajuste de política y UX a nivel de tendencia; no se necesita alertar cada expiración individual.                                                                                                          |
| `api_latency_recorded`           | **Stream** | Una degradación de rutas de inventario puede frenar órdenes y comprometer el SLA. Las muestras individuales alimentan agregados de 1 minuto; se alerta si los límites se incumplen, no por cada petición lenta.                                           |
| `api_error_recorded`             | **Stream** | Errores inesperados o de dependencia pueden impedir registrar entradas/salidas; conocerlos en segundos permite mitigar impacto operativo antes de que se acumulen órdenes fallidas.                                                                       |
| `frontend_page_load_recorded`    | **Stream** | Una degradación de carga puede bloquear al operador antes de registrar órdenes; agregados de ventana corta permiten detectar regresiones durante el turno, sin alertar por muestra individual.                                                            |
| `frontend_error_captured`        | **Batch**  | Los errores sanitizados se agrupan por fingerprint/versión para priorizar una corrección; salvo que el fallo impida una operación y se active un canal operacional existente, no hace falta emitir una alerta por cada excepción.                         |
| `backoffice_page_viewed`         | **Batch**  | La popularidad de vistas sirve para priorizar UX y soporte; el análisis agregado por día es suficiente, sin reacción en tiempo real a una visita individual.                                                                                              |
| `inventory_flow_abandoned`       | **Batch**  | Los abandonos se usan para localizar etapas problemáticas y mejorar formularios; el flujo ya se marca después de 30 minutos de inactividad, y su consolidación diaria basta para tomar decisiones.                                                        |

Los eventos Stream de negocio se producen en la fuente autoritativa después del commit, con `eventId` estable, correlación `requestId` y deduplicación. Para eventos transaccionales se requiere outbox o mecanismo equivalente: preservar la operación si el canal de telemetría no está disponible y reintentar sin duplicar. La caída del pipeline nunca debe revertir ni bloquear una recepción/despacho ya confirmado.

### 6.3 Throttle, debounce y agregación

Aplicar los controles a emisiones repetitivas o a notificaciones; no suprimir las cinco señales obligatorias de negocio ni alterar el ledger de stock.

| Evento / fuente                                    | Control                                                          | Parámetros orientativos                                                                                                                                   | Tratamiento de muestras intermedias                                                                                                                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backoffice_page_viewed` (cambios rápidos de ruta) | **Debounce**                                                     | Esperar 2 s desde el último cambio de ruta antes de considerar estable la vista.                                                                          | Las transiciones intermedias que el usuario abandona antes de 2 s no se emiten como vistas completadas; se conserva la última vista estable.                                                                                             |
| `backoffice_page_viewed` (misma vista repetida)    | **Throttle + deduplicación**                                     | Máximo una emisión de la misma vista por sesión cada 30 s; los cambios a una vista distinta no esperan esa ventana.                                       | Suprimir duplicados dentro de la ventana y mantener un contador agregado de repeticiones por vista/sesión/día; no guardar URL, query ni búsqueda.                                                                                        |
| `api_latency_recorded`                             | **Agregación por ventana; no throttle de la medida subyacente**  | Ventana deslizante o tumbling de 1 min por `route`, `method`, `status_code`; evaluar umbrales de latencia y alerta al cierre/actualización de la ventana. | Cada medición contribuye a contador e histograma/buckets de latencia para no sesgar p95/p99. Actualizar el agregado downstream; no emitir una alerta individual ni un evento de resumen fuera de este contrato.                          |
| `frontend_page_load_recorded`                      | **Agregación por ventana; no throttle de la muestra subyacente** | Ventana de 1 min por `view`, `client_version`, `navigation_type`; alertar solo ante umbral acordado y volumen mínimo de muestras.                         | Cada carga válida alimenta conteo e histograma; alertas/reportes usan agregados, no un evento de resumen dentro de este contrato. No conservar muestras crudas más allá de lo necesario para operar el flujo.                            |
| `api_error_recorded` (ráfaga del mismo error)      | **Throttle de notificación, no del registro sanitizado**         | Agrupar avisos repetidos por `route`, `error_code`, `error_class` en ventanas de 1 min.                                                                   | Continuar contando eventos y estado por ventana; enviar una notificación inmediata al primer error y un resumen con total/última ocurrencia al cierre o al cambiar la severidad. No descartar la evidencia necesaria para medir la tasa. |
| `frontend_error_captured`                          | **Deduplicación / throttle**                                     | Una notificación por `error_fingerprint` + `client_version` cada 5 min; agrupar el reporte por ventana de 15 min.                                         | Incrementar el contador de ocurrencias del grupo y preservar primera/última hora; no repetir stack (que no se captura) ni guardar contenido DOM/formulario.                                                                              |
| `auth_login_failed` (ráfagas)                      | **Throttle de alerta, no del contador**                          | Agrupar por `failure_reason` y ventana de 1 min; activar aviso si se supera un umbral de volumen acordado por Seguridad.                                  | Mantener conteo exacto por ventana, sin IP, username ni credenciales; el umbral limita alertas, no oculta intentos en las métricas.                                                                                                      |
| `stock_threshold_triggered`                        | **Debounce lógico por transición de estado**                     | Una emisión cuando el stock pasa de `>= threshold` a `< threshold`; rearmar cuando vuelve a `>= threshold`.                                               | No emitir por lecturas repetidas bajo mínimo. No se pierden nuevos quiebres: la recuperación rearma el siguiente cruce.                                                                                                                  |
| `inventory_flow_abandoned`                         | **Debounce de inactividad**                                      | 30 min sin actividad por `flow_id`, con un único evento por flujo.                                                                                        | Cada actividad reinicia el temporizador; suprimir si la orden se completa o cancela antes del vencimiento.                                                                                                                               |
| Eventos confirmados de órdenes y discrepancia      | **Sin throttle ni muestreo**                                     | Una vez por transición confirmada, con idempotencia por ID de orden/auditoría y evento.                                                                   | No coalescer órdenes distintas: se necesita volumen exacto por almacén, cliente y país. Reintentos se deduplican por `eventId`.                                                                                                          |

No se ha diseñado un evento de búsqueda/filtro en el catálogo actual. No registrar cada pulsación o valor de filtro. Si una hipótesis de negocio futura justifica medir ese comportamiento, deberá proponerse un nuevo evento con valores categorizados y allowlist, no ampliar implícitamente los eventos existentes.

### 6.4 Periodicidad de consolidación y retención

- Para los eventos **Stream**, entregar la señal dentro de segundos; para latencia/cargas de vista y ráfagas usar ventanas de agregación/alerta de 1 minuto cuando corresponda. Los informes ejecutivos pueden agregar las métricas por día y zona horaria local.
- Para los eventos **Batch**, consolidar telemetría cada 15 minutos para evitar colas largas y producir informes diarios; el procesamiento por lote no debe implicar conservar detalle innecesario.
- Conservar contadores/histogramas exactos necesarios para tasas y percentiles. Si se aplica muestreo exploratorio en datos técnicos no críticos, registrar tasa y denominador de muestreo y no usar la muestra para métricas de volumen de inventario.
- Retención recomendada: eventos de negocio seudónimos hasta 13 meses para comparación estacional; eventos técnicos detallados 30 días y agregados no identificables hasta 13 meses; eventos de login fallido 30 días. Ajustar a política legal corporativa antes de producción; aplicar controles de acceso y borrado.

## 7. Riesgos, dependencias y exclusiones

### Riesgos y dependencias

- La API actual no modela `client_id`, mínimos de stock, discrepancias ni todo el ciclo de una orden. No declarar esas métricas disponibles hasta añadir las fuentes autoritativas.
- Los datos semilla actuales no son un dataset de telemetría y no generan casos de umbral/discrepancia. La sugerencia del briefing (8–10 SKUs, 15–20 entradas y salidas, 2 casos de umbral, 1 discrepancia) debe cubrirse cuando se prepare el seed del dominio; no se simulan estos eventos en el plan.
- Los eventos de negocio deben ser transaccionales/idempotentes. Una emisión antes del commit puede contar operaciones fallidas; una emisión posterior sin outbox puede perder eventos si el proceso cae.
- Las identidades seudónimas aún permiten correlación. Limitar acceso, documentar finalidad y revisar retención/legalidad para Los Ángeles y Zaragoza.
- Picos de eventos de UI pueden elevar costo y sesgar métricas con muestreo; conservar tasas y denominadores al presentar resultados.
- Diferencias horarias: persistir en UTC y derivar día local de almacén en capa de reporte para comparar Estados Unidos y España sin mezclar cortes de jornada.

### Exclusiones deliberadas

- Nombre, email, teléfono, dirección, credenciales, token y contenido libre de usuarios: no necesarios para las decisiones y alto riesgo de exposición.
- Nombre, email, dirección, ID del pedido final y cualquier dato del destinatario: prohibidos en eventos de inventario; pertenecen al dominio de última milla.
- Transportista, tracking number o datos de entrega: fuera del alcance de este plan de inventario.
- Stock editable directamente: no debe instrumentarse como éxito. Solo registrar el intento rechazado, sin alterar ledger.
- Clicks/teclas individuales, grabación de sesión, contenido de formularios y URL completa: costo y riesgo de privacidad desproporcionados.
- `direct_stock_edit_rejected` se emite con sus cinco dimensiones obligatorias cuando el intento puede asociarse a un SKU y almacén. Si no es posible resolverlos, no se inventan valores ni se fuerza un evento incompleto: el intento queda en el log de auditoría/seguridad operacional, fuera de este contrato analítico, y genera una señal de calidad de datos agregada sin identificadores directos.

### Eventos considerados y descartados

Estos candidatos no forman parte de los 16 esquemas de Fase 2; se descartan para mantener un catálogo accionable y acotado:

| Candidato descartado                                                   | Motivo concreto                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direct_stock_edit_succeeded`                                          | Contradice la regla de negocio: el stock nunca se modifica fuera de `InboundOrder` u `OutboundOrder`. Solo se registra el intento rechazado; no se instrumenta una vía prohibida como éxito.                                      |
| `inventory_stock_read` por cada consulta/polling                       | Duplicaría el estado consultable en Supabase, produciría alto volumen y no responde una hipótesis distinta de las métricas de órdenes/umbral; no es un movimiento de inventario.                                                  |
| Evento por cada búsqueda, pulsación o cambio de filtro                 | Sin hipótesis/decisión definida y con alto riesgo de capturar texto o datos sensibles; los clics/teclas no aportan decisión operativa proporcional al costo.                                                                      |
| `outbound_order_picked` separado de `outbound_order_created`           | Duplicaría el ciclo de salida para las preguntas actuales; el evento obligatorio se define en picking y despacho confirmados. Un evento intermedio requeriría una hipótesis específica sobre tiempo de picking antes de añadirse. |
| Eventos de paquete entregado, tracking o selección de transportista    | Pertenecen a última milla, explícitamente fuera del alcance de inventario y de este plan.                                                                                                                                         |
| Evento genérico “cada interacción” o “cada petición” sin normalización | No tiene por sí mismo hipótesis ni decisión accionable, introduce ruido y puede multiplicar costo/cardinalidad. Las rutas y errores se limitan a enums y mediciones justificadas.                                                 |

### Exclusiones por privacidad y costo

- Prohibidos en propiedades, logs de telemetría y correlación: contraseña, token de acceso/refresh, cookie, secreto, header de autorización, payload crudo, cuerpo HTTP, texto libre de error, query string y URL con parámetros.
- Prohibidos en todo evento de inventario: nombre/email/dirección/teléfono del consumidor final, identificador de pedido final, transportista, tracking number y datos de entrega. El inventario mide SKU/cliente/almacén; la última milla queda fuera del alcance.
- Los IDs de usuario, sesión, cliente, producto y orden se tratan como seudónimos con acceso y retención limitados; nunca se derivan de email/nombre. Las identidades no autenticadas no se reconstruyen a partir de credenciales ingresadas.
- No capturar grabación de sesión, DOM, teclas, clicks granulares ni valores de filtros. Además de no estar justificados por una hipótesis actual, generan riesgo de PII y costos de almacenamiento/procesamiento desproporcionados.
- Evitar almacenar una fila detallada por cada lectura repetitiva de stock, petición de polling o reintento idéntico. La latencia y los errores se agregan/deduplican en las ventanas descritas, conservando conteos/histogramas suficientes para detectar degradación sin inundar el pipeline.
- No muestrear ni descartar las transiciones de negocio obligatorias; los límites de frecuencia solo agrupan alertas repetidas o actividad de UI/técnica, sin alterar los eventos autoritativos ni sus conteos.

## 8. Criterios de aceptación para implementación futura

- [ ] Los cinco eventos obligatorios están emitidos con nombres exactos y propiedades mínimas requeridas.
- [ ] Ningún evento de inventario incorpora transportista o datos personales del destinatario.
- [ ] Toda mutación de stock procede de orden autenticada; un rechazo directo nunca modifica stock y produce el evento correspondiente cuando se identifica.
- [ ] Evento de negocio solo se publica tras commit, con outbox/idempotencia y correlación de request.
- [ ] Umbral emite solo al cruzar de no-bajo a bajo; discrepancia procede de auditoría/conteo.
- [ ] Los 16 esquemas JSON validan envelope, tipos, enums y `additionalProperties: false`.
- [ ] El catálogo adicional cubre autenticación, rendimiento, errores y navegación y cada evento tiene una hipótesis, decisión, allowlist y modalidad de entrega.
- [ ] El dashboard agrega por almacén, cliente y país con timestamps UTC y cortes horarios locales documentados.
