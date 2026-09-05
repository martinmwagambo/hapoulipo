'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CATEGORIES } from '@/lib/mockData';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
  totalCount: number;
  isLoading: boolean;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  totalCount,
  isLoading,
}: FilterBarProps) {
  return (
    <div className="mb-6 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products, vendors, or cities..."
          className="input-field pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground mr-1">
          <SlidersHorizontal size={14} />
          <span className="text-xs font-semibold">Filter:</span>
        </div>
        <button
          onClick={() => onCategoryChange('')}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
            !selectedCategory
              ? 'bg-primary text-white'
              : 'bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={`chip-${cat}`}
            onClick={() => onCategoryChange(selectedCategory === cat ? '' : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
              selectedCategory === cat
                ? 'bg-primary text-white'
                : 'bg-white border border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Result count */}
      {!isLoading && (
        <p className="text-xs text-muted-foreground">
          {totalCount === 0
            ? 'No products found'
            : `${totalCount} product${totalCount !== 1 ? 's' : ''} available`}
          {selectedCategory && ` in ${selectedCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}
    </div>
  );
}
