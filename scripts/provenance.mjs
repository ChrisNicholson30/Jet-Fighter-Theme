#!/usr/bin/env node
/**
 * Jet Fighter — palette provenance.
 *
 * The brief's §8 worry, stated plainly: the supplied mark contains a deep
 * indigo, `#22138B`, that sits outside the palette entirely — "fine in an
 * illustration, it must not migrate into the theme JSON as a ninth colour".
 *
 * This check makes that structural rather than a matter of vigilance. Every
 * chromatic colour in the shipped file must sit within 6 degrees of hue of a
 * value in one of the palette's named groups: the locked swatch, the seven
 * Route B additions, the three Route C additions the special variants bring,
 * or the two derived variant ramps. Anything else is either a neutral
 * (saturation under 12%, which the greys and surfaces are) or a foreign
 * colour, and a foreign colour fails the build.
 *
 * The groups are the point. A hue earns its way in by being written down in
 * `src/palette.mjs` with a reason next to it — not by turning up in the
 * output.
 *
 * `#22138B` lands 14.6 degrees from the nearest palette hue, so it would be
 * caught — that case is asserted below rather than asserted about.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { hsl, hueDrift } from '../src/color.mjs';
import { SWATCH, ROUTE_B, ROUTE_C, CONTRAIL_HUES, HYPERJET_HUES } from '../src/palette.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const theme = JSON.parse(readFileSync(resolve(here, '..', 'themes/jet-fighter.json'), 'utf8'));

const HUE_TOLERANCE = 6;
const NEUTRAL_SATURATION = 12;

/** Every hue the palette is allowed to contain, dark, light and warm alike. */
const ALLOWED = [
  ...Object.values(SWATCH),
  ...Object.values(ROUTE_B),
  ...Object.values(ROUTE_C),
  ...Object.values(CONTRAIL_HUES),
  ...Object.values(HYPERJET_HUES),
].filter((hex) => hsl(hex).s >= NEUTRAL_SATURATION);

function classify(hex) {
  const { s, l } = hsl(hex);
  if (s < NEUTRAL_SATURATION || l < 2 || l > 98) return { ok: true, why: 'neutral' };
  let best = { drift: Infinity, hue: null };
  for (const candidate of ALLOWED) {
    const drift = hueDrift(hex, candidate);
    if (drift < best.drift) best = { drift, hue: candidate };
  }
  return { ok: best.drift <= HUE_TOLERANCE, why: `${best.hue} (${best.drift.toFixed(1)} deg)`, ...best };
}

function collect(theme_) {
  const s = theme_.style;
  const out = new Set();
  for (const [k, v] of Object.entries(s)) {
    if (k === 'syntax' || k === 'players' || k === 'accents' || k === 'background.appearance') continue;
    out.add(v);
  }
  Object.values(s.syntax).forEach((x) => out.add(x.color));
  s.players.forEach((p) => [p.cursor, p.background, p.selection].forEach((c) => out.add(c)));
  s.accents.forEach((c) => out.add(c));
  return [...out];
}

console.log('Jet Fighter — palette provenance\n');
console.log(`  ${ALLOWED.length} chromatic source hues · tolerance ${HUE_TOLERANCE} degrees\n`);

let failures = 0;
let total = 0;
for (const t of theme.themes) {
  const colours = collect(t);
  total += colours.length;
  const foreign = colours.map((c) => [c, classify(c)]).filter(([, r]) => !r.ok);
  console.log(
    `  ${t.name.padEnd(28)} ${String(colours.length).padStart(3)} distinct colours · ` +
      `${foreign.length} foreign`,
  );
  for (const [c, r] of foreign) {
    console.log(`      ${c} — nearest palette hue ${r.why}`);
    failures += 1;
  }
}

// The check has to be able to catch the actual colour it exists to catch.
const indigo = classify('#22138Bff');
console.log(
  `\n  self-test: the mark's out-of-palette indigo #22138B is ` +
    `${indigo.ok ? 'ACCEPTED — check is not working' : `rejected (nearest ${indigo.why})`}`,
);
if (indigo.ok) failures += 1;

console.log(`\n  ${total} colour values checked across ${theme.themes.length} variants.`);
if (failures) {
  console.error(`\nFAILED — ${failures} colour(s) outside the palette.`);
  process.exit(1);
}
console.log('\nPASS — every colour traces to a named group in src/palette.mjs.');
