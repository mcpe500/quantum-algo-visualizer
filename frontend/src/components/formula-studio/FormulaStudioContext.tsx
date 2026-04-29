import React, { useCallback, useMemo, useState } from 'react';
import { FormulaStudioSyncContext, type FormulaHighlightRequest, type FormulaStudioSyncSource } from './FormulaStudioSyncContext';

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
