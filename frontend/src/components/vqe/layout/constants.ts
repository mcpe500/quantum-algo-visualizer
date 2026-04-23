/**
 * VQE Layout Constants
 * Standardized spacing, sizing, and grid tokens for consistent VQE component layout
 */

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const VQE_SPACING = {
  /** Section gap - between major sections */
  sectionGap: 'mb-6',
  /** Card gap - between cards in grids */
  cardGap: 'gap-4',
  /** Inner padding - inside cards/sections */
  innerPadding: 'p-6',
  /** Compact padding - for smaller elements */
  compactPadding: 'p-4',
} as const;

// ============================================================================
// GRID CONFIGURATIONS
// ============================================================================

export const VQE_GRID = {
  /** Metrics grid: 4 columns on desktop, 2 on mobile */
  metrics: 'grid-cols-2 md:grid-cols-4',
  /** Comparison grid: 2 columns on desktop, 1 on mobile */
  comparison: 'grid-cols-1 md:grid-cols-2',
  /** Energy grid: 3 columns on desktop, 1 on mobile */
  energy: 'grid-cols-1 md:grid-cols-3',
  /** Timeline grid: 5 columns for checkpoints */
  timeline: 'grid-cols-5',
} as const;

// ============================================================================
// DIMENSION TOKENS (replacing hardcoded values)
// ============================================================================

export const VQE_DIMENSIONS = {
  /** Card border radius */
  cardRadius: 'rounded-xl',
  /** Small card border radius */
  smallRadius: 'rounded-lg',
  /** Timeline checkpoint min-width */
  timelineMinWidth: 80, // px - was min-w-[80px]
  timelineMinWidthMd: 100, // px - was min-w-[100px]
  /** Step flow diagram min-height */
  stepFlowMinHeight: 280, // px - was minHeight: 280
  /** Step flow node width */
  stepFlowNodeWidth: 110, // px - was w-[110px]
  /** Step flow connector padding */
  stepFlowConnectorPadding: 105, // px - was pr-[105px]/pl-[105px]
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const VQE_TYPOGRAPHY = {
  /** Section title */
  sectionTitle: 'text-lg font-semibold text-slate-800',
  /** Card title */
  cardTitle: 'text-base font-medium text-slate-700',
  /** Metric value */
  metricValue: 'text-2xl font-bold text-slate-900',
  /** Metric label */
  metricLabel: 'text-sm text-slate-500',
  /** Caption/small text */
  caption: 'text-xs text-slate-400',
  /** Tiny label (replacing text-[10px], text-[11px]) */
  tiny: 'text-[10px] uppercase tracking-wider text-slate-400',
  /** Small label */
  small: 'text-xs text-slate-500',
} as const;

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const VQE_COLORS = {
  /** Primary background */
  bg: 'bg-white',
  /** Secondary background */
  bgSecondary: 'bg-slate-50',
  /** Border color */
  border: 'border-slate-200',
  /** Primary text */
  text: 'text-slate-800',
  /** Secondary text */
  textSecondary: 'text-slate-500',
  /** Accent colors by state */
  success: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  error: 'text-red-600 bg-red-50 border-red-200',
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const VQE_LAYOUT = {
  /** Container max-width (align with FormulaStudio: max-w-[1600px]) */
  maxWidth: 'max-w-[1400px]',
  /** Content max-width (for tighter layouts) */
  contentMaxWidth: 'max-w-6xl',
  /** Page padding */
  pagePadding: 'p-4 md:p-8',
  /** Section padding */
  sectionPadding: 'p-6',
  /** Card shadow */
  cardShadow: 'shadow-sm',
  /** Hover shadow */
  hoverShadow: 'hover:shadow-md',
} as const;

// ============================================================================
// RESPONSIVE BREAKPOINTS (for JS logic)
// ============================================================================

export const VQE_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;
