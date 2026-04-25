import React, { useState } from 'react';
import type { CanvasNodeData, ConnectionMode } from './canvas-types';
import { ANCHOR_RADIUS } from './canvas-types';
import { CATEGORY_COLORS } from '../shared/colors';
import { FormulaDisplay } from '../shared/FormulaDisplay';

interface FormulaNodeProps {
  node: CanvasNodeData;
  formula: { id: string; title: string; latex: string; category: string; description: string };
  isSelected: boolean;
  isConnectionSource: boolean;
  connectionMode: ConnectionMode;
  onSelect: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onConnectionStart: (nodeId: string) => void;
  onConnectionEnd: (nodeId: string) => void;
}

const CATEGORY_BADGE_CLASSES: Record<string, string> = {
  basics: 'bg-cyan-500/20 text-cyan-300',
  gates: 'bg-amber-500/20 text-amber-300',
  dj: 'bg-blue-500/20 text-blue-300',
  qft: 'bg-purple-500/20 text-purple-300',
  vqe: 'bg-green-500/20 text-green-300',
  qaoa: 'bg-orange-500/20 text-orange-300',
  complexity: 'bg-slate-500/20 text-slate-300',
  equations: 'bg-indigo-500/20 text-indigo-300',
  foundational: 'bg-violet-500/20 text-violet-300',
  'state-representation': 'bg-cyan-500/20 text-cyan-300',
  sa: 'bg-red-500/20 text-red-300',
};

export const FormulaNode: React.FC<FormulaNodeProps> = ({
  node,
  formula,
  isSelected,
  isConnectionSource,
  connectionMode,
  onSelect,
  onDelete,
  onConnectionStart,
  onConnectionEnd,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const categoryColorClass = CATEGORY_COLORS[formula.category] || 'border-slate-500';
  const categoryBadgeClass = CATEGORY_BADGE_CLASSES[formula.category] || 'bg-slate-500/20 text-slate-300';
  const displayTitle = node.customTitle || formula.title;
  const displayLatex = node.customLatex || formula.latex;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionMode === 'selecting-target') {
      onConnectionEnd(node.id);
    } else if (connectionMode === 'selecting-source') {
      onConnectionStart(node.id);
    } else {
      onSelect(node.id);
    }
  };

  const handleAnchorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectionMode === 'idle' || connectionMode === 'selecting-source') {
      onConnectionStart(node.id);
    } else if (connectionMode === 'selecting-target') {
      onConnectionEnd(node.id);
    }
  };

  const getBorderClasses = () => {
    if (isConnectionSource) {
      return `border-2 border-cyan-400 animate-pulse`;
    }
    if (isSelected) {
      return `border-2 border-blue-400 ring-2 ring-blue-400/30`;
    }
    return `border ${categoryColorClass}`;
  };

  return (
    <div
      className={`absolute bg-slate-800/95 rounded-lg shadow-lg backdrop-blur-sm transition-shadow duration-200 ${getBorderClasses()}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.width,
        minHeight: 120,
        zIndex: isSelected || isConnectionSource ? 100 : 10,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div className="p-3 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium text-slate-100 leading-tight flex-1">
            {displayTitle}
          </h4>
          {(isHovered || isSelected) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(node.id);
              }}
              className="text-slate-400 hover:text-red-400 transition-colors text-xs px-1"
            >
              ×
            </button>
          )}
        </div>
        <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${categoryBadgeClass}`}>
          {formula.category}
        </span>
      </div>

      <div className="p-3">
        <div className="flex justify-center">
          <FormulaDisplay
            latex={displayLatex}
            size="mini"
            fontSize="0.85rem"
            color="#94a3b8"
          />
        </div>
      </div>

      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-800 cursor-pointer hover:bg-cyan-400 transition-colors ${
          isConnectionSource ? 'bg-cyan-300 scale-125' : ''
        }`}
        style={{ left: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-800 cursor-pointer hover:bg-purple-400 transition-colors"
        style={{ right: -ANCHOR_RADIUS }}
        onClick={handleAnchorClick}
      />
    </div>
  );
};
