import type { StatusColor } from './types';

export const statusStyleMap: Record<StatusColor, { card: string; badge: string }> = {
  slate: {
    card: 'border-slate-200 bg-slate-50',
    badge: 'bg-slate-700 text-white',
  },
  emerald: {
    card: 'border-emerald-200 bg-emerald-50',
    badge: 'bg-emerald-500 text-white',
  },
  yellow: {
    card: 'border-yellow-200 bg-yellow-50',
    badge: 'bg-yellow-500 text-white',
  },
  red: {
    card: 'border-red-200 bg-red-50',
    badge: 'bg-red-500 text-white',
  },
};
