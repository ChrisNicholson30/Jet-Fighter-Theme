/**
 * Jet Fighter — build.
 *
 * Emits `themes/jet-fighter.json`: one theme-family file holding all three
 * variants, as Zed expects.
 *
 * `--check` re-runs the build and fails if the committed file has drifted from
 * what the source produces. That is what keeps the JSON honest as a generated
 * artefact: a hand-edit to the shipped theme is a CI failure, not a surprise
 * three releases later.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { VARIANTS } from './palette.mjs';
import { buildStyle, buildPlayers, buildAccents } from './style.mjs';
import { buildSyntax } from './syntax.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const OUTPUT = resolve(here, '..', 'themes', 'jet-fighter.json');

export function buildFamily() {
  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Jet Fighter',
    author: 'Christopher Nicholson <chris@cn-design.co.uk>',
    themes: VARIANTS.map((v) => {
      const { 'background.appearance': appearanceMode, ...colors } = buildStyle(v);
      return {
        name: v.name,
        appearance: v.appearance,
        style: {
          'background.appearance': appearanceMode,
          accents: buildAccents(v),
          ...sortKeys(colors),
          players: buildPlayers(v),
          syntax: sortKeys(buildSyntax(v)),
        },
      };
    }),
  };
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

export const serialise = (family) => `${JSON.stringify(family, null, 2)}\n`;

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const out = serialise(buildFamily());
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(OUTPUT, 'utf8');
    } catch {
      console.error('themes/jet-fighter.json is missing. Run `npm run build`.');
      process.exit(1);
    }
    if (current !== out) {
      console.error('themes/jet-fighter.json is out of date with src/. Run `npm run build`.');
      process.exit(1);
    }
    console.log('themes/jet-fighter.json matches src/.');
  } else {
    writeFileSync(OUTPUT, out);
    const family = buildFamily();
    console.log(`Wrote ${OUTPUT}`);
    for (const theme of family.themes) {
      const ui = Object.keys(theme.style).filter(
        (k) => !['syntax', 'players', 'accents'].includes(k),
      ).length;
      console.log(
        `  ${theme.name.padEnd(28)} ${String(ui).padStart(3)} UI keys · ` +
          `${Object.keys(theme.style.syntax).length} syntax · ` +
          `${theme.style.players.length} players · ${theme.style.accents.length} accents`,
      );
    }
  }
}
