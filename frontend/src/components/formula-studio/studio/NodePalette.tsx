import React, { useState, useMemo } from 'react';
import { ChevronRight, Search, PanelLeftClose, PanelLeftOpen, Atom, Binary, Calculator, CircuitBoard, FunctionSquare, Gauge, Layers, Sigma, Zap, Thermometer, Hash } from 'lucide-react';
import type { FormulaDefinition, FormulaCategory } from '../types';
import { NodePaletteItem } from './NodePaletteItem';

const CATEGORY_ORDER: FormulaCategory[] = [
  'gates',
  'state-representation',
  'dj',
  'qft',
  'vqe',
  'qaoa',
  'sa',
  'complexity',
  'equations',
  'foundational',
  'basics',
];

const CATEGORY_LABELS: Record<FormulaCategory, string> = {
  gates: 'Quantum Gates',
  'state-representation': 'State Representation',
  dj: 'Deutsch-Jozsa',
  qft: 'Quantum Fourier Transform',
  vqe: 'Variational Quantum Eigensolver',
  qaoa: 'Quantum Approximate Optimization',
  complexity: 'Complexity',
  equations: 'Equations',
  foundational: 'Foundational',
  basics: 'Basics',
  sa: 'Simulated Annealing',
};

const CATEGORY_ICONS: Record<FormulaCategory, React.ReactNode> = {
  gates: <Zap className="w-4 h-4" />,
  'state-representation': <Atom className="w-4 h-4" />,
  dj: <Binary className="w-4 h-4" />,
  qft: <FunctionSquare className="w-4 h-4" />,
  vqe: <Gauge className="w-4 h-4" />,
  qaoa: <CircuitBoard className="w-4 h-4" />,
  complexity: <Calculator className="w-4 h-4" />,
  equations: <Sigma className="w-4 h-4" />,
  foundational: <Layers className="w-4 h-4" />,
  basics: <Hash className="w-4 h-4" />,
  sa: <Thermometer className="w-4 h-4" />,
};

interface NodePaletteProps {
  formulas: FormulaDefinition[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ formulas, collapsed = false, onToggleCollapse }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['gates']));

  const filteredFormulas = useMemo(() => {
    if (!searchQuery.trim()) return formulas;
    const query = searchQuery.toLowerCase();
    return formulas.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.latex.toLowerCase().includes(query) ||
        f.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [formulas, searchQuery]);

  const groupedFormulas = useMemo(() => {
    const groups: Record<string, FormulaDefinition[]> = {};
    filteredFormulas.forEach((f) => {
      if (!groups[f.category]) groups[f.category] = [];
      groups[f.category].push(f);
    });
    return groups;
  }, [filteredFormulas]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (collapsed) {
    return (
      <div className="w-12 shrink-0 bg-slate-900/50 border-r border-slate-700/50 flex flex-col h-full">
        <div className="p-2 border-b border-slate-700/50 flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
            title="Expand library"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {CATEGORY_ORDER.map((category) => {
            const count = groupedFormulas[category]?.length ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={category}
                type="button"
                onClick={() => { onToggleCollapse?.(); }}
                className="w-full flex justify-center py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                title={`${CATEGORY_LABELS[category]} (${count})`}
              >
                {CATEGORY_ICONS[category]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 shrink-0 bg-slate-900/50 border-r border-slate-700/50 flex flex-col h-full">
      <div className="p-3 border-b border-slate-700/50 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/50 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors shrink-0"
          title="Collapse library"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORY_ORDER.map((category) => {
          const formulasInCategory = groupedFormulas[category] || [];
          if (formulasInCategory.length === 0 && searchQuery) return null;

          const isExpanded = expandedCategories.has(category);

          return (
            <div key={category} className="mb-2">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-md transition-colors"
              >
                <ChevronRight
                  className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
                <span className="shrink-0">{CATEGORY_ICONS[category]}</span>
                <span className="truncate">{CATEGORY_LABELS[category] || category}</span>
                <span className="ml-auto text-slate-500 shrink-0">{formulasInCategory.length}</span>
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-1 pl-4">
                  {formulasInCategory.map((formula) => (
                    <NodePaletteItem key={formula.id} formula={formula} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(groupedFormulas).length === 0 && searchQuery && (
          <div className="text-xs text-slate-500 text-center py-4">
            No formulas match "{searchQuery}"
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700/50">
        <p className="text-[10px] text-slate-500 text-center">
          Drag formulas to canvas
        </p>
      </div>
    </div>
  );
};
