# Bangla-Chain ERP — Profit Calculation Formulas
## Complete Reference, Sorted by Module

---

## FOUNDATION — Data Model Primitives

### Product Price Fields (from `Product` type)
| Field         | Meaning                                    | Aliases          |
|---------------|--------------------------------------------|------------------|
| `defaultPP`   | Purchase Price / Import Price (cost basis) | DP, PP, Cost     |
| `defaultWSP`  | Wholesale Supply Price / Trade Price       | TP, WSP          |
| `defaultMRP`  | Maximum Retail Price                       | MRP, Retail      |

### Challan (Sales Document) Fields (from `ChallanItem` type)
| Field             | Meaning                                                   |
|-------------------|-----------------------------------------------------------|
| `qty`             | Gross quantity dispatched                                 |
| `returnedQty`     | Quantity returned by customer (inflow reversal)           |
| `damagedQty`      | Quantity damaged in transit (non-sellable, non-returned)  |
| `rate`            | Trade Price (TP) charged to customer per unit             |
| `commissionAmount`| Pro-rated deduction (SR commission, etc.)                 |
| `extraProfitAmount` | Pro-rated addition (owner's extra share)                |
| `totalAmount`     | **Final invoice amount** (after ± adjustments)            |

### Derived Net Quantity (used in Sales & COGS)
```
Net Delivered / Sold Qty = MAX(0, qty − returnedQty)
```
> **Note on Damage:** `damagedQty` is tracked strictly as a separate physical stock register (in `damaged_stock` godown and company claim tracking). It does NOT reduce sales revenue or alter the COGS / profit of delivered sales.

---

## TIER 1 — CHALLAN-LEVEL (Item Construction)
### Source: [ChallanModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ChallanModule.tsx#L535-L562)

### 1.1 Challan Item TotalAmount (Pro-Rata Distribution)
At the moment a challan is created, header-level Commission and Extra Profit are spread **proportionally** across each line item:

```
totalGross      = Σ (item.qty × item.rate)           across all items

Per item:
  baseAmount    = item.qty × item.rate
  share         = baseAmount / totalGross            (pro-rata weight)
  itemComm      = challanCommission × share
  itemExtraProf = challanExtraProfit × share
  totalAmount   = baseAmount − itemComm + itemExtraProf
```

**Meaning:** `ChallanItem.totalAmount` is the **net revenue** per line after deducting commission and adding extra profit. This is the canonical revenue number used everywhere downstream.

---

## TIER 2 — CHALLAN SETTLEMENT (Owner Net Take)
### Source: [ChallanModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ChallanModule.tsx#L479-L510)

### 2.1 Settlement Calculation (Order-Level Delivery Close)
```
// Step 1 — Per-item net of line-item commission (NOT settlement commission)
itemNet           = soldVal − (item.commissionAmount || 0)
totalNetValue     = Σ itemNet                         across all items

// Step 2 — Settlement-stage deductions & additions (entered manually)
srCommission      = settlementSRCommValue             (SR share deduction)
dsrCommission     = settlementDSRCommRate             (DSR fixed deduction)
extraProfit       = settlementExtraCommValue          (+ addition to owner)
deliveryManPay    = 0                                 (reserved, always 0)

// Step 3 — Final owner net take
netToOwner = totalNetValue − srCommission − dsrCommission − deliveryManPay + extraProfit
```

**Important:** This is a **cash-settlement** concept (how much the SR must hand over to the owner). It is **NOT** the accounting profit (COGS is not subtracted here).

---

## TIER 3 — DAILY PROFIT (Dashboard, Today / Yesterday)
### Source: [dashboardUtils.ts](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/dashboard/dashboardUtils.ts#L124-L150)

### 3.1 Revenue (Sum of Sales)
```
sumSales(list) = Σ challan.totalAmount     for all challans in date bucket
```

### 3.2 COGS — Per-Challan Itemized (Per-Unit DP Method)
```
sumCOGS(list) = Σ per challan:
  pp       = product.defaultPP            OR   fallback: challan.rate × 0.65
  netQty   = MAX(0, qty − returnedQty)
  contribution = netQty × pp
```
**Fallback note:** `rate × 0.65` assumes a 35% gross margin when product lookup fails.

### 3.3 Today's / Yesterday's Net Profit
```
Expenses(date) = Σ expense.amount        where expenseDate matches

todaysNetProfit    = todaysSales    − todaysCOGS    − todaysExpenses
yesterdaysNetProfit= yesterdaysSales − yesterdaysCOGS − yesterdaysExpenses
```

### 3.4 Day-over-Day Change Percentages
```
salesChange%  = ySales>0  ? ((tSales − ySales) / ySales) × 100  : tSales>0 ? 100 : 0

profitChange% = yProf≠0  ? ((tProf  − yProf)  / |yProf|) × 100 : tProf>0  ? 100 : 0
```

---

## TIER 4 — CUMULATIVE NET PROFIT (Dashboard All-Time)
### Source: [dashboardUtils.ts](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/dashboard/dashboardUtils.ts#L147-L150)

### 4.1 Purchase-Accounting Methodology (NOT Per-Unit DP)
This is a **different formula** from daily profit — it uses full procurement invoice totals instead of catalog DP:

```
totalSales           = Σ ALL challans.totalAmount
totalProcurementCost = Σ ALL procurements.globalTotal    (includes carriage, discounts, bonus items)
totalExpensesCost    = Σ ALL expenses.amount

netProfit = totalSales − totalProcurementCost − totalExpensesCost
```

**KPI Card label:** "Sales − Purchase − Expenses"

**Why different?** Procurement `globalTotal` includes landed costs (transport, carriage) and reflects bulk-discount pricing. The per-unit DP approach uses only the catalog purchase price. These two numbers will **not** match exactly — that's by design.

---

## TIER 5 — REPORTS MODULE — PROFIT TAB (Company-wise)
### Source: [ReportsModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ReportsModule.tsx#L584-L621)

### 5.1 Per-Company Revenue, COGS, Profit, Margin %
```
revenue = Σ companyChallans.totalAmount

costOfGoods = Σ per challan:
  dp     = product.defaultPP         OR   fallback: challan.rate × 0.85
  netQty = qty − returnedQty − damagedQty
  contribution = netQty × dp

profit  = revenue − costOfGoods
margin% = revenue > 0 ? (profit / revenue) × 100 : 0
```
**Fallback note:** `rate × 0.85` assumes 15% gross margin (different from dashboard's 35% fallback).

**Grand Totals:**
```
grandRevenue = Σ company.revenue
grandCost    = Σ company.costOfGoods
grandProfit  = Σ company.profit
```

**Margin type:** This is **margin-on-revenue** (Gross Margin %).

---

## TIER 6 — REPORTS MODULE — DAY-END SETTLEMENT TAB (Product-wise)
### Source: [ReportsModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ReportsModule.tsx#L689-L726)

### 6.1 Day-End Stock & Profit (Per Product)
```
salesQty      = Σ (qty − returnedQty − damagedQty)    for that product
salesAmt      = Σ challan.totalAmount                 for that product

grossQty      = Σ challan.qty                         for that product (gross dispatched)
openingStock  = currentStock + grossQty               (reverse-engineer opening)
closingStock  = currentStock                          (end-of-day position)

stockAmt      = closingStock × product.defaultPP      (closing stock @ cost)
costOfSales   = salesQty     × product.defaultPP      (COGS @ DP)
profit        = salesAmt     − costOfSales

profitPct     = costOfSales > 0 ? (profit / costOfSales) × 100 : 0
```

**Margin type:** This is **markup-on-cost** (NOT margin-on-revenue — it's profit / cost, not profit / revenue).

---

## TIER 7 — REPORTS MODULE — MARGIN TOOL TAB (DP/TP Variance)
### Source: [ReportsModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ReportsModule.tsx#L626-L645)

### 7.1 Product-Level Pricing Variance (Theoretical Margin)
```
dp       = product.defaultPP     (cost)
tp       = product.defaultWSP    (selling price to trade)
mrp      = product.defaultMRP

variance = tp − dp              (absolute per-unit gross profit)

marginPct = dp > 0 ? (variance / dp) × 100 : 0
```

**Margin type:** This is **markup-on-cost** (profit as % of cost, not revenue). A 20% markup here means "for every ৳1 of cost, I make ৳0.20 gross."

---

## TIER 8 — ACCOUNTING MODULE — Date-Range Profit Report
### Source: [AccountingModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/AccountingModule.tsx#L108-L153)

### 8.1 Date-Filtered Purchase-Accounting Profit
Similar to Dashboard cumulative, but filtered by explicit date range:

```
// Filter challans — only DELIVERED status, within [fromDate, toDate]
validChallans = filter challans: status='Delivered' AND date∈range

totalSoldQty   = Σ MAX(0, qty − returnedQty − damagedQty)   from validChallans
totalSellAmt   = Σ challan.totalAmount                      from validChallans

// Filter procurements — by invoiceDate ∈ [fromDate, toDate]
totalPurchaseQty = Σ (item.qty + item.bonusQty)              from validProc items
totalPurchaseAmt = Σ procurement.globalTotal                 from validProc

// Filter expenses — expenseDate ∈ [fromDate, toDate]
totalExpensesAmt = Σ expense.amount                          from validExp

netProfit = totalSellAmt − totalPurchaseAmt − totalExpensesAmt
```

**Note:** Bonus quantities are counted in `totalPurchaseQty` but not added to cost — `globalTotal` already reflects the actual invoice (bulk pricing already accounts for free bonus units).

---

## TIER 9 — REPORTS MODULE — SALES TAB (COGS Subtotals)
### Source: [ReportsModule.tsx](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/components/ReportsModule.tsx#L370-L505)

Computed identically across 5 aggregation views (Company-wise, SR-wise, DM-wise, Product-wise, UOM-wise):

```
netQty  = qty − returnedQty − damagedQty
dpTotal = netQty × product.defaultPP
```

Users derive profit as: `Revenue − dpTotal` (not pre-computed in the sales tab rows).

---

## TIER 10 — PDF REPORT ENGINE (Exported Reports)
### Source: [reportEngine.ts](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/lib/reportEngine.ts)

All export generators **exactly mirror** their in-app counterparts:

| Generator       | In-App Equivalent                          | Formula Source      |
|-----------------|--------------------------------------------|---------------------|
| `genProfit()`   | ReportsModule → Profit Tab                 | Tier 5 (5.1)        |
| `genDayEnd()`   | ReportsModule → Day-End Tab                | Tier 6 (6.1)        |
| `genMargin()`   | ReportsModule → Margin Tool Tab            | Tier 7 (7.1)        |
| `genPriceList()`| ReportsModule → DP List Tab                | Tier 7 (7.1 margin) |

### Dashboard PDF Generator
Source: [generatePDF.ts](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/lib/generatePDF.ts#L171-L195)
- Today's snapshot → matches Tier 3 (3.3) with `rate × 0.65` fallback
- Cumulative summary → matches Tier 4 (4.1)

---

## TIER 11 — PRINT UTILITIES (Challan Print)
### Source: [printUtils.ts](file:///Users/almumeetusaikat/Documents/ERP/Bangla-Chain-ERP/src/lib/printUtils.ts#L428-L433)

### 11.1 Challan Net Total Waterfall
```
Subtotal     = Σ (item.qty × rate)
Commission   = − commissionAmt          (blue deduction)
Extra Profit = + extraProfitAmt         (green addition)
NET TOTAL    = Subtotal − Commission + Extra Profit
```

This is the **accounting source** for `ChallanItem.totalAmount` printed on the challan.

---

## ⚠️ CRITICAL INCONSISTENCIES — Read Before Debugging Profit

### Inconsistency A — COGS Fallback Ratios (when product lookup fails)
| Module / File                              | Fallback         | Implied Gross Margin |
|--------------------------------------------|------------------|----------------------|
| Dashboard (today's profit)                 | `rate × 0.65`    | 35%                  |
| Dashboard PDF (today's snapshot)           | `rate × 0.65`    | 35%                  |
| Reports → Profit Tab (company-wise)        | `rate × 0.85`    | 15%                  |
| ChallanModule per-group profit badge       | `rate × 0.85`    | 15%                  |
| reportEngine `genProfit()` PDF export      | `rate × 0.85`    | 15%                  |

**Impact:** If a product is deleted/renamed, the **same challan will contribute different COGS** depending on which dashboard/tab you view it from. This is a real discrepancy when product references break.

### Inconsistency B — Two Net Profit Methodologies
| Method                     | Formula Base                      | Used In                          |
|----------------------------|-----------------------------------|----------------------------------|
| **Per-Unit DP**            | `Sales − Σ(netQty × defaultPP) − Expenses` | Daily profit (today/yesterday), Reports Profit tab, Day-End |
| **Procurement-Total**      | `Sales − Σ(procurement.globalTotal) − Expenses` | Dashboard cumulative, Accounting module date-range |

**Why they differ:** `globalTotal` includes carriage, transport, bulk discounts, and reflects bonus items. Per-unit DP is the catalog price only. These are **both valid** but measure different things (inventory-theory profit vs cash-accounting profit).

### Inconsistency C — "Margin %" Means Two Different Things
| Tab / Location               | Formula                           | Type                  |
|------------------------------|-----------------------------------|-----------------------|
| Reports → Profit Tab         | `profit / revenue × 100`          | **Margin on Revenue** (Gross Margin %) |
| Reports → Margin Tool        | `(tp−dp) / dp × 100`              | **Markup on Cost** (Markup %) |
| Reports → DP Price List      | `(tp−dp) / dp × 100`              | **Markup on Cost** |
| Reports → Day-End Settlement | `profit / costOfSales × 100`      | **Markup on Cost** |

**Interpretation:** A product shown as "20% margin" in the Margin Tool means 20% markup on cost (equivalent to ~16.7% gross margin on revenue). The **same** product on the Profit tab would show its contribution margin as ~16.7%. This is semantically correct but user-confusing — the word "Margin" is overloaded.

---

## CLAIM / DISPLAY INDEPENDENCE — Verified Zero Cross-Sync

Per Requirement #1 (Damage ↔ Claim/Display Independence), the following are **GUARANTEED NOT TO OCCUR** in the codebase as of this version:

1. **`Claim` entries** → No automatic `damagedStock` adjustment in DirectoryModule
2. **`ClaimSettlement.amount`** → Never subtracted from any profit, COGS, or revenue formula
3. **`Claim.status === 'Approved'`** → Never triggers a stock movement or P&L entry
4. **`claimValue` field** → Zero references in any P&L, COGS, or revenue aggregation

The old DirectoryModule-internal `damageHistory[i].claimStatus` (pending/approved/settled) and the new standalone `Claim` register + `ClaimSettlement` entity are **completely separate systems** and do not touch each other's data or the accounting pipeline.
