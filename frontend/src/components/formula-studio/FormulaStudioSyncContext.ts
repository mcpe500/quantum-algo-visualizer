import { createContext, useContext } from 'react';

export type FormulaStudioSyncSource = 'explore' | 'studio' | 'stories';

export interface FormulaHighlightRequest {
  formulaId: string;
  source: FormulaStudioSyncSource;
  nonce: number;
}

export interface FormulaStudioSyncContextValue {
  highlightRequest: FormulaHighlightRequest | null;
  requestFormulaHighlight: (formulaId: string, source: FormulaStudioSyncSource) => void;
  clearFormulaHighlight: () => void;
}

export const FormulaStudioSyncContext = createContext<FormulaStudioSyncContextValue | null>(null);

export function useFormulaStudioSync(): FormulaStudioSyncContextValue {
  const context = useContext(FormulaStudioSyncContext);
  if (!context) {
    throw new Error('useFormulaStudioSync must be used inside FormulaStudioProvider');
  }
  return context;
}
