import React, { useState } from 'react';
import { LayoutGrid, FlaskConical, BookOpen } from 'lucide-react';
import { FormulaExplorer } from './explore';
import { StudioCanvas } from './studio';
import { StoriesTab } from './stories';
import { FormulaDetailPanel } from './shared/FormulaDetailPanel';
import type { FormulaDefinition } from './types';
import { FORMULA_REGISTRY } from './registry';

type TabId = 'explore' | 'studio' | 'stories';

const tabs: { id: TabId; label: string; icon: React.ComponentType<{className?: string}> }[] = [
  { id: 'explore', label: 'Explore', icon: LayoutGrid },
  { id: 'studio', label: 'Studio', icon: FlaskConical },
  { id: 'stories', label: 'Stories', icon: BookOpen },
];

const FormulaStudioPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('explore');
  const [selectedFormula, setSelectedFormula] = useState<FormulaDefinition | null>(null);

  const handleSelectFormula = (formula: FormulaDefinition) => {
    setSelectedFormula(formula);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return (
          <div className="flex h-full gap-0">
            <div className="w-[60%] border-r border-slate-800/50">
              <FormulaExplorer
                onSelectFormula={handleSelectFormula}
                selectedFormula={selectedFormula}
              />
            </div>
            <div className="w-[40%]">
              <FormulaDetailPanel
                formula={selectedFormula}
                onClose={() => setSelectedFormula(null)}
                onNavigate={(id) => {
                  const formula = FORMULA_REGISTRY.find((f) => f.id === id);
                  if (formula) setSelectedFormula(formula);
                }}
              />
            </div>
          </div>
        );
      case 'studio':
        return <StudioCanvas />;
      case 'stories':
        return (
          <StoriesTab
            onSelectFormula={(formula) => {
              setSelectedFormula(formula);
              setActiveTab('explore');
            }}
          />
        );
      default:
        return null;
    }
  };

  const isStudio = activeTab === 'studio';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className={isStudio ? '' : 'max-w-[1600px] mx-auto'}>
        <header className="border-b border-slate-800/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-100">Formula Studio</h1>
            </div>

            <nav className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        isActive
                          ? 'bg-blue-500/20 text-white border border-blue-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {isStudio ? (
          <main className="h-[calc(100vh-72px)]">
            {renderContent()}
          </main>
        ) : (
          <main className="p-6">
            <div className="bg-slate-800/30 border border-slate-800/50 rounded-xl overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
              {renderContent()}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default FormulaStudioPage;
