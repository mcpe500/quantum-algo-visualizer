import { useEffect, useState, type ReactNode } from "react";
import { Camera, Atom, ArrowRight, Layers } from "lucide-react";
import { vqeApi } from "../../services/api";
import type { VQECase } from "../../types/vqe";
import { sortCaseIds } from "../../utils/sorting";
import { downloadElementAsPNG } from "../../utils/download";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function orbitalLabel(qubit: number): string {
  const labels = ["σg↑", "σu↑", "σg↓", "σu↓"];
  return labels[qubit] ?? `Q${qubit}`;
}

function getOperatorColor(op: string): string {
  switch (op) {
    case "I":
      return "bg-slate-100 text-slate-600 border-slate-200";
    case "Z":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "X":
      return "bg-red-100 text-red-700 border-red-200";
    case "Y":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RawPanel({ distance }: { distance: number }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center shadow-sm">
          <span className="text-2xl font-black text-red-600">H</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-32 h-1 bg-slate-300 rounded-full" />
          <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            d = {distance} Å
          </span>
        </div>
        <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center shadow-sm">
          <span className="text-2xl font-black text-blue-600">H</span>
        </div>
      </div>
      <div className="mt-6 flex gap-2">
        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
          H₂
        </span>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
          STO-3G
        </span>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
          R = {distance} Å
        </span>
        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
          charge 0
        </span>
      </div>
    </div>
  );
}

function TransformPanel({ data }: { data: VQECase }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex items-center gap-4">
        {Array.from({ length: data.qubits }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
              <span className="text-lg font-black text-slate-700">Q{i}</span>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {orbitalLabel(i)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6 w-full max-w-md relative">
        <div className="h-1 bg-slate-200 rounded-full" />
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-2">
          {Array.from({ length: data.qubits }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"
            />
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-400">
        Jordan-Wigner mapping: {data.qubits} spin orbitals → {data.qubits} qubits
      </p>
      <div className="mt-4 flex gap-2">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
          {data.ansatz.type}
        </span>
        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200">
          {data.ansatz.n_layers} layer(s)
        </span>
      </div>
    </div>
  );
}

function HamiltonianPanel({ data }: { data: VQECase }) {
  const terms = Object.entries(data.hamiltonian.terms).sort(
    ([, a], [, b]) => Math.abs(b) - Math.abs(a)
  );

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {terms.map(([pauli, coeff]) => (
            <div
              key={pauli}
              className="bg-white border border-slate-200 rounded-xl px-3 py-3 flex flex-col items-center gap-1 shadow-sm"
            >
              <div className="flex gap-0.5">
                {pauli.split("").map((op, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex w-6 h-6 items-center justify-center rounded text-xs font-black border ${getOperatorColor(op)}`}
                  >
                    {op}
                  </span>
                ))}
              </div>
              <span
                className={`text-sm font-mono font-bold ${
                  coeff < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {coeff >= 0 ? "+" : ""}
                {coeff.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-300" />I
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" />Z
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />X
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />Y
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

type PanelId = "raw" | "transform" | "hamiltonian";

interface DatasetCardProps {
  data: VQECase;
  index: number;
  mounted: boolean;
}

function DatasetCard({ data, index, mounted }: DatasetCardProps) {
  const [activePanel, setActivePanel] = useState<PanelId>("raw");
  const [isCapturing, setIsCapturing] = useState(false);

  const handleTakePicture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      await downloadElementAsPNG(
        `vqe-dataset-${data.case_id}`,
        `vqe-dataset-${data.case_id}.png`
      );
    } finally {
      window.setTimeout(() => setIsCapturing(false), 10_000);
    }
  };

  const panels: { id: PanelId; label: string; icon: ReactNode }[] = [
    { id: "raw", label: "Raw", icon: <Atom className="w-4 h-4" /> },
    { id: "transform", label: "Transform", icon: <ArrowRight className="w-4 h-4" /> },
    { id: "hamiltonian", label: "Hamiltonian", icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div
      id={`vqe-dataset-${data.case_id}`}
      data-capture-root
      className={`bg-white rounded-3xl border border-slate-200 overflow-hidden transform transition-all duration-700 ease-out hover:shadow-[0_16px_50px_rgb(0,0,0,0.08)] ${
        mounted ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="inline-grid h-10 place-items-center rounded-xl bg-blue-500 text-white border border-blue-500 px-5 text-center font-bold leading-none tabular-nums text-lg">
            <span className="block translate-y-[-0.02em] whitespace-nowrap">
              {data.case_id}
            </span>
          </div>
          <div className="inline-grid h-10 place-items-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 px-4 text-center font-bold leading-none tabular-nums text-sm uppercase tracking-widest">
            <span className="block translate-y-[-0.02em] whitespace-nowrap">
              {data.qubits} Qubit
            </span>
          </div>
          <div className="inline-grid h-10 place-items-center rounded-xl bg-purple-100 text-purple-700 border border-purple-200 px-4 text-center font-bold leading-none tabular-nums text-sm">
            <span className="block translate-y-[-0.02em] whitespace-nowrap">
              {data.ansatz.type}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleTakePicture()}
            disabled={isCapturing}
            data-html2canvas-ignore
            className={`p-2 rounded-lg border border-gray-200 text-gray-500 transition-all ${
              isCapturing ? "cursor-wait opacity-40" : "hover:bg-gray-50"
            }`}
            title="Take Picture"
            aria-label={`Take picture ${data.case_id}`}
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
        <div className="flex h-10 items-center gap-4 text-sm font-bold text-slate-400 leading-none tabular-nums">
          <span className="inline-flex h-full items-center">
            {Object.keys(data.hamiltonian.terms).length} terms
          </span>
        </div>
      </div>

      {/* Panel Tabs */}
      <div className="px-6 sm:px-8 pt-4">
        <div className="inline-flex bg-slate-100 p-1 rounded-xl">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => setActivePanel(panel.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                activePanel === panel.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {panel.icon}
              {panel.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel Content */}
      <div className="px-6 sm:px-8 pb-8 pt-4">
        {activePanel === "raw" && <RawPanel distance={0.735} />}
        {activePanel === "transform" && <TransformPanel data={data} />}
        {activePanel === "hamiltonian" && <HamiltonianPanel data={data} />}
      </div>

      {/* Footer */}
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
        <span className="inline-flex min-h-6 items-center text-sm font-medium text-slate-500 leading-none text-center">
          {data.description}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Visualizer
// ---------------------------------------------------------------------------

export function VQEDatasetVisualizer() {
  const [mounted, setMounted] = useState(false);
  const [cases, setCases] = useState<VQECase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawList = await vqeApi.getCases();
        const sortedIds = sortCaseIds(rawList.map((item) => item.case_id));
        const canonicalCases: VQECase[] = [];
        for (const caseId of sortedIds) {
          const canonical = await vqeApi.getDataset(caseId);
          canonicalCases.push(canonical);
        }
        setCases(canonicalCases);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat dataset VQE");
      } finally {
        setLoading(false);
      }
    };

    void loadCases();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Memuat dataset VQE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl border border-red-200 p-8 max-w-md">
          <p className="text-red-500 font-bold mb-2">Error</p>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!cases.length) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans flex items-center justify-center">
        <p className="text-slate-500">Tidak ada dataset VQE ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 md:p-16 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {cases.map((data, index) => (
          <DatasetCard key={data.case_id} data={data} index={index} mounted={mounted} />
        ))}
      </div>
    </div>
  );
}

export default VQEDatasetVisualizer;
