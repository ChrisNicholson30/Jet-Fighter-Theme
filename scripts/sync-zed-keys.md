# Regenerating `data/zed-keys.json`

The key inventory is extracted from the Zed source, not from One Dark. One Dark
populates 139 of the 185 UI keys the schema accepts, so diffing a theme against
it — the obvious coverage check — silently passes a theme that leaves the vim
mode indicators, the minimap, indent guides, diff hunks and the debugger accent
unset.

Zed publishes the schema at `https://zed.dev/schema/themes/v0.2.0.json`, but the
generated schema does not carry the deprecation markers, so the Rust source is
the better origin.

```sh
git clone --depth 1 https://github.com/zed-industries/zed /tmp/zed
cd /tmp/zed

# UI keys: ThemeColorsContent + StatusColorsContent
grep -oE 'rename = "[^"]+"' crates/settings_content/src/theme.rs \
  | sed 's/rename = "//; s/"$//' | sort -u

# Which of those are deprecated (these must NOT be emitted)
grep -n -B4 'deprecated' crates/settings_content/src/theme.rs

# Syntax capture names the shipped grammars actually emit
find . -name highlights.scm -not -path './.git/*' -exec cat {} \; \
  | grep -oE '@[a-z][a-zA-Z0-9_.]*' | sed 's/@//' | sort -u
```

Record the revision you extracted from in `source.revision` so the inventory can
be audited later. Then re-run `npm test`; `scripts/key-coverage.mjs` fails on any
key in the inventory the theme does not populate, and on any key the theme emits
that the inventory does not contain.

Two behaviours worth knowing when reading the source:

- **Highlight lookup falls back by longest dotted prefix**
  (`crates/syntax_theme/src/syntax_theme.rs`). `keyword.control` resolves to
  `keyword` if undefined, `function.method.call` to `function.method` and then
  `function`. Defining a sub-capture is therefore always additive resolution,
  never a break.
- **A syntax entry supports four fields**, not three: `color`,
  `background_color`, `font_style` (`normal` / `italic` / `oblique`) and
  `font_weight` (a number). The bundled themes only ever use three.
