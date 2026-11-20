// ============================================================
// TrackFlow — Demo / Prueba manual
// Hito 2: Fundamentos de Programación
// ============================================================
// Ejecutar con: npx tsx src/demo.ts
// ============================================================

import { Product, Shipment, Carrier } from "./types/models";
import {
  filterProductsByWarehouse,
  filterProductsByCategory,
  filterLowStockProducts,
  sortProductsByStock,
  sortCarriersByReliability,
} from "./utils/collections";
import {
  findProductBySKU,
  findShipmentById,
  binarySearchProductByWeight,
} from "./utils/search";
import {
  calculateShippingCost,
  scoreCarrierForShipment,
  selectBestCarrier,
  countProductsByCategory,
  calculateTotalInventoryValue,
  calculateAverageShipmentDistance,
  groupShipmentsByStatus,
  findTopCarriers,
} from "./utils/transformations";
import {
  validateProduct,
  validateShipment,
  validateCarrier,
} from "./utils/validations";

// ── Datos de ejemplo ──

const sampleProducts: Product[] = [
  {
    sku: "SHOE-BLK-42",
    name: "Zapatillas Negras Running - Talla 42",
    category: "Fashion",
    weightKg: 0.8,
    dimensions: { lengthCm: 35, widthCm: 22, heightCm: 12 },
    warehouse: "Los Angeles",
    stockQuantity: 45,
    minStockThreshold: 20,
    unitCostUSD: 35.0,
    isFragile: false,
    status: "Active",
  },
  {
    sku: "LAPTOP-DELL-15",
    name: "Laptop Dell 15 pulgadas",
    category: "Electronics",
    weightKg: 2.3,
    dimensions: { lengthCm: 40, widthCm: 28, heightCm: 3 },
    warehouse: "Zaragoza",
    stockQuantity: 8,
    minStockThreshold: 10,
    unitCostUSD: 650.0,
    isFragile: true,
    status: "Low stock",
  },
  {
    sku: "PERFUME-COCO-50",
    name: "Perfume Coco 50ml",
    category: "Cosmetics",
    weightKg: 0.3,
    dimensions: { lengthCm: 12, widthCm: 8, heightCm: 15 },
    warehouse: "Los Angeles",
    stockQuantity: 120,
    minStockThreshold: 30,
    unitCostUSD: 85.0,
    isFragile: true,
    status: "Active",
  },
];

const sampleCarriers: Carrier[] = [
  {
    id: "CAR-UPS",
    name: "UPS",
    operatesIn: ["United States"],
    baseRateUSD: 5.0,
    ratePerKgUSD: 1.2,
    ratePerKmUSD: 0.05,
    avgDeliveryDays: 3,
    onTimeRate: 88,
    maxWeightKg: 30,
    handlesFragile: true,
    acceptsPriority: ["Standard", "Express"],
  },
  {
    id: "CAR-SEUR",
    name: "SEUR",
    operatesIn: ["Spain"],
    baseRateUSD: 6.5,
    ratePerKgUSD: 1.5,
    ratePerKmUSD: 0.08,
    avgDeliveryDays: 2,
    onTimeRate: 92,
    maxWeightKg: 25,
    handlesFragile: true,
    acceptsPriority: ["Standard", "Express", "Same-day"],
  },
  {
    id: "CAR-DHL",
    name: "DHL Express",
    operatesIn: ["United States", "Spain"],
    baseRateUSD: 12.0,
    ratePerKgUSD: 2.0,
    ratePerKmUSD: 0.1,
    avgDeliveryDays: 1,
    onTimeRate: 95,
    maxWeightKg: 50,
    handlesFragile: true,
    acceptsPriority: ["Express", "Same-day"],
  },
];

const sampleShipment: Shipment = {
  id: "SH-2024-8821",
  sku: "LAPTOP-DELL-15",
  quantity: 1,
  origin: "Zaragoza",
  destination: {
    city: "Madrid",
    country: "Spain",
    postalCode: "28001",
    distanceKm: 320,
  },
  priority: "Express",
  declaredValueUSD: 650.0,
  carrier: null,
  status: "Pending",
  createdAt: new Date("2024-03-15"),
};

// ── Función helper para mostrar resultados ──

function printSection(title: string): void {
  console.log(`\n${"=".repeat(72)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(72)}`);
}

function printOK(label: string, value: unknown): void {
  console.log(`  ✅ ${label}: ${JSON.stringify(value)}`);
}

// ════════════════════════════════════════════════════════════
//  EJECUCIÓN DE PRUEBAS
// ════════════════════════════════════════════════════════════

console.log("\n🚚  TRACKFLOW — HITO 2: DEMO");
console.log("   Gestión de Almacenes y Transportistas\n");

// ── 1. Collections ──

printSection("📦 COLLECTIONS");

const laProducts = filterProductsByWarehouse(sampleProducts, "Los Angeles");
printOK("filterProductsByWarehouse (LA)", laProducts.length);

const fashionProducts = filterProductsByCategory(sampleProducts, "Fashion");
printOK("filterProductsByCategory (Fashion)", fashionProducts.length);

const lowStock = filterLowStockProducts(sampleProducts);
printOK("filterLowStockProducts", lowStock.map((p) => p.sku));

const sortedAsc = sortProductsByStock(sampleProducts, "asc");
printOK(
  "sortProductsByStock (asc)",
  sortedAsc.map((p) => `${p.sku}:${p.stockQuantity}`)
);

const sortedDesc = sortProductsByStock(sampleProducts, "desc");
printOK(
  "sortProductsByStock (desc)",
  sortedDesc.map((p) => `${p.sku}:${p.stockQuantity}`)
);

const carriersByReliability = sortCarriersByReliability(sampleCarriers, "desc");
printOK(
  "sortCarriersByReliability (desc)",
  carriersByReliability.map((c) => `${c.name}:${c.onTimeRate}%`)
);

// ── 2. Search ──

printSection("🔍 SEARCH");

const foundShoe = findProductBySKU(sampleProducts, "shoe-blk-42");
printOK("findProductBySKU (case-insensitive)", foundShoe?.name ?? "NOT FOUND");

const notFound = findProductBySKU(sampleProducts, "NONEXISTENT");
printOK("findProductBySKU (not found)", notFound);

const foundShipment = findShipmentById([sampleShipment], "SH-2024-8821");
printOK("findShipmentById", foundShipment?.id ?? "NOT FOUND");

// Binary search requires sorted by weight ascending
const sortedByWeight = [...sampleProducts].sort(
  (a, b) => a.weightKg - b.weightKg
);
const idxFound = binarySearchProductByWeight(sortedByWeight, 2.3);
printOK("binarySearchProductByWeight (found)", idxFound);

const idxNotFound = binarySearchProductByWeight(sortedByWeight, 99);
printOK("binarySearchProductByWeight (not found)", idxNotFound);

// ── 3. Transformations & Scoring ──

printSection("💰 TRANSFORMATIONS & SCORING");

const laptop = sampleProducts[1]; // LAPTOP-DELL-15
const seur = sampleCarriers[1]; // SEUR

const cost = calculateShippingCost(sampleShipment, laptop, seur);
printOK("calculateShippingCost (SEUR + Express)", `$${cost}`);

const dhl = sampleCarriers[2];
const costDHL = calculateShippingCost(sampleShipment, laptop, dhl);
printOK("calculateShippingCost (DHL + Express)", `$${costDHL}`);

const ups = sampleCarriers[0];
const costUPS = calculateShippingCost(sampleShipment, laptop, ups);
printOK("calculateShippingCost (UPS + Express)", `$${costUPS}`);

const scoreSeur = scoreCarrierForShipment(seur, sampleShipment, laptop);
printOK("scoreCarrierForShipment (SEUR)", scoreSeur);

const scoreDHL = scoreCarrierForShipment(dhl, sampleShipment, laptop);
printOK("scoreCarrierForShipment (DHL)", scoreDHL);

const best = selectBestCarrier(sampleCarriers, sampleShipment, laptop);
if (best) {
  printOK("selectBestCarrier", `${best.carrier.name} | score:${best.score} | cost:$${best.cost}`);
} else {
  printOK("selectBestCarrier", "NONE");
}

// ── 4. Aggregations ──

printSection("📊 AGREGACIONES Y REPORTES");

const categoryCount = countProductsByCategory(sampleProducts);
printOK("countProductsByCategory", categoryCount);

const totalValue = calculateTotalInventoryValue(sampleProducts);
printOK("calculateTotalInventoryValue", `$${totalValue}`);

const sampleShipments: Shipment[] = [
  sampleShipment,
  {
    ...sampleShipment,
    id: "SH-2024-8822",
    status: "In transit",
    carrier: "SEUR",
  },
  {
    ...sampleShipment,
    id: "SH-2024-8823",
    status: "Delivered",
    carrier: "DHL Express",
  },
  {
    ...sampleShipment,
    id: "SH-2024-8824",
    status: "Delivered",
    carrier: "SEUR",
  },
];

const avgDistance = calculateAverageShipmentDistance(sampleShipments);
printOK("calculateAverageShipmentDistance", `${avgDistance} km`);

const grouped = groupShipmentsByStatus(sampleShipments);
printOK("groupShipmentsByStatus (Delivered)", grouped["Delivered"].length);
printOK("groupShipmentsByStatus (Pending)", grouped["Pending"].length);

const topCarriers = findTopCarriers(sampleShipments, 2);
printOK("findTopCarriers", topCarriers);

// ── 5. Validations ──

printSection("✅ VALIDACIONES");

const validProd = validateProduct(sampleProducts[0]);
printOK("validateProduct (valid)", validProd);

const invalidProduct: Product = {
  sku: "",
  name: "Invalid",
  category: "Other",
  weightKg: 0,
  dimensions: { lengthCm: -1, widthCm: 0, heightCm: 250 },
  warehouse: "Los Angeles",
  stockQuantity: -5,
  minStockThreshold: -1,
  unitCostUSD: 0,
  isFragile: false,
  status: "Active",
};
const invalidProd = validateProduct(invalidProduct);
printOK("validateProduct (invalid)", invalidProd);

const validShip = validateShipment(sampleShipment);
printOK("validateShipment (valid)", validShip);

const validCar = validateCarrier(sampleCarriers[0]);
printOK("validateCarrier (valid)", validCar);

console.log("\n✅  Todas las pruebas completadas.\n");