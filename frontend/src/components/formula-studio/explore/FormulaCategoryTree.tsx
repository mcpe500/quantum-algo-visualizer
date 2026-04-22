import React, { useState } from 'react';
import type { FormulaCategory } from '../types';

const CATEGORIES = [
  { id: 'basics' as FormulaCategory, label: 'Fundamental', icon: '📐', color: 'cyan' },
  { id: 'gates' as FormulaCategory, label: 'Quantum Gates', icon: '⚡', color: 'amber' },
  { id: 'dj' as FormulaCategory, label: 'Deutsch-Jozsa', icon: '🎯', color: 'blue' },
  { id: 'qft' as FormulaCategory, label: 'QFT / FFT', icon: '〰️', color: 'purple' },
  { id: 'vqe' as FormulaCategory, label: 'VQE', icon: '⚛️', color: 'green' },
  { id: 'qaoa' as FormulaCategory, label: 'QAOA', icon: '🔀', color: 'orange' },
  { id: 'sa' as FormulaCategory, label: 'Simulated Annealing', icon: '🌡️', color: 'red' },
  { id: 'complexity' as FormulaCategory, label: 'Complexity', icon: '📊', color: 'slate' },
];

const COLOR_MAP: Record<string, { bg: string; bgActive: string; text: string; badge: string }> = {
  cyan: { bg: 'bg-cyan-900/30', bgActive: 'bg-cyan-800', text: 'text-cyan-300', badge: 'bg-cyan-700' },
  amber: { bg: 'bg-amber-900/30', bgActive: 'bg-amber-800', text: 'text-amber-300', badge: 'bg-amber-700' },
  blue: { bg: 'bg-blue-900/30', bgActive: 'bg-blue-800', text: 'text-blue-300', badge: 'bg-blue-700' },
  purple: { bg: 'bg-purple-900/30', bgActive: 'bg-purple-800', text: 'text-purple-300', badge: 'bg-purple-700' },
  green: { bg: 'bg-green-900/30', bgActive: 'bg-green-800', text: 'text-green-300', badge: 'bg-green-700' },
  orange: { bg: 'bg-orange-900/30', bgActive: 'bg-orange-800', text: 'text-orange-300', badge: 'bg-orange-700' },
  red: { bg: 'bg-red-900/30', bgActive: 'bg-red-800', text: 'text-red-300', badge: 'bg-red-700' },
  slate: { bg: 'bg-slate-700', bgActive: 'bg-slate-600', text: 'text-slate-300', badge: 'bg-slate-500' },
};

interface CategoryItem {
  id: FormulaCategory;
  label: string;
  icon: string;
  color: string;
}

interface FormulaCategoryTreeProps {
  categoryCounts?: Record<FormulaCategory, number>;
  selectedCategories?: FormulaCategory[];
  multiSelect?: boolean;
  onCategorySelect?: (categories: FormulaCategory[]) => void;
  defaultExpanded?: boolean;
}

export const FormulaCategoryTree: React.FC<FormulaCategoryTreeProps> = ({
  categoryCounts = {} as Record<FormulaCategory, number>,
  selectedCategories = [],
  multiSelect = false,
  onCategorySelect,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleCategoryClick = (categoryId: FormulaCategory) => {
    if (!onCategorySelect) return;

    if (multiSelect) {
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId];
      onCategorySelect(newSelection);
    } else {
      onCategorySelect([categoryId]);
    }
  };

  const sortedCategories = [...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label));

  const totalFormulas = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0) || 0;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Categories</span>
          {totalFormulas > 0 && (
            <span className="text-xs text-slate-400">({totalFormulas} formulas)</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="py-2">
          {sortedCategories.map((category: CategoryItem) => {
            const colors = COLOR_MAP[category.color] || COLOR_MAP.slate;
            const count = categoryCounts[category.id] || 0;
            const isActive = selectedCategories.includes(category.id);

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${
                  isActive ? colors.bgActive : 'hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{category.icon}</span>
                  <span className={`text-sm font-medium ${isActive ? colors.text : 'text-slate-300'}`}>
                    {category.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${colors.badge} text-white`}>
                      {count}
                    </span>
                  )}
                  {isActive && !multiSelect && (
                    <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FormulaCategoryTree;
