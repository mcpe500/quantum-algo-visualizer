export function sortCaseIds(caseIds: string[]): string[] {
  return [...caseIds].sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}
