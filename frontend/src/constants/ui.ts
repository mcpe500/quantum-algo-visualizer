export const PAGE_BACKGROUND_CLASS = 'bg-[#FAFAFA]';

export const SURFACE_CLASSES = {
  sectionCard: 'bg-white border-2 border-gray-200 rounded-xl p-6',
  subtleCard: 'bg-gray-50 border border-gray-200 rounded-lg p-4',
  neutralCard: 'bg-white border border-gray-200 rounded-xl p-4',
  insetPanel: 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-4',
} as const;

export const STATE_CLASSES = {
  emptyWrapper: 'text-center py-12',
  emptyText: 'text-gray-400',
  emptyPageWrapper: 'text-center py-20',
  emptyPageText: 'text-gray-500',
  errorBanner: 'mb-6 px-4 py-2 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg',
  loadingBanner: 'mb-6 px-4 py-3 bg-purple-50 border border-purple-200 text-purple-700 text-sm rounded-lg flex items-center gap-2',
} as const;

export const LINK_CLASSES = {
  datasetLink: 'inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 transition-colors',
} as const;

export const UI_MESSAGES = {
  emptyClassic: 'Belum ada data klasik. Klik "Jalankan" dulu.',
  emptyQuantum: 'Belum ada data kuantum. Klik "Jalankan" dulu.',
} as const;
