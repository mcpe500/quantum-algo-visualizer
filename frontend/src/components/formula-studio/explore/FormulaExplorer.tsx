import React, { useMemo } from 'react';
import type { FormulaDefinition, FormulaCategory } from '../types';
import { FORMULA_REGISTRY } from '../registry';
import { FormulaCategoryTree } from './FormulaCategoryTree';
import FormulaGridCard from './FormulaGridCard';

interface FormulaExplorerProps {
  onSelectFormula: (formula: FormulaDefinition) => void;
  selectedFormula: FormulaDefinition | null;
}

export const FormulaExplorer: React.FC<FormulaExplorerProps> = ({
  onSelectFormula,
  selectedFormula,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<FormulaCategory | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<FormulaCategory, number>;
    FORMULA_REGISTRY.forEach((formula) => {
      counts[formula.category] = (counts[formula.category] || 0) + 1;
    });
    return counts;
  }, []);

  const filteredFormulas = useMemo(() => {
    let result = FORMULA_REGISTRY;

    if (selectedCategory) {
      result = result.filter((f) => f.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.tags.some((t) => t.toLowerCase().includes(query)) ||
          f.latex.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  const handleCategorySelect = (categories: FormulaCategory[]) => {
    const selected = categories.length > 0 ? categories[0] : null;
    setSelectedCategory(selected);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search formulas by name, tags, or LaTeX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-52 flex-shrink-0 border-r border-slate-700 overflow-y-auto">
          <div className="p-3">
            <FormulaCategoryTree
              categoryCounts={categoryCounts}
              selectedCategories={selectedCategory ? [selectedCategory] : []}
              onCategorySelect={handleCategorySelect}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm">No formulas found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFormulas.map((formula) => (
                <FormulaGridCard
                  key={formula.id}
                  formula={formula}
                  isSelected={selectedFormula?.id === formula.id}
                  onSelect={onSelectFormula}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormulaExplorer;