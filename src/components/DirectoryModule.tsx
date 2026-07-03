'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  Layers,
  HardDrive,
  Compass,
  Briefcase,
  Sliders,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import {
  Product,
  SR,
  Customer,
  CompanyBrand,
  Category,
  UnitOfMeasure,
  Godown,
  Route
} from '../types';
import { translations as dict, Language } from '../translations';

interface DirectoryModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  srs: SR[];
  setSrs: React.Dispatch<React.SetStateAction<SR[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  companies: CompanyBrand[];
  setCompanies: React.Dispatch<React.SetStateAction<CompanyBrand[]>>;
  productCategories: Category[];
  setProductCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  units: UnitOfMeasure[];
  setUnits: React.Dispatch<React.SetStateAction<UnitOfMeasure[]>>;
  godowns: Godown[];
  setGodowns: React.Dispatch<React.SetStateAction<Godown[]>>;
  routes: Route[];
  setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
  language: Language;
  /** Which sub-tab to open by default when rendered */
  defaultTab?: DirectoryTab;
  /** Filter visible tabs — only show these. If undefined, show all. */
  visibleTabs?: DirectoryTab[];
  /** Override page title (used when accessed via dedicated sidebar menus) */
  pageTitle?: string;
  /** Override page subtitle */
  pageSubtitle?: string;
}

type DirectoryTab =
  | 'products'
  | 'srs'
  | 'shops'
  | 'damage'
  | 'companies'
  | 'categories'
  | 'units'
  | 'godowns'
  | 'routes';

// --- SUB-COMPONENT: Product Catalog Row ---
interface ProductRowProps {
  p: Product;
  index: number;
  companies: CompanyBrand[];
  categories: Category[];
  units: UnitOfMeasure[];
  godowns: Godown[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  formatBDT: (amt: number) => string;
}

function ProductRow({ p, index, companies, categories, units, godowns, onEdit, onDelete, formatBDT }: ProductRowProps) {
  const handleEdit = useCallback(() => onEdit(p), [p, onEdit]);
  const handleDelete = useCallback(() => onDelete(p.id), [p.id, onDelete]);

  const categoryName = categories.find(c => c.id === p.categoryId)?.name || 'N/A';
  const uomName = units.find(u => u.id === p.uomId)?.name || 'N/A';
  const godownName = godowns.find(g => g.id === p.defaultGodownId)?.name || 'Main Godown';

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5">
        <div className="font-semibold text-slate-800">{p.name}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Cat: {categoryName} | UOM: {uomName}</div>
      </td>
      <td className="px-4 py-3.5 text-slate-550 font-mono font-medium">{p.sku}</td>
      <td className="px-4 py-3.5">
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
          {p.company}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-600">{formatBDT(p.defaultPP)}</td>
      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatBDT(p.defaultWSP)}</td>
      <td className="px-4 py-3.5 text-right font-mono text-slate-650">{formatBDT(p.defaultMRP)}</td>
      <td className="px-4 py-3.5 text-center">
        <div className="font-mono font-bold text-slate-750">{p.currentStock} Pcs</div>
      </td>
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Edit product"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
  const handleEdit = useCallback(() => onEdit(sr), [sr, onEdit]);
  const handleDelete = useCallback(() => onDelete(sr.id), [sr.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-slate-400" />
        {sr.name}
      </td>
      <td className="px-4 py-3.5 text-slate-600 font-mono font-medium">{sr.phone}</td>
      <td className="px-4 py-3.5 text-center">
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
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
  routes: Route[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  formatBDT: (amt: number) => string;
}

function ShopRow({ c, index, routes, onEdit, onDelete, formatBDT }: ShopRowProps) {
  const handleEdit = useCallback(() => onEdit(c), [c, onEdit]);
  const handleDelete = useCallback(() => onDelete(c.id), [c.id, onDelete]);

  const routeName = routes.find(r => r.id === c.routeId)?.name || 'Unassigned Beat';

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5">
        <div className="font-semibold text-slate-800 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-400" />
          {c.name}
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
          <MapPin className="w-3 h-3" />
          {c.market}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="font-semibold text-slate-700">{routeName}</div>
        <div className="text-[10px] text-slate-400">Route Map</div>
      </td>
      <td className="px-4 py-3.5 text-slate-550 font-mono">{c.phone}</td>
      <td className="px-4 py-3.5">
        <span className="bg-blue-50 text-blue-700 border border-blue-150 px-2.5 py-0.5 rounded text-[10px] font-semibold">
          SR: {c.assignedSR}
        </span>
      </td>
      <td className="px-4 py-3.5 font-mono text-slate-650">
        <div>Limit: {formatBDT(c.creditLimit || 0)}</div>
        <div className="text-[10px] text-slate-400">Days: {c.creditDays || 0} days</div>
      </td>
      <td className="px-4 py-3.5 text-center">
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
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: Company / Brand Row ---
interface CompanyRowProps {
  comp: CompanyBrand;
  index: number;
  onEdit: (comp: CompanyBrand) => void;
  onDelete: (id: string) => void;
}

function CompanyRow({ comp, index, onEdit, onDelete }: CompanyRowProps) {
  const handleEdit = useCallback(() => onEdit(comp), [comp, onEdit]);
  const handleDelete = useCallback(() => onDelete(comp.id), [comp.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800">{comp.name}</td>
      <td className="px-4 py-3.5">
        <div>{comp.contactPerson || 'N/A'}</div>
        <div className="text-[10px] text-slate-450 font-mono mt-0.5">{comp.phone || 'N/A'}</div>
      </td>
      <td className="px-4 py-3.5 text-slate-555">{comp.address || 'N/A'}</td>
      <td className="px-4 py-3.5 text-center">
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
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: Category Row ---
interface CategoryRowProps {
  cat: Category;
  index: number;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

function CategoryRow({ cat, index, onEdit, onDelete }: CategoryRowProps) {
  const handleEdit = useCallback(() => onEdit(cat), [cat, onEdit]);
  const handleDelete = useCallback(() => onDelete(cat.id), [cat.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800">{cat.name}</td>
      <td className="px-4 py-3.5 text-slate-550">{cat.description || 'N/A'}</td>
      <td className="px-4 py-3.5 text-center">
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
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: UOM Row ---
interface UnitRowProps {
  uom: UnitOfMeasure;
  index: number;
  onEdit: (uom: UnitOfMeasure) => void;
  onDelete: (id: string) => void;
}

function UnitRow({ uom, index, onEdit, onDelete }: UnitRowProps) {
  const handleEdit = useCallback(() => onEdit(uom), [uom, onEdit]);
  const handleDelete = useCallback(() => onDelete(uom.id), [uom.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800">{uom.name}</td>
      <td className="px-4 py-3.5 font-mono text-slate-650">{uom.multiplier} Pcs equivalence</td>
      <td className="px-4 py-3.5 text-center">
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

// --- SUB-COMPONENT: Godown Row ---
interface GodownRowProps {
  g: Godown;
  index: number;
  onEdit: (g: Godown) => void;
  onDelete: (id: string) => void;
}

function GodownRow({ g, index, onEdit, onDelete }: GodownRowProps) {
  const handleEdit = useCallback(() => onEdit(g), [g, onEdit]);
  const handleDelete = useCallback(() => onDelete(g.id), [g.id, onDelete]);

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800">{g.name}</td>
      <td className="px-4 py-3.5 text-slate-550">{g.location || 'N/A'}</td>
      <td className="px-4 py-3.5 text-center">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${g.isDamageGodown
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : 'bg-emerald-50 text-emerald-705 border-emerald-200'
          }`}>
          {g.isDamageGodown ? 'Damage/Return godown' : 'Salable godown'}
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
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
            className="p-1.5 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// --- SUB-COMPONENT: Route Row ---
interface RouteRowProps {
  r: Route;
  index: number;
  srs: SR[];
  onEdit: (r: Route) => void;
  onDelete: (id: string) => void;
}

function RouteRow({ r, index, srs, onEdit, onDelete }: RouteRowProps) {
  const handleEdit = useCallback(() => onEdit(r), [r, onEdit]);
  const handleDelete = useCallback(() => onDelete(r.id), [r.id, onDelete]);

  const srName = srs.find(s => s.id === r.assignedSRId)?.name || 'Unassigned SR';

  return (
    <tr className="hover:bg-slate-50/50 transition-all duration-200 text-xs">
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5 font-semibold text-slate-800">{r.name}</td>
      <td className="px-4 py-3.5">{r.area}</td>
      <td className="px-4 py-3.5 text-slate-500">{r.territory}</td>
      <td className="px-4 py-3.5">
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-semibold">
          {srName}
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
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

// --- MAIN DIRECTORY MODULE ---
export default function DirectoryModule({
  products,
  setProducts,
  srs,
  setSrs,
  customers,
  setCustomers,
  companies,
  setCompanies,
  productCategories,
  setProductCategories,
  units,
  setUnits,
  godowns,
  setGodowns,
  routes,
  setRoutes,
  language,
  defaultTab,
  visibleTabs,
  pageTitle,
  pageSubtitle
}: DirectoryModuleProps) {
  const tCommon = dict[language].common;
  const tDir = dict[language].directory;

  const [activeSubTab, setActiveSubTab] = useState<DirectoryTab>(defaultTab || 'products');

  // Damage states
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedDamageProduct, setSelectedDamageProduct] = useState<Product | null>(null);
  const [damageQtyInput, setDamageQtyInput] = useState<number>(0);
  const [deductFromSalable, setDeductFromSalable] = useState(false);
  const [selectedDamageCompany, setSelectedDamageCompany] = useState<string>('All');

  // Modal displays
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSrModal, setShowSrModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showGodownModal, setShowGodownModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  // Editing States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingSr, setEditingSr] = useState<SR | null>(null);
  const [editingShop, setEditingShop] = useState<Customer | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyBrand | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUnit, setEditingUnit] = useState<UnitOfMeasure | null>(null);
  const [editingGodown, setEditingGodown] = useState<Godown | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  // Form Fields: Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCompany, setProdCompany] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodUomId, setProdUomId] = useState('');
  const [prodGodownId, setProdGodownId] = useState('');
  const [prodPP, setProdPP] = useState<number>(0);
  const [prodWSP, setProdWSP] = useState<number>(0);
  const [prodMRP, setProdMRP] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(0);

  // Form Fields: SR
  const [srName, setSrName] = useState('');
  const [srPhone, setSrPhone] = useState('');

  // Form Fields: Shop
  const [shopName, setShopName] = useState('');
  const [shopMarket, setShopMarket] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAssignedSR, setShopAssignedSR] = useState('');
  const [shopRouteId, setShopRouteId] = useState('');
  const [shopCreditLimit, setShopCreditLimit] = useState<number>(0);
  const [shopCreditDays, setShopCreditDays] = useState<number>(0);

  // Auto-fill assigned SR based on Route mapping inside shop setup
  useEffect(() => {
    if (shopRouteId) {
      const selectedRoute = routes.find(r => r.id === shopRouteId);
      if (selectedRoute && selectedRoute.assignedSRId) {
        const sr = srs.find(s => s.id === selectedRoute.assignedSRId);
        if (sr) {
          setShopAssignedSR(sr.name);
        }
      }
    }
  }, [shopRouteId, routes, srs]);

  // Form Fields: Company
  const [compName, setCompName] = useState('');
  const [compContact, setCompContact] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');

  // Form Fields: Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Form Fields: Unit
  const [unitName, setUnitName] = useState('');
  const [unitMultiplier, setUnitMultiplier] = useState<number>(1);

  // Form Fields: Godown
  const [godownName, setGodownName] = useState('');
  const [godownLocation, setGodownLocation] = useState('');
  const [godownIsDamage, setGodownIsDamage] = useState(false);

  // Form Fields: Route
  const [routeName, setRouteName] = useState('');
  const [routeArea, setRouteArea] = useState('');
  const [routeTerritory, setRouteTerritory] = useState('');
  const [routeAssignedSR, setRouteAssignedSR] = useState('');

  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  }, []);

  // --- SUBMIT: Product ---
  const handleProductSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku || !prodCompany) {
      alert('Please fill out product Name, SKU, and Company.');
      return;
    }

    const payload = {
      name: prodName,
      sku: prodSku,
      company: prodCompany,
      categoryId: prodCategoryId || undefined,
      uomId: prodUomId || undefined,
      defaultGodownId: prodGodownId || undefined,
      defaultPP: Number(prodPP),
      defaultWSP: Number(prodWSP),
      defaultMRP: Number(prodMRP),
      currentStock: Number(prodStock)
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
      setEditingProduct(null);
    } else {
      setProducts(prev => [...prev, { id: `prod-${Date.now()}`, ...payload }]);
    }

    setShowProductModal(false);
  }, [prodName, prodSku, prodCompany, prodCategoryId, prodUomId, prodGodownId, prodPP, prodWSP, prodMRP, prodStock, editingProduct, setProducts]);

  // --- SUBMIT: SR ---
  const handleSrSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!srName || !srPhone) {
      alert('Representative Name and Phone Contact are required.');
      return;
    }

    if (editingSr) {
      setSrs(prev => prev.map(s => s.id === editingSr.id ? { ...s, name: srName, phone: srPhone } : s));
      setEditingSr(null);
    } else {
      setSrs(prev => [...prev, { id: `sr-${Date.now()}`, name: srName, phone: srPhone }]);
    }
    setShowSrModal(false);
  }, [srName, srPhone, editingSr, setSrs]);

  // --- SUBMIT: Shop ---
  const handleShopSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName || !shopAssignedSR) {
      alert('Shop Name and assigned SR are required.');
      return;
    }

    const payload = {
      name: shopName,
      market: shopMarket || 'General Market',
      phone: shopPhone || 'N/A',
      assignedSR: shopAssignedSR,
      routeId: shopRouteId || undefined,
      creditLimit: Number(shopCreditLimit),
      creditDays: Number(shopCreditDays)
    };

    if (editingShop) {
      setCustomers(prev => prev.map(c => c.id === editingShop.id ? { ...c, ...payload } : c));
      setEditingShop(null);
    } else {
      setCustomers(prev => [...prev, { id: `cust-${Date.now()}`, ...payload }]);
    }
    setShowShopModal(false);
  }, [shopName, shopMarket, shopPhone, shopAssignedSR, shopRouteId, shopCreditLimit, shopCreditDays, editingShop, setCustomers]);

  // --- SUBMIT & EDIT: Damage ---
  const handleOpenDamageModal = useCallback((product: Product) => {
    setSelectedDamageProduct(product);
    setDamageQtyInput(product.damagedStock || 0);
    setDeductFromSalable(false);
    setShowDamageModal(true);
  }, []);

  const handleDamageSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDamageProduct) return;

    const newDamageQty = Math.max(0, Number(damageQtyInput));
    const oldDamageQty = selectedDamageProduct.damagedStock || 0;
    const diff = newDamageQty - oldDamageQty;

    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === selectedDamageProduct.id) {
        let salableStock = p.currentStock;
        if (deductFromSalable && diff > 0) {
          salableStock = Math.max(0, salableStock - diff);
        }
        return {
          ...p,
          damagedStock: newDamageQty,
          currentStock: salableStock
        };
      }
      return p;
    }));

    setShowDamageModal(false);
    setSelectedDamageProduct(null);
  }, [selectedDamageProduct, damageQtyInput, deductFromSalable, setProducts]);

  // --- SUBMIT: Company ---
  const handleCompanySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) {
      alert('Company/Brand Name is required.');
      return;
    }

    const payload = {
      name: compName,
      contactPerson: compContact || undefined,
      phone: compPhone || undefined,
      address: compAddress || undefined
    };

    if (editingCompany) {
      setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...payload } : c));
      setEditingCompany(null);
    } else {
      setCompanies(prev => [...prev, { id: `comp-${Date.now()}`, ...payload }]);
    }
    setShowCompanyModal(false);
  }, [compName, compContact, compPhone, compAddress, editingCompany, setCompanies]);

  // --- SUBMIT: Category ---
  const handleCategorySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      alert('Category Name is required.');
      return;
    }

    if (editingCategory) {
      setProductCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: catName, description: catDesc } : c));
      setEditingCategory(null);
    } else {
      setProductCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: catName, description: catDesc }]);
    }
    setShowCategoryModal(false);
  }, [catName, catDesc, editingCategory, setProductCategories]);

  // --- SUBMIT: Unit ---
  const handleUnitSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName || unitMultiplier <= 0) {
      alert('Unit Name and a positive conversion multiplier are required.');
      return;
    }

    if (editingUnit) {
      setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, name: unitName, multiplier: Number(unitMultiplier) } : u));
      setEditingUnit(null);
    } else {
      setUnits(prev => [...prev, { id: `uom-${Date.now()}`, name: unitName, multiplier: Number(unitMultiplier) }]);
    }
    setShowUnitModal(false);
  }, [unitName, unitMultiplier, editingUnit, setUnits]);

  // --- SUBMIT: Godown ---
  const handleGodownSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!godownName) {
      alert('Warehouse/Godown Name is required.');
      return;
    }

    const payload = {
      name: godownName,
      location: godownLocation || undefined,
      isDamageGodown: godownIsDamage
    };

    if (editingGodown) {
      setGodowns(prev => prev.map(g => g.id === editingGodown.id ? { ...g, ...payload } : g));
      setEditingGodown(null);
    } else {
      setGodowns(prev => [...prev, { id: `g-${Date.now()}`, ...payload }]);
    }
    setShowGodownModal(false);
  }, [godownName, godownLocation, godownIsDamage, editingGodown, setGodowns]);

  // --- SUBMIT: Route ---
  const handleRouteSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!routeName || !routeArea || !routeTerritory) {
      alert('Route name, Area, and Territory details are required.');
      return;
    }

    const payload = {
      name: routeName,
      area: routeArea,
      territory: routeTerritory,
      assignedSRId: routeAssignedSR || undefined
    };

    if (editingRoute) {
      setRoutes(prev => prev.map(r => r.id === editingRoute.id ? { ...r, ...payload } : r));
      setEditingRoute(null);
    } else {
      setRoutes(prev => [...prev, { id: `route-${Date.now()}`, ...payload }]);
    }
    setShowRouteModal(false);
  }, [routeName, routeArea, routeTerritory, routeAssignedSR, editingRoute, setRoutes]);


  // --- OPEN MODAL HANDLERS ---
  const handleOpenProduct = useCallback(() => {
    setEditingProduct(null);
    setProdName('');
    setProdSku('');
    setProdCompany(companies[0]?.name || 'Pran');
    setProdCategoryId(productCategories[0]?.id || '');
    setProdUomId(units[0]?.id || '');
    setProdGodownId(godowns[0]?.id || '');
    setProdPP(0);
    setProdWSP(0);
    setProdMRP(0);
    setProdStock(0);
    setShowProductModal(true);
  }, [companies, productCategories, units, godowns]);

  const handleOpenShop = useCallback(() => {
    setEditingShop(null);
    setShopName('');
    setShopMarket('');
    setShopPhone('');
    setShopRouteId(routes[0]?.id || '');
    setShopAssignedSR(srs[0]?.name || '');
    setShopCreditLimit(0);
    setShopCreditDays(0);
    setShowShopModal(true);
  }, [routes, srs]);

  const handleOpenCompany = useCallback(() => {
    setEditingCompany(null);
    setCompName('');
    setCompContact('');
    setCompPhone('');
    setCompAddress('');
    setShowCompanyModal(true);
  }, []);

  const handleOpenCategory = useCallback(() => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setShowCategoryModal(true);
  }, []);

  const handleOpenUnit = useCallback(() => {
    setEditingUnit(null);
    setUnitName('');
    setUnitMultiplier(1);
    setShowUnitModal(true);
  }, []);

  const handleOpenGodown = useCallback(() => {
    setEditingGodown(null);
    setGodownName('');
    setGodownLocation('');
    setGodownIsDamage(false);
    setShowGodownModal(true);
  }, []);

  const handleOpenRoute = useCallback(() => {
    setEditingRoute(null);
    setRouteName('');
    setRouteArea('');
    setRouteTerritory('');
    setRouteAssignedSR(srs[0]?.id || '');
    setShowRouteModal(true);
  }, [srs]);


  // --- START EDIT HANDLERS ---
  const startEditProduct = useCallback((p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCompany(p.company);
    setProdCategoryId(p.categoryId || '');
    setProdUomId(p.uomId || '');
    setProdGodownId(p.defaultGodownId || '');
    setProdPP(p.defaultPP);
    setProdWSP(p.defaultWSP);
    setProdMRP(p.defaultMRP);
    setProdStock(p.currentStock);
    setShowProductModal(true);
  }, []);

  const startEditShop = useCallback((c: Customer) => {
    setEditingShop(c);
    setShopName(c.name);
    setShopMarket(c.market);
    setShopPhone(c.phone);
    setShopAssignedSR(c.assignedSR);
    setShopRouteId(c.routeId || '');
    setShopCreditLimit(c.creditLimit || 0);
    setShopCreditDays(c.creditDays || 0);
    setShowShopModal(true);
  }, []);

  const startEditCompany = useCallback((comp: CompanyBrand) => {
    setEditingCompany(comp);
    setCompName(comp.name);
    setCompContact(comp.contactPerson || '');
    setCompPhone(comp.phone || '');
    setCompAddress(comp.address || '');
    setShowCompanyModal(true);
  }, []);

  const startEditCategory = useCallback((cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setShowCategoryModal(true);
  }, []);

  const startEditUnit = useCallback((u: UnitOfMeasure) => {
    setEditingUnit(u);
    setUnitName(u.name);
    setUnitMultiplier(u.multiplier);
    setShowUnitModal(true);
  }, []);

  const startEditGodown = useCallback((g: Godown) => {
    setEditingGodown(g);
    setGodownName(g.name);
    setGodownLocation(g.location || '');
    setGodownIsDamage(!!g.isDamageGodown);
    setShowGodownModal(true);
  }, []);

  const startEditRoute = useCallback((r: Route) => {
    setEditingRoute(r);
    setRouteName(r.name);
    setRouteArea(r.area);
    setRouteTerritory(r.territory);
    setRouteAssignedSR(r.assignedSRId || '');
    setShowRouteModal(true);
  }, []);

  // --- DELETE HANDLERS ---
  const handleDeleteProduct = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  }, [tCommon.confirmDelete, setProducts]);

  const handleDeleteSr = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setSrs(prev => prev.filter(s => s.id !== id));
    }
  }, [tCommon.confirmDelete, setSrs]);

  const handleDeleteShop = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  }, [tCommon.confirmDelete, setCustomers]);

  const handleDeleteCompany = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setCompanies(prev => prev.filter(c => c.id !== id));
    }
  }, [tCommon.confirmDelete, setCompanies]);

  const handleDeleteCategory = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setProductCategories(prev => prev.filter(c => c.id !== id));
    }
  }, [tCommon.confirmDelete, setProductCategories]);

  const handleDeleteUnit = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  }, [tCommon.confirmDelete, setUnits]);

  const handleDeleteGodown = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setGodowns(prev => prev.filter(g => g.id !== id));
    }
  }, [tCommon.confirmDelete, setGodowns]);

  const handleDeleteRoute = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setRoutes(prev => prev.filter(r => r.id !== id));
    }
  }, [tCommon.confirmDelete, setRoutes]);

  return (
    <div className="space-y-6">

      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300" />
            {pageTitle || tDir.title}
          </h2>
          <p className="text-slate-300 text-xs">{pageSubtitle || tDir.subtitle}</p>
        </div>

        {/* Tab Selectors — filtered by visibleTabs if provided */}
        <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm gap-1 shrink-0 z-10 relative">
          {[
            { id: 'products', label: tDir.tabProducts, icon: Package },
            { id: 'srs', label: tDir.tabSrs, icon: UserCheck },
            { id: 'shops', label: tDir.tabShops || 'Retail Customers', icon: Building },
            { id: 'damage', label: tDir.tabDamage || 'Damage List', icon: AlertTriangle },
            { id: 'companies', label: tDir.tabCompanies, icon: Briefcase },
            { id: 'categories', label: tDir.tabCategories, icon: Sliders },
            { id: 'units', label: tDir.tabUnits, icon: DollarSign },
            { id: 'godowns', label: tDir.tabGodowns, icon: HardDrive },
            { id: 'routes', label: tDir.tabRoutes, icon: Compass }
          ]
            .filter(tab => !visibleTabs || visibleTabs.includes(tab.id as DirectoryTab))
            .map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id as DirectoryTab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                      ? 'bg-white text-slate-950 shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* SUB-TAB: Products Catalog */}
      {activeSubTab === 'products' && (() => {
        const totalProductsStockValuation = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPP), 0);
        const lowStockCount = products.filter(p => p.currentStock < 600).length;

        return (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Card 1: Total Registered Items */}
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/20 rounded-2xl border border-blue-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm shadow-blue-200">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট নিবন্ধিত পণ্য' : 'Total SKU Count'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {products.length} <span className="text-xs font-bold text-slate-500">{language === 'bn' ? 'টি আইটেম' : 'Products'}</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Total Inventory Valuation */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-2xl border border-emerald-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-emerald-500 rounded-xl text-white shadow-sm shadow-emerald-200">
                  <span className="text-xl font-bold font-mono">৳</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট ইনভেন্টরি মূল্য' : 'Inventory Valuation'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {formatBDT(totalProductsStockValuation)}
                  </span>
                </div>
              </div>

              {/* Card 3: Low Stock Alerts */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/20 rounded-2xl border border-amber-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-amber-500 rounded-xl text-white shadow-sm shadow-amber-200">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'স্টক সংকট অ্যালার্ট' : 'Low Stock Alerts'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {lowStockCount} <span className="text-xs font-bold text-slate-500">{language === 'bn' ? 'টি সংকটে' : 'Items'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* List Sub-header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'পণ্য ক্যাটালগ ও মূল্য' : 'Product Inventory & Pricing'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {language === 'bn' ? 'ক্রয়মূল্য, পাইকারি মূল্য, খুচরা মূল্য এবং বর্তমান স্টক' : 'Import cost, wholesale supply, retail MRP and margin levels'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenProduct}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                {tDir.registerProduct}
              </button>
            </div>

            {/* Product Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(p => {
                const categoryName = productCategories.find(c => c.id === p.categoryId)?.name || 'N/A';
                const uomName = units.find(u => u.id === p.uomId)?.name || 'N/A';
                const godownName = godowns.find(g => g.id === p.defaultGodownId)?.name || 'Main Godown';
                const marginPct = p.defaultWSP > 0 ? ((p.defaultWSP - p.defaultPP) / p.defaultWSP) * 100 : 0;

                const isLowStock = p.currentStock < 600;

                let brandStyle = "bg-purple-50 text-purple-700 border-purple-150";
                if (p.company.toLowerCase() === 'pran') {
                  brandStyle = "bg-orange-50 text-orange-700 border-orange-150";
                } else if (p.company.toLowerCase() === 'olympic') {
                  brandStyle = "bg-blue-50 text-blue-700 border-blue-150";
                } else if (p.company.toLowerCase() === 'haque') {
                  brandStyle = "bg-emerald-50 text-emerald-700 border-emerald-150";
                }

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-blue-500/5 transition-all duration-500 pointer-events-none" />

                    <div className="space-y-2.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${brandStyle}`}>
                          {p.company}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {p.sku}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-slate-900 transition-colors line-clamp-1 leading-snug">
                        {p.name}
                      </h4>

                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Cat: {categoryName}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">UOM: {uomName}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{godownName}</span>
                      </div>
                    </div>

                    {/* Stock Meter */}
                    <div className="space-y-1.5 relative z-10 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>{language === 'bn' ? 'স্টক লেভেল' : 'Stock Level'}</span>
                        <span className={isLowStock ? "text-amber-600 animate-pulse font-extrabold" : "text-slate-700"}>
                          {p.currentStock} {language === 'bn' ? 'টি' : 'Units'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, (p.currentStock / 5000) * 100)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                        />
                      </div>
                    </div>

                    {/* Prices Grid */}
                    <div className="grid grid-cols-3 gap-2 relative z-10 pt-1 text-center">
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-150">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Import PP</span>
                        <span className="font-mono text-xs font-bold text-slate-700">{formatBDT(p.defaultPP)}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-150">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Wholesale</span>
                        <span className="font-mono text-xs font-extrabold text-slate-800">{formatBDT(p.defaultWSP)}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 border border-slate-150">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Retail MRP</span>
                        <span className="font-mono text-xs font-bold text-slate-600">{formatBDT(p.defaultMRP)}</span>
                      </div>
                    </div>

                    {/* Margin Info & Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">{language === 'bn' ? 'পাইকারি মার্জিন' : 'Wholesale Margin'}</span>
                        <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 inline-block">
                          +{marginPct.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditProduct(p)}
                          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                          title="Edit product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: Retail Shops / Customers */}
      {activeSubTab === 'shops' && (() => {
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'খুচরা বিক্রেতা ও গ্রাহক তালিকা' : 'Retail Partners & Customers'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {language === 'bn' ? 'সরাসরি খুচরা বাজারের সেলস পয়েন্ট ও Beat ম্যাপিং করা দোকানসমূহ' : 'Manage retail outlets, credit thresholds, routes beat allocation and sales agents'}
                </p>
              </div>

              <button
                id="btn-register-shop-top"
                type="button"
                onClick={handleOpenShop}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
                {tDir.registerShop}
              </button>
            </div>

            {customers.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-semibold shadow-sm">
                {language === 'bn' ? 'কোন দোকান পাওয়া যায়নি' : 'No retail customers registered.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {customers.map((c, index) => {
                  const routeName = routes.find(r => r.id === c.routeId)?.name || 'Unassigned Beat';
                  
                  return (
                    <div 
                      key={c.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />
                      
                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs shadow-sm">
                            <Building className="w-4 h-4 text-white" />
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-full text-[9px] font-bold text-slate-650 uppercase tracking-wider">
                            {routeName}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-slate-950 transition-colors">
                            {c.name}
                          </h4>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{c.market}</span>
                          </div>

                          <div className="text-[11px] font-mono text-slate-505 font-bold pt-1.5 flex items-center gap-1">
                            <span className="text-slate-400 font-semibold font-sans">Phone:</span>
                            {c.phone}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Agent: {c.assignedSR}
                          </span>
                        </div>
                      </div>

                      {/* Credit Ledger details */}
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-150 relative z-10 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Credit Limit</span>
                          <span className="font-mono font-extrabold text-slate-900">{formatBDT(c.creditLimit || 0)}</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wide block">Terms</span>
                          <span className="font-bold text-slate-700">{c.creditDays || 0} Days</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 relative z-10">
                        <button
                          type="button"
                          onClick={() => startEditShop(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-350 bg-white text-slate-650 hover:bg-slate-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title="Edit shop details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(c.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title="Delete shop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB: Sales Representatives (SRs) */}
      {activeSubTab === 'srs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'セルস রিপ্রেজেন্টেটিভস (SR)' : 'Sales Representatives (SR)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'বাজারের অর্ডার কালেকশন এবং দোকান ম্যাপ করা প্রতিনিধিগণ' : 'Field force agents managing retail market bookings and routes'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingSr(null);
                setSrName('');
                setSrPhone('');
                setShowSrModal(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerSr}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {srs.map((sr, index) => {
              const assignedShopsCount = customers.filter(c => c.assignedSR.toLowerCase() === sr.name.toLowerCase()).length;
              const initials = sr.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              // Colors dynamically selected based on index
              const colorGradients = [
                'from-indigo-500 to-blue-600',
                'from-emerald-500 to-teal-600',
                'from-amber-500 to-orange-600',
                'from-purple-500 to-pink-600',
                'from-rose-500 to-red-600'
              ];
              const gradient = colorGradients[index % colorGradients.length];

              return (
                <div
                  key={sr.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex items-center justify-between relative overflow-hidden group"
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Circle avatar initials */}
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-sm shadow-md`}>
                      {initials}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                        {sr.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold">
                        {sr.phone}
                      </p>
                      <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        {language === 'bn' ? `${assignedShopsCount}টি দোকান বরাদ্দ` : `${assignedShopsCount} Shops Assigned`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 relative z-10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSr(sr);
                        setSrName(sr.name);
                        setSrPhone(sr.phone);
                        setShowSrModal(true);
                      }}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Edit salesman"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSr(sr.id)}
                      className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Delete salesman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: Product Damage List */}
      {activeSubTab === 'damage' && (() => {
        const damageFilteredProducts = products.filter(p => selectedDamageCompany === 'All' || p.company === selectedDamageCompany);

        // Calculations for KPI Cards
        const totalDamagedUnits = damageFilteredProducts.reduce((sum, p) => sum + (p.damagedStock || 0), 0);
        const totalDamagedValue = damageFilteredProducts.reduce((sum, p) => sum + ((p.damagedStock || 0) * p.defaultPP), 0);
        const totalSalableUnits = damageFilteredProducts.reduce((sum, p) => sum + p.currentStock, 0);
        const totalUnitsCount = totalSalableUnits + totalDamagedUnits;
        const damageRatio = totalUnitsCount > 0 ? (totalDamagedUnits / totalUnitsCount) * 100 : 0;

        return (
          <div className="space-y-6">
            {/* Top KPI Cards section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Card 1: Total Damaged Units */}
              <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/20 rounded-2xl border border-rose-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-rose-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-rose-500 rounded-xl text-white shadow-sm shadow-rose-200">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট ড্যামেজ পণ্য' : 'Total Damaged Units'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {totalDamagedUnits} <span className="text-xs font-bold text-slate-500">{language === 'bn' ? 'টি' : 'Units'}</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Estimated Financial Loss */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/20 rounded-2xl border border-amber-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-amber-500 rounded-xl text-white shadow-sm shadow-amber-200">
                  <span className="text-xl font-bold font-mono">৳</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'ক্ষয়ক্ষতি প্রাক্কলন (ক্রয়মূল্যে)' : 'Est. Loss Value (PP)'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {formatBDT(totalDamagedValue)}
                  </span>
                </div>
              </div>

              {/* Card 3: Damage Ratio */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-violet-50/20 rounded-2xl border border-indigo-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-indigo-500/5 rounded-tl-full pointer-events-none" />
                <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-sm shadow-indigo-200">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'ড্যামেজের হার' : 'Damage Ratio'}
                  </span>
                  <span className="text-2xl font-black text-slate-850 font-mono tracking-tight">
                    {damageRatio.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-header Filter panel */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'ড্যামেজ ও ডিফেক্ট তালিকা' : 'Damage & Defect Records'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {language === 'bn' ? 'প্রতিটি কোম্পানির তালিকা এবং সমন্বয়ের অপশন' : 'Brand-wise list of product conditions and action items'}
                </p>
              </div>

              {/* Premium Pill-based Company Filters instead of generic select */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedDamageCompany('All')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${selectedDamageCompany === 'All'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {language === 'bn' ? 'সব কোম্পানি' : 'All Brands'}
                </button>
                {companies.map(c => {
                  const isActive = selectedDamageCompany === c.name;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedDamageCompany(c.name)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of Lucrative Product Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {damageFilteredProducts.map(p => {
                const damagedQty = p.damagedStock || 0;
                const totalQty = p.currentStock + damagedQty;
                const itemDamageRatio = totalQty > 0 ? (damagedQty / totalQty) * 100 : 0;

                // Color theme based on company
                let themePillStyle = "bg-purple-50 text-purple-700 border-purple-150";
                if (p.company.toLowerCase() === 'pran') {
                  themePillStyle = "bg-orange-50 text-orange-700 border-orange-150";
                } else if (p.company.toLowerCase() === 'olympic') {
                  themePillStyle = "bg-blue-50 text-blue-700 border-blue-150";
                } else if (p.company.toLowerCase() === 'haque') {
                  themePillStyle = "bg-emerald-50 text-emerald-700 border-emerald-150";
                }

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    {/* Corner decorative gradient glow on hover */}
                    <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-rose-500/5 transition-all duration-500 pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${themePillStyle}`}>
                          {p.company}
                        </span>
                        <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                          {p.sku}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-slate-900 transition-colors line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                    </div>

                    {/* Stock breakdowns */}
                    <div className="grid grid-cols-2 gap-3 relative z-10 pt-1">
                      <div className="bg-emerald-50/30 rounded-2xl p-3 border border-emerald-100">
                        <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider block">
                          {language === 'bn' ? 'বিক্রয়যোগ্য স্টক' : 'Salable Stock'}
                        </span>
                        <span className="font-mono text-sm font-black text-slate-800">
                          {p.currentStock} <span className="text-[10px] font-semibold text-slate-400">{language === 'bn' ? 'টি' : 'Units'}</span>
                        </span>
                      </div>

                      <div className="bg-rose-50/30 rounded-2xl p-3 border border-rose-100">
                        <span className="text-[9px] text-rose-600 font-bold uppercase tracking-wider block">
                          {language === 'bn' ? 'ড্যামেজ স্টক' : 'Damaged Stock'}
                        </span>
                        <span className="font-mono text-sm font-black text-slate-800">
                          {damagedQty} <span className="text-[10px] font-semibold text-slate-400">{language === 'bn' ? 'টি' : 'Units'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Visual Damage progress meter */}
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>{language === 'bn' ? 'ক্ষয়ক্ষতির অনুপাত' : 'Damage Ratio'}</span>
                        <span className={damagedQty > 0 ? "text-rose-600" : "text-slate-400"}>
                          {itemDamageRatio.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, itemDamageRatio)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${itemDamageRatio > 10 ? 'bg-rose-500' : itemDamageRatio > 0 ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                        />
                      </div>
                    </div>

                    {/* Loss Estimate & Adjust Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">
                          {language === 'bn' ? 'আর্থিক ক্ষতি প্রাক্কলন' : 'Loss Estimate'}
                        </span>
                        <span className="font-mono text-xs font-black text-rose-600">
                          {formatBDT(damagedQty * p.defaultPP)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenDamageModal(p)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 px-3.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'সমন্বয়' : 'Adjust'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {damageFilteredProducts.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 font-semibold text-sm bg-white rounded-2xl border border-slate-200">
                  {language === 'bn' ? 'কোনো ড্যামেজ পণ্য পাওয়া যায়নি।' : 'No damaged products found for this brand.'}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: Companies & Brands */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'কোম্পানি ও ব্র্যান্ড তালিকা' : 'Companies & Brands'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'পণ্য সরবরাহকারী ব্র্যান্ড এবং ডিস্ট্রিবিউটর কোম্পানি সমূহ' : 'Supplier manufacturer brands and brand partner identities'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCompany}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerCompany}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((comp, index) => {
              const brandProductsCount = products.filter(p => p.company.toLowerCase() === comp.name.toLowerCase()).length;

              let brandColorStyle = "from-purple-500 to-indigo-600";
              if (comp.name.toLowerCase() === 'pran') {
                brandColorStyle = "from-orange-500 to-red-500";
              } else if (comp.name.toLowerCase() === 'olympic') {
                brandColorStyle = "from-blue-500 to-indigo-600";
              } else if (comp.name.toLowerCase() === 'haque') {
                brandColorStyle = "from-emerald-500 to-teal-600";
              }

              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${brandColorStyle} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                        {comp.name[0].toUpperCase()}
                      </span>
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {language === 'bn' ? `${brandProductsCount}টি পণ্য নিবন্ধিত` : `${brandProductsCount} Products`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                        {comp.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                        <span className="font-bold text-slate-705">Contact:</span> {comp.contactPerson || 'N/A'} ({comp.phone || 'N/A'})
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        <span className="font-bold text-slate-500">Address:</span> {comp.address || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 relative z-10">
                    <button
                      type="button"
                      onClick={() => startEditCompany(comp)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Edit company"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCompany(comp.id)}
                      className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Delete company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: Categories */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'পণ্যের ক্যাটাগরি সমূহ' : 'Product Categories'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'পণ্যের শ্রেণীবিভাগ ও শ্রেণীবিন্যাস ক্লাস' : 'Taxonomy classes used to classify different product varieties'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenCategory}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerCategory}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productCategories.map((cat, index) => {
              const categoryProductsCount = products.filter(p => p.categoryId === cat.id).length;

              const colorGradients = [
                'from-teal-500 to-emerald-600',
                'from-sky-500 to-indigo-600',
                'from-amber-500 to-rose-500',
                'from-violet-500 to-purple-600'
              ];
              const gradient = colorGradients[index % colorGradients.length];

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                        {cat.name[0].toUpperCase()}
                      </span>
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {language === 'bn' ? `${categoryProductsCount}টি পণ্য ম্যাপড` : `${categoryProductsCount} Products`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                        {cat.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {cat.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 relative z-10">
                    <button
                      type="button"
                      onClick={() => startEditCategory(cat)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Edit category"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Delete category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: Units (UOM) */}
      {activeSubTab === 'units' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'পরিমাপের একক সমূহ (UOM)' : 'Units of Measure (UOM)'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'পণ্যের পরিমাপ, কার্টুন অথবা বক্সের গুণক সমূহ' : 'Packaging scales and conversion counts used for wholesale lot dispatches'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenUnit}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerUnit}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map((uom, index) => {
              const colorGradients = [
                'from-violet-500 to-indigo-600',
                'from-amber-500 to-orange-600',
                'from-emerald-500 to-teal-600',
                'from-sky-500 to-blue-600'
              ];
              const gradient = colorGradients[index % colorGradients.length];

              return (
                <div
                  key={uom.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                        {uom.name[0].toUpperCase()}
                      </span>
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">
                        {language === 'bn' ? `১ ${uom.name} = ${uom.multiplier} টি` : `Multiplier: x${uom.multiplier}`}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                        {uom.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold font-mono">
                        {language === 'bn' ? `সমানুপাতী পরিমাণ: ${uom.multiplier} পিস` : `Equivalence standard: ${uom.multiplier} Units (pcs)`}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 relative z-10">
                    <button
                      type="button"
                      onClick={() => startEditUnit(uom)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Edit unit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(uom.id)}
                      className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Delete unit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: Warehouses / Godowns */}
      {activeSubTab === 'godowns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-800">
                {language === 'bn' ? 'গুদাম ও ডিপো সমূহ' : 'Warehouses & Storage Depots'}
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {language === 'bn' ? 'বিক্রয়যোগ্য স্টক এবং ড্যামেজ স্টক সংরক্ষণের গুদাম সমূহ' : 'Physical locations housing salable batch stock or returns'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenGodown}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerGodown}
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {godowns.map((g, index) => {
              const godownProductsCount = products.filter(p => p.defaultGodownId === g.id).length;

              const colorGradients = [
                'from-blue-500 to-indigo-600',
                'from-emerald-500 to-teal-600',
                'from-purple-500 to-violet-600',
                'from-amber-500 to-orange-600'
              ];
              const gradient = colorGradients[index % colorGradients.length];

              return (
                <div
                  key={g.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                >
                  <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                        <HardDrive className="w-4 h-4 text-white" />
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${g.isDamageGodown
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-705 border-emerald-200'
                        }`}>
                        {g.isDamageGodown
                          ? (language === 'bn' ? 'ড্যামেজ/ফেরত গুদাম' : 'Damage/Return')
                          : (language === 'bn' ? 'বিক্রয়যোগ্য গুদাম' : 'Salable Stock')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 group-hover:text-slate-900 transition-colors text-sm sm:text-base leading-snug">
                        {g.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {g.location || 'N/A'}
                      </p>
                      <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        {language === 'bn' ? `${godownProductsCount}টি পণ্যের ডিপো` : `${godownProductsCount} Default Products`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1 relative z-10">
                    <button
                      type="button"
                      onClick={() => startEditGodown(g)}
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Edit warehouse"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGodown(g.id)}
                      className="p-2 text-rose-500 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Delete warehouse"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: Route Beats */}
      {activeSubTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{routes.length} Active Beats</span>
            <button
              type="button"
              onClick={handleOpenRoute}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerRoute}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">Beat / Route</th>
                  <th className="px-4 py-4 text-sm font-semibold">Area Ward</th>
                  <th className="px-4 py-4 text-sm font-semibold">Territory</th>
                  <th className="px-4 py-4 text-sm font-semibold">Assigned Representative</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((r, index) => (
                  <RouteRow
                    key={r.id}
                    r={r}
                    index={index}
                    srs={srs}
                    onEdit={startEditRoute}
                    onDelete={handleDeleteRoute}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* MODAL: Product Setup */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleProductSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Tag className="w-4.5 h-4.5 text-slate-700" />
                {editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}
              </span>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-800">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pran Mango Juice 250ml"
                  value={prodName}
                  onChange={e => setProdName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
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
                    onChange={e => setProdSku(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductCompany}</label>
                  <select
                    value={prodCompany}
                    onChange={e => setProdCompany(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">{tDir.formProductCategory.replace(' *', '')}</label>
                  <select
                    value={prodCategoryId}
                    onChange={e => setProdCategoryId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">No Category</option>
                    {productCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">{tDir.formProductUnit.replace(' *', '')}</label>
                  <select
                    value={prodUomId}
                    onChange={e => setProdUomId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 font-semibold outline-none focus:border-slate-800"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Import PP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodPP}
                    onChange={e => setProdPP(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Supply WSP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodWSP}
                    onChange={e => setProdWSP(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Market MRP (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prodMRP}
                    onChange={e => setProdMRP(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{tDir.formProductStock}</label>
                <input
                  type="number"
                  min="0"
                  value={prodStock}
                  onChange={e => setProdStock(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-955 cursor-pointer shadow-sm">{editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SR Setup */}
      {showSrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSrSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4.5 h-4.5 text-slate-750" />
                {editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}
              </span>
              <button type="button" onClick={() => setShowSrModal(false)} className="text-slate-400 hover:text-slate-850">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formSrName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Selim Ahmed"
                  value={srName}
                  onChange={e => setSrName(e.target.value)}
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
                  onChange={e => setSrPhone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowSrModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Customer Shop Setup */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleShopSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Building className="w-4.5 h-4.5 text-slate-750" />
                {editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}
              </span>
              <button type="button" onClick={() => setShowShopModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shop-8 (Janata Grocery)"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopAddress}</label>
                <input
                  type="text"
                  placeholder="e.g. Chowk Bazar Alley, Dhaka"
                  value={shopMarket}
                  onChange={e => setShopMarket(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopPhone}</label>
                  <input
                    type="text"
                    placeholder="e.g. 018XXXXXXXX"
                    value={shopPhone}
                    onChange={e => setShopPhone(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopRoute}</label>
                  <select
                    value={shopRouteId}
                    onChange={e => setShopRouteId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800"
                  >
                    <option value="">No Route Beat</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">{tDir.formShopSr}</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto mapped"
                    value={shopAssignedSR}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 font-semibold text-slate-500 outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Credit Limit (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={shopCreditLimit}
                    onChange={e => setShopCreditLimit(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Credit Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={shopCreditDays}
                    onChange={e => setShopCreditDays(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowShopModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Company Setup */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCompanySubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Briefcase className="w-4.5 h-4.5 text-slate-750" />
                {editingCompany ? 'Edit Supplier Company' : tDir.registerCompany}
              </span>
              <button type="button" onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Akij Food & Beverage Ltd"
                  value={compName}
                  onChange={e => setCompName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyContact}</label>
                <input
                  type="text"
                  placeholder="e.g. Manager Sales Ops"
                  value={compContact}
                  onChange={e => setCompContact(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyPhone}</label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX"
                  value={compPhone}
                  onChange={e => setCompPhone(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyAddress}</label>
                <input
                  type="text"
                  placeholder="e.g. Akij House, 198 Bir Uttam Mir Shawkat Sarak, Dhaka"
                  value={compAddress}
                  onChange={e => setCompAddress(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowCompanyModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingCompany ? `${tCommon.edit} Company` : 'Register Company'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Category Setup */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCategorySubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-slate-750" />
                {editingCategory ? 'Edit Product Category' : tDir.registerCategory}
              </span>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCategoryName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Carbonated Soft Drinks"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCategoryDesc}</label>
                <input
                  type="text"
                  placeholder="e.g. Cola, Lemon, Orange carbonated beverages"
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingCategory ? `${tCommon.edit} Category` : 'Create Category'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Unit Setup */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUnitSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <DollarSign className="w-4.5 h-4.5 text-slate-750" />
                {editingUnit ? 'Edit Unit of Measure' : tDir.registerUnit}
              </span>
              <button type="button" onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formUnitName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Case of 24"
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formUnitMultiplier}</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 24"
                  value={unitMultiplier}
                  onChange={e => setUnitMultiplier(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingUnit ? `${tCommon.edit} Unit` : 'Create Unit'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Godown Setup */}
      {showGodownModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleGodownSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <HardDrive className="w-4.5 h-4.5 text-slate-750" />
                {editingGodown ? 'Edit Godown Warehouse' : tDir.registerGodown}
              </span>
              <button type="button" onClick={() => setShowGodownModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formGodownName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tongi Sub-godown"
                  value={godownName}
                  onChange={e => setGodownName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formGodownLocation}</label>
                <input
                  type="text"
                  placeholder="e.g. Station Road, Tongi, Gazipur"
                  value={godownLocation}
                  onChange={e => setGodownLocation(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="damage-check"
                  checked={godownIsDamage}
                  onChange={e => setGodownIsDamage(e.target.checked)}
                  className="w-4.5 h-4.5 accent-slate-900 border-slate-200 rounded cursor-pointer"
                />
                <label htmlFor="damage-check" className="text-xs font-semibold text-slate-705 cursor-pointer">
                  {tDir.formGodownIsDamage}
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowGodownModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingGodown ? `${tCommon.edit} Godown` : 'Create Godown'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Route Setup */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRouteSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Compass className="w-4.5 h-4.5 text-slate-750" />
                {editingRoute ? 'Edit Sales Beat Route' : tDir.registerRoute}
              </span>
              <button type="button" onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-855">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formRouteName}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi-15 Road Beat"
                  value={routeName}
                  onChange={e => setRouteName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formRouteArea}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhanmondi"
                    value={routeArea}
                    onChange={e => setRouteArea(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formRouteTerritory}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka South"
                    value={routeTerritory}
                    onChange={e => setRouteTerritory(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">Route SR Assignment *</label>
                <select
                  value={routeAssignedSR}
                  onChange={e => setRouteAssignedSR(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800"
                >
                  <option value="">Unassigned SR</option>
                  {srs.map(sr => (
                    <option key={sr.id} value={sr.id}>{sr.name} ({sr.phone})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowRouteModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingRoute ? `${tCommon.edit} Route` : 'Create Route'}</button>
            </div>
          </form>
        </div>
      )}
      {/* MODAL: Damage Adjust */}
      {showDamageModal && selectedDamageProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDamageSubmit} className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-805 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                {language === 'bn' ? 'ড্যামেজ স্টক সমন্বয়' : 'Reconcile Damage Stock'}
              </span>
              <button type="button" onClick={() => setShowDamageModal(false)} className="text-slate-400 hover:text-slate-805">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">{language === 'bn' ? 'পণ্য' : 'Product'}</span>
                <span className="font-semibold text-slate-800 text-xs block">{selectedDamageProduct.name}</span>
                <span className="font-mono text-[10px] text-slate-500 block uppercase">SKU: {selectedDamageProduct.sku}</span>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'ড্যামেজ স্টক পরিমাণ *' : 'Damaged Stock Qty *'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={damageQtyInput}
                  onChange={e => setDamageQtyInput(Number(e.target.value))}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Deduct checkbox */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="deduct-salable-check"
                  checked={deductFromSalable}
                  onChange={e => setDeductFromSalable(e.target.checked)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="deduct-salable-check" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  {language === 'bn' ? 'বিক্রয়যোগ্য স্টক থেকে কর্তন করুন' : 'Deduct difference from salable stock'}
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowDamageModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">
                {language === 'bn' ? 'সমন্বয় সম্পন্ন করুন' : 'Confirm Adjust'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
