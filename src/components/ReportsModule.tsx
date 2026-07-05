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
import { Product, ChallanItem, SR, CompanyBrand, ExpenseRecord, DeliveryMan } from '../types';
import { translations, Language } from '../translations';

interface ReportsModuleProps {
  products: Product[];
  challans: ChallanItem[];
  srs: SR[];
  companies: CompanyBrand[];
  deliveryMen: DeliveryMan[];
  expenses: ExpenseRecord[];
  language: Language;
  userRole?: 'admin' | 'sr';
}

type ReportTab = 'stock' | 'sales' | 'profit' | 'margin' | 'damage';

export default function ReportsModule({
  products,
  challans,
  srs,
  companies,
  deliveryMen,
  expenses,
  language,
  userRole = 'admin'
}: ReportsModuleProps) {
  const t = translations[language].reports;
  const tCommon = translations[language].common;

  // Tabs (restricted to stock/sales for SR)
  const [activeTab, setActiveTab] = useState<ReportTab>('stock');

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

  // Filtered Challans based on date range and global filters
  const filteredChallans = useMemo(() => {
    return challans.filter(ch => {
      if (!ch.createdAt) return true;
      const date = ch.createdAt.split('T')[0];
      const matchesDate = date >= startDate && date <= endDate;
      const matchesCompany = selectedCompanyFilter === 'All' || ch.company === selectedCompanyFilter;
      const matchesSR = selectedSrFilter === 'All' || ch.srName.toLowerCase() === selectedSrFilter.toLowerCase();
      const matchesDM = selectedDeliveryManFilter === 'All' || ch.deliveryManName.toLowerCase() === selectedDeliveryManFilter.toLowerCase();
      return matchesDate && matchesCompany && matchesSR && matchesDM;
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
    let grandValue = 0;

    const rows = brandList.map(brandName => {
      const brandProducts = products.filter(p => p.company === brandName);
      const totalQty = brandProducts.reduce((sum, p) => sum + p.currentStock, 0);
      const totalValue = brandProducts.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);

      grandQty += totalQty;
      grandValue += totalValue;

      return {
        companyName: brandName,
        totalQty,
        totalValue
      };
    });

    return { rows, grandQty, grandValue };
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

      return {
        companyName: brandName,
        unitsSold,
        revenue,
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
      const commissions = srChallans.reduce((sum, ch) => sum + (ch.commissionAmount || 0), 0);

      return {
        srName: sr.name,
        phone: sr.phone,
        unitsSold,
        revenue,
        returns,
        damages,
        commissions
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

      return {
        dmName: dm.name,
        vehicle: dm.vehicle,
        unitsSold,
        revenue,
        returns,
        damages,
        totalChallans
      };
    });

    // D. Product-wise Sales
    const productSales = products.map(p => {
      const pChallans = filteredChallans.filter(ch => ch.productName.toLowerCase() === p.name.toLowerCase());
      const unitsSold = pChallans.reduce((sum, ch) => sum + ch.qty, 0);
      const revenue = pChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);
      const returns = pChallans.reduce((sum, ch) => sum + (ch.returnedQty || 0), 0);
      const damages = pChallans.reduce((sum, ch) => sum + (ch.damagedQty || 0), 0);

      return {
        productName: p.name,
        sku: p.sku,
        company: p.company,
        unitsSold,
        revenue,
        returns,
        damages
      };
    }).filter(row => {
      const matchesCompany = selectedCompanyFilter === 'All' || row.company === selectedCompanyFilter;
      return matchesCompany && (row.unitsSold > 0 || row.returns > 0 || row.damages > 0);
    });

    return { companySales, srSales, dmSales, productSales };
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
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(language === 'bn' ? 'কোম্পানি' : 'COMPANY BRAND', 16, y - 1);
      doc.text(language === 'bn' ? 'স্টক পরিমাণ' : 'STOCK QUANTITY', 80, y - 1);
      doc.text(language === 'bn' ? 'স্টক মূল্য (TK)' : 'STOCK VALUE (TK)', 140, y - 1);
      y += 10;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      stockReportData.rows.forEach(row => {
        doc.text(row.companyName, 16, y);
        doc.text(`${row.totalQty.toLocaleString()} units`, 80, y);
        doc.text(`TK ${row.totalValue.toLocaleString()}`, 140, y);
        y += 8;
      });

      y += 4;
      doc.line(14, y - 4, 196, y - 4);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'সর্বমোট' : 'GRAND TOTAL', 16, y);
      doc.text(`${stockReportData.grandQty.toLocaleString()} units`, 80, y);
      doc.text(`TK ${stockReportData.grandValue.toLocaleString()}`, 140, y);
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
      doc.text(language === 'bn' ? 'বিক্রিত ইউনিট' : 'UNITS SOLD', 65, y - 1);
      doc.text(language === 'bn' ? 'ফেরত' : 'RETURNS', 105, y - 1);
      doc.text(language === 'bn' ? 'ক্ষতিগ্রস্ত' : 'DAMAGES', 135, y - 1);
      doc.text(language === 'bn' ? 'মোট বিক্রয় (TK)' : 'TOTAL SALES (TK)', 160, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.companySales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.companyName, 16, y);
        doc.text(row.unitsSold.toString(), 65, y);
        doc.text(row.returns.toString(), 105, y);
        doc.text(row.damages.toString(), 135, y);
        doc.text(`TK ${row.revenue.toLocaleString()}`, 160, y);
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
      doc.text(language === 'bn' ? 'কমিশন (TK)' : 'COMMISSION', 135, y - 1);
      doc.text(language === 'bn' ? 'বিক্রয় (TK)' : 'REVENUE', 165, y - 1);
      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      salesReportData.srSales.forEach(row => {
        checkPageBreak(8);
        doc.text(row.srName, 16, y);
        doc.text(row.unitsSold.toString(), 65, y);
        doc.text(row.returns.toString(), 95, y);
        doc.text(row.damages.toString(), 115, y);
        doc.text(`TK ${row.commissions.toLocaleString()}`, 135, y);
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
          </>
        )}
      </div>

      {/* TAB CONTENT: STOCK REPORT */}
      {activeTab === 'stock' && (
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
                  <th className="px-4 py-3 text-right">{language === 'bn' ? 'স্টক মূল্য (TK)' : 'Stock Valuation (DP)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stockReportData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.totalQty.toLocaleString()} Pcs</td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.totalValue)}</td>
                  </tr>
                ))}
                {/* Grand Total Row */}
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-extrabold text-slate-900">
                  <td className="px-4 py-4">{language === 'bn' ? 'সর্বমোট স্টক' : 'GRAND TOTAL STOCK'}</td>
                  <td className="px-4 py-4 text-center font-mono">{stockReportData.grandQty.toLocaleString()} Pcs</td>
                  <td className="px-4 py-4 text-right font-mono text-indigo-605">{formatBDT(stockReportData.grandValue)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Delivery Man-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট ডেলিভারি মূল্য (TK)' : 'Total Delivered (Tk)'}</th>
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
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.dmSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো ডেলিভারি ডেটা পাওয়া যায়নি।' : 'No delivery data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TK)' : 'Total Sales Price (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.productSales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.productName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.productSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো পণ্য বিক্রির ডেটা পাওয়া যায়নি।' : 'No product sales data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
          {/* Company-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TK)' : 'Total Sales Price (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.companySales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">{row.companyName}</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SR-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'কমিশন (TK)' : 'Commission (Tk)'}</th>
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'বিক্রয় মূল্য (TK)' : 'Total Sales (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.srSales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.srName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.phone}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600">{formatBDT(row.commissions)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Delivery Man-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট ডেলিভারি মূল্য (TK)' : 'Total Delivered (Tk)'}</th>
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
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.dmSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো ডেলিভারি ডেটা পাওয়া যায়নি।' : 'No delivery data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TK)' : 'Total Sales Price (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.productSales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.productName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.productSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো পণ্য বিক্রির ডেটা পাওয়া যায়নি।' : 'No product sales data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

          {/* Delivery Man-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট ডেলিভারি মূল্য (TK)' : 'Total Delivered (Tk)'}</th>
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
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.dmSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো ডেলিভারি ডেটা পাওয়া যায়নি।' : 'No delivery data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TK)' : 'Total Sales Price (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.productSales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.productName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.productSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো পণ্য বিক্রির ডেটা পাওয়া যায়নি।' : 'No product sales data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

          {/* Delivery Man-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট ডেলিভারি মূল্য (TK)' : 'Total Delivered (Tk)'}</th>
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
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.dmSales.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো ডেলিভারি ডেটা পাওয়া যায়নি।' : 'No delivery data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-wise Sales Breakdown */}
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
                    <th className="px-4 py-3 text-right">{language === 'bn' ? 'মোট বিক্রয় মূল্য (TK)' : 'Total Sales Price (TP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {salesReportData.productSales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-850">
                        <div>{row.productName}</div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.sku} · {row.company}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-700">{row.unitsSold.toLocaleString()} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-amber-600">{row.returns} Pcs</td>
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-rose-600">{row.damages} Pcs</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">{formatBDT(row.revenue)}</td>
                    </tr>
                  ))}
                  {salesReportData.productSales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-semibold">
                        {language === 'bn' ? 'কোনো পণ্য বিক্রির ডেটা পাওয়া যায়নি।' : 'No product sales data available.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
