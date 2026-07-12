'use client';

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
  FileText,
  Printer
} from 'lucide-react';
import { ExpenseCategory, ExpenseRecord, ChallanItem, Procurement } from '../types';
import { translations, Language } from '../translations';
import { printExpenseReceipt } from '../lib/printUtils';

interface AccountingModuleProps {
  categories: ExpenseCategory[];
  setCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  expenses: ExpenseRecord[];
  setExpenses: React.Dispatch<React.SetStateAction<ExpenseRecord[]>>;
  challans: ChallanItem[];
  procurements: Procurement[];
  onDownloadPDF: (view: 'dashboard' | 'procurement' | 'accounting') => void;
  language: Language;
}

export default function AccountingModule({
  categories,
  setCategories,
  expenses,
  setExpenses,
  challans,
  procurements,
  onDownloadPDF,
  language
}: AccountingModuleProps) {
  const tCommon = translations[language].common;
  const tAcc = translations[language].accounting;

  // Sub-tabs: 'expenses' or 'profit-report'
  const [activeTab, setActiveTab] = useState<'expenses' | 'profit-report'>('expenses');

  // Profit Report Dates State
  const [fromDate, setFromDate] = useState('2026-06-01');
  const [toDate, setToDate] = useState('2026-06-30');

  // Calculated Report Results
  const [reportResults, setReportResults] = useState({
    totalSoldQty: 620,
    totalSellAmt: 201500,
    totalPurchaseQty: 680,
    totalPurchaseAmt: 400250,
    totalExpensesAmt: 50500,
    netProfit: -249250
  });

  // Modal control states
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);

  // Expense form State
  const [expenseCategory, setExpenseCategory] = useState(categories[0]?.id || '');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [expensePaidTo, setExpensePaidTo] = useState('');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Editing Category State
  const [editingCat, setEditingCat] = useState<ExpenseCategory | null>(null);

  // Pagination for expenses
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // slightly larger now that table takes full screen width
  const [expenseFilterStartDate, setExpenseFilterStartDate] = useState('');
  const [expenseFilterEndDate, setExpenseFilterEndDate] = useState('');

  // Handler: Calculate Profit Report instantly
  const handleCalculateReport = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59`);

    const validChallans = challans.filter(ch => {
      if (ch.status !== 'Delivered') return false;
      const chDate = getChallanDate(ch.id);
      const d = new Date(chDate);
      return d >= start && d <= end;
    });

    const totalSoldQty = validChallans.reduce((sum, ch) => sum + (ch.qty - (ch.returnedQty || 0)), 0);
    const totalSellAmt = validChallans.reduce((sum, ch) => {
      const netAmount = ch.totalAmount - ((ch.returnedQty || 0) * ch.rate);
      return sum + Math.max(0, netAmount);
    }, 0);

    const validProcurements = procurements.filter(pr => {
      const d = new Date(pr.invoiceDate);
      return d >= start && d <= end;
    });

    const totalPurchaseQty = validProcurements.reduce((sum, pr) => {
      return sum + pr.items.reduce((s, item) => s + item.qty + item.bonusQty, 0);
    }, 0);

    const totalPurchaseAmt = validProcurements.reduce((sum, pr) => sum + pr.globalTotal, 0);

    const validExpenses = expenses.filter(exp => {
      const d = new Date(exp.expenseDate);
      return d >= start && d <= end;
    });

    const totalExpensesAmt = validExpenses.reduce((sum, exp) => sum + exp.amount, 0);

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

  const getChallanDate = (id: string) => {
    if (id === 'ch-1') return '2026-06-12';
    if (id === 'ch-2') return '2026-06-18';
    if (id === 'ch-3') return '2026-06-22';
    if (id === 'ch-4') return '2026-06-24';
    if (id === 'ch-5') return '2026-06-25';
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
    setShowAddCategoryModal(false);
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
    setShowAddExpenseModal(false);
    alert('Expense logged successfully! Profit engine recalculated.');

    // Auto refresh report
    setTimeout(() => handleCalculateReport(), 100);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm(tCommon.confirmDelete)) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      setTimeout(() => handleCalculateReport(), 100);
    }
  };

  // Date filtering helper for Expenses Log
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      const expDateStr = exp.expenseDate.slice(0, 10);
      const matchStart = expenseFilterStartDate ? expDateStr >= expenseFilterStartDate : true;
      const matchEnd = expenseFilterEndDate ? expDateStr <= expenseFilterEndDate : true;
      return matchStart && matchEnd;
    });
  }, [expenses, expenseFilterStartDate, expenseFilterEndDate]);

  // Pagination helper for Expenses Log
  const totalExpenses = filteredExpenses.length;
  const totalPages = Math.ceil(totalExpenses / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header - Consistent with Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 md:p-6 text-white border border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-300" />
            {tAcc.title}
          </h2>
          <p className="text-slate-300 text-xs">{tAcc.subtitle}</p>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-sm shrink-0 z-10 relative">
          <button
            id="accounting-tab-exp"
            onClick={() => setActiveTab('expenses')}
            className={`px-4.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'expenses'
                ? 'bg-white text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <DollarSign className={`w-4 h-4 ${activeTab === 'expenses' ? 'text-slate-900' : 'text-slate-400'}`} />
            {tAcc.expensesTab}
          </button>

          <button
            id="accounting-tab-profit"
            onClick={() => {
              setActiveTab('profit-report');
              setTimeout(() => handleCalculateReport(), 50);
            }}
            className={`px-4.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'profit-report'
                ? 'bg-white text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <PieChart className={`w-4 h-4 ${activeTab === 'profit-report' ? 'text-slate-900' : 'text-slate-400'}`} />
            {tAcc.profitReportTab}
          </button>
        </div>
      </div>

      {/* SUB TAB RENDER: Expense logs */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">

          {/* Main Controls & Category Management header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{tAcc.expenseListTitle}</span>
              <span className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {expenses.length} Voucher Logs
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="exp-category-modal-trigger"
                onClick={() => setShowAddCategoryModal(true)}
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
              >
                {tAcc.createNew} Category
              </button>

              <button
                id="exp-add-expense-modal-trigger"
                onClick={() => setShowAddExpenseModal(true)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4 text-white" />
                {tAcc.addExpenseBtn}
              </button>
            </div>
          </div>

          {/* Expense Date Filter Panel */}
          <div className="bg-indigo-50/30 border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {language === 'bn' ? 'খরচ ফিল্টার প্যানেল' : 'Expense Filter Panel'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {totalExpenses} {language === 'bn' ? 'টি খরচ পাওয়া গেছে' : 'vouchers found'}
                </span>
              </div>
              {(expenseFilterStartDate || expenseFilterEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setExpenseFilterStartDate('');
                    setExpenseFilterEndDate('');
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline transition-colors cursor-pointer"
                >
                  {language === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={expenseFilterStartDate}
                  onChange={e => setExpenseFilterStartDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'শেষের তারিখ' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={expenseFilterEndDate}
                  onChange={e => setExpenseFilterEndDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Expense History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-slate-100 gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800">
                  {tAcc.historicalLog}
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {language === 'bn' ? 'ব্যবসায়িক খরচ এবং ক্যাশ আউট রসিদ সমূহের পূর্ববর্তী রেকর্ড' : 'Historical records of logged operations, rent, utilities, and wages payout'}
                </p>
              </div>

              <button
                onClick={() => onDownloadPDF('accounting')}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {tAcc.downloadPdf}
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-semibold">
                {tAcc.noExpenses}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">#</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                      <th className="px-5 py-3 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'প্রাপক' : 'Paid To'}</th>
                      <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'নোট' : 'Notes'}</th>
                      <th className="px-5 py-3 text-center font-bold text-slate-500 uppercase tracking-wider text-[10px]">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {paginatedExpenses.map((exp, index) => {
                      const globalIndex = startIndex + index + 1;

                      let badgeBg = 'bg-purple-50 text-purple-700 border-purple-200';
                      const catLower = exp.categoryName.toLowerCase();
                      if (catLower.includes('fuel') || catLower.includes('carriage') || catLower.includes('transport')) {
                        badgeBg = 'bg-orange-50 text-orange-700 border-orange-200';
                      } else if (catLower.includes('salary') || catLower.includes('sr') || catLower.includes('commission')) {
                        badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
                      } else if (catLower.includes('warehouse') || catLower.includes('rent') || catLower.includes('electric')) {
                        badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      }

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 text-slate-400 font-mono font-medium">{globalIndex}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-700">{exp.expenseDate}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}>
                              {exp.categoryName}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="font-extrabold text-slate-900">{formatBDT(exp.amount)}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-slate-600">{exp.paidTo}</span>
                          </td>
                          <td className="px-5 py-3.5 max-w-[200px]">
                            {exp.notes ? (
                              <span className="text-slate-500 italic text-[11px] line-clamp-1" title={exp.notes}>"{exp.notes}"</span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-center flex items-center justify-center gap-1.5">
                            <button
                              id={`exp-btn-print-${exp.id}`}
                              onClick={() => printExpenseReceipt(exp)}
                              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              id={`exp-btn-delete-${exp.id}`}
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">
                  Showing <span className="font-bold text-slate-700">{startIndex + 1}</span> to <span className="font-bold text-slate-700">{Math.min(startIndex + itemsPerPage, totalExpenses)}</span> of <span className="font-bold text-slate-700">{totalExpenses}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    id="exp-page-prev"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      id={`exp-page-num-${page}`}
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${currentPage === page
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    id="exp-page-next"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Categories Setup Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white p-4.5 border border-slate-200 rounded-2xl shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm">{tAcc.categoriesTitle}</h4>
              <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-3 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {categories.length} {language === 'bn' ? 'ক্যাটাগরি' : 'Expense Types'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.map((c, index) => {

                const colorGradients = [
                  'from-blue-500 to-indigo-600',
                  'from-emerald-500 to-teal-600',
                  'from-violet-500 to-purple-600',
                  'from-orange-500 to-red-500'
                ];
                const gradient = colorGradients[index % colorGradients.length];

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-800 transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden"
                  >
                    <div className="absolute -right-20 -top-20 w-36 h-36 rounded-full bg-slate-50 group-hover:bg-slate-100/50 transition-all duration-500 pointer-events-none" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-sm`}>
                          {c.name[0].toUpperCase()}
                        </span>

                        <button
                          id={`cat-btn-edit-${c.id}`}
                          onClick={() => setEditingCat(c)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                          title={tCommon.edit}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                          {c.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-semibold leading-normal line-clamp-2">
                          {c.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB TAB RENDER: Profit Report Filter Engine */}
      {activeTab === 'profit-report' && (
        <div className="space-y-6">

          {/* Filter Range form card */}
          <form onSubmit={handleCalculateReport} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-semibold text-slate-800 tracking-wider uppercase">{tAcc.dynamicYield}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.fromDate}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profit-from-date"
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.toDate}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="profit-to-date"
                    type="date"
                    required
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white pl-10 pr-3.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  id="profit-btn-search"
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-white" />
                  {tAcc.recalculateBtn}
                </button>
              </div>

            </div>
          </form>

          {/* Analysis KPI Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.totalSoldQty}</span>
              <p className="text-xl font-semibold text-slate-800 font-mono">{reportResults.totalSoldQty} units</p>
              <span className="text-[10px] text-slate-400 leading-normal block font-semibold">{tAcc.soldQtyDesc}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.wholesaleRevenue}</span>
              <p className="text-xl font-semibold text-emerald-600 font-mono">{formatBDT(reportResults.totalSellAmt)}</p>
              <span className="text-[10px] text-slate-400 leading-normal block font-semibold">{tAcc.revenueDesc}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.procuredStockQty}</span>
              <p className="text-xl font-semibold text-slate-850 font-mono">{reportResults.totalPurchaseQty} units</p>
              <span className="text-[10px] text-slate-400 leading-normal block font-semibold">{tAcc.procuredQtyDesc}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.procurementExpenditure}</span>
              <p className="text-xl font-semibold text-violet-650 font-mono">{formatBDT(reportResults.totalPurchaseAmt)}</p>
              <span className="text-[10px] text-slate-400 leading-normal block font-semibold">{tAcc.procurementDesc}</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-2">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.opex}</span>
              <p className="text-xl font-semibold text-rose-600 font-mono">{formatBDT(reportResults.totalExpensesAmt)}</p>
              <span className="text-[10px] text-slate-400 leading-normal block font-semibold">{tAcc.opexDesc}</span>
            </div>

          </div>

          {/* Formula Card & Net Profit Display */}
          <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-950 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-8 opacity-5 pointer-events-none">
              <DollarSign className="w-48 h-48 text-slate-700" />
            </div>

            <div className="space-y-2.5 relative z-10">
              <span className="inline-block bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-slate-700">
                {tAcc.formulaCardTitle}
              </span>
              <h3 className="font-semibold text-base">{tAcc.analysisPeriod.replace('{from}', fromDate).replace('{to}', toDate)}</h3>
              <p className="text-slate-300 text-xs max-w-lg leading-relaxed font-semibold">
                {tAcc.formulaDesc}
              </p>
            </div>

            <div className="text-right shrink-0 relative z-10 bg-slate-950/40 border border-slate-800 p-5 rounded-lg min-w-[220px]">
              <span className="text-[11px] text-slate-400 font-semibold block tracking-wider uppercase">{tAcc.netPeriodYield}</span>
              <span className={`text-2xl md:text-3xl font-semibold font-mono block mt-1.5 ${reportResults.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-450'
                }`}>
                {formatBDT(reportResults.netProfit)}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{tAcc.chronologicallyConsolidated}</span>
            </div>
          </div>

        </div>
      )}

      {/* Modal: Log New Expense form */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-2xl flex flex-col justify-between animate-scale-up">

            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-850 text-sm uppercase tracking-wider">
                {tAcc.logNewExpense}
              </span>
              <button
                id="add-expense-modal-close"
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-55 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="modal-body p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.expenseCatLabel}</label>
                <select
                  id="exp-form-category"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="h-11 w-full rounded-lg border-2 border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.payoutAmount}</label>
                  <input
                    id="exp-form-amount"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 5000"
                    value={expenseAmount || ''}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.dateOfPayout}</label>
                  <input
                    id="exp-form-date"
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.paidToLabel}</label>
                <input
                  id="exp-form-paidto"
                  type="text"
                  required
                  placeholder="e.g. Haji Shafiul (Landlord)"
                  value={expensePaidTo}
                  onChange={(e) => setExpensePaidTo(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.voucherNotes}</label>
                <textarea
                  id="exp-form-notes"
                  placeholder={tAcc.voucherNotesPlaceholder}
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold outline-none h-20 resize-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-55 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="add-expense-modal-cancel"
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="exp-form-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
                >
                  {tAcc.logBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Expense Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between animate-scale-up">

            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                {tAcc.createCatTitle}
              </span>
              <button
                id="cat-modal-close"
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="modal-body p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.catNameLabel}</label>
                <input
                  id="new-cat-name"
                  type="text"
                  required
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.catDescLabel}</label>
                <input
                  id="new-cat-desc"
                  type="text"
                  placeholder="Short Description"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-50 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="new-cat-cancel"
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-55 hover:border-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="new-cat-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
                >
                  {tAcc.saveCat}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editing Category Sub-Modal */}
      {editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 w-full max-w-sm shadow-2xl flex flex-col justify-between animate-scale-up">

            {/* Modal Header */}
            <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between shrink-0">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                <Edit3 className="w-4.5 h-4.5 text-slate-800" />
                {tAcc.editCatTitle}
              </span>
              <button
                id="edit-cat-modal-close"
                onClick={() => setEditingCat(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="modal-body p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.catNameLabel}</label>
                <input
                  id="edit-cat-name-input"
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">{tAcc.catDescLabel}</label>
                <input
                  id="edit-cat-desc-input"
                  type="text"
                  value={editingCat.description}
                  onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="border-t border-slate-200 px-6 py-5 flex items-center justify-end gap-3 bg-slate-55 -mx-6 -mb-6 rounded-b-xl shrink-0">
                <button
                  id="edit-cat-btn-cancel"
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="h-11 rounded-lg border-2 border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  {tCommon.cancel}
                </button>
                <button
                  id="edit-cat-btn-submit"
                  type="submit"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 transition-all border border-slate-950 shrink-0 cursor-pointer"
                >
                  {tCommon.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
