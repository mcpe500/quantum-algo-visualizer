import type { FigureMode, QFTBookFigureModel } from './engine';

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 940;

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
      <text x="48" y="56" fontSize="15" fontWeight="700" letterSpacing="0.22em" fill="#0f766e">GAMBAR BUKU TA</text>
      <text x="48" y="94" fontSize="26" fontWeight="700" fill="#0f172a">{model.title}</text>
      <WrappedText x={48} y={122} text={model.metaLine} maxChars={110} maxLines={2} lineHeight={16} fontSize={15} fontWeight="500" fill="#475569" />
    </>
  );
}

function InputBlock({ model }: { model: QFTBookFigureModel }) {
  return (
    <>
      <rect x="40" y="160" width="300" height="255" rx="16" fill="#f8fbff" stroke="#bfdbfe" strokeWidth="1.5" />
      <text x="58" y="188" fontSize="14" fontWeight="700" letterSpacing="0.16em" fill="#2563eb">1. INPUT</text>
      <rect x="58" y="206" width="264" height="96" rx="12" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.5" />
      <line x1="70" y1="254" x2="310" y2="254" stroke="#dbeafe" strokeWidth="2" />
      <path transform="translate(70,220)" d={model.wavePath} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <WrappedText x={58} y={324} text={model.inputPreview} maxChars={34} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
      <WrappedText x={58} y={344} text={model.paddedPreview} maxChars={34} maxLines={1} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
      <WrappedText x={58} y={368} text={model.sampleLine} maxChars={38} maxLines={2} lineHeight={14} fontSize={13} fontWeight="500" fill="#475569" />
    </>
  );
}

function DivideBlock({ model, flowMarkerId }: { model: QFTBookFigureModel; flowMarkerId: string }) {
  const quarterPositions = [
    { x: 430, y: 392 },
    { x: 742, y: 392 },
    { x: 430, y: 444 },
    { x: 742, y: 444 },
  ];

  return (
    <>
      <line x1="342" y1="286" x2="388" y2="286" stroke="#94a3b8" strokeWidth="3" markerEnd={`url(#${flowMarkerId})`} />
      <rect x="390" y="160" width="720" height="360" rx="16" fill="#fcfcff" stroke="#c7d2fe" strokeWidth="1.5" />
      <text x="410" y="188" fontSize="14" fontWeight="700" letterSpacing="0.16em" fill="#4f46e5">2. DIVIDE</text>
      <text x="410" y="218" fontSize="22" fontWeight="700" fill="#0f172a">Array nyata dipecah dari root ke 2 lalu ke 4 cabang</text>

      <rect x="430" y="242" width="500" height="42" rx="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      <WrappedText x={680} y={266} text={model.paddedPreview} maxChars={42} maxLines={1} lineHeight={16} fontSize={14} fontWeight="600" fill="#0f172a" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
      <line x1="680" y1="284" x2="680" y2="306" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="582" y1="306" x2="778" y2="306" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="582" y1="306" x2="520" y2="326" stroke="#94a3b8" strokeWidth="2.5" />
      <line x1="778" y1="306" x2="950" y2="326" stroke="#94a3b8" strokeWidth="2.5" />

      <rect x="430" y="326" width="280" height="48" rx="12" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.2" />
      <rect x="798" y="326" width="282" height="48" rx="12" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="1.2" />
      <WrappedText x={570} y={346} text={model.evenPreview} maxChars={28} maxLines={2} lineHeight={14} fontSize={13} fontWeight="600" fill="#3730a3" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
      <WrappedText x={939} y={346} text={model.oddPreview} maxChars={30} maxLines={2} lineHeight={14} fontSize={13} fontWeight="600" fill="#6d28d9" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />

      <text x="430" y="388" fontSize="13" fontWeight="600" fill="#475569">Level berikutnya: 4 sub-array nyata dari split rekursif</text>
      {model.quarterNodes.map((node, index) => {
        const position = quarterPositions[index];
        if (!position) return null;

        return (
          <g key={`quarter-${node.label}`}>
            <rect x={position.x} y={position.y} width="296" height="44" rx="12" fill="#ffffff" stroke="#dbeafe" strokeWidth="1.2" />
            <text x={position.x + 10} y={position.y + 14} fontSize="10" fontWeight="700" fill="#6366f1">{node.label.toUpperCase()}</text>
            <WrappedText x={position.x + 10} y={position.y + 31} text={node.preview} maxChars={26} maxLines={1} lineHeight={12} fontSize={12} fontWeight="600" fill="#0f172a" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
          </g>
        );
      })}

      <WrappedText x={430} y={504} text={model.divideSummaryLine} maxChars={86} maxLines={2} lineHeight={14} fontSize={12.5} fontWeight="500" fill="#475569" />
    </>
  );
}

function ConquerBlock({ model, strongFlowMarkerId }: { model: QFTBookFigureModel; strongFlowMarkerId: string }) {
  return (
    <>
      <line x1="750" y1="520" x2="750" y2="548" stroke="#7c3aed" strokeWidth="3" markerEnd={`url(#${strongFlowMarkerId})`} />
      <rect x="390" y="548" width="720" height="252" rx="16" fill="#fdfcff" stroke="#ddd6fe" strokeWidth="1.5" />
      <text x="410" y="576" fontSize="14" fontWeight="700" letterSpacing="0.16em" fill="#7c3aed">3. CONQUER</text>
      <text x="410" y="606" fontSize="22" fontWeight="700" fill="#0f172a">Butterfly merge dari trace nyata menuju FFT final</text>

      <rect x="430" y="624" width="290" height="84" rx="12" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1.2" />
      <text x="448" y="650" fontSize="14" fontWeight="600" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#581c87">W_N^k = exp(-j 2*pi*k/N)</text>
      <text x="448" y="674" fontSize="14" fontWeight="600" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#581c87">X[k] = E[k] + W_N^k O[k]</text>
      <text x="448" y="698" fontSize="14" fontWeight="600" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#581c87">X[k+N/2] = E[k] - W_N^k O[k]</text>

      <rect x="744" y="624" width="326" height="84" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
      <text x="770" y="655" fontSize="16" fontWeight="600" fill="#0f172a">E[k]</text>
      <text x="770" y="690" fontSize="16" fontWeight="600" fill="#0f172a">O[k]</text>
      <line x1="812" y1="650" x2="932" y2="650" stroke="#7c3aed" strokeWidth="3" />
      <line x1="812" y1="685" x2="932" y2="685" stroke="#7c3aed" strokeWidth="3" />
      <line x1="842" y1="685" x2="912" y2="650" stroke="#a855f7" strokeWidth="3" />
      <line x1="842" y1="650" x2="912" y2="685" stroke="#a855f7" strokeWidth="3" />
      <circle cx="952" cy="650" r="14" fill="#faf5ff" stroke="#7c3aed" strokeWidth="3" />
      <circle cx="952" cy="685" r="14" fill="#faf5ff" stroke="#7c3aed" strokeWidth="3" />
      <text x="946" y="656" fontSize="18" fontWeight="700" fill="#581c87">+</text>
      <text x="948" y="691" fontSize="20" fontWeight="700" fill="#581c87">-</text>
      <text x="976" y="655" fontSize="15" fontWeight="600" fill="#0f172a">X[k]</text>
      <text x="976" y="690" fontSize="15" fontWeight="600" fill="#0f172a">X[k+N/2]</text>
      <text x="857" y="669" fontSize="12" fontWeight="700" fill="#7c3aed">W_N^k</text>

      {model.mergeExample && (
        <>
          <rect x="430" y="724" width="640" height="58" rx="12" fill="#ffffff" stroke="#e9d5ff" strokeWidth="1.2" />
          <text x="448" y="746" fontSize="13" fontWeight="700" fill="#7c3aed">Contoh merge nyata untuk pasangan utama k = {model.mergeExample.focusBin} ↔ {model.mergeExample.mirrorBin}</text>
          <WrappedText x={448} y={766} text={`E[${model.mergeExample.focusBin}] = ${model.mergeExample.even}, O[${model.mergeExample.focusBin}] = ${model.mergeExample.odd}, W = ${model.mergeExample.twiddle}, X[${model.mergeExample.focusBin}] = ${model.mergeExample.top}, X[${model.mergeExample.mirrorBin}] = ${model.mergeExample.bottom}`} maxChars={90} maxLines={2} lineHeight={13} fontSize={12.5} fontWeight="600" fill="#0f172a" />
        </>
      )}

      <WrappedText x={430} y={794} text={model.conquerSummaryLine} maxChars={86} maxLines={2} lineHeight={14} fontSize={12.5} fontWeight="500" fill="#475569" />
    </>
  );
}

function SpectrumBars({ model }: { model: QFTBookFigureModel }) {
  const maxMagnitude = Math.max(...model.spectrum.map((point) => point.magnitude), 1);
  const barGap = 3;
  const width = 320;
  const height = 184;
  const x = 1210;
  const y = 320;
  const barWidth = (width - barGap * (model.spectrum.length - 1)) / model.spectrum.length;

  return (
    <>
      {model.spectrum.map((point, index) => {
        const barHeight = Math.max(10, (point.magnitude / maxMagnitude) * (height - 18));
        const barX = x + index * (barWidth + barGap);
        const barY = y + height - barHeight;
        const isDominant = model.dominantBins.includes(point.bin);

        return (
          <g key={`fft-bar-${point.bin}`}>
            <rect x={barX} y={barY} width={barWidth} height={barHeight} rx="4" fill={isDominant ? '#0f8b8d' : '#cbd5e1'} />
            {(isDominant || point.bin === 0 || point.bin === model.spectrum.length - 1) && (
              <text x={barX + barWidth / 2} y={y + height + 16} textAnchor="middle" fontSize="11" fontWeight="700" fill={isDominant ? '#0f766e' : '#94a3b8'}>{point.bin}</text>
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
      <line x1="1112" y1="608" x2="1158" y2="608" stroke="#94a3b8" strokeWidth="3" markerEnd={`url(#${flowMarkerId})`} />
      <rect x="1160" y="160" width="400" height="640" rx="16" fill="#f7fcfc" stroke="#99f6e4" strokeWidth="1.5" />
      <text x="1182" y="188" fontSize="14" fontWeight="700" letterSpacing="0.16em" fill="#0f766e">4. OUTPUT</text>
      <text x="1182" y="218" fontSize="22" fontWeight="700" fill="#0f172a">Pasangan bin dominan dan FFT final</text>
      <WrappedText x={1182} y={244} text={model.outputPreview} maxChars={42} maxLines={2} lineHeight={14} fontSize={12.5} fontWeight="600" fill="#0f172a" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" />
      <WrappedText x={1182} y={278} text={`Mirror pair utama: ${model.mirrorPairLabel}`} maxChars={42} maxLines={2} lineHeight={14} fontSize={13} fontWeight="600" fill="#0f172a" />
      <WrappedText x={1182} y={308} text={`Bin unik setengah spektrum: ${model.uniqueBinLabel}`} maxChars={42} maxLines={2} lineHeight={14} fontSize={13} fontWeight="500" fill="#475569" />

      <rect x="1182" y="334" width="356" height="236" rx="12" fill="#ffffff" stroke="#ccfbf1" strokeWidth="1.2" />
      <line x1="1210" y1="520" x2="1530" y2="520" stroke="#cbd5e1" strokeWidth="2" />
      <SpectrumBars model={model} />
      <text x="1534" y="536" fontSize="12" fontWeight="700" fill="#64748b">k</text>

      <text x="1182" y="604" fontSize="13" fontWeight="600" fill="#475569">Ringkasan pasangan dominan:</text>
      {model.dominantPairLines.map((line, index) => (
        <g key={`dominant-line-${line.label}`}>
          <circle cx="1190" cy={626 + index * 30} r="4" fill="#0f8b8d" />
          <WrappedText x={1202} y={630 + index * 30} text={`${line.label}, ${line.normalizedFrequency}, |X[k]| = ${line.magnitude}`} maxChars={38} maxLines={2} lineHeight={13} fontSize={12.5} fontWeight="600" fill="#0f172a" />
        </g>
      ))}
    </>
  );
}

function FigureFootnote({ model }: { model: QFTBookFigureModel }) {
  return (
    <>
      <line x1="40" y1="850" x2="1560" y2="850" stroke="#e2e8f0" strokeWidth="1.5" />
      <WrappedText x={48} y={878} text={model.footnote} maxChars={150} maxLines={3} lineHeight={16} fontSize={13.5} fontWeight="500" fill="#475569" />
    </>
  );
}

export function QFTBookFigureSvg({ model, mode }: { model: QFTBookFigureModel; mode: FigureMode }) {
  const flowMarkerId = `fft-flow-arrow-${mode}`;
  const strongFlowMarkerId = `fft-flow-arrow-strong-${mode}`;

  return (
    <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="block h-auto w-full" role="img" aria-label={model.title}>
      <defs>
        <marker id={flowMarkerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
        </marker>
        <marker id={strongFlowMarkerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#7c3aed" />
        </marker>
      </defs>
      <FigureHeader model={model} />
      <InputBlock model={model} />
      <DivideBlock model={model} flowMarkerId={flowMarkerId} />
      <ConquerBlock model={model} strongFlowMarkerId={strongFlowMarkerId} />
      <OutputBlock model={model} flowMarkerId={flowMarkerId} />
      <FigureFootnote model={model} />
    </svg>
  );
}
