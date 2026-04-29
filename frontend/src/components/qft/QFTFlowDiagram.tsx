import { ArrowDown, GitBranch, Combine, FunctionSquare, BarChart3, Info } from 'lucide-react';

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

const ZERO_COMPLEX: Complex = { re: 0, im: 0 };

function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function complexSub(a: Complex, b: Complex): Complex {
  return { re: a.re - b.re, im: a.im - b.im };
}

function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function twiddle(n: number, k: number): Complex {
  const theta = (-2 * Math.PI * k) / n;
  return { re: Math.cos(theta), im: Math.sin(theta) };
}

function almostZero(value: number): boolean {
  return Math.abs(value) < 1e-9;
}

function fmtReal(value: number): string {
  if (almostZero(value)) return '0';
  const rounded = Number(value.toFixed(4));
  if (Number.isInteger(rounded)) return `${rounded}`;
  return `${rounded}`;
}

function fmtComplex(value: Complex): string {
  const re = almostZero(value.re) ? 0 : Number(value.re.toFixed(4));
  const im = almostZero(value.im) ? 0 : Number(value.im.toFixed(4));

  if (im === 0) return `${re}`;
  if (re === 0) {
    if (im === 1) return 'j';
    if (im === -1) return '-j';
    return `${im}j`;
  }

  const sign = im >= 0 ? '+' : '-';
  const absIm = Math.abs(im);
  const imPart = absIm === 1 ? 'j' : `${absIm}j`;
  return `${re} ${sign} ${imPart}`;
}

function formatArrayReal(arr: number[], maxItems = 12): string {
  if (arr.length === 0) return '[]';
  const shown = arr.slice(0, maxItems).map((v) => fmtReal(v));
  if (arr.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function formatArrayComplex(arr: Complex[], maxItems = 12): string {
  if (arr.length === 0) return '[]';
  const shown = arr.slice(0, maxItems).map((v) => fmtComplex(v));
  if (arr.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function formatIndices(arr: number[], maxItems = 10): string {
  if (arr.length === 0) return '[]';
  const shown = arr.slice(0, maxItems).map((v) => `${v}`);
  if (arr.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function buildFFTTrace(signal: number[], indices: number[], depth = 0): FFTTraceNode {
  const n = signal.length;
  if (n === 1) {
    return {
      size: 1,
      depth,
      input: signal,
      inputIndices: indices,
      evenInput: signal,
      evenIndices: indices,
      oddInput: [],
      oddIndices: [],
      output: [{ re: signal[0] ?? 0, im: 0 }],
      butterflyRows: [],
    };
  }

  const evenInput = signal.filter((_, i) => i % 2 === 0);
  const oddInput = signal.filter((_, i) => i % 2 !== 0);
  const evenIndices = indices.filter((_, i) => i % 2 === 0);
  const oddIndices = indices.filter((_, i) => i % 2 !== 0);

  const evenNode = buildFFTTrace(evenInput, evenIndices, depth + 1);
  const oddNode = buildFFTTrace(oddInput, oddIndices, depth + 1);

  const output: Complex[] = Array.from({ length: n }, () => ({ ...ZERO_COMPLEX }));
  const butterflyRows: ButterflyRow[] = [];

  for (let k = 0; k < n / 2; k += 1) {
    const evenValue = evenNode.output[k] ?? ZERO_COMPLEX;
    const oddValue = oddNode.output[k] ?? ZERO_COMPLEX;
    const wk = twiddle(n, k);
    const twiddledOdd = complexMul(wk, oddValue);
    const top = complexAdd(evenValue, twiddledOdd);
    const bottom = complexSub(evenValue, twiddledOdd);

    output[k] = top;
    output[k + n / 2] = bottom;
    butterflyRows.push({
      k,
      twiddle: wk,
      even: evenValue,
      odd: oddValue,
      twiddledOdd,
      top,
      bottom,
    });
  }

  return {
    size: n,
    depth,
    input: signal,
    inputIndices: indices,
    evenInput,
    evenIndices,
    oddInput,
    oddIndices,
    output,
    butterflyRows,
    evenNode,
    oddNode,
  };
}

function collectNodesByDepth(root: FFTTraceNode): FFTTraceNode[][] {
  const levels: FFTTraceNode[][] = [];
  const queue: FFTTraceNode[] = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) continue;
    if (!levels[node.depth]) levels[node.depth] = [];
    levels[node.depth].push(node);
    if (node.evenNode) queue.push(node.evenNode);
    if (node.oddNode) queue.push(node.oddNode);
  }

  return levels.filter((level) => level.length > 0);
}

function collectMergeOrder(node: FFTTraceNode): FFTTraceNode[] {
  if (node.size === 1) return [];
  const left = node.evenNode ? collectMergeOrder(node.evenNode) : [];
  const right = node.oddNode ? collectMergeOrder(node.oddNode) : [];
  return [...left, ...right, node];
}

export function QFTFlowDiagram({ nPointsOriginal, nPointsPadded, dominantBins, paddedSignal }: QFTFlowDiagramProps) {
  const signal = paddedSignal ?? [];
  const trace = signal.length > 0
    ? buildFFTTrace(signal, signal.map((_, index) => index))
    : null;
  const levels = trace ? collectNodesByDepth(trace) : [];
  const mergeOrder = trace ? collectMergeOrder(trace) : [];
  const isPadded = nPointsOriginal !== nPointsPadded;

  const shouldCompact = nPointsPadded > 16;
  const butterflyRowsLimit = shouldCompact ? 2 : 6;
  const previewLevels = levels.slice(0, shouldCompact ? 2 : 3);
  const hiddenLevelsCount = Math.max(0, levels.length - previewLevels.length);
  const butterflyFocusNodes = mergeOrder
    .filter((node) => node.size > 1)
    .sort((a, b) => b.size - a.size)
    .slice(0, shouldCompact ? 2 : 3);
  const hiddenButterflyCount = Math.max(0, mergeOrder.length - butterflyFocusNodes.length);

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-cyan-50 border border-slate-200 rounded-2xl p-6 mb-6 font-sans overflow-hidden">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-blue-100">
        <div>
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            Alur FFT Klasik Dinamis (Cooley-Tukey Radix-2)
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Penjelasan otomatis dibangun dari sinyal pada JSON case yang sedang dijalankan.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-cyan-100/70 px-3 py-1.5 rounded-lg border border-cyan-200">
          <Info className="w-4 h-4 text-cyan-700" />
          <span className="text-xs font-medium text-cyan-900">Kompleksitas: O(N log N)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start relative">

        <div className="w-full xl:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative z-10 flex flex-col gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FunctionSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-base font-semibold text-gray-800">1. Sinyal Input (Domain Waktu)</p>
            <p className="text-sm text-gray-600 mt-1 mb-2">
              Sinyal asli memiliki <span className="font-semibold">{nPointsOriginal}</span> titik data.
              {isPadded && ` Karena ${nPointsOriginal} bukan perpangkatan dua, dilakukan zero-padding menjadi ${nPointsPadded} titik.`}
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 overflow-hidden">
              <p className="text-xs text-slate-700 font-mono break-all">{formatArrayReal(signal)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-lg text-center min-w-[80px]">
              <span className="block text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Ukuran</span>
              <span className="block text-lg font-bold text-indigo-700">N={nPointsPadded}</span>
            </div>
            <div className="bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-lg text-center min-w-[80px]">
              <span className="block text-[10px] text-cyan-600 font-bold uppercase tracking-wider">Orientasi</span>
              <span className="block text-sm font-bold text-cyan-800">Landscape</span>
            </div>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex xl:hidden flex-col items-center -my-2 relative z-0">
          <div className="w-px h-8 bg-blue-300"></div>
          <ArrowDown className="w-5 h-5 text-blue-400" />
        </div>

        <div className="w-full xl:col-span-8 bg-white border border-indigo-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <GitBranch className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-gray-800">2. Split Rekursif Genap-Ganjil (Divide)</p>
              <p className="text-sm text-gray-600 mt-1">
                Struktur split ditampilkan secara ringkas agar alur FFT terbaca lebih cepat. Detail penuh tetap direpresentasikan oleh trace dinamis dari data JSON aktif.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {previewLevels.map((nodes, depth) => (
              <div key={`depth-${depth}`} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  Level {depth} {depth === 0 ? '(Root)' : ''}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {nodes.map((node, index) => (
                    <div key={`node-${depth}-${index}`} className="rounded-md border border-indigo-100 bg-white p-3">
                      <p className="text-xs font-semibold text-indigo-900">Node N={node.size}</p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        indeks: {formatIndices(node.inputIndices, shouldCompact ? 6 : 10)}
                      </p>
                      <p className="text-[11px] font-mono text-slate-700 mt-1 break-all">
                        x = {formatArrayReal(node.input, shouldCompact ? 6 : 8)}
                      </p>
                      {node.size > 1 && (
                        <div className="grid grid-cols-1 gap-1 mt-2">
                          <p className="text-[11px] text-indigo-700">
                            genap {formatIndices(node.evenIndices, shouldCompact ? 4 : 6)}: {formatArrayReal(node.evenInput, shouldCompact ? 4 : 6)}
                          </p>
                          <p className="text-[11px] text-purple-700">
                            ganjil {formatIndices(node.oddIndices, shouldCompact ? 4 : 6)}: {formatArrayReal(node.oddInput, shouldCompact ? 4 : 6)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {hiddenLevelsCount > 0 && (
              <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 p-3">
                <p className="text-[11px] text-indigo-800">
                  {hiddenLevelsCount} level split lanjutan disingkat agar diagram tetap berbentuk landscape dan mudah dicapture.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex xl:hidden flex-col items-center -my-2 relative z-0">
          <div className="w-px h-8 bg-purple-300"></div>
          <ArrowDown className="w-5 h-5 text-purple-400" />
        </div>

        <div className="w-full xl:col-span-8 bg-white border border-purple-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative z-10">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Combine className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-base font-semibold text-gray-800">3. Butterfly Rekursif + Twiddle Factor (Conquer)</p>
              <p className="text-sm text-gray-600 mt-1 mb-2">
                Penggabungan ditampilkan pada node-node paling representatif. Pola perhitungannya tetap sama, tetapi contoh dibatasi agar tampilan tidak menjulur ke bawah.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center">
              <p className="text-[11px] font-mono text-purple-700 font-semibold mb-1">X[k] = E[k] + W_N^k · O[k]</p>
              <p className="text-[11px] font-mono text-purple-700 font-semibold">X[k+N/2] = E[k] - W_N^k · O[k]</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {butterflyFocusNodes.map((node, nodeIndex) => {
              const rows = node.butterflyRows.slice(0, butterflyRowsLimit);
              const hasHidden = node.butterflyRows.length > rows.length;

              return (
                <div key={`merge-${node.size}-${node.depth}-${nodeIndex}`} className="rounded-lg border border-purple-100 bg-purple-50/40 p-3">
                  <p className="text-xs font-semibold text-purple-900 mb-2">
                    Merge Node N={node.size} (indeks [{node.inputIndices.join(', ')}])
                  </p>
                  <div className="space-y-2">
                    {rows.map((row) => {
                      const topIndex = row.k;
                      const bottomIndex = row.k + node.size / 2;
                      return (
                        <div key={`row-${node.size}-${row.k}`} className="rounded-md border border-purple-200 bg-white p-2">
                          <p className="text-[11px] font-semibold text-slate-700">k={row.k}, W_{node.size}^{row.k} = {fmtComplex(row.twiddle)}</p>
                          <p className="text-[11px] font-mono text-slate-700 mt-1 break-all">
                            X[{topIndex}] = {fmtComplex(row.even)} + ({fmtComplex(row.twiddle)})*({fmtComplex(row.odd)})
                            {' = '}
                            {fmtComplex(row.even)} + {fmtComplex(row.twiddledOdd)} = {fmtComplex(row.top)}
                          </p>
                          <p className="text-[11px] font-mono text-slate-700 mt-1 break-all">
                            X[{bottomIndex}] = {fmtComplex(row.even)} - ({fmtComplex(row.twiddle)})*({fmtComplex(row.odd)})
                            {' = '}
                            {fmtComplex(row.even)} - {fmtComplex(row.twiddledOdd)} = {fmtComplex(row.bottom)}
                          </p>
                        </div>
                      );
                    })}
                    {hasHidden && (
                      <p className="text-[11px] text-purple-700 italic">
                        ... {node.butterflyRows.length - rows.length} pasangan butterfly lain disingkat agar tampilan tetap terbaca.
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-purple-900 mt-3 break-all">
                    Output node N={node.size}: {formatArrayComplex(node.output, shouldCompact ? 8 : 12)}
                  </p>
                </div>
              );
            })}
          </div>
          {hiddenButterflyCount > 0 && (
            <div className="rounded-lg border border-dashed border-purple-200 bg-purple-50/50 p-3 mt-3">
              <p className="text-[11px] text-purple-800">
                {hiddenButterflyCount} node merge lain diringkas. Fokus utama diarahkan ke node terbesar karena paling relevan untuk pembacaan hasil akhir FFT.
              </p>
            </div>
          )}
        </div>

        <div className="flex xl:hidden flex-col items-center -my-2 relative z-0">
          <div className="w-px h-8 bg-teal-300"></div>
          <ArrowDown className="w-5 h-5 text-teal-400" />
        </div>

        <div className="w-full xl:col-span-4 bg-white border-2 border-teal-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative z-10 flex flex-col gap-4">
          <div className="bg-teal-100 p-3 rounded-lg">
            <BarChart3 className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <p className="text-base font-semibold text-gray-800">4. Spektrum Akhir (Domain Frekuensi)</p>
            <p className="text-sm text-gray-600 mt-1">
              Setelah seluruh merge selesai, didapat FFT final untuk case aktif. Perubahan JSON input akan otomatis mengubah semua tahap split, butterfly, dan spektrum ini.
            </p>
            {trace && (
              <p className="text-[11px] font-mono text-teal-900 mt-2 break-all">
                FFT(x) = {formatArrayComplex(trace.output, shouldCompact ? 8 : 12)}
              </p>
            )}
          </div>
          <div className="bg-teal-50 border border-teal-100 px-4 py-3 rounded-lg text-center min-w-[120px]">
            <span className="block text-[10px] text-teal-600 font-bold uppercase tracking-wider mb-1">Puncak Dominan</span>
            <div className="flex flex-wrap justify-center gap-1">
              {dominantBins.map((bin, i) => (
                <span key={i} className="bg-white border border-teal-200 text-teal-800 px-2 py-0.5 rounded text-xs font-bold">
                  Bin {bin}
                </span>
              ))}
              {dominantBins.length === 0 && (
                <span className="text-teal-400 text-xs italic">N/A</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
