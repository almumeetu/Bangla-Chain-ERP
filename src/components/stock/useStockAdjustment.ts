'use client';

import { useState, useCallback } from 'react';
import type { Product, StockAdjustment } from '../../types';
import type { Language } from '../../translations';
import { getLocalDateString } from '../dashboard/dashboardUtils';

export interface UseStockAdjustmentReturn {
  selectedProdId:     string | null;
  selectedProduct:    Product | null;
  newStockQty:        number;
  adjustReason:       string;
  searchQuery:        string;
  selectedCompany:    string;
  selectedCategory:   string;
  submitted:          boolean;
  variance:           number;
  adjustmentStartDate: string;
  adjustmentEndDate:   string;
  currentPage:        number;
  totalPages:         number;
  startIndex:         number;
  filteredProducts:   Product[];
  paginatedAdjustments: StockAdjustment[];
  quickReasons:       string[];
  handleSelectProduct:(id: string) => void;
  handleSetQty:       (qty: number) => void;
  handleStepQty:      (step: number) => void;
  handleSetReason:    (r: string) => void;
  handleSearchChange: (q: string) => void;
  handleCompanyChange:(c: string) => void;
  handleCategoryChange:(cat: string) => void;
  handleAdjustmentStartDateChange: (date: string) => void;
  handleAdjustmentEndDateChange:   (date: string) => void;
  handleResetAdjustmentDates:      () => void;
  handleCommit:       (e: React.FormEvent) => void;
  handleReset:        () => void;
  handlePageChange:   (page: number) => void;
}

const ITEMS_PER_PAGE = 5;

export function useStockAdjustment(
  products:      Product[],
  setProducts:   (updater: (prev: Product[]) => Product[]) => void,
  adjustments:   StockAdjustment[],
  setAdjustments:(updater: (prev: StockAdjustment[]) => StockAdjustment[]) => void,
  language:      Language,
): UseStockAdjustmentReturn {
  const [selectedProdId,  setSelectedProdId]  = useState<string | null>(null);
  const [newStockQty,     setNewStockQty]     = useState(0);
  const [adjustReason,    setAdjustReason]    = useState('');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [selectedCompany, setSelectedCompany]   = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [submitted,       setSubmitted]         = useState(false);
  const [currentPage,     setCurrentPage]       = useState(1);
  const [adjustmentStartDate, setAdjustmentStartDate] = useState('');
  const [adjustmentEndDate, setAdjustmentEndDate] = useState('');

  const selectedProduct = products.find(p => p.id === selectedProdId) ?? null;
  const variance        = selectedProduct ? newStockQty - selectedProduct.currentStock : 0;

  const quickReasons = language === 'bn'
    ? ['বার্ষিক অডিট', 'ক্ষতিগ্রস্ত পণ্য', 'চুরি/ঘাটতি', 'ভুল এন্ট্রি সংশোধন', 'নতুন স্টক গণনা']
    : ['Annual Audit', 'Damage Disposal', 'Theft / Shortage', 'Wrong Entry Fix', 'Physical Recount'];

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCompany = selectedCompany === 'All' || p.company === selectedCompany;
    const matchesCategory = selectedCategory === 'All' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCompany && matchesCategory;
  });

  const filteredAdjustments = adjustments.filter(adj => {
    if (!adjustmentStartDate && !adjustmentEndDate) return true;
    const adjDate = getLocalDateString(new Date(adj.date));
    const matchesStart = adjustmentStartDate ? adjDate >= adjustmentStartDate : true;
    const matchesEnd = adjustmentEndDate ? adjDate <= adjustmentEndDate : true;
    return matchesStart && matchesEnd;
  });

  const totalPages          = Math.ceil(filteredAdjustments.length / ITEMS_PER_PAGE) || 1;
  const startIndex          = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAdjustments = filteredAdjustments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSelectProduct = useCallback((id: string) => {
    const prod = products.find(p => p.id === id);
    if (!prod) return;
    setSelectedProdId(id);
    setNewStockQty(prod.currentStock);
    setAdjustReason('');
    setSubmitted(false);
  }, [products]);

  const handleSetQty    = useCallback((qty: number) => setNewStockQty(Math.max(0, qty)), []);
  const handleStepQty   = useCallback((step: number) => setNewStockQty(q => Math.max(0, q + step)), []);
  const handleSetReason = useCallback((r: string) => setAdjustReason(r), []);
  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleCompanyChange = useCallback((c: string) => {
    setSelectedCompany(c);
    setCurrentPage(1);
  }, []);
  const handleCategoryChange = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  }, []);
  const handleAdjustmentStartDateChange = useCallback((date: string) => {
    setAdjustmentStartDate(date);
    setCurrentPage(1);
  }, []);
  const handleAdjustmentEndDateChange = useCallback((date: string) => {
    setAdjustmentEndDate(date);
    setCurrentPage(1);
  }, []);
  const handleResetAdjustmentDates = useCallback(() => {
    setAdjustmentStartDate('');
    setAdjustmentEndDate('');
    setCurrentPage(1);
  }, []);
  const handlePageChange   = useCallback((page: number) => setCurrentPage(page), []);
  const handleReset        = useCallback(() => { setSubmitted(false); setSelectedProdId(null); }, []);

  const handleCommit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const isInvalid = !selectedProduct
      || newStockQty < 0
      || !adjustReason.trim()
      || variance === 0;

    if (!selectedProduct) return;
    if (newStockQty < 0)       { alert(language === 'bn' ? 'ঋণাত্মক স্টক সম্ভব নয়।' : 'Stock cannot be negative.'); return; }
    if (!adjustReason.trim())  { alert(language === 'bn' ? 'কারণ লিখুন।' : 'Please provide a reason.'); return; }
    if (variance === 0)        { alert(language === 'bn' ? 'কোনো পরিবর্তন নেই।' : 'No change detected.'); return; }

    const newAdj: StockAdjustment = {
      id:             `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId:      selectedProduct.id,
      productName:    selectedProduct.name,
      attributeValue: 'Standard',
      oldQty:         selectedProduct.currentStock,
      newQty:         newStockQty,
      qtyChanged:     variance,
      adjustedBy:     language === 'bn' ? 'ডিলার/মালিক (অ্যাডমিন)' : 'Owner/Dealer (Admin)',
      reason:         adjustReason.trim(),
      date:           new Date().toISOString(),
    };

    setAdjustments(prev => [newAdj, ...prev]);
    setProducts(prev => prev.map(p => p.id === selectedProdId ? { ...p, currentStock: newStockQty } : p));
    setSubmitted(true);
    setAdjustReason('');
  }, [selectedProduct, newStockQty, adjustReason, variance, language, selectedProdId, setAdjustments, setProducts]);

  return {
    selectedProdId, selectedProduct,
    newStockQty, adjustReason, searchQuery, selectedCompany, selectedCategory, submitted, variance,
    adjustmentStartDate, adjustmentEndDate,
    currentPage, totalPages, startIndex,
    filteredProducts, paginatedAdjustments, quickReasons,
    handleSelectProduct, handleSetQty, handleStepQty,
    handleSetReason, handleSearchChange, handleCompanyChange, handleCategoryChange, handleCommit,
    handleAdjustmentStartDateChange, handleAdjustmentEndDateChange, handleResetAdjustmentDates,
    handleReset, handlePageChange,
  };
}
