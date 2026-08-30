'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Check, SlidersHorizontal } from 'lucide-react';
import type { Language } from '../../translations';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  pageSizeOptions?: number[];
  totalItems?: number;
  language?: Language;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 20, 50, 100],
  totalItems,
  language = 'en',
  className = '',
}: PaginationProps) {
  const effectiveTotalPages = Math.max(1, totalPages);

  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(String(itemsPerPage));

  // Combine standard options and current itemsPerPage if custom
  const options = Array.from(new Set([...pageSizeOptions, itemsPerPage])).sort((a, b) => a - b);

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < effectiveTotalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customInputValue, 10);
    if (!isNaN(val) && val > 0 && onItemsPerPageChange) {
      onItemsPerPageChange(val);
      onPageChange(1);
      setIsCustomMode(false);
    }
  };

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs ${className}`}>
      {/* Left: Previous & Next Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
          <span>Previous</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= effectiveTotalPages}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1.5"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Right: Items Per Page Dropdown & Custom Input & Page Indicator */}
      <div className="flex flex-wrap items-center gap-3">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5">
            {isCustomMode ? (
              <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 p-1 rounded-xl shadow-2xs">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customInputValue}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => setCustomInputValue(e.target.value)}
                  placeholder="Custom..."
                  className="w-16 px-2 py-1 text-xs sm:text-sm font-semibold font-mono text-slate-800 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-center"
                  autoFocus
                />
                <button
                  type="submit"
                  title="Apply"
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Set</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="relative inline-flex items-center">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsCustomMode(true);
                      setCustomInputValue(String(itemsPerPage));
                    } else {
                      const newSize = Number(e.target.value);
                      onItemsPerPageChange(newSize);
                      onPageChange(1);
                    }
                  }}
                  className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold pl-3.5 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all cursor-pointer shadow-2xs"
                >
                  {options.map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                  <option value="custom">⚙️ Custom number...</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5" />
              </div>
            )}
          </div>
        )}

        <div className="text-xs sm:text-sm font-medium text-slate-600 font-mono">
          Page <strong className="font-bold text-slate-900">{currentPage}</strong> of <strong className="font-bold text-slate-900">{effectiveTotalPages}</strong>
          {totalItems !== undefined && (
            <span className="text-slate-400 text-xs font-normal ml-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
              ({totalItems.toLocaleString()} items)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
