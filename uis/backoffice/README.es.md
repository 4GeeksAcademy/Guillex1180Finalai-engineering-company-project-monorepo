# TrackFlow Backoffice

Aplicación interna Next.js para operar el inventario de TrackFlow: consulta de productos y stock, registro de entradas/salidas e historial de movimientos.

## Requisitos

- Node.js 18 o posterior y npm.
- La API de TrackFlow ejecutándose en una URL accesible (por defecto `http://127.0.0.1:8000`).
- Un bearer token válido emitido por el sistema de autenticación. La pantalla `/login` permite pegar el token; la API valida la sesión en cada solicitud.

## Puesta en marcha

```bash
cd uis/backoffice
npm install
cp .env.example .env.local
npm run dev
```

Configura `TRACKFLOW_API_URL` en `.env.local` con la URL base de la API para el proxy de Next.js (por defecto `http://127.0.0.1:8000`). La interfaz usa `/trackflow-api` como base para evitar llamadas directas del navegador al backend. Abre `http://localhost:3000/login` y pega un token válido junto con el UUID de TinyDB del operario; la API valida el token y obtiene de él la identidad autenticada. No guardes `.env.local` ni tokens en el repositorio.

## Vistas

- `/backoffice/inventory/products`: SKU, marca cliente, almacén y stock actual; umbrales de interfaz: agotado = 0, bajo = 1–9, saludable = 10 o más.
- `/backoffice/inventory/orders/inbound`: recepción de mercancía con SKU, cantidad, referencia y almacén.
- `/backoffice/inventory/orders/outbound`: despacho o pérdida confirmada; muestra stock antes del envío, exige tracking para despacho y valida stock en cliente.
- `/backoffice/inventory/orders`: historial de solo lectura de movimientos de stock.

Las rutas antiguas `/inventory/...` se conservan como alias por compatibilidad.

Las solicitudes se centralizan en `src/lib/inventory.ts`; las páginas de inventario requieren que exista un token local y redirigen a `/login` si falta. Esto es solo una protección de UX: la API valida el token, los permisos, el stock por SKU/almacén y las reglas de negocio en servidor.
