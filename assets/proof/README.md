# Proof corpus

Ten files that between them exercise every token class the theme defines.
They exist so defects turn up in languages the author does not use daily —
Zed's Rust and Go users will find them otherwise.

| File | What it is there to catch |
|---|---|
| `sample.ts` | decorators vs calls, generics vs comparisons, template literals, regex |
| `sample.rs` | lifetimes vs strings, attributes, macro invocations, match arms |
| `sample.py` | decorators, f-string interpolation, dunder methods, type hints |
| `sample.go` | struct tags, interface methods, error wrapping, raw strings |
| `sample.json` | keys vs string values — the commonest collision in a thin palette |
| `sample.sh` | expansion inside strings, heredocs, test brackets |
| `sample.md` | markup emphasis, list markers, block quotes, fenced code |
| `sample.diff` | added / deleted / hunk header in three separate hues |
| `sample.css` | selectors vs properties vs values, at-rules |
| `sample.html` | tags vs attributes vs text |

Open each in all four variants. Nothing adjacent should read as the same
colour, and the diff should show additions, deletions and the hunk header in
three clearly different hues.
