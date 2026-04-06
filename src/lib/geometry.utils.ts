// 🔥 cari titik terdekat di segment
export function getClosestPointOnSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number],
): [number, number] {
  const atob = [b[0] - a[0], b[1] - a[1]];
  const atop = [p[0] - a[0], p[1] - a[1]];

  const len = atob[0] * atob[0] + atob[1] * atob[1];
  const dot = atop[0] * atob[0] + atop[1] * atob[1];
  const t = Math.min(1, Math.max(0, dot / len));

  return [a[0] + atob[0] * t, a[1] + atob[1] * t];
}
