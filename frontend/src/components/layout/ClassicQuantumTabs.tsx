import { Cpu, BookOpen } from 'lucide-react';

interface ClassicQuantumTabsProps {
  activeTab: 'classic' | 'quantum';
  onChange: (tab: 'classic' | 'quantum') => void;
}

export function ClassicQuantumTabs({ activeTab, onChange }: ClassicQuantumTabsProps) {
  const tabClass = (tab: 'classic' | 'quantum') =>
    activeTab === tab
      ? 'bg-white text-gray-900 shadow-sm'
      : 'text-gray-600 hover:text-gray-900';

  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => onChange('classic')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('classic')}`}
        >
          <BookOpen className="w-4 h-4" />
          Klasik
        </button>
        <button
          onClick={() => onChange('quantum')}
          className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${tabClass('quantum')}`}
        >
          <Cpu className="w-4 h-4" />
          Kuantum
        </button>
      </div>
    </div>
  );
}
