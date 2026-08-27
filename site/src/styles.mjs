/**
 * Jet Fighter site — stylesheet.
 *
 * Every colour on this page is a custom property lifted from
 * themes/jet-fighter.json at build time. There is no separate site palette,
 * so the page cannot show a colour the theme does not ship, and switching
 * variant repaints the whole document rather than a preview pane.
 */

export const FONT_CSS = `
@font-face { font-family: 'Saira Cond'; src: url('assets/fonts/sairacond-700-normal.woff2') format('woff2'); font-weight: 700; font-display: swap; }
@font-face { font-family: 'Saira Cond'; src: url('assets/fonts/sairacond-800-normal.woff2') format('woff2'); font-weight: 800; font-display: swap; }
@font-face { font-family: 'Saira'; src: url('assets/fonts/saira-var-normal.woff2') format('woff2'); font-weight: 300 700; font-display: swap; }
@font-face { font-family: 'Plex Mono'; src: url('assets/fonts/plexmono-400-normal.woff2') format('woff2'); font-weight: 400; font-display: swap; }
@font-face { font-family: 'Plex Mono'; src: url('assets/fonts/plexmono-400-italic.woff2') format('woff2'); font-weight: 400; font-style: italic; font-display: swap; }
@font-face { font-family: 'Plex Mono'; src: url('assets/fonts/plexmono-500-normal.woff2') format('woff2'); font-weight: 500; font-display: swap; }
@font-face { font-family: 'Plex Mono'; src: url('assets/fonts/plexmono-600-normal.woff2') format('woff2'); font-weight: 600; font-display: swap; }
`;

export const BASE_CSS = String.raw`
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
body, h1, h2, h3, p, ul, ol, figure, pre { margin: 0; padding: 0; }
ul, ol { list-style: none; }
img, svg { display: block; max-width: 100%; }
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; }
a { color: inherit; }

:root {
  --step--1: clamp(.72rem, .70rem + .10vw, .78rem);
  --step-0:  clamp(.94rem, .90rem + .18vw, 1.02rem);
  --step-1:  clamp(1.15rem, 1.05rem + .45vw, 1.40rem);
  --step-2:  clamp(1.55rem, 1.30rem + 1.10vw, 2.30rem);
  --step-3:  clamp(2.40rem, 1.60rem + 3.60vw, 5.20rem);
  --gut: clamp(1.15rem, .70rem + 2.0vw, 3rem);
  --rule: 1px;
  --ease: cubic-bezier(.22, .68, .24, 1);
  --swap: 480ms var(--ease);
}

body {
  font-family: 'Saira', ui-sans-serif, system-ui, sans-serif;
  font-size: var(--step-0);
  line-height: 1.62;
  background: var(--bg);
  color: var(--text);
  font-feature-settings: 'tnum' 1;
  overflow-x: hidden;
  transition: background-color var(--swap), color var(--swap);
}

/* Instrument-panel grid, sitting under everything. */
body::before {
  content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background-image:
    linear-gradient(var(--grid) var(--rule), transparent var(--rule)),
    linear-gradient(90deg, var(--grid) var(--rule), transparent var(--rule));
  background-size: 72px 72px;
  mask-image: radial-gradient(ellipse 120% 80% at 50% 0%, #000 20%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 120% 80% at 50% 0%, #000 20%, transparent 78%);
}
body > * { position: relative; z-index: 1; }

/* ------------------------------------------------------------ primitives */
.wrap { width: min(1180px, 100% - var(--gut) * 2); margin-inline: auto; }

.micro {
  font-size: .625rem; font-weight: 600; letter-spacing: .22em;
  text-transform: uppercase; color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  transition: color var(--swap);
}

.display {
  font-family: 'Saira Cond', 'Saira', sans-serif;
  font-weight: 800; line-height: .86; letter-spacing: -.015em;
  text-transform: uppercase;
}

.mono { font-family: 'Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; }

/* Corner brackets — drawn in background gradients, so no extra DOM. */
.frame {
  position: relative;
  border: var(--rule) solid var(--border-variant);
  background-color: var(--chrome);
  background-image:
    linear-gradient(var(--accent), var(--accent)), linear-gradient(var(--accent), var(--accent)),
    linear-gradient(var(--accent), var(--accent)), linear-gradient(var(--accent), var(--accent)),
    linear-gradient(var(--accent), var(--accent)), linear-gradient(var(--accent), var(--accent)),
    linear-gradient(var(--accent), var(--accent)), linear-gradient(var(--accent), var(--accent));
  background-repeat: no-repeat;
  background-size: 13px var(--rule), var(--rule) 13px, 13px var(--rule), var(--rule) 13px,
                   13px var(--rule), var(--rule) 13px, 13px var(--rule), var(--rule) 13px;
  background-position:
    left top, left top, right top, right top,
    left bottom, left bottom, right bottom, right bottom;
  transition: background-color var(--swap), border-color var(--swap);
}

.rule { height: var(--rule); background: var(--border-variant); border: 0; transition: background-color var(--swap); }

/* --------------------------------------------------------------- header */
.top {
  display: flex; align-items: center; gap: 1rem;
  padding: 1.05rem 0; border-bottom: var(--rule) solid var(--border-variant);
  transition: border-color var(--swap);
}
.top__mark { width: 34px; height: 34px; flex: none; border-radius: 50%; }
.top__name { font-family: 'Saira Cond', sans-serif; font-weight: 800; font-size: 1.06rem; letter-spacing: .06em; text-transform: uppercase; }
.top__spacer { flex: 1; }
.top__link {
  text-decoration: none; font-size: .78rem; font-weight: 600; letter-spacing: .1em;
  text-transform: uppercase; color: var(--text-muted); padding: .3rem .1rem;
  border-bottom: 1px solid transparent; transition: color .2s, border-color .2s;
}
.top__link:hover { color: var(--accent); border-bottom-color: var(--accent); }
/* On narrow screens the in-page anchors are redundant — the sections are a
   scroll away — so only the outbound link survives. */
@media (max-width: 640px) {
  .top__link[href^="#"] { display: none; }
  .top { gap: .7rem; }
}

/* ----------------------------------------------------------------- hero */
.hero { padding: clamp(2.6rem, 6vw, 5.5rem) 0 clamp(2rem, 4vw, 3.4rem); }
.hero__grid { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: clamp(1.5rem, 4vw, 4rem); align-items: center; }
@media (max-width: 860px) { .hero__grid { grid-template-columns: minmax(0, 1fr); } .hero__art { order: -1; } }

.hero__eyebrow { display: flex; align-items: center; gap: .8rem; margin-bottom: 1.6rem; }
.hero__eyebrow::after { content: ''; flex: 1; height: var(--rule); background: var(--border-variant); transition: background-color var(--swap); }

.hero h1 { font-size: var(--step-3); margin-bottom: 1.35rem; }
.hero h1 .l2 { display: block; color: var(--accent); transition: color var(--swap); }

.hero__lede { font-size: var(--step-1); max-width: 46ch; color: var(--text); font-weight: 300; }
.hero__lede b { font-weight: 600; color: var(--accent); transition: color var(--swap); }

.hero__art { position: relative; width: clamp(190px, 26vw, 310px); aspect-ratio: 1; }
/* The mark is a badge on a black ground, so it is masked to its own circle —
   without this the artwork's square corners read as a black box on Contrail. */
.hero__art img {
  width: 100%; height: 100%; border-radius: 50%;
  box-shadow: 0 0 52px -6px color-mix(in srgb, var(--accent) 34%, transparent);
}
.hero__art::after {
  content: ''; position: absolute; inset: -6%; border-radius: 50%;
  border: var(--rule) dashed var(--border-variant); opacity: .55;
  animation: spin 96s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ------------------------------------------------------------- annunciators */
.modes { display: flex; flex-wrap: wrap; gap: .5rem; }
.chip {
  display: inline-flex; align-items: center; gap: .55rem;
  padding: .42rem .85rem; border: var(--rule) solid var(--border-variant);
  font-family: 'Plex Mono', monospace; font-size: .68rem; font-weight: 600;
  letter-spacing: .16em; text-transform: uppercase; color: var(--text-muted);
  background: transparent; transition: all .28s var(--ease);
}
.chip__led { width: 7px; height: 7px; flex: none; border-radius: 1px; background: currentColor; opacity: .45; }
.chip[aria-pressed='true'], .chip.is-lit {
  color: var(--chip-fg); background: var(--chip-bg); border-color: var(--chip-bg);
  box-shadow: 0 0 22px -4px var(--chip-bg);
}
.chip[aria-pressed='true'] .chip__led, .chip.is-lit .chip__led { opacity: 1; }
.chip:hover:not([aria-pressed='true']) { color: var(--text); border-color: var(--text-muted); }
.chip:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ---------------------------------------------------------------- install */
.cmd { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: stretch; margin-top: 2.2rem; max-width: 760px; }
.cmd__code {
  padding: .95rem 1.1rem; font-family: 'Plex Mono', monospace; font-size: clamp(.66rem, .52rem + .42vw, .8rem);
  overflow-x: auto; white-space: nowrap; color: var(--text); scrollbar-width: thin;
}
.cmd__code .p { color: var(--ok); }
.cmd__code .f { color: var(--text-muted); }
.cmd__copy {
  padding: 0 1.15rem; border-left: var(--rule) solid var(--border-variant);
  font-size: .66rem; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
  color: var(--text-muted); transition: color .2s, background-color .2s;
}
.cmd__copy:hover { color: var(--bg); background: var(--accent); }
.cmd__copy[data-done='1'] { color: var(--ok); }
.cmd__note { margin-top: .75rem; font-size: .82rem; color: var(--text-muted); max-width: 64ch; }

/* --------------------------------------------------------------- sections */
.section { padding: clamp(3rem, 7vw, 6rem) 0; }
.section__head { display: grid; grid-template-columns: auto 1fr; gap: 1.1rem; align-items: baseline; margin-bottom: 2.2rem; }
.section__num { font-family: 'Plex Mono', monospace; font-size: .72rem; color: var(--accent); transition: color var(--swap); }
.section h2 { font-size: var(--step-2); font-family: 'Saira Cond', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: -.01em; line-height: 1; }
.section__sub { grid-column: 2; color: var(--text-muted); max-width: 68ch; font-size: var(--step-0); transition: color var(--swap); }

/* ----------------------------------------------------------------- editor */
.editor { overflow: hidden; }
.editor__bar { display: flex; align-items: center; gap: .6rem; padding: .55rem .85rem; background: var(--chrome); border-bottom: var(--rule) solid var(--border-variant); }
.dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border); }
.editor__title { font-size: .72rem; color: var(--text-muted); margin-left: .35rem; }
.editor__tabs { display: flex; background: var(--chrome); border-bottom: var(--rule) solid var(--border-variant); overflow-x: auto; scrollbar-width: none; }
.editor__tabs::-webkit-scrollbar { display: none; }
.tab {
  padding: .58rem 1.05rem; font-size: .76rem; color: var(--text-muted); white-space: nowrap;
  border-right: var(--rule) solid var(--border-variant); transition: all .22s var(--ease);
}
.tab[aria-selected='true'] { background: var(--bg); color: var(--text); box-shadow: inset 0 2px 0 var(--accent); }
.tab:hover[aria-selected='false'] { color: var(--text); }

.editor__body { display: grid; grid-template-columns: auto 1fr auto; background: var(--bg); transition: background-color var(--swap); }
.gutter {
  padding: 1rem .85rem 1rem 1.1rem; text-align: right; user-select: none;
  font-family: 'Plex Mono', monospace; font-size: .78rem; line-height: 1.65;
  color: var(--line-number); background: var(--bg);
  transition: color var(--swap), background-color var(--swap);
}
.gutter b { color: var(--active-line-number); font-weight: 400; transition: color var(--swap); }
.code {
  position: relative; padding: 1rem 1.2rem; overflow-x: auto; margin: 0;
  font-family: 'Plex Mono', monospace; font-size: .78rem; line-height: 1.65;
  tab-size: 4; scrollbar-width: thin;
}
.code__line { display: block; min-height: 1.65em; }
.code__line.is-active { background: var(--active-line); box-shadow: -1.2rem 0 0 var(--active-line), 100vw 0 0 var(--active-line); }
.minimap { position: relative; width: 52px; padding: 1rem .5rem; background: var(--bg); border-left: var(--rule) solid var(--border-variant); display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
.minimap__thumb { position: absolute; left: 0; right: 0; top: .6rem; height: 32%; background: var(--minimap-thumb); border: var(--rule) solid var(--minimap-border); pointer-events: none; }
.minimap i { display: block; height: 2px; border-radius: 1px; background: var(--text-muted); opacity: .3; }
@media (max-width: 720px) { .minimap { display: none; } .editor__body { grid-template-columns: auto 1fr; } }

.editor__status { display: flex; align-items: center; gap: .8rem; padding: .42rem .85rem; background: var(--chrome); border-top: var(--rule) solid var(--border-variant); font-size: .68rem; color: var(--text-muted); }
.editor__status .grow { flex: 1; }
.vimchip { font-family: 'Plex Mono', monospace; font-weight: 600; font-size: .62rem; letter-spacing: .14em; padding: .12rem .5rem; color: var(--chip-fg); background: var(--chip-bg); }

.callouts { display: grid; gap: .9rem; margin-top: 1.4rem; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); }
.callout { padding-left: .9rem; border-left: 2px solid var(--accent); font-size: .84rem; color: var(--text-muted); transition: border-color var(--swap), color var(--swap); }
.callout b { display: block; color: var(--text); font-weight: 600; font-size: .74rem; letter-spacing: .1em; text-transform: uppercase; margin-bottom: .15rem; }

/* --------------------------------------------------------------- terminal */
.term { padding: 1.1rem 1.25rem; font-family: 'Plex Mono', monospace; font-size: .78rem; line-height: 1.6; background: var(--bg); overflow-x: auto; white-space: pre; transition: background-color var(--swap); }
.ansi-grid { display: grid; grid-template-columns: auto repeat(8, minmax(0, 1fr)); gap: 3px; margin-top: 1.2rem; align-items: center; }
.ansi-grid .lbl { font-size: .58rem; letter-spacing: .14em; text-transform: uppercase; color: var(--text-muted); padding-right: .5rem; }
.ansi-grid .hd { font-size: .54rem; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); text-align: center; }
.ansi-grid .sw { height: 30px; }

/* ------------------------------------------------------------------ stats */
.stats { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); }
.stat { padding: 1.35rem 1.25rem; }
.stat__n { font-family: 'Saira Cond', sans-serif; font-weight: 800; font-size: clamp(2.5rem, 6vw, 3.9rem); line-height: .9; color: var(--accent); transition: color var(--swap); }
.stat__n small { font-size: .46em; letter-spacing: .02em; vertical-align: .08em; opacity: .8; }
.stat__l { margin-top: .55rem; font-size: .84rem; color: var(--text-muted); }

/* ----------------------------------------------------------------- tables */
.tbl-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .82rem; }
th, td { text-align: left; padding: .6rem .7rem; border-bottom: var(--rule) solid var(--border-variant); white-space: nowrap; }
th { font-size: .6rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
td.num { font-family: 'Plex Mono', monospace; font-variant-numeric: tabular-nums; }
.swatch { display: inline-block; width: 13px; height: 13px; margin-right: .55rem; vertical-align: -2px; border: var(--rule) solid var(--border-variant); }
.pass { color: var(--ok); }

/* ---------------------------------------------------------------- footer */
.foot { padding: 2.6rem 0 3.4rem; border-top: var(--rule) solid var(--border-variant); color: var(--text-muted); font-size: .84rem; display: flex; flex-wrap: wrap; gap: 1rem 2rem; align-items: center; }
.foot a { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; }
.foot a:hover { border-bottom-color: var(--accent); }

/* ------------------------------------------------------------- page load */
.rise { animation: rise .75s var(--ease) backwards; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
`;

/** Slugify a Zed capture name into a class-safe token. */
export const slug = (name) => `t-${name.replace(/\./g, '-')}`;
