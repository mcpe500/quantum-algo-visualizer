export const PAGE_BACKGROUND_CLASS = 'bg-[#FAFAFA]';

export const SURFACE_CLASSES = {
  sectionCard: 'bg-white border-2 border-gray-200 rounded-xl p-6',
  subtleCard: 'bg-gray-50 border border-gray-200 rounded-lg p-4',
  neutralCard: 'bg-white border border-gray-200 rounded-xl p-4',
  insetPanel: 'rounded-xl border border-slate-200 bg-slate-50 px-4 py-4',
  metricCard: 'bg-white border border-gray-200 rounded-lg p-4',
  highlightCard: 'bg-purple-50 border border-purple-200 rounded-lg p-4',
  successCard: 'bg-emerald-50 border border-emerald-200 rounded-lg p-4',
  warningCard: 'bg-amber-50 border border-amber-200 rounded-lg p-4',
  errorCard: 'bg-red-50 border border-red-200 rounded-lg p-4',
} as const;

export const TYPOGRAPHY_CLASSES = {
  h1: 'text-2xl font-semibold text-gray-900',
  h2: 'text-xl font-semibold text-gray-900',
  sectionTitle: 'text-lg font-semibold text-slate-800',
  cardTitle: 'text-base font-medium text-slate-700',
  metricValue: 'text-2xl font-bold text-slate-900',
  metricLabel: 'text-sm text-slate-500',
  caption: 'text-xs text-slate-400',
  tiny: 'text-[10px] uppercase tracking-wider text-slate-400',
  small: 'text-xs text-slate-500',
  body: 'text-sm text-gray-700',
  muted: 'text-gray-500',
} as const;

export const BUTTON_CLASSES = {
  primary: 'px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-all',
  danger: 'px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all',
  ghost: 'px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-all',
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
  backLink: 'inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors',
} as const;

export const SPACING_CLASSES = {
  sectionGap: 'mb-6',
  cardGap: 'gap-4',
  innerPadding: 'p-6',
  compactPadding: 'p-4',
  pagePadding: 'p-4 md:p-8',
} as const;

export const UI_MESSAGES = {
  emptyClassic: 'Belum ada data klasik. Klik "Jalankan" dulu.',
  emptyQuantum: 'Belum ada data kuantum. Klik "Jalankan" dulu.',
  emptyDefault: 'Pilih kasus dan klik "Jalankan" untuk memulai.',
} as const;
