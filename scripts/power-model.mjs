#!/usr/bin/env node
/**
 * Jet Fighter — OLED drive-cost model.
 *
 * This is a *model, not a measurement*, and it is published as one. On an OLED
 * panel blue emitters need more drive current per unit of perceived luminance
 * than green or red; the weights below (r 0.24 / g 0.28 / b 0.48, gamma 2.2)
 * approximate that, normalised so a full-screen white is 1.00.
 *
 * The ordering of colours under this model is robust. The absolute ratios are
 * not, which is why the sensitivity block re-runs the whole comparison under
 * three plausible weightings. If a claim only holds under one of them, it is
 * not a claim worth printing on a README.
 *
 * Gate: Stealth must come in at or below 0.80x Afterburner (brief STK-006).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from '../src/color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const theme = JSON.parse(
  readFileSync(resolve(here, '..', 'themes/jet-fighter.json'), 'utf8'),
);

const WEIGHTINGS = {
  'blue-penalised': { r: 0.24, g: 0.28, b: 0.48 },
  'mild penalty': { r: 0.3, g: 0.3, b: 0.4 },
  'equal weights': { r: 1 / 3, g: 1 / 3, b: 1 / 3 },
};
const GAMMA = 2.2;

/** Relative drive cost of one pixel colour. Full-screen white = 1.00. */
export function driveCost(hex, w = WEIGHTINGS['blue-penalised']) {
  const { r, g, b } = parse(hex);
  return (
    w.r * (r / 255) ** GAMMA + w.g * (g / 255) ** GAMMA + w.b * (b / 255) ** GAMMA
  );
}

/**
 * Pixel populations, per the brief's §2.3 split. The point of the split is that
 * power on OLED is population x luminance: the background is 88% of the screen
 * and about 3% of the draw, while neutral foreground text is 5% of the screen
 * and the majority of it. Expensive colours are fine when they are rare.
 */
const POPULATION = {
  background: 0.88,
  neutralForeground: 0.05,
  chromaticSyntax: 0.03,
  uiChrome: 0.04,
};

function composite(theme_, weighting) {
  const s = theme_.style;
  const chromatic = Object.values(s.syntax)
    .map((x) => x.color)
    .filter((c, i, a) => a.indexOf(c) === i);
  const meanChromatic =
    chromatic.reduce((acc, c) => acc + driveCost(c, weighting), 0) / chromatic.length;

  return (
    POPULATION.background * driveCost(s['editor.background'], weighting) +
    POPULATION.neutralForeground * driveCost(s['editor.foreground'], weighting) +
    POPULATION.chromaticSyntax * meanChromatic +
    POPULATION.uiChrome * driveCost(s['surface.background'], weighting)
  );
}

const byName = Object.fromEntries(theme.themes.map((t) => [t.name, t]));
const afterburner = byName['Jet Fighter Afterburner'];
const stealth = byName['Jet Fighter Stealth'];
const contrail = byName['Jet Fighter Contrail'];
const hyperjet = byName['Jet Fighter Hyperjet'];

console.log('Jet Fighter — OLED drive-cost model\n');
console.log('  A model, not a measurement. Weights r 0.24 / g 0.28 / b 0.48, gamma 2.2,');
console.log('  normalised so a full-screen white is 1.00.\n');

console.log('  Per-colour cost, locked swatch');
for (const [name, hex] of [
  ['background  #0B0F14', '#0B0F14ff'],
  ['panel       #1F2937', '#1F2937ff'],
  ['secondary   #7C3AED', '#7C3AEDff'],
  ['accent      #A855F7', '#A855F7ff'],
  ['primary     #38BDF8', '#38BDF8ff'],
  ['text        #F8FAFC', '#F8FAFCff'],
]) {
  console.log(`    ${name}   ${driveCost(hex).toFixed(3)}`);
}

console.log('\n  Composite screen cost (88% background / 5% text / 3% syntax / 4% chrome)');
const base = composite(afterburner, WEIGHTINGS['blue-penalised']);
for (const t of theme.themes) {
  const c = composite(t, WEIGHTINGS['blue-penalised']);
  console.log(
    `    ${t.name.padEnd(28)} ${c.toFixed(4)}   ${(c / base).toFixed(2)}x Afterburner`,
  );
}

console.log('\n  Sensitivity: Stealth vs Afterburner under three weightings');
let worstRatio = 0;
for (const [name, w] of Object.entries(WEIGHTINGS)) {
  const ratio = composite(stealth, w) / composite(afterburner, w);
  worstRatio = Math.max(worstRatio, ratio);
  console.log(`    ${name.padEnd(16)} ${ratio.toFixed(3)}x`);
}
console.log(`    worst case      ${worstRatio.toFixed(3)}x`);

console.log(
  `\n  Contrail measures ${(composite(contrail, WEIGHTINGS['blue-penalised']) / base).toFixed(1)}x ` +
    'the reference build. It exists for daylight legibility,\n  not power, and the README says so rather than implying otherwise.\n',
);

// Hyperjet is not sold as a power variant either, but the model has an opinion
// about it, and the opinion is worth printing: the same argument that makes a
// cyan-and-violet palette expensive makes a warm one cheap. Reported under
// every weighting, because a claim that only holds under the blue-penalised
// one would be an artefact of the weighting rather than of the palette.
console.log('  Hyperjet, a warm palette on the same argument');
for (const [name, w] of Object.entries(WEIGHTINGS)) {
  const ratio = composite(hyperjet, w) / composite(afterburner, w);
  console.log(`    ${name.padEnd(16)} ${ratio.toFixed(3)}x Afterburner`);
}
console.log(
  '    Blue emitters cost the most drive current, so rotating the palette warm is\n' +
    '    cheaper than the reference build without trying to be. It is still not\n' +
    '    Stealth: the ground is lit pixels, and that is where Stealth wins.\n',
);

const GATE = 0.8;
if (worstRatio > GATE) {
  console.error(
    `FAILED — Stealth is ${worstRatio.toFixed(3)}x Afterburner under at least one ` +
      `weighting, above the ${GATE}x gate.`,
  );
  process.exit(1);
}
console.log(`PASS — Stealth holds at or below ${GATE}x Afterburner under every weighting tested.`);
