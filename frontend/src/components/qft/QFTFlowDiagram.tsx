import { useMemo } from 'react';
import { ClassicFlowArrow } from '../classic-flow';

type Complex = { re: number; im: number };

type ButterflyRow = {
  k: number;
  twiddle: Complex;
  even: Complex;
  odd: Complex;
  twiddledOdd: Complex;
  top: Complex;
  bottom: Complex;
};

type FFTTraceNode = {
  size: number;
  depth: number;
  input: number[];
  inputIndices: number[];
  evenInput: number[];
  evenIndices: number[];
  oddInput: number[];
  oddIndices: number[];
  output: Complex[];
  butterflyRows: ButterflyRow[];
  evenNode?: FFTTraceNode;
  oddNode?: FFTTraceNode;
};

interface QFTFlowDiagramProps {
  nPointsOriginal: number;
  nPointsPadded: number;
  dominantBins: number[];
  paddedSignal?: number[];
}

const ZERO: Complex = { re: 0, im: 0 };

function cmul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cadd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}
function csub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}
function cval(v: number): Complex { return { re: v, im: 0 }; }
function cstr(c: Complex): string {
  const r = Math.abs(c.re) < 1e-9 ? 0 : parseFloat(c.re.toFixed(3));
  const i = Math.abs(c.im) < 1e-9 ? 0 : parseFloat(c.im.toFixed(3));
  if (i === 0) return `${r}`;
  if (r === 0) return `${i}j`;
  return `${r} ${i >= 0 ? '+' : '-'} ${Math.abs(i)}j`;
}
function twiddle(n: number, k: number): Complex {
  const theta = (-2 * Math.PI * k) / n;
  return { re: Math.cos(theta), im: Math.sin(theta) };
}

function buildFFTTrace(signal: number[]): FFTTraceNode {
  const n = signal.length;
  if (n === 1) {
    return { size: 1, depth: 0, input: signal, inputIndices: [0],
      evenInput: signal, evenIndices: [0], oddInput: [], oddIndices: [],
      output: [cval(signal[0])], butterflyRows: [] };
  }
  const evenInput = signal.filter((_, i) => i % 2 === 0);
  const oddInput = signal.filter((_, i) => i % 2 !== 0);
  const evenIndices = signal.map((_, i) => i).filter((_, i) => i % 2 === 0);
  const oddIndices = signal.map((_, i) => i).filter((_, i) => i % 2 !== 0);
  const even = buildFFTTrace(evenInput);
  const odd = buildFFTTrace(oddInput);
  const rows: ButterflyRow[] = [];
  const output: Complex[] = Array.from({ length: n }, () => ({ ...ZERO }));
  for (let k = 0; k < n / 2; k++) {
    const e = even.output[k] ?? ZERO;
    const o = odd.output[k] ?? ZERO;
    const w = twiddle(n, k);
    const wo = cmul(w, o);
    rows.push({ k, twiddle: w, even: e, odd: o, twiddledOdd: wo, top: cadd(e, wo), bottom: csub(e, wo) });
    output[k] = cadd(e, wo);
    output[k + n / 2] = csub(e, wo);
  }
  return { size: n, depth: 0, input: signal, inputIndices: signal.map((_, i) => i),
    evenInput, evenIndices, oddInput, oddIndices, output, butterflyRows: rows, evenNode: even, oddNode: odd };
}

function collectMergeOrder(node: FFTTraceNode): FFTTraceNode[] {
  if (node.size === 1) return [];
  const l = node.evenNode ? collectMergeOrder(node.evenNode) : [];
  const r = node.oddNode ? collectMergeOrder(node.oddNode) : [];
  return [...l, ...r, node];
}

// Stages of Cooley-Tukey Radix-2 FFT
function getFFTStages(nPoints: number): Array<{ stage: number; label: string; description: string }> {
  const stages = [];
  let size = nPoints;
  let stage = 1;
  while (size >= 2) {
    const half = size / 2;
    stages.push({
      stage,
      label: `Stage ${stage}: ${half}x 2-pt butterfly`,
      description: `${half} parallel 2-point DFT butterflies, each: top=E+O·W, bot=E−O·W`,
    });
    size = half;
    stage++;
  }
  return stages;
}

export function QFTFlowDiagram({ nPointsOriginal, nPointsPadded, dominantBins, paddedSignal }: QFTFlowDiagramProps) {
  const signal = useMemo(() => paddedSignal ?? [], [paddedSignal]);
  const trace = useMemo(() => signal.length > 0 ? buildFFTTrace(signal) : null, [signal]);
  const mergeOrder = useMemo(() => trace ? collectMergeOrder(trace) : [], [trace]);
  const stages = useMemo(() => getFFTStages(nPointsPadded), [nPointsPadded]);
  const isPadded = nPointsOriginal !== nPointsPadded;
  const isLarge = nPointsPadded > 16;

  // Show only a compact butterfly diagram — largest merge nodes
  const focusButterflies = useMemo(() => {
    if (!trace) return [];
    return mergeOrder.filter(n => n.size > 1).slice(0, isLarge ? 2 : 3);
  }, [trace, mergeOrder, isLarge]);

  const inputLabel = isPadded
    ? `${nPointsOriginal} pts → padded ${nPointsPadded}`
    : `${nPointsOriginal} pts`;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-cyan-50 border border-slate-200 rounded-2xl p-5 mb-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-blue-200">
        <div>
          <h3 className="text-lg font-bold text-gray-800">FFT Pipeline — Cooley-Tukey Radix-2</h3>
          <p className="text-xs text-gray-500 mt-0.5">Input signal → {stages.length} FFT stages → Frequency spectrum</p>
        </div>
        <div className="bg-cyan-100 border border-cyan-200 px-3 py-1.5 rounded-lg">
          <span className="text-xs font-bold text-cyan-800">O(N log N) · N={nPointsPadded}</span>
        </div>
      </div>

      {/* STAGE FLOW — Single row of stages with arrows */}
      <div className="mb-6">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {/* Input box */}
          <div className="flex-shrink-0 bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-3 text-center min-w-[110px]">
            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mb-1">1 · INPUT</p>
            <p className="text-sm font-bold text-blue-800">{inputLabel}</p>
            <p className="text-[10px] text-blue-600 mt-1">Domain: Time</p>
          </div>

          <ClassicFlowArrow tone="blue" size="sm" className="mx-1" />

          {/* FFT Stage boxes */}
          {stages.map((s, idx) => (
            <div key={s.stage} className="flex items-center gap-0 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl px-3 py-3 text-center min-w-[120px]">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider mb-1">
                    {idx + 2} · STAGE {s.stage}
                  </p>
                  <p className="text-xs font-bold text-indigo-800">{s.label}</p>
                </div>
              </div>
              {idx < stages.length - 1 && <ClassicFlowArrow tone="purple" size="sm" className="mx-0.5 scale-90" />}
            </div>
          ))}

          <ClassicFlowArrow tone="emerald" size="sm" className="mx-1" />

          {/* Output box */}
          <div className="flex-shrink-0 bg-teal-50 border-2 border-teal-300 rounded-xl px-4 py-3 text-center min-w-[110px]">
            <p className="text-[10px] text-teal-500 font-bold uppercase tracking-wider mb-1">
              {stages.length + 2} · OUTPUT
            </p>
            <p className="text-sm font-bold text-teal-800">FFT Spectrum</p>
            <p className="text-[10px] text-teal-600 mt-1">Domain: Freq</p>
          </div>
        </div>
      </div>

      {/* BUTTERFLY DIAGRAM — Stage-by-stage visualization */}
      <div className="bg-white border border-purple-200 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8 L6 4 M2 8 L6 12 M6 4 L10 2 M6 12 L10 14 M10 2 L14 8 M10 14 L14 8" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Butterfly Operation — Twiddle Factor</p>
            <p className="text-xs text-gray-500">X[k] = E[k] + W_N^k · O[k] &nbsp;|&nbsp; X[k+N/2] = E[k] − W_N^k · O[k]</p>
          </div>
        </div>

        <div className="flex items-start gap-4 overflow-x-auto">
          {focusButterflies.map((node, ni) => (
            <div key={ni} className="flex-shrink-0">
              {/* Butterfly SVG diagram */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-2 text-center">
                <p className="text-[10px] font-bold text-purple-700">Butterfly N={node.size}</p>
              </div>
              <svg width="200" height={node.size > 4 ? 120 : 90} viewBox="0 0 200 90">
                {/* Input lines */}
                <line x1="0" y1="15" x2="60" y2="15" stroke="#6366f1" strokeWidth="2"/>
                <line x1="0" y1="75" x2="60" y2="75" stroke="#6366f1" strokeWidth="2"/>
                {/* Even label */}
                <text x="5" y="11" fontSize="10" fill="#4338ca" fontFamily="monospace">E[{node.evenIndices.slice(0,3).join(',')}]</text>
                {/* Odd label */}
                <text x="5" y="85" fontSize="10" fill="#9333ea" fontFamily="monospace">O[{node.oddIndices.slice(0,3).join(',')}]</text>

                {/* Center box */}
                <rect x="60" y="5" width="80" height="80" rx="8" fill="#f5f3ff" stroke="#a78bfa" strokeWidth="2"/>
                <text x="100" y="24" fontSize="9" fill="#6b21a8" fontFamily="monospace" textAnchor="middle">{`W_N^k=${cstr(node.butterflyRows[0]?.twiddle ?? ZERO)}`}</text>
                <text x="100" y="38" fontSize="9" fill="#7c3aed" fontFamily="monospace" textAnchor="middle">top=E+O·W</text>
                <text x="100" y="52" fontSize="9" fill="#7c3aed" fontFamily="monospace" textAnchor="middle">bot=E−O·W</text>
                {/* Small butterfly lines inside */}
                <line x1="70" y1="15" x2="120" y2="15" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="70" y1="75" x2="120" y2="75" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="70" y1="15" x2="120" y2="75" stroke="#9333ea" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="70" y1="75" x2="120" y2="15" stroke="#9333ea" strokeWidth="1" strokeDasharray="3,2"/>

                {/* Output lines */}
                <line x1="140" y1="30" x2="200" y2="30" stroke="#059669" strokeWidth="2"/>
                <line x1="140" y1="60" x2="200" y2="60" stroke="#059669" strokeWidth="2"/>
                <text x="160" y="26" fontSize="10" fill="#047857" fontFamily="monospace">Y[k]=top</text>
                <text x="160" y="74" fontSize="10" fill="#047857" fontFamily="monospace">Y[k+N/2]=bot</text>
              </svg>

              {/* Numeric detail */}
              <div className="bg-slate-50 border border-slate-200 rounded p-2 mt-1">
                {node.butterflyRows.slice(0, 2).map(row => (
                  <div key={row.k} className="text-[10px] font-mono text-slate-700 leading-relaxed">
                    k={row.k}: top={cstr(row.top)} bot={cstr(row.bottom)}
                  </div>
                ))}
                {node.butterflyRows.length > 2 && (
                  <div className="text-[10px] text-purple-500 italic mt-1">
                    +{node.butterflyRows.length - 2} more pairs
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TRANSFORM PIPELINE — What happens at each stage */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {([
          { num: 1, bg: 'bg-blue-50', border: 'border-blue-200', label: 'text-blue-600', title: 'text-blue-800', desc: 'text-blue-600', title_text: 'Split Even/Odd', desc_text: `x_even = x[0,2,4,...], x_odd = x[1,3,5,...]` },
          { num: 2, bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'text-indigo-600', title: 'text-indigo-800', desc: 'text-indigo-600', title_text: 'Recursive FFT', desc_text: `Apply FFT to even & odd sub-signals independently` },
          { num: 3, bg: 'bg-purple-50', border: 'border-purple-200', label: 'text-purple-600', title: 'text-purple-800', desc: 'text-purple-600', title_text: 'Twiddle Multiply', desc_text: `O[k] × W_N^k — phase rotation per frequency bin` },
          { num: 4, bg: 'bg-teal-50', border: 'border-teal-200', label: 'text-teal-600', title: 'text-teal-800', desc: 'text-teal-600', title_text: 'Butterfly Combine', desc_text: `Y[k] = E[k] ± O[k]·W — add/subtract for 2 outputs` },
        ] as const).map(item => (
          <div key={item.num} className={`${item.bg} ${item.border} rounded-lg px-3 py-2`}>
            <p className={`text-[10px] font-bold ${item.label} uppercase tracking-wider mb-1`}>Step {item.num}</p>
            <p className={`text-xs font-semibold ${item.title}`}>{item.title_text}</p>
            <p className={`text-[10px] ${item.desc} mt-0.5 leading-tight`}>{item.desc_text}</p>
          </div>
        ))}
      </div>

      {/* OUTPUT FREQUENCY BINS */}
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-teal-800">Dominant Frequency Bins</p>
            <p className="text-xs text-teal-600">Peak bins from FFT output (magnitude spectrum)</p>
          </div>
          <div className="bg-white border border-teal-300 px-3 py-1.5 rounded-lg text-center">
            <span className="text-[10px] text-teal-500 font-bold uppercase tracking-wider">Total Bins</span>
            <span className="block text-lg font-bold text-teal-700">{nPointsPadded}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {dominantBins.length > 0 ? dominantBins.map((bin, i) => (
            <div key={i} className="bg-white border-2 border-teal-400 text-teal-800 px-3 py-1.5 rounded-lg text-center">
              <span className="text-xs font-bold">Bin {bin}</span>
            </div>
          )) : <span className="text-teal-400 text-xs italic">No dominant bins computed</span>}
        </div>
        {isPadded && (
          <p className="text-[10px] text-teal-600 mt-2">
            Note: Signal was zero-padded from {nPointsOriginal} → {nPointsPadded} for power-of-2 FFT compatibility.
            Dominant bins are computed from the padded signal FFT.
          </p>
        )}
      </div>
    </div>
  );
}
