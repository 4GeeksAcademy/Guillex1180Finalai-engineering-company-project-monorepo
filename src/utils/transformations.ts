// ============================================================
// TrackFlow — Transformaciones, Scoring y Reportes
// Hito 2: Fundamentos de Programación
// ============================================================
// Cálculo de costos de envío, scoring de transportistas
// y funciones de agregación para reportes de almacén.
// ============================================================

import {
  Product,
  Shipment,
  Carrier,
  ProductCategory,
  ShipmentStatus,
  CarrierSelection,
  CarrierUsage,
} from "../types/models";

// ── Cálculo de Costos de Envío ──

/**
 * Calcula el costo total de envío basado en tarifa base,
 * peso, distancia y recargo por prioridad.
 *
 * Fórmula:
 *   subtotal = baseRate + (weightKg * ratePerKg * quantity) + (distanceKm * ratePerKm)
 *   recargo = subtotal * (0% Standard, +30% Express, +60% Same-day)
 *   total = subtotal + recargo
 *
 * Retorna el costo total redondeado a 2 decimales.
 */
export function calculateShippingCost(
  shipment: Shipment,
  product: Product,
  carrier: Carrier
): number {
  const baseCost = carrier.baseRateUSD;
  const weightCost =
    product.weightKg * carrier.ratePerKgUSD * shipment.quantity;
  const distanceCost =
    shipment.destination.distanceKm * carrier.ratePerKmUSD;

  const subtotal = baseCost + weightCost + distanceCost;

  let surcharge = 0;
  if (shipment.priority === "Express") {
    surcharge = subtotal * 0.3;
  } else if (shipment.priority === "Same-day") {
    surcharge = subtotal * 0.6;
  }

  const total = subtotal + surcharge;
  return Math.round(total * 100) / 100;
}

// ── Scoring de Transportistas ──

/**
 * Calcula un puntaje de idoneidad (0-100) para un transportista
 * basado en: país de destino, peso, prioridad, frágiles y confiabilidad.
 *
 * Retorna puntaje redondeado a 2 decimales.
 */
export function scoreCarrierForShipment(
  carrier: Carrier,
  shipment: Shipment,
  product: Product
): number {
  let score = 0;

  // 1. Opera en país de destino (20 puntos)
  if (carrier.operatesIn.includes(shipment.destination.country)) {
    score += 20;
  }

  // 2. Puede manejar peso (20 puntos)
  const totalWeight = product.weightKg * shipment.quantity;
  if (totalWeight <= carrier.maxWeightKg) {
    score += 20;
  }

  // 3. Soporta prioridad (15 puntos)
  if (carrier.acceptsPriority.includes(shipment.priority)) {
    score += 15;
  }

  // 4. Maneja frágiles (15 puntos)
  if (product.isFragile) {
    if (carrier.handlesFragile) {
      score += 15;
    }
    // Si es frágil y el carrier no lo maneja: 0
  } else {
    score += 15; // No es frágil, siempre suma
  }

  // 5. Confiabilidad (30 puntos)
  score += carrier.onTimeRate * 0.3;

  return Math.round(score * 100) / 100;
}

/**
 * Puntúa todos los transportistas para un envío, filtra los no adecuados
 * (score < 50) y selecciona el de menor costo.
 *
 * Retorna el mejor transportista con su puntaje y costo,
 * o null si no se encuentra ninguno adecuado.
 */
export function selectBestCarrier(
  carriers: Carrier[],
  shipment: Shipment,
  product: Product
): CarrierSelection | null {
  const scored = carriers
    .map((carrier) => {
      const score = scoreCarrierForShipment(carrier, shipment, product);
      const cost = calculateShippingCost(shipment, product, carrier);
      return { carrier, score, cost };
    })
    .filter((entry) => entry.score >= 50);

  if (scored.length === 0) {
    return null;
  }

  return scored.reduce((best, current) =>
    current.cost < best.cost ? current : best
  );
}

// ── Agregaciones y Reportes ──

/**
 * Retorna un conteo de productos para cada categoría.
 */
export function countProductsByCategory(
  products: Product[]
): Record<ProductCategory, number> {
  const initial: Record<ProductCategory, number> = {
    Fashion: 0,
    Electronics: 0,
    Cosmetics: 0,
    Home: 0,
    Other: 0,
  };

  return products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] ?? 0) + 1;
    return acc;
  }, initial);
}

/**
 * Calcula el valor total de todo el inventario.
 * Fórmula: suma de (stockQuantity * unitCostUSD) para todos los productos.
 * Redondeado a 2 decimales.
 */
export function calculateTotalInventoryValue(products: Product[]): number {
  const total = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.unitCostUSD,
    0
  );
  return Math.round(total * 100) / 100;
}

/**
 * Retorna la distancia promedio de todos los envíos.
 * Redondeado a 2 decimales.
 */
export function calculateAverageShipmentDistance(
  shipments: Shipment[]
): number {
  if (shipments.length === 0) {
    return 0;
  }

  const totalDistance = shipments.reduce(
    (sum, s) => sum + s.destination.distanceKm,
    0
  );
  const average = totalDistance / shipments.length;
  return Math.round(average * 100) / 100;
}

/**
 * Agrupa envíos por estado.
 * Retorna un objeto donde las claves son estados y los valores son arrays de envíos.
 */
export function groupShipmentsByStatus(
  shipments: Shipment[]
): Record<ShipmentStatus, Shipment[]> {
  const initial: Record<ShipmentStatus, Shipment[]> = {
    Pending: [],
    Assigned: [],
    "In transit": [],
    Delivered: [],
    Failed: [],
  };

  return shipments.reduce((acc, shipment) => {
    acc[shipment.status].push(shipment);
    return acc;
  }, initial);
}

/**
 * Encuentra los N transportistas más usados basado en envíos asignados.
 * Ignora envíos con carrier null.
 * Retorna ordenados por conteo de uso (más alto primero).
 */
export function findTopCarriers(
  shipments: Shipment[],
  topN: number
): CarrierUsage[] {
  const carrierCounts = shipments
    .filter((s) => s.carrier !== null)
    .reduce<Record<string, number>>((acc, s) => {
      const name = s.carrier!;
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});

  const sorted = Object.entries(carrierCounts)
    .map(([carrier, count]) => ({ carrier, count }))
    .sort((a, b) => b.count - a.count);

  return sorted.slice(0, topN);
}