// ============================================================
// TrackFlow — Operaciones de Colecciones
// Hito 2: Fundamentos de Programación
// ============================================================
// Funciones de filtrado y ordenamiento sobre arrays de
// productos y transportistas. Funciones puras que no mutan
// los arrays originales.
// ============================================================

import {
  Product,
  WarehouseLocation,
  ProductCategory,
  Carrier,
} from "../types/models";

// ── Filtrado ──

/**
 * Filtra productos que pertenecen al almacén especificado.
 * Función pura — no muta el array original.
 */
export function filterProductsByWarehouse(
  products: Product[],
  warehouse: WarehouseLocation
): Product[] {
  return products.filter((p) => p.warehouse === warehouse);
}

/**
 * Filtra productos que pertenecen a la categoría especificada.
 * Función pura — no muta el array original.
 */
export function filterProductsByCategory(
  products: Product[],
  category: ProductCategory
): Product[] {
  return products.filter((p) => p.category === category);
}

/**
 * Filtra productos cuyo stock actual es menor o igual al umbral mínimo.
 * Función pura — no muta el array original.
 */
export function filterLowStockProducts(products: Product[]): Product[] {
  return products.filter((p) => p.stockQuantity <= p.minStockThreshold);
}

// ── Ordenamiento ──

/**
 * Ordena productos por cantidad de stock (ascendente o descendente).
 * No muta el array original — retorna una copia ordenada.
 */
export function sortProductsByStock(
  products: Product[],
  order: "asc" | "desc"
): Product[] {
  return [...products].sort((a, b) => {
    if (order === "asc") {
      return a.stockQuantity - b.stockQuantity;
    }
    return b.stockQuantity - a.stockQuantity;
  });
}

/**
 * Ordena transportistas por tasa de entrega a tiempo (ascendente o descendente).
 * No muta el array original — retorna una copia ordenada.
 */
export function sortCarriersByReliability(
  carriers: Carrier[],
  order: "asc" | "desc"
): Carrier[] {
  return [...carriers].sort((a, b) => {
    if (order === "asc") {
      return a.onTimeRate - b.onTimeRate;
    }
    return b.onTimeRate - a.onTimeRate;
  });
}