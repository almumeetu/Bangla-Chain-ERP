'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Calendar,
  Search, 
  RotateCcw, 
  Download, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  PlusCircle,
  TrendingUp,
  User,
  ShoppingBag,
  Users,
  Printer,
  Pencil,
  Building,
  Mail
} from 'lucide-react';
import { ChallanItem, SR, Route, DeliveryMan, Product, ProductAttribute, CompanyBrand } from '../types';
import { translations, Language } from '../translations';
import { printChallanInvoice, printChallanSheet } from '../lib/printUtils';
import { sendInvoiceEmail } from '../lib/db';
import { Customer } from '../lib/localStore';
import { formatProductStock } from '../lib/productUtils';

export interface GroupedOrder {
  id: string;
  items: ChallanItem[];
  createdAt: string;
  srName: string;
  routeName: string;
  deliveryManName: string;
  customerName?: string;
  status: 'Pending' | 'Shipped' | 'Delivered';
  totalAmount: number;
  totalQty: number;
  itemCount: number;
}

interface ChallanModuleProps {
  challans: ChallanItem[];
  setChallans: React.Dispatch<React.SetStateAction<ChallanItem[]>>;
  srs: SR[];
  routes: Route[];
  deliveryMen: DeliveryMan[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  attributes: ProductAttribute[];
  language: Language;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  companies?: CompanyBrand[];
}

export default function ChallanModule({
  challans,
  setChallans,
  srs,
  routes,
  deliveryMen,
  products,
  setProducts,
  attributes,
  language,
  customers,
  setCustomers,
  companies = []
}: ChallanModuleProps) {
  const tCommon = translations[language].common;
  const tChallan = translations[language].challan;
  const tDash = translations[language].dashboard;

  // Search & Filters State
  const [filterCompany, setFilterCompany] = useState('');
  const [filterSR, setFilterSR] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDeliveryMan, setFilterDeliveryMan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active searched filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedCompany, setAppliedCompany] = useState('');
  const [appliedSR, setAppliedSR] = useState('');
  const [appliedRoute, setAppliedRoute] = useState('');
  const [appliedDeliveryMan, setAppliedDeliveryMan] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  // All available companies extracted from prop, products, and challans
  const availableCompanies = React.useMemo(() => {
    const coSet = new Set<string>();
    (companies || []).forEach(c => { if (c.name) coSet.add(c.name); });
    (products || []).forEach(p => { if (p.company) coSet.add(p.company); });
    (challans || []).forEach(c => { if (c.company) coSet.add(c.company); });
    return Array.from(coSet).filter(Boolean).sort();
  }, [companies, products, challans]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Status Tab selection
  const [selectedStatusTab, setSelectedStatusTab] = useState<'All' | 'Pending' | 'Shipped' | 'Delivered'>('Pending');

  // Selected Order for detailed view modal
  const [viewingOrder, setViewingOrder] = useState<GroupedOrder | null>(null);

  // Settlement modal states
  const [settlementOrder, setSettlementOrder] = useState<GroupedOrder | null>(null);
  const [settlementStatus, setSettlementStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');
  const [settlementQuantities, setSettlementQuantities] = useState<Record<string, {
    returned: number;
    damaged: number;
    returnedCartons: number;
    returnedPcs: number;
    damagedCartons: number;
    damagedPcs: number;
  }>>({});
  const [settlementSRCommValue, setSettlementSRCommValue] = useState<number>(0);
  const [settlementExtraCommValue, setSettlementExtraCommValue] = useState<number>(0);
  const [settlementDSRCommRate, setSettlementDSRCommRate] = useState<number>(0);

  // New Challan Creation Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const [selectedCompany, setSelectedCompany] = useState(''); // Selected brand for the Challan (e.g. Pran, Olympic, Haque)
  const [newChallanItems, setNewChallanItems] = useState<{
    id: string;
    productName: string;
    attribute: string;
    qty: number;
    bonusQty: number;
    rate: number;
  }[]>([]);

  // Current product selection in creation sub-form
  const [newProduct, setNewProduct] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  const [newQty, setNewQty] = useState<number>(10);
  const [newBonusQty, setNewBonusQty] = useState<number>(0);

  const [newCommissionAmount, setNewCommissionAmount] = useState<number>(0);
  const [newExtraProfitAmount, setNewExtraProfitAmount] = useState<number>(0);
  const [newSR, setNewSR] = useState('');
  const [newRoute, setNewRoute] = useState('');
  const [newDeliveryMan, setNewDeliveryMan] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');

  const filteredCustomersForNewChallan = React.useMemo(() => {
    if (!newRoute) return customers || [];
    const rObj = routes.find(r => r.name === newRoute);
    if (!rObj) return customers || [];
    const filtered = (customers || []).filter(c => c.routeId === rObj.id);
    return filtered.length > 0 ? filtered : (customers || []);
  }, [newRoute, customers, routes]);

  React.useEffect(() => {
    if (newCustomerName && !filteredCustomersForNewChallan.some(c => c.name === newCustomerName)) {
      setNewCustomerName('');
    }
  }, [filteredCustomersForNewChallan, newCustomerName]);

  const executeTransaction = (
    operations: () => {
      products: Product[];
      customers: Customer[];
      challans: ChallanItem[];
    }
  ) => {
    try {
      const result = operations();
      setProducts(result.products);
      setCustomers(result.customers);
      setChallans(result.challans);
    } catch (error: any) {
      showToast(language === 'bn' 
        ? `লেনদেন ব্যর্থ হয়েছে এবং পরিবর্তনগুলি বাতিল করা হয়েছে: ${error.message}` 
        : `Transaction failed and changes rolled back: ${error.message}`,
        'error'
      );
      throw error;
    }
  };

  const updateNewChallanItemQty = (itemId: string, delta: number) => {
    setNewChallanItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    }));
  };

  const updateNewChallanItemBonusQty = (itemId: string, delta: number) => {
    setNewChallanItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, bonusQty: Math.max(0, item.bonusQty + delta) };
      }
      return item;
    }));
  };

  const filteredSrsForNewChallan = React.useMemo(() => {
    if (!selectedCompany) return srs;
    return srs.filter(sr => {
      return sr.assignedCompanyIds?.some(cid => {
        const isIdMatch = (cid === 'comp-1' && selectedCompany.toLowerCase() === 'pran') ||
                          (cid === 'comp-2' && selectedCompany.toLowerCase() === 'olympic') ||
                          (cid === 'comp-3' && selectedCompany.toLowerCase() === 'haque');
        return isIdMatch || cid.toLowerCase() === selectedCompany.toLowerCase();
      });
    });
  }, [selectedCompany, srs]);

  // Editing state for Grouped Order
  const [editingOrder, setEditingOrder] = useState<GroupedOrder | null>(null);
  const [editOrderItems, setEditOrderItems] = useState<ChallanItem[]>([]);
  const [editSR, setEditSR] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editDeliveryMan, setEditDeliveryMan] = useState('');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');
  const [editModeEnabled, setEditModeEnabled] = useState(false);

  // Filter SRs for the edit modal based on the company of the order's products
  const filteredSrsForEdit = React.useMemo(() => {
    const orderCompany = (editingOrder && editOrderItems.length > 0)
      ? products.find(p => p.name === editOrderItems[0].productName)?.company 
      : null;
    if (!orderCompany) return srs;
    const comp = companies.find(c => 
      c.name.toLowerCase().includes(orderCompany.toLowerCase()) ||
      orderCompany.toLowerCase().includes(c.name.toLowerCase())
    );
    if (!comp) return srs;
    return srs.filter(sr => (sr.assignedCompanyIds || []).some(cid => cid === comp.id || cid.toLowerCase() === comp.name.toLowerCase()));
  }, [editingOrder, editOrderItems, srs, products, companies]);

  // Auto-reset editSR if not in company's SR list
  React.useEffect(() => {
    if (editingOrder && filteredSrsForEdit.length > 0) {
      const exists = filteredSrsForEdit.some(sr => sr.name === editSR);
      if (!exists) {
        setEditSR(filteredSrsForEdit[0].name);
      }
    }
  }, [editingOrder, filteredSrsForEdit, editSR]);

  // Filter application
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
    setAppliedCompany(filterCompany);
    setAppliedSR(filterSR);
    setAppliedRoute(filterRoute);
    setAppliedDeliveryMan(filterDeliveryMan);
    setAppliedStatus(filterStatus);
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setSearchQuery('');
    setFilterCompany('');
    setFilterSR('');
    setFilterRoute('');
    setFilterDeliveryMan('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    setAppliedSearch('');
    setAppliedCompany('');
    setAppliedSR('');
    setAppliedRoute('');
    setAppliedDeliveryMan('');
    setAppliedStatus('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setSelectedStatusTab('Pending');
    setCurrentPage(1);
  };

  // 1. Group data first
  const groupedData = React.useMemo(() => {
    const map = new Map<string, GroupedOrder>();
    challans.forEach(item => {
      // Create a unique key per "Order" using createdAt, SR, Route, Delivery Man, and Customer Name
      // This groups items created at the exact same moment for the same customer.
      const key = `${item.createdAt}_${item.srName}_${item.routeName}_${item.deliveryManName}_${item.customerName || 'WalkIn'}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          items: [],
          createdAt: item.createdAt,
          srName: item.srName,
          routeName: item.routeName,
          deliveryManName: item.deliveryManName,
          customerName: item.customerName,
          status: item.status,
          totalAmount: 0,
          totalQty: 0,
          itemCount: 0
        });
      }
      const g = map.get(key)!;
      g.items.push(item);
      g.totalAmount += item.totalAmount;
      g.totalQty += item.totalQty;
      g.itemCount += 1;
    });
    // Sort descending by date
    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [challans]);

  // Filtered dataset on Groups
  const filteredOrders = groupedData.filter((group) => {
    const matchesSearch = appliedSearch 
      ? group.items.some(i => i.productName.toLowerCase().includes(appliedSearch.toLowerCase())) ||
        group.items.some(i => i.attribute.toLowerCase().includes(appliedSearch.toLowerCase()))
      : true;

    const matchesCompany = appliedCompany
      ? group.items.some(i => {
          const itemCo = i.company || products.find(p => p.name === i.productName)?.company || '';
          return itemCo.toLowerCase() === appliedCompany.toLowerCase();
        })
      : true;

    const matchesSR = appliedSR ? group.srName === appliedSR : true;
    const matchesRoute = appliedRoute ? group.routeName === appliedRoute : true;
    const matchesDeliveryMan = appliedDeliveryMan ? group.deliveryManName === appliedDeliveryMan : true;
    
    // Status tab filter
    const matchesStatus = selectedStatusTab === 'All' ? true : group.status === selectedStatusTab;

    const groupDateStr = group.createdAt.slice(0, 10);
    const matchesStartDate = appliedStartDate ? groupDateStr >= appliedStartDate : true;
    const matchesEndDate = appliedEndDate ? groupDateStr <= appliedEndDate : true;

    return matchesSearch && matchesCompany && matchesSR && matchesRoute && matchesDeliveryMan && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Native Sliced Pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Flat list of filtered ChallanItems
  const filteredChallans = React.useMemo(() => {
    return filteredOrders.flatMap(o => o.items);
  }, [filteredOrders]);

  // Order settlement calculations
  const settlement = React.useMemo(() => {
    if (!viewingOrder) return null;
    
    let totalDispatchedValue = 0;
    let totalDispatchedQty = 0;
    
    // SPEC COMPLIANT: totalSold = Net Market Collection basis = dispatched − returned   (damage NOT subtracted)
    // Damage is tracked separately via the Damage card (Claim from Company) and never
    // reduces the sales-register figures.
    let totalSoldQty = 0;
    let totalSoldValue = 0;
    
    let totalReturnedQty = 0;
    let totalReturnedValue = 0;
    
    let totalDamagedQty = 0;
    let totalDamagedValue = 0;
    
    let totalCommission = 0;
    
    viewingOrder.items.forEach(item => {
      const rate = item.rate || 0;
      const dispatchedQty = item.qty || 0;
      const dispatchedValue = dispatchedQty * rate;
      
      totalDispatchedQty += dispatchedQty;
      totalDispatchedValue += dispatchedValue;
      
      const returned = item.returnedQty || 0;
      const returnedVal = returned * rate;
      totalReturnedQty += returned;
      totalReturnedValue += returnedVal;
      
      const damaged = item.damagedQty || 0;
      const damagedVal = damaged * rate;
      totalDamagedQty += damaged;
      totalDamagedValue += damagedVal;
      
      // Sold Qty = Dispatched − Returned (Dispatched stock sold in full; damage from market is tracked separately)
      const sold = Math.max(0, dispatchedQty - returned);
      const soldVal = sold * rate;
      totalSoldQty += sold;
      totalSoldValue += soldVal;
      
      totalCommission += item.commissionAmount || 0;
    });

    const srCommRateDisplay = language === 'bn' ? 'নির্ধারিত মূল্য' : 'Fixed Price';

    // No auto commission — all deductions start at 0, entered manually during settlement
    const srCommission = 0;
    const dmCommRate = 0;
    const deliveryManPay = 0;

    const totalNetValue = totalSoldValue - totalDamagedValue - totalCommission;
    const netToOwner = totalNetValue;

    return {
      totalDispatchedQty,
      totalDispatchedValue,
      totalSoldQty,
      totalSoldValue,
      totalReturnedQty,
      totalReturnedValue,
      totalDamagedQty,
      totalDamagedValue,
      totalCommission,
      totalNetValue,
      srCommRate: srCommRateDisplay,
      srCommission,
      dmCommRate,
      deliveryManPay,
      netToOwner
    };
  }, [viewingOrder, srs, language]);

  // Dynamic settlement calculation for the transition modal
  const transitionSettlement = React.useMemo(() => {
    if (!settlementOrder) return null;
    
    let totalDispatchedValue = 0;
    let totalDispatchedQty = 0;
    
    let totalSoldQty = 0;
    let totalSoldValue = 0;
    
    let totalReturnedQty = 0;
    let totalReturnedValue = 0;
    
    let totalDamagedQty = 0;
    let totalDamagedValue = 0;
    
    let totalCommission = 0;
    let totalNetValue = 0;
    
    settlementOrder.items.forEach(item => {
      const rate = item.rate || 0;
      const dispatchedQty = item.qty || 0;
      const dispatchedValue = dispatchedQty * rate;
      
      totalDispatchedQty += dispatchedQty;
      totalDispatchedValue += dispatchedValue;
      
      const qUpdates = settlementQuantities[item.id] || { returned: 0, damaged: 0, returnedCartons: 0, returnedPcs: 0, damagedCartons: 0, damagedPcs: 0 };
      const returned = Number(qUpdates.returned) || 0;
      const returnedVal = returned * rate;
      totalReturnedQty += returned;
      totalReturnedValue += returnedVal;
      
      const damaged = Number(qUpdates.damaged) || 0;
      const damagedVal = damaged * rate;
      totalDamagedQty += damaged;
      totalDamagedValue += damagedVal;
      
      // Sold Qty = Dispatched Qty − Returned Qty (Dispatched goods are delivered/sold; damage from market does NOT decrease sold quantity)
      const sold = Math.max(0, dispatchedQty - returned);
      const soldVal = sold * rate;
      totalSoldQty += sold;
      totalSoldValue += soldVal;
      
      totalCommission += item.commissionAmount || 0;
      
      // Market Cash Receivable = (Dispatched Qty − Returned Qty − Damaged Qty) × Rate − Commission
      // (SR collects cash for delivered units minus damage value from market)
      const itemNet = ((dispatchedQty - returned - damaged) * rate) - (item.commissionAmount || 0);
      totalNetValue += itemNet;
    });

    const srCommission = Number(settlementSRCommValue) || 0;
    const extraProfit = Number(settlementExtraCommValue) || 0;  // Extra Profit ADDS to owner
    const dsrCommission = Number(settlementDSRCommRate) || 0;   // DSR fixed commission deducted

    const srCommRateDisplay = language === 'bn' ? 'নির্ধারিত মূল্য' : 'Fixed Price';

    // No auto commission — all deductions start at 0, entered manually during settlement
    const dmCommRate = 0;
    const deliveryManPay = 0;

    // Formula: netToOwner = netMarketCollection - srCommission - dsrCommission - deliveryManPay + extraProfit
    const netToOwner = totalNetValue - srCommission - dsrCommission - deliveryManPay + extraProfit;

    return {
      totalDispatchedQty,
      totalDispatchedValue,
      totalSoldQty,
      totalSoldValue,
      totalReturnedQty,
      totalReturnedValue,
      totalDamagedQty,
      totalDamagedValue,
      totalCommission,
      totalNetValue,
      srCommRate: srCommRateDisplay,
      srCommission,
      extraProfit,
      dsrCommission,
      dmCommRate,
      deliveryManPay,
      netToOwner
    };
  }, [settlementOrder, settlementQuantities, srs, settlementSRCommValue, settlementExtraCommValue, settlementDSRCommRate, language]);

  // Auto-fill price or get default wholesale price for selected product
  const getProductWSP = (prodName: string) => {
    const prod = products.find(p => p.name === prodName);
    return prod ? prod.defaultWSP : 200; // fallback BDT 200
  };

  // Create Challan Handler
  const handleCreateChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (newChallanItems.length === 0) {
      showToast(language === 'bn' ? 'অনুগ্রহ করে কমপক্ষে একটি পণ্য যোগ করুন' : 'Please add at least one product.', 'error');
      return;
    }
    if (!newSR || !newRoute || !newDeliveryMan) {
      showToast(
        language === 'bn' 
          ? 'অনুগ্রহ করে সব প্রয়োজনীয় ঘর পূরণ করুন (এসআর, রুট এবং ডেলিভারিম্যান)' 
          : 'Please fill out all required fields (SR, Route, and Delivery Man)', 
        'error'
      );
      return;
    }


    const createdAt = new Date().toISOString();
    const totalGross = newChallanItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    const challanComm = Number(newCommissionAmount) || 0;
    const challanExtraProfit = Number(newExtraProfitAmount) || 0;

    const srObj = srs.find(s => s.name === newSR);
    // No auto commission rate — all commission is entered manually
    const commissionRate = 0;

    const newItemsList: ChallanItem[] = newChallanItems.map((item, index) => {
      const baseAmount = item.qty * item.rate;
      const share = totalGross > 0 ? baseAmount / totalGross : 0;
      const itemComm = challanComm * share;
      const itemExtraProfit = challanExtraProfit * share;
      const totalAmount = baseAmount - itemComm + itemExtraProfit;
      const srCommissionAmount = 0; // No auto SR commission

      const prodObj = products.find(p => p.name === item.productName);
      const company = prodObj ? prodObj.company : selectedCompany || 'Pran';

      return {
        id: `ch-${Date.now()}-${index}`,
        productName: item.productName,
        company,
        attribute: item.attribute || 'None',
        qty: item.qty,
        bonusQty: item.bonusQty,
        totalQty: item.qty + item.bonusQty,
        rate: item.rate,
        totalAmount,
        srName: newSR,
        routeName: newRoute,
        deliveryManName: newDeliveryMan,
        status: newStatus,
        returnedQty: 0,
        damagedQty: 0,
        commissionAmount: itemComm,
        extraProfitAmount: itemExtraProfit,
        extraCommissionAmount: itemExtraProfit, // for backward compatibility
        createdAt,
        customerId: customers.find(c => c.name === newCustomerName)?.id,
        customerName: newCustomerName,
        srCommissionType: 'Fixed',
        srCommissionValue: commissionRate,
        srCommissionAmount
      };
    });

    let tempProducts = [...products];
    let tempCustomers = [...customers];
    let tempChallans = [...challans];

    try {
      executeTransaction(() => {
        if (newStatus === 'Delivered') {
          newItemsList.forEach(item => {
            const totalQty = item.qty + item.bonusQty;
            tempProducts = tempProducts.map(p => {
              if (p.name === item.productName) {
                const currentStock = p.currentStock - totalQty;
                if (currentStock < 0) {
                  throw new Error(language === 'bn'
                    ? `স্টক পর্যাপ্ত নয়! "${p.name}" পণ্যটির বর্তমানে মাত্র ${p.currentStock} টি স্টক আছে, কিন্তু আপনি ${totalQty} টি ডেলিভারি করার চেষ্টা করছেন (কমতি আছে: ${Math.abs(currentStock)} টি)। সমাধান: অনুগ্রহ করে প্রথমে প্রোডাক্টটির নতুন স্টক এন্ট্রি (Purchase/Procure) করুন, অথবা চালানের পরিমাণ কমিয়ে দিন।`
                    : `Insufficient stock! Product "${p.name}" only has ${p.currentStock} units in stock, but you are trying to deliver ${totalQty} units (Deficit: ${Math.abs(currentStock)} units). Solution: Please procure/receive more stock for this product first, or reduce the quantity in the challan.`
                  );
                }
                return { ...p, currentStock };
              }
              return p;
            });
          });

          const cust = tempCustomers.find(c => c.name === newCustomerName);
          if (cust) {
            const invoiceTotal = newItemsList.reduce((sum, item) => sum + item.totalAmount, 0);
            cust.due = (cust.due || 0) + invoiceTotal;
          }
        }
        tempChallans = [...newItemsList, ...tempChallans];
        return { products: tempProducts, customers: tempCustomers, challans: tempChallans };
      });

      setShowAddModal(false);
      setNewChallanItems([]);
      setSelectedCompany('');
      setNewProduct('');
      setNewAttribute('');
      setNewQty(10);
      setNewBonusQty(0);
      setNewCommissionAmount(0);
      setNewExtraProfitAmount(0);
      setNewSR('');
      setNewRoute('');
      setNewDeliveryMan('');
      setNewCustomerName('');
      setNewStatus('Pending');
    } catch (err) {
      // executeTransaction already alerts the user
    }
  };

  const handleGroupStatusChange = (groupId: string, newStatus: 'Pending' | 'Shipped' | 'Delivered') => {
    const group = groupedData.find(g => g.id === groupId);
    if (!group) return;

    if (newStatus === 'Shipped' || newStatus === 'Pending') {
      const msg = newStatus === 'Shipped'
        ? (language === 'bn' ? 'আপনি কি এই চালানের স্থিতি "Shipped" করতে চান?' : 'Are you sure you want to mark this challan as Shipped?')
        : (language === 'bn' ? 'আপনি কি এই চালানের স্থিতি "Pending" এ ফেরত নিতে চান?' : 'Are you sure you want to revert this challan to Pending?');
      
      if (!confirm(msg)) return;

      let tempProducts = [...products];
      let tempCustomers = [...customers];
      let tempChallans = [...challans];

      try {
        executeTransaction(() => {
          const itemIds = group.items.map(i => i.id);
          const wasDelivered = group.status === 'Delivered';

          if (wasDelivered) {
            // Restore product stock back
            group.items.forEach(oldItem => {
              tempProducts = tempProducts.map(p => {
                if (p.name === oldItem.productName) {
                  const restoredStock = oldItem.qty + (oldItem.bonusQty || 0) - (oldItem.returnedQty || 0);
                  const restoredDamage = oldItem.damagedQty || 0;
                  return {
                    ...p,
                    currentStock: p.currentStock + restoredStock,
                    damagedStock: Math.max(0, (p.damagedStock || 0) - restoredDamage)
                  };
                }
                return p;
              });
            });

            // Restore customer due
            const targetCustomerName = group.items[0]?.customerName;
            const customer = tempCustomers.find(cust => cust.name === targetCustomerName);
            if (customer) {
              const oldTotal = group.items.reduce((sum, item) => sum + item.totalAmount, 0);
              customer.due = Math.max(0, (customer.due || 0) - oldTotal);
            }
          }

          // Update status & reset settlement fields for all items in the group
          tempChallans = tempChallans.map(c => {
            if (itemIds.includes(c.id)) {
              return {
                ...c,
                status: newStatus,
                returnedQty: 0,
                damagedQty: 0,
                returnedCartons: 0,
                returnedPcs: 0,
                damagedCartons: 0,
                damagedPcs: 0,
                commissionAmount: 0,
                extraCommissionAmount: 0,
                srCommissionAmount: 0,
                totalAmount: c.qty * c.rate
              };
            }
            return c;
          });

          return { products: tempProducts, customers: tempCustomers, challans: tempChallans };
        });

        // Sync view state if drawer is open
        if (viewingOrder && viewingOrder.id === groupId) {
          setViewingOrder(prev => {
            if (!prev) return null;
            const updatedItems = prev.items.map(item => ({
              ...item,
              status: newStatus,
              returnedQty: 0,
              damagedQty: 0,
              returnedCartons: 0,
              returnedPcs: 0,
              damagedCartons: 0,
              damagedPcs: 0,
              commissionAmount: 0,
              extraCommissionAmount: 0,
              srCommissionAmount: 0,
              totalAmount: item.qty * item.rate
            }));
            return {
              ...prev,
              status: newStatus,
              items: updatedItems,
              totalQty: updatedItems.reduce((acc, curr) => acc + curr.totalQty, 0),
              totalAmount: updatedItems.reduce((acc, curr) => acc + curr.totalAmount, 0)
            };
          });
        }

        showToast(language === 'bn'
          ? `চালানের স্থিতি সফলভাবে "${newStatus === 'Shipped' ? 'Shipped' : 'Pending'}" এ পরিবর্তন করা হয়েছে!`
          : `Challan status successfully updated to "${newStatus}"!`);
        setViewingOrder(null); // Auto-close viewing order drawer on status change
      } catch (err) {
        // executeTransaction already alerts the user
      }
      return;
    }

    // Otherwise, newStatus is 'Delivered' (so we open the settlement modal)
    // No auto commission — all fields start at 0, entered manually
    setSettlementSRCommValue(0);
    setSettlementExtraCommValue(0);
    setSettlementDSRCommRate(0);

    // Build split-return initial quantities (Carton + Piece breakdowns)
    const initialQtys: Record<string, {
      returned: number; damaged: number;
      returnedCartons: number; returnedPcs: number;
      damagedCartons: number; damagedPcs: number;
    }> = {};
    group.items.forEach(item => {
      const prod = products.find(p => (p.name || '').trim().toLowerCase() === (item.productName || '').trim().toLowerCase());
      const cs = (prod?.cartonSize && prod.cartonSize > 1) ? prod.cartonSize : 24;
      const prevRet = item.returnedQty || 0;
      const prevDmg = item.damagedQty || 0;
      initialQtys[item.id] = {
        returned: prevRet,
        damaged:  prevDmg,
        returnedCartons: Math.floor(prevRet / cs),
        returnedPcs:     prevRet % cs,
        damagedCartons:  Math.floor(prevDmg / cs),
        damagedPcs:      prevDmg % cs,
      };
    });

    setSettlementOrder(group);
    setSettlementStatus(newStatus);
    setSettlementQuantities(initialQtys);
  };

  const handleSaveSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementOrder) return;

    let tempProducts = [...products];
    let tempCustomers = [...customers];
    let tempChallans = [...challans];

    try {
      executeTransaction(() => {
        // Pro-rata allocation uses Billable = qty - ret - dmg (damage subtracted)
        let totalUpdatedNetValue = 0;
        const itemsToUpdate = settlementOrder.items.map(item => {
          const updates = settlementQuantities[item.id] || { returned: 0, damaged: 0 };
          const billableQty = item.qty - (Number(updates.returned) || 0) - (Number(updates.damaged) || 0);
          const soldVal = Math.max(0, billableQty) * item.rate;
          return {
            id: item.id,
            netValue: soldVal - (item.commissionAmount || 0),
            updates
          };
        });
        totalUpdatedNetValue = itemsToUpdate.reduce((sum, x) => sum + x.netValue, 0);

        const calculatedTotalSRComm = settlementSRCommValue;
        let oldDeliveredTotal = 0;
        let newDeliveredTotal = 0;
        let oldCustomerDue = 0;
        let newCustomerDue = 0;

        const targetCustomerName = settlementOrder.items[0]?.customerName;
        const customer = tempCustomers.find(cust => cust.name === targetCustomerName);

        settlementOrder.items.forEach(ch => {
          const itemUpdate = itemsToUpdate.find(x => x.id === ch.id)!;
          const updates = itemUpdate.updates;
          const newReturned = Number(updates.returned) || 0;
          const newDamaged = Number(updates.damaged) || 0;

          // Billable Qty = Billing Qty − Returned Qty − Damaged Qty
          // Line Item Amount = Billable Qty × TP - Commission + Extra Profit
          const billableQty = Math.max(0, ch.qty - newReturned - newDamaged);
          const baseAmount = billableQty * ch.rate;

          const itemSRCommAmount = totalUpdatedNetValue > 0
            ? calculatedTotalSRComm * (itemUpdate.netValue / totalUpdatedNetValue)
            : 0;
          const itemExtraCommAmount = totalUpdatedNetValue > 0
            ? settlementExtraCommValue * (itemUpdate.netValue / totalUpdatedNetValue)
            : 0;

          // finalItemAmount = stored totalAmount (deducting returned & damaged)
          const finalItemAmount = baseAmount - itemSRCommAmount + itemExtraCommAmount;
          const customerItemDue = finalItemAmount;

          const wasDelivered = ch.status === 'Delivered';
          const isDelivered = settlementStatus === 'Delivered';

          if (wasDelivered) {
            oldDeliveredTotal += ch.totalAmount;
            // Reverse old customer due on (qty - old ret - old dmg) basis
            const oldAccQty = Math.max(0, ch.qty - (ch.returnedQty || 0) - (ch.damagedQty || 0));
            oldCustomerDue += oldAccQty * ch.rate - (ch.commissionAmount || 0) - (ch.extraProfitAmount || 0);
          }
          if (isDelivered) {
            newDeliveredTotal += finalItemAmount;
            newCustomerDue += customerItemDue;
          }

          tempProducts = tempProducts.map(p => {
            if (p.name === ch.productName) {
              let currentStock = p.currentStock;
              let damagedStock = p.damagedStock || 0;

              if (wasDelivered && isDelivered) {
                const returnDiff = newReturned - (ch.returnedQty || 0);
                currentStock += returnDiff;
                const damageDiff = newDamaged - (ch.damagedQty || 0);
                damagedStock += damageDiff;
              } else if (!wasDelivered && isDelivered) {
                const soldQty = ch.qty + ch.bonusQty - newReturned;
                currentStock -= soldQty;
                damagedStock += newDamaged;
              } else if (wasDelivered && !isDelivered) {
                const prevSoldQty = ch.qty + ch.bonusQty - ch.returnedQty;
                currentStock += prevSoldQty;
                damagedStock -= ch.damagedQty;
              }

              if (currentStock < 0) {
                throw new Error(language === 'bn'
                  ? `স্টক পর্যাপ্ত নয়! "${p.name}" পণ্যটির বর্তমানে মাত্র ${p.currentStock} টি স্টক আছে, কিন্তু এই সেটেলমেন্টের পর স্টক আরও ${Math.abs(currentStock)} টি কম পড়বে। সমাধান: অনুগ্রহ করে প্রথমে প্রোডাক্টটির নতুন স্টক এন্ট্রি (Purchase/Procure) করুন, অথবা চালানের পরিমাণ কমিয়ে দিন।`
                  : `Insufficient stock! Product "${p.name}" only has ${p.currentStock} units in stock, but this settlement requires ${Math.abs(currentStock)} more units than available. Solution: Please procure/receive more stock for this product first, or reduce the quantity in the challan.`
                );
              }

              return {
                ...p,
                currentStock,
                damagedStock
              };
            }
            return p;
          });

          tempChallans = tempChallans.map(item => {
            if (item.id === ch.id) {
              return {
                ...item,
                status: settlementStatus,
                returnedQty: newReturned,
                damagedQty: newDamaged,
                totalAmount: finalItemAmount,
                commissionAmount: itemSRCommAmount,
                extraProfitAmount: itemExtraCommAmount,
                extraCommissionAmount: itemExtraCommAmount,
                srCommissionValue: settlementSRCommValue,
                srCommissionAmount: itemSRCommAmount
              };
            }
            return item;
          });
        });

        if (customer) {
          // Customer due uses market-accepted basis (qty - ret - dmg), NOT SR accountability basis
          // The gap = damage value, which the SR recovers from the company via Claim settlement
          const dueDiff = newCustomerDue - oldCustomerDue;
          customer.due = (customer.due || 0) + dueDiff;
        }

        return { products: tempProducts, customers: tempCustomers, challans: tempChallans };
      });

      // Dispatch 1 consolidated email for the entire challan on delivery settlement
      if (settlementStatus === 'Delivered' && settlementOrder) {
        const settledItems = settlementOrder.items.map(item => {
          const updated = tempChallans.find(c => c.id === item.id);
          return updated || { ...item, status: 'Delivered' as const };
        });
        const totalDeliveredAmount = settledItems.reduce((s, it) => s + it.totalAmount, 0);
        sendInvoiceEmail({
          id: settlementOrder.id,
          items: settledItems,
          createdAt: settlementOrder.createdAt,
          srName: settlementOrder.srName,
          routeName: settlementOrder.routeName,
          deliveryManName: settlementOrder.deliveryManName,
          customerName: settlementOrder.customerName,
          status: 'Delivered',
          totalAmount: totalDeliveredAmount,
        }).catch(err => console.error('[Settlement Email Trigger]', err));
      }

      setSettlementOrder(null);
      setViewingOrder(null); // Auto-close viewing order drawer on status change (settled)
      showToast(language === 'bn' 
        ? 'চালান সেটেলমেন্ট এবং স্টক আপডেট সফল হয়েছে!' 
        : 'Challan settlement and stock updates saved successfully!');
    } catch (err) {
      // Transaction failed, alerts already raised
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    const group = groupedData.find(g => g.id === groupId);
    if (!group) return;

    let confirmMsg = '';
    if (group.status === 'Delivered') {
      confirmMsg = language === 'bn'
        ? 'আপনি কি নিশ্চিত যে এই ডেলিভারি সম্পন্ন অর্ডারটি ডিলিট করতে চান? এটি প্রোডাক্ট স্টক এবং কাস্টমারের বকেয়া ব্যালেন্স পুনরায় আগের অবস্থায় ফিরিয়ে নিয়ে যাবে।'
        : 'Are you sure you want to delete this DELIVERED order? This will restore product stock and customer due balance back to their original state.';
    } else {
      confirmMsg = language === 'bn'
        ? 'আপনি কি নিশ্চিত যে এই পুরো অর্ডারটি ডিলিট করতে চান?'
        : 'Are you sure you want to delete this entire order?';
    }

    if (!confirm(confirmMsg)) return;

    let tempProducts = [...products];
    let tempCustomers = [...customers];
    let tempChallans = [...challans];

    try {
      executeTransaction(() => {
        tempProducts = tempProducts.map(p => {
          let currentStock = p.currentStock;
          let damagedStock = p.damagedStock || 0;

          group.items.forEach(item => {
            if (item.productName === p.name && item.status === 'Delivered') {
              currentStock += (item.qty + (item.bonusQty || 0) - (item.returnedQty || 0));
              damagedStock = Math.max(0, damagedStock - (item.damagedQty || 0));
            }
          });

          return {
            ...p,
            currentStock,
            damagedStock
          };
        });

        if (group.status === 'Delivered') {
          const targetCustomerName = group.items[0]?.customerName;
          const customer = tempCustomers.find(cust => cust.name === targetCustomerName);
          if (customer) {
            const deliveredTotal = group.items.reduce((sum, item) => sum + item.totalAmount, 0);
            customer.due = Math.max(0, (customer.due || 0) - deliveredTotal);
          }
        }

        const itemIds = group.items.map(i => i.id);
        tempChallans = tempChallans.filter(c => !itemIds.includes(c.id));

        return { products: tempProducts, customers: tempCustomers, challans: tempChallans };
      });

      if (viewingOrder && viewingOrder.id === groupId) {
        setViewingOrder(null);
      }
    } catch (err) {
      // Transaction failed, alerts already raised
    }
  };

  const handleStatusChange = (id: string, newStatus: 'Pending' | 'Shipped' | 'Delivered') => {
    setChallans(prev => prev.map(ch => ch.id === id ? { ...ch, status: newStatus } : ch));
  };

  const handleOpenEditOrderModal = (group: GroupedOrder) => {
    if (group.status === 'Delivered') {
      showToast(language === 'bn'
        ? 'ডেলিভারি সম্পন্ন অর্ডার এডিট করা যাবে না!'
        : 'Delivered orders cannot be edited!', 'error');
      return;
    }
    setEditingOrder(group);
    setEditSR(group.srName);
    setEditRoute(group.routeName);
    setEditDeliveryMan(group.deliveryManName);
    setEditStatus(group.status);
    setEditOrderItems(group.items.map(item => ({ ...item })));
  };

  const handleEditOrderItemChange = (itemId: string, field: 'qty' | 'returnedQty' | 'damagedQty', val: number) => {
    const safeVal = Math.max(0, val);
    if (field === 'qty') {
      const item = editOrderItems.find(i => i.id === itemId);
      if (item && safeVal > 0) {
        const prod = products.find(p => p.name === item.productName);
        if (prod) {
          const maxStock = prod.currentStock;
          if (safeVal > maxStock) {
            showToast(language === 'bn'
              ? `দুঃখিত! স্টকের অতিরিক্ত অর্ডার করা যাবে না। সর্বোচ্চ উপলব্ধ স্টক: ${maxStock} ${prod.primaryUnit === 'Carton' ? 'কার্টন' : 'পিস'}`
              : `Cannot exceed available stock! Max available: ${maxStock} ${prod.primaryUnit === 'Carton' ? 'Ctn' : 'Pcs'}`, 'error');
            return;
          }
        }
      }
    }
    setEditOrderItems(prev => prev.map(item => {
      if (item.id === itemId) {
        let newQty = item.qty;
        let newRet = item.returnedQty || 0;
        let newDam = item.damagedQty || 0;

        if (field === 'qty') newQty = safeVal;
        if (field === 'returnedQty') newRet = safeVal;
        if (field === 'damagedQty') newDam = safeVal;

        const maxDispatched = newQty + (item.bonusQty || 0);

        const updated = {
          ...item,
          qty: newQty,
          returnedQty: newRet,
          damagedQty: newDam,
          totalQty: maxDispatched
        };
        // Billable Qty = Billing Qty − Returned Qty − Damaged Qty (floored at 0)
        const billableQty = Math.max(0, newQty - newRet - newDam);
        updated.totalAmount = billableQty * updated.rate - (updated.commissionAmount || 0) + (updated.extraProfitAmount || 0);
        return updated;
      }
      return item;
    }));
  };

  const updateEditItemSplit = (
    itemId: string,
    field: 'qty' | 'returnedQty' | 'damagedQty',
    part: 'ctn' | 'pcs',
    val: number
  ) => {
    const item = editOrderItems.find(i => i.id === itemId);
    if (!item) return;
    const prod = products.find(p => (p.name || '').trim().toLowerCase() === (item.productName || '').trim().toLowerCase());
    const cs = (prod?.cartonSize && prod.cartonSize > 1) ? prod.cartonSize : 24;

    const currentTotal = (field === 'qty' ? item.qty : (field === 'returnedQty' ? (item.returnedQty || 0) : (item.damagedQty || 0)));
    let curCtn = Math.floor(currentTotal / cs);
    let curPcs = currentTotal % cs;

    if (part === 'ctn') curCtn = Math.max(0, val);
    if (part === 'pcs') curPcs = Math.max(0, val);

    const newTotal = curCtn * cs + curPcs;
    handleEditOrderItemChange(itemId, field, newTotal);
  };

  const handleRemoveEditOrderItem = (itemId: string) => {
    setEditOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddNewProductToOrder = (prodName: string) => {
    const prod = products.find(p => p.name === prodName);
    if (!prod) return;

    const exists = editOrderItems.some(item => item.productName === prodName);
    if (exists) {
      showToast(language === 'bn'
        ? 'পণ্যটি ইতিমধ্যেই অর্ডারে যুক্ত আছে, অনুগ্রহ করে পরিমাণ বা ড্যামেজ সংশোধন করুন।'
        : 'Product already added, please adjust quantity or damage in the table.', 'error');
      return;
    }

    // Default to 0 quantity so users can record day-end market damage even for 0-qty products
    const newItem: ChallanItem = {
      id: `item-${Date.now()}`,
      productName: prod.name,
      company: prod.company || '',
      qty: 0,
      bonusQty: 0,
      totalQty: 0,
      rate: prod.defaultWSP,
      attribute: 'Default',
      totalAmount: 0,
      srName: editSR,
      routeName: editRoute,
      deliveryManName: editDeliveryMan,
      status: editStatus,
      returnedQty: 0,
      damagedQty: 0,
      customerName: editingOrder?.items[0]?.customerName || '',
      customerId: editingOrder?.items[0]?.customerId || undefined,
      commissionAmount: 0,
      createdAt: editingOrder?.items[0]?.createdAt || new Date().toISOString()
    };

    setEditOrderItems(prev => [...prev, newItem]);
    showToast(language === 'bn' ? 'পণ্যটি ০ পরিমাণ হিসেবে যুক্ত হয়েছে! এখন প্রয়োজনমতো ড্যামেজ বা পরিমাণ বসিয়ে দিন।' : 'Product added with 0 quantity! You can now record damage or billing quantity.');
  };

  const handleSaveEditOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    let tempProducts = [...products];
    let tempCustomers = [...customers];
    let tempChallans = [...challans];

    try {
      executeTransaction(() => {
        if (editingOrder.status === 'Delivered') {
          editingOrder.items.forEach(oldItem => {
            tempProducts = tempProducts.map(p => {
              if (p.name === oldItem.productName) {
                const restoredStock = oldItem.qty + (oldItem.bonusQty || 0) - (oldItem.returnedQty || 0);
                const restoredDamage = oldItem.damagedQty || 0;
                return {
                  ...p,
                  currentStock: p.currentStock + restoredStock,
                  damagedStock: Math.max(0, (p.damagedStock || 0) - restoredDamage)
                };
              }
              return p;
            });
          });

          const targetCustomerName = editingOrder.items[0]?.customerName;
          const customer = tempCustomers.find(cust => cust.name === targetCustomerName);
          if (customer) {
            // Customer (market) due = what the shopkeeper actually accepted = qty - ret - dmg
            // totalAmount (SR accountability) uses qty - ret (damage NOT subtracted), so we
            // compute customer due independently here (they diverge by damage value)
            const oldCustomerDue = editingOrder.items.reduce((sum, item) => {
              const accQty = Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0));
              return sum + accQty * item.rate - (item.commissionAmount || 0) + (item.extraProfitAmount || 0);
            }, 0);
            customer.due = Math.max(0, (customer.due || 0) - oldCustomerDue);
          }
        }

        const finalChallanItems = editOrderItems.map(item => {
          // Billable Qty = Billing Qty − Returned Qty − Damaged Qty
          const billableQty = Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0));
          const totalAmount = billableQty * item.rate - (item.commissionAmount || 0) + (item.extraProfitAmount || 0);
          return {
            ...item,
            srName: editSR,
            routeName: editRoute,
            deliveryManName: editDeliveryMan,
            status: editStatus,
            totalQty: item.qty + (item.bonusQty || 0),
            totalAmount
          };
        });

        if (editStatus === 'Delivered') {
          finalChallanItems.forEach(newItem => {
            tempProducts = tempProducts.map(p => {
              if (p.name === newItem.productName) {
                const soldStock = newItem.qty + (newItem.bonusQty || 0) - (newItem.returnedQty || 0);
                const newDamage = newItem.damagedQty || 0;
                const currentStock = p.currentStock - soldStock;
                if (currentStock < 0) {
                  throw new Error(language === 'bn'
                    ? `স্টক পর্যাপ্ত নয়! "${p.name}" পণ্যটির বর্তমানে মাত্র ${p.currentStock} টি স্টক আছে, কিন্তু আপনি ${soldStock} টি ডেলিভারি করার চেষ্টা করছেন (কমতি আছে: ${Math.abs(currentStock)} টি)। সমাধান: অনুগ্রহ করে প্রথমে প্রোডাক্টটির নতুন স্টক এন্ট্রি (Purchase/Procure) করুন, অথবা চালানের পরিমাণ কমিয়ে দিন।`
                    : `Insufficient stock! Product "${p.name}" only has ${p.currentStock} units in stock, but you are trying to deliver ${soldStock} units (Deficit: ${Math.abs(currentStock)} units). Solution: Please procure/receive more stock for this product first, or reduce the quantity in the challan.`
                  );
                }
                return {
                  ...p,
                  currentStock,
                  damagedStock: (p.damagedStock || 0) + newDamage
                };
              }
              return p;
            });
          });

          const targetCustomerName = finalChallanItems[0]?.customerName || editingOrder.items[0]?.customerName;
          const customer = tempCustomers.find(cust => cust.name === targetCustomerName);
          if (customer) {
            // Customer (market) due = qty - ret - dmg   (shopkeeper only pays for accepted goods)
            // totalAmount (SR/Owner receivable) = qty - ret   (SR remains accountable for damage)
            // Gap = damage value → reconciled when company compensates via Claim settlement
            const newCustomerDue = finalChallanItems.reduce((sum, item) => {
              const accQty = Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0));
              return sum + accQty * item.rate - (item.commissionAmount || 0) + (item.extraProfitAmount || 0);
            }, 0);
            customer.due = (customer.due || 0) + newCustomerDue;
          }
        }

        const oldItemIds = editingOrder.items.map(i => i.id);
        const filteredChallans = tempChallans.filter(c => !oldItemIds.includes(c.id));
        tempChallans = [...filteredChallans, ...finalChallanItems];

        return { products: tempProducts, customers: tempCustomers, challans: tempChallans };
      });

      if (viewingOrder && viewingOrder.id === editingOrder.id) {
        const finalChallanItems = tempChallans.filter(c => c.createdAt === viewingOrder.createdAt && c.srName === editSR && c.routeName === editRoute);
        if (finalChallanItems.length === 0) {
          setViewingOrder(null);
        } else {
          setViewingOrder({
            id: `${viewingOrder.createdAt}_${editSR}_${editRoute}_${editDeliveryMan}`,
            items: finalChallanItems,
            createdAt: viewingOrder.createdAt,
            srName: editSR,
            routeName: editRoute,
            deliveryManName: editDeliveryMan,
            customerName: finalChallanItems[0]?.customerName,
            status: editStatus,
            totalAmount: finalChallanItems.reduce((acc, curr) => acc + curr.totalAmount, 0),
            totalQty: finalChallanItems.reduce((acc, curr) => acc + curr.totalQty, 0),
            itemCount: finalChallanItems.length
          });
        }
      }

      setEditingOrder(null);
      showToast(language === 'bn' ? 'অর্ডার সফলভাবে আপডেট করা হয়েছে এবং স্টক সমন্বয় করা হয়েছে!' : 'Order updated successfully and stock levels synchronized!');
    } catch (err) {
      // Transaction failed, alerts already raised
    }
  };

  // CSV Exporter (Active filtered sheet)
  const downloadCSV = () => {
    const headers = ['#', 'Product Name', 'Attribute', 'Qty', 'Bonus Qty', 'Total Qty', 'Rate (BDT)', 'Total Amount (BDT)', 'SR Name', 'Route Beat', 'Delivery Man', 'Status'];
    const rows = filteredChallans.map((c, index) => [
      index + 1,
      `"${c.productName.replace(/"/g, '""')}"`,
      `"${c.attribute.replace(/"/g, '""')}"`,
      c.qty,
      c.bonusQty,
      c.totalQty,
      c.rate,
      c.totalAmount,
      `"${c.srName}"`,
      `"${c.routeName || ''}"`,
      `"${c.deliveryManName}"`,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Challan_Sheet_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delegate to printUtils — shop name read dynamically from localStorage
  const triggerPrintInvoice = (order: GroupedOrder) => printChallanInvoice(order.items);
  const triggerPrintPDF     = () => printChallanSheet(filteredChallans);



  return (
    <div className="space-y-6">
      
      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-none p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-none blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-300" />
            {tChallan.title}
          </h2>
          <p className="text-slate-300 text-xs">{tChallan.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 z-10 relative">
          <button
            id="challan-btn-download-csv"
            type="button"
            onClick={downloadCSV}
            className="inline-flex h-10 items-center gap-2 rounded-none border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-slate-300" />
            {tChallan.exportCsv}
          </button>
          
          <button
            id="challan-btn-download-pdf"
            type="button"
            onClick={triggerPrintPDF}
            className="inline-flex h-10 items-center gap-2 rounded-none border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Download/Print PDF"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            {tChallan.downloadPrint}
          </button>

          <button
            id="challan-btn-add"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-none bg-white px-4 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-all shrink-0 cursor-pointer active:scale-95 shadow-lg"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            {tChallan.createBtn}
          </button>
        </div>
      </div>

      {/* Filter Engine Form */}
      <form onSubmit={handleSearch} className="bg-indigo-50/30 border border-indigo-200 rounded-none p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-200 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-indigo-500 animate-ping shrink-0" />
            <h3 className="text-xs font-bold text-indigo-705 tracking-wider uppercase">{tChallan.filterTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-none uppercase tracking-wider font-mono">Dynamic Search</span>
          </div>
        </div>

        {/* Quick Company / Brand Selection Pills */}
        {availableCompanies.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
              {language === 'bn' ? 'কোম্পানি অনুযায়ী চালান:' : 'Filter By Company:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setFilterCompany('');
                setAppliedCompany('');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-none text-xs font-bold transition-all cursor-pointer border ${
                !appliedCompany
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {language === 'bn' ? 'সকল কোম্পানি' : 'All Companies'} ({groupedData.length})
            </button>
            {availableCompanies.map(cName => {
              const count = groupedData.filter(g => g.items.some(i => (i.company || products.find(p => p.name === i.productName)?.company || '').toLowerCase() === cName.toLowerCase())).length;
              const isActive = appliedCompany.toLowerCase() === cName.toLowerCase();
              return (
                <button
                  key={cName}
                  type="button"
                  onClick={() => {
                    setFilterCompany(cName);
                    setAppliedCompany(cName);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-none text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                      : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <Building className="w-3 h-3 text-blue-500" />
                  <span>{cName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono ${isActive ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-900 font-bold'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          
          {/* Company Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              {tChallan.companyLabel || (language === 'bn' ? 'কোম্পানি / ব্র্যান্ড:' : 'Company / Brand:')}
            </label>
            <select
              id="filter-company-select"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="h-10 w-full rounded-none border border-amber-300 bg-amber-50/20 px-3 text-xs font-bold text-amber-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{tChallan.allCompanies || (language === 'bn' ? 'সব কোম্পানি' : 'All Companies')}</option>
              {availableCompanies.map(cName => (
                <option key={cName} value={cName}>{cName}</option>
              ))}
            </select>
          </div>

          {/* SR Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">{tChallan.srLabel}</label>
            <select
              id="filter-sr-select"
              value={filterSR}
              onChange={(e) => setFilterSR(e.target.value)}
              className="h-10 w-full rounded-none border border-purple-200 bg-purple-50/10 px-3 text-xs font-bold text-purple-855 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{tChallan.allSr}</option>
              {srs.map(sr => (
                <option key={sr.id} value={sr.name}>{sr.name}</option>
              ))}
            </select>
          </div>

          {/* Route Beat Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{language === 'bn' ? 'মার্কেট / রুট:' : 'Market / Route:'}</label>
            <select
              id="filter-route-select"
              value={filterRoute}
              onChange={(e) => setFilterRoute(e.target.value)}
              className="h-10 w-full rounded-none border border-blue-200 bg-blue-50/10 px-3 text-xs font-bold text-blue-855 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{language === 'bn' ? 'সব মার্কেট' : 'All Markets'}</option>
              {routes.map(r => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Delivery Man Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">{tChallan.deliveryLabel}</label>
            <select
              id="filter-delivery-select"
              value={filterDeliveryMan}
              onChange={(e) => setFilterDeliveryMan(e.target.value)}
              className="h-10 w-full rounded-none border border-rose-200 bg-rose-50/10 px-3 text-xs font-bold text-rose-855 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer shadow-sm"
            >
              <option value="">{tChallan.allDelivery}</option>
              {deliveryMen.map(dm => (
                <option key={dm.id} value={dm.name}>{dm.name}</option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">{tChallan.keywordLabel}</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="filter-keyword-input"
                type="text"
                placeholder={tCommon.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-none border border-indigo-200 bg-white pl-9 pr-4 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'bn' ? 'শুরুর তারিখ:' : 'Start Date:'}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-2.5 w-6 h-6 rounded-none bg-indigo-50 border border-indigo-200/60 flex items-center justify-center pointer-events-none z-10">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              </div>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="h-10 w-full pl-10 pr-3 rounded-none border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'bn' ? 'শেষের তারিখ:' : 'End Date:'}
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-2.5 w-6 h-6 rounded-none bg-rose-50 border border-rose-200/60 flex items-center justify-center pointer-events-none z-10">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="h-10 w-full pl-10 pr-3 rounded-none border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>
          </div>

        </div>

        {/* Action buttons inside filter card */}
        <div className="flex items-center justify-end gap-3 border-t border-indigo-200 pt-4">
          <button
            id="filter-btn-reset"
            type="button"
            onClick={handleReset}
            className="h-9 rounded-none border border-indigo-200 bg-white px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {tChallan.resetFilters}
          </button>
          
          <button
            id="filter-btn-submit"
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-none bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition-all shrink-0 cursor-pointer border border-indigo-700 shadow-sm"
          >
            <Search className="w-4 h-4 text-white" />
            {tChallan.querySheet}
          </button>
        </div>
      </form>

      {/* Table Section */}
      <div className={`overflow-hidden rounded-none border bg-white shadow-sm hover:shadow-md transition-[border-color,box-shadow] duration-300 ${
        selectedStatusTab === 'Pending' ? 'border-amber-200 shadow-amber-50/20' :
        selectedStatusTab === 'Shipped' ? 'border-blue-200 shadow-blue-50/20' :
        selectedStatusTab === 'Delivered' ? 'border-emerald-200 shadow-emerald-50/20' :
        'border-slate-200'
      }`}>
        {/* Dynamic color-coded top accent bar */}
        <div className={`h-1.5 w-full transition-colors duration-300 ${
          selectedStatusTab === 'Pending' ? 'bg-amber-500' :
          selectedStatusTab === 'Shipped' ? 'bg-blue-500' :
          selectedStatusTab === 'Delivered' ? 'bg-emerald-500' :
          'bg-slate-950'
        }`} />

        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{tChallan.tableTitle}</h4>
            <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-none shadow-sm">
              {filteredOrders.length}
            </span>
          </div>

          {/* Status Tabs Switcher */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-none border border-slate-200 gap-1 self-start lg:self-auto">
            {(['All', 'Pending', 'Shipped', 'Delivered'] as const).map((tab) => {
              const isActive = selectedStatusTab === tab;
              
              // Count for this tab (filtered by SR, route, delivery man, keyword, but with specific status)
              const count = groupedData.filter((group) => {
                const matchesSearch = searchQuery 
                  ? group.items.some(i => i.productName.toLowerCase().includes(appliedSearch.toLowerCase())) ||
                    group.items.some(i => i.attribute.toLowerCase().includes(appliedSearch.toLowerCase()))
                  : true;

                const matchesSR = appliedSR ? group.srName === appliedSR : true;
                const matchesRoute = appliedRoute ? group.routeName === appliedRoute : true;
                const matchesDeliveryMan = appliedDeliveryMan ? group.deliveryManName === appliedDeliveryMan : true;
                const matchesStatus = tab === 'All' ? true : group.status === tab;

                return matchesSearch && matchesSR && matchesRoute && matchesDeliveryMan && matchesStatus;
              }).length;

              let label = '';
              let badgeColor = '';
              let activeTabStyle = '';
              if (tab === 'All') {
                label = language === 'bn' ? 'সব' : 'All';
                badgeColor = isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700';
                activeTabStyle = 'bg-white text-slate-950 shadow-sm border border-slate-200';
              } else if (tab === 'Pending') {
                label = tCommon.pending;
                badgeColor = isActive ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800';
                activeTabStyle = 'bg-amber-50 text-amber-800 border border-amber-200/60 shadow-sm';
              } else if (tab === 'Shipped') {
                label = tCommon.shipped;
                badgeColor = isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800';
                activeTabStyle = 'bg-blue-50 text-blue-800 border border-blue-200/60 shadow-sm';
              } else if (tab === 'Delivered') {
                label = tCommon.delivered;
                badgeColor = isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800';
                activeTabStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-sm';
              }

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setSelectedStatusTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? activeTabStyle 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-none font-mono font-extrabold transition-colors duration-300 ${badgeColor}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm border-collapse min-w-[1100px]">
            <thead>
              <tr className={`text-white border-b transition-colors duration-300 ${
                selectedStatusTab === 'Pending' ? 'bg-gradient-to-r from-amber-600 to-amber-700 border-amber-700' :
                selectedStatusTab === 'Shipped' ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-700' :
                selectedStatusTab === 'Delivered' ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 border-emerald-700' :
                'bg-slate-900 border-slate-955'
              }`}>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider w-14 text-center">#</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">Order ID / Date</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Items</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">Total Qty</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-right">{tDash.tableValue}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tChallan.srLabel}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">{tChallan.deliveryLabel}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center">{tDash.tableStatus}</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center w-28">{tCommon.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((g, index) => {
                const globalIndex = startIndex + index + 1;
                
                let statusStyle = "bg-amber-50 text-amber-750 border-amber-250";
                if (g.status === 'Delivered') {
                  statusStyle = "bg-emerald-50 text-emerald-705 border-emerald-250";
                } else if (g.status === 'Shipped') {
                  statusStyle = "bg-blue-50 text-blue-700 border-blue-200";
                }

                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors duration-250 group">
                    <td className="px-5 py-4 text-center text-slate-400 font-mono font-bold whitespace-nowrap">{globalIndex}</td>
                    <td className="px-5 py-4 font-bold text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-slate-900">ORD-{new Date(g.createdAt).getTime().toString().slice(-6)}</span>
                        {(() => {
                          const orderCompanies = Array.from(new Set(g.items.map(i => i.company || products.find(p => p.name === i.productName)?.company).filter(Boolean)));
                          if (orderCompanies.length === 0) return null;
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-none border border-blue-300 uppercase tracking-wider shadow-2xs">
                              <Building className="w-2.5 h-2.5 text-blue-600" />
                              {orderCompanies.join(', ')}
                            </span>
                          );
                        })()}
                      </div>
                      {g.customerName && (
                        <div className="text-[11px] text-indigo-650 font-extrabold flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-indigo-500 shrink-0" />
                          {g.customerName}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{new Date(g.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-none text-[11px] font-bold border border-slate-200">{g.itemCount} items</span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-800 font-mono bg-slate-50/30 whitespace-nowrap">{g.totalQty}</td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="font-mono font-extrabold text-slate-900">৳{g.totalAmount.toLocaleString('en-BD')}</div>
                      {(() => {
                        const profit = g.items.reduce((sum, item) => {
                          const pp = products.find(p => p.name === item.productName)?.defaultPP ?? item.rate * 0.85;
                          const netQty = Math.max(0, item.qty - (item.returnedQty || 0));
                          const cogs = netQty * pp;
                          const revenue = (netQty * item.rate) - (item.commissionAmount || 0) + (item.extraProfitAmount || 0);
                          return sum + (revenue - cogs);
                        }, 0);
                        const isPositive = profit >= 0;
                        return (
                          <div className={`inline-flex items-center gap-0.5 mt-1 px-2 py-0.5 rounded-none text-[10px] font-bold border ${
                            isPositive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span>{isPositive ? '▲' : '▼'}</span>
                            <span>৳{Math.round(Math.abs(profit)).toLocaleString('en-BD')}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-605 max-w-[120px] truncate whitespace-nowrap" title={g.srName}>
                      {g.srName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-850 rounded-none text-xs font-bold border border-slate-200 truncate block max-w-[180px] whitespace-nowrap" title={g.routeName}>
                        {g.routeName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 text-sm max-w-[155px] truncate whitespace-nowrap" title={g.deliveryManName}>
                      {g.deliveryManName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-none text-[10px] font-bold border uppercase tracking-wider ${statusStyle}`}>
                        {g.status === 'Delivered' ? tCommon.delivered : g.status === 'Shipped' ? tCommon.shipped : tCommon.pending}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`order-action-view-${g.id}`}
                          onClick={() => setViewingOrder(g)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-350 bg-white text-slate-650 hover:bg-slate-100 cursor-pointer hover:border-slate-800 shadow-sm active:scale-95 transition-all"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {g.status !== 'Delivered' && (
                          <button
                            id={`order-action-edit-${g.id}`}
                            onClick={() => handleOpenEditOrderModal(g)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400 cursor-pointer shadow-sm active:scale-95 transition-all"
                            title="Edit Order"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          id={`order-action-delete-${g.id}`}
                          onClick={() => handleDeleteGroup(g.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={12} className="py-16 text-center text-slate-400 font-semibold bg-white">
                    <p className="text-sm">{tChallan.noChallans}</p>
                    <button
                      id="challan-btn-reset-table"
                      type="button"
                      onClick={handleReset}
                      className="mt-3 inline-flex h-9 items-center gap-1 bg-slate-900 px-4 rounded-none text-white text-xs font-bold hover:bg-slate-800 border border-slate-955 cursor-pointer transition-all active:scale-95"
                    >
                      {tChallan.resetShowAll}
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500 font-semibold">
              {tChallan.showingLabel
                .replace('{start}', String(startIndex + 1))
                .replace('{end}', String(Math.min(startIndex + itemsPerPage, totalItems)))
                .replace('{total}', String(totalItems))}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                id="challan-page-prev"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  id={`challan-page-num-${page}`}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-none border font-semibold transition-all cursor-pointer ${
                    currentPage === page 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                id="challan-page-next"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            {/* Header: custom style guide gradient header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-lg">{tChallan.modalCreateTitle}</h3>
              </div>
              <button
                id="challan-modal-add-close"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="modal-body p-6 space-y-5">
              
              {/* Brand Company Select */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    {language === 'bn' ? 'কোম্পানি / ব্র্যান্ড নির্বাচন করুন *' : 'Select Company / Brand *'}
                  </label>
                  <select
                    id="new-challan-company-select"
                    required
                    value={selectedCompany}
                    onChange={(e) => {
                      const comp = e.target.value;
                      setSelectedCompany(comp);
                      setNewChallanItems([]); // clear items if company changes
                      setNewProduct('');
                      setNewAttribute('');

                      // Filter SRs and auto-select
                      if (comp) {
                        const matchingSrs = srs.filter(sr => {
                          return sr.assignedCompanyIds?.some(cid => {
                            const isIdMatch = (cid === 'comp-1' && comp.toLowerCase() === 'pran') ||
                                              (cid === 'comp-2' && comp.toLowerCase() === 'olympic') ||
                                              (cid === 'comp-3' && comp.toLowerCase() === 'haque');
                            return isIdMatch || cid.toLowerCase() === comp.toLowerCase();
                          });
                        });
                        if (matchingSrs.length > 0) {
                          const firstSr = matchingSrs[0];
                          setNewSR(firstSr.name);
                          // Mapped route for this SR
                          const matchingRoute = routes.find(r => r.assignedSRId === firstSr.id);
                          if (matchingRoute) {
                            setNewRoute(matchingRoute.name);
                            const dmObj = deliveryMen.find(dm => dm.id === matchingRoute.assignedDeliveryManId);
                            if (dmObj) {
                              setNewDeliveryMan(dmObj.name);
                            } else {
                              setNewDeliveryMan('');
                            }
                          } else {
                            setNewRoute('');
                            setNewDeliveryMan('');
                          }
                        } else {
                          setNewSR('');
                          setNewRoute('');
                          setNewDeliveryMan('');
                        }
                      } else {
                        setNewSR('');
                        setNewRoute('');
                        setNewDeliveryMan('');
                      }
                    }}
                    className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{language === 'bn' ? 'কোম্পানি নির্বাচন করুন' : 'Select Company'}</option>
                    <option value="Pran">PRAN</option>
                    <option value="Olympic">Olympic</option>
                    <option value="Haque">Haque</option>
                  </select>
                </div>
              </div>

              {selectedCompany && (
                <>
                  {/* SR & Delivery Agent & Customer Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.srSelectLabel}</label>
                      <select
                        id="new-challan-sr-select"
                        required
                        value={newSR}
                        onChange={(e) => {
                          const selectedSRName = e.target.value;
                          setNewSR(selectedSRName);
                          // Auto-update route and delivery man mapped to this SR
                          const srObj = srs.find(s => s.name === selectedSRName);
                          if (srObj) {
                            const routeObj = routes.find(r => r.assignedSRId === srObj.id);
                            if (routeObj) {
                              setNewRoute(routeObj.name);
                              const dmObj = deliveryMen.find(dm => dm.id === routeObj.assignedDeliveryManId);
                              if (dmObj) {
                                setNewDeliveryMan(dmObj.name);
                              } else {
                                setNewDeliveryMan('');
                              }
                            } else {
                              setNewRoute('');
                              setNewDeliveryMan('');
                            }
                          } else {
                            setNewRoute('');
                            setNewDeliveryMan('');
                          }
                        }}
                        className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <option value="">{tChallan.selectSr}</option>
                        {filteredSrsForNewChallan.map(sr => (
                          <option key={sr.id} value={sr.name}>{sr.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.deliverySelectLabel}</label>
                      <select
                        id="new-challan-delivery-select"
                        required
                        value={newDeliveryMan}
                        onChange={(e) => setNewDeliveryMan(e.target.value)}
                        className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <option value="">{tChallan.selectDelivery}</option>
                        {deliveryMen.map(dm => (
                          <option key={dm.id} value={dm.name}>{dm.name} ({dm.vehicle})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'মার্কেট / রুট *' : 'Market / Route *'}</label>
                      <select
                        id="new-challan-route-select"
                        required
                        value={newRoute}
                        onChange={(e) => {
                          const routeName = e.target.value;
                          setNewRoute(routeName);
                          const routeObj = routes.find(r => r.name === routeName);
                          if (routeObj) {
                            const srObj = srs.find(s => s.id === routeObj.assignedSRId);
                            if (srObj) {
                              setNewSR(srObj.name);
                            }
                            const dmObj = deliveryMen.find(dm => dm.id === routeObj.assignedDeliveryManId);
                            if (dmObj) {
                              setNewDeliveryMan(dmObj.name);
                            }
                          }
                        }}
                        className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <option value="">{language === 'bn' ? 'মার্কেট / রুট নির্বাচন করুন' : 'Select Market / Route'}</option>
                        {routes
                          .filter(r => {
                            const srObj = srs.find(s => s.name === newSR);
                            return !srObj || r.assignedSRId === srObj.id;
                          })
                          .map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'দোকান / খুচরা বিক্রেতা (ঐচ্ছিক)' : 'Shop / Customer (Optional)'}</label>
                      <select
                        id="new-challan-customer-select"
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <option value="">{language === 'bn' ? 'দোকান নির্বাচন করুন' : 'Select Customer/Shop'}</option>
                        {filteredCustomersForNewChallan.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.market})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add Product Sub-Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-none p-4.5 space-y-4">
                    <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      {language === 'bn' ? 'পণ্য যোগ করুন' : 'Add Product to Challan'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.productSelect}</label>
                        <select
                          id="sub-challan-product-select"
                          value={newProduct}
                          onChange={(e) => {
                            setNewProduct(e.target.value);
                            const activeAttrs = attributes.filter(a => a.status === 'Active');
                            
                            if (activeAttrs.length > 0) {
                              setNewAttribute(activeAttrs[0].name);
                            }
                          }}
                          className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="">{tChallan.chooseProduct}</option>
                          {products
                            .filter(p => p.company.toLowerCase() === selectedCompany.toLowerCase())
                            .map(p => (
                              <option key={p.id} value={p.name}>{p.name} (TP: ৳{p.defaultWSP})</option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.attributeSelect}</label>
                        <select
                          id="sub-challan-attribute-select"
                          value={newAttribute}
                          onChange={(e) => setNewAttribute(e.target.value)}
                          className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 transition-all"
                        >
                          <option value="">{tChallan.noneBulk}</option>
                          {attributes.filter(a => a.status === 'Active').map(attr => (
                            <option key={attr.id} value={attr.name}>{attr.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.primaryQty}</label>
                        <input
                          id="sub-challan-qty-input"
                          type="number"
                          min="0"
                          value={newQty}
                          onChange={(e) => setNewQty(Math.max(0, Number(e.target.value)))}
                          className="h-10 w-full rounded-none border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.bonusQty}</label>
                        <input
                          id="sub-challan-bonus-qty-input"
                          type="number"
                          min="0"
                          value={newBonusQty}
                          onChange={(e) => setNewBonusQty(Math.max(0, Number(e.target.value)))}
                          className="h-10 w-full rounded-none border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newProduct) {
                              showToast(language === 'bn' ? 'অনুগ্রহ করে একটি পণ্য সিলেক্ট করুন' : 'Please select a product.', 'error');
                              return;
                            }
                            const rate = getProductWSP(newProduct);
                            setNewChallanItems(prev => [
                              ...prev,
                              {
                                id: `temp-${Date.now()}`,
                                productName: newProduct,
                                attribute: newAttribute || 'None',
                                qty: Number(newQty),
                                bonusQty: Number(newBonusQty),
                                rate
                              }
                            ]);
                            setNewProduct('');
                            setNewAttribute('');
                            setNewQty(0);
                            setNewBonusQty(0);
                          }}
                          className="h-10 w-full rounded-none bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-sm border border-indigo-700 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4.5 h-4.5" />
                          {language === 'bn' ? 'তালিকায় যোগ করুন' : 'Add to List'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Added Products Table */}
                  {newChallanItems.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                        {language === 'bn' ? 'যোগকৃত পণ্যের তালিকা' : 'Added Products'}
                      </p>
                      <div className="overflow-x-auto border border-slate-200 rounded-none">
                        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                          <thead className="bg-slate-100 text-slate-700">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold">Product Name</th>
                              <th className="px-3 py-2.5">Variant</th>
                              <th className="px-3 py-2.5 text-center">Billing Qty</th>
                              <th className="px-3 py-2.5 text-center">Bonus Qty</th>
                              <th className="px-3 py-2.5 text-right">TP (৳)</th>
                              <th className="px-3 py-2.5 text-right">Total (৳)</th>
                              <th className="px-3 py-2.5 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {newChallanItems.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-bold text-slate-800">{item.productName}</td>
                                <td className="px-3 py-2 text-slate-500">{item.attribute}</td>
                                <td className="px-3 py-2 text-center font-mono font-bold">{item.qty}</td>
                                <td className="px-3 py-2 text-center font-mono text-slate-500">{item.bonusQty}</td>
                                <td className="px-3 py-2 text-right font-mono font-semibold">৳{item.rate}</td>
                                <td className="px-3 py-2 text-right font-mono font-bold">৳{(item.qty * item.rate).toLocaleString('en-BD')}</td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setNewChallanItems(prev => prev.filter(x => x.id !== item.id))}
                                    className="p-1 rounded-none bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Status, Commission inputs & Live breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.statusLabel}</label>
                      <select
                        id="new-challan-status-select"
                        value={newStatus}
                        onChange={(e: any) => setNewStatus(e.target.value)}
                        className="h-11 w-full rounded-none border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                      >
                        <option value="Pending">{tCommon.pending}</option>
                        <option value="Shipped">{tCommon.shipped}</option>
                        <option value="Delivered">{tCommon.delivered}</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'কমিশন (টাকা)' : 'Commission (Tk)'}</label>
                      <input
                        id="new-challan-commission-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newCommissionAmount}
                        onChange={(e) => setNewCommissionAmount(Number(e.target.value))}
                        className="h-11 w-full rounded-none border border-indigo-200 bg-indigo-50/30 px-4 text-sm font-semibold outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">{language === 'bn' ? 'অতিরিক্ত লাভ (টাকা)' : 'Extra Profit (Tk)'}</label>
                      <input
                        id="new-challan-extra-profit-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={newExtraProfitAmount}
                        onChange={(e) => setNewExtraProfitAmount(Number(e.target.value))}
                        className="h-11 w-full rounded-none border border-emerald-200 bg-emerald-50/30 px-4 text-sm font-semibold outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    {/* Live net breakdown */}
                    {(() => {
                      const gross = newChallanItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
                      const comm = Number(newCommissionAmount) || 0;
                      const extraProfit = Number(newExtraProfitAmount) || 0;
                      const net = gross - comm + extraProfit;
                      return (
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-none p-3 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500 font-semibold">
                            <span>{language === 'bn' ? 'মোট পরিমাণ' : 'Gross Amount'}</span>
                            <span className="font-mono text-slate-700">৳{gross.toLocaleString('en-BD')}</span>
                          </div>
                          {comm > 0 && (
                            <div className="flex justify-between text-indigo-600 font-semibold">
                              <span>{language === 'bn' ? 'কমিশন' : 'Commission'}</span>
                              <span className="font-mono">- ৳{comm.toLocaleString('en-BD')}</span>
                            </div>
                          )}
                          {extraProfit > 0 && (
                            <div className="flex justify-between text-emerald-600 font-semibold">
                              <span>{language === 'bn' ? 'অতিরিক্ত লাভ' : 'Extra Profit'}</span>
                              <span className="font-mono">+ ৳{extraProfit.toLocaleString('en-BD')}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-sm">
                            <span className="text-slate-700">{language === 'bn' ? 'নিট পরিমাণ' : 'Net Amount'}</span>
                            <span className="font-mono text-emerald-600">৳{net.toLocaleString('en-BD')}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}

              {/* Action bar / footer: styled with border-t bg-slate-50 */}
              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-none-b-xl shrink-0">
                <button
                  id="new-challan-btn-cancel"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 rounded-none border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-55 hover:border-slate-300 transition-all cursor-pointer"
                >
                  {tCommon.cancel}
                </button>
                <button
                  id="new-challan-btn-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-none bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer border border-slate-950"
                >
                  {tChallan.dispatchBtn}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Viewing Detailed Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 w-full max-w-4xl shadow-2xl flex flex-col justify-between animate-scale-up max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800" />
                <h3 className="font-semibold text-slate-800 text-lg">Order Details</h3>
              </div>
              <button
                id="challan-modal-view-close"
                onClick={() => setViewingOrder(null)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body p-5 space-y-4 text-sm overflow-y-auto">

              {/* Order ID + Meta row */}
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-none px-4 py-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
                    {(() => {
                      const orderCompanies = Array.from(new Set(viewingOrder.items.map(i => i.company || products.find(p => p.name === i.productName)?.company).filter(Boolean)));
                      if (orderCompanies.length === 0) return null;
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 font-extrabold text-[10px] rounded-none border border-blue-300 uppercase tracking-wider shadow-2xs">
                          <Building className="w-2.5 h-2.5 text-blue-600" />
                          {orderCompanies.join(', ')}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">ORD-{new Date(viewingOrder.createdAt).getTime().toString().slice(-6)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className={`px-2.5 py-1 rounded-none text-xs font-bold border ${
                    viewingOrder.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    viewingOrder.status === 'Shipped'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                         'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {viewingOrder.status === 'Delivered' ? tCommon.delivered :
                     viewingOrder.status === 'Shipped'   ? tCommon.shipped :
                     tCommon.pending}
                  </span>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="flex gap-3 text-xs text-slate-500 font-semibold">
                      <span>SR: <span className="text-slate-800">{viewingOrder.srName}</span></span>
                      <span>·</span>
                      <span>{viewingOrder.routeName}</span>
                      <span>·</span>
                      <span>{viewingOrder.deliveryManName}</span>
                    </div>
                    {viewingOrder.customerName && (
                      <div className="text-xs text-indigo-650 font-extrabold flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {language === 'bn' ? 'দোকান:' : 'Customer/Shop:'} {viewingOrder.customerName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Settlement numbers — compact horizontal row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: language === 'bn' ? 'চালানি সরবরাহ' : 'Dispatched', value: `৳${settlement?.totalDispatchedValue.toLocaleString('en-BD')}`, sub: `${settlement?.totalDispatchedQty} units`, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
                  // Net Market Collection = Dispatched − Returned − Damaged
                  { label: language === 'bn' ? 'নিট মার্কেট কালেকশন' : 'Net Market Collection', value: `৳${settlement?.totalSoldValue.toLocaleString('en-BD')}`, sub: `${settlement?.totalSoldQty} units`, color: 'text-blue-700', bg: 'bg-blue-50/60 border-blue-100' },
                  { label: language === 'bn' ? 'মোট ফেরত' : 'Returned', value: `৳${settlement?.totalReturnedValue.toLocaleString('en-BD')}`, sub: `${settlement?.totalReturnedQty} returned`, color: 'text-amber-700', bg: 'bg-amber-50/60 border-amber-100' },
                  { label: language === 'bn' ? 'ড্যামেজ (কোম্পানি কাছে দাবি)' : 'Damage (Claim from Co.)', value: `৳${settlement?.totalDamagedValue.toLocaleString('en-BD')}`, sub: `${settlement?.totalDamagedQty} damaged`, color: 'text-rose-700', bg: 'bg-rose-50/60 border-rose-100' },
                ].map((m, i) => (
                  <div key={i} className={`rounded-none border p-3 ${m.bg}`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{m.label}</p>
                    <p className={`font-mono font-extrabold text-base mt-0.5 ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Cash flow + Net receivable */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-none p-3.5 space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{language === 'bn' ? 'ক্যাশ ফ্লো' : 'Cash Flow'}</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{language === 'bn' ? 'নেট কালেকশন' : 'Net Collection'}:</span>
                    <span className="font-mono font-bold text-slate-800">৳{settlement?.totalNetValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{language === 'bn' ? 'ডিসকাউন্ট' : 'Discounts'}:</span>
                    <span className="font-mono text-slate-600">৳{settlement?.totalCommission.toLocaleString('en-BD')}</span>
                  </div>
                </div>
                <div className="sm:w-44 bg-emerald-50 border border-emerald-200 rounded-none p-3.5 flex flex-col justify-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">{language === 'bn' ? 'মালিকের নিট পাওনা' : 'Owner Net Receivable'}</p>
                  <p className="text-2xl font-mono font-black text-emerald-700 mt-1">৳{settlement?.netToOwner.toLocaleString('en-BD')}</p>
                </div>
                {(() => {
                  const orderProfitVal = viewingOrder.items.reduce((sum, item) => {
                    const pp = products.find(p => p.name === item.productName)?.defaultPP ?? item.rate * 0.85;
                    const netQty = Math.max(0, item.qty - (item.returnedQty || 0));
                    const cogs = netQty * pp;
                    const revenue = (netQty * item.rate) - (item.commissionAmount || 0) + (item.extraProfitAmount || 0);
                    return sum + (revenue - cogs);
                  }, 0);
                  const isPositive = orderProfitVal >= 0;
                  return (
                    <div className={`sm:w-44 border rounded-none p-3.5 flex flex-col justify-center ${
                      isPositive 
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-750' 
                        : 'bg-rose-50 border-rose-200 text-rose-750'
                    }`}>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${
                        isPositive ? 'text-indigo-600' : 'text-rose-600'
                      }`}>
                        {language === 'bn' ? 'চালানের নিট লাভ' : 'Challan Net Profit'}
                      </p>
                      <p className={`text-2xl font-mono font-black mt-1 ${isPositive ? 'text-indigo-700' : 'text-rose-750'}`}>
                        ৳{Math.round(orderProfitVal).toLocaleString('en-BD')}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">Products in Order ({viewingOrder.itemCount})</p>
                <div className="overflow-x-auto border border-slate-200 rounded-none">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Product</th>
                        <th className="px-3 py-2.5 font-semibold text-right text-indigo-600">DP (৳)</th>
                        <th className="px-3 py-2.5 font-semibold text-right text-emerald-600">TP (৳)</th>
                        <th className="px-3 py-2.5 font-semibold text-center">Order Qty</th>
                        <th className="px-3 py-2.5 font-semibold text-center text-blue-600">Bonus</th>
                        <th className="px-3 py-2.5 font-semibold text-center text-rose-600">Return</th>
                        <th className="px-3 py-2.5 font-semibold text-center text-amber-600">Damage</th>
                        <th className="px-3 py-2.5 font-semibold text-center text-emerald-700">Net Qty</th>
                        <th className="px-3 py-2.5 font-semibold text-right">Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {viewingOrder.items.map((item, idx) => {
                        const prod = products.find(p => p.name === item.productName);
                        const netQty = Math.max(0, item.qty - (item.returnedQty || 0) - (item.damagedQty || 0));
                        const hasRet = (item.returnedQty || 0) > 0;
                        const hasDmg = (item.damagedQty || 0) > 0;
                        return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-800">{item.productName}</p>
                              {(item.company || prod?.company) && (
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-none border border-blue-200 font-bold uppercase">
                                  {item.company || prod?.company}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500">{item.attribute}</p>
                            {hasRet && (
                              <p className="text-[9.5px] font-bold text-rose-600 mt-0.5">
                                🔄 Returned: {item.returnedQty} {item.selectedUnitName || 'Pcs'} (−৳{((item.returnedQty || 0) * item.rate).toFixed(2)})
                              </p>
                            )}
                            {hasDmg && (
                              <p className="text-[9.5px] font-bold text-amber-600 mt-0.5">
                                ⚠️ Damaged: {item.damagedQty} {item.selectedUnitName || 'Pcs'} (−৳{((item.damagedQty || 0) * item.rate).toFixed(2)})
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-mono font-bold text-indigo-700 text-xs">
                              {prod ? prod.defaultPP.toLocaleString('en-BD') : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span className="font-mono font-bold text-emerald-700 text-xs">
                              {prod ? prod.defaultWSP.toLocaleString('en-BD') : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-800">{item.qty}</td>
                          <td className="px-3 py-2.5 text-center font-mono text-blue-600">+{item.bonusQty}</td>
                          <td className={`px-3 py-2.5 text-center font-mono font-bold ${hasRet ? 'bg-rose-50 text-rose-600' : 'text-slate-400'}`}>
                            {hasRet ? `−${item.returnedQty}` : '0'}
                          </td>
                          <td className={`px-3 py-2.5 text-center font-mono font-bold ${hasDmg ? 'bg-amber-50 text-amber-600' : 'text-slate-400'}`}>
                            {hasDmg ? `−${item.damagedQty}` : '0'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-black bg-emerald-50 text-emerald-800">
                            {netQty}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{(item.totalAmount).toLocaleString('en-BD')}</td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center justify-between pt-3 gap-2 border-t border-slate-200 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <span>{language === 'bn' ? 'মোট অর্ডার:' : 'Ordered:'} <strong className="text-slate-900 font-mono">{viewingOrder.items.reduce((s, it) => s + (it.qty || 0), 0)} units</strong></span>
                    {viewingOrder.items.some(it => (it.returnedQty || 0) > 0) && (
                      <span className="text-rose-600">{language === 'bn' ? 'ফেরত:' : 'Returned:'} <strong className="font-mono">−{viewingOrder.items.reduce((s, it) => s + (it.returnedQty || 0), 0)} (৳{viewingOrder.items.reduce((s, it) => s + ((it.returnedQty || 0) * it.rate), 0).toFixed(2)})</strong></span>
                    )}
                    {viewingOrder.items.some(it => (it.damagedQty || 0) > 0) && (
                      <span className="text-amber-600">{language === 'bn' ? 'ড্যামেজ:' : 'Damaged:'} <strong className="font-mono">−{viewingOrder.items.reduce((s, it) => s + (it.damagedQty || 0), 0)} (৳{viewingOrder.items.reduce((s, it) => s + ((it.damagedQty || 0) * it.rate), 0).toFixed(2)})</strong></span>
                    )}
                    <span className="text-emerald-700 font-semibold">{language === 'bn' ? 'প্রকৃত ডেলিভারি:' : 'Delivered:'} <strong className="font-mono">{viewingOrder.items.reduce((s, it) => s + Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)), 0)} units (৳{viewingOrder.items.reduce((s, it) => s + (Math.max(0, it.qty - (it.returnedQty || 0) - (it.damagedQty || 0)) * it.rate), 0).toFixed(2)})</strong></span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{language === 'bn' ? 'সর্বমোট প্রদেয়:' : 'Order Total:'} <span className="font-mono text-lg text-emerald-600 font-extrabold">৳{viewingOrder.totalAmount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                </div>
              </div>
            </div>
 
            <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 shrink-0 rounded-none-b-xl">
              {/* Left Side: Document actions + Edit */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  id="viewing-challan-btn-print-sheet"
                  type="button"
                  onClick={() => printChallanSheet(viewingOrder.items)}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'চালান শিট' : 'Challan Sheet'}
                </button>
                <button
                  id="viewing-challan-btn-print"
                  type="button"
                  onClick={() => printChallanInvoice(viewingOrder.items)}
                  className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
                </button>
                <button
                  id="viewing-challan-btn-email"
                  type="button"
                  onClick={async () => {
                    if (!viewingOrder?.items || viewingOrder.items.length === 0) return;
                    showToast(language === 'bn' ? 'ইমেইল ইনভয়েস পাঠানো হচ্ছে...' : 'Sending email invoice...');
                    const res = await sendInvoiceEmail(viewingOrder);
                    if (res.success) {
                      showToast(language === 'bn' ? 'চালানের ইনভয়েস ইমেইল সফলভাবে পাঠানো হয়েছে!' : 'Invoice email sent successfully via Resend!', 'success');
                    } else {
                      showToast(res.message || (language === 'bn' ? 'ইমেইল পাঠানো ব্যর্থ হয়েছে।' : 'Failed to send invoice email.'), 'error');
                    }
                  }}
                  className="px-4 py-2.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center gap-1.5"
                  title="Send invoice copy via Resend"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  {language === 'bn' ? 'ইমেইল ইনভয়েস' : 'Email Invoice'}
                </button>
                {viewingOrder.status !== 'Delivered' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewingOrder(null);
                      handleOpenEditOrderModal(viewingOrder);
                    }}
                    className="px-4 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {language === 'bn' ? 'এডিট করুন' : 'Edit Order'}
                  </button>
                )}
              </div>

              {/* Right Side: Status transitions + Close */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {viewingOrder.status === 'Shipped' && (
                  <button
                    type="button"
                    onClick={() => handleGroupStatusChange(viewingOrder.id, 'Pending')}
                    className="px-4 py-2.5 bg-rose-50 border border-rose-250 hover:bg-rose-100 text-rose-700 font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                  >
                    {language === 'bn' ? 'পেন্ডিং এ ফেরত' : 'Revert to Pending'}
                  </button>
                )}
                
                {viewingOrder.status === 'Pending' && (
                  <button
                    type="button"
                    onClick={() => handleGroupStatusChange(viewingOrder.id, 'Shipped')}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-bold rounded-none text-xs transition-all active:scale-95 text-center shadow-md cursor-pointer"
                  >
                    {language === 'bn' ? 'চালান প্রেরণ করুন' : 'Ship Order'}
                  </button>
                )}

                {viewingOrder.status === 'Shipped' && (
                  <button
                    type="button"
                    onClick={() => handleGroupStatusChange(viewingOrder.id, 'Delivered')}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 font-bold rounded-none text-xs transition-all active:scale-95 text-center shadow-md cursor-pointer"
                  >
                    {language === 'bn' ? 'ডেলিভারি সেটেল করুন' : 'Settle Delivery'}
                  </button>
                )}

                <button
                  id="viewing-challan-btn-close"
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-none text-xs transition-all active:scale-95 text-center shadow-md cursor-pointer"
                >
                  {tChallan.closeVoucher}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition & Settlement Modal */}
      {settlementOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-lg">
                  {language === 'bn' 
                    ? `চালান সেটেলমেন্ট এবং স্থিতি পরিবর্তন (${settlementStatus})` 
                    : `Challan Settlement & Status Transition (${settlementStatus})`}
                </h3>
              </div>
              <button
                id="settlement-modal-close"
                onClick={() => setSettlementOrder(null)}
                className="p-1.5 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettlement} className="modal-body p-6 space-y-6">
              
              {/* Order Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-none border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">{language === 'bn' ? 'অর্ডার নম্বর' : 'Order ID'}</p>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    ORD-{new Date(settlementOrder.createdAt).getTime().toString().slice(-6)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-455 font-semibold uppercase tracking-wider">{language === 'bn' ? 'কোম্পানি' : 'Company'}</p>
                  {(() => {
                    const orderCos = Array.from(new Set(settlementOrder.items.map(i => i.company || products.find(p => p.name === i.productName)?.company).filter(Boolean)));
                    return (
                      <p className="font-bold text-blue-700 text-sm mt-0.5 uppercase">
                        {orderCos.length > 0 ? orderCos.join(', ') : 'General'}
                      </p>
                    );
                  })()}
                </div>
                <div>
                  <p className="text-slate-455 font-semibold uppercase tracking-wider">SR Name</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{settlementOrder.srName}</p>
                </div>
                <div>
                  <p className="text-slate-455 font-semibold uppercase tracking-wider">Delivery Agent</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{settlementOrder.deliveryManName}</p>
                </div>
                <div>
                  <p className="text-slate-455 font-semibold uppercase tracking-wider">Route</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{settlementOrder.routeName}</p>
                </div>
              </div>

              {/* Items Table for Return & Damage inputs */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  {language === 'bn' ? 'প্রোডাক্ট তালিকা ও হিসাব সংশোধন করুন' : 'Confirm Product Quantities & Accounts'}
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-none">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-center w-24">Sent Qty</th>
                        <th className="px-4 py-3 font-semibold text-center">
                          {language === 'bn' ? 'ফেরত (কার্টন + পিস)' : 'Return (Ctn + Pcs)'}
                        </th>
                        <th className="px-4 py-3 font-semibold text-center">
                          {language === 'bn' ? 'ড্যামেজ (কার্টন + পিস)' : 'Damage (Ctn + Pcs)'}
                        </th>
                        <th className="px-4 py-3 font-semibold text-center w-24">Sold Qty</th>
                        <th className="px-4 py-3 font-semibold text-right w-28">Net Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {settlementOrder.items.map((item) => {
                        const prod = products.find(p => (p.name || '').trim().toLowerCase() === (item.productName || '').trim().toLowerCase());
                        const cs = (prod?.cartonSize && prod.cartonSize > 1) ? prod.cartonSize : 24;
                        const qUpdates = settlementQuantities[item.id] || {
                          returned: 0, damaged: 0,
                          returnedCartons: 0, returnedPcs: 0,
                          damagedCartons: 0, damagedPcs: 0
                        };
                        const returned = qUpdates.returned;
                        const damaged  = qUpdates.damaged;
                        const sold = Math.max(0, item.qty - returned);
                        const netAmount = ((item.qty - returned - damaged) * item.rate) - (item.commissionAmount || 0);

                        const updateSplitQty = (
                          field: 'returnedCartons' | 'returnedPcs' | 'damagedCartons' | 'damagedPcs',
                          rawVal: number
                        ) => {
                          setSettlementQuantities(prev => {
                            const cur = prev[item.id] || { returned: 0, damaged: 0, returnedCartons: 0, returnedPcs: 0, damagedCartons: 0, damagedPcs: 0 };
                            const next = { ...cur, [field]: Math.max(0, rawVal) };
                            next.returned = next.returnedCartons * cs + next.returnedPcs;
                            next.damaged  = next.damagedCartons  * cs + next.damagedPcs;
                            return { ...prev, [item.id]: next };
                          });
                        };

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{item.productName}</p>
                              <p className="text-[10px] text-slate-500">
                                {item.attribute} • Rate: ৳{item.rate}
                                <span className="ml-1 text-indigo-500 font-bold">({cs} pcs/ctn)</span>
                              </p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                              {item.qty > 0 ? (
                                <>
                                  <div>{Math.floor(item.qty / cs)} Ctn + {item.qty % cs} Pcs</div>
                                  <div className="text-[9px] text-slate-400">({item.qty} Pcs)</div>
                                </>
                              ) : (
                                <div>0 Pcs</div>
                              )}
                            </td>
                            {/* Return column */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-center">
                                <div className="text-center">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Ctn</p>
                                  <input type="number" min="0"
                                    value={qUpdates.returnedCartons}
                                    onChange={e => updateSplitQty('returnedCartons', Number(e.target.value))}
                                    className="h-8 w-14 text-center font-mono font-semibold rounded-none border border-amber-200 focus:border-amber-500 outline-none bg-amber-50" />
                                </div>
                                <span className="text-slate-300 text-xs mt-3">+</span>
                                <div className="text-center">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Pcs</p>
                                  <input type="number" min="0"
                                    value={qUpdates.returnedPcs}
                                    onChange={e => updateSplitQty('returnedPcs', Number(e.target.value))}
                                    className="h-8 w-14 text-center font-mono font-semibold rounded-none border border-amber-200 focus:border-amber-500 outline-none bg-amber-50" />
                                </div>
                              </div>
                              {returned > 0 && <p className="text-[9px] text-amber-600 text-center mt-1 font-mono font-bold">= {returned} pcs</p>}
                            </td>
                            {/* Damage column */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-center">
                                <div className="text-center">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Ctn</p>
                                  <input type="number" min="0"
                                    value={qUpdates.damagedCartons}
                                    onChange={e => updateSplitQty('damagedCartons', Number(e.target.value))}
                                    className="h-8 w-14 text-center font-mono font-semibold rounded-none border border-rose-200 focus:border-rose-500 outline-none bg-rose-50" />
                                </div>
                                <span className="text-slate-300 text-xs mt-3">+</span>
                                <div className="text-center">
                                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Pcs</p>
                                  <input type="number" min="0"
                                    value={qUpdates.damagedPcs}
                                    onChange={e => updateSplitQty('damagedPcs', Number(e.target.value))}
                                    className="h-8 w-14 text-center font-mono font-semibold rounded-none border border-rose-200 focus:border-rose-500 outline-none bg-rose-50" />
                                </div>
                              </div>
                              {damaged > 0 && (
                                <p className="text-[9px] text-rose-600 text-center mt-1 font-mono font-bold">
                                  = {damaged} pcs (৳{(damaged * item.rate).toLocaleString('en-BD')})
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-blue-700 bg-blue-50/20">
                              {sold > 0 ? (
                                <>
                                  <div>{Math.floor(sold / cs)} Ctn + {sold % cs} Pcs</div>
                                  <div className="text-[9px] text-blue-500">({sold} Pcs)</div>
                                </>
                              ) : (
                                <div>0 Pcs</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-extrabold">
                              <span className={netAmount < 0 ? "text-rose-600 font-black" : "text-slate-800"}>
                                {netAmount < 0 ? `-৳${Math.abs(netAmount).toLocaleString('en-BD')}` : `৳${netAmount.toLocaleString('en-BD')}`}
                              </span>
                              {damaged > 0 && (
                                <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                                  (-৳{(damaged * item.rate).toLocaleString('en-BD')})
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement accounting summary dashboard */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-none border border-slate-200">
                <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {language === 'bn' ? 'সেটেলমেন্ট সামারি প্রাকদর্শন (রিয়েল-টাইম)' : 'Settlement Preview (Real-time)'}
                </p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white border border-slate-200 rounded-none p-3">
                    <span className="text-slate-400 font-bold block">{language === 'bn' ? 'সরবরাহকৃত চালানি মূল্য' : 'Dispatched Value'}</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">৳{transitionSettlement?.totalDispatchedValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-none p-3">
                    <span className="text-blue-600 font-bold block">{language === 'bn' ? 'গ্রাহক গ্রহণ করেছে' : 'Customer Accepted'}</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm">৳{transitionSettlement?.totalSoldValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-none p-3">
                    <span className="text-amber-600 font-bold block">{language === 'bn' ? 'ফেরত মূল্য' : 'Returned Value'}</span>
                    <span className="font-mono font-bold text-amber-900 text-sm">৳{transitionSettlement?.totalReturnedValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-none p-3">
                    <span className="text-rose-600 font-bold block">{language === 'bn' ? 'ড্যামেজ (কোম্পানি কাছে দাবি)' : 'Damage (Claim from Co.)'}</span>
                    <span className="font-mono font-bold text-rose-900 text-sm">৳{transitionSettlement?.totalDamagedValue.toLocaleString('en-BD')}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 text-xs">
                  <div className="flex flex-col justify-center">
                    <span className="text-slate-550 block font-bold mb-1">{language === 'bn' ? 'মালিক পাবেন (কমিশন কমিয়ে)' : 'Owner Receivable (After Commissions)'}:</span>
                    <span className="font-mono font-black text-slate-800 text-base">৳{transitionSettlement?.totalNetValue.toLocaleString('en-BD')}</span>
                  </div>
                </div>

                {/* Commission, DSR Commission, and Extra Profit adjustment during settlement */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">{language === 'bn' ? 'কমিশন (টাকা)' : 'Commission (Tk)'}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settlementSRCommValue}
                      onChange={(e) => setSettlementSRCommValue(Number(e.target.value))}
                      className="h-9 w-full rounded-none border border-indigo-200 bg-white px-3 text-xs font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">{language === 'bn' ? 'ডিএসআর কমিশন (টাকা)' : 'DSR Commission (Tk)'}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settlementDSRCommRate}
                      onChange={(e) => setSettlementDSRCommRate(Number(e.target.value))}
                      className="h-9 w-full rounded-none border border-orange-200 bg-white px-3 text-xs font-semibold outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-700 mb-1">{language === 'bn' ? 'অতিরিক্ত মুনাফা (টাকা) ↑' : 'Extra Profit (Tk) ↑'}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settlementExtraCommValue}
                      onChange={(e) => setSettlementExtraCommValue(Number(e.target.value))}
                      className="h-9 w-full rounded-none border border-emerald-200 bg-white px-3 text-xs font-semibold outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-none flex items-center justify-between mt-2">
                  <span className="font-extrabold text-emerald-800 text-xs">
                    {language === 'bn' ? 'মালিকের নিট পাওনা (পাবেন)' : 'Owner Net Receivable'}
                  </span>
                  <span className="font-mono font-black text-emerald-700 text-lg">
                    ৳{transitionSettlement?.netToOwner.toLocaleString('en-BD')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setSettlementOrder(null)}
                  className="h-10 rounded-none border-2 border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  {tCommon.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-none bg-indigo-600 px-5 text-xs font-extrabold text-white hover:bg-indigo-700 transition-all shrink-0 cursor-pointer border border-indigo-700 shadow-md"
                >
                  {language === 'bn' ? 'সেটেল করুন ও স্থিতি সংরক্ষণ করুন' : 'Confirm Settlement & Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-none border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-lg">
                  {language === 'bn' ? 'অর্ডার সংশোধন ও আপডেট' : 'Edit Order & Sales Details'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit Mode Lock Toggle */}
                <button
                  type="button"
                  onClick={() => setEditModeEnabled(prev => !prev)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-bold border transition-all cursor-pointer ${
                    editModeEnabled
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                      : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  {editModeEnabled ? (
                    <><span>🔓</span> {language === 'bn' ? 'সম্পাদনা চলছে' : 'Editing Enabled'}</>
                  ) : (
                    <><span>🔒</span> {language === 'bn' ? 'সম্পাদনা লক' : 'Click to Edit'}</>
                  )}
                </button>
                <button
                  id="challan-modal-edit-close"
                  type="button"
                  onClick={() => { setEditingOrder(null); setEditModeEnabled(false); }}
                  className="p-1.5 rounded-none text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prominent Company & Brand Banner */}
            {(() => {
              const orderCompanies = Array.from(new Set(editOrderItems.map(i => i.company || products.find(p => p.name === i.productName)?.company).filter(Boolean)));
              const displayCo = orderCompanies.length > 0 ? orderCompanies.join(', ') : 'General Brand';
              return (
                <div className="mx-6 mt-4 p-3.5 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-none flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {language === 'bn' ? 'কোম্পানি / ব্র্যান্ড:' : 'Company / Brand:'}
                    </span>
                    <span className="px-3 py-0.5 bg-blue-600 text-white font-extrabold text-xs rounded-none shadow-sm uppercase tracking-wider">
                      {displayCo}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-bold hidden sm:inline">
                    {language === 'bn' ? '🏢 এই চালানের সকল পণ্য এই কোম্পানির অধীনে সংরক্ষিত' : '🏢 All products in this challan belong to this company'}
                  </span>
                </div>
              );
            })()}

            {/* Locked notice banner */}
            {!editModeEnabled && (
              <div className="mx-6 mt-4 flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-none px-4 py-3 text-xs font-semibold text-amber-800">
                <span className="text-base">🔒</span>
                <span>{language === 'bn' ? 'ভিউ মোড — পরিবর্তন করতে উপরে "Click to Edit" বাটনে ক্লিক করুন।' : 'View mode — click the "Click to Edit" button above to unlock and make changes.'}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditOrder} className="modal-body p-6 space-y-5 text-sm">
              
              {/* Order Settings Section */}
              <div className="bg-slate-50 p-4 rounded-none border border-slate-200 space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  {language === 'bn' ? 'অর্ডার লেভেল সেটিংস' : 'Order Level Settings'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">SR / Salesperson</label>
                    {editModeEnabled ? (
                      <select
                        value={editSR}
                        onChange={(e) => setEditSR(e.target.value)}
                        className="h-10 w-full rounded-none border border-blue-300 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                      >
                        {filteredSrsForEdit.map(sr => <option key={sr.id} value={sr.name}>{sr.name}</option>)}
                      </select>
                    ) : (
                      <div className="h-10 w-full rounded-none border border-slate-200 bg-slate-100 px-3 flex items-center text-xs font-semibold text-slate-700 select-none">{editSR}</div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Route Beat</label>
                    {editModeEnabled ? (
                      <select
                        value={editRoute}
                        onChange={(e) => {
                          const routeName = e.target.value;
                          setEditRoute(routeName);
                          const routeObj = routes.find(r => r.name === routeName);
                          if (routeObj) {
                            const srObj = srs.find(s => s.id === routeObj.assignedSRId);
                            if (srObj) setEditSR(srObj.name);
                            const dmObj = deliveryMen.find(dm => dm.id === routeObj.assignedDeliveryManId);
                            if (dmObj) setEditDeliveryMan(dmObj.name);
                          }
                        }}
                        className="h-10 w-full rounded-none border border-blue-300 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                      >
                        {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    ) : (
                      <div className="h-10 w-full rounded-none border border-slate-200 bg-slate-100 px-3 flex items-center text-xs font-semibold text-slate-700 select-none">{editRoute}</div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Delivery Agent</label>
                    {editModeEnabled ? (
                      <select
                        value={editDeliveryMan}
                        onChange={(e) => setEditDeliveryMan(e.target.value)}
                        className="h-10 w-full rounded-none border border-blue-300 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                      >
                        {deliveryMen.map(dm => <option key={dm.id} value={dm.name}>{dm.name}</option>)}
                      </select>
                    ) : (
                      <div className="h-10 w-full rounded-none border border-slate-200 bg-slate-100 px-3 flex items-center text-xs font-semibold text-slate-700 select-none">{editDeliveryMan}</div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Order Status</label>
                    {editModeEnabled ? (
                      <select
                        value={editStatus}
                        onChange={(e: any) => setEditStatus(e.target.value)}
                        className="h-10 w-full rounded-none border border-blue-300 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    ) : (
                      <div className="h-10 w-full rounded-none border border-slate-200 bg-slate-100 px-3 flex items-center text-xs font-semibold select-none">
                        <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-bold border uppercase tracking-wider ${
                          editStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          editStatus === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>{editStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Products List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  {language === 'bn' ? 'পণ্য সংশোধন তালিকা' : 'Modify Order Products'}
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-none">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Product Name</th>
                        <th className="px-3 py-2.5 text-right text-indigo-650">DP (৳)</th>
                        <th className="px-3 py-2.5 text-right text-emerald-650">TP (৳)</th>
                        <th className="px-3 py-2.5 text-center w-24">Billing Qty</th>
                        <th className="px-3 py-2.5 text-center w-24">Returned Qty</th>
                        <th className="px-3 py-2.5 text-center w-24">Damaged Qty</th>
                        <th className="px-3 py-2.5 text-right">Amount (৳)</th>
                        <th className="px-3 py-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-250 bg-white">
                      {editOrderItems.map((item, idx) => {
                        const prod = products.find(p => (p.name || '').trim().toLowerCase() === (item.productName || '').trim().toLowerCase());
                        const cs = (prod?.cartonSize && prod.cartonSize > 1) ? prod.cartonSize : 24;

                        const qtyCtn = Math.floor(item.qty / cs);
                        const qtyPcs = item.qty % cs;

                        const retCtn = Math.floor((item.returnedQty || 0) / cs);
                        const retPcs = (item.returnedQty || 0) % cs;

                        const dmgCtn = Math.floor((item.damagedQty || 0) / cs);
                        const dmgPcs = (item.damagedQty || 0) % cs;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-800">{item.productName}</p>
                                {(item.company || prod?.company) && (
                                  <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-none border border-blue-200 font-bold uppercase">
                                    {item.company || prod?.company}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500">
                                {item.attribute} <span className="text-indigo-600 font-bold">({cs} pcs/ctn)</span>
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-indigo-700 font-bold">
                              {prod ? prod.defaultPP.toLocaleString('en-BD') : '—'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-emerald-700 font-bold">
                              {prod ? prod.defaultWSP.toLocaleString('en-BD') : '—'}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {editModeEnabled ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Ctn</span>
                                      <input
                                        type="number" min="0"
                                        value={qtyCtn}
                                        onChange={(e) => updateEditItemSplit(item.id, 'qty', 'ctn', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-blue-300 text-center font-semibold font-mono text-xs focus:border-blue-500 outline-none bg-blue-50/20"
                                      />
                                    </div>
                                    <span className="text-slate-300 text-xs mt-3">+</span>
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Pcs</span>
                                      <input
                                        type="number" min="0"
                                        value={qtyPcs}
                                        onChange={(e) => updateEditItemSplit(item.id, 'qty', 'pcs', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-blue-300 text-center font-semibold font-mono text-xs focus:border-blue-500 outline-none bg-blue-50/20"
                                      />
                                    </div>
                                  </div>
                                  <span className="text-[8.5px] font-mono text-blue-700 font-bold">= {item.qty} pcs</span>
                                </div>
                              ) : (
                                <div className="text-center font-mono">
                                  <div className="font-bold text-slate-800 text-xs">
                                    {qtyCtn} Ctn + {qtyPcs} Pcs
                                  </div>
                                  <div className="text-[9px] text-slate-400">({item.qty} Pcs)</div>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {editModeEnabled ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Ctn</span>
                                      <input
                                        type="number" min="0"
                                        value={retCtn}
                                        onChange={(e) => updateEditItemSplit(item.id, 'returnedQty', 'ctn', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-amber-300 text-center font-semibold font-mono text-xs focus:border-amber-500 outline-none bg-amber-50/30"
                                      />
                                    </div>
                                    <span className="text-slate-300 text-xs mt-3">+</span>
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Pcs</span>
                                      <input
                                        type="number" min="0"
                                        value={retPcs}
                                        onChange={(e) => updateEditItemSplit(item.id, 'returnedQty', 'pcs', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-amber-300 text-center font-semibold font-mono text-xs focus:border-amber-500 outline-none bg-amber-50/30"
                                      />
                                    </div>
                                  </div>
                                  <span className="text-[8.5px] font-mono text-amber-700 font-bold">= {item.returnedQty || 0} pcs</span>
                                </div>
                              ) : (
                                <div className="text-center font-mono">
                                  <div className="font-bold text-amber-700 text-xs">
                                    {retCtn} Ctn + {retPcs} Pcs
                                  </div>
                                  {(item.returnedQty || 0) > 0 && <div className="text-[9px] text-amber-600 font-bold">({item.returnedQty} Pcs)</div>}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {editModeEnabled ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Ctn</span>
                                      <input
                                        type="number" min="0"
                                        value={dmgCtn}
                                        onChange={(e) => updateEditItemSplit(item.id, 'damagedQty', 'ctn', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-rose-300 text-center font-semibold font-mono text-xs focus:border-rose-500 outline-none bg-rose-50/30"
                                      />
                                    </div>
                                    <span className="text-slate-300 text-xs mt-3">+</span>
                                    <div className="text-center">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase">Pcs</span>
                                      <input
                                        type="number" min="0"
                                        value={dmgPcs}
                                        onChange={(e) => updateEditItemSplit(item.id, 'damagedQty', 'pcs', Number(e.target.value))}
                                        className="w-12 h-7 rounded-none border border-rose-300 text-center font-semibold font-mono text-xs focus:border-rose-500 outline-none bg-rose-50/30"
                                      />
                                    </div>
                                  </div>
                                  <span className="text-[8.5px] font-mono text-rose-700 font-bold">= {item.damagedQty || 0} pcs</span>
                                </div>
                              ) : (
                                <div className="text-center font-mono">
                                  <div className="font-bold text-rose-600 text-xs">
                                    {dmgCtn} Ctn + {dmgPcs} Pcs
                                  </div>
                                  {(item.damagedQty || 0) > 0 && <div className="text-[9px] text-rose-600 font-bold">({item.damagedQty} Pcs)</div>}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">
                              {(item.totalAmount).toLocaleString('en-BD')}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {editModeEnabled ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditOrderItem(item.id)}
                                  className="p-1 rounded-none bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                                  title="Remove Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="inline-block p-1 rounded-none bg-slate-100 text-slate-300 cursor-not-allowed">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {editOrderItems.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 font-semibold">
                            {language === 'bn' ? 'অর্ডারে কোনো পণ্য নেই।' : 'No products left in this order.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add Product Section for Active Orders */}
              {editModeEnabled && (editStatus === 'Pending' || editStatus === 'Shipped') && (
                <div className="bg-slate-50 p-4 rounded-none border border-slate-200 space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {language === 'bn' ? 'অর্ডারে নতুন পণ্য যোগ করুন' : 'Add New Product to Order'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-700 flex justify-between items-center">
                        <span>{language === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}</span>
                        {(() => {
                          const orderCompany = editOrderItems.length > 0 
                            ? products.find(p => p.name === editOrderItems[0].productName)?.company 
                            : null;
                          if (!orderCompany) return null;
                          return (
                            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-none border border-blue-200 uppercase tracking-wider">
                              {orderCompany} {language === 'bn' ? 'ব্র্যান্ড লকড' : 'Brand Locked'}
                            </span>
                          );
                        })()}
                      </label>
                      <select
                        id="edit-order-add-product-select"
                        defaultValue=""
                        onChange={(e) => {
                          const prodName = e.target.value;
                          if (!prodName) return;
                          handleAddNewProductToOrder(prodName);
                          e.target.value = ""; // Reset selection after adding
                        }}
                        className="h-10 w-full rounded-none border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer"
                      >
                        <option value="">
                          {language === 'bn' ? '--- পণ্য সিলেক্ট করুন ---' : '--- Choose Product ---'}
                        </option>
                        {(() => {
                          const orderCompany = editOrderItems.length > 0 
                            ? products.find(p => p.name === editOrderItems[0].productName)?.company 
                            : null;
                          return products
                            .filter(p => !editOrderItems.some(item => item.productName === p.name))
                            .filter(p => !orderCompany || p.company === orderCompany)
                            .map(p => (
                              <option key={p.id} value={p.name}>
                                {p.name} (Stock: {formatProductStock(p)}) - TP: ৳{p.defaultWSP}
                              </option>
                            ));
                        })()}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic summary calculations */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-t border-slate-200 pt-4">
                {[
                  { label: language === 'bn' ? 'চালানি সরবরাহ' : 'Dispatched', value: `৳${Number(editOrderItems.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0).toFixed(2)).toLocaleString('en-BD')}`, bg: 'bg-slate-50' },
                  // Net Market Collection / Sales Value = Dispatched − Returned − Damaged
                  { label: language === 'bn' ? 'নিট মার্কেট কালেকশন' : 'Net Market Collection', value: `৳${Number(editOrderItems.reduce((acc, curr) => acc + (Math.max(0, curr.qty - (curr.returnedQty || 0) - (curr.damagedQty || 0)) * curr.rate), 0).toFixed(2)).toLocaleString('en-BD')}`, bg: 'bg-blue-50/50', text: 'text-blue-700' },
                  { label: language === 'bn' ? 'মোট ফেরত' : 'Returned Value', value: `৳${Number(editOrderItems.reduce((acc, curr) => acc + ((curr.returnedQty || 0) * curr.rate), 0).toFixed(2)).toLocaleString('en-BD')}`, bg: 'bg-amber-50/50', text: 'text-amber-700' },
                  { label: language === 'bn' ? 'ড্যামেজ (কোম্পানি কাছে দাবি)' : 'Damage (Claim from Co.)', value: `৳${Number(editOrderItems.reduce((acc, curr) => acc + ((curr.damagedQty || 0) * curr.rate), 0).toFixed(2)).toLocaleString('en-BD')}`, bg: 'bg-rose-50/50', text: 'text-rose-700' },
                ].map((m, i) => (
                  <div key={i} className={`rounded-none border border-slate-200 p-2.5 ${m.bg}`}>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">{m.label}</span>
                    <span className={`font-mono font-extrabold text-sm mt-0.5 block ${m.text || 'text-slate-800'}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Payout / Net Collection */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-emerald-50 border border-emerald-250 p-4 rounded-none gap-2">
                <span className="font-extrabold text-emerald-800 text-xs">
                  {language === 'bn' ? 'মালিকের নিট পাওনা (পাবেন)' : 'Owner Net Receivable'}
                </span>
                <span className="font-mono font-black text-emerald-700 text-xl">
                  ৳{Number(editOrderItems.reduce((acc, curr) => acc + curr.totalAmount, 0).toFixed(2)).toLocaleString('en-BD')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditingOrder(null); setEditModeEnabled(false); }}
                  className="py-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-none text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editOrderItems.length === 0 || !editModeEnabled}
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-none text-sm transition-all shadow-md cursor-pointer disabled:bg-slate-200 disabled:text-slate-450 disabled:cursor-not-allowed active:scale-95"
                >
                  {editModeEnabled ? 'Save Order Changes' : (language === 'bn' ? 'সম্পাদনা সক্রিয় করুন' : 'Enable Edit to Save')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] animate-slide-in-right">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-none border shadow-lg max-w-sm ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
              : 'bg-rose-50 text-rose-850 border-rose-250'
          }`}>
            <span className="text-base">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
