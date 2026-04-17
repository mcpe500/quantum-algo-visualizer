import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PAGE_BACKGROUND_CLASS } from '../../constants/ui';

interface AlgorithmPageLayoutProps {
  children: ReactNode;
}

export function AlgorithmPageLayout({ children }: AlgorithmPageLayoutProps) {
  return (
    <div className={`min-h-screen ${PAGE_BACKGROUND_CLASS} p-4 md:p-8`}>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
