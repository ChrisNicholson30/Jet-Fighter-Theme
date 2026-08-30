#!/usr/bin/env node
/**
 * Jet Fighter — contrast gate.
 *
 * Turns "accessible" from a claim into a build failure.
 *
 * Three things here are not standard practice and are the reason the numbers
 * can be trusted:
 *
 *  1. Alpha is composited before measuring. Most of this theme's UI colours are
 *     translucent; checking a token against its nominal hex rather than the
 *     pixel it actually produces is the commonest way an "accessible" theme is
 *     quietly wrong.
 *  2. Every token is measured against the surface it is really drawn on, and
 *     where a token appears on more than one surface it is scored on the worst
 *     of them. Syntax is checked against the active-line band as well as the
 *     editor ground, because the active line is lighter and that is where
 *     contrast is tightest.
 *  3. Nothing is unchecked. Tokens that are meant to recede — ghost text,
 *     disabled states, ignored files — are not exempted, they are held to a
 *     lower, named floor. A gate with a blanket 4.5 and a silent exemption
 *     list is theatre.
 *
 * Usage:
 *   node scripts/contrast-gate.mjs             check, exit non-zero on failure
 *   node scripts/contrast-gate.mjs --table     emit the README contrast table
 *   node scripts/contrast-gate.mjs --self-test prove the gate can fail
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { contrast, over, hueDrift, deltaE, hsl } from '../src/color.mjs';
import { HUE_PAIRS, HEAT_RAMP } from '../src/palette.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/** Floors, in full. Every checked token lands in exactly one of these. */
export const TIERS = {
  body: { min: 4.5, why: 'read to do the work — syntax, body text, diagnostics, terminal' },
  ui: { min: 3.0, why: 'deliberately recessive — ghost text, line numbers, invisibles, dim ANSI' },
  deemphasis: { min: 1.9, why: 'must read as unavailable — disabled states' },
  // One end of the ANSI ramp always matches the terminal ground: black on a
  // dark terminal, white on a light one. Contrast against the ground is simply
  // the wrong measure for it — a readable "black" on a black terminal would
  // not be black. What matters is that the three steps stay separable from each
  // other, and that is enforced as a colour-difference check in
  // scripts/key-coverage.mjs rather than pretended at here.
  pole: { min: 1.1, why: 'the ANSI ramp end that matches the ground; separability is checked instead' },
};

const RECESSIVE = new Set([
  'text.placeholder', 'icon.placeholder', 'editor.line_number', 'editor.hover_line_number',
  'editor.invisible', 'predictive', 'ignored', 'hidden', 'unreachable', 'hint',
  'version_control.ignored', 'terminal.dim_foreground',
]);
const DISABLED = new Set(['text.disabled', 'icon.disabled']);
const RECESSIVE_SYNTAX = new Set(['predictive', 'comment.unused', 'hint']);

function tierFor(key, { light }) {
  if (DISABLED.has(key)) return 'deemphasis';
  if (RECESSIVE.has(key)) return 'ui';
  const groundPole = light ? 'white' : 'black';
  if (new RegExp(`^terminal\\.ansi\\.(bright_|dim_)?${groundPole}$`).test(key)) return 'pole';
  if (key.startsWith('terminal.ansi.dim_')) return 'ui';
  return 'body';
}

function checksFor(theme) {
  const s = theme.style;
  const light = theme.appearance === 'light';
  const editor = s['editor.background'];
  const chrome = s['surface.background'];
  const elevated = s['elevated_surface.background'];
  const terminal = s['terminal.background'];
  // The active line is a lighter band under the editor ground; syntax sitting
  // on it has less contrast than syntax on the ground, so it is the real floor.
  const activeLine = over(s['editor.active_line.background'], editor);
  const out = [];

  const add = (key, fg, surfaces, tier = tierFor(key, { light })) => {
    for (const [surfaceName, bg] of surfaces) {
      out.push({ key, fg, surface: surfaceName, bg, ratio: contrast(fg, bg), tier });
    }
  };

  const EDITOR_SURFACES = [['editor', editor], ['active line', activeLine]];
  const CHROME_SURFACES = [['chrome', chrome], ['elevated', elevated]];

  // Syntax — on the editor ground and on the active-line band.
  for (const [token, spec] of Object.entries(s.syntax)) {
    const tier = RECESSIVE_SYNTAX.has(token) ? 'ui' : 'body';
    add(`syntax.${token}`, spec.color, EDITOR_SURFACES, tier);
  }

  // Editor chrome text.
  for (const key of ['editor.foreground', 'editor.line_number', 'editor.active_line_number',
    'editor.hover_line_number', 'editor.invisible']) {
    add(key, s[key], EDITOR_SURFACES);
  }

  // UI text and icons, on both chrome planes.
  for (const key of ['text', 'text.muted', 'text.placeholder', 'text.disabled', 'text.accent',
    'icon', 'icon.muted', 'icon.placeholder', 'icon.disabled', 'icon.accent', 'link_text.hover']) {
    add(key, s[key], CHROME_SURFACES);
  }

  // Status colours appear as panel text and as inline editor diagnostics.
  for (const key of ['error', 'warning', 'success', 'info', 'hint', 'created', 'deleted',
    'modified', 'renamed', 'conflict']) {
    add(key, s[key], [...CHROME_SURFACES, ['editor', editor]]);
  }
  // These four are only ever drawn where they are actually drawn: ghost text
  // and unreachable code live in the buffer, ignored and hidden entries live in
  // the project panel. Scoring them against surfaces they never touch would
  // inflate the colours for no reader's benefit.
  for (const key of ['predictive', 'unreachable']) add(key, s[key], EDITOR_SURFACES);
  for (const key of ['ignored', 'hidden']) add(key, s[key], CHROME_SURFACES);

  // Version control shows in the gutter and in the git panel.
  for (const key of ['version_control.added', 'version_control.deleted', 'version_control.modified',
    'version_control.renamed', 'version_control.conflict', 'version_control.ignored']) {
    add(key, s[key], [['editor', editor], ['chrome', chrome]]);
  }

  // Terminal.
  for (const key of Object.keys(s)) {
    if (key.startsWith('terminal.ansi.') && key !== 'terminal.ansi.background') {
      add(key, s[key], [['terminal', terminal]]);
    }
  }
  for (const key of ['terminal.foreground', 'terminal.bright_foreground', 'terminal.dim_foreground']) {
    add(key, s[key], [['terminal', terminal]]);
  }

  // Vim mode chips: the label is checked against its own chip.
  for (const m of ['normal', 'insert', 'replace', 'visual', 'visual_line', 'visual_block',
    'helix_normal', 'helix_select']) {
    add(`vim.${m}.foreground`, s[`vim.${m}.foreground`], [[`vim.${m} chip`, s[`vim.${m}.background`]]]);
  }
  add('vim.helix_jump_label.foreground', s['vim.helix_jump_label.foreground'], EDITOR_SURFACES);

  return out;
}

function run(theme) {
  const checks = checksFor(theme);
  const failures = checks.filter((c) => c.ratio < TIERS[c.tier].min);
  return { checks, failures };
}

// --------------------------------------------------------------------------
function main() {
  const theme = JSON.parse(readFileSync(resolve(root, 'themes/jet-fighter.json'), 'utf8'));
  const wantTable = process.argv.includes('--table');
  const selfTest = process.argv.includes('--self-test');

  if (selfTest) {
    // STK-004's proof: point the keyword token at #7C3AED — the swatch value
    // the brief rules out for text at 3.37:1 — and require the gate to catch it.
    const rigged = JSON.parse(JSON.stringify(theme));
    rigged.themes[0].style.syntax.keyword.color = '#7c3aedff';
    const { failures } = run(rigged.themes[0]);
    const caught = failures.some((f) => f.key === 'syntax.keyword');
    console.log(
      caught
        ? `self-test PASS — gate rejects syntax.keyword at #7C3AED ` +
            `(${failures.find((f) => f.key === 'syntax.keyword').ratio.toFixed(2)}:1)`
        : 'self-test FAIL — gate did not reject a known-bad keyword colour',
    );
    process.exit(caught ? 0 : 1);
  }

  let failed = 0;
  const rows = [];
  console.log('Jet Fighter — contrast gate\n');
  console.log('  floors: ' + Object.entries(TIERS).map(([n, t]) => `${n} ${t.min}:1`).join(' · ') + '\n');

  for (const theme_ of theme.themes) {
    const { checks, failures } = run(theme_);
    failed += failures.length;
    const worst = [...checks].sort((a, b) => a.ratio / TIERS[a.tier].min - b.ratio / TIERS[b.tier].min);
    const body = checks.filter((c) => c.tier === 'body');
    console.log(`  ${theme_.name}`);
    console.log(`    ${checks.length} measurements · ${failures.length} below floor`);
    console.log(
      `    body-tier minimum ${Math.min(...body.map((c) => c.ratio)).toFixed(2)}:1 ` +
        `(${body.length} tokens at 4.5 or better)`,
    );
    console.log('    tightest:');
    for (const c of worst.slice(0, 5)) {
      console.log(
        `      ${c.key.padEnd(34)} on ${c.surface.padEnd(12)} ` +
          `${c.ratio.toFixed(2).padStart(6)}:1  floor ${TIERS[c.tier].min}`,
      );
    }
    if (failures.length) {
      console.log('    FAILURES:');
      for (const f of failures) {
        console.log(
          `      ${f.key.padEnd(34)} on ${f.surface.padEnd(12)} ` +
            `${f.ratio.toFixed(2).padStart(6)}:1  floor ${TIERS[f.tier].min}`,
        );
      }
    }
    console.log('');
    rows.push({ name: theme_.name, checks, failures });
  }

  // Contrail must still read as the same theme: hue drift against the dark
  // counterparts is asserted, not eyeballed.
  console.log('  Contrail hue drift against Afterburner (gate: 5 degrees)');
  let driftFail = 0;
  for (const [role, dark, lightHex] of HUE_PAIRS) {
    const d = hueDrift(dark, lightHex);
    if (d > 5) driftFail += 1;
    console.log(`    ${role.padEnd(12)} ${dark} -> ${lightHex}  ${d.toFixed(2).padStart(5)} deg`);
  }
  console.log('');

  // Hyperjet reassigns roles, so hue drift against Afterburner is the wrong
  // question for it. The claim it makes instead is that severity runs down the
  // heat ramp — gold nominal, orange caution, red danger — and that is checked
  // here against the shipped file rather than against the palette constant, so
  // it is an assertion about what installs.
  console.log('  Hyperjet heat ramp (gate: hue falls toward red, steps dE 20 apart)');
  let rampFail = 0;
  const hyperjet = theme.themes.find((t) => t.name === 'Jet Fighter Hyperjet');
  if (!hyperjet) {
    console.log('    Hyperjet is not in the shipped file.');
    rampFail += 1;
  } else {
    // Signed angle from red, so a hue just past red reads as negative rather
    // than as 350-odd degrees and the ordering stays monotonic across the wrap.
    const fromRed = (hex) => ((hsl(hex).h + 180) % 360) - 180;
    const SHIPS_AS = { nominal: 'info', caution: 'warning', danger: 'error' };
    let previous = Infinity;
    for (const [step, hex] of HEAT_RAMP) {
      const shipped = hyperjet.style[SHIPS_AS[step]].slice(0, 7).toLowerCase();
      const same = shipped === hex.toLowerCase();
      const angle = fromRed(hex);
      if (!same || angle >= previous) rampFail += 1;
      console.log(
        `    ${step.padEnd(8)} ${hex} -> ${SHIPS_AS[step].padEnd(8)} ` +
          `${angle.toFixed(1).padStart(6)} deg from red` +
          `${same ? '' : `  <-- ships as ${shipped}`}` +
          `${angle >= previous ? '  <-- out of order' : ''}`,
      );
      previous = angle;
    }
    for (let i = 1; i < HEAT_RAMP.length; i += 1) {
      const d = deltaE(HEAT_RAMP[i - 1][1], HEAT_RAMP[i][1]);
      if (d < 20) {
        rampFail += 1;
        console.log(`    ${HEAT_RAMP[i - 1][0]} and ${HEAT_RAMP[i][0]} differ by only dE ${d.toFixed(1)}`);
      }
    }
  }
  console.log('');

  // No two syntax hues may collapse into each other in running code.
  console.log('  Closest syntax hue pair per variant (gate: dE 8)');
  let deFail = 0;
  for (const t of theme.themes) {
    const uniq = [...new Set(Object.values(t.style.syntax).map((x) => x.color))];
    let worst = [Infinity, '', ''];
    for (let i = 0; i < uniq.length; i += 1) {
      for (let j = i + 1; j < uniq.length; j += 1) {
        const d = deltaE(uniq[i], uniq[j]);
        if (d < worst[0]) worst = [d, uniq[i], uniq[j]];
      }
    }
    if (worst[0] < 8) deFail += 1;
    console.log(`    ${t.name.padEnd(28)} ${worst[1]} vs ${worst[2]}  dE ${worst[0].toFixed(1)}`);
  }
  console.log('');

  if (wantTable) emitTable(rows, theme);

  if (failed || driftFail || deFail || rampFail) {
    console.error(
      `FAILED — ${failed} contrast, ${driftFail} hue drift, ${deFail} hue collision, ` +
        `${rampFail} heat ramp.`,
    );
    process.exit(1);
  }
  console.log('PASS — every token clears its floor on every surface it is drawn on.');
}

function emitTable(rows) {
  console.log('--- README table ---\n');
  console.log('| Variant | Measurements | Body-tier minimum | Below floor |');
  console.log('|---|---|---|---|');
  for (const r of rows) {
    const body = r.checks.filter((c) => c.tier === 'body');
    console.log(
      `| ${r.name} | ${r.checks.length} | ${Math.min(...body.map((c) => c.ratio)).toFixed(2)}:1 | ${r.failures.length} |`,
    );
  }
  console.log('');
}

main();
