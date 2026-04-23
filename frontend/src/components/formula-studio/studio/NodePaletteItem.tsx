import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import type { FormulaDefinition } from '../types';
import { FormulaDisplay } from '../shared/FormulaDisplay';

interface NodePaletteItemProps {
  formula: FormulaDefinition;
}

export const NodePaletteItem: React.FC<NodePaletteItemProps> = ({ formula }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${formula.id}`,
    data: {
      type: 'palette-item',
      formulaId: formula.id,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-2 bg-slate-800/50 border border-slate-700/50 rounded-md
        cursor-grab active:cursor-grabbing hover:border-slate-600/80 hover:bg-slate-800/80
        transition-all duration-150
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
      `}
    >
      <GripVertical className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-200 truncate">
          {formula.title}
        </div>
        <div className="mt-0.5 flex justify-center">
          <FormulaDisplay
            latex={formula.latex}
            size="mini"
            fontSize="0.7rem"
            color="#64748b"
          />
        </div>
      </div>
    </div>
  );
};