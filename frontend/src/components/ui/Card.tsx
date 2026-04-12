import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface CardProps {
  children: ReactNode;
  title: string;
  icon?: LucideIcon;
  className?: string;
}

export function Card({ children, title, icon: Icon, className = '' }: CardProps) {
  return (
    <div className={`bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="w-5 h-5 text-cyan-400" />}
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </div>
  );
}
