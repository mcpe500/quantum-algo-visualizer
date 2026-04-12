import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Construction, Waves, Zap, GitBranch } from 'lucide-react';

const algorithmInfo: Record<string, { name: string; icon: React.ElementType; desc: string }> = {
  qft: { name: 'Quantum Fourier Transform', icon: Waves, desc: 'Quantum version of discrete Fourier transform' },
  vqe: { name: 'Variational Quantum Eigensolver', icon: Zap, desc: 'Hybrid quantum-classical optimization for ground state energy' },
  qaoa: { name: 'Quantum Approximate Optimization', icon: GitBranch, desc: 'Quantum approach for combinatorial optimization problems' },
};

export default function PlaceholderPage() {
  const { algorithm } = useParams<{ algorithm: string }>();
  const info = algorithmInfo[algorithm || ''];

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>

      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
          <Construction className="w-10 h-10 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {info?.name || algorithm?.toUpperCase()} - Coming Soon
        </h1>
        <p className="text-gray-500 mb-8">{info?.desc}</p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
          <p className="text-sm text-yellow-800 font-medium mb-2">Status: Backend API Not Implemented</p>
          <p className="text-sm text-yellow-700">
            To enable this algorithm, implement the following backend endpoints:
          </p>
          <ul className="mt-2 text-sm text-yellow-700 space-y-1">
            <li>• <code>POST /api/{algorithm}/benchmark</code> - Run classical + quantum comparison</li>
            <li>• <code>GET /api/{algorithm}/cases</code> - List available test cases</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
