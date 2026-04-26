import { useEffect, useMemo, useState } from "react";
import { Camera } from "lucide-react";
import { vqeApi } from "../../services/api";
import type { VQECase } from "../../types/vqe";
import { sortCaseIds } from "../../utils/sorting";
import { downloadElementAsPNG } from "../../utils/download";

type Term = {
  pauli: string;
  coeff: number;
};

type HamiltonianSummary = {
  terms: Term[];
  maxAbs: number;
  zOnly: number;
  xyMixed: number;
};

const PAULI_CLASS: Record<string, string> = {
  I: "bg-slate-100 text-slate-500",
  Z: "bg-sky-100 text-sky-500",
  X: "bg-rose-100 text-rose-500",
  Y: "bg-emerald-100 text-emerald-500",
};

function formatNumber(value: number | undefined, digits = 3): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return value.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
}

function summarizeHamiltonian(data: VQECase): HamiltonianSummary {
  const terms = Object.entries(data.hamiltonian.terms)
    .map(([pauli, coeff]) => ({ pauli, coeff }))
    .sort((a, b) => Math.abs(b.coeff) - Math.abs(a.coeff));
  const xyMixed = terms.filter((term) => /[XY]/.test(term.pauli)).length;

  return {
    terms,
    maxAbs: Math.max(...terms.map((term) => Math.abs(term.coeff)), 1),
    zOnly: terms.length - xyMixed,
    xyMixed,
  };
}

function transformLabel(data: VQECase): string {
  if (data.transform?.source === "verified_2q_coefficients") return "verified 2q";
  if (data.transform?.source === "jordan_wigner_mapping") return "Jordan-Wigner";
  return data.qubits === 2 ? "verified 2q" : "Jordan-Wigner";
}

function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "dark" | "sky" | "violet" | "amber" | "green" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    dark: "bg-slate-950 text-white",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-black ${tones[tone]}`}>
      {children}
    </span>
  );
}

function Arrow() {
  return (
    <div className="flex w-10 shrink-0 items-center justify-center">
      <span className="text-2xl font-light leading-none text-slate-900">→</span>
    </div>
  );
}

function RawVisual({ data }: { data: VQECase }) {
  const molecule = data.raw_spec?.molecule_spec ?? {};
  const formula = molecule.formula ?? data.molecule;
  const distance = molecule.interatomic_distance_angstrom ?? 0.735;
  const basis = molecule.basis ?? "sto-3g";

  return (
    <div className="relative flex h-[250px] w-[245px] shrink-0 flex-col items-center rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="absolute left-4 top-4 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
        RAW
      </div>

      <div className="relative mb-6 mt-14 flex w-full items-center justify-center">
        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-red-100 bg-red-50">
          <span className="text-xl font-black text-red-500">H</span>
        </div>
        <div className="-mx-1 flex h-[2px] w-14 items-center justify-center bg-slate-200">
          <div className="absolute top-16 whitespace-nowrap rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[9px] font-black text-slate-500 shadow-sm">
            {formatNumber(distance)} A
          </div>
        </div>
        <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-100 bg-sky-50">
          <span className="text-xl font-black text-sky-500">H</span>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <Pill tone="dark">{formula}</Pill>
        <Pill>{basis}</Pill>
      </div>
    </div>
  );
}

function TransformVisual({ data }: { data: VQECase }) {
  const targetQubits = data.raw_spec?.preprocessing?.target_qubits ?? data.qubits;

  return (
    <div className="relative flex h-[250px] w-[245px] shrink-0 flex-col items-center rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="absolute left-4 top-4 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
        TRANSFORM
      </div>

      <div className="relative mb-4 mt-11 flex h-[64px] w-[86px] items-center justify-center rounded-2xl border border-[#f3eefe] bg-[#f8f5ff]">
        <div className="absolute h-[3px] w-[52px] rounded-full bg-[#e9d5ff]" />
        <div className="absolute h-[42px] w-[3px] rounded-full bg-[#e9d5ff]" />
        <div className="relative z-10 grid grid-cols-2 gap-x-[18px] gap-y-[10px]">
          <div className="h-3 w-3 rounded-full bg-[#38bdf8]" />
          <div className="h-3 w-3 rounded-full bg-[#fb7185]" />
          <div className="h-3 w-3 rounded-full bg-[#34d399]" />
          <div className="h-3 w-3 rounded-full bg-[#fbbf24]" />
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <span className="inline-flex h-8 items-center rounded-full bg-[#f3e8ff] px-4 text-[13px] font-black text-[#7c3aed]">
          {transformLabel(data)}
        </span>
        <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-[13px] font-black text-slate-600">
          {targetQubits}q
        </span>
      </div>

      <div className="mt-auto flex w-full flex-col gap-2">
        {Array.from({ length: targetQubits }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-[14px] text-[10px] font-black text-slate-400">q{index}</span>
            <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-sky-300 via-violet-300 to-emerald-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

function HamiltonianVisual({ summary }: { summary: HamiltonianSummary }) {
  return (
    <div className="relative flex h-[270px] w-[520px] shrink-0 flex-col rounded-[20px] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="absolute left-4 top-4 rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
        HAMILTONIAN
      </div>

      <div className="mb-2 mt-9 flex items-center justify-between">
        <div className="font-mono text-[11px] font-black text-slate-800">H = Σ cP</div>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-black text-amber-600">
            {summary.terms.length} terms
          </span>
          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-black text-sky-500">
            {summary.zOnly} Z
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-500">
            {summary.xyMixed} X/Y
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5">
        {summary.terms.map((term) => {
          const width = Math.max(5, (Math.abs(term.coeff) / summary.maxAbs) * 100);
          return (
            <div key={term.pauli} className="rounded-lg bg-slate-50 px-1.5 py-[2px]">
              <div className="mb-0.5 flex gap-0.5">
                {term.pauli.split("").map((op, index) => (
                  <span
                    key={`${term.pauli}-${index}`}
                    className={`grid h-3 w-3 place-items-center rounded text-[7px] font-black ${PAULI_CLASS[op] ?? PAULI_CLASS.I}`}
                  >
                    {op}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-9 text-right font-mono text-[8px] font-black leading-none ${term.coeff < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                  {term.coeff > 0 ? "+" : ""}
                  {term.coeff.toFixed(2)}
                </span>
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatasetCard({ data }: { data: VQECase }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const summary = useMemo(() => summarizeHamiltonian(data), [data]);

  const handleTakePicture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      await downloadElementAsPNG(
        `vqe-dataset-${data.case_id}`,
        `vqe-dataset-${data.case_id}.png`,
      );
    } finally {
      window.setTimeout(() => setIsCapturing(false), 10_000);
    }
  };

  return (
    <div
      id={`vqe-dataset-${data.case_id}`}
      data-capture-root
      className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <Pill tone="dark">{data.case_id}</Pill>
          <Pill tone="sky">{data.qubits} qubits</Pill>
          <Pill tone="amber">{summary.terms.length} terms</Pill>
        </div>
        <button
          type="button"
          onClick={() => void handleTakePicture()}
          disabled={isCapturing}
          data-html2canvas-ignore
          className={`flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors ${
            isCapturing ? "cursor-wait opacity-40" : "hover:bg-slate-50"
          }`}
          title="Take Picture"
          aria-label={`Take picture ${data.case_id}`}
        >
          <Camera size={16} strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center justify-center">
        <RawVisual data={data} />
        <Arrow />
        <TransformVisual data={data} />
        <Arrow />
        <HamiltonianVisual summary={summary} />
      </div>
    </div>
  );
}

export function VQEDatasetVisualizer() {
  const [cases, setCases] = useState<VQECase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawList = await vqeApi.getCases();
        const sortedIds = sortCaseIds(rawList.map((item) => item.case_id));
        const loaded: VQECase[] = [];

        for (const caseId of sortedIds) {
          loaded.push(await vqeApi.getDataset(caseId));
        }

        setCases(loaded);
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
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4 font-sans">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fa] p-4 font-sans">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 font-bold text-rose-600">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#f8f9fa] p-4 font-sans md:p-8">
      <div className="mx-auto max-w-[1120px] space-y-8">
        {cases.map((data) => (
          <DatasetCard key={data.case_id} data={data} />
        ))}
      </div>
    </div>
  );
}

export default VQEDatasetVisualizer;
