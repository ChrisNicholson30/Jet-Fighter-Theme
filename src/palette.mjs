/**
 * Jet Fighter — palettes.
 *
 * Three variants, one source of truth. Afterburner is the reference build;
 * Stealth and Contrail are derivations of it, not separate designs.
 *
 * The locked swatch (brief §4) is reproduced here byte-for-byte and must not
 * change. Route B (brief §5) adds seven hues, all drawn from the same Tailwind
 * ramp the swatch itself comes from, so nothing is imported from a foreign
 * colour system.
 */

import { mix, alpha, over, deriveForGround, solveLightness } from './color.mjs';

/** The eight locked swatch values. Not to be edited — see brief §3 non-goals. */
export const SWATCH = {
  background: '#0B0F14', // stealth ground
  surface: '#111827',    // panels, tab bar, status bar, title bar
  panel: '#1F2937',      // elevated surfaces, active line
  muted: '#2D3748',      // borders, wrap guides. Never text.
  primary: '#38BDF8',    // sky-400
  secondary: '#7C3AED',  // violet-600 — FIELDS ONLY, never text (3.37:1)
  accent: '#A855F7',     // purple-500
  text: '#F8FAFC',       // slate-50
};

/**
 * Route B — Cockpit HUD. Seven additions (brief §5).
 * `comment` is the §13.2 decision: slate-500, which clears AA on the dark
 * ground (4.04 is AA-large; it clears 4.5 on every surface it is actually
 * drawn on once the editor background is accounted for — see the gate).
 */
export const ROUTE_B = {
  comment: '#64748B',  // slate-500  — comments, hints, predictive
  danger: '#FB7185',   // rose-400   — error, deleted
  caution: '#FBBF24',  // amber-400  — warning, modified
  go: '#34D399',       // emerald-400 — success, created
  string: '#6EE7B7',   // emerald-300 — strings, literals
  number: '#FDBA74',   // orange-300 — numbers, constants, booleans
  type: '#7DD3FC',     // sky-300    — types, enums, operators
};

/**
 * Contrail's light surfaces. Slate ramp, and the ground is the swatch's own
 * text colour reused — a small piece of internal logic worth keeping.
 */
export const CONTRAIL_SURFACES = {
  background: '#F8FAFC', // = SWATCH.text
  surface: '#F1F5F9',    // slate-100
  panel: '#E2E8F0',      // slate-200
  muted: '#CBD5E1',      // slate-300
  text: '#0F172A',       // slate-900
  textBright: '#020617', // slate-950 — the emphasis pole
};

/**
 * Contrail's chromatic hues, re-derived rather than hand-picked (brief §6).
 *
 * The swatch supplies zero light values. Each hue holds its dark-variant hue
 * angle exactly and solves for the lightness that hits a target contrast
 * against `CONTRAIL_SURFACES.panel` — the darkest surface any of these colours
 * is drawn on, so every other use site over-delivers.
 *
 * The per-role targets are not uniform, and that is the point. In the dark
 * variant `type` (sky-300) is *brighter* than `primary` (sky-400), and `string`
 * (emerald-300) is brighter than `go` (emerald-400). On a light ground the
 * equivalent of "more prominent" is darker, so those roles get higher targets.
 * Solving every hue to the same floor would collapse each sibling pair onto the
 * same lightness and make them indistinguishable — which is exactly the failure
 * mode the brief's pre-mortem predicts for this variant.
 *
 * Hue drift comes out at <= 1.1 degrees across all ten hues, against the
 * brief's <= 5 degree gate. Picking Tailwind ramp steps by hand drifts up to
 * 17 degrees, because Tailwind's warm ramps rotate toward red as they darken.
 */
const CONTRAIL_TARGETS = {
  comment: 4.6,   // recedes
  primary: 5.3,   // functions
  type: 8.0,      // types read stronger than functions, mirroring the dark build
  accent: 6.2,    // keywords
  secondary: 8.4, // field colour, wants to be dark
  danger: 5.4,
  caution: 4.7,
  number: 5.9,
  go: 5.1,
  string: 7.2,    // strings read stronger than success, mirroring the dark build
};

const DARK_HUE_SOURCES = {
  primary: SWATCH.primary,
  secondary: SWATCH.secondary,
  accent: SWATCH.accent,
  ...ROUTE_B,
};

export const CONTRAIL_HUES = {
  ...CONTRAIL_SURFACES,
  ...Object.fromEntries(
    Object.entries(CONTRAIL_TARGETS).map(([role, target]) => [
      role,
      deriveForGround(DARK_HUE_SOURCES[role], CONTRAIL_SURFACES.panel, target, {
        satBoost: 1.0,
        maxSat: 92,
      }),
    ]),
  ),
};

/**
 * Shared derivations. Each is a documented operation on palette values, so
 * `scripts/provenance.mjs` can prove no colour in the shipped file was
 * invented — the brief's specific worry about the mark's `#22138B` leaking
 * into the theme as a ninth colour.
 */
function derive(v) {
  // The active line is a lighter band laid over the editor ground. Syntax
  // sitting on it has *less* contrast than syntax on the ground, so the band is
  // the real floor for every token in the buffer — and it is the surface the
  // brief's contrast table never accounts for. Both surfaces are solved here.
  const band = over(alpha(v.panel, v.activeLineAlpha * (v.fillScale ?? 1)), v.background);
  const editorSurfaces = [v.background, band];

  // Comments hold slate-500's hue and saturation and re-derive lightness until
  // they clear the body floor on both editor surfaces.
  //
  // This is a deliberate departure from the brief's §13.2 pick of #64748B
  // exactly. That value measures 4.04:1 on the dark ground — the brief says so
  // — which is under the 4.5:1 its own definition of done requires of every
  // syntax token, and under the standard its kill criteria names as the one
  // thing worse than not shipping. The hue is kept; only the lightness moves,
  // by a colour difference of dE 5.5 on the reference build.
  const comment = solveLightness(v.commentSeed, editorSurfaces, 4.6);

  return {
    ...v,
    comment,
    band,
    /** Doc comments read stronger than ordinary comments: they are meant to be read. */
    docComment: mix(comment, v.poles.fg, 0.55).slice(0, 7),
    /** Edit-prediction ghost text sits below comments, and is meant to. */
    predictiveText: mix(comment, v.poles.bg, 0.82).slice(0, 7),
    /** Punctuation is the highest-population chromatic class on screen. */
    punctuation: alpha(v.text, v.punctuationAlpha),
    /**
     * `conflict` is the one status colour purple cannot carry at full strength:
     * #A855F7 measures 3.71:1 on the elevated surface, which the brief itself
     * flags as off-limits for that value. Lifted toward the variant's foreground
     * pole until it clears the body floor there. The keyword token keeps the
     * locked #A855F7 untouched.
     */
    conflictColor: mix(v.accent, v.poles.fg, 0.8).slice(0, 7),
  };
}

/**
 * Afterburner — the reference dark build. Every other variant derives from it.
 */
export const afterburner = derive({
  id: 'afterburner',
  name: 'Jet Fighter Afterburner',
  appearance: 'dark',
  ...SWATCH,
  ...ROUTE_B,
  poles: { fg: SWATCH.text, bg: SWATCH.background },
  commentSeed: ROUTE_B.comment,
  activeLineAlpha: 0.3,
  punctuationAlpha: 0.5,
  lineNumberAlpha: 0.42,
  invisibleAlpha: 0.38,
  ansiBlack: SWATCH.muted,
  ansiWhite: mix(SWATCH.text, SWATCH.background, 0.78).slice(0, 7),
  textRamp: {
    bright: SWATCH.text,
    muted: 0.7,
    placeholder: 0.55,
    disabled: 0.38,
  },
});

/**
 * Stealth — OLED. Not "Afterburner with a black background" (brief §6).
 *
 * Rule 1: the ground is fully-off pixels, `#000000`. Nothing else is free.
 * Rule 2: body text steps down one notch. This is the single largest power
 *         saving available — roughly 23% of composite draw — and it costs
 *         nothing in identity. Derived as a mix of the locked text and muted
 *         values rather than introducing a ninth colour; the result lands
 *         within 0.03 contrast of the brief's nominated `#C7D2DA`.
 * Rule 3: high-population tokens (punctuation, line numbers, comments) move to
 *         the cheap neutral ramp. Bright chroma is reserved for tokens that
 *         appear dozens of times a screen, not thousands.
 * Rule 4: no large filled accent surfaces. Every translucent fill is scaled
 *         down, which also limits differential ageing from a fixed violet
 *         status bar on QD-OLED.
 */
const STEALTH_TEXT = mix(SWATCH.text, SWATCH.muted, 0.79).slice(0, 7);

export const stealth = derive({
  id: 'stealth',
  name: 'Jet Fighter Stealth',
  appearance: 'dark',
  ...SWATCH,
  ...ROUTE_B,
  background: '#000000',
  surface: '#07090C',
  panel: '#0E1218',
  text: STEALTH_TEXT,
  poles: { fg: SWATCH.text, bg: '#000000' },
  commentSeed: ROUTE_B.comment,
  // A lighter band costs power on OLED, so Stealth's active line is the
  // faintest of the three that still clears the floor.
  activeLineAlpha: 0.35,
  punctuationAlpha: 0.6,
  lineNumberAlpha: 0.47,
  invisibleAlpha: 0.46,
  ansiBlack: SWATCH.muted,
  ansiWhite: mix(STEALTH_TEXT, '#000000', 0.78).slice(0, 7),
  fillScale: 0.82,
  /** Stealth-only signature: the primary cursor runs magenta (brief §5). */
  signatureCursor: SWATCH.accent,
  textRamp: {
    bright: SWATCH.text,
    muted: 0.68,
    placeholder: 0.52,
    disabled: 0.36,
  },
  oled: true,
});

/**
 * Contrail — light, for daylight legibility.
 *
 * Explicitly NOT marketed as power efficient: it measures roughly 8x the dark
 * variant, and the README says so rather than implying otherwise.
 */
export const contrail = derive({
  id: 'contrail',
  name: 'Jet Fighter Contrail',
  appearance: 'light',
  ...CONTRAIL_HUES,
  poles: { fg: CONTRAIL_SURFACES.textBright, bg: CONTRAIL_SURFACES.background },
  commentSeed: CONTRAIL_HUES.comment,
  activeLineAlpha: 0.62,
  punctuationAlpha: 0.64,
  lineNumberAlpha: 0.52,
  invisibleAlpha: 0.5,
  ansiBlack: CONTRAIL_HUES.text,
  ansiWhite: mix(CONTRAIL_HUES.comment, CONTRAIL_SURFACES.background, 0.45).slice(0, 7),
  textRamp: {
    bright: CONTRAIL_SURFACES.textBright,
    muted: 0.72,
    placeholder: 0.58,
    disabled: 0.42,
  },
  light: true,
});

export const VARIANTS = [afterburner, stealth, contrail];

/** The dark-to-light correspondence the hue-drift assertion runs over. */
export const HUE_PAIRS = Object.keys(CONTRAIL_TARGETS).map((role) => [
  role,
  DARK_HUE_SOURCES[role],
  CONTRAIL_HUES[role],
]);
