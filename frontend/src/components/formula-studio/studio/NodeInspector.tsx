import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Calculator, ChevronDown, ChevronRight, FlaskRound, Info, Trash2, Variable, X, Zap } from 'lucide-react';
import type { CanvasNodeData } from './canvas-types';
import type { ComputationStep, FormulaDefinition } from '../types';
import type { NodeResult } from './graphEngine';

import { evaluateExpression, safeParse, simplifyExpression, substituteSymbols, toInfix } from '../engine';
import { FormulaDisplay } from '../shared/FormulaDisplay';

interface NodeInspectorProps {
  node: CanvasNodeData | null;
  formula: FormulaDefinition | null;
  /** Pre-computed result from the graph engine for this node */
  computedResult?: NodeResult;
  /** Global variable scope from all input nodes */
  varScope: Record<string, number>;
  onUpdate: (nodeId: string, patch: { customTitle?: string; customLatex?: string }) => void;
  onUpdateInputVar: (nodeId: string, varName: string, varValue: string) => void;
  onUpdateExpression: (nodeId: string, expr: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function parseVarAssignments(source: string): { values: Record<string, number>; error?: string } {
  if (!source.trim()) return { values: {} };
  const values: Record<string, number> = {};
  for (const part of source.split(',').map((p) => p.trim()).filter(Boolean)) {
    const eqIdx = part.indexOf('=');
    if (eqIdx <= 0) return { values: {}, error: `Format tidak valid: "${part}". Gunakan: nama=nilai` };
    const name = part.slice(0, eqIdx).trim();
    const raw = part.slice(eqIdx + 1).trim();
    const num = Number(raw);
    if (!name) return { values: {}, error: `Nama variabel kosong pada "${part}".` };
    if (!Number.isFinite(num)) return { values: {}, error: `Nilai "${name}" bukan angka valid: "${raw}".` };
    values[name] = num;
  }
  return { values };
}

const CATEGORY_ACCENT: Record<string, string> = {
  gates: 'cyan',
  dj: 'violet',
  qft: 'blue',
  vqe: 'emerald',
  qaoa: 'orange',
  sa: 'rose',
  complexity: 'amber',
  basics: 'slate',
  'state-representation': 'teal',
  equations: 'purple',
  foundational: 'indigo',
};

function SectionHeader({ icon, label, accent = 'slate' }: { icon: React.ReactNode; label: string; accent?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-${accent}-400 text-[11px] font-bold uppercase tracking-wider`}>
      {icon}
      {label}
    </div>
  );
}

/* ─── INPUT node inspector panel ─────────────────────────────────────────── */

function InputInspector({
  node,
  computedResult,
  varScope,
  onUpdateInputVar,
  onDelete,
  onClose,
}: {
  node: CanvasNodeData;
  computedResult?: NodeResult;
  varScope: Record<string, number>;
  onUpdateInputVar: (nodeId: string, name: string, value: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(node.varName ?? 'x');
  const [value, setValue] = useState(node.varValue ?? '0');

  useEffect(() => {
    setName(node.varName ?? 'x');
    setValue(node.varValue ?? '0');
  }, [node.id, node.varName, node.varValue]);

  const commit = () => onUpdateInputVar(node.id, name.trim() || 'x', value);

  // Show all currently defined variables
  const otherVars = Object.entries(varScope).filter(([k]) => k !== (node.varName ?? 'x'));

  return (
    <aside className="w-96 shrink-0 border-l border-slate-700/50 bg-slate-900/80 flex flex-col gap-0 overflow-y-auto text-slate-100">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-teal-700/40 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Variable className="w-4 h-4 text-teal-400" />
          <div>
            <div className="text-[10px] text-teal-500 uppercase tracking-wider">Input Node</div>
            <div className="text-sm font-semibold text-teal-200">{node.varName} = {node.varValue}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Variable editor */}
      <div className="mx-3 mt-3 rounded-xl border border-teal-500/30 bg-teal-500/5 p-3 space-y-3">
        <SectionHeader icon={<Variable className="w-3.5 h-3.5" />} label="Definisi Variabel" accent="teal" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Variabel ini tersedia untuk semua node Ekspresi dan Formula yang ada di canvas.
        </p>

        <label className="space-y-0.5 block">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Nama Variabel</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-teal-500/40 rounded-lg text-sm font-mono text-teal-200 focus:outline-none focus:border-teal-400 transition-colors"
            placeholder="n"
          />
          <p className="text-[10px] text-slate-500">Gunakan huruf/simbol yang valid: n, dE, T, x1, ...</p>
        </label>

        <label className="space-y-0.5 block">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Nilai</span>
          <input
            type="number"
            value={value}
            onChange={(e) => { setValue(e.target.value); }}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-teal-500/40 rounded-lg text-sm font-mono text-emerald-300 focus:outline-none focus:border-teal-400 transition-colors"
            placeholder="4"
          />
        </label>

        {computedResult?.value !== undefined && (
          <div className="flex items-center gap-2 px-2.5 py-2 bg-teal-500/10 border border-teal-500/25 rounded-lg">
            <span className="text-[10px] text-teal-400">Aktif:</span>
            <span className="font-mono text-sm font-bold text-teal-200">{node.varName} = {computedResult.valueDisplay}</span>
          </div>
        )}
      </div>

      {/* Scope viewer */}
      {otherVars.length > 0 && (
        <div className="mx-3 mt-3 rounded-xl border border-slate-700/40 bg-slate-950/30 p-3 space-y-2">
          <SectionHeader icon={<Info className="w-3.5 h-3.5" />} label="Variabel Lain di Canvas" accent="slate" />
          <div className="space-y-1">
            {otherVars.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-xs">
                <code className="font-mono text-cyan-300">{k}</code>
                <span className="font-mono text-slate-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="mx-3 mt-3 mb-3">
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Node
        </button>
      </div>
    </aside>
  );
}

/* ─── EXPRESSION node inspector panel ───────────────────────────────────── */

function ExpressionInspector({
  node,
  computedResult,
  varScope,
  onUpdateExpression,
  onDelete,
  onClose,
}: {
  node: CanvasNodeData;
  computedResult?: NodeResult;
  varScope: Record<string, number>;
  onUpdateExpression: (nodeId: string, expr: string) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}) {
  const [expr, setExpr] = useState(node.nodeExpression ?? '');

  useEffect(() => {
    setExpr(node.nodeExpression ?? '');
  }, [node.id, node.nodeExpression]);

  const commit = () => onUpdateExpression(node.id, expr);

  const scopeEntries = Object.entries(varScope);
  const hasResult = computedResult?.value !== undefined && !computedResult?.error;

  return (
    <aside className="w-96 shrink-0 border-l border-slate-700/50 bg-slate-900/80 flex flex-col gap-0 overflow-y-auto text-slate-100">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-amber-700/40 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlaskRound className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-amber-500 uppercase tracking-wider">Expression Node</div>
            <div className="text-sm font-semibold text-amber-200 truncate max-w-[160px]">
              {node.nodeExpression || 'Belum ada ekspresi'}
            </div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expression editor */}
      <div className="mx-3 mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
        <SectionHeader icon={<FlaskRound className="w-3.5 h-3.5" />} label="Ekspresi Matematis" accent="amber" />

        <label className="space-y-0.5 block">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ekspresi</span>
          <input
            type="text"
            value={expr}
            onChange={(e) => { setExpr(e.target.value); }}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-500/40 rounded-lg text-sm font-mono text-amber-200 focus:outline-none focus:border-amber-400 transition-colors"
            placeholder="n*(n+1)/2"
          />
          <p className="text-[10px] text-slate-500">Gunakan operator: + - * / ^ ( ) dan fungsi: sqrt exp ln sin cos tan</p>
        </label>

        {/* Live result */}
        {hasResult && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 p-2.5 space-y-1">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">✓ Hasil</div>
            <div className="text-2xl font-bold text-emerald-300 tabular-nums text-center py-1">
              {computedResult!.valueDisplay}
            </div>
            {computedResult!.simplified && computedResult!.simplified !== node.nodeExpression && (
              <div className="text-[10px] text-slate-500 text-center font-mono">
                = {computedResult!.simplified}
              </div>
            )}
          </div>
        )}

        {computedResult?.error && (
          <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/25 rounded-lg">
            <Info className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-red-300 leading-relaxed">{computedResult.error}</p>
          </div>
        )}
      </div>

      {/* Scope viewer */}
      {scopeEntries.length > 0 && (
        <div className="mx-3 mt-3 rounded-xl border border-slate-700/40 bg-slate-950/30 p-3 space-y-2">
          <SectionHeader icon={<Variable className="w-3.5 h-3.5" />} label="Variabel Tersedia" accent="teal" />
          <p className="text-[10px] text-slate-500">Variabel dari semua node Input di canvas:</p>
          <div className="grid grid-cols-2 gap-1">
            {scopeEntries.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between px-2 py-1 bg-teal-500/5 border border-teal-500/20 rounded text-xs">
                <code className="font-mono text-teal-300">{k}</code>
                <span className="font-mono text-slate-400">{v}</span>
              </div>
            ))}
          </div>
          {scopeEntries.length === 0 && (
            <p className="text-[10px] text-slate-600 italic">Belum ada node Input. Tambahkan input untuk mendefinisikan variabel.</p>
          )}
        </div>
      )}

      {/* Delete */}
      <div className="mx-3 mt-3 mb-3">
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/15 hover:border-red-500/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Node
        </button>
      </div>
    </aside>
  );
}

/* ─── FORMULA node inspector panel (existing, enhanced) ─────────────────── */

function FormulaInspector({
  node,
  formula,
  varScope,
  onUpdate,
  onDelete,
  onClose,
}: {
  node: CanvasNodeData;
  formula: FormulaDefinition;
  varScope: Record<string, number>;
  onUpdate: (nodeId: string, patch: { customTitle?: string; customLatex?: string }) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}) {
  const params = useMemo(() => formula.computation?.requiresParams ?? [], [formula]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [calcResult, setCalcResult] = useState<ComputationStep[] | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [sandboxExpr, setSandboxExpr] = useState('');
  const [sandboxVars, setSandboxVars] = useState('');
  const [sandboxOut, setSandboxOut] = useState<{ text: string; ok: boolean } | null>(null);
  const [customLatexInput, setCustomLatexInput] = useState('');
  const [previewLatex, setPreviewLatex] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-populate params from global varScope
  useEffect(() => {
    if (!node || !formula) return;
    const init: Record<string, string> = {};
    for (const p of params) {
      init[p] = varScope[p] !== undefined ? String(varScope[p]) : '';
    }
    setParamValues(init);
    setCalcResult(null);
    setCalcError(null);
    setCustomLatexInput(node.customLatex ?? formula.latex);
    setPreviewLatex(node.customLatex ?? formula.latex);
    setShowEdit(false);
    setShowAdvanced(false);
  }, [node.id, formula.id, varScope]);

  const varDescMap = useMemo(
    () => Object.fromEntries((formula.variables ?? []).map((v) => [v.symbol, v])),
    [formula.variables],
  );
  const getVarInfo = (param: string) =>
    varDescMap[param] ?? varDescMap[param.toUpperCase()] ?? varDescMap[param.toLowerCase()] ?? null;

  const canRun = params.every((p) => {
    const v = paramValues[p] ?? '';
    return v.trim() !== '' && Number.isFinite(Number(v));
  });

  const handleCompute = useCallback(() => {
    if (!formula.computation) return;
    const parsed: Record<string, number> = {};
    for (const p of params) {
      const raw = paramValues[p] ?? '';
      const val = Number(raw);
      if (!Number.isFinite(val)) {
        setCalcError(`Parameter "${p}" harus diisi dengan angka.`);
        setCalcResult(null);
        return;
      }
      parsed[p] = val;
    }
    try {
      const steps = formula.computation.steps(parsed);
      setCalcResult(steps);
      setCalcError(null);
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : 'Kalkulasi gagal.');
      setCalcResult(null);
    }
  }, [formula, params, paramValues]);

  const finalStep = useMemo(
    () => (calcResult && calcResult.length > 0 ? calcResult[calcResult.length - 1] : null),
    [calcResult],
  );

  const handleSandbox = () => {
    if (!sandboxExpr.trim()) { setSandboxOut({ text: 'Masukkan ekspresi.', ok: false }); return; }
    const parsed = safeParse(sandboxExpr.trim());
    if (!parsed.ok) { setSandboxOut({ text: `Parse error: ${parsed.error.message}`, ok: false }); return; }
    const { values, error } = parseVarAssignments(sandboxVars);
    if (error) { setSandboxOut({ text: error, ok: false }); return; }
    const merged = { ...varScope, ...values };
    const substituted = substituteSymbols(parsed.value, merged);
    const simplified = simplifyExpression(substituted);
    const evaled = evaluateExpression(simplified, { variables: merged });
    if (!evaled.ok) { setSandboxOut({ text: `Error: ${evaled.error.message}`, ok: false }); return; }
    setSandboxOut({ text: `Hasil: ${evaled.value}  (${toInfix(simplified)})`, ok: true });
  };

  const handleLatexChange = useCallback((value: string) => {
    setCustomLatexInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewLatex(value), 150);
  }, []);

  const accent = CATEGORY_ACCENT[formula.category] ?? 'slate';

  return (
    <aside className="w-72 border-l border-slate-700/50 bg-slate-900/80 flex flex-col gap-0 overflow-y-auto text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800/60 px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Formula Node</div>
          <div className="text-sm font-semibold text-slate-100 truncate">{node.customTitle || formula.title}</div>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Formula display */}
      <div className={`mx-3 mt-3 rounded-xl border border-${accent}-500/30 bg-${accent}-500/5 p-3 space-y-2`}>
        <div className="flex items-start justify-between gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-${accent}-500/20 text-${accent}-400`}>{formula.category.toUpperCase()}</span>
          <span className="text-[10px] font-mono text-slate-500">{formula.id}</span>
        </div>
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 min-h-10 flex items-center overflow-x-auto">
          <FormulaDisplay latex={node.customLatex ?? formula.latex} displayMode fontSize="1rem" />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{formula.description}</p>
      </div>

      {/* Calculator */}
      <div className="mx-3 mt-3 rounded-xl border border-slate-700/50 bg-slate-950/40 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-800/60 bg-slate-900/50">
          <SectionHeader icon={<Calculator className="w-3.5 h-3.5" />} label="Kalkulator Formula" accent="cyan" />
        </div>

        {formula.computation ? (
          <div className="p-3 space-y-3">
            {formula.computation.expression && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ekspresi</div>
                <div className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-emerald-300">
                  {formula.computation.expression}
                </div>
              </div>
            )}

            {params.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Nilai Variabel
                  {Object.values(paramValues).some(v => v !== '') && (
                    <span className="ml-2 text-teal-400">(dari scope global)</span>
                  )}
                </div>
                {params.map((param) => {
                  const info = getVarInfo(param);
                  const fromScope = varScope[param] !== undefined;
                  return (
                    <div key={param} className="space-y-0.5">
                      <label className="text-[11px] text-slate-400 flex items-center gap-1">
                        <code className={`font-mono text-[10px] px-1 rounded ${fromScope ? 'text-teal-300 bg-teal-400/10' : 'text-cyan-300 bg-cyan-400/10'}`}>{param}</code>
                        {fromScope && <span className="text-teal-500 text-[9px]">← input scope</span>}
                        {info && <span className="text-slate-500">— {info.name}</span>}
                      </label>
                      <input
                        type="number"
                        value={paramValues[param] ?? ''}
                        onChange={(e) => setParamValues((prev) => ({ ...prev, [param]: e.target.value }))}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500/60 transition-colors"
                        placeholder={info?.description ?? `Nilai untuk ${param}`}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={handleCompute}
              disabled={params.length > 0 && !canRun}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-medium hover:from-cyan-500/30 hover:to-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Calculator className="w-4 h-4" />
              Hitung
            </button>

            {calcError && (
              <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                <Info className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-300">{calcError}</p>
              </div>
            )}

            {finalStep && !calcError && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">✓ Hasil</div>
                {finalStep.result && (
                  <div className="text-center py-1">
                    <span className="text-2xl font-bold text-emerald-300 tabular-nums">{finalStep.result}</span>
                  </div>
                )}
                {finalStep.latex && (
                  <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 overflow-x-auto">
                    <FormulaDisplay latex={finalStep.latex} displayMode fontSize="0.95rem" />
                  </div>
                )}
                {calcResult && calcResult.length > 1 && (
                  <div className="space-y-1 pt-1 border-t border-emerald-500/20">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Langkah</div>
                    {calcResult.map((step, idx) => (
                      <div key={step.step} className={`flex items-start gap-2 text-[11px] ${idx === calcResult.length - 1 ? 'text-emerald-300' : 'text-slate-400'}`}>
                        <span className="font-mono text-slate-600 shrink-0">{idx + 1}.</span>
                        <span>{step.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-3">
            <div className="flex items-start gap-2 p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 leading-relaxed">Formula ini merupakan <strong className="text-slate-300">definisi simbolik</strong> — tidak mendukung kalkulasi numerik langsung.</p>
                <p className="text-[10px] text-slate-500 mt-1">Gunakan <em>Step-by-Step</em> di panel Detail.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced sandbox */}
      <div className="mx-3 mt-3 rounded-xl border border-slate-700/40 bg-slate-950/30 overflow-hidden">
        <button type="button" className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors" onClick={() => setShowAdvanced(v => !v)}>
          <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /><span className="font-medium uppercase tracking-wider text-amber-400">Kalkulator Kustom</span></div>
          {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {showAdvanced && (
          <div className="px-3 pb-3 space-y-2 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-500 pt-2">Variabel dari scope global sudah otomatis tersedia. Tambah variabel kustom jika diperlukan.</p>
            <label className="space-y-0.5 block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Ekspresi</span>
              <input type="text" value={sandboxExpr} onChange={(e) => setSandboxExpr(e.target.value)} placeholder="n*(n+1)/2" className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/60" />
            </label>
            <label className="space-y-0.5 block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Variabel Tambahan</span>
              <input type="text" value={sandboxVars} onChange={(e) => setSandboxVars(e.target.value)} placeholder="k=3, epsilon=0.01" className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/60" />
            </label>
            <button type="button" onClick={handleSandbox} className="w-full px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium hover:bg-amber-500/20 transition-colors">Hitung</button>
            {sandboxOut && (
              <pre className={`text-[11px] whitespace-pre-wrap rounded-lg p-2 ${sandboxOut.ok ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-300 bg-red-500/10 border border-red-500/20'}`}>{sandboxOut.text}</pre>
            )}
          </div>
        )}
      </div>

      {/* Edit node */}
      <div className="mx-3 mt-3 rounded-xl border border-slate-700/40 bg-slate-950/30 overflow-hidden">
        <button type="button" className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors" onClick={() => setShowEdit(v => !v)}>
          <span className="font-medium uppercase tracking-wider">Edit Node</span>
          {showEdit ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {showEdit && (
          <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/60 pt-2.5">
            <label className="space-y-0.5 block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Judul Kustom</span>
              <input type="text" value={node.customTitle ?? formula.title} onChange={(e) => onUpdate(node.id, { customTitle: e.target.value })} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none transition-colors" />
            </label>
            <label className="space-y-0.5 block">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">LaTeX Kustom</span>
              <textarea value={customLatexInput} onChange={(e) => handleLatexChange(e.target.value)} rows={3} className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 resize-y focus:outline-none transition-colors" placeholder="Masukkan LaTeX..." />
            </label>
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pratinjau</div>
              <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2 min-h-10 flex items-center overflow-x-auto">
                {previewLatex.trim() ? <FormulaDisplay latex={previewLatex} displayMode fontSize="0.95rem" /> : <span className="text-slate-600 text-xs italic">Tidak ada LaTeX</span>}
              </div>
            </div>
            <button type="button" onClick={() => onUpdate(node.id, { customLatex: customLatexInput })} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-200 text-xs font-medium hover:bg-slate-700 transition-colors">Simpan</button>
          </div>
        )}
      </div>

      {/* Node info */}
      <div className="mx-3 mt-3 px-2.5 py-2 bg-slate-950/30 rounded-lg border border-slate-800/40 text-[10px] text-slate-500 space-y-0.5">
        <div className="flex justify-between"><span>Posisi</span><span className="font-mono text-slate-400">{Math.round(node.position.x)}, {Math.round(node.position.y)}</span></div>
        <div className="flex justify-between"><span>Ukuran</span><span className="font-mono text-slate-400">{Math.round(node.width)} × {Math.round(node.height)}</span></div>
      </div>

      {/* Delete */}
      <div className="mx-3 mt-3 mb-3">
        <button type="button" onClick={() => onDelete(node.id)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/25 text-red-400 text-xs font-medium hover:bg-red-500/15 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Node
        </button>
      </div>
    </aside>
  );
}

/* ─── unified NodeInspector dispatcher ──────────────────────────────────── */

export const NodeInspector: React.FC<NodeInspectorProps> = (props) => {
  const { node, formula, computedResult, varScope, onUpdate, onUpdateInputVar, onUpdateExpression, onDelete, onClose } = props;

  if (!node) return null;

  if (node.kind === 'input') {
    return (
      <InputInspector
        node={node}
        computedResult={computedResult}
        varScope={varScope}
        onUpdateInputVar={onUpdateInputVar}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
  }

  if (node.kind === 'expression') {
    return (
      <ExpressionInspector
        node={node}
        computedResult={computedResult}
        varScope={varScope}
        onUpdateExpression={onUpdateExpression}
        onDelete={onDelete}
        onClose={onClose}
      />
    );
  }

  // formula kind — requires formula data
  if (!formula) return null;

  return (
    <FormulaInspector
      node={node}
      formula={formula}
      varScope={varScope}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClose={onClose}
    />
  );
};