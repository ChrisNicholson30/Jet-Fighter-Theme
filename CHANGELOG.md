# Changelog

All notable changes to Jet Fighter are recorded here.
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — unreleased

First release. Four variants in one theme family.

### Added

- **Jet Fighter Afterburner** — the reference dark build, on `#0B0F14`.
- **Jet Fighter Stealth** — OLED, on true black, measured at 0.71x Afterburner's
  modelled drive cost under every weighting tested.
- **Jet Fighter Contrail** — light, for daylight legibility.
- **Jet Fighter Hyperjet** — the first *special* variant: a warm dark build on a
  ground hue-locked to the palette's own orange, with a vivid red identity.
  Special variants may reassign which hue plays which role; they are held to
  every gate the core three are. Adds **Route C**: `#EF4444`, Tailwind red-500
  and the family's first true red, seeded rather than shipped — the build holds
  its hue and saturation and re-derives lightness to `#F04F4F` so the accent
  clears the body floor on the elevated surface too.
- A **`signal` role**, splitting the neutral-state slots (`info`,
  `version_control.renamed`, the `NORMAL` annunciator) off from `primary`. The
  two are the same colour in every core build and cannot be once the primary is
  red — `info` beside `error` and `NORMAL` beside `REPLACE` would each be two
  reds. Defaults to `primary`, so the core three are unchanged.
- An **ANSI hue map** a variant can override, so a build that reassigns roles
  keeps a terminal whose `blue` is blue. The core three do not set it and their
  output is unchanged.
- All **185** UI style keys populated in every variant, including the 46 that
  One Dark leaves unset: the vim and Helix mode indicators, the minimap, editor
  and panel indent guides, diff-hunk row highlights, the debugger accent, and
  `version_control.conflict` / `.ignored` / `.renamed`.
- **134 syntax tokens** per variant — the 47 the bundled themes define, plus the
  sub-captures Zed's grammars actually emit, so decorators, builtin types,
  JSON keys and regex internals resolve independently instead of falling back
  to their parent token.
- Vim and Helix **mode annunciators**: eight distinct mode chips with
  automatically-selected label colours.
- A complete **24-colour terminal**, with `dim` and `bright` separable from
  `normal` by a colour difference of at least dE 8 on every hue.
- Eight **collaborator colours**, mutually separable by at least dE 12.
- A populated **`accents`** array, so indent-aware guide colouring stays inside
  the palette instead of falling back to Zed's built-in ramp.

### Tooling

- `scripts/contrast-gate.mjs` — composites alpha before measuring, scores every
  token against the worst surface it is drawn on (including the active-line
  band), and holds recessive tokens to a named lower floor rather than
  exempting them. Ships with a self-test that proves it rejects a known-bad
  colour. Also asserts, against the shipped file, that Hyperjet's identity red
  and alarm red stay dE 20 apart and that the alarm is the brighter of the two —
  the one red-on-red pair a red-primary build leaves behind.
- `scripts/key-coverage.mjs` — checks against the key inventory extracted from
  the Zed source, not against One Dark.
- `scripts/provenance.mjs` — proves every colour in the shipped file traces to
  a named group in `src/palette.mjs`: the locked swatch, Route B, Route C or a
  derived variant ramp.
- `scripts/power-model.mjs` — the OLED drive-cost model, published with its
  assumptions and re-run under three weightings.
- `src/build.mjs --check` — fails if the committed JSON has drifted from source.

### Site and install

- `install.sh` — one idempotent command that installs and updates. Validates the
  download before writing, replaces atomically, needs no `sudo`, and supports
  `--check`, `--uninstall` and `JF_REF` for pinning.
- A showcase site generated from the theme file itself, so its palette cannot
  drift from what ships. Switching variant repaints the whole document.
- Code samples highlighted through Zed's own longest-dotted-prefix capture
  resolution rather than a generic web highlighter.
- The supplied artwork is the mark, vendored at
  `site/assets/brand/mark-source.jpg` and used for the logo, the favicons and
  the social card. `site/generate-assets.mjs` finds the ring by luminance and
  centres a square on it, so the crop is reproducible rather than hand-dragged.
  Tab-sized icons take a 72% crop: at 16px the full badge loses the aircraft
  altogether, and framing in on the delta and plumes is the only thing that
  still reads.

### Notes

- Comments hold slate-500's hue but re-derive lightness to clear 4.5:1. The
  exact value `#64748B` measures 4.04:1 on the dark ground, under the floor this
  theme commits to. See the README's "Two places this departs from the brief".
- The active tab takes the editor ground rather than the elevated panel colour.
