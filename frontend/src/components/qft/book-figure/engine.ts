import type { QFTBenchmarkResult } from '../../../types/qft';
import { buildDominantMirrorPairs } from '../dominantPairs';

export type FigureMode = 'screen' | 'export';

type Complex = {
  re: number;
  im: number;
};

type ButterflyRow = {
  k: number;
  twiddle: Complex;
  even: Complex;
  odd: Complex;
  top: Complex;
  bottom: Complex;
};

type FFTTraceNode = {
  size: number;
  depth: number;
  path: string;
  input: number[];
  indices: number[];
  output: Complex[];
  butterflyRows: ButterflyRow[];
  evenNode?: FFTTraceNode;
  oddNode?: FFTTraceNode;
};

export interface DominantPairLine {
  label: string;
  normalizedFrequency: string;
  magnitude: string;
}

export interface SplitPreviewNode {
  label: string;
  preview: string;
}

export interface MergeExample {
  focusBin: number;
  mirrorBin: number;
  even: string;
  odd: string;
  twiddle: string;
  top: string;
  bottom: string;
}

export interface QFTBookFigureModel {
  caseId: string;
  signalType: string;
  nOriginal: number;
  nPadded: number;
  isPadded: boolean;
  title: string;
  metaLine: string;
  inputPreview: string;
  inputPreviewPlain: string;
  paddedPreview: string;
  sampleLine: string;
  recursionLevelsLabel: string;
  wavePath: string;
  treeRootPreview: string;
  treeEvenPreview: string;
  treeOddPreview: string;
  treeQuarterNodes: SplitPreviewNode[];
  treeLeafCount: number;
  treeLeafPreview: string;
  divideSummaryLine: string;
  conquerSummaryLine: string;
  mergeExample: MergeExample | null;
  outputPreview: string;
  mirrorPairLabel: string;
  uniqueBinLabel: string;
  dominantPairLines: DominantPairLine[];
  footnote: string;
  spectrum: QFTBenchmarkResult['fft']['spectrum'];
  dominantBins: number[];
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

function fmtNumber(value: number): string {
  if (almostZero(value)) return '0';
  const rounded = Number(value.toFixed(3));
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function fmtComplex(value: Complex): string {
  const re = almostZero(value.re) ? 0 : Number(value.re.toFixed(3));
  const im = almostZero(value.im) ? 0 : Number(value.im.toFixed(3));

  if (im === 0) return `${re}`;
  if (re === 0) return `${im}j`;

  const sign = im >= 0 ? '+' : '-';
  return `${re} ${sign} ${Math.abs(im)}j`;
}

function formatValuePreview(values: number[], maxItems = 5): string {
  if (values.length === 0) return '[]';
  const shown = values.slice(0, maxItems).map(fmtNumber);
  if (values.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function formatComplexPreview(values: Complex[], maxItems = 3): string {
  if (values.length === 0) return '[]';
  const shown = values.slice(0, maxItems).map(fmtComplex);
  if (values.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function formatIndexPreview(indices: number[], maxItems = 8): string {
  if (indices.length === 0) return '[]';
  const shown = indices.slice(0, maxItems).map(String);
  if (indices.length > maxItems) shown.push('...');
  return `[${shown.join(', ')}]`;
}

function formatSignalType(signalType: string): string {
  const labels: Record<string, string> = {
    synthetic_periodic: 'periodik sintetis',
    synthetic_mixed: 'campuran sintetis',
  };
  return labels[signalType] ?? signalType.replace(/_/g, ' ');
}

function buildWaveformPath(values: number[], width: number, height: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildFFTTrace(signal: number[], indices: number[], depth = 0, path = 'R'): FFTTraceNode {
  const n = signal.length;

  if (n === 1) {
    return {
      size: 1,
      depth,
      path,
      input: signal,
      indices,
      output: [{ re: signal[0] ?? 0, im: 0 }],
      butterflyRows: [],
    };
  }

  const evenInput = signal.filter((_, index) => index % 2 === 0);
  const evenIndices = indices.filter((_, index) => index % 2 === 0);
  const oddInput = signal.filter((_, index) => index % 2 !== 0);
  const oddIndices = indices.filter((_, index) => index % 2 !== 0);
  const evenNode = buildFFTTrace(evenInput, evenIndices, depth + 1, `${path}E`);
  const oddNode = buildFFTTrace(oddInput, oddIndices, depth + 1, `${path}O`);

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
      top,
      bottom,
    });
  }

  return {
    size: n,
    depth,
    path,
    input: signal,
    indices,
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

function formatPathLabel(path: string): string {
  if (path === 'R') return 'root';
  return path
    .slice(1)
    .split('')
    .map((part) => (part === 'E' ? 'genap' : 'ganjil'))
    .join('-');
}

function summarizeLevels(levels: FFTTraceNode[][], reverse = false): string {
  const ordered = reverse ? [...levels].reverse() : levels;
  return ordered
    .map((level) => {
      const first = level[0];
      if (!first) return '';
      const count = level.length;
      return first.size === 1 ? `${count} leaf N=1` : `${count} node N=${first.size}`;
    })
    .filter(Boolean)
    .join(' -> ');
}

export function buildQFTBookFigureModel(result: QFTBenchmarkResult): QFTBookFigureModel {
  const n = result.n_points_padded || result.n_points_original;
  const initialIndices = Array.from({ length: n }, (_, i) => i);
  const trace = buildFFTTrace(result.padded_signal, initialIndices);
  const levels = collectNodesByDepth(trace);
  const mirrorPairs = buildDominantMirrorPairs(result.fft.dominant_bins, result.fft.dominant_magnitudes, result.fft.n_points);
  const primaryPair = mirrorPairs[0] ?? null;
  const focusRow = primaryPair ? trace.butterflyRows[primaryPair.canonicalBin] ?? null : null;
  
  const leaves = levels[levels.length - 1] ?? [];
  const leafIndices = leaves.map(n => n.indices[0]);

  return {
    caseId: result.case_id,
    signalType: formatSignalType(result.signal_type),
    nOriginal: result.n_points_original,
    nPadded: n,
    isPadded: result.n_points_original !== n,
    title: 'Solusi Klasik: Fast Fourier Transform (FFT)',
    metaLine: `Case ${result.case_id} | N_{\\text{asli}} = ${result.n_points_original} | N_{\\text{FFT}} = ${n} | \\log_2(N) = ${Math.log2(n)} | \\text{Kompleksitas } O(N \\log N)`,
    inputPreview: `x_{\\text{raw}}[n] = ${formatValuePreview(result.input_signal, 5)}`,
    inputPreviewPlain: `x_raw[n] = ${formatValuePreview(result.input_signal, 5)}`,
    paddedPreview: `x_{\\text{pad}}[n] = ${formatValuePreview(result.padded_signal, 5)}`,
    sampleLine: result.n_points_original !== n
      ? `\\text{${result.n_points_original} sampel} \\to \\text{zero-pad} \\to \\text{${n} sampel} \\;(2^{${Math.log2(n)}} \\text{ stages})`
      : `\\text{${n} sampel, sudah } 2^{${Math.log2(n)}} \\text{ - tidak perlu padding}`,
    recursionLevelsLabel: Array.from({ length: Math.log2(n) + 1 }, (_, i) => String(n >> i)).join(' -> '),
    wavePath: buildWaveformPath(result.input_signal, 240, 64),
    
    treeRootPreview: formatIndexPreview(trace.indices, 8),
    treeEvenPreview: formatIndexPreview(trace.evenNode?.indices ?? [], 8),
    treeOddPreview: formatIndexPreview(trace.oddNode?.indices ?? [], 8),
    treeQuarterNodes: (levels[2] ?? []).slice(0, 4).map((node) => ({
      label: formatPathLabel(node.path),
      preview: formatIndexPreview(node.indices, 4),
    })),
    treeLeafCount: n,
    treeLeafPreview: formatIndexPreview(leafIndices as number[], 12),
    
    divideSummaryLine: summarizeLevels(levels),
    conquerSummaryLine: summarizeLevels(levels, true),
    mergeExample: focusRow && primaryPair
      ? {
          focusBin: primaryPair.canonicalBin,
          mirrorBin: primaryPair.mirrorBin,
          even: fmtComplex(focusRow.even),
          odd: fmtComplex(focusRow.odd),
          twiddle: fmtComplex(focusRow.twiddle),
          top: fmtComplex(focusRow.top),
          bottom: fmtComplex(focusRow.bottom),
        }
      : null,
    outputPreview: `\\text{FFT}(x_{\\text{pad}}) = ${formatComplexPreview(trace.output, 3)}`,
    mirrorPairLabel: mirrorPairs.map((pair) => pair.label).join(' ; '),
    uniqueBinLabel: mirrorPairs.map((pair) => `${pair.canonicalBin}`).join(', '),
    dominantPairLines: mirrorPairs.map((pair) => ({
      label: pair.label,
      normalizedFrequency: `${fmtNumber(pair.normalizedFrequency)} siklus/sampel`,
      magnitude: fmtNumber(pair.magnitude),
    })),
    footnote: 'Visualisasi diderivasi dari padded_signal. Bin dominan ditampilkan sebagai pasangan mirror FFT real pada batas Nyquist.',
    spectrum: result.fft.spectrum,
    dominantBins: result.fft.dominant_bins,
  };
}
