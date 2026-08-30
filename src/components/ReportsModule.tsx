'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  ClipboardList,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { Product, ChallanItem, SR, CompanyBrand, ExpenseRecord, DeliveryMan, UnitOfMeasure, ProductUnit, Claim, ClaimSettlement } from '../types';
import { translations, Language } from '../translations';
import { getStockValueDP, getStockValueTP, getDP, getTP } from '../lib/productUtils';
import { exportReportPDF, exportReportExcel, printReport, type ReportType } from '../lib/reportEngine';

function CartonPcsDisplay({ 
  qty, 
  cartonSize, 
  primaryUnit, 
  cartons, 
  pcs,
  language = 'en',
  cartonColor = "text-indigo-700",
  pcsColor = "text-emerald-700"
}: { 
  qty?: number; 
  cartonSize?: number; 
  primaryUnit?: string; 
  cartons?: number; 
  pcs?: number;
  language?: Language;
  cartonColor?: string;
  pcsColor?: string;
}) {
  // If pre-computed cartons/pcs are provided, use them!
  if (cartons !== undefined && pcs !== undefined) {
    const rawPcs = qty !== undefined ? qty : 0;
    return (
      <div className="font-mono text-[11px] leading-snug">
        <span className={`${cartonColor} font-bold`}>{cartons.toLocaleString()}</span>
        <span className="text-slate-400 text-[9px]"> Ctn</span>
        <span className="text-slate-300 mx-0.5">+</span>
        <span className={`${pcsColor} font-bold`}>{pcs}</span>
        <span className="text-slate-400 text-[9px]"> Pcs</span>
        {rawPcs > 0 && (
          <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
            ({language === 'bn' ? `মোট: ${rawPcs.toLocaleString()} পিস` : `Total: ${rawPcs.toLocaleString()} Pcs`})
          </div>
        )}
      </div>
    );
  }

  // Fallback to single-product calculation logic:
  const activeQty = qty || 0;
  const cs = (cartonSize && cartonSize > 1) ? cartonSize : 24;

  if (primaryUnit === 'Carton') {
    const totalPcs = Math.round(activeQty * cs);
    return (
      <div className="font-mono text-[11px] leading-snug">
        <span className={`${cartonColor} font-bold`}>{activeQty.toLocaleString()}</span>
        <span className="text-slate-400 text-[9px]"> Ctn</span>
        <span className="text-slate-300 mx-0.5">+</span>
        <span className={`${pcsColor} font-bold`}>0</span>
        <span className="text-slate-400 text-[9px]"> Pcs</span>
        <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
          ({language === 'bn' ? `মোট: ${totalPcs.toLocaleString()} পিস` : `Total: ${totalPcs.toLocaleString()} Pcs`})
        </div>
      </div>
    );
  }

  const computedCartons = Math.floor(activeQty / cs);
  const computedPcs = activeQty % cs;

  return (
    <div className="font-mono text-[11px] leading-snug">
      <span className={`${cartonColor} font-bold`}>{computedCartons.toLocaleString()}</span>
      <span className="text-slate-400 text-[9px]"> Ctn</span>
      <span className="text-slate-300 mx-0.5">+</span>
      <span className={`${pcsColor} font-bold`}>{computedPcs}</span>
      <span className="text-slate-400 text-[9px]"> Pcs</span>
      <div className="text-[9px] text-slate-500 font-semibold mt-0.5">
        ({language === 'bn' ? `মোট: ${activeQty.toLocaleString()} পিস` : `Total: ${activeQty.toLocaleString()} Pcs`})
      </div>
    </div>
  );
}

function getAggregatedStockQty(productsList: Product[], field: 'currentStock' | 'damagedStock') {
  let totalCartons = 0;
  let totalPcs = 0;
  let totalRawPcs = 0;

  productsList.forEach(p => {
    const val = Number(p[field]) || 0;
    if (val <= 0) return;

    const cs = (p.cartonSize && p.cartonSize > 1) ? p.cartonSize : 24;

    if (p.primaryUnit === 'Carton') {
      totalCartons += val;
      totalRawPcs += val * cs;
    } else {
      totalCartons += Math.floor(val / cs);
      totalPcs += val % cs;
      totalRawPcs += val;
    }
  });

  return { cartons: totalCartons, pcs: totalPcs, rawPcs: totalRawPcs };
}

function getAggregatedChallanQty(items: ChallanItem[], productsList: Product[], field: 'qty' | 'returnedQty' | 'damagedQty') {
  let totalCartons = 0;
  let totalPcs = 0;
  let totalRawPcs = 0;

  items.forEach(item => {
    const val = Number(item[field]) || 0;
    if (val <= 0) return;

    const product = productsList.find(p => (p.name || '').trim().toLowerCase() === (item.productName || '').trim().toLowerCase());
    const cs = (product?.cartonSize && product.cartonSize > 1) ? product.cartonSize : 24;

    if (product?.primaryUnit === 'Carton') {
      totalCartons += val;
      totalRawPcs += val * cs;
    } else {
      totalCartons += Math.floor(val / cs);
      totalPcs += val % cs;
      totalRawPcs += val;
    }
  });

  return { cartons: totalCartons, pcs: totalPcs, rawPcs: totalRawPcs };
}

interface ReportsModuleProps {
  products:     Product[];
  challans:     ChallanItem[];
  srs:          SR[];
  companies:    CompanyBrand[];
  deliveryMen:  DeliveryMan[];
  expenses:     ExpenseRecord[];
  units:        UnitOfMeasure[];
  language:     Language;
  userRole?:    'admin' | 'sr';
  // Branding — wired from page.tsx
  shopName?:    string;
  shopSubBrand?:string;
  shopLogo?:    string;
  loggedInSrName?: string;
  claims?:      Claim[];
  claimSettlements?: ClaimSettlement[];
  defaultTab?: ReportTab;
  onTabChange?: (tab: ReportTab) => void;
}

type ReportTab = 'stock' | 'sales' | 'profit' | 'margin' | 'damage' | 'dp' | 'dayend' | 'claims';

export default function ReportsModule({
  products: propProducts,
  challans: propChallans,
  srs,
  companies,
  deliveryMen,
  expenses,
  units,
  language,
  userRole = 'admin',
  shopName     = 'Bangla-Chain ERP',
  shopSubBrand = 'Distribution Management System',
  shopLogo,
  loggedInSrName,
  claims = [],
  claimSettlements = [],
  defaultTab = 'stock',
  onTabChange
}: ReportsModuleProps) {
  // ── SR Restriction Calculations ──────────────────────────────────────────────
  const loggedInSr = useMemo(() => {
    if (userRole !== 'sr') return null;
    const srId = typeof window !== 'undefined' ? sessionStorage.getItem('erp_sr_id') : null;
    return srs.find(sr => 
      (srId && sr.id === srId) || 
      (loggedInSrName && sr.name.toLowerCase() === loggedInSrName.toLowerCase())
    );
  }, [userRole, loggedInSrName, srs]);

  const srAssignedCompanyNames = useMemo(() => {
    let list: string[] = [];
    if (loggedInSr) {
      list = loggedInSr.assignedCompanyIds || (loggedInSr as any).assigned_company_ids || [];
    }
    if (list.length === 0 && typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('erp_sr_companies');
        if (stored) list = JSON.parse(stored);
      } catch {}
    }
    if (list.length === 0) return [];

    const names: string[] = [];
    list.forEach(item => {
      const comp = companies.find(c => c.id === item || c.name.toLowerCase() === item.toLowerCase());
      if (comp) {
        names.push(comp.name);
      } else {
        names.push(item);
      }
    });
    return Array.from(new Set(names.filter(Boolean)));
  }, [loggedInSr, companies]);

  const products = useMemo(() => {
    if (userRole === 'sr' && srAssignedCompanyNames.length > 0) {
      return propProducts.filter(p => 
        srAssignedCompanyNames.some(cn => cn.toLowerCase() === (p.company || '').toLowerCase())
      );
    }
    return propProducts;
  }, [propProducts, userRole, srAssignedCompanyNames]);

  const challans = useMemo(() => {
    if (userRole === 'sr' && loggedInSrName) {
      return propChallans.filter(ch => {
        const matchSR = (ch.srName || '').toLowerCase() === loggedInSrName.toLowerCase();
        const matchComp = srAssignedCompanyNames.length === 0 || srAssignedCompanyNames.some(cn => cn.toLowerCase() === (ch.company || '').toLowerCase());
        return matchSR && matchComp;
      });
    }
    return propChallans;
  }, [propChallans, userRole, loggedInSrName, srAssignedCompanyNames]);

  const t = translations[language].reports;
  const tCommon = translations[language].common;

  // Tabs (restricted to stock/sales for SR)
  const [activeTab, setActiveTab] = useState<ReportTab>(defaultTab);

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const handleTabSelect = (tab: ReportTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  
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
  const [selectedSrFilter, setSelectedSrFilter] = useState(() => {
    if (userRole === 'sr' && loggedInSrName) {
      return loggedInSrName;
    }
    return 'All';
  });
  const [selectedDeliveryManFilter, setSelectedDeliveryManFilter] = useState('All');

  // Filter SRs by selected company
  const filteredSrsForFilter = useMemo(() => {
    if (selectedCompanyFilter === 'All') return srs;
    const comp = companies.find(c => 
      c.name.toLowerCase().includes(selectedCompanyFilter.toLowerCase()) ||
      selectedCompanyFilter.toLowerCase().includes(c.name.toLowerCase())
    );
    if (!comp) return srs;
    return srs.filter(sr => (sr.assignedCompanyIds || []).some(cid => cid === comp.id || cid.toLowerCase() === comp.name.toLowerCase()));
  }, [selectedCompanyFilter, companies, srs]);

  // Auto reset SR filter if selected SR is not in company's SR list
  React.useEffect(() => {
    if (selectedCompanyFilter !== 'All' && selectedSrFilter !== 'All' && userRole !== 'sr') {
      const isSrInCompany = filteredSrsForFilter.some(sr => sr.name.toLowerCase() === selectedSrFilter.toLowerCase());
      if (!isSrInCompany) {
        setSelectedSrFilter('All');
      }
    }
  }, [selectedCompanyFilter, filteredSrsForFilter, selectedSrFilter, userRole]);

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
      const matchesSR = selectedSrFilter === 'All' || (ch.srName || '').toLowerCase() === selectedSrFilter.toLowerCase();
      const matchesDM = selectedDeliveryManFilter === 'All' || (ch.deliveryManName || '').toLowerCase() === selectedDeliveryManFilter.toLowerCase();
      const matchesStatus = ch.status === 'Delivered'; // Only Delivered challans count
      return matchesDate && matchesCompany && matchesSR && matchesDM && matchesStatus;
    });
  }, [challans, startDate, endDate, selectedCompanyFilter, selectedSrFilter, selectedDeliveryManFilter]);

  // ═══════════════════════════════════════════════════════════════
  // 1. STOCK REPORT DATA CALCULATION (with DP & TP)
  // ═══════════════════════════════════════════════════════════════
  const stockReportData = useMemo(() => {
    const brandList = selectedCompanyFilter === 'All'
      ? Array.from(new Set(products.map(p => p.company).filter(Boolean)))
      : [selectedCompanyFilter];
    let grandValueDP = 0;
    let grandValueTP = 0;

    const rows = brandList.map(brandName => {
      const brandProducts = products.filter(p => p.company === brandName);
      const totalValueDP = brandProducts.reduce((sum, p) => sum + getStockValueDP(p), 0);
      const totalValueTP = brandProducts.reduce((sum, p) => sum + getStockValueTP(p), 0);
      const stockQtyObj = getAggregatedStockQty(brandProducts, 'currentStock');

      grandValueDP += totalValueDP;
      grandValueTP += totalValueTP;

      return {
        companyName: brandName,
        stockQtyObj,
        totalValueDP,
        totalValueTP,
        potentialMargin: Math.max(0, totalValueTP - totalValueDP)
      };
    });

    const grandStockQtyObj = getAggregatedStockQty(
      selectedCompanyFilter === 'All' ? products : products.filter(p => p.company === selectedCompanyFilter),
      'currentStock'
    );

    return {
      rows,
      grandStockQtyObj,
      grandValueDP,
      grandValueTP,
      grandPotentialMargin: Math.max(0, grandValueTP - grandValueDP)
    };
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
      const unitsSold = brandChallans.reduce((sum, ch) => sum + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
      const revenue = brandChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
      const returns = brandChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = brandChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = brandChallans.reduce((sum, ch) => {
        const product = products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return sum + ((product?.defaultPP || 0) * netQty);
      }, 0);

      const soldQtyObj = getAggregatedChallanQty(brandChallans, products, 'qty');
      const returnsQtyObj = getAggregatedChallanQty(brandChallans, products, 'returnedQty');
      const damagesQtyObj = getAggregatedChallanQty(brandChallans, products, 'damagedQty');

      return {
        companyName: brandName,
        unitsSold,
        revenue,
        dpTotal,
        returns,
        damages,
        soldQtyObj,
        returnsQtyObj,
        damagesQtyObj
      };
    });

    // B. SR-wise Sales
    const activeSrs = selectedSrFilter === 'All'
      ? srs
      : srs.filter(s => (s.name || '').toLowerCase() === selectedSrFilter.toLowerCase());
    const srSales = activeSrs.map(sr => {
      const srChallans = filteredChallans.filter(ch => (ch.srName || '').toLowerCase() === (sr.name || '').toLowerCase());
      const unitsSold = srChallans.reduce((sum, ch) => sum + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
      const revenue = srChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
      const returns = srChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = srChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpTotal = srChallans.reduce((sum, ch) => {
        const product = products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return sum + ((product?.defaultPP || 0) * netQty);
      }, 0);

      const soldQtyObj = getAggregatedChallanQty(srChallans, products, 'qty');
      const returnsQtyObj = getAggregatedChallanQty(srChallans, products, 'returnedQty');
      const damagesQtyObj = getAggregatedChallanQty(srChallans, products, 'damagedQty');

      return {
        srName: sr.name,
        phone: sr.phone,
        unitsSold,
        revenue,
        returns,
        damages,
        dpTotal,
        soldQtyObj,
        returnsQtyObj,
        damagesQtyObj
      };
    });

    // C. Delivery Man-wise Sales
    const activeDeliveryMen = selectedDeliveryManFilter === 'All'
      ? deliveryMen
      : deliveryMen.filter(dm => (dm.name || '').toLowerCase() === selectedDeliveryManFilter.toLowerCase());
    const dmSales = activeDeliveryMen.map(dm => {
      const dmChallans = filteredChallans.filter(ch => (ch.deliveryManName || '').toLowerCase() === (dm.name || '').toLowerCase());
      const unitsSold = dmChallans.reduce((sum, ch) => sum + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
      const revenue = dmChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
      const returns = dmChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = dmChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const totalChallans = dmChallans.length;
      const dpTotal = dmChallans.reduce((sum, ch) => {
        const product = products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return sum + ((product?.defaultPP || 0) * netQty);
      }, 0);

      const soldQtyObj = getAggregatedChallanQty(dmChallans, products, 'qty');
      const returnsQtyObj = getAggregatedChallanQty(dmChallans, products, 'returnedQty');
      const damagesQtyObj = getAggregatedChallanQty(dmChallans, products, 'damagedQty');

      return {
        dmName: dm.name,
        vehicle: dm.vehicle,
        unitsSold,
        revenue,
        returns,
        damages,
        totalChallans,
        dpTotal,
        soldQtyObj,
        returnsQtyObj,
        damagesQtyObj
      };
    });

    // D. Product-wise Sales (Net Sold, Net Cost, Net Revenue, DP/TP rates)
    const productSales = products.map(p => {
      const pChallans = filteredChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
      const unitsSold = pChallans.reduce((sum, ch) => sum + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
      const revenue = pChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
      const returns = pChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = pChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);
      const dpRate = getDP(p);
      const tpRate = getTP(p);
      const dpTotal = unitsSold * dpRate;

      return {
        productName: p.name,
        sku: p.sku,
        company: p.company,
        unitsSold,
        revenue,
        returns,
        damages,
        dpRate,
        tpRate,
        dpTotal,
        profit: Math.max(0, revenue - dpTotal),
        cartonSize: p.cartonSize,
        primaryUnit: p.primaryUnit
      };
    }).filter(row => {
      const matchesCompany = selectedCompanyFilter === 'All' || row.company === selectedCompanyFilter;
      return matchesCompany && (row.unitsSold > 0 || row.returns > 0 || row.damages > 0);
    });

    // E. Unit-wise Sales (UOM Grouping)
    const unitGroups: { [unitName: string]: { unitsSold: number; returns: number; damages: number; revenue: number; dpTotal: number } } = {};
    for (const ch of filteredChallans) {
      const uom = ch.selectedUnitName || 'Pcs';
      if (!unitGroups[uom]) {
        unitGroups[uom] = { unitsSold: 0, returns: 0, damages: 0, revenue: 0, dpTotal: 0 };
      }
      const product = products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
      const pp = product?.defaultPP || 0;
      const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
      const dpVal = pp * netQty;

      unitGroups[uom].unitsSold += netQty;
      unitGroups[uom].returns += ch.returnedQty || 0;
      unitGroups[uom].damages += ch.damagedQty || 0;
      unitGroups[uom].revenue += (ch.totalAmount || 0);
      unitGroups[uom].dpTotal += dpVal;
    }

    const unitSales = Object.entries(unitGroups).map(([unitName, data]) => ({
      unitName,
      ...data
    }));

    const grandSoldQtyObj = getAggregatedChallanQty(filteredChallans, products, 'qty');
    const grandReturnsQtyObj = getAggregatedChallanQty(filteredChallans, products, 'returnedQty');
    const grandDamagesQtyObj = getAggregatedChallanQty(filteredChallans, products, 'damagedQty');
    const grandReturnsAndDamagesQtyObj = {
      cartons: grandReturnsQtyObj.cartons + grandDamagesQtyObj.cartons,
      pcs: grandReturnsQtyObj.pcs + grandDamagesQtyObj.pcs,
      rawPcs: grandReturnsQtyObj.rawPcs + grandDamagesQtyObj.rawPcs
    };

    return { 
      companySales, 
      srSales, 
      dmSales, 
      productSales, 
      unitSales,
      grandSoldQtyObj,
      grandReturnsAndDamagesQtyObj
    };
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
          .filter(ch => (ch.productName || '').toLowerCase() === (p.name || '').toLowerCase())
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
      const revenue = brandChallans.reduce((sum, ch) => sum + (ch.totalAmount || 0), 0);
      
      // Calculate Cost of Goods Sold based on Product DP (defaultPP) using Net Delivered Qty (returns and damages excluded)
      const costOfGoods = brandChallans.reduce((sum, ch) => {
        const prod = products.find(p => (p.name || '').trim().toLowerCase() === (ch.productName || '').trim().toLowerCase());
        const dp = prod ? prod.defaultPP : (ch.rate * 0.80);
        const netQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
        return sum + (netQty * dp);
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
        const pChallans = companyChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase());
        const salesQty   = pChallans.reduce((s, ch) => s + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
        const salesAmt   = pChallans.reduce((s, ch) => s + (ch.totalAmount || 0), 0);
        // Opening stock = current stock + gross sold qty (since stock was reduced after sales)
        const grossQty   = pChallans.reduce((s, ch) => s + ch.qty, 0);
        const openingStock = p.currentStock + grossQty;
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
  // REPORT EXPORT — PDF / Excel / Print
  // Maps the active tab to the engine's ReportType:
  //   'dp'      → 'pricelist'  (was blank — no handler existed)
  //   'margin'  → 'margin'     (was blank — no handler existed)
  //   'dayend'  → 'dayend'     (was blank — no handler existed)
  //   all other tabs map 1-to-1
  // ═══════════════════════════════════════════════════════════════

  /** Build the common options object for the report engine */
  const buildReportOpts = useCallback(() => {
    const typeMap: Record<ReportTab, ReportType> = {
      stock:   'stock',
      sales:   'sales',
      damage:  'damage',
      profit:  'profit',
      margin:  'margin',
      dp:      'pricelist',
      dayend:  'dayend',
      claims:  'claims',
    };
    const mappedType: ReportType = typeMap[activeTab];
    return {
      type:          mappedType,
      subTab:        activeTab === 'stock' ? stockSubTab : (activeTab === 'sales' ? salesSubTab : undefined),
      shopName:      shopName     || 'Bangla-Chain ERP',
      shopSubBrand:  shopSubBrand || 'Distribution Management System',
      generatedBy:   userRole === 'admin' ? (typeof window !== 'undefined' && localStorage.getItem('erp_settings') ? ((JSON.parse(localStorage.getItem('erp_settings')!) as { ownerName?: string }).ownerName || 'Admin') : 'Admin') : (loggedInSrName || 'SR'),
      startDate,
      endDate,
      language,
      filterCompany: selectedCompanyFilter !== 'All' ? selectedCompanyFilter : undefined,
      filterSR:      selectedSrFilter      !== 'All' ? selectedSrFilter      : undefined,
      filterDM:      selectedDeliveryManFilter !== 'All' ? selectedDeliveryManFilter : undefined,
      products,
      challans,
      srs,
      deliveryMen,
      expenses,
      companies,
      claims,
      claimSettlements
    };
  }, [
    activeTab, stockSubTab, salesSubTab, shopName, shopSubBrand, shopLogo, userRole, loggedInSrName,
    startDate, endDate, language,
    selectedCompanyFilter, selectedSrFilter, selectedDeliveryManFilter,
    products, challans, srs, deliveryMen, expenses, companies, claims, claimSettlements
  ]);

  const handleDownloadPDF = useCallback(() => {
    exportReportPDF(buildReportOpts());
  }, [buildReportOpts]);

  const handleExportExcel = useCallback(() => {
    exportReportExcel(buildReportOpts());
  }, [buildReportOpts]);

  const handlePrint = useCallback(() => {
    printReport(buildReportOpts());
  }, [buildReportOpts]);

  return (
    <div className="p-6 space-y-6">
      
      {/* Header and Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.title}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-none text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer active:scale-95"
            title="Print current report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-none text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer active:scale-95"
            title="Export as CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-slate-950 text-white rounded-none text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer active:scale-95"
            title="Download professional PDF report"
          >
            <Download className="w-4 h-4" />
            {t.downloadReport}
          </button>
        </div>
      </div>

      {/* ── Primary Report Navigation Tabs ────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabSelect('stock')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'stock'
              ? 'bg-indigo-900 text-white border-indigo-900 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{language === 'bn' ? 'স্টক রিপোর্ট (DP ও TP)' : 'Stock Report (DP & TP)'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('sales')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'sales'
              ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{language === 'bn' ? 'বিক্রয় রিপোর্ট' : 'Sales Report'}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('damage')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border ${
            activeTab === 'damage'
              ? 'bg-rose-800 text-white border-rose-800 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{language === 'bn' ? 'ড্যামেজ রিপোর্ট' : 'Damage Report'}</span>
        </button>

        {userRole !== 'sr' && (
          <>
            <button
              type="button"
              onClick={() => handleTabSelect('profit')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'profit'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>{language === 'bn' ? 'লাভ-ক্ষতি রিপোর্ট' : 'Profit & Loss'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSelect('claims')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer border ${
                activeTab === 'claims'
                  ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>{language === 'bn' ? 'কোম্পানি ক্লেইমস' : 'Company Claims'}</span>
            </button>
          </>
        )}
      </div>

      {/* Date Range Selector Panel */}
      <div className="bg-indigo-50/30 border border-indigo-200 rounded-none p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="flex items-center gap-4.5 w-full md:w-auto">
          <div className="flex items-center gap-2 text-slate-850 font-bold text-xs shrink-0">
            <Calendar className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span className="text-indigo-900">{language === 'bn' ? 'সময়কাল:' : 'Period Preset:'}</span>
          </div>
          <select
            value={preset}
            onChange={e => handlePresetChange(e.target.value)}
            className="h-9 rounded-none border border-indigo-200 bg-white px-3 text-xs font-bold text-indigo-850 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-sm"
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
            <div className="relative flex items-center">
              <div className="absolute left-2.5 w-6 h-6 rounded-none bg-indigo-50 border border-indigo-200/60 flex items-center justify-center pointer-events-none z-10">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <input
                type="date"
                disabled={preset !== 'custom'}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 pl-10 pr-2.5 rounded-none border border-indigo-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-450 transition-all font-mono shadow-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{language === 'bn' ? 'শেষ:' : 'To:'}</span>
            <div className="relative flex items-center">
              <div className="absolute left-2.5 w-6 h-6 rounded-none bg-rose-50 border border-rose-200/60 flex items-center justify-center pointer-events-none z-10">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <input
                type="date"
                disabled={preset !== 'custom'}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 pl-10 pr-2.5 rounded-none border border-indigo-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-450 transition-all font-mono shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Filters Panel */}
      <div className="bg-indigo-50/30 border border-indigo-200 rounded-none p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-indigo-500 animate-ping shrink-0" />
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
              {language === 'bn' ? 'রিপোর্ট ফিল্টার কন্ট্রোল' : 'Report Filters Control'}
            </span>
          </div>
          {(selectedCompanyFilter !== 'All' || (userRole !== 'sr' && selectedSrFilter !== 'All') || selectedDeliveryManFilter !== 'All') && (
            <button
              onClick={() => {
                setSelectedCompanyFilter('All');
                if (userRole !== 'sr') {
                  setSelectedSrFilter('All');
                }
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
              className="h-10 w-full rounded-none border border-orange-200 bg-orange-50/10 px-3 text-xs font-bold text-orange-850 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer shadow-sm"
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
              disabled={userRole === 'sr'}
              className="h-10 w-full rounded-none border border-purple-200 bg-purple-50/10 px-3 text-xs font-bold text-purple-855 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {userRole === 'sr' && loggedInSrName ? (
                <option value={loggedInSrName}>{loggedInSrName}</option>
              ) : (
                <>
                  <option value="All">{language === 'bn' ? 'সকল এসআর (SR)' : 'All SRs'}</option>
                  {filteredSrsForFilter.map(sr => (
                    <option key={sr.id} value={sr.name}>{sr.name}</option>
                  ))}
                </>
              )}
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
              className="h-10 w-full rounded-none border border-rose-200 bg-rose-50/10 px-3 text-xs font-bold text-rose-855 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="All">{language === 'bn' ? 'সকল ডেলিভারি ম্যান' : 'All Delivery Men'}</option>
              {deliveryMen.map(dm => (
                <option key={dm.id} value={dm.name}>{dm.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: STOCK REPORT */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock KPI Summary Cards */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${userRole !== 'sr' ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                {language === 'bn' ? 'মোট বর্তমান স্টক' : 'Total Current Stock'}
              </p>
              <CartonPcsDisplay
                cartons={stockReportData.grandStockQtyObj.cartons}
                pcs={stockReportData.grandStockQtyObj.pcs}
                qty={stockReportData.grandStockQtyObj.rawPcs}
                language={language}
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider mb-2">
                {language === 'bn' ? 'মোট স্টক মূল্য (DP / ডিলার দর)' : 'Stock Valuation (DP)'}
              </p>
              <p className="text-2xl font-black text-indigo-700 font-mono">
                {formatBDT(stockReportData.grandValueDP)}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider mb-2">
                {language === 'bn' ? 'মোট স্টক মূল্য (TP / ট্রেড দর)' : 'Stock Valuation (TP)'}
              </p>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {formatBDT(stockReportData.grandValueTP)}
              </p>
            </div>
            {userRole !== 'sr' && (
              <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase text-amber-600 tracking-wider mb-2">
                  {language === 'bn' ? 'সম্ভাব্য মোট গ্রস লাভ (TP - DP)' : 'Potential Gross Margin'}
                </p>
                <p className="text-2xl font-black text-amber-700 font-mono">
                  {formatBDT(stockReportData.grandPotentialMargin)}
                </p>
              </div>
            )}
          </div>

          {/* Stock report sub-tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-none w-fit">
            <button
              onClick={() => setStockSubTab('company')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                stockSubTab === 'company'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'কোম্পানি ভিত্তিক' : 'Company Summary'}
            </button>
            <button
              onClick={() => setStockSubTab('product')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.companyStockTitle}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'স্টক পরিমাণ' : 'Total Units'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'স্টক মূল্য (DP)' : 'Stock Valuation (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'স্টক মূল্য (TP)' : 'Stock Valuation (TP)'}</th>
                      {userRole !== 'sr' && <th className="px-4 py-3 text-right text-amber-600">{language === 'bn' ? 'সম্ভাব্য লাভ (TP - DP)' : 'Potential Margin'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {stockReportData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                        <td className="px-4 py-3.5 text-center">
                          <CartonPcsDisplay qty={row.stockQtyObj.rawPcs} cartons={row.stockQtyObj.cartons} pcs={row.stockQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.totalValueDP)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.totalValueTP)}</td>
                        {userRole !== 'sr' && <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-700">{formatBDT(row.potentialMargin)}</td>}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                      <td className="px-4 py-4">{language === 'bn' ? 'সর্বমোট স্টক' : 'GRAND TOTAL STOCK'}</td>
                      <td className="px-4 py-4 text-center">
                        <CartonPcsDisplay qty={stockReportData.grandStockQtyObj.rawPcs} cartons={stockReportData.grandStockQtyObj.cartons} pcs={stockReportData.grandStockQtyObj.pcs} language={language} />
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-indigo-700">{formatBDT(stockReportData.grandValueDP)}</td>
                      <td className="px-4 py-4 text-right font-mono text-emerald-700">{formatBDT(stockReportData.grandValueTP)}</td>
                      {userRole !== 'sr' && <td className="px-4 py-4 text-right font-mono text-amber-700">{formatBDT(stockReportData.grandPotentialMargin)}</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stockSubTab === 'product' && (
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'পণ্যভিত্তিক স্টক বিস্তারিত (DP ও TP রেট সহ)' : 'Product-wise Stock Details (with DP & TP)'}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'SKU' : 'SKU'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বর্তমান স্টক' : 'Current Stock'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত স্টক' : 'Damaged'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'DP দর' : 'DP Rate'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'TP দর' : 'TP Rate'}</th>
                      <th className="px-4 py-3 text-right text-indigo-700">{language === 'bn' ? 'মোট DP মূল্য' : 'Valuation (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-700">{language === 'bn' ? 'মোট TP মূল্য' : 'Valuation (TP)'}</th>
                      {userRole !== 'sr' && <th className="px-4 py-3 text-right text-amber-700">{language === 'bn' ? 'সম্ভাব্য লাভ' : 'Margin'}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {products.map((product, idx) => {
                      const valDP = getStockValueDP(product);
                      const valTP = getStockValueTP(product);
                      const margin = Math.max(0, valTP - valDP);
                      return (
                        <tr key={product.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-slate-850">{product.name}</td>
                          <td className="px-4 py-3.5 text-slate-600">{product.company}</td>
                          <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px]">{product.sku}</td>
                          <td className="px-4 py-3.5 text-center">
                            <CartonPcsDisplay qty={product.currentStock} cartonSize={product.cartonSize} primaryUnit={product.primaryUnit} language={language} />
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <CartonPcsDisplay qty={product.damagedStock || 0} cartonSize={product.cartonSize} primaryUnit={product.primaryUnit} language={language} />
                          </td>
                          <td className="px-4 py-3.5 text-right font-mono text-indigo-600">{formatBDT(getDP(product))}</td>
                          <td className="px-4 py-3.5 text-right font-mono text-emerald-600">{formatBDT(getTP(product))}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(valDP)}</td>
                          <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(valTP)}</td>
                          {userRole !== 'sr' && <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-700">{formatBDT(margin)}</td>}
                        </tr>
                      );
                    })}
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
            <div className="rounded-none border border-rose-200 bg-rose-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600">{language === 'bn' ? 'মোট ড্যামেজ ইউনিট' : 'Total Damage Units'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'পুরাতন + নতুন' : 'Old + New'}</div>
            </div>
            <div className="rounded-none border border-amber-200 bg-amber-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{language === 'bn' ? 'পুরাতন ড্যামেজ' : 'Old Damage'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalOldDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'আগে থাকা ড্যামেজ' : 'Existing damage'}</div>
            </div>
            <div className="rounded-none border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{language === 'bn' ? 'নতুন ড্যামেজ' : 'New Damage'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{damageReportData.totalNewDamageUnits.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'এই রিসার্চে যোগ হওয়া' : 'Added in this cycle'}</div>
            </div>
            <div className="rounded-none border border-slate-200 bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{language === 'bn' ? 'ড্যামেজ মান (TK)' : 'Damage Value (TK)'}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{formatBDT(damageReportData.totalDamageValue)}</div>
              <div className="text-[10px] text-slate-500">{language === 'bn' ? 'রেকর্ডেড বিক্রয় মূল্য: ' : 'Recorded sales value: '}{formatBDT(damageReportData.totalRecordedSalesValue)}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">{t.damageTitle}</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
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
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রয় (TP)' : 'Total Sales (TP)'}</p>
              <p className="text-2xl font-black text-slate-800 font-mono">
                {formatBDT(salesReportData.companySales.reduce((sum, row) => sum + row.revenue, 0))}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রয় (DP)' : 'Total Sales (DP)'}</p>
              <p className="text-2xl font-black text-indigo-700 font-mono">
                {formatBDT(salesReportData.companySales.reduce((sum, row) => sum + row.dpTotal, 0))}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">{language === 'bn' ? 'মোট বিক্রিত ইউনিট' : 'Total Units Sold'}</p>
              <CartonPcsDisplay cartons={salesReportData.grandSoldQtyObj.cartons} pcs={salesReportData.grandSoldQtyObj.pcs} qty={salesReportData.grandSoldQtyObj.rawPcs} language={language} />
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-rose-500 tracking-wider mb-2">{language === 'bn' ? 'মোট রিটার্ন/ড্যামেজ' : 'Total Returns/Damages'}</p>
              <CartonPcsDisplay cartons={salesReportData.grandReturnsAndDamagesQtyObj.cartons} pcs={salesReportData.grandReturnsAndDamagesQtyObj.pcs} qty={salesReportData.grandReturnsAndDamagesQtyObj.rawPcs} language={language} />
            </div>
          </div>

          {/* Sales report sub-tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-none w-fit">
            <button
              onClick={() => setSalesSubTab('company')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'company'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'কোম্পানি ভিত্তিক' : 'Company-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('sr')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'sr'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'SR ভিত্তিক' : 'SR-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('dm')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'dm'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Man'}
            </button>
            <button
              onClick={() => setSalesSubTab('product')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                salesSubTab === 'product'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {language === 'bn' ? 'পণ্য ভিত্তিক' : 'Product-wise'}
            </button>
            <button
              onClick={() => setSalesSubTab('unit')}
              className={`px-4 py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.companySalesTitle}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
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
                          <CartonPcsDisplay qty={row.soldQtyObj.rawPcs} cartons={row.soldQtyObj.cartons} pcs={row.soldQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <CartonPcsDisplay qty={row.returnsQtyObj.rawPcs} cartons={row.returnsQtyObj.cartons} pcs={row.returnsQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <CartonPcsDisplay qty={row.damagesQtyObj.rawPcs} cartons={row.damagesQtyObj.cartons} pcs={row.damagesQtyObj.pcs} language={language} />
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">{t.srSalesTitle}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
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
                          <CartonPcsDisplay qty={row.soldQtyObj.rawPcs} cartons={row.soldQtyObj.cartons} pcs={row.soldQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <CartonPcsDisplay qty={row.returnsQtyObj.rawPcs} cartons={row.returnsQtyObj.cartons} pcs={row.returnsQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <CartonPcsDisplay qty={row.damagesQtyObj.rawPcs} cartons={row.damagesQtyObj.cartons} pcs={row.damagesQtyObj.pcs} language={language} />
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'ডেলিভারি ম্যানভিত্তিক বিক্রয় বিবরণী' : 'Delivery Man-wise Sales Breakdown'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
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
                          <CartonPcsDisplay qty={row.soldQtyObj.rawPcs} cartons={row.soldQtyObj.cartons} pcs={row.soldQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <CartonPcsDisplay qty={row.returnsQtyObj.rawPcs} cartons={row.returnsQtyObj.cartons} pcs={row.returnsQtyObj.pcs} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <CartonPcsDisplay qty={row.damagesQtyObj.rawPcs} cartons={row.damagesQtyObj.cartons} pcs={row.damagesQtyObj.pcs} language={language} />
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'পণ্যভিত্তিক বিক্রয় বিবরণী (DP ও TP রেট সহ)' : 'Product-wise Sales Breakdown (with DP & TP)'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'পণ্যের নাম ও কোম্পানি' : 'Product Name & Brand'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'বিক্রিত ইউনিট' : 'Units Sold'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ফেরত পরিমাণ' : 'Return Qty'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'ক্ষতিগ্রস্ত পরিমাণ' : 'Damage Qty'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'DP দর' : 'DP Rate'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'TP দর' : 'TP Rate'}</th>
                      <th className="px-4 py-3 text-right text-indigo-700">{language === 'bn' ? 'মোট DP খরচ' : 'Total DP'}</th>
                      <th className="px-4 py-3 text-right text-emerald-700">{language === 'bn' ? 'মোট TP বিক্রয়' : 'Total TP'}</th>
                      <th className="px-4 py-3 text-right text-amber-700">{language === 'bn' ? 'মোট লাভ' : 'Gross Profit'}</th>
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
                          <CartonPcsDisplay qty={row.unitsSold} cartonSize={row.cartonSize} primaryUnit={row.primaryUnit} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">
                          <CartonPcsDisplay qty={row.returns} cartonSize={row.cartonSize} primaryUnit={row.primaryUnit} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">
                          <CartonPcsDisplay qty={row.damages} cartonSize={row.cartonSize} primaryUnit={row.primaryUnit} language={language} />
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-indigo-600">{formatBDT(row.dpRate)}</td>
                        <td className="px-4 py-3.5 text-right font-mono text-emerald-600">{formatBDT(row.tpRate)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-700">{formatBDT(row.profit)}</td>
                      </tr>
                    ))}
                    {salesReportData.productSales.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-semibold">
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
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {language === 'bn' ? 'ইউনিট ভিত্তিক বিক্রয় বিবরণী' : 'Unit-wise Sales Breakdown (UOM)'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-450 uppercase tracking-wider bg-slate-50/50">
                      <th className="px-4 py-3">{language === 'bn' ? 'ইউনিটের নাম' : 'Unit Name / UOM'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'মোট বিক্রিত পিস' : 'Total Pieces Sold'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'মোট ফেরত পিস' : 'Total Returns (Pcs)'}</th>
                      <th className="px-4 py-3 text-center">{language === 'bn' ? 'মোট ক্ষতিগ্রস্ত পিস' : 'Total Damages (Pcs)'}</th>
                      <th className="px-4 py-3 text-right text-indigo-600">{language === 'bn' ? 'মোট বিক্রয় মূল্য (DP)' : 'Total Sales (DP)'}</th>
                      <th className="px-4 py-3 text-right text-emerald-600">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TP)' : 'Total Sales (TP)'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {salesReportData.unitSales.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-850">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold rounded-none uppercase tracking-wide">
                            {row.unitName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-650">{row.unitsSold.toLocaleString()} pcs</td>
                        <td className="px-4 py-3.5 text-center font-mono text-amber-600">{row.returns.toLocaleString()} pcs</td>
                        <td className="px-4 py-3.5 text-center font-mono text-rose-600">{row.damages.toLocaleString()} pcs</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-700">{formatBDT(row.dpTotal)}</td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">{formatBDT(row.revenue)}</td>
                      </tr>
                    ))}
                    {salesReportData.unitSales.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                          {language === 'bn' ? 'কোনো ইউনিট ভিত্তিক বিক্রির ডেটা পাওয়া যায়নি।' : 'No unit-wise sales data available.'}
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
        <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm">{t.profitSummaryTitle}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-none text-[10px]">
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
                    <span className="bg-slate-900 text-white px-2.5 py-0.5 rounded-none text-[10px]">
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
                const pChallans = compChallans.filter(ch => (ch.productName || '').trim().toLowerCase() === (pName || '').trim().toLowerCase());
                const revenue = pChallans.reduce((s, ch) => s + (ch.totalAmount || 0), 0);
                const unitsSold = pChallans.reduce((s, ch) => s + Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0)), 0);
                const prod = products.find(p => (p.name || '').trim().toLowerCase() === (pName || '').trim().toLowerCase());
                const dp = prod ? prod.defaultPP : (pChallans[0]?.rate ? pChallans[0].rate * 0.80 : 0);
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
                <div key={companyRow.companyName} className={`border ${color.border} rounded-none overflow-hidden`}>
                  {/* Company Header */}
                  <div className={`${color.light} px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-8 rounded-none ${color.header}`} />
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
                      <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold ${color.badge}`}>
                        {companyRow.margin.toFixed(1)}% {language === 'bn' ? 'মার্জিন' : 'margin'}
                      </span>
                    </div>
                  </div>

                  {/* Per-product rows */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
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
                              <span className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-bold ${row.margin >= 0 ? color.badge : 'bg-rose-100 text-rose-700'}`}>
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
                            <span className={`inline-block px-2.5 py-0.5 rounded-none text-[10px] font-bold ${color.badge}`}>
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
        <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t.profitMarginTitle}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Variance and profit percentages based on Dealer Price (DP) and Trade Price (TP) variance.</p>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-none text-[10px] font-bold text-indigo-700 font-mono">
              <Percent className="w-3.5 h-3.5" />
              <span>Profit Margin = ((TP - DP) / DP) * 100</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
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
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-none border border-slate-200 font-bold text-[10px]">
                        {row.product.company}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-650">{formatBDT(row.dp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatBDT(row.tp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-450">{formatBDT(row.mrp)}</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">+{formatBDT(row.variance)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-none font-bold font-mono text-[10px] animate-fade-in">
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
          <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm">
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
                <span className="px-2.5 py-1 rounded-none bg-indigo-50 text-indigo-700 border border-indigo-100">DP = Purchase Price</span>
                <span className="px-2.5 py-1 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-100">TP = Trade / Supply Price</span>
                <span className="px-2.5 py-1 rounded-none bg-amber-50 text-amber-700 border border-amber-100">MRP = Retail Price</span>
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
                    <div key={companyName} className={`border ${color.border} rounded-none overflow-hidden`}>
                      {/* Company Header */}
                      <div className={`${color.light} ${color.border} border-b px-5 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-none ${color.bg}`} />
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
                        <table className="w-full text-left border-collapse min-w-[800px]">
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
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold ${color.badge}`}>
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
              <div key={company.companyName} className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">

                {/* Company Header */}
                <div className={`${clr.bg} px-6 py-4 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none bg-white/20 flex items-center justify-center">
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
                    <table className="w-full text-left border-collapse text-xs min-w-[800px]">
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
                                <span className={`inline-block px-1.5 py-0.5 rounded-none text-[10px] font-bold ${
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
                            <span className={`inline-block px-2 py-0.5 rounded-none text-[10px] font-black ${
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
                        <table className="w-full text-[10px] min-w-[400px]">
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
                                  <span className={`px-1.5 py-0.5 rounded-none text-[9px] font-bold ${
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
            <div className="bg-white border border-slate-200 rounded-none p-16 text-center text-slate-400 font-semibold">
              {language === 'bn' ? 'কোনো ডেটা পাওয়া যায়নি।' : 'No settlement data available for the selected period.'}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CLAIM & SETTLEMENT REPORT */}
      {activeTab === 'claims' && userRole === 'admin' && (
        <div className="space-y-6">
          {(() => {
            const bn = language === 'bn';
            // Filter claims: only real Claim (not Display) and apply company filter
            const claimOnly = claims.filter(c => c.type !== 'Display');
            const filteredClaimOnly = claimOnly.filter(c =>
              selectedCompanyFilter === 'All' || c.companyName === selectedCompanyFilter
            );
            const filteredSettlements = claimSettlements.filter(s =>
              selectedCompanyFilter === 'All' || s.companyName === selectedCompanyFilter
            );

            const totalClaimedQty = filteredClaimOnly.reduce((s, c) => s + c.qty, 0);
            const totalClaimedValue = filteredClaimOnly.reduce((s, c) => {
              if (c.claimValue !== undefined) return s + c.claimValue;
              const prod = products.find(p => p.id === c.productId);
              return s + c.qty * (prod ? prod.defaultPP : 0);
            }, 0);
            const totalSettledValue = filteredSettlements.reduce((s, c) => s + c.amount, 0);
            const pendingBalance = Math.max(0, totalClaimedValue - totalSettledValue);

            // Company-wise Claim vs Settlement
            const compMap: Record<string, { name: string; claims: number; qty: number; settled: number; pending: number; }> = {};
            companies.forEach(c => { compMap[c.id] = { name: c.name, claims: 0, qty: 0, settled: 0, pending: 0 }; });
            filteredClaimOnly.forEach(c => {
              const key = c.companyId || c.companyName;
              if (!compMap[key]) compMap[key] = { name: c.companyName, claims: 0, qty: 0, settled: 0, pending: 0 };
              compMap[key].qty += c.qty;
              const prod = products.find(p => p.id === c.productId);
              const val = c.claimValue !== undefined ? c.claimValue : c.qty * (prod ? prod.defaultPP : 0);
              compMap[key].claims += val;
            });
            filteredSettlements.forEach(s => {
              const key = s.companyId || s.companyName;
              if (!compMap[key]) compMap[key] = { name: s.companyName, claims: 0, qty: 0, settled: 0, pending: 0 };
              compMap[key].settled += s.amount;
            });
            Object.values(compMap).forEach(m => { m.pending = Math.max(0, m.claims - m.settled); });
            const compRows = Object.values(compMap).filter(m => m.claims > 0 || m.settled > 0);

            return (
              <>
                {/* Disclaimer Banner */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-none p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <div className="font-bold text-amber-800 mb-0.5">
                      {bn ? '⚠️ দাবি (Claim) & সেটলমেন্ট — স্বাধীন রেজিস্টার' : '⚠️ Claims & Settlements — Standalone Register'}
                    </div>
                    <div className="text-amber-700">
                      {bn
                        ? 'এই তথ্যগুলো মূল প্রফিট/অ্যাকাউন্টিং ক্যালকুলেশনের সাথে সম্পর্কিত নয়। Damage Stock বা COGS-এর সাথে কোনো cross-sync নেই। এটি শুধুমাত্র কোম্পানি-ভিত্তিক দাবি ও প্রাপ্তি ট্র্যাকিংয়ের জন্য।'
                        : 'This section is NOT linked with main Profit / Accounting calculations. No cross-sync with Damaged Stock or COGS. This is purely for company-wise claim tracking and money received.'}
                    </div>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-none border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{bn ? 'মোট ক্লেম এন্ট্রি' : 'Total Claim Entries'}</div>
                    <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{filteredClaimOnly.length}</div>
                    <div className="text-[10px] text-slate-400">{bn ? 'কোম্পানি কাছে দাবি' : 'Filed claims'}</div>
                  </div>
                  <div className="rounded-none border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{bn ? 'মোট ক্লেম পরিমাণ' : 'Total Claimed Qty'}</div>
                    <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{totalClaimedQty.toLocaleString()}</div>
                    <div className="text-[10px] text-amber-500">{bn ? 'পিস (pcs)' : 'Pieces'}</div>
                  </div>
                  <div className="rounded-none border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{bn ? 'মোট দাবির মূল্য' : 'Total Claimed Value'}</div>
                    <div className="mt-2 text-2xl font-black text-indigo-900 font-mono">{formatBDT(totalClaimedValue)}</div>
                    <div className="text-[10px] text-indigo-400">{bn ? 'কোম্পানি কাছে দাবি' : 'Amount claimed'}</div>
                  </div>
                  <div className="rounded-none border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">{bn ? 'মোট সেটলড মূল্য' : 'Total Settled Value'}</div>
                    <div className="mt-2 text-2xl font-black text-emerald-900 font-mono">{formatBDT(totalSettledValue)}</div>
                    <div className="text-[10px] text-emerald-400">{bn ? 'প্রাপ্ত টাকা / বাকি: ' : 'Received / Pending: '}
                      <span className={pendingBalance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {pendingBalance > 0 ? formatBDT(pendingBalance) : (bn ? 'সম্পূর্ণ' : 'Fully Settled')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Company-wise Claim vs Settlement Matrix */}
                <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                  <div className="border-b border-slate-200 px-6 py-4 bg-slate-50/60 flex items-center justify-between">
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
                      {bn ? 'কোম্পানি-ভিত্তিক দাবি বনাম প্রাপ্তি' : 'Company-wise Claim vs Settlement'}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                          <th className="px-5 py-3 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                          <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'দাবির পরিমাণ (pcs)' : 'Claimed Qty'}</th>
                          <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'দাবির মূল্য' : 'Claimed Amount'}</th>
                          <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'সেটলড মূল্য' : 'Settled Amount'}</th>
                          <th className="px-5 py-3 text-right whitespace-nowrap">{bn ? 'পেন্ডিং' : 'Pending'}</th>
                          <th className="px-5 py-3 text-center whitespace-nowrap">{bn ? 'সেটলমেন্ট %' : 'Settlement %'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {compRows.length === 0 ? (
                          <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 font-semibold">
                            {bn ? 'কোনো ক্লেম বা সেটলমেন্ট ডেটা নেই।' : 'No claim or settlement data available.'}
                          </td></tr>
                        ) : compRows.map(row => {
                          const pct = row.claims > 0 ? Math.min(100, (row.settled / row.claims) * 100) : (row.settled > 0 ? 100 : 0);
                          return (
                            <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3 text-xs font-bold text-slate-800 whitespace-nowrap">{row.name}</td>
                              <td className="px-5 py-3 text-right text-xs font-bold text-slate-700 font-mono whitespace-nowrap">{row.qty.toLocaleString()}</td>
                              <td className="px-5 py-3 text-right text-xs font-bold text-indigo-700 font-mono whitespace-nowrap">{formatBDT(row.claims)}</td>
                              <td className="px-5 py-3 text-right text-xs font-black text-emerald-700 font-mono whitespace-nowrap">{formatBDT(row.settled)}</td>
                              <td className="px-5 py-3 text-right text-xs font-mono whitespace-nowrap">
                                {row.pending > 0
                                  ? <span className="font-black text-rose-600">{formatBDT(row.pending)}</span>
                                  : <span className="font-bold text-emerald-600">✓ {bn ? 'সম্পূর্ণ' : 'Done'}</span>}
                              </td>
                              <td className="px-5 py-3 text-center whitespace-nowrap">
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-20 h-1.5 bg-slate-100 rounded-none overflow-hidden">
                                    <div
                                      className={`h-full rounded-none ${pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-400'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-500 font-mono">{pct.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Two Column Layout: Claim History + Settlement History */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Left: Claim History */}
                  <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-6 py-3.5 bg-slate-50/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">
                        {bn ? 'ক্লেম ইতিহাস (দাখিলকৃত দাবি)' : 'Claim Register (Filed Objections)'}
                        <span className="ml-2 text-[9px] font-normal text-slate-400 font-mono">({filteredClaimOnly.length})</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="border-b border-slate-200 text-slate-600 text-[9px] uppercase font-extrabold tracking-wider">
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'তারিখ' : 'Date'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'পণ্য' : 'Product'}</th>
                            <th className="px-4 py-2.5 text-center whitespace-nowrap">{bn ? 'পরিমাণ' : 'Qty'}</th>
                            <th className="px-4 py-2.5 text-right whitespace-nowrap">{bn ? 'দাবি মূল্য' : 'Value'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'স্ট্যাটাস' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredClaimOnly.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                              {bn ? 'কোনো ক্লেম নেই।' : 'No claims recorded.'}
                            </td></tr>
                          ) : filteredClaimOnly.slice(0, 100).map(c => {
                            const prod = products.find(p => p.id === c.productId);
                            const val = c.claimValue !== undefined ? c.claimValue : c.qty * (prod ? prod.defaultPP : 0);
                            const statusCls =
                              c.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : c.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200';
                            return (
                              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 font-mono whitespace-nowrap">{c.claimDate}</td>
                                <td className="px-4 py-2.5 text-[10px] font-bold text-slate-700 whitespace-nowrap">{c.companyName}</td>
                                <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-800 whitespace-nowrap" style={{maxWidth:'140px'}}>
                                  <div className="truncate" title={c.productName}>{c.productName}</div>
                                </td>
                                <td className="px-4 py-2.5 text-center text-[10px] font-bold text-slate-700 font-mono whitespace-nowrap">{c.qty.toLocaleString()}</td>
                                <td className="px-4 py-2.5 text-right text-[10px] font-bold text-indigo-700 font-mono whitespace-nowrap">{formatBDT(val)}</td>
                                <td className="px-4 py-2.5 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold border ${statusCls}`}>
                                    {c.status === 'Approved' ? (bn ? 'অনুমোদিত' : 'Approved')
                                     : c.status === 'Rejected' ? (bn ? 'প্রত্যাখ্যাত' : 'Rejected')
                                     : (bn ? 'অপেক্ষমাণ' : 'Pending')}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Settlement History */}
                  <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                    <div className="border-b border-slate-200 px-6 py-3.5 bg-slate-50/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800">
                        {bn ? 'সেটলমেন্ট ইতিহাস (প্রাপ্ত টাকা)' : 'Settlement Register (Amount Received)'}
                        <span className="ml-2 text-[9px] font-normal text-slate-400 font-mono">({filteredSettlements.length})</span>
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[550px]">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr className="border-b border-slate-200 text-slate-600 text-[9px] uppercase font-extrabold tracking-wider">
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'তারিখ' : 'Date'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'কোম্পানি' : 'Company'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'মাস' : 'Month'}</th>
                            <th className="px-4 py-2.5 text-right whitespace-nowrap">{bn ? 'প্রাপ্ত টাকা' : 'Received'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'মাধ্যম' : 'Mode'}</th>
                            <th className="px-4 py-2.5 whitespace-nowrap">{bn ? 'রেফারেন্স' : 'Ref'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredSettlements.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-xs font-semibold">
                              {bn ? 'কোনো সেটলমেন্ট নেই।' : 'No settlements recorded yet.'}
                            </td></tr>
                          ) : filteredSettlements.slice(0, 100).map(s => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-500 font-mono whitespace-nowrap">{s.settlementDate}</td>
                              <td className="px-4 py-2.5 text-[10px] font-bold text-slate-700 whitespace-nowrap">{s.companyName}</td>
                              <td className="px-4 py-2.5 text-[10px] font-bold text-slate-500 font-mono whitespace-nowrap">{s.monthKey}</td>
                              <td className="px-4 py-2.5 text-right text-[10px] font-black text-emerald-700 font-mono whitespace-nowrap">{formatBDT(s.amount)}</td>
                              <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-600 whitespace-nowrap">{s.paymentMode || '—'}</td>
                              <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500 whitespace-nowrap" style={{maxWidth:'80px'}}>
                                <span className="truncate block" title={s.referenceNo}>{s.referenceNo || '—'}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
