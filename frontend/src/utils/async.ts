export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function fetchNullable<T>(fetcher: () => Promise<T>): Promise<T | null> {
  try {
    return await fetcher();
  } catch {
    return null;
  }
}
