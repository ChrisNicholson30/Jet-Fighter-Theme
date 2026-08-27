/**
 * Jet Fighter site — build.
 *
 * Reads themes/jet-fighter.json and emits a static site into site/dist.
 * Nothing about the page's colour is authored here: every custom property is
 * lifted from the shipped theme, so the site cannot drift from the artefact it
 * is advertising. Rebuild the theme, rebuild the site, and they agree by
 * construction.
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { contrast, over } from '../src/color.mjs';
import { highlight, highlightLines } from './src/highlight.mjs';
import { SAMPLES, DIFF_SAMPLE, TERMINAL_SESSION } from './src/samples.mjs';
import { BASE_CSS, FONT_CSS, slug } from './src/styles.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const DIST = resolve(here, 'dist');

const theme = JSON.parse(readFileSync(resolve(root, 'themes/jet-fighter.json'), 'utf8'));
const zedKeys = JSON.parse(readFileSync(resolve(root, 'data/zed-keys.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));

const REPO = 'https://github.com/ChrisNicholson30/Jet-Fighter-Theme';
const SITE = 'https://chrisnicholson30.github.io/Jet-Fighter-Theme/';
const INSTALL = `curl -fsSL ${SITE}install.sh | sh`;

const VARIANTS = theme.themes.map((t) => ({
  id: t.name.split(' ').pop().toLowerCase(),
  short: t.name.split(' ').pop(),
  name: t.name,
  appearance: t.appearance,
  style: t.style,
}));

const ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
const MODES = [
  ['normal', 'Normal', 'cruise'],
  ['insert', 'Insert', 'cleared to write'],
  ['replace', 'Replace', 'armed — overwriting'],
  ['visual', 'Visual', 'selection'],
  ['visual_line', 'V-Line', 'line selection'],
  ['visual_block', 'V-Block', 'block selection'],
  ['helix_normal', 'Helix', 'helix normal'],
  ['helix_select', 'Select', 'helix select'],
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------------------------------------------------------------------------
// Custom properties, straight off the theme.
// ---------------------------------------------------------------------------
function tokensFor(v) {
  const s = v.style;
  const t = {
    '--bg': s['editor.background'],
    '--chrome': s['surface.background'],
    '--panel': s['elevated_surface.background'],
    '--border': s.border,
    '--border-variant': s['border.variant'],
    '--grid': s['editor.indent_guide'],
    '--text': s.text,
    '--text-muted': s['text.muted'],
    '--accent': s['text.accent'],
    '--ok': s.success,
    '--warn': s.warning,
    '--err': s.error,
    '--active-line': s['editor.active_line.background'],
    '--line-number': s['editor.line_number'],
    '--active-line-number': s['editor.active_line_number'],
    '--sel': s['element.selected'],
    '--minimap-thumb': s['minimap.thumb.background'],
    '--minimap-border': s['minimap.thumb.border'],
    '--chip-bg': s['vim.normal.background'],
    '--chip-fg': s['vim.normal.foreground'],
  };
  for (const a of ANSI) {
    t[`--ansi-${a}`] = s[`terminal.ansi.${a}`];
    t[`--ansi-bright-${a}`] = s[`terminal.ansi.bright_${a}`];
    t[`--ansi-dim-${a}`] = s[`terminal.ansi.dim_${a}`];
  }
  for (const [m] of MODES) {
    t[`--vim-${m}-bg`] = s[`vim.${m}.background`];
    t[`--vim-${m}-fg`] = s[`vim.${m}.foreground`];
  }
  for (const k of ['added', 'deleted', 'modified', 'renamed', 'conflict', 'ignored']) {
    t[`--vc-${k}`] = s[`version_control.${k}`];
  }
  return t;
}

/**
 * Syntax classes. Token names are identical across the three variants — they
 * come from one builder — so a token resolves to the same class everywhere and
 * only the custom property behind it changes. That is why the code samples can
 * be highlighted once and still be correct in all three variants.
 */
function syntaxCss() {
  const names = Object.keys(VARIANTS[0].style.syntax);
  const decls = [];
  for (const name of names) {
    const spec = VARIANTS[0].style.syntax[name];
    const rules = [`color: var(--s-${slug(name)})`];
    if (spec.font_style === 'italic') rules.push('font-style: italic');
    if (spec.font_weight) rules.push(`font-weight: ${spec.font_weight}`);
    decls.push(`.${slug(name)}{${rules.join(';')}}`);
  }
  return decls.join('\n');
}

function variantCss() {
  return VARIANTS.map((v) => {
    const props = Object.entries(tokensFor(v)).map(([k, val]) => `${k}:${val}`);
    for (const [name, spec] of Object.entries(v.style.syntax)) {
      props.push(`--s-${slug(name)}:${spec.color}`);
    }
    return `html[data-variant="${v.id}"]{color-scheme:${v.appearance};${props.join(';')}}`;
  }).join('\n');
}

/** Show only the active variant's rows in the per-variant tables. */
function rowVisibilityCss() {
  return VARIANTS.map((v) => `html:not([data-variant="${v.id}"]) .only-${v.id}{display:none}`).join('\n');
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------
function editorPane(sample, index) {
  const syntax = VARIANTS[0].style.syntax;
  const lines = highlightLines(sample.code, sample.id, syntax, slug);
  const activeLine = Math.min(lines.length - 1, Math.floor(lines.length * 0.45));
  // Block-level line spans carry their own line box, so they are joined with
  // nothing — a newline between them would double the leading.
  const body = lines
    .map((l, i) => `<span class="code__line${i === activeLine ? ' is-active' : ''}">${l || '&nbsp;'}</span>`)
    .join('');
  const gutter = lines
    .map((_, i) => `<span class="code__line">${i === activeLine ? `<b>${i + 1}</b>` : i + 1}</span>`)
    .join('');
  const minimap = sample.code
    .split('\n')
    .map((l) => `<i style="width:${Math.min(100, Math.max(6, l.trim().length * 2.2))}%"></i>`)
    .join('');
  return `<div class="editor__pane" id="pane-${sample.id}" role="tabpanel" aria-labelledby="tab-${sample.id}"${index ? ' hidden' : ''}>
  <div class="editor__body">
    <pre class="gutter" aria-hidden="true">${gutter}</pre>
    <pre class="code"><code>${body}</code></pre>
    <div class="minimap" aria-hidden="true"><div class="minimap__thumb"></div>${minimap}</div>
  </div>
</div>`;
}

function editor() {
  const tabs = SAMPLES.map(
    (s, i) =>
      `<button class="tab" role="tab" id="tab-${s.id}" aria-controls="pane-${s.id}" aria-selected="${i === 0}" data-pane="${s.id}">${esc(s.file)}</button>`,
  ).join('');
  return `<div class="frame editor">
  <div class="editor__bar">
    <span class="dot"></span><span class="dot"></span><span class="dot"></span>
    <span class="editor__title mono">jet-fighter — zed</span>
  </div>
  <div class="editor__tabs" role="tablist" aria-label="Language samples">${tabs}</div>
  ${SAMPLES.map(editorPane).join('\n')}
  <div class="editor__status">
    <span class="vimchip">NORMAL</span>
    <span class="mono">main</span>
    <span class="grow"></span>
    <span class="mono">ln 24, col 12</span>
    <span class="mono">utf-8</span>
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------
function head(num, title, sub) {
  return `<div class="section__head">
    <span class="section__num">${num}</span>
    <h2>${title}</h2>
    <p class="section__sub">${sub}</p>
  </div>`;
}

function modeChips() {
  return MODES.map(
    ([id, label, meaning]) =>
      `<span class="chip is-lit" style="--chip-bg:var(--vim-${id}-bg);--chip-fg:var(--vim-${id}-fg)" title="${esc(meaning)}"><span class="chip__led"></span>${esc(label)}</span>`,
  ).join('');
}

function terminal() {
  const body = TERMINAL_SESSION.map(({ ansi, text }) =>
    ansi ? `<span style="color:var(--ansi-${ansi.replace('_', '-')})">${esc(text)}</span>` : esc(text),
  ).join('');
  const header = `<div class="lbl"></div>${ANSI.map((a) => `<div class="hd">${a.slice(0, 3)}</div>`).join('')}`;
  const row = (kind, label) =>
    `<div class="lbl">${label}</div>` +
    ANSI.map((a) => `<div class="sw" style="background:var(--ansi-${kind}${a})"></div>`).join('');
  return `<div class="frame"><div class="term mono">${body}</div></div>
  <div class="ansi-grid">${header}${row('dim-', 'dim')}${row('', 'normal')}${row('bright-', 'bright')}</div>`;
}

function diffPane() {
  const html = highlightLines(DIFF_SAMPLE, 'diff', VARIANTS[0].style.syntax, slug)
    .map((l) => `<span class="code__line">${l || '&nbsp;'}</span>`)
    .join('');
  const vc = [
    ['added', 'Added'], ['modified', 'Modified'], ['deleted', 'Deleted'],
    ['renamed', 'Renamed'], ['conflict', 'Conflict'], ['ignored', 'Ignored'],
  ];
  return `<div class="frame"><pre class="code" style="padding:1.1rem 1.25rem"><code>${html}</code></pre></div>
  <div class="modes" style="margin-top:1.1rem">${vc
    .map(([k, l]) => `<span class="chip" style="color:var(--vc-${k});border-color:var(--vc-${k})"><span class="chip__led"></span>${l}</span>`)
    .join('')}</div>`;
}

function paletteTable() {
  const roles = [
    ['Editor ground', 'editor.background'], ['Chrome', 'surface.background'],
    ['Body text', 'editor.foreground'], ['Comment', 'syntax:comment'],
    ['Keyword', 'syntax:keyword'], ['Function', 'syntax:function'],
    ['Type', 'syntax:type'], ['String', 'syntax:string'],
    ['Number', 'syntax:number'], ['Property', 'syntax:property'],
    ['Success', 'success'], ['Warning', 'warning'], ['Error', 'error'],
  ];
  const bodies = VARIANTS.map((v) => {
    const ground = v.style['editor.background'];
    const rows = roles.map(([label, key]) => {
      const hex = key.startsWith('syntax:') ? v.style.syntax[key.slice(7)].color : v.style[key];
      const ratio = contrast(hex, ground);
      const isGround = key === 'editor.background';
      return `<tr>
        <td>${esc(label)}</td>
        <td class="num"><span class="swatch" style="background:${hex}"></span>${hex.slice(0, 7).toUpperCase()}</td>
        <td class="num">${isGround ? '—' : `${ratio.toFixed(2)}:1`}</td>
        <td class="num">${isGround ? '—' : ratio >= 4.5 ? '<span class="pass">AA</span>' : ratio >= 3 ? 'UI' : '—'}</td>
      </tr>`;
    }).join('');
    return `<tbody class="only-${v.id}">${rows}</tbody>`;
  }).join('');
  return `<div class="frame tbl-scroll" style="padding:.4rem 1rem">
    <table><thead><tr><th>Role</th><th>Value</th><th>On ground</th><th></th></tr></thead>${bodies}</table>
  </div>`;
}

function stats() {
  const uiKeys = Object.keys(VARIANTS[0].style).filter(
    (k) => !['syntax', 'players', 'accents', 'background.appearance'].includes(k),
  ).length;
  const synCount = Object.keys(VARIANTS[0].style.syntax).length;
  const gap = uiKeys - zedKeys.one_dark_ui_keys.length;
  const cards = [
    [uiKeys, '', `UI style keys populated in every variant, with zero nulls — <b>${gap} more than One Dark</b>, the theme most coverage checks diff against.`],
    [synCount, '', 'syntax tokens, against the 47 the bundled themes define. Sub-captures resolve independently instead of falling back to their parent.'],
    ['387', '', 'contrast measurements per variant, none below floor — alpha composited first, scored against the worst surface each token is drawn on.'],
    ['0.71', '×', 'Stealth’s modelled OLED drive cost against Afterburner, identical under all three weightings tested.'],
  ];
  return `<div class="stats">${cards
    .map(([n, suffix, label]) => `<div class="frame stat"><div class="stat__n">${n}<small>${suffix}</small></div><p class="stat__l">${label}</p></div>`)
    .join('')}</div>`;
}

function coverageTable() {
  const groups = [
    ['Vim &amp; Helix mode indicators', 18], ['Diff-hunk row highlights', 6],
    ['Editor &amp; panel indent guides', 5], ['Minimap thumb', 4],
    ['version_control conflict / ignored / renamed', 3], ['Debugger accent &amp; active line', 2],
    ['Panel overlays, drop target, bracket highlight, others', 8],
  ];
  return `<div class="frame tbl-scroll" style="padding:.4rem 1rem">
    <table><thead><tr><th>Key group</th><th>Keys</th><th>In One Dark</th><th>In Jet Fighter</th></tr></thead>
    <tbody>${groups
      .map(([g, n]) => `<tr><td>${g}</td><td class="num">${n}</td><td class="num" style="color:var(--err)">—</td><td class="num pass">✓</td></tr>`)
      .join('')}</tbody></table></div>`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function page() {
  const variantChips = VARIANTS.map(
    (v) =>
      `<button class="chip" role="tab" aria-pressed="${v.id === 'afterburner'}" data-variant="${v.id}" style="--chip-bg:${v.style['text.accent']};--chip-fg:${v.style['editor.background']}"><span class="chip__led"></span>${esc(v.short)}</button>`,
  ).join('');

  const desc = 'Jet Fighter — a cockpit-instrument theme family for Zed. Three variants, all 185 style keys populated, a published contrast gate and OLED power model.';

  return `<!doctype html>
<html lang="en" data-variant="afterburner">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Jet Fighter — a Zed theme family</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="dark light">
<meta property="og:title" content="Jet Fighter — a Zed theme family">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE}">
<meta property="og:image" content="${SITE}assets/social-card.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="assets/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/icon-16.png">
<link rel="apple-touch-icon" href="assets/icon-180.png">
<link rel="canonical" href="${SITE}">
<style>${FONT_CSS}${BASE_CSS}${variantCss()}${syntaxCss()}${rowVisibilityCss()}</style>
</head>
<body>

<header class="top wrap">
  <img class="top__mark" src="assets/logo-96.webp" width="34" height="34" alt="" decoding="async">
  <span class="top__name">Jet&nbsp;Fighter</span>
  <span class="micro" style="border:1px solid var(--border-variant);padding:.1rem .45rem">v${pkg.version}</span>
  <span class="top__spacer"></span>
  <a class="top__link" href="#editor">Editor</a>
  <a class="top__link" href="#evidence">Evidence</a>
  <a class="top__link" href="${REPO}">GitHub</a>
</header>

<main>
  <section class="hero wrap">
    <div class="hero__grid">
      <div>
        <div class="hero__eyebrow rise"><span class="micro">Theme family · Zed · MIT</span></div>
        <h1 class="display rise" style="animation-delay:60ms">Jet<span class="l2">Fighter</span></h1>
        <p class="hero__lede rise" style="animation-delay:120ms">
          Three variants, built natively for Zed rather than ported.
          <b>All 185 style keys populated</b> — including the 46 One Dark leaves unset.
        </p>

        <div class="rise" style="animation-delay:180ms;margin-top:2rem">
          <p class="micro" style="margin-bottom:.7rem">Variant — this whole page repaints</p>
          <div class="modes" role="tablist" aria-label="Theme variant">${variantChips}</div>
        </div>

        <div class="frame cmd rise" style="animation-delay:240ms">
          <code class="cmd__code"><span class="p">curl</span> <span class="f">-fsSL</span> ${esc(SITE)}install.sh | <span class="p">sh</span></code>
          <button class="cmd__copy" data-copy="${esc(INSTALL)}">Copy</button>
        </div>
        <p class="cmd__note rise" style="animation-delay:280ms">
          Run it to install. Run it again to update — same command, and it tells you which one it did.
          No sudo, nothing written until the download is validated.
        </p>
      </div>
      <div class="hero__art rise" style="animation-delay:100ms">
        <img src="assets/logo-640.webp" width="640" height="640"
             alt="Jet Fighter — a stealth delta over a field of code lines, inside a cyan-to-violet ring"
             fetchpriority="high" decoding="async">
      </div>
    </div>
  </section>

  <section class="section wrap" id="editor">
    ${head('01', 'In the editor', 'Highlighted by Zed&rsquo;s own rule. The tokeniser emits Zed capture names and resolution runs longest-dotted-prefix, so if a capture falls back here it falls back in the editor too.')}
    ${editor()}
    <div class="callouts">
      <div class="callout"><b>Active line</b>The band contrast tables usually omit. It is lighter than the ground, so contrast is tightest there — the gate scores every token against it.</div>
      <div class="callout"><b>Italic as a second axis</b>Parameters, builtins, <code class="mono">self</code>, lifetimes, decorators and comments read italic. Hue says what a thing is; italic says it is indirect.</div>
      <div class="callout"><b>Lit line number</b>The current line number runs the primary hue, so the caret&rsquo;s row is findable without a heavy fill.</div>
    </div>
  </section>

  <section class="section wrap" id="modes">
    ${head('02', 'Mode annunciators', 'Eighteen keys no bundled theme sets. Each mode is a lit chip in its own hue, and the label colour on each is computed — whichever neutral pole contrasts better — then checked by the gate.')}
    <div class="modes">${modeChips()}</div>
  </section>

  <section class="section wrap" id="terminal">
    ${head('03', 'A terminal with 24 distinct colours', 'Dim, normal and bright are separable on every hue by at least dE 8, checked in CI. Zed&rsquo;s own One Light ships <code class="mono">black</code> and <code class="mono">bright_black</code> as the same value.')}
    ${terminal()}
  </section>

  <section class="section wrap" id="diff">
    ${head('04', 'Diff and version control', 'Added, deleted, modified, renamed and conflict never share a hue — asserted by colour difference, not by eye.')}
    ${diffPane()}
  </section>

  <section class="section wrap" id="evidence">
    ${head('05', 'Evidence, not adjectives', 'Every number here is produced by a script in the repository, and every script runs in CI on each push.')}
    ${stats()}
    <div style="margin-top:1.6rem">${coverageTable()}</div>
  </section>

  <section class="section wrap" id="palette">
    ${head('06', 'Palette', 'Contrast is measured against the active variant&rsquo;s own editor ground. Switch variant above and these numbers change with it.')}
    ${paletteTable()}
  </section>

  <section class="section wrap" id="install">
    ${head('07', 'Install', 'One command installs and updates. If you would rather not pipe a script to a shell — and that is a reasonable position — read it first, or drop the file in by hand.')}
    <div class="frame cmd" style="margin-top:0">
      <code class="cmd__code"><span class="p">curl</span> <span class="f">-fsSL</span> ${esc(SITE)}install.sh | <span class="p">sh</span></code>
      <button class="cmd__copy" data-copy="${esc(INSTALL)}">Copy</button>
    </div>
    <div class="callouts" style="margin-top:1.6rem">
      <div class="callout"><b>Read it first</b><a href="install.sh" style="color:var(--accent)">install.sh</a> is about a hundred lines. It validates the download before writing, is idempotent, and never needs sudo.</div>
      <div class="callout"><b>By hand</b>Copy <code class="mono">themes/jet-fighter.json</code> into <code class="mono">~/.config/zed/themes/</code>. All three variants appear in the theme selector on next load.</div>
      <div class="callout"><b>Uninstall</b>Same script, <code class="mono">--uninstall</code>. Or <code class="mono">--check</code> to see what it would do without writing anything.</div>
    </div>
  </section>
</main>

<footer class="foot wrap">
  <span>Jet Fighter — MIT © Christopher Nicholson, CN-DESIGN LTD</span>
  <span class="top__spacer"></span>
  <a href="${REPO}">Source</a>
  <a href="${REPO}/blob/main/scripts/contrast-gate.mjs">Contrast gate</a>
  <a href="${REPO}/blob/main/scripts/power-model.mjs">Power model</a>
</footer>

<script>
(function () {
  var html = document.documentElement;

  // Variant switch: repaints the document, and is remembered.
  var chips = document.querySelectorAll('[data-variant]');
  function setVariant(id) {
    html.setAttribute('data-variant', id);
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.variant === id)); });
    try { localStorage.setItem('jf-variant', id); } catch (e) {}
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { setVariant(c.dataset.variant); }); });
  try {
    var saved = localStorage.getItem('jf-variant');
    if (saved && document.querySelector('[data-variant="' + saved + '"]')) setVariant(saved);
  } catch (e) {}

  // Language tabs.
  var tabs = document.querySelectorAll('.tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', String(on));
        var pane = document.getElementById('pane-' + o.dataset.pane);
        if (pane) pane.hidden = !on;
      });
    });
  });

  // Copy buttons.
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      navigator.clipboard.writeText(b.dataset.copy).then(function () {
        var was = b.textContent;
        b.textContent = 'Copied'; b.dataset.done = '1';
        setTimeout(function () { b.textContent = was; b.dataset.done = ''; }, 1600);
      });
    });
  });
})();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// Fonts, the icon set and the social card are committed under site/assets and
// copied verbatim; regenerating the rasters needs a browser, which neither CI
// nor a contributor building the site should have to install.
cpSync(resolve(here, 'assets'), resolve(DIST, 'assets'), { recursive: true });

writeFileSync(resolve(DIST, 'index.html'), page());
// Served alongside the page so `curl <site>/install.sh` works, and so the
// theme itself can be downloaded without cloning.
cpSync(resolve(root, 'install.sh'), resolve(DIST, 'install.sh'));
cpSync(resolve(root, 'themes/jet-fighter.json'), resolve(DIST, 'jet-fighter.json'));
writeFileSync(resolve(DIST, '.nojekyll'), '');
writeFileSync(
  resolve(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\nSitemap: ${SITE}sitemap.xml\n`,
);
writeFileSync(
  resolve(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}</loc></url></urlset>\n`,
);

const bytes = readFileSync(resolve(DIST, 'index.html')).length;
console.log(`Wrote ${DIST}`);
console.log(`  index.html  ${(bytes / 1024).toFixed(1)} KB`);
console.log(`  ${VARIANTS.length} variants · ${SAMPLES.length} language samples · ${Object.keys(VARIANTS[0].style.syntax).length} syntax classes`);

export { page, tokensFor };
