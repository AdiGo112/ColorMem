/**
 * Scoring engine inspired by Dialed.gg
 * Pipeline: HSL → CIELAB → Delta E (CIE76) → Sigmoid curve → Hue adjustments
 */

// ─── Color Space Conversions ───────────────────────────────────────────────────

/**
 * Convert HSL (h: 0-360, s: 0-100, l: 0-100) to sRGB (0-1)
 */
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [r + m, g + m, b + m];
}

/**
 * sRGB (0-1) → Linear RGB
 */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Linear RGB → CIE XYZ (D65 illuminant)
 */
function rgbToXyz(r, g, b) {
  r = srgbToLinear(r);
  g = srgbToLinear(g);
  b = srgbToLinear(b);

  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

  return [x, y, z];
}

/**
 * CIE XYZ → CIELAB
 */
function xyzToLab(x, y, z) {
  // D65 reference white
  const xn = 0.95047;
  const yn = 1.00000;
  const zn = 1.08883;

  x /= xn;
  y /= yn;
  z /= zn;

  const epsilon = 0.008856;
  const kappa = 903.3;

  const fx = x > epsilon ? Math.cbrt(x) : (kappa * x + 16) / 116;
  const fy = y > epsilon ? Math.cbrt(y) : (kappa * y + 16) / 116;
  const fz = z > epsilon ? Math.cbrt(z) : (kappa * z + 16) / 116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return [L, a, bVal];
}

/**
 * HSL → CIELAB
 */
function hslToLab(h, s, l) {
  const [r, g, b] = hslToRgb(h, s, l);
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// ─── Delta E (CIE76) ──────────────────────────────────────────────────────────

function deltaE76(lab1, lab2) {
  return Math.sqrt(
    Math.pow(lab1[0] - lab2[0], 2) +
    Math.pow(lab1[1] - lab2[1], 2) +
    Math.pow(lab1[2] - lab2[2], 2)
  );
}

// ─── Scoring Pipeline ──────────────────────────────────────────────────────────

/**
 * Sigmoid curve: maps Delta E to 0-10 score
 * Formula: 10 / (1 + (dE / midpoint) ^ steepness)
 */
function sigmoidScore(deltaE, midpoint = 38, steepness = 1.6) {
  if (deltaE <= 0) return 10;
  return 10 / (1 + Math.pow(deltaE / midpoint, steepness));
}

/**
 * Circular hue difference (0-180)
 */
function hueDifference(h1, h2) {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

/**
 * Hue recovery: reward for nailing the hue even if S/L are off
 * Active when hue diff < 25° and colors are vivid enough
 */
function hueRecovery(baseScore, hueDiff, avgSat) {
  if (hueDiff > 25 || avgSat < 30) return 0;

  const hueCloseness = 1 - (hueDiff / 25);
  const satFactor = Math.min(avgSat / 40, 1);
  const room = 10 - baseScore;

  // Recovery is up to 30% of remaining room
  return room * 0.3 * hueCloseness * satFactor;
}

/**
 * Hue penalty: applied when hue is off by >30° on vivid colors
 */
function huePenalty(baseScore, hueDiff, avgSat) {
  if (hueDiff <= 30 || avgSat < 30) return 0;

  const hueError = Math.min((hueDiff - 30) / 150, 1);
  const satFactor = Math.min(avgSat / 30, 1);

  // Penalty scales with error severity and saturation
  return baseScore * 0.25 * hueError * satFactor;
}

/**
 * Calculate final score for a round
 * @param {Object} target - { h: 0-360, s: 0-100, l: 0-100 }
 * @param {Object} guess  - { h: 0-360, s: 0-100, l: 0-100 }
 * @returns {Object} { score, deltaE, baseScore, recovery, penalty }
 */
export function calculateScore(target, guess) {
  // Convert to CIELAB
  const lab1 = hslToLab(target.h, target.s, target.l);
  const lab2 = hslToLab(guess.h, guess.s, guess.l);

  // Measure perceptual distance
  const dE = deltaE76(lab1, lab2);

  // Map to game score via sigmoid
  const baseScore = sigmoidScore(dE);

  // Hue adjustments
  const hueDiff = hueDifference(target.h, guess.h);
  const avgSat = (target.s + guess.s) / 2;

  const recovery = hueRecovery(baseScore, hueDiff, avgSat);
  const penalty = huePenalty(baseScore, hueDiff, avgSat);

  const finalScore = Math.max(0, Math.min(10, baseScore + recovery - penalty));

  return {
    score: Math.round(finalScore * 100) / 100,
    deltaE: Math.round(dE * 100) / 100,
    baseScore: Math.round(baseScore * 100) / 100,
    recovery: Math.round(recovery * 100) / 100,
    penalty: Math.round(penalty * 100) / 100
  };
}

/**
 * Generate a random target color in HSL
 * Avoids extremely desaturated and very dark/light colors
 */
export function generateTargetColor() {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 71) + 25;  // 25-95
  const l = Math.floor(Math.random() * 51) + 25;  // 25-75
  return { h, s, l };
}

/**
 * Format HSL as CSS string
 */
export function hslString(color) {
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
}
