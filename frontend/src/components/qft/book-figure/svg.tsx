import type { FigureMode, QFTBookFigureModel } from './engine';

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 900;

function wrapText(text: string, maxChars: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    if (word.length <= maxChars) {
      current = word;
      continue;
    }

    let remaining = word;
    while (remaining.length > maxChars) {
      lines.push(`${remaining.slice(0, maxChars - 1)}...`);
      remaining = remaining.slice(maxChars - 1);
    }
    current = remaining;
  }

  if (current) lines.push(current);
  return lines;
}

function clampLines(lines: string[], maxLines: number): string[] {
  if (lines.length <= maxLines) return lines;
  const clamped = lines.slice(0, maxLines);
  const last = clamped[maxLines - 1] ?? '';
  clamped[maxLines - 1] = last.length > 3 ? `${last.slice(0, Math.max(0, last.length - 3))}...` : `${last}...`;
  return clamped;
}

function WrappedText({
  x,
  y,
  text,
  maxChars,
  maxLines,
  lineHeight,
  fontSize,
  fontWeight,
  fill,
  textAnchor = 'start',
  fontFamily,
}: {
  x: number;
  y: number;
  text: string;
  maxChars: number;
  maxLines: number;
  lineHeight: number;
  fontSize: number;
  fontWeight: number | string;
  fill: string;
  textAnchor?: 'start' | 'middle' | 'end';
  fontFamily?: string;
}) {
  const lines = clampLines(wrapText(text, maxChars), maxLines);

  return (
    <text x={x} y={y} fontSize={fontSize} fontWeight={fontWeight} fill={fill} textAnchor={textAnchor} fontFamily={fontFamily}>
      {lines.map((line, index) => (
        <tspan key={`${x}-${y}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

function FigureHeader({ model }: { model: QFTBookFigureModel }) {
  return (
    <>
      <rect x="40" y="40" width="6" height="40" rx="3" fill="#0f172a" />
      <text x="60" y="56" fontSize="14" fontWeight="700" letterSpacing="0.2em" fill="#64748b">DIAGRAM AKADEMIK</text>
      <text x="60" y="80" fontSize="24" fontWeight="800" fill="#0f172a">{model.title}</text>
      <WrappedText x={60} y={104} text={model.metaLine} maxChars={110} maxLines={2} lineHeight={16} fontSize={14} fontWeight="500" fill="#475569" />
    </>
  );
}

function InputBlock({ model }: { model: QFTBookFigureModel }) {
  return (
    <>
      <rect x="40" y="160" width="310" height="265" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="60" y="180" width="8" height="16" rx="2" fill="#3b82f6" />
      <text x="76" y="193" fontSize="15" fontWeight="800" letterSpacing="0.05em" fill="#0f172a">1. INPUT SIGNAL</text>
      
      <rect x="60" y="214" width="270" height="100" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
      <line x1="60" y1="264" x2="330" y2="264" stroke="#e2e8f0" strokeWidth="1.5" />
      <path transform="translate(75,224)" d={model.wavePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      
      <WrappedText x={60} y={340} text={model.inputPreview} maxChars={34} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" fontFamily="monospace" />
      <WrappedText x={60} y={364} text={model.paddedPreview} maxChars={34} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" fontFamily="monospace" />
      <WrappedText x={60} y={392} text={model.sampleLine} maxChars={40} maxLines={2} lineHeight={16} fontSize={12} fontWeight="500" fill="#64748b" />
    </>
  );
}

function DivideBlock({ model, flowMarkerId }: { model: QFTBookFigureModel; flowMarkerId: string }) {
  return (
    <>
      <line x1="350" y1="292" x2="380" y2="292" stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${flowMarkerId})`} />
      <rect x="390" y="160" width="750" height="360" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="410" y="180" width="8" height="16" rx="2" fill="#6366f1" />
      <text x="426" y="193" fontSize="15" fontWeight="800" letterSpacing="0.05em" fill="#0f172a">2. SPLIT &amp; DIVIDE</text>
      <text x="410" y="218" fontSize="18" fontWeight="600" fill="#334155">Array input dipecah berdasarkan indeks genap dan ganjil secara rekursif</text>
      
      {/* Root */}
      <rect x="645" y="242" width="240" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="765" y="260" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">ROOT INDICES (N={model.treeLeafCount})</text>
      <WrappedText x={765} y={274} text={model.treeRootPreview} maxChars={30} maxLines={1} lineHeight={16} fontSize={13} fontWeight="600" fill="#0f172a" textAnchor="middle" fontFamily="monospace" />
      
      {/* Tree Lines */}
      <line x1="765" y1="282" x2="765" y2="296" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="570" y1="296" x2="960" y2="296" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="570" y1="296" x2="570" y2="310" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="960" y1="296" x2="960" y2="310" stroke="#cbd5e1" strokeWidth="1.5" />

      {/* Even */}
      <rect x="450" y="310" width="240" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="570" y="328" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">GENAP (N/2)</text>
      <WrappedText x={570} y={342} text={model.treeEvenPreview} maxChars={28} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" textAnchor="middle" fontFamily="monospace" />
      
      {/* Odd */}
      <rect x="840" y="310" width="240" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="960" y="328" fontSize="10" fontWeight="700" fill="#64748b" textAnchor="middle">GANJIL (N/2)</text>
      <WrappedText x={960} y={342} text={model.treeOddPreview} maxChars={28} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" textAnchor="middle" fontFamily="monospace" />

      <text x="410" y="375" fontSize="12" fontWeight="600" fill="#64748b">Level Kedalaman Berikutnya (N/4):</text>
      
      {/* Quarter Nodes */}
      {model.treeQuarterNodes.map((node, index) => {
        const spacing = 175;
        const startX = 410;
        const px = startX + index * spacing;
        const py = 390;
        return (
          <g key={`quarter-${node.label}`}>
            <rect x={px} y={py} width="165" height="40" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <text x={px + 82.5} y={py + 15} fontSize="9" fontWeight="700" fill="#64748b" textAnchor="middle">{node.label.toUpperCase()}</text>
            <WrappedText x={px + 82.5} y={py + 29} text={node.preview} maxChars={20} maxLines={1} lineHeight={12} fontSize={12} fontWeight="600" fill="#0f172a" textAnchor="middle" fontFamily="monospace" />
          </g>
        );
      })}

      {/* Ellipsis / Continuation */}
      <text x="765" y="455" fontSize="24" fontWeight="800" fill="#cbd5e1" textAnchor="middle" letterSpacing="0.2em">...</text>

      {/* Leaf Nodes (N=1) */}
      <rect x="410" y="470" width="710" height="30" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      <text x="420" y="489" fontSize="10" fontWeight="700" fill="#64748b">LEAF (N=1) BIT-REVERSED INDICES:</text>
      <WrappedText x={620} y={489} text={model.treeLeafPreview} maxChars={65} maxLines={1} lineHeight={12} fontSize={12} fontWeight="600" fill="#0f172a" fontFamily="monospace" />

      <WrappedText x={410} y={510} text={model.divideSummaryLine} maxChars={100} maxLines={1} lineHeight={16} fontSize={13} fontWeight="500" fill="#64748b" />
    </>
  );
}

function ConquerBlock({ model, flowMarkerId }: { model: QFTBookFigureModel; flowMarkerId: string }) {
  return (
    <>
      <line x1="765" y1="520" x2="765" y2="540" stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${flowMarkerId})`} />
      <rect x="390" y="548" width="750" height="252" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="410" y="568" width="8" height="16" rx="2" fill="#8b5cf6" />
      <text x="426" y="581" fontSize="15" fontWeight="800" letterSpacing="0.05em" fill="#0f172a">3. CONQUER (BUTTERFLY MERGE)</text>
      <text x="410" y="606" fontSize="18" fontWeight="600" fill="#334155">Menggabungkan hasil rekursif menggunakan Twiddle Factor</text>

      {/* Equations */}
      <rect x="410" y="624" width="310" height="84" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="430" y="650" fontSize="14" fontWeight="600" fontFamily="monospace" fill="#334155">W_N^k = exp(-j 2πk/N)</text>
      <text x="430" y="674" fontSize="14" fontWeight="600" fontFamily="monospace" fill="#334155">X[k]     = E[k] + W_N^k · O[k]</text>
      <text x="430" y="698" fontSize="14" fontWeight="600" fontFamily="monospace" fill="#334155">X[k+N/2] = E[k] - W_N^k · O[k]</text>

      {/* Diagram */}
      <rect x="740" y="624" width="380" height="84" rx="4" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="770" y="655" fontSize="16" fontWeight="600" fill="#0f172a">E[k]</text>
      <text x="770" y="690" fontSize="16" fontWeight="600" fill="#0f172a">O[k]</text>
      
      <line x1="810" y1="650" x2="950" y2="650" stroke="#334155" strokeWidth="1.5" />
      <line x1="810" y1="685" x2="950" y2="685" stroke="#334155" strokeWidth="1.5" />
      <line x1="830" y1="685" x2="930" y2="650" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="830" y1="650" x2="930" y2="685" stroke="#94a3b8" strokeWidth="1.5" />
      
      <circle cx="830" cy="685" r="4" fill="#334155" />
      <text x="830" y="705" fontSize="12" fontWeight="700" fill="#334155" textAnchor="middle">W_N^k</text>
      
      <circle cx="950" cy="650" r="10" fill="white" stroke="#334155" strokeWidth="1.5" />
      <text x="950" y="655" fontSize="14" fontWeight="700" fill="#334155" textAnchor="middle">+</text>
      
      <circle cx="950" cy="685" r="10" fill="white" stroke="#334155" strokeWidth="1.5" />
      <text x="950" y="690" fontSize="14" fontWeight="700" fill="#334155" textAnchor="middle">-</text>

      <line x1="960" y1="650" x2="1020" y2="650" stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow-head)" />
      <line x1="960" y1="685" x2="1020" y2="685" stroke="#334155" strokeWidth="1.5" markerEnd="url(#arrow-head)" />

      <text x="1030" y="655" fontSize="16" fontWeight="600" fill="#0f172a">X[k]</text>
      <text x="1030" y="690" fontSize="16" fontWeight="600" fill="#0f172a">X[k+N/2]</text>

      {model.mergeExample && (
        <>
          <rect x="410" y="724" width="710" height="58" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
          <text x="430" y="746" fontSize="12" fontWeight="700" fill="#64748b">Contoh Merge Pasangan Dominan (k = {model.mergeExample.focusBin} ↔ {model.mergeExample.mirrorBin})</text>
          <WrappedText x={430} y={766} text={`E[${model.mergeExample.focusBin}] = ${model.mergeExample.even}, O[${model.mergeExample.focusBin}] = ${model.mergeExample.odd}, W = ${model.mergeExample.twiddle}, X[${model.mergeExample.focusBin}] = ${model.mergeExample.top}, X[${model.mergeExample.mirrorBin}] = ${model.mergeExample.bottom}`} maxChars={110} maxLines={1} lineHeight={14} fontSize={12} fontWeight="600" fill="#0f172a" fontFamily="monospace" />
        </>
      )}

      <WrappedText x={410} y={794} text={model.conquerSummaryLine} maxChars={100} maxLines={1} lineHeight={16} fontSize={13} fontWeight="500" fill="#64748b" />
    </>
  );
}

function SpectrumBars({ model }: { model: QFTBookFigureModel }) {
  const maxMagnitude = Math.max(...model.spectrum.map((point) => point.magnitude), 1);
  const width = 310;
  const height = 160;
  const x = 1215;
  const y = 320;
  
  return (
    <>
      {model.spectrum.map((point, index) => {
        const barX = x + (index / (model.spectrum.length - 1)) * width;
        const barHeight = (point.magnitude / maxMagnitude) * height;
        const barY = y + height - barHeight;
        const isDominant = model.dominantBins.includes(point.bin);
        const color = isDominant ? '#0d9488' : '#94a3b8';

        return (
          <g key={`fft-stem-${point.bin}`}>
            {/* Stem */}
            <line x1={barX} y1={y + height} x2={barX} y2={barY} stroke={color} strokeWidth={isDominant ? 2.5 : 1.5} opacity={isDominant ? 1 : 0.4} />
            {/* Head (dot) */}
            <circle cx={barX} cy={barY} r={isDominant ? 4 : 2.5} fill={color} />
            
            {(isDominant || point.bin === 0 || point.bin === model.spectrum.length - 1) && (
              <text x={barX} y={y + height + 16} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{point.bin}</text>
            )}
          </g>
        );
      })}
    </>
  );
}

function OutputBlock({ model, flowMarkerId }: { model: QFTBookFigureModel; flowMarkerId: string }) {
  return (
    <>
      <line x1="1140" y1="608" x2="1170" y2="608" stroke="#94a3b8" strokeWidth="2" markerEnd={`url(#${flowMarkerId})`} />
      
      <rect x="1180" y="160" width="380" height="640" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="1200" y="180" width="8" height="16" rx="2" fill="#0d9488" />
      <text x="1216" y="193" fontSize="15" fontWeight="800" letterSpacing="0.05em" fill="#0f172a">4. OUTPUT SPECTRUM</text>
      <text x="1200" y="218" fontSize="18" fontWeight="600" fill="#334155">Frekuensi dominan dari deret waktu</text>
      
      <WrappedText x={1200} y={248} text={model.outputPreview} maxChars={45} maxLines={2} lineHeight={16} fontSize={12.5} fontWeight="600" fill="#0f172a" fontFamily="monospace" />
      
      {/* Chart */}
      <rect x="1200" y="300" width="340" height="200" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.2" />
      <line x1="1200" y1="480" x2="1540" y2="480" stroke="#cbd5e1" strokeWidth="1.5" />
      <text x="1205" y="315" fontSize="10" fontWeight="700" fill="#64748b">Magnitude</text>
      <text x="1530" y="495" fontSize="10" fontWeight="700" fill="#64748b">k (Bin)</text>
      
      <SpectrumBars model={model} />

      <text x="1200" y="550" fontSize="13" fontWeight="700" fill="#334155">Pasangan Bin Dominan (Mirror):</text>
      {model.dominantPairLines.map((line, index) => (
        <g key={`dominant-line-${line.label}`}>
          <circle cx="1208" cy={576 + index * 30} r="4" fill="#0d9488" />
          <text x="1220" y={580 + index * 30} fontSize="13" fontWeight="600" fill="#0f172a" fontFamily="monospace">{line.label}</text>
          <text x="1220" y={596 + index * 30} fontSize="12" fontWeight="500" fill="#64748b">|X[k]| = {line.magnitude}</text>
        </g>
      ))}

      <WrappedText x={1200} y={720} text={`Mirror pair utama: ${model.mirrorPairLabel}`} maxChars={45} maxLines={2} lineHeight={16} fontSize={13} fontWeight="600" fill="#0f172a" />
      <WrappedText x={1200} y={750} text={`Bin unik: ${model.uniqueBinLabel}`} maxChars={45} maxLines={2} lineHeight={16} fontSize={13} fontWeight="500" fill="#475569" />
    </>
  );
}

function FigureFootnote({ model }: { model: QFTBookFigureModel }) {
  return (
    <>
      <line x1="40" y1="850" x2="1560" y2="850" stroke="#e2e8f0" strokeWidth="1.5" />
      <WrappedText x={40} y={875} text={model.footnote} maxChars={200} maxLines={2} lineHeight={16} fontSize={13.5} fontWeight="500" fill="#64748b" />
    </>
  );
}

export function QFTBookFigureSvg({ model, mode }: { model: QFTBookFigureModel; mode: FigureMode }) {
  const flowMarkerId = `fft-flow-arrow-${mode}`;

  return (
    <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="block h-auto w-full" role="img" aria-label={model.title}>
      <defs>
        <marker id={flowMarkerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
        <marker id="arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#334155" />
        </marker>
      </defs>
      <FigureHeader model={model} />
      <InputBlock model={model} />
      <DivideBlock model={model} flowMarkerId={flowMarkerId} />
      <ConquerBlock model={model} flowMarkerId={flowMarkerId} />
      <OutputBlock model={model} flowMarkerId={flowMarkerId} />
      <FigureFootnote model={model} />
    </svg>
  );
}
