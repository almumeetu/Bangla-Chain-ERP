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
 * For piece products this is pricePerPiece (= defaultWSP).
 * For carton products this is pricePerCarton.
 */
export function getTP(product: Product): number {
  return isPieceProduct(product)
    ? (product.pricePerPiece || product.defaultWSP)
    : (product.pricePerCarton || product.defaultWSP);
}

/**
 * Dealer/Purchase Price (DP) per selling unit.
 * defaultPP is always stored per-piece; for carton products multiply by cartonSize.
 */
export function getDP(product: Product): number {
  if (isPieceProduct(product)) return product.defaultPP;
  return product.defaultPP * getCartonSize(product);
}

/** MRP per selling unit. Same storage convention as DP. */
export function getMRP(product: Product): number {
  if (isPieceProduct(product)) return product.defaultMRP;
  return product.defaultMRP * getCartonSize(product);
}

// ─── Display formatters ───────────────────────────────────────────────────────

/**
 * Human-readable stock string, e.g. "104 Ctn + 8 Pcs  (2504 pcs)" or "320 Ctn".
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
 * Piece product: "104 Ctn + 8 Pcs"  |  Carton product: "320 Ctn"
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
 * Return a combined total return qty (pieces) from split carton+pcs inputs.
 * Used during challan settlement to compute total returned pieces.
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
