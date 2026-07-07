'use client';

import React, { useState } from 'react';
import { 
  FileText, 
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
  Printer
} from 'lucide-react';
import { ChallanItem, SR, Route, DeliveryMan, Product, ProductAttribute } from '../types';
import { translations, Language } from '../translations';
import { printChallanInvoice, printChallanSheet } from '../lib/printUtils';

export interface GroupedOrder {
  id: string;
  items: ChallanItem[];
  createdAt: string;
  srName: string;
  routeName: string;
  deliveryManName: string;
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
  language
}: ChallanModuleProps) {
  const tCommon = translations[language].common;
  const tChallan = translations[language].challan;
  const tDash = translations[language].dashboard;

  // Search & Filters State
  const [filterSR, setFilterSR] = useState('');
  const [filterRoute, setFilterRoute] = useState('');
  const [filterDeliveryMan, setFilterDeliveryMan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Active searched filters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedSR, setAppliedSR] = useState('');
  const [appliedRoute, setAppliedRoute] = useState('');
  const [appliedDeliveryMan, setAppliedDeliveryMan] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

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
  const [settlementQuantities, setSettlementQuantities] = useState<Record<string, { returned: number, damaged: number }>>({});
  const [settlementSRCommValue, setSettlementSRCommValue] = useState<number>(0);

  // New Challan Creation Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState('');
  const [newAttribute, setNewAttribute] = useState('');
  const [newQty, setNewQty] = useState<number>(10);
  const [newBonusQty, setNewBonusQty] = useState<number>(0);
  const [newCommissionAmount, setNewCommissionAmount] = useState<number>(0);
  const [newSR, setNewSR] = useState('');
  const [newRoute, setNewRoute] = useState('');
  const [newDeliveryMan, setNewDeliveryMan] = useState('');
  const [newStatus, setNewStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');

  // Editing state for Challan
  const [editingChallan, setEditingChallan] = useState<ChallanItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [editBonusQty, setEditBonusQty] = useState<number>(0);
  const [editCommissionAmount, setEditCommissionAmount] = useState<number>(0);
  const [editRate, setEditRate] = useState<number>(0);
  const [editSR, setEditSR] = useState('');
  const [editRoute, setEditRoute] = useState('');
  const [editDeliveryMan, setEditDeliveryMan] = useState('');
  const [editStatus, setEditStatus] = useState<'Pending' | 'Shipped' | 'Delivered'>('Pending');
  const [editReturnedQty, setEditReturnedQty] = useState<number>(0);
  const [editDamagedQty, setEditDamagedQty] = useState<number>(0);

  // Filter application
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAppliedSearch(searchQuery);
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
    setFilterSR('');
    setFilterRoute('');
    setFilterDeliveryMan('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    setAppliedSearch('');
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
      // Create a unique key per "Order" using createdAt, SR, Route, and Delivery Man
      // This groups items created at the exact same moment.
      const key = `${item.createdAt}_${item.srName}_${item.routeName}_${item.deliveryManName}`;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          items: [],
          createdAt: item.createdAt,
          srName: item.srName,
          routeName: item.routeName,
          deliveryManName: item.deliveryManName,
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
    const matchesSearch = searchQuery 
      ? group.items.some(i => i.productName.toLowerCase().includes(appliedSearch.toLowerCase())) ||
        group.items.some(i => i.attribute.toLowerCase().includes(appliedSearch.toLowerCase()))
      : true;

    const matchesSR = appliedSR ? group.srName === appliedSR : true;
    const matchesRoute = appliedRoute ? group.routeName === appliedRoute : true;
    const matchesDeliveryMan = appliedDeliveryMan ? group.deliveryManName === appliedDeliveryMan : true;
    
    // Status tab filter
    const matchesStatus = selectedStatusTab === 'All' ? true : group.status === selectedStatusTab;

    const groupDateStr = group.createdAt.slice(0, 10);
    const matchesStartDate = appliedStartDate ? groupDateStr >= appliedStartDate : true;
    const matchesEndDate = appliedEndDate ? groupDateStr <= appliedEndDate : true;

    return matchesSearch && matchesSR && matchesRoute && matchesDeliveryMan && matchesStatus && matchesStartDate && matchesEndDate;
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
    
    let totalSoldQty = 0;
    let totalSoldValue = 0;
    
    let totalReturnedQty = 0;
    let totalReturnedValue = 0;
    
    let totalDamagedQty = 0;
    let totalDamagedValue = 0;
    
    let totalCommission = 0;
    let totalNetValue = 0;
    
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
      
      const sold = Math.max(0, dispatchedQty - returned - damaged);
      const soldVal = sold * rate;
      totalSoldQty += sold;
      totalSoldValue += soldVal;
      
      totalCommission += item.commissionAmount || 0;
      totalNetValue += item.totalAmount || 0;
    });

    const firstItem = viewingOrder.items[0];
    const hasSavedComm = viewingOrder.items.some(item => item.srCommissionAmount !== undefined);
    
    const srObj = srs.find(s => s.name.toLowerCase() === viewingOrder.srName.toLowerCase());
    const defaultAmount = srObj ? srObj.commissionRate : 0;
      
    const srCommission = hasSavedComm
      ? viewingOrder.items.reduce((sum, item) => sum + (item.srCommissionAmount || 0), 0)
      : defaultAmount;

    const srCommRateDisplay = language === 'bn' ? 'নির্ধারিত মূল্য' : 'Fixed Price';

    const dmCommRate = 2; // Default 2% Delivery Man Commission
    const deliveryManPay = totalSoldValue * (dmCommRate / 100);

    const netToOwner = totalNetValue - srCommission - deliveryManPay;

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
      
      const qUpdates = settlementQuantities[item.id] || { returned: 0, damaged: 0 };
      const returned = Number(qUpdates.returned) || 0;
      const returnedVal = returned * rate;
      totalReturnedQty += returned;
      totalReturnedValue += returnedVal;
      
      const damaged = Number(qUpdates.damaged) || 0;
      const damagedVal = damaged * rate;
      totalDamagedQty += damaged;
      totalDamagedValue += damagedVal;
      
      const sold = Math.max(0, dispatchedQty - returned - damaged);
      const soldVal = sold * rate;
      totalSoldQty += sold;
      totalSoldValue += soldVal;
      
      totalCommission += item.commissionAmount || 0;
      
      // Calculate net amount for this item
      const itemNet = soldVal - (item.commissionAmount || 0);
      totalNetValue += itemNet;
    });

    const srCommission = settlementSRCommValue;

    const srCommRateDisplay = language === 'bn' ? 'নির্ধারিত মূল্য' : 'Fixed Price';

    const dmCommRate = 2; // Default 2% Delivery Fee
    const deliveryManPay = totalSoldValue * (dmCommRate / 100);

    const netToOwner = totalNetValue - srCommission - deliveryManPay;

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
  }, [settlementOrder, settlementQuantities, srs, settlementSRCommValue, language]);

  // Auto-fill price or get default wholesale price for selected product
  const getProductWSP = (prodName: string) => {
    const prod = products.find(p => p.name === prodName);
    return prod ? prod.defaultWSP : 200; // fallback BDT 200
  };

  // Create Challan Handler
  const handleCreateChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct || !newSR || !newRoute || !newDeliveryMan) {
      alert('Please fill out all required fields (Product, SR, Route, and Delivery Man)');
      return;
    }

    const rate = getProductWSP(newProduct);
    const totalQty = Number(newQty) + Number(newBonusQty);
    const baseAmount = Number(newQty) * rate;
    const commissionAmount = Number(newCommissionAmount) || 0;
    const totalAmount = baseAmount - commissionAmount;

    const prodObj = products.find(p => p.name === newProduct);
    const company = prodObj ? prodObj.company : 'Pran';

    const srObj = srs.find(s => s.name === newSR);
    const commissionRate = srObj ? srObj.commissionRate : 5;
    const srCommissionAmount = totalAmount * (commissionRate / 100);

    const newChallan: ChallanItem = {
      id: `ch-${Date.now()}`,
      productName: newProduct,
      company,
      attribute: newAttribute || 'None',
      qty: Number(newQty),
      bonusQty: Number(newBonusQty),
      totalQty,
      rate,
      totalAmount,
      srName: newSR,
      routeName: newRoute,
      deliveryManName: newDeliveryMan,
      status: newStatus,
      returnedQty: 0,
      damagedQty: 0,
      commissionAmount,
      createdAt: new Date().toISOString()
    };

    // If new challan is created as 'Delivered', deduct stock immutably
    if (newStatus === 'Delivered') {
      const updatedProducts = products.map(p => {
        if (p.name === newProduct) {
          return {
            ...p,
            currentStock: p.currentStock - totalQty
          };
        }
        return p;
      });
      setProducts(updatedProducts);
    }

    setChallans(prev => [newChallan, ...prev]);
    setShowAddModal(false);
    
    // Reset form states
    setNewProduct('');
    setNewAttribute('');
    setNewQty(10);
    setNewBonusQty(0);
    setNewCommissionAmount(0);
    setNewSR('');
    setNewRoute('');
    setNewDeliveryMan('');
    setNewStatus('Pending');
  };

  const handleGroupStatusChange = (groupId: string, newStatus: 'Pending' | 'Shipped' | 'Delivered') => {
    const group = groupedData.find(g => g.id === groupId);
    if (!group) return;

    // Initialize quantity records
    const initialQtys: Record<string, { returned: number, damaged: number }> = {};
    group.items.forEach(item => {
      initialQtys[item.id] = {
        returned: item.returnedQty || 0,
        damaged: item.damagedQty || 0
      };
    });

    const firstItem = group.items[0];
    const srObj = srs.find(s => s.name.toLowerCase() === group.srName.toLowerCase());
    const defaultAmount = srObj ? srObj.commissionRate : 0;
    const initialValue = firstItem?.srCommissionAmount !== undefined 
      ? firstItem.srCommissionAmount 
      : defaultAmount;

    setSettlementSRCommValue(initialValue);

    setSettlementOrder(group);
    setSettlementStatus(newStatus);
    setSettlementQuantities(initialQtys);
  };

  const handleSaveSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementOrder) return;

    // Calculate total net value of updated items to distribute fixed commission proportionally
    let totalUpdatedNetValue = 0;
    const itemsToUpdate = settlementOrder.items.map(item => {
      const updates = settlementQuantities[item.id] || { returned: 0, damaged: 0 };
      const netQty = item.qty - (Number(updates.returned) || 0) - (Number(updates.damaged) || 0);
      const soldVal = Math.max(0, netQty) * item.rate;
      return {
        id: item.id,
        netValue: soldVal - (item.commissionAmount || 0)
      };
    });
    totalUpdatedNetValue = itemsToUpdate.reduce((sum, x) => sum + x.netValue, 0);

    const calculatedTotalSRComm = settlementSRCommValue;

    // Immutably update products based on delivery state transition
    const updatedProducts = products.map(p => {
      let currentStock = p.currentStock;
      let damagedStock = p.damagedStock || 0;

      settlementOrder.items.forEach(ch => {
        if (ch.productName === p.name) {
          const itemQtyUpdates = settlementQuantities[ch.id];
          if (itemQtyUpdates) {
            const newReturned = Number(itemQtyUpdates.returned) || 0;
            const newDamaged = Number(itemQtyUpdates.damaged) || 0;

            const wasDelivered = ch.status === 'Delivered';
            const isDelivered = settlementStatus === 'Delivered';

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
          }
        }
      });

      return {
        ...p,
        currentStock,
        damagedStock
      };
    });
    setProducts(updatedProducts);

    // Update all challan items
    setChallans(prev => {
      return prev.map(ch => {
        const itemQtyUpdates = settlementQuantities[ch.id];
        if (itemQtyUpdates) {
          const newReturned = Number(itemQtyUpdates.returned) || 0;
          const newDamaged = Number(itemQtyUpdates.damaged) || 0;

          const netQty = ch.qty - newReturned - newDamaged;
          const baseAmount = Math.max(0, netQty) * ch.rate;
          const totalAmount = baseAmount - (ch.commissionAmount || 0);

          const itemUpdate = itemsToUpdate.find(x => x.id === ch.id);
          const itemSRCommAmount = totalUpdatedNetValue > 0 && itemUpdate
            ? calculatedTotalSRComm * (itemUpdate.netValue / totalUpdatedNetValue)
            : 0;

          return {
            ...ch,
            status: settlementStatus,
            returnedQty: newReturned,
            damagedQty: newDamaged,
            totalAmount,
            srCommissionValue: settlementSRCommValue,
            srCommissionAmount: itemSRCommAmount
          };
        }
        return ch;
      });
    });

    // Update viewingOrder if active
    setViewingOrder(prev => {
      if (!prev || prev.id !== settlementOrder.id) return prev;
      const updatedItems = prev.items.map(item => {
        const updates = settlementQuantities[item.id];
        if (updates) {
          const newReturned = Number(updates.returned) || 0;
          const newDamaged = Number(updates.damaged) || 0;

          const netQty = item.qty - newReturned - newDamaged;
          const baseAmount = Math.max(0, netQty) * item.rate;
          const totalAmount = baseAmount - (item.commissionAmount || 0);

          const itemUpdate = itemsToUpdate.find(x => x.id === item.id);
          const itemSRCommAmount = totalUpdatedNetValue > 0 && itemUpdate
            ? calculatedTotalSRComm * (itemUpdate.netValue / totalUpdatedNetValue)
            : 0;

          return {
            ...item,
            status: settlementStatus,
            returnedQty: newReturned,
            damagedQty: newDamaged,
            totalAmount,
            srCommissionValue: settlementSRCommValue,
            srCommissionAmount: itemSRCommAmount
          };
        }
        return item;
      });
      return {
        ...prev,
        status: settlementStatus,
        items: updatedItems,
        totalQty: updatedItems.reduce((acc, curr) => acc + curr.totalQty, 0),
        totalAmount: updatedItems.reduce((acc, curr) => acc + curr.totalAmount, 0)
      };
    });

    setSettlementOrder(null);
    alert(language === 'bn' 
      ? 'চালান সেটেলমেন্ট এবং স্টক আপডেট সফল হয়েছে!' 
      : 'Challan settlement and stock updates saved successfully!');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে এই পুরো অর্ডারটি ডিলিট করতে চান?' : 'Are you sure you want to delete this entire order?')) return;
    const group = groupedData.find(g => g.id === groupId);
    if (!group) return;

    // Revert stock of any items that were delivered
    const updatedProducts = products.map(p => {
      let currentStock = p.currentStock;
      let damagedStock = p.damagedStock || 0;

      group.items.forEach(item => {
        if (item.productName === p.name && item.status === 'Delivered') {
          currentStock += (item.qty + item.bonusQty - item.returnedQty);
          damagedStock -= item.damagedQty;
        }
      });

      return {
        ...p,
        currentStock,
        damagedStock
      };
    });
    setProducts(updatedProducts);

    const itemIds = group.items.map(i => i.id);
    setChallans(prev => prev.filter(c => !itemIds.includes(c.id)));
  };

  const handleStatusChange = (id: string, newStatus: 'Pending' | 'Shipped' | 'Delivered') => {
    setChallans(prev => prev.map(ch => ch.id === id ? { ...ch, status: newStatus } : ch));
  };

  const handleOpenEditModal = (challan: ChallanItem) => {
    setEditingChallan(challan);
    setEditQty(challan.qty);
    setEditBonusQty(challan.bonusQty);
    setEditCommissionAmount(challan.commissionAmount ?? 0);
    setEditRate(challan.rate);
    setEditSR(challan.srName);
    setEditRoute(challan.routeName);
    setEditDeliveryMan(challan.deliveryManName);
    setEditStatus(challan.status);
    setEditReturnedQty(challan.returnedQty || 0);
    setEditDamagedQty(challan.damagedQty || 0);
  };

  const handleSaveEditChallan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChallan) return;

    const oldTotalQty = editingChallan.qty + (editingChallan.bonusQty || 0);
    const newTotalQty = Number(editQty) + Number(editBonusQty);

    const wasDelivered = editingChallan.status === 'Delivered';
    const isDelivered = editStatus === 'Delivered';

    // Immutably update products
    const updatedProducts = products.map(p => {
      if (p.name === editingChallan.productName) {
        let currentStock = p.currentStock;
        let damagedStock = p.damagedStock || 0;

        if (wasDelivered && isDelivered) {
          currentStock += (editingChallan.qty + editingChallan.bonusQty - editingChallan.returnedQty);
          damagedStock -= editingChallan.damagedQty;
          currentStock -= (Number(editQty) + Number(editBonusQty) - Number(editReturnedQty));
          damagedStock += Number(editDamagedQty);
        } else if (!wasDelivered && isDelivered) {
          currentStock -= (Number(editQty) + Number(editBonusQty) - Number(editReturnedQty));
          damagedStock += Number(editDamagedQty);
        } else if (wasDelivered && !isDelivered) {
          currentStock += (editingChallan.qty + editingChallan.bonusQty - editingChallan.returnedQty);
          damagedStock -= editingChallan.damagedQty;
        }

        return {
          ...p,
          currentStock,
          damagedStock
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    const netQty = Number(editQty) - Number(editReturnedQty) - Number(editDamagedQty);
    const baseAmount = Math.max(0, netQty) * Number(editRate);
    const commissionAmount = Number(editCommissionAmount) || 0;
    const totalAmount = baseAmount - commissionAmount;

    const updatedItem = {
      ...editingChallan,
      qty: Number(editQty),
      bonusQty: Number(editBonusQty),
      totalQty: newTotalQty,
      rate: Number(editRate),
      totalAmount,
      srName: editSR,
      routeName: editRoute,
      deliveryManName: editDeliveryMan,
      status: editStatus,
      returnedQty: Number(editReturnedQty),
      damagedQty: Number(editDamagedQty),
      commissionAmount
    };

    setChallans(prev => prev.map(ch => ch.id === updatedItem.id ? updatedItem : ch));
    
    setViewingOrder(prev => {
      if (!prev) return prev;
      const newItems = prev.items.map(i => i.id === updatedItem.id ? updatedItem : i);
      return {
        ...prev,
        items: newItems,
        totalQty: newItems.reduce((acc, curr) => acc + curr.totalQty, 0),
        totalAmount: newItems.reduce((acc, curr) => acc + curr.totalAmount, 0)
      };
    });

    setEditingChallan(null);
    alert('Challan updated successfully and stock levels synchronized!');
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
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
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-slate-300" />
            {tChallan.exportCsv}
          </button>
          
          <button
            id="challan-btn-download-pdf"
            type="button"
            onClick={triggerPrintPDF}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Download/Print PDF"
          >
            <FileText className="w-4 h-4 text-slate-300" />
            {tChallan.downloadPrint}
          </button>

          <button
            id="challan-btn-add"
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-all shrink-0 cursor-pointer active:scale-95 shadow-lg"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            {tChallan.createBtn}
          </button>
        </div>
      </div>

      {/* Filter Engine Form */}
      <form onSubmit={handleSearch} className="bg-indigo-50/30 border border-indigo-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
            <h3 className="text-xs font-bold text-indigo-705 tracking-wider uppercase">{tChallan.filterTitle}</h3>
          </div>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">Dynamic Search</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
          
          {/* SR Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">{tChallan.srLabel}</label>
            <select
              id="filter-sr-select"
              value={filterSR}
              onChange={(e) => setFilterSR(e.target.value)}
              className="h-10 w-full rounded-xl border border-purple-200 bg-purple-50/10 px-3 text-xs font-bold text-purple-855 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all cursor-pointer shadow-sm"
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
              className="h-10 w-full rounded-xl border border-blue-200 bg-blue-50/10 px-3 text-xs font-bold text-blue-855 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer shadow-sm"
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
              className="h-10 w-full rounded-xl border border-rose-200 bg-rose-50/10 px-3 text-xs font-bold text-rose-855 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all cursor-pointer shadow-sm"
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
                className="h-10 w-full rounded-xl border border-indigo-200 bg-white pl-9 pr-4 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'bn' ? 'শুরুর তারিখ:' : 'Start Date:'}
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              {language === 'bn' ? 'শেষের তারিখ:' : 'End Date:'}
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
            />
          </div>

        </div>

        {/* Action buttons inside filter card */}
        <div className="flex items-center justify-end gap-3 border-t border-indigo-200 pt-4">
          <button
            id="filter-btn-reset"
            type="button"
            onClick={handleReset}
            className="h-9 rounded-xl border border-indigo-200 bg-white px-4 text-xs font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {tChallan.resetFilters}
          </button>
          
          <button
            id="filter-btn-submit"
            type="submit"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 transition-all shrink-0 cursor-pointer border border-indigo-700 shadow-sm"
          >
            <Search className="w-4 h-4 text-white" />
            {tChallan.querySheet}
          </button>
        </div>
      </form>

      {/* Table Section */}
      <div className={`overflow-hidden rounded-3xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 ${
        selectedStatusTab === 'Pending' ? 'border-amber-200 shadow-amber-50/20' :
        selectedStatusTab === 'Shipped' ? 'border-blue-200 shadow-blue-50/20' :
        selectedStatusTab === 'Delivered' ? 'border-emerald-200 shadow-emerald-50/20' :
        'border-slate-200'
      }`}>
        {/* Dynamic color-coded top accent bar */}
        <div className={`h-1.5 w-full transition-all duration-300 ${
          selectedStatusTab === 'Pending' ? 'bg-amber-500' :
          selectedStatusTab === 'Shipped' ? 'bg-blue-500' :
          selectedStatusTab === 'Delivered' ? 'bg-emerald-500' :
          'bg-slate-950'
        }`} />

        <div className="px-6 py-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{tChallan.tableTitle}</h4>
            <span className="bg-slate-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              {filteredOrders.length}
            </span>
          </div>

          {/* Status Tabs Switcher */}
          <div className="flex flex-wrap items-center p-1 bg-slate-100 rounded-xl border border-slate-200 gap-1 self-start lg:self-auto">
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
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? activeTabStyle 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold transition-all duration-300 ${badgeColor}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
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
                      ORD-{new Date(g.createdAt).getTime().toString().slice(-6)}
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{new Date(g.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-200">{g.itemCount} items</span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-slate-800 font-mono bg-slate-50/30 whitespace-nowrap">{g.totalQty}</td>
                    <td className="px-5 py-4 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                      ৳{g.totalAmount.toLocaleString('en-BD')}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-605 max-w-[120px] truncate whitespace-nowrap" title={g.srName}>
                      {g.srName}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-850 rounded-lg text-xs font-bold border border-slate-200 truncate block max-w-[180px] whitespace-nowrap" title={g.routeName}>
                        {g.routeName || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-700 text-sm max-w-[155px] truncate whitespace-nowrap" title={g.deliveryManName}>
                      {g.deliveryManName}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {g.status === 'Delivered' ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyle}`}>
                          {tCommon.delivered}
                        </span>
                      ) : (
                        <select
                          id={`order-status-select-${g.id}`}
                          value={g.status}
                          onChange={(e) => handleGroupStatusChange(g.id, e.target.value as any)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold border outline-none cursor-pointer bg-white transition-all uppercase tracking-wider ${statusStyle}`}
                        >
                          <option value="Pending">{tCommon.pending}</option>
                          <option value="Shipped">{tCommon.shipped}</option>
                          <option value="Delivered">{tCommon.delivered}</option>
                        </select>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          id={`order-action-view-${g.id}`}
                          onClick={() => setViewingOrder(g)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-350 bg-white text-slate-650 hover:bg-slate-100 cursor-pointer hover:border-slate-800 shadow-sm active:scale-95 transition-all"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {g.status !== 'Delivered' && (
                          <button
                            id={`order-action-delete-${g.id}`}
                            onClick={() => handleDeleteGroup(g.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer shadow-sm active:scale-95 transition-all"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
                      className="mt-3 inline-flex h-9 items-center gap-1 bg-slate-900 px-4 rounded-xl text-white text-xs font-bold hover:bg-slate-800 border border-slate-955 cursor-pointer transition-all active:scale-95"
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
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  id={`challan-page-num-${page}`}
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
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
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            {/* Header: custom style guide gradient header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-lg">{tChallan.modalCreateTitle}</h3>
              </div>
              <button
                id="challan-modal-add-close"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallan} className="modal-body p-6 space-y-5">
              
              {/* Product and Attribute row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.productSelect}</label>
                  <select
                    id="new-challan-product-select"
                    required
                    value={newProduct}
                    onChange={(e) => {
                      setNewProduct(e.target.value);
                      const activeAttrs = attributes.filter(a => a.status === 'Active');
                      if (activeAttrs.length > 0) {
                        setNewAttribute(activeAttrs[0].name);
                      }
                    }}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.chooseProduct}</option>
                    {products.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({tChallan.rateHeader}: ৳{p.defaultWSP})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.attributeSelect}</label>
                  <select
                    id="new-challan-attribute-select"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.noneBulk}</option>
                    {attributes.filter(a => a.status === 'Active').map(attr => (
                      <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantities & Price Previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 bg-slate-50 p-4.5 rounded-lg border border-slate-200">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.primaryQty}</label>
                  <input
                    id="new-challan-qty-input"
                    type="number"
                    min="1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.bonusQty}</label>
                  <input
                    id="new-challan-bonus-qty-input"
                    type="number"
                    min="0"
                    value={newBonusQty}
                    onChange={(e) => setNewBonusQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
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
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>

              </div>

              {/* SR & Delivery Agent Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.srSelectLabel}</label>
                  <select
                    id="new-challan-sr-select"
                    required
                    value={newSR}
                    onChange={(e) => {
                      setNewSR(e.target.value);
                      setNewRoute('');
                    }}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.selectSr}</option>
                    {srs.map(sr => (
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
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="">{tChallan.selectDelivery}</option>
                    {deliveryMen.map(dm => (
                      <option key={dm.id} value={dm.name}>{dm.name} ({dm.vehicle})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status and Customers */}
              {/* Route Beat Selection */}
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
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tChallan.statusLabel}</label>
                  <select
                    id="new-challan-status-select"
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  >
                    <option value="Pending">{tCommon.pending}</option>
                    <option value="Shipped">{tCommon.shipped}</option>
                    <option value="Delivered">{tCommon.delivered}</option>
                  </select>
                </div>

                <div className="flex items-center justify-end">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-semibold uppercase block tracking-wider">{tChallan.estimatedWholesalePrice}</span>
                    <span className="text-2xl font-semibold text-emerald-600 font-mono">
                      ৳{((newQty || 0) * getProductWSP(newProduct)).toLocaleString('en-BD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action bar / footer: styled with border-t bg-slate-50 */}
              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="new-challan-btn-cancel"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-55 hover:border-slate-300 transition-all cursor-pointer"
                >
                  {tCommon.cancel}
                </button>
                <button
                  id="new-challan-btn-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all shrink-0 cursor-pointer border border-slate-950"
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
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl shadow-2xl flex flex-col justify-between animate-scale-up max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-800" />
                <h3 className="font-semibold text-slate-800 text-lg">Order Details</h3>
              </div>
              <button
                id="challan-modal-view-close"
                onClick={() => setViewingOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body p-6 space-y-5 text-sm overflow-y-auto">
              <div className="flex justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Order ID / Date</p>
                  <p className="font-mono text-slate-850 font-semibold text-sm">ORD-{new Date(viewingOrder.createdAt).getTime().toString().slice(-6)}</p>
                  <p className="text-xs text-slate-500 font-medium">{new Date(viewingOrder.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider mb-1">{tChallan.statusUpper}</p>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border inline-block ${
                    viewingOrder.status === 'Delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    viewingOrder.status === 'Shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-705 border-amber-200'
                  }`}>
                    {viewingOrder.status === 'Delivered' ? tCommon.delivered :
                     viewingOrder.status === 'Shipped' ? tCommon.shipped :
                     tCommon.pending}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <p className="text-slate-455 font-semibold text-xs mb-1">SR Name</p>
                  <p className="font-bold text-slate-800">{viewingOrder.srName}</p>
                </div>
                <div>
                  <p className="text-slate-455 font-semibold text-xs mb-1">Route</p>
                  <p className="font-bold text-slate-800">{viewingOrder.routeName}</p>
                </div>
                <div>
                  <p className="text-slate-455 font-semibold text-xs mb-1">Delivery Agent</p>
                  <p className="font-bold text-slate-800">{viewingOrder.deliveryManName}</p>
                </div>
              </div>

              {/* Financial & Settlement Summary Dashboard */}
              <div className="space-y-3">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                  {language === 'bn' ? 'চালান হিসাব-নিকাশ ও সেটেলমেন্ট' : 'Challan Accounts & Settlement'}
                </p>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {language === 'bn' ? 'মোট চালানি সরবরাহ' : 'Total Dispatched'}
                    </p>
                    <p className="text-lg font-mono font-extrabold text-slate-850 mt-1">
                      ৳{settlement?.totalDispatchedValue.toLocaleString('en-BD')}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {settlement?.totalDispatchedQty} {language === 'bn' ? 'পিস' : 'units'}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                      {language === 'bn' ? 'মোট বিক্রয় মূল্য' : 'Total Sold'}
                    </p>
                    <p className="text-lg font-mono font-extrabold text-blue-900 mt-1">
                      ৳{settlement?.totalSoldValue.toLocaleString('en-BD')}
                    </p>
                    <p className="text-[10px] text-blue-500 font-bold mt-0.5">
                      {settlement?.totalSoldQty} {language === 'bn' ? 'পিস বিক্রি' : 'units sold'}
                    </p>
                  </div>

                  <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
                      {language === 'bn' ? 'মোট ফেরত মূল্য' : 'Total Returned'}
                    </p>
                    <p className="text-lg font-mono font-extrabold text-amber-900 mt-1">
                      ৳{settlement?.totalReturnedValue.toLocaleString('en-BD')}
                    </p>
                    <p className="text-[10px] text-amber-650 font-bold mt-0.5">
                      {settlement?.totalReturnedQty} {language === 'bn' ? 'পিস ফেরত' : 'units returned'}
                    </p>
                  </div>

                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 shadow-sm">
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                      {language === 'bn' ? 'মোট ড্যামেজ মূল্য' : 'Total Damaged'}
                    </p>
                    <p className="text-lg font-mono font-extrabold text-rose-900 mt-1">
                      ৳{settlement?.totalDamagedValue.toLocaleString('en-BD')}
                    </p>
                    <p className="text-[10px] text-rose-500 font-bold mt-0.5">
                      {settlement?.totalDamagedQty} {language === 'bn' ? 'পিস নষ্ট' : 'units damaged'}
                    </p>
                  </div>
                </div>

                {/* Detailed financial accounting card */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    
                    {/* Left Column: Cash flow */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {language === 'bn' ? 'আদায় ও লাভ' : 'Cash Flow'}
                      </h5>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">{language === 'bn' ? 'আদায়যোগ্য বাজার মূল্য' : 'Net Market Collection'}:</span>
                        <span className="font-mono font-bold text-slate-800">৳{settlement?.totalNetValue.toLocaleString('en-BD')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">{language === 'bn' ? 'আইটেম ডিসকাউন্ট/কমিশন' : 'Item Discounts'}:</span>
                        <span className="font-mono text-slate-800">৳{settlement?.totalCommission.toLocaleString('en-BD')}</span>
                      </div>
                    </div>

                    {/* Middle Column: Commissions */}
                    <div className="space-y-2 md:pl-6">
                      <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {language === 'bn' ? 'কমিশন ও খরচ' : 'Commissions & Fees'}
                      </h5>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">{language === 'bn' ? 'এসআর কমিশন:' : 'SR Commission:'}</span>
                        <span className="font-mono font-bold text-rose-650">-৳{settlement?.srCommission.toLocaleString('en-BD')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Delivery Agent Fee ({settlement?.dmCommRate}%):</span>
                        <span className="font-mono font-bold text-rose-650">-৳{settlement?.deliveryManPay.toLocaleString('en-BD')}</span>
                      </div>
                    </div>

                    {/* Right Column: Owner payout */}
                    <div className="space-y-2 md:pl-6 flex flex-col justify-center">
                      <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 shadow-sm">
                        <h5 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          {language === 'bn' ? 'মালিকের নিট পাওনা (পাবেন)' : 'Owner Net Receivable'}
                        </h5>
                        <p className="text-xl font-mono font-black text-emerald-700 mt-1">
                          ৳{settlement?.netToOwner.toLocaleString('en-BD')}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">Products in Order ({viewingOrder.itemCount})</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-center">Qty</th>
                        <th className="px-4 py-3 font-semibold text-center">Bonus</th>
                        <th className="px-4 py-3 font-semibold text-center">Total</th>
                        <th className="px-4 py-3 font-semibold text-right">Amount (৳)</th>
                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {viewingOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{item.productName}</p>
                            <p className="text-[10px] text-slate-500">{item.attribute}</p>
                          </td>
                          <td className="px-4 py-3 text-center font-mono">{item.qty}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">+{item.bonusQty}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold bg-slate-50/50">{item.totalQty}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold">{(item.totalAmount).toLocaleString('en-BD')}</td>
                          <td className="px-4 py-3 text-center">
                            {viewingOrder.status !== 'Delivered' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  className="p-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Edit Item"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(tCommon.confirmDelete)) {
                                      setChallans(prev => prev.filter(c => c.id !== item.id));
                                      setViewingOrder(prev => prev ? { ...prev, items: prev.items.filter(c => c.id !== item.id) } : null);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-semibold">{language === 'bn' ? 'লকড' : 'Locked'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-2 text-sm">
                  <p className="font-bold text-slate-800">Order Total: <span className="font-mono text-lg text-emerald-600">৳{viewingOrder.totalAmount.toLocaleString('en-BD')}</span></p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-end gap-3 bg-slate-50 shrink-0 rounded-b-xl">
              {/* Quick status transition actions */}
              {viewingOrder.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => handleGroupStatusChange(viewingOrder.id, 'Shipped')}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 font-bold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                >
                  {language === 'bn' ? 'চালান প্রেরণ করুন (Shipped)' : 'Ship Order (Shipped)'}
                </button>
              )}
              {viewingOrder.status === 'Shipped' && (
                <button
                  type="button"
                  onClick={() => handleGroupStatusChange(viewingOrder.id, 'Delivered')}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 font-bold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer"
                >
                  {language === 'bn' ? 'ডেলিভারি সেটেল করুন (Delivered)' : 'Settle Delivery (Delivered)'}
                </button>
              )}

              <button
                id="viewing-challan-btn-print-sheet"
                type="button"
                onClick={() => printChallanSheet(viewingOrder.items)}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                {language === 'bn' ? 'চালান শিট' : 'Challan Sheet'}
              </button>
              <button
                id="viewing-challan-btn-print"
                type="button"
                onClick={() => printChallanInvoice(viewingOrder.items)}
                className="flex-1 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Export PDF
              </button>
              <button
                id="viewing-challan-btn-close"
                type="button"
                onClick={() => setViewingOrder(null)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all active:scale-95 text-center shadow-md cursor-pointer"
              >
                {tChallan.closeVoucher}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Transition & Settlement Modal */}
      {settlementOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettlement} className="modal-body p-6 space-y-6">
              
              {/* Order Metadata */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">{language === 'bn' ? 'অর্ডার নম্বর' : 'Order ID'}</p>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">
                    ORD-{new Date(settlementOrder.createdAt).getTime().toString().slice(-6)}
                  </p>
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
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-center w-24">Sent Qty</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">Returned Qty</th>
                        <th className="px-4 py-3 font-semibold text-center w-28">Damaged Qty</th>
                        <th className="px-4 py-3 font-semibold text-center w-24">Sold Qty</th>
                        <th className="px-4 py-3 font-semibold text-right w-28">Net Amount (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {settlementOrder.items.map((item) => {
                        const qUpdates = settlementQuantities[item.id] || { returned: 0, damaged: 0 };
                        const returned = qUpdates.returned;
                        const damaged = qUpdates.damaged;
                        const sold = Math.max(0, item.qty - returned - damaged);
                        const netAmount = (sold * item.rate) - (item.commissionAmount || 0);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-800">{item.productName}</p>
                              <p className="text-[10px] text-slate-500">{item.attribute} • Rate: ৳{item.rate}</p>
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                              {item.qty}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.qty - damaged}
                                value={returned}
                                onChange={(e) => {
                                  const val = Math.min(item.qty - damaged, Math.max(0, Number(e.target.value) || 0));
                                  setSettlementQuantities(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], returned: val }
                                  }));
                                }}
                                className="h-8 w-20 text-center font-mono font-semibold rounded border border-slate-200 focus:border-indigo-500 outline-none text-slate-800"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input
                                type="number"
                                min="0"
                                max={item.qty - returned}
                                value={damaged}
                                onChange={(e) => {
                                  const val = Math.min(item.qty - returned, Math.max(0, Number(e.target.value) || 0));
                                  setSettlementQuantities(prev => ({
                                    ...prev,
                                    [item.id]: { ...prev[item.id], damaged: val }
                                  }));
                                }}
                                className="h-8 w-20 text-center font-mono font-semibold rounded border border-slate-200 focus:border-indigo-500 outline-none text-slate-800"
                              />
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-blue-655 bg-blue-50/10">
                              {sold}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-800">
                              ৳{netAmount.toLocaleString('en-BD')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement accounting summary dashboard */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {language === 'bn' ? 'সেটেলমেন্ট সামারি প্রাকদর্শন (রিয়েল-টাইম)' : 'Settlement Preview (Real-time)'}
                </p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <span className="text-slate-400 font-bold block">{language === 'bn' ? 'সরবরাহকৃত চালানি মূল্য' : 'Dispatched Value'}</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">৳{transitionSettlement?.totalDispatchedValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <span className="text-blue-600 font-bold block">{language === 'bn' ? 'বিক্রয় মূল্য' : 'Sold Value'}</span>
                    <span className="font-mono font-extrabold text-blue-900 text-sm">৳{transitionSettlement?.totalSoldValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                    <span className="text-amber-600 font-bold block">{language === 'bn' ? 'ফেরত মূল্য' : 'Returned Value'}</span>
                    <span className="font-mono font-bold text-amber-900 text-sm">৳{transitionSettlement?.totalReturnedValue.toLocaleString('en-BD')}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3">
                    <span className="text-rose-600 font-bold block">{language === 'bn' ? 'ড্যামেজ মূল্য' : 'Damaged Value'}</span>
                    <span className="font-mono font-bold text-rose-900 text-sm">৳{transitionSettlement?.totalDamagedValue.toLocaleString('en-BD')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200 text-xs">
                  <div className="flex flex-col justify-center">
                    <span className="text-slate-550 block font-bold mb-1">{language === 'bn' ? 'আদায়যোগ্য বাজার মূল্য' : 'Net Market Collection'}:</span>
                    <span className="font-mono font-black text-slate-800 text-base">৳{transitionSettlement?.totalNetValue.toLocaleString('en-BD')}</span>
                  </div>
                  
                  {/* Interactive SR Commission Block */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100/80 shadow-sm flex flex-col justify-between">
                    <span className="text-indigo-900 block font-bold text-[10px] uppercase tracking-wider">
                      {language === 'bn' ? 'এসআর কমিশন (টাকা)' : 'SR Commission (Tk)'}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-700 font-mono text-sm">৳</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={settlementSRCommValue}
                        onChange={(e) => setSettlementSRCommValue(Math.max(0, Number(e.target.value) || 0))}
                        className="h-8 w-full px-2 font-mono font-semibold rounded border border-slate-200 bg-white focus:border-indigo-500 outline-none text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-indigo-100">
                      <span className="text-slate-500 font-bold">{language === 'bn' ? 'মোট কমিশন:' : 'Total Commission:'}</span>
                      <span className="font-mono font-black text-rose-600 text-xs">-৳{transitionSettlement?.srCommission.toLocaleString('en-BD')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center">
                    <span className="text-slate-555 block font-bold mb-1">Delivery Agent Fee ({transitionSettlement?.dmCommRate}%):</span>
                    <span className="font-mono font-black text-rose-650 text-base">-৳{transitionSettlement?.deliveryManPay.toLocaleString('en-BD')}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-lg flex items-center justify-between mt-2">
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
                  className="h-10 rounded-lg border-2 border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
                >
                  {tCommon.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-xs font-extrabold text-white hover:bg-indigo-700 transition-all shrink-0 cursor-pointer border border-indigo-700 shadow-md"
                >
                  {language === 'bn' ? 'সেটেল করুন ও স্থিতি সংরক্ষণ করুন' : 'Confirm Settlement & Save'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Challan Modal */}
      {editingChallan && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-scale-up">
            
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="font-semibold text-slate-800 text-lg">{language === 'bn' ? 'চলান ও বিক্রয় সংশোধন' : 'Edit Delivery Order & Sale'}</h3>
              </div>
              <button
                id="challan-modal-edit-close"
                onClick={() => setEditingChallan(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditChallan} className="modal-body p-6 space-y-5">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Product Description</span>
                <p className="font-bold text-slate-800 text-sm">{editingChallan.productName} ({editingChallan.attribute})</p>
                <p className="text-xs text-slate-500 font-medium">Company: {editingChallan.company || 'N/A'}</p>
              </div>

              {/* Quantities & Price edit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Billing Quantity *</label>
                  <input
                    id="edit-challan-qty-input"
                    type="number"
                    min="1"
                    required
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Bonus Quantity *</label>
                  <input
                    id="edit-challan-bonus-qty-input"
                    type="number"
                    min="0"
                    required
                    value={editBonusQty}
                    onChange={(e) => setEditBonusQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Commission (Tk)</label>
                  <input
                    id="edit-challan-commission-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editCommissionAmount}
                    onChange={(e) => setEditCommissionAmount(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Returns & Damages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-rose-50/50 p-4.5 rounded-lg border border-rose-100">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-rose-800">Returned Quantity (Returns Log)</label>
                  <input
                    id="edit-challan-returned-qty"
                    type="number"
                    min="0"
                    value={editReturnedQty}
                    onChange={(e) => setEditReturnedQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-rose-800">Damaged Quantity (Damages Log)</label>
                  <input
                    id="edit-challan-damaged-qty"
                    type="number"
                    min="0"
                    value={editDamagedQty}
                    onChange={(e) => setEditDamagedQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-rose-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-rose-500"
                  />
                </div>
              </div>

              {/* SR & Route & Delivery Agent */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Sales Officer (SR)</label>
                  <select
                    id="edit-challan-sr-select"
                    value={editSR}
                    onChange={(e) => setEditSR(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {srs.map(sr => (
                      <option key={sr.id} value={sr.name}>{sr.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">{language === 'bn' ? 'মার্কেট / রুট' : 'Market / Route'}</label>
                  <select
                    id="edit-challan-route-select"
                    value={editRoute}
                    onChange={(e) => {
                      const routeName = e.target.value;
                      setEditRoute(routeName);
                      const routeObj = routes.find(r => r.name === routeName);
                      if (routeObj) {
                        const srObj = srs.find(s => s.id === routeObj.assignedSRId);
                        if (srObj) {
                          setEditSR(srObj.name);
                        }
                        const dmObj = deliveryMen.find(dm => dm.id === routeObj.assignedDeliveryManId);
                        if (dmObj) {
                          setEditDeliveryMan(dmObj.name);
                        }
                      }
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-700">Delivery Agent</label>
                  <select
                    id="edit-challan-delivery-select"
                    value={editDeliveryMan}
                    onChange={(e) => setEditDeliveryMan(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                  >
                    {deliveryMen.map(dm => (
                      <option key={dm.id} value={dm.name}>{dm.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-700">Delivery Status</label>
                <select
                  id="edit-challan-status"
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              {/* Price Calculations Margin */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4 bg-slate-50 p-4 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Total Value</span>
                  <span className="font-mono text-xl font-bold text-slate-900">৳{(editQty * editRate).toLocaleString('en-BD')}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SR Commission Margin</span>
                  <span className="font-mono text-lg font-bold text-blue-600">৳{((editQty * editRate) * 0.05).toLocaleString('en-BD')}</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                <button
                  id="edit-challan-btn-cancel"
                  type="button"
                  onClick={() => setEditingChallan(null)}
                  className="py-2.5 px-5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm transition-all shadow-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="edit-challan-btn-save"
                  type="submit"
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all shadow-md cursor-pointer active:scale-95"
                >
                  Save Adjustments
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
