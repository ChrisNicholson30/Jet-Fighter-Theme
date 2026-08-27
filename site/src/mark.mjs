/**
 * Jet Fighter — the mark, as vector.
 *
 * A drawing to the brief's §8 description — top-down stealth delta, panelled
 * charcoal airframe with a white keyline, twin afterburner plumes, a
 * cyan-to-violet ring over a field of abstract code lines — not a trace of the
 * supplied raster.
 *
 * The brief's open decision 6 is settled here in the affirmative: the gradient
 * stops read exactly #38BDF8 / #7C3AED / #A855F7. The supplied raster runs 4-7
 * points hotter in saturation, which reads as a mistake once the mark sits
 * beside a real screenshot of the theme.
 *
 * The 16px reduction is a different drawing, not a resize — at that size the
 * airframe collapses to a smear and only the plume survives, so `faviconSvg`
 * keeps the plume and nozzles and drops everything else.
 */

const P = {
  primary: '#38BDF8',
  secondary: '#7C3AED',
  accent: '#A855F7',
  ground: '#000000',
  hull: '#252B3D',
  hullDark: '#1A1F2E',
  hullLight: '#333A4C',
  keyline: '#F8FAFC',
};

/**
 * Right-hand outline of the airframe; the left is mirrored about x = 256.
 * Proportions follow the supplied raster: wingtips at roughly 58% of the ring
 * radius, nozzles just inside the ring's lower edge, plumes crossing it.
 */
const HALF = [
  [256, 34], [268, 128], [286, 206],
  [398, 306], [326, 344], [314, 358],
  [314, 398], [302, 412], [264, 412], [256, 396],
];

function outline() {
  const left = [...HALF].reverse().slice(1).map(([x, y]) => [512 - x, y]);
  return [...HALF, ...left];
}

function airframePath() {
  return `M ${outline().map(([x, y]) => `${x} ${y}`).join(' L ')} Z`;
}

/** Ray casting, so the code field can be kept off the airframe exactly. */
function inside([px, py], poly, pad = 0) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  if (hit) return true;
  if (pad <= 0) return false;
  // Cheap dilation: test a few offsets so lines keep clear of the keyline.
  return [[pad, 0], [-pad, 0], [0, pad], [0, -pad]].some(([dx, dy]) =>
    inside([px + dx, py + dy], poly, 0),
  );
}

/** Deterministic scatter, so the code field is identical on every build. */
function codeField() {
  let seed = 20260827;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const poly = outline();
  const hues = [P.primary, P.secondary, P.accent];
  const lines = [];
  for (let i = 0; i < 460 && lines.length < 132; i += 1) {
    const x = 34 + rand() * 444;
    const y = 46 + rand() * 420;
    const w = 12 + rand() * 66;
    const hue = hues[Math.floor(rand() * 3)];
    const op = (0.18 + rand() * 0.55).toFixed(2);
    // Inside the ring, clear of the airframe, and clear of the plume column.
    if (Math.hypot(x + w / 2 - 256, y - 256) > 214) continue;
    if (Math.hypot(x - 256, y - 256) > 214) continue;
    if (inside([x, y], poly, 14) || inside([x + w, y], poly, 14)) continue;
    if (y > 380 && Math.abs(x + w / 2 - 256) < 92) continue;
    lines.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="4" rx="2" ` +
        `fill="${hue}" opacity="${op}"/>`,
    );
  }
  return lines.join('');
}

/**
 * The full badge. `id` namespaces the gradient ids so several copies can sit on
 * one page without their defs colliding.
 */
export function markSvg({ id = 'jf', size = 512, codeLines = true, ring = true } = {}) {
  return `<svg viewBox="0 0 512 512" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jet Fighter">
  <defs>
    <linearGradient id="${id}-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${P.primary}"/>
      <stop offset="52%" stop-color="${P.secondary}"/>
      <stop offset="100%" stop-color="${P.accent}"/>
    </linearGradient>
    <linearGradient id="${id}-hull" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="${P.hullLight}"/>
      <stop offset="55%" stop-color="${P.hull}"/>
      <stop offset="100%" stop-color="${P.hullDark}"/>
    </linearGradient>
    <linearGradient id="${id}-canopy" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#DFF6FF"/>
      <stop offset="40%" stop-color="${P.primary}"/>
      <stop offset="100%" stop-color="${P.secondary}"/>
    </linearGradient>
    <linearGradient id="${id}-plume" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#E8FBFF" stop-opacity="1"/>
      <stop offset="26%" stop-color="${P.primary}" stop-opacity="0.95"/>
      <stop offset="70%" stop-color="${P.secondary}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${P.secondary}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id}-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${P.primary}" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="${P.primary}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <circle cx="256" cy="256" r="256" fill="${P.ground}"/>
  ${codeLines ? `<g>${codeField()}</g>` : ''}
  ${ring ? `<circle cx="256" cy="256" r="234" fill="none" stroke="url(#${id}-ring)" stroke-width="7"/>` : ''}

  <ellipse cx="256" cy="440" rx="88" ry="60" fill="url(#${id}-glow)"/>

  <g>
    <path d="M 271 408 L 258 506 L 288 506 L 285 408 Z" fill="url(#${id}-plume)"/>
    <path d="M 241 408 L 254 506 L 224 506 L 227 408 Z" fill="url(#${id}-plume)"/>
    <path d="M 274 410 L 268 500 L 282 500 L 282 410 Z" fill="#EAFCFF" opacity="0.9"/>
    <path d="M 238 410 L 244 500 L 230 500 L 230 410 Z" fill="#EAFCFF" opacity="0.9"/>
  </g>

  <path d="${airframePath()}" fill="url(#${id}-hull)" stroke="${P.keyline}" stroke-width="4.5" stroke-linejoin="round"/>

  <g stroke="${P.hullLight}" stroke-width="1.8" fill="none" opacity="0.8">
    <path d="M 256 64 L 256 396"/>
    <path d="M 292 224 L 330 336"/>
    <path d="M 220 224 L 182 336"/>
    <path d="M 231 196 L 281 196"/>
    <path d="M 224 250 L 288 250"/>
    <path d="M 236 300 L 276 300"/>
    <path d="M 302 262 L 366 288"/>
    <path d="M 210 262 L 146 288"/>
  </g>
  <g fill="${P.hullDark}" opacity="0.7">
    <rect x="224" y="330" width="26" height="78" rx="4"/>
    <rect x="262" y="330" width="26" height="78" rx="4"/>
  </g>
  <g fill="none" stroke="${P.hullLight}" stroke-width="2.4" opacity="0.9">
    <rect x="220" y="396" width="32" height="16" rx="3"/>
    <rect x="260" y="396" width="32" height="16" rx="3"/>
  </g>

  <ellipse cx="256" cy="128" rx="15" ry="44" fill="url(#${id}-canopy)" stroke="${P.hullLight}" stroke-width="2.2"/>
  <ellipse cx="252" cy="118" rx="4" ry="24" fill="#FFFFFF" opacity="0.5"/>
</svg>`;
}

/**
 * The 16/32px reduction. Plume and nozzles only — the elements the brief's
 * downsample test found still legible when the airframe had gone.
 */
export function faviconSvg({ id = 'jff' } = {}) {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jet Fighter">
  <defs>
    <linearGradient id="${id}-ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${P.primary}"/>
      <stop offset="100%" stop-color="${P.accent}"/>
    </linearGradient>
    <linearGradient id="${id}-plume" x1="0.5" y1="0" x2="0.5" y2="1">
      <stop offset="0%" stop-color="#EAFCFF"/>
      <stop offset="45%" stop-color="${P.primary}"/>
      <stop offset="100%" stop-color="${P.secondary}"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="${P.ground}"/>
  <circle cx="32" cy="32" r="27" fill="none" stroke="url(#${id}-ring)" stroke-width="3"/>
  <path d="M 32 12 L 44 34 L 38 34 L 38 44 L 26 44 L 26 34 L 20 34 Z" fill="${P.hullLight}" stroke="${P.keyline}" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M 27 45 L 25 58 L 30 58 L 30 45 Z" fill="url(#${id}-plume)"/>
  <path d="M 37 45 L 39 58 L 34 58 L 34 45 Z" fill="url(#${id}-plume)"/>
</svg>`;
}

/** Single colour, for small placements on light grounds. */
export function markMonoSvg({ fill = '#0F172A', size = 512 } = {}) {
  return `<svg viewBox="0 0 512 512" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Jet Fighter">
  <circle cx="256" cy="256" r="234" fill="none" stroke="${fill}" stroke-width="14"/>
  <path d="${airframePath()}" fill="${fill}"/>
  <path d="M 227 410 L 224 500 L 254 500 L 241 410 Z" fill="${fill}" opacity="0.5"/>
  <path d="M 285 410 L 288 500 L 258 500 L 271 410 Z" fill="${fill}" opacity="0.5"/>
</svg>`;
}

export const PALETTE = P;
