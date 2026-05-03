import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { FigureMode, QFTBookFigureModel } from './engine';

const VW = 1800;
const VH = 1100;

/* ── colour tokens (academic dark-accent palette) ── */
const C = {
  bg: '#ffffff',
  panel: '#f8fafc',
  primary: '#0f172a',
  blue: '#2563eb',
  red: '#dc2626',
  green: '#16a34a',
  purple: '#7c3aed',
  teal: '#0d9488',
  grid: '#cbd5e1',
  border: '#e2e8f0',
  text: '#334155',
  muted: '#64748b',
  lightBlue: '#e0f2fe',
  lightRed: '#fee2e2',
  lightGreen: '#f0fdf4',
  lightYellow: '#fefce8',
};

/* ── LaTeX Component for SVG ── */
function Latex({ x, y, latex, fontSize = 20, color = C.primary, anchor = 'start', width, height }: {
  x: number; y: number; latex: string; fontSize?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; width?: number; height?: number;
}) {
  const html = katex.renderToString(latex, { throwOnError: false, output: 'html' });
  const boxWidth = width ?? latex.length * (fontSize * 0.72) + 80;
  const boxHeight = height ?? fontSize * 2.6;

  const tx = anchor === 'middle' ? x - boxWidth / 2 : anchor === 'end' ? x - boxWidth : x;

  return (
    <foreignObject x={tx} y={y - fontSize} width={boxWidth} height={boxHeight}>
      <div 
        style={{ 
          fontSize: `${fontSize}px`, 
          color, 
          fontFamily: 'serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: anchor === 'middle' ? 'center' : anchor === 'end' ? 'flex-end' : 'flex-start',
          height: '100%',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </foreignObject>
  );
}

/* ── shared SVG primitives ── */
function Badge({ x, y, text, bg, fg }: { x: number; y: number; text: string; bg: string; fg: string }) {
  const w = text.length * 9 + 24;
  return (
    <g>
      <rect x={x - w / 2} y={y - 21} width={w} height={32} rx={16} fill={bg} />
      <text x={x} y={y + 1} textAnchor="middle" fontSize="16" fontWeight="700" fill={fg}>{text}</text>
    </g>
  );
}

function NumberBadge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={19} fill={C.primary} />
      <text x={x} y={y + 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff">{n}</text>
    </g>
  );
}

function Panel({ x, y, w, h, children }: { x: number; y: number; w: number; h: number; children: React.ReactNode }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={C.panel} stroke={C.border} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function FlowArrow({ x1, y1, x2, y2, markerId }: { x1: number; y1: number; x2: number; y2: number; markerId: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.grid} strokeWidth={4} opacity={0.7} markerEnd={`url(#${markerId})`} />;
}

function TreeNode({ x, y, text, w, isOdd }: { x: number; y: number; text: string; w: number; isOdd: boolean }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={48} rx={7} fill={isOdd ? C.lightRed : C.lightBlue} stroke={isOdd ? C.red : C.blue} strokeWidth={1.4} />
      <text x={x} y={y + 30} textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="monospace" fill={isOdd ? C.red : C.blue}>{text}</text>
    </g>
  );
}

function PowerText({ x, y, base, exponent, fontSize = 16, fill = C.text, fontWeight = '500' }: {
  x: number; y: number; base: string; exponent: string; fontSize?: number; fill?: string; fontWeight?: string;
}) {
  return (
    <text x={x} y={y} fontSize={fontSize} fontWeight={fontWeight} fill={fill}>
      <tspan>{base}</tspan>
      <tspan baselineShift="super" fontSize={Math.round(fontSize * 0.65)}>{exponent}</tspan>
    </text>
  );
}

/* ── HEADER ── */
function Header({ model }: { model: QFTBookFigureModel }) {
  return (
    <g>
      <text x={VW / 2} y={44} textAnchor="middle" fontSize="38" fontWeight="800" fill={C.primary}>
        {model.title}
      </text>
      <text x={VW / 2} y={78} textAnchor="middle" fontSize="20" fill={C.text}>
        Dekomposisi Sinyal Berbasis Algoritma Cooley-Tukey Radix-2
      </text>
      <Badge x={VW / 2} y={110} text={`Dataset aktif: ${model.caseId} (${model.signalType})`} bg={C.blue} fg="#fff" />
    </g>
  );
}

/* ── PANEL 1: INPUT TIME DOMAIN ── */
function InputPanel({ model }: { model: QFTBookFigureModel }) {
  const px = 40, py = 160, pw = 540, ph = 450;
  const gx = px + 60, gy = py + 142, gw = pw - 90, gh = 210;
  const midY = gy + gh / 2;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={1} />
      <text x={px + 30} y={py + 32} fontSize="22" fontWeight="800" fill={C.primary}>Sinyal Masukan (Domain Waktu)</text>

      <text x={px + 30} y={py + 72} fontSize="20" fontFamily="Georgia, serif" fill={C.primary}>
        N<tspan baselineShift="sub" fontSize="13">asli</tspan> = {model.nOriginal}
      </text>
      <text x={px + 30} y={py + 98} fontSize="16" fontWeight="600" fill={C.muted}>Tipe: {model.signalType}</text>
      <text x={px + 30} y={py + 125} fontSize="17" fontFamily="Georgia, serif" fill={C.primary}>{model.inputPreviewPlain}</text>

      {/* Chart area */}
      <rect x={gx} y={gy} width={gw} height={gh} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />
      <line x1={gx} y1={midY} x2={gx + gw} y2={midY} stroke={C.grid} strokeWidth={1} strokeDasharray="4 3" />

      {/* Defect 12: Y-axis label x[n] */}
      <g transform={`translate(${gx - 20},${midY}) rotate(-90)`}>
        <text textAnchor="middle" fontSize="15" fill={C.muted} fontStyle="italic">x[n]</text>
      </g>
      {/* Defect 12: X-axis label n */}
      <text x={gx + gw / 2} y={gy + gh + 22} textAnchor="middle" fontSize="15" fill={C.muted} fontStyle="italic">n (indeks sampel)</text>

      {/* Waveform path */}
      <g transform={`translate(${gx + 5},${gy + 5})`}>
        <path d={buildScaledWavePath(model.wavePath, gw - 10, gh - 10)} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Padding annotation */}
      {model.isPadded && (
        <g>
          <rect x={gx + gw / 2 - 105} y={gy + gh + 28} width={210} height={28} rx={7} fill="#fff" stroke={C.red} strokeWidth={1} />
          <text x={gx + gw / 2} y={gy + gh + 47} textAnchor="middle" fontSize="15" fontWeight="800" fill={C.red}>
            Zero-padding ({model.nPadded - model.nOriginal} titik)
          </text>
        </g>
      )}

      {model.isPadded ? (
        <text x={px + 30} y={py + ph - 18} fontSize="15" fill={C.muted}>
          {model.nOriginal} sampel {'->'} zero-pad {'->'} {model.nPadded} sampel
          <tspan> (2</tspan><tspan baselineShift="super" fontSize="10">{Math.log2(model.nPadded)}</tspan><tspan> tahap)</tspan>
        </text>
      ) : (
        <text x={px + 30} y={py + ph - 18} fontSize="15" fill={C.muted}>
          {model.nPadded} sampel, sudah 2<tspan baselineShift="super" fontSize="10">{Math.log2(model.nPadded)}</tspan> - tidak perlu padding
        </text>
      )}
    </Panel>
  );
}

/* ── PANEL 2: DIVIDE & CONQUER (Defects 4 & 5 fixed) ── */
function DividePanel({ model }: { model: QFTBookFigureModel }) {
  const px = 620, py = 160, pw = 560, ph = 450;
  const cx = px + pw / 2;
  const m = Math.log2(model.nPadded);

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={2} />
      <text x={px + 30} y={py + 32} fontSize="22" fontWeight="800" fill={C.primary}>Dekomposisi Sinyal (Rekursif)</text>

      {/* Defect 4: Use 2^m not 2^k */}
      <rect x={px + 30} y={py + 50} width={pw - 60} height={78} rx={8}
        fill={model.isPadded ? '#fef2f2' : '#f0fdf4'}
        stroke={model.isPadded ? C.red : C.green} strokeWidth={1.5} />
      <text x={px + 45} y={py + 80} fontSize="18" fontWeight="800" fill={model.isPadded ? C.red : C.green}>
        {model.isPadded ? `N = ${model.nOriginal} bukan 2^m -> zero-padding ke ${model.nPadded}` : `N = ${model.nOriginal} = 2^${m} -> valid radix-2`}
      </text>
      {model.isPadded ? (
        <>
          <text x={px + 45} y={py + 110} fontSize="15" fill={C.text}>
            {model.nOriginal} != 2^m, N = {model.nPadded} = 2^{m}
          </text>
          <text x={px + 360} y={py + 110} fontSize="15" fill={C.text}>total {m} tahap</text>
        </>
      ) : (
        <>
          <PowerText x={px + 45} y={py + 110} base={`N = ${model.nPadded} = 2`} exponent={String(m)} fontSize={15} fill={C.text} />
          <text x={px + 205} y={py + 110} fontSize="15" fill={C.text}>tanpa padding; {m} tahap rekursi</text>
        </>
      )}

      {/* Defect 5: show recursion chain */}
      <text x={cx} y={py + 154} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.text}>Rantai Rekursi ({m} tahap):</text>
      <rect x={px + 30} y={py + 164} width={pw - 60} height={34} rx={6} fill="#fff" stroke={C.border} strokeWidth={1} />
      <text x={cx} y={py + 187} textAnchor="middle" fontSize="14" fontFamily="monospace" fontWeight="700" fill={C.primary}>
        {model.recursionLevelsLabel}
      </text>

      {/* Tree */}
      <text x={cx} y={py + 228} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.text}>Pemisahan Indeks Genap / Ganjil:</text>

      <TreeNode x={cx} y={py + 240} text={`X[0..${model.nPadded - 1}]`} w={165} isOdd={false} />

      <line x1={cx} y1={py + 288} x2={cx - 120} y2={py + 312} stroke={C.grid} strokeWidth={1.5} />
      <line x1={cx} y1={py + 288} x2={cx + 120} y2={py + 312} stroke={C.grid} strokeWidth={1.5} />

      <TreeNode x={cx - 125} y={py + 318} text={`Genap N=${model.nPadded / 2}`} w={170} isOdd={false} />
      <TreeNode x={cx + 125} y={py + 318} text={`Ganjil N=${model.nPadded / 2}`} w={170} isOdd={true} />

      <text x={cx} y={py + 380} textAnchor="middle" fontSize="24" fill={C.grid}>...</text>

      <rect x={px + 60} y={py + 388} width={pw - 120} height={34} rx={6} fill={C.lightBlue} stroke={C.blue} strokeWidth={1} />
      <text x={cx} y={py + 411} textAnchor="middle" fontSize="15" fontWeight="700" fill={C.blue}>Basis: N=1 (node daun)</text>

      <text x={cx} y={py + ph - 12} textAnchor="middle" fontSize="13" fontStyle="italic" fill={C.muted}>
        *Berlanjut hingga ukuran sub-array N=1.
      </text>
    </Panel>
  );
}

/* ── PANEL 3: BUTTERFLY (Defects 1,2,6,7 fixed) ── */
function CombinePanel() {
  const px = 1220, py = 160, pw = 540, ph = 450;
  const rY = py + 55;
  // butterfly coordinates
  const bY = rY + 205;
  const bLeft = px + 110;
  const bMid = px + 280;
  const bRight = px + 420;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={3} />
      <text x={px + 30} y={py + 32} fontSize="22" fontWeight="800" fill={C.primary}>Operasi Butterfly &amp; Twiddle</text>

      {/* Defect 1+2: taller box, more vertical spacing, correct \cdot */}
      <rect x={px + 20} y={rY} width={pw - 40} height={155} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />
      <text x={px + 35} y={rY + 23} fontSize="15" fontWeight="700" fill={C.muted}>Rumus Butterfly:</text>
      <text x={px + 35} y={rY + 61} fontSize="22" fontFamily="Georgia, serif" fill={C.primary}>
        X[k] = E[k] + W_N^k · O[k]
      </text>
      <text x={px + 35} y={rY + 105} fontSize="22" fontFamily="Georgia, serif" fill={C.primary}>
        X[k + N/2] = E[k] - W_N^k · O[k]
      </text>

      {/* Defect 2: twiddle definition with correct backslash */}
      <text x={px + 35} y={rY + 145} fontSize="21" fontFamily="Georgia, serif" fill={C.primary}>
        W_N^k = exp(-j 2π k / N)
      </text>

      {/* Defect 6+7: butterfly with clear +/- nodes, non-overlapping labels */}
      <text x={px + 30} y={bY - 10} fontSize="15" fontWeight="700" fill={C.text}>Diagram Butterfly:</text>

      <rect x={px + 20} y={bY} width={pw - 40} height={170} rx={8} fill={C.panel} stroke={C.grid} strokeWidth={1} />

      {/* Input labels */}
      <Latex x={bLeft - 55} y={bY + 50} latex="E[k]" fontSize={19} width={70} />
      <Latex x={bLeft - 55} y={bY + 125} latex="O[k]" fontSize={19} width={70} />

      {/* W_N^k multiplier on O[k] path */}
      <line x1={bLeft} y1={bY + 45} x2={bMid - 15} y2={bY + 45} stroke={C.primary} strokeWidth={2} />
      <line x1={bLeft} y1={bY + 120} x2={bMid - 30} y2={bY + 120} stroke={C.primary} strokeWidth={2} />
      {/* Twiddle circle on O branch */}
      <circle cx={bMid - 20} cy={bY + 120} r={15} fill="#fff" stroke={C.blue} strokeWidth={2} />
      <text x={bMid - 20} y={bY + 125} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.blue}>W</text>

      {/* Diagonal crossings */}
      <line x1={bMid - 6} y1={bY + 120} x2={bMid + 30} y2={bY + 45} stroke={C.blue} strokeWidth={1.8} strokeDasharray="5 2" />
      <line x1={bMid - 6} y1={bY + 120} x2={bMid + 30} y2={bY + 120} stroke={C.blue} strokeWidth={2} />
      <line x1={bMid - 15} y1={bY + 45} x2={bMid + 30} y2={bY + 45} stroke={C.primary} strokeWidth={2} />
      <line x1={bMid - 15} y1={bY + 45} x2={bMid + 30} y2={bY + 120} stroke={C.primary} strokeWidth={1.8} strokeDasharray="5 2" />

      {/* Adder circles with clear +/- (Defect 6) */}
      <circle cx={bMid + 42} cy={bY + 45} r={15} fill="#fff" stroke={C.green} strokeWidth={2} />
      <text x={bMid + 42} y={bY + 51} textAnchor="middle" fontSize="17" fontWeight="800" fill={C.green}>+</text>

      <circle cx={bMid + 42} cy={bY + 120} r={15} fill="#fff" stroke={C.red} strokeWidth={2} />
      <text x={bMid + 42} y={bY + 126} textAnchor="middle" fontSize="17" fontWeight="800" fill={C.red}>-</text>

      {/* Output lines */}
      <line x1={bMid + 56} y1={bY + 45} x2={bRight - 10} y2={bY + 45} stroke={C.primary} strokeWidth={2} />
      <line x1={bMid + 56} y1={bY + 120} x2={bRight - 10} y2={bY + 120} stroke={C.primary} strokeWidth={2} />

      {/* Output labels */}
      <Latex x={bRight - 8} y={bY + 50} latex="X[k]" fontSize={19} width={80} />
      <Latex x={bRight - 8} y={bY + 125} latex="X[k+N/2]" fontSize={19} width={120} />
      <text x={bMid + 64} y={bY + 76} fontSize="11" fontFamily="Georgia, serif" fill={C.green}>E[k] + W_N^k O[k]</text>
      <text x={bMid + 64} y={bY + 150} fontSize="11" fontFamily="Georgia, serif" fill={C.red}>E[k] - W_N^k O[k]</text>
    </Panel>
  );
}

/* ── PANEL 4: SPECTRUM (Defects 8,9,10,11 fixed) ── */
function SpectrumPanel({ model }: { model: QFTBookFigureModel }) {
  const px = 40, py = 635, pw = 1720, ph = 405;
  const gx = px + 60, gy = py + 82, gw = pw - 470, gh = 280;
  const spectrum = model.spectrum;
  const halfN = spectrum.length;
  const rawMax = Math.max(...spectrum.map(s => s.magnitude), 1);
  const yMax = rawMax * 1.15; // Defect 10: headroom
  const barSpacing = gw / halfN;
  const barW = Math.max(2, barSpacing * 0.6);
  const tickStep = halfN <= 32 ? 4 : 8; // Defect 11: fewer x-ticks
  const yTickCount = 5;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={4} />
      {/* Defect 8: clearer title — bin index not Hz */}
      <text x={px + 30} y={py + 32} fontSize="22" fontWeight="800" fill={C.primary}>
        Spektrum DFT - Bin Frekuensi
      </text>
      <text x={px + 30} y={py + 57} fontSize="16" fontWeight="600" fill={C.muted}>
        Batas Nyquist: pasangan bin mirror untuk sinyal real
      </text>

      <rect x={gx} y={gy} width={gw} height={gh} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />

      {/* Defect 9: Y-axis ticks */}
      {Array.from({ length: yTickCount + 1 }, (_, i) => {
        const tickVal = (yMax / yTickCount) * i;
        const ty = gy + gh - (tickVal / yMax) * gh;
        return (
          <g key={`ytick-${i}`}>
            <line x1={gx - 6} y1={ty} x2={gx} y2={ty} stroke={C.grid} strokeWidth={1.5} />
            <line x1={gx} y1={ty} x2={gx + gw} y2={ty} stroke="#f1f5f9" strokeWidth={1} />
            <text x={gx - 12} y={ty + 5} textAnchor="end" fontSize="14" fill={C.muted}>
              {Math.round(tickVal)}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={C.primary} strokeWidth={2} />
      <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={C.primary} strokeWidth={2} />

      {/* Bars */}
      {spectrum.map((pt, i) => {
        const barH = (pt.magnitude / yMax) * gh;
        const bx = gx + i * barSpacing + (barSpacing - barW) / 2;
        const by = gy + gh - barH;
        const isDom = model.dominantBins.includes(pt.bin);
        const color = isDom ? C.red : C.blue;

        return (
          <g key={`bar-${pt.bin}`}>
            <rect x={bx} y={by} width={barW} height={barH} fill={color} opacity={isDom ? 1 : 0.65} rx={1} />
            {/* Defect 11: tick every tickStep bins only */}
            {i % tickStep === 0 && (
              <text x={bx + barW / 2} y={gy + gh + 20} textAnchor="middle" fontSize="14" fontFamily="monospace" fill={C.text}>{i}</text>
            )}
            {/* Defect 10: peak labels with headroom won't clip */}
            {isDom && (
              <text x={bx + barW / 2} y={by - 8} textAnchor="middle" fontSize="16" fontWeight="800" fontFamily="monospace" fill={C.red}>
                {pt.magnitude.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={gx + gw / 2} y={gy + gh + 44} textAnchor="middle" fontSize="16" fill={C.text}>
        Indeks Bin (k) - bukan frekuensi Hz
      </text>
      <g transform={`translate(${gx - 35},${gy + gh / 2}) rotate(-90)`}>
        <text textAnchor="middle" fontSize="16" fill={C.text}>Magnitudo |X[k]|</text>
      </g>

      <g>
        <circle cx={gx + 980} cy={py + 56} r={6} fill={C.red} />
        <text x={gx + 994} y={py + 61} fontSize="15" fontWeight="700" fill={C.text}>Merah = bin dominan</text>
        <rect x={gx + 1160} y={py + 50} width={12} height={12} fill={C.blue} opacity={0.65} rx={1} />
        <text x={gx + 1180} y={py + 61} fontSize="15" fontWeight="700" fill={C.text}>Biru = komponen lain</text>
      </g>

      <InterpretationBox model={model} x={gx + gw + 32} y={gy} h={gh} />
    </Panel>
  );
}

/* Defect 15: Explain mirror pair rule N-k */
function InterpretationBox({ model, x, y, h }: { model: QFTBookFigureModel; x: number; y: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={350} height={h} rx={12} fill="#fff" stroke={C.border} strokeWidth={1.5} />
      <text x={x + 22} y={y + 34} fontSize="19" fontWeight="800" fill={C.primary}>Analisis Hasil Spektrum</text>
      <text x={x + 22} y={y + 62} fontSize="15" fill={C.text}>Pasangan mirror dominan:</text>

      {model.dominantPairLines.map((line, i) => (
        <g key={`dom-${line.label}`}>
          <circle cx={x + 30} cy={y + 88 + i * 52} r={6} fill={C.red} />
          <text x={x + 48} y={y + 94 + i * 52} fontSize="16" fontWeight="800" fill={C.primary}>
            {line.label}
          </text>
          <Latex x={x + 48} y={y + 116 + i * 52} latex={`|X[k]| \\approx ${line.magnitude}`} fontSize={16} color={C.text} width={190} />
        </g>
      ))}

      <line x1={x + 22} y1={y + h - 92} x2={x + 328} y2={y + h - 92} stroke={C.border} strokeWidth={1} />

      {/* Defect 15: mirror rule explanation */}
      <text x={x + 22} y={y + h - 72} fontSize="14" fontWeight="800" fill={C.primary}>Aturan mirror FFT real:</text>
      <text x={x + 22} y={y + h - 51} fontSize="13" fill={C.muted}>
        Untuk sinyal real, pasangan mirror: k dan N-k.
      </text>
      <text x={x + 22} y={y + h - 32} fontSize="13" fill={C.muted}>
        Dengan N={model.nPadded}: {model.dominantPairLines.map(l => l.label).join(', ')}.
      </text>
    </g>
  );
}

function buildScaledWavePath(originalPath: string, targetW: number, targetH: number): string {
  if (!originalPath) return '';
  const scaleX = targetW / 240;
  const scaleY = targetH / 64;
  return originalPath.replace(/([ML])\s*([\d.]+)\s+([\d.]+)/g, (_m, cmd, xStr, yStr) => {
    const nx = (parseFloat(xStr) * scaleX).toFixed(2);
    const ny = (parseFloat(yStr) * scaleY).toFixed(2);
    return `${cmd} ${nx} ${ny}`;
  });
}

export function QFTBookFigureSvg({ model, mode }: { model: QFTBookFigureModel; mode: FigureMode }) {
  const flowMarkerId = `fft-flow-arrow-${mode}`;

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="block h-auto w-full" role="img" aria-label={model.title}>
      <defs>
        <marker id={flowMarkerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={C.grid} />
        </marker>
      </defs>

      <Header model={model} />

      <InputPanel model={model} />
      <FlowArrow x1={590} y1={375} x2={615} y2={375} markerId={flowMarkerId} />

      <DividePanel model={model} />
      <FlowArrow x1={1190} y1={375} x2={1215} y2={375} markerId={flowMarkerId} />

      <CombinePanel />
      <FlowArrow x1={VW / 2} y1={595} x2={VW / 2} y2={635} markerId={flowMarkerId} />

      <SpectrumPanel model={model} />

      {/* Defect 13: footer with proper margin, not clipped */}
      <line x1={40} y1={VH - 40} x2={VW - 40} y2={VH - 40} stroke={C.border} strokeWidth={1} />
      <text x={VW / 2} y={VH - 18} textAnchor="middle" fontSize="13" fill={C.muted} fontStyle="italic">
        React SVG + KaTeX • {model.footnote}
      </text>
    </svg>
  );
}
