'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Pagination from './ui/Pagination';
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
  AlertTriangle,
  Search,
  Calendar,
  Truck,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Product,
  SR,
  CompanyBrand,
  Category,
  UnitOfMeasure,
  Godown,
  Route,
  DeliveryMan,
  Procurement,
  ChallanItem,
  StockAdjustment
} from '../types';
import { translations as dict, Language } from '../translations';
import { getLocalDateString } from './dashboard/dashboardUtils';
import { getStockValueDP, getStockValueTP, formatProductStock } from '../lib/productUtils';
import PersonnelManagement from './PersonnelManagement';
import { useToast } from './ui/Toast';

interface DirectoryModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  srs: SR[];
  setSrs: React.Dispatch<React.SetStateAction<SR[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
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
  deliveryMen: DeliveryMan[];
  setDeliveryMen: React.Dispatch<React.SetStateAction<DeliveryMan[]>>;
  language: Language;
  userRole?: 'admin' | 'sr';
  /** Which sub-tab to open by default when rendered */
  defaultTab?: DirectoryTab;
  onTabChange?: (tab: DirectoryTab) => void;
  /** Filter visible tabs — only show these. If undefined, show all. */
  visibleTabs?: DirectoryTab[];
  /** Override page title (used when accessed via dedicated sidebar menus) */
  pageTitle?: string;
  /** Override page subtitle */
  pageSubtitle?: string;
  procurements?: Procurement[];
  challans?: ChallanItem[];
  adjustments?: StockAdjustment[];
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
  | 'routes'
  | 'deliveryMen'
  | 'stockAlerts';

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
  const primaryUnit = p.customUnits && p.customUnits.length > 0 ? p.customUnits[0] : null;
  const uomName = primaryUnit ? `${primaryUnit.name} (${primaryUnit.multiplier})` : 'Pcs';
  const godownName = godowns.find(g => g.id === p.defaultGodownId)?.name || 'Main Godown';

  const isPriceInvalid = p.defaultPP >= p.defaultWSP;

  return (
    <tr className={`hover:bg-slate-50/50 transition-all duration-200 text-xs ${isPriceInvalid ? 'bg-rose-50/30' : ''}`}>
      <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">{index + 1}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-slate-800">{p.name}</div>
          {isPriceInvalid && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-rose-50 text-rose-600 border border-rose-100 text-[8px] font-bold animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
              {"Price Rule Violation: DP >= TP"}
            </span>
          )}
        </div>
        {(categoryName !== 'N/A' || uomName !== 'N/A') && (
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            {categoryName !== 'N/A' && `Cat: ${categoryName}`}
            {categoryName !== 'N/A' && uomName !== 'N/A' && ' | '}
            {uomName !== 'N/A' && `UOM: ${uomName}`}
          </div>
        )}
      </td>
      <td className="px-4 py-3.5 text-slate-550 font-mono font-medium">{p.sku}</td>
      <td className="px-4 py-3.5">
        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-none text-[10px] font-semibold">
          {p.company}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-600">{formatBDT(p.defaultPP)}</td>
      <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">{formatBDT(p.defaultWSP)}</td>
      <td className="px-4 py-3.5 text-right font-mono text-slate-650">{formatBDT(p.defaultMRP)}</td>
      <td className="px-4 py-3.5 text-center">
        <div className="font-mono font-bold text-slate-800">
          {(() => {
            const cs = p.cartonSize || 24;
            const isCtn = p.primaryUnit === 'Carton';
            const ctn = isCtn ? Math.floor(p.currentStock) : Math.floor(p.currentStock / cs);
            const pcs = isCtn ? Math.round((p.currentStock - ctn) * cs) : (p.currentStock % cs);
            return `${ctn} Ctn + ${pcs} Pcs`;
          })()}
        </div>
        <div className="text-[10px] text-slate-400 font-mono">({p.currentStock.toLocaleString()} {p.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}) | DP: ৳{getStockValueDP(p).toLocaleString('en-BD')}</div>
      </td>
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
            title="Edit product"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
  c: any;
  index: number;
  routes: Route[];
  onEdit: (c: any) => void;
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
        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-none text-[10px] font-semibold">
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
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
      <td className="px-4 py-3.5 font-mono text-slate-650">{uom.symbol || '—'}</td>
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-505 hover:text-rose-900 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
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
        <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-semibold border ${g.isDamageGodown
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
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-600 hover:text-rose-750 bg-rose-50/50 hover:bg-rose-50 border border-rose-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
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
      <td className="px-4 py-3.5 font-semibold text-slate-850">{r.name}</td>
      <td className="px-4 py-3.5">{r.area}</td>
      <td className="px-4 py-3.5 text-slate-500">{r.territory}</td>
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1.5 text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/70 rounded-none transition-all active:scale-90 cursor-pointer shadow-2xs inline-flex items-center justify-center"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-rose-505 hover:text-rose-900 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
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
  deliveryMen,
  setDeliveryMen,
  language,
  userRole = 'admin',
  defaultTab,
  onTabChange,
  visibleTabs,
  pageTitle,
  pageSubtitle,
  procurements = [],
  challans = [],
  adjustments = []
}: DirectoryModuleProps) {
  const { success, error, warning } = useToast();
  const tCommon = dict[language].common;
  const tDir = dict[language].directory;

  const [activeSubTab, setActiveSubTab] = useState<DirectoryTab>(defaultTab || 'products');

  useEffect(() => {
    if (defaultTab) {
      setActiveSubTab(defaultTab);
    }
  }, [defaultTab]);

  const handleTabSelect = (tab: DirectoryTab) => {
    setActiveSubTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const ViewToggle = () => (
    <div className="flex items-center bg-slate-100 p-1 rounded-none border border-slate-200">
      <button
        type="button"
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-none flex items-center justify-center transition-all ${viewMode === 'grid'
          ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
          : 'text-slate-400 hover:text-slate-600'
          }`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-none flex items-center justify-center transition-all ${viewMode === 'list'
          ? 'bg-white shadow-sm text-indigo-600 border border-slate-200'
          : 'text-slate-400 hover:text-slate-600'
          }`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
  const [productSearch, setProductSearch] = useState('');
  const [productCompanyFilter, setProductCompanyFilter] = useState('All');
  const [productSrFilter, setProductSrFilter] = useState('All');
  const [productCategoryFilter, setProductCategoryFilter] = useState('All');
  const [productStockFilter, setProductStockFilter] = useState('All'); // 'All' | 'Low'
  const [productStartDate, setProductStartDate] = useState('');
  const [productEndDate, setProductEndDate] = useState('');
  const [stockHistoryDate, setStockHistoryDate] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [unitSearch, setUnitSearch] = useState('');
  const [compSearch, setCompSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(10);

  React.useEffect(() => {
    setProductPage(1);
  }, [productSearch, productCompanyFilter, productCategoryFilter, productStockFilter, productStartDate, productEndDate, stockHistoryDate]);

  // Damage states
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [selectedDamageProduct, setSelectedDamageProduct] = useState<Product | null>(null);
  const [damageQtyInput, setDamageQtyInput] = useState<number>(0);
  const [damageNoteInput, setDamageNoteInput] = useState('');
  const [damageMode, setDamageMode] = useState<'add' | 'set'>('add');
  const [deductFromSalable, setDeductFromSalable] = useState(false);
  const [selectedDamageCompany, setSelectedDamageCompany] = useState<string>('All');
  const [selectedDamageType, setSelectedDamageType] = useState('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState('pending');
  const [isNewDamageLog, setIsNewDamageLog] = useState(false);
  const [damageActiveSubTab, setDamageActiveSubTab] = useState<'inventory' | 'logs' | 'reasons'>('inventory');
  const [newReasonInput, setNewReasonInput] = useState('');

  // Dynamic Damage Reasons
  const [damageReasons, setDamageReasons] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dms_damage_reasons');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const saveDamageReasons = (nextReasons: { id: string; name: string }[]) => {
    setDamageReasons(nextReasons);
    localStorage.setItem('dms_damage_reasons', JSON.stringify(nextReasons));
  };

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
  const [inlineEditingProductId, setInlineEditingProductId] = useState<string | null>(null);
  const [inlineEditForm, setInlineEditForm] = useState<Partial<Product>>({});
  const [editingSr, setEditingSr] = useState<SR | null>(null);
  const [editingShop, setEditingShop] = useState<any | null>(null);
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
  const [prodCustomUnits, setProdCustomUnits] = useState<{name: string, multiplier: number}[]>([]);
  const [prodGodownId, setProdGodownId] = useState('');
  const [prodPP, setProdPP] = useState<number>(0);
  const [prodWSP, setProdWSP] = useState<number>(0);
  const [prodMRP, setProdMRP] = useState<number>(0);
  const [prodStock, setProdStock] = useState<number>(0);
  const [prodCartonSize, setProdCartonSize] = useState<number>(24);
  const [prodPricePerCarton, setProdPricePerCarton] = useState<number>(0);
  const [prodPricePerPiece, setProdPricePerPiece] = useState<number>(0);
  const [prodPrimaryUnit, setProdPrimaryUnit] = useState<'Piece' | 'Carton'>('Piece');
  const [prodCreatedAt, setProdCreatedAt] = useState('');
  const [prodAlertThreshold, setProdAlertThreshold] = useState<number>(50);
  const [stockAlertFilter, setStockAlertFilter] = useState<'all' | 'out' | 'critical' | 'low'>('all');

  // Form Fields: SR
  const [srName, setSrName] = useState('');
  const [srPhone, setSrPhone] = useState('');
  const [srCommissionRate, setSrCommissionRate] = useState<number>(0);
  const [srAssignedCompanies, setSrAssignedCompanies] = useState<string[]>([]);
  const [srLoginUsername, setSrLoginUsername] = useState('');
  const [srLoginPassword, setSrLoginPassword] = useState('');
  const [srCompanyFilter, setSrCompanyFilter] = useState('All');

  // Form Fields & States: Delivery Man
  const [showDmModal, setShowDmModal] = useState(false);
  const [editingDm, setEditingDm] = useState<DeliveryMan | null>(null);
  const [dmName, setDmName] = useState('');
  const [dmVehicle, setDmVehicle] = useState('');
  const [dmPhone, setDmPhone] = useState('');
  const [dmAssignedCompanies, setDmAssignedCompanies] = useState<string[]>([]);
  const [dmCompanyFilter, setDmCompanyFilter] = useState('All');
  const [dmSearch, setDmSearch] = useState('');
  const [routeSearch, setRouteSearch] = useState('');

  // Accordion collapse states for SR and DM company cards
  const [collapsedSrCompanies, setCollapsedSrCompanies] = useState<Record<string, boolean>>({});
  const [collapsedDmCompanies, setCollapsedDmCompanies] = useState<Record<string, boolean>>({});

  const toggleSrCompanyAccordion = useCallback((companyName: string) => {
    setCollapsedSrCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
  }, []);

  const toggleDmCompanyAccordion = useCallback((companyName: string) => {
    setCollapsedDmCompanies(prev => ({ ...prev, [companyName]: !prev[companyName] }));
  }, []);

  // Damage Tab Filter States
  const [damageSearch, setDamageSearch] = useState('');
  const [damageCategoryFilter, setDamageCategoryFilter] = useState('All');
  const [damageStockFilter, setDamageStockFilter] = useState('All'); // 'All' | 'HasDamage' | 'NoDamage'
  const [damageStartDate, setDamageStartDate] = useState('');
  const [damageEndDate, setDamageEndDate] = useState('');

  // Form Fields: Shop
  const [shopName, setShopName] = useState('');
  const [shopMarket, setShopMarket] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [shopAssignedSR, setShopAssignedSR] = useState('');
  const [shopRouteId, setShopRouteId] = useState('');
  const [shopCreditLimit, setShopCreditLimit] = useState<number>(0);
  const [shopCreditDays, setShopCreditDays] = useState<number>(0);
  const [shopDue, setShopDue] = useState<number>(0);

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

  // Form Fields: Unit (name + symbol only)
  const [unitName, setUnitName] = useState('');
  const [unitSymbol, setUnitSymbol] = useState('');

  // Form Fields: Godown
  const [godownName, setGodownName] = useState('');
  const [godownLocation, setGodownLocation] = useState('');
  const [godownIsDamage, setGodownIsDamage] = useState(false);

  // Form Fields: Route
  const [routeName, setRouteName] = useState('');
  const [routeArea, setRouteArea] = useState('');
  const [routeTerritory, setRouteTerritory] = useState('');
  const [routeAssignedSR, setRouteAssignedSR] = useState('');

  const matchesDateRange = useCallback((dateValue: string | undefined, startDate: string, endDate: string) => {
    if (!startDate && !endDate) return true;
    if (!dateValue) return false;

    const normalizedDate = getLocalDateString(new Date(dateValue));
    const matchesStart = startDate ? normalizedDate >= startDate : true;
    const matchesEnd = endDate ? normalizedDate <= endDate : true;
    return matchesStart && matchesEnd;
  }, []);

  const formatBDT = useCallback((amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  }, []);

  const formatStock = useCallback((stock: number, size: number, primaryUnit?: string) => {
    const s = (size && size > 1) ? size : 24;
    let cartons = 0;
    let pieces = 0;

    if (primaryUnit === 'Carton') {
      cartons = Math.floor(stock);
      pieces = Math.round((stock - cartons) * s);
    } else {
      cartons = Math.floor(stock / s);
      pieces = Math.round(stock % s);
    }

    if (language === 'bn') {
      return `${cartons} কার্টন + ${pieces} পিস`;
    }

    return `${cartons} Ctn + ${pieces} Pcs`;
  }, [language]);

  const getTotalPieces = useCallback((stock: number, size: number, primaryUnit?: string) => {
    const s = (size && size > 1) ? size : 24;
    return primaryUnit === 'Carton' ? Math.round(stock * s) : stock;
  }, []);

  const getCompanyBadgeStyle = useCallback((companyName: string) => {
    if (!companyName || companyName === 'N/A') return 'bg-slate-100 text-slate-500 border-slate-200';
    const colors = [
      'bg-blue-50 text-blue-700 border-blue-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    ];
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
      hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }, []);

  const getPerPiecePrice = useCallback((totalPrice: number, mult: number) => {
    if (!mult || mult <= 1) return '';
    const perPiece = totalPrice / mult;
    return `৳${perPiece % 1 === 0 ? perPiece.toLocaleString('en-BD') : perPiece.toFixed(2)}`;
  }, []);

  // --- INLINE EDIT: Product ---
  const startInlineEditProduct = useCallback((p: Product) => {
    setInlineEditingProductId(p.id);
    setInlineEditForm({ ...p });
  }, []);

  const saveInlineEditProduct = useCallback(() => {
    if (inlineEditingProductId && inlineEditForm.name && inlineEditForm.sku && inlineEditForm.company) {
      const dp = Number(inlineEditForm.defaultPP || 0);
      const tp = Number(inlineEditForm.defaultWSP || 0);
      if (dp >= tp) {
        error(
          language === 'bn' ? 'মূল্য ত্রুটি' : 'Pricing Error',
          language === 'bn'
            ? 'DP মূল্য অবশ্যই TP (WSP) মূল্য থেকে কম হতে হবে!'
            : 'DP Price (Purchase Price) must be LOWER than TP Price (WSP).'
        );
      }
      setProducts(prev => prev.map(p =>
        p.id === inlineEditingProductId ? { ...p, ...inlineEditForm } as Product : p
      ));
      setInlineEditingProductId(null);
      setInlineEditForm({});
    } else {
      error('Incomplete Form', 'Please fill out Product Name, SKU, and Company.');
    }
  }, [inlineEditingProductId, inlineEditForm, setProducts, language]);

  const cancelInlineEditProduct = useCallback(() => {
    setInlineEditingProductId(null);
    setInlineEditForm({});
  }, []);

  // --- SUBMIT: Product ---
  const handleProductSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku || !prodCompany) {
      error('Incomplete Form', 'Please fill out Product Name, SKU, and Company.');
      return;
    }

    const isCtn = prodPrimaryUnit === 'Carton';
    const cs = Math.max(1, Number(prodCartonSize) || 24);

    const dp = Number(prodPP);
    const tp = isCtn ? Number(prodPricePerCarton) : Number(prodPricePerPiece);

    if (dp >= tp) {
      error(
        language === 'bn' ? 'মূল্য ত্রুটি' : 'Pricing Error',
        language === 'bn'
          ? 'DP মূল্য অবশ্যই TP (WSP) মূল্য থেকে কম হতে হবে!'
          : 'DP Price (Purchase Price) must be LOWER than TP Price (WSP).'
      );
    }

    let ctnPrice = 0;
    let piecePrice = 0;

    if (isCtn) {
      ctnPrice = tp;
      piecePrice = Number((ctnPrice / cs).toFixed(2));
    } else {
      piecePrice = tp;
      ctnPrice = Number((piecePrice * cs).toFixed(2));
    }

    const payload = {
      name: prodName,
      sku: prodSku,
      company: prodCompany,
      createdAt: (() => {
        const now = new Date();
        const [year, month, day] = (prodCreatedAt || now.toISOString().split('T')[0]).split('-');
        return new Date(
          Number(year),
          Number(month) - 1,
          Number(day),
          now.getHours(),
          now.getMinutes(),
          now.getSeconds(),
          now.getMilliseconds()
        ).toISOString();
      })(),
      categoryId: prodCategoryId || undefined,
      customUnits: [{ name: 'Carton', multiplier: cs }],
      defaultGodownId: prodGodownId || undefined,
      defaultPP: dp,
      defaultWSP: tp,
      defaultMRP: Number(prodMRP),
      currentStock: Number(prodStock),
      cartonSize: cs,
      pricePerCarton: ctnPrice,
      pricePerPiece: piecePrice,
      primaryUnit: prodPrimaryUnit,
      stockAlertThreshold: Number(prodAlertThreshold) || 50
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p));
      setEditingProduct(null);
    } else {
      setProducts(prev => [...prev, { id: `prod-${Date.now()}`, ...payload }]);
    }

    setShowProductModal(false);
  }, [prodName, prodSku, prodCompany, prodCategoryId, prodCartonSize, prodPricePerCarton, prodPricePerPiece, prodGodownId, prodPP, prodMRP, prodStock, prodPrimaryUnit, prodCreatedAt, prodAlertThreshold, editingProduct, setProducts, language]);

  // --- SUBMIT: SR ---
  const handleSrSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!srName || !srPhone) {
      error('Incomplete Form', 'Representative Name and Phone Contact are required.');
      return;
    }

    const isDuplicate = srs.some(s => s.phone === srPhone && (!editingSr || s.id !== editingSr.id));
    if (isDuplicate) {
      error(language === 'bn' ? 'ডুপ্লিকেট' : 'Duplicate', language === 'bn' ? 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একজন এসআর নিবন্ধিত আছে।' : 'An SR with this phone number is already registered.');
      return;
    }

    const primaryCompanyId = srAssignedCompanies[0] || undefined;
    const primaryCompany = companies.find(c => c.id === primaryCompanyId || c.name === primaryCompanyId);

    if (editingSr) {
      setSrs(prev => prev.map(s => s.id === editingSr.id ? {
        ...s,
        name: srName,
        phone: srPhone,
        commissionRate: srCommissionRate,
        assignedCompanyIds: srAssignedCompanies,
        companyId: primaryCompanyId,
        companyName: primaryCompany?.name || primaryCompanyId,
        isActive: s.isActive ?? true,
        loginUsername: srLoginUsername,
        loginPassword: srLoginPassword
      } : s));
      setEditingSr(null);
    } else {
      setSrs(prev => [...prev, {
        id: `sr-${Date.now()}`,
        name: srName,
        phone: srPhone,
        commissionRate: srCommissionRate,
        assignedCompanyIds: srAssignedCompanies,
        companyId: primaryCompanyId,
        companyName: primaryCompany?.name || primaryCompanyId,
        isActive: true,
        loginUsername: srLoginUsername,
        loginPassword: srLoginPassword
      }]);
    }
    setShowSrModal(false);
  }, [srName, srPhone, srCommissionRate, srAssignedCompanies, srLoginUsername, srLoginPassword, editingSr, srs, setSrs, companies, language]);

  // --- SUBMIT: Delivery Man ---
  const handleDmSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!dmName || !dmVehicle) {
      error('Incomplete Form', 'Delivery Man Name and Vehicle details are required.');
      return;
    }

    const isDuplicate = deliveryMen.some(d => d.phone === dmPhone && (!editingDm || d.id !== editingDm.id));
    if (isDuplicate) {
      error(language === 'bn' ? 'ডুপ্লিকেট' : 'Duplicate', language === 'bn' ? 'এই ফোন নম্বর দিয়ে ইতিমধ্যে একজন ডেলিভারি ম্যান নিবন্ধিত আছে।' : 'A delivery driver with this phone number is already registered.');
      return;
    }

    if (editingDm) {
      setDeliveryMen(prev => prev.map(d => d.id === editingDm.id ? { ...d, name: dmName, vehicle: dmVehicle, phone: dmPhone, assignedCompanyIds: dmAssignedCompanies } : d));
      setEditingDm(null);
    } else {
      setDeliveryMen(prev => [...prev, { id: `dm-${Date.now()}`, name: dmName, vehicle: dmVehicle, phone: dmPhone, assignedCompanyIds: dmAssignedCompanies }]);
    }
    setShowDmModal(false);
  }, [dmName, dmVehicle, dmPhone, dmAssignedCompanies, editingDm, deliveryMen, setDeliveryMen, language]);

  // --- SUBMIT: Shop ---
  const handleShopSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName) {
      error('Required', 'Shop Name is required.');
      return;
    }

    const payload = {
      name: shopName,
      market: shopMarket || 'General Market',
      phone: shopPhone || 'N/A',
      email: shopEmail || '',
      assignedSR: shopAssignedSR || 'Unassigned',
      routeId: shopRouteId || undefined,
      creditLimit: Number(shopCreditLimit),
      creditDays: Number(shopCreditDays),
      due: Number(shopDue)
    };

    if (editingShop) {
      setCustomers(prev => prev.map(c => c.id === editingShop.id ? { ...c, ...payload } : c));
      setEditingShop(null);
    } else {
      setCustomers(prev => [...prev, { id: `cust-${Date.now()}`, ...payload }]);
    }
    setShowShopModal(false);
  }, [shopName, shopMarket, shopPhone, shopEmail, shopAssignedSR, shopRouteId, shopCreditLimit, shopCreditDays, shopDue, editingShop, setCustomers]);

  // --- SUBMIT & EDIT: Damage ---
  const handleOpenDamageModal = useCallback((product: Product) => {
    setSelectedDamageProduct(product);
    setDamageQtyInput(0);
    setDamageNoteInput('');
    setDamageMode('add');
    setDeductFromSalable(false);
    setShowDamageModal(true);
  }, []);

  const handleDamageSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDamageProduct) return;
    if (!selectedDamageProduct.id) {
      error(language === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select a Product', language === 'bn' ? 'দয়া করে একটি পণ্য নির্বাচন করুন।' : 'Please select a product.');
      return;
    }

    const size = selectedDamageProduct.cartonSize || 24;
    const isCtn = selectedDamageProduct.primaryUnit === 'Carton';

    const currentDamageQty = selectedDamageProduct.damagedStock || 0;
    const requestedQty = Math.max(0, Number(damageQtyInput));

    // Convert requested qty (always in pieces) to storage unit (cartons or pieces)
    const requestedInStorage = isCtn ? (requestedQty / size) : requestedQty;
    const deltaQty = damageMode === 'add' ? requestedInStorage : requestedInStorage - currentDamageQty;
    const nextDamageQty = Math.max(0, currentDamageQty + deltaQty);

    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === selectedDamageProduct.id) {
        let salableStock = p.currentStock;
        if (deductFromSalable) {
          salableStock = Math.max(0, salableStock - deltaQty);
        }

        const history = p.damageHistory || [];
        return {
          ...p,
          damagedStock: Number(nextDamageQty.toFixed(4)),
          currentStock: Number(salableStock.toFixed(4)),
          damageHistory: [
            ...history,
            {
              id: `damage-${Date.now()}`,
              qty: isCtn ? Math.abs(requestedQty) : Math.abs(deltaQty),
              deltaQty: isCtn ? deltaQty * size : deltaQty,
              recordedAt: new Date().toISOString(),
              note: damageNoteInput.trim() || undefined,
              type: 'new',
              damageType: selectedDamageType,
              claimStatus: selectedClaimStatus
            }
          ]
        };
      }
      return p;
    }));

    setShowDamageModal(false);
    setSelectedDamageProduct(null);
    setDamageQtyInput(0);
    setDamageNoteInput('');
    setDamageMode('add');
    setSelectedDamageType(damageReasons[0]?.name || '');
    setSelectedClaimStatus('pending');
    setIsNewDamageLog(false);
  }, [selectedDamageProduct, damageQtyInput, damageNoteInput, damageMode, deductFromSalable, setProducts, language, selectedDamageType, selectedClaimStatus, damageReasons]);

  const handleUpdateClaimStatus = useCallback((productId: string, logId: string, nextStatus: string) => {
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        const isCtn = p.primaryUnit === 'Carton';
        const size = p.cartonSize || 24;
        let damagedStock = p.damagedStock || 0;

        const newHistory = (p.damageHistory || []).map(log => {
          if (log.id === logId) {
            const oldStatus = log.claimStatus || 'pending';
            const logQtyPcs = Math.abs(Number(log.qty) || 0);
            const logQtyStorage = isCtn ? (logQtyPcs / size) : logQtyPcs;

            const hadStockReserved = oldStatus === 'pending';
            const willHaveStockReserved = nextStatus === 'pending';

            if (hadStockReserved && !willHaveStockReserved) {
              damagedStock = Math.max(0, damagedStock - logQtyStorage);
            } else if (!hadStockReserved && willHaveStockReserved) {
              damagedStock = damagedStock + logQtyStorage;
            }

            return { ...log, claimStatus: nextStatus };
          }
          return log;
        });

        return {
          ...p,
          damagedStock: Number(damagedStock.toFixed(4)),
          damageHistory: newHistory
        };
      }
      return p;
    }));
  }, [setProducts]);

  const handleDeleteDamageLog = useCallback((productId: string, logId: string) => {
    if (!confirm(language === 'bn'
      ? 'এই ড্যামেজ লগটি মুছে ফেলবেন? স্টক অটো অ্যাডজাস্ট হবে।'
      : 'Delete this damage log? Stock will auto-adjust.'
    )) return;

    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        const isCtn = p.primaryUnit === 'Carton';
        const size = p.cartonSize || 24;
        let damagedStock = p.damagedStock || 0;

        const history = p.damageHistory || [];
        const log = history.find(l => l.id === logId);
        if (log) {
          const status = log.claimStatus || 'pending';
          const logQtyPcs = Math.abs(Number(log.qty) || 0);
          const logQtyStorage = isCtn ? (logQtyPcs / size) : logQtyPcs;
          if (status === 'pending') {
            damagedStock = Math.max(0, damagedStock - logQtyStorage);
          }
        }

        return {
          ...p,
          damagedStock: Number(damagedStock.toFixed(4)),
          damageHistory: history.filter(l => l.id !== logId)
        };
      }
      return p;
    }));
  }, [setProducts, language]);

  const handleSettleDamage = useCallback((productId: string) => {
    if (!confirm(language === 'bn'
      ? 'কোম্পানি থেকে ক্লেম সেটল হয়েছে? সম্পূর্ণ ড্যামেজ স্টক শূন্য হবে।'
      : 'Claim settled with company? This will ZERO all damaged stock for this product.'
    )) return;
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        return { ...p, damagedStock: 0 };
      }
      return p;
    }));
  }, [setProducts, language]);

  const handleMoveDamageToSalable = useCallback((productId: string) => {
    if (!confirm(language === 'bn'
      ? 'সব ড্যামেজ পণ্য ভাল/বিক্রয়যোগ্য স্টকে ফেরত যাবে।'
      : 'Move ALL damaged quantity back to GOOD / salable stock?'
    )) return;
    setProducts(prevProducts => prevProducts.map(p => {
      if (p.id === productId) {
        const dm = p.damagedStock || 0;
        return {
          ...p,
          currentStock: Number((p.currentStock + dm).toFixed(4)),
          damagedStock: 0
        };
      }
      return p;
    }));
  }, [setProducts, language]);

  // --- SUBMIT: Company ---
  const handleCompanySubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!compName) {
      error('Required', 'Company/Brand Name is required.');
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
      error('Required', 'Category Name is required.');
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
    if (!unitName.trim()) {
      error('Required', 'Unit Name is required.');
      return;
    }

    const unitData = {
      id: editingUnit ? editingUnit.id : `uom-${Date.now()}`,
      name: unitName.trim(),
      symbol: unitSymbol.trim().toUpperCase() || unitName.trim().toUpperCase().slice(0, 3),
    };

    if (editingUnit) {
      setUnits(prev => prev.map(u => u.id === editingUnit.id ? { ...u, ...unitData } : u));
      setEditingUnit(null);
    } else {
      setUnits(prev => [...prev, unitData]);
    }
    setShowUnitModal(false);
  }, [unitName, unitSymbol, editingUnit, setUnits]);

  // --- SUBMIT: Godown ---
  const handleGodownSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!godownName) {
      error('Required', 'Warehouse/Godown Name is required.');
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
      error('Required', 'Route name, Area, and Territory are required.');
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
    setProdGodownId(godowns[0]?.id || '');
    setProdPP(0);
    setProdWSP(0);
    setProdMRP(0);
    setProdStock(0);
    setProdCartonSize(24);
    setProdPricePerCarton(0);
    setProdPricePerPiece(0);
    setProdPrimaryUnit('Piece');
    setProdAlertThreshold(50);
    setProdCreatedAt(new Date().toISOString().split('T')[0]);
    setShowProductModal(true);
  }, [companies, productCategories, godowns]);

  const handleOpenShop = useCallback(() => {
    setEditingShop(null);
    setShopName('');
    setShopMarket('');
    setShopPhone('');
    setShopEmail('');
    setShopRouteId(routes[0]?.id || '');
    setShopAssignedSR(srs[0]?.name || '');
    setShopCreditLimit(0);
    setShopCreditDays(0);
    setShopDue(0);
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
    setUnitSymbol('');
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
    const isCtn = p.primaryUnit === 'Carton';
    const cSize = p.cartonSize && p.cartonSize > 1 ? p.cartonSize : (p.customUnits && p.customUnits[0] && p.customUnits[0].multiplier > 1 ? p.customUnits[0].multiplier : 24);
    const ctnPrice = p.pricePerCarton || (isCtn ? p.defaultWSP : p.defaultWSP * cSize);
    const pcsPrice = p.pricePerPiece || (isCtn ? (ctnPrice / cSize) : p.defaultWSP);

    setEditingProduct(p);
    setProdName(p.name);
    setProdSku(p.sku);
    setProdCompany(p.company);
    setProdCategoryId(p.categoryId || '');
    setProdGodownId(p.defaultGodownId || '');
    setProdPP(p.defaultPP);
    setProdWSP(p.defaultWSP);
    setProdMRP(p.defaultMRP);
    setProdStock(p.currentStock);
    setProdCartonSize(cSize);
    setProdPricePerCarton(Number(ctnPrice.toFixed(2)));
    setProdPricePerPiece(Number(pcsPrice.toFixed(2)));
    setProdPrimaryUnit(p.primaryUnit || 'Piece');
    setProdAlertThreshold(p.stockAlertThreshold ?? 50);
    setProdCreatedAt(p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setShowProductModal(true);
  }, []);

  const startEditShop = useCallback((c: any) => {
    setEditingShop(c);
    setShopName(c.name);
    setShopMarket(c.market);
    setShopPhone(c.phone);
    setShopEmail(c.email || '');
    setShopAssignedSR(c.assignedSR);
    setShopRouteId(c.routeId || '');
    setShopCreditLimit(c.creditLimit || 0);
    setShopCreditDays(c.creditDays || 0);
    setShopDue(c.due || 0);
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
    setUnitSymbol(u.symbol || '');
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
      setRoutes(prev => prev.map(r => r.assignedSRId === id ? { ...r, assignedSRId: undefined } : r));
    }
  }, [tCommon.confirmDelete, setSrs, setRoutes]);

  const handleDeleteDm = useCallback((id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setDeliveryMen(prev => prev.filter(d => d.id !== id));
    }
  }, [tCommon.confirmDelete, setDeliveryMen]);

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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-none p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-none blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-300" />
            {pageTitle || tDir.title}
          </h2>
          <p className="text-slate-300 text-xs">{pageSubtitle || tDir.subtitle}</p>
        </div>

        {/* Tab Selectors — only render when accessed directly without dedicated sidebar sub-menus */}
        {!visibleTabs && (
          <div className="flex flex-wrap bg-white/5 p-1 rounded-none border border-white/10 shadow-sm gap-1 shrink-0 z-10 relative">
            {[
              { id: 'products', label: tDir.tabProducts, icon: Package },
              { id: 'units', label: language === 'bn' ? 'পরিমাপের একক (UOM)' : 'Units of Measure (UOM)', icon: Layers },
              { id: 'srs', label: tDir.tabSrs, icon: UserCheck },
              { id: 'shops', label: tDir.tabShops || 'Retail Customers', icon: Building },
              { id: 'damage', label: tDir.tabDamage || 'Damage List', icon: AlertTriangle },
              { id: 'companies', label: tDir.tabCompanies, icon: Briefcase },
              { id: 'godowns', label: tDir.tabGodowns, icon: HardDrive },
              { id: 'routes', label: tDir.tabRoutes, icon: Compass },
              { id: 'deliveryMen', label: language === 'bn' ? 'ডেলিভারি ম্যান' : 'Delivery Men', icon: Truck }
            ]
              .filter(tab => (!visibleTabs || visibleTabs.includes(tab.id as DirectoryTab)) && (userRole !== 'sr' || tab.id !== 'damage'))
              .map(tab => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabSelect(tab.id as DirectoryTab)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-none transition-all flex items-center gap-1.5 cursor-pointer ${isActive
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
        )}
      </div>

      {/* SUB-TAB: Products Catalog */}
      {activeSubTab === 'products' && (() => {
        const getCategoryName = (categoryId?: string) => {
          if (!categoryId) return '—';
          const cat = productCategories.find(c => c.id === categoryId);
          return cat ? cat.name : '—';
        };

        const getHistoricStockForProduct = (product: Product, targetDate: string) => {
          if (product.createdAt && product.createdAt.slice(0, 10) > targetDate) {
            return 0;
          }
          let stock = product.currentStock;

          procurements.forEach(proc => {
            const procDate = proc.deliveryDate || proc.invoiceDate || (proc.createdAt ? proc.createdAt.slice(0, 10) : null);
            if (procDate && procDate > targetDate) {
              const item = proc.items.find(i => i.productId === product.id);
              if (item) {
                stock -= (item.qty + (item.bonusQty || 0));
              }
            }
          });

          challans.forEach(challan => {
            const challanDate = challan.createdAt.slice(0, 10);
            if (challanDate && challanDate > targetDate) {
              if (challan.productName === product.name) {
                stock += (challan.totalQty - (challan.returnedQty || 0));
              }
            }
          });

          adjustments.forEach(adj => {
            if (adj.productId === product.id && adj.date && adj.date.slice(0, 10) > targetDate) {
              stock -= adj.qtyChanged;
            }
          });

          return Math.max(0, stock);
        };

        const filteredProducts = products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase());
          const matchesCompany = productCompanyFilter === 'All' || p.company === productCompanyFilter;
          const matchesCategory = productCategoryFilter === 'All' || p.categoryId === productCategoryFilter;
          const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
          const matchesStock = productStockFilter === 'All' || (productStockFilter === 'Low' && displayStock < 600);
          const matchesDate = matchesDateRange(p.createdAt, productStartDate, productEndDate);
          
          // SR Filter removed - company filter is sufficient
          const matchesSr = true;

          return matchesSearch && matchesCompany && matchesCategory && matchesStock && matchesDate && matchesSr;
        });

        const itemsPerPage = productItemsPerPage;
        const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
        const validPage = Math.max(1, Math.min(productPage, totalPages));
        const paginatedProducts = filteredProducts.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

        const totalProductsStockValuationDP = filteredProducts.reduce((sum, p) => {
          const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
          return sum + displayStock * p.defaultPP;
        }, 0);
        const totalProductsStockValuationTP = filteredProducts.reduce((sum, p) => {
          const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
          const isPiece = (p.primaryUnit ?? 'Piece') === 'Piece';
          const tp = isPiece
            ? (p.pricePerPiece || p.defaultWSP)
            : (p.pricePerCarton || p.defaultWSP);
          return sum + displayStock * tp;
        }, 0);
        const totalStockQty = filteredProducts.reduce((sum, p) => {
          const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
          return sum + displayStock;
        }, 0);
        const lowStockCount = filteredProducts.filter(p => {
          const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
          return displayStock < 600;
        }).length;

        return (
          <div className="space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Total Products */}
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/20 rounded-none border border-blue-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-500/5 rounded-none-tl-full pointer-events-none" />
                <div className="p-3 bg-blue-500 rounded-none text-white shadow-sm shadow-blue-200">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট পণ্য' : 'Total Products'}
                  </span>
                  <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
                    {filteredProducts.length} <span className="text-xs font-bold text-slate-500">/ {products.length} {language === 'bn' ? 'টি' : 'Products'}</span>
                  </span>
                </div>
              </div>

              {/* Card 2: Total Stock Quantity */}
              <div className="bg-gradient-to-br from-purple-50/70 to-fuchsia-50/20 rounded-none border border-purple-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-500/5 rounded-none-tl-full pointer-events-none" />
                <div className="p-3 bg-purple-500 rounded-none text-white shadow-sm shadow-purple-200">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট স্টক পরিমাণ' : 'Total Stock Quantity'}
                  </span>
                  <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
                    {totalStockQty.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              {/* Card 3: Total Inventory Value (DP) */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/20 rounded-none border border-emerald-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/5 rounded-none-tl-full pointer-events-none" />
                <div className="p-3 bg-emerald-500 rounded-none text-white shadow-sm shadow-emerald-200">
                  <span className="text-xl font-bold font-mono">৳</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট ইনভেন্টরি মূল্য (DP)' : 'Total Inventory Value (DP)'}
                  </span>
                  <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
                    {formatBDT(totalProductsStockValuationDP)}
                  </span>
                </div>
              </div>

              {/* Card 4: Total Inventory Value (TP) */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/20 rounded-none border border-amber-100 p-5 shadow-sm flex items-center gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-500/5 rounded-none-tl-full pointer-events-none" />
                <div className="p-3 bg-amber-500 rounded-none text-white shadow-sm shadow-amber-200">
                  <span className="text-xl font-bold font-mono">৳</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">
                    {language === 'bn' ? 'মোট ইনভেন্টরি মূল্য (TP)' : 'Total Inventory Value (TP)'}
                  </span>
                  <span className="text-2xl font-black text-slate-855 font-mono tracking-tight">
                    {formatBDT(totalProductsStockValuationTP)}
                  </span>
                </div>
              </div>
            </div>

            {/* Beautiful full-width filters section */}
            <div className="bg-white border border-slate-200 rounded-none p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-indigo-500 shrink-0" />
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
                      {language === 'bn' ? 'লাইভ ফিল্টার ও পণ্য অনুসন্ধান' : 'Live Filter & Catalog Search'}
                    </span>
                  </div>
                  {(productSearch || productCompanyFilter !== 'All' || productCategoryFilter !== 'All' || productStockFilter !== 'All' || productStartDate || productEndDate) && (
                    <button
                      onClick={() => {
                        setProductSearch('');
                        setProductCompanyFilter('All');
                        setProductCategoryFilter('All');
                        setProductStockFilter('All');
                        setProductStartDate('');
                        setProductEndDate('');
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors cursor-pointer"
                    >
                      {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Search query */}
                  <div className="space-y-1.5 sm:col-span-2 md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'bn' ? 'পণ্য বা SKU খুঁজুন' : 'Search Product / SKU'}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder={language === 'bn' ? 'পণ্যের নাম বা SKU...' : 'Product name or SKU...'}
                        className="w-full h-10 pl-9 pr-3 rounded-none border border-slate-200 bg-slate-50/20 text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Company Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'bn' ? 'কোম্পানি ফিল্টার' : 'Filter by Company'}
                    </label>
                    <select
                      value={productCompanyFilter}
                      onChange={e => setProductCompanyFilter(e.target.value)}
                      className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="All">{language === 'bn' ? 'সকল কোম্পানি' : 'All Companies'}</option>
                      {Array.from(new Set(products.map(p => p.company).filter(Boolean))).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* SR Filter - REMOVED: Company filter is sufficient */}

                  {/* Stock Level Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'bn' ? 'স্টক পরিমাণ ফিল্টার' : 'Filter by Stock Level'}
                    </label>
                    <select
                      value={productStockFilter}
                      onChange={e => setProductStockFilter(e.target.value)}
                      className="h-10 w-full rounded-none border border-slate-200 bg-slate-50/20 px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="All">{language === 'bn' ? 'সকল লেভেল' : 'All Levels'}</option>
                      <option value="Low">{language === 'bn' ? 'স্টক সংকট (< ৬০০ পিস)' : 'Low Stock (< 600 Pcs)'}</option>
                    </select>
                  </div>

                  {/* From Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider block">
                      {language === 'bn' ? 'শুরুর তারিখ (রেজিস্ট্রেশন)' : 'From Date (Reg)'}
                    </label>
                    <div className="relative flex items-center rounded-none border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/80 overflow-hidden bg-white">
                      <div className="absolute left-0 top-0 bottom-0 px-2.5 bg-indigo-500 border-r border-indigo-600 flex items-center justify-center text-white">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="date"
                        value={productStartDate}
                        onChange={e => setProductStartDate(e.target.value)}
                        className="w-full h-10 pl-12 pr-3 bg-transparent text-xs font-semibold text-slate-700 font-mono outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* To Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 tracking-wider block">
                      {language === 'bn' ? 'শেষের তারিখ (রেজিস্ট্রেশন)' : 'To Date (Reg)'}
                    </label>
                    <div className="relative flex items-center rounded-none border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100/80 overflow-hidden bg-white">
                      <div className="absolute left-0 top-0 bottom-0 px-2.5 bg-rose-500 border-r border-rose-600 flex items-center justify-center text-white">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="date"
                        value={productEndDate}
                        onChange={e => setProductEndDate(e.target.value)}
                        className="w-full h-10 pl-12 pr-3 bg-transparent text-xs font-semibold text-slate-700 font-mono outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>


            {/* List Sub-header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-none shadow-sm">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'পণ্য ক্যাটালগ ও মূল্য' : 'Product Inventory & Pricing'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {language === 'bn' ? 'ক্রয়মূল্য, পাইকারি মূল্য, খুচরা মূল্য এবং বর্তমান স্টক' : 'Import cost, wholesale supply, retail MRP and margin levels'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ViewToggle />
                <button
                  type="button"
                  onClick={handleOpenUnit}
                  className="inline-flex h-10 items-center gap-2 rounded-none bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'ইউনিট যোগ করুন' : 'Add Unit (UOM)'}
                </button>
                <button
                  type="button"
                  onClick={handleOpenProduct}
                  className="inline-flex h-10 items-center gap-2 rounded-none bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {tDir.registerProduct}
                </button>
              </div>
            </div>

            {/* Product View */}
            {stockHistoryDate ? (
              // Specialized snapshot table
              <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                        <th className="px-5 py-4">{language === 'bn' ? 'পণ্যের নাম' : 'Product Name'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'স্টক পরিমাণ' : 'Stock Quantity'}</th>
                        {userRole !== 'sr' && <th className="px-5 py-4 text-right">{language === 'bn' ? 'ডিলার মূল্য (DP)' : 'Dealer Price (DP)'}</th>}
                        <th className="px-5 py-4 text-right">{language === 'bn' ? 'পাইকারি মূল্য (TP)' : 'Trade Price (TP)'}</th>
                        {userRole !== 'sr' && <th className="px-5 py-4 text-right">{language === 'bn' ? 'স্টক মূল্য (DP)' : 'Stock Value (DP)'}</th>}
                        <th className="px-5 py-4 text-right">{language === 'bn' ? 'স্টক মূল্য (TP)' : 'Stock Value (TP)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.map(p => {
                        const displayStock = getHistoricStockForProduct(p, stockHistoryDate);
                        const tp = p.primaryUnit === 'Carton'
                          ? (p.pricePerCarton || p.defaultWSP)
                          : (p.pricePerPiece || p.defaultWSP);
                        const stockValDP = displayStock * p.defaultPP;
                        const stockValTP = displayStock * tp;
                        const categoryName = getCategoryName(p.categoryId);

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-slate-400 font-mono">{p.sku}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[9px] font-bold text-indigo-500 font-mono flex items-center gap-1" title={language === 'bn' ? 'এন্ট্রি তারিখ' : 'Registration Date'}>
                                  📅 {new Date(p.createdAt).toLocaleDateString('en-BD')}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold whitespace-nowrap border shadow-2xs ${getCompanyBadgeStyle(p.company)}`}>
                                {p.company}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-650">
                              {categoryName}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-[11px] font-bold font-mono uppercase tracking-wide border bg-slate-50 text-slate-800 border-slate-200">
                                  {formatStock(displayStock, p.cartonSize || 24, p.primaryUnit)}
                                </span>
                                <span className="text-[9.5px] text-slate-500 font-mono font-bold mt-0.5">
                                  ({language === 'bn' ? 'মোট' : 'Total'}: {getTotalPieces(displayStock, p.cartonSize || 24, p.primaryUnit).toLocaleString()} {language === 'bn' ? 'পিস' : 'Pcs'})
                                </span>
                              </div>
                            </td>
                            {userRole !== 'sr' && (
                              <td className="px-5 py-3.5 text-xs text-right font-semibold text-slate-600 whitespace-nowrap font-mono">
                                {formatBDT(p.defaultPP)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                              </td>
                            )}
                            <td className="px-5 py-3.5 text-xs text-right text-indigo-600 font-semibold whitespace-nowrap font-mono">
                              {formatBDT(tp)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                            </td>
                            {userRole !== 'sr' && (
                              <td className="px-5 py-3.5 text-xs text-right text-emerald-600 font-semibold whitespace-nowrap font-mono">
                                {formatBDT(stockValDP)}
                              </td>
                            )}
                            <td className="px-5 py-3.5 text-xs text-right text-slate-900 font-semibold whitespace-nowrap font-mono">
                              {formatBDT(stockValTP)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map(p => {
                  const primaryUnit = p.customUnits && p.customUnits.length > 0 ? p.customUnits[0] : null;
                  const godownName = godowns.find(g => g.id === p.defaultGodownId)?.name || 'Main Godown';
                  const marginPct = p.defaultWSP > 0 ? ((p.defaultWSP - p.defaultPP) / p.defaultWSP) * 100 : 0;
                  const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
                  const alertThreshold = p.stockAlertThreshold ?? 50;
                  const isLowStock = displayStock <= alertThreshold;
                  const tpPrice = p.primaryUnit === 'Carton' ? (p.pricePerCarton || p.defaultWSP) : (p.pricePerPiece || p.defaultWSP);

                  let brandTheme = {
                    border: 'hover:border-purple-300',
                    bgGradient: 'from-purple-50/30 via-white to-white border-slate-200',
                    valText: 'text-purple-700',
                    valBg: 'bg-purple-50/40 border-purple-100',
                  };
                  const compLower = p.company.toLowerCase();
                  if (compLower === 'pran') {
                    brandTheme = { border: 'hover:border-orange-300', bgGradient: 'from-orange-50/30 via-white to-white border-slate-200', valText: 'text-orange-700', valBg: 'bg-orange-50/40 border-orange-100' };
                  } else if (compLower === 'olympic') {
                    brandTheme = { border: 'hover:border-blue-300', bgGradient: 'from-blue-50/30 via-white to-white border-slate-200', valText: 'text-blue-700', valBg: 'bg-blue-50/40 border-blue-100' };
                  } else if (compLower === 'haque') {
                    brandTheme = { border: 'hover:border-emerald-300', bgGradient: 'from-emerald-50/30 via-white to-white border-slate-200', valText: 'text-emerald-700', valBg: 'bg-emerald-50/40 border-emerald-100' };
                  } else if (compLower === 'coca-cola' || compLower === 'coca cola') {
                    brandTheme = { border: 'hover:border-red-300', bgGradient: 'from-red-50/30 via-white to-white border-slate-200', valText: 'text-red-700', valBg: 'bg-red-50/40 border-red-100' };
                  }

                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-none shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
                    >
                      {/* Brand color accent bar */}
                      <div className={`h-0.5 w-full ${
                        compLower === 'pran' ? 'bg-orange-500' :
                        compLower === 'olympic' ? 'bg-blue-500' :
                        compLower === 'haque' ? 'bg-emerald-500' :
                        compLower === 'coca-cola' || compLower === 'coca cola' ? 'bg-red-500' :
                        'bg-slate-400'
                      }`} />

                      {/* Header */}
                      <div className="px-4 pt-3.5 pb-2">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-bold border uppercase tracking-wide ${getCompanyBadgeStyle(p.company)}`}>
                            {p.company}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isLowStock && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[9px] font-bold border ${
                                p.currentStock === 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-none ${p.currentStock === 0 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
                                {p.currentStock === 0 ? 'OUT' : 'LOW'}
                              </span>
                            )}
                            <span className="font-mono text-[9px] text-slate-400 tracking-tight">{p.sku}</span>
                          </div>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-[15px] leading-snug line-clamp-2 tracking-tight">{p.name}</h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                          <span>{p.primaryUnit === 'Carton' ? `1 Ctn = ${p.cartonSize || 24} pcs` : `${p.cartonSize || 24} pcs / ctn`}</span>
                          {godownName !== 'Main Godown' && godownName !== 'N/A' && (
                            <><span className="opacity-40">·</span><span>{godownName}</span></>
                          )}
                        </div>
                        {p.defaultPP >= p.defaultWSP && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[9px] text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Price violation: DP ≥ TP
                          </div>
                        )}
                      </div>

                      {/* Price strip */}
                      <div className={`mx-4 mb-3 border border-slate-100 divide-x divide-slate-100 grid ${userRole !== 'sr' ? 'grid-cols-4' : 'grid-cols-3'} bg-slate-50`}>
                        <div className="px-2 py-2.5 text-center">
                          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">DP/{p.primaryUnit === 'Carton' ? 'Ctn' : 'Pc'}</div>
                          <div className="font-mono text-xs font-bold text-amber-700">{formatBDT(p.defaultPP)}</div>
                        </div>
                        <div className="px-2 py-2.5 text-center">
                          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">TP/{p.primaryUnit === 'Carton' ? 'Ctn' : 'Pc'}</div>
                          <div className="font-mono text-xs font-black text-indigo-700">{formatBDT(tpPrice)}</div>
                        </div>
                        <div className="px-2 py-2.5 text-center">
                          <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">MRP</div>
                          <div className="font-mono text-xs font-bold text-teal-700">{formatBDT(p.defaultMRP)}</div>
                        </div>
                        {userRole !== 'sr' && (
                          <div className="px-2 py-2.5 text-center">
                            <div className="text-[8px] text-slate-400 uppercase tracking-widest mb-0.5">Margin</div>
                            <div className={`font-mono text-xs font-black ${marginPct > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {marginPct > 0 ? '+' : ''}{marginPct.toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stock section */}
                      <div className="px-4 pb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{language === 'bn' ? 'স্টক' : 'Stock'}</span>
                          <div className="text-right">
                            <div className={`text-[12px] font-black font-mono leading-none ${isLowStock ? 'text-amber-600' : 'text-slate-900'}`}>
                              {formatStock(displayStock, p.cartonSize || 24, p.primaryUnit)}
                            </div>
                            <div className="text-[9.5px] font-mono text-slate-500 font-bold mt-1">
                              ({language === 'bn' ? 'মোট' : 'Total'}: {getTotalPieces(displayStock, p.cartonSize || 24, p.primaryUnit).toLocaleString()} {language === 'bn' ? 'পিস' : 'Pcs'})
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-none overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (displayStock / Math.max(alertThreshold * 4, 100)) * 100)}%` }}
                            className={`h-full rounded-none transition-all duration-500 ${isLowStock ? 'bg-amber-400' : 'bg-emerald-500'}`}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 uppercase tracking-widest">DP Val</span>
                            <span className="text-[12px] font-black font-mono text-amber-700">
                              ৳{(displayStock * p.defaultPP).toLocaleString('en-BD')}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] text-slate-400 uppercase tracking-widest">TP Val</span>
                            <span className="text-[12px] font-black font-mono text-indigo-700">
                              ৳{(displayStock * tpPrice).toLocaleString('en-BD')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer actions */}
                      <div className="mt-auto border-t border-slate-100 px-4 py-2 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => startEditProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-none transition-colors cursor-pointer"
                            title="Edit product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                        <th className="px-5 py-4">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'কোম্পানি' : 'Brand/Company'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'কার্টন সাইজ' : 'Carton Size'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'স্টক' : 'Stock'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'ক্রয় মূল্য (PP)' : 'Purchase Price (PP)'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'কার্টন মূল্য' : 'Carton Price'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'পিস মূল্য' : 'Piece Price'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'এমআরপি' : 'MRP'}</th>
                        <th className="px-5 py-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedProducts.map(p => {
                        const displayStock = stockHistoryDate ? getHistoricStockForProduct(p, stockHistoryDate) : p.currentStock;
                        const isLowStock = displayStock < 600;
                        const isEditing = inlineEditingProductId === p.id;

                        if (isEditing) {
                          return (
                            <tr key={p.id} className="bg-indigo-50/30 transition-colors">
                              <td className="p-2 align-top">
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={inlineEditForm.name || ''}
                                    onChange={e => setInlineEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full h-8 px-2 rounded-none border border-slate-300 text-sm font-bold text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
                                    placeholder="Product Name"
                                  />
                                  <input
                                    type="text"
                                    value={inlineEditForm.sku || ''}
                                    onChange={e => setInlineEditForm(prev => ({ ...prev, sku: e.target.value }))}
                                    className="w-full h-7 px-2 rounded-none border border-slate-300 text-[10px] font-mono font-bold text-slate-600 focus:border-indigo-500 outline-none"
                                    placeholder="SKU"
                                  />
                                </div>
                              </td>
                              <td className="p-2 align-top">
                                <select
                                  value={inlineEditForm.company || ''}
                                  onChange={e => setInlineEditForm(prev => ({ ...prev, company: e.target.value }))}
                                  className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                >
                                  {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                              </td>
                              <td className="p-2 align-top">
                                <input
                                  type="number"
                                  value={inlineEditForm.cartonSize || 24}
                                  onChange={e => {
                                    const cs = Math.max(1, Number(e.target.value));
                                    setInlineEditForm(prev => {
                                      const pPrice = prev.pricePerPiece || 0;
                                      return {
                                        ...prev,
                                        cartonSize: cs,
                                        pricePerCarton: Number((pPrice * cs).toFixed(2))
                                      };
                                    });
                                  }}
                                  className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-mono font-bold text-slate-700 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="p-2 align-top text-slate-400 text-xs font-bold pt-4">
                                {formatStock(displayStock, p.cartonSize || 24, p.primaryUnit)}
                              </td>
                              <td className="p-2 align-top">
                                <input
                                  type="number"
                                  value={inlineEditForm.defaultPP || 0}
                                  onChange={e => setInlineEditForm(prev => ({ ...prev, defaultPP: Number(e.target.value) }))}
                                  className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-mono font-bold text-blue-700 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="p-2 align-top">
                                <input
                                  type="number"
                                  value={
                                    inlineEditForm.primaryUnit === 'Carton'
                                      ? (inlineEditForm.pricePerCarton || inlineEditForm.defaultWSP || 0)
                                      : (inlineEditForm.pricePerCarton || ((inlineEditForm.defaultWSP || 0) * (inlineEditForm.cartonSize || 24)))
                                  }
                                  onChange={e => {
                                    const cPrice = Number(e.target.value);
                                    setInlineEditForm(prev => {
                                      if (prev.primaryUnit === 'Carton') {
                                        return {
                                          ...prev,
                                          pricePerCarton: cPrice,
                                          pricePerPiece: 0,
                                          defaultWSP: cPrice
                                        };
                                      }
                                      const cs = prev.cartonSize || 24;
                                      const pPrice = Number((cPrice / cs).toFixed(2));
                                      return {
                                        ...prev,
                                        pricePerCarton: cPrice,
                                        pricePerPiece: pPrice,
                                        defaultWSP: pPrice
                                      };
                                    });
                                  }}
                                  className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-mono font-bold text-emerald-700 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="p-2 align-top">
                                {inlineEditForm.primaryUnit === 'Carton' ? (
                                  <span className="text-slate-400 text-[10px] block pt-2 text-center font-bold">N/A</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={inlineEditForm.pricePerPiece || inlineEditForm.defaultWSP || 0}
                                    onChange={e => {
                                      const pPrice = Number(e.target.value);
                                      setInlineEditForm(prev => {
                                        const cs = prev.cartonSize || 24;
                                        return {
                                          ...prev,
                                          pricePerPiece: pPrice,
                                          defaultWSP: pPrice,
                                          pricePerCarton: Number((pPrice * cs).toFixed(2))
                                        };
                                      });
                                    }}
                                    className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-mono font-bold text-emerald-700 focus:border-indigo-500 outline-none"
                                  />
                                )}
                              </td>
                              <td className="p-2 align-top">
                                <input
                                  type="number"
                                  value={inlineEditForm.defaultMRP || 0}
                                  onChange={e => setInlineEditForm(prev => ({ ...prev, defaultMRP: Number(e.target.value) }))}
                                  className="w-full h-8 px-2 rounded-none border border-slate-300 text-xs font-mono font-bold text-amber-700 focus:border-indigo-500 outline-none"
                                />
                              </td>
                              <td className="p-2 align-top text-right">
                                <div className="flex flex-col items-end gap-2">
                                  <button
                                    type="button"
                                    onClick={saveInlineEditProduct}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-none transition-colors w-full"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelInlineEditProduct}
                                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-none transition-colors w-full"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm mb-0.5">{p.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-slate-400 font-mono">{p.sku}</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-[9px] font-bold text-indigo-500 font-mono flex items-center gap-1" title={language === 'bn' ? 'এন্ট্রি তারিখ' : 'Registration Date'}>
                                  📅 {new Date(p.createdAt).toLocaleDateString('en-BD')}
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span
                                title={p.company}
                                className={`inline-flex items-center px-2.5 py-1 rounded-none text-xs font-bold whitespace-nowrap border shadow-2xs ${getCompanyBadgeStyle(p.company)}`}
                              >
                                {p.company}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] font-bold text-slate-600">
                              {p.primaryUnit === 'Carton'
                                ? <span className="text-slate-400">— Ctn Only</span>
                                : <>{p.cartonSize || 24} pcs/ctn</>}
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wide border ${isLowStock
                                ? "bg-rose-50 text-rose-600 border-rose-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                }`}>
                                <span className={`w-1.5 h-1.5 rounded-none mr-1.5 ${isLowStock ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
                                {formatStock(displayStock, p.cartonSize || 24, p.primaryUnit)}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap font-mono">
                              {formatBDT(p.defaultPP)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-indigo-600 font-bold whitespace-nowrap font-mono">
                              {p.primaryUnit === 'Carton'
                                ? formatBDT(p.pricePerCarton || p.defaultWSP)
                                : formatBDT(p.pricePerCarton || (p.defaultWSP * (p.cartonSize || 24)))}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-emerald-600 font-bold whitespace-nowrap font-mono">
                              {p.primaryUnit === 'Carton'
                                ? <span className="text-slate-400 text-[10px]">N/A (Ctn product)</span>
                                : formatBDT(p.pricePerPiece || p.defaultWSP)}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-900 font-extrabold whitespace-nowrap font-mono">
                              {formatBDT(p.defaultMRP)}/{p.primaryUnit === 'Carton' ? 'Ctn' : 'pc'}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startInlineEditProduct(p)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-none transition-colors cursor-pointer"
                                  title="Inline Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                                  title="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            <div className="mt-4">
              <Pagination
                currentPage={validPage}
                totalPages={totalPages}
                onPageChange={setProductPage}
                itemsPerPage={productItemsPerPage}
                onItemsPerPageChange={setProductItemsPerPage}
                pageSizeOptions={[10, 24, 50, 100]}
                totalItems={filteredProducts.length}
                language={language}
              />
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: Retail Shops / Customers */}
      {activeSubTab === 'shops' && (() => {
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 border border-slate-200 rounded-none shadow-sm">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {language === 'bn' ? 'খুচরা বিক্রেতা ও গ্রাহক তালিকা' : 'Retail Partners & Customers'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {language === 'bn' ? 'সরাসরি খুচরা বাজারের সেলস পয়েন্ট ও Beat ম্যাপিং করা দোকানসমূহ' : 'Manage retail outlets, credit thresholds, routes beat allocation and sales agents'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <ViewToggle />
                <button
                  id="btn-register-shop-top"
                  type="button"
                  onClick={handleOpenShop}
                  className="inline-flex h-10 items-center gap-2 rounded-none bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 border border-slate-950 cursor-pointer transition-all active:scale-95 shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                  {tDir.registerShop}
                </button>
              </div>
            </div>

            {customers.length === 0 ? (
              <div className="bg-white rounded-none border border-slate-200 p-8 text-center text-slate-400 font-semibold shadow-sm">
                {language === 'bn' ? 'কোন দোকান পাওয়া যায়নি' : 'No retail customers registered.'}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {customers.map((c, index) => {
                  const routeName = routes.find(r => r.id === c.routeId)?.name || 'Unassigned Beat';

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-none border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      <div className="absolute -right-20 -top-20 w-36 h-36 rounded-none bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between">
                          <span className="w-8 h-8 rounded-none bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs shadow-sm">
                            <Building className="w-4 h-4 text-white" />
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-50 border border-slate-200 rounded-none text-[9px] font-bold text-slate-650 uppercase tracking-wider">
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
                          {c.email && (
                            <div className="text-[11px] font-mono text-slate-505 font-bold flex items-center gap-1">
                              <span className="text-slate-400 font-semibold font-sans">Email:</span>
                              {c.email}
                            </div>
                          )}
                        </div>


                      </div>

                      {/* Credit Ledger details */}
                      <div className="bg-slate-50 rounded-none p-3 border border-slate-200 relative z-10 grid grid-cols-3 gap-2 text-xs">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide block">Credit Limit</span>
                          <span className="font-mono font-extrabold text-slate-900">{formatBDT(c.creditLimit || 0)}</span>
                        </div>
                        <div className="space-y-0.5 text-center">
                          <span className="text-[8px] font-bold text-slate-450 uppercase tracking-wide block">Terms</span>
                          <span className="font-bold text-slate-700">{c.creditDays || 0} Days</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wide block">Outstanding Due</span>
                          <span className="font-mono font-black text-rose-600">{formatBDT(c.due || 0)}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 relative z-10">
                        <button
                          type="button"
                          onClick={() => startEditShop(c)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-350 bg-white text-slate-650 hover:bg-slate-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title="Edit shop details"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(c.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title="Delete shop"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider">
                        <th className="px-5 py-4">{language === 'bn' ? 'দোকানের নাম' : 'Shop Name'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'ঠিকানা/মার্কেট' : 'Address/Market'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'মোবাইল' : 'Phone'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'অ্যাসাইনড রুট' : 'Assigned Beat'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'ক্রেডিট লিমিট' : 'Credit Limit'}</th>
                        <th className="px-5 py-4">{language === 'bn' ? 'ক্রেডিট দিন' : 'Terms (Days)'}</th>
                        <th className="px-5 py-4 text-rose-600 font-bold">{language === 'bn' ? 'বকেয়া ব্যালেন্স' : 'Outstanding Due'}</th>
                        <th className="px-5 py-4 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((c, index) => {
                        const routeName = routes.find(r => r.id === c.routeId)?.name || 'Unassigned Beat';
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-5 py-3.5 font-bold text-slate-900 text-sm">{c.name}</td>
                            <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">{c.market}</td>
                            <td className="px-5 py-3.5 text-xs font-medium text-slate-500">
                              <div>{c.phone}</div>
                              {c.email && <div className="text-[10px] text-slate-400 font-normal">{c.email}</div>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-none text-[10px] font-semibold uppercase tracking-wider">
                                {routeName}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-800">{formatBDT(c.creditLimit || 0)}</td>
                            <td className="px-5 py-3.5 font-semibold text-slate-700">{c.creditDays || 0}</td>
                            <td className="px-5 py-3.5 font-bold font-mono text-rose-600">{formatBDT(c.due || 0)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => startEditShop(c)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-none transition-colors cursor-pointer"
                                  title="Edit shop details"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShop(c.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                                  title="Delete shop"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* SUB-TAB: Units of Measure */}
      {activeSubTab === 'units' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-700" />
                  {language === 'bn' ? 'পরিমাপের একক' : 'Units of Measure'}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {language === 'bn' ? 'পণ্য পরিমাপের একক পরিচালনা করুন' : 'Manage product measurement units'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUnit(null);
                  setUnitName('');
                  setUnitSymbol('');
                  setShowUnitModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-none transition-colors"
              >
                <Plus className="w-4 h-4" />
                {language === 'bn' ? '+ একক যোগ করুন' : '+ Add Unit'}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'মোট একক' : 'Total Units'}
              </div>
              <div className="text-2xl font-bold text-slate-900">{units.length}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'ব্যবহৃত একক' : 'Units In Use'}
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {new Set(products.map(p => p.primaryUnit || 'Piece')).size}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'পণ্য সংখ্যা' : 'Products'}
              </div>
              <div className="text-2xl font-bold text-slate-900">{products.length}</div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white border border-slate-200 rounded-none p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={unitSearch}
                onChange={e => setUnitSearch(e.target.value)}
                placeholder={language === 'bn' ? 'একক খুঁজুন...' : 'Search units...'}
                className="w-full h-10 pl-9 pr-4 border border-slate-300 rounded-none text-sm outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Units Table */}
          <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'একক নাম' : 'Unit Name'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'সংক্ষিপ্ত রূপ' : 'Short Form'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'পণ্য সংখ্যা' : 'Products'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'অ্যাকশন' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {units
                    .filter(u => !unitSearch || u.name.toLowerCase().includes(unitSearch.toLowerCase()) || u.symbol.toLowerCase().includes(unitSearch.toLowerCase()))
                    .map((u, idx) => {
                      const productCount = products.filter(p => (p.primaryUnit || 'Piece') === u.name).length;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-slate-100 text-slate-700">
                              {u.symbol}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium text-slate-900">{productCount}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingUnit(u);
                                  setUnitName(u.name);
                                  setUnitSymbol(u.symbol);
                                  setShowUnitModal(true);
                                }}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-none transition-colors"
                                title={language === 'bn' ? 'সম্পাদনা' : 'Edit'}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(u.id)}
                                className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors"
                                title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {units.filter(u => !unitSearch || u.name.toLowerCase().includes(unitSearch.toLowerCase())).length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">{language === 'bn' ? 'কোন একক পাওয়া যায়নি' : 'No units found'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB: Stock Alerts */}
      {activeSubTab === 'stockAlerts' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  {language === 'bn' ? 'স্টক অ্যালার্ট' : 'Stock Alerts'}
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {language === 'bn' ? 'কম স্টক এবং সতর্কতা পর্যবেক্ষণ করুন' : 'Monitor low stock and alerts'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-red-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'জরুরি অ্যালার্ট' : 'Critical Alerts'}
              </div>
              <div className="text-2xl font-bold text-red-600">
                {products.filter(p => {
                  const totalStock = companies.reduce((sum, c) => sum + (p.currentStock || 0), 0);
                  return totalStock === 0;
                }).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">{language === 'bn' ? 'স্টক শূন্য' : 'Out of stock'}</p>
            </div>
            <div className="bg-white border border-amber-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'কম স্টক' : 'Low Stock'}
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {products.filter(p => {
                  const totalStock = companies.reduce((sum, c) => sum + (p.currentStock || 0), 0);
                  return totalStock > 0 && totalStock <= (p.stockAlertThreshold || 10);
                }).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">{language === 'bn' ? 'রি-অর্ডার প্রয়োজন' : 'Need reorder'}</p>
            </div>
            <div className="bg-white border border-emerald-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'স্বাভাবিক স্টক' : 'Normal Stock'}
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {products.filter(p => {
                  const totalStock = companies.reduce((sum, c) => sum + (p.currentStock || 0), 0);
                  return totalStock > (p.stockAlertThreshold || 10);
                }).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">{language === 'bn' ? 'ভাল অবস্থা' : 'Good condition'}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                {language === 'bn' ? 'মোট পণ্য' : 'Total Products'}
              </div>
              <div className="text-2xl font-bold text-slate-900">{products.length}</div>
              <p className="text-xs text-slate-500 mt-1">{language === 'bn' ? 'সকল পণ্য' : 'All products'}</p>
            </div>
          </div>

          {/* Alert Filter Tabs */}
          <div className="bg-white border border-slate-200 rounded-none p-1 inline-flex">
            {['all', 'critical', 'low', 'normal'].map(filter => (
              <button
                key={filter}
                onClick={() => setProductStockFilter(filter === 'all' ? 'All' : filter === 'critical' ? 'Out' : filter === 'low' ? 'Low' : 'Normal')}
                className={`px-4 py-2 rounded-none text-sm font-semibold transition-colors ${
                  (filter === 'all' && productStockFilter === 'All') ||
                  (filter === 'critical' && productStockFilter === 'Out') ||
                  (filter === 'low' && productStockFilter === 'Low') ||
                  (filter === 'normal' && productStockFilter === 'Normal')
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter === 'all' ? (language === 'bn' ? 'সকল' : 'All') :
                 filter === 'critical' ? (language === 'bn' ? 'জরুরি' : 'Critical') :
                 filter === 'low' ? (language === 'bn' ? 'কম' : 'Low') :
                 (language === 'bn' ? 'স্বাভাবিক' : 'Normal')}
              </button>
            ))}
          </div>

          {/* Products Alert Table */}
          <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'পণ্য' : 'Product'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'কোম্পানি' : 'Company'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'মোট স্টক' : 'Total Stock'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'রি-অর্ডার লেভেল' : 'Reorder Level'}
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      {language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filteredAlerts = products
                      .map(p => {
                        const totalStock = companies.reduce((sum, c) => sum + (p.currentStock || 0), 0);
                        return { ...p, totalStock };
                      })
                      .filter(p => {
                        if (productStockFilter === 'Out') return p.totalStock === 0;
                        if (productStockFilter === 'Low') return p.totalStock > 0 && p.totalStock <= (p.stockAlertThreshold || 10);
                        if (productStockFilter === 'Normal') return p.totalStock > (p.stockAlertThreshold || 10);
                        return true; // 'All'
                      })
                      .sort((a, b) => a.totalStock - b.totalStock);
                      
                    const itemsPerPage = 24;
                    const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
                    const validPage = Math.max(1, Math.min(productPage, totalPages));
                    const paginatedAlerts = filteredAlerts.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage);

                    if (filteredAlerts.length === 0) {
                      return null;
                    }

                    return (
                      <React.Fragment>
                        {paginatedAlerts.map((p, idx) => {
                          const globalIdx = (validPage - 1) * itemsPerPage + idx + 1;
                      const getCategoryName = (categoryId?: string) => {
                        if (!categoryId) return '—';
                        const cat = productCategories.find(c => c.id === categoryId);
                        return cat ? cat.name : '—';
                      };
                      const statusColor = p.totalStock === 0 ? 'red' : p.totalStock <= (p.stockAlertThreshold || 10) ? 'amber' : 'emerald';
                      const statusLabel = p.totalStock === 0 ? (language === 'bn' ? 'স্টক শূন্য' : 'Out of Stock') :
                                         p.totalStock <= (p.stockAlertThreshold || 10) ? (language === 'bn' ? 'কম স্টক' : 'Low Stock') :
                                         (language === 'bn' ? 'স্বাভাবিক' : 'Normal');
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                            {globalIdx.toString().padStart(2, '0')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                            <div className="text-xs text-slate-500">{getCategoryName(p.categoryId)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700">{p.company}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-sm font-semibold ${statusColor === 'red' ? 'text-red-600' : statusColor === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`}>
                              {p.totalStock} {p.primaryUnit || 'PCS'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-slate-600">{p.stockAlertThreshold || 10} {p.primaryUnit || 'PCS'}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-medium bg-${statusColor}-100 text-${statusColor}-700`}>
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                        })}
                      </React.Fragment>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            
            {(() => {
              const filteredCount = products.filter(p => {
                const totalStock = companies.reduce((sum, c) => sum + (p.currentStock || 0), 0);
                if (productStockFilter === 'Out') return totalStock === 0;
                if (productStockFilter === 'Low') return totalStock > 0 && totalStock <= (p.stockAlertThreshold || 10);
                if (productStockFilter === 'Normal') return totalStock > (p.stockAlertThreshold || 10);
                return true;
              }).length;

              const itemsPerPage = 24;
              const totalPages = Math.ceil(filteredCount / itemsPerPage);

              return (
                <React.Fragment>
                  {filteredCount === 0 && (
                    <div className="py-12 text-center text-slate-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">{language === 'bn' ? 'কোন অ্যালার্ট নেই' : 'No alerts found'}</p>
                    </div>
                  )}

                  {/* Pagination Controls */}
                  <div className="mt-4">
                    <Pagination
                      currentPage={Math.max(1, Math.min(productPage, totalPages))}
                      totalPages={totalPages}
                      onPageChange={setProductPage}
                      itemsPerPage={productItemsPerPage}
                      onItemsPerPageChange={setProductItemsPerPage}
                      pageSizeOptions={[10, 24, 50, 100]}
                      totalItems={filteredCount}
                      language={language}
                    />
                  </div>
                </React.Fragment>
              );
            })()}
          </div>
        </div>
      )}


      {/* SUB-TAB: Supplier Companies & Brands */}
      {activeSubTab === 'companies' && (() => {
        const filteredCompanies = companies.filter(c => {
          if (!compSearch) return true;
          const q = compSearch.toLowerCase();
          return (
            c.name.toLowerCase().includes(q) ||
            (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q))
          );
        });

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-slate-800" />
                    {language === 'bn' ? 'কোম্পানি ও ব্র্যান্ড ম্যানেজমেন্ট' : 'Companies & Brands Directory'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {language === 'bn' ? 'সরবরাহকারী কোম্পানি ও ব্র্যান্ডসমূহ পরিচালনা করুন' : 'Manage your supplier companies and product brands'}
                  </p>
                </div>
              </div>
            </div>

            {/* Control Toolbar */}
            <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={compSearch}
                    onChange={(e) => setCompSearch(e.target.value)}
                    placeholder={language === 'bn' ? 'কোম্পানি খুঁজুন...' : 'Search companies...'}
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-none text-xs font-semibold text-slate-800 outline-none focus:bg-white focus:border-slate-800 transition-all placeholder:text-slate-400"
                  />
                </div>
                {/* Add Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingCompany(null);
                    setCompName('');
                    setCompContact('');
                    setCompPhone('');
                    setCompAddress('');
                    setShowCompanyModal(true);
                  }}
                  className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none transition-all flex items-center gap-1.5 border border-slate-950 cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'কোম্পানি যোগ করুন' : 'Add Company'}</span>
                </button>
              </div>
            </div>

            {/* Content Table */}
            <div className="bg-white border border-slate-200 rounded-none shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 w-12 text-center">#</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'কোম্পানি / ব্র্যান্ডের নাম' : 'Company / Brand Name'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'যোগাযোগের ব্যক্তি' : 'Contact Person'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}</th>
                      <th className="px-4 py-3">{language === 'bn' ? 'ঠিকানা' : 'Address'}</th>
                      <th className="px-4 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm font-semibold">{language === 'bn' ? 'কোন কোম্পানি পাওয়া যায়নি' : 'No companies found'}</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c, idx) => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group text-xs">
                          <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-400">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-900 text-sm">
                            {c.name}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 font-semibold">
                            {c.contactPerson || <span className="text-slate-400 italic font-medium">—</span>}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-700">
                            {c.phone || <span className="text-slate-400 italic font-medium">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                            {c.address || <span className="text-slate-400 italic font-medium">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCompany(c);
                                  setCompName(c.name);
                                  setCompContact(c.contactPerson || '');
                                  setCompPhone(c.phone || '');
                                  setCompAddress(c.address || '');
                                  setShowCompanyModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(language === 'bn' ? 'আপনি কি এই কোম্পানিটি ডিলিট করতে চান?' : 'Are you sure you want to delete this company?')) {
                                    setCompanies(prev => prev.filter(item => item.id !== c.id));
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}


      {/* SUB-TAB: Sales Representatives (SR) - Separate Page */}
      {activeSubTab === 'srs' && (
        <PersonnelManagement
          srs={srs}
          deliveryMen={[]} // Empty array - SR page only shows SRs
          companies={companies}
          customers={customers}
          language={language}
          mode="sr-only" // New prop to enforce SR-only mode
          onAddSR={() => {
            setEditingSr(null);
            setSrName('');
            setSrPhone('');
            setSrCommissionRate(0);
            setSrAssignedCompanies([]);
            setSrLoginUsername('');
            setSrLoginPassword('');
            setShowSrModal(true);
          }}
          onEditSR={(sr) => {
            setEditingSr(sr);
            setSrName(sr.name);
            setSrPhone(sr.phone);
            setSrCommissionRate(sr.commissionRate || 0);
            setSrAssignedCompanies(sr.assignedCompanyIds || []);
            setSrLoginUsername(sr.loginUsername || '');
            setSrLoginPassword(sr.loginPassword || '');
            setShowSrModal(true);
          }}
          onDeleteSR={handleDeleteSr}
          onAddDM={() => {}}
          onEditDM={() => {}}
          onDeleteDM={() => {}}
        />
      )}

      {/* SUB-TAB: Delivery Personnel (DSR) - Separate Page */}
      {activeSubTab === 'deliveryMen' && (
        <PersonnelManagement
          srs={[]} // Empty array - DSR page only shows delivery men
          deliveryMen={deliveryMen}
          companies={companies}
          customers={customers}
          language={language}
          mode="dsr-only" // New prop to enforce DSR-only mode
          onAddSR={() => {}}
          onEditSR={() => {}}
          onDeleteSR={() => {}}
          onAddDM={() => {
            setEditingDm(null);
            setDmName('');
            setDmVehicle('');
            setDmPhone('');
            setDmAssignedCompanies([]);
            setShowDmModal(true);
          }}
          onEditDM={(dm) => {
            setEditingDm(dm);
            setDmName(dm.name);
            setDmVehicle(dm.vehicle || '');
            setDmPhone(dm.phone || '');
            setDmAssignedCompanies(dm.assignedCompanyIds || []);
            setShowDmModal(true);
          }}
          onDeleteDM={handleDeleteDm}
        />
      )}

      {/* SUB-TAB: Delivery Routes */}
      {activeSubTab === 'routes' && (() => {
        const filteredRoutes = routes.filter(r => {
          if (!routeSearch) return true;
          const q = routeSearch.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.area.toLowerCase().includes(q) ||
            r.territory.toLowerCase().includes(q)
          );
        });

        const getSRName = (srId?: string) => {
          if (!srId) return null;
          return srs.find(s => s.id === srId)?.name || null;
        };

        const getShopsOnRoute = (routeId: string) =>
          customers.filter(c => c.routeId === routeId).length;

        return (
          <div className="space-y-5">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  {language === 'bn' ? 'ডেলিভারি রুট ম্যানেজমেন্ট' : 'Delivery Routes Management'}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {language === 'bn' ? 'বিট রুট, এলাকা ও টেরিটোরি পরিচালনা করুন' : 'Manage beat routes, areas and territories'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenRoute}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-none transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                {language === 'bn' ? '+ রুট যোগ করুন' : '+ Add Route'}
              </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-none p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'মোট রুট' : 'Total Routes'}
                </div>
                <div className="text-2xl font-bold text-slate-900">{routes.length}</div>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'সক্রিয় এলাকা' : 'Areas Covered'}
                </div>
                <div className="text-2xl font-bold text-amber-600">
                  {new Set(routes.map(r => r.area)).size}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'টেরিটোরি' : 'Territories'}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {new Set(routes.map(r => r.territory)).size}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-4">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'রুটে দোকান' : 'Shops on Routes'}
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {customers.filter(c => c.routeId).length}
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="bg-white border border-slate-200 rounded-none p-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={routeSearch}
                  onChange={e => setRouteSearch(e.target.value)}
                  placeholder={language === 'bn' ? 'রুট নাম বা এলাকা খুঁজুন...' : 'Search route name or area...'}
                  className="w-full h-10 pl-9 pr-4 border border-slate-300 rounded-none text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Routes table */}
            <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-10">#</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'রুটের নাম' : 'Route Name'}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'এলাকা' : 'Area'}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'টেরিটোরি' : 'Territory'}
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'দায়িত্বপ্রাপ্ত এসআর' : 'Assigned SR'}
                      </th>
                      <th className="px-5 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'দোকান সংখ্যা' : 'Shops'}
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {language === 'bn' ? 'অ্যাকশন' : 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoutes.map((route, idx) => {
                      const srName = getSRName(route.assignedSRId);
                      const shopCount = getShopsOnRoute(route.id);

                      return (
                        <tr key={route.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-4 text-sm text-slate-500 font-mono">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-none bg-amber-100 flex items-center justify-center shrink-0">
                                <MapPin className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{route.name}</div>
                                <div className="text-xs text-slate-400 font-mono">ID: {route.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-none text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                              {route.area}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm text-slate-600">{route.territory}</span>
                          </td>

                          <td className="px-5 py-4">
                            {srName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                {srName}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                {language === 'bn' ? 'বরাদ্দহীন' : 'Unassigned'}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-none text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {shopCount} {language === 'bn' ? 'টি' : 'shops'}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => startEditRoute(route)}
                                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-none transition-colors cursor-pointer"
                                title="Edit Route"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRoute(route.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-none transition-colors cursor-pointer"
                                title="Delete Route"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {filteredRoutes.length === 0 && (
                  <div className="py-14 text-center">
                    <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-900">
                      {routes.length === 0
                        ? (language === 'bn' ? 'কোনো রুট যোগ করা হয়নি' : 'No routes added yet')
                        : (language === 'bn' ? 'কোনো রুট পাওয়া যায়নি' : 'No routes match your search')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {routes.length === 0
                        ? (language === 'bn' ? '"+ রুট যোগ করুন" বাটনে ক্লিক করুন' : 'Click "+ Add Route" to create your first route')
                        : (language === 'bn' ? 'ভিন্ন কীওয়ার্ড দিয়ে চেষ্টা করুন' : 'Try a different search keyword')}
                    </p>
                    {routes.length === 0 && (
                      <button
                        type="button"
                        onClick={handleOpenRoute}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-none hover:bg-slate-800 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {language === 'bn' ? 'প্রথম রুট যোগ করুন' : 'Add First Route'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* SUB-TAB: Damage Stock */}
      {activeSubTab === 'damage' && (() => {
        const damagedProducts = products.filter(p => (p.damagedStock || 0) > 0);
        const allDamageLogs = products.flatMap(p => {
          return (p.damageHistory || []).map((log: any) => ({
            ...log,
            productName: p.name,
            productSku: p.sku,
            productUnit: p.primaryUnit,
            productId: p.id,
            company: p.company,
            price: p.defaultPP
          }));
        }).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white border border-slate-200 rounded-none p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    {language === 'bn' ? 'ড্যামেজ স্টক ও ক্লেম ম্যানেজমেন্ট' : 'DMS Damage & Claim Management'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {language === 'bn' ? 'পণ্যের ড্যামেজ এন্ট্রি, কোম্পানির রিফান্ড/রিপ্লেসমেন্ট ক্লেম ট্র্যাকিং' : 'Record product damages and manage supplier replacement/credit claims'}
                  </p>
                </div>
                {/* Action button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsNewDamageLog(true);
                    setSelectedDamageProduct({
                      id: '',
                      name: '',
                      sku: '',
                      currentStock: 0,
                      damagedStock: 0,
                      defaultPP: 0,
                      primaryUnit: 'Piece',
                      cartonSize: 24,
                      company: '',
                      categoryId: '',
                      defaultWSP: 0,
                      defaultMRP: 0,
                      createdAt: new Date().toISOString(),
                      pricePerCarton: 0,
                      pricePerPiece: 0
                    });
                    setDamageQtyInput(0);
                    setDamageNoteInput('');
                    setSelectedDamageType('broken');
                    setSelectedClaimStatus('pending');
                    setDamageMode('add');
                    setShowDamageModal(true);
                  }}
                  className="h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-none transition-all flex items-center gap-1.5 border border-red-700 cursor-pointer shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'bn' ? 'ড্যামেজ এন্ট্রি করুন' : 'Log New Damage'}</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm border-l-4 border-l-red-500">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'মোট ড্যামেজ পণ্য' : 'Total Damaged Items'}
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {damagedProducts.length}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm border-l-4 border-l-amber-500">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'মোট ড্যামেজ ইউনিট' : 'Total Damaged Units'}
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {products.reduce((sum, p) => sum + (p.damagedStock || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-none p-4 shadow-sm border-l-4 border-l-rose-650">
                <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">
                  {language === 'bn' ? 'মোট ক্ষতির মূল্য' : 'Estimated Value Loss'}
                </div>
                <div className="text-2xl font-black text-rose-600 font-mono">
                  ৳{products.reduce((sum, p) => sum + (p.damagedStock || 0) * p.defaultPP, 0).toLocaleString('en-BD')}
                </div>
              </div>
            </div>

            {/* Sub-tabs Row */}
            <div className="border-b border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDamageActiveSubTab('inventory')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  damageActiveSubTab === 'inventory'
                    ? 'border-slate-900 text-slate-900 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'সক্রিয় ড্যামেজ ইনভেন্টরি' : 'Active Damaged Stock'}
              </button>
              <button
                type="button"
                onClick={() => setDamageActiveSubTab('logs')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  damageActiveSubTab === 'logs'
                    ? 'border-slate-900 text-slate-900 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'ক্লেম এবং অ্যাডজাস্টমেন্ট লগ' : 'DMS Claims & Logs'}
              </button>
              <button
                type="button"
                onClick={() => setDamageActiveSubTab('reasons')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  damageActiveSubTab === 'reasons'
                    ? 'border-slate-900 text-slate-900 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {language === 'bn' ? 'ক্ষতির কারণ সেটআপ' : 'Damage Reasons'}
                {damageReasons.length > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] font-black bg-slate-200 text-slate-700 rounded-none">
                    {damageReasons.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB CONTENT: Active Damaged Inventory */}
            {damageActiveSubTab === 'inventory' && (
              <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wide">
                    {language === 'bn' ? 'ড্যামেজ পণ্য তালিকা' : 'Damaged Products List'}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="px-6 py-3 w-12 text-center">#</th>
                        <th className="px-6 py-3">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                        <th className="px-6 py-3">{language === 'bn' ? 'কোম্পানি' : 'Company'}</th>
                        <th className="px-6 py-3 text-center">{language === 'bn' ? 'ড্যামেজ স্টক' : 'Damaged Stock'}</th>
                        <th className="px-6 py-3 text-center">{language === 'bn' ? 'ভাল স্টক' : 'Good Stock'}</th>
                        <th className="px-6 py-3 text-right">{language === 'bn' ? 'ক্ষতির মূল্য' : 'Loss Value'}</th>
                        <th className="px-6 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {damagedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-semibold">{language === 'bn' ? 'কোনো ড্যামেজ স্টক নেই' : 'No damaged products found'}</p>
                          </td>
                        </tr>
                      ) : (
                        damagedProducts
                          .sort((a, b) => (b.damagedStock || 0) - (a.damagedStock || 0))
                          .map((product, idx) => {
                            const damageValue = (product.damagedStock || 0) * product.defaultPP;
                            return (
                              <tr key={product.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                                <td className="px-6 py-4 text-center font-mono font-bold text-slate-400">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-900 text-sm">{product.name}</div>
                                  <div className="text-xs text-slate-500 font-mono">SKU: {product.sku}</div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-semibold text-slate-700">{product.company}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-none text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                    {product.damagedStock} {product.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-emerald-700">
                                  {product.currentStock.toLocaleString()} {product.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-red-600 font-mono">
                                  ৳{damageValue.toLocaleString('en-BD')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsNewDamageLog(false);
                                      setSelectedDamageProduct(product);
                                      setDamageQtyInput(0);
                                      setDamageNoteInput('');
                                      setSelectedDamageType('broken');
                                      setSelectedClaimStatus('pending');
                                      setDamageMode('add');
                                      setShowDamageModal(true);
                                    }}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[10px] font-bold rounded-none cursor-pointer"
                                  >
                                    {language === 'bn' ? 'সমন্বয় করুন' : 'Reconcile'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveDamageToSalable(product.id)}
                                    className="mt-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-none cursor-pointer"
                                    title={language === 'bn' ? 'ড্যামেজ-কে ভাল/বিক্রয়যোগ্য স্টকে ফেরত' : 'Re-add damage to good / salable stock'}
                                  >
                                    {language === 'bn' ? '↩ স্টকে ফেরত' : '↩ Re-Use'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSettleDamage(product.id)}
                                    className="mt-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-bold rounded-none cursor-pointer"
                                    title={language === 'bn' ? 'কোম্পানি ক্লেম সেটল হয়েছে: ড্যামেজ শূন্য করুন' : 'Company claim settled: zero out damage'}
                                  >
                                    {language === 'bn' ? '✓ সেটল/বন্ধ' : '✓ Settle'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Damage Logs & Claim Status */}
            {damageActiveSubTab === 'logs' && (
              <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wide">
                    {language === 'bn' ? 'ড্যামেজ ও ক্লেম ট্রানজেকশন হিস্ট্রি' : 'Damage Claims & Logs History'}
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th className="px-5 py-3">{language === 'bn' ? 'পণ্য' : 'Product'}</th>
                        <th className="px-5 py-3 text-center">{language === 'bn' ? 'পরিমাণ (Pcs)' : 'Qty (Pcs)'}</th>
                        <th className="px-5 py-3">{language === 'bn' ? 'ড্যামেজ ধরণ' : 'Damage Type'}</th>
                        <th className="px-5 py-3">{language === 'bn' ? 'ক্লেম স্ট্যাটাস' : 'DMS Claim Status'}</th>
                        <th className="px-5 py-3">{language === 'bn' ? 'মন্তব্য' : 'Note'}</th>
                        <th className="px-5 py-3 text-right">{language === 'bn' ? 'মূল্য' : 'Est. Value'}</th>
                        <th className="px-5 py-3 text-right">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allDamageLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-semibold">{language === 'bn' ? 'কোনো ড্যামেজ লগ রেকর্ড করা হয়নি' : 'No damage logs found'}</p>
                          </td>
                        </tr>
                      ) : (
                        allDamageLogs.map((log) => {
                          const logValue = log.qty * log.price;
                          
                          // Color code for Claim Status
                          const statusColors: Record<string, string> = {
                            pending: 'bg-amber-50 text-amber-800 border-amber-200',
                            approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            written_off: 'bg-rose-50 text-rose-800 border-rose-200',
                          };
                          const resolvedStatus = log.claimStatus || 'pending';

                          // Color code for Damage Type
                          const typeLabels: Record<string, string> = {
                            broken: language === 'bn' ? 'লিকেজ ও ভাঙা' : 'Leakage / Broken',
                            expired: language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Expired Goods',
                            transit: language === 'bn' ? 'পরিবহন ক্ষতি' : 'Transit Damage',
                            pest: language === 'bn' ? 'ইঁদুর/নষ্ট' : 'Pest Spoilage',
                            other: language === 'bn' ? 'অন্যান্য' : 'Other Reason',
                          };

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors text-xs">
                              <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                                {new Date(log.recordedAt).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="font-semibold text-slate-900">{log.productName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{log.productSku} | {log.company}</div>
                              </td>
                              <td className="px-5 py-3.5 text-center font-bold font-mono text-slate-700">
                                {log.qty}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  {typeLabels[log.damageType || 'broken'] || typeLabels.broken}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                <select
                                  value={resolvedStatus}
                                  onChange={(e) => handleUpdateClaimStatus(log.productId, log.id, e.target.value)}
                                  className={`px-2.5 py-1 text-[11px] font-bold border rounded-none cursor-pointer focus:outline-none ${statusColors[resolvedStatus]}`}
                                >
                                  <option value="pending">{language === 'bn' ? 'দাবি পেন্ডিং (Pending Claim)' : 'Pending Claim'}</option>
                                  <option value="approved">{language === 'bn' ? 'অনুমোদিত ও প্রতিস্থাপিত' : 'Approved & Replaced'}</option>
                                  <option value="written_off">{language === 'bn' ? 'রাইট অফ / ক্ষতি (Written Off)' : 'Written Off'}</option>
                                </select>
                              </td>
                              <td className="px-5 py-3.5 text-slate-650 max-w-xxs truncate" title={log.note}>
                                {log.note || <span className="text-slate-400 italic">—</span>}
                              </td>
                              <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                                ৳{logValue.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDamageLog(log.productId, log.id)}
                                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-none cursor-pointer"
                                  title={language === 'bn' ? 'ড্যামেজ লগ মুছুন (স্টক অ্যাডজাস্ট হবে)' : 'Delete damage log (stock will auto-adjust)'}
                                >
                                  {language === 'bn' ? 'ডিলিট' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {damageActiveSubTab === 'reasons' && (() => {
              const handleAddReason = () => {
                const trimmed = newReasonInput.trim();
                if (!trimmed) return;
                const duplicate = damageReasons.some(r => r.name.toLowerCase() === trimmed.toLowerCase());
                if (duplicate) {
                  error(language === 'bn' ? 'বিদ্যমান' : 'Already Exists', language === 'bn' ? 'এই কারণটি ইতিমধ্যে বিদ্যমান।' : 'This reason already exists.');
                  return;
                }
                saveDamageReasons([...damageReasons, { id: `reason-${Date.now()}`, name: trimmed }]);
                setNewReasonInput('');
              };
              const handleDeleteReason = (id: string) => {
                saveDamageReasons(damageReasons.filter(r => r.id !== id));
              };
              return (
                <div className="bg-white border border-slate-200 rounded-none overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 uppercase tracking-wide">
                        {language === 'bn' ? 'ড্যামেজের কারণ পরিচালনা' : 'Damage Reason Management'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'bn'
                          ? 'এখানে নতুন কারণ যোগ করুন — লগিং মডালে ব্যবহার করা হবে'
                          : 'Define your custom damage categories — they appear in the log modal'}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">
                      {damageReasons.length} {language === 'bn' ? 'টি কারণ' : 'Reasons'}
                    </span>
                  </div>

                  {/* Add new reason input */}
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 max-w-lg">
                      <input
                        type="text"
                        value={newReasonInput}
                        onChange={e => setNewReasonInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddReason(); }}}
                        placeholder={language === 'bn' ? 'নতুন কারণের নাম লিখুন...' : 'Type a new damage reason name...'}
                        className="h-9 flex-1 rounded-none border border-slate-300 bg-white px-3 text-xs font-semibold outline-none focus:border-slate-700 focus:bg-white placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddReason}
                        disabled={!newReasonInput.trim()}
                        className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-none border border-slate-950 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {language === 'bn' ? 'যোগ করুন' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {/* Reasons list */}
                  {damageReasons.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="text-slate-300 text-4xl mb-3">📋</div>
                      <p className="font-semibold text-slate-600 text-sm">
                        {language === 'bn' ? 'এখনো কোনো কারণ যোগ করা হয়নি' : 'No damage reasons defined yet'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {language === 'bn'
                          ? 'উপরের ইনপুটে টাইপ করে "যোগ করুন" বাটনে ক্লিক করুন'
                          : 'Type a reason name above and click "Add" to get started'}
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {damageReasons.map((reason, idx) => (
                        <li key={reason.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[10px] font-bold text-slate-400 w-5 text-center">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <span className="font-semibold text-slate-800 text-xs">{reason.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteReason(reason.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-all cursor-pointer border border-transparent hover:border-rose-200"
                            title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete reason'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* MODAL: Product Setup */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleProductSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Tag className="w-4.5 h-4.5 text-slate-700" />
                {editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}
              </span>
              <button type="button" onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-800 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'এন্ট্রি তারিখ *' : 'Entry Date *'}
                </label>
                <div className="relative flex items-center rounded-none border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm focus-within:border-slate-800 focus-within:bg-white overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 px-3 bg-slate-100 border-r border-slate-200 flex items-center justify-center text-slate-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    required
                    value={prodCreatedAt}
                    onChange={e => setProdCreatedAt(e.target.value)}
                    className="h-10 w-full pl-12 pr-3.5 bg-transparent font-semibold font-mono text-xs text-slate-700 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Stock Alert Threshold */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? '⚠️ লো স্টক অ্যালার্ট সীমা (পিস)' : '⚠️ Low Stock Alert Threshold (pcs)'}
                </label>
                <div className="relative flex items-center rounded-none border border-amber-200 bg-amber-50/30 hover:bg-amber-50/60 hover:border-amber-300 transition-all duration-200 shadow-sm focus-within:border-amber-400 overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 px-3 bg-amber-50 border-r border-amber-200 flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={prodAlertThreshold}
                    onChange={e => setProdAlertThreshold(Math.max(1, Number(e.target.value)))}
                    placeholder="e.g. 50"
                    className="h-10 w-full pl-12 pr-3.5 bg-transparent font-semibold font-mono text-xs text-slate-700 outline-none"
                  />
                </div>
                <p className="text-[10px] text-amber-600 mt-1.5 font-medium">
                  {language === 'bn'
                    ? `স্টক এই সংখ্যার নিচে গেলে অ্যালার্ট দেখাবে (বর্তমান: ${prodAlertThreshold} পিস)`
                    : `Alert will show when stock drops to or below ${prodAlertThreshold} pcs`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-705">{tDir.formProductSku}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const companyPart = (prodCompany || 'GEN').slice(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
                        const namePart = (prodName || 'PD')
                          .split(/\s+/)
                          .map(w => w.charAt(0))
                          .join('')
                          .toUpperCase()
                          .slice(0, 4)
                          .replace(/[^A-Z0-9]/g, '');
                        const randomNum = Math.floor(100 + Math.random() * 900);
                        setProdSku(`${companyPart}-${namePart || 'X'}-${randomNum}`);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-bold tracking-wide uppercase cursor-pointer"
                    >
                      {language === 'bn' ? 'অটো তৈরি' : 'Auto Gen'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PRN-MJ-250"
                    value={prodSku}
                    onChange={e => setProdSku(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formProductCompany}</label>
                  <select
                    value={prodCompany}
                    onChange={e => setProdCompany(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Primary Selling Unit selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'প্রাথমিক বিক্রয় একক' : 'Primary Selling Unit'}
                </label>
                <div className="flex gap-3">
                  {(['Piece', 'Carton'] as const).map(unit => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => setProdPrimaryUnit(unit)}
                      className={`flex-1 h-10 rounded-none border-2 text-xs font-bold transition-all cursor-pointer ${
                        prodPrimaryUnit === unit
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {unit === 'Piece'
                        ? (language === 'bn' ? '🔹 পিস (Piece)' : '🔹 Piece')
                        : (language === 'bn' ? '📦 কার্টন (Carton)' : '📦 Carton')}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {prodPrimaryUnit === 'Piece'
                    ? (language === 'bn' ? 'চালান ও স্টক পিস এককে গণনা করা হবে' : 'Challan & stock will be counted in pieces')
                    : (language === 'bn' ? 'চালান ও স্টক কার্টন এককে গণনা করা হবে' : 'Challan & stock will be counted in cartons')}
                </p>
              </div>

              {/* Unit & Price Setup */}
              {prodPrimaryUnit === 'Carton' ? (
                // --- CARTON PRIMARY UNIT LAYOUT (Super Intuitive & Beautiful) ---
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-none p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                      {language === 'bn' ? '📦 কার্টন ভিত্তিক মূল্য তালিকা' : '📦 Carton-Based Pricing Setup'}
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-none font-mono">
                      1 Carton = {prodCartonSize} Pcs
                    </span>
                  </div>

                  {/* Carton Size Input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      {language === 'bn' ? '১ কার্টনে মোট পিস সংখ্যা *' : 'Total Pieces inside 1 Carton *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={prodCartonSize}
                      onChange={e => {
                        const size = Math.max(1, Number(e.target.value));
                        setProdCartonSize(size);
                        if (prodPricePerCarton > 0) {
                          setProdPricePerPiece(Number((prodPricePerCarton / size).toFixed(2)));
                        }
                      }}
                      className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                    />
                  </div>

                  {/* Pricing Rows */}
                  <div className="space-y-3.5">
                    {/* TP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'TP মূল্য (৳/কার্টন) *' : 'Wholesale Price (TP/Ctn) *'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={prodPricePerCarton}
                          onChange={e => {
                            const price = Number(e.target.value);
                            setProdPricePerCarton(price);
                            if (prodCartonSize > 0) {
                              setProdPricePerPiece(Number((price / prodCartonSize).toFixed(2)));
                            }
                          }}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-indigo-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-indigo-900 font-bold">
                          {language === 'bn' ? '➔ পিস প্রতি TP রেট:' : '➔ TP Price per Piece:'}
                        </span>
                        <span className="font-mono text-xs font-black text-indigo-700">
                          ৳ {prodPricePerPiece.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* DP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'DP ক্রয় মূল্য (৳/কার্টন)' : 'Purchase Price (DP/Ctn)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prodPP}
                          onChange={e => setProdPP(Number(e.target.value))}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-900 font-bold">
                          {language === 'bn' ? '➔ পিস প্রতি DP রেট:' : '➔ DP Price per Piece:'}
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-700">
                          ৳ {prodCartonSize > 0 ? (prodPP / prodCartonSize).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>

                    {/* MRP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'MRP বিক্রয় মূল্য (৳/কার্টন)' : 'Retail Price (MRP/Ctn)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prodMRP}
                          onChange={e => setProdMRP(Number(e.target.value))}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-amber-50/60 border border-amber-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-amber-900 font-bold">
                          {language === 'bn' ? '➔ পিস প্রতি MRP রেট:' : '➔ MRP Price per Piece:'}
                        </span>
                        <span className="font-mono text-xs font-black text-amber-700">
                          ৳ {prodCartonSize > 0 ? (prodMRP / prodCartonSize).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // --- PIECE PRIMARY UNIT LAYOUT (Super Intuitive & Beautiful) ---
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-none p-4.5 space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                      {language === 'bn' ? '🔹 পিস ভিত্তিক মূল্য তালিকা' : '🔹 Piece-Based Pricing Setup'}
                    </span>
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-none font-mono">
                      1 Carton = {prodCartonSize} Pcs
                    </span>
                  </div>

                  {/* Carton Size Input */}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      {language === 'bn' ? '১ কার্টনে মোট পিস সংখ্যা *' : 'Total Pieces inside 1 Carton *'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={prodCartonSize}
                      onChange={e => {
                        const size = Math.max(1, Number(e.target.value));
                        setProdCartonSize(size);
                        if (prodPricePerPiece > 0) {
                          setProdPricePerCarton(Number((prodPricePerPiece * size).toFixed(2)));
                        }
                      }}
                      className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                    />
                  </div>

                  <div className="space-y-3.5">
                    {/* TP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'TP মূল্য (৳/পিস) *' : 'Wholesale Price (TP/Piece) *'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={prodPricePerPiece}
                          onChange={e => {
                            const price = Number(e.target.value);
                            setProdPricePerPiece(price);
                            setProdPricePerCarton(Number((price * prodCartonSize).toFixed(2)));
                          }}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-indigo-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-indigo-900 font-bold">
                          {language === 'bn' ? '➔ কার্টন প্রতি TP রেট:' : '➔ TP Price per Carton:'}
                        </span>
                        <span className="font-mono text-xs font-black text-indigo-700">
                          ৳ {prodPricePerCarton.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* DP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'DP ক্রয় মূল্য (৳/পিস)' : 'Purchase Price (DP/Piece)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prodPP}
                          onChange={e => setProdPP(Number(e.target.value))}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-emerald-50/60 border border-emerald-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-emerald-900 font-bold">
                          {language === 'bn' ? '➔ কার্টন প্রতি DP রেট:' : '➔ DP Price per Carton:'}
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-700">
                          ৳ {prodCartonSize > 0 ? (prodPP * prodCartonSize).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>

                    {/* MRP Price Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {language === 'bn' ? 'MRP বিক্রয় মূল্য (৳/পিস)' : 'Retail Price (MRP/Piece)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={prodMRP}
                          onChange={e => setProdMRP(Number(e.target.value))}
                          className="h-10 w-full rounded-none border border-indigo-200 bg-white px-3.5 font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                        />
                      </div>
                      <div className="bg-amber-50/60 border border-amber-100 rounded-none p-2.5 h-10 flex items-center justify-between">
                        <span className="text-[10px] text-amber-900 font-bold">
                          {language === 'bn' ? '➔ কার্টন প্রতি MRP রেট:' : '➔ MRP Price per Carton:'}
                        </span>
                        <span className="font-mono text-xs font-black text-amber-700">
                          ৳ {prodCartonSize > 0 ? (prodMRP * prodCartonSize).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={`mb-2 block text-xs font-semibold ${editingProduct ? 'text-slate-400' : 'text-slate-700'}`}>
                  {language === 'bn' ? 'প্রারম্ভিক স্টক' : 'Opening Stock'} {editingProduct && `(${language === 'bn' ? 'স্টক অ্যাডজাস্টমেন্ট মডিউল থেকে পরিবর্তন করুন' : 'Change from Stock Adjustment Module'})`}
                </label>
                {editingProduct ? (
                  <input
                    type="text"
                    disabled
                    value={prodPrimaryUnit === 'Carton'
                      ? `${prodStock.toLocaleString()} Ctn`
                      : formatStock(prodStock, prodCartonSize)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-100 px-3 font-mono font-semibold outline-none text-slate-500 cursor-not-allowed"
                  />
                ) : prodPrimaryUnit === 'Carton' ? (
                  <div>
                    <label className="mb-1 block text-[10px] text-slate-500">{language === 'bn' ? 'কার্টন' : 'Cartons'}</label>
                    <input
                      type="number"
                      min="0"
                      value={prodStock}
                      onChange={e => setProdStock(Math.max(0, Number(e.target.value)))}
                      className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-[10px] text-slate-500">{language === 'bn' ? 'কার্টন' : 'Cartons'}</label>
                      <input
                        type="number"
                        min="0"
                        value={Math.floor(prodStock / prodCartonSize)}
                        onChange={e => {
                          const cartons = Math.max(0, Number(e.target.value));
                          const pieces = prodStock % prodCartonSize;
                          setProdStock(cartons * prodCartonSize + pieces);
                        }}
                        className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] text-slate-500">{language === 'bn' ? 'পিস' : 'Pieces'}</label>
                      <input
                        type="number"
                        min="0"
                        value={prodStock % prodCartonSize}
                        onChange={e => {
                          const cartons = Math.floor(prodStock / prodCartonSize);
                          const pieces = Math.max(0, Number(e.target.value));
                          setProdStock(cartons * prodCartonSize + pieces);
                        }}
                        className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-955 cursor-pointer shadow-sm">{editingProduct ? `${tCommon.edit} ${tDir.tabProducts}` : tDir.registerProduct}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: SR Setup */}
      {showSrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSrSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <UserCheck className="w-4.5 h-4.5 text-slate-750" />
                {editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}
              </span>
              <button type="button" onClick={() => setShowSrModal(false)} className="text-slate-400 hover:text-slate-850 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>



              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'কোম্পানি বরাদ্দ (শুধুমাত্র একটি)' : 'Assigned Company Brand (One Only)'}
                </label>
                <select
                  required
                  value={(() => {
                    const currentComp = srAssignedCompanies[0] || '';
                    const found = companies.find(c => c.id === currentComp || c.name.toLowerCase() === currentComp.toLowerCase());
                    return found ? found.name : currentComp;
                  })()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setSrAssignedCompanies([]);
                      return;
                    }
                    const matched = companies.find(c => c.name.toLowerCase() === val.toLowerCase() || c.id === val);
                    if (matched) {
                      setSrAssignedCompanies([matched.name, matched.id]);
                    } else {
                      setSrAssignedCompanies([val]);
                    }
                  }}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                >
                  <option value="">{language === 'bn' ? '-- একটি কোম্পানি নির্বাচন করুন --' : '-- Select One Company --'}</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <p className="mt-1.5 text-[10px] text-slate-500 italic">
                  ⚠️ {language === 'bn' ? 'প্রতিটি SR শুধুমাত্র একটি কোম্পানিতে নিযুক্ত থাকতে পারবে' : 'Each SR can only be assigned to ONE company'}
                </p>
              </div>

              {/* Custom Login Credentials */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-705">Login Username</label>
                  <input
                    type="text"
                    placeholder="e.g. selim123"
                    value={srLoginUsername}
                    onChange={e => setSrLoginUsername(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-705">Login Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={srLoginPassword}
                    onChange={e => setSrLoginPassword(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowSrModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingSr ? `${tCommon.edit} ${tDir.tabSrs}` : tDir.registerSr}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Customer Shop Setup */}
      {showShopModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleShopSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Building className="w-4.5 h-4.5 text-slate-750" />
                {editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}
              </span>
              <button type="button" onClick={() => setShowShopModal(false)} className="text-slate-400 hover:text-slate-855 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopAddress}</label>
                <input
                  type="text"
                  placeholder="e.g. Chowk Bazar Alley, Dhaka"
                  value={shopMarket}
                  onChange={e => setShopMarket(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{language === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address'}</label>
                <input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={shopEmail}
                  onChange={e => setShopEmail(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
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
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formShopRoute}</label>
                  <select
                    value={shopRouteId}
                    onChange={e => setShopRouteId(e.target.value)}
                    className="h-10 w-full rounded-none border border-slate-200 bg-white px-3 font-semibold outline-none focus:border-slate-800"
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
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Credit Limit (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={shopCreditLimit}
                    onChange={e => setShopCreditLimit(Number(e.target.value))}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-slate-705">Credit Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={shopCreditDays}
                    onChange={e => setShopCreditDays(Number(e.target.value))}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-mono font-semibold outline-none focus:border-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">Outstanding Due (BDT)</label>
                  <input
                    type="number"
                    min="0"
                    value={shopDue}
                    onChange={e => setShopDue(Number(e.target.value))}
                    className="h-10 w-full rounded-none border border-rose-250 bg-rose-50/10 px-3 font-mono font-bold text-rose-700 outline-none focus:border-rose-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowShopModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingShop ? `${tCommon.edit} ${tDir.tabShops}` : tDir.registerShop}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Company Setup */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCompanySubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Briefcase className="w-4.5 h-4.5 text-slate-750" />
                {editingCompany ? 'Edit Supplier Company' : tDir.registerCompany}
              </span>
              <button type="button" onClick={() => setShowCompanyModal(false)} className="text-slate-400 hover:text-slate-855 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyContact}</label>
                <input
                  type="text"
                  placeholder="e.g. Manager Sales Ops"
                  value={compContact}
                  onChange={e => setCompContact(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyPhone}</label>
                <input
                  type="text"
                  placeholder="e.g. 017XXXXXXXX"
                  value={compPhone}
                  onChange={e => setCompPhone(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCompanyAddress}</label>
                <input
                  type="text"
                  placeholder="e.g. Akij House, 198 Bir Uttam Mir Shawkat Sarak, Dhaka"
                  value={compAddress}
                  onChange={e => setCompAddress(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowCompanyModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingCompany ? `${tCommon.edit} Company` : 'Register Company'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Category Setup */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCategorySubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Sliders className="w-4.5 h-4.5 text-slate-750" />
                {editingCategory ? 'Edit Product Category' : tDir.registerCategory}
              </span>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-855 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formCategoryDesc}</label>
                <input
                  type="text"
                  placeholder="e.g. Cola, Lemon, Orange carbonated beverages"
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingCategory ? `${tCommon.edit} Category` : 'Create Category'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Unit Setup */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleUnitSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="w-4.5 h-4.5 text-indigo-600" />
                {editingUnit 
                  ? (language === 'bn' ? 'পরিমাপের একক পরিবর্তন করুন' : 'Edit Unit of Measure') 
                  : (language === 'bn' ? 'নতুন একক নিবন্ধন (UOM)' : tDir.registerUnit)}
              </span>
              <button type="button" onClick={() => setShowUnitModal(false)} className="text-slate-400 hover:text-slate-855 text-sm p-1 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'ইউনিটের নাম *' : 'Unit Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: Carton, Piece' : 'e.g. Carton, Piece'}
                  value={unitName}
                  onChange={e => setUnitName(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  {language === 'bn' ? 'সংক্ষিপ্ত রূপ (Short Form) *' : 'Short Form *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === 'bn' ? 'যেমন: CTN, PCS' : 'e.g. CTN, PCS'}
                  value={unitSymbol}
                  onChange={e => setUnitSymbol(e.target.value.toUpperCase())}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-mono font-semibold uppercase outline-none focus:border-slate-800 focus:bg-white"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  {language === 'bn' ? 'উদাহরণ: Carton → CTN | Piece → PCS' : 'Example: Carton → CTN  |  Piece → PCS'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowUnitModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingUnit ? `${tCommon.edit} Unit` : 'Create Unit'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Godown Setup */}
      {showGodownModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleGodownSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <HardDrive className="w-4.5 h-4.5 text-slate-750" />
                {editingGodown ? 'Edit Godown Warehouse' : tDir.registerGodown}
              </span>
              <button type="button" onClick={() => setShowGodownModal(false)} className="text-slate-400 hover:text-slate-855 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">{tDir.formGodownLocation}</label>
                <input
                  type="text"
                  placeholder="e.g. Station Road, Tongi, Gazipur"
                  value={godownLocation}
                  onChange={e => setGodownLocation(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="damage-check"
                  checked={godownIsDamage}
                  onChange={e => setGodownIsDamage(e.target.checked)}
                  className="w-4.5 h-4.5 accent-slate-900 border-slate-200 rounded-none cursor-pointer"
                />
                <label htmlFor="damage-check" className="text-xs font-semibold text-slate-705 cursor-pointer">
                  {tDir.formGodownIsDamage}
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowGodownModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingGodown ? `${tCommon.edit} Godown` : 'Create Godown'}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Route Setup */}
      {showRouteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRouteSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Compass className="w-4.5 h-4.5 text-slate-750" />
                {editingRoute ? 'Edit Sales Beat Route' : tDir.registerRoute}
              </span>
              <button type="button" onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-855 cursor-pointer">✕</button>
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
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
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
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
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
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Assigned SR Selection Dropdown */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'দায়িত্বপ্রাপ্ত এসআর (Sales Officer)' : 'Assigned Sales Officer (SR)'}
                </label>
                <select
                  value={routeAssignedSR}
                  onChange={e => setRouteAssignedSR(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white cursor-pointer"
                >
                  <option value="">{language === 'bn' ? '-- কোনো এসআর নেই --' : '-- No SR Assigned --'}</option>
                  {srs.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowRouteModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">{editingRoute ? `${tCommon.edit} Route` : 'Create Route'}</button>
            </div>
          </form>
        </div>
      )}
      {/* MODAL: Damage Adjust */}
      {showDamageModal && selectedDamageProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDamageSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-805 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
                {language === 'bn' ? 'ড্যামেজ স্টক সমন্বয়' : 'Reconcile Damage Stock'}
              </span>
              <button type="button" onClick={() => setShowDamageModal(false)} className="text-slate-400 hover:text-slate-805 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Product selection dropdown or label */}
              {isNewDamageLog ? (
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-705">
                    {language === 'bn' ? 'পণ্য নির্বাচন করুন *' : 'Select Product *'}
                  </label>
                  <select
                    required
                    value={selectedDamageProduct.id || ''}
                    onChange={e => {
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) setSelectedDamageProduct(prod);
                    }}
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                  >
                    <option value="" disabled>{language === 'bn' ? '-- পণ্য সিলেক্ট করুন --' : '-- Select Product --'}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-none border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase">{language === 'bn' ? 'পণ্য' : 'Product'}</span>
                  <span className="font-semibold text-slate-800 text-xs block">{selectedDamageProduct.name}</span>
                  <span className="font-mono text-[10px] text-slate-500 block uppercase">SKU: {selectedDamageProduct.sku}</span>
                </div>
              )}

              {/* Previously recorded damage (only show if product is selected and has previous damage) */}
              {selectedDamageProduct.id && (selectedDamageProduct.damagedStock || 0) > 0 && (
                <div className="bg-amber-50 rounded-none border border-amber-200 p-3 text-[11px] text-amber-800">
                  <div className="font-semibold">
                    {language === 'bn' ? 'পুরাতন রেকর্ডকৃত ড্যামেজ' : 'Previously recorded damage'}
                  </div>
                  <div className="font-mono font-black mt-1">
                    {(selectedDamageProduct.damagedStock || 0).toLocaleString()} {selectedDamageProduct.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}
                  </div>
                </div>
              )}

              {/* Damage Type Dropdown */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'ড্যামেজের ধরণ *' : 'Damage Type *'}
                </label>
                {damageReasons.length === 0 ? (
                  <div className="h-10 w-full flex items-center gap-2 rounded-none border border-amber-300 bg-amber-50 px-3 text-xs text-amber-700 font-semibold">
                    <span>⚠</span>
                    <span>
                      {language === 'bn'
                        ? '"ড্যামেজের কারণ সেটআপ" ট্যাব থেকে প্রথমে কারণ যোগ করুন'
                        : 'Go to "Damage Reasons" tab to add categories first'}
                    </span>
                  </div>
                ) : (
                  <select
                    value={selectedDamageType}
                    onChange={e => setSelectedDamageType(e.target.value)}
                    required
                    className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white text-xs"
                  >
                    <option value="">{language === 'bn' ? '-- কারণ বেছে নিন --' : '-- Select a reason --'}</option>
                    {damageReasons.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Claim Status Dropdown */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'ক্লেম স্ট্যাটাস *' : 'DMS Claim Status *'}
                </label>
                <select
                  value={selectedClaimStatus}
                  onChange={e => setSelectedClaimStatus(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                >
                  <option value="pending">{language === 'bn' ? 'দাবি পেন্ডিং (Pending Claim)' : 'Pending Claim'}</option>
                  <option value="approved">{language === 'bn' ? 'অনুমোদিত ও প্রতিস্থাপিত' : 'Approved & Replaced'}</option>
                  <option value="written_off">{language === 'bn' ? 'রাইট অফ / ক্ষতি (Written Off)' : 'Written Off'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-none border border-slate-200 bg-white p-2">
                <button type="button" onClick={() => setDamageMode('add')} className={`rounded-none px-3 py-2 text-xs font-semibold transition-colors ${damageMode === 'add' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                  {language === 'bn' ? 'যোগ করুন' : 'Add to existing'}
                </button>
                <button type="button" onClick={() => setDamageMode('set')} className={`rounded-none px-3 py-2 text-xs font-semibold transition-colors ${damageMode === 'set' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                  {language === 'bn' ? 'শেষ মান নির্ধারণ করুন' : 'Set final total'}
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {damageMode === 'add' ? (language === 'bn' ? 'কতটি নতুন ড্যামেজ যোগ করবেন *' : 'How many new damaged units to add *') : (language === 'bn' ? 'ড্যামেজের শেষ মোট পরিমাণ *' : 'Final damage total to set *')}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={damageQtyInput}
                  onChange={e => setDamageQtyInput(Number(e.target.value))}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />

                {/* Auto calculation helper box */}
                {selectedDamageProduct && (
                  <div className="mt-2.5 p-3 rounded-none bg-indigo-50/70 border border-indigo-100 space-y-1">
                    {(() => {
                      const cSize = selectedDamageProduct.cartonSize || 24;
                      const ctns = Math.floor(damageQtyInput / cSize);
                      const pcs = damageQtyInput % cSize;
                      const pPrice = selectedDamageProduct.pricePerPiece || (selectedDamageProduct.pricePerCarton ? selectedDamageProduct.pricePerCarton / cSize : selectedDamageProduct.defaultWSP);
                      const lossVal = damageQtyInput * pPrice;

                      return (
                        <>
                          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                            <span>
                              {language === 'bn' ? 'হিসাবকৃত পরিমাণ:' : 'Calculated Quantity:'}
                            </span>
                            <span className="font-mono text-indigo-700">
                              {cSize > 1 
                                ? (ctns > 0 && pcs > 0
                                    ? `${ctns} Cartons & ${pcs} Pieces (${damageQtyInput} Pcs Total)`
                                    : ctns > 0
                                    ? `${ctns} Cartons (${damageQtyInput} Pcs Total)`
                                    : `${pcs} Pieces`)
                                : `${damageQtyInput} Units`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700">
                            <span>{language === 'bn' ? 'আনুমানিক ক্ষতি (Loss):' : 'Est. Loss Valuation:'}</span>
                            <span className="font-mono font-bold text-rose-600">৳ {lossVal.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Quick Add Buttons */}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setDamageQtyInput(prev => prev + 1)} className="rounded-none border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm transition-all cursor-pointer">
                    +1 Pc
                  </button>
                  <button type="button" onClick={() => setDamageQtyInput(prev => prev + 5)} className="rounded-none border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm transition-all cursor-pointer">
                    +5 Pcs
                  </button>
                  {selectedDamageProduct && (selectedDamageProduct.cartonSize || 24) > 1 && (
                    <button type="button" onClick={() => setDamageQtyInput(prev => prev + (selectedDamageProduct.cartonSize || 24))} className="rounded-none border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 shadow-sm transition-all cursor-pointer">
                      +1 Ctn (+{selectedDamageProduct.cartonSize || 24} Pcs)
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-705">
                  {language === 'bn' ? 'নোট (ঐচ্ছিক)' : 'Note (optional)'}
                </label>
                <input
                  type="text"
                  value={damageNoteInput}
                  onChange={e => setDamageNoteInput(e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: রেসিডিউ, ট্রান্সপোর্ট, ...' : 'e.g. transit, spoilage, ...'}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              {/* Deduct checkbox */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="deduct-salable-check"
                  checked={deductFromSalable}
                  onChange={e => setDeductFromSalable(e.target.checked)}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded-none focus:ring-slate-900 cursor-pointer"
                />
                <label htmlFor="deduct-salable-check" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  {language === 'bn' ? 'বিক্রয়যোগ্য স্টক থেকে কর্তন করুন' : 'Deduct difference from salable stock'}
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowDamageModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">
                {language === 'bn' ? 'সমন্বয় সম্পন্ন করুন' : 'Confirm Adjust'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* MODAL: Delivery Man Setup */}
      {showDmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDmSubmit} className="bg-white rounded-none border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Truck className="w-4.5 h-4.5 text-slate-750" />
                {editingDm ? (language === 'bn' ? 'ডেলিভারি ম্যান তথ্য সংশোধন' : 'Edit Delivery Agent') : (language === 'bn' ? 'নতুন ডেলিভারি ম্যান যোগ করুন' : 'Add Delivery Agent')}
              </span>
              <button type="button" onClick={() => setShowDmModal(false)} className="text-slate-400 hover:text-slate-850 cursor-pointer">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{language === 'bn' ? 'ডেলিভারি ম্যানের নাম *' : 'Delivery Agent Name *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sujon Mia"
                  value={dmName}
                  onChange={e => setDmName(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{language === 'bn' ? 'যানবাহন বিবরণ (যেমনঃ Covered Van - ১২৩৪) *' : 'Vehicle Details (e.g. Covered Van - 1234) *'}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Covered Van (Dhaka-Metro-1234)"
                  value={dmVehicle}
                  onChange={e => setDmVehicle(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{language === 'bn' ? 'ফোন নাম্বার' : 'Contact Phone Number'}</label>
                <input
                  type="text"
                  placeholder="e.g. 01711998877"
                  value={dmPhone}
                  onChange={e => setDmPhone(e.target.value)}
                  className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 px-3.5 font-semibold outline-none focus:border-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-750">{language === 'bn' ? 'দায়িত্বপ্রাপ্ত কোম্পানি সমূহ' : 'Assigned Companies'}</label>
                <div className="space-y-2 border border-slate-200 bg-slate-50 p-3 rounded-none max-h-36 overflow-y-auto">
                  {companies.map(comp => {
                    const isChecked = dmAssignedCompanies.some(c => c === comp.name || c === comp.id || c.toLowerCase() === comp.name.toLowerCase());
                    return (
                      <label key={comp.id} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setDmAssignedCompanies(prev => Array.from(new Set([...prev, comp.name])));
                            } else {
                              setDmAssignedCompanies(prev => prev.filter(c => c !== comp.name && c !== comp.id && c.toLowerCase() !== comp.name.toLowerCase()));
                            }
                          }}
                          className="w-4 h-4 rounded-none text-slate-900 focus:ring-slate-400"
                        />
                        {comp.name}
                      </label>
                    );
                  })}
                  {companies.length === 0 && (
                    <p className="text-slate-400 italic text-[11px]">{language === 'bn' ? 'কোনো কোম্পানি যুক্ত করা হয়নি' : 'No companies available'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-2.5 bg-slate-50/50">
              <button type="button" onClick={() => setShowDmModal(false)} className="px-4 py-2.5 rounded-none border border-slate-300 bg-white text-slate-750 hover:bg-slate-50 font-semibold cursor-pointer">{tCommon.cancel}</button>
              <button type="submit" className="px-4.5 py-2.5 rounded-none bg-slate-900 text-white font-semibold hover:bg-slate-800 border border-slate-950 cursor-pointer shadow-sm">
                {editingDm ? (language === 'bn' ? 'সংশোধন করুন' : 'Save Changes') : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Agent')}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
