/**
 * Jet Fighter — palettes.
 *
 * One source of truth, in two parts. The core family — Afterburner, Stealth,
 * Contrail — is one design: Afterburner is the reference build and the other
 * two are derivations of it, not separate designs. Below them, in their own
 * section, are the special variants: builds allowed to reassign which hue plays
 * which role, and held to every gate the core three are.
 *
 * The locked swatch (brief §4) is reproduced here byte-for-byte and must not
 * change. Route B (brief §5) adds seven hues and Route C adds three more, all
 * drawn from the same Tailwind ramp the swatch itself comes from, so nothing is
 * imported from a foreign colour system.
 */

import { mix, alpha, over, deriveForGround, solveLightness, hsl, fromHsl } from './color.mjs';

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
/**
 * The active line is a lighter band laid over the editor ground. Syntax sitting
 * on it has *less* contrast than syntax on the ground, so the band is the real
 * floor for every token in the buffer — and it is the surface the brief's
 * contrast table never accounts for.
 *
 * Split out of `derive` because a variant may need it before it derives: a
 * colour solved against the surfaces it is drawn on has to know about the band,
 * and the band has to be the same one the build ships.
 */
function activeLineBand(v) {
  return over(alpha(v.panel, v.activeLineAlpha * (v.fillScale ?? 1)), v.background);
}

function derive(v) {
  const band = activeLineBand(v);
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

// ===========================================================================
// Special variants
//
// The three builds above are the core family: one locked swatch, one set of
// role assignments, three grounds. A *special* variant is held to every gate
// the core builds are — coverage, contrast, separability, provenance — but is
// allowed the one liberty they are not: it may reassign which hue plays which
// role. That is a large enough departure to be fenced into its own section
// rather than appended to the list above, so "which build is allowed to move
// the palette around" is answered by where the code lives.
// ===========================================================================

/**
 * Route C — Burner. One hue, and the first true red the family has: `#EF4444`,
 * Tailwind red-500, the same ramp everything else comes from.
 *
 * It is a seed rather than a shipped value. Red-500 measures 4.13:1 on
 * Hyperjet's elevated surface — under the body floor, and the accent colour is
 * drawn on popups and menus as well as in the buffer — so the build holds its
 * hue and saturation exactly and re-derives lightness until it clears 4.6 on
 * every surface it lands on. That is the same operation the comment colour
 * runs, for the same reason.
 *
 * Rose-400 stays the alarm. Two reds in one build is the risk this variant
 * creates and the gate names it: `scripts/contrast-gate.mjs` asserts the
 * identity red and the alarm red are separable, and that the alarm is the
 * brighter of the two.
 */
export const ROUTE_C = {
  burner: '#EF4444', // red-500 — seed for the identity red
};

/**
 * Hyperjet's surfaces.
 *
 * Contrail's ground is the swatch's own text colour reused. Hyperjet's is the
 * exhaust: `ROUTE_B.number`'s hue angle held exactly, with saturation and
 * lightness then set per plane.
 *
 * The obvious alternative — mix a warm tint into the cool `#0B0F14` ramp — does
 * not work, and it is worth recording why rather than rediscovering it. Mixing
 * toward a lighter colour only ever runs the plane lighter, so a 5.5%-lightness
 * ground is not reachable from a 6.1% one at any weight. And the two hues are
 * near-complementary, so the weights subtle enough to still read as neutral
 * cancel instead of warming: 0.04 to 0.08 of orange-300 into `#0B0F14` lands at
 * 2-7% saturation with the hue angle swinging 220 -> 300 -> 30 degrees as the
 * weight moves. That is not warm, it is muddy, and its hue is meaningless.
 *
 * Setting h, s and l independently decouples them: the angle is fixed first and
 * the plane is placed second, so every surface is warm by construction and
 * traceable to one palette hue.
 *
 * `panel` sits at 12% rather than the 13.5% that reads best on its own. The
 * elevated surface is the lightest plane the accent colour is drawn on, so it
 * sets the ceiling on how deep a red the identity can be: at 13.5% the solver
 * has to lift the red to `#F15757`, which lands dE 18.9 from the alarm rose —
 * under the 20 the gate requires between two version-control states. The panel
 * gives up 1.5 points of lightness so the red can keep its chroma.
 */
const EXHAUST_HUE = hsl(ROUTE_B.number).h;
const plane = (s, l) => fromHsl({ h: EXHAUST_HUE, s, l }).slice(0, 7);

export const HYPERJET_SURFACES = {
  background: plane(22, 5.5),  // editor ground — warm gunmetal, not brown
  surface: plane(21, 8.6),     // chrome
  panel: plane(20, 12),        // elevated surfaces, active line — see above
  muted: plane(18, 21),        // borders and rules. Never text.
  text: plane(38, 95),
  textBright: plane(45, 98.5), // the emphasis pole
};

/** Held constant while the panel moved, so the band is the one already gated. */
const HYPERJET_ACTIVE_LINE = 0.35;
const HYPERJET_BAND = activeLineBand({
  ...HYPERJET_SURFACES,
  activeLineAlpha: HYPERJET_ACTIVE_LINE,
});

/**
 * Hyperjet's role assignments.
 *
 * One role moves and takes the build's identity with it: `primary` — functions,
 * links, focus rings, the active line number, the `NORMAL` annunciator, the
 * local cursor — becomes the burner red. Everything the editor uses to say
 * *here, now, you* runs red on a warm gunmetal ground.
 *
 * What stays: keywords are still purple, types still sky, strings still
 * emerald, numbers still orange-300 — the hue the neutral ramp is built from,
 * so numerals sit in the same family as the surfaces they are drawn on. Warning
 * and error keep the core family's amber and rose. `#7C3AED` is still a field
 * colour that never carries text.
 *
 * `signal` is the one split this variant forces, and it is a real finding
 * rather than a workaround. In the core builds `primary` quietly does two jobs:
 * it is the theme's own colour *and* the neutral-state signal — `info`
 * diagnostics, `version_control.renamed`, the `NORMAL` annunciator. Those jobs
 * are compatible while the primary is cool and incompatible the moment it is
 * red: the diagnostics panel would show "this is fine" and "this is broken" in
 * two reds, the git panel would show `renamed` and `deleted` in two more, and
 * `NORMAL` would sit next to `REPLACE` as two red lamps — in the one widget
 * whose entire job is being read at a glance.
 *
 * So the neutral-state slots take `SWATCH.primary`, the locked sky-400 the core
 * family already uses for exactly them, and the identity keeps the red. The
 * eight mode chips end up the same eight hues Afterburner ships, which is why
 * their separations are known-good rather than newly argued.
 */
export const HYPERJET_HUES = {
  ...HYPERJET_SURFACES,
  primary: solveLightness(
    ROUTE_C.burner,
    [HYPERJET_SURFACES.background, HYPERJET_BAND, HYPERJET_SURFACES.surface, HYPERJET_SURFACES.panel],
    4.6,
  ),
  signal: SWATCH.primary,      // info, renamed, NORMAL — the locked sky-400
  caution: ROUTE_B.caution,    // amber-400, as in the core builds
  danger: ROUTE_B.danger,      // rose-400 — the alarm stays the family's red
  accent: SWATCH.accent,       // keywords stay purple-500
  secondary: SWATCH.secondary, // fields only, exactly as in the core builds
  go: ROUTE_B.go,
  string: ROUTE_B.string,
  number: ROUTE_B.number,
  type: ROUTE_B.type,
  comment: plane(14, 55),
};

/**
 * Hyperjet — burner lit. A warm dark build for the hours the daylight variant
 * is wrong for and the OLED variant is too austere for, running on the red an
 * aircraft actually lights its cockpit with at night.
 *
 * The terminal does not follow the rotation. `ansiHues` pins the six ANSI slots
 * to hues that match their names — `blue` back to the locked `#38BDF8`, `red` to
 * the burner — because ANSI is a compatibility surface, not a design surface. A
 * theme that ships a red `terminal.ansi.blue` because red happens to be its
 * primary breaks every program that colours its own output, and the breakage
 * looks like the program's fault.
 */
export const hyperjet = derive({
  id: 'hyperjet',
  name: 'Jet Fighter Hyperjet',
  appearance: 'dark',
  ...HYPERJET_HUES,
  poles: { fg: HYPERJET_SURFACES.textBright, bg: HYPERJET_SURFACES.background },
  commentSeed: HYPERJET_HUES.comment,
  activeLineAlpha: HYPERJET_ACTIVE_LINE,
  punctuationAlpha: 0.52,
  lineNumberAlpha: 0.44,
  invisibleAlpha: 0.4,
  ansiBlack: HYPERJET_SURFACES.muted,
  ansiWhite: mix(HYPERJET_SURFACES.text, HYPERJET_SURFACES.background, 0.78).slice(0, 7),
  ansiHues: {
    red: HYPERJET_HUES.primary, // the burner, where a terminal expects a red
    green: ROUTE_B.go,
    yellow: ROUTE_B.caution,
    blue: SWATCH.primary,       // the locked sky-400, back where it belongs
    magenta: SWATCH.accent,
    cyan: ROUTE_B.type,
  },
  textRamp: {
    bright: HYPERJET_SURFACES.textBright,
    muted: 0.7,
    placeholder: 0.55,
    disabled: 0.38,
  },
  special: true,
});

export const CORE_VARIANTS = [afterburner, stealth, contrail];
export const SPECIAL_VARIANTS = [hyperjet];
export const VARIANTS = [...CORE_VARIANTS, ...SPECIAL_VARIANTS];

/** The dark-to-light correspondence the hue-drift assertion runs over. */
export const HUE_PAIRS = Object.keys(CONTRAIL_TARGETS).map((role) => [
  role,
  DARK_HUE_SOURCES[role],
  CONTRAIL_HUES[role],
]);

/**
 * The pair Hyperjet's design puts at risk: the identity red and the alarm red.
 *
 * A build whose primary is red has to prove that an error still reads as an
 * error. The gate takes both from the shipped file — `text.accent` is always
 * the primary, `error` always the danger — and requires them separable by the
 * same dE 20 two version-control states owe each other, with the alarm the
 * brighter of the two so it reads as the hotter thing on screen.
 */
export const RED_PAIR = {
  identity: 'text.accent',
  alarm: 'error',
  floor: 20,
};
