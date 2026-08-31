#!/usr/bin/env node
/**
 * Jet Fighter — coverage and structure gate.
 *
 * Checks the shipped theme against the key inventory extracted from the Zed
 * source (data/zed-keys.json), not against One Dark. One Dark populates 139 of
 * the 185 UI keys the schema accepts, so diffing against it — the obvious
 * check, and the one the brief's own risk register proposes — passes a theme
 * that leaves the vim mode indicators, the minimap, indent guides, diff hunks
 * and the debugger accent unset.
 *
 * Exits non-zero on any failure.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { deltaE, parse } from '../src/color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const theme = JSON.parse(readFileSync(resolve(root, 'themes/jet-fighter.json'), 'utf8'));
const zed = JSON.parse(readFileSync(resolve(root, 'data/zed-keys.json'), 'utf8'));

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

const HEX8 = /^#[0-9a-f]{8}$/;
const NON_COLOUR_KEYS = new Set(['background.appearance', 'accents', 'players', 'syntax']);

// --------------------------------------------------------------------------
// Family-level structure
// --------------------------------------------------------------------------
if (theme.$schema !== zed.schema) fail(`$schema is ${theme.$schema}, expected ${zed.schema}`);
if (!theme.name || !theme.author) fail('family is missing name or author');
// Three core variants plus the special variants (see src/palette.mjs). Stated
// as a literal rather than read from src/ on purpose: this gate is an
// assertion about the artefact that ships, so a build that silently drops a
// variant fails here rather than quietly agreeing with itself.
const EXPECTED_VARIANTS = 4;
if (theme.themes.length !== EXPECTED_VARIANTS) {
  fail(`expected ${EXPECTED_VARIANTS} variants, found ${theme.themes.length}`);
}

const appearances = theme.themes.map((t) => t.appearance);
if (!appearances.includes('light')) fail('no light variant in the family');
if (new Set(theme.themes.map((t) => t.name)).size !== theme.themes.length) {
  fail('variant names are not unique');
}

for (const variant of theme.themes) {
  const label = variant.name;
  const style = variant.style;

  // Enum-valued fields, per AppearanceContent and WindowBackgroundContent.
  if (!['light', 'dark'].includes(variant.appearance)) {
    fail(`${label}: appearance is "${variant.appearance}"`);
  }
  if (!['opaque', 'transparent', 'blurred'].includes(style['background.appearance'])) {
    fail(`${label}: background.appearance is "${style['background.appearance']}"`);
  }
  const present = new Set(Object.keys(style).filter((k) => !NON_COLOUR_KEYS.has(k)));

  // ---- every key the schema accepts is populated --------------------------
  const missing = zed.ui_keys.filter((k) => !present.has(k));
  if (missing.length) fail(`${label}: ${missing.length} unpopulated UI keys: ${missing.join(', ')}`);

  const unknown = [...present].filter((k) => !zed.ui_keys.includes(k));
  if (unknown.length) fail(`${label}: keys not in the schema: ${unknown.join(', ')}`);

  const deprecated = zed.deprecated_ui_keys.filter((k) => present.has(k));
  if (deprecated.length) fail(`${label}: deprecated keys present: ${deprecated.join(', ')}`);

  // ---- zero nulls, eight-digit hex everywhere -----------------------------
  for (const [key, value] of Object.entries(style)) {
    if (NON_COLOUR_KEYS.has(key)) continue;
    if (value === null) fail(`${label}: ${key} is null`);
    else if (typeof value !== 'string' || !HEX8.test(value)) {
      fail(`${label}: ${key} is "${value}" — expected eight-digit #rrggbbaa`);
    }
  }

  // ---- syntax -------------------------------------------------------------
  const syntaxMissing = zed.syntax_keys_bundled.filter((k) => !(k in style.syntax));
  if (syntaxMissing.length) {
    fail(`${label}: missing baseline syntax tokens: ${syntaxMissing.join(', ')}`);
  }
  for (const [token, spec] of Object.entries(style.syntax)) {
    if (!spec || typeof spec !== 'object') fail(`${label}: syntax.${token} is not an object`);
    else if (!spec.color || !HEX8.test(spec.color)) {
      fail(`${label}: syntax.${token}.color is "${spec.color}" — expected #rrggbbaa`);
    }
    if (spec && spec.font_style != null && !['normal', 'italic', 'oblique'].includes(spec.font_style)) {
      fail(`${label}: syntax.${token}.font_style is "${spec.font_style}"`);
    }
    if (spec && spec.font_weight != null && typeof spec.font_weight !== 'number') {
      fail(`${label}: syntax.${token}.font_weight is not a number`);
    }
  }

  // ---- players ------------------------------------------------------------
  if (style.players.length !== 8) fail(`${label}: ${style.players.length} players, expected 8`);
  style.players.forEach((p, i) => {
    for (const field of ['cursor', 'background', 'selection']) {
      if (!p[field] || !HEX8.test(p[field])) {
        fail(`${label}: players[${i}].${field} is "${p[field]}"`);
      }
    }
    if (parse(p.selection).a >= 1) fail(`${label}: players[${i}].selection must be translucent`);
  });
  // Mutually distinguishable, and distinct from the cursor colour.
  for (let i = 0; i < style.players.length; i += 1) {
    for (let j = i + 1; j < style.players.length; j += 1) {
      const d = deltaE(style.players[i].cursor, style.players[j].cursor);
      if (d < 12) fail(`${label}: players ${i + 1} and ${j + 1} differ by only dE ${d.toFixed(1)}`);
    }
  }

  // ---- accents ------------------------------------------------------------
  if (!Array.isArray(style.accents) || style.accents.length < 8) {
    fail(`${label}: accents should hold at least 8 colours, found ${style.accents?.length}`);
  }

  // ---- terminal: 24 ANSI keys, all distinct -------------------------------
  const ansiKeys = zed.ui_keys.filter((k) => k.startsWith('terminal.ansi.') && k !== 'terminal.ansi.background');
  if (ansiKeys.length !== 24) fail(`expected 24 ANSI keys in the inventory, found ${ansiKeys.length}`);
  const seen = new Map();
  for (const key of ansiKeys) {
    const value = style[key];
    if (seen.has(value)) fail(`${label}: ${key} duplicates ${seen.get(value)} (${value})`);
    else seen.set(value, key);
  }
  // dim / normal / bright must be separable, not merely unequal.
  for (const hue of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
    const trio = {
      dim: style[`terminal.ansi.dim_${hue}`],
      normal: style[`terminal.ansi.${hue}`],
      bright: style[`terminal.ansi.bright_${hue}`],
    };
    for (const [a, b] of [['dim', 'normal'], ['normal', 'bright'], ['dim', 'bright']]) {
      const d = deltaE(trio[a], trio[b]);
      if (d < 8) fail(`${label}: ANSI ${hue} ${a} and ${b} differ by only dE ${d.toFixed(1)}`);
    }
  }

  // ---- version control states never share a hue ---------------------------
  const vcs = {
    added: style['version_control.added'],
    deleted: style['version_control.deleted'],
    modified: style['version_control.modified'],
    conflict: style['version_control.conflict'],
    renamed: style['version_control.renamed'],
  };
  const names = Object.keys(vcs);
  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      const d = deltaE(vcs[names[i]], vcs[names[j]]);
      if (d < 20) fail(`${label}: version control ${names[i]} and ${names[j]} differ by only dE ${d.toFixed(1)}`);
    }
  }

  // ---- vim mode chips are mutually distinct -------------------------------
  const modes = ['normal', 'insert', 'replace', 'visual', 'visual_line', 'visual_block', 'helix_normal', 'helix_select'];
  for (let i = 0; i < modes.length; i += 1) {
    for (let j = i + 1; j < modes.length; j += 1) {
      const d = deltaE(style[`vim.${modes[i]}.background`], style[`vim.${modes[j]}.background`]);
      if (d < 12) fail(`${label}: vim ${modes[i]} and ${modes[j]} chips differ by only dE ${d.toFixed(1)}`);
    }
  }

  notes.push(
    `${label.padEnd(28)} ${String(present.size).padStart(3)} UI keys · ` +
      `${Object.keys(style.syntax).length} syntax · ${style.players.length} players · ` +
      `${style.accents.length} accents`,
  );
}

// --------------------------------------------------------------------------
// Report
// --------------------------------------------------------------------------
console.log('Jet Fighter — coverage gate\n');
notes.forEach((n) => console.log(`  ${n}`));
console.log(
  `\n  inventory: ${zed.ui_keys.length} UI keys from zed-industries/zed@${zed.source.revision.slice(0, 7)}`,
);
console.log(
  `  One Dark populates ${zed.one_dark_ui_keys.length} of them — ` +
    `${zed.ui_keys.length - zed.one_dark_ui_keys.length} keys beyond it are covered here\n`,
);

if (failures.length) {
  console.error(`FAILED — ${failures.length} problem(s):\n`);
  failures.forEach((f) => console.error(`  · ${f}`));
  process.exit(1);
}
console.log('PASS — every key populated, no nulls, no duplicates.');
