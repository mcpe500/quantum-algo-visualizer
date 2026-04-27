import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type FormulaStudioSyncSource = 'explore' | 'studio' | 'stories';

export interface FormulaHighlightRequest {
  formulaId: string;
  source: FormulaStudioSyncSource;
  nonce: number;
}

interface FormulaStudioSyncContextValue {
  highlightRequest: FormulaHighlightRequest | null;
  requestFormulaHighlight: (formulaId: string, source: FormulaStudioSyncSource) => void;
  clearFormulaHighlight: () => void;
}

const FormulaStudioSyncContext = createContext<FormulaStudioSyncContextValue | null>(null);

export const FormulaStudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highlightRequest, setHighlightRequest] = useState<FormulaHighlightRequest | null>(null);

  const requestFormulaHighlight = useCallback((formulaId: string, source: FormulaStudioSyncSource) => {
    setHighlightRequest({ formulaId, source, nonce: Date.now() });
  }, []);

  const clearFormulaHighlight = useCallback(() => {
    setHighlightRequest(null);
  }, []);

  const value = useMemo(
    () => ({ highlightRequest, requestFormulaHighlight, clearFormulaHighlight }),
    [clearFormulaHighlight, highlightRequest, requestFormulaHighlight],
  );

  return (
    <FormulaStudioSyncContext.Provider value={value}>
      {children}
    </FormulaStudioSyncContext.Provider>
  );
};

export function useFormulaStudioSync(): FormulaStudioSyncContextValue {
  const context = useContext(FormulaStudioSyncContext);
  if (!context) {
    throw new Error('useFormulaStudioSync must be used inside FormulaStudioProvider');
  }
  return context;
}
