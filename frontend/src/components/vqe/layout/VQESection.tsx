import React from 'react';
import { VQE_SPACING, VQE_LAYOUT } from './constants';

interface VQESectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  noPadding?: boolean;
}

/**
 * VQESection - Standardized section container
 * Provides consistent spacing and optional title
 */
export const VQESection: React.FC<VQESectionProps> = ({
  children,
  title,
  className = '',
  noPadding = false,
}) => {
  return (
    <section className={`${VQE_SPACING.sectionGap} ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      )}
      <div className={noPadding ? '' : VQE_LAYOUT.sectionPadding}>
        {children}
      </div>
    </section>
  );
};
