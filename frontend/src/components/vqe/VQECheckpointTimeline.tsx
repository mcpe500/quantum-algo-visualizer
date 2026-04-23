import type { VQEIterationSnapshot } from '../../types/vqe';
import { VQECard, VQE_TYPOGRAPHY, VQE_DIMENSIONS } from './layout';

interface VQECheckpointTimelineProps {
  snapshots: VQEIterationSnapshot[];
  active: number;
  onChange: (index: number) => void;
}

export function VQECheckpointTimeline({ snapshots, active, onChange }: VQECheckpointTimelineProps) {
  if (!snapshots || snapshots.length === 0) return null;

  const labels = ['Start', '25%', '50%', '75%', 'Final'];

  return (
    <VQECard>
      <div className={VQE_TYPOGRAPHY.caption + ' text-center mb-3'}>
        Checkpoint Timeline
      </div>
      <div className="flex justify-center gap-2 md:gap-3 flex-wrap">
        {snapshots.map((snap, idx) => (
          <button
            key={idx}
            onClick={() => onChange(idx)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              active === idx
                ? 'bg-purple-600 text-white shadow-md scale-105'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            style={{ minWidth: `${VQE_DIMENSIONS.timelineMinWidth}px` }}
          >
            <div className="font-semibold">{labels[idx] || `${idx * 25}%`}</div>
            <div className={VQE_TYPOGRAPHY.caption + ' opacity-80'}>Itr {snap.iteration}</div>
            <div className={VQE_TYPOGRAPHY.caption + ' opacity-80'}>E={snap.energy.toFixed(3)}</div>
          </button>
        ))}
      </div>
    </VQECard>
  );
}
