interface ReadingGuideCardProps {
  title?: string;
  headline: string;
  explanation: string;
  comment?: string;
  notes?: string[];
}

export function ReadingGuideCard({
  title = 'Cara Baca Animasi',
  headline,
  explanation,
  comment,
  notes,
}: ReadingGuideCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{title}</h3>
      <h4 className="mt-1.5 text-[14px] font-semibold text-slate-900">{headline}</h4>
      {comment && (
        <p className="mt-1 text-[11px] font-medium text-indigo-600">{comment}</p>
      )}
      <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">{explanation}</p>
      {notes && notes.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {notes.map((note, i) => (
            <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 leading-relaxed">
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
