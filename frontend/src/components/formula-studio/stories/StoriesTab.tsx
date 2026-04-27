import React, { useEffect, useMemo, useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FormulaDefinition, FormulaStory } from '../types';
import { FORMULA_REGISTRY } from '../registry';
import { FORMULA_STORIES } from './data';
import { FormulaDisplay } from '../shared/FormulaDisplay';
import { useFormulaStudioSync } from '../FormulaStudioContext';

interface StoriesTabProps {
  onSelectFormula?: (formula: FormulaDefinition) => void;
}

export const StoriesTab: React.FC<StoriesTabProps> = ({ onSelectFormula }) => {
  const { highlightRequest } = useFormulaStudioSync();
  const [activeStoryId, setActiveStoryId] = useState<string>(FORMULA_STORIES[0]?.id ?? '');
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const formulaMap = useMemo(
    () => new Map(FORMULA_REGISTRY.map((formula) => [formula.id, formula])),
    []
  );

  const activeStory: FormulaStory | undefined = useMemo(
    () => FORMULA_STORIES.find((story) => story.id === activeStoryId),
    [activeStoryId]
  );

  const steps = activeStory?.steps ?? [];
  const activeStep = steps[stepIndex] ?? null;
  const activeFormula = activeStep ? formulaMap.get(activeStep.formulaId) ?? null : null;


  useEffect(() => {
    if (!highlightRequest || highlightRequest.source !== 'studio') return;

    const storyMatch = FORMULA_STORIES
      .map((story) => ({
        story,
        stepIndex: story.steps.findIndex((step) => step.formulaId === highlightRequest.formulaId),
      }))
      .find((entry) => entry.stepIndex >= 0);

    if (!storyMatch) return;
    setActiveStoryId(storyMatch.story.id);
    setStepIndex(storyMatch.stepIndex);
    setPlaying(false);
  }, [highlightRequest]);

  useEffect(() => {
    if (!playing) return;
    if (!activeStory || stepIndex >= steps.length - 1) {
      setPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, steps.length, activeStory]);

  return (
    <div className="h-full flex bg-slate-900">
      <aside className="w-72 border-r border-slate-800/60 p-3 overflow-y-auto">
        <div className="text-xs uppercase tracking-wider text-slate-500 mb-3">Stories</div>
        <div className="space-y-2">
          {FORMULA_STORIES.map((story) => {
            const active = story.id === activeStoryId;
            return (
              <button
                key={story.id}
                onClick={() => { setActiveStoryId(story.id); setStepIndex(0); setPlaying(false); }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  active
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="text-sm font-medium">{story.title}</div>
                <div className="text-xs mt-1 opacity-80">{story.steps.length} steps</div>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {!activeStory || !activeStep ? (
          <div className="h-full flex items-center justify-center text-slate-500">No story available.</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">{activeStory.title}</h3>
                <p className="text-xs text-slate-400 mt-1">Algorithm: {activeStory.algorithm.toUpperCase()}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={stepIndex === 0}
                  className="p-2 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPlaying((prev) => !prev)}
                  className="p-2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300"
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setStepIndex((prev) => Math.min(prev + 1, steps.length - 1))}
                  disabled={stepIndex >= steps.length - 1}
                  className="p-2 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {steps.map((step, idx) => (
                <button
                  key={`${step.formulaId}-${idx}`}
                  type="button"
                  onClick={() => setStepIndex(idx)}
                  className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                    idx === stepIndex
                      ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/70'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-cyan-300">Step {stepIndex + 1}</div>
                  <h4 className="text-base font-semibold text-slate-100 mt-1">{activeStep.title}</h4>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{activeStep.connectingText}</p>
                </div>

                {activeFormula && (
                  <button
                    type="button"
                    onClick={() => onSelectFormula?.(activeFormula)}
                    className="px-3 py-1.5 rounded text-xs bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/25"
                  >
                    Open Detail
                  </button>
                )}
              </div>

              {activeFormula ? (
                <>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 text-center">
                    <FormulaDisplay latex={activeFormula.latex} displayMode fontSize="1.15rem" />
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed">{activeFormula.description}</div>

                  {activeFormula.relatedFormulas.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">Related Formulas</div>
                      <div className="flex flex-wrap gap-2">
                        {activeFormula.relatedFormulas.slice(0, 6).map((rel) => (
                          <span
                            key={`${activeFormula.id}-${rel.targetId}-${rel.type}`}
                            className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
                          >
                            {rel.targetId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-red-300">Formula {activeStep.formulaId} tidak ditemukan di registry.</div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};
