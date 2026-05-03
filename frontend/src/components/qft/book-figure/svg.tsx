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

/* ── shared SVG primitives ── */
function Badge({ x, y, text, bg, fg }: { x: number; y: number; text: string; bg: string; fg: string }) {
  const w = text.length * 9 + 24;
  return (
    <g>
      <rect x={x} y={y - 20} width={w} height={30} rx={15} fill={bg} />
      <text x={x + w / 2} y={y} textAnchor="middle" fontSize="14" fontWeight="700" fill={fg}>{text}</text>
    </g>
  );
}

function NumberBadge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={18} fill={C.primary} />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">{n}</text>
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
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.grid} strokeWidth={6} markerEnd={`url(#${markerId})`} />;
}

function TreeNode({ x, y, text, w, isOdd }: { x: number; y: number; text: string; w: number; isOdd: boolean }) {
  return (
    <g>
      <rect x={x - w / 2} y={y} width={w} height={35} rx={6} fill={isOdd ? C.lightRed : C.lightBlue} stroke={isOdd ? C.red : C.blue} strokeWidth={1.2} />
      <text x={x} y={y + 22} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="monospace" fill={isOdd ? C.red : C.blue}>{text}</text>
    </g>
  );
}

function WrapText({ x, y, text, maxChars, fontSize = 13, fill = C.text, fontWeight = '500', anchor = 'start' as const, fontFamily }: {
  x: number; y: number; text: string; maxChars: number; fontSize?: number; fill?: string; fontWeight?: string; anchor?: 'start' | 'middle' | 'end'; fontFamily?: string;
}) {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length <= maxChars) { cur = test; } else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return (
    <text x={x} y={y} fontSize={fontSize} fontWeight={fontWeight} fill={fill} textAnchor={anchor} fontFamily={fontFamily}>
      {lines.slice(0, 3).map((l, i) => <tspan key={i} x={x} dy={i === 0 ? 0 : fontSize + 3}>{l}</tspan>)}
    </text>
  );
}

/* ── HEADER ── */
function Header({ model }: { model: QFTBookFigureModel }) {
  return (
    <g>
      <text x={VW / 2} y={46} textAnchor="middle" fontSize="36" fontWeight="800" fill={C.primary} letterSpacing="0.5">
        Diagram Akademik Alur FFT Klasik Dinamis — Cooley-Tukey Radix-2
      </text>
      <text x={VW / 2} y={78} textAnchor="middle" fontSize="18" fill={C.text}>
        Ilustrasi Visual Transformasi Fourier Cepat Berbasis Dataset Aktual
      </text>
      <Badge x={VW / 2 - 160} y={110} text={`Dataset Aktif: ${model.caseId} (${model.signalType})`} bg={C.blue} fg="#fff" />
    </g>
  );
}

/* ── PANEL 1: INPUT TIME DOMAIN ── */
function InputPanel({ model }: { model: QFTBookFigureModel }) {
  const px = 40, py = 160, pw = 540, ph = 430;
  const gx = px + 30, gy = py + 140, gw = pw - 60, gh = 240;
  const midY = gy + gh / 2;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={1} />
      <text x={px + 30} y={py + 32} fontSize="20" fontWeight="800" fill={C.primary}>Data Input (Domain Waktu)</text>

      {/* Metadata */}
      <text x={px + 30} y={py + 68} fontSize="15" fontFamily="monospace" fill={C.text}>
        Panjang Data (N) = {model.nOriginal} titik
      </text>
      <text x={px + 30} y={py + 92} fontSize="15" fontFamily="monospace" fill={C.text}>
        Tipe             = {model.signalType}
      </text>
      <WrapText x={px + 30} y={py + 116} text={model.inputPreview} maxChars={40} fontSize={14} fontFamily="monospace" fill={C.text} fontWeight="600" />

      {/* Chart area */}
      <rect x={gx} y={gy} width={gw} height={gh} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />
      <line x1={gx} y1={midY} x2={gx + gw} y2={midY} stroke={C.grid} strokeWidth={1.5} />

      {/* Waveform path scaled to chart area */}
      <g transform={`translate(${gx + 10},${gy + 10})`}>
        <path d={buildScaledWavePath(model.wavePath, gw - 20, gh - 20)} fill="none" stroke={C.blue} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Padding annotation */}
      {model.isPadded && (
        <g>
          <text x={gx + gw / 2} y={gy + gh - 16} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.red}>
            → Penambahan Zero-Padding ({model.nPadded - model.nOriginal} titik)
          </text>
          <line x1={gx + gw * 0.7} y1={midY - 5} x2={gx + gw * 0.7} y2={midY + 5} stroke={C.red} strokeWidth={2} strokeDasharray="4 3" />
        </g>
      )}

      {/* Sample info at bottom */}
      <WrapText x={px + 30} y={py + ph - 30} text={model.sampleLine} maxChars={48} fontSize={12} fill={C.muted} />
    </Panel>
  );
}

/* ── PANEL 2: DIVIDE & CONQUER ── */
function DividePanel({ model }: { model: QFTBookFigureModel }) {
  const px = 620, py = 160, pw = 560, ph = 430;
  const cx = px + pw / 2;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={2} />
      <text x={px + 30} y={py + 32} fontSize="20" fontWeight="800" fill={C.primary}>Proses Divide &amp; Conquer</text>

      {/* Validation block */}
      <rect x={px + 30} y={py + 55} width={pw - 60} height={60} rx={8}
        fill={model.isPadded ? '#fef2f2' : '#f0fdf4'}
        stroke={model.isPadded ? C.red : C.green} strokeWidth={1.5} />
      <text x={px + 45} y={py + 80} fontSize="15" fontWeight="700" fill={model.isPadded ? C.red : C.green}>
        {model.isPadded ? '✘ Validasi Gagal: N bukan pangkat dua' : '✔ Validasi Sukses: N adalah pangkat dua'}
      </text>
      <text x={px + 45} y={py + 100} fontSize="13" fill={C.text}>
        {model.isPadded
          ? `Tindakan: Pad N=${model.nOriginal} menjadi N=${model.nPadded} (Pangkat 2 terdekat)`
          : `Tindakan: Pertahankan N=${model.nOriginal}. Pemisahan berimbang terjamin.`}
      </text>

      {/* Tree heading */}
      <text x={cx} y={py + 148} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.text}>
        Pemisahan Indeks Genap/Ganjil (Ukuran Array: {model.nPadded})
      </text>

      {/* Level 0 - Root */}
      <TreeNode x={cx} y={py + 165} text={`X[0..${model.nPadded - 1}]`} w={150} isOdd={false} />

      {/* Lines root -> children */}
      <line x1={cx} y1={py + 200} x2={cx - 130} y2={py + 230} stroke={C.grid} strokeWidth={1.5} />
      <line x1={cx} y1={py + 200} x2={cx + 130} y2={py + 230} stroke={C.grid} strokeWidth={1.5} />

      {/* Level 1 */}
      <TreeNode x={cx - 130} y={py + 235} text={`E[0,2,4..] (N=${model.nPadded / 2})`} w={170} isOdd={false} />
      <TreeNode x={cx + 130} y={py + 235} text={`O[1,3,5..] (N=${model.nPadded / 2})`} w={170} isOdd={true} />

      {/* Level 2 lines */}
      <line x1={cx - 130} y1={py + 270} x2={cx - 195} y2={py + 298} stroke={C.grid} strokeWidth={1.2} />
      <line x1={cx - 130} y1={py + 270} x2={cx - 65} y2={py + 298} stroke={C.grid} strokeWidth={1.2} />
      <line x1={cx + 130} y1={py + 270} x2={cx + 65} y2={py + 298} stroke={C.grid} strokeWidth={1.2} />
      <line x1={cx + 130} y1={py + 270} x2={cx + 195} y2={py + 298} stroke={C.grid} strokeWidth={1.2} />

      {/* Level 2 nodes */}
      <TreeNode x={cx - 195} y={py + 303} text="E_E" w={70} isOdd={false} />
      <TreeNode x={cx - 65} y={py + 303} text="E_O" w={70} isOdd={true} />
      <TreeNode x={cx + 65} y={py + 303} text="O_E" w={70} isOdd={false} />
      <TreeNode x={cx + 195} y={py + 303} text="O_O" w={70} isOdd={true} />

      {/* Ellipsis */}
      <text x={cx} y={py + 370} textAnchor="middle" fontSize="24" fontWeight="800" fill={C.grid}>⋮</text>
      <text x={cx} y={py + 400} textAnchor="middle" fontSize="12" fontStyle="italic" fill={C.muted}>
        *Representasi ringkas rekursi FFT. Berlanjut hingga basis N=1.
      </text>
    </Panel>
  );
}

/* ── PANEL 3: BUTTERFLY & TWIDDLE ── */
function CombinePanel({ model }: { model: QFTBookFigureModel }) {
  const px = 1220, py = 160, pw = 540, ph = 430;
  const rY = py + 60;
  const bY = rY + 165;
  const bX = px + 155;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={3} />
      <text x={px + 30} y={py + 32} fontSize="20" fontWeight="800" fill={C.primary}>Kombinasi &amp; Twiddle Factor</text>

      {/* Formula heading */}
      <text x={px + 30} y={rY} fontSize="14" fontWeight="700" fill={C.text}>Rumus Kombinasi (Operasi Butterfly):</text>

      {/* Formula box */}
      <rect x={px + 30} y={rY + 12} width={pw - 60} height={75} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />
      <text x={px + 50} y={rY + 42} fontSize="16" fontWeight="700" fontFamily="monospace" fill={C.primary}>
        X[k]       = E[k]  +  W_N^k · O[k]
      </text>
      <text x={px + 50} y={rY + 70} fontSize="16" fontWeight="700" fontFamily="monospace" fill={C.primary}>
        X[k + N/2] = E[k]  -  W_N^k · O[k]
      </text>

      {/* Twiddle definition */}
      <text x={px + 30} y={rY + 120} fontSize="14" fontStyle="italic" fill={C.red}>Faktor Putar (Twiddle):</text>
      <text x={px + 220} y={rY + 120} fontSize="16" fontWeight="700" fontFamily="monospace" fill={C.primary}>W_N^k = e^(-j2πk/N)</text>

      {/* Butterfly heading */}
      <text x={px + 30} y={bY - 18} fontSize="14" fontWeight="700" fill={C.text}>Diagram Konseptual "Butterfly"</text>

      {/* Butterfly box */}
      <rect x={px + 30} y={bY} width={pw - 60} height={155} rx={8} fill={C.panel} stroke={C.grid} strokeWidth={1} />

      {/* Labels left */}
      <text x={bX - 50} y={bY + 48} fontSize="16" fontFamily="monospace" fontWeight="600" fill={C.primary}>E[k]</text>
      <text x={bX - 50} y={bY + 118} fontSize="16" fontFamily="monospace" fontWeight="600" fill={C.primary}>O[k]</text>

      {/* Labels right */}
      <text x={bX + 185} y={bY + 48} fontSize="16" fontFamily="monospace" fontWeight="600" fill={C.primary}>X[k]</text>
      <text x={bX + 185} y={bY + 118} fontSize="16" fontFamily="monospace" fontWeight="600" fill={C.primary}>X[k+N/2]</text>

      {/* Straight lines */}
      <line x1={bX} y1={bY + 43} x2={bX + 165} y2={bY + 43} stroke={C.primary} strokeWidth={2} />
      <line x1={bX} y1={bY + 113} x2={bX + 165} y2={bY + 113} stroke={C.primary} strokeWidth={2} />

      {/* Cross lines */}
      <line x1={bX} y1={bY + 43} x2={bX + 165} y2={bY + 113} stroke={C.red} strokeWidth={1.8} />
      <line x1={bX} y1={bY + 113} x2={bX + 165} y2={bY + 43} stroke={C.blue} strokeWidth={1.8} />

      {/* Twiddle labels on butterfly */}
      <text x={bX + 45} y={bY + 78} fontSize="14" fontWeight="700" fontFamily="monospace" fill={C.blue}>W_N^k</text>
      <text x={bX + 45} y={bY + 105} fontSize="14" fontWeight="700" fontFamily="monospace" fill={C.red}>-W_N^k</text>

      {/* Conceptual badge */}
      <rect x={px + pw - 170} y={bY + 8} width={130} height={22} rx={4} fill={C.border} />
      <text x={px + pw - 105} y={bY + 23} textAnchor="middle" fontSize="11" fill={C.text}>Ilustrasi Konseptual</text>
    </Panel>
  );
}

/* ── PANEL 4: SPECTRUM OUTPUT ── */
function SpectrumPanel({ model }: { model: QFTBookFigureModel }) {
  const px = 40, py = 640, pw = 1720, ph = 420;
  const gx = px + 30, gy = py + 70, gw = pw - 400, gh = 320;
  const spectrum = model.spectrum;
  const halfN = spectrum.length;
  const maxMag = Math.max(...spectrum.map(s => s.magnitude), 1);
  const barSpacing = gw / halfN;
  const barW = barSpacing * 0.6;

  return (
    <Panel x={px} y={py} w={pw} h={ph}>
      <NumberBadge x={px - 5} y={py + 25} n={4} />
      <text x={px + 30} y={py + 32} fontSize="20" fontWeight="800" fill={C.primary}>
        Hasil Akhir: Magnitude Spectrum (Limit Nyquist)
      </text>

      {/* Chart area */}
      <rect x={gx} y={gy} width={gw} height={gh} rx={8} fill="#fff" stroke={C.border} strokeWidth={1} />

      {/* Grid lines */}
      {[1, 2, 3, 4].map(i => (
        <line key={`grid-${i}`} x1={gx} y1={gy + gh - (i / 4) * gh} x2={gx + gw} y2={gy + gh - (i / 4) * gh} stroke="#f1f5f9" strokeWidth={1} />
      ))}

      {/* Axes */}
      <line x1={gx} y1={gy} x2={gx} y2={gy + gh} stroke={C.primary} strokeWidth={2} />
      <line x1={gx} y1={gy + gh} x2={gx + gw} y2={gy + gh} stroke={C.primary} strokeWidth={2} />

      {/* Bars */}
      {spectrum.map((pt, i) => {
        const barH = (pt.magnitude / maxMag) * (gh - 40);
        const bx = gx + i * barSpacing + (barSpacing - barW) / 2;
        const by = gy + gh - barH - 2;
        const isDom = model.dominantBins.includes(pt.bin);
        const color = isDom ? C.red : C.blue;

        return (
          <g key={`bar-${pt.bin}`}>
            <rect x={bx} y={by} width={barW} height={barH} fill={color} opacity={isDom ? 1 : 0.65} rx={1} />
            {/* X label */}
            {(halfN <= 32 || i % 2 === 0) && (
              <text x={bx + barW / 2} y={gy + gh + 18} textAnchor="middle" fontSize="12" fontFamily="monospace" fill={C.text}>{i}</text>
            )}
            {/* Peak label */}
            {isDom && (
              <text x={bx + barW / 2} y={by - 8} textAnchor="middle" fontSize="14" fontWeight="700" fontFamily="monospace" fill={C.red}>
                {pt.magnitude.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Axis labels */}
      <text x={gx + gw / 2} y={gy + gh + 42} textAnchor="middle" fontSize="14" fill={C.text}>Indeks Frekuensi (k)</text>
      <g transform={`translate(${gx - 18},${gy + gh / 2 + 50}) rotate(-90)`}>
        <text fontSize="14" fill={C.text}>Magnitudo |X(k)|</text>
      </g>

      {/* Interpretation box */}
      <InterpretationBox model={model} x={gx + gw + 30} y={gy} h={gh} />
    </Panel>
  );
}

function InterpretationBox({ model, x, y, h }: { model: QFTBookFigureModel; x: number; y: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={310} height={h} rx={12} fill="#fff" stroke={C.border} strokeWidth={1.5} />
      <text x={x + 20} y={y + 35} fontSize="18" fontWeight="800" fill={C.primary}>Interpretasi Spektrum</text>
      <text x={x + 20} y={y + 65} fontSize="14" fill={C.text}>Frekuensi Dominan Terdeteksi:</text>

      {model.dominantPairLines.map((line, i) => (
        <g key={`dom-${line.label}`}>
          <circle cx={x + 30} cy={y + 95 + i * 35} r={6} fill={C.red} />
          <text x={x + 45} y={y + 100 + i * 35} fontSize="14" fontWeight="700" fontFamily="monospace" fill={C.primary}>
            {line.label}
          </text>
          <text x={x + 170} y={y + 100 + i * 35} fontSize="14" fontFamily="monospace" fill={C.text}>
            Mag: {line.magnitude}
          </text>
        </g>
      ))}

      {/* Divider */}
      <line x1={x + 20} y1={y + 100 + model.dominantPairLines.length * 35 + 10}
        x2={x + 290} y2={y + 100 + model.dominantPairLines.length * 35 + 10}
        stroke={C.border} strokeWidth={1} />

      <WrapText
        x={x + 20}
        y={y + 100 + model.dominantPairLines.length * 35 + 35}
        text="Puncak magnitudo yang dihitung secara aktual dari data mengindikasikan komponen frekuensi paling kuat yang membentuk pola periodik pada domain waktu."
        maxChars={38} fontSize={13} fontStyle="italic" fill={C.muted}
      />
    </g>
  );
}

/* ── scale the wave path from engine coords to new chart coords ── */
function buildScaledWavePath(originalPath: string, targetW: number, targetH: number): string {
  if (!originalPath) return '';
  // The engine builds path in 240×64 space. We scale it.
  const scaleX = targetW / 240;
  const scaleY = targetH / 64;
  return originalPath.replace(/([ML])\s*([\d.]+)\s+([\d.]+)/g, (_m, cmd, xStr, yStr) => {
    const nx = (parseFloat(xStr) * scaleX).toFixed(2);
    const ny = (parseFloat(yStr) * scaleY).toFixed(2);
    return `${cmd} ${nx} ${ny}`;
  });
}

/* ── MAIN EXPORT ── */
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

      {/* Flow 1→2 */}
      <FlowArrow x1={590} y1={375} x2={615} y2={375} markerId={flowMarkerId} />

      <DividePanel model={model} />

      {/* Flow 2→3 */}
      <FlowArrow x1={1190} y1={375} x2={1215} y2={375} markerId={flowMarkerId} />

      <CombinePanel model={model} />

      {/* Flow down to 4 */}
      <FlowArrow x1={VW / 2} y1={595} x2={VW / 2} y2={635} markerId={flowMarkerId} />

      <SpectrumPanel model={model} />

      {/* Footer */}
      <line x1={40} y1={VH - 30} x2={VW - 40} y2={VH - 30} stroke={C.border} strokeWidth={1} />
      <text x={VW / 2} y={VH - 10} textAnchor="middle" fontSize="13" fill={C.muted} fontStyle="italic">
        100% React SVG | Dataset: datasets/qft/{model.caseId}.json | Gambar Statis Akademik | Resolusi {VW}×{VH}
      </text>
    </svg>
  );
}
