import { useEffect, useRef, useState } from 'react';
import type { FormulaDefinition } from '../types';
import { FormulaDisplay } from './FormulaDisplay';
import { CATEGORY_COLORS_DETAIL } from './colors';
import { toPng } from 'html-to-image';
import { X, Camera, Copy, Play, BookOpen } from 'lucide-react';
import { StepByStepPanel } from './StepByStepPanel';

interface FormulaDetailPanelProps {
  formula: FormulaDefinition | null;
  onClose?: () => void;
  onNavigate?: (formulaId: string) => void;
}

export function FormulaDetailPanel({ formula, onClose, onNavigate }: FormulaDetailPanelProps) {
  const formulaRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showStepper, setShowStepper] = useState(false);

  useEffect(() => {
    setShowStepper(false);
  }, [formula?.id]);

  const handleScreenshot = async () => {
    if (!formulaRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(formulaRef.current, { quality: 1, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${formula?.id}-formula.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
      alert('Failed to capture screenshot. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCopyLatex = () => {
    if (formula) {
      navigator.clipboard.writeText(formula.latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!formula) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-4xl mb-4 opacity-50">📐</div>
          <p className="text-sm">Select a formula to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-950/50 border-l border-slate-800/50">
      <div ref={formulaRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-slate-100 truncate">{formula.title}</h2>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS_DETAIL[formula.category] || CATEGORY_COLORS_DETAIL.basics}`}>
                {formula.category.toUpperCase()}
              </span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 text-center">
            <FormulaDisplay latex={formula.latex} displayMode fontSize="1.25rem" />
          </div>

          {formula.variables && formula.variables.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-cyan-500 rounded-full" />
                Variabel
              </h3>
              <div className="bg-slate-900/30 rounded-lg p-4 space-y-2">
                {formula.variables.map((v, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-sm">
                    <code className="text-cyan-400 font-mono bg-cyan-400/10 px-1.5 py-0.5 rounded">{v.symbol}</code>
                    <span className="text-slate-500">=</span>
                    <span className="text-slate-300 font-medium">{v.name}</span>
                    <span className="text-slate-600">—</span>
                    <span className="text-slate-400 text-xs">{v.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-500 rounded-full" />
              Deskripsi
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">{formula.description}</p>
          </div>

          {formula.relatedFormulas && formula.relatedFormulas.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-4 bg-green-500 rounded-full" />
                Rumus Terkait
              </h3>
              <div className="space-y-1.5">
                {formula.relatedFormulas.map((rel, i) => (
                  <button
                    key={i}
                    onClick={() => onNavigate?.(rel.targetId)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/30 hover:bg-slate-800/50 border border-slate-800/30 hover:border-slate-700/50 transition-all text-left group"
                  >
                    <span className="text-xs text-slate-500 font-mono bg-slate-800/50 px-1.5 py-0.5 rounded group-hover:text-cyan-400 group-hover:bg-cyan-400/10 transition-colors">
                      {rel.targetId}
                    </span>
                    <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                      {rel.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {formula.chapter && formula.chapter.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Referensi Bab
              </h3>
              <div className="flex flex-wrap gap-2">
                {formula.chapter.map((ch) => (
                  <span
                    key={ch}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400"
                  >
                    Bab {ch}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {formula.computation && (
              <button
                onClick={() => setShowStepper(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Step-by-Step
              </button>
            )}
            <button
              onClick={handleScreenshot}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 text-sm font-medium transition-colors"
            >
              <Camera className="w-4 h-4" />
              Screenshot
            </button>
            <button
              onClick={handleCopyLatex}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 text-sm font-medium transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy LaTeX'}
            </button>
          </div>
        </div>
      </div>

      {showStepper && formula.computation && (
        <StepByStepPanel
          formula={formula}
          onClose={() => setShowStepper(false)}
        />
      )}
    </div>
  );
}
