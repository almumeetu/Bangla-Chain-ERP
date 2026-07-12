'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  Calendar, 
  Download, 
  Percent, 
  ChevronRight,
  ShieldAlert,
  ArrowRightLeft,
  ClipboardList
} from 'lucide-react';
import { Product, ChallanItem, SR, CompanyBrand, ExpenseRecord, DeliveryMan, UnitOfMeasure } from '../types';
import { translations, Language } from '../translations';

function UnitDisplay({ qty, units, uomId }: { qty: number, units: UnitOfMeasure[], uomId?: string }) {
  // If product has a specific uomId, use only that unit
  if (uomId) {
    const unit = units.find(u => u.id === uomId);
    if (unit) {
      const unitQty = qty / unit.multiplier;
      const qtyStr = Number.isInteger(unitQty)
        ? unitQty.toLocaleString()
        : unitQty.toFixed(1);
      return (
        <div className="font-mono text-[11px]">
          {qtyStr} {unit.symbol || unit.name}
        </div>
      );
    }
  }
  
  // Fallback: show only base unit (pieces) for totals
  const baseUnit = units.find(u => !u.parentUnitId) || units[0];
  return (
    <div className="font-mono text-[11px]">
      {qty.toLocaleString()} {baseUnit.symbol || baseUnit.name}
    </div>
  );
}

interface ReportsModuleProps {
  products: Product[];
  challans: ChallanItem[];
  srs: SR[];
  companies: CompanyBrand[];
  deliveryMen: DeliveryMan[];
  expenses: ExpenseRecord[];
  units: UnitOfMeasure[];
  language: Language;
  userRole?: 'admin' | 'sr';
}

type ReportTab = 'stock' | 'sales' | 'profit' | 'margin' | 'damage' | 'dp' | 'dayend';

export default function ReportsModule({
  products,
  challans,
  srs,
  companies,
  deliveryMen,
  expenses,
  units,
  language,
  userRole = 'admin'
}: ReportsModuleProps) {
  const t = translations[language].reports;
  const tCommon = translations[language].common;

  // Tabs (restricted to stock/sales for SR)
  const [activeTab, setActiveTab] = useState<ReportTab>('stock');
  
  // Sub-tabs for stock and sales reports
  const [stockSubTab, setStockSubTab] = useState<'company' | 'product'>('company');
  const [salesSubTab, setSalesSubTab] = useState<'company' | 'sr' | 'dm' | 'product' | 'unit'>('company');

  // Date Presets State
  const [preset, setPreset] = useState('custom');

  // Filter States
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Global filters
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('All');
  const [selectedSrFilter, setSelectedSrFilter] = useState('All');
  const [selectedDeliveryManFilter, setSelectedDeliveryManFilter] = useState('All');

  const handlePresetChange = useCallback((val: string) => {
    setPreset(val);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    if (val === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (val === 'month') {
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      setStartDate(`${y}-${m}-01`);
      setEndDate(todayStr);
    } else if (val === 'year') {
      const y = today.getFullYear();
      setStartDate(`${y}-01-01`);
      setEndDate(todayStr);
    }
  }, []);

  // Utility to format BDT
  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, []);

  const companiesList = useMemo(() => {
    return Array.from(new Set(products.map(p => p.company).filter(Boolean)));
  }, [products]);

  // Filtered Challans based on date range, global filters, and only Delivered status
  const filteredChallans = useMemo(() => {
    return challans.filter(ch => {
      if (!ch.createdAt) return true;
      const date = ch.createdAt.split('T')[0];
      const matchesDate = date >= startDate && date <= endDate;
      const matchesCompany = selectedCompanyFilter === 'All' || ch.company === selectedCompanyFilter;
      const matchesSR = selectedSrFilter === 'All' || ch.srName.toLowerCase() === selectedSrFilter.toLowerCase();
      const matchesDM = selectedDeliveryManFilter === 'All' || ch.deliveryManName.toLowerCase() === selectedDeliveryManFilter.toLowerCase();
      const matchesStatus = ch.status === 'Delivered'; // Only Delivered challans count
      return matchesDate && matchesCompany && matchesSR && matchesDM && matchesStatus;
    });
  }, [challans, startDate, endDate, selectedCompanyFilter, selectedSrFilter, selectedDeliveryManFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 1. STOCK REPORT DATA CALCULATION
  // ═══════════════════════════════════════════════════════════════
  const stockReportData = useMemo(() => {
    const brandList = selectedCompanyFilter === 'All'
      ? Array.from(new Set(products.map(p => p.company).filter(Boolean)))
      : [selectedCompanyFilter];
    let grandQty = 0;
    let grandValueDP = 0;
    let grandValueTP = 0;

    const rows = brandList.map(brandName => {
      const brandProducts = products.filter(p => p.company === brandName);
      const totalQty = brandProducts.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValueDP = brandProducts.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
      const totalValueTP = brandProducts.reduce((sum, p) => sum + (p.currentStock * p.defaultWSP), 0);

      grandQty += totalQty;
      grandValueDP += totalValueDP;
      grandValueTP += totalValueTP;

      return {
        companyName: brandName,
        totalQty,
        totalValueDP,
        totalValueTP
      };
    });

    return { rows, grandQty, grandValueDP, grandValueTP };
  }, [products, selectedCompanyFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 2. SALES REPORT DATA CALCULATION
  // ═══════════════════════════════════════════════════════════════
  const salesReportData = useMemo(() => {
    // A. Company-wise Sales
    const brandList = selectedCompanyFilter === 'All'
      ? Array.from(new Set(products.map(p => p.company).filter(Boolean)))
      : [selectedCompanyFilter];
    const companySales = brandList.map(brandName => {
      const brandChallans = filteredChallans.filter(ch => ch.company === brandName);
      const unitsSold = brandChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = brandChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = brandChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = brandChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = brandChallans.reduce((sum, ch) => {
        const product = products.find(p => p.name === ch.productName);
        return sum + ((product?.defaultPP || 0) * ch.qty);
      }, 0);

      return {
        companyName: brandName,
        unitsSold,
        revenue,
        dpTotal,
        returns,
        damages
      };
    });

    // B. SR-wise Sales
    const activeSrs = selectedSrFilter === 'All'
      ? srs
      : srs.filter(s => s.name.toLowerCase() === selectedSrFilter.toLowerCase());
    const srSales = activeSrs.map(sr => {
      const srChallans = filteredChallans.filter(ch => ch.srName.toLowerCase() === sr.name.toLowerCase());
      const unitsSold = srChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = srChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = srChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = srChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = srChallans.reduce((sum, ch) => {
        const product = products.find(p => p.name === ch.productName);
        return sum + ((product?.defaultPP || 0) * ch.qty);
      }, 0);

      return {
        srName: sr.name,
        phone: sr.phone,
        unitsSold,
        revenue,
        returns,
        damages,
        dpTotal
      };
    });

    // C. Delivery Man-wise Sales
    const activeDeliveryMen = selectedDeliveryManFilter === 'All'
      ? deliveryMen
      : deliveryMen.filter(dm => dm.name.toLowerCase() === selectedDeliveryManFilter.toLowerCase());
    const dmSales = activeDeliveryMen.map(dm => {
      const dmChallans = filteredChallans.filter(ch => ch.deliveryManName.toLowerCase() === dm.name.toLowerCase());
      const unitsSold = dmChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = dmChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = dmChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = dmChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const totalChallans = dmChallans.length;
      const dpTotal = dmChallans.reduce((sum, ch) => {
        const product = products.find(p => p.name === ch.productName);
        return sum + ((product?.defaultPP || 0) * ch.qty);
      }, 0);

      return {
        dmName: dm.name,
        vehicle: dm.vehicle,
        unitsSold,
        revenue,
        returns,
        damages,
        totalChallans,
        dpTotal
      };
    });

    // D. Product-wise Sales
    const productSales = products.map(p => {
      const pChallans = filteredChallans.filter(ch => ch.productName.toLowerCase() === p.name.toLowerCase());
      const unitsSold = pChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = pChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = pChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = pChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = unitsSold * p.defaultPP;

      return {
        productName: p.name,
        sku: p.sku,
        company: p.company,
        unitsSold,
        revenue,
        returns,
        damages,
        dpTotal,
        uomId: p.uomId
      };
    }).filter(row => {
      const matchesCompany = selectedCompanyFilter === 'All' || row.company === selectedCompanyFilter;
      return matchesCompany && (row.unitsSold > 0 || row.returns > 0 || row.damages > 0);
    });

    // E. Unit-wise Sales
    const unitSales = units.map(unit => {
      // For each product that uses this unit (or all, but let's calculate all sold quantity)
      const unitChallans = filteredChallans.filter(ch => {
        // Find product, then check if its uomId is this unit
        const product = products.find(p => p.name.toLowerCase() === ch.productName.toLowerCase());
        return product?.uomId === unit.id;
      });
      
      const unitsSold = unitChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = unitChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = unitChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = unitChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = unitChallans.reduce((sum, ch) => {
        const product = products.find(p => p.name.toLowerCase() === ch.productName.toLowerCase());
        return sum + ((product?.defaultPP || 0) * ch.qty);
      }, 0);
      
      return {
        unitId: unit.id,
        unitName: unit.name,
        unitSymbol: unit.symbol || unit.name,
        unitsSold,
        returns,
        damages,
        dpTotal,
        revenue
      };
    }).filter(row => row.unitsSold > 0 || row.returns > 0 || row.damages > 0);

    return { companySales, srSales, dmSales, productSales, unitSales };
  }, [filteredChallans, products, srs, deliveryMen, selectedCompanyFilter, selectedSrFilter, selectedDeliveryManFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 3. DAMAGE RECONCILIATION REPORT DATA CALCULATION
  // ═══════════════════════════════════════════════════════════════
  const damageReportData = useMemo(() => {
    const rows = products
      .filter(p => selectedCompanyFilter === 'All' || p.company === selectedCompanyFilter)
      .map(p => {
        const historyEntries = p.damageHistory || [];
        const signedDelta = historyEntries.reduce((sum, entry) => sum + (entry.type === 'new' ? (entry.deltaQty ?? entry.qty) : 0), 0);
        const positiveDelta = historyEntries.reduce((sum, entry) => sum + (entry.type === 'new' && (entry.deltaQty ?? entry.qty) > 0 ? (entry.deltaQty ?? entry.qty) : 0), 0);
        const existingDamageQty = Math.max(0, (p.damagedStock || 0) - signedDelta);
        const newDamageQty = Math.max(0, positiveDelta);
        const totalDamageQty = existingDamageQty + newDamageQty;
        const unitValue = p.defaultPP || 0;
        const oldDamageValue = existingDamageQty * unitValue;
        const newDamageValue = newDamageQty * unitValue;
        const totalDamageValue = totalDamageQty * unitValue;
        const periodSalesValue = filteredChallans
          .filter(ch => ch.productName.toLowerCase() === p.name.toLowerCase())
          .reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
        const latestNote = [...historyEntries]
          .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0]?.note || '';

        return {
          productName: p.name,
          sku: p.sku,
          company: p.company,
          currentStock: p.currentStock,
          oldDamageQty: existingDamageQty,
          oldDamageValue,
          newDamageQty,
          newDamageValue,
          totalDamageQty,
          totalDamageValue,
          periodSalesValue,
          latestNote
        };
      })
      .filter(row => row.totalDamageQty > 0 || row.periodSalesValue > 0)
      .sort((a, b) => b.totalDamageValue - a.totalDamageValue || b.totalDamageQty - a.totalDamageQty);

    return {
      rows,
      totalDamageUnits: rows.reduce((sum, row) => sum + row.totalDamageQty, 0),
      totalOldDamageUnits: rows.reduce((sum, row) => sum + row.oldDamageQty, 0),
      totalNewDamageUnits: rows.reduce((sum, row) => sum + row.newDamageQty, 0),
      totalDamageValue: rows.reduce((sum, row) => sum + row.totalDamageValue, 0),
      totalRecordedSalesValue: rows.reduce((sum, row) => sum + row.periodSalesValue, 0)
    };
  }, [products, selectedCompanyFilter, filteredChallans]);

  const profitReportData = useMemo(() => {
    const brandList = selectedCompanyFilter === 'All'
      ? Array.from(new Set(products.map(p => p.company).filter(Boolean)))
      : [selectedCompanyFilter];
    let grandRevenue = 0;
    let grandCost = 0;
    let grandProfit = 0;

    const rows = brandList.map(brandName => {
      const brandChallans = filteredChallans.filter(ch => ch.company === brandName);
      const revenue = brandChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      
      // Calculate Cost of Goods Sold based on Product DP (defaultPP)
      const costOfGoods = brandChallans.reduce((sum, ch) => {
        const prod = products.find(p => p.name === ch.productName);
        const dp = prod ? prod.defaultPP : (ch.rate * 0.85); // fallback to 85% of trade price
        return sum + (ch.qty * dp);
      }, 0);

      const profit = revenue - costOfGoods;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      grandRevenue += revenue;
      grandCost += costOfGoods;
      grandProfit += profit;

      return {
        companyName: brandName,
        revenue,
        costOfGoods,
        profit,
        margin
      };
    });

    return { rows, grandRevenue, grandCost, grandProfit };
  }, [filteredChallans, products, selectedCompanyFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 4. PROFIT MARGIN TOOL (DP/TP VARIANCE)
  // ═══════════════════════════════════════════════════════════════
  const profitMarginToolData = useMemo(() => {
    return products
      .filter(p => selectedCompanyFilter === 'All' || p.company === selectedCompanyFilter)
      .map(p => {
        const dp = p.defaultPP;
        const tp = p.defaultWSP;
        const mrp = p.defaultMRP;
        const variance = tp - dp;
        const marginPct = dp > 0 ? (variance / dp) * 100 : 0;
        
        return {
          product: p,
          dp,
          tp,
          mrp,
          variance,
          marginPct
        };
      });
  }, [products, selectedCompanyFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 5. COMPANY-WISE DP PRICE LIST REPORT
  // ═══════════════════════════════════════════════════════════════
  const dpPriceReportData = useMemo(() => {
    const filteredProducts = products
      .filter(p => selectedCompanyFilter === 'All' || p.company === selectedCompanyFilter)
      .sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));

    // Group by company
    const groupedByCompany: Record<string, typeof filteredProducts> = {};
    filteredProducts.forEach(p => {
      if (!groupedByCompany[p.company]) groupedByCompany[p.company] = [];
      groupedByCompany[p.company].push(p);
    });

    const companies = Object.keys(groupedByCompany).sort();
    return { groupedByCompany, companies, total: filteredProducts.length };
  }, [products, selectedCompanyFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 6. COMPANY-WISE DAY-END SETTLEMENT DATA
  // ═══════════════════════════════════════════════════════════════
  const dayEndSettlementData = useMemo(() => {
    const companyList = selectedCompanyFilter === 'All'
      ? Array.from(new Set(products.map(p => p.company).filter(Boolean))).sort()
      : [selectedCompanyFilter];

    const result = companyList.map(companyName => {
      const companyProducts = products
        .filter(p => p.company === companyName)
        .sort((a, b) => a.name.localeCompare(b.name));

      const companyChallans = filteredChallans.filter(ch => ch.company === companyName);

      // Damage / return rows for right panel
      const damageRows = companyProducts
        .filter(p => (p.damagedStock || 0) > 0)
        .map(p => ({ productName: p.name, damagedQty: p.damagedStock || 0, type: 'Damage' as const }));

      const returnRows = companyChallans
        .filter(ch => (ch.returnedQty || 0) > 0)
        .map(ch => ({ productName: ch.productName, damagedQty: ch.returnedQty, type: 'Return' as const }));

      const productRows = companyProducts.map((p, idx) => {
        const pChallans = companyChallans.filter(ch => ch.productName === p.name);
        const salesQty   = pChallans.reduce((s, ch) => s + ch.qty, 0);
        const salesAmt   = pChallans.reduce((s, ch) => s + ch.totalAmount, 0);
        // Opening stock = current stock + sold qty (since stock was reduced after sales)
        const openingStock = p.currentStock + salesQty;
        const closingStock = p.currentStock;
        const stockAmt     = closingStock * p.defaultPP;
        const costOfSales  = salesQty * p.defaultPP;
        const profit       = salesAmt - costOfSales;
        const profitPct    = costOfSales > 0 ? (profit / costOfSales) * 100 : 0;
        return {
          slNo: idx + 1,
          productName: p.name,
          sku: p.sku,
          dp: p.defaultPP,
          tp: p.defaultWSP,
          openingStock,
          salesQty,
          closingStock,
          salesAmt,
          stockAmt,
          profit,
          profitPct,
        };
      });

      const totalSales   = productRows.reduce((s, r) => s + r.salesAmt, 0);
      const totalStock   = productRows.reduce((s, r) => s + r.stockAmt, 0);
      const totalProfit  = productRows.reduce((s, r) => s + r.profit, 0);
      const totalSalesQty = productRows.reduce((s, r) => s + r.salesQty, 0);

      return { companyName, productRows, totalSales, totalStock, totalProfit, totalSalesQty, damageRows, returnRows };
    });

    return result;
  }, [products, filteredChallans, selectedCompanyFilter]);

  // ═══════════════════════════════════════════════════════════════
  // PDF REPORT DOWNLOAD FUNCTION
  // ═══════════════════════════════════════════════════════════════
  const handleDownloadPDF = useCallback(() => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Dark Navy Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 40, 210, 1.5, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(language === 'bn' ? 'ডিস্ট্রিবিউশন রিপোর্ট বিবরণী' : 'B2B DMS Distribution Report', 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATE GENERATED: ${dateStr} | PERIOD: ${startDate} to ${endDate}`, 14, 28);

    let y = 55;

    const checkPageBreak = (heightNeeded: number) => {
      if (y + heightNeeded > 270) {
        doc.addPage();
        y = 20;
      }
    };

    if (activeTab === 'stock') {
      // Draw Stock Report
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(t.companyStockTitle.toUpperCase(), 14, y);
      y += 10;

      // Table Headers
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'কোম্পানি' : 'COMPANY BRAND', 16, y - 1);
      doc.text(language === 'bn' ? 'স্টক পরিমাণ' : 'STOCK QUANTITY', 75, y - 1);
      doc.text(language === 'bn' ? 'স্টক মূল্য (DP)' : 'STOCK VALUE (DP)', 115, y - 1);
      doc.text(language === 'bn' ? 'স্টক মূল্য (TP)' : 'STOCK VALUE (TP)', 155, y - 1);
      y += 10;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      stockReportData.rows.forEach(row => {
        doc.text(row.companyName, 16, y);
        doc.text(`${row.totalQty.toLocaleString()} units`, 75, y);
        doc.text(`TK ${row.totalValueDP.toLocaleString()}`, 115, y);
        doc.text(`TK ${row.totalValueTP.toLocaleString()}`, 155, y);
        y += 8;
      });

      y += 4;
      doc.line(14, y - 4, 196, y - 4);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'সর্বমোট' : 'GRAND TOTAL', 16, y);
      doc.text(`${stockReportData.grandQty.toLocaleString()} units`, 75, y);
      doc.text(`TK ${stockReportData.grandValueDP.toLocaleString()}`, 115, y);
      doc.text(`TK ${stockReportData.grandValueTP.toLocaleString()}`, 155, y);
    } 
    else if (activeTab === 'sales') {
      const checkPageBreak = (heightNeeded: number) => {
        if (y + heightNeeded > 270) {
          doc.addPage();
          y = 20;
        }
      };

      // Draw Sales Report
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(t.companySalesTitle.toUpperCase(), 14, y);
      y += 10;

      // Company Sales Table Headers
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'কোম্পানি' : 'COMPANY', 16, y - 1);
                  doc.text(language === 'bn' ? 'বিক্রিত ইউনিট' : 'UNITS SOLD', 55, y - 1);
                  doc.text(language === 'bn' ? 'ফেরত' : 'RETURNS', 85, y - 1);
                  doc.text(language === 'bn' ? 'ক্ষতিগ্রস্ত' : 'DAMAGES', 110, y - 1);
                  doc.text(language === 'bn' ? 'মোট বিক্রয় (DP)' : 'TOTAL SALES (DP)', 135, y - 1);
                  doc.text(language === 'bn' ? 'মোট বিক্রয় (TP)' : 'TOTAL SALES (TP)', 165, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.companySales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.companyName, 16, y);
        doc.text(row.unitsSold.toString(), 55, y);
        doc.text(row.returns.toString(), 85, y);
        doc.text(row.damages.toString(), 110, y);
        doc.text(`TK ${row.dpTotal.toLocaleString()}`, 135, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 165, y);
        y += 8;
      });

      // SR Sales Section
      y += 10;
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(t.srSalesTitle.toUpperCase(), 14, y);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'এসআর (SR)' : 'SR NAME', 16, y - 1);
                  doc.text(language === 'bn' ? 'বিক্রিত ইউনিট' : 'UNITS', 65, y - 1);
                  doc.text(language === 'bn' ? 'ফেরত' : 'RET', 95, y - 1);
                  doc.text(language === 'bn' ? 'ক্ষতিগ্রস্ত' : 'DMG', 115, y - 1);
                  doc.text(language === 'bn' ? 'মোট বিক্রয় (DP)' : 'TOTAL SALES (DP)', 135, y - 1);
                  doc.text(language === 'bn' ? 'মোট বিক্রয় (TP)' : 'TOTAL SALES (TP)', 165, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.srSales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.srName, 16, y);
        doc.text(row.unitsSold.toString(), 65, y);
        doc.text(row.returns.toString(), 95, y);
        doc.text(row.damages.toString(), 115, y);
        doc.text(`TK ${row.dpTotal.toLocaleString()}`, 135, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 165, y);
        y += 8;
      });

      // Delivery Man Sales Section
      y += 10;
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'bn' ? 'ডেলিভারি ম্যানভিত্তিক বিক্রয় বিবরণী' : 'DELIVERY MAN-WISE SALES BREAKDOWN', 14, y);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'ডেলিভারি ম্যান' : 'DELIVERY MAN', 16, y - 1);
      doc.text(language === 'bn' ? 'মোট চালান' : 'CHALLANS', 65, y - 1);
      doc.text(language === 'bn' ? 'ইউনিট' : 'UNITS', 95, y - 1);
      doc.text(language === 'bn' ? 'ফেরত' : 'RET', 120, y - 1);
      doc.text(language === 'bn' ? 'ক্ষতিগ্রস্ত' : 'DMG', 140, y - 1);
      doc.text(language === 'bn' ? 'ডেলিভারি (TK)' : 'DELIVERED', 160, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.dmSales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.dmName, 16, y);
        doc.text(row.totalChallans.toString(), 65, y);
        doc.text(row.unitsSold.toString(), 95, y);
        doc.text(row.returns.toString(), 120, y);
        doc.text(row.damages.toString(), 140, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 160, y);
        y += 8;
      });

      // Product-wise Sales Section
      y += 10;
      checkPageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(language === 'bn' ? 'পণ্যভিত্তিক বিক্রয় বিবরণী' : 'PRODUCT-WISE SALES BREAKDOWN', 14, y);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'পণ্যের নাম' : 'PRODUCT NAME', 16, y - 1);
      doc.text(language === 'bn' ? 'বিক্রিত ইউনিট' : 'UNITS SOLD', 90, y - 1);
      doc.text(language === 'bn' ? 'ফেরত' : 'RET', 125, y - 1);
      doc.text(language === 'bn' ? 'ক্ষতিগ্রস্ত' : 'DMG', 145, y - 1);
      doc.text(language === 'bn' ? 'বিক্রয় (TK)' : 'SALES (TK)', 165, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.productSales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.productName.substring(0, 32), 16, y);
        doc.text(row.unitsSold.toLocaleString(), 90, y);
        doc.text(row.returns.toString(), 125, y);
        doc.text(row.damages.toString(), 145, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 165, y);
        y += 8;
      });
    }
    else if (activeTab === 'damage') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(t.damageTitle.toUpperCase(), 14, y);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'পণ্য / কোম্পানি' : 'PRODUCT / COMPANY', 16, y - 1);
      doc.text(language === 'bn' ? 'পুরাতন' : 'OLD', 76, y - 1);
      doc.text(language === 'bn' ? 'নতুন' : 'NEW', 116, y - 1);
      doc.text(language === 'bn' ? 'মোট' : 'TOTAL', 148, y - 1);
      doc.text(language === 'bn' ? 'রেকর্ডেড' : 'RECORDED', 172, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      damageReportData.rows.forEach(row => {
        checkPageBreak(8);
        doc.text(`${row.productName.substring(0, 18)} / ${row.company}`, 16, y);
        doc.text(`${row.oldDamageQty} (${row.oldDamageValue.toLocaleString()} TK)`, 76, y);
        doc.text(`${row.newDamageQty} (${row.newDamageValue.toLocaleString()} TK)`, 116, y);
        doc.text(`${row.totalDamageQty} (${row.totalDamageValue.toLocaleString()} TK)`, 148, y);
        doc.text(`TK ${row.periodSalesValue.toLocaleString()}`, 172, y);
        y += 8;
      });
    }
    else if (activeTab === 'profit') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.text(t.profitSummaryTitle.toUpperCase(), 14, y);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.line(14, y + 3, 196, y + 3);
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'কোম্পানি' : 'COMPANY', 16, y - 1);
      doc.text(language === 'bn' ? 'মোট বিক্রয় (TP)' : 'REVENUE (TP)', 60, y - 1);
      doc.text(language === 'bn' ? 'ক্রয় খরচ (DP)' : 'COST OF GOODS (DP)', 110, y - 1);
      doc.text(language === 'bn' ? 'নিট লাভ (TK)' : 'PROFIT', 160, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      profitReportData.rows.forEach(row => {
        doc.text(row.companyName, 16, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 60, y);
        doc.text(`TK ${row.costOfGoods.toLocaleString()}`, 110, y);
        doc.text(`TK ${row.profit.toLocaleString()}`, 160, y);
        y += 8;
      });

      y += 4;
      doc.line(14, y - 4, 196, y - 4);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'সর্বমোট' : 'GRAND TOTAL', 16, y);
      doc.text(`TK ${profitReportData.grandRevenue.toLocaleString()}`, 60, y);
      doc.text(`TK ${profitReportData.grandCost.toLocaleString()}`, 110, y);
      doc.text(`TK ${profitReportData.grandProfit.toLocaleString()}`, 160, y);
    }

    doc.save(`Samir_Enterprise_Report_${activeTab}_${startDate}_to_${endDate}.pdf`);
  }, [activeTab, startDate, endDate, language, stockReportData, salesReportData, profitReportData, t]);

  return (
    <div className="p-6 space-y-6">
      
      {/* Header and Download Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">{t.subtitle}</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4" />
          {t.downloadReport}
        </button>
      </div>

      {/* Date Range Selector Panel */}
      <div className="bg-indigo-50/30 border border-indigo-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4.5 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-850 font-bold text-xs shrink-0">
            <Calendar className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-indigo-900">{language === 'bn' ? 'সময়কাল:' : 'Period Preset:'}</span>
          </div>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="h-9 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-indigo-850 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-sm"
          >
            <option value="today">{language === 'bn' ? 'আজকের' : 'Today'}</option>
            <option value="month">{language === 'bn' ? 'এই মাস' : 'This Month'}</option>
            <option value="year">{language === 'bn' ? 'এই বছর' : 'This Year'}</option>
            <option value="custom">{language === 'bn' ? 'কাস্টম রেঞ্জ' : 'Custom Range'}</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'bn' ? 'শুরু:' : 'From:'}</span>
            <input
              type="date"
              disabled={preset !== 'custom'}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="h-9 px-3 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-450 transition-all font-mono shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'bn' ? 'শেষ:' : 'To:'}</span>
            <input
              type="date"
              disabled={preset !== 'custom'}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="h-9 px-3 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-450 transition-all font-mono shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Global Filters Panel */}
      <div className="bg-indigo-50/30 border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
              {language === 'bn' ? 'রিপোর্ট ফিল্টার কন্ট্রোল' : 'Report Filters Control'}
            </span>
          </div>
          {(selectedCompanyFilter !== 'All' || selectedSrFilter !== 'All' || selectedDeliveryManFilter !== 'All') && (
            <button
              onClick={() => {
                setSelectedCompanyFilter('All');
                setSelectedSrFilter('All');
                setSelectedDeliveryManFilter('All');
              }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors cursor-pointer"
            >
              {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">
              {language === 'bn' ? 'কোম্পানি ফিল্টার:' : 'Filter by Company:'}
            </label>
            <select
              value={selectedCompanyFilter}
              onChange={e => setSelectedCompanyFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-orange-200 bg-orange-50/10 px-3 text-xs font-bold text-orange-850 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="All">{language === 'bn' ? 'সকল কোম্পানি' : 'All Companies'}</option>
              {companiesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* SR Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
              {language === 'bn' ? 'এসআর ফিল্টার:' : 'Filter by SR:'}
            </label>
            <select
              value={selectedSrFilter}
              onChange={e => setSelectedSrFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-purple-200 bg-purple-50/10 px-3 text-xs font-bold text-purple-855 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="All">{language === 'bn' ? 'সকল এসআর (SR)' : 'All SRs'}</option>
              {srs.map(sr => (
                <option key={sr.id} value={sr.name}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Man Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              {language === 'bn' ? 'ডেলিভারি ম্যান ফিল্টার:' : 'Filter by Delivery Man:'}
            </label>
            <select
              value={selectedDeliveryManFilter}
              onChange={e => setSelectedDeliveryManFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-rose-200 bg-rose-50/10 px-3 text-xs font-bold text-rose-855 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="All">{language === 'bn' ? 'সকল ডেলিভারি ম্যান' : 'All Delivery Men'}</option>
              {deliveryMen.map(dm => (
                <option key={dm.id} value={dm.name}>{dm.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.tabStock}
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sales'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {t.tabSales}
        </button>

        {userRole === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('damage')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'damage'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.tabDamage}
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profit'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.tabProfit}
            </button>
            <button
              onClick={() => setActiveTab('margin')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'margin'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t.profitMarginTitle.replace('Tool (DP/TP Variance)', '')}
            </button>
            <button
              onClick={() => setActiveTab('dp')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dp'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'প্রাইস লিস্ট' : 'Price List'}
            </button>
            <button
              onClick={() => setActiveTab('dayend')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dayend'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'দিন শেষ হিসাব' : 'Day-End Settlement'}
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT: STOCK REPORT */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock report sub-tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setStockSubTab('company')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockSubTab === 'company'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'কোম্পানি ভিত্তিক' : 'Company Summary'}
            </button>
            <button
              onClick={() => setStockSubTab('product')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                stockSubTab === 'product'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'পণ্য ভিত্তিক' : 'Product Details'}
            </button>
          </div>

          {/* Stock report sub-tab content */}
          {stockSubTab === 'company' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.companyStockTitle}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'স্টক পরিমাণ' : 'Total Units'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'স্টক মূল্য (DP)' : 'Stock Valuation (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'স্টক মূল্য (TP)' : 'Stock Valuation (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {stockReportData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                        <td className="px-4 py-3.5 text-center">
                          <UnitDisplay qty={row.totalQty} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.totalValueDP)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.totalValueTP)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                      <td className="px-4 py-4">{language === 'bn' ? 'সর্বমোট স্টক' : 'GRAND TOTAL STOCK'}</td>
                      <td className="px-4 py-4 text-center">
                        <UnitDisplay qty={stockReportData.grandQty} units={units} />
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-indigo-605">{formatBDT(stockReportData.grandValueDP)}</td>
                      <td className="px-4 py-4 text-right font-mono text-emerald-605">{formatBDT(stockReportData.grandValueTP)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stockSubTab === 'product' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'পণ্যভিত্তিক স্টক বিস্তারিত' : 'Product-wise Stock Details'}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'SKU' : 'SKU'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত স্টক' : 'Damaged Stock'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'স্টক মূল্য (DP)' : 'Stock Value (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'স্টক মূল্য (TP)' : 'Stock Value (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.map((product, idx) => (
                      <tr key={product.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">{product.name}</td>
                        <td className="px-4 py-3.5 text-slate-600">{product.company}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px]">{product.sku}</td>
                        <td className="px-4 py-3.5 text-center">
                          <UnitDisplay qty={product.currentStock} units={units} uomId={product.uomId} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <UnitDisplay qty={product.damagedStock || 0} units={units} uomId={product.uomId} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(product.currentStock * product.defaultPP)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(product.currentStock * product.defaultWSP)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: SALES REPORT */}
      {activeTab === 'damage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">{language === 'bn' ? 'মোট ড্যামেজ ইউনিট' : 'Total Damage Units'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'পুরাতন + নতুন' : 'Old + New'}</div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{language === 'bn' ? 'পুরাতন ড্যামেজ' : 'Old Damage'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalOldDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'আগে থাকা ড্যামেজ' : 'Existing damage'}</div>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{language === 'bn' ? 'নতুন ড্যামেজ' : 'New Damage'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalNewDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'এই রিসার্চে যোগ হওয়া' : 'Added in this cycle'}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{language === 'bn' ? 'ড্যামেজ মান (TK)' : 'Damage Value (TK)'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{formatBDT(damageReportData.totalDamageValue)}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'রেকর্ডেড বিক্রয় মূল্য: ' : 'Recorded sales value: '}{formatBDT(damageReportData.totalRecordedSalesValue)}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">{t.damageTitle}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                    <th className="px-4 py-3">{language === 'bn' ? 'পণ্য / কোম্পানি' : 'Product / Company'}</th>
                    <th className="px-4 py-3 text-center">{language === 'bn' ? 'পুরাতন Qty' : 'Old Qty'}</th>
                    <th className="px-4 py-3 text-center">{language === 'bn' ? 'নতুন Qty' : 'New Qty'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'পুরাতন Amount' : 'Old Amount'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'নতুন Amount' : 'New Amount'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট Amount' : 'Total Amount'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'রেকর্ডেড বিক্রয় মূল্য' : 'Recorded Sales Value'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {damageReportData.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.productName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                        {row.latestNote && <div className="text-[9px] text-rose-500 mt-1">{row.latestNote}</div>}
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.oldDamageQty.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-600">{row.newDamageQty.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">{formatBDT(row.oldDamageValue)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">{formatBDT(row.newDamageValue)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600">{formatBDT(row.totalDamageValue)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.periodSalesValue)}</td>
                    </tr>
                  ))}
                  {damageReportData.rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো ড্যামেজ রেকর্ড পাওয়া যায়নি।' : 'No damage records found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Sales Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</p>
              <p className="text-2xl font-black text-slate-800 font-mono">
                {formatBDT(salesReportData.companySales.reduce((sum, row) => sum + row.revenue, 0))}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</p>
              <p className="text-2xl font-black text-indigo-700 font-mono">
                {formatBDT(salesReportData.companySales.reduce((sum, row) => sum + row.dpTotal, 0))}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রিত ইউনিট' : 'Total Units Sold'}</p>
              <UnitDisplay qty={salesReportData.companySales.reduce((sum, row) => sum + row.unitsSold, 0)} units={units} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-rose-500 tracking-wider mb-2">{language === 'bn' ? 'মোট রিটার্ন/ড্যামেজ' : 'Total Returns/Damages'}</p>
              <UnitDisplay qty={salesReportData.companySales.reduce((sum, row) => sum + row.returns + row.damages, 0)} units={units} />
            </div>
          </div>

          {/* Sales report sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setSalesSubTab('company')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'company'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'কোম্পানি ভিত্তিক' : 'Company-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('sr')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'sr'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'SR ভিত্তিক' : 'SR-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('dm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'dm'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Man'}
            </button>
            <button
              onClick={() => setSalesSubTab('product')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'product'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'পণ্য ভিত্তিক' : 'Product-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('unit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'unit'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ইউনিট ভিত্তিক' : 'Unit-wise'}
            </button>
          </div>

          {/* Sales report sub-tab content */}
          {salesSubTab === 'company' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.companySalesTitle}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.companySales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                        <td className="px-4 py-3.5 text-center">
                          <UnitDisplay qty={row.unitsSold} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <UnitDisplay qty={row.returns} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <UnitDisplay qty={row.damages} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {salesSubTab === 'sr' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.srSalesTitle}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'সেলস অফিসার (SR)' : 'Sales Officer (SR)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.srSales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">
                          <div>{row.srName}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.phone}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                          <UnitDisplay qty={row.unitsSold} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <UnitDisplay qty={row.returns} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <UnitDisplay qty={row.damages} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {salesSubTab === 'dm' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'ডেলিভারি ম্যানভিত্তিক বিক্রয় বিবরণী' : 'Delivery Man-wise Sales Breakdown'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Officer / Man'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'মোট চালান' : 'Total Challans'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ডেলিভারি ইউনিট' : 'Delivered Units'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.dmSales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">
                          <div>{row.dmName}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.vehicle}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">{row.totalChallans}</td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                          <UnitDisplay qty={row.unitsSold} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <UnitDisplay qty={row.returns} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <UnitDisplay qty={row.damages} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                    {salesReportData.dmSales.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400 font-semibold">
                          {language === 'bn' ? 'কোনো ডেলিভারি ডেটা পাওয়া যায়নি।' : 'No delivery data available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {salesSubTab === 'product' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'পণ্যভিত্তিক বিক্রয় বিবরণী' : 'Product-wise Sales Breakdown'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'পণ্যের নাম ও কোম্পানি' : 'Product Name & Brand'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.productSales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">
                          <div>{row.productName}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                          <UnitDisplay qty={row.unitsSold} units={units} uomId={row.uomId} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <UnitDisplay qty={row.returns} units={units} uomId={row.uomId} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <UnitDisplay qty={row.damages} units={units} uomId={row.uomId} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                    {salesReportData.productSales.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                          {language === 'bn' ? 'কোনো পণ্য বিক্রির ডেটা পাওয়া যায়নি।' : 'No product sales data available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {salesSubTab === 'unit' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'ইউনিটভিত্তিক বিক্রয় বিবরণী' : 'Unit-wise Sales Breakdown'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'ইউনিটের নাম' : 'Unit Name'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold (Pieces)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty (Pieces)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty (Pieces)'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.unitSales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">
                          <div>{row.unitName}</div>
                          {row.unitSymbol !== row.unitName && (
                            <div className="text-[9px] text-slate-400 font-mono mt-0.5">Symbol: {row.unitSymbol}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">
                          <UnitDisplay qty={row.unitsSold} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <UnitDisplay qty={row.returns} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <UnitDisplay qty={row.damages} units={units} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                    {salesReportData.unitSales.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                          {language === 'bn' ? 'কোনো ইউনিট বিক্রির ডেটা পাওয়া যায়নি।' : 'No unit sales data available.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: COMPANY-WISE PROFIT REPORT */}
      {activeTab === 'profit' && userRole === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">{t.profitSummaryTitle}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Sales Revenue (TP)'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'ক্রয় খরচ (DP)' : 'Cost of Goods (DP)'}</th>
                  <th className="px-4 py-3 text-center">{language === 'bn' ? 'লাভ মার্জিন' : 'Profit Margin (%)'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট লাভ (TK)' : 'Net Profit (Tk)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {profitReportData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-700">{formatBDT(row.revenue)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">{formatBDT(row.costOfGoods)}</td>
                    <td className="px-4 py-3.5 text-center font-bold">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                        {row.margin.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.profit)}</td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                  <td className="px-4 py-4">{language === 'bn' ? 'সর্বমোট লাভ' : 'GRAND TOTAL PROFIT'}</td>
                  <td className="px-4 py-4 text-right font-mono">{formatBDT(profitReportData.grandRevenue)}</td>
                  <td className="px-4 py-4 text-right font-mono text-slate-550">{formatBDT(profitReportData.grandCost)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded text-[10px]">
                      {(profitReportData.grandRevenue > 0 ? (profitReportData.grandProfit / profitReportData.grandRevenue) * 100 : 0).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono text-emerald-605">{formatBDT(profitReportData.grandProfit)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Company-wise Product Profit Breakdown */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {language === 'bn' ? 'কোম্পানিভিত্তিক পণ্যের লাভ বিস্তারিত' : 'Company-wise Product Profit Breakdown'}
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {profitReportData.rows.map((companyRow, compIdx) => {
              // get per-product profit rows for this company
              const compChallans = filteredChallans.filter(ch => ch.company === companyRow.companyName);
              const productNames = Array.from(new Set(compChallans.map(ch => ch.productName)));
              const productRows = productNames.map(pName => {
                const pChallans = compChallans.filter(ch => ch.productName === pName);
                const revenue = pChallans.reduce((s, ch) => s + ch.totalAmount, 0);
                const unitsSold = pChallans.reduce((s, ch) => s + ch.qty, 0);
                const prod = products.find(p => p.name === pName);
                const dp = prod ? prod.defaultPP : 0;
                const cost = unitsSold * dp;
                const profit = revenue - cost;
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
                return { pName, unitsSold, revenue, cost, profit, margin, sku: prod?.sku ?? '' };
              }).sort((a, b) => b.profit - a.profit);

              const colors = [
                { header: 'bg-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
                { header: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
                { header: 'bg-violet-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
                { header: 'bg-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
                { header: 'bg-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
              ];
              const color = colors[compIdx % colors.length];

              if (productRows.length === 0) return null;

              return (
                <div key={companyRow.companyName} className={`border ${color.border} rounded-2xl overflow-hidden`}>
                  {/* Company Header */}
                  <div className={`${color.light} px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-full ${color.header}`} />
                      <div>
                        <span className={`font-extrabold text-sm ${color.text}`}>{companyRow.companyName}</span>
                        <span className="ml-2 text-[10px] font-bold text-slate-400">
                          {productRows.length} {language === 'bn' ? 'টি পণ্য' : 'products'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        {language === 'bn' ? 'বিক্রয়:' : 'Revenue:'} <span className="font-bold text-slate-800">{formatBDT(companyRow.revenue)}</span>
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {language === 'bn' ? 'লাভ:' : 'Profit:'} <span className={`font-extrabold ${companyRow.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatBDT(companyRow.profit)}</span>
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${color.badge}`}>
                        {companyRow.margin.toFixed(1)}% {language === 'bn' ? 'মার্জিন' : 'margin'}
                      </span>
                    </div>
                  </div>

                  {/* Per-product rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                          <th className="px-4 py-2.5">{language === 'bn' ? 'পণ্যের নাম' : 'Product'}</th>
                          <th className="px-4 py-2.5 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                          <th className="px-4 py-2.5 text-right text-indigo-500">{language === 'bn' ? 'ক্রয় খরচ (DP)' : 'Cost (DP)'}</th>
                          <th className="px-4 py-2.5 text-right text-emerald-500">{language === 'bn' ? 'বিক্রয় মূল্য (TP)' : 'Revenue (TP)'}</th>
                          <th className="px-4 py-2.5 text-right">{language === 'bn' ? 'নিট লাভ' : 'Net Profit'}</th>
                          <th className="px-4 py-2.5 text-center">{language === 'bn' ? 'মার্জিন' : 'Margin'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {productRows.map((row, idx) => (
                          <tr key={idx} className={`hover:bg-slate-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/20'}`}>
                            <td className="px-4 py-3 font-semibold text-slate-800">
                              <div>{row.pName}</div>
                              {row.sku && <div className="text-[9px] text-slate-400 font-mono">{row.sku}</div>}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-600">{row.unitsSold.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-mono text-indigo-600">{formatBDT(row.cost)}</td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">{formatBDT(row.revenue)}</td>
                            <td className={`px-4 py-3 text-right font-mono font-extrabold ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {formatBDT(row.profit)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${row.margin >= 0 ? color.badge : 'bg-rose-100 text-rose-700'}`}>
                                {row.margin.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Company subtotal */}
                        <tr className={`${color.light} border-t border-slate-200 font-extrabold text-xs`}>
                          <td className="px-4 py-3 text-slate-700">{language === 'bn' ? 'সাবটোটাল' : 'Subtotal'}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-600">
                            {productRows.reduce((s, r) => s + r.unitsSold, 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-indigo-700">
                            {formatBDT(productRows.reduce((s, r) => s + r.cost, 0))}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-700">
                            {formatBDT(productRows.reduce((s, r) => s + r.revenue, 0))}
                          </td>
                          <td className={`px-4 py-3 text-right font-mono ${companyRow.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatBDT(companyRow.profit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${color.badge}`}>
                              {companyRow.margin.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      )}

      {/* TAB CONTENT: PROFIT MARGIN TOOL (DP/TP VARIANCE) */}
      {activeTab === 'margin' && userRole === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t.profitMarginTitle}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Variance and profit percentages based on Dealer Price (DP) and Trade Price (TP) variance.</p>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-indigo-700 font-mono">
              <Percent className="w-3.5 h-3.5" />
              <span>Profit Margin = ((TP - DP) / DP) * 100</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                  <th className="px-4 py-3">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                  <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'ডিলার মূল্য (DP)' : 'Dealer Price (DP)'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'ট্রেড মূল্য (TP)' : 'Trade Price (TP)'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'খুচরা মূল্য (MRP)' : 'Retail Price (MRP)'}</th>
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'পার্থক্য (Tk)' : 'Variance (Tk)'}</th>
                  <th className="px-4 py-3 text-center">{t.profitPct}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {profitMarginToolData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-850">{row.product.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold text-[10px]">
                        {row.product.company}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-650">{formatBDT(row.dp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatBDT(row.tp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-450">{formatBDT(row.mrp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">+{formatBDT(row.variance)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] animate-fade-in">
                        {row.marginPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


        </div>
      )}

      {/* TAB CONTENT: DP PRICE LIST */}
      {activeTab === 'dp' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'কোম্পানিভিত্তিক ডিপি প্রাইস তালিকা' : 'Company-wise DP Price List'}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  {language === 'bn'
                    ? `মোট ${dpPriceReportData.total}টি পণ্য · ${dpPriceReportData.companies.length}টি কোম্পানি`
                    : `${dpPriceReportData.total} Products · ${dpPriceReportData.companies.length} Companies`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">DP = Purchase Price</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">TP = Trade / Supply Price</span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">MRP = Retail Price</span>
              </div>
            </div>

            {dpPriceReportData.companies.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-semibold text-sm">
                {language === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি।' : 'No products found.'}
              </div>
            ) : (
              <div className="space-y-6">
                {dpPriceReportData.companies.map((companyName, compIdx) => {
                  const compProducts = dpPriceReportData.groupedByCompany[companyName];
                  const colors = [
                    { bg: 'bg-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
                    { bg: 'bg-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
                    { bg: 'bg-violet-600', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
                    { bg: 'bg-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
                    { bg: 'bg-rose-600', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
                  ];
                  const color = colors[compIdx % colors.length];

                  return (
                    <div key={companyName} className={`border ${color.border} rounded-2xl overflow-hidden`}>
                      {/* Company Header */}
                      <div className={`${color.light} ${color.border} border-b px-5 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${color.bg}`} />
                          <div>
                            <span className={`font-extrabold text-sm ${color.text}`}>{companyName}</span>
                            <span className="ml-2 text-[10px] font-bold text-slate-400">
                              {compProducts.length} {language === 'bn' ? 'টি পণ্য' : 'products'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Products Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/60">
                              <th className="px-4 py-2.5">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                              <th className="px-4 py-2.5 text-center">{language === 'bn' ? 'এসকেইউ' : 'SKU'}</th>
                              <th className="px-4 py-2.5 text-right text-indigo-600">DP (৳)</th>
                              <th className="px-4 py-2.5 text-right text-emerald-600">TP (৳)</th>
                              <th className="px-4 py-2.5 text-right text-amber-600">MRP (৳)</th>
                              <th className="px-4 py-2.5 text-right text-slate-500">
                                {language === 'bn' ? 'মার্জিন (TP-DP)' : 'Margin (TP−DP)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs">
                            {compProducts.map((p, idx) => {
                              const margin = p.defaultWSP - p.defaultPP;
                              const marginPct = p.defaultPP > 0 ? (margin / p.defaultPP) * 100 : 0;
                              return (
                                <tr key={p.id} className={`hover:bg-slate-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/20'}`}>
                                  <td className="px-4 py-3 font-semibold text-slate-800">{p.name}</td>
                                  <td className="px-4 py-3 text-center font-mono text-slate-400 text-[10px]">{p.sku}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">৳{p.defaultPP.toLocaleString('en-BD')}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">৳{p.defaultWSP.toLocaleString('en-BD')}</td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-700">৳{p.defaultMRP.toLocaleString('en-BD')}</td>
                                  <td className="px-4 py-3 text-right">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${color.badge}`}>
                                      +৳{margin.toLocaleString('en-BD')}
                                      <span className="opacity-70">({marginPct.toFixed(1)}%)</span>
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DAY-END SETTLEMENT */}
      {activeTab === 'dayend' && userRole === 'admin' && (
        <div className="space-y-8">
          {dayEndSettlementData.map((company, cIdx) => {
            const headerColors = [
              { bg: 'bg-indigo-700', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-600' },
              { bg: 'bg-emerald-700', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-600' },
              { bg: 'bg-violet-700', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-600' },
              { bg: 'bg-orange-700', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-600' },
              { bg: 'bg-rose-700', light: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-600' },
            ];
            const clr = headerColors[cIdx % headerColors.length];

            return (
              <div key={company.companyName} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

                {/* Company Header */}
                <div className={`${clr.bg} px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                      <span className="text-white font-black text-sm">{company.companyName.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-extrabold text-base tracking-tight">{company.companyName}</h3>
                      <p className="text-white/70 text-[10px] font-semibold">
                        {language === 'bn' ? 'দিন শেষ হিসাব বিবরণী' : 'Day-End Settlement Sheet'}
                        {' · '}{startDate} {language === 'bn' ? 'থেকে' : 'to'} {endDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">{language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}</p>
                      <p className="text-white font-black text-lg font-mono">{formatBDT(company.totalSales)}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">{language === 'bn' ? 'নিট লাভ' : 'Net Profit'}</p>
                      <p className={`font-black text-lg font-mono ${company.totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatBDT(company.totalProfit)}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">{language === 'bn' ? 'স্টক মূল্য' : 'Stock Value'}</p>
                      <p className="text-white font-black text-lg font-mono">{formatBDT(company.totalStock)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row">

                  {/* Main Product Table */}
                  <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`${clr.light} text-[10px] font-bold uppercase tracking-wider border-b ${clr.border}`}>
                          <th className="px-3 py-2.5 text-slate-500 w-8">SL</th>
                          <th className="px-3 py-2.5 text-slate-700">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                          <th className="px-3 py-2.5 text-right text-indigo-600">DP (৳)</th>
                          <th className="px-3 py-2.5 text-right text-emerald-600">TP (৳)</th>
                          <th className="px-3 py-2.5 text-center text-slate-500">{language === 'bn' ? 'ওপেনিং স্টক' : 'Opening'}</th>
                          <th className="px-3 py-2.5 text-center text-blue-600">{language === 'bn' ? 'বিক্রয় পরিমাণ' : 'Sales Qty'}</th>
                          <th className="px-3 py-2.5 text-center text-slate-500">{language === 'bn' ? 'ক্লোজিং স্টক' : 'Closing'}</th>
                          <th className="px-3 py-2.5 text-right text-emerald-600">{language === 'bn' ? 'বিক্রয় মূল্য' : 'Sales Amt'}</th>
                          <th className="px-3 py-2.5 text-right text-indigo-500">{language === 'bn' ? 'স্টক মূল্য' : 'Stock Amt'}</th>
                          <th className="px-3 py-2.5 text-right">{language === 'bn' ? 'লাভ (৳)' : 'Profit'}</th>
                          <th className="px-3 py-2.5 text-center">{language === 'bn' ? 'মার্জিন' : '%'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {company.productRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-50/60 transition-colors ${
                              row.salesQty > 0 ? '' : 'opacity-50'
                            } ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                          >
                            <td className="px-3 py-2.5 text-slate-400 font-mono text-[10px]">{row.slNo}</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">
                              <div>{row.productName}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{row.sku}</div>
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-indigo-700">{row.dp.toLocaleString('en-BD')}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-emerald-700">{row.tp.toLocaleString('en-BD')}</td>
                            <td className="px-3 py-2.5 text-center font-mono text-slate-500">{row.openingStock.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-center font-mono font-bold text-blue-700">
                              {row.salesQty > 0 ? row.salesQty.toLocaleString() : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center font-mono text-slate-600">{row.closingStock.toLocaleString()}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                              {row.salesQty > 0 ? formatBDT(row.salesAmt) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-indigo-600">{formatBDT(row.stockAmt)}</td>
                            <td className={`px-3 py-2.5 text-right font-mono font-extrabold ${
                              row.profit > 0 ? 'text-emerald-700' : row.profit < 0 ? 'text-rose-600' : 'text-slate-300'
                            }`}>
                              {row.salesQty > 0 ? formatBDT(row.profit) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {row.salesQty > 0 ? (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  row.profitPct >= 5 ? 'bg-emerald-100 text-emerald-700' :
                                  row.profitPct >= 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {row.profitPct.toFixed(2)}%
                                </span>
                              ) : <span className="text-slate-200">—</span>}
                            </td>
                          </tr>
                        ))}

                        {/* Grand Total Row */}
                        <tr className={`${clr.light} border-t-2 ${clr.border} font-extrabold text-xs`}>
                          <td className="px-3 py-3" colSpan={2}>
                            <span className={`${clr.text} font-extrabold uppercase text-[10px] tracking-wider`}>
                              {language === 'bn' ? 'সর্বমোট' : 'Grand Total'}
                            </span>
                          </td>
                          <td colSpan={2} />
                          <td className="px-3 py-3 text-center font-mono text-slate-700">
                            {company.productRows.reduce((s, r) => s + r.openingStock, 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-blue-700">
                            {company.totalSalesQty.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-slate-700">
                            {company.productRows.reduce((s, r) => s + r.closingStock, 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-emerald-800">{formatBDT(company.totalSales)}</td>
                          <td className="px-3 py-3 text-right font-mono text-indigo-700">{formatBDT(company.totalStock)}</td>
                          <td className={`px-3 py-3 text-right font-mono ${
                            company.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>{formatBDT(company.totalProfit)}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                              company.totalProfit >= 0 ? clr.text + ' bg-white border ' + clr.border : 'text-rose-700 bg-rose-50'
                            }`}>
                              {company.totalSales > 0
                                ? ((company.totalProfit / (company.totalSales - company.totalProfit)) * 100).toFixed(2)
                                : '0.00'}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right: Summary + Return/Damage Panel */}
                  <div className={`xl:w-64 shrink-0 border-t xl:border-t-0 xl:border-l ${clr.border} flex flex-col`}>

                    {/* Total Summary Box */}
                    <div className={`${clr.light} p-4 border-b ${clr.border}`}>
                      <p className={`text-[10px] font-extrabold uppercase tracking-wider ${clr.text} mb-3`}>
                        {language === 'bn' ? 'মোট সারসংক্ষেপ' : 'Total Summary'}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">{language === 'bn' ? 'মোট স্টক মূল্য' : 'Total Stock'}</span>
                          <span className="font-mono font-extrabold text-xs text-slate-800">{formatBDT(company.totalStock)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-500">{language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}</span>
                          <span className="font-mono font-extrabold text-xs text-emerald-700">{formatBDT(company.totalSales)}</span>
                        </div>
                        <div className={`flex justify-between items-center pt-2 border-t ${clr.border}`}>
                          <span className={`text-[10px] font-extrabold ${clr.text}`}>{language === 'bn' ? 'নিট লাভ' : 'Total Profit'}</span>
                          <span className={`font-mono font-black text-sm ${
                            company.totalProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>{formatBDT(company.totalProfit)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Return / Damage Panel */}
                    <div className="p-4 flex-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 mb-3">
                        {language === 'bn' ? 'রিটার্ন / ড্যামেজ' : 'Return / Damage'}
                      </p>
                      {[...company.returnRows, ...company.damageRows].length === 0 ? (
                        <p className="text-[10px] text-slate-300 font-semibold">
                          {language === 'bn' ? 'কোনো রিটার্ন/ড্যামেজ নেই' : 'No returns or damages'}
                        </p>
                      ) : (
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="border-b border-rose-100 text-[9px] font-bold text-rose-400 uppercase">
                              <th className="pb-1.5 text-left">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                              <th className="pb-1.5 text-center">{language === 'bn' ? 'পরিমাণ' : 'Qty'}</th>
                              <th className="pb-1.5 text-right">{language === 'bn' ? 'ধরন' : 'Type'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-50">
                            {[...company.returnRows, ...company.damageRows].map((r, i) => (
                              <tr key={i}>
                                <td className="py-1.5 font-semibold text-slate-700 leading-tight" style={{maxWidth:'100px', wordBreak:'break-word'}}>
                                  {r.productName}
                                </td>
                                <td className="py-1.5 text-center font-mono font-bold text-rose-700">{r.damagedQty}</td>
                                <td className="py-1.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    r.type === 'Return' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                  }`}>{r.type}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {dayEndSettlementData.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center text-slate-400 font-semibold">
              {language === 'bn' ? 'কোনো ডেটা পাওয়া যায়নি।' : 'No settlement data available for the selected period.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
