/**
 * productUtils.ts — Centralised product quantity & pricing helpers.
 *
 * Business rules:
 *  - primaryUnit === 'Piece'  → stock stored in pieces, cartonSize required,
 *                               prices are per-piece (TP/DP/MRP per piece),
 *                               carton input auto-converts to pieces.
 *  - primaryUnit === 'Carton' → stock stored in cartons, NO piece conversion,
 *                               prices are per-carton, cartonSize irrelevant.
 *
 * All callers should use these helpers instead of inline math so that the
 * single-source-of-truth lives here.
 */

import type { Product, ChallanItem, Procurement, StockAdjustment } from '../types';
import { getLocalDateString } from '../components/dashboard/dashboardUtils';

// ─── Basic accessors ──────────────────────────────────────────────────────────

/** Returns carton size (pcs per carton). Stored directly on product. */
export function getCartonSize(product: Product): number {
  return Math.max(1, product.cartonSize || (product.customUnits?.[0]?.multiplier ?? 24));
}

/** True when the product is tracked in pieces and supports carton entry. */
export function isPieceProduct(product: Product): boolean {
  return (product.primaryUnit ?? 'Piece') === 'Piece';
}

/** True when the product is tracked in cartons (with support for fractional carton conversion). */
export function isCartonProduct(product: Product): boolean {
  return product.primaryUnit === 'Carton';
}

/** Unit label string, e.g. "Pcs" or "Ctn". */
export function getUnitLabel(product: Product): string {
  return isPieceProduct(product) ? 'Pcs' : 'Ctn';
}

// ─── Quantity conversion ──────────────────────────────────────────────────────

/**
 * Convert external input (cartons + loose pieces) to the internal storage unit.
 *
 * - Piece product : cartons × cartonSize + pcs  → pieces
 * - Carton product: cartons + (pcs / cartonSize) → fractional cartons
 */
export function convertInputToStock(
  product: Product,
  cartons: number,
  pcs: number = 0,
): number {
  const cs = getCartonSize(product);
  if (isPieceProduct(product)) {
    return cartons * cs + pcs;
  }
  return cartons + (pcs / cs);
}

/**
 * Split an internal stock quantity into { cartons, pcs } for display.
 *
 * - Piece product : qty / cartonSize → cartons + remainder pcs
 * - Carton product: qty cartons -> integer cartons + remainder fractional pcs
 */
export function splitStockToDisplay(
  product: Product,
  qty: number,
): { cartons: number; pcs: number } {
  const cs = getCartonSize(product);
  if (isPieceProduct(product)) {
    return { cartons: Math.floor(qty / cs), pcs: Math.round(qty % cs) };
  }
  const cartons = Math.floor(qty);
  const pcs = Math.round((qty - cartons) * cs);
  return { cartons, pcs };
}

// ─── Pricing helpers ──────────────────────────────────────────────────────────

/**
 * Trade Price (TP) — the wholesale price per selling unit.
 * - Piece product : pricePerPiece (= defaultWSP) — price per piece.
 * - Carton product: pricePerCarton — price per carton.
 */
export function getTP(product: Product): number {
  return isPieceProduct(product)
    ? (product.pricePerPiece || product.defaultWSP)
    : (product.pricePerCarton || product.defaultWSP);
}

/**
 * Trade Price (TP) per Carton.
 * - If explicit pricePerCarton > 0, returns pricePerCarton.
 * - If product.primaryUnit === 'Carton', defaultWSP is already the carton price.
 * - If product.primaryUnit === 'Piece', returns defaultWSP * cartonSize.
 */
export function getTPPerCarton(product: Product): number {
  const cs = getCartonSize(product);
  if (product.pricePerCarton && product.pricePerCarton > 0) {
    return product.pricePerCarton;
  }
  if (isCartonProduct(product)) {
    return product.defaultWSP || 0;
  }
  const pcPrice = product.pricePerPiece || product.defaultWSP || 0;
  return pcPrice * cs;
}

/**
 * Trade Price (TP) per Piece.
 * - If explicit pricePerPiece > 0, returns pricePerPiece.
 * - If product.primaryUnit === 'Piece', defaultWSP is already the piece price.
 * - If product.primaryUnit === 'Carton', returns defaultWSP / cartonSize.
 */
export function getTPPerPiece(product: Product): number {
  const cs = getCartonSize(product);
  if (product.pricePerPiece && product.pricePerPiece > 0) {
    return product.pricePerPiece;
  }
  if (isPieceProduct(product)) {
    return product.defaultWSP || 0;
  }
  const ctnPrice = product.pricePerCarton || product.defaultWSP || 0;
  return cs > 0 ? (ctnPrice / cs) : ctnPrice;
}

/**
 * Dealer/Purchase Price (DP) per selling unit.
 * defaultPP is stored per selling unit for BOTH product types:
 *   - Piece product : defaultPP = price per piece.
 *   - Carton product: defaultPP = price per carton (entered by user as DP/Ctn).
 * Do NOT multiply by cartonSize.
 */
export function getDP(product: Product): number {
  return product.defaultPP;
}

/**
 * MRP per selling unit.
 * defaultMRP is stored per selling unit for BOTH product types.
 * Do NOT multiply by cartonSize.
 */
export function getMRP(product: Product): number {
  return product.defaultMRP;
}

// ─── Valuation helpers ────────────────────────────────────────────────────────

/**
 * Stock value at TP (Trade/Wholesale Price) for a given quantity.
 * - Piece product : qty × pricePerPiece (= defaultWSP)
 * - Carton product: qty × pricePerCarton
 *
 * Uses product.currentStock when qty is omitted.
 */
export function getStockValueTP(product: Product, qty?: number): number {
  const stock = qty ?? product.currentStock;
  return stock * getTP(product);
}

/**
 * Stock value at DP (Purchase/Dealer Price) for a given quantity.
 * Works correctly for both product types because defaultPP is stored
 * per selling unit (per piece OR per carton).
 *
 * Uses product.currentStock when qty is omitted.
 */
export function getStockValueDP(product: Product, qty?: number): number {
  const stock = qty ?? product.currentStock;
  return stock * product.defaultPP;
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * Human-readable stock string.
 * - Carton product: "320 Ctn" (or formatted like "2 Ctn + 2 Pcs" if fractional)
 * - Piece product : "104 Ctn + 8 Pcs  (2504 pcs)"
 */
export function formatProductStock(product: Product, qty?: number): string {
  const stockQty = qty ?? product.currentStock;
  const cs = getCartonSize(product);
  if (isCartonProduct(product)) {
    const ctns = Math.floor(stockQty);
    const pcs = Math.round((stockQty - ctns) * cs);
    const parts: string[] = [];
    if (ctns > 0) parts.push(`${ctns.toLocaleString()} Ctn`);
    if (pcs > 0) parts.push(`${pcs} Pcs`);
    const label = parts.join(' + ') || '0 Ctn';
    return ctns > 0 && pcs > 0 ? `${label} (${stockQty.toFixed(2)} Ctn)` : label;
  }
  const ctns = Math.floor(stockQty / cs);
  const pcs  = Math.round(stockQty % cs);
  const parts: string[] = [];
  if (ctns > 0) parts.push(`${ctns.toLocaleString()} Ctn`);
  if (pcs  > 0) parts.push(`${pcs} Pcs`);
  const label = parts.join(' + ') || '0 Pcs';
  return ctns > 0 ? `${label}  (${stockQty.toLocaleString()} pcs)` : label;
}

/**
 * Short quantity string for tables/badges.
 * - Carton product: "320 Ctn" (or formatted Ctn + Pcs if fractional)
 * - Piece product : "104 Ctn + 8 Pcs"
 */
export function formatQtyShort(product: Product, qty: number): string {
  const cs = getCartonSize(product);
  if (isCartonProduct(product)) {
    const ctns = Math.floor(qty);
    const pcs = Math.round((qty - ctns) * cs);
    if (ctns > 0 && pcs > 0) return `${ctns} Ctn + ${pcs} Pcs`;
    if (ctns > 0) return `${ctns} Ctn`;
    return `${pcs} Pcs`;
  }
  const ctns = Math.floor(qty / cs);
  const pcs  = Math.round(qty % cs);
  if (ctns > 0 && pcs > 0) return `${ctns} Ctn + ${pcs} Pcs`;
  if (ctns > 0) return `${ctns} Ctn`;
  return `${pcs} Pcs`;
}

/**
 * Return a combined total return qty from split carton+pcs inputs.
 * Used during challan settlement to compute total returned units.
 * - Piece product : returnedCartons × cartonSize + returnedPcs  → pieces
 * - Carton product: returnedCartons + (returnedPcs / cartonSize) → fractional cartons
 */
export function calcReturnedQty(
  product: Product,
  returnedCartons: number,
  returnedPcs: number,
): number {
  const cs = getCartonSize(product);
  if (isPieceProduct(product)) {
    return returnedCartons * cs + returnedPcs;
  }
  return returnedCartons + (returnedPcs / cs);
}

/**
 * Calculates the historical stock quantity of a product as of targetDate (YYYY-MM-DD).
 * Accurately rolls back delivered challans, procurements, and adjustments that occurred AFTER targetDate.
 */
export function getHistoricStockForProduct(
  product: Product,
  targetDate?: string | null,
  challans: ChallanItem[] = [],
  procurements: Procurement[] = [],
  adjustments: StockAdjustment[] = []
): number {
  const normTarget = getLocalDateString(targetDate);
  if (!normTarget) return product.currentStock;

  const todayStr = getLocalDateString(new Date());
  if (normTarget >= todayStr) {
    return product.currentStock;
  }

  let stock = product.currentStock;
  const targetProdName = (product.name || '').trim().toLowerCase();

  // 1. Rollback procurements received after targetDate (subtract goods that arrived later)
  procurements.forEach(proc => {
    const procDate = getLocalDateString(proc.deliveryDate || proc.invoiceDate || proc.createdAt);
    if (procDate && procDate > normTarget) {
      const matchingItems = proc.items?.filter(i =>
        i.productId === product.id ||
        (i.productName && (i.productName || '').trim().toLowerCase() === targetProdName)
      ) || [];
      matchingItems.forEach(item => {
        const itemQty = Number(item.qty ?? (item as any).quantity) || 0;
        const itemBonus = Number(item.bonusQty) || 0;
        stock -= (itemQty + itemBonus);
      });
    }
  });

  // 2. Rollback delivered challans after targetDate (add back goods that were delivered later)
  challans.forEach(challan => {
    // Only Delivered challans reduce current stock in ERP transactions
    if (challan.status !== 'Delivered') return;
    const challanDate = getLocalDateString((challan as any).deliveryDate || challan.createdAt);
    if (challanDate && challanDate > normTarget) {
      if ((challan.productName || '').trim().toLowerCase() === targetProdName) {
        const deliveredQty = Number(challan.totalQty ?? challan.qty) || 0;
        const returned = Number(challan.returnedQty) || 0;
        const netDelivered = Math.max(0, deliveredQty - returned);
        stock += netDelivered;
      }
    }
  });

  return Math.max(0, stock);
}

