// Helpers for scrubbable, keyframe-interpolated visualizations.

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Interpolates an opacity between two keyframes without double exposure:
 * anything fading out is gone by the midpoint, anything fading in only starts
 * after it. Mid-scrub, outgoing and incoming labels never share the screen.
 */
export function fadeLerp(a: number, b: number, t: number) {
  if (b < a) return lerp(a, b, smoothstep(0, 0.5, t));
  if (b > a) return lerp(a, b, smoothstep(0.5, 1, t));
  return a;
}

/** Rounds trig-derived SVG coordinates so server and client render identically. */
export function q(n: number) {
  return Math.round(n * 100) / 100;
}
