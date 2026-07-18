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

import type { Product } from '../types';

// ─── Basic accessors ──────────────────────────────────────────────────────────

/** Returns carton size (pcs per carton). Only meaningful when primaryUnit === 'Piece'. */
export function getCartonSize(product: Product): number {
  return Math.max(1, product.cartonSize || (product.customUnits?.[0]?.multiplier ?? 1));
}

/** True when the product is tracked in pieces and supports carton entry. */
export function isPieceProduct(product: Product): boolean {
  return (product.primaryUnit ?? 'Piece') === 'Piece';
}

/** True when the product is tracked in cartons (no piece conversion). */
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
 * - Carton product: cartons only (pcs ignored)  → cartons
 */
export function convertInputToStock(
  product: Product,
  cartons: number,
  pcs: number = 0,
): number {
  if (isPieceProduct(product)) {
    return cartons * getCartonSize(product) + pcs;
  }
  return cartons; // carton product — no piece component
}

/**
 * Split an internal stock quantity into { cartons, pcs } for display.
 *
 * - Piece product : qty / cartonSize → cartons + remainder pcs
 * - Carton product: qty cartons, 0 pcs
 */
export function splitStockToDisplay(
  product: Product,
  qty: number,
): { cartons: number; pcs: number } {
  if (isPieceProduct(product)) {
    const cs = getCartonSize(product);
    return { cartons: Math.floor(qty / cs), pcs: qty % cs };
  }
  return { cartons: qty, pcs: 0 };
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
 * - Carton product: "320 Ctn"
 * - Piece product : "104 Ctn + 8 Pcs  (2504 pcs)"
 */
export function formatProductStock(product: Product, qty?: number): string {
  const stockQty = qty ?? product.currentStock;
  if (isCartonProduct(product)) {
    return `${stockQty.toLocaleString()} Ctn`;
  }
  const cs = getCartonSize(product);
  const ctns = Math.floor(stockQty / cs);
  const pcs  = stockQty % cs;
  const parts: string[] = [];
  if (ctns > 0) parts.push(`${ctns.toLocaleString()} Ctn`);
  if (pcs  > 0) parts.push(`${pcs} Pcs`);
  const label = parts.join(' + ') || '0 Pcs';
  return ctns > 0 ? `${label}  (${stockQty.toLocaleString()} pcs)` : label;
}

/**
 * Short quantity string for tables/badges.
 * - Carton product: "320 Ctn"
 * - Piece product : "104 Ctn + 8 Pcs"
 */
export function formatQtyShort(product: Product, qty: number): string {
  if (isCartonProduct(product)) return `${qty.toLocaleString()} Ctn`;
  const cs = getCartonSize(product);
  const ctns = Math.floor(qty / cs);
  const pcs  = qty % cs;
  if (ctns > 0 && pcs > 0) return `${ctns} Ctn + ${pcs} Pcs`;
  if (ctns > 0) return `${ctns} Ctn`;
  return `${pcs} Pcs`;
}

/**
 * Return a combined total return qty from split carton+pcs inputs.
 * Used during challan settlement to compute total returned units.
 * - Piece product : returnedCartons × cartonSize + returnedPcs  → pieces
 * - Carton product: returnedCartons only (pcs field ignored)    → cartons
 */
export function calcReturnedQty(
  product: Product,
  returnedCartons: number,
  returnedPcs: number,
): number {
  if (isPieceProduct(product)) {
    return returnedCartons * getCartonSize(product) + returnedPcs;
  }
  return returnedCartons; // carton product — pcs field ignored
}
