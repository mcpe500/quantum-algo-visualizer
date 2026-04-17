import type { ReactNode } from 'react';
import { SURFACE_CLASSES } from '../../constants/ui';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon, children, className = '' }: SectionCardProps) {
  return (
    <div className={`${SURFACE_CLASSES.sectionCard} ${className}`.trim()}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}
