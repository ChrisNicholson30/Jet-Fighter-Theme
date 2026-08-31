# Jet Fighter

A cockpit-instrument theme family for [Zed](https://zed.dev). Four variants,
one file, every key populated.

| | | |
|---|---|---|
| **Afterburner** | dark | the reference build, on `#0B0F14` |
| **Stealth** | OLED | true black, measured at **0.71×** Afterburner's modelled drive cost |
| **Contrail** | light | daylight legibility — and honestly not a power saving |
| **Hyperjet** | special | warm dark — the palette rotated onto a heat ramp, on an exhaust-hue ground |

Built natively for Zed rather than ported from a VS Code theme, which is most
of what follows.

---

## Install

One command. Run it to install, run it again to update — it is the same command
either way, and it tells you which one it did.

```sh
curl -fsSL https://chrisnicholson30.github.io/Jet-Fighter-Theme/install.sh | sh
```

Then pick a variant: `cmd-shift-p` → `theme selector`.

[`install.sh`](install.sh) is about a hundred lines and worth reading before you
pipe it to a shell. It validates the download before writing anything, replaces
the file atomically, never needs `sudo`, and takes `--check` (report only),
`--uninstall`, and `JF_REF` to pin a git ref.

<details>
<summary>Other ways in</summary>

**From the extension registry** — `zed: extensions`, search *Jet Fighter*.

**By hand** — drop `themes/jet-fighter.json` into `~/.config/zed/themes/`.

**As a dev extension** — `zed: install dev extension`, then choose this directory.

</details>

---

## Why this one is different

Four things, each of them checkable rather than asserted.

### 1. Every key the schema accepts, not every key One Dark has

Zed's theme schema accepts **185 UI style keys**. One Dark — the theme almost
every third-party theme is derived from, and the one every coverage checklist
says to diff against — populates **139** of them.

The other 46 are the newest and most Zed-specific keys, and they are exactly the
ones a VS Code port cannot know about because VS Code has no concept of them:

| Group | Keys | In One Dark |
|---|---|---|
| Vim & Helix mode indicators | 18 | ✗ |
| Diff-hunk row highlights (filled + hollow) | 6 | ✗ |
| Editor & panel indent guides | 5 | ✗ |
| Minimap thumb | 4 | ✗ |
| `version_control.conflict` / `.ignored` / `.renamed` | 3 | ✗ |
| Debugger accent & active line | 2 | ✗ |
| Panel overlays, drop-target border, bracket highlight, others | 8 | ✗ |

Jet Fighter populates all 185, in all four variants, with **zero `null`s**. It
also populates `accents`, the indent-guide colour array that One Dark leaves
empty — without it, indent-aware guide colouring falls back to Zed's built-in
ramp, which has nothing to do with the active theme.

The inventory is extracted from the Zed source and vendored at
[`data/zed-keys.json`](data/zed-keys.json) with the revision it came from. See
[`scripts/sync-zed-keys.md`](scripts/sync-zed-keys.md) to regenerate it.

### 2. Syntax that actually resolves

Zed resolves a highlight capture by **longest dotted prefix**: `keyword.control`
falls back to `keyword`, `function.method.call` to `function.method` then
`function`. The 47 tokens the bundled themes define therefore *work* — but every
capture that falls back is a capture rendering in its parent's colour.

Jet Fighter defines **134**, covering the sub-captures Zed's own grammars emit.
Decorators stop looking like calls. Builtin types stop looking like your types.
JSON keys stop looking like string values.

Two axes carry meaning, not one:

- **hue** — what kind of thing this is
- **italic** — the indirect: parameters, builtins, `self`, lifetimes, decorators, comments

### 3. Vim and Helix modes as annunciator lights

Eighteen keys no bundled theme sets. Each mode gets a lit chip in its own hue,
and the label colour on each chip is *computed* — whichever neutral pole
contrasts better — then checked by the gate, so no mode indicator ships with an
illegible label.

| Mode | Chip | Reading |
|---|---|---|
| `NORMAL` | primary — sky | cruise |
| `INSERT` | success — emerald | cleared to write |
| `REPLACE` | danger — rose | armed; you are overwriting |
| `VISUAL` | accent — purple | |
| `V-LINE` | secondary — violet | |
| `V-BLOCK` | type — light sky | |
| Helix `NORMAL` / `SELECT` | amber / orange | |

The hues named here are the core family's. The mapping is role-to-mode, not
colour-to-mode, so a variant that reassigns roles keeps the same eight chips in
its own palette — Hyperjet's `NORMAL` is gold and its Helix `NORMAL` orange,
still eight mutually distinct lamps with computed labels.

### 4. A terminal with 24 distinct colours

`dim`, `normal` and `bright` are separable on every hue by a colour difference of
at least **dE 8**, checked in CI. For reference, Zed's own One Light ships
`terminal.ansi.black` and `terminal.ansi.bright_black` as the same value,
`#000000` — a doubled ANSI colour is the first thing terminal-resident users
notice, and most thin palettes have several.

---

## The palette

The swatch is locked. Seven hues are added — all from the same Tailwind ramp the
swatch itself comes from — because the schema *requires* `error`, `warning`,
`success`, `created`, `deleted`, `modified`, `conflict` and 24 ANSI slots, and a
git diff where additions and deletions are both violet is unusable.

Contrast is against each variant's own editor ground. Hyperjet reassigns
several of these roles and has its own table under
[Special variants](#special-variants).

| Role | Afterburner | | Stealth | | Contrail | |
|---|---|---|---|---|---|---|
| Background | `#0B0F14` | — | `#000000` | — | `#F8FAFC` | — |
| Surface | `#111827` | | `#07090C` | | `#F1F5F9` | |
| Panel | `#1F2937` | | `#0E1218` | | `#E2E8F0` | |
| Muted (never text) | `#2D3748` | | `#2D3748` | | `#CBD5E1` | |
| Text | `#F8FAFC` | 18.37 | `#CDD1D6` | 13.69 | `#0F172A` | 17.06 |
| Comment | `#728299` | 4.91 | `#697A92` | 4.80 | `#59687C` | 5.43 |
| Primary — functions | `#38BDF8` | 8.97 | `#38BDF8` | 9.80 | `#06638D` | 6.32 |
| Secondary — fields only | `#7C3AED` | 3.37 | `#7C3AED` | 3.69 | `#4C10B2` | 9.92 |
| Accent — keywords | `#A855F7` | 4.86 | `#A855F7` | 5.31 | `#730AD6` | 7.32 |
| Type / operator | `#7DD3FC` | 11.53 | `#7DD3FC` | 12.60 | `#044768` | 9.53 |
| String | `#6EE7B7` | 12.61 | `#6EE7B7` | 13.78 | `#0E5439` | 8.56 |
| Number / constant | `#FDBA74` | 11.40 | `#FDBA74` | 12.45 | `#854606` | 6.98 |
| Success / created | `#34D399` | 10.00 | `#34D399` | 10.92 | `#186D4E` | 6.02 |
| Warning / modified | `#FBBF24` | 11.51 | `#FBBF24` | 12.58 | `#825F05` | 5.59 |
| Danger / deleted | `#FB7185` | 7.14 | `#FB7185` | 7.80 | `#BA0822` | 6.38 |

**`#7C3AED` never carries text.** At 3.37:1 it fails AA as a foreground, so it is
a *field* colour only — selection fills, focused borders, search-match
backgrounds, the second collaborator. It keeps full strength; it is simply not
asked to do a job it physically cannot.

### Contrail is derived, not hand-picked

The swatch supplies no light values. Each light hue holds its dark counterpart's
hue angle exactly and solves for the lightness that hits a target contrast
against the darkest surface it is drawn on.

Hue drift comes out at **≤ 1.10°** across all ten hues. Choosing Tailwind ramp
steps by hand — the obvious approach, and the one the design brief used — drifts
up to **17.3°**, because Tailwind's warm ramps rotate toward red as they darken.

The targets are deliberately *not* uniform. In the dark build `type` (sky-300) is
brighter than `primary` (sky-400), and `string` is brighter than `success`. On a
light ground the equivalent of "more prominent" is darker, so those roles get
higher targets. Solving every hue to one floor collapses each sibling pair onto
the same lightness and makes them indistinguishable.

---

## Special variants

The three above are the core family: one locked swatch, one set of role
assignments, three grounds. A **special variant** is held to every gate they are
— coverage, contrast, separability, provenance — but is allowed the one liberty
they are not: it may reassign which hue plays which role.

That is a large enough departure to live in its own section of
[`src/palette.mjs`](src/palette.mjs) rather than at the end of the list, so
*which build is allowed to move the palette around* is answered by where the
code sits.

### Hyperjet — reheat

A warm dark build for the hours the light variant is wrong for and the OLED one
is too austere for: the same cockpit, lit by the burner rather than by daylight.

**The ground is the exhaust.** Contrail's ground is the swatch's own text colour
reused; Hyperjet's whole neutral ramp is `#FDBA74`'s hue angle held exactly, with
saturation and lightness then set per plane. Every plane lands within **1.7°** of
that one angle, and the residue is 8-bit rounding rather than drift.

The obvious alternative — mix a warm tint into the cool `#0B0F14` ramp — does not
work, twice over. Mixing toward a lighter colour only runs the plane *lighter*,
so a 5.5%-lightness ground is not reachable from a 6.1% one at any weight. And
the two hues are near-complementary, so the weights subtle enough to still read
as a neutral cancel rather than warm: 0.04 to 0.08 of orange-300 into `#0B0F14`
lands at **2–7% saturation** with the hue angle swinging 220° → 300° → 30° as the
weight moves. Setting hue, saturation and lightness independently decouples them
— fix the angle, then place the plane.

**Severity runs down the heat ramp.** Route C adds three hues, from the same
Tailwind ramp as everything else, and with them the family's first true yellow
and first true red:

| Step | Hue | From red | Ships as |
|---|---|---|---|
| nominal | `#FDE047` yellow-300 | 50.4° | `info`, functions, `NORMAL` |
| caution | `#FB923C` orange-400 | 27.0° | `warning`, `modified`, Helix `NORMAL` |
| danger | `#F87171` red-400 | 0.0° | `error`, `deleted`, `REPLACE` |

A status colour's meaning is readable from its hue angle before its label is.
The gate asserts that ordering — and asserts it against the shipped file rather
than against the constant in `src/`, so it is a statement about what installs:

```
Hyperjet heat ramp (gate: hue falls toward red, steps dE 20 apart)
  nominal  #FDE047 -> info       50.4 deg from red
  caution  #FB923C -> warning    27.0 deg from red
  danger   #F87171 -> error       0.0 deg from red
```

**The palette against the reference build.** Contrast is against each build's own
editor ground:

| Role | Afterburner | | Hyperjet | |
|---|---|---|---|---|
| Background | `#0B0F14` | — | `#110E0B` | — |
| Surface | `#111827` | | `#1B1611` | |
| Panel | `#1F2937` | | `#29231C` | |
| Muted (never text) | `#2D3748` | | `#3F362C` | |
| Text | `#F8FAFC` | 18.37 | `#F7F2ED` | 17.30 |
| Comment | `#728299` | 4.91 | `#9C8D7C` | 5.97 |
| Primary — functions | `#38BDF8` | 8.97 | `#FDE047` | 14.59 |
| Secondary — fields only | `#7C3AED` | 3.37 | `#7C3AED` | 3.38 |
| Accent — keywords | `#A855F7` | 4.86 | `#A855F7` | 4.86 |
| Type / operator | `#7DD3FC` | 11.53 | `#7DD3FC` | 11.54 |
| String | `#6EE7B7` | 12.61 | `#6EE7B7` | 12.62 |
| Number / constant | `#FDBA74` | 11.40 | `#FDBA74` | 11.41 |
| Success / created | `#34D399` | 10.00 | `#34D399` | 10.01 |
| Warning / modified | `#FBBF24` | 11.51 | `#FB923C` | 8.50 |
| Danger / deleted | `#FB7185` | 7.14 | `#F87171` | 6.96 |

Four chromatic roles move — `primary`, `warning`, `danger` and the comment grey
— and the neutral ramp with them. The rest hold: keywords are still purple, types
still sky, strings still emerald, and `#7C3AED` is still a field colour that
never carries text, 3.38:1 here and as unusable for a foreground as it is
everywhere else. The family still reads as the family.

### Three things the gates decided, not taste

**Keywords wanted to be red, and cannot be.** A hot red keyword is the obvious
move for a reheat variant. But `accent` also lights the `VISUAL` chip and
`danger` lights `REPLACE`, and rose-400 against red-400 is **dE 10.5** — under
the 12 the gate requires between any two mode lamps. The warm band holds about
three well-separated roles, and the status trio already has them. Keywords stayed
purple because the gate said so, not because it was the safe choice.

**`warning` is orange rather than amber.** Amber-400 — the core family's
`caution` — sits **dE 17.4** from the gold, under the **20** the gate requires
between any two version-control states: `modified` and `renamed` would have been
too close to tell apart in the git panel. Moving `caution` one step along the
ramp to orange-400 puts them dE 45.6 apart.

**`danger` is red-400 rather than red-500.** Red-500 is the truer red and it
misses: **4.13:1** on the elevated surface, under the 4.5 body floor, because
diagnostics are drawn on panels as well as in the buffer. Red-400 clears it at
5.62:1. (Red-500 misses the same check on Afterburner's panel too, at 3.90:1 —
the elevated surface is where reds get caught, and it is the one contrast tables
usually leave out.)

### The terminal does not follow the rotation

ANSI is a compatibility surface, not a design surface. A theme that ships a gold
`terminal.ansi.blue` because gold happens to be its primary breaks every program
that colours its own output, and the breakage looks like the program's fault.

So Hyperjet supplies its own ANSI hue map, and only the two slots whose hues
actually changed move — `red` to the new red, `yellow` to the gold. `blue` goes
back to the locked `#38BDF8`, and `green`, `magenta` and `cyan` are byte-for-byte
what Afterburner ships. All 24 values stay distinct, and `dim`/`normal`/`bright`
stay dE 8 apart on every hue, checked as they are everywhere else.

---

## Contrast gate

`npm run check:contrast` — **387 measurements per variant, 0 below floor.**

| Variant | Measurements | Body-tier minimum | Below floor |
|---|---|---|---|
| Afterburner | 387 | 4.55:1 | 0 |
| Stealth | 387 | 4.66:1 | 0 |
| Contrail | 387 | 4.75:1 | 0 |
| Hyperjet | 387 | 4.59:1 | 0 |

Three things about this gate are not standard practice, and are the reason the
numbers can be trusted.

**Alpha is composited before measuring.** Most of this theme's UI colours are
translucent. Checking a token against its nominal hex rather than the pixel it
actually produces is the commonest way an "accessible" theme is quietly wrong.

**Every token is scored against the worst surface it is really drawn on** —
including the active-line band. The active line is lighter than the editor
ground, so contrast is *tightest* there, and it is the surface that contrast
tables normally omit. It is where the tightest measurement in this theme sits.

**Nothing is unchecked.** Tokens meant to recede are not exempted; they are held
to a lower, named floor. A gate with a blanket 4.5 and a silent exemption list is
theatre.

| Tier | Floor | What is in it |
|---|---|---|
| `body` | 4.5:1 | syntax, body text, diagnostics, terminal — anything read to do the work |
| `ui` | 3.0:1 | ghost text, line numbers, invisibles, dim ANSI |
| `deemphasis` | 1.9:1 | disabled states, which must read as unavailable |
| `pole` | 1.1:1 | the ANSI ramp end that matches the ground |

That last tier is honest rather than convenient: ANSI black on a dark terminal
(and white on a light one) approaches the background by definition — a readable
"black" on a black terminal would not be black. Contrast is the wrong measure for
it, so **separability** is enforced instead, as a dE ≥ 8 check between its three
steps in `scripts/key-coverage.mjs`.

The gate ships with a self-test. `npm run check:contrast-self-test` points
`syntax.keyword` at `#7C3AED` and requires the gate to reject it:

```
self-test PASS — gate rejects syntax.keyword at #7C3AED (3.37:1)
```

---

## OLED drive-cost model

`npm run check:power`. This is a **model, not a measurement**, and it is
published as one so it can be argued with. Weights r 0.24 / g 0.28 / b 0.48,
γ 2.2, normalised so a full-screen white is 1.00.

Blue emitters need more drive current per unit of perceived luminance than green
or red — which makes a cyan-and-violet palette the *expensive* end of OLED:

| Colour | Relative drive cost |
|---|---|
| `#0B0F14` background | 0.003 |
| `#1F2937` panel | 0.024 |
| `#7C3AED` secondary | 0.469 |
| `#A855F7` accent | 0.568 |
| `#38BDF8` primary | **0.605** |
| `#F8FAFC` text | 0.961 |

**And the background is not the lever.** Going from `#0B0F14` to true black buys
about 2%. The saving is in the *text*, because power on OLED is pixel population
× luminance: at 88% of the screen the background is roughly 3% of the draw, while
neutral foreground text at 5% of the screen is the majority of it.

So Stealth is not Afterburner with a black background:

1. `editor.background` is exactly `#000000` — fully-off pixels are the only free ones.
2. Body text steps down to `#CDD1D6`, still 13.69:1 against black.
3. Punctuation, line numbers and comments move to the cheap neutral ramp. Bright
   chroma is reserved for tokens that appear dozens of times a screen, not thousands.
4. No large filled accent surfaces. Every translucent fill is scaled down, which
   also limits differential ageing from static chrome on QD-OLED.

| Variant | Composite | vs Afterburner |
|---|---|---|
| Afterburner | 0.0654 | 1.00× |
| **Stealth** | 0.0465 | **0.71×** |
| Contrail | 0.8874 | 13.6× |
| Hyperjet | 0.0595 | 0.91× |

The ratio is **0.711× under all three weightings tested** — blue-penalised, mild
penalty, and equal weights. That insensitivity is the point: when a parameter is
modelled rather than measured, the claim worth publishing is the one that does
not depend on it.

**Contrail is not a power saving and this README will not pretend otherwise.** It
exists for daylight legibility.

**Hyperjet is not sold as a power variant either, but the model has an opinion
about it.** The same argument that makes a cyan-and-violet palette the expensive
end of OLED makes a warm one cheap: rotating the palette off blue comes in at
**0.91×** the reference build without trying to, and at 0.91–0.94× across all
three weightings. It is still not Stealth — the ground is lit pixels, and the
ground is where Stealth wins.

---

## Departures from the design brief

Two, both consequences of the gate the brief itself asked for.

**Comments are not `#64748B` exactly.** The brief picks slate-500, noting it
measures 4.04:1. That is under the 4.5:1 its own definition of done requires of
every syntax token, and under the standard its kill criteria names as the one
thing worse than not shipping. The hue and saturation are kept; only lightness
moves, by dE 5.5 on the reference build. `#728299` is slate-500's hue at the
lightness that clears the floor.

**The active tab takes the editor ground, not the elevated panel colour.** The
brief's role table assigns `#1F2937` to `tab.active_background`. Every bundled
Zed theme uses the editor background there, so the active tab opens into the
buffer rather than floating above it.

One finding worth recording: the brief's contrast work never accounts for the
**active-line band**. `#A855F7` measures 4.86:1 on the editor ground — passing —
but only 4.06:1 on the active line as originally specified. Since keywords sit on
the active line constantly, the band's opacity was solved backwards from the
keyword floor instead.

---

## The site

<https://chrisnicholson30.github.io/Jet-Fighter-Theme/>

Generated from `themes/jet-fighter.json` rather than authored alongside it.
Every colour on the page is a CSS custom property lifted from the shipped
theme, so the site cannot show a colour the theme does not contain — and
switching variant repaints the entire document, not a preview pane. You browse
the site *in* the theme.

The code samples are highlighted by a tokeniser that emits **Zed capture
names**, resolved through Zed's own longest-dotted-prefix rule
(`site/src/highlight.mjs`). A theme site normally colours its samples with
whatever highlighter the site happens to use, which means the screenshots show
a different highlighter wearing the theme's colours. Here, if a capture falls
back on the page, it falls back in the editor too.

```sh
npm run site:build    # regenerate site/dist
npm run site:serve    # build and open locally
npm run site:assets   # re-derive the logo, icons and social card (needs Playwright)
```

The mark is the supplied artwork, vendored at
`site/assets/brand/mark-source.jpg`. Everything the site shows is derived from
it by `site/generate-assets.mjs`, which locates the ring by luminance and
centres a square crop on it — so re-exporting the source at a different size
does not silently shift the framing. Tab-sized icons take a tighter 72% crop,
because at 16px the full badge loses the aircraft and only a framed-in delta
and its plumes survive.

Deployment is `.github/workflows/pages.yml`, which rebuilds on any push to
`main` that touches the theme or the site, and fails first if the committed
theme has drifted from `src/`. It enables Pages itself on the first run
(`configure-pages` with `enablement: true`), so there is nothing to switch on
in Settings.

---

## Building

Zero dependencies. Node 18+.

```sh
npm run build     # regenerate themes/jet-fighter.json from src/
npm test          # all six gates
```

| Path | |
|---|---|
| `src/color.mjs` | colour engine — compositing, WCAG, CIE Lab, hue-preserving solvers |
| `src/palette.mjs` | the locked swatch, Routes B and C, and the four variant palettes |
| `src/style.mjs` | one function mapping a palette to all 185 keys |
| `src/syntax.mjs` | the 134 syntax tokens |
| `src/build.mjs` | emits the family file; `--check` fails on drift |
| `scripts/` | the gates, each runnable on its own |
| `assets/proof/` | ten-file proof corpus across eight languages, Markdown and a diff |

All four variants run through a **single code path**, which is what stops them
drifting apart: a key populated for one is populated for all of them, and a
`null` is impossible by construction. A special variant reassigns roles by
handing that code path a different palette — never by forking it.

`themes/jet-fighter.json` is generated and committed. `npm run check:build` fails
if it has been hand-edited, so the shipped file cannot silently diverge from its
source.

---

## Licence

[MIT](LICENSE) © Christopher Nicholson, CN-DESIGN LTD (SC885094)
