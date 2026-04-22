import React from 'react';
import type { FormulaDefinition } from '../types';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import { CATEGORY_COLORS } from '../shared/colors';

interface FormulaGridCardProps {
  formula: FormulaDefinition;
  isSelected?: boolean;
  onSelect: (formula: FormulaDefinition) => void;
}

const FormulaGridCard: React.FC<FormulaGridCardProps> = ({
  formula,
  isSelected = false,
  onSelect,
}) => {
  const borderColor = CATEGORY_COLORS[formula.category] || 'border-slate-500';

  const displayTags = formula.tags.slice(0, 3);
  const extraTagsCount = formula.tags.length - 3;

  return (
    <div
      onClick={() => onSelect(formula)}
      className={`
        relative rounded-lg p-4 cursor-pointer transition-all duration-200
        bg-slate-800 border-l-4 ${borderColor}
        hover:bg-slate-700 hover:border-blue-500
        ${isSelected ? 'ring-1 ring-blue-400' : ''}
      `}
    >
      <h3 className="text-sm font-medium text-white mb-2 truncate">
        {formula.title}
      </h3>

      <div className="mb-3 overflow-hidden">
        <FormulaDisplay latex={formula.latex} size="mini" />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {formula.chapter && formula.chapter.length > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
            Ch. {formula.chapter.join(', ')}
          </span>
        )}
      </div>

      {formula.tags.length > 0 && (
        <p className="text-xs text-slate-400 truncate">
          {displayTags.join(', ')}
          {extraTagsCount > 0 && ` +${extraTagsCount} more`}
        </p>
      )}
    </div>
  );
};

export default FormulaGridCard;
