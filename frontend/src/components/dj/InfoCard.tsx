import { Info } from 'lucide-react';
import { Card } from '../ui/Card';

export function InfoCard() {
  return (
    <Card title="Maklumat Algoritma" icon={Info}>
      <p className="text-xs text-slate-400 leading-relaxed italic">
        "Bagi fungsi f: {"{0,1}"}ⁿ → {"{0,1}"}, Deutsch-Jozsa memerlukan hanya 1 penilaian
        fungsi (Oracle Call), manakala algoritma klasik memerlukan 2ⁿ⁻¹ + 1 penilaian
        dalam kes terburuk."
      </p>
    </Card>
  );
}
