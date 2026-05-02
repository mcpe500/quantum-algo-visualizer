import { ClassicFlowMobileArrow } from '../../classic-flow';
import { formatNumber, getEdges } from './utils';
import type { Matrix, TraceStep, CutDetail } from './types';

function getNodeCoordinates(n: number) {
  const svgSize = 200;
  const center = svgSize / 2;
  const radius = 70;

  if (n === 1) return [{ x: center, y: center }];

  return Array.from({ length: n }, (_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });
}

export function GraphSvg({ matrix, stateString }: { matrix: Matrix; stateString: string }) {
  const bits = stateString.split('').map(Number);
  const edges = getEdges(matrix);
  const coords = getNodeCoordinates(bits.length);

  return (
    <svg
      viewBox="0 0 200 200"
      className="w-full h-auto max-w-[150px] mx-auto overflow-visible"
      role="img"
      aria-label={`Graf state ${stateString}`}
    >
      {edges.map(({ u, v, weight }) => {
        const isCut = bits[u] !== bits[v];
        const midX = (coords[u].x + coords[v].x) / 2;
        const midY = (coords[u].y + coords[v].y) / 2;

        return (
          <g key={`${u}-${v}`}>
            <line
              x1={coords[u].x}
              y1={coords[u].y}
              x2={coords[v].x}
              y2={coords[v].y}
              className={isCut ? 'qaoa-sa-edge-cut' : 'qaoa-sa-edge-uncut'}
            />
            {weight !== 1 && (
              <text x={midX} y={midY} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="700">
                {formatNumber(weight)}
              </text>
            )}
          </g>
        );
      })}

      {coords.map((point, i) => (
        <g key={i} transform={`translate(${point.x}, ${point.y})`}>
          <circle cx="0" cy="0" r="16" className={bits[i] === 0 ? 'qaoa-sa-node-0' : 'qaoa-sa-node-1'} stroke="white" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fill="white" fontWeight="bold" fontSize="12">
            {i}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function Arrow() {
  return <ClassicFlowMobileArrow className="-my-3" />;
}


export function CutDetails({ details }: { details: CutDetail[] }) {
  return (
    <div className="text-[11px] text-slate-500 bg-white border border-slate-200 p-2 rounded mt-2 leading-relaxed">
      {details.length === 0 ? (
        <span>Tidak ada edge.</span>
      ) : (
        details.map((item, index) => (
          <div key={`${item.u}-${item.v}`}>
            e({item.u},{item.v}): {item.isCut ? 'berbeda' : 'sama'} -&gt; {formatNumber(item.contribution)}
            {index < details.length - 1 ? ';' : ''}
          </div>
        ))
      )}
    </div>
  );
}

export function ProbabilityLogic({ data }: { data: TraceStep }) {
  if (data.deltaCut >= 0) {
    return (
      <div className="p-2 bg-emerald-100/50 rounded border border-emerald-200 text-emerald-800 text-sm mt-3">
        Karena <span className="font-mono font-bold text-emerald-900">Delta C &gt;= 0</span>, solusi baru <strong>DITERIMA</strong> tanpa hitung probabilitas.
      </div>
    );
  }

  const acceptedByProbability = data.accepted;
  const boxClass = acceptedByProbability
    ? 'mt-2 p-2 bg-yellow-100 text-yellow-800 rounded font-semibold text-xs border border-yellow-200'
    : 'mt-2 p-2 bg-red-100 text-red-800 rounded font-semibold text-xs border border-red-200';

  return (
    <div className="p-3 bg-white rounded border border-slate-200 space-y-2 text-sm shadow-sm mt-3">
      <p className="text-xs text-gray-500 uppercase font-bold mb-1">Peluang Acceptance</p>
      <div className="font-mono text-gray-700 flex flex-col gap-1 text-xs">
        <span>P_accept = e^(Delta C/T)</span>
        <span>
          P_accept = e^({formatNumber(data.deltaCut)} / {formatNumber(data.temperature, 4)}) = <span className="font-bold text-indigo-600">{formatNumber(data.probability, 4)}</span>
        </span>
        <span>
          Random r = <span className="font-bold text-indigo-600">{formatNumber(data.randomValue, 4)}</span>
        </span>
      </div>
      <div className={boxClass}>
        {acceptedByProbability ? (
          <>
            {formatNumber(data.randomValue, 4)} &lt; {formatNumber(data.probability, 4)} -&gt; TETAP DITERIMA! Mencegah jebakan lokal.
          </>
        ) : (
          <>
            {formatNumber(data.randomValue, 4)} &gt;= {formatNumber(data.probability, 4)} -&gt; DITOLAK. Kembali ke state lama.
          </>
        )}
      </div>
    </div>
  );
}
