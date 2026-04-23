import React from 'react';
import { VQE_SPACING, VQE_LAYOUT, VQE_COLORS, VQE_DIMENSIONS } from './constants';

interface VQECardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'error';
}

/**
 * VQECard - Standardized card component with consistent padding and styling
 * @param compact - Use p-4 instead of p-6
 * @param variant - Color variant for status indication
 */
export const VQECard: React.FC<VQECardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  compact = false,
  variant = 'default',
}) => {
  const padding = compact ? VQE_SPACING.compactPadding : VQE_SPACING.innerPadding;
  
  const variantClasses = {
    default: `${VQE_COLORS.bg} border-2 ${VQE_COLORS.border}`,
    success: VQE_COLORS.success,
    warning: VQE_COLORS.warning,
    info: VQE_COLORS.info,
    error: VQE_COLORS.error,
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${VQE_DIMENSIONS.cardRadius}
        ${padding}
        ${VQE_LAYOUT.cardShadow}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h4 className="text-base font-medium text-slate-700">{title}</h4>}
          {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
