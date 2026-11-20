// ============================================================
// TrackFlow — Validaciones de negocio
// Hito 2: Fundamentos de Programación
// ============================================================
// Funciones validadoras para cada entidad del dominio.
// Retornan un objeto { valid: boolean, errors: string[] }
// con los errores encontrados.
// ============================================================

import {
  Product,
  Shipment,
  Carrier,
  ValidationResult,
} from "../types/models";

/**
 * Valida todas las reglas de negocio para un Product.
 */
export function validateProduct(product: Product): ValidationResult {
  const errors: string[] = [];

  // sku no debe estar vacío
  if (!product.sku || product.sku.trim().length === 0) {
    errors.push("SKU is required and must not be empty");
  }

  // weightKg debe ser > 0 y <= 100
  if (product.weightKg <= 0) {
    errors.push("Weight must be greater than 0");
  } else if (product.weightKg > 100) {
    errors.push("Weight must not exceed 100 kg");
  }

  // dimensiones deben ser > 0 y <= 200
  if (
    product.dimensions.lengthCm <= 0 ||
    product.dimensions.lengthCm > 200
  ) {
    errors.push("Length must be between 1 and 200 cm");
  }
  if (
    product.dimensions.widthCm <= 0 ||
    product.dimensions.widthCm > 200
  ) {
    errors.push("Width must be between 1 and 200 cm");
  }
  if (
    product.dimensions.heightCm <= 0 ||
    product.dimensions.heightCm > 200
  ) {
    errors.push("Height must be between 1 and 200 cm");
  }

  // stockQuantity debe ser >= 0
  if (product.stockQuantity < 0) {
    errors.push("Stock quantity must be 0 or greater");
  }

  // minStockThreshold debe ser >= 0
  if (product.minStockThreshold < 0) {
    errors.push("Min stock threshold must be 0 or greater");
  }

  // unitCostUSD debe ser > 0
  if (product.unitCostUSD <= 0) {
    errors.push("Unit cost must be greater than 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida todas las reglas de negocio para un Shipment.
 */
export function validateShipment(shipment: Shipment): ValidationResult {
  const errors: string[] = [];

  // quantity debe ser > 0
  if (shipment.quantity <= 0) {
    errors.push("Quantity must be greater than 0");
  }

  // declaredValueUSD debe ser > 0
  if (shipment.declaredValueUSD <= 0) {
    errors.push("Declared value must be greater than 0");
  }

  // distanceKm debe ser >= 0
  if (shipment.destination.distanceKm < 0) {
    errors.push("Distance must be 0 or greater");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida todas las reglas de negocio para un Carrier.
 */
export function validateCarrier(carrier: Carrier): ValidationResult {
  const errors: string[] = [];

  // baseRateUSD, ratePerKgUSD, ratePerKmUSD deben ser >= 0
  if (carrier.baseRateUSD < 0) {
    errors.push("Base rate must be 0 or greater");
  }
  if (carrier.ratePerKgUSD < 0) {
    errors.push("Rate per kg must be 0 or greater");
  }
  if (carrier.ratePerKmUSD < 0) {
    errors.push("Rate per km must be 0 or greater");
  }

  // avgDeliveryDays debe ser > 0
  if (carrier.avgDeliveryDays <= 0) {
    errors.push("Average delivery days must be greater than 0");
  }

  // onTimeRate debe estar entre 0 y 100
  if (carrier.onTimeRate < 0 || carrier.onTimeRate > 100) {
    errors.push("On-time rate must be between 0 and 100");
  }

  // maxWeightKg debe ser > 0
  if (carrier.maxWeightKg <= 0) {
    errors.push("Max weight must be greater than 0");
  }

  // operatesIn debe contener al menos 1 país
  if (!carrier.operatesIn || carrier.operatesIn.length === 0) {
    errors.push("Carrier must operate in at least one country");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}