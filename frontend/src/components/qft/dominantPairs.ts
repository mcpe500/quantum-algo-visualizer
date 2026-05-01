export interface DominantMirrorPair {
  canonicalBin: number;
  mirrorBin: number;
  magnitude: number;
  normalizedFrequency: number;
  label: string;
}

function sortByMagnitudeThenBin(a: DominantMirrorPair, b: DominantMirrorPair): number {
  if (b.magnitude !== a.magnitude) {
    return b.magnitude - a.magnitude;
  }
  return a.canonicalBin - b.canonicalBin;
}

export function buildDominantMirrorPairs(
  dominantBins: number[],
  dominantMagnitudes: number[],
  nPoints: number
): DominantMirrorPair[] {
  const pairs = new Map<number, DominantMirrorPair>();

  dominantBins.forEach((bin, index) => {
    if (bin < 0 || bin >= nPoints) return;

    const canonicalBin = bin === 0 ? 0 : Math.min(bin, nPoints - bin);
    const mirrorBin = canonicalBin === 0 ? 0 : nPoints - canonicalBin;
    const magnitude = dominantMagnitudes[index] ?? 0;
    const current = pairs.get(canonicalBin);

    if (!current || magnitude > current.magnitude) {
      pairs.set(canonicalBin, {
        canonicalBin,
        mirrorBin,
        magnitude,
        normalizedFrequency: canonicalBin / nPoints,
        label: canonicalBin === mirrorBin ? `Bin ${canonicalBin}` : `Bin ${canonicalBin} ↔ Bin ${mirrorBin}`,
      });
    }
  });

  return Array.from(pairs.values()).sort(sortByMagnitudeThenBin);
}
