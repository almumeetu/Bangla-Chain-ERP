'use client';

import React, { useState, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  MapPin, 
  Tag, 
  Building,
  UserCheck,
  Package,
  Layers
} from 'lucide-react';
import { Product, SR, Customer } from '../types';
import { translations as dict, Language } from '../translations';

interface DirectoryModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  srs: SR[];
  setSrs: React.Dispatch<React.SetStateAction<SR[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  language: Language;
}

type DirectoryTab = 'products' | 'srs' | 'shops';

// --- SUB-COMPONENT: Product Catalog Row ---
interface ProductRowProps {
  p: Product;
  index: number;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  formatBDT: (amt: number) => string;
}

function ProductRow({ p, index, onEdit, onDelete, formatBDT }: ProductRowProps) {
  const handleEdit = useCallback(() => {
    onEdit(p);
  }, [p, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(p.id);
  }, [p.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200">
      <td className="px-4 py-4 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-4 font-semibold text-slate-800">{p.name}</td>
      <td className="px-4 py-4 text-slate-500 font-mono font-medium">{p.sku}</td>
      <td className="px-4 py-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
          p.company === 'Pran' ? 'bg-orange-55 text-orange-700 border-orange-200' :
          p.company === 'Olympic' ? 'bg-sky-55 text-sky-700 border-sky-200' :
          'bg-amber-55 text-amber-700 border-amber-200'
        }`}>
          {p.company}
        </span>
      </td>
      <td className="px-4 py-4 text-right font-mono font-semibold text-slate-600">{formatBDT(p.defaultPP)}</td>
      <td className="px-4 py-4 text-right font-mono font-semibold text-slate-900">{formatBDT(p.defaultWSP)}</td>
      <td className="px-4 py-4 text-right font-mono text-slate-650">{formatBDT(p.defaultMRP)}</td>
      <td className="px-4 py-4 text-center font-mono font-bold text-slate-700 bg-slate-50/30">{p.currentStock} Units</td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Edit specs"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-505 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete product"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: Sales Rep Row ---
interface SrRowProps {
  sr: SR;
  index: number;
  onEdit: (sr: SR) => void;
  onDelete: (id: string) => void;
}

function SrRow({ sr, index, onEdit, onDelete }: SrRowProps) {
  const handleEdit = useCallback(() => {
    onEdit(sr);
  }, [sr, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(sr.id);
  }, [sr.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200">
      <td className="px-4 py-4 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-4 font-semibold text-slate-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-400" />
        {sr.name}
      </td>
      <td className="px-4 py-4 text-slate-600 font-mono font-medium">{sr.phone}</td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-505 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: Customer Shop Row ---
interface ShopRowProps {
  c: Customer;
  index: number;
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
}

function ShopRow({ c, index, onEdit, onDelete }: ShopRowProps) {
  const handleEdit = useCallback(() => {
    onEdit(c);
  }, [c, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(c.id);
  }, [c.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200">
      <td className="px-4 py-4 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-4 font-semibold text-slate-800 flex items-center gap-2">
        <Building className="w-4 h-4 text-slate-400" />
        {c.name}
      </td>
      <td className="px-4 py-4 text-slate-650 font-semibold flex items-center gap-1.5 mt-1.5 border-none">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        {c.market}
      </td>
      <td className="px-4 py-4 text-slate-550 font-mono">{c.phone}</td>
      <td className="px-4 py-4">
        <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-0.5 rounded text-[11px] font-semibold">
          SR: {c.assignedSR}
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-505 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- MAIN DIRECTORY SETUP MODULE ---
export default function DirectoryModule({
  products,
  setProducts,
  srs,
  setSrs,
  customers,
  setCustomers,
  language
}: DirectoryModuleProps) {
  const tCommon = dict[language].common;
  const tDir = dict[language].directory;

  // Active Directory Sub-tab
  const [activeSubTab, setActiveSubTab] = useState<DirectoryTab>('products');

  // Form Modals State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSrModal, setShowSrModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);

  // Editing State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSr, setEditingSr] = useState<SR | null>(null);
  const [editingShop, setEditingShop] = useState<Customer | null>(null);

  // New Product Form Fields
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCompany, setProdCompany] = useState<'Pran' | 'Olympic' | 'Haque'>('Pran');
  const [prodPP, setProdPP] = useState<number>(0);
  const [prodWSP, setProdWSP] = useState<number>(0);
  const [prodMRP, setProdMRP] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(0);

  // New SR Form Fields
  const [srName, setSrName] = useState('');
  const [srPhone, setSrPhone] = useState('');

  // New Shop Form Fields
  const [shopName, setShopName] = useState('');
  const [shopMarket, setShopMarket] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAssignedSR, setShopAssignedSR] = useState('');

  // Helper BDT formatting
  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  }, []);

  // --- PRODUCT CALLBACKS ---
  const handleProductSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku) {
      alert('Please fill out Name and SKU.');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: prodName,
        sku: prodSku,
        company: prodCompany,
        defaultPP: Number(prodPP),
        defaultWSP: Number(prodWSP),
        defaultMRP: Number(prodMRP),
        currentStock: Number(prodStock)
      } : p));
      setEditingProduct(null);
    } else {
      const newP: Product = {
        id: `prod-${Date.now()}`,
        name: prodName,
        sku: prodSku,
        company: prodCompany,
        defaultPP: Number(prodPP),
        defaultWSP: Number(prodWSP),
        defaultMRP: Number(prodMRP),
        currentStock: Number(prodStock)
      };
      setProducts(prev => [...prev, newP]);
    }

    setProdName('');
    setProdSku('');
    setProdCompany('Pran');
    setProdPP(0);
    setProdWSP(0);
    setProdMRP(0);
    setProdStock(0);
    setShowProductModal(false);
  }, [prodName, prodSku, prodCompany, prodPP, prodWSP, prodMRP, prodStock, editingProduct, setProducts]);

  const startEditProduct = useCallback((p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCompany(p.company);
    setProdPP(p.defaultPP);
    setProdWSP(p.defaultWSP);
    setProdMRP(p.defaultMRP);
    setProdStock(p.currentStock);
    setShowProductModal(true);
  }, []);

  const handleDeleteProduct = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  }, [tCommon.confirmDelete, setProducts]);

  // --- SR CALLBACKS ---
  const handleSrSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!srName || !srPhone) {
      alert('Please fill out Name and Phone number.');
      return;
    }

    if (editingSr) {
      setSrs(prev => prev.map(s => s.id === editingSr.id ? {
        ...s,
        name: srName,
        phone: srPhone
      } : s));
      setEditingSr(null);
    } else {
      const newSR: SR = {
        id: `sr-${Date.now()}`,
        name: srName,
        phone: srPhone
      };
      setSrs(prev => [...prev, newSR]);
    }

    setSrName('');
    setSrPhone('');
    setShowSrModal(false);
  }, [srName, srPhone, editingSr, setSrs]);

  const startEditSr = useCallback((s: SR) => {
    setEditingSr(s);
    setSrName(s.name);
    setSrPhone(s.phone);
    setShowSrModal(true);
  }, []);

  const handleDeleteSr = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setSrs(prev => prev.filter(s => s.id !== id));
    }
  }, [tCommon.confirmDelete, setSrs]);

  // --- SHOP CALLBACKS ---
  const handleShopSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !shopAssignedSR) {
      alert('Please enter a Shop Name and assign a Sales Rep (SR).');
      return;
    }

    if (editingShop) {
      setCustomers(prev => prev.map(c => c.id === editingShop.id ? {
        ...c,
        name: shopName,
        market: shopMarket || 'General Market',
        phone: shopPhone || 'N/A',
        assignedSR: shopAssignedSR
      } : c));
      setEditingShop(null);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: shopName,
        market: shopMarket || 'General Market',
        phone: shopPhone || 'N/A',
        assignedSR: shopAssignedSR
      };
      setCustomers(prev => [...prev, newCust]);
    }

    setShopName('');
    setShopMarket('');
    setShopPhone('');
    setShopAssignedSR('');
    setShowShopModal(false);
  }, [shopName, shopMarket, shopPhone, shopAssignedSR, editingShop, setCustomers]);

  const startEditShop = useCallback((c: Customer) => {
    setEditingShop(c);
    setShopName(c.name);
    setShopMarket(c.market);
    setShopPhone(c.phone);
    setShopAssignedSR(c.assignedSR);
    setShowShopModal(true);
  }, []);

  const handleDeleteShop = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  }, [tCommon.confirmDelete, setCustomers]);

  // Modal display toggles
  const handleOpenProduct = useCallback(() => {
    setEditingProduct(null);
    setProdName('');
    setProdSku('');
    setProdCompany('Pran');
    setProdPP(0);
    setProdWSP(0);
    setProdMRP(0);
    setProdStock(0);
    setShowProductModal(true);
  }, []);

  const handleCloseProduct = useCallback(() => {
    setShowProductModal(false);
  }, []);

  const handleOpenSr = useCallback(() => {
    setEditingSr(null);
    setSrName('');
    setSrPhone('');
    setShowSrModal(true);
  }, []);

  const handleCloseSr = useCallback(() => {
    setShowSrModal(false);
  }, []);

  const handleOpenShop = useCallback(() => {
    setEditingShop(null);
    setShopName('');
    setShopMarket('');
    setShopPhone('');
    setShopAssignedSR(srs[0]?.name || '');
    setShowShopModal(true);
  }, [srs]);

  const handleCloseShop = useCallback(() => {
    setShowShopModal(false);
  }, []);

  // Form Fields Change Handlers (to prevent inline functions)
  const handleProdNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdName(e.target.value), []);
  const handleProdSkuChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdSku(e.target.value), []);
  const handleProdCompanyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setProdCompany(e.target.value as any), []);
  const handleProdPPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdPP(Number(e.target.value)), []);
  const handleProdWSPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdWSP(Number(e.target.value)), []);
  const handleProdMRPChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdMRP(Number(e.target.value)), []);
  const handleProdStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setProdStock(Number(e.target.value)), []);

  const handleSrNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSrName(e.target.value), []);
  const handleSrPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSrPhone(e.target.value), []);

  const handleShopNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setShopName(e.target.value), []);
  const handleShopMarketChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setShopMarket(e.target.value), []);
  const handleShopPhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setShopPhone(e.target.value), []);
  const handleShopSRChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setShopAssignedSR(e.target.value), []);

  return (
    <div className="space-y-6">
      
      {/* Directory Tab Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-800" />
            {tDir.title}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{tDir.subtitle}</p>
        </div>

        {/* Directory Sub-tabs selectors */}
        <div className="flex bg-slate-105 p-1 rounded-lg border border-slate-200 shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'products' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            {tDir.tabProducts}
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('srs')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'srs' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            {tDir.tabSrs}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('shops')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'shops' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            {tDir.tabShops}
          </button>
        </div>
      </div>

      {/* --- RENDER SUB-TAB: Products Catalog --- */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{products.length} {tDir.tabProducts}</span>
            <button
              type="button"
              onClick={handleOpenProduct}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 cursor-pointer active:scale-95 animate-fade-in"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              {tDir.registerProduct}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 w-12 text-center">#</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formProductName.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formProductSku.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formProductCompany.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">Import PP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">Supply WSP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-right">Retail MRP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center">{tDir.formProductStock.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center w-24">{tCommon.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p, index) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      index={index}
                      onEdit={startEditProduct}
                      onDelete={handleDeleteProduct}
                      formatBDT={formatBDT}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- RENDER SUB-TAB: Sales Representatives (SRs) --- */}
      {activeSubTab === 'srs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{srs.length} {tDir.tabSrs}</span>
            <button
              type="button"
              onClick={handleOpenSr}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              {tDir.registerSr}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formSrName.replace(' *', '')}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formSrPhone.replace(' *', '')}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {srs.map((sr, index) => (
                  <SrRow
                    key={sr.id}
                    sr={sr}
                    index={index}
                    onEdit={startEditSr}
                    onDelete={handleDeleteSr}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- RENDER SUB-TAB: Customer Shops --- */}
      {activeSubTab === 'shops' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{customers.length} {tDir.tabShops}</span>
            <button
              type="button"
              onClick={handleOpenShop}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              {tDir.registerShop}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 w-12 text-center">#</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formShopName.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.colRoute}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formShopPhone.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700">{tDir.formShopSr.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-slate-700 text-center w-24">{tCommon.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c, index) => (
                    <ShopRow
                      key={c.id}
                      c={c}
                      index={index}
                      onEdit={startEditShop}
                      onDelete={handleDeleteShop}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: Product Setup --- */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleProductSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden animate-scale-up">
            <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Tag className="w-4.5 h-4.5 text-slate-700" />
                {editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}
              </span>
              <button 
                type="button" 
                onClick={handleCloseProduct}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pran Mango Juice 250ml"
                  value={prodName}
                  onChange={handleProdNameChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductSku}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRN-MJ-250"
                    value={prodSku}
                    onChange={handleProdSkuChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductCompany}</label>
                  <select
                    value={prodCompany}
                    onChange={handleProdCompanyChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800 transition-colors"
                  >
                    <option value="Pran">Pran</option>
                    <option value="Olympic">Olympic</option>
                    <option value="Haque">Haque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Import PP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodPP}
                    onChange={handleProdPPChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-55 px-3 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Supply WSP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodWSP}
                    onChange={handleProdWSPChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-55 px-3 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Market MRP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodMRP}
                    onChange={handleProdMRPChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-55 px-3 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{tDir.formProductStock}</label>
                <input
                  type="number"
                  min="0"
                  value={prodStock}
                  onChange={handleProdStockChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button 
                type="button" 
                onClick={handleCloseProduct}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                {tCommon.cancel}
              </button>
              <button 
                type="submit"
                className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm"
              >
                {editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: SR Setup --- */}
      {showSrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSrSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden animate-scale-up">
            <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4.5 h-4.5 text-slate-750" />
                {editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}
              </span>
              <button type="button" onClick={handleCloseSr} className="text-slate-400 hover:text-slate-850">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formSrName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Selim Ahmed"
                  value={srName}
                  onChange={handleSrNameChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formSrPhone}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 017XXXXXXXX"
                  value={srPhone}
                  onChange={handleSrPhoneChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={handleCloseSr} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}</button>
            </div>
          </form>
        </div>
      )}

      {/* --- MODAL: Customer Shop Setup --- */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleShopSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden animate-scale-up">
            <div className="border-b border-slate-200 px-6 py-4.5 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Building className="w-4.5 h-4.5 text-slate-750" />
                {editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}
              </span>
              <button type="button" onClick={handleCloseShop} className="text-slate-400 hover:text-slate-850">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop-8 (Janata Grocery)"
                  value={shopName}
                  onChange={handleShopNameChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopAddress}</label>
                <input
                  type="text"
                  placeholder="e.g. Chowk Bazar Alley, Dhaka"
                  value={shopMarket}
                  onChange={handleShopMarketChange}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopPhone}</label>
                  <input
                    type="text"
                    placeholder="e.g. 018XXXXXXXX"
                    value={shopPhone}
                    onChange={handleShopPhoneChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopSr}</label>
                  <select
                    value={shopAssignedSR}
                    onChange={handleShopSRChange}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800 transition-colors"
                  >
                    {srs.map(sr => (
                      <option key={sr.id} value={sr.name}>{sr.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={handleCloseShop} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
