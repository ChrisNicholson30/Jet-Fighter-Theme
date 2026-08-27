# Changelog

All notable changes to Jet Fighter are recorded here.
This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — unreleased

First release. Three variants in one theme family.

### Added

- **Jet Fighter Afterburner** — the reference dark build, on `#0B0F14`.
- **Jet Fighter Stealth** — OLED, on true black, measured at 0.71x Afterburner's
  modelled drive cost under every weighting tested.
- **Jet Fighter Contrail** — light, for daylight legibility.
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
  colour.
- `scripts/key-coverage.mjs` — checks against the key inventory extracted from
  the Zed source, not against One Dark.
- `scripts/provenance.mjs` — proves every colour in the shipped file traces to
  the locked swatch or a Route B addition.
- `scripts/power-model.mjs` — the OLED drive-cost model, published with its
  assumptions and re-run under three weightings.
- `src/build.mjs --check` — fails if the committed JSON has drifted from source.

### Notes

- Comments hold slate-500's hue but re-derive lightness to clear 4.5:1. The
  exact value `#64748B` measures 4.04:1 on the dark ground, under the floor this
  theme commits to. See the README's "Two places this departs from the brief".
- The active tab takes the editor ground rather than the elevated panel colour.
