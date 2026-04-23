import React from 'react';

interface VQESplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  className?: string;
}

/**
 * VQESplitView - Side-by-side layout for classic/quantum comparison
 * Responsive: stacks on mobile, side-by-side on desktop
 */
export const VQESplitView: React.FC<VQESplitViewProps> = ({
  left,
  right,
  leftWidth = 'lg:w-1/2',
  rightWidth = 'lg:w-1/2',
  className = '',
}) => {
  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
      <div className={`flex-1 ${leftWidth}`}>{left}</div>
      <div className={`flex-1 ${rightWidth}`}>{right}</div>
    </div>
  );
};
