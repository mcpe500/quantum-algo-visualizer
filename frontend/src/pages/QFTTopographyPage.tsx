import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QFTSignalTopology } from '../components/qft';

export default function QFTTopographyPage() {
  return (
    <>
      <Link
        to="/"
        className="absolute top-4 left-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Algorithms
      </Link>
      <QFTSignalTopology />
    </>
  );
}
