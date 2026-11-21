# Carpeta `services`

Esta carpeta contiene **todos los servicios backend** (APIs y workers en segundo plano) relacionados con la compañía para el proyecto transversal de AI Engineering.

Cada subcarpeta dentro de `services/` debe corresponder a **un servicio concreto** (por ejemplo `admin-api`, `data-processor-worker`) e incluir su propia documentación técnica y funcional.

- **Propósito principal**: centralizar toda la lógica backend, APIs y consumidores de colas que dan soporte a los casos de uso de la compañía.
- **Recomendación**: documenta en este archivo (o en sub-READMEs) los servicios que vayas añadiendo, su objetivo, tecnología usada y cómo ejecutarlos.

## Backend de inventario TrackFlow

API FastAPI para los almacenes de Los Ángeles (`LA`) y Zaragoza (`ZGZ`). El ledger SQLModel contiene `SKU`, `StockEntry` y `StockExit`; `current_stock` se calcula a partir de movimientos por SKU y almacén, nunca se persiste. Los tokens y la relación token/operario viven en TinyDB; no existe una tabla SQL de usuarios.

### Preparación local

Desde la raíz del monorepo:

```bash
python -m pip install -r requirements.txt
export INVENTORY_DATABASE_URL='sqlite:///./data/trackflow_inventory.db'
export TINYDB_PATH='./data/tinydb.json'
export TRACKFLOW_BOOTSTRAP_TOKEN='local-dev-token'
export TRACKFLOW_BOOTSTRAP_USER_UUID='00000000-0000-4000-8000-000000000001'
python -m services.seed
uvicorn services.main:app --reload
```

Configura el backoffice con `NEXT_PUBLIC_INVENTORY_API_URL=http://localhost:8000` y utiliza `local-dev-token` como token de sesión. El bootstrap solo escribe el hash SHA-256 del token en TinyDB, no el token en claro. Sustituye siempre las credenciales de ejemplo en entornos compartidos.

Opcionalmente define `BACKOFFICE_CORS_ORIGINS` como una lista de orígenes separados por comas. El valor por defecto permite `http://localhost:3000`.

### API

- `GET/POST /inventory/products`
- `GET /inventory/products/{id}`
- `POST /inventory/orders/inbound`
- `POST /inventory/orders/outbound`
- `GET /inventory/orders`
- `GET /health`

### Análisis de incidencias TrackFlow (HITO 6)

- `POST /api/incidents/analyze` — acepta `multipart/form-data` con el campo `file` (CSV UTF-8) y devuelve totales, inválidos por regla, categorías, estados, países y satisfacción agregada.
- `GET /api/incidents/results/export` — descarga como `text/csv` las métricas agregadas del último análisis del mismo usuario autenticado.

Ambos endpoints requieren `Authorization: Bearer <token>`. El análisis reutilizable está en `services/incidents.py` y lo invoca tanto la API como `scripts/analyze.py`. `customer_email` solo se valida; nunca se incluye en respuestas, mensajes ni CSV. El resultado del último análisis se conserva en memoria del proceso, así que debe migrarse a almacenamiento compartido si se ejecuta FastAPI con varios workers o instancias.

Las rutas de inventario requieren `Authorization: Bearer <token>` resuelto mediante la tabla `users` de TinyDB. Las entradas requieren `sku_id`, `quantity`, `reference` y `warehouse`; las salidas, `sku_id`, `quantity`, `exit_type`, `tracking_number` y `warehouse`. `user_uuid` se deriva del token autenticado. Las salidas insuficientes responden 400 con el mensaje definido en el briefing; `dispatch` requiere tracking y `loss` exige `tracking_number: null`.

### Datos de desarrollo

`python -m services.seed` crea los seis SKUs de briefing, siete recepciones (incluidas dos del SKU de LA) y cuatro salidas válidas. Es idempotente respecto a referencias y movimientos semilla existentes. La configuración por defecto usa SQLite local en `data/trackflow_inventory.db` y TinyDB en `data/tinydb.json`; ambos archivos son locales y no deben incorporarse a Git.
