# TrackFlow Application

Aplicación Next.js de TrackFlow: inventario, incidencias y directorio de proveedores.

## Requisitos

- Node.js 18 o posterior y npm.
- La API de TrackFlow ejecutándose en una URL accesible.
- Un bearer token válido emitido por `POST /auth/login` y el UUID del operario. La pantalla `/login` valida el token contra `/auth/me` antes de guardar la sesión; no solicita ni almacena la contraseña.

## Puesta en marcha

```bash
cd uis/application
npm install
cp .env.example .env.local
npm run dev
```

El proxy de `/trackflow-api/*` usa `TRACKFLOW_API_URL` (por defecto `http://127.0.0.1:8000`). Abre `http://localhost:3000/login` y pega un token válido. No guardes `.env.local` ni tokens en el repositorio.

## Vistas

- `/backoffice/inventory/products`: SKU, marca cliente, almacén y stock actual; umbrales de interfaz: agotado = 0, bajo = 1–9, saludable = 10 o más.
- `/backoffice/inventory/orders/inbound`: recepción de mercancía con SKU, cantidad, referencia y almacén.
- `/backoffice/inventory/orders/outbound`: despacho o pérdida confirmada; muestra stock antes del envío, exige tracking para despacho y valida stock en cliente.
- `/backoffice/inventory/orders`: historial de solo lectura de movimientos de stock.
- `/suppliers` y `/backoffice/suppliers`: directorio de proveedores con filtros, alta y acciones de tarifa/estado.

Las rutas antiguas `/inventory/...` se conservan como alias por compatibilidad.

Las páginas operativas requieren token local y redirigen a `/login` si falta. Esto es solo una protección de UX: la API valida token y reglas de negocio en servidor.
