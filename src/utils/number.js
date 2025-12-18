export function formatNumber(n) {
  if (!Number.isFinite(n)) return '';
  return n.toFixed(2);
}
