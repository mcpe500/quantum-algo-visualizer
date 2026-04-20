export function DetailCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{hint}</p>
    </div>
  );
}