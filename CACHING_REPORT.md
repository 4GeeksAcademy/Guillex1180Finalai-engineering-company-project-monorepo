# HITO 13 — Optimización de carga y caché

## Decisiones en el frontend

### Lazy loading

- **`IncidentResults`** (`uis/application/components/incidents/IncidentResults.tsx`): se importa con `next/dynamic` y solo se renderiza después de recibir un análisis. El panel contiene métricas y desgloses que no se necesitan en la vista inicial de carga del CSV, ni cuando todavía no hay resultados. Diferirlo evita descargar/renderizar esa UI en esos estados y permite mostrar un fallback mientras se carga. La justificación es condicionalidad de uso; no se midió una reducción concreta de KB del bundle.
- **`StockOrdersTable`** (`uis/application/components/inventory/StockOrdersTable.tsx`): se importa con `next/dynamic` y solo se muestra cuando la carga termina con movimientos. La tabla y su lógica de presentación no son necesarias durante el estado de carga, el error o el estado vacío. También tiene fallback visible. La justificación es que la tabla de auditoría no se necesita en todos los estados de la ruta; no se midió una reducción concreta de KB del bundle.

### Memoización

`OrdersPage` memoiza `sortedOrders`, una copia ordenada por fecha descendente, mediante `useMemo(..., [orders])`. Ordenar cuesta O(n log n), no muta el estado recibido, y no se repite en renders causados por cambios ajenos a `orders`; vuelve a calcularse cuando la lista cambia. El costo exacto de este cálculo en el navegador no se perfiló con React DevTools, por lo que el beneficio es esperado para historiales crecientes, no una mejora de render medida. El benchmark de backend de abajo no debe interpretarse como medición de este cálculo frontend.

## Decisiones en el backend

La instrumentación de timing registra método, ruta, status y duración, pero no hay un registro representativo de tráfico de producción en este workspace. Por eso, la frecuencia se expresa como expectativa de uso y no como conteo observado. Las latencias comparables disponibles proceden del benchmark local descrito más adelante.

| Endpoint                  | Costo observado en el benchmark                                                                                                                                                                                                                         | Frecuencia estimada (no telemetría)                                                                                                          | Estabilidad de datos                                                                                | Decisión                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /inventory/products` | Miss mediana 307.274 ms con 500 SKU. El handler obtiene el catálogo y calcula stock por producto consultando entradas y salidas; el costo crece con catálogo/movimientos. Hit mediana 8.930 ms, incluyendo copia y serialización.                       | Una llamada al abrir/refrescar la vista de productos; puede repetirse en varias visitas operativas. No se dispone de conteo real por minuto. | Catálogo y stock se mantienen entre escrituras, pero cambian al crear SKU o movimientos.            | Cachear 15 s por identidad autenticada; invalidar al escribir cualquier dato de inventario compartido. |
| `GET /inventory/orders`   | Miss mediana 363.149 ms con 5.000 movimientos. El handler carga entradas/salidas, resuelve SKU, combina y ordena los movimientos. Hit mediana 84.163 ms; respuesta de 1.320.992 bytes, por lo que copia profunda y serialización siguen teniendo costo. | Una llamada al abrir/refrescar el historial; puede repetirse durante revisión operativa. No hay medición de frecuencia real.                 | El historial cambia al registrar entradas/salidas y el nombre/código asociado depende del catálogo. | Cachear 10 s por identidad autenticada; invalidar al crear SKU o movimiento.                           |

La cantidad/frecuencia de llamadas no se inventa como métrica: los logs puntuales y el benchmark controlado no caracterizan el uso habitual. Se recomienda recopilar conteos por endpoint en el entorno objetivo antes de ajustar TTL o atribuir un impacto global.

## Implementación y decisiones de caché

- El middleware de medición de `services/api/main.py` registra método, ruta, status y duración usando el logger de Uvicorn.
- `GET /inventory/products` usa TTL de **15 s** y `GET /inventory/orders` TTL de **10 s** mediante caché en memoria de proceso.
- Las claves incluyen el ID de la identidad autenticada (`inventory:user:{id}:...`). No se comparten respuestas entre identidades. El cache helper devuelve copias profundas y usa expiración monotónica con bloqueo.
- Las escrituras de producto, entrada y salida invalidan el namespace completo `inventory:user:`. Es intencional: los ledgers y las existencias son compartidos; invalidar solo la identidad escritora habría dejado lecturas de otras cuentas obsoletas.
- El frontend difiere el componente `IncidentResults` hasta que existen resultados y difiere `StockOrdersTable` hasta que el historial se ha cargado. La ordenación del historial se memoiza con `useMemo` a partir de `orders`; la copia evita mutar el estado.
- La aplicación mantiene `fetch(..., cache: 'no-store')` del lado cliente. La caché añadida está en la API y no sustituye controles de autorización.

### Intercambio entre frescura y rendimiento

Los TTL de 15 s para catálogo/stock y 10 s para movimientos limitan el tiempo de vida de una respuesta que podría quedar obsoleta si una escritura se ejecuta fuera de los caminos conocidos. En las escrituras soportadas por la API, la invalidación inmediata reduce esa ventana a cero dentro del mismo proceso. Se eligieron TTL cortos porque los movimientos afectan existencias y el historial operativo debe estar razonablemente actualizado, pero las lecturas repetidas pueden reconstruir colecciones que, entre escrituras, no han cambiado. El costo del hit en órdenes sigue siendo visible por el tamaño del payload: la caché evita consultas/ordenación, no el costo de copiar y serializar una respuesta grande.

### Qué no se cacheó y por qué

- `POST /inventory/products`, `POST /inventory/orders/inbound` y `POST /inventory/orders/outbound` mutan datos y deben ejecutarse siempre; se usan como puntos de invalidación, no como respuestas cacheadas.
- Login y respuestas de sesión/usuario no se cachean: contienen información sensible o dependiente de identidad y requieren semántica de autenticación actual. Tampoco se usa una clave compartida para respuestas de inventario; aunque los datos del ledger sean compartidos, las claves de lectura siguen separadas por identidad autenticada.
- `GET /inventory/products/{id}` no se cacheó en esta iteración: no se midió su costo/frecuencia y añadir otra entrada requeriría mantener la misma política de invalidación. La prioridad se dio a las dos lecturas de colección que sí se midieron con volumen sintético.

## Benchmark reproducible

Ejecutar desde la raíz:

```bash
.venv/bin/python scripts/benchmark_inventory_cache.py --skus 500 --movements 5000 --iterations 12
```

El script crea SQLite y TinyDB temporales, genera datos sintéticos y elimina el directorio temporal al finalizar. No escribe en `data/trackflow_inventory.db`. Las solicitudes son autenticadas y pasan por la serialización HTTP FastAPI/TestClient. Para cada endpoint se limpia la caché antes de cada miss; luego se calienta una vez y se toman hits repetidos.

### Resultado observado en esta ejecución

Entorno local del workspace, TestClient en proceso, 500 SKU y 5.000 movimientos, 12 muestras por estado. Milisegundos (ms):

| Endpoint                  | Miss mediana | Miss p95\* | Hit mediana | Hit p95\* |       Respuesta |
| ------------------------- | -----------: | ---------: | ----------: | --------: | --------------: |
| `GET /inventory/products` |      307.274 |    356.188 |       8.930 |    17.201 |    75.274 bytes |
| `GET /inventory/orders`   |      363.149 |    395.814 |      84.163 |   149.404 | 1.320.992 bytes |

`p95*` es el elemento de índice `floor((n-1)*0.95)` de la lista ordenada; con 12 muestras equivale al segundo valor más alto, por lo que es una estadística exploratoria y poco estable. Estos son valores concretos de una ejecución local, no un compromiso de rendimiento ni una prueba de concurrencia/producción. El tamaño de la respuesta de órdenes explica buena parte del hit relativamente caro: sigue habiendo copia profunda y serialización JSON, aunque se evita reconstruir los resultados desde SQLite.

## Decisión y limitaciones

Los resultados de esta única ejecución indican una mejora marcada en el endpoint de productos y una mejora menor, pero medible, en órdenes. Se mantiene una caché corta y no se cachean operaciones mutables ni endpoints personales. El TTL acota el impacto de invalidaciones perdidas; en el proceso actual las escrituras conocidas invalidan inmediatamente todas las claves de inventario.

La caché es local a cada proceso y no se comparte entre workers o réplicas. Para despliegues multiproceso, reemplazarla por un backend compartido (p. ej. Redis) o aceptar explícitamente misses y ventanas de consistencia por proceso. Cualquier nuevo camino de escritura sobre SKU/entradas/salidas debe invalidar el namespace global de inventario. Cambios externos a la aplicación solo se reflejarán al expirar el TTL.

## Validación asociada

`tests/test_inventory_cache.py` cubre expiración/copia de valores, separación por identidad y actualizaciones cruzadas de usuario tras escrituras. El benchmark utiliza sus propios almacenes temporales. El resto de resultados de validación se mantiene en la salida de las tareas/pruebas de la sesión, y debe actualizarse si se repite en otro entorno.
