# TrackFlow Backoffice

Aplicación interna Next.js para operar el inventario de TrackFlow: consulta de productos y stock, registro de entradas/salidas e historial de movimientos.

## Requisitos

- Node.js 18 o posterior y npm.
- La API del HITO 5 ejecutándose en una URL accesible. En este repositorio todavía no está implementada `services/`.
- Un bearer token válido emitido por el sistema de autenticación. La pantalla `/login` solo guarda el token y el UUID del operario; no autentica credenciales ni valida sesiones.

## Puesta en marcha

```bash
cd uis/backoffice
npm install
cp .env.example .env.local
npm run dev
```

Configura `NEXT_PUBLIC_INVENTORY_API_URL` en `.env.local` con la URL base de la API (por defecto `http://localhost:8000`). Abre `http://localhost:3000/login` y pega un token válido; el UUID de operario se envía con las órdenes. No guardes `.env.local` ni tokens en el repositorio.

## Vistas

- `/backoffice/inventory/products`: SKU, marca cliente, almacén y stock actual; umbrales de interfaz: agotado = 0, bajo = 1–9, saludable = 10 o más.
- `/backoffice/inventory/orders/inbound`: recepción de mercancía con SKU, cantidad, referencia y almacén.
- `/backoffice/inventory/orders/outbound`: despacho o pérdida confirmada; muestra stock antes del envío, exige tracking para despacho y valida stock en cliente.
- `/backoffice/inventory/orders`: historial de solo lectura de movimientos de stock.

Las rutas antiguas `/inventory/...` se conservan como alias por compatibilidad.

Las solicitudes se centralizan en `src/lib/inventory.ts`; las páginas de inventario requieren que exista un token local y redirigen a `/login` si falta. Esto es solo una protección de UX: la API debe validar token, permisos, stock por SKU/almacén y todas las reglas de negocio en servidor. La aplicación no considera validado un token por el mero hecho de estar almacenado.
