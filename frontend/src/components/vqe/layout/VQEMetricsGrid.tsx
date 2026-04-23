import React from 'react';
import { VQE_GRID, VQE_SPACING } from './constants';

interface VQEMetricsGridProps {
  children: React.ReactNode;
  columns?: 'metrics' | 'comparison' | 'energy' | 'timeline';
  className?: string;
}

/**
 * VQEMetricsGrid - Standardized grid for metrics/comparison/energy cards
 * @param columns - 'metrics' (4-col), 'comparison' (2-col), 'energy' (3-col), 'timeline' (5-col)
 */
export const VQEMetricsGrid: React.FC<VQEMetricsGridProps> = ({
  children,
  columns = 'metrics',
  className = '',
}) => {
  const gridClasses = {
    metrics: VQE_GRID.metrics,
    comparison: VQE_GRID.comparison,
    energy: VQE_GRID.energy,
    timeline: VQE_GRID.timeline,
  };

  return (
    <div className={`grid ${gridClasses[columns]} ${VQE_SPACING.cardGap} ${className}`}>
      {children}
    </div>
  );
};
