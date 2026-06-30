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
  DollarSign
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
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
          g.isDamageGodown 
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
      
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-800" />
            {pageTitle || tDir.title}
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">{pageSubtitle || tDir.subtitle}</p>
        </div>

        {/* Tab Selectors — filtered by visibleTabs if provided */}
        <div className="flex flex-wrap bg-slate-105 p-1 rounded-lg border border-slate-200 shadow-sm gap-1 shrink-0">
          {[
            { id: 'products', label: tDir.tabProducts, icon: Package },
            { id: 'srs', label: tDir.tabSrs, icon: UserCheck },
            { id: 'shops', label: tDir.tabShops, icon: Building },
            { id: 'companies', label: tDir.tabCompanies, icon: Briefcase },
            { id: 'categories', label: tDir.tabCategories, icon: Sliders },
            { id: 'units', label: tDir.tabUnits, icon: DollarSign },
            { id: 'godowns', label: tDir.tabGodowns, icon: HardDrive },
            { id: 'routes', label: tDir.tabRoutes, icon: Compass }
          ]
          .filter(tab => !visibleTabs || visibleTabs.includes(tab.id as DirectoryTab))
          .map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as DirectoryTab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-550 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB: Products Catalog */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{products.length} {tDir.tabProducts}</span>
            <button
              type="button"
              onClick={handleOpenProduct}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerProduct}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formProductName.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formProductSku.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formProductCompany.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-right">Import PP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-right">Supply WSP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-right">Retail MRP</th>
                    <th className="px-4 py-4 text-sm font-semibold text-center">{tDir.formProductStock.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p, index) => (
                    <ProductRow
                      key={p.id}
                      p={p}
                      index={index}
                      companies={companies}
                      categories={productCategories}
                      units={units}
                      godowns={godowns}
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

      {/* SUB-TAB: Sales Representatives (SRs) */}
      {activeSubTab === 'srs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{srs.length} {tDir.tabSrs}</span>
            <button
              type="button"
              onClick={() => {
                setEditingSr(null);
                setSrName('');
                setSrPhone('');
                setShowSrModal(true);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerSr}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">{tDir.formSrName.replace(' *', '')}</th>
                  <th className="px-4 py-4 text-sm font-semibold">{tDir.formSrPhone.replace(' *', '')}</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {srs.map((sr, index) => (
                  <SrRow key={sr.id} sr={sr} index={index} onEdit={s => {
                    setEditingSr(s);
                    setSrName(s.name);
                    setSrPhone(s.phone);
                    setShowSrModal(true);
                  }} onDelete={handleDeleteSr} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: Customer Shops */}
      {activeSubTab === 'shops' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{customers.length} {tDir.tabShops}</span>
            <button
              type="button"
              onClick={handleOpenShop}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerShop}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                    <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formShopName.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.colRoute}</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formShopPhone.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold">{tDir.formShopSr.replace(' *', '')}</th>
                    <th className="px-4 py-4 text-sm font-semibold">Credit Policies</th>
                    <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c, index) => (
                    <ShopRow
                      key={c.id}
                      c={c}
                      index={index}
                      routes={routes}
                      onEdit={startEditShop}
                      onDelete={handleDeleteShop}
                      formatBDT={formatBDT}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: Companies & Brands */}
      {activeSubTab === 'companies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{companies.length} Registered Companies</span>
            <button
              type="button"
              onClick={handleOpenCompany}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerCompany}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">Company Name</th>
                  <th className="px-4 py-4 text-sm font-semibold">Contact Details</th>
                  <th className="px-4 py-4 text-sm font-semibold">HQ Address</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((comp, index) => (
                  <CompanyRow
                    key={comp.id}
                    comp={comp}
                    index={index}
                    onEdit={startEditCompany}
                    onDelete={handleDeleteCompany}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: Categories */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{productCategories.length} Categories</span>
            <button
              type="button"
              onClick={handleOpenCategory}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerCategory}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">Category Name</th>
                  <th className="px-4 py-4 text-sm font-semibold">Description</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productCategories.map((cat, index) => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    index={index}
                    onEdit={startEditCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: Units (UOM) */}
      {activeSubTab === 'units' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{units.length} Standard Pack Units</span>
            <button
              type="button"
              onClick={handleOpenUnit}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerUnit}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">Unit Label</th>
                  <th className="px-4 py-4 text-sm font-semibold">Pcs Equivalence</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((uom, index) => (
                  <UnitRow
                    key={uom.id}
                    uom={uom}
                    index={index}
                    onEdit={startEditUnit}
                    onDelete={handleDeleteUnit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB: Warehouses / Godowns */}
      {activeSubTab === 'godowns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{godowns.length} Storage Depots</span>
            <button
              type="button"
              onClick={handleOpenGodown}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {tDir.registerGodown}
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <th className="px-4 py-4 text-sm font-semibold w-12 text-center">#</th>
                  <th className="px-4 py-4 text-sm font-semibold">Godown Label Name</th>
                  <th className="px-4 py-4 text-sm font-semibold">Location</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center">Classification</th>
                  <th className="px-4 py-4 text-sm font-semibold text-center w-24">{tCommon.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {godowns.map((g, index) => (
                  <GodownRow
                    key={g.id}
                    g={g}
                    index={index}
                    onEdit={startEditGodown}
                    onDelete={handleDeleteGodown}
                  />
                ))}
              </tbody>
            </table>
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
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">{tDir.formProductCategory.replace(' *','')}</label>
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
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">{tDir.formProductUnit.replace(' *','')}</label>
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

    </div>
  );
}
