import React from 'react';

import { SCENARIOS } from './constants';

interface ScenarioPresetsProps {
  onLoadScenario: (scenarioIndex: number) => void;
}

export const ScenarioPresets: React.FC<ScenarioPresetsProps> = ({
  onLoadScenario,
}) => {
  return (
    <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
      <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-3">
        Educational Scenarios
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SCENARIOS.map((scenario, index) => (
          <button
            key={index}
            onClick={() => onLoadScenario(index)}
            className="group min-h-[72px] flex flex-col justify-between p-3 bg-white hover:bg-amber-100 rounded-lg border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all text-left"
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 mt-0.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-gray-800 group-hover:text-amber-700 text-sm leading-tight">
                  {scenario.name}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                  {scenario.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScenarioPresets;
