import type { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export function MetricCard({ label, value, variant = 'default' }: MetricCardProps) {
  const variantStyles = {
    default: 'bg-gray-50',
    highlight: 'bg-blue-50 border border-blue-200',
    success: 'bg-green-50 border border-green-200',
    warning: 'bg-amber-50 border border-amber-200',
  };

  const textStyles = {
    default: 'text-gray-900',
    highlight: 'text-blue-900',
    success: 'text-green-900',
    warning: 'text-amber-900',
  };

  const labelStyles = {
    default: 'text-gray-500',
    highlight: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-amber-600',
  };

  return (
    <div className={`p-4 rounded-lg ${variantStyles[variant]}`}>
      <div className={`text-xs uppercase tracking-wide ${labelStyles[variant]}`}>{label}</div>
      <div className={`text-2xl font-mono font-semibold ${textStyles[variant]}`}>{value}</div>
    </div>
  );
}

interface MetricsGridProps {
  children: ReactNode;
  columns?: number;
}

export function MetricsGrid({ children, columns = 4 }: MetricsGridProps) {
  const gridCols = columns === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3';
  
  return (
    <div className={`grid ${gridCols} gap-4 mb-6`}>{children}</div>
  );
}
