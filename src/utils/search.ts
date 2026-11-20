// ============================================================
// TrackFlow — Operaciones de Búsqueda
// Hito 2: Fundamentos de Programación
// ============================================================
// Búsqueda lineal para productos por SKU y envíos por ID.
// Búsqueda binaria para productos por peso.
// ============================================================

import { Product, Shipment } from "../types/models";

/**
 * Búsqueda lineal para encontrar un producto por SKU.
 * La comparación de SKU es case-insensitive.
 * Retorna el producto si se encuentra, null en caso contrario.
 */
export function findProductBySKU(
  products: Product[],
  sku: string
): Product | null {
  const lowerSKU = sku.toLowerCase();
  const found = products.find((p) => p.sku.toLowerCase() === lowerSKU);
  return found ?? null;
}

/**
 * Búsqueda lineal para encontrar un envío por ID.
 * Retorna el envío si se encuentra, null en caso contrario.
 */
export function findShipmentById(
  shipments: Shipment[],
  id: string
): Shipment | null {
  const found = shipments.find((s) => s.id === id);
  return found ?? null;
}

/**
 * Búsqueda binaria para encontrar el índice de un producto con el peso objetivo.
 * Asume que el array ya está ordenado por peso ascendente.
 * Retorna el índice si se encuentra, -1 en caso contrario.
 */
export function binarySearchProductByWeight(
  sortedProducts: Product[],
  targetWeight: number
): number {
  let left = 0;
  let right = sortedProducts.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midWeight = sortedProducts[mid].weightKg;

    if (midWeight === targetWeight) {
      return mid;
    }

    if (midWeight < targetWeight) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}