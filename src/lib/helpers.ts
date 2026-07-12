
import { UnitOfMeasure } from '../types';

/**
 * Convert base quantity to all units, sorted by multiplier ascending
 */
export function getUnitConversions(qtyBase: number, units: UnitOfMeasure[]) {
    const sortedUnits = [...units].sort((a, b) => a.multiplier - b.multiplier);
    return sortedUnits.map(unit => ({
        ...unit,
        qty: qtyBase / unit.multiplier
    }));
}

/**
 * Format quantity conversions for display
 */
export function formatUnitConversions(qtyBase: number, units: UnitOfMeasure[]) {
    const conversions = getUnitConversions(qtyBase, units);
    return conversions.map(c => {
        const qtyStr = (Number.isInteger(c.qty) 
            ? c.qty.toLocaleString() 
            : c.qty.toFixed(1));
        return `${qtyStr} ${c.symbol || c.name}`;
    }).join(' · ');
}

/**
 * Get multi‑format for tables/columns
 */
export function formatUnitConversionsMultiLine(qtyBase: number, units: UnitOfMeasure[]) {
    const conversions = getUnitConversions(qtyBase, units);
    return conversions.map(c => {
        const qtyStr = (Number.isInteger(c.qty) 
            ? c.qty.toLocaleString() 
            : c.qty.toFixed(1));
        return `${qtyStr} ${c.symbol || c.name}`;
    });
}
