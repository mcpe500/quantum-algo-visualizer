import { sortCaseIds } from './sorting';

export interface CaseLike {
  case_id?: string | null;
}

export function getSortedCaseIds(cases: CaseLike[]) {
  return sortCaseIds(cases.map((item) => item.case_id).filter((id): id is string => Boolean(id)));
}

export function firstCaseId(cases: CaseLike[]) {
  return getSortedCaseIds(cases)[0] ?? '';
}
