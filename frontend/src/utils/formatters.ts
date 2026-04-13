export function formatEnergy(value: number, decimals = 6): string {
  return `${value.toFixed(decimals)} Ha`;
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatTime(value: number): string {
  return value < 1000 
    ? `${value.toFixed(2)} ms`
    : `${(value / 1000).toFixed(2)} s`;
}

export function formatMetric(value: number | string): string {
  if (typeof value === 'string') return value;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toString();
}
