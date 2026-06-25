import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight,
  PieChart,
  ClipboardList,
  FileText
} from 'lucide-react';
import { ExpenseCategory, ExpenseRecord, ChallanItem, Procurement } from '../types';

interface AccountingModuleProps {
  categories: ExpenseCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  expenses: ExpenseRecord[];
  setExpenses: React.Dispatch<React.SetStateAction<React.SetStateAction<ExpenseRecord[]>> | any>; // keeping compatible
  challans: ChallanItem[];
  procurements: Procurement[];
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
}

export default function AccountingModule({
  categories,
  setCategories,
  expenses,
  setExpenses,
  challans,
  procurements,
  onDownloadPDF
}: AccountingModuleProps) {
  // Sub-tabs: 'expenses' or 'profit-report'
  const [activeTab, setActiveTab] = useState<'expenses' | 'profit-report'>('expenses');

  // Profit Report Dates State
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-06-30');

  // Calculated Report Results (Updated upon clicking "Search")
  const [reportResults, setReportResults] = useState({
    totalSoldQty: 620,
    totalSellAmt: 201500,
    totalPurchaseQty: 680,
    totalPurchaseAmt: 400250,
    totalExpensesAmt: 50500,
    netProfit: -249250 // initial mock representation
  });

  // Expense form State
  const [expenseCategory, setExpenseCategory] = useState(categories[0]?.id || '');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expensePaidTo, setExpensePaidTo] = useState('');

  // Category Form State
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Editing Category State
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);

  // Pagination for expenses
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handler: Calculate Profit Report instantly
  const handleCalculateReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Slicing dates precisely
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59`);

    // Slicing Challans (Sales) - assume initial ones correspond to June 2026
    const validChallans = challans.filter(ch => {
      // If we don't have explicit timestamps, assume June 10-25 2026 based on IDs
      // Standardize date mapping: Let's extract date from a mocked date mapper
      const chDate = getChallanDate(ch.id);
      const d = new Date(chDate);
      return ch.status !== 'Returned' && d >= start && d <= end;
    });

    const totalSoldQty = validChallans.reduce((sum, ch) => sum + ch.qty, 0);
    const totalSellAmt = validChallans.reduce((sum, ch) => sum + ch.totalAmount, 0);

    // Slicing Procurements
    const validProcurements = procurements.filter(pr => {
      const d = new Date(pr.invoiceDate);
      return d >= start && d <= end;
    });

    // Count item units purchased
    const totalPurchaseQty = validProcurements.reduce((sum, pr) => {
      return sum + pr.items.reduce((s, item) => s + item.qty + item.bonusQty, 0);
    }, 0);

    const totalPurchaseAmt = validProcurements.reduce((sum, pr) => sum + pr.globalTotal, 0);

    // Slicing Expenses
    const validExpenses = expenses.filter(exp => {
      const d = new Date(exp.expenseDate);
      return d >= start && d <= end;
    });

    const totalExpensesAmt = validExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Profit = Sell Amount - Purchase Amount - Expenses
    const netProfit = totalSellAmt - totalPurchaseAmt - totalExpensesAmt;

    setReportResults({
      totalSoldQty,
      totalSellAmt,
      totalPurchaseQty,
      totalPurchaseAmt,
      totalExpensesAmt,
      netProfit
    });
  };

  // Static helper since we don't store dates inside initial challans
  const getChallanDate = (id: string) => {
    // Return realistic static dates mapping for initial mock IDs
    if (id === 'ch-1') return '2026-06-12';
    if (id === 'ch-2') return '2026-06-18';
    if (id === 'ch-3') return '2026-06-22';
    if (id === 'ch-4') return '2026-06-24';
    if (id === 'ch-5') return '2026-06-25';
    // For custom added challans, they have timestamp IDs
    if (id.startsWith('ch-')) {
      const ms = Number(id.split('-')[1]);
      if (!isNaN(ms)) {
        return new Date(ms).toISOString().split('T')[0];
      }
    }
    return new Date().toISOString().split('T')[0];
  };

  // Add Expense Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Category name is required');
      return;
    }

    const newCat: ExpenseCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      description: newCatDesc.trim()
    };

    setCategories(prev => [...prev, newCat]);
    setShowAddCat(false);
    setNewCatName('');
    setNewCatDesc('');
    setExpenseCategory(newCat.id);
    alert(`Category "${newCat.name}" registered successfully!`);
  };

  // Save edited category
  const handleSaveEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat) return;

    setCategories(prev => prev.map(c => c.id === editingCat.id ? editingCat : c));
    setEditingCat(null);
    alert('Category changes saved!');
  };

  // Add Expense Record
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseAmount <= 0) {
      alert('Amount must be positive');
      return;
    }

    const catObj = categories.find(c => c.id === expenseCategory);
    if (!catObj) {
      alert('Please select a valid expense category');
      return;
    }

    const newExp: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      categoryId: expenseCategory,
      categoryName: catObj.name,
      amount: Number(expenseAmount),
      expenseDate,
      notes: expenseNotes.trim(),
      paidTo: expensePaidTo.trim() || 'Cash in Hand'
    };

    setExpenses(prev => [newExp, ...prev]);
    setExpenseAmount(0);
    setExpenseNotes('');
    setExpensePaidTo('');
    alert('Expense logged successfully! Profit engine recalculated.');
    
    // Auto refresh report if open
    setTimeout(() => handleCalculateReport(), 100);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      setTimeout(() => handleCalculateReport(), 100);
    }
  };

  // Pagination helper for Expenses Log
  const totalExpenses = expenses.length;
  const totalPages = Math.ceil(totalExpenses / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Internal tab switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-indigo-500" />
            Accounting, Expense Registry & Profit Ledger
          </h2>
          <p className="text-xs text-slate-500">Log expenditures, register custom ledger categories, and run dynamic profit analysis</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            id="accounting-tab-exp"
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Expenses & Categories
          </button>
          
          <button
            id="accounting-tab-profit"
            onClick={() => {
              setActiveTab('profit-report');
              // Calculate initially
              setTimeout(() => handleCalculateReport(), 50);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'profit-report' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            Profit Report Filter Engine
          </button>
        </div>
      </div>

      {/* SUB TAB RENDER: Expense categories & logs */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form & Category Setup (Left 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wide border-b border-slate-50 pb-2">
                Log New Operating Expense
              </h3>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expense Category *</label>
                  <button
                    id="exp-btn-add-cat-inline"
                    type="button"
                    onClick={() => setShowAddCat(true)}
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    + Add Category
                  </button>
                </div>
                <select
                  id="exp-form-category"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-700 outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Payout Amount (BDT) *</label>
                  <input
                    id="exp-form-amount"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 font-mono font-bold outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Payout *</label>
                  <input
                    id="exp-form-date"
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Paid To (Receiver) *</label>
                <input
                  id="exp-form-paidto"
                  type="text"
                  required
                  placeholder="e.g. Haji Shafiul (Landlord)"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Voucher Notes / Specifics</label>
                <textarea
                  id="exp-form-notes"
                  placeholder="Justify fuel usage, meal count, rental portion..."
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-700 outline-none h-18 resize-none"
                />
              </div>

              <button
                id="exp-form-submit"
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 text-center shadow-md shadow-indigo-500/10"
              >
                Log Expense Payout
              </button>
            </form>

            {/* View Categories List inline */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">Operating Categories Ledger</h4>
                {!showAddCat && (
                  <button
                    id="cat-btn-add-trigger"
                    onClick={() => setShowAddCat(true)}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    Create New
                  </button>
                )}
              </div>

              {showAddCat ? (
                <form onSubmit={handleAddCategory} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/65 space-y-3 animate-scale-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase">Create Expense Category</span>
                    <button id="cat-close-btn" type="button" onClick={() => setShowAddCat(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="space-y-2">
                    <input
                      id="new-cat-name"
                      type="text"
                      required
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                    />
                    <input
                      id="new-cat-desc"
                      type="text"
                      placeholder="Short Description"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-xs outline-none"
                    />
                    <button
                      id="new-cat-submit"
                      type="submit"
                      className="w-full py-1.5 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800"
                    >
                      Save Category
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categories.map(c => (
                    <div key={c.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/50 flex justify-between items-start group">
                      <div className="max-w-[70%]">
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{c.description || 'No description listed'}</p>
                      </div>
                      <button
                        id={`cat-btn-edit-${c.id}`}
                        onClick={() => setEditingCat(c)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-indigo-600 transition-opacity"
                        title="Edit Category Details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Expense Log Table (Right 7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/40 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Historical Expenditure Log</span>
                <button
                  onClick={() => onDownloadPDF('accounting')}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Download PDF Ledger
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold font-sans w-12 text-center">#</th>
                      <th className="py-3 px-4 font-semibold font-sans">Date</th>
                      <th className="py-3 px-4 font-semibold font-sans">Category</th>
                      <th className="py-3 px-4 font-semibold font-sans text-right">Amount (BDT)</th>
                      <th className="py-3 px-4 font-semibold font-sans">Paid To (Receiver)</th>
                      <th className="py-3 px-4 font-semibold font-sans">Voucher Notes</th>
                      <th className="py-3 px-4 font-semibold font-sans text-center w-16">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedExpenses.map((exp, index) => {
                      const globalIndex = startIndex + index + 1;
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono font-medium">{globalIndex}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{exp.expenseDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{exp.categoryName}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatBDT(exp.amount)}</td>
                          <td className="py-3 px-4 font-medium text-slate-600">{exp.paidTo}</td>
                          <td className="py-3 px-4 text-slate-400 italic max-w-xs truncate" title={exp.notes}>{exp.notes || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              id={`exp-btn-delete-${exp.id}`}
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {expenses.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          No operating expenses logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/20 text-xs">
                <span className="text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(startIndex + itemsPerPage, totalExpenses)}</span> of <span className="font-semibold text-slate-700">{totalExpenses}</span> records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="exp-page-prev"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      id={`exp-page-num-${page}`}
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border font-bold ${
                        currentPage === page 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    id="exp-page-next"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB TAB RENDER: Profit Report Filter Engine */}
      {activeTab === 'profit-report' && (
        <div className="space-y-6">
          
          {/* Filter Range form card */}
          <form onSubmit={handleCalculateReport} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Dynamic Yield Calculator</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Analysis From Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profit-from-date"
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Analysis To Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profit-to-date"
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/40 pl-10 pr-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  id="profit-btn-search"
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md"
                >
                  <Search className="w-4 h-4" />
                  Recalculate Profit Ledger
                </button>
              </div>

            </div>
          </form>

          {/* Analysis KPI Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Sold Items Qty</span>
              <p className="text-xl font-black text-slate-800 font-mono">{reportResults.totalSoldQty} Units</p>
              <span className="text-[9px] text-slate-400 leading-tight block">Aggregated from active challans</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Wholesale Revenue</span>
              <p className="text-xl font-black text-emerald-600 font-mono">{formatBDT(reportResults.totalSellAmt)}</p>
              <span className="text-[9px] text-slate-400 leading-tight block">Incoming gross yield from trade</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Procured Stock Qty</span>
              <p className="text-xl font-black text-slate-800 font-mono">{reportResults.totalPurchaseQty} Units</p>
              <span className="text-[9px] text-slate-400 leading-tight block">Inbound inventory units logged</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Procurement Expenditure</span>
              <p className="text-xl font-black text-purple-600 font-mono">{formatBDT(reportResults.totalPurchaseAmt)}</p>
              <span className="text-[9px] text-slate-400 leading-tight block">Raw goods procurement costs + carriage</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-4.5 shadow-sm space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Operating Expenses (OPEX)</span>
              <p className="text-xl font-black text-rose-600 font-mono">{formatBDT(reportResults.totalExpensesAmt)}</p>
              <span className="text-[9px] text-slate-400 leading-tight block">Fuel, entertainment, rent, commission</span>
            </div>

          </div>

          {/* Formula Card & Net Profit Display */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8 opacity-5 pointer-events-none">
              <DollarSign className="w-48 h-48" />
            </div>

            <div className="space-y-2 relative z-10">
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-indigo-400/10">
                FORMULA: $Profit = Revenue - Procurements - Expenses$
              </span>
              <h3 className="font-extrabold text-lg">Analysis Period: {fromDate} to {toDate}</h3>
              <p className="text-slate-400 text-xs max-w-lg leading-relaxed">
                This yield is calculated dynamically across raw database arrays. Deleting or logging new challans/expenditures instantly reflects on this summary sheet.
              </p>
            </div>

            <div className="text-right shrink-0 relative z-10 bg-slate-950/40 border border-slate-800 p-4.5 rounded-xl min-w-[200px]">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Net Period Yield Profit</span>
              <span className={`text-2xl md:text-3xl font-black font-mono block mt-1 ${
                reportResults.netProfit >= 0 ? 'text-indigo-400' : 'text-rose-400'
              }`}>
                {formatBDT(reportResults.netProfit)}
              </span>
              <span className="text-[9px] text-slate-500 font-medium font-sans">Chronologically Consolidated</span>
            </div>
          </div>

        </div>
      )}

      {/* Editing Category Sub-Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 w-full max-w-sm shadow-2xl p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                Edit Category
              </span>
              <button
                id="edit-cat-modal-close"
                onClick={() => setEditingCat(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Category Name</label>
                <input
                  id="edit-cat-name-input"
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Category Description</label>
                <input
                  id="edit-cat-desc-input"
                  type="text"
                  value={editingCat.description}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-700 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  id="edit-cat-btn-cancel"
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-transform active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="edit-cat-btn-submit"
                  type="submit"
                  className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-transform active:scale-95 shadow-md shadow-indigo-600/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
