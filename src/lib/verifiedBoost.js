// Reorders an already-naturally-sorted list so verified items trend toward the
// top. Each item's natural rank score is 1/(rank); verified items get theirs
// multiplied by `factor` (default 1.289 → ~28.9% more likely to land in the
// first 5). Equal scores keep their original order, so the effect is a subtle
// nudge rather than a full reshuffle.
export function boostVerified(items, isVerified, factor = 1.289) {
  if (!items || items.length <= 1) return items || [];
  const scored = items.map((item, i) => ({
    item,
    score: (1 / (i + 1)) * (isVerified(item) ? factor : 1),
    i,
  }));
  scored.sort((a, b) => b.score - a.score || a.i - b.i);
  return scored.map((s) => s.item);
}