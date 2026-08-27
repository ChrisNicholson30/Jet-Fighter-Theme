/**
 * Jet Fighter — colour engine.
 *
 * Zed themes are `#RRGGBBAA`. Everything here works in 8-bit sRGB with an
 * explicit alpha channel, and every derived colour is produced by one of the
 * documented operations below. That is what makes the palette-provenance
 * check in `scripts/provenance.mjs` possible: the generator physically cannot
 * emit a colour that is not traceable to a locked swatch hex.
 */

/** Parse `#RGB`, `#RRGGBB` or `#RRGGBBAA` into `{r,g,b,a}` with 0-255 channels and 0-1 alpha. */
export function parse(hex) {
  const s = String(hex).trim().replace(/^#/, '');
  let r, g, b, a = 1;
  if (s.length === 3) {
    r = parseInt(s[0] + s[0], 16);
    g = parseInt(s[1] + s[1], 16);
    b = parseInt(s[2] + s[2], 16);
  } else if (s.length === 6 || s.length === 8) {
    r = parseInt(s.slice(0, 2), 16);
    g = parseInt(s.slice(2, 4), 16);
    b = parseInt(s.slice(4, 6), 16);
    if (s.length === 8) a = parseInt(s.slice(6, 8), 16) / 255;
  } else {
    throw new Error(`Not a hex colour: ${hex}`);
  }
  if ([r, g, b].some(Number.isNaN)) throw new Error(`Not a hex colour: ${hex}`);
  return { r, g, b, a };
}

const clamp255 = (n) => Math.min(255, Math.max(0, Math.round(n)));
const hex2 = (n) => clamp255(n).toString(16).padStart(2, '0');

/** Format `{r,g,b,a}` as the eight-digit `#RRGGBBAA` Zed expects. */
export function format({ r, g, b, a = 1 }) {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a * 255)}`;
}

/** Re-emit any hex as eight-digit form, defaulting alpha to opaque. */
export const opaque = (hex) => format({ ...parse(hex), a: 1 });

/**
 * Set the alpha of a colour. `a` is 0-1.
 * Used for overlays that must composite over whatever is beneath them.
 */
export function alpha(hex, a) {
  return format({ ...parse(hex), a });
}

/**
 * Linearly mix two colours in sRGB space. `t` is the weight of `from`.
 * mix(x, y, 1) === x, mix(x, y, 0) === y. Alpha is taken from `from`.
 *
 * sRGB-space mixing (rather than linear-light) is deliberate: it matches how
 * Zed itself composites, so a mixed value and an alpha-composited value of the
 * same ratio land on the same pixel.
 */
export function mix(from, to, t) {
  const f = parse(from);
  const g = parse(to);
  return format({
    r: f.r * t + g.r * (1 - t),
    g: f.g * t + g.g * (1 - t),
    b: f.b * t + g.b * (1 - t),
    a: f.a,
  });
}

/**
 * Composite a colour with alpha over an opaque backdrop, returning the pixel
 * the user actually sees. This is what contrast must be measured against —
 * checking a translucent token against its nominal hex is the single most
 * common way an "accessible" theme is quietly wrong.
 */
export function over(fg, bg) {
  const f = parse(fg);
  const b = parse(bg);
  const a = f.a;
  return format({
    r: f.r * a + b.r * (1 - a),
    g: f.g * a + b.g * (1 - a),
    b: f.b * a + b.b * (1 - a),
    a: 1,
  });
}

const srgbToLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/** WCAG 2.1 relative luminance. Alpha is ignored — composite first with `over`. */
export function luminance(hex) {
  const { r, g, b } = parse(hex);
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

/**
 * WCAG 2.1 contrast ratio between two colours, compositing any alpha in `fg`
 * over `bg` first. `bg` is expected to be opaque.
 */
export function contrast(fg, bg) {
  const f = luminance(over(fg, bg));
  const b = luminance(bg);
  const [hi, lo] = f > b ? [f, b] : [b, f];
  return (hi + 0.05) / (lo + 0.05);
}

/** Pick whichever of `candidates` has the highest contrast against `bg`. */
export function bestOn(bg, candidates) {
  return candidates.reduce((best, c) =>
    contrast(c, bg) > contrast(best, bg) ? c : best,
  );
}

/** Convert to HSL degrees/percent, for the hue-drift table in the README. */
export function hsl(hex) {
  const { r, g, b } = parse(hex);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: s * 100, l: l * 100 };
}

/** Smallest angular distance between two hues, in degrees. */
export function hueDrift(a, b) {
  const d = Math.abs(hsl(a).h - hsl(b).h) % 360;
  return d > 180 ? 360 - d : d;
}

/** HSL (h degrees, s/l percent) back to an opaque `#RRGGBBAA`. */
export function fromHsl({ h, s, l }) {
  const S = s / 100;
  const L = l / 100;
  const c = (1 - Math.abs(2 * L - 1)) * S;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] :
    hp < 2 ? [x, c, 0] :
    hp < 3 ? [0, c, x] :
    hp < 4 ? [0, x, c] :
    hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = L - c / 2;
  return format({ r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255, a: 1 });
}

/**
 * Re-derive a dark-variant hue for a light ground.
 *
 * Holds the source hue angle exactly and walks lightness down until the colour
 * clears `minContrast` against `ground`, keeping the highest (most vivid)
 * lightness that still passes. Saturation is nudged up slightly as lightness
 * falls, because a dark colour at the source saturation reads muddy.
 *
 * This is the brief's stated method — "same hue angles, lightness re-derived" —
 * executed by solver rather than by picking ramp steps off a chart. The payoff
 * is that hue drift is ~0 degrees by construction for every hue, not just the
 * three the brief spot-checked.
 */
export function deriveForGround(sourceHex, ground, minContrast, { satBoost = 1.08, maxSat = 97 } = {}) {
  const { h, s } = hsl(sourceHex);
  const sat = Math.min(maxSat, s * satBoost);
  let lo = 0;
  let hi = 100;
  // Highest lightness that still meets the floor. Contrast against a light
  // ground falls monotonically as lightness rises, so binary search is safe.
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (contrast(fromHsl({ h, s: sat, l: mid }), ground) >= minContrast) lo = mid;
    else hi = mid;
  }
  return fromHsl({ h, s: sat, l: lo }).slice(0, 7);
}

/** sRGB to CIE Lab (D65), for perceptual-difference checks. */
export function lab(hex) {
  const { r, g, b } = parse(hex);
  const [R, G, B] = [r, g, b].map(srgbToLinear);
  // sRGB D65 -> XYZ
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B;
  const Z = (0.0193339 * R + 0.1191920 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(X), f(Y), f(Z)];
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/**
 * CIE76 colour difference. Rough rule of thumb: <2.3 is a just-noticeable
 * difference, so two syntax tokens under ~10 are a real risk of reading as the
 * same colour in running code.
 */
export function deltaE(x, y) {
  const p = lab(x);
  const q = lab(y);
  return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b);
}

/**
 * Walk a colour's lightness — holding its hue and saturation — until it clears
 * `minContrast` against every surface in `surfaces`.
 *
 * Direction is chosen automatically: a colour already lighter than its
 * surfaces moves lighter, one already darker moves darker. Returns the first
 * value that passes, so the colour moves as little as it has to.
 */
export function solveLightness(source, surfaces, minContrast) {
  const { h, s, l } = hsl(source);
  const meanSurface = surfaces.reduce((acc, x) => acc + luminance(x), 0) / surfaces.length;
  const up = luminance(source) >= meanSurface;
  const passes = (hex) => surfaces.every((x) => contrast(hex, x) >= minContrast);
  if (passes(source)) return source.slice(0, 7);
  for (let step = 0; step <= 100; step += 0.25) {
    const L = up ? l + step : l - step;
    if (L < 0 || L > 100) break;
    const candidate = fromHsl({ h, s, l: L }).slice(0, 7);
    if (passes(candidate)) return candidate;
  }
  throw new Error(`Cannot reach ${minContrast}:1 from ${source} on ${surfaces.join(', ')}`);
}
